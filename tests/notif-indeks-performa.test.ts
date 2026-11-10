// Kontrak performa notifikasi (kapasitas 1000 pengguna):
//  1. Indeks notifications(user_id, created_at) & (user_id, is_read) ada di migrasi DAN schema.sql
//  2. Dengan indeks itu, daftar notifikasi & polling "belum dibaca" TIDAK memindai seluruh tabel
//     (dibuktikan menjalankan rencana query nyata melalui node:sqlite, bukan hanya grep)
//  3. Interval polling notifikasi >= 45 s (12 s lama = kuota request tier gratis terlampaui)
// Jalankan: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const migrasi = readFileSync(new URL('../migrations/0036_notif_indexes.sql', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const feed = readFileSync(new URL('../src/web/feed.ts', import.meta.url), 'utf8');
const notif = readFileSync(new URL('../src/web/notifications.ts', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/web/profile.ts', import.meta.url), 'utf8');

// 1. Indeks ada di kedua tempat (migrasi untuk DB yang sudah hidup, schema.sql untuk instalasi baru)
for (const ix of ['idx_notif_user_created', 'idx_notif_user_unread']) {
  assert.ok(migrasi.includes(ix), 'migrasi memuat ' + ix);
  assert.ok(schema.includes(ix), 'schema.sql memuat ' + ix);
}
assert.match(migrasi, /ON notifications\(user_id, created_at DESC\)/, 'indeks daftar notifikasi sesuai bentuk query');
assert.match(migrasi, /ON notifications\(user_id, is_read\)/, 'indeks polling belum-dibaca sesuai bentuk query');

// 2. Perilaku nyata: rencana query pada 5000 notifikasi harus memakai indeks
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8').replace(/CREATE VIRTUAL TABLE[\s\S]*?;/gi, ''));
db.exec(`WITH RECURSIVE s(v) AS (SELECT 1 UNION ALL SELECT v+1 FROM s WHERE v<1000)
  INSERT INTO users (id, pen_name, email, password_hash) SELECT 'u'||v, 'pen'||v, 'e'||v||'@x', 'h' FROM s`);
db.exec(`WITH RECURSIVE s(v) AS (SELECT 1 UNION ALL SELECT v+1 FROM s WHERE v<5000)
  INSERT INTO notifications (id, user_id, actor_id, type, post_id, is_read, created_at)
  SELECT 'n'||v, 'u'||(1+v%1000), 'u'||(1+(v+1)%1000), 'like', NULL, 0, datetime('2026-01-01','+'||v||' seconds') FROM s`);

const rencana = (sql) => db.prepare('EXPLAIN QUERY PLAN ' + sql).all().map((r: any) => r.detail).join(' | ');
const daftar = rencana(`SELECT n.id FROM notifications n JOIN users u ON n.actor_id = u.id
  WHERE n.user_id='u1' AND (n.type IS NULL OR n.type NOT LIKE 'order_%') ORDER BY n.created_at DESC LIMIT 50`);
const polling2 = rencana(`SELECT count(*) FROM notifications WHERE user_id='u1' AND is_read=0 AND (type IS NULL OR type NOT LIKE 'order_%')`);
assert.ok(/idx_notif_user_created/.test(daftar), 'daftar notifikasi memakai idx_notif_user_created (bukan pindai tabel): ' + daftar);
assert.ok(!/SCAN (n|notifications)\b/.test(daftar), 'daftar notifikasi tidak memindai tabel (alias apa pun)');
assert.ok(/idx_notif_user_unread|idx_notif_user_created/.test(polling2), 'polling memakai indeks: ' + polling2);
assert.ok(!/SCAN (n|notifications)\b/.test(polling2), 'polling tidak memindai tabel (alias apa pun)');

// 3. Interval polling: kontraknya >= 45 s (bukan angka persis — 60 s boleh diubah nanti)
const ambilMs = (src: string, nama: string) => {
  const m = src.match(new RegExp('const ' + nama + ' = (\\d+);'));
  assert.ok(m, nama + ' ada di source');
  return Number(m![1]);
};
for (const [nama, src] of [['UNREAD_POLL_MS', feed], ['NOTIFICATIONS_POLL_MS', notif], ['PROFILE_COUNTS_POLL_MS', profile]] as const) {
  const ms = ambilMs(src, nama);
  assert.ok(ms >= 45000, nama + ' = ' + ms + ' ms (harus >= 45 s demi kuota request)');
}
// Yang dijaga hanya polling BERBASIS NOTIFIKASI. FOLLOW_LIST_POLL_MS sengaja tetap 12 s:
// ia hanya hidup selama panel pengikut terbuka (transien), bukan sepanjang sesi.
for (const [nama, berkas] of [['lonceng', feed], ['notifikasi', notif], ['penghitung profil', profile]] as const) {
  assert.ok(!/(UNREAD|NOTIFICATIONS|PROFILE_COUNTS)_POLL_MS = 12000/.test(berkas), 'polling ' + nama + ' bukan 12 s');
}

console.log('OK — notifikasi: indeks dipakai (bukan pindai tabel) & polling 60 s');
