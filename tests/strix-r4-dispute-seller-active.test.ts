// Strix run-4 #3 + #5: dispute buyer-only & seller suspended tak bisa d Order-kan.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const ps = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');

// ── #3 kontrak: guard dispute hanya buyer (SEBELUM UPDATE), actor event 'buyer'.
const md = ps.match(/app\.post\('\/pasar\/order\/:id\/dispute'[\s\S]*?\n\}\);/);
assert.ok(md, 'handler dispute harus ada');
const d = md[0];
assert.ok(d.indexOf("o.buyer_id !== me.id") >= 0, 'guard buyer-only harus ada');
assert.ok(d.indexOf("o.buyer_id !== me.id") >= 0 && d.indexOf("o.buyer_id === me.id") < 0,
  'guard dispute harus buyer-only (seller ditolak)');
assert.ok(d.indexOf("o.buyer_id !== me.id") < d.indexOf("UPDATE orders SET status = 'disputed'"),
  'guard buyer harus SEBELUM UPDATE status');
assert.ok(!/me\.id === o\.buyer_id \? 'buyer' : 'seller'/.test(d), 'aktor event kini selalu buyer');

// ── #5 kontrak: SU_AKTIF didefinisikan & dipasang di semua site buyer-facing.
const core = readFileSync(new URL('../src/lib/pasar-core.ts', import.meta.url), 'utf8');
assert.ok(core.includes("EXISTS (SELECT 1 FROM users su WHERE su.id = listings.seller_id AND su.account_status = 'active'"),
  'definisi SU_AKTIF wajib ada di pasar-core');
const kurir = readFileSync(new URL('../src/routes/kurir.ts', import.meta.url), 'utf8');
const nPasar = (ps.match(/SU_AKTIF/g) || []).length;
const nKurir = (kurir.match(/SU_AKTIF/g) || []).length;
assert.ok(nPasar >= 8, 'pasar.ts wajib memasang SU_AKTIF di >= 8 site (dapat: ' + nPasar + ')');
assert.ok(nKurir >= 2, 'kurir.ts wajib import + pasang SU_AKTIF untuk ongkir (dapat: ' + nKurir + ')');
// detail non-owner memakai guard, cabang owner-inspeksi tidak
const mdet = ps.match(/owner \? 'SELECT \* FROM listings WHERE id = \?' : "SELECT \* FROM listings WHERE id = \? AND status NOT IN \('hidden','deleted'\)" \+ SU_AKTIF/);
assert.ok(mdet, 'detail non-owner ber-guard, cabang owner tetap tanpa guard');
// dua authority INSERT memakai SU_AKTIF
assert.ok((ps.match(/au\.account_status = 'active'\)\$\{SU_AKTIF\}/g) || []).length === 2,
  'kedua authority INSERT (saldo & QRIS reserve) wajib ber-guard seller aktif');

// ── #5 probe semantik: reserve QRIS + authority saldo utk seller suspended = 0 baris.
const RESERVE = `INSERT INTO orders (id, listing_id, buyer_id, status)
  SELECT ?, ?, ?, 'created' FROM listings
  WHERE id = ? AND status = 'active' AND stock > 0
    AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')
    AND EXISTS (SELECT 1 FROM users su WHERE su.id = seller_id AND su.account_status = 'active')`;
function fresh(status: string) {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE users (id TEXT PRIMARY KEY, account_status TEXT);
CREATE TABLE listings (id TEXT PRIMARY KEY, seller_id TEXT, stock INTEGER, status TEXT);
CREATE TABLE orders (id TEXT PRIMARY KEY, listing_id TEXT, buyer_id TEXT, status TEXT);
INSERT INTO users VALUES ('seller','${status}'),('buyer','active');
INSERT INTO listings VALUES ('l1','seller',1,'active')`);
  return db;
}
let db = fresh('suspended');
assert.equal(Number(db.prepare(RESERVE).run('o1', 'l1', 'buyer', 'l1', 'buyer').changes), 0, 'checkout ke seller suspended harus 0 baris');
assert.equal(Number((db.prepare("SELECT COUNT(*) n FROM orders").get() as any).n), 0);
db = fresh('active');
assert.equal(Number(db.prepare(RESERVE).run('o2', 'l1', 'buyer', 'l1', 'buyer').changes), 1, 'seller aktif tetap normal');

console.log('OK — strix-r4-3/5: dispute buyer-only; seller suspended tak bisa diorder');
