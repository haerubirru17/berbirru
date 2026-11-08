// Strix run-3 #2/3: dua route proxy provider BERBAYAR wajib sesi aktif SEBELUM
// limiter, parsing, DB lookup, dan panggilan provider. Tamu = 401, nol upstream.
// Route: GET /api/kurir/wilayah, POST /api/pasar/ongkir.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/routes/kurir.ts', import.meta.url), 'utf8');

// ── #2 wilayah: getAuthUser + 401 SEBELUM hitRate & ambilWilayah
const mw = src.match(/app\.get\('\/api\/kurir\/wilayah'[\s\S]*?\n\}\);/);
assert.ok(mw, 'handler wilayah harus ada');
const w = mw[0];
const iAuth = w.indexOf('getAuthUser(c)');
const iLim = w.indexOf('hitRate(');
const iProv = w.indexOf('ambilWilayah(');
assert.ok(iAuth >= 0, 'wilayah wajib getAuthUser');
assert.ok(iLim >= 0 && iAuth < iLim, 'auth harus SEBELUM limiter (tamu tak boleh makan budget)');
assert.ok(iProv >= 0 && iAuth < iProv, 'auth harus SEBELUM panggil provider berbayar');
assert.match(w, /error: 'Harus masuk dulu' \}, 401\)/, 'tamu ditolak 401');

// ── #3 ongkir: sama — auth sebelum limiter, parsing body, dan cekTarifOngkir
const mo = src.match(/app\.post\('\/api\/pasar\/ongkir'[\s\S]*?\n\}\);/);
assert.ok(mo, 'handler ongkir harus ada');
const o = mo[0];
const iAuth2 = o.indexOf('getAuthUser(c)');
const iLim2 = o.indexOf('hitRate(');
const iBody = o.indexOf('c.req.json()');
const iCek = o.indexOf('cekTarifOngkir(');
assert.ok(iAuth2 >= 0, 'ongkir wajib getAuthUser');
assert.ok(iAuth2 < iLim2, 'ongkir: auth sebelum limiter');
assert.ok(iBody < 0 || iAuth2 < iBody, 'ongkir: auth sebelum parsing body');
assert.ok(iCek >= 0 && iAuth2 < iCek, 'ongkir: auth sebelum provider');
assert.match(o, /error: 'Harus masuk dulu' \}, 401\)/, 'tamu ongkir ditolak 401');

console.log('OK — strix-r3-2/3: kedua proxy berbayar wajib sesi, tamu 401 tanpa upstream');
