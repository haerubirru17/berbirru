// Smoke runtime Strix run-2 (read-only terhadap data: hanya rate-limit ephemeral di D1-uji).
const B = 'https://berbirru-uji.haerubirru17.workers.dev';
const assert = (c, m) => { if (!c) throw new Error('GAGAL: ' + m); };

// F20: flood 35x unknown-order → semua 404, tidak boleh ada 429 (callback sah tak tersandera)
const codes = [];
for (let i = 0; i < 35; i++) {
  const r = await fetch(`${B}/api/klikqris/webhook`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ order_id: 'tidak-ada-' + i }),
  });
  codes.push(r.status);
}
const count = (c) => codes.filter((x) => x === c).length;
console.log('flood 35x unknown-order →', JSON.stringify([...new Set(codes)].map((c) => `${c}x${count(c)}`)));
assert(count(429) === 0, 'masih ada 429: flood masih membekukan jalur (F20 gagal)');
assert(count(404) === 35, '404 harus konsisten 35x (dapat: ' + JSON.stringify(codes) + ')');

// body rusak → 400
const rBad = await fetch(`${B}/api/klikqris/webhook`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{{]][' });
console.log('body rusak →', rBad.status);
assert(rBad.status === 400, 'body rusak harus 400, dapat ' + rBad.status);

// regresi wave lama: mode=evil tetap ditolak, HSTS tetap 86400 tanpa flag
const rEvil = await fetch(`${B}/api/posts?mode=evil`);
console.log('mode=evil →', rEvil.status);
assert(rEvil.status === 400, 'mode allowlist bocor, dapat ' + rEvil.status);
const hsts = (await fetch(B)).headers.get('strict-transport-security') || '';
console.log('HSTS →', hsts);
assert(hsts.includes('86400') && !hsts.includes('includeSubDomains'), 'HSTS berubah');

console.log('SMOKE RUNTIME LULUS');
