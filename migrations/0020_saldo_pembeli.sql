-- Saldo pembeli (refund jadi saldo) + biaya tarik.
ALTER TABLE withdrawals ADD COLUMN fee INTEGER NOT NULL DEFAULT 0;
ALTER TABLE withdrawals ADD COLUMN kind TEXT NOT NULL DEFAULT 'seller';   -- seller | buyer
ALTER TABLE orders ADD COLUMN paid_with TEXT;                             -- qris | saldo
