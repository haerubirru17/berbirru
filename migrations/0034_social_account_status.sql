-- Status akun sosial. Additive; audit akun terpisah dari social_admin_actions (post-only).
ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'
  CHECK (account_status IN ('active','suspended'));
ALTER TABLE users ADD COLUMN suspended_reason TEXT;
ALTER TABLE users ADD COLUMN suspended_at TEXT;
ALTER TABLE users ADD COLUMN suspended_by TEXT;
ALTER TABLE users ADD COLUMN account_action_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_account_status_created
  ON users(account_status, created_at DESC);

CREATE TABLE social_account_actions (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('user_suspend','user_reinstate')),
  target_user_id TEXT NOT NULL,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 10 AND 500),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (target_user_id) REFERENCES users(id),
  FOREIGN KEY (actor_user_id) REFERENCES users(id)
);
CREATE INDEX idx_social_account_actions_target_created
  ON social_account_actions(target_user_id, created_at DESC);
