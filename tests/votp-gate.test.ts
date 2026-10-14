// Uji gerbang verify-otp (vuln-0003/0004 GLM) — logika murni, tanpa Hono/D1.
// Kontrak: token kosong + tanpa fallback = TOLAK (fail-closed). Runnable: npm test
import { turnstileGate } from '../src/lib/turnstile-gate.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

// verify-otp memanggil requireHuman TANPA fallback → allowFallback=false.
assert(turnstileGate({ hasSecret: true, hasToken: false, tokenValid: false, allowFallback: false }) === 'reject',
  'verify-otp tanpa token → reject (skrip tanpa browser tak bisa menukar OTP)');
assert(turnstileGate({ hasSecret: true, hasToken: true, tokenValid: false, allowFallback: false }) === 'reject',
  'verify-otp token invalid → reject');
assert(turnstileGate({ hasSecret: true, hasToken: true, tokenValid: true, allowFallback: false }) === 'ok',
  'verify-otp token valid → lolos');
assert(turnstileGate({ hasSecret: false, hasToken: true, tokenValid: true, allowFallback: false }) === 'reject',
  'secret hilang → reject (fail-closed)');

console.log('OK — votp gate: semua cek lolos');
