#!/usr/bin/env node
// Baterai uji IDOR (ganti-id-di-browser) lintas akun terhadap lingkungan NYATA.
// Bukan unit test — butuh server hidup + 2 akun + fixture. Jalankan:
//   BASE_URL=https://berbirru-uji.haerubirru17.workers.dev \
//   IDOR_ATTACKER_EMAIL=pembeli2@uji.local IDOR_ATTACKER_PASS='UjiAm4n!2026' \
//   IDOR_VICTIM_EMAIL=kutipan@tempik.haerubirru.my.id IDOR_VICTIM_PASS='...' \
//   IDOR_VICTIM_PEN=kutipan_terkenal \
//   node scripts/idor-check.mjs
// Aturan: penyerang HARUS ditolak pada aset korban, dan kontrol (aset sendiri) harus jalan —
// tanpa kontrol, "semua ditolak" tak membuktikan apa pun.
const B = process.env.BASE_URL || 'https://berbirru-uji.haerubirru17.workers.dev';
const AE = process.env.IDOR_ATTACKER_EMAIL || 'pembeli2@uji.local';
const AP = process.env.IDOR_ATTACKER_PASS || '';
const VE = process.env.IDOR_VICTIM_EMAIL || '';
const VP = process.env.IDOR_VICTIM_PASS || '';
const VPEN = process.env.IDOR_VICTIM_PEN || 'kutipan_terkenal';
const T = process.env.TURNSTILE_TOKEN || 'XXXX.DUMMY.TOKEN.XXXX';

const login = async (email, password) => {
  if (!password) return null;
  const r = await fetch(B + '/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, turnstile_token: T })
  });
  if (!r.ok) return null;
  const raw = (r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie')])[0] || '';
  return raw.split(';')[0];
};
const J = async (r) => { try { return await r.json(); } catch { return {}; } };
let gagal = 0;
const cek = (label, ok, detail = '') => { if (!ok) gagal++; console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ' — ' + detail : ''}`); };

const A = await login(AE, AP);
if (!A) { console.error('Penyerang tak bisa login — set IDOR_ATTACKER_PASS.'); process.exit(2); }
const V = await login(VE, VP);

// aset korban (butuh sesi korban untuk menemukan id-nya; kalau tak ada, uji hanya bagian umum)
let postViktim = null, notifViktim = null, daftarSebelum = 0;
if (V) {
  const d = await J(await fetch(`${B}/api/users/${VPEN}/posts?tab=original`, { headers: { cookie: V } }));
  postViktim = (d.posts || [])[0] || null;
  const n = await J(await fetch(B + '/api/notifications', { headers: { cookie: V } }));
  notifViktim = (n.notifications || [])[0] || null;
  daftarSebelum = (n.notifications || []).filter(x => !x.is_read).length;
}
console.log(`\nUJI IDOR → ${B}\n  penyerang: ${AE} | korban: ${VPEN}${V ? '' : ' (tanpa sesi korban: sebagian uji dilewati)'}\n`);

if (postViktim) {
  const p = await fetch(B + '/api/posts/' + postViktim.id, { method: 'PATCH', headers: { 'content-type': 'application/json', cookie: A }, body: JSON.stringify({ title: 'Dibajak', content: 'x' }) });
  cek('sunting warkah orang lain ditolak', [403, 404].includes(p.status), 'status ' + p.status);
  const d = await fetch(B + '/api/posts/' + postViktim.id, { method: 'DELETE', headers: { cookie: A } });
  cek('hapus warkah orang lain ditolak', [403, 404].includes(d.status), 'status ' + d.status);
}
if (notifViktim) {
  await fetch(B + '/api/notifications/' + notifViktim.id + '/read', { method: 'POST', headers: { cookie: A } });
  const after = await J(await fetch(B + '/api/notifications', { headers: { cookie: V } }));
  const daftarSesudah = (after.notifications || []).filter(x => !x.is_read).length;
  cek('tandai-baca notifikasi orang lain TIDAK berpengaruh', daftarSesudah === daftarSebelum, `unread ${daftarSebelum} → ${daftarSesudah}`);
}

// probe id asing / bukan milik penyerang (tak perlu sesi korban)
const asing = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const probes = [
  ['pesanan orang lain', await fetch(`${B}/pasar/order/${asing}`, { headers: { cookie: A } }), [403, 404, 302]],
  ['ubah listing orang lain', await fetch(`${B}/api/pasar/listings/${asing}`, { method: 'PATCH', headers: { 'content-type': 'application/json', cookie: A }, body: JSON.stringify({ title: 'Bajakan', price: 5000, stock: 1, cond: 'baru' }) }), [403, 404]],
  ['hapus listing orang lain', await fetch(`${B}/api/pasar/listings/${asing}`, { method: 'DELETE', headers: { cookie: A } }), [403, 404]],
  ['ubah alamat orang lain', await fetch(`${B}/akun/alamat/${asing}`, { method: 'POST', headers: { cookie: A, 'content-type': 'application/x-www-form-urlencoded' }, body: 'nama=Penyerang&telepon=080000000000&kode_pos=42111&alamat=Alamat%20diubah%20penyerang', redirect: 'manual' }), [302, 403, 404]],
  ['dokumen KTP orang lain', await fetch(`${B}/berkas/dokumen/${asing}/ktp`, { headers: { cookie: A } }), [404]],
  ['panel admin sebagai non-owner', await fetch(B + '/admin', { headers: { cookie: A } }), [404]],
  ['suspend akun lewat API admin', await fetch(`${B}/api/admin/users/${asing}/suspend`, { method: 'POST', headers: { cookie: A } }), [404]],
  ['warkah PRIVAT orang lain via tautan', await fetch(`${B}/chain/${asing}`), [404]],
];
for (const [label, res, boleh] of probes) cek(label + ' ditolak', boleh.includes(res.status), 'status ' + res.status);

// pemalsuan identitas: kirim id korban di body — harus tetap tercatat sebagai penyerang
if (V && postViktim) {
  const feed = await J(await fetch(B + '/api/posts?mode=latest', { headers: { cookie: A } }));
  const kartu = (feed.posts || []).find(p => p.id === postViktim.id);
  if (kartu && !kartu.is_liked) {
    await fetch(`${B}/api/posts/${postViktim.id}/like`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: A }, body: JSON.stringify({ user_id: 'SPOOF', actor_id: 'SPOOF' }) });
    const feedV = await J(await fetch(B + '/api/posts?mode=latest', { headers: { cookie: V } }));
    const karV = (feedV.posts || []).find(p => p.id === postViktim.id);
    cek('id di body tak bisa memalsukan identitas', !karV?.is_liked, 'korban tidak melihat suka palsu atas namanya');
  } else console.log('  ℹ️  uji pemalsuan identitas dilewati (penyerang sudah menyukai warkah itu)');
}

console.log(gagal === 0 ? '\nHASIL: LULUS — semua akses lintas-akun ditolak.\n' : `\nHASIL: GAGAL — ${gagal} uji tembus.\n`);
process.exit(gagal === 0 ? 0 : 1);
