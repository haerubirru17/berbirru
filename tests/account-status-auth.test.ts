// Task 2: sesi login hanya untuk akun active; helper fix-TTL; cap tak memakan rst_/otpf_.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

// 1. getAuthUser menolak akun suspended pada request baru.
const shared = readFileSync(new URL('../src/lib/shared.ts', import.meta.url), 'utf8');
assert.match(shared, /WHERE s\.token_hash = \? AND s\.expires_at > datetime\("now"\)[\s\S]{0,80}u\.account_status='active'/,
  'getAuthUser wajib memfilter account_status active');
assert.match(shared, /s\.user_id = u\.id/, 'join sessions-users tetap');

// 2. Helper fix-TTL dipakai dua caller → file shared.
const helperPath = new URL('../src/lib/auth-session.ts', import.meta.url);
assert(existsSync(helperPath), 'helper sesi wajib ada (dua caller)');
const helper = readFileSync(helperPath, 'utf8');
assert.match(helper, /export async function insertActiveLoginSession\(db: D1Database, userId: string, tokenHash: string\)/,
  'signature helper tanpa parameter TTL');
assert.doesNotMatch(helper, /ttl|TTL:|\+30 days\)/, 'TTL tak boleh jadi parameter/literal di luar SQL');
assert.match(helper, /INSERT INTO sessions \(id, user_id, token_hash, expires_at\)[\s\S]*SELECT \?, u\.id, \?, datetime\('now', '\+30 days'\)[\s\S]*FROM users u[\s\S]*WHERE u\.id = \? AND u\.account_status = 'active'/,
  'mint sesi wajib INSERT...SELECT conditional active dengan TTL fix');
assert.match(helper, /export async function capLoginSessions\(db: D1Database, userId: string\)/);
for (const frag of ["token_hash NOT LIKE 'rst\\_%'", "token_hash NOT LIKE 'otpf\\_%'", 'ORDER BY created_at DESC LIMIT 4', "u.account_status = 'active'"]) {
  assert(helper.includes(frag) || helper.includes(frag.replace(/\\_/g, '\\\\_')), `cap kehilangan ${frag}`);
}
// rst_/otpf_ wajib dikecualikan DI DALAM subquery penyimpan 4 sesi juga.
const capSql = helper.slice(helper.indexOf('capLoginSessions'));
assert.equal((capSql.match(/NOT LIKE 'rst/g) || []).length >= 2, true, 'cap: rst_ dikecualikan min 2x (luar+sub)');
assert.equal((capSql.match(/NOT LIKE 'otpf/g) || []).length >= 2, true, 'cap: otpf_ dikecualikan min 2x');

// 3. auth.ts: kedua titik mint sesi login harus lewat helper; cookie hanya setelah insert terbukti.
const auth = readFileSync(new URL('../src/routes/auth.ts', import.meta.url), 'utf8');
assert.doesNotMatch(auth, /INSERT INTO sessions[^\n]*\+30 days/, 'tidak boleh ada mint sesi 30-hari manual tersisa');
assert.equal((auth.match(/insertActiveLoginSession\(/g) || []).length, 2, 'login + verify-otp sama-sama pakai helper');
assert.equal((auth.match(/capLoginSessions\(/g) || []).length, 2, 'cap dipakai di kedua jalur login');
assert.equal((auth.match(/setCookie\(\s*c,\s*'berbirru_session'/g) || []).length, 2, 'cookie login hanya dari dua jalur resmi');
// Pintu anti-race: insert zero → respons generik, TIDAK set cookie.
assert.match(auth, /const inserted = await insertActiveLoginSession\(c\.env\.DB, user\.id,[\s\S]{0,200}if \(!inserted\.meta\.changes\)[\s\S]{0,120}BAD_CRED/);
assert.match(auth, /const minted = await insertActiveLoginSession\(c\.env\.DB, user\.id,[\s\S]{0,200}if \(!minted\.meta\.changes\)[\s\S]{0,160}BAD_OTP/);
assert.doesNotMatch(auth, /account_status\s*=\s*'suspended'/, 'login tidak boleh bocorkan status (respons generik)');
console.log('OK — Task 2: lookup active, helper fix-TTL, cap aman artefak, cookie pasca-bukti');
