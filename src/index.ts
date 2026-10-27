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
import { renderResetPage } from './web/reset';
import { cekResi, validasiFormatResi, ambilWilayah, cekTarifOngkir, KURIR_DIDUKUNG, KURIR_LABEL } from './kurir';
import { renderFeedPage } from './web/feed';
import { renderSearchPage } from './web/search';
import { renderProfilePage } from './web/profile';
import { renderNotificationsPage } from './web/notifications';
import { renderChainPage } from './web/chain';
import { renderAkunPage } from './web/akun';
import { renderAlamatListPage, renderAlamatFormPage } from './web/alamat';
import { renderPasarPage, renderJualPage, renderEditListingPage, renderListingDetail } from './web/pasar';
import { renderCheckoutPage } from './web/checkout';
import { renderOrderPage } from './web/order';
import { renderNotaPengiriman, renderNotaPembelian } from './web/nota';
import { renderVerifikasiPage } from './web/verifikasi';
import { renderPasarSaya } from './web/pasarSaya';
import { renderTokoPublikPage } from './web/tokoPublik';
import { renderOwnerPage } from './web/owner';
import { renderAkunAdminPage } from './web/akunAdmin';
import { renderBuktiPencairan } from './web/pencairan';
import { bolehLihatPesanan, bolehUnggahBukti, jenisDokumen, kunciBukti, kunciDokumen, MAKS_BUKTI_PER_PIHAK } from './lib/berkas';
import { createQrisTransaction, getQrisStatus, verifyWebhook, KlikQrisEnv } from './klikqris';
import { providerAmountMatches, settlementAmounts, PASAR_FEE, WITHDRAW_MIN, withdrawFee, withdrawTotal, kodePencairan } from './lib/pasar-settlement';
import { validasiPenerima, normalisasiHp } from './lib/alamat';
import { slugToko, slugUnik } from './lib/toko';
import { sendOtpEmail, sendPasswordChangedEmail } from './mail';
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
  KLIKQRIS_API_KEY?: string;
  KLIKQRIS_MERCHANT_ID?: string;
  KLIKQRIS_API_URL?: string;
  KLIKQRIS_CALLBACK_URL?: string;
  KLIKQRIS_MOCK?: string;
  OWNER_EMAIL?: string;
  BINDERBYTE_KEY?: string;
  KURIR_MOCK?: string;
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

