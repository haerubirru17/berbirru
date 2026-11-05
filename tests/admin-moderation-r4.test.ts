// R4 contract: transition atomik, daftar admin aman, dan hanya dua mutation route.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const moderation = await import('../src/lib/admin-moderation.ts');
const adminLib = await import('../src/lib/admin-social.ts');
const adminWeb = await import('../src/web/admin-posts.ts');

assert.equal(typeof moderation.quarantinePost, 'function');
assert.equal(typeof moderation.restorePost, 'function');
assert.equal(typeof adminLib.loadAdminPosts, 'function');
assert.equal(typeof adminWeb.renderAdminPostsPage, 'function');

const issued: string[] = [];
const db: any = { prepare(sql: string) { issued.push(sql); return { bind() { return this; }, all: async () => ({ results: [{ id:'p1', title:'<x>', content:'<b>isi</b>', visibility:'public', created_at:'2026-11-05', moderation_status:'quarantined', moderation_reason:'alasan aman cukup panjang', moderated_at:'2026-11-05', moderated_by:'u1', moderation_action_id:'a1', pen_name:'pena', author_email:'pena@example.invalid' }] }) }; } };
const rows = await adminLib.loadAdminPosts(db, 'quarantined');
assert.equal(issued.length, 1);
assert.match(issued[0], /WHERE p\.moderation_status = \?/);
assert.match(issued[0], /ORDER BY p\.created_at DESC, p\.id DESC\s+LIMIT 50/);
assert.equal(rows.length, 1);
const html = adminWeb.renderAdminPostsPage(rows, 'quarantined');
assert.match(html, /Dashboard/); assert.match(html, /Warkah/); assert.match(html, /Buka Rekber/);
assert.match(html, /Karantina|Pulihkan/); assert.match(html, /alasan/i);
assert.doesNotMatch(html, /<x>/); assert.doesNotMatch(html, /pena@example\.invalid/);

const route = readFileSync(new URL('../src/routes/admin.ts', import.meta.url), 'utf8');
assert.match(route, /app\.get\('\/admin\/posts'/);
assert.match(route, /app\.post\('\/api\/admin\/posts\/:id\/quarantine'/);
assert.match(route, /app\.post\('\/api\/admin\/posts\/:id\/restore'/);
assert.match(route, /application\/json/); assert.match(route, /Origin/i);
assert.match(route, /admin:moderate:/); assert.match(route, /30,\s*60/);
assert.match(route, /reason[\s\S]*10[\s\S]*500/);
assert.doesNotMatch(route, /app\.(put|patch|delete)\(/i);
assert.doesNotMatch(route, /hard.?delete|DROP\s+TABLE|owner_actions/i);

const postsRouteSlice = route.slice(route.indexOf("app.get('/admin/posts'"), route.indexOf('const mutate'));
assert(postsRouteSlice.includes('isOwner(c.env, me)') && postsRouteSlice.includes("Cache-Control', 'no-store"), '/admin/posts wajib owner-only + no-store');

const transition = readFileSync(new URL('../src/lib/admin-moderation.ts', import.meta.url), 'utf8');
assert.match(transition, /DB\.batch|db\.batch/);
assert.match(transition, /moderation_action_id/);
assert.match(transition, /DELETE FROM posts_fts WHERE id = \?/);
assert.match(transition, /INSERT INTO social_admin_actions/);
assert.doesNotMatch(transition, /stripTags\s*\(content\)/, 'stripTags tidak boleh dipanggil dari SQL');
console.log('OK — R4 admin moderation contract terkunci');
