// Task 6: route + UI /admin/users — kontrak sesuai plan §6/§7/§456-460.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const routes = readFileSync(new URL('../src/routes/admin.ts', import.meta.url), 'utf8');
const lib = readFileSync(new URL('../src/lib/admin-social.ts', import.meta.url), 'utf8');
const webUsers = readFileSync(new URL('../src/web/admin-users.ts', import.meta.url), 'utf8');
const webAdmin = readFileSync(new URL('../src/web/admin.ts', import.meta.url), 'utf8');
const webPosts = readFileSync(new URL('../src/web/admin-posts.ts', import.meta.url), 'utf8');
const webAudit = readFileSync(new URL('../src/web/admin-audit.ts', import.meta.url), 'utf8');

// 1. Route: GET halaman + DUA POST mutasi akun; tidak ada verb lain.
assert.match(routes, /app\.get\('\/admin\/users'/);
assert.match(routes, /app\.post\('\/api\/admin\/users\/:id\/suspend'/);
assert.match(routes, /app\.post\('\/api\/admin\/users\/:id\/reinstate'/);
assert.doesNotMatch(routes, /app\.(put|patch|delete)\('/, 'verb tulis lain dilarang');

// 2. Reuse modul transisi T5 + guard order mengikuti moderasi post.
assert.match(routes, /import \{ suspendAccount, reinstateAccount \} from '\.\.\/lib\/admin-accounts'/);
assert.match(routes, /loadAdminUsers \} from '\.\.\/lib\/admin-social'/);
assert.match(routes, /import \{ renderAdminUsersPage \} from '\.\.\/web\/admin-users'/);
const accSlice = routes.slice(routes.indexOf('const accountMutate'));
assert.ok(accSlice.indexOf('isOwner') < accSlice.indexOf('content-type') &&
  accSlice.indexOf('content-type') < accSlice.indexOf('origin') &&
  accSlice.indexOf('origin') < accSlice.indexOf('hitRate') &&
  accSlice.indexOf('hitRate') < accSlice.indexOf("uuid.test") &&
  accSlice.indexOf("uuid.test") < accSlice.indexOf('10'), 'urutan guard owner→415→403→429→404→400');

// 3. Mapping §6.1: pre-read exact + pesan status eksplisit.
assert.match(routes, /SELECT id, email, account_status, account_action_id FROM users WHERE id = \? LIMIT 1/);
assert.match(routes, /Akun owner tidak dapat diubah/, 'target owner → 409');
assert.match(routes, /Suspend hanya untuk akun aktif\. Muat ulang daftar\./, 'suspend wrong-state → 409');
assert.match(routes, /Pemulihan hanya untuk akun yang ter-suspend|Akun tidak sedang ter-suspend/, 'reinstate wrong-state → 409');
assert.match(routes, /Status akun sudah berubah/, 'race/module-zero → 409');
assert.match(routes, /action_id/, 'sukses 200 membawa action id');
// Mutation hanya menerima id + reason; TIDAK menerima field users lain.
const mutateAcc = routes.slice(routes.indexOf('app.post(\'/api/admin/users/:id/suspend\''));
assert.doesNotMatch(mutateAcc, /body.?\.?(pen_name|email|account_status|password)/, 'body hanya reason');

// 4. Loader: 50 terbaru, kolom minimum, email dimasking SEBELUM keluar.
assert.match(lib, /export async function loadAdminUsers\(db: D1Database, ownerEmail: string\)/);
const loadSlice = lib.slice(lib.indexOf('export async function loadAdminUsers'), lib.indexOf('export async function loadAdminUsers') + 700);
assert.match(loadSlice, /SELECT id, pen_name, display_name, email, account_status\s+FROM users ORDER BY created_at DESC, id DESC LIMIT 50/,
  'loader: tepat kolom minimum, urut terbaru, max 50');
assert.match(loadSlice, /emailMasked: maskEmail\(/, 'email dimasking di loader, bukan di browser');
assert.doesNotMatch(loadSlice, /password|token_hash|suspended_reason|seller_|addr_|shop_/, 'kolom terlarang tak boleh terseleksi');
assert.match(loadSlice, /isOwner/, 'badge owner dihitung server-side');

// 5. Halaman: diuji pada OUTPUT ter-render, bukan teks komentar file.
const { renderAdminUsersPage } = await import(new URL('../src/web/admin-users.ts', import.meta.url).href);
const page = renderAdminUsersPage([
  { id: '00000000-0000-0000-0000-000000000001', penName: '<x>pen', displayName: 'Disp A', emailMasked: 'pe***@x.invalid', status: 'active', isOwner: false },
  { id: '00000000-0000-0000-0000-000000000002', penName: 'suspen', displayName: 'Disp S', emailMasked: 'su***@x.invalid', status: 'suspended', isOwner: false },
  { id: '00000000-0000-0000-0000-000000000003', penName: 'ownerpen', displayName: 'Disp O', emailMasked: 'ow***@berbirru.com', status: 'active', isOwner: true },
]);
assert.ok(!page.includes('<x>pen'), 'XSS: penName di-escape');
assert.match(page, /data-action="suspend"/, 'satu action sesuai status (aktif → suspend)');
assert.match(page, /data-action="reinstate"/, 'suspended → reinstate');
const ownerBlock = page.slice(page.indexOf('ownerpen'));
assert.ok(!ownerBlock.slice(0, ownerBlock.indexOf('</article>')).includes('<form'), 'baris owner tanpa tombol');
assert.ok(page.includes('Akun owner tidak dapat diubah.'));
assert.match(page, /reason/, 'kolom alasan wajib');
assert.match(page, /confirm\(/, 'alasan + konfirmasi sebelum kirim');
assert.match(page, /\/api\/admin\/users\/'\+form\.dataset\.id\+'\/'\+form\.dataset\.action/);
assert.doesNotMatch(page, /search|pagination|Halaman \d/i, 'tanpa fitur pencarian/penomoran');
assert.doesNotMatch(page, /<details|<table|password|token|ledger|bank|order_|addr_|seller_/i, 'tanpa markup data sensitif');
assert.doesNotMatch(page, /checkbox\b.*select-all|data-bulk/i, 'tanpa aksi massal');

// 6. Nav ko-eksistensi: Ketiga halaman lama + baru memuat Dashboard/Warkah/Akun/Jejak.
for (const [name, src] of [['webAdmin', webAdmin], ['webPosts', webPosts], ['webUsers', webUsers], ['webAudit', webAudit]] as [string, string][]) {
  assert.ok(src.includes('href="/admin"'), `${name}: link Dashboard`);
  assert.ok(src.includes('href="/admin/posts"'), `${name}: link Warkah`);
  assert.ok(src.includes('href="/admin/users"'), `${name}: link Akun`);
  assert.ok(src.includes('href="/admin/audit"'), `${name}: link Jejak`);
  assert.ok(src.includes('href="/owner"'), `${name}: link Rekber tetap ada`);
}
console.log('OK — Task 6: route+UI /admin/users (empat POST admin, loader minim, nav ko-eksisten)');
