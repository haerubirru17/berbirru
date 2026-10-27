-- Ongkir berbasis layanan kurir (bukan ongkir flat tebakan penjual).
-- Penjual: pilih kurir + berat + kecamatan asal. Pembeli: pilih kecamatan tujuan → tarif live.
ALTER TABLE users ADD COLUMN district_id TEXT;                    -- kode kecamatan asal (BinderByte wilayah)
ALTER TABLE users ADD COLUMN district_name TEXT;                  -- label "Kec. X, Kota Y" untuk UI
ALTER TABLE listings ADD COLUMN weight_g INTEGER NOT NULL DEFAULT 1000;         -- berat buku (gram)
ALTER TABLE listings ADD COLUMN couriers TEXT NOT NULL DEFAULT '["jne","jnt","sicepat"]'; -- kode BinderByte
ALTER TABLE orders ADD COLUMN courier_code TEXT;
ALTER TABLE orders ADD COLUMN courier_name TEXT;
ALTER TABLE orders ADD COLUMN service TEXT;                       -- REG / YES / OKE ...
ALTER TABLE orders ADD COLUMN eta TEXT;                           -- estimasi dari provider
ALTER TABLE orders ADD COLUMN dest_district_id TEXT;
ALTER TABLE orders ADD COLUMN dest_district_name TEXT;
ALTER TABLE orders ADD COLUMN dest_address TEXT;
