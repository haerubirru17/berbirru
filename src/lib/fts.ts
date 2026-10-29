import { stripTags } from './sanitize';

// ---- AUDIT D-08: FTS5 utk pencarian warkah ----
// Sink-forward: hanya dua titik tulis (POST & DELETE /api/posts).
// Backfill malas: ensureFtsFilled mengisi yang belum masuk, batch kecil, idempotent.

// Bangun query FTS aman dari string pengguna: token bersih dipetik lalu di-AND.
export function ftsQuery(q: string): string | null {
  const toks = q
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  if (!toks.length) return null;
  return toks.map((t) => `"${t.replace(/"/g, '')}"`).join(' AND ');
}

// Isi yang belum ada di FTS (maks `limit` baris per panggilan — billed CPU dijaga).
export async function ensureFtsFilled(db: any, limit = 200): Promise<void> {
  try {
    const rows: any = await db.prepare(
      `SELECT p.id, p.title, p.content FROM posts p
        WHERE p.id NOT IN (SELECT id FROM posts_fts)
        LIMIT ${Math.max(1, Math.min(limit | 0, 500))}`
    ).all();
    for (const p of (rows.results || []) as any[]) {
      await db.prepare(
        "INSERT OR IGNORE INTO posts_fts (id, title, content_text) VALUES (?, ?, ?)"
      ).bind(p.id, p.title || '', stripTags(p.content || '')).run();
    }
  } catch {
    // Tabel FTS belum ada di lingkungan lama → skip senyap; pencari tetap jalan (fallback).
  }
}

// Satu baris upsert (dipanggil saat POST /api/posts).
export async function ftsUpsert(db: any, id: string, title: string | null, contentHtml: string | null): Promise<void> {
  try {
    await db.prepare(
      "INSERT OR REPLACE INTO posts_fts (id, title, content_text) VALUES (?, ?, ?)"
    ).bind(id, title || '', stripTags(contentHtml || '')).run();
  } catch { /* FTS belum tersedia — pencarian fallback tetap jalan */ }
}

export async function ftsDelete(db: any, id: string): Promise<void> {
  try {
    await db.prepare("DELETE FROM posts_fts WHERE id = ?").bind(id).run();
  } catch { /* diam */ }
}
