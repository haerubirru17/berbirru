-- Tabel cursor progres sweep (audit D-04): watermark per fase + lock satu-run.
CREATE TABLE IF NOT EXISTS sweep_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
