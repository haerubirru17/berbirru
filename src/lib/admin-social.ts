export type AdminDashboard = {
  kpis: {
    totalUsers: number;
    newUsers7d: number;
    activeWriters30d: number;
    totalPosts: number;
    newPosts7d: number;
    originalPosts: number;
    chainPosts: number;
    interactions7d: { likes: number; bookmarks: number; follows: number; chains: number; total: number };
  };
  attention: { unverifiedUsers: number; usersWithoutPosts: number; indexedPosts: number; orphanIndexRows: number; quarantinedPosts: number };
  latestUsers: Array<{
    penName: string;
    displayName: string;
    emailMasked: string;
    emailVerified: boolean;
    city: string;
    createdAt: string;
    postsCount: number;
  }>;
};

export type AdminPost = {
  id: string;
  title: string;
  content: string;
  visibility: string;
  createdAt: string;
  moderationStatus: 'visible' | 'quarantined';
  moderationReason: string;
  moderatedAt: string;
  moderatedBy: string;
  moderationActionId: string;
  penName: string;
};

export type AdminAuditModel = {
  warkah: Array<{ createdAt: string; action: string; reason: string; title: string; author: string; status: string }>;
  akun: Array<{ createdAt: string; action: string; reason: string; targetPen: string; actorPen: string }>;
};

const n = (value: unknown) => Number(value || 0);

export function maskEmail(value: string): string {
  const [local = '', domain = ''] = String(value || '').split('@', 2);
  return `${local.slice(0, 2) || local.slice(0, 1)}***@${domain}`;
}

export async function loadAdminPosts(db: D1Database, status: 'visible' | 'quarantined'): Promise<AdminPost[]> {
  const rows: any = await db.prepare(`SELECT p.id, p.title, p.content, p.visibility, p.created_at,
    p.moderation_status, p.moderation_reason, p.moderated_at,
    p.moderated_by, p.moderation_action_id,
    u.pen_name, u.email AS author_email
    FROM posts p JOIN users u ON u.id = p.author_id
    WHERE p.moderation_status = ?
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT 50`).bind(status).all();
  return (rows?.results || []).map((p: any) => ({
    id: String(p.id), title: String(p.title || ''), content: String(p.content || ''),
    visibility: String(p.visibility || ''), createdAt: String(p.created_at || ''),
    moderationStatus: p.moderation_status, moderationReason: String(p.moderation_reason || ''),
    moderatedAt: String(p.moderated_at || ''), moderatedBy: String(p.moderated_by || ''),
    moderationActionId: String(p.moderation_action_id || ''), penName: String(p.pen_name || ''),
  }));
}

export async function loadAdminAudit(db: D1Database): Promise<AdminAuditModel> {
  const posts: any = await db.prepare(`SELECT a.created_at, a.action, a.reason,
    p.title AS post_title, u.pen_name AS author_pen, p.moderation_status AS status
    FROM social_admin_actions a
    JOIN posts p ON p.id = a.target_post_id
    JOIN users u ON u.id = p.author_id
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT 20`).all();
  // Toleran lintas lingkungan: 0034 belum tentu applied; section akun menyala sendiri begitu tabel ada.
  const hasAcct: any = await db.prepare(
    "SELECT COUNT(*) AS n FROM sqlite_master WHERE name='social_account_actions' AND type='table'"
  ).first();
  let akun: any[] = [];
  if (n(hasAcct?.n) > 0) {
    const rows: any = await db.prepare(`SELECT x.created_at, x.action, x.reason,
      tu.pen_name AS target_pen, au.pen_name AS actor_pen
      FROM social_account_actions x
      JOIN users tu ON tu.id = x.target_user_id
      JOIN users au ON au.id = x.actor_user_id
      ORDER BY x.created_at DESC
      LIMIT 20`).all();
    akun = rows?.results || [];
  }
  return {
    warkah: (posts?.results || []).map((a: any) => ({
      createdAt: String(a.created_at || ''), action: String(a.action || ''),
      reason: String(a.reason || ''), title: String(a.post_title || 'Tanpa judul'),
      author: String(a.author_pen || ''), status: String(a.status || ''),
    })),
    akun: akun.map((a: any) => ({
      createdAt: String(a.created_at || ''), action: String(a.action || ''),
      reason: String(a.reason || ''), targetPen: String(a.target_pen || ''),
      actorPen: String(a.actor_pen || ''),
    })),
  };
}

