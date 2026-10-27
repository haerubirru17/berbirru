-- Alamat penerima lengkap: nama, HP, kode pos + satu alamat tersimpan per akun.
ALTER TABLE users ADD COLUMN addr_receiver TEXT;
ALTER TABLE users ADD COLUMN addr_phone TEXT;
ALTER TABLE users ADD COLUMN addr_province_id TEXT;
ALTER TABLE users ADD COLUMN addr_province_name TEXT;
ALTER TABLE users ADD COLUMN addr_city_id TEXT;
ALTER TABLE users ADD COLUMN addr_city_name TEXT;
ALTER TABLE users ADD COLUMN addr_district_id TEXT;
ALTER TABLE users ADD COLUMN addr_district_name TEXT;
ALTER TABLE users ADD COLUMN addr_postal TEXT;
ALTER TABLE users ADD COLUMN addr_text TEXT;

-- Snapshot ke order: alamat tersimpan bisa berubah, riwayat tidak boleh ikut berubah.
ALTER TABLE orders ADD COLUMN receiver_name TEXT;
ALTER TABLE orders ADD COLUMN receiver_phone TEXT;
ALTER TABLE orders ADD COLUMN postal_code TEXT;
