import { getAuthUser, hardenPost, withAdmin, visibilityClause, hitRate, PUBLIC_POST_COLUMNS } from '../lib/shared';
import { sanitizeRich, escapeHtml, stripTags } from '../lib/sanitize';
import { ftsQuery, ensureFtsFilled } from '../lib/fts';

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

  const profileUp = await c.env.DB.prepare(
    "UPDATE users SET pen_name = ?, city = ?, bio = ?, display_name = ? WHERE id = ? AND account_status = 'active'"
  ).bind(cleanPenName, cleanCity, cleanBio, cleanDisplayName, user.id).run();
  // Task 4: guard active — suspend in-flight = zero mutation, respons generik.
  if (!profileUp.meta.changes) return c.json({ error: 'Sesi tidak valid. Muat ulang halaman.' }, 401);

  return c.json({ ok: true, user: { id: user.id, pen_name: cleanPenName, city: cleanCity, bio: cleanBio, display_name: cleanDisplayName } });
});

app.get('/api/users/suggest', async (c: any) => {
  const rawQ = c.req.query('q') || '';
  // Paritas unit dengan /api/posts: guard dalam BYTE UTF-8, bukan codepoint (vuln-0001 R3).
  if (new TextEncoder().encode(rawQ.trim()).byteLength > 48) return c.json({ error: 'Parameter pencarian terlalu panjang.' }, 400);
  const q = rawQ.replace(/^@+/g, '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
  if (!q) return c.json({ users: [] });
  const qesc = q.replace(/[\\%_]/g, (m: any) => '\\' + m);
  const result = await c.env.DB.prepare(
    "SELECT pen_name, city FROM users WHERE pen_name LIKE ? ESCAPE '\\' ORDER BY pen_name LIMIT 8"
  ).bind(qesc + '%').all().catch((e: any) => {
    // vuln-0001 R3: hanya error kompleksitas LIKE di-demote → hasil kosong; error D1 lain tetap 500.
    if (!/too complex|SQLITE_ERROR/i.test(String(e?.message || e))) throw e;
    console.error('suggest-d1:', String(e?.message || e).slice(0, 200));
    return { results: [] };
  });
  return c.json({ users: result.results || [] });
});

app.get('/api/users/:pen_name', async (c: any) => {
  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const user: any = await c.env.DB.prepare('SELECT id, pen_name, email, city, bio, avatar_key, cover_key, display_name, created_at FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!user) return c.json({ error: 'Penulis tidak ditemukan' }, 404);

  // Angka profil orang lain hanya menghitung warkah publik — jumlah warkah privat
  // pun tidak perlu bocor. Penulis sendiri melihat angka penuh.
  const viewer = await getAuthUser(c);
  const visOnly = ` AND moderation_status = 'visible'${viewer && viewer.id === user.id ? '' : " AND visibility = 'public'"}`;
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
      SELECT ${PUBLIC_POST_COLUMNS}, u.pen_name, u.city, u.avatar_key, u.email AS author_email
      FROM likes l
      JOIN posts p ON l.post_id = p.id
      JOIN users u ON p.author_id = u.id
      WHERE l.user_id = ? AND p.moderation_status = 'visible' AND (p.visibility != 'private' OR p.author_id = ?)
      ORDER BY l.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id, targetUser.id);
  } else if (tab === 'saved') {
    query = `
      SELECT ${PUBLIC_POST_COLUMNS}, u.pen_name, u.city, u.avatar_key, u.email AS author_email
      FROM bookmarks b
      JOIN posts p ON b.post_id = p.id
      JOIN users u ON p.author_id = u.id
      WHERE b.user_id = ? AND p.moderation_status = 'visible' AND (p.visibility != 'private' OR p.author_id = ?)
      ORDER BY b.created_at DESC LIMIT 30
    `;
    binds.push(targetUser.id, targetUser.id);
  } else if (tab === 'chains') {
    const viewer = await getAuthUser(c);
    const vis = visibilityClause(viewer);
    query = `
      SELECT p.id AS id, p.author_id AS author_id, p.title AS title, p.content AS content,
        CASE WHEN p.parent_id IS NULL OR EXISTS (SELECT 1 FROM posts prnt
          WHERE prnt.id = p.parent_id AND prnt.moderation_status = 'visible'
            AND (prnt.visibility != 'private' OR prnt.author_id = ?))
          THEN p.parent_id ELSE NULL END AS parent_id,
        p.visibility AS visibility, p.likes_count AS likes_count, p.saves_count AS saves_count,
        p.chains_count AS chains_count, p.created_at AS created_at,
        u.pen_name, u.city, u.avatar_key, u.email AS author_email
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.author_id = ? AND p.parent_id IS NOT NULL AND ${vis.sql}
      ORDER BY p.created_at DESC LIMIT 30
    `;
    binds.push(viewer?.id || '', targetUser.id, ...vis.binds);
  } else {
    // tab === 'original'
    const vis = visibilityClause(await getAuthUser(c));
    query = `
      SELECT ${PUBLIC_POST_COLUMNS}, u.pen_name, u.city, u.avatar_key, u.email AS author_email
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
  // vuln-0001 R3: `%` literal (hasil double percent-encoding) melewati guard lama,
  // lalu di-escape `\%` untuk LIKE pen_name — pola dengan banyak `\%` melampaui batas
  // kompleksitas LIKE SQLite → D1_ERROR: LIKE or GLOB pattern too complex → 500.
  // `%` bukan wildcard bagi pencarian teks; buang sebelum guard & sink apa pun.
  const qPre = (c.req.query('q') || '').trim();
  const q = qPre.replace(/%/g, '');
  // Sink LIKE di D1 error "pattern too complex" di atas ~48 byte —
  // guard diukur dalam BYTE UTF-8, bukan codepoint (regresi vuln-0001 re-scan b5e1).
  if (new TextEncoder().encode(q).byteLength > 48) return c.json({ error: 'Parameter pencarian terlalu panjang.' }, 400);
  const user = await getAuthUser(c);
  // Beranda = ruang publik. Warkah privat cuma muncul di tab Karya profil pemiliknya.
  const vis = { sql: "p.moderation_status = 'visible' AND p.visibility = 'public'", binds: [] as any[] };

  // Audit C-04: parent privat hanya dibocorkan ke pemiliknya/viewer-nya sendiri
  // (kondisional CASE pada subquery parent_content; bind pertama = viewer id).
  let query = `
    SELECT ${PUBLIC_POST_COLUMNS}, u.pen_name, u.city, u.avatar_key, u.email AS author_email,
      (SELECT CASE WHEN prnt.moderation_status = 'visible' AND (prnt.visibility != 'private' OR prnt.author_id = ?) THEN prnt.content ELSE NULL END
         FROM posts prnt WHERE prnt.id = p.parent_id) as parent_content,
      (SELECT CASE WHEN prnt.moderation_status = 'visible' AND (prnt.visibility != 'private' OR prnt.author_id = ?) THEN u2.pen_name ELSE NULL END FROM posts prnt JOIN users u2 ON prnt.author_id = u2.id WHERE prnt.id = p.parent_id) as parent_author,
      (SELECT CASE WHEN prnt.moderation_status = 'visible' THEN prnt.visibility ELSE NULL END FROM posts prnt WHERE prnt.id = p.parent_id) as parent_visibility
    FROM posts p
    JOIN users u ON p.author_id = u.id
  `;
  const binds: any[] = [user?.id || '', user?.id || ''];

  if (qPre) {
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

  const posts: any[] = await (async () => {
    try {
      return await c.env.DB.prepare(query).bind(...binds).all().then((r: any) => r.results);
    } catch (e: any) {
      // vuln-0001 R3: hanya demote error kompleksitas LIKE → 400; error D1 lain (outage/CPU) tetap 500 agar monitoring jujur.
      if (!/too complex|SQLITE_ERROR/i.test(String(e?.message || e))) throw e;
      console.error('search-d1:', String(e?.message || e).slice(0, 200));
      return c.json({ error: 'Parameter pencarian tidak valid.' }, 400);
    }
  })();
  if (!Array.isArray(posts)) return posts as any;

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

  return c.json({ mode, posts: posts.map((p) => {
    const safe = { ...p };
    if (safe.parent_visibility == null || (safe.parent_visibility === 'private' && (!user || String(safe.parent_author || '') !== String(user.pen_name || '')))) safe.parent_id = null;
    delete safe.parent_visibility;
    return withAdmin(hardenPost(safe), c.env.OWNER_EMAIL as string);
  }) });
});

app.get('/api/posts/:id/chains', async (c: any) => {
  const viewer = await getAuthUser(c);
  const parent: any = await c.env.DB.prepare("SELECT id, author_id, visibility FROM posts WHERE id = ? AND moderation_status = 'visible'").bind(c.req.param('id')).first();
  if (!parent || (parent.visibility === 'private' && (!viewer || viewer.id !== parent.author_id))) return c.notFound();
  const vis = visibilityClause(viewer);
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

  // Parent UUID yang eksplisit harus tetap layak sampai batch; jangan diam-diam turun jadi root.
  const rawParent = parent_id ? String(parent_id) : '';
  const validParent = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawParent);
  let parentId: string | null = null;
  if (validParent) {
    const parentRow: any = await c.env.DB.prepare("SELECT author_id, visibility FROM posts WHERE id = ? AND moderation_status = 'visible'").bind(rawParent).first();
    if (!parentRow || (parentRow.visibility === 'private' && parentRow.author_id !== user.id)) {
      return c.json({ error: 'Warkah tidak ditemukan' }, 404);
    }
    parentId = rawParent;
  }

  const contentText = stripTags(cleanContent);
  if (!parentId) {
    const rootRes: any[] = await c.env.DB.batch([
      // Task 4: hakim INSERT...SELECT guarded active — suspend in-flight = zero mutation.
      c.env.DB.prepare(`INSERT INTO posts (id, author_id, title, content, parent_id, visibility)
        SELECT ?, ?, ?, ?, NULL, ? FROM users au
        WHERE au.id = ? AND au.account_status = 'active'`)
        .bind(postId, user.id, cleanTitle, cleanContent, cleanVisibility, user.id),
      c.env.DB.prepare(`INSERT INTO posts_fts (id, title, content_text)
        SELECT ?, ?, ? FROM users au
        WHERE au.id = ? AND au.account_status = 'active'
          AND EXISTS (SELECT 1 FROM posts np WHERE np.id = ?)`)
        .bind(postId, cleanTitle || '', contentText, user.id, postId),
    ]);
    if (!rootRes[0]?.meta?.changes) return c.json({ error: 'Sesi tidak valid. Muat ulang halaman.' }, 401);
  } else {
    const result: any[] = await c.env.DB.batch([
      c.env.DB.prepare(`INSERT INTO posts (id, author_id, title, content, parent_id, visibility)
        SELECT ?, ?, ?, ?, parent.id, ? FROM posts parent
        WHERE parent.id = ? AND parent.moderation_status = 'visible'
          AND (parent.visibility != 'private' OR parent.author_id = ?)
          AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')`)
        .bind(postId, user.id, cleanTitle, cleanContent, cleanVisibility, parentId, user.id, user.id),
      c.env.DB.prepare(`INSERT INTO posts_fts (id, title, content_text)
        SELECT ?, ?, ? FROM users au
        WHERE au.id = ? AND au.account_status = 'active'
          AND EXISTS (SELECT 1 FROM posts np WHERE np.id = ? AND np.author_id = ?)`)
        .bind(postId, cleanTitle || '', contentText, user.id, postId, user.id),
      c.env.DB.prepare(`UPDATE posts SET chains_count = chains_count + 1
        WHERE id = ? AND moderation_status = 'visible'
          AND EXISTS (SELECT 1 FROM posts child WHERE child.id = ? AND child.parent_id = posts.id AND child.author_id = ?)`)
        .bind(parentId, postId, user.id),
      c.env.DB.prepare(`INSERT INTO notifications (id, user_id, actor_id, type, post_id)
        SELECT ?, parent.author_id, ?, 'chain', child.id FROM posts parent JOIN posts child ON child.parent_id = parent.id
        WHERE parent.id = ? AND child.id = ? AND child.author_id = ?
          AND parent.moderation_status = 'visible' AND parent.author_id != ?`)
        .bind(crypto.randomUUID(), user.id, parentId, postId, user.id, user.id),
    ]);
    if (!result[0]?.meta?.changes) return c.json({ error: 'Status warkah sudah berubah. Coba lagi.' }, 409);
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

  const post: any = await c.env.DB.prepare("SELECT author_id, parent_id, COALESCE(moderation_action_id,'') AS moderation_marker FROM posts WHERE id = ? AND moderation_status = 'visible'").bind(postId).first();
  if (!post) return c.json({ error: 'Postingan tidak ditemukan' }, 404);
  if (post.author_id !== user.id) return c.json({ error: 'Anda tidak memiliki akses untuk menghapus postingan ini' }, 403);

  // Task 4: guard snapshot moderasi + status akun — salah satu berubah = semua statement gugur.
  const guard = `EXISTS (SELECT 1 FROM posts target JOIN users act ON act.id = target.author_id
    WHERE target.id = ? AND target.author_id = ?
    AND target.moderation_status = 'visible' AND COALESCE(target.moderation_action_id,'') = ?
    AND act.account_status = 'active')`;
  const result: any[] = await c.env.DB.batch([
    c.env.DB.prepare(`DELETE FROM likes WHERE post_id = ? AND ${guard}`).bind(postId, postId, user.id, post.moderation_marker),
    c.env.DB.prepare(`DELETE FROM bookmarks WHERE post_id = ? AND ${guard}`).bind(postId, postId, user.id, post.moderation_marker),
    c.env.DB.prepare(`DELETE FROM notifications WHERE post_id = ? AND ${guard}`).bind(postId, postId, user.id, post.moderation_marker),
    c.env.DB.prepare(`DELETE FROM posts_fts WHERE id = ? AND ${guard}`).bind(postId, postId, user.id, post.moderation_marker),
    c.env.DB.prepare(`UPDATE posts SET chains_count = MAX(0, chains_count - 1) WHERE id = ? AND ? IS NOT NULL AND ${guard}`)
      .bind(post.parent_id, post.parent_id, postId, user.id, post.moderation_marker),
    c.env.DB.prepare("DELETE FROM posts WHERE id = ? AND author_id = ? AND moderation_status = 'visible' AND COALESCE(moderation_action_id,'') = ? AND EXISTS (SELECT 1 FROM users act WHERE act.id = ? AND act.account_status = 'active')")
      .bind(postId, user.id, post.moderation_marker, user.id),
  ]);
  if (!result[5]?.meta?.changes) return c.json({ error: 'Status warkah sudah berubah. Coba lagi.' }, 409);
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

  const post: any = await c.env.DB.prepare("SELECT author_id, visibility, moderation_status, COALESCE(moderation_action_id,'') AS moderation_marker FROM posts WHERE id = ?").bind(postId).first();
  if (!post || post.moderation_status !== 'visible' || (post.visibility === 'private' && post.author_id !== user.id)) return c.json({ error: 'Warkah tidak ditemukan' }, 404);

  const existing = await c.env.DB.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  const intended = !existing;
  const relation = intended
    ? c.env.DB.prepare(`INSERT OR IGNORE INTO likes (user_id, post_id)
        SELECT ?, p.id FROM posts p
        JOIN users au ON au.id = ?
        WHERE p.id = ? AND p.moderation_status = 'visible'
          AND COALESCE(p.moderation_action_id,'') = ?
          AND au.account_status = 'active'`).bind(user.id, user.id, postId, post.moderation_marker)
    : c.env.DB.prepare(`DELETE FROM likes WHERE user_id = ? AND post_id = ? AND EXISTS
        (SELECT 1 FROM posts p JOIN users au ON au.id = ? WHERE p.id = ? AND p.moderation_status = 'visible'
          AND COALESCE(p.moderation_action_id,'') = ? AND au.account_status = 'active')`).bind(user.id, postId, user.id, postId, post.moderation_marker);
  const notification = intended
    ? c.env.DB.prepare(`INSERT INTO notifications (id, user_id, actor_id, type, post_id)
        SELECT ?, p.author_id, ?, 'like', p.id FROM posts p
        WHERE p.id = ? AND p.author_id != ? AND p.moderation_status = 'visible'
          AND COALESCE(p.moderation_action_id,'') = ?
          AND EXISTS (SELECT 1 FROM likes WHERE user_id = ? AND post_id = p.id)
          AND NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = p.author_id AND actor_id = ? AND type = 'like' AND post_id = p.id)`
        )
        .bind(crypto.randomUUID(), user.id, postId, user.id, post.moderation_marker, user.id, user.id)
    : c.env.DB.prepare(`DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'like' AND post_id = ?
        AND EXISTS (SELECT 1 FROM posts p WHERE p.id = ? AND p.moderation_status = 'visible'
          AND COALESCE(p.moderation_action_id,'') = ?)`).bind(post.author_id, user.id, postId, postId, post.moderation_marker);
  const result: any[] = await c.env.DB.batch([
    relation,
    c.env.DB.prepare(`UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = ?)
      WHERE id = ? AND moderation_status = 'visible' AND COALESCE(moderation_action_id,'') = ?`).bind(postId, postId, post.moderation_marker),
    notification,
    c.env.DB.prepare(`SELECT moderation_status, COALESCE(moderation_action_id,'') AS moderation_marker,
      EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = posts.id) AS intended_state, likes_count,
      EXISTS(SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active') AS actor_active
      FROM posts WHERE id = ?`).bind(user.id, user.id, postId),
  ]);
  const state: any = result[3]?.results?.[0];
  if (!state || state.moderation_status !== 'visible' || state.moderation_marker !== post.moderation_marker) {
    return c.json({ error: 'Status warkah sudah berubah. Coba lagi.' }, 409);
  }
  if (Number(state.actor_active) !== 1) return c.json({ error: 'Sesi tidak valid. Muat ulang halaman.' }, 401);
  return c.json({ liked: Number(state.intended_state) === 1, likes_count: Number(state.likes_count || 0) });
});

