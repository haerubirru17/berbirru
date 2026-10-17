import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, verifyPassword, passwordIssue } from './lib/password';
import { sanitizeRich, escapeHtml, stripTags } from './lib/sanitize';
import { turnstileGate } from './lib/turnstile-gate';
import { renderLandingPage } from './web/landing';

// Anti-enumerasi (vuln-0003): hash PBKDF2 dummy untuk verifikasi timing di
// email tak terdaftar — kerja PBKDF2 sama dengan akun nyata, lalu tetap menolak.
const DUMMY_PBKDF2_HASH = 'pbkdf2$sha256$10000$ZHVtbXlzYWx0MTIzNA==$RkFLRUhBU0hGWVdXMV teaserPLACEHOLDERONLY';

// vuln-0005: token sesi kini disimpan sebagai SHA-256 (token_hash); plaintext tak pernah menyentuh DB.
async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
import { renderLoginPage } from './web/login';
import { renderFeedPage } from './web/feed';
import { renderSearchPage } from './web/search';
import { renderProfilePage } from './web/profile';
import { renderNotificationsPage } from './web/notifications';
import { sendOtpEmail } from './mail';
import { OG_IMAGE_BASE64 } from './assets';
import { VENDOR_SWEETALERT2_JS, VENDOR_SWEETALERT2_CSS } from './vendor';

export interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  APP_NAME: string;
  APP_DOMAIN: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

// Helper verifikasi Cloudflare Turnstile token
const TURNSTILE_TEST_KEYS = new Set([
  '1x0000000000000000000000000000000AA',
  '2x0000000000000000000000000000000AA',
  '3x0000000000000000000000000000000AA',
]);

async function verifyTurnstile(token: string, secretKey: string, remoteIp?: string, expectedDomain?: string): Promise<boolean> {
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
    if (!data.success) return false;
    // Binding konteks (vuln-0005 GLM): token yang dicetak di properti web lain
    // ditolak — siteverify harus mengembalikan hostname domain aplikasi ini.
    // ponytail: kunci uji Cloudflare (dev) tidak melalui hostname asli → dikecualikan.
    const dom = String(expectedDomain || '').replace(/^https?:\/\//, '').trim();
    if (dom && !TURNSTILE_TEST_KEYS.has(secretKey.trim()) &&
        data.hostname !== dom && data.hostname !== 'www.' + dom) {
      console.error('Turnstile hostname mismatch:', data.hostname, '(diharapkan:', dom + ')');
      return false;
    }
    return true;
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
  // GC probabilistik (vuln-0007 GLM): 2% panggilan membersihkan baris expired —
  // tanpa ini tabel tumbuh tanpa batas (786 baris/klien dalam uji Strix).
  // try/catch (rekomendasi putaran-4): request sial tak boleh 500 gara-gara GC.
  if (Math.random() < 0.02) {
    try {
      await db.prepare("DELETE FROM rate_limits WHERE expires_at < datetime('now')").run();
    } catch { /* GC gagal → abaikan; keputusan rate-limit sudah dihitung. */ }
  }
  return ((row && row.count) || 0) > limit;
}

// Gate auth: Turnstile WAJIB (fail-closed). Token kosong/gagal = ditolak, sehingga
// desain fail-open lama (vuln-0002) tertutup. Rate limit per-IP sebagai lapisan kedua.
async function requireHuman(
  c: any,
  token: string,
  bucket: string,
  limit: number,
  windowSec: number,
  fallback?: { limit: number; windowSec: number },
): Promise<string | null> {
  const secret = c.env.TURNSTILE_SECRET_KEY || '';
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const hasToken = !!String(token || '').trim();
  // Jangan panggil siteverify kalau secret belum diset (percuma + spam log).
  const tokenValid = secret && hasToken ? await verifyTurnstile(token, secret, ip, c.env.APP_DOMAIN) : false;

  const decision = turnstileGate({ hasSecret: !!secret, hasToken, tokenValid, allowFallback: !!fallback });

  if (decision === 'reject') {
    if (!secret) {
      console.error('TURNSTILE_SECRET_KEY belum diset — auth DITOLAK (fail-closed).');
      return 'Layanan verifikasi keamanan sedang tidak tersedia. Coba beberapa saat lagi.';
    }
    return hasToken
      ? 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan muat ulang halaman.'
      : 'Verifikasi keamanan tidak dapat dimuat di peramban ini. Coba peramban lain atau muat ulang halaman.';
  }

  // Jalur cadangan (widget diblokir adblocker): kuota JAUH lebih ketat dan terpisah,
  // supaya tidak bisa dipakai mengeruk endpoint auth tanpa menyelesaikan Turnstile.
  if (decision === 'fallback') {
    if (await hitRate(c.env.DB, `rl:${bucket}:nt:${ip}`, fallback!.limit, fallback!.windowSec)) {
      return 'Terlalu banyak percobaan tanpa verifikasi dari jaringan ini. Coba lagi nanti.';
    }
    return null;
  }

  if (await hitRate(c.env.DB, `rl:${bucket}:${ip}`, limit, windowSec)) {
    return 'Terlalu banyak percobaan dari jaringan ini. Coba lagi beberapa menit lagi.';
  }
  return null;
}

// Data lama (dibuat sebelum sanitasi masuk di vuln-0008) bisa berisi HTML mentah di
// DB. Bersihkan di titik KELUAR API supaya tidak ada baris legacy yang lolos ke
// innerHTML client, tanpa perlu menyentuh database.
// ponytail: sanitasi per-request, ~40 baris/feed. Kalau nanti feed membesar,
// backfill sekali jalan lalu hapus baris ini.
function hardenPost(p: any): any {
  if (!p) return p;
  if (p.content != null) p.content = sanitizeRich(p.content);
  if (p.parent_content != null) p.parent_content = sanitizeRich(p.parent_content);
  if (p.post_content != null) p.post_content = sanitizeRich(p.post_content);
  return p;
}

const app = new Hono<{ Bindings: Env }>();

// Exception tak tertangkap: log stack ke tail (satu-satunya jalan lihat error asli
// di produksi) + balikin JSON rapi. Tanpa ini Hono cuma balas teks polos
// "Internal Server Error" dan error-nya tidak kelihatan di mana pun.
app.onError((err, c) => {
  console.error(`Unhandled error ${c.req.method} ${c.req.path}:`, err);
  return c.json({ error: 'Terjadi kesalahan internal. Coba lagi sebentar.' }, 500);
});

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
    // dev: request ke host lokal (wrangler dev) boleh bawa origin localhost.
    // produksi: host selalu berbirru.com → origin localhost asing tetap ditolak.
    const reqHost = new URL(c.req.url).hostname;
    const devHost = reqHost === 'localhost' || reqHost === '127.0.0.1';
    const okLocal = devHost && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    if (origin && !okLocal && !ALLOWED_ORIGINS.includes(origin)) {
      return c.json({ error: 'Permintaan dari situs lain ditolak.' }, 403);
    }
  }
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Anti-clickjacking (vuln-0004 putaran-4): SECURITY.md mengklaim ini sejak lama
  // tapi tak pernah dikirim. ponytail: full nonce-CSP ditunda — risiko merusak
  // inline script lama; dicatat docs sebagai roadmap.
  c.header('Content-Security-Policy', "frame-ancestors 'none'");
  c.header('X-Frame-Options', 'DENY');
});

