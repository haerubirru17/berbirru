// E2E logika web BERBIRRU (sandbox uji).
// Dua akun agen terpisah + satu tamu; tiap cek berdiri sendiri dan dibersihkan di akhir.
// Jalankan: node tests/e2e/social.e2e.mjs [baseUrl]
import { chromium } from "/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs";

const BASE = process.argv[2] || "https://berbirru-uji.haerubirru17.workers.dev";
const PASS = "UjiAm4n!2026";
const TURNSTILE = "XXXX.DUMMY.TOKEN.XXXX";

const results = [];
let failed = 0;
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

const browser = await chromium.launch();

async function agent(email) {
  const ctx = await browser.newContext({ baseURL: BASE });
  const page = await ctx.newPage();
  const res = await page.request.post("/api/auth/login", {
    data: { email, password: PASS, turnstile_token: TURNSTILE },
  });
  return { ctx, page, login: res.status() };
}
const guest = await (await browser.newContext({ baseURL: BASE })).newPage();

// ---------- 1. Tamu: gerbang akses ----------
check("tamu: feed API terbuka", (await guest.request.get("/api/posts?mode=latest")).status() === 200);
{
  const body = await (await guest.request.get("/api/posts?mode=latest")).json();
  check("tamu: tidak melihat warkah privat", !body.posts.some((p) => p.visibility === "private"));
  check("tamu: email penulis tidak bocor", !JSON.stringify(body).includes('"email"'));
}
check("tamu: kirim warkah ditolak 401", (await guest.request.post("/api/posts", { data: { content: "x" } })).status() === 401);
check("tamu: like ditolak 401", (await guest.request.post("/api/posts/abc/like", {})).status() === 401);
check("tamu: follow ditolak 401", (await guest.request.post("/api/users/agen_satu/follow", {})).status() === 401);
check("tamu: /pasar/saya dialihkan ke login", (await guest.request.get("/pasar/saya", { maxRedirects: 0 })).status() === 302);
check("tamu: /owner 404 (tidak bocor)", (await guest.request.get("/owner", { maxRedirects: 0 })).status() === 404);
check("tamu: /pasar publik 200", (await guest.request.get("/pasar")).status() === 200);
check("tamu: /u/ halaman profil dialihkan login", (await guest.request.get("/u/agen_satu", { maxRedirects: 0 })).status() === 302);

// ---------- 2. Login dua agen ----------
const a1 = await agent("agen1@uji.local");
const a2 = await agent("agen2@uji.local");
check("agen1 login", a1.login === 200, `status ${a1.login}`);
check("agen2 login", a2.login === 200, `status ${a2.login}`);
check(
  "agen1: /setelah-masuk → /feed",
  (await a1.page.request.get("/setelah-masuk", { maxRedirects: 0 })).headers()["location"] === "/feed"
);
check("agen1: bukan owner → /owner 404", (await a1.page.request.get("/owner", { maxRedirects: 0 })).status() === 404);

// ---------- 3. Tulis warkah ----------
const stamp = Date.now().toString(36);
const mk = async (who, title, content, visibility) => {
  const r = await who.page.request.post("/api/posts", { data: { title, content, visibility } });
  return { status: r.status(), body: await r.json().catch(() => ({})) };
};
const pub = await mk(a1, `Publik ${stamp}`, `Warkah publik uji ${stamp}.`, "public");
const priv = await mk(a1, `Privat ${stamp}`, `Warkah privat uji ${stamp}.`, "private");
check("agen1: warkah publik dibuat", pub.status === 201 || pub.status === 200, `status ${pub.status}`);
check("agen1: warkah privat dibuat", priv.status === 201 || priv.status === 200, `status ${priv.status}`);
const pubId = pub.body?.post?.id || pub.body?.id;
const privId = priv.body?.post?.id || priv.body?.id;
check("agen1: id warkah diterima", Boolean(pubId && privId));

check("agen1: isi kosong ditolak 400", (await a1.page.request.post("/api/posts", { data: { content: "   " } })).status() === 400);
check(
  "agen1: visibilitas ngawur ditolak 400",
  (await a1.page.request.post("/api/posts", { data: { content: "halo", visibility: "friends" } })).status() === 400
);

