// Jejak Tindakan: reader read-only audit sosial — tanpa tombol hapus/edit.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const page = await import('../src/web/admin-audit.ts');
assert.equal(typeof page.renderAdminAuditPage, 'function');

const adminLib = await import('../src/lib/admin-social.ts');
assert.equal(typeof adminLib.loadAdminAudit, 'function');

const issued: string[] = [];
const db: any = {
  prepare(sql: string) {
    issued.push(sql);
    if (/sqlite_master/.test(sql)) return { first: async () => ({ n: 1 }) };
    return { all: async () => ({ results: [] }) };
  },
};
const model = await adminLib.loadAdminAudit(db);
assert(Array.isArray(model.warkah), 'model.warkah wajib array');
assert(Array.isArray(model.akun), 'model.akun wajib array');
for (const sql of issued) {
  assert.match(sql.trim(), /^SELECT\b/i, 'loader hanya boleh SELECT');
  assert.doesNotMatch(sql, /password|token|session|owner_actions/i, 'kolom sensitif terlarang');
}
assert(issued.some((s) => /social_admin_actions/.test(s)), 'wajib baca audit warkah');
assert(issued.some((s) => /social_account_actions/.test(s)), 'wajib baca audit akun bila tabel ada');

const html = page.renderAdminAuditPage(model);
assert.match(html, /Jejak Tindakan/);
assert.match(html, /tidak bisa dihapus/i);
assert.match(html, /Belum ada tindakan/);
assert.match(html, /Dashboard/); assert.match(html, /Warkah/); assert.match(html, /Buka Rekber/);
assert.doesNotMatch(html, /<button[^>]*(hapus|delete)|onclick=.*(delete|DROP)/i, 'tidak boleh ada aksi hapus');

const route = readFileSync(new URL('../src/routes/admin.ts', import.meta.url), 'utf8');
assert(route.includes("app.get('/admin/audit'"), 'route /admin/audit wajib ada');
const slice = route.slice(route.indexOf("app.get('/admin/audit'"), route.indexOf('const mutate'));
assert(slice.includes('isOwner(c.env, me)') && slice.includes("Cache-Control', 'no-store"), '/admin/audit wajib owner-only + no-store');
assert.doesNotMatch(route, /DELETE FROM social_(admin|account)_actions|UPDATE social_(admin|account)_actions/i, 'tidak ada jalur tulis/hapus audit dari route');

const posts = readFileSync(new URL('../src/web/admin-posts.ts', import.meta.url), 'utf8');
assert(posts.includes("href=\"/admin/audit\""), 'nav konsol Warkah wajib menautkan Jejak');
console.log('OK — Jejak Tindakan read-only, owner-only, dua sumber audit');