// ---- AUTH HELPERS ----
async function getAuthUser(c: any): Promise<{ id: string; email: string; pen_name: string; city: string; avatar_key: string | null; cover_key: string | null; display_name: string | null; bio: string } | null> {
  const token = getCookie(c, 'berbirru_session');
  if (!token) return null;
  const session: any = await c.env.DB.prepare(
    // Baris OTP pending (`otp_<hash>`, token_hash NULL) BUKAN sesi: tanpa filter ini,
    // cookie berisi hash OTP lolos sebagai sesi valid (temuan Strix #28).
    // vuln-0005: lookup via SHA-256(token) — plaintext token tak tersimpan di DB.
    'SELECT u.id, u.email, u.pen_name, u.city, u.avatar_key, u.cover_key, u.display_name, u.bio FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > datetime("now") LIMIT 1'
  ).bind(await sha256hex(token)).first();
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

app.get('/search', async (c) => {
  const user = await getAuthUser(c);
  return c.html(renderSearchPage(user));
});

app.get('/u/:pen_name', async (c) => {
  const penNameParam = c.req.param('pen_name');
  const user = await getAuthUser(c);

  if (!user) {
    return c.redirect('/login');
  }

  // Charset gate (vuln-0009): pen_name sah hanya [a-z0-9._-] — param tak pernah
  // menyentuh HTML/JS tanpa lolos gerbang ini (reflected XSS terctegah di akar).
  if (!/^[a-z0-9._-]+$/.test(penNameParam)) {
    return c.text('Penulis tidak ditemukan', 404);
  }

  if (penNameParam === 'saya') {
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

// Vendor JS (SweetAlert2) — file statis ter-commit, immutable cache: js lib tak pernah berubah tanpa deploy.
app.get('/vendor/sweetalert2.js', (c) => {
  const js = VENDOR_SWEETALERT2_JS;
  return new Response(js, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Length': js.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

app.get('/vendor/sweetalert2.css', (c) => {
  const css = VENDOR_SWEETALERT2_CSS;
  return new Response(css, {
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Content-Length': css.length.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
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
  // Register: gerbang KERAS (tanpa jalur cadangan) — endpoint ini yang paling
  // disalahgunakan bot (buat akun massal) dan tidak punya lockout per-akun.
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

  // Pembatas pendaftaran (Strix #23): per sumber dan per alamat.
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  if (await hitRate(c.env.DB, `reg:ip:${ip}`, 5, 3600) || await hitRate(c.env.DB, `reg:${cleanEmail}`, 3, 3600)) {
    return c.json({ error: 'Terlalu banyak permintaan pendaftaran. Coba lagi nanti.' }, 429);
  }

  // Respons SERAGAM: daftar dengan email lama atau baru dijawab sama persis,
  // sehingga penyerang tidak bisa memetakan alamat email yang sudah terpakai.
  const UNIFORM = {
    ok: true,
    need_otp: true,
    email: cleanEmail,
    message: 'Kami sudah mengirim kode verifikasi ke emailmu. Masukkan kode itu untuk mengaktifkan akun.',
  };

  const byEmail: any = await c.env.DB.prepare('SELECT id, pen_name, email_verified FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  const byName: any = await c.env.DB.prepare('SELECT id, email FROM users WHERE pen_name = ? LIMIT 1').bind(cleanPenName).first();

  // Konflik nama pena dengan penulis LAIN: nama pena itu publik, jadi boleh dijawab terang-terangan.
  if (byName && byName.email !== cleanEmail) {
    return c.json({ error: 'Nama pena sudah dipakai penulis lain.' }, 400);
  }

  // vuln-0002 Strix: sandi TIDAK PERNAH ditulis sebelum kepemilikan inbox terbukti.
  // Pendaftar kedua untuk email yang sama hanya memicu OTP ulang; siapa pun yang
  // menyelesaikan OTP-lah yang menentukan identitas & sandi di langkah verifikasi.
  // (Registrasi tidak lagi menjadi vektor pembajakan akun pending.)
  let userId: string;

  if (byEmail) {
    if (byEmail.email_verified !== 0) {
      // Sudah aktif dan terbukti miliknya → tidak ada yang diubah, jawabannya tetap seragam.
      return c.json(UNIFORM);
    }
    // Akun pending: kirim OTP ulang saja — data terdaftar pertama tetap dipakai.
    userId = byEmail.id;
  } else {
    userId = crypto.randomUUID();
    const pwdHash = await hashPassword(password);
    await c.env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, pen_name, city, bio, email_verified) VALUES (?, ?, ?, ?, ?, ?, 0)'
    ).bind(userId, cleanEmail, pwdHash, cleanPenName, city ? String(city).trim() : 'Nusantara', 'Goresan perenungan rasa dan bait kata.').run();
  }

  // Tidak ada sesi di sini: akun baru hanya aktif setelah OTP terbukti masuk ke inbox (Strix #23).
  await issueOtp(c.env, userId, cleanEmail);
  return c.json(UNIFORM);
});

app.post('/api/auth/login', async (c) => {
  const { email, password, turnstile_token } = await c.req.json().catch(() => ({}));
  if (!email || !password) return c.json({ error: 'Email dan kata sandi wajib diisi.' }, 400);

  // Turnstile wajib (fail-closed). Rate limit per-IP di dalam requireHuman.
  // Login: jalur cadangan berkuota ketat kalau widget Turnstile diblokir adblocker.
  // Aman karena lockout per-akun (pw:) di bawah tetap berlaku.
  const humanErr = await requireHuman(c, turnstile_token || '', 'login', 10, 300, { limit: 5, windowSec: 900 });
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

  if (!user) {
    // Anti-enumerasi (vuln-0003): email tak terdaftar tetap menjalani verifikasi
    // PBKDF2 ke dummy hash — timing identik dengan jalur "sandi salah".
    await verifyPassword(password, DUMMY_PBKDF2_HASH);
    return c.json(BAD_CRED, 401);
  }

  const check = await verifyPassword(password, user.password_hash);
  if (!check.ok) {
    return c.json(BAD_CRED, 401);
  }

  // Akun belum dibuktikan kepemilikannya (Strix #23): wajib OTP dulu.
  // Hanya pesan ini yang muncul setelah sandi benar — tidak membocorkan ke pihak lain.
  if (user.email_verified === 0) {
    return c.json({ error: 'Akun belum aktif. Masukkan kode OTP yang kami kirim ke emailmu (tab Masuk Kode).' }, 403);
  }

  // Migrasi transparan: hash lama (SHA-256 + salt statis) di-upgrade ke PBKDF2 saat login.
  if (check.needsRehash) {
    const upgraded = await hashPassword(password);
    await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(upgraded, user.id).run();
  }

  // Login berhasil → reset penghitung gagal akun ini (hanya kegagalan berturut yang menumpuk).
  await c.env.DB.prepare('DELETE FROM rate_limits WHERE key = ?').bind(`pw:${cleanEmail}`).run();

  // Batas jumlah sesi paralel per akun (temuan vuln-0006): simpan 5 sesi terbaru saja.
  await c.env.DB.prepare(
    'DELETE FROM sessions WHERE user_id = ? AND token_hash IS NOT NULL AND id NOT IN (SELECT id FROM sessions WHERE user_id = ? AND token_hash IS NOT NULL ORDER BY created_at DESC LIMIT 4)'
  ).bind(user.id, user.id).run();

  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))'
  ).bind(crypto.randomUUID(), user.id, await sha256hex(token)).run();

  setCookie(c, 'berbirru_session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true, user: { id: user.id, pen_name: user.pen_name } });
});

/**
 * Atur ulang kata sandi — hanya untuk sesi sah.
 * Jalan masuk bagi akun lama yang hash-nya sudah tidak diterima lagi (Strix #31):
 * masuk lewat kode OTP, lalu ganti kata sandi di sini.
 */
app.post('/api/auth/change-password', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);

  const { password, current_password } = await c.req.json().catch(() => ({}));

  // Step-up (vuln-0008): ubah sandi wajib bukti sandi lama — sesi bukan otoritas tunggal.
  const cur: any = await c.env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first();
  if (!current_password || !cur || !(await verifyPassword(current_password, cur.password_hash)).ok) {
    return c.json({ error: 'Kata sandi saat ini salah.' }, 403);
  }

  const pwdErr = passwordIssue(password, user.email, user.pen_name);
  if (pwdErr) return c.json({ error: pwdErr }, 400);

  if (await hitRate(c.env.DB, `cp:${user.id}`, 5, 3600)) {
    return c.json({ error: 'Terlalu sering mengganti kata sandi. Coba lagi nanti.' }, 429);
  }

  await c.env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(password), user.id).run();

  // Cabut semua sesi LAIN (vuln-0001): rotasi sandi mengakhiri sesi curian;
  // sesi yang melakukan rotasi tetap hidup. token_hash IS NOT NULL menjaga baris OTP pending.
  await c.env.DB.prepare(
    'DELETE FROM sessions WHERE user_id = ? AND token_hash IS NOT NULL AND token_hash <> ?'
  ).bind(user.id, await sha256hex(getCookie(c, 'berbirru_session') || '')).run();

  return c.json({ ok: true });
});

// ---- OTP AUTH API (EMAIL TERDAFTAR ONLY) ----
/**
 * Simpan OTP sebagai hash + kirim emailnya. Kode lama user ini dibuang.
 * Dipakai oleh jalur send-otp dan aktivasi akun saat registrasi (Strix #23).
 */
async function issueOtp(env: any, userId: string, cleanEmail: string): Promise<{ ok: boolean }> {
  const otpCode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token LIKE 'otp_%'").bind(userId).run();
  // Hash, bukan kode mentah: kalau isi tabel bocor, kode tidak langsung bisa dipakai.
  const otpHash = await hashPassword(otpCode);
  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+10 minutes"))'
  ).bind(crypto.randomUUID(), userId, `otp_${otpHash}`).run();
  return { ok: await sendOtpEmail(cleanEmail, otpCode, env) };
}

app.post('/api/auth/send-otp', async (c) => {
  const { email, turnstile_token } = await c.req.json().catch(() => ({}));
  if (!email) return c.json({ error: 'Email wajib diisi' }, 400);

  // Turnstile wajib (fail-closed) + rate limit per-IP.
  const humanErr = await requireHuman(c, turnstile_token || '', 'otp', 5, 600, { limit: 3, windowSec: 900 });
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

  // Buat OTP (tersimpan sebagai hash) + kirim via helper bersama.
  const sent = await issueOtp(c.env, user.id, cleanEmail);
  if (!sent.ok) {
    return c.json({ error: 'Gagal mengirim kode OTP saat ini. Coba lagi beberapa saat lagi.' }, 502);
  }

  return c.json(UNIFORM);
});

app.post('/api/auth/verify-otp', async (c) => {
  const { email, otp, turnstile_token, new_password } = await c.req.json().catch(() => ({}));
  if (!email || !otp) return c.json({ error: 'Email dan Kode OTP wajib diisi' }, 400);
  const cleanEmail = String(email).trim().toLowerCase();
  const ip = c.req.header('cf-connecting-ip') || 'unknown';

  // Gerbang Turnstile (vuln-0003 GLM, HIGH): satu-satunya jalur auth tanpa gate —
  // OTP yang dicuri/ dipancing tak boleh bisa ditukar sesi oleh skrip tanpa browser.
  // ponytail: tanpa fallback adblocker di path ini — aset yang dilindungi justru OTP.
  const humanErr = await requireHuman(c, turnstile_token || '', 'votp', 10, 600);
  if (humanErr) return c.json({ error: humanErr }, 403);

  // Anti brute-force OTP (vuln-0005): batas per-IP dan per-akun.
  if (await hitRate(c.env.DB, `votp:ip:${ip}`, 10, 600) || await hitRate(c.env.DB, `votp:em:${cleanEmail}`, 10, 600)) {
    return c.json({ error: 'Terlalu banyak percobaan kode. Tunggu beberapa menit lalu coba lagi.' }, 429);
  }

  // Pesan seragam untuk email tak terdaftar / kode salah → cegah enumerasi (vuln-0003).
  const BAD_OTP = { error: 'Kode OTP salah atau sudah kedaluwarsa.' };

  const user: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  if (!user) return c.json(BAD_OTP, 400);

  // OTP disimpan sebagai `otp_<hash pbkdf2>` (vuln-0006 Strix), jadi cari dulu
  // OTP aktif milik user, baru bandingkan hash-nya.
  const row: any = await c.env.DB.prepare(
    "SELECT id, token FROM sessions WHERE user_id = ? AND token LIKE 'otp_%' AND expires_at > datetime(\"now\") ORDER BY created_at DESC LIMIT 1"
  ).bind(user.id).first();

  // String(otp): klien bisa kirim angka → dulu `otp.trim()` meledak jadi 500.
  const otpOk = row ? (await verifyPassword(String(otp).trim(), String(row.token).slice(4))).ok : false;
  if (!otpOk) {
    return c.json(BAD_OTP, 400);
  }
  const session = row;

  // Rotasi kredensial saat aktivasi (vuln-0004 GLM, pre-hijack): siapa pun yang
  // menyelesaikan OTP menentukan sandi akun — sandi pendaftar PERTAMA (yang tak
  // terbukti punya inbox) divalidasi ulang/ diganti di sini, bukan dibiarkan hidup.
  // vuln-0006 putaran-4 (HIGH): new_password HANYA sah untuk aktivasi (email_verified=0).
  // Akun terverifikasi punya sandi pemilik terbukti → verifikasi OTP login TIDAK
  // berwenang menggantinya (beda dengan change-password yang minta sandi lama).
  if (new_password) {
    const pwdErr = passwordIssue(new_password, cleanEmail, user.pen_name);
    if (pwdErr) return c.json({ error: pwdErr }, 400);
  }
  const wasPending: any = await c.env.DB.prepare('SELECT email_verified FROM users WHERE id = ?').bind(user.id).first();

  // Klaim OTP ATMOST-ONCE (vuln-0007 putaran-4): check-then-delete lama punya jeda
  // → dua verify konkuren sama-sama lolos & mint 2 sesi dari 1 kode. Sekarang
  // penghapusan dilengkapi syarat token dan dijadikan HAKIM: hanya request yang
  // klaimnya succeeds (meta.changes === 1) yang boleh lanjut.
  const claim = await c.env.DB.prepare("DELETE FROM sessions WHERE id = ? AND token LIKE 'otp\\_%' ESCAPE '\\'").bind(session.id).run();
  if (!claim.meta.changes) {
    return c.json(BAD_OTP, 400);
  }

  // OTP = bukti kepemilikan inbox → akun resmi aktif (Strix #23).
  if (new_password) {
    if (!wasPending || wasPending.email_verified !== 0) {
      return c.json({ error: 'Kata sandi sudah terpasang — gunakan tab Masuk.' }, 400);
    }
    const pwdFinal = await hashPassword(new_password);
    await c.env.DB.prepare('UPDATE users SET email_verified = 1, password_hash = ? WHERE id = ?').bind(pwdFinal, user.id).run();
  } else if (wasPending && wasPending.email_verified === 0) {
    // Aktivasi pertama tanpa new_password: sandi pendaftar pertama TAK pernah
    // terbukti milik pemilik inbox → hancurkan (pre-hijack P1 tak bisa login lagi).
    // ponytail: hash acak one-way; pemilik inbox set sandi baru via tab "Kode OTP" + change-password.
    await c.env.DB.prepare("UPDATE users SET email_verified = 1, password_hash = ' otp-disabled:' || hex(randomblob(32)) WHERE id = ?").bind(user.id).run();
  } else {
    await c.env.DB.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').bind(user.id).run();
  }

  // Batas 5 sesi paralel (vuln-0006) — terapkan juga di jalur verifikasi OTP.
  await c.env.DB.prepare(
    'DELETE FROM sessions WHERE user_id = ? AND token_hash IS NOT NULL AND id NOT IN (SELECT id FROM sessions WHERE user_id = ? AND token_hash IS NOT NULL ORDER BY created_at DESC LIMIT 4)'
  ).bind(user.id, user.id).run();

  const sessionToken = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))'
  ).bind(crypto.randomUUID(), user.id, await sha256hex(sessionToken)).run();

  setCookie(c, 'berbirru_session', sessionToken, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true, user: { id: user.id, pen_name: user.pen_name } });
});

