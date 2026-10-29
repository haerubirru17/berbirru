import { getAuthUser, hardenPost } from '../lib/shared';

// Handlers notifikasi dipindah verbatim dari index.ts.
export function mountNotifications(app: any) {
app.get('/api/notifications', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  // Dua kotak: 'sosial' (like/chain/save/follow) vs 'pasar' (order_*).
  const scope = c.req.query('scope') === 'pasar' ? 'pasar' : 'sosial';
  const cond = scope === 'pasar' ? "n.type LIKE 'order_%'" : "(n.type IS NULL OR n.type NOT LIKE 'order_%')";
  const { results } = await c.env.DB.prepare(`
    SELECT n.*, u.pen_name as actor_pen_name, p.title as post_title, p.content as post_content,
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

  return c.json({ notifications: (results || []).map(hardenPost) });
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

  const scope = c.req.query('scope') === 'pasar' ? 'pasar' : 'sosial';
  const cond = scope === 'pasar' ? "AND type LIKE 'order_%'" : "AND (type IS NULL OR type NOT LIKE 'order_%')";
  await c.env.DB.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ? ${cond}`).bind(user.id).run();
  return c.json({ ok: true });
});

app.post('/api/notifications/:id/read', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  await c.env.DB.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').bind(c.req.param('id'), user.id).run();
  return c.json({ ok: true });
});
}
