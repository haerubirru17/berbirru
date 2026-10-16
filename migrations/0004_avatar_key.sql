-- Avatar: key objek R2 (relatif, tanpa domain). NULL = belum ada gambar (fallback inisial).
ALTER TABLE users ADD COLUMN avatar_key TEXT;
