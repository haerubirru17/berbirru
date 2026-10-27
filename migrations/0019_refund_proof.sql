-- Bukti refund: tanpa ref & nominal, "refund" cuma status tanpa jejak uang.
ALTER TABLE orders ADD COLUMN refund_ref TEXT;
ALTER TABLE orders ADD COLUMN refund_amount INTEGER;
ALTER TABLE orders ADD COLUMN refunded_at TEXT;
