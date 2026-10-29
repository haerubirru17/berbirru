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

import { renderLoginPage } from './web/login';
import { renderResetPage } from './web/reset';
import { cekResi, validasiFormatResi, ambilWilayah, cekTarifOngkir, KURIR_DIDUKUNG, KURIR_LABEL } from './kurir';
import { validStock } from './lib/pasar-inventory';
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
import { Env } from './env';
import { sha256hex, hitRate, hardenPost, withAdmin, visibilityClause, getAuthUser } from './lib/shared';
import { mountNotifications } from './routes/notifications';
import { mountKurir } from './routes/kurir';
import { mountMedia } from './routes/media';
import { mountOwner, sweepOrders } from './routes/owner';
import { mountSocial } from './routes/social';
import { mountPasar } from './routes/pasar';
import { notifyOrder, logOrderEvent, sellerBalance, ORDER_EXPIRE_MIN, AUTO_COMPLETE_DAYS, KURIR_MAP } from './lib/pasar-core';
import { isOwner as isOwnerU } from './lib/shared';
const isOwner = isOwnerU;


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

// Penanda centang biru admin pada tiap warkah. Email hanya dipakai di server,
// lalu dibuang — klien cuma menerima boolean.

// Filter visibilitas: post privat hanya terlihat oleh penulisnya sendiri.
// Mengembalikan pasangan klausa SQL + binding. `user` boleh null (guest).

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

app.get('/', async (c) => {
  const user = await getAuthUser(c);
  // HTML landing jangan di-cache: perubahan UI harus langsung terlihat.
  c.header('Cache-Control', 'no-store, must-revalidate');
  const tz = (c.req.raw as any).cf?.timezone || 'Asia/Jakarta';
  return c.html(renderLandingPage(user, [], tz));
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
  // Fallback ketat: widget Turnstile bisa gagal render di sebagian peramban.
  // Tanpa ini pendaftaran mentok permanen. Tetap fail-closed bila secret kosong.
  const humanErr = await requireHuman(c, turnstile_token || '', 'register', 10, 600, { limit: 3, windowSec: 900 });
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

  // Tidak ada sesi login di sini: akun baru hanya aktif setelah OTP terbukti masuk ke inbox.
  const sent = await issueOtp(c.env, userId, cleanEmail);
  // Flow browser aman dibuat walau provider email gagal: tanpa OTP benar, cookie ini
  // tidak dapat ditukar menjadi sesi. Ini juga menjaga UI dari dead-end Turnstile.
  await issueOtpFlow(c, userId);
  if (!sent.ok) console.warn('register: gagal kirim OTP untuk', cleanEmail);
  // Respons tetap seragam untuk mencegah enumerasi email.
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

const OTP_FLOW_COOKIE = 'berbirru_otp_flow';

async function issueOtpFlow(c: any, userId: string): Promise<void> {
  const raw = crypto.randomUUID() + '-' + crypto.randomUUID();
  const key = 'otpf_' + await sha256hex(raw);
  await c.env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND token_hash LIKE 'otpf_%'").bind(userId).run();
  await c.env.DB.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, datetime('now', '+10 minutes'))"
  ).bind(crypto.randomUUID(), userId, key).run();
  setCookie(c, OTP_FLOW_COOKIE, raw, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 600 });
}

async function validOtpFlow(c: any, userId: string): Promise<any | null> {
  const raw = getCookie(c, OTP_FLOW_COOKIE) || '';
  if (!raw) return null;
  return c.env.DB.prepare(
    "SELECT id FROM sessions WHERE user_id = ? AND token_hash = ? AND expires_at > datetime('now') LIMIT 1"
  ).bind(userId, 'otpf_' + await sha256hex(raw)).first();
}

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
  const otpId = crypto.randomUUID();
  await env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+10 minutes"))'
  ).bind(otpId, userId, `otp_${otpHash}`).run();
  const ok = await sendOtpEmail(cleanEmail, otpCode, env);
  if (!ok) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(otpId).run();
  return { ok };
}

app.post('/api/auth/send-otp', async (c) => {
  const { email, turnstile_token } = await c.req.json().catch(() => ({}));
  if (!email) return c.json({ error: 'Email wajib diisi' }, 400);

  // Turnstile wajib (fail-closed) + rate limit per-IP.
  // Widget Turnstile bisa gagal render (peramban/adblock). Kode OTP sendiri sudah
  // bukti kepemilikan email — fallback ketat menjaga alur tetap jalan.
  const humanErr = await requireHuman(c, turnstile_token || '', 'otp', 5, 600, { limit: 5, windowSec: 900 });
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
  await issueOtpFlow(c, user.id);
  if (!sent.ok) console.warn('send-otp: gagal kirim email untuk', cleanEmail);
  // Tetap seragam saat provider gagal — jangan bocorkan apakah email terdaftar.
  return c.json(UNIFORM);
});

app.post('/api/auth/verify-otp', async (c) => {
  const { email, otp, turnstile_token, new_password } = await c.req.json().catch(() => ({}));
  if (!email || !otp) return c.json({ error: 'Email dan Kode OTP wajib diisi' }, 400);
  const cleanEmail = String(email).trim().toLowerCase();
  const ip = c.req.header('cf-connecting-ip') || 'unknown';
  const BAD_OTP = { error: 'Kode OTP salah atau sudah kedaluwarsa.' };
  const user: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();

  // Token kosong hanya boleh lanjut dari browser yang memulai pengiriman OTP dan
  // memegang cookie flow HttpOnly sekali pakai. Tidak ada fallback generik.
  const flow = user ? await validOtpFlow(c, user.id) : null;
  if (!flow) {
    const humanErr = await requireHuman(c, turnstile_token || '', 'votp', 10, 600);
    if (humanErr) return c.json({ error: humanErr }, 403);
  }

  // Anti brute-force OTP: batas per-IP dan per-akun tetap berlaku pada kedua jalur.
  if (await hitRate(c.env.DB, `votp:ip:${ip}`, 10, 600) || await hitRate(c.env.DB, `votp:em:${cleanEmail}`, 10, 600)) {
    return c.json({ error: 'Terlalu banyak percobaan kode. Tunggu beberapa menit lalu coba lagi.' }, 429);
  }
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
  if (flow) await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(flow.id).run();
  setCookie(c, OTP_FLOW_COOKIE, '', { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 0 });

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
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND (token_hash IS NULL OR token_hash != ?)').bind(user.id, await sha256hex(token)).run();
  return c.json({ ok: true });
});

// ---- PROFILE & USER UPDATE ----






// Daftar relasi sosial tetap berada di konteks profil; hanya identitas publik yang dikirim.


mountMedia(app);
mountSocial(app);



// ---- NOTIFIKASI (SSR) ----

mountPasar(app);

app.get('/setelah-masuk', async (c) => {
  const me = await getAuthUser(c);
  if (!me) return c.redirect('/login');
  return c.redirect('/feed');
});
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

mountKurir(app);
mountOwner(app);
mountNotifications(app);



// Sambungan 1 post (untuk expand inline feed) — ringkas, ASC, tanpa isi penuh




// Hapus Postingan (Hanya oleh Pemilik Postingan)


// Like & Bookmark Toggle






export default {
  fetch: app.fetch,
  // Cron per jam: expire 48 jam, auto-complete D+5, anti-resi-hantu D+1 (BinderByte).
  async scheduled(_event: any, env: any, ctx: any) {
    ctx.waitUntil(sweepOrders(env.DB, env).then((s: string) => console.log('[cron] sweepOrders', s)));
  },
} as any;
