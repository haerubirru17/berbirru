-- Bukti foto untuk sengketa: pembeli & penjual mengunggah, owner memeriksa.
-- File fisik di R2 (prefix bukti/), bukan di /media publik — disajikan lewat /berkas/sengketa/:id.
CREATE TABLE IF NOT EXISTS order_evidence (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  uploader_id TEXT NOT NULL,
  role TEXT NOT NULL,              -- buyer | seller
  r2_key TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_evidence_order ON order_evidence(order_id, created_at);
