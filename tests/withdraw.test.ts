// Cek runnable: npm test — biaya tarik saldo (jalur uang: reservasi jumlah + biaya).
import { WITHDRAW_MIN, withdrawFee, withdrawTotal } from '../src/lib/pasar-settlement.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

assert(WITHDRAW_MIN === 50_000, 'minimum tarik 50.000');

// penjual: bertingkat di 200.000
assert(withdrawFee('seller', 50_000) === 3_500, 'tarik 50rb → biaya 3.500');
assert(withdrawFee('seller', 199_999) === 3_500, 'di bawah 200rb tetap 3.500');
assert(withdrawFee('seller', 200_000) === 7_500, 'tepat 200rb → 7.500');
assert(withdrawFee('seller', 5_000_000) === 7_500, 'nominal besar tetap 7.500');

// pembeli: gratis
assert(withdrawFee('buyer', 50_000) === 0, 'pembeli tanpa biaya');
assert(withdrawFee('buyer', 1_000_000) === 0, 'pembeli tanpa biaya (besar)');

// total yang harus tersedia
assert(withdrawTotal('seller', 50_000) === 53_500, 'penjual butuh 53.500 untuk tarik 50rb');
assert(withdrawTotal('seller', 200_000) === 207_500, 'penjual butuh 207.500 untuk tarik 200rb');
assert(withdrawTotal('buyer', 50_000) === 50_000, 'pembeli butuh tepat 50rb');

console.log('OK — biaya tarik saldo lolos');
