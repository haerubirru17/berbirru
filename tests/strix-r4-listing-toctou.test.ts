// Strix run-4 #1: PATCH listing — cek order-live dan UPDATE stok harus SATU statement.
// Checkout konkuren di antaranya tidak boleh tertimpa stock seller (oversell).
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const src = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');

// 1. Kontrak: UPDATE listings (edit) memuat predikat NOT EXISTS live-order, dan
//    zero-changes dibedakan 401 (akun) vs 409 (pesanan berjalan).
assert.ok(src.includes("AND NOT EXISTS (SELECT 1 FROM orders WHERE listing_id = ? AND status IN ('created','paid','handed','disputed'))"),
  'UPDATE edit listing wajib menolak saat ada order live (predikat atomik)');
assert.ok(src.includes("return c.json({ error: 'Ada pesanan berjalan — stok belum bisa diubah' }, 409)"),
  '409 live-order tetap ada untuk UX pre-check');

// 2. Probe: interleave persis PoC Strix — checkout duluan, PATCH basi harus 0 baris.
const SCHEMA = `CREATE TABLE users (id TEXT PRIMARY KEY, account_status TEXT);
CREATE TABLE listings (id TEXT PRIMARY KEY, seller_id TEXT, title TEXT, price INTEGER, cond TEXT, stock INTEGER, status TEXT);
CREATE TABLE orders (id TEXT PRIMARY KEY, listing_id TEXT, buyer_id TEXT, status TEXT);
INSERT INTO users VALUES ('seller','active'),('buyer','active');
INSERT INTO listings VALUES ('l1','seller','Book',1000,'baru',1,'active');`;
const db = new DatabaseSync(':memory:');
db.exec(SCHEMA);
// pre-check PATCH (masih kosong)
assert.ok(!db.prepare("SELECT 1 FROM orders WHERE listing_id='l1' AND status IN ('created','paid','handed','disputed') LIMIT 1").get());
// checkout konkuren menang: reserve batch (pola 774-785)
db.exec(`BEGIN;
INSERT INTO orders (id, listing_id, buyer_id, status) SELECT 'o1','l1','buyer','created' FROM listings WHERE id='l1' AND status='active' AND stock>0;
UPDATE listings SET stock = stock - 1 WHERE id = 'l1' AND EXISTS (SELECT 1 FROM orders WHERE id = 'o1');
COMMIT;`);
// PATCH basi (dgn predikat baru): 0 changes — stok TIDAK tertimpa
const upd = db.prepare(`UPDATE listings SET title='Book', price=1000, cond='baru', stock=1
  WHERE id = 'l1'
  AND EXISTS (SELECT 1 FROM users au WHERE au.id = 'seller' AND au.account_status = 'active')
  AND NOT EXISTS (SELECT 1 FROM orders WHERE listing_id = 'l1' AND status IN ('created','paid','handed','disputed'))`).run();
assert.equal(Number(upd.changes), 0, 'PATCH basi harus ditolak predikat order-live');
const st: any = db.prepare(`SELECT (SELECT stock FROM listings WHERE id='l1') s, (SELECT status FROM orders WHERE id='o1') o`).get();
assert.equal(String(st.o), 'created', 'order konkuren masih hidup');
assert.equal(Number(st.s), 0, 'stok tetap terdecrement (reservasi utuh)');

console.log('OK — strix-r4-1: TOCTOU stok listing tertutup predikat atomik');
