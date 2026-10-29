// Regression guard untuk wiring auth sensitif. Runnable: npm test.
// Tes gate murni saja pernah hijau sementara handler produksi memakai fallback.
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
  + readFileSync(new URL('../src/routes/auth.ts', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../src/web/login.ts', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const assert = (ok: unknown, msg: string) => { if (!ok) throw new Error('GAGAL: ' + msg); };

const verify = src.slice(src.indexOf("app.post('/api/auth/verify-otp'"), src.indexOf("app.post('/api/auth/logout'"));
assert(verify.includes("requireHuman(c, turnstile_token || '', 'votp', 10, 600);"),
  'verify-otp memakai gate keras tanpa fallback generik');
assert(!verify.includes("'votp', 10, 600, {"), 'verify-otp tidak boleh fallback token kosong generik');
assert(verify.includes('validOtpFlow(c, user.id)'), 'token kosong hanya boleh lewat flow cookie HttpOnly');
const logoutAll = src.slice(src.indexOf("app.post('/api/auth/logout-all'"), src.indexOf('// ---- PROFILE'));
assert(logoutAll.includes('(token_hash IS NULL OR token_hash != ?)'),
  'logout-all mencabut OTP/token-null dan sesi lain');

assert(ui.includes("payload.new_password = pendingActivationPassword"),
  'aktivasi registrasi meneruskan password yang dipilih sebagai new_password');
assert(ui.includes("pendingActivationPassword = isLoginMode ? '' : password"),
  'password aktivasi hanya disimpan saat mode daftar');
assert(ui.includes("btn.querySelector('span').textContent = 'Memverifikasi...'"),
  'tombol OTP memberi feedback sebelum request');

assert(/token TEXT,/.test(schema) && !/token TEXT UNIQUE NOT NULL/.test(schema),
  'schema baru mengizinkan sesi token_hash-only');

console.log('OK — wiring auth register/OTP/logout-all/schema terkunci');