// Filter visibilitas: post privat hanya terlihat oleh penulisnya sendiri.
// Mengembalikan pasangan klausa SQL + binding. `user` boleh null (guest).
function visibilityClause(user: any): { sql: string; binds: any[] } {
  if (user) {
    return { sql: '(p.visibility != \'private\' OR p.author_id = ?)', binds: [user.id] };
  }
  return { sql: "p.visibility = 'public'", binds: [] };
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
    const requestUrl = new URL(c.req.url);
    const reqHost = requestUrl.hostname;
    const devHost = reqHost === 'localhost' || reqHost === '127.0.0.1';
    const okLocal = devHost && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    const sameOrigin = origin === requestUrl.origin;
    if (origin && !sameOrigin && !okLocal && !ALLOWED_ORIGINS.includes(origin)) {
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
async function getAuthUser(c: any): Promise<{ id: string; email: string; pen_name: string; city: string; avatar_key: string | null; cover_key: string | null; display_name: string | null; bio: string; seller_status?: string; seller_full_name?: string | null; seller_phone?: string | null; seller_note?: string | null; seller_reject_reason?: string | null; shop_name?: string | null; shop_slug?: string | null;
  addr_receiver?: string | null; addr_phone?: string | null; addr_postal?: string | null; addr_text?: string | null;
  addr_province_id?: string | null; addr_province_name?: string | null; addr_city_id?: string | null;
  addr_city_name?: string | null; addr_district_id?: string | null; addr_district_name?: string | null } | null> {
  const token = getCookie(c, 'berbirru_session');
  if (!token) return null;
  const session: any = await c.env.DB.prepare(
    // Baris OTP pending (`otp_<hash>`, token_hash NULL) BUKAN sesi: tanpa filter ini,
    // cookie berisi hash OTP lolos sebagai sesi valid (temuan Strix #28).
    // vuln-0005: lookup via SHA-256(token) — plaintext token tak tersimpan di DB.
    'SELECT u.id, u.email, u.pen_name, u.city, u.avatar_key, u.cover_key, u.display_name, u.bio, u.seller_status, u.seller_full_name, u.seller_phone, u.seller_note, u.seller_reject_reason, u.shop_name, u.shop_slug, u.addr_receiver, u.addr_phone, u.addr_postal, u.addr_text, u.addr_province_id, u.addr_province_name, u.addr_city_id, u.addr_city_name, u.addr_district_id, u.addr_district_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > datetime("now") LIMIT 1'
  ).bind(await sha256hex(token)).first();
  return session || null;
}

// ---- WEB PAGES (SSR) ----
app.get('/', async (c) => {
  const user = await getAuthUser(c);
  return c.html(renderLandingPage(user));
});

// 404 jangan di-cache edge: rute baru bisa "hilang" beberapa jam karena 404 lama
// tersimpan di cache Cloudflare (pernah terjadi pada /lupa-sandi).
app.use('*', async (c, next) => {
  await next();
  if (c.res.status === 404) c.res.headers.set('Cache-Control', 'no-store');
});

app.get('/login', async (c) => {
  const user = await getAuthUser(c);
  if (user) return c.redirect('/feed');
  return c.html(renderLoginPage(c.env.TURNSTILE_SITE_KEY || ''));
});

app.get('/lupa-sandi', async (c) => {
  const user = await getAuthUser(c);
  if (user) return c.redirect('/akun');
  return c.html(renderResetPage(c.env.TURNSTILE_SITE_KEY || ''));
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

// ---- RESET SANDI: OTP → tiket sekali pakai → sandi baru ----
// Tiga langkah terpisah supaya OTP tidak pernah langsung berwenang mengganti sandi
// akun aktif. Tiket: 32 byte acak, disimpan sebagai hash, TTL 15 menit, sekali pakai.
const RESET_COOKIE = 'berbirru_reset';

const issueResetOtp = async (env: any, userId: string, email: string): Promise<boolean> => {
  const kode = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  const hash = await hashPassword(kode);
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token LIKE 'rsto_%'").bind(userId).run();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime('now', '+10 minutes'))"
  ).bind(crypto.randomUUID(), userId, 'rsto_' + hash).run();
  const terkirim = await sendOtpEmail(email, kode, env);
  // Jangan tinggalkan kode yang tidak pernah sampai ke inbox.
  if (!terkirim) await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token LIKE 'rsto_%'").bind(userId).run();
  return terkirim;
};

app.post('/api/auth/reset/start', async (c) => {
  const { email, turnstile_token } = await c.req.json().catch(() => ({}));
  if (!email) return c.json({ error: 'Email wajib diisi' }, 400);

  const humanErr = await requireHuman(c, turnstile_token || '', 'rstart', 5, 600, { limit: 3, windowSec: 900 });
  if (humanErr) return c.json({ error: humanErr }, 403);

  const clean = String(email).trim().toLowerCase();
  if (await hitRate(c.env.DB, `rsto:${clean}`, 3, 900)) {
    return c.json({ error: 'Terlalu banyak permintaan. Coba lagi beberapa menit lagi.' }, 429);
  }

  const SERAGAM = { message: 'Jika email terdaftar, kode reset sudah dikirim. Cek kotak masuk (dan folder spam).', success: true };
  const user: any = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(clean).first();
  if (!user) return c.json(SERAGAM);

  const terkirim = await issueResetOtp(c.env, user.id, clean);
  // Jawaban TETAP seragam walau pengiriman gagal: kalau dibedakan, penyerang bisa
  // menebak email mana yang terdaftar dari status HTTP.
  if (!terkirim) console.warn('reset/start: gagal kirim email untuk', clean);
  return c.json(SERAGAM);
});

app.post('/api/auth/reset/verify', async (c) => {
  const { email, otp, turnstile_token } = await c.req.json().catch(() => ({}));
  if (!email || !otp) return c.json({ error: 'Email dan kode wajib diisi' }, 400);

  const humanErr = await requireHuman(c, turnstile_token || '', 'rvotp', 10, 600);
  if (humanErr) return c.json({ error: humanErr }, 403);

  const clean = String(email).trim().toLowerCase();
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  if (await hitRate(c.env.DB, `rv:ip:${ip}`, 10, 600) || await hitRate(c.env.DB, `rv:em:${clean}`, 10, 600)) {
    return c.json({ error: 'Terlalu banyak percobaan. Tunggu beberapa menit.' }, 429);
  }

  const SALAH = { error: 'Kode salah atau sudah kedaluwarsa.' };
  const user: any = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(clean).first();
  if (!user) return c.json(SALAH, 400);

  const row: any = await c.env.DB.prepare(
    "SELECT id, token FROM sessions WHERE user_id = ? AND token LIKE 'rsto_%' AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
  ).bind(user.id).first();
  const cocok = row ? (await verifyPassword(String(otp).trim(), String(row.token).slice(5))).ok : false;
  if (!cocok) return c.json(SALAH, 400);

  // Klaim atomik: satu kode hanya bisa jadi satu tiket.
  const claim = await c.env.DB.prepare("DELETE FROM sessions WHERE id = ? AND token LIKE 'rsto\\_%' ESCAPE '\\'").bind(row.id).run();
  if (!claim.meta.changes) return c.json(SALAH, 400);

  const tiket = crypto.randomUUID() + crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+15 minutes'))"
  ).bind(crypto.randomUUID(), user.id, 'rst_' + await sha256hex(tiket)).run();

  setCookie(c, RESET_COOKIE, tiket, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 900 });
  return c.json({ ok: true });
});

app.post('/api/auth/reset/finish', async (c) => {
  const tiket = getCookie(c, RESET_COOKIE) || '';
  if (!tiket) return c.json({ error: 'Sesi reset tidak ditemukan. Ulangi dari awal.' }, 400);

  const { password } = await c.req.json().catch(() => ({}));
  const kunci = 'rst_' + await sha256hex(tiket);

  const baris: any = await c.env.DB.prepare(
    "SELECT id, user_id FROM sessions WHERE token_hash = ? AND expires_at > datetime('now') LIMIT 1"
  ).bind(kunci).first();
  if (!baris) return c.json({ error: 'Tiket reset kedaluwarsa. Ulangi dari awal.' }, 400);

  const user: any = await c.env.DB.prepare('SELECT id, email, pen_name FROM users WHERE id = ?').bind(baris.user_id).first();
  if (!user) return c.json({ error: 'Akun tidak ditemukan.' }, 400);

  const pwdErr = passwordIssue(password, user.email, user.pen_name);
  if (pwdErr) return c.json({ error: pwdErr }, 400);

  // Klaim tiket atomik — dipakai dua kali = ditolak.
  const claim = await c.env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(baris.id).run();
  if (!claim.meta.changes) return c.json({ error: 'Tiket reset sudah dipakai.' }, 400);

  await c.env.DB.prepare('UPDATE users SET password_hash = ?, email_verified = 1 WHERE id = ?')
    .bind(await hashPassword(password), user.id).run();
  // Reset = keluar dari semua perangkat, termasuk sesi yang mungkin dicuri.
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();

  setCookie(c, RESET_COOKIE, '', { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0 });
  try { await sendPasswordChangedEmail(user.email, c.env); } catch (_) {}
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
  // Tolak SEBELUM OTP diklaim: akun yang sudah aktif tidak boleh mengganti sandi lewat OTP,
  // dan kode jangan ikut hangus supaya pengguna bisa langsung ulang tanpa sandi baru.
  if (new_password && (!wasPending || wasPending.email_verified !== 0)) {
    return c.json({ error: 'Akun ini sudah aktif — kosongkan kolom sandi baru, cukup masukkan kode OTP.' }, 400);
  }

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

  // Angka profil orang lain hanya menghitung warkah publik — jumlah warkah privat
  // pun tidak perlu bocor. Penulis sendiri melihat angka penuh.
  const viewer = await getAuthUser(c);
  const visOnly = viewer && viewer.id === user.id ? '' : " AND visibility = 'public'";
  const postsCount = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM posts WHERE author_id = ?${visOnly}`).bind(user.id).first('c') || 0;
  const likesCount = await c.env.DB.prepare(`SELECT COALESCE(SUM(likes_count), 0) as s FROM posts WHERE author_id = ?${visOnly}`).bind(user.id).first('s') || 0;
  const savesCount = await c.env.DB.prepare(`SELECT COALESCE(SUM(saves_count), 0) as s FROM posts WHERE author_id = ?${visOnly}`).bind(user.id).first('s') || 0;
  const followersCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').bind(user.id).first('c') || 0;
  const followingCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').bind(user.id).first('c') || 0;

  // status follow viewer — buat toggle tombol di profil (anonim/akun sendiri = false)
  let isFollowing = false;
  if (viewer && viewer.id !== user.id) {
    isFollowing = Boolean(await c.env.DB.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').bind(viewer.id, user.id).first());
  }

  return c.json({
    user: {
      ...user,
      posts_count: postsCount,
      likes_count: likesCount,
      saves_count: savesCount,
      followers_count: followersCount,
      following_count: followingCount,
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
    const vis = visibilityClause(await getAuthUser(c));
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NOT NULL AND ${vis.sql}
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id, ...vis.binds);
  } else {
    // tab === 'original'
    const vis = visibilityClause(await getAuthUser(c));
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NULL AND ${vis.sql}
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id, ...vis.binds);
  }

  const posts = await c.env.DB.prepare(query).bind(...binds).all().then((r) => r.results);
  return c.json({ tab, posts: posts.map(hardenPost) });
});

// ---- NOTIFIKASI (SSR) ----
// ================= PASAR BUKU (rekber marketplace) =================
// Fee rekber 5.000/order ditanggung penjual; pembeli bayar harga+ongkir persis.
const MAX_LISTING_PHOTOS = 5;
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_DIR = 'pasar';
const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Owner = admin murni (keputusan pemilik): tidak berjualan/berbelanja lewat akun owner.
// Satu middleware menutup semua jalur tulis pasar, bukan guard di tiap endpoint.
app.use('/api/pasar/*', async (c, next) => {
  if (c.req.method === 'GET') return next();
  const me = await getAuthUser(c);
  if (me && isOwner(c.env, me)) {
    return c.json({ error: 'Akun owner hanya untuk administrasi. Pakai akun lain untuk berjualan atau berbelanja.' }, 403);
  }
  await next();
});

// Satu jalur unggah foto: listing, bukti sengketa, dokumen penjual.
// Validasi (tipe, sniff isi berkas, batas 5 MB) ada di sini — pemanggil tidak menduplikasi.
async function putFoto(
  c: any,
  keyName: (ext: string) => string
): Promise<{ key: string } | { error: string; status: 400 | 413 | 415 | 503 }> {
  const ct = (c.req.header('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = PHOTO_TYPES[ct];
  if (!ext) return { error: 'Hanya JPEG/PNG/WebP', status: 415 };
  if (!c.env.MEDIA) return { error: 'Media belum siap', status: 503 };
  const buf = await c.req.arrayBuffer();
  if (!buf || buf.byteLength === 0) return { error: 'Berkas kosong', status: 400 };
  if (buf.byteLength > PHOTO_MAX_BYTES) return { error: 'Foto terlalu besar (maks 5MB)', status: 413 };
  const b = new Uint8Array(buf);
  const isJpeg = b[0] === 0xFF && b[1] === 0xD8;
  const isPng = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  const isWebP = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  const sniffExt = isJpeg ? 'jpg' : isPng ? 'png' : isWebP ? 'webp' : null;
  if (!sniffExt || sniffExt !== ext) return { error: 'Isi berkas tidak cocok dengan tipenya', status: 415 };
  const key = keyName(ext);
  await c.env.MEDIA.put(key, buf, { httpMetadata: { contentType: ct } });
  return { key };
}

app.post('/api/pasar/upload', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const r = await putFoto(c, (ext) => `${PHOTO_DIR}/${me.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`);
  if ('error' in r) return c.json({ error: r.error }, r.status);
  return c.json({ ok: true, key: r.key, url: `/media/${r.key}?v=${Date.now()}` });
});

app.delete('/api/pasar/upload', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const key = c.req.query('key') || '';
  // hanya boleh hapus foto miliknya sendiri di folder pasar
  if (!key.startsWith(`${PHOTO_DIR}/${me.id}_`)) return c.json({ error: 'Key tak valid' }, 403);
  if (!/^[a-z0-9_/-]+\.(jpg|png|webp)$/i.test(key)) return c.json({ error: 'Key tak valid' }, 400);
  await c.env.MEDIA.delete(key).catch(() => {});
  return c.json({ ok: true });
});

// ---- Berkas privat: bukti sengketa & dokumen penjual ----
// Disajikan lewat route ber-guard (bukan /media yang publik + cache 5 menit).
async function serveBerkas(c: any, key: string) {
  if (!c.env.MEDIA) return c.notFound();
  const obj = await c.env.MEDIA.get(key);
  if (!obj) return c.notFound();
  return c.body(obj.body, 200, {
    'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
}

// Bukti foto sengketa: hanya pembeli/penjual pesanan itu, hanya saat status disputed.
app.post('/api/pasar/order/:id/evidence', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT id, buyer_id, seller_id, status FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || (me.id !== o.buyer_id && me.id !== o.seller_id)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const sud: any = await c.env.DB.prepare(
    'SELECT COUNT(*) AS n FROM order_evidence WHERE order_id = ? AND uploader_id = ?'
  ).bind(o.id, me.id).first();
  if (!bolehUnggahBukti(o.status, Number(sud?.n || 0))) {
    return c.json({
      error: o.status === 'disputed'
        ? `Maksimal ${MAKS_BUKTI_PER_PIHAK} foto per pihak`
        : 'Bukti hanya bisa diunggah saat sengketa',
    }, 409);
  }
  if (await hitRate(c.env.DB, `bukti:${me.id}`, 10, 600)) {
    return c.json({ error: 'Terlalu banyak unggahan. Coba lagi nanti.' }, 429);
  }
  const note = String(c.req.query('note') || '').trim().slice(0, 200);
  const r = await putFoto(c, (ext) => kunciBukti(o.id, me.id, ext));
  if ('error' in r) return c.json({ error: r.error }, r.status);
  await c.env.DB.prepare(
    'INSERT INTO order_evidence (id, order_id, uploader_id, role, r2_key, note) VALUES (?,?,?,?,?,?)'
  ).bind(crypto.randomUUID(), o.id, me.id, me.id === o.buyer_id ? 'buyer' : 'seller', r.key, note || null).run();
  return c.json({ ok: true });
});

app.get('/berkas/sengketa/:id', async (c) => {
  const me = await getAuthUser(c);
  const row: any = await c.env.DB.prepare(
    'SELECT e.r2_key, o.buyer_id, o.seller_id FROM order_evidence e JOIN orders o ON o.id = e.order_id WHERE e.id = ?'
  ).bind(c.req.param('id')).first();
  if (!row) return c.notFound();
  if (!bolehLihatPesanan(row, me?.id, isOwner(c.env, me))) return c.notFound();
  return serveBerkas(c, row.r2_key);
});

// Dokumen verifikasi penjual: KTP & buku tabungan — HANYA owner yang boleh membuka.
app.post('/api/pasar/seller/docs', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  if (me.seller_status === 'approved') return c.json({ error: 'Akun sudah terverifikasi' }, 409);
  const kind = jenisDokumen(c.req.query('kind'));
  if (!kind) return c.json({ error: 'Jenis dokumen tidak dikenal' }, 400);
  if (await hitRate(c.env.DB, `dok:${me.id}`, 6, 3600)) {
    return c.json({ error: 'Terlalu banyak unggahan. Coba lagi nanti.' }, 429);
  }
  const lama: any = await c.env.DB.prepare('SELECT r2_key FROM seller_docs WHERE user_id = ? AND kind = ?').bind(me.id, kind).first();
  const r = await putFoto(c, (ext) => kunciDokumen(me.id, kind, ext));
  if ('error' in r) return c.json({ error: r.error }, r.status);
  await c.env.DB.prepare(
    `INSERT INTO seller_docs (user_id, kind, r2_key) VALUES (?,?,?)
     ON CONFLICT(user_id, kind) DO UPDATE SET r2_key = excluded.r2_key, uploaded_at = datetime('now')`
  ).bind(me.id, kind, r.key).run();
  if (lama?.r2_key && lama.r2_key !== r.key) await c.env.MEDIA.delete(lama.r2_key).catch(() => {});
  return c.json({ ok: true });
});

app.get('/berkas/dokumen/:userId/:kind', async (c) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.notFound();
  const kind = jenisDokumen(c.req.param('kind'));
  if (!kind) return c.notFound();
  const row: any = await c.env.DB.prepare('SELECT r2_key FROM seller_docs WHERE user_id = ? AND kind = ?').bind(c.req.param('userId'), kind).first();
  if (!row) return c.notFound();
  return serveBerkas(c, row.r2_key);
});

app.post('/api/pasar/listings', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  if (me.seller_status !== 'approved') return c.json({ error: 'Akun penjual belum terverifikasi owner' }, 403);
  const body: any = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Body tidak valid' }, 400);
  const title = String(body.title || '').trim();
  const author = String(body.author || '').trim().slice(0, 100);
  const descr = String(body.descr || '').trim().slice(0, 800);
  const cond = ['baru', 'bekas_bagus', 'bekas_layak'].includes(body.cond) ? body.cond : 'bekas_bagus';
  const price = Number(body.price);
  // Ongkir dari layanan kurir: penjual pilih kurir + berat + kecamatan asal (bukan angka tebakan).
  const couriers: string[] = (Array.isArray(body.couriers) ? body.couriers : [])
    .map((x: any) => String(x).toLowerCase())
    .filter((x: string, i: number, a: string[]) => KURIR_DIDUKUNG.includes(x) && a.indexOf(x) === i);
  const weightG = Number(body.weight_g);
  const originId = String(body.origin_id || '').trim();
  const originName = String(body.origin_name || '').trim().slice(0, 120);
  let photos: string[] = Array.isArray(body.photos) ? body.photos.map(String) : [];
  photos = photos.filter((k) => new RegExp(`^${PHOTO_DIR}/${me.id}_[0-9]+_[a-z0-9]+\\.(jpg|png|webp)$`).test(k)).slice(0, MAX_LISTING_PHOTOS);
  if (!title || title.length > 140) return c.json({ error: 'Judul wajib diisi (maks 140 karakter)' }, 400);
  if (!Number.isInteger(price) || price < 1000 || price > 10_000_000) return c.json({ error: 'Harga harus Rp1.000–10.000.000' }, 400);
  if (!couriers.length) return c.json({ error: 'Pilih minimal satu layanan pengiriman' }, 400);
  if (!Number.isInteger(weightG) || weightG < 100 || weightG > 30_000) return c.json({ error: 'Berat buku harus 100–30.000 gram' }, 400);
  if (!originId) return c.json({ error: 'Pilih kecamatan asal pengiriman' }, 400);
  if (photos.length === 0) return c.json({ error: 'Minimal 1 foto buku' }, 400);
  // Asal disimpan ke profil: listing berikutnya tak perlu pilih ulang.
  await c.env.DB.prepare('UPDATE users SET district_id = ?, district_name = ? WHERE id = ?')
    .bind(originId, originName || null, me.id).run();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO listings (id, seller_id, title, author, descr, cond, price, shipping_flat, weight_g, couriers, status, photos) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
  ).bind(id, me.id, title, author, descr, cond, price, 0, weightG, JSON.stringify(couriers), 'active', JSON.stringify(photos)).run();
  return c.json({ ok: true, id });
});

// Wilayah bertingkat: parent kosong = provinsi, 2 digit = kabupaten, 6 digit = kecamatan.
app.get('/api/kurir/wilayah', async (c) => {
  const parent = (c.req.query('parent') || '').trim();
  const r = await ambilWilayah(c.env, parent || undefined);
  if (!r.ok) return c.json({ ok: false, error: r.error }, 503);
  return c.json({ ok: true, items: r.items });
});

// Tarif ongkir live untuk satu listing (pembeli pilih kecamatan tujuan).
app.post('/api/pasar/ongkir', async (c) => {
  const body: any = await c.req.json().catch(() => null);
  const destId = String(body?.dest_id || '').trim();
  const destName = String(body?.dest_name || '').trim().slice(0, 120);
  const p: any = await c.env.DB.prepare("SELECT id, seller_id, weight_g, couriers FROM listings WHERE id = ? AND status = 'active'")
    .bind(String(body?.listing_id || '')).first();
  if (!p) return c.json({ error: 'Listing tidak tersedia' }, 404);
  if (!destId) return c.json({ error: 'Pilih kecamatan tujuan dulu' }, 400);
  const seller: any = await c.env.DB.prepare('SELECT district_id FROM users WHERE id = ?').bind(p.seller_id).first();
  if (!seller?.district_id) return c.json({ error: 'Penjual belum menetapkan kota asal' }, 409);

  let couriers: string[] = [];
  try { couriers = JSON.parse(p.couriers || '[]'); } catch { couriers = []; }
  const r = await cekTarifOngkir(c.env, {
    couriers, origin: seller.district_id, destination: destId, weightG: Number(p.weight_g || 1000),
  });
  if (!r.ok) return c.json({ error: r.error || 'Tarif tidak tersedia' }, 503);
  return c.json({ ok: true, options: r.options, dest: { id: destId, name: destName } });
});

app.get('/pasar', async (c) => {
  const user = await getAuthUser(c);
  // Filter dicari di server: 100 judul pun tetap satu query, tanpa JS.
  const q = String(c.req.query('q') || '').trim().slice(0, 60);
  const cond = ['baru', 'bekas_bagus', 'bekas_layak'].includes(String(c.req.query('cond') || '')) ? String(c.req.query('cond')) : '';
  const sort = ['baru', 'murah', 'mahal'].includes(String(c.req.query('sort') || '')) ? String(c.req.query('sort')) : 'baru';
  const max = Math.max(0, Math.min(100_000_000, Number.parseInt(String(c.req.query('max') || '0'), 10) || 0));

  const perPage = 24;
  const hal = Math.max(1, Math.min(99, Number.parseInt(String(c.req.query('hal') || '1'), 10) || 1));
  let where = " FROM listings WHERE status = 'active'";
  const binds: any[] = [];
  if (q) {
    const pola = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
    where += " AND (title LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\')";
    binds.push(pola, pola);
  }
  if (cond) { where += ' AND cond = ?'; binds.push(cond); }
  if (max) { where += ' AND price <= ?'; binds.push(max); }

  const urut = sort === 'murah' ? ' ORDER BY price ASC, created_at DESC'
    : sort === 'mahal' ? ' ORDER BY price DESC, created_at DESC'
    : ' ORDER BY created_at DESC';

  const countStmt = c.env.DB.prepare('SELECT COUNT(*) AS n' + where);
  const total: any = binds.length ? await countStmt.bind(...binds).first() : await countStmt.first();

  const sql = 'SELECT id, seller_id, title, cond, price, shipping_flat, photos' + where + urut + ' LIMIT ? OFFSET ?';
  const stmt = c.env.DB.prepare(sql).bind(...binds, perPage, (hal - 1) * perPage);
  const listings = await stmt.all();
  return c.html(renderPasarPage(user, listings.results || [], { q, cond, sort, max }, {
    hal, perPage, total: Number(total?.n || 0),
  }));
});

// Halaman akun: pintu pengaturan yang masuk akal di dalam Pasar.
app.get('/akun', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  // Refund = uang kembali ke rekening, bukan saldo. Tapi pembeli tetap butuh daftarnya.
  const refunds = await c.env.DB.prepare(
    `SELECT id, refund_amount, refund_ref, refunded_at, price, shipping, qris_final_amount
       FROM orders WHERE buyer_id = ? AND status = 'refunded' ORDER BY refunded_at DESC LIMIT 10`
  ).bind(user.id).all();
  return c.html(renderAkunPage(user, refunds.results || []));
});

// ---- Buku alamat (maks 5, satu utama) ----
const bacaAlamat = (f: any) => {
  const t = (v: any, n: number) => String(v ?? '').trim().slice(0, n);
  const a = {
    label: t(f.label, 20) || null,
    receiver: t(f.receiver, 60),
    phone: String(f.phone ?? '').replace(/[^0-9+]/g, '').slice(0, 20),
    postal: String(f.postal ?? '').replace(/\D/g, '').slice(0, 5),
    text: t(f.text, 300),
    province_id: t(f.province_id, 12) || null, province_name: t(f.province_name, 60) || null,
    city_id: t(f.city_id, 12) || null, city_name: t(f.city_name, 60) || null,
    district_id: t(f.district_id, 12) || null, district_name: t(f.district_name, 60) || null,
    utama: String(f.utama ?? '') === '1',
  };
  const salah = a.receiver.length < 3 ? 'Nama penerima minimal 3 karakter.'
    : a.phone.replace(/\D/g, '').length < 9 ? 'Nomor HP minimal 9 angka.'
    : !a.district_id ? 'Pilih kecamatan tujuan.'
    : a.postal.length !== 5 ? 'Kode pos harus 5 angka.'
    : a.text.length < 10 ? 'Alamat lengkap minimal 10 karakter.' : '';
  return { a, salah };
};

// Cerminkan alamat utama ke users.addr_* — kode lama (checkout/order) masih membacanya.
const cerminUtama = (db: D1Database, userId: string, a: any) => db.prepare(
  `UPDATE users SET addr_receiver = ?, addr_phone = ?, addr_postal = ?, addr_text = ?,
     addr_province_id = ?, addr_province_name = ?, addr_city_id = ?, addr_city_name = ?,
     addr_district_id = ?, addr_district_name = ? WHERE id = ?`
).bind(a.receiver, a.phone, a.postal, a.text, a.province_id, a.province_name,
  a.city_id, a.city_name, a.district_id, a.district_name, userId);

app.get('/akun/alamat', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const rows = await c.env.DB.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC'
  ).bind(user.id).all();
  const pesan = c.req.query('ok') === 'baru' ? 'Alamat baru tersimpan.' : c.req.query('ok') ? 'Perubahan tersimpan.' : '';
  return c.html(renderAlamatListPage(user, rows.results || [], pesan));
});

app.get('/akun/alamat/baru', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const n: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?').bind(user.id).first();
  if (Number(n?.n || 0) >= 5) return c.redirect('/akun/alamat');
  return c.html(renderAlamatFormPage(user, { receiver: user.addr_receiver, phone: user.addr_phone }));
});

app.post('/akun/alamat', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const f: any = await c.req.parseBody();
  const { a, salah } = bacaAlamat(f);
  if (salah) return c.html(renderAlamatFormPage(user, a, salah), 400);
  const n: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?').bind(user.id).first();
  if (Number(n?.n || 0) >= 5) return c.redirect('/akun/alamat');

  const id = crypto.randomUUID();
  const utama = a.utama || Number(n?.n || 0) === 0;
  await c.env.DB.batch([
    ...(utama ? [c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(user.id)] : []),
    c.env.DB.prepare(
      `INSERT INTO addresses (id, user_id, label, receiver, phone, postal, text,
        province_id, province_name, city_id, city_name, district_id, district_name, is_default)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(id, user.id, a.label, a.receiver, a.phone, a.postal, a.text, a.province_id,
      a.province_name, a.city_id, a.city_name, a.district_id, a.district_name, utama ? 1 : 0),
    ...(utama ? [cerminUtama(c.env.DB, user.id, a)] : []),
  ]);
  return c.redirect('/akun/alamat?ok=baru');
});

