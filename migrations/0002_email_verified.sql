-- Verifikasi kepemilikan email (temuan Strix #23: pre-hijacking akun).
-- DEFAULT 1 → seluruh user LAMA otomatis dianggap terverifikasi (tidak ada yang terkunci).
-- Insert registrasi baru SELALU menulis nilai eksplisit (0 lalu 1 saat OTP cocok).
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;
