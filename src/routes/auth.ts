import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sha256hex, hitRate, getAuthUser } from '../lib/shared';
import { hashPassword, verifyPassword, passwordIssue } from '../lib/password';
import { sendOtpEmail, sendPasswordChangedEmail } from '../mail';
import { turnstileGate } from '../lib/turnstile-gate';

// Anti-enumerasi (vuln-0003): hash PBKDF2 dummy untuk verifikasi timing di
// email tak terdaftar — kerja PBKDF2 sama dengan akun nyata, lalu tetap menolak.
const DUMMY_PBKDF2_HASH = 'pbkdf2$sha256$10000$ZHVtbXlzYWx0MTIzNA==$RkFLRUhBU0hGWVdXMV teaserPLACEHOLDERONLY';

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

// Seluruh handler auth dipindah verbatim dari index.ts.
export function mountAuth(app: any) {
app.get('/api/auth/me', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ user: null });
  return c.json({ user });
});

app.post('/api/auth/register', async (c: any) => {
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

app.post('/api/auth/login', async (c: any) => {
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
app.post('/api/auth/change-password', async (c: any) => {
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

app.post('/api/auth/reset/start', async (c: any) => {
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

app.post('/api/auth/reset/verify', async (c: any) => {
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

app.post('/api/auth/reset/finish', async (c: any) => {
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

app.post('/api/auth/send-otp', async (c: any) => {
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

app.post('/api/auth/verify-otp', async (c: any) => {
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

app.post('/api/auth/logout', async (c: any) => {
  const token = getCookie(c, 'berbirru_session');
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256hex(token)).run();
  }
  deleteCookie(c, 'berbirru_session');
  return c.json({ ok: true });
});

// Keluar dari SEMUA perangkat (temuan vuln-0007 Strix): kalau token bocor, user
// butuh satu tombol buat mencabut semua sesi lain — bukan cuma sesi di device ini.
app.post('/api/auth/logout-all', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const token = getCookie(c, 'berbirru_session') || '';
  // Sesi lain + OTP yang masih menggantung ikut dimatikan.
  await c.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND (token_hash IS NULL OR token_hash != ?)').bind(user.id, await sha256hex(token)).run();
  return c.json({ ok: true });
});

// ---- PROFILE & USER UPDATE ----






// Daftar relasi sosial tetap berada di konteks profil; hanya identitas publik yang dikirim.



}