app.post('/api/auth/logout', async (c) => {
  const token = getCookie(c, 'berbirru_session');
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256hex(token)).run();
  }
  deleteCookie(c, 'berbirru_session');
  return c.json({ ok: true });
});

// Keluar dari SEMUA perangkat (temuan vuln-0007 Strix): kalau token bocor, user
// butuh satu tombol buat mencabut semua sesi lain — bukan cuma sesi di device ini.
app.post('/api/auth/logout-all', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const token = getCookie(c, 'berbirru_session') || '';
  // Sesi lain + OTP yang masih menggantung ikut dimatikan.
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash IS NOT NULL AND token_hash != ?').bind(user.id, await sha256hex(token)).run();
  return c.json({ ok: true });
});

// ---- PROFILE & USER UPDATE ----
app.patch('/api/users/me', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);

  // Rate limit per-akun (vuln-0001 GLM): 20 perubahan profil/menit.
  if (await hitRate(c.env.DB, `profile:${user.id}`, 20, 60)) {
    return c.json({ error: 'Terlalu banyak perubahan profil. Tunggu sebentar.' }, 429);
  }

  const { pen_name, city, bio, display_name } = await c.req.json().catch(() => ({}));

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
  const cleanDisplayName = display_name !== undefined ? String(display_name).trim().slice(0, 40) : user.display_name;

  await c.env.DB.prepare(
    'UPDATE users SET pen_name = ?, city = ?, bio = ?, display_name = ? WHERE id = ?'
  ).bind(cleanPenName, cleanCity, cleanBio, cleanDisplayName, user.id).run();

  return c.json({ ok: true, user: { id: user.id, pen_name: cleanPenName, city: cleanCity, bio: cleanBio, display_name: cleanDisplayName } });
});

