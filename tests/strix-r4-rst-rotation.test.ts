// Strix run-4 #2: ganti password juga mencabut tiket reset rst_ pending.
// (pelajaran generasi-2 dari bug OTP; kontrak & probe)
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const src = readFileSync(new URL('../src/routes/auth.ts', import.meta.url), 'utf8');

// 1. Kontrak: eksklusi rst_ DIHAPUS dari statement revoke (rst_ ikut dicabut).
//    otpf_ tetap kecualikan; OR otp_ tetap ada.
assert.ok(!src.includes("token_hash NOT LIKE 'rst\\\\_%' ESCAPE '\\\\'"),
  'eksklusi rst_ wajib DIHAPUS — tiket reset harus ikut dicabut saat ganti sandi');
assert.ok(src.includes("token_hash NOT LIKE 'otpf\\\\_%' ESCAPE '\\\\'"), 'artefak otpf_ tetap dikecualikan');
assert.ok(src.includes("OR (token LIKE 'otp\\\\_%' ESCAPE '\\\\'))"), 'cabang OTP pending tetap ada');

// 2. Probe: rst_ TERHAPUS, otpf_ & sesi sekarang selamat, sesi lain tercabut.
const REVOKE = `DELETE FROM sessions WHERE user_id = ? AND (
  (token_hash IS NOT NULL AND token_hash <> ? AND token_hash NOT LIKE 'otpf\\_%' ESCAPE '\\'
   AND EXISTS (SELECT 1 FROM users cu WHERE cu.id = ? AND cu.account_status = 'active'))
  OR (token LIKE 'otp\\_%' ESCAPE '\\'))`;
const db = new DatabaseSync(':memory:');
db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, account_status TEXT);
CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT, token TEXT, token_hash TEXT, expires_at TEXT);
INSERT INTO users VALUES ('u','active');
INSERT INTO sessions (id, user_id, token, token_hash, expires_at) VALUES
 ('sesi-lain','u',NULL,'hash-lain',datetime('now','+30 days')),
 ('sesi-now','u',NULL,'hash-now',datetime('now','+30 days')),
 ('otp-pending','u','otp_abc',NULL,datetime('now','+10 minutes')),
 ('tiket-reset','u',NULL,'rst_tiket',datetime('now','+15 minutes')),
 ('flow-artefak','u',NULL,'otpf_flow',datetime('now','+10 minutes'));`);
db.prepare(REVOKE).run('u', 'hash-now', 'u');
const rows = new Set((db.prepare('SELECT id FROM sessions').all() as any[]).map((r) => r.id));
assert.ok(!rows.has('tiket-reset'), 'tiket reset PENDING wajib tercabut saat ganti sandi');
assert.ok(rows.has('sesi-now'), 'sesi sekarang selamat');
assert.ok(!rows.has('sesi-lain'), 'sesi lain tetap dicabut');
assert.ok(!rows.has('otp-pending'), 'OTP pending tetap dicabut');
assert.ok(rows.has('flow-artefak'), 'otpf_ selamat');

console.log('OK — strix-r4-2: tiket reset ikut dicabut saat ganti sandi');
