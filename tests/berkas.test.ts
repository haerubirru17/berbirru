import test from 'node:test';
import assert from 'node:assert/strict';
import { bolehLihatPesanan, bolehUnggahBukti, jenisDokumen, kunciBukti, kunciDokumen, MAKS_BUKTI_PER_PIHAK } from '../src/lib/berkas.ts';

const order = { buyer_id: 'b1', seller_id: 's1' };

test('pesanan: pembeli & penjual boleh, owner boleh, orang lain tidak', () => {
  assert.equal(bolehLihatPesanan(order, 'b1', false), true);
  assert.equal(bolehLihatPesanan(order, 's1', false), true);
  assert.equal(bolehLihatPesanan(order, null, true), true);
  assert.equal(bolehLihatPesanan(order, 'x9', false), false);
  assert.equal(bolehLihatPesanan(order, null, false), false);
  assert.equal(bolehLihatPesanan(order, 'x9', true), true);
});

test('bukti: hanya saat sengketa dan belum mencapai batas', () => {
  assert.equal(bolehUnggahBukti('disputed', 0), true);
  assert.equal(bolehUnggahBukti('disputed', MAKS_BUKTI_PER_PIHAK - 1), true);
  assert.equal(bolehUnggahBukti('disputed', MAKS_BUKTI_PER_PIHAK), false);
  assert.equal(bolehUnggahBukti('handed', 0), false);
  assert.equal(bolehUnggahBukti('completed', 0), false);
});

test('jenis dokumen: hanya ktp & bank, case-insensitive', () => {
  assert.equal(jenisDokumen('ktp'), 'ktp');
  assert.equal(jenisDokumen('BANK'), 'bank');
  assert.equal(jenisDokumen('selfie'), null);
  assert.equal(jenisDokumen(''), null);
  assert.equal(jenisDokumen(undefined), null);
});

test('kunci berkas: prefix benar & tidak bisa dipakai ulang', () => {
  const a = kunciBukti('ord1', 'u1', 'jpg', 1700000000000, 0.123456);
  const b = kunciBukti('ord1', 'u1', 'jpg', 1700000000001, 0.654321);
  assert.match(a, /^bukti\/ord1\/u1_1700000000000_[a-z0-9]+\.jpg$/);
  assert.notEqual(a, b);
  assert.match(kunciDokumen('u1', 'ktp', 'png', 1700000000000), /^dokumen\/u1\/ktp_1700000000000\.png$/);
});
