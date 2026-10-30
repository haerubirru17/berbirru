import { getAuthUser, hardenPost, withAdmin, visibilityClause, hitRate } from '../lib/shared';
import { sanitizeRich, escapeHtml, stripTags } from '../lib/sanitize';
import { ftsQuery, ftsUpsert, ftsDelete, ensureFtsFilled } from '../lib/fts';

// 12 handler sosial dipindah verbatim dari index.ts.
export function mountSocial(app: any) {
app.patch('/api/users/me', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);

  // Rate limit per-akun (vuln-0001 GLM): 20 perubahan profil/menit.
  if (await hitRate(c.env.DB, `profile:${user.id}`, 20, 60)) {
    return c.json({ error: 'Terlalu banyak perubahan profil. Tunggu sebentar.' }, 429);
  }

  const { pen_name, city, bio, display_name } = await c.req.json().catch(() => ({}));

  let cleanPenName = user.pen_name;
  if (pen_name && pen_name.trim() !== user.pen_name) {
    cleanPenName = String(pen_name).replace(/^@/, '').trim().toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(cleanPenName)) {
      return c.json({ error: 'Nama pena hanya boleh huruf kecil, angka, titik, underscore, dan strip.' }, 400);
    }
    const existing = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? AND id != ? LIMIT 1').bind(cleanPenName, user.id).first();
    if (existing) return c.json({ error: 'Nama pena sudah digunakan penulis lain.' }, 400);
  }

  // bio & city disimpan apa adanya; semua sink render meng-escape (textContent /
  // escapeHtml) — lihat feed.ts & profile.ts (vuln-0008).
  const cleanCity = city !== undefined ? String(city).trim().slice(0, 60) : user.city;
  const cleanBio = bio !== undefined ? String(bio).trim().slice(0, 300) : user.bio;
  const cleanDisplayName = display_name !== undefined ? String(display_name).trim().slice(0, 40) : user.display_name;

  await c.env.DB.prepare(
    'UPDATE users SET pen_name = ?, city = ?, bio = ?, display_name = ? WHERE id = ?'
  ).bind(cleanPenName, cleanCity, cleanBio, cleanDisplayName, user.id).run();

  return c.json({ ok: true, user: { id: user.id, pen_name: cleanPenName, city: cleanCity, bio: cleanBio, display_name: cleanDisplayName } });
});

