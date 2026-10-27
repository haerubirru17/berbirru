-- Postingan privat vs publik (fitur staga 2: public | private)
-- Default 'public' → semua post lama/selalu publik, tanpa data break.
ALTER TABLE posts ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public';
