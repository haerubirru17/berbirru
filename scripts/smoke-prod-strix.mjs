const B = 'https://berbirru.com';
const assert = (c, m) => { if (!c) throw new Error('GAGAL: ' + m); };
// F20 di prod: flood 34x unknown-order → semua 404, tanpa 429
const codes = [];
for (let i = 0; i < 34; i++) {
  const r = await fetch(`${B}/api/klikqris/webhook`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ order_id: 'verif-tidak-ada-' + i }) });
  codes.push(r.status);
}
const count = (c) => codes.filter((x) => x === c).length;
console.log('flood →', JSON.stringify([...new Set(codes)].map((c) => `${c}x${count(c)}`)));
assert(count(429) === 0 && count(404) >= 30, 'flood prod masih membekukan jalur');
// regresi wave lama (read-only)
const rEvil = await fetch(`${B}/api/posts?mode=evil`);
console.log('mode=evil →', rEvil.status); assert(rEvil.status === 400, 'mode allowlist bocor');
const hsts = (await fetch(B)).headers.get('strict-transport-security') || '';
console.log('HSTS →', hsts); assert(hsts.includes('86400'), 'HSTS berubah');
console.log('SMOKE PROD LULUS');
