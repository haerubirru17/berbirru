// Armada agent E2E berbirru — 1 akun per agent, API-level, sesi diinjeksi parent.
// Pakai: node scripts/armada-agent.mjs <SELF_EMAIL> <SELF_PEN> <TARGET_PEN> <PREV_PEN|-> <TOKEN> <DONE_PATH>
// Kontrak: TIDAK deploy, TIDAK ubah source, TIDAK SQL, TIDAK menghapus data siapa pun.
const [SELF_EMAIL, SELF_PEN, TARGET_PEN, PREV_PEN, TOKEN, DONE_PATH] = process.argv.slice(2);
if (!SELF_EMAIL || !SELF_PEN || !TARGET_PEN || !TOKEN || !DONE_PATH) {
  console.error('argumen kurang'); process.exit(2);
}
const BASE = process.env.BASE_URL || 'https://berbirru-uji.haerubirru17.workers.dev';
const MARK = '#' + SELF_PEN.replace('agen', '');           // "#01".."#10"
const COOKIE = 'berbirru_session=' + TOKEN;
const results = [], skip = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}
async function api(method, path, body, raw = false) {
  const opt = { method, headers: { cookie: COOKIE }, redirect: 'manual' };
  if (body !== undefined) { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const res = await fetch(BASE + path, opt);
  if (raw) return res;
  let data = {}; try { data = await res.json(); } catch {}
  return { status: res.status, data };
}
async function poll(label, fn, timeoutMs = 120000, every = 2500) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const v = await fn().catch(() => null);
    if (v) return v;
    await new Promise(r => setTimeout(r, every));
  }
  throw new Error('timeout: ' + label);
}

