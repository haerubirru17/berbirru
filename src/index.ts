import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { renderLandingPage } from './web/landing';
import { renderLoginPage } from './web/login';
import { renderFeedPage } from './web/feed';
import { renderProfilePage } from './web/profile';

export interface Env {
  DB: D1Database;
  APP_NAME: string;
  APP_DOMAIN: string;
  JWT_SECRET?: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// ---- WEB PAGES (SSR) ----
app.get('/', (c) => c.html(renderLandingPage()));
app.get('/login', (c) => c.html(renderLoginPage()));
app.get('/feed', (c) => c.html(renderFeedPage()));
app.get('/u/:pen_name', (c) => {
  const penName = c.req.param('pen_name');
  return c.html(renderProfilePage(penName));
});

// ---- API ENDPOINTS ----
// Healthcheck
app.get('/api/health', (c) => c.json({ status: 'ok', app: c.env.APP_NAME || 'BERBIRRU.COM' }));

// Auth Stubs
app.post('/api/auth/register', async (c) => c.json({ message: 'Registration endpoint ready' }));
app.post('/api/auth/login', async (c) => c.json({ message: 'Login endpoint ready' }));
app.post('/api/auth/verify-otp', async (c) => c.json({ message: 'OTP verify endpoint ready' }));

// Posts & Feed
app.get('/api/posts', async (c) => {
  const mode = c.req.query('mode') || 'viral';
  return c.json({ mode, posts: [] });
});

app.post('/api/posts', async (c) => c.json({ message: 'Create post endpoint ready' }, 201));

// Users & Profile
app.get('/api/users/:pen_name', async (c) => {
  const penName = c.req.param('pen_name');
  return c.json({ pen_name: penName, posts_count: 0, resonance_count: 0 });
});

app.get('/api/users/:pen_name/posts', async (c) => {
  const tab = c.req.query('tab') || 'original';
  return c.json({ tab, posts: [] });
});

export default app;

