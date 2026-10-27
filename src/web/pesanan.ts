// Daftar pesanan pembeli — satu tempat untuk melihat & melanjutkan pembayaran.
import { escapeHtml } from '../lib/sanitize';
import { PASAR_FEE } from '../lib/pasar-settlement';
import { PASAR_BASE_CSS, rupiah } from './pasar';
import { kelompokPesananBeli, ringkasBeli, type KelompokBeli } from '../lib/toko';

const PAGE_CSS = `
  .wrap{width:min(680px,calc(100% - 26px));margin:auto;padding:16px 0 40px}
  .head{margin:4px 0 16px}.head h1{margin:0;font:700 clamp(34px,6vw,48px)/.98 'Newsreader';letter-spacing:-.035em}
  .head p{margin:6px 0 0;font-size:12px;font-weight:700;color:#64748B}
  .tabs{display:grid;grid-template-columns:repeat(4,1fr);border:2.5px solid #0B192C;background:#fff;box-shadow:4px 5px 0 #26364A;margin-bottom:14px}
  .tab{padding:8px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
    font:800 9.5px/1.15 'DM Sans';letter-spacing:-.01em;color:#0B192C;text-decoration:none;border-right:2px solid #0B192C;text-align:center}
  .tab:last-child{border-right:0}.tab .c{font:700 9px 'Roboto Mono';color:#64748B}
  .tab.on{background:#1D61E7;color:#fff}.tab.on .c{color:#DBEAFE}
  .o-card{display:flex;gap:11px;align-items:center;background:#fff;border:2.5px solid #0B192C;
    box-shadow:4px 5px 0 #26364A;padding:10px 12px;margin-bottom:9px;text-decoration:none;color:#0B192C}
  .o-card:active{transform:translate(2px,3px);box-shadow:none}
  .o-main{min-width:0;flex:1}
  .o-title{font:700 15px/1.2 'Newsreader';display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .o-sub{font:600 10.5px 'DM Sans';color:#64748B;margin-top:4px;overflow-wrap:anywhere}
  .o-right{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
  .o-amt{font:400 14px 'Archivo Black';color:#0F3E99}
  .chip{display:inline-block;font:800 8.5px 'Roboto Mono';letter-spacing:.04em;text-transform:uppercase;
    border:2px solid #0B192C;padding:2px 6px;white-space:nowrap}
  .chip.bayar{background:#FEF3C7}.chip.proses{background:#DBEAFE}.chip.kirim{background:#E0E7FF}
  .chip.selesai{background:#DCFCE7}.chip.refund{background:#FEE2E2}.chip.sengketa{background:#FED7AA}
  .cta{display:inline-block;align-self:flex-start;margin-top:6px;font:900 10.5px 'DM Sans';background:#FDE047;border:2px solid #0B192C;padding:5px 9px;box-shadow:2px 2px 0 #26364A}
  .empty{background:#F8FAFC;border:2px dashed #CBD5E1;padding:18px 14px;text-align:center;font-size:12px;font-weight:700;color:#64748B;line-height:1.6}
  .back{display:inline-block;font:800 11px 'DM Sans';color:#64748B;text-decoration:none;margin-bottom:6px}
`;

const LABEL: Record<string, { cls: string; text: string }> = {
  created: { cls: 'bayar', text: 'Belum dibayar' },
  paid: { cls: 'proses', text: 'Diproses' },
  handed: { cls: 'kirim', text: 'Dikirim' },
  completed: { cls: 'selesai', text: 'Selesai' },
  refunded: { cls: 'refund', text: 'Dana kembali' },
  disputed: { cls: 'sengketa', text: 'Sengketa' },
};

const TAB: Record<KelompokBeli, string> = { bayar: 'Belum bayar', proses: 'Diproses', kirim: 'Dikirim', selesai: 'Selesai' };

function tanggal(iso: any): string {
  const s = String(iso || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const [y, m, d] = s.split('-');
  return `${Number(d)} ${['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(m) - 1] || m} ${y}`;
}

export function renderPesananPage(user: any, orders: any[], tab: string, embed = false): string {
  const r = ringkasBeli(orders);
  const aktif: KelompokBeli = (['bayar', 'proses', 'kirim', 'selesai'] as KelompokBeli[]).includes(tab as KelompokBeli) ? (tab as KelompokBeli) : 'bayar';
  const daftar = kelompokPesananBeli(orders, aktif);

  const card = (o: any) => {
    const lb = LABEL[String(o.status)] || { cls: 'proses', text: String(o.status) };
    // angka yang benar-benar ditagih kalau QR sudah dibuat
    const total = Number(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0));
    return `
      <a class="o-card" href="/pasar/order/${escapeHtml(o.id)}">
        <div class="o-main">
          <div class="o-title">${escapeHtml(o.title || 'Buku')}</div>
          <div class="o-sub">Toko @${escapeHtml(o.seller_name || 'penjual')}${o.created_at ? ' · ' + tanggal(o.created_at) : ''}</div>
          ${String(o.status) === 'created' ? '<span class="cta">Lanjut bayar &rarr;</span>' : ''}
        </div>
        <div class="o-right">
          <span class="chip ${lb.cls}">${lb.text}</span>
          <div class="o-amt">${rupiah(total)}</div>
        </div>
      </a>`;
  };

  const inner = `<div class="wrap">
  ${embed ? '' : '<a class="back" href="/pasar">&larr; Pasar Buku</a>'}
  ${embed ? '' : '<div class="head"><h1>Pesanan Saya</h1><p>Uang ditahan rekber sampai kamu konfirmasi buku diterima.</p></div>'}

  <div class="tabs">
    ${(['bayar', 'proses', 'kirim', 'selesai'] as KelompokBeli[]).map((k) => `
      <a class="tab ${aktif === k ? 'on' : ''}" href="/pasar/saya?tab=pesanan&sub=${k}">${TAB[k]}<span class="c">${r[k]}</span></a>`).join('')}
  </div>

  ${daftar.length ? daftar.map(card).join('') : `<div class="empty">${aktif === 'bayar'
    ? 'Tidak ada pesanan yang menunggu pembayaran.'
    : aktif === 'proses' ? 'Belum ada pesanan yang sedang diproses penjual.'
    : aktif === 'kirim' ? 'Tidak ada paket di jalan.'
    : 'Belum ada pesanan selesai.'}</div>`}
</div>`;

  if (embed) return inner;
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pesanan Saya — Pasar Buku BERBIRRU</title>
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
${inner}
</body></html>`;
}
export { PAGE_CSS as PESANAN_CSS };
