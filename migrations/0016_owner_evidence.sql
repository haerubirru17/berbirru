-- Jejak keputusan owner: alasan putusan & bukti transfer, bukan cuma status.
ALTER TABLE orders ADD COLUMN resolution_note TEXT;
ALTER TABLE orders ADD COLUMN resolved_at TEXT;

ALTER TABLE withdrawals ADD COLUMN review_note TEXT;
ALTER TABLE withdrawals ADD COLUMN transfer_ref TEXT;
ALTER TABLE withdrawals ADD COLUMN reviewed_at TEXT;

-- Verifikasi penjual: tujuan pencairan harus bisa dicocokkan dengan nama lengkap.
ALTER TABLE users ADD COLUMN seller_review_note TEXT;
ALTER TABLE users ADD COLUMN seller_bank_name TEXT;
ALTER TABLE users ADD COLUMN seller_bank_account TEXT;
