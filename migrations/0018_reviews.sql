-- Ulasan pembeli setelah pesanan selesai. Satu pesanan = satu ulasan.
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  listing_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  buyer_id TEXT NOT NULL,
  stars INTEGER NOT NULL,          -- 1..5
  body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reviews_seller ON reviews(seller_id, created_at DESC);
