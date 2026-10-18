// Pasar Buku — marketplace rekber BERBIRRU (Varian A: grid 2 kolom).
// Desain owner-approved 2026-10-18; plan: .hermes/plans/2026-10-18-pasar-buku.md
// Fee rekber 5.000/order ditanggung PENJUAL (tak tampil di harga pembeli).

import { escapeHtml } from '../lib/sanitize';
import { renderBottomNav } from './layout';

// Kwitansi Rekber & halaman order reuse CSS+HTML brand yang sama (salinan tunggal).
export const BRAND_CSS = `
    .brand-header { text-align: center; margin-bottom: 18px; }
    .brand-wrap { display: inline-flex; align-items: center; text-decoration: none; position: relative; }
    .brand-badge {
      display: inline-flex; align-items: center; gap: 6px; background: var(--blue-primary);
      color: #FFFFFF; padding: 6px 14px; border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); transform: rotate(-1deg); position: relative; z-index: 2;
    }
    .brand-badge h1 { margin: 0; font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 800; letter-spacing: 0.5px; color: #FFFFFF; line-height: 1; }
    .brand-badge svg { width: 16px; height: 16px; stroke: #FFFFFF; stroke-width: 2; fill: none; flex-shrink: 0; }
    .brand-com-tag {
      font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 900;
      color: var(--blue-primary); position: relative; display: inline-block;
      transform: rotate(2deg); margin-left: 4px; margin-top: 2px; z-index: 1; line-height: 1;
      padding-bottom: 3px;
    }
    .brand-com-tag::after {
      content: ''; position: absolute; left: -24px; bottom: -3px; width: calc(100% + 28px); height: 6px;
      background: var(--accent-yellow); border-radius: 3px; z-index: -1;
    }`;

const BASE_CSS = `
    :root {
      --bg-main: #F0F6FE; --bg-card: #FFFFFF; --bg-blue-subtle: #E0EEFD;
      --ink: #0B192C; --shadow-ink: #1E293B; --blue-primary: #1D61E7;
      --blue-deep: #0F3E99; --blue-light: #60A5FA; --accent-yellow: #FDE047;
      --border-thick: 3px solid var(--ink); --border-med: 2.5px solid var(--ink); --border-thin: 2px solid var(--ink);
      --shadow-hard: 4px 4px 0 var(--shadow-ink); --shadow-hard-lg: 6px 6px 0 var(--shadow-ink); --shadow-hard-sm: 2.5px 2.5px 0 var(--shadow-ink);
      --radius: 16px; --radius-sm: 10px;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: #FBF8F3; color: var(--ink); min-height: 100vh;
      padding: 20px 16px 90px;
    }
    .container { max-width: 480px; margin: 0 auto; }
    .form-label {
      display: block; font-size: 11.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.3px; color: var(--ink); margin-bottom: 6px;
    }
    .form-input {
      width: 100%; font: inherit; font-size: 13.5px; font-weight: 700; padding: 10px 12px;
      border: var(--border-med); border-radius: var(--radius-sm); background: #FAFAFA; color: var(--ink);
      outline: none; box-shadow: inset 1px 1px 0 rgba(0,0,0,0.05);
    }
    .form-input:focus { background: #FFFFFF; border-color: var(--blue-primary); box-shadow: 2px 2px 0 var(--shadow-ink); }
    textarea.form-input { resize: vertical; min-height: 80px; }
    .btn-primary {
      width: 100%; background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: var(--radius-sm); padding: 11px; font-size: 13.5px; font-weight: 900;
      text-align: center; box-shadow: var(--shadow-hard); cursor: pointer; display: flex;
      justify-content: center; align-items: center; gap: 8px; margin-top: 6px; transition: transform 0.05s ease;
      text-decoration: none; font-family: inherit;
    }
    .btn-primary:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--shadow-ink); }
    .btn-yellow { background: var(--accent-yellow); color: var(--ink); }
    .bottom-navbar { position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%); width: calc(100% - 24px); max-width: 456px; z-index: 50; }
    .navbar-inner {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); display: grid; grid-template-columns: repeat(5, 1fr); padding: 8px 4px;
    }
    .nav-item { display: flex; flex-direction: column; align-items: center; gap: 3px; text-decoration: none; color: #64748B; font-size: 10px; font-weight: 800; cursor: pointer; padding: 2px 0; }
    .nav-item svg { width: 21px; height: 21px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .nav-item.active { color: var(--blue-primary); }
    .ico { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .sec-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 800; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
`;