app.get('/akun/alamat/:id/ubah', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const a: any = await c.env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id).first();
  if (!a) return c.notFound();
  return c.html(renderAlamatFormPage(user, a));
});

app.post('/akun/alamat/:id', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const lama: any = await c.env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id).first();
  if (!lama) return c.notFound();
  const f: any = await c.req.parseBody();
  const { a, salah } = bacaAlamat(f);
  if (salah) return c.html(renderAlamatFormPage(user, { ...a, id: lama.id }, salah), 400);
  const utama = a.utama || Number(lama.is_default) === 1;
  await c.env.DB.batch([
    ...(utama && !lama.is_default ? [c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(user.id)] : []),
    c.env.DB.prepare(
      `UPDATE addresses SET label = ?, receiver = ?, phone = ?, postal = ?, text = ?,
         province_id = ?, province_name = ?, city_id = ?, city_name = ?, district_id = ?, district_name = ?,
         is_default = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?`
    ).bind(a.label, a.receiver, a.phone, a.postal, a.text, a.province_id, a.province_name,
      a.city_id, a.city_name, a.district_id, a.district_name, utama ? 1 : 0, lama.id, user.id),
    ...(utama ? [cerminUtama(c.env.DB, user.id, a)] : []),
  ]);
  return c.redirect('/akun/alamat?ok=1');
});

app.post('/akun/alamat/:id/utama', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const a: any = await c.env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id).first();
  if (!a) return c.notFound();
  await c.env.DB.batch([
    c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(user.id),
    c.env.DB.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').bind(a.id),
    cerminUtama(c.env.DB, user.id, a),
  ]);
  return c.redirect('/akun/alamat?ok=1');
});

app.post('/akun/alamat/:id/hapus', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const a: any = await c.env.DB.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), user.id).first();
  if (!a) return c.notFound();
  await c.env.DB.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').bind(a.id, user.id).run();
  if (Number(a.is_default) === 1) {
    const sisa: any = await c.env.DB.prepare(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at ASC LIMIT 1'
    ).bind(user.id).first();
    if (sisa) {
      await c.env.DB.batch([
        c.env.DB.prepare('UPDATE addresses SET is_default = 1 WHERE id = ?').bind(sisa.id),
        cerminUtama(c.env.DB, user.id, sisa),
      ]);
    }
  }
  return c.redirect('/akun/alamat?ok=1');
});

app.get('/pasar/listing/:id/edit', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.redirect('/login');
  const l: any = await c.env.DB.prepare('SELECT id, seller_id, title, price, cond, status FROM listings WHERE id = ?')
    .bind(c.req.param('id')).first();
  if (!l || l.seller_id !== me.id) return c.notFound();
  if (l.status === 'sold') return c.redirect('/pasar/saya?tab=toko');
  return c.html(renderEditListingPage(me, l));
});

app.get('/pasar/jual', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  if (isOwner(c.env, user)) return c.redirect('/owner'); // owner = admin, bukan penjual
  // Gerbang: hanya penjual terverifikasi yang boleh memasang buku.
  if (user.seller_status !== 'approved') {
    const docs = await c.env.DB.prepare('SELECT kind FROM seller_docs WHERE user_id = ?').bind(user.id).all();
    const ada = new Set((docs.results || []).map((d: any) => d.kind));
    return c.html(renderVerifikasiPage({ ...user, doc_ktp: ada.has('ktp'), doc_bank: ada.has('bank') }));
  }
  return c.html(renderJualPage(user));
});

// ---- Toko publik penjual: /toko/<slug> (bisa dibagikan, tanpa login) ----
app.get('/toko/:slug', async (c) => {
  const slug = String(c.req.param('slug') || '').toLowerCase().slice(0, 60);
  if (!/^[a-z0-9-]{1,60}$/.test(slug)) return c.notFound();
  const toko: any = await c.env.DB.prepare(
    `SELECT id, pen_name, shop_name, city, created_at, shop_slug FROM users
      WHERE shop_slug = ? AND seller_status = 'approved' LIMIT 1`
  ).bind(slug).first();
  if (!toko) return c.notFound();
  const perPage = 24;
  const hal = Math.max(1, Math.min(99, Number.parseInt(String(c.req.query('hal') || '1'), 10) || 1));
  const jumlah: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM listings WHERE seller_id = ? AND status = 'active'"
  ).bind(toko.id).first();
  const rows = await c.env.DB.prepare(
    `SELECT id, title, price, cond, photos FROM listings
      WHERE seller_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(toko.id, perPage, (hal - 1) * perPage).all();
  const done: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM orders WHERE seller_id = ? AND status = 'completed'"
  ).bind(toko.id).first();
  const rate: any = await c.env.DB.prepare(
    'SELECT COUNT(*) AS n, AVG(stars) AS avg FROM reviews WHERE seller_id = ?'
  ).bind(toko.id).first();
  const me = await getAuthUser(c);
  const baseUrl = new URL(c.req.url).origin;
  return c.html(renderTokoPublikPage(
    { ...toko, transaksi_selesai: Number(done?.n || 0), ulasan_n: Number(rate?.n || 0), ulasan_avg: Number(rate?.avg || 0), buku_aktif: Number(jumlah?.n || 0) },
    rows.results || [],
    { isOwner: !!me && me.id === toko.id, baseUrl, hal, perPage, total: Number(jumlah?.n || 0) },
  ));
});

// ---- Pusat Pasar Buku: pesanan + toko + saldo + aktivitas dalam satu halaman ----
app.get('/pasar/saya', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const approved = user.seller_status === 'approved';
  const tab = String(c.req.query('tab') || '').toLowerCase();
  const sub = String(c.req.query('sub') || '');

  // hitungan tab butuh kedua sisi; query dibatasi 60 baris dan hanya kolom yang dipakai.
  const beliRows = await c.env.DB.prepare(
    `SELECT o.id, o.price, o.shipping, o.qris_final_amount, o.status, o.created_at,
            COALESCE(l.title, '(buku sudah dihapus)') AS title, s.pen_name AS seller_name
       FROM orders o LEFT JOIN listings l ON l.id = o.listing_id JOIN users s ON s.id = o.seller_id
      WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT 60`
  ).bind(user.id).all();
  const jualRows = approved ? await c.env.DB.prepare(
    `SELECT o.id, o.price, o.shipping, o.status, o.created_at, o.handed_at,
            COALESCE(l.title, '(buku sudah dihapus)') AS title, b.pen_name AS buyer_name
       FROM orders o LEFT JOIN listings l ON l.id = o.listing_id JOIN users b ON b.id = o.buyer_id
      WHERE o.seller_id = ? ORDER BY o.created_at DESC LIMIT 60`
  ).bind(user.id).all() : { results: [] as any[] };
  const bukuRows = approved ? await c.env.DB.prepare(
    `SELECT id, title, price, status, photos,
            (SELECT COUNT(*) FROM orders o WHERE o.listing_id = listings.id) AS jumlah_pesanan
       FROM listings WHERE seller_id = ? ORDER BY created_at DESC LIMIT 60`
  ).bind(user.id).all() : { results: [] as any[] };

  const saldo = await sellerBalance(c.env.DB, user.id);
  let ledger: any[] = [], wd: any[] = [];
  if (tab === 'saldo') {
    ledger = (await c.env.DB.prepare(
      'SELECT delta, kind, order_id, created_at FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 20'
    ).bind(user.id).all()).results || [];
    wd = (await c.env.DB.prepare(
      'SELECT id, amount, fee, kind, status, method, account, requested_at, paid_at FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC LIMIT 20'
    ).bind(user.id).all()).results || [];
  }

  const akt = await c.env.DB.prepare(
    `SELECT n.id, n.type, n.order_id, n.is_read, n.created_at, u.pen_name AS actor_pen_name, l.title AS order_title
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       LEFT JOIN orders o ON o.id = n.order_id
       LEFT JOIN listings l ON l.id = o.listing_id
      WHERE n.user_id = ? AND n.type LIKE 'order_%'
      ORDER BY n.created_at DESC LIMIT 50`
  ).bind(user.id).all();
  const aktItems = akt.results || [];

  // Tab default: Toko kalau ada pesanan yang harus dikirim, selain itu Pesanan.
  const perluKirim = (jualRows.results || []).filter((o: any) => o.status === 'paid').length;
  // Prioritas: ?tab= → ada yang perlu dikirim → penjual tanpa pembelian → Pesanan.
  // Angka ringkas ala dashboard: GMV (nilai transaksi selesai) & escrow (dana ditahan).
  const agg: any = approved ? await c.env.DB.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'completed' THEN price + shipping ELSE 0 END), 0) AS gmv,
       COALESCE(SUM(CASE WHEN status IN ('paid','handed','disputed')
                         THEN COALESCE(qris_final_amount, price + shipping) ELSE 0 END), 0) AS escrow
     FROM orders WHERE seller_id = ?`
  ).bind(user.id).first() : { gmv: 0, escrow: 0 };
  // "Uangku di mana" versi penjual: dana yang sudah dibayar tapi belum jadi saldo.
  const tahanRows = await c.env.DB.prepare(
    `SELECT id, price, shipping, qris_final_amount, status, updated_at FROM orders
      WHERE ${approved ? 'seller_id' : 'buyer_id'} = ? AND status IN ('paid','handed','disputed')
      ORDER BY updated_at DESC LIMIT 20`
  ).bind(user.id).all();
  const belumPernahBeli = (beliRows.results || []).length === 0;
  const tabFinal = tab || (approved && (perluKirim > 0 || belumPernahBeli) ? 'toko' : 'pesanan');

  return c.html(renderPasarSaya(user, tabFinal, sub, {
    pesanan: { orders: beliRows.results || [], sub },
    toko: { orders: jualRows.results || [], listings: bukuRows.results || [], gmv: Number(agg?.gmv || 0), escrow: Number(agg?.escrow || 0) },
    saldo: { balance: saldo, ledger, withdrawals: wd, ditahan: tahanRows.results || [] },
    aktivitas: { items: aktItems, unread: aktItems.filter((n: any) => !n.is_read).length },
  }));
});

app.get('/pasar/:id', async (c) => {
  const user = await getAuthUser(c);
  const owner = isOwner(c.env, user);
  const p: any = await c.env.DB.prepare(
    owner ? 'SELECT * FROM listings WHERE id = ?' : "SELECT * FROM listings WHERE id = ? AND status != 'hidden'"
  ).bind(c.req.param('id')).first();
  if (!p) return c.notFound();
  const seller: any = await c.env.DB.prepare(
    'SELECT pen_name, display_name, city, avatar_key, shop_name, shop_slug, seller_status FROM users WHERE id = ?'
  ).bind(p.seller_id).first();
  if (!seller) return c.notFound();
  return c.html(renderListingDetail(user, p, seller, owner));
});

// ---- Order: kwitansi → QRIS → webhook → serah → selesai ----
// State: created → paid → handed → completed | expired | disputed
const ORDER_EXPIRE_MIN = 48 * 60;      // created tanpa bayar 48 jam → expired (cron)
const AUTO_COMPLETE_DAYS = 5;          // handed + diam D+5 → auto completed (cron)