app.get('/api/users/suggest', async (c: any) => {
  const q = (c.req.query('q') || '').replace(/^@+/g, '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
  if (!q) return c.json({ users: [] });
  const qesc = q.replace(/[\\%_]/g, (m: any) => '\\' + m);
  const result = await c.env.DB.prepare(
    "SELECT pen_name, city FROM users WHERE pen_name LIKE ? ESCAPE '\\' ORDER BY pen_name LIMIT 8"
  ).bind(qesc + '%').all();
  return c.json({ users: result.results || [] });
});

app.get('/api/users/:pen_name', async (c: any) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const user: any = await c.env.DB.prepare('SELECT id, pen_name, email, city, bio, avatar_key, cover_key, display_name, created_at FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!user) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  // Angka profil orang lain hanya menghitung warkah publik — jumlah warkah privat
  // pun tidak perlu bocor. Penulis sendiri melihat angka penuh.
  const viewer = await getAuthUser(c);
  const visOnly = viewer && viewer.id === user.id ? '' : " AND visibility = 'public'";
  const postsCount = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM posts WHERE author_id = ?${visOnly}`).bind(user.id).first('c') || 0;
  const likesCount = await c.env.DB.prepare(`SELECT COALESCE(SUM(likes_count), 0) as s FROM posts WHERE author_id = ?${visOnly}`).bind(user.id).first('s') || 0;
  const savesCount = await c.env.DB.prepare(`SELECT COALESCE(SUM(saves_count), 0) as s FROM posts WHERE author_id = ?${visOnly}`).bind(user.id).first('s') || 0;
  const followersCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').bind(user.id).first('c') || 0;
  const followingCount = await c.env.DB.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').bind(user.id).first('c') || 0;

  // status follow viewer — buat toggle tombol di profil (anonim/akun sendiri = false)
  let isFollowing = false;
  if (viewer && viewer.id !== user.id) {
    isFollowing = Boolean(await c.env.DB.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').bind(viewer.id, user.id).first());
  }

  // Email hanya dipakai untuk cek admin — jangan pernah dikirim ke klien.
  const { email: _email, ...publik } = user;
  return c.json({
    user: {
      ...publik,
      posts_count: postsCount,
      likes_count: likesCount,
      saves_count: savesCount,
      followers_count: followersCount,
      following_count: followingCount,
      is_following: isFollowing,
      // Penanda akun admin (owner) — diverifikasi dari email, bukan dari input klien.
      is_admin: String(_email || '').toLowerCase() === String(c.env.OWNER_EMAIL || '').toLowerCase()
    }
  });
});

app.get('/api/users/:pen_name/follows', async (c: any) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const type = c.req.query('type');
  if (type !== 'followers' && type !== 'following') {
    return c.json({ error: 'Tipe relasi tidak valid' }, 400);
  }
  const target: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!target) return c.json({ error: 'Penulis tidak ditemukan' }, 404);
  const viewer = await getAuthUser(c);
  const joinColumn = type === 'followers' ? 'f.follower_id' : 'f.following_id';
  const whereColumn = type === 'followers' ? 'f.following_id' : 'f.follower_id';
  const rows = await c.env.DB.prepare(`
    SELECT DISTINCT u.id, u.pen_name, u.display_name, u.city, u.avatar_key,
      CASE WHEN lower(COALESCE(u.email, '')) = lower(COALESCE(?, '')) THEN 1 ELSE 0 END AS is_admin,
      CASE WHEN ? <> '' AND EXISTS (SELECT 1 FROM follows vf WHERE vf.follower_id = ? AND vf.following_id = u.id) THEN 1 ELSE 0 END AS is_following
    FROM follows f JOIN users u ON u.id = ${joinColumn}
    WHERE ${whereColumn} = ?
    ORDER BY lower(COALESCE(u.display_name, u.pen_name)), u.pen_name
    LIMIT 100
  `).bind(c.env.OWNER_EMAIL || '', viewer?.id || '', viewer?.id || '', target.id).all();
  return c.json({ type, pen_name: target.pen_name, users: rows.results || [], has_more: (rows.results || []).length === 100 });
});

app.get('/api/users/:pen_name/posts', async (c: any) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const tab = (c.req.query('tab') || 'original').toLowerCase();
  const targetUser: any = await c.env.DB.prepare('SELECT id, pen_name FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!targetUser) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  // Tab privat (temuan Strix #22, IDOR): likes/simpanan hanya boleh dibaca sendiri.
  if (tab === 'likes' || tab === 'saved') {
    const me = await getAuthUser(c);
    if (!me || me.id !== targetUser.id) {
      return c.json({ error: 'Hanya penulis yang bersangkutan yang boleh melihat tab ini.' }, 403);
    }
  }

  let query = '';
  const binds: any[] = [];

  if (tab === 'likes') {
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key, u.email AS author_email
      FROM likes l
      JOIN posts p ON l.post_id = p.id
      JOIN users u ON p.author_id = u.id
      WHERE l.user_id = ? AND (p.visibility != 'private' OR p.author_id = ?)
      ORDER BY l.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id, targetUser.id);
  } else if (tab === 'saved') {
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key, u.email AS author_email
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      JOIN users u ON p.author_id = u.id
      WHERE b.user_id = ? AND (p.visibility != 'private' OR p.author_id = ?)
      ORDER BY b.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id, targetUser.id);
  } else if (tab === 'chains') {
    const vis = visibilityClause(await getAuthUser(c));
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key, u.email AS author_email 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NOT NULL AND ${vis.sql}
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id, ...vis.binds);
  } else {
    // tab === 'original'
    const vis = visibilityClause(await getAuthUser(c));
    query = `
      SELECT p.*, u.pen_name, u.city, u.avatar_key, u.email AS author_email 
      FROM posts p 
      JOIN users u ON p.author_id = u.id 
      WHERE p.author_id = ? AND p.parent_id IS NULL AND ${vis.sql}
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id, ...vis.binds);
  }

  const countQuery = query.replace(/ORDER BY [\w.]+ DESC LIMIT 30\s*$/, '');
  const total = await c.env.DB.prepare(`SELECT COUNT(*) AS n FROM (${countQuery})`).bind(...binds).first('n') || 0;
  const posts = await c.env.DB.prepare(query).bind(...binds).all().then((r: any) => r.results);
  return c.json({ tab, total, posts: posts.map((p: any) => withAdmin(hardenPost(p), c.env.OWNER_EMAIL as string)) });
});

