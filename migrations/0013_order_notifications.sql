-- Notifikasi pesanan (Pasar Buku): tautan langsung ke kwitansi.
ALTER TABLE notifications ADD COLUMN order_id TEXT;
CREATE INDEX IF NOT EXISTS idx_notif_order ON notifications(order_id);