const rupiah = (n: number): string => 'Rp' + Number(n || 0).toLocaleString('id-ID');
export { rupiah };

// CSS dasar (:reset + :root vars + font) — dipakai semua halaman pasar (incl. checkout & order).
export const PASAR_BASE_CSS = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
    <style>${BASE_CSS}${BRAND_CSS}</style>`;

// Kurir ekspedisi yang didukung + URL pelacak resi (zero-API: link keluar ke web kurir).
export const TRACK_URLS: Record<string, (resi: string) => string> = {
  'JNE': (r) => `https://www.jne.co.id/id/id/track?resi=${encodeURIComponent(r)}`,
  'J&T': (r) => `https://jet.co.id/track?awb=${encodeURIComponent(r)}`,
  'SiCepat': (r) => `https://www.sicepat.com/cek-resi?resi=${encodeURIComponent(r)}`,
  'POS': (r) => `https://www.posindonesia.co.id/id/tracking?resi=${encodeURIComponent(r)}`,
  'AnterAja': (r) => `https://anteraja.id/tracking?resi=${encodeURIComponent(r)}`,
  'Ninja': (r) => `https://www.ninja.co.id/id/track?awb=${encodeURIComponent(r)}`,
};
export const trackUrl = (kurir: string, resi: string): string =>
  (TRACK_URLS[kurir] || ((r: string) => `https://www.google.com/search?q=${encodeURIComponent(kurir + ' ' + r)}`))(resi);

// Brand header — salinan utuh blok .brand-header login.ts (hukum keras: utuh atau nggak sama sekali).
export const BRAND_HEADER = `
    <div class="brand-header">
      <a href="/" class="brand-wrap">
        <div class="brand-badge">
          <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h1>BERBIRRU</h1>
        </div>
        <span class="brand-com-tag">.com</span>
      </a>
    </div>`;

const COND_LABEL: Record<string, string> = {
  'baru': 'Baru',
  'bekas_bagus': 'Bekas — Bagus',
  'bekas_layak': 'Bekas — Layak',
};

function cardImage(photos: string): string {
  let keys: string[] = [];
  try { keys = JSON.parse(photos || '[]'); } catch { keys = []; }
  const first = keys[0];
  if (!first) {
    return `<div class="card-img card-img-empty"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`;
  }
  return `<div class="card-img"><img src="/media/${escapeHtml(String(first).split('?')[0])}?v=${Date.now()}" alt="Foto buku" loading="lazy"></div>`;
}

