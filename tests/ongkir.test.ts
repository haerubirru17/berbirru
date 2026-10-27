// Cek runnable: npm test
// Fixture = bentuk respons asli /v1/cost (26 Okt 2026, key live): results[].costs[]
import { rapikanTarif } from '../src/kurir.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

const asli = [{
  code: 'jne', name: 'JNE Express', costs: [
    { service: 'JTR', price: '55000', estimated: '3-4 hari' },
    { service: 'JTR<130', price: '550000', estimated: '3-4 hari' },
    { service: 'JTR>200', price: '1100000', estimated: '3-4 hari' },
    { service: 'REG', price: '13000', estimated: '1-2 hari' },
    { service: 'SPS', price: '275000', estimated: '0-24 H' },
    { service: 'YES', price: '25000', estimated: '1-1 hari' },
    { service: 'REG', price: '13000', estimated: 'duplikat' },
  ],
}];

const o = rapikanTarif(asli, 'jne');
const nama = o.map((x) => x.service).join(',');
assert(nama === 'REG,YES', 'hanya layanan paket wajar yang lolos: ' + nama);
assert(o[0].price === 13000, 'harga diambil apa adanya (rupiah)');
assert(o[0].courierName === 'JNE', 'label kurir terisi');
assert(o[0].eta === '1-2 hari', 'estimasi diteruskan');
assert(new Set(o.map((x) => x.service)).size === o.length, 'tidak ada layanan duplikat');

// harga 1000x lipat (satuan salah) harus dibuang, bukan ditampilkan
const salahSatuan = [{ code: 'jne', costs: [{ service: 'REG', price: '13000000' }] }];
assert(rapikanTarif(salahSatuan, 'jne').length === 0, 'harga tak masuk akal dibuang');

// data aneh tidak boleh melempar error
assert(rapikanTarif([], 'jne').length === 0, 'respons kosong aman');
assert(rapikanTarif([{ costs: null }], 'jne').length === 0, 'costs null aman');
assert(rapikanTarif([{ costs: [{ service: '', price: 10000 }] }], 'jne').length === 0, 'service kosong dibuang');

// urut harga termurah dulu
const multi = [{ costs: [{ service: 'YES', price: 25000 }, { service: 'REG', price: 13000 }] }];
assert(rapikanTarif(multi, 'jne').map((x) => x.price).join(',') === '13000,25000', 'urut termurah');

console.log('OK — tarif ongkir: parsing respons live & filter lolos');
