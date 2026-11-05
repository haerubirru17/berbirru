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

const n = (value: unknown) => Number(value || 0);

export function maskEmail(value: string): string {
  const [local = '', domain = ''] = String(value || '').split('@', 2);
  return `${local.slice(0, 2) || local.slice(0, 1)}***@${domain}`;
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
