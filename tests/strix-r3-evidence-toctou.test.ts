// Strix run-3 #1: INSERT bukti sengketa wajib revalidasi order masih 'disputed'
// dan uploader masih pihak pesanan (TOCTOU: owner resolve konkuren → bukti ditolak).
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const src = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');

// 1. Kontrak: INSERT evidence memuat guard status disputed + kepemilikan pihak.
const mi = src.match(/INSERT INTO order_evidence[\s\S]*?\)\.run\(\);/);
assert.ok(mi, 'blok INSERT evidence harus ada');
const blk = mi[0];
assert.ok(blk.includes("EXISTS (SELECT 1 FROM orders co WHERE co.id = ? AND co.status = 'disputed'"),
  'INSERT bukti wajib revalidasi order masih disputed');
assert.ok(blk.includes('co.buyer_id = ? OR co.seller_id = ?'),
  'INSERT bukti wajib cek uploader masih pihak pesanan');
const nBind = (blk.match(/\.run\(\)/) ? null : null);
assert.match(src, /\.bind\(crypto\.randomUUID\(\), o\.id, me\.id, me\.id === o\.buyer_id \? 'buyer' : 'seller', r\.key, note \|\| null, o\.id, me\.id, me\.id, o\.id, me\.id, me\.id\)/,
  'bind wajib 12 argumen (6 lama + order/uploader/pembanding-2 pihak)');

// 2. Probe semantik: setelah owner resolve (disputed→completed), insert = 0 baris; saat disputed = 1.
const INS = `INSERT INTO order_evidence (id, order_id, uploader_id, role, r2_key, note)
  SELECT ?, ?, ?, ?, ?, ? WHERE (
    SELECT COUNT(*) FROM order_evidence WHERE order_id = ? AND uploader_id = ?
  ) < 3
  AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')
  AND EXISTS (SELECT 1 FROM orders co
    WHERE co.id = ? AND co.status = 'disputed' AND (co.buyer_id = ? OR co.seller_id = ?))`;

function freshDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, account_status TEXT);
           CREATE TABLE orders (id TEXT PRIMARY KEY, buyer_id TEXT, seller_id TEXT, status TEXT);
           CREATE TABLE order_evidence (id TEXT PRIMARY KEY, order_id TEXT, uploader_id TEXT, role TEXT, r2_key TEXT, note TEXT);
           INSERT INTO users VALUES ('buyer', 'active');
           INSERT INTO orders VALUES ('o1', 'buyer', 'seller', 'disputed')`);
  return db;
}
const ins = (db: DatabaseSync, id: string) =>
  db.prepare(INS).run(id, 'o1', 'buyer', 'buyer', 'k/' + id, null, 'o1', 'buyer', 'buyer', 'o1', 'buyer', 'seller');

// A) masih disputed: insert 1x, replay ke-4 ditolak cap
let db = freshDb();
assert.equal(Number(ins(db, 'e1').changes), 1);
assert.equal(Number(ins(db, 'e2').changes), 1);
assert.equal(Number(ins(db, 'e3').changes), 1);
assert.equal(Number(ins(db, 'e4').changes), 0, 'cap 3 per pihak tetap jalan');

// B) owner resolve konkuren: status completed → insert 0 baris
db = freshDb();
db.prepare("UPDATE orders SET status = 'completed' WHERE id = 'o1' AND status = 'disputed'").run();
assert.equal(Number(ins(db, 'e5').changes), 0, 'bukti tidak boleh masuk setelah sengketa selesai');
assert.equal(Number((db.prepare("SELECT COUNT(*) n FROM order_evidence WHERE order_id='o1'").get() as any).n), 0);

// C) bukan pihak pesanan: ditolak
db = freshDb();
db.exec("INSERT INTO users VALUES ('intruder', 'active')");
assert.equal(Number(db.prepare(INS).run('e6', 'o1', 'intruder', 'buyer', 'k/e6', null, 'o1', 'intruder', 'o1', 'intruder', 'intruder').changes), 0, 'unggah dari non-pihak ditolak predikat pihak');

console.log('OK — strix-r3-1: bukti sengketa anti-TOCTOU');
