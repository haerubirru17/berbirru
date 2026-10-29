import assert from 'node:assert/strict';
import { validStock, canRestoreStock } from '../src/lib/pasar-inventory.ts';

assert.equal(validStock(1), 1);
assert.equal(validStock('999'), 999);
assert.equal(validStock(0), null);
assert.equal(validStock(0, true), 0);
for (const bad of [-1, 1000, 1.5, 'abc', null, undefined]) assert.equal(validStock(bad, true), null);
assert.equal(canRestoreStock('created', 'cancelled'), true);
assert.equal(canRestoreStock('created', 'expired'), true);
assert.equal(canRestoreStock('paid', 'cancelled'), true);
assert.equal(canRestoreStock('handed', 'cancelled'), false);
assert.equal(canRestoreStock('completed', 'expired'), false);
console.log('OK — validasi dan transisi stok Pasar Buku lolos');
