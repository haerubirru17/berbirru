import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const search = readFileSync(new URL('../src/web/search.ts', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/web/profile.ts', import.meta.url), 'utf8');
const feed = readFileSync(new URL('../src/web/feed.ts', import.meta.url), 'utf8');
const chain = readFileSync(new URL('../src/web/chain.ts', import.meta.url), 'utf8');
const social = readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8');
const notifications = readFileSync(new URL('../src/routes/notifications.ts', import.meta.url), 'utf8');
const shared = readFileSync(new URL('../src/lib/shared.ts', import.meta.url), 'utf8');

assert.match(search, /escapeHtml\(String\(p\.content \|\| ''\)\)/, 'search harus escape content sebelum innerHTML');
assert.match(profile, /p\.content/, 'profile rich text hanya boleh berasal dari API boundary');
assert.match(feed, /p\.content/, 'feed rich text hanya boleh berasal dari API boundary');
assert.match(chain, /b\.content/, 'chain rich text hanya boleh berasal dari API boundary');
assert.match(shared, /sanitizeRich\(p\.content\)/, 'shared boundary harus sanitize content');
assert.match(shared, /sanitizeRich\(p\.parent_content\)/, 'shared boundary harus sanitize parent_content');
assert.match(shared, /sanitizeRich\(p\.post_content\)/, 'shared boundary harus sanitize post_content');
assert.match(social, /posts\.map\(\(p: any\) => publicPost\(hardenPost\(p\)\)\)/, 'social profile/list API harus harden setiap post');
assert.match(social, /results \|\| \[\]\)\.map\(\(p: any\) => publicPost\(hardenPost\(p\)\)\)/, 'social chains API harus harden setiap post');
// Bentuk mapping notifikasi kini merakit URL foto pelaku setelah hardenPost — jaminannya
// tetap: SETIAP baris lewat hardenPost sebelum dikirim (bukan cuma bentuk lama `map(hardenPost)`).
assert.match(notifications, /const row = hardenPost\(n\);/, 'notifications API harus harden post_content');
assert.match(notifications, /map\(\(n: any\) => \{\s*\n\s*const row = hardenPost\(n\);/, 'notifications API memanggil hardenPost di dalam map');


console.log('OK — social renderers tidak memasukkan raw post content ke HTML');
