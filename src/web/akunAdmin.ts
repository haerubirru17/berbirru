// Riwayat akun (owner-only): dipakai untuk memutuskan verifikasi / sengketa / pencairan.
// Read-only — tidak ada aksi di sini; aksi tetap di /owner dengan catatan wajib.
import { escapeHtml } from '../lib/sanitize';
import { rupiah } from './pasar';

const PAGE_CSS = `
  body{background:var(--tblr-bg-surface-secondary)}
  .num{font-variant-numeric:tabular-nums;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .muted{color:var(--tblr-secondary);font-size:.78rem;line-height:1.45}
  .wrap{max-width:1000px;margin:auto;padding:15px}
  .box{background:var(--tblr-bg-surface);border:1px solid var(--tblr-border-color);border-radius:12px;overflow:hidden;margin-bottom:12px}
  .box h2{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--tblr-secondary);margin:0;padding:10px 14px;border-bottom:1px solid var(--tblr-border-color);font-family:ui-monospace,Menlo,monospace}
  .row{display:flex;justify-content:space-between;gap:10px;padding:9px 14px;border-bottom:1px solid var(--tblr-border-color);font-size:.86rem}
  .row:last-child{border-bottom:none}
  .row .t{font-weight:600}
  .empty{padding:12px 14px;color:var(--tblr-secondary);font-size:.85rem}
  .pill{display:inline-block;font-size:.7rem;font-weight:700;padding:1px 7px;border-radius:20px;background:var(--tblr-bg-surface-secondary);border:1px solid var(--tblr-border-color)}
`;

const tgl = (s: any) => escapeHtml(String(s || '').slice(0, 16).replace('T', ' '));
const rp = (n: any) => rupiah(Number(n || 0));

const STATUS: Record<string, string> = {
  created: 'menunggu bayar', paid: 'dibayar', handed: 'diserahkan', completed: 'selesai',
  expired: 'kedaluwarsa', canceled: 'dibatalkan', disputed: 'sengketa', refunded: 'refund',
};

function daftar(rows: any[], render: (r: any) => string, kosong: string): string {
  return rows.length ? rows.map(render).join('') : `<div class="empty">${kosong}</div>`;
}

export function renderAkunAdminPage(u: any, d: {
  pembeli: any[]; penjual: any[]; sengketa: any[]; listings: any[]; ulasan: any[]; ledger: any[]; saldo: number;
}): string {
  const nama = u.shop_name || u.display_name || u.pen_name;
  return `<!DOCTYPE html>
<html lang="id" data-bs-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Akun @${escapeHtml(u.pen_name)} — Admin</title>
<script>(function(){try{var t=localStorage.getItem('owner-theme')||(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-bs-theme',t)}catch(e){}})();</script>
<link rel="stylesheet" href="/assets/tabler.min.css">
<style>${PAGE_CSS}</style></head>
<body>
<div class="wrap">
  <div class="d-flex align-items-center gap-2 mb-3">
    <a class="btn btn-sm btn-outline-secondary" href="/owner">← Kembali</a>
    <div>
      <div class="h2 mb-0">${escapeHtml(nama)}</div>
      <div class="muted">@${escapeHtml(u.pen_name)} · ${escapeHtml(u.email)} · ${escapeHtml(u.city || '—')} · sejak ${tgl(u.created_at)}</div>
    </div>
  </div>

  <div class="box"><h2>Status</h2>
    <div class="row"><span class="t">Penjual</span><span>${escapeHtml(u.seller_status || 'none')}${u.shop_name ? ' · ' + escapeHtml(u.shop_name) : ''}</span></div>
    ${u.seller_full_name ? `<div class="row"><span class="t">Nama KTP</span><span>${escapeHtml(u.seller_full_name)}</span></div>` : ''}
    ${u.seller_phone ? `<div class="row"><span class="t">WhatsApp</span><span class="num">${escapeHtml(u.seller_phone)}</span></div>` : ''}
    ${u.seller_bank_account ? `<div class="row"><span class="t">Rekening</span><span>${escapeHtml(u.seller_bank_name || '')} · <span class="num">${escapeHtml(u.seller_bank_account)}</span></span></div>` : ''}
    ${u.seller_reject_reason ? `<div class="row"><span class="t">Alasan penolakan terakhir</span><span>${escapeHtml(u.seller_reject_reason)}</span></div>` : ''}
    <div class="row"><span class="t">Saldo</span><span class="num">${rp(d.saldo)}</span></div>
    <div class="row"><span class="t">Dokumen</span><span>${u.seller_status === 'approved' ? 'disimpan 90 hari pasca-keputusan' : 'lihat di antrean verifikasi'}</span></div>
  </div>

  <div class="box"><h2>Sebagai pembeli (15 terakhir)</h2>
    ${daftar(d.pembeli, (o) => `<div class="row"><span><a href="/pasar/order/${escapeHtml(o.id)}">${escapeHtml(o.title)}</a><div class="muted">ke @${escapeHtml(o.lawan)} · ${tgl(o.created_at)}</div></span><span>${rp(Number(o.price) + Number(o.shipping || 0))}<div class="muted">${escapeHtml(STATUS[o.status] || o.status)}</div></span></div>`, 'Belum ada pembelian.')}
  </div>

  <div class="box"><h2>Sebagai penjual (15 terakhir)</h2>
    ${daftar(d.penjual, (o) => `<div class="row"><span><a href="/pasar/order/${escapeHtml(o.id)}">${escapeHtml(o.title)}</a><div class="muted">dari @${escapeHtml(o.lawan)} · ${tgl(o.created_at)}</div></span><span>${rp(Number(o.price) + Number(o.shipping || 0))}<div class="muted">${escapeHtml(STATUS[o.status] || o.status)}</div></span></div>`, 'Belum ada penjualan.')}
  </div>

  <div class="box"><h2>Sengketa</h2>
    ${daftar(d.sengketa, (o) => `<div class="row"><span><a href="/pasar/order/${escapeHtml(o.id)}">${escapeHtml(o.title)}</a><div class="muted">${tgl(o.updated_at)}</div></span><span class="pill">${escapeHtml(STATUS[o.status] || o.status)}</span></div>`, 'Tidak pernah tersangkut sengketa.')}
  </div>

  <div class="box"><h2>Listing</h2>
    ${daftar(d.listings, (l) => `<div class="row"><span><a href="/pasar/${escapeHtml(l.id)}">${escapeHtml(l.title)}</a><div class="muted">${tgl(l.created_at)} · ${escapeHtml(l.status)}</div></span><span class="num">${rp(l.price)}</span></div>`, 'Belum punya listing.')}
  </div>

  <div class="box"><h2>Ulasan diterima</h2>
    ${daftar(d.ulasan, (r) => `<div class="row"><span>${'★'.repeat(Number(r.stars))}${'☆'.repeat(5 - Number(r.stars))}<div class="muted">${escapeHtml(r.body || 'tanpa catatan')}</div></span><span class="muted">${tgl(r.created_at)}</span></div>`, 'Belum ada ulasan.')}
  </div>

  <div class="box"><h2>Mutasi saldo (15 terakhir)</h2>
    ${daftar(d.ledger, (l) => `<div class="row"><span>${escapeHtml(l.kind)}${l.order_id ? ` · <a href="/pasar/order/${escapeHtml(l.order_id)}">pesanan</a>` : ''}<div class="muted">${tgl(l.created_at)}</div></span><span class="num">${Number(l.delta) > 0 ? '+' : ''}${rp(l.delta)}</span></div>`, 'Belum ada mutasi saldo.')}
  </div>
</div>
</body></html>`;
}
