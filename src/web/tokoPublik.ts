// Halaman toko publik penjual: /toko/<slug>
import { escapeHtml } from '../lib/sanitize';
import { PASAR_BASE_CSS, rupiah } from './pasar';

const PAGE_CSS = `
  .wrap{width:min(1080px,calc(100% - 28px));margin:auto;padding:18px 0 60px}
  .shop-head{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;padding:18px;margin-bottom:16px}
  .shop-name{margin:0;font:700 clamp(30px,6vw,46px)/1 'Newsreader',serif;letter-spacing:-.035em}
  .shop-sub{margin:8px 0 0;font:700 11.5px 'Roboto Mono';color:#64748B;letter-spacing:.02em}
  .verif{display:inline-flex;align-items:center;gap:5px;font:800 9px 'Roboto Mono';letter-spacing:.05em;text-transform:uppercase;
    background:#DCFCE7;border:2px solid #0B192C;padding:4px 7px;box-shadow:2px 2px 0 #26364A;margin-top:10px}
  .verif svg{width:10px;height:10px;stroke:#0B192C;stroke-width:3;fill:none}
  .shop-act{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
  .shop-act button,.shop-act a{flex:1;min-width:130px;min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:6px;
    border:2.5px solid #0B192C;background:#fff;color:#0B192C;font:900 11.5px 'DM Sans';cursor:pointer;text-decoration:none;box-shadow:3px 3px 0 #26364A;padding:8px 10px}
  .shop-act .wa{background:#25D366;color:#0B192C}
  .shop-act button:active,.shop-act a:active{transform:translate(2px,2px);box-shadow:none}
  .stats{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}
  .stat{flex:1;min-width:120px;background:#F6F8FB;border:2px solid #0B192C;padding:9px 11px}
  .stat b{display:block;font:400 17px 'Archivo Black';color:#0F3E99}
  .stat span{font:700 9.5px 'Roboto Mono';color:#64748B;letter-spacing:.05em;text-transform:uppercase}
  .sec-title{font:700 clamp(26px,4.5vw,36px)/1 'Newsreader',serif;letter-spacing:-.03em;margin:22px 0 12px}
  .pg{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 14px;font:800 11px 'Roboto Mono';color:#52627A}
  .pg a,.pg .off{border:2px solid #0B192C;background:#fff;padding:7px 10px;text-decoration:none;color:#0B192C;box-shadow:3px 4px 0 #26364A}
  .pg .off{opacity:.35;border-style:dashed;box-shadow:none}
  .book-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
  .book-card{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;overflow:hidden;text-decoration:none;color:#0B192C;display:flex;flex-direction:column}
  .book-card:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #26364A}
  .card-img{position:relative;aspect-ratio:4/5;background:#EEF2F7;border-bottom:2px solid #0B192C;overflow:hidden}
  .card-img img{width:100%;height:100%;object-fit:cover;display:block}
  .card-img-empty{display:grid;place-items:center}
  .card-img-empty svg{width:44px;height:44px;stroke:#1D61E7;stroke-width:1.7;fill:none}
  .card-body{padding:13px;display:flex;flex-direction:column;gap:6px}
  .card-title{font:700 20px/1.08 'Newsreader',serif;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:44px}
  .card-price{font:400 17px 'Archivo Black';color:#0F3E99}
  .card-meta{display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap}
  .cond-badge{font:700 9px 'Roboto Mono';background:#FDE047;border:2px solid #0B192C;padding:3px 7px}
  .card-ship{font-size:10px;font-weight:800;color:#607086}
  .empty{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;padding:26px 18px;text-align:center}
  .empty p{margin:0 0 10px;font:700 13px 'DM Sans';color:#64748B}
  .empty a{display:inline-flex;min-height:44px;align-items:center;background:#1D61E7;color:#fff;border:2.5px solid #0B192C;padding:9px 14px;font:900 12.5px 'DM Sans';text-decoration:none;box-shadow:3px 3px 0 #26364A}
  .back{display:inline-block;margin-top:22px;font:800 11.5px 'DM Sans';color:#1D61E7;text-decoration:none}
  @media (max-width:760px){.book-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}}
`;

const COND: Record<string, string> = { baru: 'BARU', seperti_baru: 'SEPERTI BARU', bekas_bagus: 'BEKAS BAGUS', bekas: 'BEKAS' };

function foto(photos: any): string {
  let arr: string[] = [];
  try { arr = JSON.parse(photos || '[]'); } catch { arr = []; }
  const first = arr[0];
  if (!first) return `<div class="card-img card-img-empty"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>`;
  return `<div class="card-img"><img src="/media/${escapeHtml(String(first).split('?')[0])}" alt="Foto buku" loading="lazy"></div>`;
}

