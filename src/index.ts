import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, verifyPassword, passwordIssue } from './lib/password';
import { sanitizeRich, escapeHtml, stripTags } from './lib/sanitize';
import { renderLandingPage } from './web/landing';
import { renderLoginPage } from './web/login';
import { renderFeedPage } from './web/feed';
import { renderProfilePage } from './web/profile';
import { renderNotificationsPage } from './web/notifications';
import { sendOtpEmail } from './mail';
import { OG_IMAGE_BASE64 } from './assets';

export interface Env {
  DB: D1Database;
  APP_NAME: string;
  APP_DOMAIN: string;
  JWT_SECRET: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

// Helper verifikasi Cloudflare Turnstile token
async function verifyTurnstile(token: string, secretKey: string, remoteIp?: string): Promise<boolean> {
  // Fail-CLOSED: secret wajib terpasang di produksi. Kalau hilang → tolak + log,
  // jangan pernah diam-diam meloloskan semua orang (temuan vuln-0002 Strix).
  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY belum diset — verifikasi Turnstile DITOLAK (fail-closed).');
    return false;
  }
  if (!token) return false;
  try {
    const formData = new FormData();
    formData.append('secret', secretKey.trim());
    formData.append('response', token.trim());
    if (remoteIp) formData.append('remoteip', remoteIp);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData
    });
    const data: any = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return false;
  }
}

// ---- RATE LIMITING (D1) ----
// Batas per-key (IP atau email) per jendela waktu, disimpan di D1 supaya berlaku
// global lintas-datacenter (temuan vuln-0004 & 0005 Strix). Sebelumnya pakai
// edge cache yang per-POP sehingga mudah dilewati.
// ponytail: satu UPSERT per percobaan; cukup untuk skala ini. Naikkan ke Durable
// Object kalau nanti butuh presisi/throughput jauh lebih tinggi.
async function hitRate(db: D1Database, key: string, limit: number, windowSec: number): Promise<boolean> {
  const row: any = await db.prepare(
    `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, datetime('now', '+' || ? || ' seconds'))
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN rate_limits.expires_at < datetime('now') THEN 1 ELSE rate_limits.count + 1 END,
       expires_at = CASE WHEN rate_limits.expires_at < datetime('now') THEN datetime('now', '+' || ? || ' seconds') ELSE rate_limits.expires_at END
     RETURNING count`
  ).bind(key, windowSec, windowSec).first();
  return ((row && row.count) || 0) > limit;
}

// Gate auth: Turnstile WAJIB (fail-closed). Token kosong/gagal = ditolak, sehingga
// desain fail-open lama (vuln-0002) tertutup. Rate limit per-IP sebagai lapisan kedua.
async function requireHuman(c: any, token: string, bucket: string, limit: number, windowSec: number): Promise<string | null> {
  const secret = c.env.TURNSTILE_SECRET_KEY || '';
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY belum diset — auth DITOLAK (fail-closed).');
    return 'Layanan verifikasi keamanan sedang tidak tersedia. Coba beberapa saat lagi.';
  }
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  if (!(await verifyTurnstile(token, secret, ip))) {
    return 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan muat ulang halaman.';
  }
  if (await hitRate(c.env.DB, `rl:${bucket}:${ip}`, limit, windowSec)) {
    return 'Terlalu banyak percobaan dari jaringan ini. Coba lagi beberapa menit lagi.';
  }
  return null;
}

const app = new Hono<{ Bindings: Env }>();

// CORS dikunci ke domain sendiri (sebelumnya `*` = siapa pun bisa memanggil API
// dengan kredensial; bagian dari temuan vuln-0009). Tanpa origin (same-origin
// fetch dari browser tidak mengirim Origin) → tanpa header CORS, tetap aman.
const ALLOWED_ORIGINS = ['https://berbirru.com', 'https://www.berbirru.com'];
app.use('*', cors({
  origin: (origin: string) => (ALLOWED_ORIGINS.includes(origin) ? origin : null),
  credentials: true,
}));

