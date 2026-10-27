// Cek runnable: npm test — kalimat "uangnya di mana" harus jujur per status & per peran.
import { posisiDana } from '../src/lib/dana.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };
const o = (st: string, extra: any = {}) => ({ status: st, price: 82000, shipping: 9000, qris_final_amount: 92000, ...extra });

// belum bayar: tidak boleh ada kata "ditahan"
for (const peran of ['pembeli', 'penjual'] as const) {
  const p = posisiDana(o('created'), peran);
  assert(!/ditahan|saldo|masuk/i.test(p.judul + p.isi), `created/${peran} tak boleh menyebut dana ditahan`);
}

// sudah bayar: ditahan, bukan saldo
const pen = posisiDana(o('paid'), 'penjual');
assert(pen.tone === 'kuning' && /ditahan/i.test(pen.judul), 'paid/penjual: dana ditahan');
assert(/BELUM jadi saldo/i.test(pen.isi), 'paid/penjual: tegaskan belum jadi saldo');
assert(/92\.000/.test(pen.judul), 'paid: nominal QRIS final dipakai');

// dikirim: masih ditahan + sebut syarat cair
const kirim = posisiDana(o('handed'), 'penjual');
assert(/5 hari/.test(kirim.isi) && /verifikasi/i.test(kirim.isi), 'handed: sebut auto D+5 + syarat resi');

// selesai: masuk saldo dengan fee 5.000 dipotong dari harga, ongkir utuh
const done = posisiDana(o('completed'), 'penjual');
assert(done.tone === 'hijau', 'completed: tone hijau');
assert(/86\.000/.test(done.judul), 'completed: 82.000 − 5.000 + 9.000 = 86.000');

// sengketa: ditahan, bukan "hilang"
const sang = posisiDana(o('disputed'), 'pembeli');
assert(sang.tone === 'merah' && /ditahan/i.test(sang.judul), 'disputed: dana ditahan');

// refund: nominal + referensi, dan penjual diberi tahu tidak pernah masuk saldo
const ref = posisiDana(o('refunded', { refund_amount: 92000 }), 'pembeli');
assert(/92\.000/.test(ref.judul) && /Saldo/.test(ref.isi), 'refunded/pembeli: masuk saldo');
const refp = posisiDana(o('refunded', { refund_amount: 92000, refund_ref: 'BCA-8891' }), 'penjual');
assert(/tidak pernah masuk saldo/i.test(refp.isi), 'refunded/penjual: tak pernah masuk saldo');

// batal/kedaluwarsa: tidak ada uang berpindah
for (const st of ['expired', 'cancelled']) {
  assert(/Tidak ada uang/i.test(posisiDana(o(st), 'pembeli').judul), `${st}: tidak ada uang`);
}

console.log('OK — kalimat posisi dana lolos');
