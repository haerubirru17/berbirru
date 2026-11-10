// Sunting warkah sendiri (keputusan owner 10 Nov 2026): bebas kapan saja, layaknya
// sosmed; ditolak bila warkah sudah tersentuh moderasi. Kontrak ini menjaga:
// (1) endpoint ada & digerbangi, (2) indeks pencarian selalu disinkronkan ulang,
// (3) UI menyediakan tombol Sunting di profil sendiri. Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const social = readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/web/profile.ts', import.meta.url), 'utf8');
const migrasi = readFileSync(new URL('../migrations/0035_posts_edited_at.sql', import.meta.url), 'utf8');

// 1. Endpoint + gerbang akses
assert.match(social, /app\.patch\('\/api\/posts\/:id'/, 'endpoint PATCH /api/posts/:id ada');
const iPatch = social.indexOf("app.patch('/api/posts/:id'");
const blok = social.slice(iPatch, iPatch + 3200);
assert.match(blok, /if \(!user\) return c\.json\(\{ error: 'Silakan masuk untuk menyunting warkah\.' \}, 401\)/, 'wajib sesi');
assert.match(blok, /if \(post\.author_id !== user\.id\) return c\.json\(\{ error: 'Anda tidak memiliki akses untuk menyunting postingan ini' \}, 403\)/, 'hanya penulis');
assert.match(blok, /if \(post\.moderation_marker\) return c\.json\(\{ error: 'Warkah ini sedang dalam tinjauan moderasi dan tidak dapat disunting\.' \}, 403\)/, 'ditolak saat dimoderasi');
assert.match(blok, /hitRate\(c\.env\.DB, `post:\$\{user\.id\}`, 20, 60\)/, 'kena rate limit yang sama dgn POST/DELETE');
assert.match(blok, /sanitizeRich\(content\)\.trim\(\)/, 'isi disanitasi ulang di titik masuk');
assert.match(blok, /stripTags\(cleanContent\)\.trim\(\) === ''/, 'isi kosong ditolak');
assert.match(blok, /50_000/, 'batas 50.000 karakter dipertahankan');

// 2. Guard snapshot + sinkronisasi FTS + penanda waktu
assert.match(blok, /AND act\.account_status = 'active'/, 'guard status akun (suspend in-flight = nol mutasi)');
assert.match(blok, /DELETE FROM posts_fts WHERE id = \? AND \$\{guard\}/, 'FTS lama dibersihkan');
assert.match(blok, /INSERT INTO posts_fts \(id, title, content_text\)/, 'FTS ditulis ulang — pencarian tidak basi');
assert.match(blok, /edited_at = datetime\('now'\)/, 'penanda waktu sunting diisi');
assert.match(blok, /\.DB\.batch\(\[/, 'update + FTS dalam satu batch');
assert.match(migrasi, /ALTER TABLE posts ADD COLUMN edited_at TEXT/, 'migrasi kolom edited_at ada');

// 3. UI: tombol Sunting hanya untuk profil sendiri + modal + PATCH dari klien
const iBtn = profile.indexOf('editPost(');
assert.ok(iBtn > 0, 'tombol Sunting terpasang');
const blokBtn = profile.slice(Math.max(0, iBtn - 700), iBtn);
assert.match(blokBtn, /\$\{isMe \? `/, 'tombol hanya dirender utk pemilik profil');
assert.match(profile, /aria-label="Sunting Warkah"/, 'punya label aksesibilitas');
assert.match(profile, /data-post-id="\\\$\{p\.id\}"/, 'kartu warkah membawa id utk pengambilan data');
assert.match(profile, /method: 'PATCH'/, 'klien memanggil PATCH');
assert.match(profile, /id="postEditCanvas"[\s\S]{0,80}contenteditable="true"/, 'editor pakai contenteditable (sama dgn fitur Tulis)');
assert.match(profile, /window\.editPost = editPost/, 'fungsi diekspor ke onclick');
assert.ok(!/Sunting Warkah[\s\S]{0,200}disabled/.test(profile), 'tombol tidak permanen nonaktif');

console.log('OK — post-edit: endpoint bergerbang, FTS disinkron, tombol Sunting di profil sendiri');
