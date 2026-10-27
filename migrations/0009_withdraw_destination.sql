-- Tujuan pencairan saldo penjual (withdrawals sudah ada di 0005, hanya butuh kolom tujuan).
ALTER TABLE withdrawals ADD COLUMN method TEXT NOT NULL DEFAULT 'qris';  -- qris | bank | ewallet
ALTER TABLE withdrawals ADD COLUMN account TEXT NOT NULL DEFAULT '';     -- no. QRIS / rekening / e-wallet
