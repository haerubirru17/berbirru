// Kontrak paket limiter kapasitas:
//  - unggah media dibatasi (R2 + tulis data)
//  - tanda baca notifikasi dibatasi (kuota TULIS D1 100.000 baris/hari)
//  - aksi uang Pasar dibatasi dalam SATU bucket bersama (ganti endpoint tak mereset)
//  - pembersihan rate_limits punya indeks expires_at
// Jalankan: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const media = readFileSync(new URL('../src/routes/media.ts', import.meta.url), 'utf8');
const notif = readFileSync(new URL('../src/routes/notifications.ts', import.meta.url), 'utf8');
const pasar = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const migrasi = readFileSync(new URL('../migrations/0037_rate_limits_expires_idx.sql', import.meta.url), 'utf8');

// 1. Unggah media: limiter ada, SEBELUM body dibaca, dan impornya benar
assert.ok(media.includes("hitRate(c.env.DB, `media:${me.id}`, 10, 600)"), 'media: limiter 10/10 menit');
assert.ok(media.indexOf('media:${me.id}') < media.indexOf('c.req.arrayBuffer()'), 'media: limiter SEBELUM baca body');
assert.match(media, /import \{ getAuthUser, hitRate \} from/, 'media: hitRate diimpor');

// 2. Notifikasi baca: dua endpoint, satu bucket per akun
// Angka batas ikut dikunci: kalau nanti seseorang tidak sengaja mengubah 60 -> 15 (atau 20 -> 5),
// tes harus MERAH — bukan sekadar menghitung jumlah kemunculan limiter.
assert.equal((notif.match(/notif-read:\$\{user\.id\}`, 60, 60\)/g) || []).length, 2, 'notif: 60 per 60 detik di kedua endpoint');
assert.match(notif, /import \{ getAuthUser, hardenPost, hitRate \} from/, 'notif: hitRate diimpor');

// 3. Aksi uang Pasar: satu bucket di EMPAT endpoint (batal/kirim/terima/sengketa)
assert.equal((pasar.match(/aksi-uang:\$\{me\.id\}/g) || []).length, 4, 'pasar: 4 aksi uang memakai bucket yang sama');
assert.equal((pasar.match(/if \(await hitRate\(c\.env\.DB, `aksi-uang:/g) || []).length, 4, 'pasar: tiap aksi memanggil limiter');
assert.equal((pasar.match(/aksi-uang:\$\{me\.id\}`, 20, 60\)/g) || []).length, 4, 'pasar: angka 20 per 60 detik terjaga di keempat aksi');

// 4. Indeks expires_at + perilaku nyata (rencana query tidak boleh memindai tabel)
assert.ok(migrasi.includes('idx_rate_limits_expires'), 'migrasi 0037 memuat indeks');
assert.ok(schema.includes('idx_rate_limits_expires'), 'schema.sql memuat indeks (instalasi baru)');
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8').replace(/CREATE VIRTUAL TABLE[\s\S]*?;/gi, ''));
db.exec(`WITH RECURSIVE s(v) AS (SELECT 1 UNION ALL SELECT v+1 FROM s WHERE v<3000)
  INSERT INTO rate_limits (key, count, expires_at) SELECT 'k'||v, 1, datetime('2026-01-01','+'||v||' seconds') FROM s`);
const plan = db.prepare("EXPLAIN QUERY PLAN DELETE FROM rate_limits WHERE expires_at < datetime('now')").all().map((r: any) => r.detail).join(' | ');
assert.ok(/idx_rate_limits_expires/.test(plan), 'pembersihan memakai indeks: ' + plan);
assert.ok(!/SCAN rate_limits/.test(plan), 'pembersihan tidak memindai tabel');

console.log('OK — limiter paket kapasitas: media, notifikasi baca, aksi uang Pasar, indeks expires_at');
