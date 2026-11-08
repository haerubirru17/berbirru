// Strix run-4 followup: gate PASAR_TUTUP — Pasar Buku ditutup satu titik,
// owner bypass, kurir/alamat tidak terdampak, flag ada di kedua wrangler env.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const idx = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
const tomlUji = readFileSync(new URL('../wrangler.uji.toml', import.meta.url), 'utf8');

// 1. Gate terdaftar SEBELUM mount (Hono: middleware harus lebih dulu)
const iGate = idx.indexOf("app.on(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], ['/pasar', '/pasar/*', '/api/pasar/*']");
const iMount = idx.indexOf('mountPasar(app);');
assert.ok(iGate >= 0 && iMount >= 0 && iGate < iMount, 'gate harus terdaftar sebelum mountPasar');

// 2. Flag env: default TERBUKA bila var tidak diset (test harness tetap jalan)
assert.match(idx, /if \(c\.env\.PASAR_TUTUP !== '1'\) return next\(\);/, 'gate hanya aktif bila PASAR_TUTUP=1');
assert.ok(toml.includes('PASAR_TUTUP = "1"'), 'prod wrangler.toml menutup pasar');
assert.ok(tomlUji.includes('PASAR_TUTUP = "1"'), 'uji wrangler.uji.toml menutup pasar');

// 3. Owner bypass +respons sesuai bentuk (HTML utk halaman, 404 netral utk API)
assert.match(idx, /if \(user && isOwner\(c.env, user\)\) return next\(\);/, 'owner tetap bisa inspeksi');
assert.match(idx, /if \(c\.req\.path\.startsWith\('\/api\/pasar'\)\) return c\.json\(\{ ok: false \}, 404\)/, 'API ditutup netral 404');
assert.match(idx, /return c\.json\(\{ ok: false \}, 404\)/, 'API ditutup netral 404');
assert.match(idx, /return c\.html\(renderPasarTutupPage\(\), 200, \{ 'Cache-Control': 'no-store' \}\)/, 'halaman HTML info dipakai, no-store');
assert.ok(!idx.includes("'/api/kurir"), 'gate TIDAK menyentuh kurir (alamat tetap jalan)');

// 4. Halaman info
const pt = readFileSync(new URL('../src/web/pasarTutup.ts', import.meta.url), 'utf8');
assert.match(pt, /Sedang dipersiapkan/);
assert.match(pt, /jual-beli buku/);
assert.ok(pt.includes('href="/feed"'), 'tombol kembali ke beranda');

console.log('OK — pasar-gate: PASAR_TUTUP satu titik, owner bypass, kurir bebas');
