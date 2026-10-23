// Cek runnable: npm test
import { settlementAmounts, providerAmountMatches } from '../src/lib/pasar-settlement.ts';
import { readFileSync } from 'node:fs';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

const money = settlementAmounts(100_000, 10_000, 5_000);
assert(money.sale === 110_000, 'sale harus harga + ongkir utuh');
assert(money.fee === -5_000, 'fee harus satu baris negatif');
assert(money.net === 105_000, 'saldo penjual tidak boleh kena fee dua kali');

assert(providerAmountMatches(110_000, 110_000), 'nominal provider tepat harus diterima');
assert(!providerAmountMatches(undefined, 110_000), 'nominal provider hilang harus ditolak');
assert(!providerAmountMatches(109_999, 110_000), 'nominal provider berbeda harus ditolak');

const migration = readFileSync(new URL('../migrations/0007_ledger_settlement.sql', import.meta.url), 'utf8');
assert(migration.includes("WHERE status IN ('created','paid','handed')"), 'migrasi harus mengunci satu order aktif per listing');
assert(migration.includes('idx_ledger_order_kind'), 'migrasi harus mengunci settlement per order/kind');

console.log('OK — pasar settlement: fee sekali, QRIS fail-closed, order aktif unik');
