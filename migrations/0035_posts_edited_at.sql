-- Sunting warkah oleh penulisnya (keputusan owner 10 Nov 2026: bebas kapan saja).
-- NULL = belum pernah disunting; diisi datetime('now') setiap sunting berhasil.
ALTER TABLE posts ADD COLUMN edited_at TEXT;
