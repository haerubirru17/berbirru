// Strix F25: polling status order-created memanggil KlikQRIS berbayar tiap request.
// Wajib ada limiter per-user SEBELUM reconcileQris dijalankan.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');

const m = src.match(/app\.get\('\/api\/pasar\/orders\/:id\/status'[\s\S]*?if \(o\.status === 'created'\) \{[\s\S]*?\n  \}/);
assert.ok(m, 'rute status & cabang created harus ada');
const blk = m[0];

const idxLimiter = blk.indexOf("hitRate(c.env.DB, `qris-status:${me.id}`");
const idxReconcile = blk.indexOf('await reconcileQris(');
assert.ok(idxLimiter >= 0, 'limiter per-user (qris-status) wajib ada di cabang created');
assert.ok(idxReconcile >= 0, 'panggilan reconcile harus ada');
assert.ok(idxLimiter < idxReconcile, 'limiter harus Dieksekusi SEBELUM reconcileQris (panggilan berbayar)');
assert.match(blk, /qris-status:\$\{me\.id\}`, 20, 60/, 'budget per-user 20/menit (rekomendasi Strix, polling-compatible)');
assert.doesNotMatch(blk, /qris-status:[^`]*\$\{o\.id\}/, 'kunci limiter per-USER, bukan per-order (per-order melarang cek utk penjual+bekerja sama)');

console.log('OK — strix-f25: polling status dibatasi 20/menit per user');
