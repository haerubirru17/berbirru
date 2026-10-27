import { test } from 'node:test';
import assert from 'node:assert/strict';
import { code128B, svgCode128, svgQr } from '../src/lib/barcode.ts';

// Pola Code128 untuk START B, karakter, checksum, dan STOP.
const START_B = '211214';
const STOP = '2331112';

test('code128b: struktur start/stop dan checksum', () => {
  const bits = code128B('A');
  // START B(104) → 'A'(33) → checksum(104 + 33) % 103 = 34 → STOP
  const pola = (n: number) => ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
    '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
    '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
    '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
    '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
    '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
    '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
    '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
    '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
    '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
    '114131','311141','411131','211412','211214','211232','2331112'][n];

  const keBits = (p: string) => p.split('').map((d, i) => (i % 2 === 0 ? '1' : '0').repeat(Number(d))).join('');
  assert.equal(bits, keBits(START_B) + keBits(pola(33)) + keBits(pola(34)) + keBits(STOP));
});

test('code128b: nomor resi panjang menghasilkan lebar wajar', () => {
  const bits = code128B('KAJ0310243286785');
  assert.ok(bits.length > 200 && bits.length < 400, String(bits.length));
  assert.ok(bits.endsWith('1'), 'harus diakhiri bar hitam');
});

test('code128b: menolak karakter di luar ASCII 32-126', () => {
  assert.throws(() => code128B('BUKU±'));
});

test('svg: barcode dan qr menghasilkan svg sah', () => {
  const bc = svgCode128('KAJ0310243286785');
  assert.match(bc, /^<svg xmlns/);
  assert.ok((bc.match(/<rect /g) || []).length > 20);
  const qr = svgQr('https://berbirru.com/pasar/order/x');
  assert.match(qr, /^<svg xmlns/);
  assert.ok((qr.match(/<rect /g) || []).length > 50);
});
