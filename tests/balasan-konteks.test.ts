// Keputusan owner (10 Nov 2026): mekanisme sambungan dipresentasikan sebagai "Balasan"
// (opsi A). Kontrak ini menjaga: label konsisten, balasan selalu punya konteks induk
// (atau menyatakan terang-terangan bila induknya dihapus), dan tidak ada sisa label lama.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const feed = readFileSync(new URL('../src/web/feed.ts', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../src/web/profile.ts', import.meta.url), 'utf8');
const chain = readFileSync(new URL('../src/web/chain.ts', import.meta.url), 'utf8');
const social = readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8');
const search = readFileSync(new URL('../src/web/search.ts', import.meta.url), 'utf8');

// 1. Label lama sudah tidak dipakai di UI transaksional
assert.ok(!/Sambung Bait|Sambungkan bait|' Sambungan'|Sambungan \(\$\{children/.test(feed), 'feed: label lama hilang');
assert.ok(!/switchProfileTab\('chains', this\)">Estafet</.test(profile), 'profil: tab tidak lagi "Estafet"');
assert.ok(!/Sambungan<\/span>/.test(profile) && !/Sambungan<\/span>/.test(search), 'profil & pencarian: hitungan jadi Balasan');
assert.match(profile, /switchProfileTab\('chains', this\)">Balasan</, 'profil: tab bernama Balasan');
assert.match(profile, /chains_count \|\| 0\} Balasan/, 'profil: hitungan "N Balasan"');
assert.match(feed, /chains_count \+ ' Balasan' : 'Balas'/, 'feed: tombol "Balas" / "N Balasan"');
assert.match(feed, /aria-label="Balas warkah ini"/, 'feed: label aksesibilitas balas');
assert.match(chain, /<div class="lbl">Balasan \(/, 'halaman rantai: daftar "Balasan (N)"');
assert.match(chain, />Balas</, 'halaman rantai: tombol Balas');

// 2. Konteks induk: API profil mengirim nama + potongan isi induk
assert.match(social, /AS parent_content/, 'query tab chains mengirim parent_content');
assert.match(social, /AS parent_author/, 'query tab chains mengirim parent_author');
assert.match(social, /binds\.push\(viewer\?\.id \|\| '', viewer\?\.id \|\| '', viewer\?\.id \|\| '', viewer\?\.id \|\| '', targetUser\.id, \.\.\.vis\.binds\)/, 'bind viewer id cukup utk 4 subquery');
// status induk: 'ok' | 'private' | 'deleted' — tanpa ini UI diam-diam kosong saat induk hilang
assert.match(social, /safe\.parent_state = !rawParent/, 'feed mengirim parent_state sebelum parent_id dikosongkan');
assert.match(social, /END AS parent_state,/, 'query chains menghitung parent_state di SQL');
assert.match(social, /WHEN EXISTS \(SELECT 1 FROM posts prnt WHERE prnt.id = p.parent_id\) THEN 'hidden'/, 'state hidden utk induk tak terlihat');
assert.match(profile, /p\.parent_state === 'hidden' \? 'Warkah induk tidak tersedia' : 'Warkah induk telah dihapus'/, 'profil membedakan tersembunyi vs dihapus');
assert.match(feed, /p\.parent_state === 'hidden' \? 'Warkah induk tidak tersedia' : 'Warkah induk telah dihapus'/, 'feed membedakan tersembunyi vs dihapus');
assert.ok(!/Menyambung warkah/.test(feed), 'feed memakai kata "Membalas warkah"');


// 2b. Keseimbangan bind tab chains: jumlah '?' statis HARUS = jumlah nilai yang di-push
// (4 viewer id utk parent_content/parent_author/parent_state/parent_id, 1 targetUser; vis.binds di-spread).
{
  const i = social.indexOf("} else if (tab === 'chains')");
  const blok = social.slice(i, social.indexOf("// tab === 'original'", i));
  const sqlChains = blok.slice(blok.indexOf('SELECT p.id AS id'), blok.indexOf('`;'));
  const placeholder = (sqlChains.match(/\?/g) || []).length;
  const pushLine = blok.match(/binds\.push\([^;]*\);/)[0];
  const diPush = (pushLine.match(/viewer\?\.id/g) || []).length + (pushLine.includes('targetUser.id') ? 1 : 0);
  assert.equal(placeholder, diPush, 'placeholder ? (' + placeholder + ') harus sama dgn nilai bind (' + diPush + ') — beda 1 = D1 500');
}

// 2c. Induk yang dimoderasi ≠ dihapus: feed harus pakai keberadaan baris, bukan parent_visibility
assert.match(social, /EXISTS\(SELECT 1 FROM posts prnt WHERE prnt.id = p.parent_id\) as parent_exists/, 'feed mengecek keberadaan baris induk');
assert.match(social, /Number\(safe\.parent_exists\) \? 'hidden' : 'deleted'/, 'feed: dimoderasi→hidden, benar-benar hilang→deleted');
assert.match(social, /delete safe\.parent_visibility/, 'kolom internal parent_visibility tak dikirim ke klien');

// 2d. Escaping pada render konteks (pen_name bisa berisi HTML)
assert.match(profile, /escapeHtml\(p\.parent_author\)/, 'profil meng-escape penulis induk');
assert.match(profile, /escapeHtml\(String\(p\.parent_content/, 'profil meng-escape isi induk');
assert.match(feed, /escapeHtml\(p\.parent_author\)/, 'feed meng-escape penulis induk');
assert.match(feed, /escapeHtml\(stripHtml\(p\.parent_content\)/, 'feed meng-escape isi induk');

// 2e. Sisa label lama juga dijaga di halaman rantai & kartu kurasi
assert.ok(!/sambungan<\/div>|bait sambungannya/.test(chain), 'chain.ts tanpa label lama');
assert.ok(!/Sambung Bait/.test(readFileSync(new URL('../src/web/warkahCard.ts', import.meta.url), 'utf8')), 'kartu kurasi tanpa label lama');

// 3. Kartu balasan di profil menampilkan konteks / pernyataan induk hilang
assert.match(profile, /class="reply-context"/, 'kartu balasan punya baris konteks');
assert.match(profile, /Membalas warkah <b>@/, 'konteks menyebut penulis induk');
assert.match(profile, /Warkah induk telah dihapus/, 'konteks jujur saat induk hilang');
assert.match(profile, /\.reply-context \{/, 'CSS baris konteks ada');

// 4. Halaman rantai tetap jujur saat induk dihapus
assert.match(chain, /Balasan di bawah tetap hidup sebagai karya masing-masing penulis/, 'nota induk hilang di halaman rantai (kata "Balasan")');

console.log('OK — balasan: label seragam, konteks induk tampil di profil (atau dinyatakan hilang)');