app.get('/api/posts', async (c: any) => {
  const mode = c.req.query('mode') || 'viral';
  const q = (c.req.query('q') || '').trim();
  const user = await getAuthUser(c);
  // Beranda = ruang publik. Warkah privat cuma muncul di tab Karya profil pemiliknya.
  const vis = { sql: "p.visibility = 'public'", binds: [] as any[] };

  // Audit C-04: parent privat hanya dibocorkan ke pemiliknya/viewer-nya sendiri
  // (kondisional CASE pada subquery parent_content; bind pertama = viewer id).
  let query = `
    SELECT p.*, u.pen_name, u.city, u.avatar_key, u.email AS author_email,
      (SELECT CASE WHEN prnt.visibility != 'private' OR prnt.author_id = ? THEN prnt.content ELSE NULL END
         FROM posts prnt WHERE prnt.id = p.parent_id) as parent_content,
      (SELECT u2.pen_name FROM posts prnt JOIN users u2 ON prnt.author_id = u2.id WHERE prnt.id = p.parent_id) as parent_author
    FROM posts p
    JOIN users u ON p.author_id = u.id
  `;
  const binds: any[] = [user?.id || ''];

  if (q) {
    if (q.length < 2) {
      return c.json({ mode, posts: [] });
    }
    // Audit D-08: FTS5 (tokenizer trigram = substring tetap bekerja) menggantikan
    // leading-wildcard LIKE pada konten. Query FTS dibangun dari token bersih (aman),
    // pen_name tetap cari lewat LIKE tapi di-escape. Nomor baris: hasil dibatasi 40.
    await ensureFtsFilled(c.env.DB);
    const fq = ftsQuery(q);
    if (fq) {
      // FTS meliputi judul+isi; pen_name tetap dicari via LIKE ter-escape (parity behavior).
      const qesc = q.replace(/[\\%_]/g, (m: any) => '\\' + m);
      query += ` WHERE (p.id IN (SELECT id FROM posts_fts WHERE posts_fts MATCH ?) OR u.pen_name LIKE ? ESCAPE '\\')
                 AND ${vis.sql} ORDER BY p.created_at DESC LIMIT 40`;
      binds.push(fq, `%${qesc}%`, ...vis.binds);
    } else {
      // q tanpa token bermakna — kembali ke pen_name saja (escape wildcard tetap ada).
      const qesc = q.replace(/[\\%_]/g, (m: any) => '\\' + m);
      query += ` WHERE (u.pen_name LIKE ? ESCAPE '\\') AND ${vis.sql} ORDER BY p.created_at DESC LIMIT 40`;
      binds.push(`%${qesc}%`, ...vis.binds);
    }
  } else if (mode === 'following') {
    if (!user) return c.json({ mode, posts: [], message: 'Silakan masuk untuk melihat warkah penulis yang Anda ikuti.' });
    query += ` JOIN follows f ON p.author_id = f.following_id WHERE f.follower_id = ? AND ${vis.sql} ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(user.id, ...vis.binds);
  } else if (mode === 'latest') {
    query += ` WHERE ${vis.sql} ORDER BY p.created_at DESC LIMIT 40`;
    binds.push(...vis.binds);
  } else {
    // Mode 'viral' (Freshness Discovery Boost + Gravity Decay)
    // Postingan baru (< 1 jam) dapat initial boost agar muncul di atas untuk mendapat pembaca awal
    query += `
      WHERE ${vis.sql}
      ORDER BY (
        ((p.likes_count * 2.0) + (p.saves_count * 4.0) + (p.chains_count * 5.0) + 
         (CASE WHEN (julianday('now') - julianday(p.created_at)) * 24.0 < 1.0 THEN 6.0 ELSE 1.0 END)) /
        (((julianday('now') - julianday(p.created_at)) * 24.0) + 1.5)
      ) DESC LIMIT 40
    `;
    binds.push(...vis.binds);
  }

  const posts: any[] = await c.env.DB.prepare(query).bind(...binds).all().then((r: any) => r.results);

  // Check if current user has liked/bookmarked each post
  if (user && posts.length > 0) {
    const postIds = posts.map(p => p.id);
    const placeholders = postIds.map(() => '?').join(',');
    const userLikes = await c.env.DB.prepare(
      `SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${placeholders})`
    ).bind(user.id, ...postIds).all().then((r: any) => new Set(r.results.map((x: any) => x.post_id)));
    
    const userBookmarks = await c.env.DB.prepare(
      `SELECT post_id FROM bookmarks WHERE user_id = ? AND post_id IN (${placeholders})`
    ).bind(user.id, ...postIds).all().then((r: any) => new Set(r.results.map((x: any) => x.post_id)));

    posts.forEach(p => {
      p.is_liked = userLikes.has(p.id);
      p.is_saved = userBookmarks.has(p.id);
    });
  }

  return c.json({ mode, posts: posts.map((p) => withAdmin(hardenPost(p), c.env.OWNER_EMAIL as string)) });
});

app.get('/api/posts/:id/chains', async (c: any) => {
  const vis = visibilityClause(await getAuthUser(c));
  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.title, p.content, p.created_at, p.likes_count, p.chains_count, u.pen_name, u.email AS author_email
     FROM posts p JOIN users u ON p.author_id = u.id
     WHERE p.parent_id = ? AND ${vis.sql} ORDER BY p.created_at ASC LIMIT 20`
  ).bind(c.req.param('id'), ...vis.binds).all();
  return c.json({ chains: (results || []).map((p: any) => withAdmin(hardenPost(p), c.env.OWNER_EMAIL as string)) });
});

