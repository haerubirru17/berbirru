-- D1 Database Schema for BERBIRRU.COM

-- 1. Users & Authors Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pen_name TEXT UNIQUE NOT NULL,
  city TEXT DEFAULT 'Nusantara',
  bio TEXT DEFAULT 'Goresan perenungan rasa dan bait kata.',
  -- 0 = menunggu bukti kepemilikan email (OTP). User lama = 1 (default migrasi 0002).
  email_verified INTEGER NOT NULL DEFAULT 1,
  account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active','suspended')),
  suspended_reason TEXT,
  suspended_at TEXT,
  suspended_by TEXT,
  account_action_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Sessions Table (vuln-0005: sesi disimpan sebagai SHA-256 di token_hash; token plaintext tak tersimpan.
--    Baris OTP pending tetap memakai kolom token dengan prefix otp_<hash>.)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT,
  token_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);

-- 3. Adaptive OTP Security Table
CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Posts / Warkah Table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  title TEXT,
  parent_id TEXT, -- NULL for original warkah, or post_id for estafet chains
  visibility TEXT NOT NULL DEFAULT 'public', -- 'public' | 'private'
  likes_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  chains_count INTEGER DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'visible'
    CHECK (moderation_status IN ('visible','quarantined')),
  moderation_reason TEXT,
  moderated_at TEXT,
  moderated_by TEXT,
  moderation_action_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Likes Relation Table
CREATE TABLE IF NOT EXISTS likes (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 6. Bookmarks Relation Table
CREATE TABLE IF NOT EXISTS bookmarks (
  user_id TEXT NOT NULL,
  post_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 7. Follows Relation Table
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Notifications (dulu dibuat manual di produksi — masuk schema agar instalasi lokal sama)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  type TEXT NOT NULL,
  post_id TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- 9. Rate limiting (global lintas-datacenter; lihat src/index.ts hitRate)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL
);

-- 10. Audit moderasi sosial; sengaja terpisah dari owner_actions Rekber.
CREATE TABLE IF NOT EXISTS social_admin_actions (
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

-- 11. Audit status akun sosial; terpisah dari audit post dan owner_actions Rekber.
CREATE TABLE IF NOT EXISTS social_account_actions (
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

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_parent ON posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_users_pen_name ON users(pen_name);
CREATE INDEX IF NOT EXISTS idx_posts_moderation_created
  ON posts(moderation_status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_social_admin_actions_post
  ON social_admin_actions(target_post_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_social_admin_actions_time
  ON social_admin_actions(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_users_account_status_created
  ON users(account_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_account_actions_target_created
  ON social_account_actions(target_user_id, created_at DESC);