// ---- 1. akun & UI auth ----
{
  const page = await api('GET', '/akun', undefined, true);
  const html = await page.text();
  check('akun: /akun 200 & mengenaninya', page.status === 200 && html.includes(SELF_PEN), `status ${page.status}`);
  const pubApi = await api('GET', `/api/users/${SELF_PEN}`);
  check('akun: email tidak bocor di API publik', !JSON.stringify(pubApi.data).includes(SELF_EMAIL) && !JSON.stringify(pubApi.data).includes('"email"'));
}
// ---- 2. tulis warkah ----
const stamp = Date.now().toString(36);
const mk = async (title, content, visibility, parent_id) => {
  const r = await api('POST', '/api/posts', { title, content, visibility, ...(parent_id ? { parent_id } : {}) });
  return r;
};
const pub = await mk(`${MARK} Warkah armada ${stamp}`, `Bait armada ${MARK} ${stamp}.`, 'public');
const priv = await mk(`${MARK} Warkah privat ${stamp}`, `Bait privat ${MARK} ${stamp}.`, 'private');
const pubId = pub.data?.post?.id || pub.data?.id;
const privId = priv.data?.post?.id || priv.data?.id;
check('tulis: warkah publik 201', pub.status === 201 || pub.status === 200, `status ${pub.status}`);
check('tulis: warkah privat 201', priv.status === 201 || priv.status === 200, `status ${priv.status}`);
check('tulis: id diterima', Boolean(pubId && privId));
// ---- 3. validasi ----
check('validasi: isi kosong 400', (await api('POST', '/api/posts', { content: '   ' })).status === 400);
check('validasi: visibilitas ngawur 400', (await api('POST', '/api/posts', { content: 'x', visibility: 'friends' })).status === 400);
// ---- 4. beranda = publik saja ----
{
  const f = (await api('GET', '/api/posts?mode=latest')).data;
  const ids = (f.posts || []).map(p => p.id);
  check('beranda: publik sendiri tampak', ids.includes(pubId));
  check('beranda: privat sendiri tersembunyi', !ids.includes(privId));
  check('beranda: email tidak bocor', !JSON.stringify(f).includes('"email"'));
}
// profil sendiri vs orang lain
{
  const meNow = (await api('GET', `/api/users/${SELF_PEN}/posts?tab=original`)).data;
  check('profil: privat sendiri terlihat bagi pemilik', (meNow.posts || []).some(p => p.id === privId));
}
// ---- 5._sinkronisasi: tunggu warkah publik target ----
const feedPosts = () => api('GET', '/api/posts?mode=latest').then(r => r.data?.posts || []);
let targetPubId = null, targetTitle = null;
try {
  const found = await poll(`warkah ${TARGET_PEN}`, async () => {
    const hit = (await feedPosts()).find(p => p.pen_name === TARGET_PEN && (p.title || '').startsWith('#'));
    return hit || null;
  });
  targetPubId = found.id; targetTitle = found.title;
  check('sinkron: warkah target terlihat', true, `${TARGET_PEN} «${(targetTitle || '').slice(0, 30)}»`);
} catch { check('sinkron: warkah target terlihat', false, 'timeout 120s'); }
// ---- 6. interaksi ke target ----
if (targetPubId) {
  const like = await api('POST', `/api/posts/${targetPubId}/like`, {});
  check('interaksi: like target', like.data.liked === true || like.data.is_liked === true, JSON.stringify(like.data).slice(0, 60));
  const bm = await api('POST', `/api/posts/${targetPubId}/bookmark`, {});
  check('interaksi: simpan target', bm.data.bookmarked === true || bm.data.is_saved === true);
  const chain = await mk(`${MARK} Sambungan`, `Menyambung bait ${MARK} ke ${targetTitle || targetPubId}.`, 'public', targetPubId);
  const chainId = chain.data?.post?.id || chain.data?.id;
  check('interaksi: sambungan dibuat', chain.status === 201 || chain.status === 200);
  const chains = (await api('GET', `/api/posts/${targetPubId}/chains`)).data;
  check('interaksi: sambungan terdaftar di induk', Array.isArray(chains.chains) && (!chainId || chains.chains.some(c => (c.id || c.post_id) === chainId)));
  const prof0 = (await api('GET', `/api/users/${TARGET_PEN}`)).data;
  if (prof0.user?.is_following) {
    check('interaksi: follow target', true, 'sudah mengikuti dari run sebelumnya');
  } else {
    const f = await api('POST', `/api/users/${TARGET_PEN}/follow`, {});
    check('interaksi: follow target', f.data.following === true || f.data.is_following === true);
  }
  const prof = (await api('GET', `/api/users/${TARGET_PEN}`)).data;
  check('interaksi: pengikut target bertambah', (prof.user?.followers_count || 0) >= 1);
} else {
  skip.push('interaksi target (warkah target tidak ditemukan)');
}
// ---- 7. notifikasi dari prev (lingkaran) ----
if (PREV_PEN !== '-') {
  try {
    const hit = await poll(`notifikasi dari ${PREV_PEN}`, async () => {
      const n = (await api('GET', '/api/notifications')).data?.notifications || [];
      return n.find(x => x.actor_pen_name === PREV_PEN) || null;
    });
    check('notifikasi: menerima dari prev', true, `${hit.type} dari ${PREV_PEN}`);
  } catch { check('notifikasi: menerima dari prev', false, 'timeout 120s'); }
} else skip.push('notifikasi prev (tidak ada prev)');
// ---- 8. edit profil ----
{
  const bio = `Bio armada ${MARK} ${stamp}`;
  const r = await api('PATCH', '/api/users/me', { display_name: '', city: 'Nusantara', bio });
  const back = (await api('GET', `/api/users/${SELF_PEN}`)).data;
  check('profil: PATCH bio tersimpan', r.status === 200 && back.user?.bio === bio, `patch ${r.status}`);
  const r2 = await api('PATCH', '/api/users/me', { display_name: '', city: 'Nusantara', bio: 'Bio armada ' + MARK });
}
// ---- 9. avatar upload ----
{
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAABzenr0AAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const up = await fetch(BASE + '/api/me/media/avatar', { method: 'PUT', headers: { cookie: COOKIE, 'content-type': 'image/png' }, body: png });
  const d = await up.json().catch(() => ({}));
  check('media: upload avatar ok', up.status === 200 && d.ok === true, `status ${up.status}`);
  let shown = false;
  if (d.url) { const g = await fetch(BASE + d.url); shown = g.status === 200; }
  check('media: avatar tersaji 200', shown);
}
// ---- 10. UI halaman ----
for (const p of ['/feed', '/search', '/notifications', '/pasar', '/akun']) {
  const r = await api('GET', p, undefined, true);
  check(`UI ${p} 200`, r.status === 200, `status ${r.status}`);
}
check('UI /saldo 302 ke tab', (await api('GET', '/saldo', undefined, true)).status === 302);

// ---- selesai: tulis bukti ----
const summary = {
  agent: SELF_PEN, n: MARK,
  pass: results.filter(r => r.ok).length,
  fail: results.filter(r => !r.ok).length,
  skip,
  results, at: new Date().toISOString(),
};
import fs from 'node:fs';
fs.writeFileSync(DONE_PATH, JSON.stringify(summary, null, 1));
console.log(`SELESAI ${SELF_PEN}: ${summary.pass}/${results.length} PASS, ${summary.fail} FAIL${summary.skip.length ? ', SKIP ' + summary.skip.length : ''}`);
process.exit(summary.fail ? 1 : 0);
