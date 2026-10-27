// Cek runnable: npm test — penjaga resi (jalur uang: auto-selesai D+5 ditahan bila belum terverifikasi)
import { validasiFormatResi } from '../src/kurir.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

assert(validasiFormatResi('JP1234567890').ok, 'resi JNE wajar diterima');
assert(validasiFormatResi('000123456789').ok, 'resi SiCepat numerik diterima');
assert(validasiFormatResi('JX-99887766').ok, 'tanda hubung diterima');
assert(!validasiFormatResi('').ok, 'kosong ditolak');
assert(!validasiFormatResi('   ').ok, 'spasi saja ditolak');
assert(!validasiFormatResi('ok').ok, 'teks 2 huruf ditolak');
assert(!validasiFormatResi('paket sudah dikirim').ok, 'kalimat spasi ditolak');
assert(!validasiFormatResi('A'.repeat(26)).ok, 'terlalu panjang ditolak');

console.log('OK — validasi format resi lolos');