// Notifikasi order: satu helper, dipanggil dari semua transisi status.
async function notifyOrder(db: any, opts: { userId: string; actorId: string; type: string; orderId: string | null }) {
  if (!opts.userId || !opts.actorId || opts.userId === opts.actorId) return; // jangan notif diri sendiri
  try {
    await db.prepare('INSERT INTO notifications (id, user_id, actor_id, type, order_id) VALUES (?,?,?,?,?)')
      .bind(crypto.randomUUID(), opts.userId, opts.actorId, opts.type, opts.orderId).run();
  } catch (e) {
    console.error('notifyOrder gagal', opts.type, String(e)); // notifikasi tidak boleh menggagalkan transaksi
  }
}

async function logOrderEvent(db: any, orderId: string, actor: string, fromSt: string | null, toSt: string, note?: string) {
  await db.prepare('INSERT INTO order_events (order_id, actor, from_st, to_st, note) VALUES (?,?,?,?,?)')
    .bind(orderId, actor, fromSt, toSt, note || null).run();
}

app.get('/pasar/:id/beli', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const p: any = await c.env.DB.prepare("SELECT * FROM listings WHERE id = ? AND status = 'active'")
    .bind(c.req.param('id')).first();
  if (!p) return c.notFound();
  if (p.seller_id === user.id) return c.redirect(`/pasar/${p.id}`);
  const addr = await c.env.DB.prepare(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 5'
  ).bind(user.id).all();
  return c.html(renderCheckoutPage(user, p, await sellerBalance(c.env.DB, user.id), addr.results || []));
});

