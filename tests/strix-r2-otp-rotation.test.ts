// Strix run-2 #3: ganti password juga mencabut OTP pending (token LIKE 'otp\_%')
// — pemegang OTP lama tak boleh bisa mint sesi 30 hari setelah sandi diganti.
// Kontrak sumber + probe semantik (skema sessions sesungguhnya).
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const src = readFileSync(new URL('../src/routes/auth.ts', import.meta.url), 'utf8');

// 1. Kontrak: statement revoke change-password harus mencakup pola token otp_ (escape).</  Komparasi token_hash tetap dipertahankan.
// Catatan: kontrak pakai includes, bukan regex — biar hitungan backslash jelas.
// Teks di source ditulis ganda (otp\\_) karena string TS: berarti 1 backslash runtime
// plus ESCAPE '\' — itulah yang membuat underscore bukan wildcard.
assert.ok(src.includes("DELETE FROM sessions WHERE user_id = ? AND ((token_hash IS NOT NULL AND token_hash <> ?"),
  'cabang lama revoke sesi token_hash tetap ada');
assert.ok(src.includes("OR (token LIKE 'otp\\\\_%' ESCAPE '\\\\'))"),
  'revoke wajib mencakup baris OTP pending (token LIKE otp_) selain cabang token_hash');
assert.ok(!src.includes("token_hash NOT LIKE 'rst\\\\_%' ESCAPE '\\\\'"), 'tiket reset rst_ kini IKUT dicabut (Strix run-4 #2)');
assert.ok(src.includes("token_hash NOT LIKE 'otpf\\\\_%' ESCAPE '\\\\'"), 'artefak flow otpf_ tetap dikecualikan');

// 2. Probe: OTP pending TERHAPUS; sesi sekarang, rst_, otpf_ UTUH.
const REVOKE = `DELETE FROM sessions WHERE user_id = ? AND (
  (token_hash IS NOT NULL AND token_hash <> ? AND token_hash NOT LIKE 'otpf\\_%' ESCAPE '\\'
   AND EXISTS (SELECT 1 FROM users cu WHERE cu.id = ? AND cu.account_status = 'active'))
  OR (token LIKE 'otp\\_%' ESCAPE '\\'))`;

const db = new DatabaseSync(':memory:');
db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, account_status TEXT, password_hash TEXT, email_verified INTEGER);
CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT, token TEXT, token_hash TEXT, expires_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
INSERT INTO users VALUES ('u', 'u@x.test', 'active', 'hash-lama', 1);
INSERT INTO sessions (id, user_id, token, token_hash, expires_at) VALUES
 ('sesi-lain',  'u', NULL, 'hash-sesi-lain', datetime('now', '+30 days')),
 ('sesi-now',   'u', NULL, 'hash-sesi-now',  datetime('now', '+30 days')),
 ('otp-pending','u', 'otp_abcdef123', NULL, datetime('now', '+10 minutes')),
 ('tiket-reset','u', NULL, 'rst_tiket',      datetime('now', '+15 minutes')),
 ('flow-artefak','u', NULL, 'otpf_flow',      datetime('now', '+10 minutes'));`);

const changes = db.prepare(REVOKE).run('u', 'hash-sesi-now', 'u').changes;
assert.equal(Number(changes), 3, 'terhapus: sesi-lain + otp-pending + tiket-reset (bukan sekadar 1)');
const rows = new Set(
  (db.prepare(`SELECT id FROM sessions`).all() as any[]).map((r) => r.id)
);
assert.ok(!rows.has('otp-pending'), 'OTP pending wajib tercabut');
assert.ok(rows.has('sesi-now'), 'sesi sekarang tetap hidup');
assert.ok(rows.has('sesi-lain') === false, 'sesi lain tetap dicabut (perilaku lama)');
assert.ok(!rows.has('tiket-reset'), 'tiket reset PENDING wajib tercabut saat ganti sandi (Strix run-4 #2)');
assert.ok(rows.has('flow-artefak'), 'artefak otpf_ tidak boleh ikut terhapus');

// 3. anti-tertukar: token 'otpX_dummy' bukan prefix otp_ (underscore di-escape, bukan wildcard)
const db2 = new DatabaseSync(':memory:');
db2.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, account_status TEXT);
CREATE TABLE sessions (user_id TEXT, token TEXT, token_hash TEXT, expires_at TEXT);
INSERT INTO sessions VALUES ('u', 'otpX_dummy', NULL, datetime('now', '+10 minutes'));`);
db2.prepare(REVOKE).run('u', 'x', 'u');
assert.equal((db2.prepare('SELECT COUNT(*) n FROM sessions').get() as any).n, 1, 'otpX_ tidak boleh tertukar (escape underscore)');

console.log('OK — strix-r2-3: ganti sandi mencabut OTP pending, artefak flow selamat');
