-- Buku alamat: pembeli bisa menyimpan sampai 5 alamat berlabel.
CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT,
  receiver TEXT NOT NULL,
  phone TEXT NOT NULL,
  postal TEXT NOT NULL,
  text TEXT NOT NULL,
  province_id TEXT, province_name TEXT,
  city_id TEXT, city_name TEXT,
  district_id TEXT, district_name TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(user_id, is_default);

-- Pindahkan alamat tunggal lama (users.addr_*) menjadi satu baris "Rumah".
INSERT INTO addresses (id, user_id, label, receiver, phone, postal, text,
  province_id, province_name, city_id, city_name, district_id, district_name, is_default)
SELECT 'addr-' || u.id, u.id, 'Rumah', u.addr_receiver, u.addr_phone, u.addr_postal, u.addr_text,
       u.addr_province_id, u.addr_province_name, u.addr_city_id, u.addr_city_name,
       u.addr_district_id, u.addr_district_name, 1
  FROM users u
 WHERE u.addr_receiver IS NOT NULL AND u.addr_text IS NOT NULL AND length(u.addr_text) >= 10
   AND NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id = u.id);