app.post('/api/pasar/orders', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Body tidak valid' }, 400);
  // Kwitansi Rekber: kesepakatan wajib — ini satu-satunya "form", pengiriman bukan urusan platform.
  const kesepakatan = String(body.kesepakatan || '').trim().slice(0, 500);
  if (kesepakatan.length < 10) return c.json({ error: 'Tuliskan kesepakatan minimal 10 karakter' }, 400);

  const p: any = await c.env.DB.prepare("SELECT * FROM listings WHERE id = ? AND status = 'active'")
    .bind(String(body.listing_id || '')).first();
  if (!p) return c.json({ error: 'Listing tidak tersedia' }, 404);
  if (p.seller_id === me.id) return c.json({ error: 'Tidak bisa membeli barang sendiri' }, 400);

  // satu order aktif per listing: kalau ada created/paid yang masih hidup, tolak
  const live: any = await c.env.DB.prepare(
    "SELECT id FROM orders WHERE listing_id = ? AND status IN ('created','paid','handed') LIMIT 1"
  ).bind(p.id).first();
  if (live) return c.json({ error: 'Ada pesanan aktif untuk buku ini. Coba lagi nanti.' }, 409);

  // Ongkir: harga TIDAK dipercaya dari klien — kuotasi ulang di server lalu samakan.
  const destId = String(body.dest_id || '').trim();
  const destName = String(body.dest_name || '').trim().slice(0, 120);
  const destAddress = String(body.dest_address || '').trim().slice(0, 300);
  const courierCode = String(body.courier || '').trim().toLowerCase();
  const service = String(body.service || '').trim().toUpperCase().slice(0, 20);
  const claimedShipping = Number(body.shipping);
  if (!destId) return c.json({ error: 'Pilih kecamatan tujuan pengiriman' }, 400);
  if (destAddress.length < 10) return c.json({ error: 'Tulis alamat lengkap minimal 10 karakter' }, 400);
  if (!courierCode || !service) return c.json({ error: 'Pilih layanan pengiriman' }, 400);

  // Data penerima: wajib — tanpa nama & HP, kurir tidak bisa mengantar.
  const receiverName = String(body.receiver_name || '').trim().slice(0, 60);
  const receiverPhone = normalisasiHp(String(body.receiver_phone || ''));
  const postalCode = String(body.postal_code || '').replace(/[^0-9]/g, '').slice(0, 5);
  const cekPenerima = validasiPenerima({ name: receiverName, phone: receiverPhone, postal: postalCode });
  if (!cekPenerima.ok) return c.json({ error: cekPenerima.error }, 400);

  const seller: any = await c.env.DB.prepare('SELECT district_id FROM users WHERE id = ?').bind(p.seller_id).first();
  if (!seller?.district_id) return c.json({ error: 'Penjual belum menetapkan kota asal' }, 409);
  let sellerCouriers: string[] = [];
  try { sellerCouriers = JSON.parse(p.couriers || '[]'); } catch { sellerCouriers = []; }
  const quote = await cekTarifOngkir(c.env, {
    couriers: sellerCouriers, origin: seller.district_id, destination: destId, weightG: Number(p.weight_g || 1000),
  });
  if (!quote.ok) return c.json({ error: quote.error || 'Tarif pengiriman tidak tersedia' }, 503);
  const picked = quote.options.find((o) => o.courier === courierCode && o.service === service);
  if (!picked) return c.json({ error: 'Layanan pengiriman tidak tersedia untuk rute ini' }, 409);
  if (Number.isSafeInteger(claimedShipping) && claimedShipping !== picked.price) {
    return c.json({ error: `Ongkir berubah menjadi ${picked.price}. Ulangi pemesanan.` }, 409);
  }
  const shipping = picked.price;

  const id = crypto.randomUUID();
  const qrisOrderId = `BBR-${id.slice(0, 8)}-${Date.now()}`;
  const total = Number(p.price) + shipping;

  // Bayar pakai saldo: hanya boleh kalau saldo MENUTUP SELURUH tagihan (harga + ongkir).
  // Tidak ada pembayaran campuran — supaya refund tidak perlu dibelah.
  if (body.use_saldo === true) {
    const saldo = await sellerBalance(c.env.DB, me.id);
    if (saldo < total) {
      return c.json({ error: `Saldo ${saldo.toLocaleString('id-ID')} tidak cukup untuk tagihan ${total.toLocaleString('id-ID')}. Bayar penuh dengan QRIS.` }, 409);
    }
    const r = await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO orders (id, listing_id, buyer_id, seller_id, price, shipping, status, kesepakatan,
           qris_final_amount, paid_with, courier_code, courier_name, service, eta,
           dest_district_id, dest_district_name, dest_address, receiver_name, receiver_phone, postal_code)
         SELECT ?,?,?,?,?,?,'paid',?,?,'saldo',?,?,?,?,?,?,?,?,?,?
         WHERE ? <= (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE user_id = ?)
                  - (SELECT COALESCE(SUM(amount + fee),0) FROM withdrawals WHERE user_id = ? AND status = 'requested')`
      ).bind(id, p.id, me.id, p.seller_id, p.price, shipping, kesepakatan, total,
        picked.courier, picked.courierName, picked.service, picked.eta, destId, destName || null, destAddress,
        receiverName, receiverPhone, postalCode, total, me.id, me.id),
      // Potong saldo sekali saja (NOT EXISTS = idempoten kalau request diulang).
      c.env.DB.prepare(
        `INSERT INTO ledger (user_id, order_id, delta, kind)
         SELECT buyer_id, id, -qris_final_amount, 'purchase' FROM orders
          WHERE id = ? AND status = 'paid'
            AND NOT EXISTS (SELECT 1 FROM ledger WHERE order_id = ? AND kind = 'purchase')`
      ).bind(id, id),
      c.env.DB.prepare("UPDATE listings SET status = 'sold' WHERE id = ? AND status = 'active'").bind(p.id),
      c.env.DB.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) VALUES (?,?,?,?,?)")
        .bind(id, 'buyer', null, 'created', 'Dibayar penuh dengan saldo'),
    ]);
    if ((r[0].meta?.changes || 0) === 0) return c.json({ error: 'Saldo tidak cukup untuk tagihan ini' }, 409);
    await logOrderEvent(c.env.DB, id, 'system', 'created', 'paid', 'Pembayaran saldo terverifikasi');
    await notifyOrder(c.env.DB, { userId: p.seller_id, actorId: me.id, type: 'order_paid', orderId: id });
    return c.json({ ok: true, id, paid_with: 'saldo' });
  }

  const qris = await createQrisTransaction(c.env as unknown as KlikQrisEnv, {
    orderId: qrisOrderId, amount: total, description: `Pasar Buku: ${p.title.slice(0, 60)}`,
  });
  if (!qris.ok) return c.json({ error: qris.error || 'Gagal menyiapkan pembayaran' }, 502);

  try {
    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO orders (id, listing_id, buyer_id, seller_id, price, shipping, status, kesepakatan,
           qris_order_id, qris_signature, qris_url, qris_final_amount, qris_expired_at,
           courier_code, courier_name, service, eta, dest_district_id, dest_district_name, dest_address,
           receiver_name, receiver_phone, postal_code)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(id, p.id, me.id, p.seller_id, p.price, shipping, 'created', kesepakatan,
        qrisOrderId, qris.signature || null, qris.qrisUrl || null, qris.finalAmount || total, qris.expiredAt || null,
        picked.courier, picked.courierName, picked.service, picked.eta, destId, destName || null, destAddress,
        receiverName, receiverPhone, postalCode),
      c.env.DB.prepare('INSERT INTO order_events (order_id, actor, from_st, to_st, note) VALUES (?,?,?,?,?)')
        .bind(id, 'buyer', null, 'created', `Kwitansi dibuat oleh ${me.pen_name}`),
    ]);
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Ada pesanan aktif untuk buku ini. Coba lagi nanti.' }, 409);
    throw e;
  }
  if (body.save_address) {
    const pId = String(body.dest_province_id || '').slice(0, 20) || null;
    const pNm = String(body.dest_province_name || '').slice(0, 120) || null;
    const cId = String(body.dest_city_id || '').slice(0, 20) || null;
    const cNm = String(body.dest_city_name || '').slice(0, 120) || null;
    // Cermin ke users.addr_* (kode lama) + masukkan ke buku alamat kalau belum ada & masih < 5.
    await c.env.DB.prepare(
      `UPDATE users SET addr_receiver = ?, addr_phone = ?, addr_postal = ?, addr_text = ?,
         addr_province_id = ?, addr_province_name = ?, addr_city_id = ?, addr_city_name = ?,
         addr_district_id = ?, addr_district_name = ? WHERE id = ?`
    ).bind(receiverName, receiverPhone, postalCode, destAddress, pId, pNm, cId, cNm,
      destId, destName || null, me.id).run();

    const sama: any = await c.env.DB.prepare(
      'SELECT id FROM addresses WHERE user_id = ? AND district_id = ? AND text = ? LIMIT 1'
    ).bind(me.id, destId, destAddress).first();
    if (!sama) {
      const jml: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?').bind(me.id).first();
      if (Number(jml?.n || 0) < 5) {
        await c.env.DB.batch([
          c.env.DB.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').bind(me.id),
          c.env.DB.prepare(
            `INSERT INTO addresses (id, user_id, label, receiver, phone, postal, text,
               province_id, province_name, city_id, city_name, district_id, district_name, is_default)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1)`
          ).bind(crypto.randomUUID(), me.id, 'Alamat baru', receiverName, receiverPhone, postalCode,
            destAddress, pId, pNm, cId, cNm, destId, destName || null),
        ]);
      }
    }
  }
  return c.json({ ok: true, id });
});

// ---- Nota cetak: stiker pengiriman (8x11,5) & nota pembelian (A5) ----
app.get('/pasar/order/:id/nota', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o) return c.notFound();
  // hanya pembeli & penjual; kwitansi privat
  if (user.id !== o.buyer_id && user.id !== o.seller_id) return c.notFound();

  const p: any = await c.env.DB.prepare('SELECT id, title, author, cond, weight_g FROM listings WHERE id = ?')
    .bind(o.listing_id).first();
  const seller: any = await c.env.DB.prepare('SELECT pen_name, shop_name, city FROM users WHERE id = ?')
    .bind(o.seller_id).first();
  const buyer: any = await c.env.DB.prepare('SELECT pen_name FROM users WHERE id = ?')
    .bind(o.buyer_id).first();

  if (c.req.query('jenis') === 'pengiriman') {
    if (!o.resi) return c.redirect('/pasar/order/' + o.id + '?err=resi');
    return c.html(renderNotaPengiriman(o, p || {}, seller || {}));
  }
  return c.html(renderNotaPembelian(o, p || {}, seller || {}, buyer || {}, user.id === o.buyer_id ? 'pembeli' : 'penjual'));
});

app.get('/pasar/order/:id', async (c) => {
  const user = await getAuthUser(c);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o) return c.notFound();
  // Pembeli, penjual, atau owner (mode periksa) boleh lihat; orang lain 404.
  const adminView = isOwner(c.env, user);
  if (!bolehLihatPesanan(o, user?.id, adminView)) return c.notFound();
  const p: any = await c.env.DB.prepare('SELECT title, photos FROM listings WHERE id = ?').bind(o.listing_id).first();
  if (!p) return c.notFound();
  const ev = await c.env.DB.prepare('SELECT actor, note, to_st, created_at FROM order_events WHERE order_id = ? ORDER BY id').bind(o.id).all();
  o.events = ev.results || [];
  // Bukti foto sengketa (kalau ada) — ditampilkan ke owner dan kedua pihak.
  const bukti = await c.env.DB.prepare(
    'SELECT id, uploader_id, role, note, created_at FROM order_evidence WHERE order_id = ? ORDER BY created_at'
  ).bind(o.id).all().catch(() => ({ results: [] as any[] }));
  o.evidence = bukti.results || [];
  const rv: any = await c.env.DB.prepare('SELECT stars, body FROM reviews WHERE order_id = ?').bind(o.id).first();
  o.review_stars = rv ? Number(rv.stars) : 0;
  o.review_body = rv?.body || '';
  let photos: string[] = [];
  try { photos = JSON.parse(p.photos || '[]'); } catch { photos = []; }
  return c.html(renderOrderPage(o, p, photos, user, adminView));
});

async function reconcileQris(db: any, env: Env, o: any): Promise<{ ok: boolean; paid?: boolean; error?: string }> {
  if (o.status !== 'created') return { ok: true, paid: o.status === 'paid' };
  const provider = await getQrisStatus(env, o.qris_order_id);
  if (!provider.ok) return { ok: false, error: provider.error };
  const expected = Number(o.qris_final_amount || Number(o.price) + Number(o.shipping));
  if (!providerAmountMatches(provider.finalAmount, expected)) return { ok: false, error: 'Nominal status KlikQRIS tidak cocok atau hilang' };
  if (provider.signature && o.qris_signature && provider.signature !== o.qris_signature) return { ok: false, error: 'Signature status KlikQRIS tidak cocok' };
  if (!provider.paid) return { ok: true, paid: false };
  const res = await db.prepare("UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE id = ? AND status = 'created'").bind(o.id).run();
  if ((res.meta?.changes || 0) > 0) {
    await logOrderEvent(db, o.id, 'system', 'created', 'paid', 'Status KlikQRIS terverifikasi');
    await db.prepare("UPDATE listings SET status = 'sold' WHERE id = ? AND status = 'active'").bind(o.listing_id).run();
    await notifyOrder(db, { userId: o.seller_id, actorId: o.buyer_id, type: 'order_paid', orderId: o.id });
  }
  return { ok: true, paid: true };
}

app.get('/api/pasar/orders/:id/status', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || (o.buyer_id !== me.id && o.seller_id !== me.id)) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (o.status === 'created') {
    const r = await reconcileQris(c.env.DB, c.env, o);
    if (!r.ok) return c.json({ ok: false, status: o.status, error: r.error }, 502);
    if (r.paid) o.status = 'paid';
  }
  return c.json({ ok: true, status: o.status });
});

// Webhook hanya trigger; status API provider tetap sumber kebenaran.
app.post('/api/klikqris/webhook', async (c) => {
  const body: any = await c.req.json().catch(() => null);
  if (!body) return c.json({ ok: false }, 400);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE qris_order_id = ?').bind(String(body.order_id || '')).first();
  if (!o) return c.json({ ok: false, error: 'order tak dikenal' }, 404);
  if (o.status !== 'created') return c.json({ ok: true, note: 'sudah diproses' });
  const v = verifyWebhook(body, { qris_order_id: o.qris_order_id, qris_signature: o.qris_signature, final_amount: Number(o.qris_final_amount || Number(o.price) + Number(o.shipping)) });
  if (!v.ok) return c.json({ ok: false, error: v.error }, 400);
  const r = await reconcileQris(c.env.DB, c.env, o);
  if (!r.ok) return c.json({ ok: false, error: r.error }, 409);
  if (!r.paid) return c.json({ ok: false, error: 'Pembayaran belum terkonfirmasi provider' }, 409);
  return c.json({ ok: true });
});

const KURIR_MAP: Record<string, string> = { 'JNE': 'jne', 'J&T': 'jnt', 'SiCepat': 'sicepat', 'POS': 'pos', 'TIKI': 'tiki', 'AnterAja': 'anteraja' };

// Penjual tandai serah: mode "cod" (COD/antar/kurir sendiri) atau "ekspedisi"
// (kurir + resi WAJIB → bukti trackable pembeli + admin). Guard WHERE status='paid' (idempoten).
// Daftar kurir + URL lacak = TRACK_URLS di src/web/pasar.ts (satu sumber).
// Pembeli membatalkan pesanan yang belum dibayar (stok belum terkunci).
app.post('/api/pasar/order/:id/cancel', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare(
    'SELECT id, buyer_id, seller_id, listing_id, status, paid_with, qris_final_amount, price, shipping FROM orders WHERE id = ?'
  ).bind(c.req.param('id')).first();
  if (!o || o.buyer_id !== me.id) return c.json({ error: 'Pesanan tidak ditemukan' }, 404);

  // Belum dibayar: batal tanpa uang berpindah.
  if (o.status === 'created') {
    const res = await c.env.DB.prepare(
      "UPDATE orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND status = 'created'"
    ).bind(o.id).run();
    if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Pesanan sudah berubah status' }, 409);
    await c.env.DB.prepare("UPDATE listings SET status = 'active' WHERE id = ? AND status = 'sold'").bind(o.listing_id).run();
    await logOrderEvent(c.env.DB, o.id, 'buyer', 'created', 'cancelled', 'Dibatalkan pembeli sebelum dibayar');
    return c.json({ ok: true });
  }

  // Sudah dibayar, penjual BELUM serahkan: boleh batal, tapi uang harus kembali.
  if (o.status === 'paid') {
    if (o.paid_with !== 'saldo') {
      return c.json({ error: 'Pembayaran QRIS harus lewat sengketa supaya dana bisa dikembalikan owner' }, 409);
    }
    const nominal = Number(o.qris_final_amount || (Number(o.price) + Number(o.shipping || 0)));
    const res = await c.env.DB.batch([
      c.env.DB.prepare(
        "UPDATE orders SET status = 'cancelled', resolution_note = ?, updated_at = datetime('now') WHERE id = ? AND status = 'paid' AND paid_with = 'saldo'"
      ).bind('Dibatalkan pembeli sebelum dikirim — saldo dikembalikan', o.id),
      // Kembalikan saldo, sekali saja (NOT EXISTS = idempoten).
      c.env.DB.prepare(
        `INSERT INTO ledger (user_id, order_id, delta, kind)
         SELECT buyer_id, id, qris_final_amount, 'refund' FROM orders
          WHERE id = ? AND status = 'cancelled'
            AND NOT EXISTS (SELECT 1 FROM ledger WHERE order_id = ? AND kind = 'refund')`
      ).bind(o.id, o.id),
      c.env.DB.prepare("UPDATE listings SET status = 'active' WHERE id = ? AND status = 'sold'").bind(o.listing_id),
      c.env.DB.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) VALUES (?,?,?,?,?)")
        .bind(o.id, 'buyer', 'paid', 'cancelled', 'Dibatalkan pembeli sebelum dikirim — saldo dikembalikan'),
    ]);
    if ((res[0].meta?.changes || 0) === 0) return c.json({ error: 'Pesanan sudah berubah status' }, 409);
    await notifyOrder(c.env.DB, { userId: o.seller_id, actorId: me.id, type: 'order_cancel', orderId: o.id });
    return c.json({ ok: true, refunded: nominal });
  }

  return c.json({ error: 'Pesanan sudah dikirim — pakai tombol Ada Masalah' }, 409);
});

// Ulasan hanya dari pembeli, hanya setelah selesai, sekali per pesanan (UNIQUE order_id).
app.post('/api/pasar/order/:id/review', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT id, buyer_id, seller_id, listing_id, status FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || o.buyer_id !== me.id) return c.json({ error: 'Pesanan tidak ditemukan' }, 404);
  if (o.status !== 'completed') return c.json({ error: 'Ulasan bisa ditulis setelah pesanan selesai' }, 409);
  const body: any = await c.req.json().catch(() => ({}));
  const stars = Number(body?.stars || 0);
  if (!(stars >= 1 && stars <= 5)) return c.json({ error: 'Pilih bintang 1–5' }, 400);
  const teks = String(body?.body || '').trim().slice(0, 300);
  try {
    await c.env.DB.prepare(
      'INSERT INTO reviews (id, order_id, listing_id, seller_id, buyer_id, stars, body) VALUES (?,?,?,?,?,?,?)'
    ).bind(crypto.randomUUID(), o.id, o.listing_id, o.seller_id, me.id, stars, teks || null).run();
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Pesanan ini sudah kamu ulas' }, 409);
    throw e;
  }
  return c.json({ ok: true });
});

app.post('/pasar/order/:id/handover', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => ({}));
  const mode = body?.mode === 'ekspedisi' ? 'ekspedisi' : 'cod';
  let note = String(body?.note || '').trim().slice(0, 200);
  let kurir: string | null = null, resi: string | null = null;
  let resiVerified = 0;
  if (mode === 'ekspedisi') {
    kurir = String(body?.kurir || '').trim().slice(0, 40);
    resi = String(body?.resi || '').trim().slice(0, 60);
    if (!kurir || !resi) return c.json({ error: 'Kirim via ekspedisi wajib isi nama kurir + nomor resi' }, 400);
    const fmt = validasiFormatResi(resi);
    if (!fmt.ok) return c.json({ error: fmt.error }, 400);
    note = `Dikirim via ${kurir} — resi ${resi}`;
  } else if (!note) note = 'Penjual menandai sudah diserahkan';
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || o.seller_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  // Guard status lebih dulu: jangan memakai kuota verifikasi resi / panggilan BinderByte
  // untuk pesanan yang memang belum bisa diserahkan.
  if (o.status !== 'paid') return c.json({ error: 'Pesanan tidak dalam status dibayar' }, 409);

  if (mode === 'ekspedisi') {
    // Rate limit: maksimum 5 percobaan resi per jam per pesanan (cegah tebak-tebakan nomor).
    const withinHour = o.resi_try_at && (Date.now() - new Date(String(o.resi_try_at).replace(' ', 'T') + 'Z').getTime()) < 3600_000;
    const tries = (withinHour ? Number(o.resi_tries || 0) : 0) + 1;
    if (tries > 5) return c.json({ error: 'Terlalu banyak percobaan nomor resi. Coba lagi 1 jam lagi.' }, 429);
    await c.env.DB.prepare("UPDATE orders SET resi_tries = ?, resi_try_at = datetime('now') WHERE id = ?").bind(tries, o.id).run();

    // Verifikasi ke kurir SEKARANG, bukan menunggu cron 24 jam.
    const cek = await cekResi(c.env, KURIR_MAP[kurir!] || 'jne', resi!);
    if (cek.kind === 'notfound') {
      return c.json({ error: `Nomor resi tidak terdaftar di ${kurir}. Periksa kembali nomor dari kurir.` }, 400);
    }
    // kind='error' → gangguan API: terima tapi tandai belum terverifikasi; auto-selesai ditahan.
    resiVerified = cek.kind === 'found' ? 1 : 0;
  }

  let res: any;
  try {
    res = await c.env.DB.prepare(
      "UPDATE orders SET status = 'handed', handed_at = datetime('now'), kurir = ?, resi = ?, resi_verified = ?, resi_checked_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status = 'paid'"
    ).bind(kurir, resi, resiVerified, o.id).run();
  } catch (e: any) {
    // unique index (kurir, resi) → resi sudah dipakai pesanan lain
    if (/UNIQUE/i.test(String(e?.message || ''))) return c.json({ error: 'Nomor resi ini sudah dipakai pesanan lain' }, 409);
    throw e;
  }
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Pesanan tidak dalam status dibayar' }, 409);
  const noteFinal = mode === 'ekspedisi' && resiVerified === 0 ? `${note} (belum terverifikasi kurir, dicek ulang otomatis)` : note;
  await logOrderEvent(c.env.DB, o.id, 'seller', 'paid', 'handed', noteFinal);
  await notifyOrder(c.env.DB, { userId: o.buyer_id, actorId: o.seller_id, type: 'order_handed', orderId: o.id });
  return c.json({ ok: true });
});

// Cek status resi live (BinderByte) — pembeli/penjual pada order sendiri. Guard: handed+resi.
// KURIR_MOCK utk dev/test; BINDERBYTE_KEY prod. Fallback selalu "Buka Web Kurir".
app.post('/pasar/order/:id/track', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  // owner ikut boleh: dia yang memutus sengketa, butuh melihat perjalanan paket
  if (!o || (o.buyer_id !== me.id && o.seller_id !== me.id && !isOwner(c.env, me))) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (!o.kurir || !o.resi) return c.json({ error: 'Resi belum tercatat' }, 409);
  const r = await cekResi(c.env, KURIR_MAP[o.kurir] || 'jne', o.resi);
  if (r.kind === 'found' && !o.resi_verified) {
    await c.env.DB.prepare("UPDATE orders SET resi_verified = 1, resi_checked_at = datetime('now') WHERE id = ? AND resi_verified = 0").bind(o.id).run();
  }
  return c.json(r.ok ? { ok: true, status: r.status, desc: r.desc, history: r.history } : { ok: false, kind: r.kind, error: r.error });
});

// Pembeli klik "Pesanan Diterima" → completed + kredit saldo penjual (fee 5000 dipotong),
// ongkir utuh ke penjual. Guard WHERE status='handed' = idempoten.
app.post('/pasar/order/:id/receive', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || o.buyer_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (o.status !== 'handed') return c.json({ error: 'Pesanan belum ditandai diserahkan penjual' }, 409);

  const money = settlementAmounts(o.price, o.shipping, PASAR_FEE);
  let settled: any[];
  try {
    settled = await c.env.DB.batch([
      c.env.DB.prepare("UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ? AND status = 'handed'").bind(o.id),
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.sale, 'sale', o.id),
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.fee, 'fee', o.id),
      c.env.DB.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? FROM orders WHERE id = ? AND status = 'completed'")
        .bind(o.id, 'buyer', 'handed', 'completed', 'Pembeli konfirmasi terima', o.id),
    ]);
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Pesanan sudah diselesaikan' }, 409);
    throw e;
  }
  if (!(settled[0].meta?.changes || 0)) return c.json({ error: 'Pesanan sudah diselesaikan' }, 409);
  await notifyOrder(c.env.DB, { userId: o.seller_id, actorId: o.buyer_id, type: 'order_done', orderId: o.id });
  return c.json({ ok: true });
});

// Pembeli lapor sengketa
app.post('/pasar/order/:id/dispute', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => null);
  const note = String(body?.note || '').trim().slice(0, 500);
  if (note.length < 10) return c.json({ error: 'Ceritakan masalah minimal 10 karakter' }, 400);
  const o: any = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(c.req.param('id')).first();
  if (!o || (o.buyer_id !== me.id && o.seller_id !== me.id)) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (!['paid', 'handed'].includes(o.status)) return c.json({ error: 'Status tidak bisa disengketakan' }, 409);

  const res = await c.env.DB.prepare(
    "UPDATE orders SET status = 'disputed', updated_at = datetime('now') WHERE id = ? AND status = ?"
  ).bind(o.id, o.status).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ ok: true });
  await logOrderEvent(c.env.DB, o.id, me.id === o.buyer_id ? 'buyer' : 'seller', o.status, 'disputed', note);
  await notifyOrder(c.env.DB, {
    userId: me.id === o.buyer_id ? o.seller_id : o.buyer_id,
    actorId: me.id, type: 'order_dispute', orderId: o.id,
  });
  return c.json({ ok: true });
});

// ---- Saldo penjual: lihat, tarik (min 40rb), riwayat ----

const isOwner = (env: Env, u: any): boolean =>
  !!u && !!env.OWNER_EMAIL && String(u.email || '').toLowerCase() === env.OWNER_EMAIL.toLowerCase();

// Saldo = total ledger − pencairan yang masih diproses (belum dipotong di ledger).
async function sellerBalance(db: any, userId: string): Promise<number> {
  const row: any = await db.prepare(
    `SELECT (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE user_id = ?1)
          - (SELECT COALESCE(SUM(amount + fee),0) FROM withdrawals WHERE user_id = ?2 AND status = 'requested') AS bal`
  ).bind(userId, userId).first();
  return Number(row?.bal || 0);
}

app.get('/saldo', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  return c.redirect('/pasar/saya?tab=saldo');
});

// Bukti pencairan: dokumen internal bernomor. Bisa dibuka owner & pemilik saldo.
app.get('/saldo/pencairan/:kode', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.redirect('/login');
  const w: any = await c.env.DB.prepare(
    `SELECT w.*, u.pen_name FROM withdrawals w JOIN users u ON u.id = w.user_id WHERE w.kode = ?`
  ).bind(c.req.param('kode')).first();
  if (!w) return c.notFound();
  const owner = isOwner(c.env, me);
  if (!owner && w.user_id !== me.id) return c.notFound();
  return c.html(renderBuktiPencairan(w, { owner, penName: w.pen_name || '—' }));
});

app.post('/api/saldo/withdraw', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => null);
  const amount = Number(body?.amount);
  const kind: 'seller' | 'buyer' = me.seller_status === 'approved' ? 'seller' : 'buyer';
  const fee = withdrawFee(kind, amount);
  const total = withdrawTotal(kind, amount);
  const method = ['qris', 'bank', 'ewallet'].includes(body?.method) ? body.method : 'qris';
  const account = String(body?.account || '').trim().slice(0, 120);
  if (!Number.isSafeInteger(amount) || amount < WITHDRAW_MIN) {
    return c.json({ error: `Minimal tarik Rp${WITHDRAW_MIN.toLocaleString('id-ID')}` }, 400);
  }
  if (account.length < 4) return c.json({ error: 'Tulis tujuan pencairan (no. QRIS/rekening/e-wallet)' }, 400);
  // Anti-banjir antrean: satu pengajuan aktif, maksimal 3 pengajuan per 24 jam.
  const akt: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM withdrawals WHERE user_id = ? AND status = 'requested'"
  ).bind(me.id).first();
  if (Number(akt?.n || 0) > 0) return c.json({ error: 'Masih ada pengajuan yang diproses owner. Tunggu sampai selesai.' }, 409);
  const hr: any = await c.env.DB.prepare(
    "SELECT COUNT(*) AS n FROM withdrawals WHERE user_id = ? AND requested_at > datetime('now','-1 day')"
  ).bind(me.id).first();
  if (Number(hr?.n || 0) >= 3) return c.json({ error: 'Batas 3 pengajuan pencairan per 24 jam. Coba lagi besok.' }, 429);

  const id = crypto.randomUUID();
  // Nomor bukti: dipakai owner & penjual untuk merujuk pencairan ini (bukan UUID).
  const acak = [...crypto.getRandomValues(new Uint8Array(3))].map((b) => b.toString(36)).join('');
  const kode = kodePencairan(new Date(), acak);
  // Cek saldo menyatu di statement INSERT: double-tap tak bisa bikin saldo minus.
  // Reservasi = jumlah ditarik + biaya, supaya biaya tidak bisa dipakai dua kali.
  const res = await c.env.DB.prepare(
    `INSERT INTO withdrawals (id, user_id, amount, fee, kind, method, account, status, kode)
     SELECT ?,?,?,?,?,?,?, 'requested', ?
     WHERE ? <= (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE user_id = ?)
              - (SELECT COALESCE(SUM(amount + fee),0) FROM withdrawals WHERE user_id = ? AND status = 'requested')`
  ).bind(id, me.id, amount, fee, kind, method, account, kode, total, me.id, me.id).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Saldo tidak cukup untuk jumlah + biaya tarik' }, 409);
  return c.json({ ok: true, id, kode, fee, net: amount });
});

// ---- Pesanan pembeli ----
// Halaman lama → satu pintu hub (302, tautan & bookmark lama tetap hidup).
app.get('/pesanan', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  const sub = c.req.query('tab') || 'bayar';
  return c.redirect(`/pasar/saya?tab=pesanan&sub=${encodeURIComponent(sub)}`);
});

// ---- Kelola ketersediaan buku (1 buku = 1 listing; tanpa stok) ----
app.patch('/api/pasar/listings/:id', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => ({}));
  const title = String(body?.title || '').trim().slice(0, 120);
  const price = Number(body?.price || 0);
  const cond = ['baru', 'bekas_bagus', 'bekas_layak'].includes(String(body?.cond)) ? String(body.cond) : '';
  if (title.length < 3) return c.json({ error: 'Judul minimal 3 karakter' }, 400);
  if (!(price >= 1000 && price <= 50_000_000)) return c.json({ error: 'Harga harus Rp1.000–Rp50.000.000' }, 400);
  if (!cond) return c.json({ error: 'Kondisi buku tidak dikenal' }, 400);

  const l: any = await c.env.DB.prepare('SELECT id, seller_id, status FROM listings WHERE id = ?').bind(c.req.param('id')).first();
  if (!l || l.seller_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (l.status === 'sold') return c.json({ error: 'Buku sudah terjual — tidak bisa diubah' }, 409);

  await c.env.DB.prepare('UPDATE listings SET title = ?, price = ?, cond = ? WHERE id = ?')
    .bind(title, Math.round(price), cond, l.id).run();
  return c.json({ ok: true });
});

// Laporan listing: satu per orang per buku, tidak boleh melaporkan milik sendiri.
app.post('/api/pasar/listings/:id/report', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => ({}));
  const reason = ['mismatch', 'fraud', 'misleading', 'price', 'other'].includes(String(body?.reason)) ? String(body.reason) : 'other';
  const note = String(body?.note || '').trim().slice(0, 300);
  const l: any = await c.env.DB.prepare("SELECT id, seller_id, status FROM listings WHERE id = ? AND status != 'hidden'")
    .bind(c.req.param('id')).first();
  if (!l) return c.json({ error: 'Buku tidak ditemukan' }, 404);
  if (l.seller_id === me.id) return c.json({ error: 'Tidak bisa melaporkan buku sendiri' }, 400);
  try {
    await c.env.DB.prepare(
      'INSERT INTO listing_reports (id, listing_id, reporter_id, reason, note) VALUES (?,?,?,?,?)'
    ).bind(crypto.randomUUID(), l.id, me.id, reason, note || null).run();
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Kamu sudah melaporkan buku ini' }, 409);
    throw e;
  }
  return c.json({ ok: true });
});

app.post('/api/pasar/listings/:id/status', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  const body: any = await c.req.json().catch(() => null);
  const next = body?.status === 'hidden' ? 'hidden' : body?.status === 'active' ? 'active' : null;
  if (!next) return c.json({ error: 'Status tidak dikenal' }, 400);

  const l: any = await c.env.DB.prepare('SELECT id, seller_id, status FROM listings WHERE id = ?')
    .bind(c.req.param('id')).first();
  if (!l || l.seller_id !== me.id) return c.json({ error: 'Tidak ditemukan' }, 404);
  if (l.status === 'sold') return c.json({ error: 'Buku sudah terjual — tidak bisa diubah' }, 409);

  const live: any = await c.env.DB.prepare(
    "SELECT id FROM orders WHERE listing_id = ? AND status IN ('created','paid','handed') LIMIT 1"
  ).bind(l.id).first();
  if (live) return c.json({ error: 'Ada pesanan berjalan untuk buku ini' }, 409);

  await c.env.DB.prepare('UPDATE listings SET status = ? WHERE id = ?').bind(next, l.id).run();
  return c.json({ ok: true, status: next });
});

// ---- Dashboard penjual (hanya yang sudah approved) ----
app.get('/toko', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  // Belum terverifikasi → halaman verifikasi (satu pintu, tidak ada dashboard kosong).
  if (user.seller_status !== 'approved') return c.redirect('/pasar/jual');
  const sub = c.req.query('tab') || 'perlu';
  return c.redirect(`/pasar/saya?tab=toko&sub=${encodeURIComponent(sub)}`);
});

// ---- Verifikasi penjual: ajukan → owner review ----
app.post('/api/pasar/seller/apply', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.json({ error: 'Harus masuk dulu' }, 401);
  if (me.seller_status === 'approved') return c.json({ error: 'Akun sudah terverifikasi' }, 409);
  if (me.seller_status === 'pending') return c.json({ error: 'Pengajuan masih ditinjau owner' }, 409);

  const body: any = await c.req.json().catch(() => null);
  const fullName = String(body?.full_name || '').trim().slice(0, 80);
  const phone = String(body?.phone || '').replace(/\D/g, '').slice(0, 15);
  const note = String(body?.note || '').trim().slice(0, 300);
  const shopName = String(body?.shop_name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
  const bankName = String(body?.bank_name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const bankAccount = String(body?.bank_account || '').replace(/[^0-9]/g, '').slice(0, 20);
  if (fullName.length < 3) return c.json({ error: 'Nama lengkap minimal 3 karakter' }, 400);
  if (!/^0?8\d{8,13}$/.test(phone)) return c.json({ error: 'Nomor WhatsApp tidak valid' }, 400);
  if (shopName.length < 2) return c.json({ error: 'Nama toko minimal 2 karakter' }, 400);
  if (bankName.length < 3) return c.json({ error: 'Isi nama pemilik rekening/QRIS (min 3 karakter)' }, 400);
  if (bankAccount.length < 8) return c.json({ error: 'Nomor rekening/QRIS minimal 8 angka' }, 400);
  // Owner memverifikasi manual: tanpa foto KTP & buku tabungan, pengajuan tidak bisa dinilai.
  const docs: any = await c.env.DB.prepare('SELECT COUNT(*) AS n FROM seller_docs WHERE user_id = ?').bind(me.id).first();
  if (Number(docs?.n || 0) < 2) return c.json({ error: 'Unggah foto KTP dan buku tabungan dulu' }, 400);
  const dipakai: any = await c.env.DB.prepare(
    'SELECT 1 FROM users WHERE shop_name = ? COLLATE NOCASE AND id != ? LIMIT 1'
  ).bind(shopName, me.id).first();
  if (dipakai) return c.json({ error: 'Nama toko sudah dipakai, pilih yang lain' }, 409);

  // Guard status di WHERE: double-submit tidak menimpa pengajuan yang sudah diproses owner.
  const res = await c.env.DB.prepare(
    `UPDATE users SET seller_status='pending', seller_full_name=?, seller_phone=?, seller_note=?, shop_name=?,
       seller_bank_name=?, seller_bank_account=?,
       seller_applied_at=datetime('now'), seller_reject_reason=NULL
     WHERE id=? AND seller_status IN ('none','rejected')`
  ).bind(fullName, phone, note || null, shopName, bankName, bankAccount, me.id).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Pengajuan tidak bisa dikirim sekarang' }, 409);
  return c.json({ ok: true });
});

// ---- Owner: putuskan sengketa + cairkan saldo ----
app.get('/owner', async (c) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.notFound(); // jangan bocorkan keberadaan halaman
  const disp = await c.env.DB.prepare(
    `SELECT o.*, l.title, s.pen_name AS seller_name, b.pen_name AS buyer_name
     FROM orders o
     JOIN listings l ON l.id = o.listing_id
     JOIN users s ON s.id = o.seller_id
     JOIN users b ON b.id = o.buyer_id
     WHERE o.status = 'disputed' ORDER BY o.updated_at DESC LIMIT 50`
  ).all();
  const wd = await c.env.DB.prepare(
    `SELECT w.*, u.pen_name FROM withdrawals w JOIN users u ON u.id = w.user_id
     WHERE w.status = 'requested' ORDER BY w.requested_at ASC LIMIT 50`
  ).all();
  const calon = await c.env.DB.prepare(
    `SELECT u.id, u.pen_name, u.email, u.city, u.seller_full_name, u.seller_phone, u.seller_note, u.shop_name, u.seller_applied_at,
            u.seller_bank_name, u.seller_bank_account,
            (SELECT COUNT(*) FROM seller_docs d WHERE d.user_id = u.id AND d.kind = 'ktp') AS doc_ktp,
            (SELECT COUNT(*) FROM seller_docs d WHERE d.user_id = u.id AND d.kind = 'bank') AS doc_bank,
            (SELECT COUNT(*) FROM listings l WHERE l.seller_id = u.id AND l.status = 'active') AS listing_aktif
       FROM users u WHERE u.seller_status = 'pending' ORDER BY u.seller_applied_at ASC LIMIT 50`
  ).all();

  // ponytail: query per kartu (maks 50 antrean) — cukup untuk volume UMKM.
  // Gold-plating: satu query agregat kalau antrean sampai ratusan.
  const disputes = disp.results || [];
  for (const o of disputes as any[]) {
    const ev = await c.env.DB.prepare(
      'SELECT actor, from_st, to_st, note, created_at FROM order_events WHERE order_id = ? ORDER BY id'
    ).bind(o.id).all();
    o.events = ev.results || [];
    const bukti = await c.env.DB.prepare(
      'SELECT id, uploader_id, role, note, created_at FROM order_evidence WHERE order_id = ? ORDER BY created_at'
    ).bind(o.id).all();
    o.evidence = bukti.results || [];
    const bs = await c.env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM orders WHERE buyer_id = ? AND status = 'completed') AS selesai,
              (SELECT COUNT(*) FROM orders WHERE buyer_id = ? AND status IN ('disputed','refunded')) AS sengketa,
              (SELECT MIN(created_at) FROM users WHERE id = ?) AS sejak`
    ).bind(o.buyer_id, o.buyer_id, o.buyer_id).first();
    o.buyer_stats = bs || {};
    const ss = await c.env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM orders WHERE seller_id = ? AND status = 'completed') AS selesai,
              (SELECT COUNT(*) FROM orders WHERE seller_id = ? AND status IN ('disputed','refunded')) AS sengketa,
              (SELECT MIN(created_at) FROM users WHERE id = ?) AS sejak`
    ).bind(o.seller_id, o.seller_id, o.seller_id).first();
    o.seller_stats = ss || {};
  }

  const withdrawals = wd.results || [];
  for (const w of withdrawals as any[]) {
    const bal: any = await c.env.DB.prepare(
      `SELECT (SELECT COALESCE(SUM(delta),0) FROM ledger WHERE user_id = ?1)
            - (SELECT COALESCE(SUM(amount),0) FROM withdrawals WHERE user_id = ?2 AND status = 'requested') AS bal`
    ).bind(w.user_id, w.user_id).first();
    w.saldo = Number(bal?.bal || 0);
    const src: any = await c.env.DB.prepare(
      `SELECT kind, COALESCE(SUM(delta),0) AS total FROM ledger WHERE user_id = ? GROUP BY kind`
    ).bind(w.user_id).all();
    w.ledger_ringkas = src.results || [];
    const risk: any = await c.env.DB.prepare(
      `SELECT COUNT(*) AS n FROM orders WHERE seller_id = ? AND status = 'disputed'`
    ).bind(w.user_id).first();
    w.sengketa_aktif = Number(risk?.n || 0);
    const hist: any = await c.env.DB.prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS total FROM withdrawals WHERE user_id = ? AND status = 'paid'`
    ).bind(w.user_id).first();
    w.riwayat_pencairan = { jumlah: Number(hist?.n || 0), total: Number(hist?.total || 0) };
  }

  const audit = await c.env.DB.prepare(
    `SELECT action, target_type, target_id, note, created_at FROM owner_actions ORDER BY created_at DESC LIMIT 25`
  ).all();
  const rep = await c.env.DB.prepare(
    `SELECT r.listing_id, r.reason, r.note, r.created_at, r.reporter_name,
            l.title, l.price, l.status AS listing_status, l.seller_id, s.pen_name AS seller_name,
            (SELECT COUNT(*) FROM listing_reports x WHERE x.listing_id = r.listing_id AND x.status = 'open') AS jumlah,
            (SELECT COUNT(*) FROM orders o WHERE o.seller_id = l.seller_id AND o.status = 'completed') AS trx_selesai,
            (SELECT COUNT(*) FROM orders o WHERE o.seller_id = l.seller_id AND o.status = 'disputed') AS sengketa
       FROM (SELECT lr.*, u.pen_name AS reporter_name FROM listing_reports lr JOIN users u ON u.id = lr.reporter_id
              WHERE lr.status = 'open') r
       JOIN listings l ON l.id = r.listing_id
       JOIN users s ON s.id = l.seller_id
      ORDER BY r.created_at DESC LIMIT 60`
  ).all();
  const laporan: any[] = [];
  const peta = new Map<string, any>();
  for (const r of (rep.results || []) as any[]) {
    let g = peta.get(r.listing_id);
    if (!g) {
      g = { ...r, items: [] };
      peta.set(r.listing_id, g);
      laporan.push(g);
    }
    g.items.push({ reason: r.reason, note: r.note, reporter: r.reporter_name, at: r.created_at });
  }

  const liab: any = await c.env.DB.prepare(
    `SELECT
       (SELECT COALESCE(SUM(delta),0) FROM ledger)
         - (SELECT COALESCE(SUM(amount + fee),0) FROM withdrawals WHERE status = 'requested') AS saldo,
       (SELECT COALESCE(SUM(COALESCE(qris_final_amount, price + shipping)),0) FROM orders
         WHERE status IN ('paid','handed','disputed')) AS escrow,
       (SELECT COALESCE(-SUM(delta),0) FROM ledger WHERE kind = 'fee') AS fee`
  ).first();
  return c.html(renderOwnerPage(disputes, withdrawals, calon.results || [], audit.results || [], {
    saldo: Number(liab?.saldo || 0), escrow: Number(liab?.escrow || 0), fee: Number(liab?.fee || 0),
  }, laporan));
});

