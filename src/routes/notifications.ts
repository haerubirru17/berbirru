import { getAuthUser, hardenPost, hitRate } from '../lib/shared';

// Handlers notifikasi dipindah verbatim dari index.ts.
export function mountNotifications(app: any) {
app.get('/api/notifications', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  // Dua kotak: 'sosial' (like/chain/save/follow) vs 'pasar' (order_*).
  const scope = c.req.query('scope') === 'pasar' ? 'pasar' : 'sosial';
  const cond = scope === 'pasar' ? "n.type LIKE 'order_%'" : "(n.type IS NULL OR n.type NOT LIKE 'order_%')";
  const { results } = await c.env.DB.prepare(`
    SELECT n.id AS id, n.user_id AS user_id, n.actor_id AS actor_id, n.type AS type,
           CASE WHEN p.moderation_status = 'visible' THEN n.post_id ELSE NULL END AS post_id,
           n.order_id AS order_id, n.is_read AS is_read, n.created_at AS created_at,
           u.pen_name as actor_pen_name, u.avatar_key as actor_avatar_key,
           CASE WHEN p.moderation_status = 'visible' THEN p.title ELSE NULL END AS post_title,
           CASE WHEN p.moderation_status = 'visible' THEN p.content ELSE NULL END AS post_content,
           l.title as order_title
    FROM notifications n
    JOIN users u ON n.actor_id = u.id
    LEFT JOIN posts p ON n.post_id = p.id
    LEFT JOIN orders o ON o.id = n.order_id
    LEFT JOIN listings l ON l.id = o.listing_id
    WHERE n.user_id = ? AND ${cond}
    ORDER BY n.created_at DESC
    LIMIT 50
  `).bind(user.id).all();

  // Foto pelaku ikut dikirim sebagai URL siap pakai (konvensi sama dengan publicPost);
  // kolom mentah avatar_key tidak diteruskan ke klien.
  return c.json({ notifications: (results || []).map((n: any) => {
    const row = hardenPost(n);
    // Bentuk key divalidasi sebelum dibentuk jadi URL yang nanti di-embed ke atribut style:
    // hanya pola key media yang sah (dir/berkas.ext[?v=angka]) yang lolos.
    const kunci = String(n.actor_avatar_key || '');
    const sah = /^[a-z0-9_-]+\/[a-z0-9_-]+\.(jpg|png|webp)(\?v=\d+)?$/i.test(kunci);
    row.actor_avatar_url = sah ? '/media/' + kunci : null;
    delete row.actor_avatar_key;
    return row;
  }) });
});

app.get('/api/notifications/unread-count', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ count: 0 });

  const scope = c.req.query('scope') === 'pasar' ? 'pasar' : 'sosial';
  const cond = scope === 'pasar' ? "AND type LIKE 'order_%'" : "AND (type IS NULL OR type NOT LIKE 'order_%')";
  const row = await c.env.DB.prepare(
    `SELECT count(*) as count FROM notifications WHERE user_id = ? AND is_read = 0 ${cond}`
  ).bind(user.id).first();
  return c.json({ count: row ? (row as any).count : 0 });
});

app.post('/api/notifications/read-all', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  // Tiap panggilan = 1 baris TULIS di D1. Tanpa batas, satu akun bisa menghabiskan
  // kuota tulis harian (100.000 baris) yang dibutuhkan SEMUA pengguna.
  if (await hitRate(c.env.DB, `notif-read:${user.id}`, 60, 60)) return c.json({ error: 'Terlalu banyak permintaan. Tunggu sebentar.' }, 429);

  const scope = c.req.query('scope') === 'pasar' ? 'pasar' : 'sosial';
  const cond = scope === 'pasar' ? "AND type LIKE 'order_%'" : "AND (type IS NULL OR type NOT LIKE 'order_%')";
  await c.env.DB.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? ${cond}
    AND EXISTS (SELECT 1 FROM users WHERE id = ? AND account_status = 'active')`).bind(user.id, user.id).run();
  return c.json({ ok: true });
});

app.post('/api/notifications/:id/read', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);
  if (await hitRate(c.env.DB, `notif-read:${user.id}`, 60, 60)) return c.json({ error: 'Terlalu banyak permintaan. Tunggu sebentar.' }, 429);

  await c.env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND EXISTS (SELECT 1 FROM users WHERE id = ? AND account_status = 'active')").bind(c.req.param('id'), user.id, user.id).run();
  return c.json({ ok: true });
});
}
