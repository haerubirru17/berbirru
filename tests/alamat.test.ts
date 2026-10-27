// Cek runnable: npm test — data penerima (jalur pengiriman: salah HP = paket gagal antar)
import { validasiPenerima, normalisasiHp } from '../src/lib/alamat.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

assert(validasiPenerima({ name: 'Budi Santoso', phone: '081234567890', postal: '40115' }).ok, 'data wajar diterima');
assert(!validasiPenerima({ name: 'Bu', phone: '081234567890', postal: '40115' }).ok, 'nama 2 huruf ditolak');
assert(!validasiPenerima({ name: 'Budi', phone: '0812', postal: '40115' }).ok, 'HP terlalu pendek ditolak');
assert(!validasiPenerima({ name: 'Budi', phone: '1234567890', postal: '40115' }).ok, 'HP tanpa 0 ditolak');
assert(!validasiPenerima({ name: 'Budi', phone: '081234567890', postal: '4011' }).ok, 'kode pos 4 angka ditolak');
assert(!validasiPenerima({ name: 'Budi', phone: '081234567890', postal: '401155' }).ok, 'kode pos 6 angka ditolak');
assert(normalisasiHp('+62 812-3456-7890') === '081234567890', 'format +62 dinormalkan');
assert(validasiPenerima({ name: 'Budi', phone: '+62 812-3456-7890', postal: '40115' }).ok, 'HP +62 tetap diterima');

console.log('OK — validasi penerima lolos');