export function renderPasarPage(user: any, listings: any[]): string {
  const cards = listings.map((p) => `
      <a class="book-card" href="/pasar/${p.id}">
        ${cardImage(p.photos)}
        <div class="card-body">
          <div class="card-title">${escapeHtml(p.title)}</div>
          <div class="card-price">${rupiah(p.price)}</div>
          <div class="card-meta">
            <span class="cond-badge">${escapeHtml(COND_LABEL[p.cond] || p.cond)}</span>
            <span class="card-ship">${p.shipping_flat > 0 ? '+ ongkir ' + rupiah(p.shipping_flat) : 'Gratis ongkir'}</span>
          </div>
        </div>
      </a>`).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pasar Buku — BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <meta property="og:title" content="Pasar Buku — BERBIRRU.COM">
  <meta property="og:description" content="Jual beli buku sastra aman lewat rekber BERBIRRU.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
  <style>${BASE_CSS}
    .pasar-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .btn-jual {
      display: inline-flex; align-items: center; gap: 6px; background: var(--accent-yellow); color: var(--ink);
      border: var(--border-med); border-radius: var(--radius-sm); padding: 8px 12px;
      font-size: 12.5px; font-weight: 900; text-decoration: none; box-shadow: var(--shadow-hard-sm); cursor: pointer;
    }
    .btn-jual:active { transform: translate(2px, 2px); box-shadow: none; }
    .book-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .book-card {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); overflow: hidden; text-decoration: none; color: var(--ink);
      display: flex; flex-direction: column; transition: transform 0.05s ease;
    }
    .book-card:active { transform: translate(1px, 1px); }
    .card-img { position: relative; aspect-ratio: 1/1; background: var(--bg-blue-subtle); border-bottom: var(--border-thin); overflow: hidden; }
    .card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .card-img-empty { display: flex; align-items: center; justify-content: center; }
    .card-img-empty svg { width: 42px; height: 42px; stroke: var(--blue-light); stroke-width: 1.5; fill: none; }
    .card-body { padding: 10px 11px 12px; display: flex; flex-direction: column; gap: 6px; }
    .card-title { font-size: 13px; font-weight: 800; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px; }
    .card-price { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 800; color: var(--blue-deep); }
    .card-meta { display: flex; flex-direction: column; gap: 4px; }
    .cond-badge { align-self: flex-start; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; background: var(--bg-blue-subtle); border: 1.5px solid var(--ink); border-radius: 6px; padding: 2px 7px; }
    .card-ship { font-size: 10.5px; font-weight: 700; color: #64748B; }
    .rekber-note {
      margin-top: 16px; background: var(--bg-card); border: var(--border-thin); border-radius: var(--radius-sm);
      padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; line-height: 1.5;
      display: flex; gap: 8px; align-items: flex-start;
    }
    .rekber-note svg { width: 15px; height: 15px; flex-shrink: 0; stroke: var(--blue-primary); stroke-width: 2.5; fill: none; margin-top: 1px; }
    .empty-state {
      text-align: center; padding: 40px 16px; background: var(--bg-card); border: var(--border-med);
      border-radius: var(--radius); box-shadow: var(--shadow-hard);
    }
    .empty-state p { font-size: 13px; font-weight: 700; color: #64748B; margin-bottom: 4px; }
    ${BRAND_CSS}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <a href="/" class="brand-wrap">
        <div class="brand-badge">
          <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h1>BERBIRRU</h1>
        </div>
        <span class="brand-com-tag">.com</span>
      </a>
    </div>

    <div class="pasar-top">
      <div class="sec-title" style="margin:0;">
        <svg class="ico" style="width:18px;height:18px;" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        Pasar Buku
      </div>
      <a class="btn-jual" href="/pasar/jual">
        <svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Jual
      </a>
    </div>

    ${listings.length === 0 ? `
    <div class="empty-state">
      <p>Belum ada buku yang dijual.</p>
      <p style="font-size:11px;">Jadilah toko pertama di Pasar Buku! 📚</p>
    </div>` : `<div class="book-grid">${cards}</div>`}

    <div class="rekber-note">
      <svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C15.5 3.8 18 5 20 5a1 1 0 0 1 1 1Z"/></svg>
      <span>Semua transaksi dilindungi rekber BERBIRRU: uang baru diteruskan ke penjual setelah barang tiba di tanganmu. Biaya keamanan Rp5.000 ditanggung penjual.</span>
    </div>
  </div>
  ${renderBottomNav('', user)}
</body>
</html>`;
}

export function renderJualPage(user: any): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jual Buku — BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
  <style>${BASE_CSS}
    .sell-card { background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius); box-shadow: var(--shadow-hard-lg); padding: 20px 18px; }
    .form-group { margin-bottom: 14px; }
    .photo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 4px; }
    .photo-slot {
      aspect-ratio: 1/1; border: 2px dashed #94A3B8; border-radius: var(--radius-sm);
      display: flex; align-items: center; justify-content: center; cursor: pointer; background: #FAFAFA; overflow: hidden; position: relative;
    }
    .photo-slot svg { width: 20px; height: 20px; stroke: #64748B; stroke-width: 2; fill: none; }
    .photo-slot img { width: 100%; height: 100%; object-fit: cover; }
    .photo-slot .ph-del {
      position: absolute; top: 2px; right: 2px; width: 17px; height: 17px; background: var(--ink); color: #fff;
      border-radius: 50%; font-size: 10px; font-weight: 900; display: flex; align-items: center; justify-content: center; line-height: 1;
    }
    .hint { font-size: 10.5px; font-weight: 700; color: #64748B; margin-top: 4px; line-height: 1.5; }
    .row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .convert-wrap { background: var(--bg-blue-subtle); border: var(--border-thin); border-radius: var(--radius-sm); padding: 9px 12px; font-size: 11px; font-weight: 800; color: var(--blue-deep); margin-top: 4px; line-height: 1.6; }
    .err-msg { display: none; margin-top: 10px; padding: 9px 12px; font-size: 11.5px; font-weight: 800; color: #B91C1C; background: #FEE2E2; border: var(--border-thin); border-radius: var(--radius-sm); }
    ${BRAND_CSS}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <a href="/" class="brand-wrap">
        <div class="brand-badge">
          <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h1>BERBIRRU</h1>
        </div>
        <span class="brand-com-tag">.com</span>
      </a>
    </div>

    <div class="sell-card" style="margin-bottom:14px;">
      <div class="sec-title" style="margin-bottom:14px;">
        <svg class="ico" style="width:18px;height:18px;" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Jual Buku
      </div>
      <div class="form-group">
        <label class="form-label" for="fTitle">Judul buku *</label>
        <input class="form-input" id="fTitle" maxlength="140" placeholder="mis. Laut Bercerita">
      </div>
      <div class="form-group">
        <label class="form-label" for="fAuthor">Penulis</label>
        <input class="form-input" id="fAuthor" maxlength="100" placeholder="mis. Leila S. Chudori">
      </div>
      <div class="form-group">
        <label class="form-label">Kondisi *</label>
        <select class="form-input" id="fCond">
          <option value="baru">Baru — segel utuh</option>
          <option value="bekas_bagus" selected>Bekas — bagus (minim bekas pakai)</option>
          <option value="bekas_layak">Bekas — layak (ada tanda pakai)</option>
        </select>
      </div>
      <div class="form-group row2">
        <div>
          <label class="form-label" for="fPrice">Harga (Rp) *</label>
          <input class="form-input" id="fPrice" type="number" min="1000" max="10000000" step="500" placeholder="50000">
        </div>
        <div>
          <label class="form-label" for="fShip">Ongkir flat (Rp)</label>
          <input class="form-input" id="fShip" type="number" min="0" max="100000" step="1000" placeholder="15000 / 0 = gratis">
        </div>
      </div>
      <div class="form-group">
        <div class="convert-wrap" id="feeInfo">Harga jual 50.000 → saldo kamu cair +45.000 (dikurangi biaya rekber 5.000). Ongkir utuh untuk kamu.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Foto buku (1–5) *</label>
        <div class="photo-grid" id="photoGrid"></div>
        <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" style="display:none">
        <div class="hint">Foto sampul menarik pembeli — potret sampul, isi halaman, dan kondisi buku. Maks 5MB per foto.</div>
      </div>
      <div class="form-group">
        <label class="form-label" for="fDescr">Deskripsi</label>
        <textarea class="form-input" id="fDescr" maxlength="800" placeholder="Edisi, tahun terbit, kelengkapan halaman, alasan dijual..."></textarea>
      </div>
      <button class="btn-primary btn-yellow" id="btnSubmit">
        <svg class="ico" viewBox="0 0 24 24"><path d="m22 2-7 20-4-9-9-4Z"/></svg>
        Pasang di Pasar Buku
      </button>
      <div class="err-msg" id="errMsg"></div>
      <div class="hint" style="text-align:center;">Dengan memasang, kamu setuju biaya rekber Rp5.000 per transaksi ditanggung penjual.</div>
    </div>
    <a class="btn-primary" href="/pasar" style="text-decoration:none;">← Kembali ke Pasar</a>
  </div>

<script>
(function () {
  'use strict';
  var photos = [];
  var MAX_PHOTOS = 5, MAX_BYTES = 5 * 1024 * 1024;
  var grid = document.getElementById('photoGrid');
  var fileInput = document.getElementById('fileInput');
  var errMsg = document.getElementById('errMsg');
  var busy = false;

  function showErr(m) { errMsg.textContent = m; errMsg.style.display = 'block'; }
  function hideErr() { errMsg.style.display = 'none'; }

  function renderSlots() {
    grid.innerHTML = '';
    for (var i = 0; i < MAX_PHOTOS; i++) {
      (function (idx) {
        var d = document.createElement('div');
        d.className = 'photo-slot';
        if (photos[idx]) {
          d.innerHTML = '<img src="' + photos[idx].url + '" alt="Foto ' + (idx + 1) + '"><span class="ph-del" title="Buang">×</span>';
          d.querySelector('.ph-del').addEventListener('click', function (e) {
            e.stopPropagation();
            fetch('/api/pasar/upload?key=' + encodeURIComponent(photos[idx].key), { method: 'DELETE' }).catch(function () {});
            photos.splice(idx, 1);
            renderSlots();
          });
        } else if (idx === photos.length) {
          d.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
          d.addEventListener('click', function () { if (photos.length < MAX_PHOTOS) fileInput.click(); });
        }
        grid.appendChild(d);
      })(i);
    }
  }

  fileInput.addEventListener('change', function () {
    var f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    if (photos.length >= MAX_PHOTOS) { showErr('Maksimal 5 foto.'); return; }
    if (f.size > MAX_BYTES) { showErr('Foto terlalu besar (maks 5MB).'); return; }
    hideErr(); busy = true;
    fetch('/api/pasar/upload', { method: 'POST', headers: { 'Content-Type': f.type || 'application/octet-stream' }, body: f })
      .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (res) {
        if (res.s !== 200 || !res.j.ok) throw new Error(res.j.error || 'Gagal unggah foto');
        photos.push({ key: res.j.key, url: res.j.url });
        renderSlots();
      })
      .catch(function (e) { showErr(e.message || 'Gagal unggah foto'); })
      .finally(function () { busy = false; });
  });

  function fmt(n) { return 'Rp' + Number(n || 0).toLocaleString('id-ID'); }
  function updateFeeInfo() {
    var p = parseInt(document.getElementById('fPrice').value, 10) || 0;
    var s = parseInt(document.getElementById('fShip').value, 10) || 0;
    if (p > 0) {
      document.getElementById('feeInfo').textContent =
        'Harga jual ' + fmt(p) + (s > 0 ? ' + ongkir ' + fmt(s) : ' (gratis ongkir)') +
        ' → saldo kamu cair +' + fmt(p - 5000 + s) + ' (dikurangi biaya rekber 5.000; ongkir utuh untuk kamu).';
    }
  }
  document.getElementById('fPrice').addEventListener('input', updateFeeInfo);
  document.getElementById('fShip').addEventListener('input', updateFeeInfo);

  document.getElementById('btnSubmit').addEventListener('click', function () {
    if (busy) return;
    var title = document.getElementById('fTitle').value.trim();
    var price = parseInt(document.getElementById('fPrice').value, 10);
    var ship = parseInt(document.getElementById('fShip').value, 10) || 0;
    if (!title) { showErr('Judul buku wajib diisi.'); return; }
    if (!price || price < 1000) { showErr('Harga minimal Rp1.000.'); return; }
    if (price > 10000000) { showErr('Harga maksimal Rp10.000.000.'); return; }
    if (ship > 100000) { showErr('Ongkir maksimal Rp100.000.'); return; }
    if (photos.length === 0) { showErr('Pasang minimal 1 foto buku.'); return; }
    hideErr(); busy = true;
    this.style.opacity = '0.6';
    fetch('/api/pasar/listings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        author: document.getElementById('fAuthor').value.trim(),
        descr: document.getElementById('fDescr').value.trim(),
        cond: document.getElementById('fCond').value,
        price: price, shipping_flat: ship,
        photos: photos.map(function (p) { return p.key; })
      })
    })
      .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
      .then(function (res) {
        if (res.s !== 200 || !res.j.ok) throw new Error(res.j.error || 'Gagal memasang');
        window.location.href = '/pasar/' + res.j.id;
      })
      .catch(function (e) { busy = false; showErr(e.message || 'Gagal memasang'); });
  });

  window.pasarSellLoaded = true;
  renderSlots();
})();
</script>
</body>
</html>`;
}

export function renderListingDetail(user: any, p: any, seller: any): string {
  let keys: string[] = [];
  try { keys = JSON.parse(p.photos || '[]'); } catch { keys = []; }
  const photosHtml = keys.map((k, i) => `
        <div class="shot ${i === 0 ? 'shot-main' : ''}"><img src="/media/${escapeHtml(String(k).split('?')[0])}?v=${Date.now()}" alt="Foto ${i + 1}" loading="lazy"></div>`).join('');

  const total = Number(p.price) + Number(p.shipping_flat);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(p.title)} — Pasar Buku BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
  <style>${BASE_CSS}
    .shoots { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .shot { aspect-ratio: 1/1; border: var(--border-med); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-blue-subtle); }
    .shot-main { grid-column: 1 / -1; aspect-ratio: 4/3; }
    .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .detail-card { background: var(--bg-card); border: var(--border-med); border-radius: var(--radius); box-shadow: var(--shadow-hard); padding: 14px 16px; margin-top: 12px; }
    .d-title { font-size: 17px; font-weight: 900; line-height: 1.35; }
    .d-author { font-size: 12px; font-weight: 700; color: #64748B; margin-top: 2px; }
    .d-price { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; color: var(--blue-deep); margin: 8px 0 4px; }
    .d-ship { font-size: 11.5px; font-weight: 700; color: #475569; }
    .d-badges { display: flex; gap: 6px; margin-top: 10px; flex-wrap: wrap; }
    .badge { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; background: var(--bg-blue-subtle); border: 1.5px solid var(--ink); border-radius: 6px; padding: 3px 8px; }
    .badge-seller { background: #FDE047; }
    .d-descr { margin-top: 12px; font-size: 12.5px; font-weight: 600; line-height: 1.65; color: #334155; white-space: pre-wrap; word-break: break-word; }
    .seller-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; padding-top: 12px; border-top: 1.5px dashed #CBD5E1; }
    .seller-ava { width: 36px; height: 36px; border-radius: 50%; border: var(--border-thin); background: var(--blue-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; overflow: hidden; flex-shrink: 0; }
    .seller-ava img { width: 100%; height: 100%; object-fit: cover; }
    .seller-name { font-size: 12.5px; font-weight: 800; text-decoration: none; color: var(--ink); }
    .seller-city { font-size: 10.5px; font-weight: 700; color: #64748B; }
    .buy-wrap { position: sticky; bottom: 76px; margin-top: 14px; }
    .buy-row { background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius); box-shadow: var(--shadow-hard-lg); padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
    .buy-total-label { font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 0.4px; }
    .buy-total { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 800; color: var(--blue-deep); }
    .btn-buy {
      background: var(--blue-primary); color: #fff; border: var(--border-thick); border-radius: var(--radius-sm);
      padding: 10px 18px; font-size: 13px; font-weight: 900; cursor: pointer; box-shadow: var(--shadow-hard-sm);
      display: inline-flex; align-items: center; gap: 6px; text-decoration: none; font-family: inherit; white-space: nowrap;
    }
    .btn-buy:active { transform: translate(2px, 2px); box-shadow: none; }
    .login-hint { text-align: center; font-size: 11px; font-weight: 700; color: #64748B; margin-top: 8px; }
    ${BRAND_CSS}
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <a href="/" class="brand-wrap">
        <div class="brand-badge">
          <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h1>BERBIRRU</h1>
        </div>
        <span class="brand-com-tag">.com</span>
      </a>
    </div>

    <a href="/pasar" style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:var(--blue-primary);text-decoration:none;margin-bottom:10px;">
      <svg class="ico" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg> Pasar Buku
    </a>

    <div class="shoots">${photosHtml}</div>

    <div class="detail-card">
      <div class="d-title">${escapeHtml(p.title)}</div>
      ${p.author ? `<div class="d-author">oleh ${escapeHtml(p.author)}</div>` : ''}
      <div class="d-price">${rupiah(p.price)}</div>
      <div class="d-ship">${p.shipping_flat > 0 ? 'Ongkir flat ' + rupiah(p.shipping_flat) + ' → total ' + rupiah(total) : 'Gratis ongkir → total ' + rupiah(total)}</div>
      <div class="d-badges">
        <span class="badge">${escapeHtml(COND_LABEL[p.cond] || escapeHtml(p.cond))}</span>
        <span class="badge">🔒 Rekber BERBIRRU</span>
      </div>
      ${p.descr ? `<div class="d-descr">${escapeHtml(p.descr)}</div>` : ''}
      <div class="seller-row">
        <a class="seller-ava" href="/u/${escapeHtml(seller.pen_name)}">${seller.avatar_key ? `<img src="/media/${escapeHtml(String(seller.avatar_key).split('?')[0])}" alt="">` : escapeHtml((seller.display_name || seller.pen_name || '?').charAt(0).toUpperCase())}</a>
        <div style="flex:1;">
          <a class="seller-name" href="/u/${escapeHtml(seller.pen_name)}">${escapeHtml(seller.display_name || seller.pen_name)}</a>
          <div class="seller-city">${seller.city ? escapeHtml(seller.city) : 'Indonesia'}</div>
        </div>
      </div>
      <form id="buyForm" action="/pasar/${escapeHtml(p.id)}/beli" method="get" style="display:none;"></form>
    </div>

    <div class="buy-wrap">
      <div class="buy-row">
        <div>
          <div class="buy-total-label">Total bayar</div>
          <div class="buy-total">${rupiah(total)}</div>
        </div>
        ${user
          ? (user.id === p.seller_id
            ? `<span class="badge" style="align-self:center;">Listingmu</span>`
            : `<button class="btn-buy" id="btnBeli" data-id="${escapeHtml(p.id)}">Beli 🔒</button>`)
          : `<a class="btn-buy" href="/login">Masuk untuk Beli</a>`}
      </div>
      ${user ? '' : '<div class="login-hint">Belum punya akun? Daftar dulu — gratis.</div>'}
    </div>
  </div>
  <script>
  (function () {
    var b = document.getElementById('btnBeli');
    if (b) b.addEventListener('click', function () {
      window.location.href = '/pasar/' + b.getAttribute('data-id') + '/beli';
    });
    window.pasarDetailLoaded = true;
  })();
  </script>
</body>
</html>`;
}
