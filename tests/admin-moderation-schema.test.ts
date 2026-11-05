// R2 schema contract: bootstrap baru dan upgrade existing harus menghasilkan invariant moderasi yang sama.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const migration = readFileSync(new URL('../migrations/0033_social_post_moderation.sql', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const fixture = readFileSync(new URL('./fixtures/current-schema-pre-0033.sql', import.meta.url), 'utf8');

for (const src of [migration, schema]) {
  assert.match(src, /moderation_status\s+TEXT\s+NOT NULL\s+DEFAULT\s+'visible'/i);
  assert.match(src, /CHECK\s*\(moderation_status\s+IN\s*\('visible','quarantined'\)\)/i);
  for (const col of ['moderation_reason', 'moderated_at', 'moderated_by', 'moderation_action_id']) assert(src.includes(col), `kolom ${col} hilang`);
  assert.match(src, /CREATE TABLE(?: IF NOT EXISTS)? social_admin_actions/i);
  assert.match(src, /CHECK\s*\(action\s+IN\s*\('post_quarantine','post_restore'\)\)/i);
  assert.match(src, /target_post_id\s+TEXT\s+NOT NULL/i);
  assert.doesNotMatch(src, /user_suspend|user_reinstate|target_type/i);
}
assert.doesNotMatch(migration, /\b(DROP|DELETE|TRUNCATE)\b/i, 'migration additive tidak boleh destruktif');
assert.match(migration, /ALTER TABLE posts ADD COLUMN moderation_status/i);
assert.doesNotMatch(fixture, /moderation_status|social_admin_actions/i, 'fixture wajib merepresentasikan schema sebelum 0033');
for (const table of ['users','sessions','posts','likes','bookmarks','follows','notifications','rate_limits','orders','listings','withdrawals','listing_reports']) {
  assert(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? ["']?${table}["']?\\b`, 'i').test(fixture), `fixture kehilangan tabel ${table}`);
}
assert.match(fixture, /CREATE VIRTUAL TABLE(?: IF NOT EXISTS)? posts_fts USING fts5/i);
assert.match(fixture, /order_id\s+TEXT/i, 'fixture notifications wajib punya order_id');
console.log('OK — schema moderasi post-only additive dan fixture pre-0033 lengkap');
