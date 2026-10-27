-- Jejak tindakan owner: siapa memutuskan apa, kapan, dengan alasan apa.
CREATE TABLE IF NOT EXISTS owner_actions (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  action TEXT NOT NULL,          -- seller_approve | seller_reject | dispute_refund | dispute_release | withdrawal_pay | withdrawal_reject | sweep
  target_type TEXT,              -- user | order | withdrawal | system
  target_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_owner_actions_time ON owner_actions(created_at DESC);
