-- Nomor bukti pencairan yang bisa dibaca manusia (mis. WD-261028-7F3A).
-- Dipakai halaman /saldo/pencairan/<kode> sebagai dokumen internal owner & penjual.
ALTER TABLE withdrawals ADD COLUMN kode TEXT;

UPDATE withdrawals
   SET kode = 'WD-' || substr(replace(requested_at, '-', ''), 3, 6) || '-' || upper(substr(hex(randomblob(2)), 1, 4))
 WHERE kode IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wd_kode ON withdrawals(kode);
