// Cek runnable: npm test
import { turnstileGate } from '../src/lib/turnstile-gate.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

// 1. Secret hilang -> TOLAK selalu, walau token ada & valid & fallback diizinkan.
//    (Kalau ini bocor jadi 'ok', fail-closed vuln-0002 balik lagi.)
assert(turnstileGate({ hasSecret: false, hasToken: true, tokenValid: true, allowFallback: true }) === 'reject', 'secret hilang tapi diloloskan');
assert(turnstileGate({ hasSecret: false, hasToken: false, tokenValid: false, allowFallback: true }) === 'reject', 'secret hilang tapi fallback jalan');

// 2. Token valid -> ok, termasuk endpoint tanpa jalur cadangan.
assert(turnstileGate({ hasSecret: true, hasToken: true, tokenValid: true, allowFallback: false }) === 'ok', 'token valid malah ditolak');
assert(turnstileGate({ hasSecret: true, hasToken: true, tokenValid: true, allowFallback: true }) === 'ok', 'token valid malah ditolak');

// 3. Token ADA tapi invalid -> reject. Ini yang paling penting: token palsu tidak
//    boleh diam-diam jatuh ke jalur cadangan (itu bypass Turnstile total).
assert(turnstileGate({ hasSecret: true, hasToken: true, tokenValid: false, allowFallback: true }) === 'reject', 'token invalid malah fallback');
assert(turnstileGate({ hasSecret: true, hasToken: true, tokenValid: false, allowFallback: false }) === 'reject', 'token invalid diloloskan');

// 4. Tanpa token -> fallback hanya bila endpoint mengizinkan; kalau tidak, tolak.
assert(turnstileGate({ hasSecret: true, hasToken: false, tokenValid: false, allowFallback: true }) === 'fallback', 'adblocker terkunci padahal endpoint izinkan cadangan');
assert(turnstileGate({ hasSecret: true, hasToken: false, tokenValid: false, allowFallback: false }) === 'reject', 'tanpa token diloloskan di endpoint gerbang keras');

console.log('OK — turnstile gate: semua cek lolos');
