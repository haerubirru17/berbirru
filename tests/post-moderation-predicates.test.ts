// R3 contract: post quarantined tidak boleh dibaca/diindeks/diinteraksikan lewat jalur biasa.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const { visibilityClause } = await import('../src/lib/shared.ts');
const social = readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8');
const fts = readFileSync(new URL('../src/lib/fts.ts', import.meta.url), 'utf8');
const index = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
const notifications = readFileSync(new URL('../src/routes/notifications.ts', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../src/lib/admin-social.ts', import.meta.url), 'utf8');

for (const user of [null, { id: 'u1' }]) {
  const vis = visibilityClause(user);
  assert.match(vis.sql, /p\.moderation_status = 'visible'/);
}
assert.match(fts, /WHERE p\.moderation_status = 'visible'\s+AND p\.id NOT IN/i);
assert.match(social, /SELECT author_id, visibility, moderation_status, COALESCE\(moderation_action_id,''\) AS moderation_marker FROM posts WHERE id = \?/);
assert.match(social, /CASE WHEN p\.parent_id IS NULL OR EXISTS \(SELECT 1 FROM posts prnt[\s\S]*prnt\.moderation_status = 'visible'[\s\S]*THEN p\.parent_id ELSE NULL END AS parent_id/,
  'tab profil chains wajib meredaksi ID parent quarantined/tidak terlihat');
assert.match(index, /WHERE p\.id = \?1 AND p\.moderation_status = 'visible'/);
assert.match(notifications, /CASE WHEN p\.moderation_status = 'visible' THEN n\.post_id ELSE NULL END AS post_id/);
assert.match(notifications, /CASE WHEN p\.moderation_status = 'visible' THEN p\.title ELSE NULL END AS post_title/);
assert.match(notifications, /CASE WHEN p\.moderation_status = 'visible' THEN p\.content ELSE NULL END AS post_content/);

for (const fragment of [
  "FROM posts WHERE created_at >= datetime('now','-30 days') AND moderation_status = 'visible'",
  "COUNT(id) FROM posts WHERE moderation_status = 'quarantined'",
  "JOIN posts p ON p.id = l.post_id AND p.moderation_status = 'visible'",
  "JOIN posts p ON p.id = b.post_id AND p.moderation_status = 'visible'",
]) assert(admin.includes(fragment), `KPI kehilangan predicate: ${fragment}`);

assert.match(social, /INSERT INTO posts[\s\S]*SELECT[\s\S]*parent\.moderation_status = 'visible'/i);
assert.match(social, /DELETE FROM posts WHERE id = \? AND author_id = \? AND moderation_status = 'visible'/);
assert.match(social, /INSERT OR IGNORE INTO likes[\s\S]*moderation_status = 'visible'[\s\S]*moderation_action_id/i);
assert.match(social, /INSERT OR IGNORE INTO bookmarks[\s\S]*moderation_status = 'visible'[\s\S]*moderation_action_id/i);
assert.match(social, /NOT EXISTS \(SELECT 1 FROM notifications[\s\S]*type = 'like'/i);
assert.match(social, /NOT EXISTS \(SELECT 1 FROM notifications[\s\S]*type = 'save'/i);
console.log('OK — R3 read/write predicates menutup post quarantined');
