-- Fail-fast by design: before applying, both queries below must return zero rows.
-- SELECT order_id, kind, COUNT(*) FROM ledger WHERE order_id IS NOT NULL GROUP BY order_id, kind HAVING COUNT(*) > 1;
-- SELECT listing_id, COUNT(*) FROM orders WHERE status IN ('created','paid','handed') GROUP BY listing_id HAVING COUNT(*) > 1;
-- Fix ledger idempotency + D+5 settlement correctness.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_order_kind ON ledger(order_id, kind);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_one_live_listing
ON orders(listing_id)
WHERE status IN ('created','paid','handed');
