import { getAuthUser, isOwner } from '../lib/shared';
import { loadAdminDashboard } from '../lib/admin-social';
import { renderAdminPage } from '../web/admin';

export function mountAdmin(app: any) {
  app.get('/admin', async (c: any) => {
    const me = await getAuthUser(c);
    if (!isOwner(c.env, me)) return c.notFound();
    const dashboard = await loadAdminDashboard(c.env.DB);
    c.header('Cache-Control', 'no-store');
    return c.html(renderAdminPage(dashboard));
  });
}
