-- Moderasi sosial post-only. Additive; aman setelah Worker R1 explicit projections.
ALTER TABLE posts ADD COLUMN moderation_status TEXT NOT NULL DEFAULT 'visible'
  CHECK (moderation_status IN ('visible','quarantined'));
ALTER TABLE posts ADD COLUMN moderation_reason TEXT;
ALTER TABLE posts ADD COLUMN moderated_at TEXT;
ALTER TABLE posts ADD COLUMN moderated_by TEXT;
ALTER TABLE posts ADD COLUMN moderation_action_id TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_moderation_created
  ON posts(moderation_status, created_at DESC, id DESC);

CREATE TABLE social_admin_actions (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('post_quarantine','post_restore')),
  target_post_id TEXT NOT NULL,
  from_status TEXT NOT NULL CHECK (from_status IN ('visible','quarantined')),
  to_status TEXT NOT NULL CHECK (to_status IN ('visible','quarantined')),
  reason TEXT NOT NULL CHECK (length(reason) BETWEEN 10 AND 500),
  created_at TEXT NOT NULL
);
CREATE INDEX idx_social_admin_actions_post
  ON social_admin_actions(target_post_id, created_at DESC, id DESC);
CREATE INDEX idx_social_admin_actions_time
  ON social_admin_actions(created_at DESC, id DESC);