app.post('/api/posts', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk untuk menerbitkan warkah.' }, 401);

  // Rate limit per-penulis (vuln-0001 GLM): 20 unggahan/menit — tanpa ini 120
  // post terbit dalam 0,4 detik (uji Strix) dan kuota tulis D1 bisa dikuras.
  if (await hitRate(c.env.DB, `post:${user.id}`, 20, 60)) {
    return c.json({ error: 'Terlalu banyak unggahan. Tunggu sebentar.' }, 429);
  }

  const { title, content, parent_id, visibility } = await c.req.json().catch(() => ({}));

  // Batas ukuran konten (vuln-0002 putaran-4): klaim lama "4KB" tak pernah
  // diimplement. Keputusan owner 15 Okt 2026: 50.000 karakter (platform untuk
  // penulis esai/cerpen panjang). Cek SEBELUM sanitasi → input raksasa tak
  // pernah menyentuh sanitizeRich (anti CPU DoS) maupun D1.
  if (typeof content === 'string' && content.length > 50_000) {
    return c.json({ error: 'Warkah maksimal 50.000 karakter.' }, 400);
  }

  // Sanitasi di titik masuk API (temuan vuln-0008): konten kaya dibersihkan dengan
  // allowlist (format editor tetap), judul di-escape jadi teks biasa. Semua sink
  // render (feed, profil, notifikasi) otomatis aman dari satu titik ini.
  const cleanContent = sanitizeRich(content).trim();
  if (cleanContent.length > 50_000) {
    return c.json({ error: 'Warkah maksimal 50.000 karakter.' }, 400);
  }
  if (!cleanContent || stripTags(cleanContent).trim() === '') {
    return c.json({ error: 'Isi warkah tidak boleh kosong.' }, 400);
  }
  // Judul: teks biasa, disimpan apa adanya — di-escape saat render (feed/profil).
  const cleanTitle = title ? String(title).trim().slice(0, 200) : null;

  // Visibilitas: hanya 'public' | 'private' yang diterima; selain itu tolak 400
  // (jangan diam-diam dijadikan publik — klien yang salah harus kelihatan salahnya).
  const visRaw = visibility == null ? 'public' : String(visibility);
  if (visRaw !== 'public' && visRaw !== 'private') {
    return c.json({ error: "Visibilitas hanya 'public' atau 'private'." }, 400);
  }
  const cleanVisibility = visRaw;

  const postId = crypto.randomUUID();

  // Validasi parent_id (temuan Strix #29, HIGH): hanya UUID post yang benar-benar ada
  // yang boleh tersimpan — nilai mentah tidak pernah menyentuh konteks HTML/JS.
  const rawParent = parent_id ? String(parent_id) : '';
  let parentId: string | null = null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawParent)) {
    const parentRow: any = await c.env.DB.prepare('SELECT author_id, visibility FROM posts WHERE id = ?').bind(rawParent).first();
    // Audit C-04: parent privat milik orang lain tidak menerima sambungan anak publik —
    // isinya tak boleh membayang ke feed/chain publik.
    if (parentRow && !(parentRow.visibility === 'private' && parentRow.author_id !== user.id)) {
      parentId = rawParent;
      await c.env.DB.prepare('UPDATE posts SET chains_count = chains_count + 1 WHERE id = ?').bind(parentId).run();
    }
  }

  await c.env.DB.prepare(
    'INSERT INTO posts (id, author_id, title, content, parent_id, visibility) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(postId, user.id, cleanTitle, cleanContent, parentId, cleanVisibility).run();
  // Audit D-08: sinkron index FTS (hanya teks bersih yang masuk).
  await ftsUpsert(c.env.DB, postId, cleanTitle, cleanContent);

  // Notif chain dibuat SETELAH post ada (bug fungsional GLM: dulu INSERT sebelum
  // post → FK melanggar, tiap reply lintas-penulis 500 + flood jadi mungkin).
  if (parentId) {
    const parentRow: any = await c.env.DB.prepare('SELECT author_id FROM posts WHERE id = ?').bind(parentId).first();
    if (parentRow && parentRow.author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, parentRow.author_id, user.id, 'chain', postId).run();
    }
  }

  return c.json({ ok: true, post: { id: postId, author_pen_name: user.pen_name } }, 201);
});

