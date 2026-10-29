import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, verifyPassword, passwordIssue } from './lib/password';
import { sanitizeRich, escapeHtml, stripTags } from './lib/sanitize';
import { turnstileGate } from './lib/turnstile-gate';
import { renderLandingPage } from './web/landing';



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
import { mountAuth } from './routes/auth';
import { notifyOrder, logOrderEvent, sellerBalance, ORDER_EXPIRE_MIN, AUTO_COMPLETE_DAYS, KURIR_MAP } from './lib/pasar-core';
import { isOwner as isOwnerU } from './lib/shared';
const isOwner = isOwnerU;


// Helper verifikasi Cloudflare Turnstile token
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
mountAuth(app);
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
