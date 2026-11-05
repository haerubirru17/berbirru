// R1 compatibility contract: public post/notification queries must be explicit before moderation columns exist.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const shared = await import('../src/lib/shared.ts');
const social = readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8');
const index = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
const notifications = readFileSync(new URL('../src/routes/notifications.ts', import.meta.url), 'utf8');

assert.equal(typeof shared.PUBLIC_POST_COLUMNS, 'string', 'shared harus mengekspor proyeksi post publik');
for (const field of ['p.id AS id', 'p.author_id AS author_id', 'p.title AS title', 'p.content AS content',
  'p.parent_id AS parent_id', 'p.visibility AS visibility', 'p.likes_count AS likes_count',
  'p.saves_count AS saves_count', 'p.chains_count AS chains_count', 'p.created_at AS created_at']) {
  assert(shared.PUBLIC_POST_COLUMNS.includes(field), `proyeksi publik kehilangan ${field}`);
}
assert.doesNotMatch(social, /SELECT\s+p\.\*/i, 'route sosial dilarang SELECT p.*');
assert.doesNotMatch(index, /SELECT\s+p\.\*/i, 'SSR chain dilarang SELECT p.*');
assert.doesNotMatch(notifications, /SELECT\s+n\.\*/i, 'notifikasi dilarang SELECT n.*');
for (const field of ['n.id AS id', 'n.user_id AS user_id', 'n.actor_id AS actor_id', 'n.type AS type',
  "CASE WHEN p.moderation_status = 'visible' THEN n.post_id ELSE NULL END AS post_id",
  'n.order_id AS order_id', 'n.is_read AS is_read', 'n.created_at AS created_at']) {
  assert(notifications.includes(field), `projection notifikasi kehilangan ${field}`);
}
assert.doesNotMatch(shared.PUBLIC_POST_COLUMNS, /moderation_status|moderation_reason|moderated_at|moderated_by|moderation_action_id/,
  'kolom moderasi tidak boleh masuk proyeksi post publik');
console.log('OK — R1 memakai proyeksi eksplisit dan tetap kompatibel dengan schema lama');
