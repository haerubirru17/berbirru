-- URL toko publik yang stabil: /toko/<shop_slug>
ALTER TABLE users ADD COLUMN shop_slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_shop_slug ON users(shop_slug) WHERE shop_slug IS NOT NULL;
