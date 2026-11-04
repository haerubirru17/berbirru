// Generate 3 halaman mockup Kern (Profil, Notifikasi, Pasar) — elemen existing saja.
import { writeFileSync, readFileSync } from 'node:fs';
const IDENT = readFileSync('/tmp/main-merge/scripts/kern-app-mockup.html', 'utf8');
// ambil <style> + shell (topbar & bottomnav) dari mockup beranda yang sudah disetujui
const style = IDENT.match(/<style>[\s\S]*?<\/style>/)[0];
const topbar = IDENT.match(/<header class="topbar">[\s\S]*?<\/header>/)[0];
const nav = IDENT.match(/<nav class="bottomnav">[\s\S]*?<\/nav>/)[0];
const compose = IDENT.match(/<button class="compose"[\s\S]*?<\/button>/)?.[0] || '';
const shell = (title, body, active) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1&family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&family=Roboto+Flex:opsz,slnt,wdth,wght,GRAD@8..144,-10..0,25..151,100..1000,-200..150&display=swap" rel="stylesheet">${style.replace('.navitem:nth-child(3)', '.navitem:nth-child(' + active + ')').replace(/(?<!=)active(?=")/g, '')}</head><body><main class="app">${topbar.replace('⌕','').replace('◌','')}${body}${nav.replace(/navitem active/g,'navitem').replace('navitem" data-n="'+active+'"','navitem active"')}</main>${compose}</body></html>`;

// 1) PROFIL PUBLIK (session pemilik: senja_kelabu — hanya elemen yg sudah ada: avatar, nama, kota, tab, warkah)
const profilBody = `
<section class="intro"><div><div class="intro-kicker">Profil publik</div><div class="intro-title">@senja_kelabu</div></div></section>
<section class="id-sheet"><div class="avatar">S</div><div class="authors"><div class="author-name">@senja_kelabu</div><div class="author-meta">Jakarta · 4 warkah · bergabung 2026</div></div><button class="follow">Ikuti</button></section>
<nav class="tabsheets"><button class="filter active">Warkah</button><button class="filter">Sambungan</button><button class="filter">Tentang</button></nav>
<article class="post"><div class="post-head"><div class="avatar">S</div><div class="author"><div class="author-name">@senja_kelabu</div><div class="author-meta">publik</div></div><div class="post-time">28 Okt</div></div><h2 class="post-title">Aku</h2><div class="post-text">Aku ini binatang jalang, dari kumpulannya terbuang.</div><div class="post-foot"><div class="post-actions"><button class="post-action">♡ <span>302</span></button><button class="post-action">□ <span>158</span></button></div><button class="continue">Sambungan →</button></div></article>
<article class="post"><div class="post-head"><div class="avatar">S</div><div class="author"><div class="author-name">@senja_kelabu</div><div class="author-meta">privat</div></div><div class="post-time">27 Okt</div></div><h2 class="post-title casual">Luka &amp; Cahaya</h2><div class="post-text">Tanpa isi — warkah privat hanya terlihat pemiliknya.</div><div class="post-foot"><div class="post-actions"><button class="post-action">♡ <span>—</span></button><button class="post-action">□ <span>—</span></button></div></div></article>`;
const profilCss = `<style>.id-sheet{border-bottom:var(--rule);padding:16px;display:flex;align-items:center;gap:12px}.id-sheet .avatar{width:52px;height:52px;font-size:24px}.authors{flex:1}.follow{border:var(--rule);background:transparent;padding:8px 14px;font:600 10px var(--mono);text-transform:uppercase;letter-spacing:.05em}.tabsheets{border-bottom:var(--rule);padding:11px 12px;display:flex;gap:7px}</style>`;

// 2) NOTIFIKASI (kategori existing: like/simpan/sambung/follow — tanpa jenis baru)
const notifBody = `
<section class="intro"><div><div class="intro-kicker">Notifikasi</div><div class="intro-title">Kabar <i> Feed</i></div></div></section>
<div class="nt-group"><div class="nt-label">Hari ini</div>
<article class="post"><div class="post-head"><div class="avatar">A</div><div class="author"><div class="author-name">@aksaralaut</div><div class="author-meta">menyukai warkah "Pulang"</div></div><div class="post-time">19:12</div></div></article>
<article class="post"><div class="post-head"><div class="avatar">R</div><div class="author"><div class="author-name">@rumahkata</div><div class="author-meta">menyambung bait warkahmu</div></div><div class="post-time">17:40</div></div><div class="post-connector">"Cahaya jatuh di meja..."</div></article></div>
<div class="nt-group"><div class="nt-label">Sebelumnya</div>
<article class="post"><div class="post-head"><div class="avatar">S</div><div class="author"><div class="author-name">@senja_kelabu</div><div class="author-meta">mulai mengikuti kamu</div></div><div class="post-time">26 Okt</div></div><button class="continue">Ikuti balik</button></article>
<article class="post"><div class="post-head"><div class="avatar">A</div><div class="author"><div class="author-name">@aksaralaut</div><div class="author-meta">menyimpan warkah "Ruang tunggu"</div></div><div class="post-time">25 Okt</div></div></article></div>`;
const notifCss = `<style>.nt-group{border-bottom:var(--rule)}.nt-label{font:500 9px var(--mono);text-transform:uppercase;letter-spacing:.07em;padding:10px 16px;border-bottom:var(--rule);color:var(--muted)}.nt-group .post{padding:14px 16px}.continue{margin-left:16px;margin-bottom:14px;display:inline-block;border:0;background:transparent;color:var(--signal);font:600 9px var(--mono);text-transform:uppercase;text-decoration:underline;text-underline-offset:3px}.post-connector{border-left:2px solid var(--signal);padding:8px 10px;margin:13px 16px;font:500 10px/1.35 var(--mono);background:rgba(255,59,26,.06)}</style>`;

// 3) PASAR BUKU (listing bioskop: judul, kondisi, harga — elemen existing)
const pasarBody = `
<section class="intro"><div><div class="intro-kicker">Pasar Buku</div><div class="intro-title">Etalase</div></div><button class="menu">+ Jual</button></section>
<div class="tools"><span class="tools-label">Listing terbuka · 02</span></div>
<article class="post"><div class="post-head"><div class="avatar">B</div><div class="author"><div class="author-name">Bumi Manusia</div><div class="author-meta">Pramoedya · Sang Pemimpi</div></div></div><h2 class="post-title">Rp45.000</h2><div class="post-text">Kondisi baik · cover mulus, halaman rapi. Bekas stiker di sampul belakang.</div><div class="post-foot"><div class="post-actions"><button class="post-action">Beli →</button><button class="post-action">Tawar</button></div></div></article>
<article class="post"><div class="post-head"><div class="avatar">L</div><div class="author"><div class="author-name">Laut Bercerita</div><div class="author-meta">Leila S. Chudori · KPG</div></div></div><h2 class="post-title casual">Rp60.000</h2><div class="post-text">Seperti baru, dibaca sekali. Termasuk kartu nama penulis.</div><div class="post-foot"><div class="post-actions"><button class="post-action">Beli →</button><button class="post-action">Tawar</button></div></div></article>`;
const pasarCss = `<style>.tools{border-bottom:var(--rule);padding:10px 16px}.tools-label{font:500 9px var(--mono);text-transform:uppercase;letter-spacing:.07em}.post .post-title{font-size:30px}.post-action{border:var(--rule);padding:7px 10px;font:600 9px var(--mono);text-transform:uppercase;color:var(--ink)}.post-action:first-child{background:var(--ink);color:var(--paper)}</style>`;

writeFileSync('/tmp/main-merge/scripts/kern-pg-profil.html', shell('BERBIRRU — Profil', profilCss + profilBody, 5).replace('Beranda / Warkah Society','Profil'));
writeFileSync('/tmp/main-merge/scripts/kern-pg-notif.html', shell('BERBIRRU — Notifikasi', notifCss + notifBody, 4));
writeFileSync('/tmp/main-merge/scripts/kern-pg-pasar.html', shell('BERBIRRU — Pasar Buku', pasarCss + pasarBody, 2).replace('Beranda / Warkah Society','Pasar'));
console.log('3 halaman ditulis');
