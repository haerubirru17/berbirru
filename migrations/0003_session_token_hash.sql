-- Migration: vuln-0005 — hash token sesi at-rest.
-- SQLite tak bisa melonggarkan NOT NULL → rebuild tabel: token jadi nullable
-- (kompat baris OTP), token_hash = SHA-256 token, semua sesi lama MATI
-- (plaintext tak mau dipercaya; owner setuju logout semua perangkat).
CREATE TABLE sessions_new (
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
INSERT INTO sessions_new (id, user_id, ip_address, user_agent, expires_at, created_at)
  SELECT id, user_id, ip_address, user_agent, expires_at, created_at FROM sessions;
DROP TABLE sessions;
ALTER TABLE sessions_new RENAME TO sessions;
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
