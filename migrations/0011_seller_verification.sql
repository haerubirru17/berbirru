-- Verifikasi penjual manual oleh owner: ajukan → pending → approved/rejected.
-- Penjual lama yang sudah punya listing otomatis approved supaya pasar tidak kosong.
ALTER TABLE users ADD COLUMN seller_status TEXT NOT NULL DEFAULT 'none'; -- none|pending|approved|rejected
ALTER TABLE users ADD COLUMN seller_full_name TEXT;
ALTER TABLE users ADD COLUMN seller_phone TEXT;
ALTER TABLE users ADD COLUMN seller_note TEXT;
ALTER TABLE users ADD COLUMN seller_applied_at TEXT;
ALTER TABLE users ADD COLUMN seller_reviewed_at TEXT;
ALTER TABLE users ADD COLUMN seller_reject_reason TEXT;

UPDATE users
   SET seller_status = 'approved',
       seller_reviewed_at = datetime('now')
 WHERE id IN (SELECT DISTINCT seller_id FROM listings);
