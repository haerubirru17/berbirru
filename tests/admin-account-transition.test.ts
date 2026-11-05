// Task 5: modul transisi akun atomic — kontrak sumber + probe semantik sqlite.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const mod = readFileSync(new URL('../src/lib/admin-accounts.ts', import.meta.url), 'utf8');

// 1. Interface: hanya dua export.
assert.equal((mod.match(/export (?:async )?function/g) || []).length, 2, 'tepat dua export: suspend/reinstate');
assert.match(mod, /export async function suspendAccount\(/);
assert.match(mod, /export async function reinstateAccount\(/);

// 2. Hakim suspend persis plan §6.2: kondisional + owner exclusion DI MODULE.
assert.match(mod, /UPDATE users\s+SET account_status='suspended', suspended_reason = \?, suspended_at = \?,\s+suspended_by = \?, account_action_id = \?\s+WHERE id = \? AND account_status = 'active'\s+AND lower\(email\) <> lower\(\?\)/);

// 3. Delete sesi/artefak wajib guarded marker pemenang — tidak pernah unconditional.
assert.match(mod, /DELETE FROM sessions\s+WHERE user_id = \?\s+AND EXISTS \(SELECT 1 FROM users u\s+WHERE u\.id = \? AND u\.account_status = 'suspended' AND u\.account_action_id = \?\)/);
assert.doesNotMatch(mod, /DELETE FROM sessions WHERE user_id = \?[`]*\s*\)/, 'delete unconditional dilarang');

// 4. Audit insert guarded marker; action literal; created_at di-bind.
assert.match(mod, /INSERT INTO social_account_actions\s+\(id, action, target_user_id, actor_user_id, actor_email, reason, created_at\)\s+SELECT \?, 'user_suspend', u\.id, \?, \?, \?, \?\s+FROM users u\s+WHERE u\.id = \? AND u\.account_status = 'suspended' AND u\.account_action_id = \?/);

// 5. Reinstate: hakim only-suspended + owner exclusion + metadata dibersihkan.
assert.match(mod, /UPDATE users\s+SET account_status='active', suspended_reason = NULL, suspended_at = NULL,\s+suspended_by = NULL, account_action_id = \?\s+WHERE id = \? AND account_status = 'suspended'\s+AND lower\(email\) <> lower\(\?\)/);
assert.match(mod, /'user_reinstate', u\.id, \?, \?, \?, \?\s+FROM users u\s+WHERE u\.id = \? AND u\.account_status = 'active' AND u\.account_action_id = \?/);

// 6. Hakim + audit = satu-satunya gate; tidak ada throw post-batch (pelajaran R4+W1).
assert.match(mod, /result\[0\]\.meta\.changes === 1 && result\[2\]\.meta\.changes === 1/);
assert.match(mod, /result\[0\]\.meta\.changes === 1 && result\[1\]\.meta\.changes === 1/);
assert.doesNotMatch(mod, /throw new Error\('invariant/i, 'tidak ada invariant-throw pasca commit');
assert.doesNotMatch(mod, /INSERT INTO sessions/, 'modul tidak menciptakan sesi/artefak baru');

// === Probe semantik sqlite (SQL module; kontrak di atas menjamin bentuknya) ===
const schema =
  readFileSync(new URL('./fixtures/current-schema-pre-0034.sql', import.meta.url), 'utf8') +
  readFileSync(new URL('../migrations/0034_social_account_status.sql', import.meta.url), 'utf8');
const JUDGE_SUS = `UPDATE users SET account_status='suspended', suspended_reason = ?, suspended_at = ?, suspended_by = ?, account_action_id = ? WHERE id = ? AND account_status = 'active' AND lower(email) <> lower(?)`;
const DEL_SUS = `DELETE FROM sessions WHERE user_id = ? AND EXISTS (SELECT 1 FROM users u WHERE u.id = ? AND u.account_status = 'suspended' AND u.account_action_id = ?)`;
const AUD_SUS = `INSERT INTO social_account_actions (id, action, target_user_id, actor_user_id, actor_email, reason, created_at) SELECT ?, 'user_suspend', u.id, ?, ?, ?, ? FROM users u WHERE u.id = ? AND u.account_status = 'suspended' AND u.account_action_id = ?`;
const JUDGE_REI = `UPDATE users SET account_status='active', suspended_reason = NULL, suspended_at = NULL, suspended_by = NULL, account_action_id = ? WHERE id = ? AND account_status = 'suspended' AND lower(email) <> lower(?)`;
const AUD_REI = `INSERT INTO social_account_actions (id, action, target_user_id, actor_user_id, actor_email, reason, created_at) SELECT ?, 'user_reinstate', u.id, ?, ?, ?, ? FROM users u WHERE u.id = ? AND u.account_status = 'active' AND u.account_action_id = ?`;

function fresh(): any {
  const db = new DatabaseSync(':memory:');
  db.exec(schema);
  db.exec(`INSERT INTO users (id,email,password_hash,pen_name,account_status) VALUES
    ('owner','owner@berbirru.com','x','owner','active'),
    ('victim','victim@x.invalid','x','victim','active'),
    ('actor','actor@x.invalid','x','actor','active')`);
  db.exec(`INSERT INTO sessions (id,user_id,token_hash,expires_at) VALUES
    ('s1','victim','tok1',datetime('now','+30 days')),
    ('s2','victim','rst_t',datetime('now','+5 minutes')),
    ('s3','victim','otpf_t',datetime('now','+5 minutes'))`);
  return db;
}
const run = (db: any, sql: string, args: any[]): number => Number(db.prepare(sql).run(...args).changes);
const cnt = (db: any, sql: string, ...args: any[]): number => {
  const row: any = db.prepare(sql).get(...args);
  return Number(Object.values(row)[0]);
};

// A. Happy suspend: hakim=1, semua sesi/artefak musnah, audit tepat 1.
{
  const db = fresh();
  const m = 'act-1';
  assert.equal(run(db, JUDGE_SUS, ['spam uji jelas', 'now', 'actor', m, 'victim', 'owner@berbirru.com']), 1);
  assert.equal(run(db, DEL_SUS, ['victim', 'victim', m]), 3, 'delete=3 (login+rst+otpf), bukan invariant');
  assert.equal(run(db, AUD_SUS, ['a1', 'actor', 'actor@x.invalid', 'spam uji jelas', 'now', 'victim', m]), 1);
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM users WHERE id='victim' AND account_status='suspended' AND suspended_by='actor' AND account_action_id=?", m), 1);
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM sessions WHERE user_id='victim'"), 0);
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM social_account_actions WHERE action='user_suspend' AND target_user_id='victim'"), 1);
  db.close();
}
// B. Owner tidak bisa ditarget (exclusion di hakim).
{
  const db = fresh();
  assert.equal(run(db, JUDGE_SUS, ['alasan sah minimal', 'now', 'actor', 'act-o', 'owner', 'owner@berbirru.com']), 0, 'owner kebal');
  assert.equal(cnt(db, "SELECT (account_status='active') c FROM users WHERE id='owner'"), 1, 'owner masih active');
  db.close();
}
// C. Wrong state: suspend yang sudah suspended → hakim 0; delete+audit ikut 0.
{
  const db = fresh();
  assert.equal(run(db, JUDGE_SUS, ['spam uji jelas', 'now', 'actor', 'act-1', 'victim', 'owner@berbirru.com']), 1);
  run(db, DEL_SUS, ['victim', 'victim', 'act-1']);
  run(db, AUD_SUS, ['a1', 'actor', 'actor@x.invalid', 'spam uji jelas', 'now', 'victim', 'act-1']);
  assert.equal(run(db, JUDGE_SUS, ['spam kedua jelas', 'now', 'actor', 'act-2', 'victim', 'owner@berbirru.com']), 0, 'state salah 409');
  assert.equal(run(db, DEL_SUS, ['victim', 'victim', 'act-2']), 0, 'loser delete 0 sesi (marker bukan miliknya)');
  assert.equal(run(db, AUD_SUS, ['a2', 'actor', 'actor@x.invalid', 'spam kedua jelas', 'now', 'victim', 'act-2']), 0, 'loser audit 0');
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM social_account_actions"), 1, 'audit tepat sekali');
  db.close();
}
// D. Stale loser tidak bisa menghapus sesi pemenang (delete mensyaratkan marker pemenang).
{
  const db = fresh();
  assert.equal(run(db, JUDGE_SUS, ['spam uji jelas', 'now', 'actor', 'act-win', 'victim', 'owner@berbirru.com']), 1);
  // request B membaca pra-state 'active' tapi hakimnya kalah; delete B pakai marker B:
  assert.equal(run(db, DEL_SUS, ['victim', 'victim', 'act-B']), 0, 'loser tidak menyentuh sesi');
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM sessions WHERE user_id='victim'"), 3, 'sesi masih ada utk/delete pemenang');
  assert.equal(run(db, DEL_SUS, ['victim', 'victim', 'act-win']), 3, 'delete pemenang bekerja');
  db.close();
}
// E. Audit failure → seluruh transisi rollback (simulasi atomicity batch D1).
{
  const db = fresh();
  db.exec('BEGIN');
  const m = 'act-rb';
  try {
    assert.equal(run(db, JUDGE_SUS, ['rollback uji jelas', 'now', 'actor', m, 'victim', 'owner@berbirru.com']), 1);
    run(db, DEL_SUS, ['victim', 'victim', m]);
    db.exec("DROP TABLE social_account_actions"); // induce audit-path failure
    run(db, AUD_SUS, ['a3', 'actor', 'actor@x.invalid', 'rollback uji jelas', 'now', 'victim', m]);
    assert.fail('harusnya audit error');
  } catch { /* error SQL = rollback penuh */ }
  db.exec('ROLLBACK');
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM users WHERE id='victim' AND account_status='suspended'"), 0, 'judge ikut rollback');
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM sessions WHERE user_id='victim'"), 3, 'sesi utuh');
  db.close();
}
// F. Reinstate: hakim 1, audit 1, metadata bersih, SESI TIDAK BANGKIT (tidak pernah dibuat lagi).
{
  const db = fresh();
  const ms = 'act-1';
  run(db, JUDGE_SUS, ['spam uji jelas', 'now', 'actor', ms, 'victim', 'owner@berbirru.com']);
  run(db, DEL_SUS, ['victim', 'victim', ms]);
  run(db, AUD_SUS, ['a1', 'actor', 'actor@x.invalid', 'spam uji jelas', 'now', 'victim', ms]);
  const mr = 'act-re';
  assert.equal(run(db, JUDGE_REI, [mr, 'victim', 'owner@berbirru.com']), 1);
  assert.equal(run(db, AUD_REI, ['a4', 'actor', 'actor@x.invalid', 'dikembalikan jelas', 'now', 'victim', mr]), 1);
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM users WHERE id='victim' AND account_status='active' AND suspended_reason IS NULL AND account_action_id=?", mr), 1);
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM sessions WHERE user_id='victim'"), 0, 'reinstate tidak menghidupkan sesi');
  assert.equal(run(db, JUDGE_REI, ['act-re2', 'victim', 'owner@berbirru.com']), 0, 're-reinstate 409 (state salah)');
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM social_account_actions"), 2, 'dua audit: satu suspend, satu reinstate');
  db.close();
}
// G. 10-way "concurrency" sequential pada hakim: tepat satu pemenang.
{
  const db = fresh();
  let winners = 0;
  for (let i = 0; i < 10; i++) {
    const m = `act-${i}`;
    if (run(db, JUDGE_SUS, [`spam gelombang ${i} jelas`, 'now', 'actor', m, 'victim', 'owner@berbirru.com']) === 1) {
      run(db, DEL_SUS, ['victim', 'victim', m]);
      run(db, AUD_SUS, [`a-${i}`, 'actor', 'actor@x.invalid', `spam gelombang ${i} jelas`, 'now', 'victim', m]);
      winners++;
    }
  }
  assert.equal(winners, 1, 'tepat satu pemenang dari 10');
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM social_account_actions"), 1);
  assert.equal(cnt(db, "SELECT COUNT(*) c FROM sessions WHERE user_id='victim'"), 0);
  db.close();
}
console.log('OK — Task 5: modul transisi kontrak+semantik (owner kebal, satu pemenang, stale loser, rollback audit, reinstate tanpa kebangkitan)');