app.post('/api/posts/:id/bookmark', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);
  const postId = c.req.param('id');

  if (await hitRate(c.env.DB, `engage:${user.id}`, 60, 60)) {
    return c.json({ error: 'Terlalu banyak interaksi. Tunggu sebentar.' }, 429);
  }

  const post: any = await c.env.DB.prepare("SELECT author_id, visibility, moderation_status, COALESCE(moderation_action_id,'') AS moderation_marker FROM posts WHERE id = ?").bind(postId).first();
  if (!post || post.moderation_status !== 'visible' || (post.visibility === 'private' && post.author_id !== user.id)) return c.json({ error: 'Warkah tidak ditemukan' }, 404);

  const existing = await c.env.DB.prepare('SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = ?').bind(user.id, postId).first();
  const intended = !existing;
  const relation = intended
    ? c.env.DB.prepare(`INSERT OR IGNORE INTO bookmarks (user_id, post_id)
        SELECT ?, p.id FROM posts p
        JOIN users au ON au.id = ?
        WHERE p.id = ? AND p.moderation_status = 'visible'
          AND COALESCE(p.moderation_action_id,'') = ?
          AND au.account_status = 'active'`).bind(user.id, user.id, postId, post.moderation_marker)
    : c.env.DB.prepare(`DELETE FROM bookmarks WHERE user_id = ? AND post_id = ? AND EXISTS
        (SELECT 1 FROM posts p JOIN users au ON au.id = ? WHERE p.id = ? AND p.moderation_status = 'visible'
          AND COALESCE(p.moderation_action_id,'') = ? AND au.account_status = 'active')`).bind(user.id, postId, user.id, postId, post.moderation_marker);
  const notification = intended
    ? c.env.DB.prepare(`INSERT INTO notifications (id, user_id, actor_id, type, post_id)
        SELECT ?, p.author_id, ?, 'save', p.id FROM posts p
        WHERE p.id = ? AND p.author_id != ? AND p.moderation_status = 'visible'
          AND COALESCE(p.moderation_action_id,'') = ?
          AND EXISTS (SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = p.id)
          AND NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = p.author_id AND actor_id = ? AND type = 'save' AND post_id = p.id)`
        )
        .bind(crypto.randomUUID(), user.id, postId, user.id, post.moderation_marker, user.id, user.id)
    : c.env.DB.prepare(`DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'save' AND post_id = ?
        AND EXISTS (SELECT 1 FROM posts p WHERE p.id = ? AND p.moderation_status = 'visible'
          AND COALESCE(p.moderation_action_id,'') = ?)`).bind(post.author_id, user.id, postId, postId, post.moderation_marker);
  const result: any[] = await c.env.DB.batch([
    relation,
    c.env.DB.prepare(`UPDATE posts SET saves_count = (SELECT COUNT(*) FROM bookmarks WHERE post_id = ?)
      WHERE id = ? AND moderation_status = 'visible' AND COALESCE(moderation_action_id,'') = ?`).bind(postId, postId, post.moderation_marker),
    notification,
    c.env.DB.prepare(`SELECT moderation_status, COALESCE(moderation_action_id,'') AS moderation_marker,
      EXISTS(SELECT 1 FROM bookmarks WHERE user_id = ? AND post_id = posts.id) AS intended_state, saves_count,
      EXISTS(SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active') AS actor_active
      FROM posts WHERE id = ?`).bind(user.id, user.id, postId),
  ]);
  const state: any = result[3]?.results?.[0];
  if (!state || state.moderation_status !== 'visible' || state.moderation_marker !== post.moderation_marker) {
    return c.json({ error: 'Status warkah sudah berubah. Coba lagi.' }, 409);
  }
  if (Number(state.actor_active) !== 1) return c.json({ error: 'Sesi tidak valid. Muat ulang halaman.' }, 401);
  return c.json({ bookmarked: Number(state.intended_state) === 1, saves_count: Number(state.saves_count || 0) });
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
    const unf = await c.env.DB.prepare(`DELETE FROM follows WHERE follower_id = ? AND following_id = ?
      AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')`).bind(user.id, target.id, user.id).run();
    if (!unf.meta.changes) return c.json({ error: 'Sesi tidak valid. Muat ulang halaman.' }, 401);
    // buang notif follow lama — unfollow berarti "X mulai mengikuti" tak lagi benar
    await c.env.DB.prepare(`DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'follow'
      AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')`).bind(target.id, user.id, user.id).run();
    return c.json({ following: false });
  } else {
    // Audit C-05: OR IGNORE (pola like/bookmark) — follow konkuren tidak 500 lagi.
    const ins = await c.env.DB.prepare(`INSERT OR IGNORE INTO follows (follower_id, following_id)
      SELECT ?, ? FROM users au WHERE au.id = ? AND au.account_status = 'active'`).bind(user.id, target.id, user.id).run();
    if (!ins.meta.changes) return c.json({ following: true });
    const dup = await c.env.DB.prepare('SELECT 1 FROM notifications WHERE user_id = ? AND actor_id = ? AND type = ? LIMIT 1').bind(target.id, user.id, 'follow').first();
    if (!dup) {
      await c.env.DB.prepare(`INSERT INTO notifications (id, user_id, actor_id, type)
        SELECT ?, ?, ?, 'follow' FROM users au WHERE au.id = ? AND au.account_status = 'active'`)
        .bind(crypto.randomUUID(), target.id, user.id, user.id).run();
    }
    return c.json({ following: true });
  }
});

