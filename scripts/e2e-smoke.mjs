// Smoke E2E idempotent untuk sandbox uji. Dipakai di setiap siklus refactor.
// node scripts/e2e-smoke.mjs        → semua checks; process.exit(1) kalau ada gagal.
// Scope: sosial + guard dasar pasar. Memakai akun fixture snap1/snap2 (lihat references/berbirru-sandbox-e2e.md).
import { chromium } from '/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs';

const B = process.env.SMOKE_BASE || 'https://berbirru-uji.haerubirru17.workers.dev';
const results = [];
const ck = (name, pass, detail) => { results.push({ name, pass: !!pass, detail: String(detail ?? '').slice(0, 160) }); };

const br = await chromium.launch();
const guest = await br.newContext();
const s1 = await br.newContext({ storageState: '/tmp/golden-state-snap1.json' });
const s2 = await br.newContext({ storageState: '/tmp/golden-state-snap2.json' });

try {
  // --- Guard tamu (read-only POST) ---
  const gl = await guest.request.post(B + '/api/posts/snap-post-000000000000000000000001/like');
  ck('guest-like-401', gl.status() === 401, gl.status());
  const gf = await guest.request.post(B + '/api/users/snap2/follow');
  ck('guest-follow-401', gf.status() === 401, gf.status());
  const gp = await guest.request.post(B + '/api/pasar/listings/xyz/orders');
  ck('guest-pasar-order-401or404or400', [400, 401, 404].includes(gp.status()), gp.status());

  // --- Pencarian & wildcard ---
  const w = await (await guest.request.get(B + '/api/posts?mode=latest&q=%25')).json();
  ck('wildcard-pct-0', (w.posts ?? []).length === 0, (w.posts ?? []).length);
  const k = await (await guest.request.get(B + '/api/posts?mode=latest&q=kijangemas10')).json();
  const goldenPost = (k.posts ?? []).find(p => p.id === 'snap-post-000000000000000000000001');
  ck('cari-kijangemas10-ditemukan', !!goldenPost, (k.posts ?? []).length);

  // --- Identitas & follows API ---
  const me = await (await s1.request.get(B + '/api/auth/me')).json();
  ck('auth-me-snap1', me.user?.pen_name === 'snap1', JSON.stringify(me.user));
  const bad = await s1.request.get(B + '/api/users/snap1/follows?type=zzz');
  ck('follows-type-invalid-400', bad.status() === 400, bad.status());
  const fw0 = await (await s2.request.get(B + '/api/users/snap1/follows?type=followers')).json();
  const fBase = fw0.count ?? fw0.accounts?.length ?? 0;

  // --- Compose → feed → delete (netral bersih) ---
  const mk = await s1.request.post(B + '/api/posts', { data: { title: 'Smoke Warkah [#smoke]', content: 'smoke kijangemas10 smokecheck', visibility: 'public' } });
  const post = waitingPost(await mk.json());
  ck('compose-201', mk.status() === 201 && !!post.id, `${mk.status()} ${post.id}`);
  if (post.id) {
    const du = await s1.request.delete(B + '/api/posts/' + post.id);
    ck('delete-own-200', du.status() === 200, du.status());
    const after = await (await guest.request.get(B + '/api/posts?mode=latest&q=smokecheck')).json();
    ck('deleted-tak-muncul', (after.posts ?? []).length === 0, (after.posts ?? []).length);
  }

  // --- Like / Save cycle (state-agnostic: NETRALKAN baseline dulu, uji kedua arah, kembalikan ke awal) ---
  const GOLD = 'snap-post-000000000000000000000001';
  const likeNow = async () => (await s2.request.post(B + `/api/posts/${GOLD}/like`).then(r => r.json())).liked ?? false;
  const readFeed = async () => {
    const f = await (await s2.request.get(B + '/api/posts?mode=latest&q=kijangemas10')).json();
    const p = (f.posts ?? []).find(p => p.id === GOLD);
    return { liked: !!p?.is_liked, count: p?.likes_count ?? 0 };
  };
  let st = await readFeed();
  if (st.liked) await likeNow(); // netralkan ke tidak-like
  const sA = await likeNow();     // baseline: tidak-like → aktifkan
  const r1 = await readFeed();
  ck('like-toggle-on', r1.liked === sA && sA === true && r1.count === st.count - (st.liked ? 1 : 0) + 1, `${st.liked}/${st.count} -> ${r1.liked}/${r1.count}`);
  await likeNow();                // kembali ke tidak-like
  const r2 = await readFeed();
  ck('like-toggle-off-kembali', !r2.liked && r2.count === r1.count - 1, `${r1.count} -> ${r2.count}`);
  if (st.liked) await likeNow();  // kembalikan ke state awal fixture

  const Bs = await s2.request.post(B + `/api/posts/${GOLD}/bookmark`).then(r => r.json());
  const Bs0 = await s2.request.post(B + `/api/posts/${GOLD}/bookmark`).then(r => r.json());
  ck('save-toggle-dua-arah', (Bs.bookmarked ?? Bs.saved) !== (Bs0.bookmarked ?? Bs0.saved), JSON.stringify(Bs) + '->' + JSON.stringify(Bs0));

  // --- Follow cycle (state-agnostic, response {user:{...}}) ---
  const followNow = () => s2.request.post(B + '/api/users/snap1/follow');
  const isFollowing = async () => {
    const j = await (await s2.request.get(B + '/api/users/snap1')).json();
    return !!(j.user?.is_following ?? j.user?.self_is_following ?? j.is_following ?? j.self_is_following);
  };
  const cntFollowNotif = async () => {
    const j = await s1.request.get(B + '/api/notifications').then(r => r.json());
    return (j.notifications ?? []).filter(n => n.type === 'follow' && n.actor_pen_name === 'snap2').length;
  };
  const wasFollowing = await isFollowing();
  if (wasFollowing) await followNow(); // netralkan ke tidak-follow
  const cntBefore = await cntFollowNotif();
  await followNow(); // follow aktif
  const u = await s1.request.get(B + '/api/notifications/unread-count').then(r => r.json());
  const cntOn = await cntFollowNotif();
  ck('follow-unread-naik', (u.count ?? 0) >= cntOn, u.count);
  ck('notifikasi-follow-ada', cntOn === cntBefore + 1, `${cntBefore} -> ${cntOn}`);
  await followNow(); // unfollow
  const cntAfter = await cntFollowNotif();
  ck('notif-follow-terhapus-usai-unfollow', cntAfter === cntBefore, `${cntBefore} -> ${cntAfter}`);
  if (wasFollowing) await followNow(); // kembalikan
  ck('follow-state-dikembalikan', (await isFollowing()) === wasFollowing, String(await isFollowing()));

  // --- Halaman dasar & dot ---
  for (const [pBug, want] of [['/', 200], ['/login', 200], ['/feed', 200], ['/pasar', 200]]) {
    const r = await guest.request.get(B + pBug);
    ck(`page-${pBug}-${want}`, r.status() === want, r.status());
  }
  try {
    const pg = await s1.newPage();
    await pg.goto(B + '/notifications', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await pg.waitForTimeout(900);
    const dot = await pg.evaluate(() => !!document.getElementById('notifDot'));
    ck('notif-dot-dirender', dot, dot);
  } catch (e) {
    ck('notif-dot-dirender', false, 'err: ' + (e?.message || e));
  }

  // --- Guard mutasi pasar tanpa sesi ---
  const pl = await guest.request.patch(B + '/api/pasar/listings/nonexistent', { data: { stock: 1 } });
  ck('patch-listing-tanpa-sesi-401', pl.status() === 401, pl.status());
  const pd = await guest.request.delete(B + '/api/pasar/listings/nonexistent');
  ck('delete-listing-tanpa-sesi-401', pd.status() === 401, pd.status());
} finally {
  await br.close();
}

function waitingPost(j) { return j?.post ?? j?.warkah ?? j ?? {}; }

const failed = results.filter(r => !r.pass);
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '  :: ' + r.detail}`);
console.log(`${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
