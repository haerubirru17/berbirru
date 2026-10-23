-- Store provider-final QRIS amount and absolute expiry.
ALTER TABLE orders ADD COLUMN qris_final_amount INTEGER;
ALTER TABLE orders ADD COLUMN qris_expired_at TEXT;