// Riwayat akun (read-only) — owner memutuskan berdasarkan rekam jejak, bukan tebakan.
app.get('/owner/akun/:id', async (c) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.notFound();
  const id = c.req.param('id');
  const u: any = await c.env.DB.prepare(
    `SELECT id, email, pen_name, display_name, city, seller_status, shop_name, shop_slug, seller_full_name, seller_phone,
            seller_bank_name, seller_bank_account, seller_reject_reason, seller_applied_at, created_at
       FROM users WHERE id = ?`
  ).bind(id).first();
  if (!u) return c.notFound();

  const [beli, jual, sen, list, ulas, led, saldo] = await Promise.all([
    c.env.DB.prepare(`SELECT o.id, o.status, o.price, o.shipping, o.created_at, l.title, s.pen_name AS lawan
      FROM orders o JOIN listings l ON l.id = o.listing_id JOIN users s ON s.id = o.seller_id
      WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT 15`).bind(id).all(),
    c.env.DB.prepare(`SELECT o.id, o.status, o.price, o.shipping, o.created_at, l.title, b.pen_name AS lawan
      FROM orders o JOIN listings l ON l.id = o.listing_id JOIN users b ON b.id = o.buyer_id
      WHERE o.seller_id = ? ORDER BY o.created_at DESC LIMIT 15`).bind(id).all(),
    c.env.DB.prepare(`SELECT o.id, o.status, o.updated_at, l.title
      FROM orders o JOIN listings l ON l.id = o.listing_id
      WHERE (o.buyer_id = ? OR o.seller_id = ?) AND o.status IN ('disputed','refunded')
      ORDER BY o.updated_at DESC LIMIT 10`).bind(id, id).all(),
    c.env.DB.prepare(`SELECT id, title, price, status, created_at FROM listings WHERE seller_id = ? ORDER BY created_at DESC LIMIT 15`).bind(id).all(),
    c.env.DB.prepare(`SELECT stars, body, created_at FROM reviews WHERE seller_id = ? ORDER BY created_at DESC LIMIT 10`).bind(id).all(),
    c.env.DB.prepare(`SELECT kind, delta, order_id, created_at FROM ledger WHERE user_id = ? ORDER BY id DESC LIMIT 15`).bind(id).all(),
    c.env.DB.prepare(`SELECT COALESCE(SUM(delta),0) AS n FROM ledger WHERE user_id = ?`).bind(id).first(),
  ]);
  const cair = await c.env.DB.prepare(
    `SELECT id, kode, amount, fee, status, requested_at, paid_at FROM withdrawals WHERE user_id = ? ORDER BY requested_at DESC LIMIT 10`
  ).bind(id).all();

  return c.html(renderAkunAdminPage(u, {
    pembeli: beli.results || [], penjual: jual.results || [], sengketa: sen.results || [],
    listings: list.results || [], ulasan: ulas.results || [], ledger: led.results || [],
    pencairan: cair.results || [],
    saldo: Number((saldo as any)?.n || 0),
  }));
});

