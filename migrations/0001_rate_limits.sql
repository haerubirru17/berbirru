-- Migrasi audit Strix berbirru_a5ac (2026-10-10)
-- Tabel rate limiting global (vuln-0004, vuln-0005).
-- Diterapkan dengan:
--   npx wrangler d1 execute berbirru-db --remote --file migrations/0001_rate_limits.sql
-- (atau tanpa --remote untuk database lokal)

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP NOT NULL
);