app.post('/api/users/:pen_name/remove-follower', async (c: any) => {
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: 'Silakan masuk terlebih dahulu' }, 401);

  if (await hitRate(c.env.DB, `engage:${user.id}`, 60, 60)) {
    return c.json({ error: 'Terlalu banyak interaksi. Tunggu sebentar.' }, 429);
  }

  const penName = c.req.param('pen_name').replace(/^@/, '').toLowerCase();
  const owner: any = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? LIMIT 1').bind(penName).first();
  if (!owner) return c.json({ error: 'Penulis tidak ditemukan' }, 404);
  if (owner.id !== user.id) return c.json({ error: 'Hanya bisa mengelola pengikutmu sendiri' }, 403);

  const body = await c.req.json().catch(() => ({}));
  const followerPen = String(body?.pen_name || '').replace(/^@/, '').toLowerCase();
  if (!followerPen) return c.json({ error: 'Nama pengikut tidak valid' }, 400);
  const follower: any = await c.env.DB.prepare('SELECT id FROM users WHERE pen_name = ? LIMIT 1').bind(followerPen).first();
  if (!follower) return c.json({ error: 'Pengikut tidak ditemukan' }, 404);
  if (follower.id === user.id) return c.json({ error: 'Tidak valid' }, 400);

  const del = await c.env.DB.prepare(`DELETE FROM follows WHERE follower_id = ? AND following_id = ?
    AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')`).bind(follower.id, user.id, user.id).run();
  await c.env.DB.prepare(`DELETE FROM notifications WHERE user_id = ? AND actor_id = ? AND type = 'follow'
    AND EXISTS (SELECT 1 FROM users au WHERE au.id = ? AND au.account_status = 'active')`).bind(user.id, follower.id, user.id).run();
  return c.json({ removed: (del.meta.changes || 0) > 0 });
});
}