app.post('/api/owner/orders/:id/resolve', async (c) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const decision = body?.decision === 'refund' ? 'refund' : 'release';
  const note = String(body?.note || '').trim().slice(0, 300);
  if (note.length < 5) return c.json({ error: 'Tulis alasan keputusan (min 5 karakter) — tersimpan sebagai bukti' }, 400);
  const o: any = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ? AND status = 'disputed'")
    .bind(c.req.param('id')).first();
  if (!o) return c.json({ error: 'Sengketa tidak ditemukan' }, 404);
  if (o.buyer_id === me!.id || o.seller_id === me!.id) {
    return c.json({ error: 'Sengketa yang melibatkan akun owner harus diputus orang lain.' }, 403);
  }

  if (decision === 'refund') {
    // Refund = saldo pembeli (bisa dipakai belanja lagi atau ditarik). Uang tidak keluar dari sistem.
    const nominal = Number(o.qris_final_amount || (Number(o.price) + Number(o.shipping || 0)));
    const ref = String(body?.transfer_ref || '').trim().slice(0, 80) || null;
    const r = await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE orders SET status = 'refunded', resolution_note = ?, refund_ref = ?, refund_amount = ?,
           refunded_at = datetime('now'), resolved_at = datetime('now'), updated_at = datetime('now')
         WHERE id = ? AND status = 'disputed'`
      ).bind(note, ref, nominal, o.id),
      // Kredit hanya kalau update di atas benar-benar terjadi (idempoten, tidak dobel).
      c.env.DB.prepare(
        "INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'refunded'"
      ).bind(o.buyer_id, o.id, nominal, 'refund', o.id),
    ]);
    if ((r[0].meta?.changes || 0) === 0) return c.json({ error: 'Sengketa sudah diputuskan' }, 409);
    await logOrderEvent(c.env.DB, o.id, 'owner', 'disputed', 'refunded', `${note || 'Dana dikembalikan'} · saldo pembeli +Rp${nominal.toLocaleString('id-ID')}`);
    await notifyOrder(c.env.DB, { userId: o.buyer_id, actorId: me!.id, type: 'order_refund', orderId: o.id });
    await logOwnerAction(c.env.DB, me?.email, 'dispute_refund', 'order', o.id, `${note} · saldo pembeli Rp${nominal}`);
    return c.json({ ok: true });
  }

  const money = settlementAmounts(o.price, o.shipping, PASAR_FEE);
  let r: any[];
  try {
    r = await c.env.DB.batch([
      c.env.DB.prepare("UPDATE orders SET status = 'completed', resolution_note = ?, resolved_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status = 'disputed'").bind(note, o.id),
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.sale, 'sale', o.id),
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.fee, 'fee', o.id),
      c.env.DB.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? FROM orders WHERE id = ? AND status = 'completed'")
        .bind(o.id, 'owner', 'disputed', 'completed', note || 'Owner: dana dilepas ke penjual', o.id),
    ]);
  } catch (e: any) {
    if (String(e?.message || e).includes('UNIQUE')) return c.json({ error: 'Sengketa sudah diputuskan' }, 409);
    throw e;
  }
  if (!(r[0].meta?.changes || 0)) return c.json({ error: 'Sengketa sudah diputuskan' }, 409);
  await logOwnerAction(c.env.DB, me?.email, 'dispute_release', 'order', o.id, note);
  return c.json({ ok: true });
});

// Keputusan owner atas laporan listing: sembunyikan buku atau abaikan laporan.
app.post('/api/owner/reports/:id/resolve', async (c) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const decision = body?.decision === 'hide' ? 'hide' : body?.decision === 'ignore' ? 'ignore' : null;
  const note = String(body?.note || '').trim().slice(0, 300);
  if (!decision) return c.json({ error: 'Keputusan tidak dikenal' }, 400);
  if (note.length < 5) return c.json({ error: 'Tulis catatan keputusan (min 5 karakter)' }, 400);

  const l: any = await c.env.DB.prepare('SELECT id, seller_id, title FROM listings WHERE id = ?').bind(c.req.param('id')).first();
  if (!l) return c.json({ error: 'Buku tidak ditemukan' }, 404);

  const status = decision === 'hide' ? 'removed' : 'ignored';
  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE listing_reports SET status = ?, reviewed_at = datetime('now'), review_note = ?, reviewer_email = ? WHERE listing_id = ? AND status = 'open'"
    ).bind(status, note, me?.email || null, l.id),
    ...(decision === 'hide'
      ? [c.env.DB.prepare("UPDATE listings SET status = 'hidden' WHERE id = ? AND status = 'active'").bind(l.id)]
      : []),
  ]);
  if (decision === 'hide') {
    await notifyOrder(c.env.DB, { userId: l.seller_id, actorId: me!.id, type: 'order_listing_removed', orderId: null });
  }
  await logOwnerAction(c.env.DB, me?.email, decision === 'hide' ? 'listing_remove' : 'listing_ignore', 'listing', l.id, note);
  return c.json({ ok: true });
});

app.post('/api/owner/sellers/:id/review', async (c) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const approve = body?.decision === 'approve';
  const reason = String(body?.reason || '').trim().slice(0, 200);
  if (c.req.param('id') === me!.id) return c.json({ error: 'Tidak bisa mereview akun sendiri' }, 400);
  if (!approve && reason.length < 5) return c.json({ error: 'Tulis alasan penolakan (min 5 karakter)' }, 400);

  const res = await c.env.DB.prepare(
    `UPDATE users SET seller_status=?, seller_reviewed_at=datetime('now'), seller_reject_reason=?,
       seller_review_note = COALESCE(NULLIF(?, ''), seller_review_note)
     WHERE id=? AND seller_status='pending'`
  ).bind(approve ? 'approved' : 'rejected', approve ? null : reason, reason, c.req.param('id')).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Pengajuan tidak ditemukan' }, 404);
  if (approve) {
    // Buat slug toko publik sekali saja; link yang sudah dibagikan tidak boleh mati.
    const u: any = await c.env.DB.prepare('SELECT shop_name, shop_slug FROM users WHERE id = ?').bind(c.req.param('id')).first();
    if (u?.shop_name && !u.shop_slug) {
      const dipakai = await c.env.DB.prepare('SELECT shop_slug FROM users WHERE shop_slug IS NOT NULL').all();
      const slug = slugUnik(u.shop_name, (dipakai.results || []).map((x: any) => x.shop_slug));
      await c.env.DB.prepare('UPDATE users SET shop_slug = ? WHERE id = ? AND shop_slug IS NULL').bind(slug, c.req.param('id')).run();
    }
  }
  await notifyOrder(c.env.DB, {
    userId: c.req.param('id'), actorId: me!.id,
    type: approve ? 'order_seller_approved' : 'order_seller_rejected', orderId: null,
  });
  await logOwnerAction(c.env.DB, me?.email, approve ? 'seller_approve' : 'seller_reject', 'user', c.req.param('id'), reason || null);
  return c.json({ ok: true });
});

app.post('/api/owner/withdrawals/:id/settle', async (c) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const body: any = await c.req.json().catch(() => ({}));
  const decision = body?.decision === 'reject' ? 'reject' : 'pay';
  const note = String(body?.note || '').trim().slice(0, 300);
  const ref = String(body?.transfer_ref || '').trim().slice(0, 80);
  if (note.length < 5) return c.json({ error: 'Tulis catatan keputusan (min 5 karakter) — tersimpan sebagai bukti' }, 400);
  if (decision === 'pay' && ref.length < 4) return c.json({ error: 'Isi referensi/bukti transfer (min 4 karakter)' }, 400);
  const id = c.req.param('id');
  const w: any = await c.env.DB.prepare("SELECT * FROM withdrawals WHERE id = ? AND status = 'requested'").bind(id).first();
  if (!w) return c.json({ error: 'Permintaan tidak ditemukan' }, 404);

  const status = decision === 'reject' ? 'rejected' : 'paid';
  const res = await c.env.DB.prepare(
    `UPDATE withdrawals SET status = ?, review_note = ?, transfer_ref = ?, reviewed_at = datetime('now'),
       paid_at = ${decision === 'reject' ? 'NULL' : "datetime('now')"} WHERE id = ? AND status = 'requested'`
  ).bind(status, note, ref || null, id).run();
  if ((res.meta?.changes || 0) === 0) return c.json({ error: 'Permintaan sudah diproses' }, 409);

  if (decision === 'pay') {
    const rows: any[] = [
      c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) VALUES (?, NULL, ?, 'withdraw')")
        .bind(w.user_id, -Number(w.amount)),
    ];
    if (Number(w.fee) > 0) {
      rows.push(c.env.DB.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) VALUES (?, NULL, ?, 'withdraw_fee')")
        .bind(w.user_id, -Number(w.fee)));
    }
    await c.env.DB.batch(rows);
  }
  await notifyOrder(c.env.DB, {
    userId: w.user_id, actorId: me!.id,
    type: decision === 'pay' ? 'order_withdraw_paid' : 'order_withdraw_reject', orderId: null,
  });
  await logOwnerAction(c.env.DB, me?.email, decision === 'pay' ? 'withdrawal_pay' : 'withdrawal_reject', 'withdrawal', id, note + (ref ? ' · ref ' + ref : ''));
  return c.json({ ok: true });
});

// Picu sweep manual (owner): cron bisa gagal diam-diam, ini jalan keluar daruratnya.
app.post('/api/owner/sweep', async (c) => {
  const me = await getAuthUser(c);
  if (!isOwner(c.env, me)) return c.json({ error: 'Tidak ditemukan' }, 404);
  const hasil = await sweepOrders(c.env.DB, c.env);
  await logOwnerAction(c.env.DB, me?.email, 'sweep', 'system', null, hasil);
  return c.json({ ok: true, hasil });
});

// Cron sweep per jam: expire order tak dibayar; handed D+5 tanpa gesekan → done;
// anti-resi-hantu: handed ekspedisi D+1, resi nggak ketemu di kurir → flag disputes.
// Jejak audit: satu baris per keputusan owner, tak bisa dihapus dari UI.
async function logOwnerAction(db: any, email: string | undefined | null, action: string, targetType: string | null, targetId: string | null, note: string | null) {
  await db.prepare(
    "INSERT INTO owner_actions (id, owner_email, action, target_type, target_id, note) VALUES (?,?,?,?,?,?)"
  ).bind(crypto.randomUUID(), email || '?', action, targetType, targetId, note).run();
}

async function sweepOrders(db: any, env: any): Promise<string> {
  const exp = await db.prepare(
    "UPDATE orders SET status = 'expired', updated_at = datetime('now') WHERE status = 'created' AND created_at < datetime('now', '-48 hours')"
  ).run();
  // resi hantu: ekspedisi (kurir+resi terisi), handed >24 jam, belum completed/disputed
  let ghosts = 0;
  if (env.BINDERBYTE_KEY) {
    const susp = await db.prepare(
      "SELECT id, kurir, resi FROM orders WHERE status = 'handed' AND kurir IS NOT NULL AND resi IS NOT NULL AND handed_at < datetime('now', '-1 day')"
    ).all();
    for (const o of (susp.results || []) as any[]) {
      const r = await cekResi(env, KURIR_MAP[o.kurir] || 'jne', o.resi);
      if (r.kind === 'found') {
        await db.prepare("UPDATE orders SET resi_verified = 1, resi_checked_at = datetime('now') WHERE id = ? AND resi_verified = 0").bind(o.id).run();
        continue;
      }
      // Gangguan API BinderByte: JANGAN vonis penjual. Coba lagi jam berikutnya.
      if (r.kind === 'error') continue;
      const g = await db.prepare(
        "UPDATE orders SET status = 'disputed', updated_at = datetime('now') WHERE id = ? AND status = 'handed'"
      ).bind(o.id).run();
      if ((g.meta?.changes || 0) > 0) {
        ghosts++;
        await logOrderEvent(db, o.id, 'system', 'handed', 'disputed', `Resi ${o.resi} tidak terdaftar di ${o.kurir} (cek otomatis 24 jam)`);
      }
    }
  }
  const stale = await db.prepare(
    // Auto-selesai hanya kalau resi sudah terverifikasi kurir (atau tanpa resi/COD).
    // Resi belum terverifikasi = dana ditahan, bukan dicairkan diam-diam.
    "SELECT id, seller_id, price, shipping FROM orders WHERE status = 'handed' AND handed_at IS NOT NULL AND handed_at < datetime('now', '-5 days') AND (resi IS NULL OR resi_verified = 1)"
  ).all();
  let completed = 0;
  for (const o of (stale.results || []) as any[]) {
    const money = settlementAmounts(o.price, o.shipping, PASAR_FEE);
    try {
      const settled = await db.batch([
        db.prepare("UPDATE orders SET status = 'completed', updated_at = datetime('now') WHERE id = ? AND status = 'handed'").bind(o.id),
        db.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.sale, 'sale', o.id),
        db.prepare("INSERT INTO ledger (user_id, order_id, delta, kind) SELECT ?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.seller_id, o.id, money.fee, 'fee', o.id),
        db.prepare("INSERT INTO order_events (order_id, actor, from_st, to_st, note) SELECT ?,?,?,?,? FROM orders WHERE id = ? AND status = 'completed'").bind(o.id, 'system', 'handed', 'completed', 'Auto-selesai D+5', o.id),
      ]);
      if ((settled[0].meta?.changes || 0) > 0) completed++;
    } catch (e: any) {
      if (!String(e?.message || e).includes('UNIQUE')) throw e;
    }
  }
  // Retensi dokumen penjual: disimpan 90 hari setelah keputusan, lalu objek R2 + barisnya dihapus.
  let docsHapus = 0;
  const dokLama = await db.prepare(
    `SELECT d.user_id, d.kind, d.r2_key FROM seller_docs d JOIN users u ON u.id = d.user_id
      WHERE u.seller_reviewed_at IS NOT NULL AND u.seller_reviewed_at < datetime('now','-90 days')`
  ).all();
  for (const d of (dokLama.results || []) as any[]) {
    if (env.MEDIA) await env.MEDIA.delete(d.r2_key).catch(() => {});
    await db.prepare('DELETE FROM seller_docs WHERE user_id = ? AND kind = ?').bind(d.user_id, d.kind).run();
    docsHapus++;
  }
  return `expired=${exp.meta?.changes || 0} completed=${completed} docs=${docsHapus}`;
}

app.get('/notifications', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.redirect('/login');
  return c.html(renderNotificationsPage(user));
});

// ---- LEMBAR SAMBUNGAN (SSR) ----
// Buka post mana pun di rantai → seluruh lembar tampil. Induk mati → mode yatim
// (bait tertua jadi tenggelam jadi "root" tampilan, tanpa badge status).
app.get('/chain/:id', async (c) => {
  const user = await getAuthUser(c);
  const id = c.req.param('id');

  const target: any = await c.env.DB.prepare(
    'SELECT p.*, u.pen_name FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?'
  ).bind(id).first();
  if (!target) return c.redirect('/feed');
  // Warkah privat = hanya penulisnya. Tanpa guard ini, tautan /chain/<id> jadi
  // pintu belakang yang membocorkan isi privat ke siapa pun (termasuk guest).
  if (target.visibility === 'private' && (!user || user.id !== target.author_id)) return c.notFound();

  // Naik ke root rantai. Root mati (parent_id menunjuk mayat) → target jadi root, orphans=true.
  let orphans = false;
  let root: any = target;
  let rootAuthor: string = target.pen_name;
  if (target.parent_id) {
    const parent: any = await c.env.DB.prepare(
      'SELECT p.*, u.pen_name FROM posts p JOIN users u ON p.author_id = u.id WHERE p.id = ?'
    ).bind(target.parent_id).first();
    if (parent) { root = parent; rootAuthor = parent.pen_name; }
    else { orphans = true; }
  }

  const vis = visibilityClause(user);
  const { results } = await c.env.DB.prepare(
    // saat yatim, anak-anak tetap menunjuk induk yang sudah dihapus — kueri pakai id mayat itu.
    // Balasan privat milik orang lain tidak boleh ikut tampil di rantai publik.
    `SELECT p.*, u.pen_name FROM posts p JOIN users u ON p.author_id = u.id
     WHERE p.parent_id = ? AND ${vis.sql} ORDER BY p.created_at ASC LIMIT 50`
  ).bind(orphans ? target.parent_id : root.id, ...vis.binds).all();

  return c.html(renderChainPage({ user, root, rootAuthor, orphans, children: results || [] }));
});

// ---- POSTS & FEED API ----
app.get('/api/notifications', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  // Dua kotak: 'sosial' (like/chain/save/follow) vs 'pasar' (order_*).
  const scope = c.req.query('scope') === 'pasar' ? 'pasar' : 'sosial';
  const cond = scope === 'pasar' ? "n.type LIKE 'order_%'" : "(n.type IS NULL OR n.type NOT LIKE 'order_%')";
  const { results } = await c.env.DB.prepare(`
    SELECT n.*, u.pen_name as actor_pen_name, p.title as post_title, p.content as post_content,
           l.title as order_title
    FROM notifications n
    JOIN users u ON n.actor_id = u.id
    LEFT JOIN posts p ON n.post_id = p.id
    LEFT JOIN orders o ON o.id = n.order_id
    LEFT JOIN listings l ON l.id = o.listing_id
    WHERE n.user_id = ? AND ${cond}
    ORDER BY n.created_at DESC
    LIMIT 50
  `).bind(user.id).all();

  return c.json({ notifications: (results || []).map(hardenPost) });
});

app.get('/api/notifications/unread-count', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ count: 0 });

  const scope = c.req.query('scope') === 'pasar' ? 'pasar' : 'sosial';
  const cond = scope === 'pasar' ? "AND type LIKE 'order_%'" : "AND (type IS NULL OR type NOT LIKE 'order_%')";
  const row = await c.env.DB.prepare(
    `SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0 ${cond}`
  ).bind(user.id).first();
  return c.json({ count: row ? (row as any).count : 0 });
});

app.post('/api/notifications/read-all', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const scope = c.req.query('scope') === 'pasar' ? 'pasar' : 'sosial';
  const cond = scope === 'pasar' ? "AND type LIKE 'order_%'" : "AND (type IS NULL OR type NOT LIKE 'order_%')";
  await c.env.DB.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? ${cond}`).bind(user.id).run();
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
  const vis = visibilityClause(user);

  let query = `
    SELECT p.*, u.pen_name, u.city, u.avatar_key,
      (SELECT content FROM posts prnt WHERE prnt.id = p.parent_id) as parent_content,
      (SELECT u2.pen_name FROM posts prnt JOIN users u2 ON prnt.author_id = u2.id WHERE prnt.id = p.parent_id) as parent_author
    FROM posts p
    JOIN users u ON p.author_id = u.id
  `;
  const binds: any[] = [];

  if (q) {
    query += ` WHERE (p.content LIKE ? OR u.pen_name LIKE ?) AND ${vis.sql} ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(`%${q}%`, `%${q}%`, ...vis.binds);
  } else if (mode === 'following') {
    if (!user) return c.json({ mode, posts: [], message: 'Silakan masuk untuk melihat warkah penulis yang Anda ikuti.' });
    query += ` JOIN follows f ON p.author_id = f.following_id WHERE f.follower_id = ? AND ${vis.sql} ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(user.id, ...vis.binds);
  } else if (mode === 'latest') {
    query += ` WHERE ${vis.sql} ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(...vis.binds);
  } else {
    // Mode 'viral' (Freshness Discovery Boost + Gravity Decay)
    // Postingan baru (< 1 jam) dapat initial boost agar muncul di atas untuk mendapat pembaca awal
    query += `
      WHERE ${vis.sql}
      ORDER BY (
        ((p.likes_count * 2.0) + (p.saves_count * 4.0) + (p.chains_count * 5.0) + 
         (CASE WHEN (julianday('now') - julianday(p.created_at)) * 24.0 < 1.0 THEN 6.0 ELSE 1.0 END)) /
        (((julianday('now') - julianday(p.created_at)) * 24.0) + 1.5)
      ) DESC LIMIT 40
    `;
    binds.push(...vis.binds);
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

// Sambungan 1 post (untuk expand inline feed) — ringkas, ASC, tanpa isi penuh
app.get('/api/posts/:id/chains', async (c) => {
  const vis = visibilityClause(await getAuthUser(c));
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.title, p.content, p.created_at, p.likes_count, p.chains_count, u.pen_name
     FROM posts p JOIN users u ON p.author_id = u.id
     WHERE p.parent_id = ? AND ${vis.sql} ORDER BY p.created_at ASC LIMIT 20`
  ).bind(c.req.param('id'), ...vis.binds).all();
  return c.json({ chains: (results || []).map(hardenPost) });
});