app.delete('/api/posts/:id', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  // Bucket sama dengan POST /api/posts — delete massal otomatis tak lolos kuota.
  if (await hitRate(c.env.DB, `post:${user.id}`, 20, 60)) {
    return c.json({ error: 'Terlalu banyak operasi. Tunggu sebentar.' }, 429);
  }

  const post: any = await c.env.DB.prepare('SELECT author_id, parent_id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return c.json({ error: 'Postingan tidak ditemukan' }, 404);
  if (post.author_id !== user.id) return c.json({ error: 'Anda tidak memiliki akses untuk menghapus postingan ini' }, 403);

  // Hapus interaksi terkait & postingan
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM likes WHERE post_id = ?').bind(postId),
    c.env.DB.prepare('DELETE FROM bookmarks WHERE post_id = ?').bind(postId),
    c.env.DB.prepare('DELETE FROM notifications WHERE post_id = ?').bind(postId),
    c.env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId),
  ]);
  await ftsDelete(c.env.DB, postId);

  if (post.parent_id) {
    await c.env.DB.prepare('UPDATE posts SET chains_count = MAX(0, chains_count - 1) WHERE id = ?').bind(post.parent_id).run();
  }

  return c.json({ ok: true });
});

app.post('/api/posts/:id/like', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  // Pembatas laju interaksi (temuan Strix #24): cegah banjir notifikasi.
  if (await hitRate(c.env.DB, `engage:${user.id}`, 60, 60)) {
    return c.json({ error: 'Terlalu banyak interaksi. Tunggu sebentar.' }, 429);
  }

  const post: any = await c.env.DB.prepare("SELECT author_id, visibility FROM posts WHERE id = ?").bind(postId).first();
  if (!post || (post.visibility === 'private' && post.author_id !== user.id)) return c.json({ error: 'Warkah tidak ditemukan' }, 404);

  const existing = await c.env.DB.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?').bind(postId, postId).run();
    // Tarik notifikasi "suka" yang sudah terlanjur terkirim (stale notification).
    await c.env.DB.prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'like' AND post_id = ?").bind(post.author_id, user.id, postId).run();
    const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
    return c.json({ liked: false, likes_count: count });
  } else {
    // INSERT OR IGNORE (vuln-0005 putaran-4): like konkuren dulu meledak 500
    // (UNIQUE constraint). Kalau kalah race → perlakukan sebagai already-liked.
    const ins = await c.env.DB.prepare('INSERT OR IGNORE INTO likes (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    if (!ins.meta.changes) {
      const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
      return c.json({ liked: true, likes_count: count });
    }
    await c.env.DB.prepare('UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?) WHERE id = ?').bind(postId, postId).run();

    // Dedup: satu notifikasi per (penerima, pelaku, jenis, pos) — toggle berulang tidak menumpuk.
    const dup = await c.env.DB.prepare('SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? AND post_id = ? LIMIT 1').bind(post.author_id, user.id, 'like', postId).first();
    if (!dup && post.author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, post.author_id, user.id, 'like', postId).run();
    }

    const count = await c.env.DB.prepare('SELECT likes_count FROM posts WHERE id = ?').bind(postId).first('likes_count') || 0;
    return c.json({ liked: true, likes_count: count });
  }
});

