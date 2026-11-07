// Strix run-2 #2: cancel order PAID+saldo — restore stok wajib guard akun buyer aktif.
// Suspend antara pre-read dan batch → SEMUA side effect (stok/flip/refund/event) no-op.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const src = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');

// 1. Kontrak: di cabang paid+saldo, stmt restore-stok guard akun aktif & buyer binding.
const mp = src.match(/if \(o\.paid_with !== 'saldo'\) \{[\s\S]*?\]\);/);
assert.ok(mp, 'cabang paid-saldo musti ada');
const blk = mp[0];
assert.match(blk, /UPDATE listings SET stock = MIN\(stock \+ 1, 999\)[\s\S]*?JOIN users au ON au\.id = co\.buyer_id[\s\S]*?co\.status = 'paid' AND co\.paid_with = 'saldo'\s+AND co\.buyer_id = \? AND au\.account_status = 'active'/,
  'restore stok paid-saldo wajib guard buyer aktif');
assert.match(blk, /\.bind\(o\.listing_id, o\.id, me\.id\)/, 'restore bind tiga argumen (listing, order, buyer)');

// 2. Probe semantik (replika statement cabang — jaga sinkron saat patch):
const RESTORE = `UPDATE listings SET stock = MIN(stock + 1, 999) WHERE id = ? AND status != 'deleted'
  AND EXISTS (
    SELECT 1 FROM orders co JOIN users au ON au.id = co.buyer_id
    WHERE co.id = ? AND co.status = 'paid' AND co.paid_with = 'saldo'
      AND co.buyer_id = ? AND au.account_status = 'active'
  )`;
const FLIP = `UPDATE orders SET status = 'cancelled', updated_at = datetime('now')
  WHERE id = ? AND status = 'paid' AND paid_with = 'saldo'
  AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')`;
const REFUND = `INSERT INTO ledger (user_id, order_id, delta, kind)
  SELECT buyer_id, id, qris_final_amount, 'refund' FROM orders
   WHERE id = ? AND status = 'cancelled'
     AND NOT EXISTS (SELECT 1 FROM ledger WHERE order_id = ? AND kind = 'refund')`;

function freshDb(status: string): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, account_status TEXT);
           CREATE TABLE listings (id TEXT PRIMARY KEY, stock INTEGER, status TEXT);
           CREATE TABLE orders (id TEXT PRIMARY KEY, listing_id TEXT, buyer_id TEXT, status TEXT, paid_with TEXT, qris_final_amount INTEGER, updated_at TEXT);
           CREATE TABLE ledger (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT, order_id TEXT, delta INTEGER, kind TEXT);
           INSERT INTO users VALUES ('buyer', '${status}');
           INSERT INTO listings VALUES ('l1', 0, 'active');
           INSERT INTO orders VALUES ('o1', 'l1', 'buyer', 'paid', 'saldo', 100000, NULL)`);
  return db;
}
const state = (db: DatabaseSync) => {
  const r: any = db.prepare(`SELECT (SELECT status FROM orders WHERE id='o1') AS st,
    (SELECT stock FROM listings WHERE id='l1') AS stock,
    (SELECT COUNT(*) FROM ledger WHERE order_id='o1') AS ledgers`).get();
  return { st: String(r.st), stock: Number(r.stock), ledgers: Number(r.ledgers) };
};

// A) buyer aktif: cancel + stok + refund, tepat-sekali
let db = freshDb('active');
assert.equal(Number(db.prepare(RESTORE).run('l1', 'o1', 'buyer').changes), 1);
assert.equal(Number(db.prepare(FLIP).run('o1', 'buyer').changes), 1);
db.prepare(REFUND).run('o1', 'o1');
db.prepare(REFUND).run('o1', 'o1'); // replay tak boleh dobel
assert.deepEqual(state(db), { st: 'cancelled', stock: 1, ledgers: 1 });

// B) suspended menang balapan: SEMUA statement no-op
db = freshDb('suspended');
assert.equal(Number(db.prepare(RESTORE).run('l1', 'o1', 'buyer').changes), 0, 'stok tak boleh naik utk suspended');
assert.equal(Number(db.prepare(FLIP).run('o1', 'buyer').changes), 0, 'order tak boleh flip utk suspended');
db.prepare(REFUND).run('o1', 'o1');
assert.deepEqual(state(db), { st: 'paid', stock: 0, ledgers: 0 }, 'order tetap paid, stok tetap 0, tanpa refund hantu');

console.log('OK — strix-r2-2: paid-saldo cancel anti-suspend, refund tepat-sekali');
