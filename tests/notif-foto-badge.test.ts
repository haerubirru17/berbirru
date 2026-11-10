// Kontrak perbaikan halaman notifikasi (4 hal, satu rilis):
//  1. --accent-red akhirnya didefinisikan (5 pemakaian sebelumnya mati: badge love, titik lonceng, warna bahaya)
//  2. Badge diselaraskan: neo garis 2px + hijau dari palet; krem jadi satu bahasa tinta
//  3. Foto profil pelaku ikut tampil (URL siap pakai dari API)
//  4. Foto TIDAK tertimpa override skin (jebakan `background` shorthand)
// Jalankan: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const notif = readFileSync(new URL('../src/web/notifications.ts', import.meta.url), 'utf8');
const route = readFileSync(new URL('../src/routes/notifications.ts', import.meta.url), 'utf8');
const interaction = readFileSync(new URL('../src/web/interaction.ts', import.meta.url), 'utf8');
const kern = readFileSync(new URL('../src/web/kern-theme.ts', import.meta.url), 'utf8');
const feed = readFileSync(new URL('../src/web/feed.ts', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/web/profile.ts', import.meta.url), 'utf8');

// 1. Token merah: didefinisikan sekali, dipakai banyak tempat (kalau hilang, deklarasinya dibuang browser)
assert.match(interaction, /:root \{ --accent-red: #E11D48; \}/, 'CSS global mendefinisikan --accent-red');
const pemakai = [notif, feed, profile].join('\n');
assert.ok((pemakai.match(/var\(--accent-red\)/g) || []).length >= 5, 'pemakai --accent-red tetap ada (dijamin terdefinisi)');

// 2. Badge: garis neobrutal 2px + hijau dari palet (bukan hex asing)
assert.match(notif, /\.action-badge \{[^}]*border: 2px solid var\(--ink\)/, 'badge bergaris 2px (bahasa neobrutal)');
assert.match(notif, /\.badge-follow \{ background: var\(--green\);/, 'badge ikut memakai hijau palet');
assert.match(kern, /body:has\(#notifListContainer\) \.action-badge\{background:var\(--kern-card\)!important;border:1px solid var\(--kern-ink\)!important\}/, 'badge di krem jadi satu bahasa tinta');
assert.match(kern, /body:has\(#notifListContainer\) \.action-badge svg\{fill:var\(--kern-ink\)!important;stroke:var\(--kern-ink\)!important\}/, 'ikon badge krem ikut tinta (hati tak lagi putih di krem)');

// 3. Foto pelaku: API mengirim URL, renderer memakainya untuk tunggal DAN tumpukan
assert.match(route, /u\.avatar_key as actor_avatar_key/, 'API mengambil avatar pelaku');
assert.match(route, /\^\[a-z0-9_-\]\+\\\/\[a-z0-9_-\]\+\\\.\(jpg\|png\|webp\)/, 'API memvalidasi bentuk key sebelum membentuk URL');
assert.match(route, /row\.actor_avatar_url = sah \? '\/media\/' \+ kunci : null/, 'URL hanya dibentuk dari key yang sah');
assert.match(route, /delete row\.actor_avatar_key/, 'kolom mentah tidak diteruskan ke klien');
assert.match(notif, /const avaStyle = \(url\) => url \? 'background-image:url\(' \+ escapeHtml\(url\) \+ '\);background-size:cover;background-position:center;color:transparent;' : '';/, 'renderer punya helper foto');
assert.equal((notif.match(/avaStyle\(/g) || []).length, 2, 'helper foto dipakai di dua tempat: avatar tunggal + tumpukan');
assert.match(notif, /avaStyle\(a\.actor_avatar_url\)/, 'tumpukan avatar juga pakai foto');
assert.match(notif, /avaStyle\(n\.actor_avatar_url\)/, 'avatar tunggal pakai foto');
// Pengelompokan klien membangun objek baru field-per-field — kolom baru harus ikut disalin
assert.match(notif, /actor_avatar_url: g\.actors\[0\]\.actor_avatar_url,/, 'pengelompokan meneruskan URL foto (kalau tidak, kartu grup kehilangan foto)');

// 4. Jebakan: override skin tidak boleh memakai shorthand `background` pada elemen berfoto
assert.ok(!/\.notif-avatar\{background:/.test(kern), 'override krem memakai background-color (foto tak terhapus)');
assert.match(kern, /\.notif-avatar\{background-color:var\(--kern-card\)!important/, 'override krem = background-color');
assert.match(kern, /\.notif-avatar\[style\*="background-image"\]\{color:transparent!important\}/, 'krem: huruf disembunyikan saat ada foto (tidak menimpa foto)');

console.log('OK — notifikasi: --accent-red hidup, badge selaras, foto profil tampil (tunggal & tumpukan)');