app.get('/api/users/suggest', async (c) => {
  const q = (c.req.query('q') || '').replace(/^@+/g, '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
  if (!q) return c.json({ users: [] });
  const result = await c.env.DB.prepare(
    'SELECT pen_name, city FROM users WHERE pen_name LIKE ? ORDER BY pen_name LIMIT 8'
  ).bind(q + '%').all();
  return c.json({ users: result.results || [] });
});

app.get('/api/users/:pen_name', async (c) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const user: any = await c.env.DB.prepare('SELECT id, pen_name, city, bio, avatar_key, cover_key, display_name, created_at FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!user) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  const postsCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM posts WHERE author_id = ?').bind(user.id).first('c') || 0;
  const likesCount = await c.env.DB.prepare('SELECT COALESCE(SUM(likes_count), 0) as s FROM posts WHERE author_id = ?').bind(user.id).first('s') || 0;
  const savesCount = await c.env.DB.prepare('SELECT COALESCE(SUM(saves_count), 0) as s FROM posts WHERE author_id = ?').bind(user.id).first('s') || 0;

  // status follow viewer — buat toggle tombol di profil (anonim/akun sendiri = false)
  let isFollowing = false;
  const viewer = await getAuthUser(c);
  if (viewer && viewer.id !== user.id) {
    isFollowing = Boolean(await c.env.DB.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').bind(viewer.id, user.id).first());
  }

  return c.json({
    user: {
      ...user,
      posts_count: postsCount,
      likes_count: likesCount,
      saves_count: savesCount,
      is_following: isFollowing
    }
  });
});

// ---- MEDIA PROFIL (R2): avatar & cover ----
// batas setelah kompres client. ponytail: cap tetap, naikkan jika perlu.
const MEDIA_SPEC: Record<string, { max: number; col: string; dir: string }> = {
  avatar: { max: 256 * 1024, col: 'avatar_key', dir: 'avatar' },
  cover:  { max: 512 * 1024, col: 'cover_key',  dir: 'cover' }
};
const MEDIA_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

app.put('/api/me/media/:kind', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);

  const spec = MEDIA_SPEC[c.req.param('kind')];
  if (!spec) return c.json({ error: 'Jenis media tak dikenal' }, 404);

  const ct = (c.req.header('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = MEDIA_TYPES[ct];
  if (!ext) return c.json({ error: 'Hanya JPEG/PNG/WebP' }, 415);
  if (!c.env.MEDIA) return c.json({ error: 'Media belum siap' }, 503);

  const buf = await c.req.arrayBuffer();
  if (!buf || buf.byteLength === 0) return c.json({ error: 'Berkas kosong' }, 400);
  if (buf.byteLength > spec.max) return c.json({ error: `Gambar terlalu besar (maks ${Math.round(spec.max / 1024)}KB setelah kompresi otomatis)` }, 413);

  // magic bytes sungguhan — Content-Type bisa bohong
  const b = new Uint8Array(buf);
  const isJpeg = b[0] === 0xFF && b[1] === 0xD8;
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  const isWebP = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  const sniffExt = isJpeg ? 'jpg' : isPng ? 'png' : isWebP ? 'webp' : null;
  if (!sniffExt || sniffExt !== ext) return c.json({ error: 'Isi berkas tidak cocok dengan tipenya' }, 415);

  // key per-user+jenis: timpa lama, tak menumpuk sampah di bucket
  const key = `${spec.dir}/${me.id}.${ext}`;
  await c.env.MEDIA.put(key, buf, { httpMetadata: { contentType: ct } });

  const old: any = await c.env.DB.prepare(`SELECT ${spec.col} AS k FROM users WHERE id = ?`).bind(me.id).first();
  // simpan key + versi (?v=) — setiap render URL-nya beda dari upload sebelumnya, cache browser tak pernah basi
  const stored = `${key}?v=${Date.now()}`;
  await c.env.DB.prepare(`UPDATE users SET ${spec.col} = ? WHERE id = ?`).bind(stored, me.id).run();

  // buang objek lama kalau ekstensinya beda (strip versi sebelum hapus dari R2)
  const oldBase = String(old?.k || '').split('?')[0];
  if (oldBase && oldBase !== key) {
    await c.env.MEDIA.delete(oldBase).catch(() => {});
  }

  // cache-bust via versi = epoch saat upload
  return c.json({ ok: true, url: `/media/${stored}` });
});

app.get('/media/*', async (c) => {
  const key = c.req.path.replace('/media/', '');
  if (!/^[a-z0-9_-]+\/[a-z0-9_-]+\.(jpg|png|webp)$/i.test(key)) return c.json({ error: 'Key tak valid' }, 400);
  if (!c.env.MEDIA) return c.json({ error: 'Media belum siap' }, 503);
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.json({ error: 'Tidak ditemukan' }, 404);
  return c.body(obj.body, 200, {
    'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
    // ponytail: max-age 5 menit — ganti avatar tampil fresh cepat; ETag-revalidate kalau traffic R2 jadi mahal
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600'
  });
});

app.get('/api/users/:pen_name/posts', async (c) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const tab = (c.req.query('tab') || 'original').toLowerCase();
  const targetUser: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!targetUser) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  // Tab privat (temuan Strix #22, IDOR): likes/simpanan hanya boleh dibaca sendiri.
  if (tab === 'likes' || tab === 'saved') {
    const me = await getAuthUser(c);
    if (!me || me.id !== targetUser.id) {
      return c.json({ error: 'Hanya penulis yang bersangkutan yang boleh melihat tab ini.' }, 403);
    }
  }

  let query = '';
  const binds: any[] = [];

  if (tab === 'likes') {
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key 
      FROM likes l 
      JOIN posts p ON l.post_id = p.id 
      JOIN users u ON p.author_id = u.id 
      WHERE l.user_id = ? 
      ORDER BY l.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else if (tab === 'saved') {
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key 
      FROM bookmarks b 
      JOIN posts p ON b.post_id = p.id 
      JOIN users u ON p.author_id = u.id 
      WHERE b.user_id = ? 
      ORDER BY b.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else if (tab === 'chains') {
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NOT NULL 
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else {
    // tab === 'original'
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NULL 
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  }

  const posts = await c.env.DB.prepare(query).bind(...binds).all().then((r) => r.results);
  return c.json({ tab, posts: posts.map(hardenPost) });
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

  return c.json({ notifications: (results || []).map(hardenPost) });
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
    SELECT p.*, u.pen_name, u.city, u.avatar_key,
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

  return c.json({ mode, posts: posts.map(hardenPost) });
});

app.post('/api/posts', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk untuk menerbitkan warkah.' }, 401);

  // Rate limit per-penulis (vuln-0001 GLM): 20 unggahan/menit — tanpa ini 120
  // post terbit dalam 0,4 detik (uji Strix) dan kuota tulis D1 bisa dikuras.
  if (await hitRate(c.env.DB, `post:${user.id}`, 20, 60)) {
    return c.json({ error: 'Terlalu banyak unggahan. Tunggu sebentar.' }, 429);
  }

  const { title, content, parent_id } = await c.req.json().catch(() => ({}));

  // Batas ukuran konten (vuln-0002 putaran-4): klaim lama "4KB" tak pernah
  // diimplement. Keputusan owner 15 Okt 2026: 50.000 karakter (platform untuk
  // penulis esai/cerpen panjang). Cek SEBELUM sanitasi → input raksasa tak
  // pernah menyentuh sanitizeRich (anti CPU DoS) maupun D1.
  if (typeof content === 'string' && content.length > 50_000) {
    return c.json({ error: 'Warkah maksimal 50.000 karakter.' }, 400);
  }

  // Sanitasi di titik masuk API (temuan vuln-0008): konten kaya dibersihkan dengan
  // allowlist (format editor tetap), judul di-escape jadi teks biasa. Semua sink
  // render (feed, profil, notifikasi) otomatis aman dari satu titik ini.
  const cleanContent = sanitizeRich(content).trim();
  if (cleanContent.length > 50_000) {
    return c.json({ error: 'Warkah maksimal 50.000 karakter.' }, 400);
  }
  if (!cleanContent || stripTags(cleanContent).trim() === '') {
    return c.json({ error: 'Isi warkah tidak boleh kosong.' }, 400);
  }
  // Judul: teks biasa, disimpan apa adanya — di-escape saat render (feed/profil).
  const cleanTitle = title ? String(title).trim().slice(0, 200) : null;

  const postId = crypto.randomUUID();

  // Validasi parent_id (temuan Strix #29, HIGH): hanya UUID post yang benar-benar ada
  // yang boleh tersimpan — nilai mentah tidak pernah menyentuh konteks HTML/JS.
  const rawParent = parent_id ? String(parent_id) : '';
  let parentId: string | null = null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawParent)) {
    const parentRow: any = await c.env.DB.prepare('SELECT author_id FROM posts WHERE id = ?').bind(rawParent).first();
    if (parentRow) {
      parentId = rawParent;
      await c.env.DB.prepare('UPDATE posts SET chains_count = chains_count + 1 WHERE id = ?').bind(parentId).run();
    }
  }

  await c.env.DB.prepare(
    'INSERT INTO posts (id, author_id, title, content, parent_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(postId, user.id, cleanTitle, cleanContent, parentId).run();

  // Notif chain dibuat SETELAH post ada (bug fungsional GLM: dulu INSERT sebelum
  // post → FK melanggar, tiap reply lintas-penulis 500 + flood jadi mungkin).
  if (parentId) {
    const parentRow: any = await c.env.DB.prepare('SELECT author_id FROM posts WHERE id = ?').bind(parentId).first();
    if (parentRow && parentRow.author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, parentRow.author_id, user.id, 'chain', postId).run();
    }
  }

  return c.json({ ok: true, post: { id: postId, author_pen_name: user.pen_name } }, 201);
});

