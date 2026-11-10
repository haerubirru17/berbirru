// Kontrak interaksi halaman /chain: love + simpan tersedia untuk BAIT ASLI dan
// tiap SAMBUNGAN, memakai endpoint & semantik yang sama dengan linimasa (tamu
// diarahkan masuk), dan status awalnya datang dari server (bukan tebakan klien).
// Jalankan: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const chain = readFileSync(new URL('../src/web/chain.ts', import.meta.url), 'utf8');
const index = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');

// 1. Dua tombol per kartu: bait asli + tiap sambungan (2 kemunculan masing-masing)
assert.equal((chain.match(/aria-label="Suka warkah ini"/g) || []).length, 2, 'love ada di bait asli & sambungan');
assert.equal((chain.match(/aria-label="Simpan warkah ini"/g) || []).length, 2, 'simpan ada di bait asli & sambungan');
assert.equal((chain.match(/onclick="likePost\(/g) || []).length, 2, 'kedua love memanggil likePost');
assert.equal((chain.match(/onclick="bookmarkPost\(/g) || []).length, 2, 'kedua simpan memanggil bookmarkPost');

// 2. Status awal dari server + handler global di window (onclick butuh global)
assert.match(chain, /b\.is_liked \? 'active' : ''/, 'sambungan memakai status is_liked dari server');
assert.match(chain, /root\.is_saved \? 'saved' : ''/, 'bait asli memakai status is_saved dari server');
assert.match(chain, /window\.likePost = async function/, 'likePost diekspor ke window');
assert.match(chain, /window\.bookmarkPost = async function/, 'bookmarkPost diekspor ke window');
assert.match(chain, /const isUserLoggedIn = \$\{user \? 'true' : 'false'\};/, 'status login datang dari server');

// 3. Endpoint & semantik sama dengan linimasa
assert.ok(chain.includes("'/api/posts/' + id + '/like'"), 'memakai endpoint /like yang sama');
assert.ok(chain.includes("'/api/posts/' + id + '/bookmark'"), 'memakai endpoint /bookmark yang sama');
assert.equal((chain.match(/if \(!isUserLoggedIn\) return window\.location\.href = '\/login';/g) || []).length, 2, 'tamu diarahkan masuk (kedua tombol)');
assert.match(chain, /btn\.classList\.toggle\('active', data\.liked\)/, 'status tombol mengikuti jawaban server');
assert.match(chain, /btn\.classList\.toggle\('saved', data\.bookmarked\)/, 'status simpan mengikuti jawaban server');

// 4. Tombol baru wajib punya gaya (kalau tidak, muncul telanjang)
assert.match(chain, /\.act-btn \{/, 'CSS .act-btn ada');
assert.match(chain, /\.act-btn\.active \.ico \{ fill: #FF3B1A/, 'love aktif terisi merah');
assert.match(chain, /\.act-btn:focus-visible/, 'fokus keyboard tetap terlihat');

// 5. Route /chain mengirim status untuk seluruh warkah halaman (2 kueri IN, bukan per kartu)
const i = index.indexOf("app.get('/chain/:id'");
assert.ok(i > 0, 'route /chain ditemukan');
const blok = index.slice(i, index.indexOf('mountKurir(app)', i));
assert.match(blok, /SELECT post_id FROM likes WHERE user_id = \? AND post_id IN \(\$\{ph\}\)/, 'route mengambil status suka');
assert.match(blok, /SELECT post_id FROM bookmarks WHERE user_id = \? AND post_id IN \(\$\{ph\}\)/, 'route mengambil status simpan');
assert.equal((blok.match(/post_id IN/g) || []).length, 2, 'dua kueri IN untuk satu halaman (bukan per kartu)');
// Keseimbangan bind: ? = 1 (user_id) + jumlah id; tanpa sesi tidak ada kueri sama sekali.
assert.match(blok, /if \(user && daftar\.length\)/, 'status hanya diambil bila ada sesi');
assert.match(blok, /const ph = ids\.map\(\(\) => '\?'\)\.join\(','\)/, 'placeholder dibangun dari jumlah id');
assert.equal((blok.match(/\.bind\(user\.id, \.\.\.ids\)/g) || []).length, 2, 'dua kueri mengikat user.id + seluruh id');
assert.ok(!/post_id IN \(\?\)/.test(blok), 'tidak ada IN dengan satu placeholder tunggal');
// Id yang masuk atribut onclick wajib lewat esc() (pertahanan berlapis walau UUID)
assert.equal((chain.match(/onclick="(?:likePost|bookmarkPost)\('\$\{esc\(/g) || []).length, 4, 'empat onClick id lewat esc()');

// 6. Tidak ada sisa label lama di halaman ini
assert.ok(!/menyambung bait/i.test(chain), 'tak ada sisa kata "menyambung bait"');

console.log('OK — /chain: love + simpan di bait asli & setiap sambungan (semantik sama dengan linimasa)');
