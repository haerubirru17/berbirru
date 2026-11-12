-- Fase 1 OpenOngkir: tabel wilayah mandiri di D1. Dropdown provinsi/kabupaten/
-- kecamatan tidak lagi live ke BinderByte (/wilayah/*) — ambilWilayah baca tabel ini.
-- ID memakai kode bertitik Kemendagri (NN / NN.NN / NN.NN.NN), SAMA dengan ID
-- yang selama ini dipakai BinderByte, jadi district_id penjual/pembeli yang
-- tersimpan tetap berlaku tanpa migrasi data.
-- Seed terpisah: scripts/seed-wilayah.sql (7.837 baris).
CREATE TABLE wilayah (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  level TEXT NOT NULL CHECK (level IN ('provinsi', 'kabupaten', 'kecamatan')),
  name TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wilayah_parent ON wilayah(parent_id);
