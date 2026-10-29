-- Index pesan penuh untuk warkah (audit D-08): pencarian konten tidak lagi full-scan LIKE dengan
-- Konten disimpan versi teks (HTML dibersihkan di lapisan aplikasi saat sinkron).
CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
  id UNINDEXED,
  title,
  content_text,
  tokenize = 'trigram'
);
