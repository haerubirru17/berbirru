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
    .brand-badge h1 { margin: 0; font-family: 'Archivo Black', sans-serif; font-size: 19px; font-weight: 800; letter-spacing: 0.5px; color: #FFFFFF; line-height: 1; }
    .brand-badge svg { width: 16px; height: 16px; stroke: #FFFFFF; stroke-width: 2; fill: none; flex-shrink: 0; }
    .brand-com-tag {
      font-family: 'Archivo Black', sans-serif; font-size: 26px; font-weight: 900;
      color: var(--blue-primary); position: relative; display: inline-block;
      transform: rotate(2deg); margin-left: 4px; margin-top: 2px; z-index: 1; line-height: 1;
      padding-bottom: 3px;
    }
    .brand-com-tag::after {
      content: ''; position: absolute; left: -24px; bottom: -3px; width: calc(100% + 28px); height: 6px;
      background: var(--accent-yellow); border-radius: 3px; z-index: -1;
    }`;

const BASE_CSS = `
    :root{--blue:#1D61E7;--deep:#0F3E99;--ink:#0B192C;--paper:#FFF9E9;--white:#FFFEF8;--yellow:#FDE047;--coral:#FF735F;--mint:#88E6BD;--soft:#E0EEFD;--red:#EF4444;--green:#059669;--line:3px solid var(--ink);--thin:2px solid var(--ink);--shadow:6px 7px 0 #26364A;--small-shadow:3px 4px 0 #26364A;--bg-main:var(--paper);--bg-card:#fff;--bg-blue-subtle:var(--soft);--shadow-ink:#26364A;--blue-primary:var(--blue);--blue-deep:var(--deep);--blue-light:#60A5FA;--accent-yellow:var(--yellow);--border-thick:var(--line);--border-med:3px solid var(--ink);--border-thin:var(--thin);--shadow-hard:var(--small-shadow);--shadow-hard-lg:var(--shadow);--shadow-hard-sm:2px 3px 0 #26364A;--radius:0;--radius-sm:0}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;min-width:320px;background:var(--paper);color:var(--ink);font-family:'DM Sans',sans-serif;min-height:100vh;padding:18px 14px 104px}button,input,textarea,select{font:inherit}button,a{-webkit-tap-highlight-color:transparent}:focus-visible{outline:4px solid var(--yellow);outline-offset:3px}
    .container{width:min(1080px,100%);margin:auto}.form-label{display:block;margin-bottom:6px;font:700 11px 'Roboto Mono';letter-spacing:.04em}.form-input{width:100%;min-height:46px;padding:10px 12px;border:2.5px solid var(--ink);border-radius:0;background:#fff;color:var(--ink);font-weight:700;outline:none}.form-input:focus{box-shadow:3px 3px 0 var(--blue);border-color:var(--ink)}textarea.form-input{resize:vertical;min-height:105px}
    .btn-primary{min-height:48px;width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 18px;background:var(--blue);color:#fff;border:var(--line);border-radius:0;box-shadow:var(--small-shadow);font-weight:900;text-decoration:none;cursor:pointer;font-family:inherit}.btn-yellow{background:var(--yellow);color:var(--ink)}.btn-primary:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #26364A}
    .bottom-navbar{position:fixed;bottom:0;left:0;right:0;transform:none;width:100%;max-width:none;z-index:70;background:#fff;border-top:2px solid var(--ink);padding:6px 12px calc(6px + env(safe-area-inset-bottom));box-shadow:0 -5px 0 rgba(11,25,44,.07)}.navbar-inner{max-width:560px;margin:auto;background:transparent;border:0;border-radius:0;box-shadow:none;display:grid;grid-template-columns:repeat(5,1fr);padding:0}.nav-item{min-height:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;text-decoration:none;color:#6A788D;font-size:10px;font-weight:800;cursor:pointer;padding:0}.nav-item svg{width:20px;height:20px;stroke:currentColor;stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round}.nav-item.active{color:var(--blue)}.nav-item-center{position:relative;top:-9px}.btn-create-floating{width:46px;height:46px;display:grid;place-items:center;background:var(--yellow);color:var(--ink);border:2.5px solid var(--ink);box-shadow:3px 3px 0 var(--ink);transform:rotate(-2deg)}.btn-create-floating svg{width:20px;height:20px}.ico{width:18px;height:18px;stroke:currentColor;stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round}.sec-title{font:700 clamp(40px,7vw,64px)/.95 'Newsreader',serif;letter-spacing:-.04em;margin:0;display:flex;align-items:center;gap:8px}
`;

const rupiah = (n: number): string => 'Rp' + Number(n || 0).toLocaleString('id-ID');
export { rupiah };

// CSS dasar (:reset + :root vars + font) — dipakai semua halaman pasar (incl. checkout & order).
export const PASAR_BASE_CSS = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,500&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
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

export function renderPasarPage(user: any, listings: any[], f: { q?: string; cond?: string; sort?: string; max?: number } = {}, pg: { hal?: number; perPage?: number; total?: number } = {}): string {
  const q = f.q || '', cond = f.cond || '', sort = f.sort || 'baru', max = Number(f.max || 0);
  const adaFilter = !!(q || cond || max || sort !== 'baru');
  const hal = Math.max(1, Number(pg.hal || 1));
  const perPage = Number(pg.perPage || 24);
  const total = Number(pg.total ?? listings.length);
  const dari = total === 0 ? 0 : (hal - 1) * perPage + 1;
  const sampai = Math.min(total, (hal - 1) * perPage + listings.length);
  const halaman = Math.max(1, Math.ceil(total / perPage));
  const tautan = (n: number) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (cond) p.set('cond', cond);
    if (sort && sort !== 'baru') p.set('sort', sort);
    if (max) p.set('max', String(max));
    if (n > 1) p.set('hal', String(n));
    const s = p.toString();
    return '/pasar' + (s ? '?' + s : '');
  };
  const pager = halaman > 1 ? `
    <div class="pager">
      ${hal > 1 ? `<a href="${tautan(hal - 1)}">&lsaquo; Sebelumnya</a>` : '<span class="off">&lsaquo; Sebelumnya</span>'}
      <span class="pos">${dari}–${sampai} dari ${total} · hal ${hal}/${halaman}</span>
      ${hal < halaman ? `<a href="${tautan(hal + 1)}">Berikutnya &rsaquo;</a>` : '<span class="off">Berikutnya &rsaquo;</span>'}
    </div>` : '';
  const opsi = (v: string, label: string, kini: string) => `<option value="${v}"${kini === v ? ' selected' : ''}>${label}</option>`;
  const cards = listings.map((p) => `
      <a class="book-card" href="/pasar/${p.id}">
        ${cardImage(p.photos)}
        <div class="card-body">
          <div class="card-title">${escapeHtml(p.title)}</div>
          <div class="card-price">${rupiah(p.price)}</div>
          <div class="card-meta">
            <span class="cond-badge">${escapeHtml(COND_LABEL[p.cond] || p.cond)}</span>
            <span class="card-ship">Ongkir saat checkout</span>
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
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,500&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>${BASE_CSS}
    .pasar-top{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:22px}.pasar-top .sec-title{font-size:clamp(42px,7vw,66px)}
    .btn-jual{min-height:48px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--yellow);color:var(--ink);border:var(--line);padding:11px 18px;font-weight:900;text-decoration:none;box-shadow:var(--small-shadow);cursor:pointer;white-space:nowrap}.btn-jual:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #26364A}
    .pf{display:grid;grid-template-columns:1fr 150px 130px 130px auto;gap:8px;margin:0 0 10px;align-items:center}
    .pf-q,.pf-max,.pf-sel{min-height:44px;border:var(--line);background:#fff;padding:9px 12px;font:700 13px 'DM Sans';color:var(--ink);box-shadow:var(--small-shadow)}
    .pf-q{width:100%}.pf-go{min-height:44px;border:var(--line);background:var(--blue);color:#fff;font:900 13px 'DM Sans';padding:9px 18px;box-shadow:var(--small-shadow);cursor:pointer}
    .pf-go:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #26364A}
    .pf-info{display:flex;justify-content:space-between;align-items:center;margin:0 0 16px;font:800 11px 'Roboto Mono';color:#52627A}
    .pf-info a{color:var(--blue);font-weight:900;text-decoration:underline}
    .pager{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 16px;font:800 11px 'Roboto Mono';color:#52627A}
    .pager a,.pager .off{border:2px solid var(--ink);background:#fff;padding:7px 10px;text-decoration:none;color:var(--ink);box-shadow:var(--small-shadow)}
    .pager .off{opacity:.35;border-style:dashed;box-shadow:none}
    .pager .pos{font-weight:800;color:#64748B}
    @media(max-width:880px){.pf{grid-template-columns:1fr 1fr}.pf-q{grid-column:1/-1}.pf-go{grid-column:1/-1}}
    .book-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.book-card{background:#fff;border:var(--line);box-shadow:var(--shadow);overflow:hidden;text-decoration:none;color:var(--ink);display:flex;flex-direction:column;transition:.08s}.book-card:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #26364A}.card-img{position:relative;aspect-ratio:4/5;background:var(--soft);border-bottom:var(--thin);overflow:hidden}.card-img img{width:100%;height:100%;object-fit:cover;display:block}.card-img-empty{display:grid;place-items:center}.card-img-empty svg{width:48px;height:48px;stroke:var(--blue);stroke-width:1.7;fill:none}.card-body{padding:14px;display:flex;flex-direction:column;gap:7px}.card-title{font:700 21px/1.08 'Newsreader',serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:45px}.card-price{font:400 18px 'Archivo Black';color:var(--deep)}.card-meta{display:flex;justify-content:space-between;align-items:center;gap:7px;flex-wrap:wrap}.cond-badge{font:700 9px 'Roboto Mono';letter-spacing:.04em;background:var(--yellow);border:2px solid var(--ink);padding:3px 7px}.card-ship{font-size:10px;font-weight:800;color:#607086}.rekber-note{margin-top:24px;background:var(--blue);color:#fff;border:var(--line);box-shadow:var(--shadow);padding:16px;font-size:13px;font-weight:700;line-height:1.55;display:flex;gap:10px;align-items:flex-start}.rekber-note svg{width:20px;height:20px;flex:none;stroke:var(--yellow);stroke-width:2.4;fill:none}.empty-state{text-align:center;padding:40px 16px;background:#fff;border:var(--line);box-shadow:var(--shadow)}.empty-state p{font-size:13px;font-weight:700;color:#64748B;margin-bottom:4px}
    @media(max-width:880px){.book-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.container{max-width:680px}}
    @media(max-width:420px){.pasar-top{align-items:stretch;flex-direction:column}.btn-jual{width:100%}.book-grid{gap:11px}.card-title{font-size:17px;min-height:38px}.card-body{padding:10px}.card-price{font-size:15px}}
    ${BRAND_CSS}
  </style>
</head>
<body>
  <div class="container">
    <div class="pasar-top">
      <div><div class="sec-title" style="margin:0;">Pasar Buku</div><p style="margin:7px 0 0;color:#52627A;font-weight:600">Jual beli buku fisik dengan rekber.</p></div>
    </div>

    <form class="pf" method="get" action="/pasar">
      <input class="pf-q" type="search" name="q" value="${escapeHtml(q)}" maxlength="60" placeholder="Cari judul atau penulis…" aria-label="Cari buku">
      <select class="pf-sel" name="cond" aria-label="Kondisi">
        ${opsi('', 'Semua kondisi', cond)}${opsi('baru', 'Baru', cond)}${opsi('bekas_bagus', 'Bekas bagus', cond)}${opsi('bekas_layak', 'Bekas layak', cond)}
      </select>
      <select class="pf-sel" name="sort" aria-label="Urutkan">
        ${opsi('baru', 'Terbaru', sort)}${opsi('murah', 'Termurah', sort)}${opsi('mahal', 'Termahal', sort)}
      </select>
      <input class="pf-max" type="number" name="max" value="${max || ''}" min="0" step="1000" inputmode="numeric" placeholder="Harga maks" aria-label="Harga maksimal">
      <button class="pf-go" type="submit">Cari</button>
    </form>
    <div class="pf-info">
      <span>${total === 0 ? 'Tidak ada buku' : `${dari}–${sampai} dari ${total} buku`}${adaFilter ? ' cocok' : ''}</span>
      ${adaFilter ? '<a href="/pasar">Hapus filter</a>' : ''}
    </div>

    ${pager}
    ${listings.length === 0 ? `
    <div class="empty-state">
      ${adaFilter
        ? `<p>Tidak ada buku yang cocok dengan filter itu.</p><p style="font-size:11px;">Coba kata kunci lain atau <a href="/pasar">hapus filter</a>.</p>`
        : `<p>Belum ada buku yang dijual.</p><p style="font-size:11px;">Jadilah toko pertama di Pasar Buku! 📚</p>`}
    </div>` : `<div class="book-grid">${cards}</div>`}

    <div class="rekber-note">
      <svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C15.5 3.8 18 5 20 5a1 1 0 0 1 1 1Z"/></svg>
      <span>Semua transaksi dilindungi rekber BERBIRRU: uang baru diteruskan ke penjual setelah barang tiba di tanganmu. Biaya keamanan Rp5.000 ditanggung penjual.</span>
    </div>
  </div>
  ${renderBottomNav('pasar', user)}
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
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,500&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
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
    .row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .chip-pick { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { border: var(--border-thin); background: #fff; color: var(--ink); border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 900; cursor: pointer; box-shadow: var(--small-shadow); min-height: 38px; }
    .chip.on { background: var(--blue-primary); color: #fff; box-shadow: none; transform: translate(1px,1px); }
    @media (max-width: 420px) { .row3 { grid-template-columns: 1fr; } }
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
          <label class="form-label">Perkiraan tebal buku *</label>
          <div class="chip-pick" id="fWeightChips">
            <button type="button" class="chip on" data-w="300">Ringan &lt;500 g</button>
            <button type="button" class="chip" data-w="700">Sedang ±1 kg</button>
            <button type="button" class="chip" data-w="1500">Tebal &gt;1 kg</button>
          </div>
          <input class="form-input" id="fWeightGram" type="number" min="1001" max="30000" step="100" placeholder="Berat gram (mis. 1500)" style="display:none;margin-top:8px;">
          <div class="hint">Ongkir dihitung per kg dan dibulatkan ke atas, minimum 1 kg. Ringan &amp; Sedang sama-sama dihitung 1 kg.</div>
        </div>
      </div>
      <div class="form-group">
        <div class="convert-wrap" id="feeInfo">Harga jual 50.000 → saldo kamu cair +45.000 (dikurangi biaya rekber 5.000). Ongkir dihitung otomatis &amp; utuh untuk kamu.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Layanan pengiriman *</label>
        <div class="chip-pick" id="fCouriers">
          <button type="button" class="chip on" data-c="jne">JNE</button>
          <button type="button" class="chip on" data-c="jnt">J&amp;T</button>
          <button type="button" class="chip on" data-c="sicepat">SiCepat</button>
          <button type="button" class="chip" data-c="pos">POS</button>
          <button type="button" class="chip" data-c="anteraja">AnterAja</button>
        </div>
        <div class="hint">Pilih kurir yang kamu siap kirim. Pembeli nanti pilih layanan + lihat tarif live sesuai kotanya. <b>Satu listing = satu buku fisik</b> — untuk 2 copy, buat 2 listing.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Kota asal pengiriman *</label>
        <div class="row3">
          <select class="form-input" id="fProv"><option value="">Provinsi</option></select>
          <select class="form-input" id="fKab"><option value="">Kota/Kabupaten</option></select>
          <select class="form-input" id="fKec"><option value="">Kecamatan</option></select>
        </div>
        <div class="hint" id="originHint">Dipakai menghitung ongkir pembeli. Pastikan kecamatan asal benar.</div>
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
    if (p > 0) {
      document.getElementById('feeInfo').textContent =
        'Harga jual ' + fmt(p) + ' → saldo kamu cair +' + fmt(p - 5000) +
        ' (dikurangi biaya rekber 5.000). Ongkir dipilih pembeli saat checkout & cair utuh ke kamu.';
    }
  }
  document.getElementById('fPrice').addEventListener('input', updateFeeInfo);

  // ── Preset berat buku ───────────────────────────────────────────────
  document.querySelectorAll('#fWeightChips .chip').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#fWeightChips .chip').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      document.getElementById('fWeightGram').style.display = b.getAttribute('data-w') === '1500' ? 'block' : 'none';
    });
  });

  // ── Layanan pengiriman & kota asal ──────────────────────────────────
  var courierChips = Array.prototype.slice.call(document.querySelectorAll('#fCouriers .chip'));
  courierChips.forEach(function (ch) {
    ch.addEventListener('click', function () { ch.classList.toggle('on'); });
  });

  function pilihanKurir() {
    return courierChips.filter(function (c) { return c.classList.contains('on'); })
      .map(function (c) { return c.getAttribute('data-c'); });
  }

  async function isiWilayah(sel, parent, label) {
    sel.innerHTML = '<option value="">' + label + '</option>';
    var url = '/api/kurir/wilayah' + (parent ? '?parent=' + encodeURIComponent(parent) : '');
    try {
      var j = await (await fetch(url)).json();
      if (!j.ok) { sel.innerHTML = '<option value="">' + (j.error || 'Gagal memuat') + '</option>'; return; }
      j.items.forEach(function (it) {
        var o = document.createElement('option'); o.value = it.id; o.textContent = it.name; sel.appendChild(o);
      });
    } catch (e) { sel.innerHTML = '<option value="">Gagal memuat wilayah</option>'; }
  }

  var fProv = document.getElementById('fProv'), fKab = document.getElementById('fKab'), fKec = document.getElementById('fKec');
  isiWilayah(fProv, null, 'Provinsi');
  fProv.addEventListener('change', function () {
    fKab.innerHTML = '<option value="">Kota/Kabupaten</option>';
    fKec.innerHTML = '<option value="">Kecamatan</option>';
    if (fProv.value) isiWilayah(fKab, fProv.value, 'Kota/Kabupaten');
  });
  fKab.addEventListener('change', function () {
    fKec.innerHTML = '<option value="">Kecamatan</option>';
    if (fKab.value) isiWilayah(fKec, fKab.value, 'Kecamatan');
  });
  function labelKec() {
    var k = fKec.options[fKec.selectedIndex], b = fKab.options[fKab.selectedIndex], pv = fProv.options[fProv.selectedIndex];
    if (!fKec.value) return '';
    return [k && k.textContent, b && b.textContent, pv && pv.textContent].filter(Boolean).join(', ');
  }

  document.getElementById('btnSubmit').addEventListener('click', function () {
    if (busy) return;
    var title = document.getElementById('fTitle').value.trim();
    var price = parseInt(document.getElementById('fPrice').value, 10);
    var wChip = document.querySelector('#fWeightChips .chip.on');
    var weight = wChip ? parseInt(wChip.getAttribute('data-w'), 10) : 0;
    if (weight >= 1500) weight = parseInt(document.getElementById('fWeightGram').value, 10) || 0;
    var kurir = pilihanKurir();
    if (!title) { showErr('Judul buku wajib diisi.'); return; }
    if (!price || price < 1000) { showErr('Harga minimal Rp1.000.'); return; }
    if (price > 10000000) { showErr('Harga maksimal Rp10.000.000.'); return; }
    if (!weight || weight < 100) { showErr('Isi berat buku dalam gram (mis. 1500) untuk buku tebal.'); return; }
    if (!kurir.length) { showErr('Pilih minimal satu layanan pengiriman.'); return; }
    if (!fKec.value) { showErr('Pilih kecamatan asal pengiriman.'); return; }
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
        price: price,
        weight_g: weight,
        couriers: kurir,
        origin_id: fKec.value,
        origin_name: labelKec(),
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

  const total = Number(p.price); // ongkir dihitung live saat checkout

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(p.title)} — Pasar Buku BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,500&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>${BASE_CSS}
    .shoots { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .shot { aspect-ratio: 1/1; border: var(--border-med); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-blue-subtle); }
    .shot-main { grid-column: 1 / -1; aspect-ratio: 4/3; }
    .shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .detail-card { background: var(--bg-card); border: var(--border-med); border-radius: var(--radius); box-shadow: var(--shadow-hard); padding: 14px 16px; margin-top: 12px; }
    .d-title { font-size: 17px; font-weight: 900; line-height: 1.35; }
    .d-author { font-size: 12px; font-weight: 700; color: #64748B; margin-top: 2px; }
    .d-price { font-family: 'Archivo Black', sans-serif; font-size: 22px; font-weight: 800; color: var(--blue-deep); margin: 8px 0 4px; }
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
    .buy-total { font-family: 'Archivo Black', sans-serif; font-size: 16px; font-weight: 800; color: var(--blue-deep); }
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
      <div class="d-ship">${Number(p.weight_g) > 0 ? 'Berat ±' + (Number(p.weight_g) >= 1000 ? (Number(p.weight_g) / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' kg' : Number(p.weight_g) + ' g') + ' · ' : ''}Ongkir dihitung kurir, min 1 kg saat checkout</div>
      <div class="d-badges">
        <span class="badge">${escapeHtml(COND_LABEL[p.cond] || escapeHtml(p.cond))}</span>
        <span class="badge">Rekber BERBIRRU</span>
      </div>
      ${p.descr ? `<div class="d-descr">${escapeHtml(p.descr)}</div>` : ''}
      <div class="seller-row">
        <a class="seller-ava" href="/u/${escapeHtml(seller.pen_name)}">${seller.avatar_key ? `<img src="/media/${escapeHtml(String(seller.avatar_key).split('?')[0])}" alt="">` : escapeHtml((seller.display_name || seller.pen_name || '?').charAt(0).toUpperCase())}</a>
        <div style="flex:1;">
          ${seller.shop_name ? `<div style="font-size:10px;font-weight:900;color:var(--blue-deep);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px;">${escapeHtml(seller.shop_name)}</div>` : ''}
          <a class="seller-name" href="${seller.shop_slug ? '/toko/' + escapeHtml(seller.shop_slug) : '/u/' + escapeHtml(seller.pen_name)}">${escapeHtml(seller.display_name || seller.pen_name)}</a>
          ${seller.shop_slug ? `<a href="/toko/${escapeHtml(seller.shop_slug)}" style="display:inline-block;margin-top:4px;font:800 10px 'DM Sans';color:#1D61E7;text-decoration:none;">Lihat semua buku toko &rsaquo;</a>` : ''}
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
            : `<button class="btn-buy" id="btnBeli" data-id="${escapeHtml(p.id)}">Beli</button>`)
          : `<a class="btn-buy" href="/login">Masuk untuk Beli</a>`}
      </div>
      ${user ? '' : '<div class="login-hint">Belum punya akun? Daftar dulu — gratis.</div>'}
    </div>

    ${user && user.id !== p.seller_id ? `
    <details class="lap" data-id="${escapeHtml(p.id)}">
      <summary>Laporkan buku ini</summary>
      <div class="lap-in">
        <label class="lap-l">Alasan</label>
        <select id="lapReason">
          <option value="mismatch">Barang tidak sesuai deskripsi</option>
          <option value="fraud">Penipuan / penjual tidak mengirim</option>
          <option value="misleading">Judul atau foto menyesatkan</option>
          <option value="price">Harga tidak wajar</option>
          <option value="other">Lain-lain</option>
        </select>
        <label class="lap-l">Catatan (opsional)</label>
        <textarea id="lapNote" maxlength="300" placeholder="Ceritakan singkat masalahnya…"></textarea>
        <button type="button" class="lap-go" onclick="laporkan(this)">Kirim laporan</button>
        <div class="lap-msg" id="lapMsg"></div>
      </div>
    </details>` : ''}
  </div>
  <style>
    .lap{margin:14px 0 24px;border:2.5px solid var(--ink);background:#fff;box-shadow:var(--small-shadow)}
    .lap summary{cursor:pointer;padding:11px 13px;font:800 12px 'DM Sans';color:#991B1B;list-style:none}
    .lap summary::-webkit-details-marker{display:none}
    .lap-in{padding:0 13px 13px;display:flex;flex-direction:column;gap:8px}
    .lap-l{font:800 10px 'Roboto Mono';color:#64748B;letter-spacing:.05em;text-transform:uppercase}
    .lap select,.lap textarea{width:100%;border:2px solid var(--ink);border-radius:8px;padding:9px 11px;font:600 13px 'DM Sans';background:#fff}
    .lap textarea{min-height:70px;resize:vertical}
    .lap-go{min-height:42px;border:2.5px solid var(--ink);background:#FEE2E2;color:#991B1B;font:900 12.5px 'DM Sans';cursor:pointer;box-shadow:2px 3px 0 #26364A}
    .lap-msg{font:700 11.5px 'DM Sans';color:#0F7A3D}
  </style>
  <script>
  async function laporkan(btn){
    btn.disabled=true;
    var msg=document.getElementById('lapMsg');
    try{
      var r=await fetch('/api/pasar/listings/'+btn.closest('.lap').getAttribute('data-id')+'/report',
        {method:'POST',headers:{'Content-Type':'application/json'},
         body:JSON.stringify({reason:document.getElementById('lapReason').value,note:document.getElementById('lapNote').value})});
      var j=await r.json().catch(function(){return {}});
      msg.style.color = r.ok ? '#0F7A3D' : '#B42318';
      msg.textContent = r.ok ? 'Laporan diterima. Owner akan meninjau.' : (j.error||'Gagal mengirim laporan.');
    }catch(e){msg.style.color='#B42318';msg.textContent='Gagal mengirim laporan.'}
    btn.disabled=false;
  }
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

export function renderEditListingPage(user: any, l: any): string {
  const cond = String(l.cond || 'bekas_bagus');
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Edit Buku | BERBIRRU</title>
<link rel="icon" type="image/svg+xml" href="/favicon.ico">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700&display=swap" rel="stylesheet">
${PASAR_BASE_CSS}
<style>
  .ed{background:#fff;border:3px solid #0B192C;box-shadow:5px 6px 0 #26364A;border-radius:12px;padding:16px}
  .ed .f{margin-bottom:12px}
  .ed label{display:block;font:800 10.5px 'Roboto Mono';letter-spacing:.05em;color:#52627A;margin-bottom:5px;text-transform:uppercase}
  .ed input,.ed select{width:100%;min-height:44px;border:2.5px solid #0B192C;border-radius:8px;padding:10px 12px;font:600 14px 'DM Sans'}
  .ed .hint{font:600 10.5px 'DM Sans';color:#64748B;margin-top:4px}
  .ed .btn{width:100%;min-height:46px;border:3px solid #0B192C;border-radius:8px;box-shadow:3px 4px 0 #26364A;font:900 13px 'DM Sans';cursor:pointer;background:#FDE047}
  .err{display:none;background:#FEE2E2;border:2.5px solid #B42318;color:#7F1D1D;padding:9px 11px;font:800 12px 'DM Sans';margin-bottom:12px;border-radius:8px}
</style></head>
<body>
<div class="wrap">
  <div class="page-head"><h1>Edit Buku</h1><p>Perbaiki judul, harga, atau kondisi. Foto tidak berubah.</p></div>
  <div class="err" id="err"></div>
  <form class="ed" onsubmit="simpan(event)">
    <div class="f"><label>Judul buku</label><input id="fTitle" maxlength="120" value="${escapeHtml(l.title || '')}"></div>
    <div class="f"><label>Harga (Rp)</label><input id="fPrice" type="number" min="1000" max="50000000" step="500" value="${Number(l.price || 0)}">
      <div class="hint">Biaya rekber Rp5.000 dipotong dari harga ini saat dana dilepas.</div></div>
    <div class="f"><label>Kondisi</label>
      <select id="fCond">
        <option value="baru"${cond === 'baru' ? ' selected' : ''}>Baru</option>
        <option value="bekas_bagus"${cond === 'bekas_bagus' ? ' selected' : ''}>Bekas — Bagus</option>
        <option value="bekas_layak"${cond === 'bekas_layak' ? ' selected' : ''}>Bekas — Layak</option>
      </select></div>
    <button class="btn" type="submit">Simpan perubahan</button>
  </form>
</div>
<script>
async function simpan(e){
  e.preventDefault();
  const err=document.getElementById('err'); err.style.display='none';
  const body={title:document.getElementById('fTitle').value.trim(),
    price:Number(document.getElementById('fPrice').value),
    cond:document.getElementById('fCond').value};
  const r=await fetch('/api/pasar/listings/${escapeHtml(l.id)}',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){err.textContent=j.error||'Gagal menyimpan.';err.style.display='block';return}
  location.href='/pasar/saya?tab=toko';
}
</script>
${renderBottomNav('pasar', user, false, { mode: 'pasar', marketTab: 'toko' })}
</body></html>`;
}
