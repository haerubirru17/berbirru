// E2E Pasar pra-scan (sandbox uji). Satu file, assert-based, tanpa framework.
// Jalankan: node scripts/pasar-e2e.mjs   (BASE_URL bisa di-override)
const B = process.env.BASE_URL || 'https://berbirru-uji.haerubirru17.workers.dev';
const PW = 'UjiAm4n!2026';
const TS = 'XXXX.DUMMY.TOKEN.XXXX';
const LISTING = process.env.RACE_LISTING || '4ee571ff-86bb-4acf-8bfe-1024cb7fb2de'; // stok 1, tanpa order hidup

let pass = 0, fail = 0;
const ok = (c, name, detail = '') => { c ? (pass++, console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`)) : (fail++, console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`)); };

async function login(email) {
  const r = await fetch(B + '/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PW, turnstile_token: TS }),
  });
  const raw = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie')];
  return (raw[0] || '').split(';')[0];
}
const jpost = (p, cookie, body) => fetch(B + p, {
  method: 'POST', headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body), redirect: 'manual',
});
const jget = (p, cookie) => fetch(B + p, { headers: cookie ? { cookie } : {}, redirect: 'manual' });

const checkoutBody = (listingId) => ({
  listing_id: listingId, kesepakatan: 'E2E pra-scan: buku dibungkus rapi dan dikirim aman.',
  dest_id: '36.72.01', dest_name: 'Cibeber, Kota Cilegon, Banten', dest_address: 'Jl. Uji Coba No. 123',
  courier: 'jne', service: 'REG', receiver_name: 'Pembeli Uji Dua', receiver_phone: '08123456789', postal_code: '42452',
});

(async () => {
  const [buyer, other, seller] = await Promise.all([
    login(process.env.BUYER || 'pembeli2@uji.local'), login(process.env.OTHER || 'pembeli1@uji.local'), login('penjual1@uji.local'),
  ]);
  ok(!!buyer && !!other && !!seller, 'login 3 akun uji');

  // A. RACE STOK: 8 checkout paralel ke listing stok-1 → TEPAT 1 menang.
  // Catatan: limiter checkout 5/600s per-akun boleh menelan sisanya (429) — itu pertahanan,
  // bukan kegagalan; yang wajib: tepat 1 order jadi, dan guard stok sempat menolak (409).
  const attempts = await Promise.all(Array.from({ length: 8 }, () => jpost('/api/pasar/orders', buyer, checkoutBody(LISTING))));
  const codes = attempts.map((r) => r.status);
  const won = codes.filter((c) => c === 200).length;
  const c409 = codes.filter((c) => c === 409).length;
  const c429 = codes.filter((c) => c === 429).length;
  ok(won === 1, 'race stok: tepat 1 order', `200×${won}`);
  ok(codes.every((c) => [200, 409, 429].includes(c)), 'race stok: tak ada status tak terduga', codes.join(','));
  ok(c409 >= 1 || c429 >= 1, 'race stok: guard/limiter menahan sisanya', `409×${c409}, 429×${c429}`);

  let orderId = null;
  for (const r of attempts) { if (r.status === 200) { const j = await r.json().catch(() => ({})); orderId = j.id; break; } }
  ok(!!orderId, 'order id diperoleh');

  // B. RACE CANCEL ×3 → tepat 1 berhasil (restore stok tepat-sekali)
  const cancels = await Promise.all(Array.from({ length: 3 }, () => jpost(`/api/pasar/order/${orderId}/cancel`, buyer, {})));
  const cw = cancels.filter((r) => r.status === 200).length;
  ok(cw === 1, 'race cancel: tepat 1 berhasil', `200×${cw}`);

  // C. IDOR: akun lain tidak boleh lihat order ini
  const [st, nota, ev] = await Promise.all([
    jget(`/api/pasar/orders/${orderId}/status`, other),
    jget(`/pasar/order/${orderId}`, other),
    jpost(`/api/pasar/order/${orderId}/evidence`, other, { doc: 'ktp', key: 'x' }),
  ]);
  ok([404, 403].includes(st.status), 'IDOR status lintas akun ditolak', String(st.status));
  ok([404, 403, 302].includes(nota.status), 'IDOR halaman order lintas akun ditolak', String(nota.status));
  ok([404, 403].includes(ev.status), 'IDOR bukti sengketa lintas akun ditolak', String(ev.status));

  // D. GUARD ANONIM
  const [ongkir, wilayah, anonOrder] = await Promise.all([
    jpost('/api/pasar/ongkir', null, { listing_id: LISTING, dest_id: '36.72.01' }),
    jget('/api/kurir/wilayah?parent=31.01', null),
    jpost('/api/pasar/orders', null, checkoutBody(LISTING)),
  ]);
  ok(ongkir.status === 401, 'ongkir anonim 401', String(ongkir.status));
  ok(wilayah.status === 401, 'wilayah anonim 401', String(wilayah.status));
  ok(anonOrder.status === 401, 'checkout anonim 401', String(anonOrder.status));

  // E. WEBHOOK: order tak dikenal & signature salah
  const unknown = await jpost('/api/klikqris/webhook', null, { order_id: 'tidak-ada', signature: 'x', total_amount: 1 });
  ok(unknown.status === 404, 'webhook order tak dikenal 404', String(unknown.status));

  // F. PENCAIRAN: 1 permintaan lalu 5 paralel ulang → hanya satu boleh hidup
  const wd = { amount: 50000, bank: 'BCA', account_number: '1234567890' };
  const first = await jpost('/api/saldo/withdraw', seller, wd);
  const firstBody = await first.json().catch(() => ({}));
  ok([200, 400, 409].includes(first.status), 'pencairan pertama dijawab wajar', `${first.status} ${JSON.stringify(firstBody).slice(0, 80)}`);
  const par = await Promise.all(Array.from({ length: 5 }, () => jpost('/api/saldo/withdraw', seller, wd)));
  const parOk = par.filter((r) => r.status === 200).length;
  ok(parOk === 0, 'anti-dobel permintaan pencairan', `200×${parOk} dari 5 paralel`);
  const overdraft = await jpost('/api/saldo/withdraw', seller, { amount: 99000000, bank: 'BCA', account_number: '1234567890' });
  ok(overdraft.status >= 400, 'tarik melebihi saldo ditolak', String(overdraft.status));

  console.log(`\n${pass} PASS / ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
})();
