import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
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
  if (!secretKey) return true; // Jika secret key belum diset di env, bypass (fail-open for dev/staging)
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

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// ---- AUTH HELPERS ----
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + 'berbirru-salt-2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

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

  // Verifikasi Turnstile
  const clientIp = c.req.header('cf-connecting-ip') || '';
  const isHuman = await verifyTurnstile(turnstile_token, c.env.TURNSTILE_SECRET_KEY || '', clientIp);
  if (!isHuman) {
    return c.json({ error: 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan muat ulang halaman.' }, 403);
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPenName = String(pen_name).replace(/^@/, '').trim().toLowerCase();
  
  if (!/^[a-z0-9._-]+$/.test(cleanPenName)) {
    return c.json({ error: 'Nama pena hanya boleh huruf kecil, angka, titik, underscore, dan strip.' }, 400);
  }

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

  // Verifikasi Turnstile
  const clientIp = c.req.header('cf-connecting-ip') || '';
  const isHuman = await verifyTurnstile(turnstile_token, c.env.TURNSTILE_SECRET_KEY || '', clientIp);
  if (!isHuman) {
    return c.json({ error: 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan muat ulang halaman.' }, 403);
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  if (!user) return c.json({ error: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' }, 401);

  const pwdHash = await hashPassword(password);
  if (user.password_hash !== pwdHash) {
    return c.json({ error: 'Kata sandi tidak sesuai.' }, 401);
  }

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

  // Verifikasi Turnstile
  const clientIp = c.req.header('cf-connecting-ip') || '';
  const isHuman = await verifyTurnstile(turnstile_token, c.env.TURNSTILE_SECRET_KEY || '', clientIp);
  if (!isHuman) {
    return c.json({ error: 'Verifikasi keamanan Turnstile gagal atau kedaluwarsa. Silakan muat ulang halaman.' }, 403);
  }

  const cleanEmail = String(email).trim().toLowerCase();

  // STRICT GUARD: Hanya email yang SUDAH TERDAFTAR yang boleh menerima OTP
  const user: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  if (!user) {
    return c.json({ error: 'Email tidak ditemukan! Pastikan Anda sudah mendaftar terlebih dahulu.' }, 404);
  }

  // Generate 6 Digit Random OTP (misal: 749281)
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Simpan OTP ke sessions table (berlaku 10 menit)
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
      return c.json({ error: 'Resend API Error: ' + errTxt }, 500);
    }
  } catch (err: any) {
    return c.json({ error: 'Fetch error: ' + err.message }, 500);
  }

  return c.json({ 
    message: 'Kode OTP 6-digit berhasil dikirim ke ' + cleanEmail + '!',
    success: true
  });
});

app.post('/api/auth/verify-otp', async (c) => {
  const { email, otp } = await c.req.json().catch(() => ({}));
  if (!email || !otp) return c.json({ error: 'Email dan Kode OTP wajib diisi' }, 400);
  const cleanEmail = String(email).trim().toLowerCase();

  const user: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  if (!user) return c.json({ error: 'Email tidak ditemukan' }, 404);

  const session: any = await c.env.DB.prepare(
    'SELECT id FROM sessions WHERE user_id = ? AND token = ? AND expires_at > datetime("now") LIMIT 1'
  ).bind(user.id, `otp_${otp.trim()}`).first();

  if (!session) {
    return c.json({ error: 'Kode OTP salah atau sudah kedaluwarsa.' }, 400);
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

  await c.env.DB.prepare(
    'UPDATE users SET pen_name = ?, city = ?, bio = ? WHERE id = ?'
  ).bind(cleanPenName, city !== undefined ? String(city).trim() : user.city, bio !== undefined ? String(bio).trim() : user.bio, user.id).run();

  return c.json({ ok: true, user: { id: user.id, pen_name: cleanPenName, city: city || user.city, bio: bio || user.bio } });
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

// ---- POSTS & FEED API ----
app.get('/notifications', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  return c.html(renderNotificationsPage(user));
});

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
  if (!content || !content.trim()) return c.json({ error: 'Isi warkah tidak boleh kosong.' }, 400);

  const postId = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO posts (id, author_id, title, content, parent_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(postId, user.id, title ? String(title).trim() : null, content.trim(), parent_id ? String(parent_id) : null).run();

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
