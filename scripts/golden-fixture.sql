-- Bersihkan semua notifikasi di luar baris fixture (residue eksplorasi smoke)
DELETE FROM notifications WHERE user_id IN ('snap-0001-e2e0-0000-000000000001','snap-0001-e2e0-0000-000000000002') AND id != 'snap-notf-0000000000000000000000001';
DELETE FROM notifications WHERE actor_id IN ('snap-0001-e2e0-0000-000000000001','snap-0001-e2e0-0000-000000000002') AND id != 'snap-notf-0000000000000000000000001';
-- Fixture deterministik untuk golden snapshot (ID & timestamp tetap)
PRAGMA foreign_keys=ON;
INSERT OR REPLACE INTO users (id, email, password_hash, pen_name, email_verified) VALUES
  ('snap-0001-e2e0-0000-000000000001', 'snap1@uji.local', 'pbkdf2$sha256$10000$unused$hash', 'snap1', 1),
  ('snap-0001-e2e0-0000-000000000002', 'snap2@uji.local', 'pbkdf2$sha256$10000$unused$hash', 'snap2', 1);
INSERT OR REPLACE INTO posts (id, author_id, title, content, created_at, likes_count, saves_count, chains_count, visibility) VALUES
  ('snap-post-000000000000000000000001', 'snap-0001-e2e0-0000-000000000001', 'Golden Warkah', 'kijangemas10 lumut golden', '2026-01-01 00:00:00', 1, 0, 0, 'public'),
  ('snap-post-000000000000000000000002', 'snap-0001-e2e0-0000-000000000001', 'Golden Private', 'rahasia golden', '2026-01-02 00:00:00', 0, 0, 0, 'private');
INSERT OR REPLACE INTO likes (user_id, post_id, created_at) VALUES
  ('snap-0001-e2e0-0000-000000000002', 'snap-post-000000000000000000000001', '2026-01-01 01:00:00');
INSERT OR REPLACE INTO follows (follower_id, following_id, created_at) VALUES
  ('snap-0001-e2e0-0000-000000000002', 'snap-0001-e2e0-0000-000000000001', '2026-01-01 02:00:00');
INSERT OR REPLACE INTO notifications (id, user_id, actor_id, type, post_id, is_read, created_at) VALUES
  ('snap-notf-0000000000000000000000001', 'snap-0001-e2e0-0000-000000000001', 'snap-0001-e2e0-0000-000000000002', 'follow', NULL, 0, '2026-01-01 02:00:01');
INSERT OR REPLACE INTO sessions (id, user_id, token_hash, expires_at) VALUES ('snap-sess-000000000000000000000000010', 'snap-0001-e2e0-0000-000000000001', '13d13cf3dbe087d33b7057974a9254837bf2605cb03f3fbbf343d6f5f096554c', datetime('now','+7 days'));
INSERT OR REPLACE INTO sessions (id, user_id, token_hash, expires_at) VALUES ('snap-sess-000000000000000000000000020', 'snap-0001-e2e0-0000-000000000002', '70ca827596a2b9b8dd87d906e6163ed63123fb2286c0a3a91811a8296dc36c9d', datetime('now','+7 days'));