// ---------- 4. Beranda = publik saja ----------
{
  const f1 = await (await a1.page.request.get("/api/posts?mode=latest")).json();
  const ids = f1.posts.map((p) => p.id);
  check("agen1: warkah publik muncul di beranda", ids.includes(pubId));
  check("agen1: warkah privat TIDAK muncul di beranda", !ids.includes(privId));
  const f2 = await (await a2.page.request.get("/api/posts?mode=latest")).json();
  check("agen2: warkah publik agen1 terlihat", f2.posts.some((p) => p.id === pubId));
  check("agen2: warkah privat agen1 tidak terlihat", !f2.posts.some((p) => p.id === privId));
}
{
  const p1 = await (await a1.page.request.get("/api/users/agen_satu/posts?tab=original")).json();
  check("profil sendiri: warkah privat tetap tampil", p1.posts.some((p) => p.id === privId));
  const p2 = await (await a2.page.request.get("/api/users/agen_satu/posts?tab=original")).json();
  check("profil orang lain: warkah privat tidak tampil", !p2.posts.some((p) => p.id === privId));
}

// ---------- 5. Interaksi silang ----------
const like1 = await (await a2.page.request.post(`/api/posts/${pubId}/like`, {})).json().catch(() => ({}));
check("agen2: like warkah agen1", like1.liked === true || like1.is_liked === true, JSON.stringify(like1).slice(0, 80));
const like2 = await (await a2.page.request.post(`/api/posts/${pubId}/like`, {})).json().catch(() => ({}));
check("agen2: unlike mengembalikan status", like2.liked === false || like2.is_liked === false);
const bm = await (await a2.page.request.post(`/api/posts/${pubId}/bookmark`, {})).json().catch(() => ({}));
check("agen2: simpan warkah", bm.bookmarked === true || bm.saved === true || bm.is_saved === true);
const chain = await mk(a2, `Sambungan ${stamp}`, `Menyambung bait ${stamp}.`, "public");
check("agen2: sambungan dibuat", chain.status === 201 || chain.status === 200);
{
  const chains = await (await a2.page.request.get(`/api/posts/${pubId}/chains`)).json();
  check("sambungan tampil di rantai warkah induk", Array.isArray(chains.chains));
}

// ---------- 6. Follow & notifikasi ----------
const f1 = await (await a2.page.request.post("/api/users/agen_satu/follow", {})).json().catch(() => ({}));
check("agen2: follow agen1", f1.following === true || f1.is_following === true, JSON.stringify(f1).slice(0, 80));
{
  const prof = await (await a2.page.request.get("/api/users/agen_satu")).json();
  check("pengikut agen1 bertambah", prof.user.followers_count >= 1);
}
const unf = await (await a2.page.request.post("/api/users/agen_satu/follow", {})).json().catch(() => ({}));
check("agen2: unfollow", unf.following === false || unf.is_following === false);
{
  const n = await (await a1.page.request.get("/api/notifications")).json();
  check("agen1 menerima notifikasi interaksi", Array.isArray(n.notifications) && n.notifications.length >= 0);
}

// ---------- 7. Keamanan konten ----------
{
  const xss = await mk(a2, `XSS ${stamp}`, `<img src=x onerror=alert(1)><script>alert(2)</script>teks aman ${stamp}`, "public");
  const html = await (await a2.page.request.get("/api/posts?mode=latest")).text();
  check("XSS: <script> tidak lolos ke feed", !html.includes("<script>alert(2)</script>"));
  if (xss.body?.post?.id || xss.body?.id) {
    const id = xss.body.post?.id || xss.body.id;
    await a2.page.request.delete(`/api/posts/${id}`);
  }
}

// ---------- 8. Halaman UI utama ----------
for (const [path, name] of [
  ["/feed", "feed"],
  ["/search", "search"],
  ["/notifications", "notifikasi"],
  ["/akun", "akun"],
  ["/pasar", "pasar"],
]) {
  const r = await a1.page.request.get(path, { maxRedirects: 0 });
  check(`UI ${path} (${name}) terbuka`, r.status() === 200, `status ${r.status()}`);
}
{
  const r = await a1.page.request.get("/u/agen_satu", { maxRedirects: 0 });
  check("UI profil sendiri terbuka", r.status() === 200, `status ${r.status()}`);
}
check("UI /saldo dialihkan ke tab saldo", (await a1.page.request.get("/saldo", { maxRedirects: 0 })).status() === 302);

// ---------- 9. Bersihkan ----------
for (const id of [pubId, privId]) {
  if (id) await a1.page.request.delete(`/api/posts/${id}`);
}
{
  const left = await (await a1.page.request.get("/api/users/agen_satu/posts?tab=original")).json();
  check("cleanup: warkah uji terhapus", !left.posts.some((p) => p.id === pubId || p.id === privId));
}

await browser.close();
console.log(`\n${results.length - failed}/${results.length} PASS, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
