// Satu tempat untuk menjawab "uangnya sekarang di mana?" — dipakai kwitansi,
// supaya penjual & pembeli melihat kalimat yang sama, bukan menebak dari status.
export type Posisi = { judul: string; isi: string; tone: 'abu' | 'kuning' | 'hijau' | 'merah' };

const rp = (n: number) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

export function posisiDana(o: any, peran: 'pembeli' | 'penjual'): Posisi {
  const st = String(o?.status || 'created');
  const ditahan = Number(o?.qris_final_amount || (Number(o?.price || 0) + Number(o?.shipping || 0)));
  const fee = 5000;
  const bersih = Number(o?.price || 0) - fee + Number(o?.shipping || 0);

  if (st === 'created') {
    return peran === 'pembeli'
      ? { judul: 'Belum ada uang berpindah', isi: 'Kamu belum membayar. Pesanan kedaluwarsa sendiri dalam 48 jam.', tone: 'abu' }
      : { judul: 'Belum ada uang', isi: 'Pembeli belum membayar — jangan kirim buku dulu.', tone: 'abu' };
  }
  if (st === 'expired' || st === 'cancelled') {
    return { judul: 'Tidak ada uang berpindah', isi: 'Pesanan batal sebelum dibayar.', tone: 'abu' };
  }
  if (st === 'paid') {
    return peran === 'pembeli'
      ? { judul: `${rp(ditahan)} ditahan BERBIRRU`, isi: 'Uangmu aman di rekber. Penjual baru menerima setelah buku sampai dan kamu konfirmasi.', tone: 'kuning' }
      : { judul: `${rp(ditahan)} ditahan rekber`, isi: 'Uang sudah masuk tapi BELUM jadi saldomu. Kirim buku, lalu dana cair saat pembeli konfirmasi (otomatis D+5).', tone: 'kuning' };
  }
  if (st === 'handed') {
    return peran === 'pembeli'
      ? { judul: `${rp(ditahan)} masih ditahan`, isi: 'Buku dalam perjalanan. Tekan “Pesanan Diterima” untuk melepas dana ke penjual.', tone: 'kuning' }
      : { judul: `${rp(ditahan)} masih ditahan`, isi: 'Menunggu pembeli konfirmasi. Kalau tidak ada kabar, cair otomatis setelah 5 hari (dan resi harus terverifikasi kurir).', tone: 'kuning' };
  }
  if (st === 'disputed') {
    return peran === 'pembeli'
      ? { judul: `${rp(ditahan)} ditahan selama sengketa`, isi: 'Owner sedang meninjau. Dana tidak ke mana-mana sampai ada keputusan.', tone: 'merah' }
      : { judul: `${rp(ditahan)} ditahan selama sengketa`, isi: 'Dana belum jadi saldomu. Kalau owner memutuskan untukmu, dana masuk saldo; kalau refund, kembali ke pembeli.', tone: 'merah' };
  }
  if (st === 'completed') {
    return peran === 'pembeli'
      ? { judul: 'Uang sudah diteruskan ke penjual', isi: `${rp(ditahan)} dilepas dari rekber setelah kamu konfirmasi. Penjual menerima ${rp(bersih)} (fee rekber ${rp(fee)} dipotong dari harga).`, tone: 'hijau' }
      : { judul: `Masuk saldo: +${rp(bersih)}`, isi: `Dari ${rp(Number(o?.price || 0))} harga buku, fee rekber ${rp(fee)} dipotong; ongkir ${rp(Number(o?.shipping || 0))} diteruskan utuh.`, tone: 'hijau' };
  }
  if (st === 'refunded') {
    return peran === 'pembeli'
      ? { judul: `Saldo kamu +${rp(Number(o?.refund_amount || ditahan))}`, isi: 'Dana sudah masuk Saldo. Bisa dipakai belanja buku lain (asal menutup seluruh tagihan) atau ditarik ke rekening.', tone: 'hijau' }
      : { judul: 'Dana kembali ke pembeli', isi: 'Uang ini tidak pernah masuk saldomu — direkber lalu dikembalikan. Tidak ada potongan untukmu.', tone: 'abu' };
  }
  return { judul: 'Status dana tidak dikenal', isi: `Status pesanan: ${st}`, tone: 'abu' };
}
