// Strix F23: QRIS creation failure harus restore stok SEBELUM flip ke cancelled.
// Kontrak sumber (urutan statement dalam batch !qris.ok) + probe semantik sqlite.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const src = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');

// 1. Kontrak: dalam blok gagal-QRIS, stmt restore-stok muncul SEBELUM stmt cancel.
const m = src.match(/if \(!qris\.ok\) \{[\s\S]*?\n  \}/);
assert.ok(m, 'blok if (!qris.ok) harus ada');
const blk = m[0];
const IDX_RESTORE = blk.indexOf("UPDATE listings SET stock = MIN(stock + 1, 999)");
const IDX_CANCEL = blk.indexOf("UPDATE orders SET status = 'cancelled'");
assert.ok(IDX_RESTORE >= 0, 'restore stok ada di blok gagal-QRIS');
assert.ok(IDX_CANCEL >= 0, 'cancel order ada di blok gagal-QRIS');
assert.ok(IDX_RESTORE < IDX_CANCEL, 'restore stok harus DI DEPAN cancel order (invarian created→restore→flip)');

// 2. Probe semantik: replay batch kedua tidak boleh double-restore (guard status='created').
const RESTORE = `UPDATE listings SET stock = MIN(stock + 1, 999)
  WHERE id = ? AND status != 'deleted'
  AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = 'created')`;
const CANCEL = `UPDATE orders SET status = 'cancelled', updated_at = datetime('now')
  WHERE id = ? AND status = 'created'`;

function freshDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE listings (id TEXT PRIMARY KEY, stock INTEGER, status TEXT);
           CREATE TABLE orders (id TEXT PRIMARY KEY, status TEXT, updated_at TEXT);
           INSERT INTO listings VALUES ('l1', 0, 'active');
           INSERT INTO orders VALUES ('o1', 'created', NULL)`);
  return db;
}
const state = (db: DatabaseSync) => {
  const r: any = db.prepare(`SELECT (SELECT status FROM orders WHERE id='o1') AS st, (SELECT stock FROM listings WHERE id='l1') AS stock`).get();
  return { st: String(r.st), stock: Number(r.stock) }; // polos-kan (node:sqlite → null-prototype)
};

// A) gagal QRIS normal: stok kembali 1x, order cancelled
let db = freshDb();
db.prepare(RESTORE).run('l1', 'o1');
db.prepare(CANCEL).run('o1');
assert.deepEqual(state(db), { st: 'cancelled', stock: 1 }, 'gagal QRIS: stok kembali & order dibatalkan');

// B) replay batch (creep guard anti double-restore): stok tetap 1
db.prepare(RESTORE).run('l1', 'o1');
db.prepare(CANCEL).run('o1');
assert.deepEqual(state(db), { st: 'cancelled', stock: 1 }, 'replay: stok harus tetap 1');

// C) cancel konkuren menang balapan: cancel dulu → restore no-op, stok tak bertambah
db = freshDb();
db.prepare(CANCEL).run('o1');
const r = db.prepare(RESTORE).run('l1', 'o1');
assert.equal(Number(r.changes), 0, 'restore setelah cancel konkuren harus no-op');
assert.deepEqual(state(db), { st: 'cancelled', stock: 0 }, 'stok tetap 0 (tak pernah berkurang dua kali)');

console.log('OK — strix-f23: gagal QRIS mengembalikan stok tepat-sekali');
