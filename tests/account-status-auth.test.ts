// Task 2: sesi login hanya untuk akun active; helper fix-TTL; cap tak memakan rst_/otpf_.
// Task 3: OTP/reset finalizer klaim lewat marker unik dalam batch — bukan DELETE+NOT EXISTS.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

// 1. getAuthUser menolak akun suspended pada request baru.
const shared = readFileSync(new URL('../src/lib/shared.ts', import.meta.url), 'utf8');
assert.match(shared, /WHERE s\.token_hash = \? AND s\.expires_at > datetime\("now"\)[\s\S]{0,80}u\.account_status='active'/,
  'getAuthUser wajib memfilter account_status active');
assert.match(shared, /s\.user_id = u\.id/, 'join sessions-users tetap');

// 2. Helper fix-TTL dipakai caller login; verify-OTP memakai bentuk stmt (batch).
const helperPath = new URL('../src/lib/auth-session.ts', import.meta.url);
assert(existsSync(helperPath), 'helper sesi wajib ada');
const helper = readFileSync(helperPath, 'utf8');
assert.match(helper, /export async function insertActiveLoginSession\(db: D1Database, userId: string, tokenHash: string\)/,
  'signature helper tanpa parameter TTL');
assert.doesNotMatch(helper, /ttl|TTL:|\+30 days\)/, 'TTL tak boleh jadi parameter/literal di luar SQL');
assert.match(helper, /INSERT INTO sessions \(id, user_id, token_hash, expires_at\)[\s\S]*SELECT \?, u\.id, \?, datetime\('now', '\+30 days'\)[\s\S]*FROM users u[\s\S]*WHERE u\.id = \? AND u\.account_status = 'active'/,
  'mint sesi wajib INSERT...SELECT conditional active dengan TTL fix');
assert.match(helper, /export function capLoginSessionsStmt\(db: D1Database, userId: string, marker\?: string\): D1PreparedStatement/);
for (const frag of ["token_hash NOT LIKE 'rst\\_%'", "token_hash NOT LIKE 'otpf\\_%'", 'ORDER BY created_at DESC LIMIT 4', "u.account_status = 'active'"]) {
  assert(helper.includes(frag) || helper.includes(frag.replace(/\\_/g, '\\\\_')), `cap kehilangan ${frag}`);
}
const capSql = helper.slice(helper.indexOf('capLoginSessionsStmt'));
assert.equal((capSql.match(/NOT LIKE 'rst/g) || []).length >= 2, true, 'cap: rst_ dikecualikan min 2x (luar+sub)');
assert.equal((capSql.match(/NOT LIKE 'otpf/g) || []).length >= 2, true, 'cap: otpf_ dikecualikan min 2x');
assert.match(capSql, /mk\.token = \? AND mk\.user_id = \?/, 'cap versi batch wajib guard marker exact');

// 3. auth.ts: login memakai helper; verify-OTP memakai batch marker; cookie hanya setelah bukti.
const auth = readFileSync(new URL('../src/routes/auth.ts', import.meta.url), 'utf8');
assert.doesNotMatch(auth, /INSERT INTO sessions[^\n]*\+30 days/, 'mint VALUES 30-hari manual dilarang');
assert.equal((auth.match(/insertActiveLoginSession\(/g) || []).length, 1, 'password login pakai helper mint');
assert.equal((auth.match(/capLoginSessions\(/g) || []).length, 1, 'password login pakai helper cap');
assert.equal((auth.match(/capLoginSessionsStmt\(/g) || []).length, 1, 'verify-OTP pakai cap bentuk stmt (batch)');
assert.match(auth, /const inserted = await insertActiveLoginSession\(c\.env\.DB, user\.id,[\s\S]{0,200}if \(!inserted\.meta\.changes\)[\s\S]{0,120}BAD_CRED/);
assert.equal((auth.match(/setCookie\(\s*c,\s*'berbirru_session'/g) || []).length, 2, 'cookie login hanya dari dua jalur resmi');
assert.doesNotMatch(auth, /account_status\s*=\s*'suspended'/, 'login tidak boleh bocorkan status (respons generik)');

// 4. Task 3: tiga finalizer + change-password atomik = empat batch.
assert.equal((auth.match(/c\.env\.DB\.batch\(/g) || []).length, 4, 'tepat empat batch: verify-otp, reset/verify, reset/finish, change-password');
for (const m of ["'otp_claim_'", "'rsto_claim_'", "'rst_claim_'"]) {
  assert.equal((auth.match(new RegExp(m, 'g')) || []).length, 1, `marker ${m} tepat sekali`);
}
// Klaim OTP & rsto: UPDATE token exact + expiry + EXISTS active (kunci suspend generic).
assert.match(auth, /UPDATE sessions SET token = \? WHERE id = \? AND user_id = \?[\s\S]{0,120}token = \? AND expires_at > datetime\('now'\)[\s\S]{0,160}account_status = 'active'/);
// Klaim tiket rst_: claim pada token_hash exact + EXISTS active.
assert.match(auth, /UPDATE sessions SET token_hash = \? WHERE id = \? AND user_id = \?[\s\S]{0,140}token_hash = \? AND expires_at > datetime\('now'\)[\s\S]{0,160}account_status = 'active'/);
// Mint sesi di batch verify-OTP: 30 hari, guarded active + marker exact.
assert.match(auth, /INSERT INTO sessions \(id, user_id, token_hash, expires_at\)[\s\S]{0,200}SELECT \?, u\.id, \?, datetime\('now', '\+30 days'\)[\s\S]{0,220}u\.account_status = 'active'[\s\S]{0,160}s\.token = \?/,
  'mint verify-OTP wajib INSERT...SELECT guarded marker');
// Tiket rst_ 15 menit: guarded active + marker exact (reset/verify).
assert.match(auth, /INSERT INTO sessions \(id, user_id, token_hash, expires_at\)[\s\S]{0,200}SELECT \?, u\.id, \?, datetime\('now', '\+15 minutes'\)[\s\S]{0,260}s\.token = \?/,
  'tiket reset wajib guarded marker');
// Reset finish: sandi baru guarded marker; mass-delete sesi guarded marker+active.
assert.match(auth, /UPDATE users SET password_hash = \?, email_verified = 1[\s\S]{0,200}account_status = 'active'[\s\S]{0,160}s\.token_hash = \?/);
assert.match(auth, /DELETE FROM sessions WHERE user_id = \?[\s\S]{0,260}account_status = 'active'[\s\S]{0,180}m\.token_hash = \?/);
// Otoritas = result[0] (claim) saja; claim zero → respons generik, bukan 500.
assert.equal((auth.match(/if \(result\d*\[0\]\.meta\.changes !== 1\)/g) || []).length, 3, 'setiap batch menghakimi lewat claim saja');
// Pola klaim lama (DELETE + meta) wajib lenyap.
assert(!auth.includes("DELETE FROM sessions WHERE id = ? AND token LIKE"), 'klaim DELETE lama dilarang');
assert(!auth.includes('.bind(baris.id).run()'), 'klaim tiket lama dilarang');
assert(!auth.includes('.bind(flow.id).run()'), 'pembersihan flow standalone dilarang (masuk batch)');
console.log('OK — Task 2+3: lookup active, helper fix-TTL, cap aman artefak, tiga batch claim-marker');
