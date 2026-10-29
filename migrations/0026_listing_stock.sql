-- Stok listing: satu order memesan satu unit; listing lama mempertahankan perilaku lama.
ALTER TABLE listings ADD COLUMN stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0 AND stock <= 999);
UPDATE listings SET stock = 0 WHERE status = 'sold';
-- Satu checkout aktif per judul sampai idempotency key tersedia.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_one_live_listing
  ON orders(listing_id) WHERE status IN ('created','paid','handed');
