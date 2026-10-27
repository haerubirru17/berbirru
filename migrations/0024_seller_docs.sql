-- Dokumen verifikasi penjual: foto KTP + buku tabungan/rekening.
-- Disimpan di R2 (prefix dokumen/) dan HANYA bisa dibuka owner lewat /berkas/dokumen/:userId/:kind.
CREATE TABLE IF NOT EXISTS seller_docs (
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,              -- ktp | bank
  r2_key TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, kind)
);