// Hapus Postingan (Hanya oleh Pemilik Postingan)
app.delete('/api/posts/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  // Bucket sama dengan POST /api/posts — delete massal otomatis tak lolos kuota.
  if (await hitRate(c.env.DB, `post:${user.id}`, 20, 60)) {
    return c.json({ error: 'Terlalu banyak operasi. Tunggu sebentar.' }, 429);
  }

  const post: any = await c.env.DB.prepare('SELECT author_id, parent_id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return c.json({ error: 'Postingan tidak ditemukan' }, 404);
  if (post.author_id !== user.id) return c.json({ error: 'Anda tidak memiliki akses untuk menghapus postingan ini' }, 403);

  // Hapus interaksi terkait & postingan
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM likes WHERE post_id = ?').bind(postId),
    c.env.DB.prepare('DELETE FROM bookmarks WHERE post_id = ?').bind(postId),
    c.env.DB.prepare('DELETE FROM notifications WHERE post_id = ?').bind(postId),
    c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId),
  ]);

  if (post.parent_id) {
    await c.env.DB.prepare('UPDATE posts SET chains_count = MAX(0, chains_count - 1) WHERE id = ?').bind(post.parent_id).run();
  }

  return c.json({ ok: true });
});

// Like & Bookmark Toggle
app.post('/api/posts/:id/like', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  // Pembatas laju interaksi (temuan Strix #24): cegah banjir notifikasi.
  if (await hitRate(c.env.DB, `engage:${user.id}`, 60, 60)) {
    return c.json({ error: 'Terlalu banyak interaksi. Tunggu sebentar.' }, 429);
  }

  const post: any = await c.env.DB.prepare('SELECT author_id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return c.json({ error: 'Warkah tidak ditemukan' }, 404);

  const existing = await c.env.DB.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?').bind(postId, postId).run();
    // Tarik notifikasi "suka" yang sudah terlanjur terkirim (stale notification).
    await c.env.DB.prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'like' AND post_id = ?").bind(post.author_id, user.id, postId).run();
    const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
    return c.json({ liked: false, likes_count: count });
  } else {
    // INSERT OR IGNORE (vuln-0005 putaran-4): like konkuren dulu meledak 500
    // (UNIQUE constraint). Kalau kalah race → perlakukan sebagai already-liked.
    const ins = await c.env.DB.prepare('INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    if (!ins.meta.changes) {
      const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
      return c.json({ liked: true, likes_count: count });
    }
    await c.env.DB.prepare('UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?').bind(postId, postId).run();

    // Dedup: satu notifikasi per (penerima, pelaku, jenis, pos) — toggle berulang tidak menumpuk.
    const dup = await c.env.DB.prepare('SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? AND post_id = ? LIMIT 1').bind(post.author_id, user.id, 'like', postId).first();
    if (!dup && post.author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, post.author_id, user.id, 'like', postId).run();
    }

    const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
    return c.json({ liked: true, likes_count: count });
  }
});