function kartu(p: any): string {
  return `<a class="book-card" href="/pasar/${escapeHtml(p.id)}">
    ${foto(p.photos)}
    <div class="card-body">
      <div class="card-title">${escapeHtml(p.title)}</div>
      <div class="card-price">${rupiah(Number(p.price))}</div>
      <div class="card-meta"><span class="cond-badge">${escapeHtml(COND[p.cond] || p.cond || 'BEKAS')}</span></div>
      <div class="card-ship">Ongkir saat checkout</div>
    </div>
  </a>`;
}

export function renderTokoPublikPage(toko: any, listings: any[], opts: { isOwner?: boolean; baseUrl: string; hal?: number; perPage?: number; total?: number }): string {
  const url = `${opts.baseUrl}/toko/${toko.shop_slug}`;
  const bukuAktif = Number(toko.buku_aktif ?? listings.length);
  const hal = Math.max(1, Number(opts.hal || 1));
  const perPage = Number(opts.perPage || 24);
  const totalBuku = Number(opts.total ?? listings.length);
  const halaman = Math.max(1, Math.ceil(totalBuku / perPage));
  const pager = halaman > 1
    ? `<div class="pg">${hal > 1 ? `<a href="?hal=${hal - 1}">&lsaquo; Sebelumnya</a>` : '<span class="off">&lsaquo; Sebelumnya</span>'}
        <span>${(hal - 1) * perPage + 1}–${Math.min(totalBuku, (hal - 1) * perPage + listings.length)} dari ${totalBuku}</span>
        ${hal < halaman ? `<a href="?hal=${hal + 1}">Berikutnya &rsaquo;</a>` : '<span class="off">Berikutnya &rsaquo;</span>'}</div>`
    : '';
  const selesai = Number(toko.transaksi_selesai || 0);
  const ulasanN = Number(toko.ulasan_n || 0);
  const ulasanAvg = Number(toko.ulasan_avg || 0);
  const sejak = toko.created_at ? new Date(String(toko.created_at).replace(' ', 'T') + 'Z').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '—';

  let fotoOg = `${opts.baseUrl}/og-image.png`;
  try {
    const arr = JSON.parse(listings[0]?.photos || '[]');
    if (arr[0]) fotoOg = `${opts.baseUrl}/media/${String(arr[0]).split('?')[0]}`;
  } catch { /* pakai default */ }

  const desc = `${bukuAktif} buku${toko.city ? ' · ' + toko.city : ''} · Rekber BERBIRRU`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${toko.shop_name} di BERBIRRU — ${url}`)}`;

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(toko.shop_name)} — Toko Buku | BERBIRRU</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(toko.shop_name)} — Toko Buku BERBIRRU">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${escapeHtml(fotoOg)}">
<meta property="og:url" content="${escapeHtml(url)}">
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
<div class="wrap">
  <div class="shop-head">
    <h1 class="shop-name">${escapeHtml(toko.shop_name)}</h1>
    <p class="shop-sub">@${escapeHtml(toko.pen_name)}${toko.city ? ' · ' + escapeHtml(toko.city) : ''} · sejak ${escapeHtml(sejak)}</p>
    <div class="verif"><svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>Terverifikasi</div>

    <div class="shop-act">
      <button type="button" id="btnSalin" onclick="salin(this)">Salin link toko</button>
      <a class="wa" href="${escapeHtml(wa)}" target="_blank" rel="noopener">Bagikan ke WhatsApp</a>
      ${opts.isOwner ? '<a href="/pasar/saya?tab=toko">Kelola toko</a>' : ''}
    </div>

    <div class="stats">
      <div class="stat"><b>${bukuAktif}</b><span>Buku aktif</span></div>
      <div class="stat"><b>${selesai}</b><span>Transaksi selesai</span></div>
      ${ulasanN ? `<div class="stat"><b>${ulasanAvg.toFixed(1).replace('.', ',')} ★</b><span>${ulasanN} ulasan</span></div>` : ''}
    </div>
  </div>

  <div class="sec-title">Buku di toko ini</div>
  ${pager}
  ${listings.length ? `<div class="book-grid">${listings.map(kartu).join('')}</div>`
    : `<div class="empty"><p>Belum ada buku aktif di toko ini.</p>${opts.isOwner ? '<a href="/pasar/jual">Pasang buku</a>' : '<a href="/pasar">Lihat buku lain</a>'}</div>`}

  <a class="back" href="/pasar">&larr; Pasar Buku</a>
</div>
<script>
function salin(btn){
  var t=${JSON.stringify(url)};
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(function(){btn.textContent='Tersalin ✓'},function(){prompt('Salin manual:',t)});
  } else { prompt('Salin manual:',t) }
}
</script>
</body></html>`;
}