// Proteksi CSRF server-side (temuan vuln-0009). Catatan: `csrf()` bawaan Hono HANYA
// memeriksa content-type form (x-www-form-urlencoded|multipart|text/plain), sehingga
// API JSON kita lolos begitu saja (sudah diuji). Jadi kita periksa Origin sendiri
// untuk semua metode yang mengubah state. Wajib dipasang SEBELUM semua route —
// Hono hanya menjalankan middleware yang terdaftar lebih dulu.
app.use('*', async (c, next) => {
  const method = c.req.method.toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const origin = c.req.header('origin');
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return c.json({ error: 'Permintaan dari situs lain ditolak.' }, 403);
    }
  }
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// ---- AUTH HELPERS ----
async function getAuthUser(c: any): Promise<{ id: string; email: string; pen_name: string; city: string; bio: string } | null> {
  const token = getCookie(c, 'berbirru_session');
  if (!token) return null;
  const session: any = await c.env.DB.prepare(
    'SELECT u.id, u.email, u.pen_name, u.city, u.bio FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now") LIMIT 1'
  ).bind(token).first();
  return session || null;
}

// ---- WEB PAGES (SSR) ----
app.get('/', async (c) => {
  const user = await getAuthUser(c);
  return c.html(renderLandingPage(user));
});

app.get('/login', async (c) => {
  const user = await getAuthUser(c);
  if (user) return c.redirect('/feed');
  return c.html(renderLoginPage(c.env.TURNSTILE_SITE_KEY || ''));
});

app.get('/feed', async (c) => {
  const user = await getAuthUser(c);
  return c.html(renderFeedPage(user));
});

app.get('/u/:pen_name', async (c) => {
  const penNameParam = c.req.param('pen_name');
  const user = await getAuthUser(c);

  if (penNameParam === 'saya') {
    if (!user) return c.redirect('/login');
    return c.redirect('/u/' + user.pen_name);
  }

  const targetPenName = penNameParam.replace(/^@/, '').toLowerCase();
  const isMe = Boolean(user && user.pen_name.toLowerCase() === targetPenName);
  return c.html(renderProfilePage(targetPenName, isMe, user));
});

// ---- SEO & CRAWLER ENDPOINTS ----
app.get('/favicon.ico', (c) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#1D61E7" stroke="#0B192C" stroke-width="2"/>
    <path d="M22 17V11a2 2 0 0 0-1-1.73l-5-2.88a2 2 0 0 0-2 0l-5 2.88A2 2 0 0 0 8 11v6a2 2 0 0 0 1 1.73l5 2.88a2 2 0 0 0 2 0l5-2.88A2 2 0 0 0 22 17z" stroke="#FFFFFF" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  return c.text(svg, 200, { 'Content-Type': 'image/svg+xml' });
});

