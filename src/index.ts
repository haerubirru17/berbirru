import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { renderLandingPage } from './web/landing';
import { renderLoginPage } from './web/login';
import { renderFeedPage } from './web/feed';
import { renderProfilePage } from './web/profile';

export interface Env {
  DB: D1Database;
  APP_NAME: string;
  APP_DOMAIN: string;
  JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// ---- AUTH HELPERS ----
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password + 'berbirru-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getAuthUser(c: any): Promise<{ id: string; email: string; pen_name: string; city: string; bio: string } | null> {
  const token = getCookie(c, 'berbirru_session');
  if (!token) return null;
  const session = await c.env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now") LIMIT 1'
  ).bind(token).first();
  return session || null;
}

// ---- PAGES (SSR) ----
app.get('/', (c) => c.html(renderLandingPage()));
app.get('/login', async (c) => {
  const user = await getAuthUser(c);
  if (user) return c.redirect('/feed');
  return c.html(renderLoginPage());
});
app.get('/feed', (c) => c.html(renderFeedPage()));
app.get('/u/:pen_name', async (c) => {
  const penName = c.req.param('pen_name');
  const user = await getAuthUser(c);
  const targetPenName = (penName === 'saya' && user) ? user.pen_name : penName;
  const isMe = Boolean(user && user.pen_name.toLowerCase() === targetPenName.toLowerCase());
  return c.html(renderProfilePage(targetPenName, isMe));
});

// ---- AUTH API ----
app.get('/api/auth/me', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ user: null });
  return c.json({ user: { id: user.id, pen_name: user.pen_name, city: user.city, bio: user.bio, email: user.email } });
});

app.post('/api/auth/register', async (c) => {
  const { email, password, pen_name, city } = await c.req.json().catch(() => ({}));
  if (!email || !password || !pen_name) {
    return c.json({ error: 'Email, kata sandi, dan nama pena wajib diisi.' }, 400);
  }
  const cleanPenName = String(pen_name).replace(/^@/, '').trim().toLowerCase();
  if (!/^[a-z0-9._-]+$/.test(cleanPenName)) {
    return c.json({ error: 'Nama pena hanya boleh huruf, angka, titik, underscore, dan strip.' }, 400);
  }

  // Check unique email / pen_name
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? OR pen_name = ? LIMIT 1').bind(email.toLowerCase(), cleanPenName).first();
  if (existing) {
    return c.json({ error: 'Email atau Nama Pena sudah digunakan oleh penulis lain.' }, 400);
  }

  const userId = crypto.randomUUID();
  const pwdHash = await hashPassword(password);
  await c.env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, pen_name, city, bio) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(userId, email.toLowerCase(), pwdHash, cleanPenName, city || 'Nusantara', 'Goresan perenungan rasa dan bait kata.').run();

  // Create session
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))'
  ).bind(crypto.randomUUID(), userId, token).run();

  setCookie(c, 'berbirru_session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true, user: { id: userId, pen_name: cleanPenName } }, 201);
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}));
  if (!email || !password) return c.json({ error: 'Email dan kata sandi wajib diisi.' }, 400);

  const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(email.toLowerCase()).first();
  if (!user) return c.json({ error: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' }, 401);

  const pwdHash = await hashPassword(password);
  if (user.password_hash !== pwdHash) {
    return c.json({ error: 'Kata sandi tidak sesuai.' }, 401);
  }

  // Create session
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))'
  ).bind(crypto.randomUUID(), user.id, token).run();

  setCookie(c, 'berbirru_session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true, user: { id: user.id, pen_name: user.pen_name } });
});

app.post('/api/auth/logout', async (c) => {
  const token = getCookie(c, 'berbirru_session');
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  deleteCookie(c, 'berbirru_session');
  return c.json({ ok: true });
});

// ---- PROFILE & UPDATE ----
app.patch('/api/users/me', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const { pen_name, city, bio } = await c.req.json().catch(() => ({}));

  let cleanPenName = user.pen_name;
  if (pen_name && pen_name !== user.pen_name) {
    cleanPenName = String(pen_name).replace(/^@/, '').trim().toLowerCase();
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? AND id != ? LIMIT 1').bind(cleanPenName, user.id).first();
    if (existing) return c.json({ error: 'Nama pena sudah dipakai.' }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE users SET pen_name = ?, city = ?, bio = ? WHERE id = ?'
  ).bind(cleanPenName, city || user.city, bio || user.bio, user.id).run();

  return c.json({ ok: true, user: { id: user.id, pen_name: cleanPenName, city: city || user.city, bio: bio || user.bio } });
});

