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
  const msgUint8 = new TextEncoder().encode(password + 'berbirru-salt-2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function getAuthUser(c: any): Promise<{ id: string; email: string; pen_name: string; city: string; bio: string } | null> {
  const token = getCookie(c, 'berbirru_session');
  if (!token) return null;
  const session: any = await c.env.DB.prepare(
    'SELECT u.id, u.email, u.pen_name, u.city, u.bio FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime("now") LIMIT 1'
  ).bind(token).first();
  return session || null;
}

// ---- WEB PAGES (SSR) ----
app.get('/', async (c) => {
  const user = await getAuthUser(c);
  return c.html(renderLandingPage(user));
});

app.get('/login', async (c) => {
  const user = await getAuthUser(c);
  if (user) return c.redirect('/feed');
  return c.html(renderLoginPage());
});

app.get('/feed', async (c) => {
  const user = await getAuthUser(c);
  return c.html(renderFeedPage(user));
});

app.get('/u/:pen_name', async (c) => {
  const penNameParam = c.req.param('pen_name');
  const user = await getAuthUser(c);

  if (penNameParam === 'saya') {
    if (!user) return c.redirect('/login');
    return c.redirect('/u/' + user.pen_name);
  }

  const targetPenName = penNameParam.replace(/^@/, '').toLowerCase();
  const isMe = Boolean(user && user.pen_name.toLowerCase() === targetPenName);
  return c.html(renderProfilePage(targetPenName, isMe, user));
});

// ---- AUTH API ----
app.get('/api/auth/me', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ user: null });
  return c.json({ user });
});

app.post('/api/auth/register', async (c) => {
  const { email, password, pen_name, city } = await c.req.json().catch(() => ({}));
  if (!email || !password || !pen_name) {
    return c.json({ error: 'Email, kata sandi, dan nama pena wajib diisi.' }, 400);
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanPenName = String(pen_name).replace(/^@/, '').trim().toLowerCase();
  
  if (!/^[a-z0-9._-]+$/.test(cleanPenName)) {
    return c.json({ error: 'Nama pena hanya boleh huruf kecil, angka, titik, underscore, dan strip.' }, 400);
  }

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ? OR pen_name = ? LIMIT 1').bind(cleanEmail, cleanPenName).first();
  if (existing) {
    return c.json({ error: 'Email atau Nama Pena sudah digunakan oleh penulis lain.' }, 400);
  }

  const userId = crypto.randomUUID();
  const pwdHash = await hashPassword(password);
  await c.env.DB.prepare(
    'INSERT INTO users (id, email, password_hash, pen_name, city, bio) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(userId, cleanEmail, pwdHash, cleanPenName, city ? String(city).trim() : 'Nusantara', 'Goresan perenungan rasa dan bait kata.').run();

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

  const cleanEmail = String(email).trim().toLowerCase();
  const user: any = await c.env.DB.prepare('SELECT * FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  if (!user) return c.json({ error: 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.' }, 401);

  const pwdHash = await hashPassword(password);
  if (user.password_hash !== pwdHash) {
    return c.json({ error: 'Kata sandi tidak sesuai.' }, 401);
  }

  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+30 days"))'
  ).bind(crypto.randomUUID(), user.id, token).run();

  setCookie(c, 'berbirru_session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.json({ ok: true, user: { id: user.id, pen_name: user.pen_name } });
});

app.post('/api/auth/magic-link', async (c) => {
  const { email } = await c.req.json().catch(() => ({}));
  if (!email) return c.json({ error: 'Email wajib diisi' }, 400);
  const cleanEmail = String(email).trim().toLowerCase();
  const user: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE email = ? LIMIT 1').bind(cleanEmail).first();
  if (!user) return c.json({ error: 'Email belum terdaftar. Silakan buat akun terlebih dahulu.' }, 404);

  const magicToken = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, datetime("now", "+1 hour"))'
  ).bind(crypto.randomUUID(), user.id, magicToken).run();

  const magicUrl = `/api/auth/magic-callback?token=${magicToken}`;
  return c.json({ 
    message: 'Tautan masuk instan berhasil dibuat!', 
    magic_url: magicUrl,
    instruction: 'Klik tautan atau gunakan untuk login otomatis.'
  });
});

app.get('/api/auth/magic-callback', async (c) => {
  const token = c.req.query('token');
  if (!token) return c.redirect('/login');
  const session: any = await c.env.DB.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now") LIMIT 1').bind(token).first();
  if (!session) return c.html('<h3>Tautan kedaluwarsa atau tidak valid. <a href="/login">Kembali</a></h3>', 400);

  setCookie(c, 'berbirru_session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 30 });
  return c.redirect('/feed');
});

app.post('/api/auth/logout', async (c) => {
  const token = getCookie(c, 'berbirru_session');
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  deleteCookie(c, 'berbirru_session');
  return c.json({ ok: true });
});

// ---- PROFILE & USER UPDATE ----
app.patch('/api/users/me', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const { pen_name, city, bio } = await c.req.json().catch(() => ({}));

  let cleanPenName = user.pen_name;
  if (pen_name && pen_name.trim() !== user.pen_name) {
    cleanPenName = String(pen_name).replace(/^@/, '').trim().toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(cleanPenName)) {
      return c.json({ error: 'Nama pena hanya boleh huruf kecil, angka, titik, underscore, dan strip.' }, 400);
    }
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? AND id != ? LIMIT 1').bind(cleanPenName, user.id).first();
    if (existing) return c.json({ error: 'Nama pena sudah digunakan penulis lain.' }, 400);
  }

  await c.env.DB.prepare(
    'UPDATE users SET pen_name = ?, city = ?, bio = ? WHERE id = ?'
  ).bind(cleanPenName, city !== undefined ? String(city).trim() : user.city, bio !== undefined ? String(bio).trim() : user.bio, user.id).run();

  return c.json({ ok: true, user: { id: user.id, pen_name: cleanPenName, city: city || user.city, bio: bio || user.bio } });
});

