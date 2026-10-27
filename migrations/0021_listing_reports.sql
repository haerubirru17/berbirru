-- Laporan listing: jalur resmi pembeli melaporkan buku palsu/menyesatkan.
CREATE TABLE IF NOT EXISTS listing_reports (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,                 -- mismatch | fraud | misleading | price | other
  note TEXT,
  status TEXT NOT NULL DEFAULT 'open',  -- open | ignored | removed
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  review_note TEXT,
  reviewer_email TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unik ON listing_reports(listing_id, reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_open ON listing_reports(status, created_at DESC);
