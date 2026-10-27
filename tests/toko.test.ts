// Cek runnable: npm test
import { kelompokDari, kelompokPesanan, ringkasToko, kelompokBeliDari, kelompokPesananBeli, ringkasBeli } from '../src/lib/toko.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

assert(kelompokDari('paid') === 'perlu', 'paid harus masuk tab Perlu dikirim');
assert(kelompokDari('handed') === 'kirim', 'handed harus masuk tab Dikirim');
assert(kelompokDari('completed') === 'selesai', 'completed harus masuk tab Selesai');
assert(kelompokDari('refunded') === 'selesai', 'refunded harus tetap terlihat di Selesai');
assert(kelompokDari('disputed') === null, 'disputed bukan pekerjaan kirim — tampil terpisah');
assert(kelompokDari('expired') === null, 'expired tidak boleh masuk tab mana pun');

const orders = [
  { id: 'a', status: 'paid' },
  { id: 'b', status: 'paid' },
  { id: 'c', status: 'handed' },
  { id: 'd', status: 'completed' },
  { id: 'e', status: 'refunded' },
  { id: 'f', status: 'disputed' },
  { id: 'g', status: 'expired' },
];

const r = ringkasToko(orders, 38_000, 4);
assert(r.perlu === 2, 'perlu = 2');
assert(r.kirim === 1, 'kirim = 1');
assert(r.selesai === 2, 'selesai = 2 (completed + refunded)');
assert(r.disputed === 1, 'disputed dihitung terpisah');
assert(r.saldo === 38_000, 'saldo diteruskan apa adanya');
assert(r.bukuAktif === 4, 'buku aktif diteruskan apa adanya');

assert(kelompokPesanan(orders, 'perlu').map((o) => o.id).join(',') === 'a,b', 'filter tab Perlu urut apa adanya');
assert(kelompokPesanan(orders, 'kirim').length === 1, 'filter tab Dikirim');
assert(kelompokPesanan([], 'perlu').length === 0, 'daftar kosong aman');
assert(ringkasToko([], 0, 0).perlu === 0, 'ringkasan kosong aman');

// ── sisi pembeli
assert(kelompokBeliDari('created') === 'bayar', 'created = belum bayar');
assert(kelompokBeliDari('paid') === 'proses', 'paid = diproses penjual');
assert(kelompokBeliDari('handed') === 'kirim', 'handed = dikirim');
assert(kelompokBeliDari('completed') === 'selesai', 'completed = selesai');
assert(kelompokBeliDari('refunded') === 'selesai', 'refunded tetap terlihat di selesai');
assert(kelompokBeliDari('expired') === null, 'expired tidak masuk tab pembeli');

const beli = [
  { id: 'a', status: 'created' }, { id: 'b', status: 'paid' }, { id: 'c', status: 'paid' },
  { id: 'd', status: 'handed' }, { id: 'e', status: 'completed' }, { id: 'f', status: 'disputed' },
];
const rb = ringkasBeli(beli);
// disputed kini masuk 'kirim' (sebelumnya hilang dari semua tab pembeli)
assert(rb.bayar === 1 && rb.proses === 2 && rb.kirim === 2 && rb.selesai === 1, 'ringkasan pembeli 1/2/2/1');
assert(kelompokPesananBeli(beli, 'proses').map((o) => o.id).join(',') === 'b,c', 'filter tab diproses');
assert(ringkasBeli([]).bayar === 0, 'ringkasan pembeli kosong aman');

// sengketa & batal harus tetap terlihat pembeli (dulu hilang dari semua grup)
assert(kelompokBeliDari('cancelled') === 'selesai', 'cancelled masuk grup selesai');
assert(kelompokPesananBeli(beli, 'kirim').map((o) => o.id).join(',') === 'd,f', 'sengketa ikut tampil di tab Dikirim');

console.log('OK — dashboard toko: pengelompokan status & ringkasan lolos');