app.get('/api/users/:pen_name', async (c) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const user: any = await c.env.DB.prepare('SELECT id, pen_name, city, bio, created_at FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
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

app.get('/api/users/:pen_name/posts', async (c) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const tab = c.req.query('tab') || 'original';
  const targetUser: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!targetUser) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  let query = '';
  const binds: any[] = [];

  if (tab === 'likes') {
    query = `
      SELECT p.*, u.pen_name, u.city 
      FROM likes l 
      JOIN posts p ON l.post_id = p.id 
      JOIN users u ON p.author_id = u.id 
      WHERE l.user_id = ? 
      ORDER BY l.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else if (tab === 'saved') {
    query = `
      SELECT p.*, u.pen_name, u.city 
      FROM bookmarks b 
      JOIN posts p ON b.post_id = p.id 
      JOIN users u ON p.author_id = u.id 
      WHERE b.user_id = ? 
      ORDER BY b.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else if (tab === 'chains') {
    query = `
      SELECT p.*, u.pen_name, u.city 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NOT NULL 
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  } else {
    // tab === 'original'
    query = `
      SELECT p.*, u.pen_name, u.city 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NULL 
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id);
  }

  const posts = await c.env.DB.prepare(query).bind(...binds).all().then((r) => r.results);
  return c.json({ tab, posts });
});

// ---- POSTS & FEED API ----
app.get('/api/posts', async (c) => {
  const mode = c.req.query('mode') || 'viral';
  const q = (c.req.query('q') || '').trim();
  const user = await getAuthUser(c);

  let query = `
    SELECT p.*, u.pen_name, u.city,
      (SELECT content FROM posts prnt WHERE prnt.id = p.parent_id) as parent_content,
      (SELECT u2.pen_name FROM posts prnt JOIN users u2 ON prnt.author_id = u2.id WHERE prnt.id = p.parent_id) as parent_author
    FROM posts p
    JOIN users u ON p.author_id = u.id
  `;
  const binds: any[] = [];

  if (q) {
    query += ` WHERE p.content LIKE ? OR u.pen_name LIKE ? ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(`%${q}%`, `%${q}%`);
  } else if (mode === 'following') {
    if (!user) return c.json({ mode, posts: [], message: 'Silakan masuk untuk melihat warkah penulis yang Anda ikuti.' });
    query += ` JOIN follows f ON p.author_id = f.following_id WHERE f.follower_id = ? ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(user.id);
  } else if (mode === 'latest') {
    query += ` ORDER BY p.created_at DESC LIMIT 40`;
  } else {
    // Mode 'viral' (Decay Ranking via standard (julianday('now') - julianday(created_at)))
    query += `
      ORDER BY (
        ((p.likes_count * 1.0) + (p.saves_count * 3.0) + (p.chains_count * 4.0) + 1.0) /
        (((julianday('now') - julianday(p.created_at)) * 24.0) + 2.0)
      ) DESC LIMIT 40
    `;
  }

  const posts: any[] = await c.env.DB.prepare(query).bind(...binds).all().then((r) => r.results);

  // Check if current user has liked/bookmarked each post
  if (user && posts.length > 0) {
    const postIds = posts.map(p => p.id);
    const placeholders = postIds.map(() => '?').join(',');
    const userLikes = await c.env.DB.prepare(
      `SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${placeholders})`
    ).bind(user.id, ...postIds).all().then(r => new Set(r.results.map((x: any) => x.post_id)));
    
    const userBookmarks = await c.env.DB.prepare(
      `SELECT post_id FROM bookmarks WHERE user_id = ? AND post_id IN (${placeholders})`
    ).bind(user.id, ...postIds).all().then(r => new Set(r.results.map((x: any) => x.post_id)));

    posts.forEach(p => {
      p.is_liked = userLikes.has(p.id);
      p.is_saved = userBookmarks.has(p.id);
    });
  }

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
  ).bind(postId, user.id, content.trim(), parent_id ? String(parent_id) : null).run();

  if (parent_id) {
    await c.env.DB.prepare('UPDATE posts SET chains_count = chains_count + 1 WHERE id = ?').bind(parent_id).run();
  }

  return c.json({ ok: true, post: { id: postId, author_pen_name: user.pen_name } }, 201);
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
    const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
    return c.json({ liked: false, likes_count: count });
  } else {
    await c.env.DB.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').bind(postId).run();
    const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
    return c.json({ liked: true, likes_count: count });
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
    const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
    return c.json({ bookmarked: false, saves_count: count });
  } else {
    await c.env.DB.prepare('INSERT INTO bookmarks (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET saves_count = saves_count + 1 WHERE id = ?').bind(postId).run();
    const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
    return c.json({ bookmarked: true, saves_count: count });
  }
});

app.post('/api/users/:pen_name/follow', async (c) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const target: any = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
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
