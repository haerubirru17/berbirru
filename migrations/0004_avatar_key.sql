-- Media profil: key objek R2 (relatif). NULL = belum ada gambar (fallback inisial/gradient).
ALTER TABLE users ADD COLUMN avatar_key TEXT;
ALTER TABLE users ADD COLUMN cover_key TEXT;
