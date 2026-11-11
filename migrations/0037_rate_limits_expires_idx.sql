-- Pembersihan rate_limits (dijalankan probabilistik 2% request) memakai DELETE ... WHERE expires_at < now.
-- Tanpa indeks, tiap pembersihan MEMINDAI SELURUH tabel -> makin berat seiring pengguna bertambah.
-- ponytail: satu indeks cukup; pembersihan tetap probabilistik & dibungkus try/catch.
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);
