-- Performa notifikasi: sampai kini tabel notifications hanya punya indeks order_id,
-- sehingga daftar notifikasi DAN polling "belum dibaca" MEMINDAI SELURUH tabel.
-- Pada 1000 pengguna itu berarti ratusan juta baris-baca/hari terhadap kuota D1
-- (5 juta baris/hari di tier gratis) — ditemukan lewat uji EXPLAIN QUERY PLAN pada
-- data berskala (1000 akun / 3000 warkah / 5000 notifikasi).
-- ponytail: dua indeks ini melayani kedua bentuk query yang ada; tambah lagi hanya bila terukur perlu.
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, is_read);