app.post('/api/posts/:id/bookmark', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  if (await hitRate(c.env.DB, `engage:${user.id}`, 60, 60)) {
    return c.json({ error: 'Terlalu banyak interaksi. Tunggu sebentar.' }, 429);
  }

  const post: any = await c.env.DB.prepare("SELECT author_id, visibility FROM posts WHERE id = ?").bind(postId).first();
  if (!post || (post.visibility === 'private' && post.author_id !== user.id)) return c.json({ error: 'Warkah tidak ditemukan' }, 404);

  const existing = await c.env.DB.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).run();
    await c.env.DB.prepare('UPDATE posts SET saves_count = (SELECT COUNT(*) FROM bookmarks WHERE post_id = ?) WHERE id = ?').bind(postId, postId).run();
    await c.env.DB.prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'save' AND post_id = ?").bind(post.author_id, user.id, postId).run();
    const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
    return c.json({ bookmarked: false, saves_count: count });
  } else {
    // INSERT OR IGNORE (vuln-0005 putaran-4): pola sama dengan like — kalah race
    // konkuren bukan 500, melainkan already-bookmarked.
    const ins = await c.env.DB.prepare('INSERT OR IGNORE INTO bookmarks (user_id, post_id) VALUES (?, ?)').bind(user.id, postId).run();
    if (!ins.meta.changes) {
      const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
      return c.json({ bookmarked: true, saves_count: count });
    }
    await c.env.DB.prepare('UPDATE posts SET saves_count = (SELECT COUNT(*) FROM bookmarks WHERE post_id = ?) WHERE id = ?').bind(postId, postId).run();

    const dup = await c.env.DB.prepare('SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? AND post_id = ? LIMIT 1').bind(post.author_id, user.id, 'save', postId).first();
    if (!dup && post.author_id !== user.id) {
      const notifId = crypto.randomUUID();
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type, post_id) VALUES (?, ?, ?, ?, ?)').bind(notifId, post.author_id, user.id, 'save', postId).run();
    }

    const count = await c.env.DB.prepare('SELECT saves_count FROM posts WHERE id = ?').bind(postId).first('saves_count') || 0;
    return c.json({ bookmarked: true, saves_count: count });
  }
});

app.post('/api/users/:pen_name/follow', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);

  // Pembatas laju interaksi (vuln-0001 putaran-4): follow lama tanpa limit —
  // toggle tanpa henti menguras kuota tulis D1 harian. Samakan dengan like/bookmark.
  if (await hitRate(c.env.DB, `engage:${user.id}`, 60, 60)) {
    return c.json({ error: 'Terlalu banyak interaksi. Tunggu sebentar.' }, 429);
  }

  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const target: any = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!target) return c.json({ error: 'Penulis tidak ditemukan' }, 404);
  if (target.id === user.id) return c.json({ error: 'Tidak bisa mengikuti diri sendiri' }, 400);

  const existing = await c.env.DB.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?').bind(user.id, target.id).first();
  if (existing) {
    await c.env.DB.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').bind(user.id, target.id).run();
    // buang notif follow lama — unfollow berarti "X mulai mengikuti" tak lagi benar
    await c.env.DB.prepare("DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'follow'").bind(target.id, user.id).run();
    return c.json({ following: false });
  } else {
    // Audit C-05: OR IGNORE (pola like/bookmark) — follow konkuren tidak 500 lagi.
    const ins = await c.env.DB.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').bind(user.id, target.id).run();
    if (!ins.meta.changes) return c.json({ following: true });
    const dup = await c.env.DB.prepare('SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? LIMIT 1').bind(target.id, user.id, 'follow').first();
    if (!dup) {
      await c.env.DB.prepare('INSERT INTO notifications (id, user_id, actor_id, type) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), target.id, user.id, 'follow').run();
    }
    return c.json({ following: true });
  }
});
}
