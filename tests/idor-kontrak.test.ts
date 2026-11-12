// Kontrak IDOR (grep atas source): setiap route ber-`:id` yang MENGUBAH data harus menyebut
// pemeriksaan kepemilikan di dalam handler-nya, dan route owner harus memakai gerbang isOwner.
// Hermetic — tak butuh server. Baterai uji runtime-nya: scripts/idor-check.mjs
// Jalankan: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// admin/owner dikecualikan dari cek generik: rutenya satu-baris mendelegasi ke helper,
// gerbangnya ada DI HELPER (diperiksa terpisah di bawah).
const BERKAS = ['auth', 'media', 'notifications', 'pasar', 'social', 'kurir'];
const guard = /author_id\s*[=!]==?|\.user_id\b|user_id\s*=|seller_id|buyer_id|isOwner|OWNER_EMAIL|getAuthUser/;
const routePola = /app\.(post|put|delete|patch)\(\s*'([^']*:([a-zA-Z_]+)[^']*)'/g;

let diperiksa = 0;
for (const nama of BERKAS) {
  const src = readFileSync(new URL(`../src/routes/${nama}.ts`, import.meta.url), 'utf8');
  let m;
  while ((m = routePola.exec(src))) {
    const [penuh, metode, rute] = m;
    const sisa = src.slice(m.index + penuh.length);
    const berikut = sisa.search(/\napp\.(get|post|put|delete|patch)\(/);
    const isi = berikut === -1 ? sisa.slice(0, 4000) : sisa.slice(0, berikut);
    diperiksa++;
    assert.ok(guard.test(isi), `${nama}.ts: ${metode.toUpperCase()} ${rute} tidak menyebut pemeriksaan pemilik/sesi — wajib diperiksa manual`);
  }
}
// Route admin/owner WAJIB bergerbang. Pola repo: rute satu-baris -> helper (mutate/accountMutate),
// jadi yang diperiksa = setiap NAMA helper yang dipanggil rute harus punya `!isOwner(` di definisinya.
const admin = readFileSync(new URL('../src/routes/admin.ts', import.meta.url), 'utf8');
const dipanggil = [...admin.matchAll(/app\.(?:get|post)\(\s*'\/api\/admin[^']*',\s*\([^)]*\)\s*=>\s*([a-zA-Z_]+)\(/g)].map(m => m[1]);
assert.ok(dipanggil.length >= 4, `rute admin yang mendelegasi ke helper ditemukan (${dipanggil.length})`);
for (const nama of new Set(dipanggil)) {
  const i = admin.search(new RegExp(`(function|const)\\s+${nama}\\s*[=(]`));
  assert.ok(i > -1, `helper admin ${nama} terdefinisi`);
  const badan = admin.slice(i, i + 1200);
  assert.match(badan, /!isOwner\(c\.env, me\)/, `helper admin ${nama} bergerbang isOwner (404)`);
}
assert.ok((admin.match(/!isOwner\(c\.env, me\)/g) || []).length >= 4, 'gerbang isOwner muncul di tiap helper admin');
assert.ok(!/app\.(post|put|delete|patch)\(\s*'\/api\/(admin|owner)\//.test(readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8')), 'route sosial tak boleh menyentuh namespace admin/owner');

// Bukti pendukung: pencarian alamat & pesanan mengikat pemilik di SQL (pola yang dijaga)
const pasar = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');
assert.match(pasar, /FROM addresses WHERE id = \? AND user_id = \?/, 'alamat: baca milik sendiri mengikat user_id');
assert.match(pasar, /seller_id !== me\.id/, 'listing: tolak bila bukan penjualnya');

console.log(`OK — kontrak IDOR: ${diperiksa} route ber-id diperiksa, gerbang admin utuh, pengikatan pemilik terjaga`);