app.post('/api/posts/:id/bookmark', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  if (await hitRate(c.env.DB, `engage:${user.id}`, 60, 60)) {
    return c.json({ error: 'Terlalu banyak interaksi. Tunggu sebentar.' }, 429);
  }

  const post: any = await c.env.DB.prepare('SELECT author_id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return c.json({ error: 'Warkah tidak ditemukan' }, 404);

  const existing = await c.env.DB.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET saves_count = (SELECT COUNT(*) FROM bookmarks WHERE post_id = ?) WHERE id = ?').bind(postId, postId).run();
    await c.env.DB.prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'save' AND post_id = ?").bind(post.author_id, user.id, postId).run();
    const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
    return c.json({ bookmarked: false, saves_count: count });
  } else {
    // INSERT OR IGNORE (vuln-0005 putaran-4): pola sama dengan like — kalah race
    // konkuren bukan 500, melainkan already-bookmarked.
    const ins = await c.env.DB.prepare('INSERT OR IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    if (!ins.meta.changes) {
      const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
      return c.json({ bookmarked: true, saves_count: count });
    }
    await c.env.DB.prepare('UPDATE posts SET saves_count = (SELECT COUNT(*) FROM bookmarks WHERE post_id = ?) WHERE id = ?').bind(postId, postId).run();

    const dup = await c.env.DB.prepare('SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? AND post_id = ? LIMIT 1').bind(post.author_id, user.id, 'save', postId).first();
    if (!dup && post.author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, post.author_id, user.id, 'save', postId).run();
    }

    const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
    return c.json({ bookmarked: true, saves_count: count });
  }
});

app.post('/api/users/:pen_name/follow', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);

  // Pembatas laju interaksi (vuln-0001 putaran-4): follow lama tanpa limit —
  // toggle tanpa henti menguras kuota tulis D1 harian. Samakan dengan like/bookmark.
  if (await hitRate(c.env.DB, `engage:${user.id}`, 60, 60)) {
    return c.json({ error: 'Terlalu banyak interaksi. Tunggu sebentar.' }, 429);
  }

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
