-- Media & identitas profil. NULL = fallback (inisial / pen_name).
ALTER TABLE users ADD COLUMN avatar_key TEXT;
ALTER TABLE users ADD COLUMN cover_key TEXT;
ALTER TABLE users ADD COLUMN display_name TEXT;
