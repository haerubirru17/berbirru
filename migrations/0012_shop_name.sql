-- Nama toko penjual (identitas jualan). Unik agar tidak ada dua toko bernama sama.
ALTER TABLE users ADD COLUMN shop_name TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_shop_name
  ON users(shop_name COLLATE NOCASE) WHERE shop_name IS NOT NULL;
