// Util dipindah verbatim dari index.ts (refactor modular). Jangan ubah perilaku.
import { getCookie } from 'hono/cookie';
import { sanitizeRich } from './sanitize';
import { Env } from '../env';

export async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hitRate(db: D1Database, key: string, limit: number, windowSec: number): Promise<boolean> {
  const row: any = await db.prepare(
    `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, datetime('now', '+' || ? || ' seconds'))
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN rate_limits.expires_at < datetime('now') THEN 1 ELSE rate_limits.count + 1 END,
       expires_at = CASE WHEN rate_limits.expires_at < datetime('now') THEN datetime('now', '+' || ? || ' seconds') ELSE rate_limits.expires_at END
     RETURNING count`
  ).bind(key, windowSec, windowSec).first();
  // GC probabilistik (vuln-0007 GLM): 2% panggilan membersihkan baris expired —
  // tanpa ini tabel tumbuh tanpa batas (786 baris/klien dalam uji Strix).
  // try/catch (rekomendasi putaran-4): request sial tak boleh 500 gara-gara GC.
  if (Math.random() < 0.02) {
    try {
      await db.prepare("DELETE FROM rate_limits WHERE expires_at < datetime('now')").run();
    } catch { /* GC gagal → abaikan; keputusan rate-limit sudah dihitung. */ }
  }
  return ((row && row.count) || 0) > limit;
}

export function hardenPost(p: any): any {
  if (!p) return p;
  if (p.content != null) p.content = sanitizeRich(p.content);
  if (p.parent_content != null) p.parent_content = sanitizeRich(p.parent_content);
  if (p.post_content != null) p.post_content = sanitizeRich(p.post_content);
  return p;
}

export function withAdmin<T extends any>(p: T, ownerEmail: string): T {
  if (!p) return p;
  const { author_email, ...rest } = p as any;
  rest.is_admin = String(author_email || '').toLowerCase() === String(ownerEmail || '').toLowerCase();
  return rest as T;
}

export function visibilityClause(user: any): { sql: string; binds: any[] } {
  if (user) {
    return { sql: '(p.visibility != \'private\' OR p.author_id = ?)', binds: [user.id] };
  }
  return { sql: "p.visibility = 'public'", binds: [] };
}

export async function getAuthUser(c: any): Promise<{ id: string; email: string; pen_name: string; city: string; avatar_key: string | null; cover_key: string | null; display_name: string | null; bio: string; seller_status?: string; seller_full_name?: string | null; seller_phone?: string | null; seller_note?: string | null; seller_reject_reason?: string | null; shop_name?: string | null; shop_slug?: string | null;
  addr_receiver?: string | null; addr_phone?: string | null; addr_postal?: string | null; addr_text?: string | null;
  addr_province_id?: string | null; addr_province_name?: string | null; addr_city_id?: string | null;
  addr_city_name?: string | null; addr_district_id?: string | null; addr_district_name?: string | null; is_owner?: boolean; owner_pending?: number } | null> {
  const token = getCookie(c, 'berbirru_session');
  if (!token) return null;
  const session: any = await c.env.DB.prepare(
    // Baris OTP pending (`otp_<hash>`, token_hash NULL) BUKAN sesi: tanpa filter ini,
    // cookie berisi hash OTP lolos sebagai sesi valid (temuan Strix #28).
    // vuln-0005: lookup via SHA-256(token) — plaintext token tak tersimpan di DB.
    'SELECT u.id, u.email, u.pen_name, u.city, u.avatar_key, u.cover_key, u.display_name, u.bio, u.seller_status, u.seller_full_name, u.seller_phone, u.seller_note, u.seller_reject_reason, u.shop_name, u.shop_slug, u.addr_receiver, u.addr_phone, u.addr_postal, u.addr_text, u.addr_province_id, u.addr_province_name, u.addr_city_id, u.addr_city_name, u.addr_district_id, u.addr_district_name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > datetime("now") LIMIT 1'
  ).bind(await sha256hex(token)).first();
  if (!session) return null;
  // Penanda owner + jumlah antrean: dipakai navbar (label "Admin") dan strip di /pasar.
  // satu query tambahan, hanya untuk akun owner.
  if (c.env.OWNER_EMAIL && String(session.email || '').toLowerCase() === String(c.env.OWNER_EMAIL).toLowerCase()) {
    const q: any = await c.env.DB.prepare(
      `SELECT (SELECT COUNT(*) FROM orders WHERE status = 'disputed')
            + (SELECT COUNT(*) FROM withdrawals WHERE status = 'requested')
            + (SELECT COUNT(*) FROM users WHERE seller_status = 'pending')
            + (SELECT COUNT(DISTINCT listing_id) FROM listing_reports WHERE status = 'open') AS n`
    ).first();
    session.is_owner = true;
    session.owner_pending = Number(q?.n || 0);
  }
  return session;
}

// ---- WEB PAGES (SSR) ----

export const isOwner = (env: Env, u: any): boolean =>
  !!u && !!env.OWNER_EMAIL && String(u.email || '').toLowerCase() === env.OWNER_EMAIL.toLowerCase();

// Saldo = total ledger − pencairan yang masih diproses (belum dipotong di ledger).