app.post('/api/posts', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk untuk menerbitkan warkah.' }, 401);

  // Rate limit per-penulis (vuln-0001 GLM): 20 unggahan/menit — tanpa ini 120
  // post terbit dalam 0,4 detik (uji Strix) dan kuota tulis D1 bisa dikuras.
  if (await hitRate(c.env.DB, `post:${user.id}`, 20, 60)) {
    return c.json({ error: 'Terlalu banyak unggahan. Tunggu sebentar.' }, 429);
  }

  const { title, content, parent_id, visibility } = await c.req.json().catch(() => ({}));

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

  // Visibilitas: hanya 'public' | 'private' yang diterima; selain itu tolak.
  const cleanVisibility = visibility === 'private' ? 'private' : 'public';

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
    'INSERT INTO posts (id, author_id, title, content, parent_id, visibility) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(postId, user.id, cleanTitle, cleanContent, parentId, cleanVisibility).run();

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
    // buang notif follow lama — unfollow berarti "X mulai mengikuti" tak lagi benar
    await c.env.DB.prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'follow'").bind(target.id, user.id).run();
    return c.json({ following: false });
  } else {
    await c.env.DB.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').bind(user.id, target.id).run();
    const dup = await c.env.DB.prepare('SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? LIMIT 1').bind(target.id, user.id, 'follow').first();
    if (!dup) {
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), target.id, user.id, 'follow').run();
    }
    return c.json({ following: true });
  }
});

export default {
  fetch: app.fetch,
  // Cron per jam: expire 48 jam, auto-complete D+5, anti-resi-hantu D+1 (BinderByte).
  async scheduled(_event: any, env: any, ctx: any) {
    ctx.waitUntil(sweepOrders(env.DB, env).then((s: string) => console.log('[cron] sweepOrders', s)));
  },
} as any;
