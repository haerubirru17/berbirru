// Strix F17: withdrawal yang sudah REMILI dibatalkan tidak boleh menerima debit ledger
// dari batch pay basi. INSERT ledger wajib kondisional pada transisi riil ke 'paid'.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const src = readFileSync(new URL('../src/routes/owner.ts', import.meta.url), 'utf8');

// 1. Kontrak: cabang pay memakai INSERT...SELECT kondisional, bukan VALUES tanpa syarat.
assert.match(src, /INSERT INTO ledger \(user_id, order_id, delta, kind\) SELECT user_id, \?, \?, 'withdraw' FROM withdrawals WHERE id = \? AND status = 'paid'/,
  'debit withdraw wajib kondisional pada status paid');
assert.match(src, /INSERT INTO ledger \(user_id, order_id, delta, kind\) SELECT user_id, \?, \?, 'withdraw_fee' FROM withdrawals WHERE id = \? AND status = 'paid'/,
  'debit withdraw_fee wajib kondisional pada status paid');
assert.doesNotMatch(src, /VALUES \(\?, \?, \?, 'withdraw'\)/, 'INSERT ledger unconditional dilarang');

// 2. Probe semantik: interleave reject-menang vs pay-menang.
const SCHEMA = `CREATE TABLE withdrawals (id TEXT PRIMARY KEY, user_id TEXT, amount INTEGER, fee INTEGER, status TEXT, paid_at TEXT);
CREATE TABLE ledger (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, order_id TEXT, delta INTEGER, kind TEXT);
CREATE UNIQUE INDEX idx_ledger_order_kind ON ledger(order_id, kind);`;

function freshDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  db.exec(`INSERT INTO withdrawals VALUES ('wd1', 'seller', 100, 10, 'requested', NULL)`);
  return db;
}
const FLIP_PAY = `UPDATE withdrawals SET status = 'paid', paid_at = datetime('now') WHERE id = ? AND status = 'requested'`;
const FLIP_REJ = `UPDATE withdrawals SET status = 'rejected' WHERE id = ? AND status = 'requested'`;
const INS_AMOUNT = `INSERT INTO ledger (user_id, order_id, delta, kind) SELECT user_id, ?, ?, 'withdraw' FROM withdrawals WHERE id = ? AND status = 'paid'`;
const INS_FEE = `INSERT INTO ledger (user_id, order_id, delta, kind) SELECT user_id, ?, ?, 'withdraw_fee' FROM withdrawals WHERE id = ? AND status = 'paid'`;
const ledgerSum = (db: DatabaseSync) =>
  Number((db.prepare('SELECT COALESCE(SUM(delta),0) AS s FROM ledger').get() as any).s);
const ledgerRows = (db: DatabaseSync) => Number((db.prepare('SELECT COUNT(*) AS n FROM ledger').get() as any).n);

// A) reject menang balapan → batch pay basi menghasilkan NOL baris ledger
let db = freshDb();
const stale = db.prepare(`SELECT user_id, amount, fee FROM withdrawals WHERE id = 'wd1' AND status = 'requested'`).get(); // pre-read handler pay
assert.ok(stale, 'pre-pay memuat baris requested');
db.prepare(FLIP_REJ).run('wd1'); // reject konkuren menang
const flipPay = db.prepare(FLIP_PAY).run('wd1'); // batch pay basi
assert.equal(Number(flipPay.changes), 0, 'flip pay basi = 0 baris');
db.prepare(INS_AMOUNT).run('wd:wd1', -Number((stale as any).amount), 'wd1');
if (Number((stale as any).fee) > 0) db.prepare(INS_FEE).run('wd:wd1', -Number((stale as any).fee), 'wd1');
assert.equal(ledgerRows(db), 0, 'withdrawal ditolak TIDAK boleh punya debit ledger');
assert.equal(ledgerSum(db), 0, 'total ledger tetap nol');

// B) pay menang normal → dua debit tepat-sekali (amount + fee)
db = freshDb();
db.prepare(FLIP_PAY).run('wd1');
db.prepare(INS_AMOUNT).run('wd:wd1', -100, 'wd1');
db.prepare(INS_FEE).run('wd:wd1', -10, 'wd1');
assert.equal(ledgerRows(db), 2, 'pay sukses = 2 baris ledger');
assert.equal(ledgerSum(db), -110, 'total debit -110 (amount + fee)');

console.log('OK — strix-f17: ledger penarikan kondisional pada transisi paid');
