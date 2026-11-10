// Cek PERILAKU filter linimasa opsi B (bukan grep string): balasan yang induknya
// sudah dihapus/privat/dimoderasi harus keluar dari linimasa & pencarian publik,
// sementara warkah akar dan balasan ber-induk sehat tetap tampil.
// Predikat diambil DARI SOURCE, jadi uji ini ikut berubah bila predikatnya diubah.
// Jalankan: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const social = readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8');

// 1. Ambil literal `const vis = { sql: `...`, binds: [] }` dari handler GET /api/posts
const m = social.match(/const vis = \{\s*sql: `([\s\S]*?)`,\s*binds: \[\] as any\[\]/);
assert.ok(m, 'literal vis.sql ada di source');
const predikat = m[1].replace(/\s+/g, ' ').trim();
assert.ok(!predikat.includes('?'), 'predikat tidak menambah placeholder (binds tetap kosong)');
assert.match(predikat, /p\.parent_id IS NULL OR EXISTS \(SELECT 1 FROM posts prnt/, 'predikat menyaring balasan tanpa induk publik');

// 2. Semua cabang linimasa WAJIB memakai predikat yang sama (cabang yang merakit
//    WHERE sendiri tanpa ${vis.sql} akan tetap menampilkan balasan yatim).
//    Scope: blok handler GET /api/posts saja, bukan seluruh berkas.
const iHandler = social.indexOf('const vis = {\n    sql: `p.moderation_status');
assert.ok(iHandler > 0, 'handler linimasa ketemu');
const blok = social.slice(iHandler, social.indexOf('app.get(', iHandler + 10));
const cabang = (blok.match(/query \+=/g) || []).length;
const penyebut = (blok.match(/\$\{vis\.sql\}/g) || []).length;
assert.equal(penyebut, cabang, `tiap cabang (${cabang}) memakai \${vis.sql}, ditemukan ${penyebut}`);
assert.ok(cabang >= 5, `handler linimasa punya >=5 cabang, ditemukan ${cabang}`);

// 3. Probe semantik: jalankan query terrakit atas data uji
const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, pen_name TEXT);
  CREATE TABLE posts (id TEXT PRIMARY KEY, author_id TEXT, title TEXT, parent_id TEXT,
    visibility TEXT, moderation_status TEXT, created_at TEXT);
  INSERT INTO users VALUES ('u1','penulis'), ('u2','pembalas');
`);
const add = db.prepare('INSERT INTO posts VALUES (?, ?, ?, ?, ?, ?, ?)');
const baris = [
  ['p_root',        null,        'public',  'visible'],     // warkah biasa → TAMPIL
  ['p_priv',        null,        'private', 'visible'],     // privat → tidak tampil
  ['p_karantina',   null,        'public',  'quarantined'], // dimoderasi → tidak tampil
  ['p_balas_ok',    'p_root',    'public',  'visible'],     // balasan sehat → TAMPIL
  ['p_balas_hilang','p_mayat',   'public',  'visible'],     // induk dihapus → TIDAK tampil
  ['p_balas_privat','p_priv',    'public',  'visible'],     // induk privat → TIDAK tampil
  ['p_balas_moder', 'p_karantina','public', 'visible'],     // induk dimoderasi → TIDAK tampil
];
baris.forEach((b, i) => add.run(b[0], b[1] ? 'u2' : 'u1', 'warkah', b[1], b[2], b[3], `2026-11-11T00:0${i}:00Z`));

const kueri = (where: string) => `SELECT p.id AS id FROM posts p JOIN users u ON p.author_id = u.id
  WHERE ${where} ORDER BY p.created_at DESC LIMIT 40`;
const hasil = db.prepare(kueri(predikat)).all().map((r: any) => r.id).sort();
assert.deepEqual(hasil, ['p_balas_ok', 'p_root'], 'hanya warkah akar & balasan ber-induk sehat yang tampil');

// 4. Cabang "diikuti" (JOIN follows) tetap seimbang: 1 placeholder + predikat tanpa ?
const kueriFollowing = `SELECT p.id AS id FROM posts p JOIN users u ON p.author_id = u.id
  JOIN follows f ON p.author_id = f.following_id WHERE f.follower_id = ? AND ${predikat} LIMIT 40`;
assert.equal((kueriFollowing.match(/\?/g) || []).length, 1, 'cabang diikuti tetap 1 placeholder (follower_id)');

console.log('OK — filter linimasa: balasan tanpa induk publik keluar, akar & balasan sehat tampil');
