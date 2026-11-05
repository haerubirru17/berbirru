import { getAuthUser, hitRate, isOwner } from '../lib/shared';
import { loadAdminDashboard, loadAdminPosts, loadAdminAudit } from '../lib/admin-social';
import { quarantinePost, restorePost } from '../lib/admin-moderation';
import { renderAdminPage } from '../web/admin';
import { renderAdminPostsPage } from '../web/admin-posts';
import { renderAdminAuditPage } from '../web/admin-audit';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function mountAdmin(app: any) {
  app.get('/admin', async (c: any) => {
    const me = await getAuthUser(c);
    if (!isOwner(c.env, me)) return c.notFound();
    const dashboard = await loadAdminDashboard(c.env.DB);
    c.header('Cache-Control', 'no-store');
    return c.html(renderAdminPage(dashboard));
  });

  app.get('/admin/posts', async (c: any) => {
    const me = await getAuthUser(c);
    if (!isOwner(c.env, me)) return c.notFound();
    const status = c.req.query('status') || 'quarantined';
    if (status !== 'visible' && status !== 'quarantined') {
      c.header('Cache-Control', 'no-store');
      return c.html('<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Status tidak valid | BERBIRRU</title></head><body><main><h1>Status tidak valid</h1><a href="/admin/posts">Kembali ke Warkah</a></main></body></html>', 400);
    }
    const posts = await loadAdminPosts(c.env.DB, status);
    c.header('Cache-Control', 'no-store');
    return c.html(renderAdminPostsPage(posts, status));
  });

  app.get('/admin/audit', async (c: any) => {
    const me = await getAuthUser(c);
    if (!isOwner(c.env, me)) return c.notFound();
    const model = await loadAdminAudit(c.env.DB);
    c.header('Cache-Control', 'no-store');
    return c.html(renderAdminAuditPage(model));
  });

  const mutate = async (c: any, action: 'quarantine' | 'restore') => {
    const json = (body: unknown, status = 200) => c.json(body, status);
    const me = await getAuthUser(c);
    if (!isOwner(c.env, me)) return json({ error: 'Not found' }, 404);
    if ((c.req.header('content-type') || '').split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
      return json({ error: 'Content-Type harus application/json.' }, 415);
    }
    if (c.req.header('origin') !== new URL(c.req.url).origin) return json({ error: 'Origin tidak valid.' }, 403);
    if (await hitRate(c.env.DB, `admin:moderate:${me!.id}`, 30, 60)) return json({ error: 'Terlalu banyak aksi moderasi.' }, 429);
    const postId = c.req.param('id');
    if (!uuid.test(postId)) return json({ error: 'Not found' }, 404);
    const body = await c.req.json().catch(() => null);
    if (!body || Array.isArray(body) || typeof body !== 'object' || typeof (body as any).reason !== 'string') {
      return json({ error: 'Body JSON tidak valid.' }, 400);
    }
    const reason = (body as any).reason.trim();
    const length = [...reason].length;
    if (length < 10 || length > 500) return json({ error: 'Alasan harus 10–500 karakter.' }, 400);
    try {
      const result = action === 'quarantine'
        ? await quarantinePost(c.env.DB, me!, postId, reason)
        : await restorePost(c.env.DB, me!, postId, reason);
      if (result.kind === 'missing') return json({ error: 'Not found' }, 404);
      if (result.kind === 'conflict') return json({ error: 'Status warkah sudah berubah. Muat ulang dashboard.' }, 409);
      return json({ ok: true, status: result.status, action_id: result.actionId });
    } catch (error) {
      console.error('admin-post-moderation:', String((error as any)?.message || error).slice(0, 200));
      return json({ error: 'Aksi moderasi gagal.' }, 500);
    }
  };

  app.post('/api/admin/posts/:id/quarantine', (c: any) => mutate(c, 'quarantine'));
  app.post('/api/admin/posts/:id/restore', (c: any) => mutate(c, 'restore'));
}
