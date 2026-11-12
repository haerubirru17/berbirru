// Fase 1 OpenOngkir: wilayah dibaca dari tabel D1, bukan lagi live BinderByte.
// Jalankan: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { ambilWilayah } from '../src/kurir.ts';

// DB in-memory dari migrasi asli + fixture kecil (kode riil dari seed).
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../migrations/0038_wilayah.sql', import.meta.url), 'utf8'));
db.exec(`
  INSERT INTO wilayah (id, parent_id, level, name) VALUES
  ('36', NULL, 'provinsi', 'BANTEN'),
  ('31', NULL, 'provinsi', 'DAERAH KHUSUS IBUKOTA JAKARTA'),
  ('36.72', '36', 'kabupaten', 'KOTA CILEGON'),
  ('31.71', '31', 'kabupaten', 'KOTA JAKARTA PUSAT'),
  ('36.72.01', '36.72', 'kecamatan', 'CIBEBER'),
  ('36.72.02', '36.72', 'kecamatan', 'CILEGON'),
  ('31.71.01', '31.71', 'kecamatan', 'GAMBIR');
`);

// Stub minimal antarmuka D1 (prepare/bind/all) di atas node:sqlite.
const env = {
  DB: {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({
        all: async () => ({ results: db.prepare(sql).all(...(args as any[])) }),
      }),
    }),
  },
};

// 1. Provinsi: parent kosong -> semua provinsi, urut nama
const prov = await ambilWilayah(env);
assert.equal(prov.ok, true, 'provinsi ok');
assert.deepEqual(prov.items.map((x) => x.id), ['36', '31'], 'provinsi urut nama (BANTEN dulu)');
assert.equal(prov.items[0].name, 'BANTEN', 'nama provinsi benar');

// 2. Kabupaten: parent id provinsi
const kab = await ambilWilayah(env, '36');
assert.equal(kab.ok, true, 'kabupaten ok');
assert.deepEqual(kab.items, [{ id: '36.72', name: 'KOTA CILEGON' }], 'kabupaten Banten');

// 3. Kecamatan: parent id kabupaten, urut nama
const kec = await ambilWilayah(env, '36.72');
assert.equal(kec.ok, true, 'kecamatan ok');
assert.deepEqual(kec.items.map((x) => x.id), ['36.72.01', '36.72.02'], 'kecamatan Cilegon urut nama');

// 4. Parent tak dikenal -> ok dengan daftar kosong (bukan error)
const kosong = await ambilWilayah(env, '99');
assert.equal(kosong.ok, true, 'parent tak dikenal tetap ok');
assert.deepEqual(kosong.items, [], 'parent tak dikenal -> daftar kosong');

// 5. Jalur mock tetap hidup untuk dev/test
const mock = await ambilWilayah({ KURIR_MOCK: 1 }, '36');
assert.equal(mock.ok, true, 'mock ok');
assert.ok(mock.items.some((x) => x.id === '36.72'), 'mock berisi Cilegon');

// 6. Tanpa DB -> error layanan belum aktif (perilaku lama saat key kosong)
const noDb = await ambilWilayah({});
assert.equal(noDb.ok, false, 'tanpa DB -> tidak ok');
assert.equal(noDb.error, 'Layanan wilayah belum aktif', 'pesan error dipertahankan');

// 7. Kontrak sumber: tidak ada lagi fetch live ke BinderByte /wilayah/*
const src = readFileSync(new URL('../src/kurir.ts', import.meta.url), 'utf8');
assert.ok(!src.includes('const ROOT'), 'konstanta ROOT (basis /wilayah) dihapus');
assert.ok(!src.includes('/wilayah/${'), 'tidak ada lagi URL fetch /wilayah');
assert.ok(src.includes('FROM wilayah'), 'ambilWilayah query tabel wilayah');

// 8. Migrasi + seed ada dan konsisten
const migrasi = readFileSync(new URL('../migrations/0038_wilayah.sql', import.meta.url), 'utf8');
assert.ok(migrasi.includes('CREATE TABLE wilayah'), 'migrasi 0038 membuat tabel wilayah');
assert.ok(migrasi.includes('idx_wilayah_parent'), 'migrasi 0038 membuat indeks parent_id');
const seed = readFileSync(new URL('../scripts/seed-wilayah.sql', import.meta.url), 'utf8');
assert.ok(seed.includes("'36.72.01'") && seed.includes('CIBEBER'), 'seed memuat Cibeber 36.72.01');
assert.equal((seed.match(/INSERT OR REPLACE INTO wilayah/g) || []).length, 16, 'seed: 16 statement INSERT (<=500 baris each)');

console.log('OK — wilayah Fase 1: D1 (provinsi/kabupaten/kecamatan), mock, tanpa fetch BinderByte');
