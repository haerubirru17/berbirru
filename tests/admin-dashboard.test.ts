// Dashboard sosial superadmin: kontrak read-only, data minimization, dan renderer A.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const adminLib = await import('../src/lib/admin-social.ts');
const adminWeb = await import('../src/web/admin.ts');

assert.equal(adminLib.maskEmail('haeru@berbirru.com'), 'ha***@berbirru.com');
assert.equal(adminLib.maskEmail('a@x.id'), 'a***@x.id');

const issued: string[] = [];
const rows = [
  { pen_name: 'senja', display_name: 'Senja', email: 'senja@example.com', email_verified: 1, city: 'Bandung', created_at: '2026-11-04 10:00:00', posts_count: 2 },
];
const firstQueue: any[] = [
  { total_users: 10, new_users_7d: 2 },
  { active_writers_30d: 4 },
  { total_posts: 20, new_posts_7d: 3, original_posts: 15, chain_posts: 5 },
  { likes_7d: 8, bookmarks_7d: 3, follows_7d: 2, chains_7d: 1 },
  { unverified_users: 1, users_without_posts: 3, indexed_posts: 19, orphan_index_rows: 1, quarantined_posts: 1 },
];
const db: any = {
  prepare(sql: string) {
    issued.push(sql);
    return {
      first: async () => firstQueue.shift(),
      all: async () => ({ results: rows }),
    };
  },
};
const before = JSON.stringify(rows);
const model = await adminLib.loadAdminDashboard(db);
assert.equal(model.kpis.totalUsers, 10);
assert.equal(model.kpis.interactions7d.total, 14);
assert.equal(model.attention.orphanIndexRows, 1);
assert.equal(model.attention.quarantinedPosts, 1);
assert.equal(model.latestUsers[0].emailMasked, 'se***@example.com');
assert(!('email' in model.latestUsers[0]), 'email mentah tidak boleh masuk view model');
assert.equal(JSON.stringify(rows), before, 'loader tidak boleh memutasi hasil DB');
assert.equal(issued.length, 6, 'hanya query dashboard yang terdaftar');
for (const sql of issued) {
  assert.match(sql.trim(), /^SELECT\b/i, 'dashboard hanya boleh SELECT');
  assert.doesNotMatch(sql, /SELECT\s+\*/i, 'dashboard dilarang SELECT *');
  assert.doesNotMatch(sql, /password|token|bank|phone|address/i, 'kolom sensitif dilarang');
}
assert(issued.some((sql) => /COUNT\(DISTINCT f\.id\)/i.test(sql)), 'cakupan FTS harus tahan duplikasi');
assert(issued.some((sql) => /ORDER BY u\.created_at DESC, u\.id DESC/i.test(sql)), 'urutan akun harus deterministik');

const html = adminWeb.renderAdminPage(model);
assert.match(html, /Operational Polished|Kesehatan komunitas/);
assert.match(html, /Total pengguna/);
assert.match(html, /Penulis aktif/);
assert.match(html, /Total warkah/);
assert.match(html, /Interaksi/);
assert.match(html, /15 asli · 5 estafet/);
assert.match(html, /READ ONLY/);
assert.match(html, /1 warkah dikarantina/);
assert.match(html, /se\*\*\*@example\.com/);
assert.doesNotMatch(html, /senja@example\.com/);
assert.doesNotMatch(html, /\b(hapus|suspend|ban)\b/i);

const route = readFileSync(new URL('../src/routes/admin.ts', import.meta.url), 'utf8');
assert(route.includes("app.get('/admin'"), 'route /admin wajib terpisah');
assert(route.includes('isOwner(c.env, me)') && route.includes('c.notFound()'), 'non-owner harus 404');
assert(route.includes("Cache-Control', 'no-store"), 'dashboard wajib no-store');
assert.doesNotMatch(route, /app\.(post|put|patch|delete)\(/i, 'V1 tidak boleh punya mutation route');

const index = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
assert(index.includes('mountAdmin(app)'), 'route admin wajib dipasang');
assert(index.includes("c.req.path.startsWith('/admin')"), 'visual /admin tidak boleh ditimpa skin sosial');
const akun = readFileSync(new URL('../src/web/akun.ts', import.meta.url), 'utf8');
assert(akun.includes("baris('/admin'"), 'akun owner wajib punya tautan dashboard sosial');
assert(akun.includes("baris('/owner'"), 'tautan Rekber tetap terpisah');

console.log('OK — dashboard sosial admin read-only, owner-gated, dan data-minimal');