export async function loadAdminDashboard(db: D1Database): Promise<AdminDashboard> {
  const users: any = await db.prepare(`SELECT COUNT(id) AS total_users,
    SUM(CASE WHEN created_at >= datetime('now','-7 days') THEN 1 ELSE 0 END) AS new_users_7d FROM users`).first();
  const writers: any = await db.prepare(`SELECT COUNT(DISTINCT author_id) AS active_writers_30d
    FROM posts WHERE created_at >= datetime('now','-30 days') AND moderation_status = 'visible'`).first();
  const posts: any = await db.prepare(`SELECT COUNT(id) AS total_posts,
    SUM(CASE WHEN created_at >= datetime('now','-7 days') THEN 1 ELSE 0 END) AS new_posts_7d,
    SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) AS original_posts,
    SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) AS chain_posts FROM posts WHERE moderation_status = 'visible'`).first();
  const activity: any = await db.prepare(`SELECT
    (SELECT COUNT(l.user_id) FROM likes l JOIN posts p ON p.id = l.post_id AND p.moderation_status = 'visible' WHERE l.created_at >= datetime('now','-7 days')) AS likes_7d,
    (SELECT COUNT(b.user_id) FROM bookmarks b JOIN posts p ON p.id = b.post_id AND p.moderation_status = 'visible' WHERE b.created_at >= datetime('now','-7 days')) AS bookmarks_7d,
    (SELECT COUNT(follower_id) FROM follows WHERE created_at >= datetime('now','-7 days')) AS follows_7d,
    (SELECT COUNT(id) FROM posts WHERE parent_id IS NOT NULL AND created_at >= datetime('now','-7 days') AND moderation_status = 'visible') AS chains_7d`).first();
  const attention: any = await db.prepare(`SELECT
    (SELECT COUNT(id) FROM users WHERE email_verified = 0) AS unverified_users,
    (SELECT COUNT(u.id) FROM users u WHERE NOT EXISTS (SELECT 1 FROM posts p WHERE p.author_id = u.id AND p.moderation_status = 'visible')) AS users_without_posts,
    (SELECT COUNT(DISTINCT f.id) FROM posts_fts f JOIN posts p ON p.id = f.id AND p.moderation_status = 'visible') AS indexed_posts,
    (SELECT COUNT(DISTINCT f.id) FROM posts_fts f LEFT JOIN posts p ON p.id = f.id WHERE p.id IS NULL OR p.moderation_status = 'quarantined') AS orphan_index_rows,
    (SELECT COUNT(id) FROM posts WHERE moderation_status = 'quarantined') AS quarantined_posts`).first();
  const latest: any = await db.prepare(`SELECT u.pen_name, u.display_name, u.email, u.email_verified, u.city, u.created_at,
    (SELECT COUNT(p.id) FROM posts p WHERE p.author_id = u.id AND p.moderation_status = 'visible') AS posts_count
    FROM users u ORDER BY u.created_at DESC, u.id DESC LIMIT 50`).all();

  const likes = n(activity?.likes_7d);
  const bookmarks = n(activity?.bookmarks_7d);
  const follows = n(activity?.follows_7d);
  const chains = n(activity?.chains_7d);
  return {
    kpis: {
      totalUsers: n(users?.total_users), newUsers7d: n(users?.new_users_7d), activeWriters30d: n(writers?.active_writers_30d),
      totalPosts: n(posts?.total_posts), newPosts7d: n(posts?.new_posts_7d), originalPosts: n(posts?.original_posts), chainPosts: n(posts?.chain_posts),
      interactions7d: { likes, bookmarks, follows, chains, total: likes + bookmarks + follows + chains },
    },
    attention: { unverifiedUsers: n(attention?.unverified_users), usersWithoutPosts: n(attention?.users_without_posts), indexedPosts: n(attention?.indexed_posts), orphanIndexRows: n(attention?.orphan_index_rows), quarantinedPosts: n(attention?.quarantined_posts) },
    latestUsers: (latest?.results || []).map((u: any) => ({
      penName: String(u.pen_name || ''), displayName: String(u.display_name || u.pen_name || ''), emailMasked: maskEmail(String(u.email || '')),
      emailVerified: n(u.email_verified) === 1, city: String(u.city || '—'), createdAt: String(u.created_at || ''), postsCount: n(u.posts_count),
    })),
  };
}

// Task 6: daftar akun utk /admin/users — kolom minimum, email dimasking DI LOADER.
export interface AdminUser {
  id: string; penName: string; displayName: string;
  emailMasked: string; status: string; isOwner: boolean;
}

export async function loadAdminUsers(db: D1Database, ownerEmail: string): Promise<AdminUser[]> {
  const { results }: any = await db.prepare(`SELECT id, pen_name, display_name, email, account_status
    FROM users ORDER BY created_at DESC, id DESC LIMIT 50`).all();
  return (results as any[]).map((u: any) => ({
    id: String(u.id || ''), penName: String(u.pen_name || ''), displayName: String(u.display_name || ''),
    emailMasked: maskEmail(String(u.email || '')), status: String(u.account_status || 'active'),
    isOwner: String(u.email || '').toLowerCase() === String(ownerEmail || '').toLowerCase(),
  }));
}