app.get('/og-image.jpg', (c) => {
  const binary = Uint8Array.from(atob(OG_IMAGE_BASE64), (c) => c.charCodeAt(0));
  return new Response(binary, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': binary.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

app.get('/og-image.png', (c) => {
  const binary = Uint8Array.from(atob(OG_IMAGE_BASE64), (c) => c.charCodeAt(0));
  return new Response(binary, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Content-Length': binary.length.toString(),
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

app.get('/robots.txt', (c) => {
  const robots = `User-agent: *
Allow: /
Allow: /feed
Allow: /u/
Disallow: /api/

Sitemap: https://${c.env.APP_DOMAIN || 'berbirru.com'}/sitemap.xml`;
  return c.text(robots, 200, { 'Content-Type': 'text/plain' });
});

app.get('/sitemap.xml', async (c) => {
  const domain = c.env.APP_DOMAIN || 'berbirru.com';
  const users = await c.env.DB.prepare('SELECT pen_name FROM users LIMIT 100').all();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://${domain}/feed</loc>
    <changefreq>always</changefreq>
    <priority>0.9</priority>
  </url>
  ${(users.results || []).map((u: any) => `
  <url>
    <loc>https://${domain}/u/${encodeURIComponent(u.pen_name)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;
  return c.text(xml, 200, { 'Content-Type': 'application/xml' });
});

// ---- AUTH API ----
app.get('/api/auth/me', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ user: null });
  return c.json({ user });
});

app.post('/api/auth/register', async (c) => {
  const { email, password, pen_name, city, turnstile_token } = await c.req.json().catch(() => ({}));
  if (!email || !password || !pen_name) {
    return c.json({ error: 'Email, kata sandi, dan nama pena wajib diisi.' }, 400);
  }

  // Verifikasi Turnstile (fail-closed — wajib lolos sebelum boleh daftar)
  const humanErr = await requireHuman(c, turnstile_token || '', 'register', 10, 600);
  if (humanErr) return c.json({ error: humanErr }, 403);

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPenName = String(pen_name).replace(/^@/, '').trim().toLowerCase();

  if (!/^[a-z0-9._-]+$/.test(cleanPenName)) {
    return c.json({ error: 'Nama pena hanya boleh huruf kecil, angka, titik, underscore, dan strip.' }, 400);
  }

  // Kebijakan kekuatan kata sandi (temuan vuln-0007)
  const pwdErr = passwordIssue(password, cleanEmail, cleanPenName);
  if (pwdErr) return c.json({ error: pwdErr }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? OR pen_name = ? LIMIT 1').bind(cleanEmail, cleanPenName).first();
  if (existing) {
    return c.json({ error: 'Email atau Nama Pena sudah digunakan oleh penulis lain.' }, 400);
  }

  const userId = crypto.randomUUID();
  const pwdHash = await hashPassword(password);
  await c.env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, pen_name, city, bio) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(userId, cleanEmail, pwdHash, cleanPenName, city ? String(city).trim() : 'Nusantara', 'Goresan perenungan rasa dan bait kata.').run();

  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))'
  ).bind(crypto.randomUUID(), userId, token).run();

  setCookie(c, 'berbirru_session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true, user: { id: userId, pen_name: cleanPenName } }, 201);
});

app.post('/api/auth/login', async (c) => {
  const { email, password, turnstile_token } = await c.req.json().catch(() => ({}));
  if (!email || !password) return c.json({ error: 'Email dan kata sandi wajib diisi.' }, 400);

  // Turnstile wajib (fail-closed). Rate limit per-IP di dalam requireHuman.
  const humanErr = await requireHuman(c, turnstile_token || '', 'login', 10, 300);
  if (humanErr) return c.json({ error: humanErr }, 403);

  const cleanEmail = String(email).trim().toLowerCase();

  // Lockout per-email (temuan vuln-0004): dibatasi juga per akun, bukan cuma per IP,
  // supaya credential stuffing dari banyak IP tetap ketahan.
  if (await hitRate(c.env.DB, `pw:${cleanEmail}`, 5, 900)) {
    return c.json({ error: 'Terlalu banyak percobaan masuk untuk akun ini. Coba lagi nanti.' }, 429);
  }

  const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  // Pesan seragam untuk email tak terdaftar & sandi salah → cegah enumerasi (vuln-0003).
  const BAD_CRED = { error: 'Email atau kata sandi tidak sesuai.' };

  if (!user) return c.json(BAD_CRED, 401);

  const check = await verifyPassword(password, user.password_hash);
  if (!check.ok) {
    return c.json(BAD_CRED, 401);
  }

  // Migrasi transparan: hash lama (SHA-256 + salt statis) di-upgrade ke PBKDF2 saat login.
  if (check.needsRehash) {
    const upgraded = await hashPassword(password);
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(upgraded, user.id).run();
  }

  // Batas jumlah sesi paralel per akun (temuan vuln-0006): simpan 5 sesi terbaru saja.
  await c.env.DB.prepare(
    `DELETE FROM sessions WHERE user_id = ? AND token NOT LIKE 'otp_%' AND id NOT IN (
       SELECT id FROM sessions WHERE user_id = ? AND token NOT LIKE 'otp_%' ORDER BY created_at DESC LIMIT 4
     )`
  ).bind(user.id, user.id).run();

  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))'
  ).bind(crypto.randomUUID(), user.id, token).run();

  setCookie(c, 'berbirru_session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true, user: { id: user.id, pen_name: user.pen_name } });
});

// ---- OTP AUTH API (EMAIL TERDAFTAR ONLY) ----
app.post('/api/auth/send-otp', async (c) => {
  const { email, turnstile_token } = await c.req.json().catch(() => ({}));
  if (!email) return c.json({ error: 'Email wajib diisi' }, 400);

  // Turnstile wajib (fail-closed) + rate limit per-IP.
  const humanErr = await requireHuman(c, turnstile_token || '', 'otp', 5, 600);
  if (humanErr) return c.json({ error: humanErr }, 403);

  const cleanEmail = String(email).trim().toLowerCase();

  // Batas pengiriman OTP per email (vuln-0005) — cegah flooding ke satu korban.
  if (await hitRate(c.env.DB, `otp:${cleanEmail}`, 5, 900)) {
    return c.json({ error: 'Terlalu banyak permintaan kode untuk email ini. Coba lagi nanti.' }, 429);
  }

  // Pesan SERAGAM: terdaftar atau tidak, jawabannya sama → cegah enumerasi email (vuln-0003).
  const UNIFORM = { message: 'Jika email terdaftar, kode OTP sudah dikirim. Cek kotak masuk (dan folder spam) Anda.', success: true };

  const user: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  // Email tak terdaftar: balas pesan yang sama, jangan kirim email, jangan simpan OTP.
  if (!user) return c.json(UNIFORM);

  // OTP acak kriptografis (Math.random bisa diprediksi).
  const otpCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');

  // Hapus OTP lama user ini — hanya kode terbaru yang berlaku.
  await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token LIKE 'otp_%'").bind(user.id).run();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+10 minutes"))'
  ).bind(crypto.randomUUID(), user.id, `otp_${otpCode}`).run();

  const apiKey = String(c.env.RESEND_API_KEY || '').trim();
  const fromEmail = c.env.RESEND_FROM || 'BERBIRRU.COM <noreply@berbirru.com>';

  if (!apiKey) {
    return c.json({ error: 'Konfigurasi RESEND_API_KEY belum terpasang di server.' }, 500);
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head><meta charset="UTF-8"><title>Kode OTP</title></head>
    <body style="margin:0;padding:24px;background:#F0F6FE;font-family:sans-serif;">
      <div style="max-width:440px;margin:0 auto;background:#FFF;border:3px solid #0B192C;border-radius:14px;padding:24px;box-shadow:4px 4px 0 #0B192C;">
        <h2 style="color:#1D61E7;margin-top:0;">BERBIRRU.COM</h2>
        <p style="font-size:14px;color:#334155;">Gunakan 6 digit kode OTP di bawah ini untuk masuk ke akun Anda:</p>
        <div style="background:#FDE047;border:2.5px solid #0B192C;border-radius:10px;padding:12px;text-align:center;font-size:28px;font-weight:900;letter-spacing:6px;margin:18px 0;color:#0B192C;">
          \${otpCode}
        </div>
        <p style="font-size:12px;color:#64748B;margin-bottom:0;">⏱ Kode aktif selama 10 menit. Jangan berikan kepada siapa pun.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [cleanEmail],
        subject: `Kode Masuk OTP: ${otpCode} — BERBIRRU.COM`,
        html: `
          <div style="max-width:440px;margin:0 auto;background:#FFF;border:3px solid #0B192C;border-radius:14px;padding:24px;box-shadow:4px 4px 0 #0B192C;font-family:sans-serif;">
            <h2 style="color:#1D61E7;margin-top:0;">BERBIRRU.COM</h2>
            <p style="font-size:14px;color:#334155;">Gunakan 6 digit kode OTP di bawah ini untuk masuk ke akun Anda:</p>
            <div style="background:#FDE047;border:2.5px solid #0B192C;border-radius:10px;padding:12px;text-align:center;font-size:32px;font-weight:900;letter-spacing:6px;margin:18px 0;color:#0B192C;">
              ${otpCode}
            </div>
            <p style="font-size:12px;color:#64748B;margin-bottom:0;">⏱ Kode aktif selama 10 menit. Jangan berikan kepada siapa pun.</p>
          </div>
        `
      })
    });

    if (!resendRes.ok) {
      const errTxt = await resendRes.text();
      console.error('Resend API Error:', errTxt);
      return c.json({ error: 'Gagal mengirim kode OTP saat ini. Coba lagi beberapa saat lagi.' }, 502);
    }
  } catch (err: any) {
    console.error('OTP fetch error:', err?.message);
    return c.json({ error: 'Gagal mengirim kode OTP saat ini. Coba lagi beberapa saat lagi.' }, 502);
  }

  return c.json(UNIFORM);
});

app.post('/api/auth/verify-otp', async (c) => {
  const { email, otp } = await c.req.json().catch(() => ({}));
  if (!email || !otp) return c.json({ error: 'Email dan Kode OTP wajib diisi' }, 400);
  const cleanEmail = String(email).trim().toLowerCase();
  const ip = c.req.header('cf-connecting-ip') || 'unknown';

  // Anti brute-force OTP (vuln-0005): batas per-IP dan per-akun.
  if (await hitRate(c.env.DB, `votp:ip:${ip}`, 10, 600) || await hitRate(c.env.DB, `votp:${cleanEmail}`, 10, 600)) {
    return c.json({ error: 'Terlalu banyak percobaan kode. Tunggu beberapa menit lalu coba lagi.' }, 429);
  }

  // Pesan seragam untuk email tak terdaftar / kode salah → cegah enumerasi (vuln-0003).
  const BAD_OTP = { error: 'Kode OTP salah atau sudah kedaluwarsa.' };

  const user: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  if (!user) return c.json(BAD_OTP, 400);

  const session: any = await c.env.DB.prepare(
    'SELECT id FROM sessions WHERE user_id = ? AND token = ? AND expires_at > datetime("now") LIMIT 1'
  ).bind(user.id, `otp_${otp.trim()}`).first();

  if (!session) {
    return c.json(BAD_OTP, 400);
  }

  // OTP Valid -> Hapus session OTP sementara, ganti dengan Session Cookie 30 hari
  await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(session.id).run();
  const sessionToken = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))'
  ).bind(crypto.randomUUID(), user.id, sessionToken).run();

  setCookie(c, 'berbirru_session', sessionToken, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true, user: { id: user.id, pen_name: user.pen_name } });
});

app.post('/api/auth/logout', async (c) => {
  const token = getCookie(c, 'berbirru_session');
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  deleteCookie(c, 'berbirru_session');
  return c.json({ ok: true });
});

// ---- PROFILE & USER UPDATE ----
app.patch('/api/users/me', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const { pen_name, city, bio } = await c.req.json().catch(() => ({}));

  let cleanPenName = user.pen_name;
  if (pen_name && pen_name.trim() !== user.pen_name) {
    cleanPenName = String(pen_name).replace(/^@/, '').trim().toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(cleanPenName)) {
      return c.json({ error: 'Nama pena hanya boleh huruf kecil, angka, titik, underscore, dan strip.' }, 400);
    }
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? AND id != ? LIMIT 1').bind(cleanPenName, user.id).first();
    if (existing) return c.json({ error: 'Nama pena sudah digunakan penulis lain.' }, 400);
  }

  // bio & city disimpan apa adanya; semua sink render meng-escape (textContent /
  // escapeHtml) — lihat feed.ts & profile.ts (vuln-0008).
  const cleanCity = city !== undefined ? String(city).trim().slice(0, 60) : user.city;
  const cleanBio = bio !== undefined ? String(bio).trim().slice(0, 300) : user.bio;

  await c.env.DB.prepare(
    'UPDATE users SET pen_name = ?, city = ?, bio = ? WHERE id = ?'
  ).bind(cleanPenName, cleanCity, cleanBio, user.id).run();

  return c.json({ ok: true, user: { id: user.id, pen_name: cleanPenName, city: cleanCity, bio: cleanBio } });
});

app.get('/api/users/:pen_name', async (c) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const user: any = await c.env.DB.prepare('SELECT id, pen_name, city, bio, created_at FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!user) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  const postsCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM posts WHERE author_id = ?').bind(user.id).first('c') || 0;
  const likesCount = await c.env.DB.prepare('SELECT COALESCE(SUM(likes_count), 0) as s FROM posts WHERE author_id = ?').bind(user.id).first('s') || 0;
  const savesCount = await c.env.DB.prepare('SELECT COALESCE(SUM(saves_count), 0) as s FROM posts WHERE author_id = ?').bind(user.id).first('s') || 0;

  return c.json({
    user: {
      ...user,
      posts_count: postsCount,
      likes_count: likesCount,
      saves_count: savesCount
    }
  });
});

app.get('/api/users/:pen_name/posts', async (c) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const tab = c.req.query('tab') || 'original';
  const targetUser: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!targetUser) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  let query = '';
  const binds: any[] = [];

  if (tab === 'likes') {
    query = `
      SELECT p.*, u.pen_name, u.city 
      FROM likes l 
      JOIN posts p ON l.post_id = p.id 
      JOIN users u ON p.author_id = u.id 
      WHERE l.user_id = ? 
      ORDER BY l.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else if (tab === 'saved') {
    query = `
      SELECT p.*, u.pen_name, u.city 
      FROM bookmarks b 
      JOIN posts p ON b.post_id = p.id 
      JOIN users u ON p.author_id = u.id 
      WHERE b.user_id = ? 
      ORDER BY b.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else if (tab === 'chains') {
    query = `
      SELECT p.*, u.pen_name, u.city 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NOT NULL 
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else {
    // tab === 'original'
    query = `
      SELECT p.*, u.pen_name, u.city 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NULL 
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  }

  const posts = await c.env.DB.prepare(query).bind(...binds).all().then((r) => r.results);
  return c.json({ tab, posts });
});

// ---- NOTIFIKASI (SSR) ----
app.get('/notifications', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  return c.html(renderNotificationsPage(user));
});

// ---- POSTS & FEED API ----
app.get('/api/notifications', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const { results } = await c.env.DB.prepare(`
    SELECT n.*, u.pen_name as actor_pen_name, p.title as post_title, p.content as post_content
    FROM notifications n
    JOIN users u ON n.actor_id = u.id
    LEFT JOIN posts p ON n.post_id = p.id
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).bind(user.id).all();

  return c.json({ notifications: results || [] });
});

app.get('/api/notifications/unread-count', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ count: 0 });

  const row = await c.env.DB.prepare('SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').bind(user.id).first();
  return c.json({ count: row ? (row as any).count : 0 });
});

app.post('/api/notifications/read-all', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').bind(user.id).run();
  return c.json({ ok: true });
});

app.post('/api/notifications/:id/read', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').bind(c.req.param('id'), user.id).run();
  return c.json({ ok: true });
});
app.get('/api/posts', async (c) => {
  const mode = c.req.query('mode') || 'viral';
  const q = (c.req.query('q') || '').trim();
  const user = await getAuthUser(c);

  let query = `
    SELECT p.*, u.pen_name, u.city,
      (SELECT content FROM posts prnt WHERE prnt.id = p.parent_id) as parent_content,
      (SELECT u2.pen_name FROM posts prnt JOIN users u2 ON prnt.author_id = u2.id WHERE prnt.id = p.parent_id) as parent_author
    FROM posts p
    JOIN users u ON p.author_id = u.id
  `;
  const binds: any[] = [];

  if (q) {
    query += ` WHERE p.content LIKE ? OR u.pen_name LIKE ? ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(`%${q}%`, `%${q}%`);
  } else if (mode === 'following') {
    if (!user) return c.json({ mode, posts: [], message: 'Silakan masuk untuk melihat warkah penulis yang Anda ikuti.' });
    query += ` JOIN follows f ON p.author_id = f.following_id WHERE f.follower_id = ? ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(user.id);
  } else if (mode === 'latest') {
    query += ` ORDER BY p.created_at DESC LIMIT 40`;
  } else {
    // Mode 'viral' (Freshness Discovery Boost + Gravity Decay)
    // Postingan baru (< 1 jam) dapat initial boost agar muncul di atas untuk mendapat pembaca awal
    query += `
      ORDER BY (
        ((p.likes_count * 2.0) + (p.saves_count * 4.0) + (p.chains_count * 5.0) + 
         (CASE WHEN (julianday('now') - julianday(p.created_at)) * 24.0 < 1.0 THEN 6.0 ELSE 1.0 END)) /
        (((julianday('now') - julianday(p.created_at)) * 24.0) + 1.5)
      ) DESC LIMIT 40
    `;
  }

  const posts: any[] = await c.env.DB.prepare(query).bind(...binds).all().then((r) => r.results);

  // Check if current user has liked/bookmarked each post
  if (user && posts.length > 0) {
    const postIds = posts.map(p => p.id);
    const placeholders = postIds.map(() => '?').join(',');
    const userLikes = await c.env.DB.prepare(
      `SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${placeholders})`
    ).bind(user.id, ...postIds).all().then(r => new Set(r.results.map((x: any) => x.post_id)));
    
    const userBookmarks = await c.env.DB.prepare(
      `SELECT post_id FROM bookmarks WHERE user_id = ? AND post_id IN (${placeholders})`
    ).bind(user.id, ...postIds).all().then(r => new Set(r.results.map((x: any) => x.post_id)));

    posts.forEach(p => {
      p.is_liked = userLikes.has(p.id);
      p.is_saved = userBookmarks.has(p.id);
    });
  }

  return c.json({ mode, posts });
});

app.post('/api/posts', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk untuk menerbitkan warkah.' }, 401);

  const { title, content, parent_id } = await c.req.json().catch(() => ({}));

  // Sanitasi di titik masuk API (temuan vuln-0008): konten kaya dibersihkan dengan
  // allowlist (format editor tetap), judul di-escape jadi teks biasa. Semua sink
  // render (feed, profil, notifikasi) otomatis aman dari satu titik ini.
  const cleanContent = sanitizeRich(content).trim();
  if (!cleanContent || stripTags(cleanContent).trim() === '') {
    return c.json({ error: 'Isi warkah tidak boleh kosong.' }, 400);
  }
  // Judul: teks biasa, disimpan apa adanya — di-escape saat render (feed/profil).
  const cleanTitle = title ? String(title).trim().slice(0, 200) : null;

  const postId = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO posts (id, author_id, title, content, parent_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(postId, user.id, cleanTitle, cleanContent, parent_id ? String(parent_id) : null).run();

  if (parent_id) {
    await c.env.DB.prepare('UPDATE posts SET chains_count = chains_count + 1 WHERE id = ?').bind(parent_id).run();
    
    // Auto-create Notif for Chain connection
    const parentPost = await c.env.DB.prepare('SELECT author_id FROM posts WHERE id = ?').bind(parent_id).first();
    if (parentPost && (parentPost as any).author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, (parentPost as any).author_id, user.id, 'chain', postId).run();
    }
  }

  return c.json({ ok: true, post: { id: postId, author_pen_name: user.pen_name } }, 201);
});

// Like & Bookmark Toggle
app.post('/api/posts/:id/like', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').bind(postId).run();
    const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
    return c.json({ liked: false, likes_count: count });
  } else {
    await c.env.DB.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').bind(postId).run();
    
    // Auto-create Notif to Post Author
    const post = await c.env.DB.prepare('SELECT author_id FROM posts WHERE id = ?').bind(postId).first();
    if (post && (post as any).author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, (post as any).author_id, user.id, 'like', postId).run();
    }

    const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
    return c.json({ liked: true, likes_count: count });
  }
});

app.post('/api/posts/:id/bookmark', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET saves_count = MAX(0, saves_count - 1) WHERE id = ?').bind(postId).run();
    const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
    return c.json({ bookmarked: false, saves_count: count });
  } else {
    await c.env.DB.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET saves_count = saves_count + 1 WHERE id = ?').bind(postId).run();
    
    // Auto-create Notif to Post Author
    const post = await c.env.DB.prepare('SELECT author_id FROM posts WHERE id = ?').bind(postId).first();
    if (post && (post as any).author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, (post as any).author_id, user.id, 'save', postId).run();
    }

    const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
    return c.json({ bookmarked: true, saves_count: count });
  }
});

app.post('/api/users/:pen_name/follow', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const target: any = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!target) return c.json({ error: 'Penulis tidak ditemukan' }, 404);
  if (target.id === user.id) return c.json({ error: 'Tidak bisa mengikuti diri sendiri' }, 400);

  const existing = await c.env.DB.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').bind(user.id, target.id).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').bind(user.id, target.id).run();
    return c.json({ following: false });
  } else {
    await c.env.DB.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').bind(user.id, target.id).run();
    return c.json({ following: true });
  }
});

export default app;