app.get('/api/users/:pen_name', async (c) => {
  const penName = c.req.param('pen_name');
  const user: any = await c.env.DB.prepare('SELECT id, pen_name, city, bio, created_at FROM users WHERE pen_name = ? LIMIT 1').bind(penName.toLowerCase()).first();
  if (!user) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  const postsCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM posts WHERE author_id = ?').bind(user.id).first('c') || 0;
  const likesCount = await c.env.DB.prepare('SELECT COALESCE(SUM(likes_count), 0) as s FROM posts WHERE author_id = ?').bind(user.id).first('s') || 0;
  const savesCount = await c.env.DB.prepare('SELECT COALESCE(SUM(saves_count), 0) as s FROM posts WHERE author_id = ?').bind(user.id).first('s') || 0;

  return c.json({
    user: {
      ...user,
      posts_count: postsCount,
      likes_count: likesCount,
      saves_count: savesCount
    }
  });
});

// ---- POSTS & FEED ----
app.get('/api/posts', async (c) => {
  const mode = c.req.query('mode') || 'viral';
  const q = (c.req.query('q') || '').trim();
  const user = await getAuthUser(c);

  let query = `
    SELECT p.*, u.pen_name, u.city,
      (SELECT COUNT(*) FROM posts c WHERE c.parent_id = p.id) as chain_count
    FROM posts p
    JOIN users u ON p.author_id = u.id
  `;
  const binds: any[] = [];

  if (q) {
    query += ` WHERE p.content LIKE ? OR u.pen_name LIKE ? ORDER BY p.created_at DESC LIMIT 30`;
    binds.push(`%${q}%`, `%${q}%`);
  } else if (mode === 'following' && user) {
    query += ` JOIN follows f ON p.author_id = f.following_id WHERE f.follower_id = ? ORDER BY p.created_at DESC LIMIT 30`;
    binds.push(user.id);
  } else if (mode === 'latest') {
    query += ` ORDER BY p.created_at DESC LIMIT 30`;
  } else {
    // Viral / Menggema (HackerNews Gravity Decay Formula)
    query += `
      ORDER BY (
        ((p.likes_count * 1.0) + (p.saves_count * 3.0) + (p.chains_count * 4.0) + 1.0) /
        POWER(((JULIANDAY('now') - JULIANDAY(p.created_at)) * 24.0) + 2.0, 1.5)
      ) DESC LIMIT 30
    `;
  }

  const posts = await c.env.DB.prepare(query).bind(...binds).all().then((r) => r.results);
  return c.json({ mode, posts });
});

app.post('/api/posts', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk untuk menerbitkan warkah.' }, 401);

  const { content, parent_id } = await c.req.json().catch(() => ({}));
  if (!content || !content.trim()) return c.json({ error: 'Bait warkah tidak boleh kosong.' }, 400);

  const postId = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO posts (id, author_id, content, parent_id) VALUES (?, ?, ?, ?)'
  ).bind(postId, user.id, content.trim(), parent_id || null).run();

  if (parent_id) {
    await c.env.DB.prepare('UPDATE posts SET chains_count = chains_count + 1 WHERE id = ?').bind(parent_id).run();
  }

  return c.json({ ok: true, post: { id: postId } }, 201);
});

// Like & Bookmark Toggle
app.post('/api/posts/:id/like', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').bind(postId).run();
    return c.json({ liked: false });
  } else {
    await c.env.DB.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').bind(postId).run();
    return c.json({ liked: true });
  }
});

app.post('/api/posts/:id/bookmark', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET saves_count = MAX(0, saves_count - 1) WHERE id = ?').bind(postId).run();
    return c.json({ bookmarked: false });
  } else {
    await c.env.DB.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET saves_count = saves_count + 1 WHERE id = ?').bind(postId).run();
    return c.json({ bookmarked: true });
  }
});

app.post('/api/users/:pen_name/follow', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const penName = c.req.param('pen_name');
  const target: any = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? LIMIT 1').bind(penName.toLowerCase()).first();
  if (!target) return c.json({ error: 'Penulis tidak ditemukan' }, 404);
  if (target.id === user.id) return c.json({ error: 'Tidak bisa mengikuti diri sendiri' }, 400);

  const existing = await c.env.DB.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').bind(user.id, target.id).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').bind(user.id, target.id).run();
    return c.json({ following: false });
  } else {
    await c.env.DB.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').bind(user.id, target.id).run();
    return c.json({ following: true });
  }
});

export default app;
