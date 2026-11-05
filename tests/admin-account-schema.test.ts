// Task 1: kontrak schema status akun — 0034 additive, audit akun terpisah.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

// Prasyarat keras: 0033 post-only dari plan karantina harus sudah ada.
const m0033 = readFileSync(new URL('../migrations/0033_social_post_moderation.sql', import.meta.url), 'utf8');
assert.match(m0033, /CHECK \(action IN \('post_quarantine','post_restore'\)\)/);
assert.match(m0033, /target_post_id/);
assert.doesNotMatch(m0033, /user_suspend|user_reinstate|target_type/);

const migrationPath = new URL('../migrations/0034_social_account_status.sql', import.meta.url);
assert(existsSync(migrationPath), '0034 wajib ada sebelum GREEN');
const migration = readFileSync(migrationPath, 'utf8');
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const fixture = readFileSync(new URL('./fixtures/current-schema-pre-0034.sql', import.meta.url), 'utf8');

for (const src of [migration, schema]) {
  assert.match(src, /account_status\s+TEXT\s+NOT NULL\s+DEFAULT\s+'active'/i);
  assert.match(src, /CHECK\s*\(account_status\s+IN\s*\('active','suspended'\)\)/i);
  for (const col of ['suspended_reason', 'suspended_at', 'suspended_by', 'account_action_id']) assert(src.includes(col), `kolom ${col} hilang`);
  assert.match(src, /CREATE TABLE(?: IF NOT EXISTS)? social_account_actions/i);
  assert.match(src, /CHECK\s*\(action\s+IN\s*\('user_suspend','user_reinstate'\)\)/i);
  assert.match(src, /target_user_id\s+TEXT\s+NOT NULL/i);
  assert.match(src, /idx_users_account_status_created/i);
  assert.match(src, /idx_social_account_actions_target\s*_created|idx_social_account_actions_target_created/i);
}
assert.doesNotMatch(migration, /\b(DROP|DELETE|TRUNCATE)\b/i, 'migration additive tidak boleh destruktif');
assert.match(migration, /ALTER TABLE users ADD COLUMN account_status/i);
assert.doesNotMatch(migration, /(ALTER|DROP|CREATE|INSERT|DELETE|UPDATE)\b[^;]*social_admin_actions/i, '0034 tidak boleh menyentuh tabel audit post');
assert.match(schema, /\) REFERENCES/i, 'audit akun memakai FK target/actor');
// fixture pre-0034: schema sandbox SETELAH 0033 — punya objek 0033, belum punya 0034.
assert.match(fixture, /moderation_status/i, 'fixture harus mewakili schema pasca-0033');
assert.match(fixture, /CREATE TABLE(?: IF NOT EXISTS)? social_admin_actions/i);
assert.match(fixture, /target_post_id/);
assert.doesNotMatch(fixture, /account_status|social_account_actions/i, 'fixture pre-0034 tidak boleh memuat objek 0034');
for (const table of ['users','sessions','posts','notifications','otps','rate_limits','posts_fts']) {
  assert(new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? ["']?${table}["']?\\b`, 'i').test(fixture) || (table === 'posts_fts' && /CREATE VIRTUAL TABLE(?: IF NOT EXISTS)? posts_fts/i.test(fixture)), `fixture kehilangan tabel ${table}`);
}
console.log('OK — 0034 additive, audit akun terpisah, fixture pre-0034 valid');
