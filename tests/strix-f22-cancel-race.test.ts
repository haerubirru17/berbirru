// Strix F22: cancel TIDAK boleh restore stok jika buyer suspension menang balapan.
// Stok-restore dan flip order harus diguard predikat yang SAMA (buyer aktif + pemilik order).
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const src = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');

// 1. Kontrak: dalam handler cancel, stmt restore-stok MEMILIKI guard akun-aktif & buyer-id.
const mb = src.match(/app\.post\('\/api\/pasar\/order\/:id\/cancel'[\s\S]*?if \(o\.status === 'created'\) \{[\s\S]*?\]\);/);
assert.ok(mb, 'blok cancel-create harus ada');
const blk = mb[0];
assert.match(blk, /UPDATE listings SET stock = MIN\(stock \+ 1, 999\)[\s\S]*?JOIN users au ON au\.id = co\.buyer_id[\s\S]*?co\.buyer_id = \? AND au\.account_status = 'active'/,
  'restore stok cancel wajib guard buyer aktif + kepemilikan order');
assert.match(blk, /\.bind\(o\.listing_id, o\.id, me\.id\)/, 'bind tiga argumen (listing, order, buyer)');

// 2. Probe semantik: kedua statement harus no-op BERSAMA saat suspended; normal tetap tepat-sekali.
const RESTORE = `UPDATE listings SET stock = MIN(stock + 1, 999) WHERE id = ? AND status != 'deleted'
  AND EXISTS (
    SELECT 1 FROM orders co JOIN users au ON au.id = co.buyer_id
    WHERE co.id = ? AND co.status = 'created' AND co.buyer_id = ? AND au.account_status = 'active'
  )`;
const ORDER = `UPDATE orders SET status = 'cancelled', updated_at = datetime('now')
  WHERE id = ? AND status = 'created'
  AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')`;

function freshDb(buyerStatus: string): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, account_status TEXT);
           CREATE TABLE listings (id TEXT PRIMARY KEY, stock INTEGER, status TEXT);
           CREATE TABLE orders (id TEXT PRIMARY KEY, listing_id TEXT, buyer_id TEXT, status TEXT, updated_at TEXT);
           INSERT INTO users VALUES ('buyer', '${buyerStatus}');
           INSERT INTO listings VALUES ('l1', 0, 'active');
           INSERT INTO orders VALUES ('o1', 'l1', 'buyer', 'created', NULL)`);
  return db;
}
const state = (db: DatabaseSync) => {
  const r: any = db.prepare(`SELECT (SELECT status FROM orders WHERE id='o1') AS st, (SELECT stock FROM listings WHERE id='l1') AS stock`).get();
  return { st: String(r.st), stock: Number(r.stock) };
};

// A) buyer aktif: stok +1 sekali, order cancelled
let db = freshDb('active');
const rRest = db.prepare(RESTORE).run('l1', 'o1', 'buyer');
const rOrd = db.prepare(ORDER).run('o1', 'buyer');
assert.equal(Number(rRest.changes), 1, 'suspended bukan kasus ini: restore jalan');
assert.equal(Number(rOrd.changes), 1, 'flip order jalan untuk buyer aktif');
assert.deepEqual(state(db), { st: 'cancelled', stock: 1 });

// B) buyer suspended MENANG balapan: KEDUA statement no-op
db = freshDb('suspended');
const rRest2 = db.prepare(RESTORE).run('l1', 'o1', 'buyer');
const rOrd2 = db.prepare(ORDER).run('o1', 'buyer');
assert.equal(Number(rRest2.changes), 0, 'stok TIDAK boleh di-restore untuk buyer suspended');
assert.equal(Number(rOrd2.changes), 0, 'order tidak boleh berubah utk buyer suspended');
assert.deepEqual(state(db), { st: 'created', stock: 0 }, 'order tetap created, stok tetap 0 (dua-duanya no-op)');

console.log('OK — strix-f22: cancel-suspend race tanpa efek sampah stok');
