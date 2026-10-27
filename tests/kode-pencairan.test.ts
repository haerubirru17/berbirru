// Cek runnable: npm test — nomor bukti pencairan harus stabil & mudah dibaca.
import { kodePencairan } from '../src/lib/pasar-settlement.ts';

const assert = (c: unknown, m: string) => { if (!c) throw new Error('GAGAL: ' + m); };

assert(kodePencairan(new Date(Date.UTC(2026, 9, 28)), '7f3a') === 'WD-261028-7F3A', 'format tanggal + suffix');
assert(kodePencairan(new Date(Date.UTC(2027, 0, 5)), 'ab') === 'WD-270105-AB00', 'tanggal & suffix pendek dipad');
assert(kodePencairan(new Date(Date.UTC(2026, 11, 31)), 'x!y@1') === 'WD-261231-XY10', 'karakter asing dibuang');
