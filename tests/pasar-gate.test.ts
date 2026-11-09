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
assert.match(tomlUji, /PASAR_TUTUP = "[01]"/, 'uji wrangler.uji.toml punya flag PASAR_TUTUP (nilai per-mode); prod yang wajib "1"');

// 3. Owner bypass +respons sesuai bentuk (HTML utk halaman, 404 netral utk API)
assert.match(idx, /if \(user && isOwner\(c.env, user\)\) return next\(\);/, 'owner tetap bisa inspeksi');
assert.match(idx, /if \(c\.req\.path\.startsWith\('\/api\/pasar'\)\) return c\.json\(\{ ok: false \}, 404\)/, 'API ditutup netral 404');
assert.match(idx, /return c\.json\(\{ ok: false \}, 404\)/, 'API ditutup netral 404');
assert.match(idx, /return c\.html\(renderPasarTutupPage\(user\), 200, \{ 'Cache-Control': 'no-store' \}\)/, 'halaman info dipakai (dgn user utk navbar) + no-store');
// pakai shell asli: CSS pasar + navbar bawah komponen app — bukan halaman statis mockup
const pt = readFileSync(new URL('../src/web/pasarTutup.ts', import.meta.url), 'utf8');
assert.match(pt, /PASAR_BASE_CSS/, 'halaman info memakai CSS dari halaman Pasar asli');
assert.match(pt, /renderBottomNav\('pasar', user, false, \{ mode: 'sosial' \}\)/, 'navbar SOSIAL dengan Pasar terpilih (is-on)');
assert.ok(!pt.includes('Kembali ke Beranda'), 'tanpa tombol kembali');
assert.ok(!idx.includes("'/api/kurir"), 'gate TIDAK menyentuh kurir (alamat tetap jalan)');

// 4. Copy halaman info
assert.match(pt, /sedang dipersiapkan/i);
assert.match(pt, /jual-beli buku/);

console.log('OK — pasar-gate: PASAR_TUTUP satu titik, owner bypass, kurir bebas');
