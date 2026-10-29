// Dashboard penjual — satu pintu: pesanan, buku, saldo.
// Hanya untuk penjual approved; gate-nya di route (/toko), bukan di sini.
import { escapeHtml } from '../lib/sanitize';
import { PASAR_FEE } from '../lib/pasar-settlement';
import { PASAR_BASE_CSS, rupiah } from './pasar';
import { kelompokPesanan, ringkasToko, type Kelompok } from '../lib/toko';

const PAGE_CSS = `
  .wrap{width:min(680px,calc(100% - 26px));margin:auto;padding:16px 0 40px}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin:4px 0 16px}
  .head h1{margin:0;font:700 clamp(34px,6vw,48px)/.98 'Newsreader';letter-spacing:-.035em}
  .head .sub{margin:5px 0 0;font-size:12px;font-weight:700;color:#64748B}
  .verif{display:inline-flex;align-items:center;gap:5px;font:800 9.5px 'Roboto Mono';letter-spacing:.05em;text-transform:uppercase;
    background:#DCFCE7;border:2px solid #0B192C;padding:4px 8px;box-shadow:2px 2px 0 #26364A;white-space:nowrap;margin-top:2px}
  .verif svg{width:11px;height:11px;stroke:#0B192C;stroke-width:3;fill:none}

  .dash{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 6px}
  .dbox{border:2.5px solid #0B192C;box-shadow:4px 5px 0 #26364A;padding:10px 12px;background:#fff}
  .dbox .dk{font:700 9px 'Roboto Mono';letter-spacing:.06em;text-transform:uppercase;color:#64748B}
  .dbox .dn{font:400 19px 'Archivo Black';margin-top:3px;letter-spacing:-.02em}
  .d-saldo{background:#DCFCE7}.d-escrow{background:#FEF3C7}.d-gmv{background:#DBEAFE}.d-produk{background:#fff}
  .dash-hint{font:600 9.5px 'DM Sans';color:#64748B;margin:0 0 12px;line-height:1.45}
  .stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-bottom:14px}
  .stat{background:#fff;border:2.5px solid #0B192C;box-shadow:4px 5px 0 #26364A;padding:12px 12px 11px;min-width:0;display:flex;flex-direction:column;justify-content:space-between;gap:8px}
  .stat .n{font:400 clamp(17px,4.6vw,21px)/1.05 'Archivo Black';color:#0F3E99;letter-spacing:-.02em;overflow-wrap:anywhere}
  .stat .k{font:700 8.5px/1.45 'Roboto Mono';letter-spacing:.05em;text-transform:uppercase;color:#64748B;min-height:24px}
  .stat.urgent .n{color:#92400E}
  .stat.potong .n{font-size:clamp(14px,3.8vw,17px)}

  .strip{display:flex;align-items:center;gap:10px;border:2.5px solid #0B192C;padding:11px 12px;margin-bottom:12px;
    font-size:12px;font-weight:800;line-height:1.45;box-shadow:4px 5px 0 #26364A;text-decoration:none;color:#0B192C}
  .strip.warn{background:#FDE047}
  .strip.danger{background:#FEE2E2}
  .strip svg{width:16px;height:16px;flex:none;stroke:#0B192C;stroke-width:2.6;fill:none}
  .strip span{min-width:0}
  .strip .go{margin-left:auto;flex:none;font:800 10px 'Roboto Mono';white-space:nowrap;padding-left:4px}

  .tabs-seller{display:grid;grid-template-columns:repeat(3,1fr);border:2.5px solid #0B192C;background:#fff;box-shadow:4px 5px 0 #26364A;margin-bottom:14px}
  .tabs-seller .tab{padding:9px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    font:800 11px/1.2 'DM Sans';color:#0B192C;text-decoration:none;border-right:2px solid #0B192C}
  .tabs-seller .tab:last-child{border-right:0}
  .tabs-seller .tab .c{font:700 9px 'Roboto Mono';color:#64748B;line-height:1}
  .tabs-seller .tab.on{background:#1D61E7;color:#fff}
  .tabs-seller .tab.on .c{color:#DBEAFE}

  .sec{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:18px 0 9px}
  .sec h2{margin:0;font:700 19px 'Newsreader';letter-spacing:-.02em}
  .sec .n{font:700 10px 'Roboto Mono';color:#64748B;position:relative;top:-1px}

  .o-card,.b-row{display:flex;gap:11px;align-items:center;background:#fff;border:2.5px solid #0B192C;
    box-shadow:4px 5px 0 #26364A;padding:11px 12px;margin-bottom:9px;text-decoration:none;color:#0B192C}
  .b-row{cursor:pointer}
  .o-card:active,.b-row:active{transform:translate(2px,3px);box-shadow:none}
  .o-main{min-width:0;flex:1}
  .o-title{font:700 15px/1.2 'Newsreader';display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .o-sub{font:600 10.5px 'DM Sans';color:#64748B;margin-top:4px;overflow-wrap:anywhere}
  .o-right{flex:none;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
  .o-amt{font:400 14px 'Archivo Black';color:#0F3E99;letter-spacing:-.01em}
  .o-net{font:600 9.5px 'Roboto Mono';color:#64748B;margin-top:2px}
  .chip{display:inline-block;font:800 8.5px 'Roboto Mono';letter-spacing:.04em;text-transform:uppercase;
    border:2px solid #0B192C;padding:2px 6px;margin-bottom:5px;white-space:nowrap}
  .chip.sm{min-width:66px;text-align:center;font-size:8px;padding:3px 5px;margin:0}
  .chip.perlu{background:#FDE047}.chip.kirim{background:#DBEAFE}.chip.selesai{background:#DCFCE7}
  .chip.refund{background:#FEE2E2}.chip.sengketa{background:#FED7AA}.chip.off{background:#E2E8F0}

  .thumb{width:44px;height:56px;flex:none;border:2px solid #0B192C;background:#EEF2F7;overflow:hidden;
    display:grid;place-items:center;font:900 15px 'Archivo Black';color:#94A3B8}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .b-main{min-width:0;flex:1}
  .b-title{font:700 14px/1.25 'Newsreader';display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  .b-meta{font:600 10.5px 'DM Sans';color:#64748B;margin-top:4px}
  .mini{margin-top:7px;font:900 10px 'DM Sans';background:#fff;border:2px solid #0B192C;padding:4px 8px;
    box-shadow:2px 2px 0 #26364A;cursor:pointer}
  .mini:active{transform:translate(1px,2px);box-shadow:none}
  .mini.danger{background:#FEE2E2;color:#991B1B;border-color:#991B1B}

  .empty{background:#F8FAFC;border:2px dashed #CBD5E1;padding:18px 14px;text-align:center;
    font-size:12px;font-weight:700;color:#64748B;line-height:1.6;margin-bottom:9px}
  .actions{display:grid;gap:9px;margin-top:20px}
  .btn{min-height:48px;border:3px solid #0B192C;padding:11px 15px;font:900 13.5px 'DM Sans';cursor:pointer;
    box-shadow:4px 5px 0 #26364A;display:flex;justify-content:center;align-items:center;gap:8px;text-decoration:none}
  .btn:active{transform:translate(2px,3px);box-shadow:none}
  .btn.primary{background:#1D61E7;color:#fff}
  .btn.ghost{background:#fff;color:#0B192C}
  .btn svg{width:15px;height:15px;stroke:currentColor;stroke-width:2.6;fill:none}
  @media(max-width:380px){.stat{padding:9px 9px}.o-amt{font-size:12.5px}}
`;

const CHIP: Record<string, { cls: string; label: string }> = {
  paid: { cls: 'perlu', label: 'Perlu dikirim' },
  handed: { cls: 'kirim', label: 'Dikirim' },
  completed: { cls: 'selesai', label: 'Selesai' },
  refunded: { cls: 'refund', label: 'Refund' },
  disputed: { cls: 'sengketa', label: 'Sengketa' },
  expired: { cls: 'off', label: 'Kedaluwarsa' },
};

const LISTING_STATUS: Record<string, { cls: string; label: string }> = {
  active: { cls: 'selesai', label: 'Aktif' },
  sold: { cls: 'off', label: 'Terjual' },
  hidden: { cls: 'off', label: 'Disembunyikan' },
};

const TAB_LABEL: Record<Kelompok, string> = { perlu: 'Perlu dikirim', kirim: 'Dikirim', selesai: 'Selesai' };

function tanggal(iso: any): string {
  const s = String(iso || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return '';
  const [y, m, d] = s.split('-');
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(m) - 1] || m;
  return `${Number(d)} ${bulan} ${y}`;
}

export function renderTokoPage(user: any, orders: any[], listings: any[], saldo: number, tab: string, embed = false, angka: { gmv?: number; escrow?: number } = {}): string {
  const bukuAktif = (listings || []).filter((l) => l.status === 'active').length;
  const r = ringkasToko(orders, saldo, bukuAktif);
  const aktif: Kelompok = (['perlu', 'kirim', 'selesai'] as Kelompok[]).includes(tab as Kelompok) ? (tab as Kelompok) : 'perlu';
  const daftar = kelompokPesanan(orders, aktif);
  const sengketa = (orders || []).filter((o) => String(o.status) === 'disputed');

  const orderCard = (o: any) => {
    const chip = CHIP[String(o.status)] || { cls: 'off', label: String(o.status) };
    const total = Number(o.price) + Number(o.shipping || 0);
    const net = total - PASAR_FEE;
    return `
      <a class="o-card" href="/pasar/order/${escapeHtml(o.id)}">
        <div class="o-main">
          <div class="o-title">${escapeHtml(o.title || 'Buku')}</div>
          <div class="o-sub">@${escapeHtml(o.buyer_name || 'pembeli')}${o.created_at ? ' · ' + tanggal(o.created_at) : ''}</div>
        </div>
        <div class="o-right">
          <span class="chip ${chip.cls}">${chip.label}</span>
          <div class="o-amt">${rupiah(total)}</div>
          ${String(o.status) === 'completed' ? `<div class="o-net">cair ${rupiah(net)}</div>` : ''}
        </div>
      </a>`;
  };

  const bukuRow = (l: any) => {
    let keys: string[] = [];
    try { keys = JSON.parse(l.photos || '[]'); } catch { keys = []; }
    const st = LISTING_STATUS[String(l.status)] || { cls: 'off', label: String(l.status) };
    const jml = Number(l.jumlah_pesanan || 0);
    const stock = Number(l.stock || 0);
    const edit = l.status === 'sold' ? ''
      : `<a class="mini" href="/pasar/listing/${escapeHtml(l.id)}/edit" onclick="event.stopPropagation()" style="display:inline-block;text-decoration:none;">Edit</a>`;
    const aksi = l.status === 'active'
      ? `${edit} <button class="mini" onclick="event.stopPropagation();setListing('${escapeHtml(l.id)}','hidden',this)">Sembunyikan</button> <button class="mini danger" onclick="event.stopPropagation();hapusListing('${escapeHtml(l.id)}',this)">Hapus</button>`
      : l.status === 'hidden'
        ? `${edit} <button class="mini" onclick="event.stopPropagation();setListing('${escapeHtml(l.id)}','active',this)">Aktifkan</button> <button class="mini danger" onclick="event.stopPropagation();hapusListing('${escapeHtml(l.id)}',this)">Hapus</button>`
        : edit;
    return `
      <div class="b-row" onclick="location.href='/pasar/${escapeHtml(l.id)}'">
        <div class="thumb">${keys[0] ? `<img src="/media/${escapeHtml(keys[0])}" alt="" loading="lazy">` : escapeHtml(String(l.title || '?').charAt(0).toUpperCase())}</div>
        <div class="b-main">
          <div class="b-title">${escapeHtml(l.title || 'Buku')}</div>
          <div class="b-meta">${rupiah(Number(l.price))} · ${stock > 0 ? `Stok ${stock}` : 'HABIS'}${jml ? ` · ${jml} pesanan` : ' · belum ada pesanan'}</div>
          ${aksi}
        </div>
        <span class="chip sm ${st.cls}">${st.label}</span>
      </div>`;
  };

  const inner = `<div class="wrap">
  ${embed ? '' : `<div class="head">
    <div style="min-width:0;">
      <h1>Toko Saya</h1>
      <p class="sub">${user.shop_name ? `<b>${escapeHtml(user.shop_name)}</b> · ` : ''}@${escapeHtml(user.pen_name || '')}</p>
    </div>
    <span class="verif"><svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>Terverifikasi</span>
  </div>`}

  <div class="dash">
    <div class="dbox d-saldo"><div class="dk">Saldo</div><div class="dn">${rupiah(r.saldo)}</div></div>
    <div class="dbox d-escrow"><div class="dk">Escrow</div><div class="dn">${rupiah(Number(angka.escrow || 0))}</div></div>
    <div class="dbox d-gmv"><div class="dk">GMV</div><div class="dn">${rupiah(Number(angka.gmv || 0))}</div></div>
    <div class="dbox d-produk"><div class="dk">Produk</div><div class="dn">${r.bukuAktif}</div></div>
  </div>
  <div class="dash-hint">Escrow = uang pembeli yang ditahan rekber. GMV = total nilai transaksi selesai.</div>

  ${r.perlu > 0 ? `<a class="strip warn" href="/toko?tab=perlu">
    <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    <span>${r.perlu} pesanan belum dikirim</span><span class="go">Kirim &rsaquo;</span></a>` : ''}

  ${r.disputed > 0 ? `<a class="strip danger" href="/toko?tab=selesai">
    <svg viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>
    <span>${r.disputed} pesanan menunggu owner</span><span class="go">Lihat &rsaquo;</span></a>` : ''}

  <div class="tabs-seller">
    ${(['perlu', 'kirim', 'selesai'] as Kelompok[]).map((k) => `
      <a class="tab ${aktif === k ? 'on' : ''}" href="/pasar/saya?tab=toko&sub=${k}">${TAB_LABEL[k]}<span class="c">${r[k]}</span></a>`).join('')}
  </div>

  ${daftar.length ? daftar.map(orderCard).join('') : `<div class="empty">${aktif === 'perlu'
    ? 'Tidak ada pesanan yang menunggu dikirim.<br>Bagikan link bukumu supaya ada yang beli.'
    : aktif === 'kirim' ? 'Belum ada paket di jalan.' : 'Belum ada pesanan selesai.'}</div>`}

  <div class="sec"><h2>Buku Saya</h2><span class="n">${(listings || []).length} judul</span></div>
  ${(listings || []).length ? listings.map(bukuRow).join('') : `<div class="empty">Kamu belum memasang buku.</div>`}

  <div class="actions">
    <a class="btn primary" href="/pasar/jual"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Jual Buku</a>
    <a class="btn ghost" href="/saldo"><svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Saldo &amp; Tarik Dana</a>
  </div>
</div>
<script>
async function setListing(id, status, btn){
  btn.disabled = true;
  var r = await fetch('/api/pasar/listings/' + id + '/status', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:status})});
  var j = await r.json().catch(function(){ return {}; });
  if (r.ok) { location.reload(); return; }
  alert(j.error || 'Gagal mengubah status buku.');
  btn.disabled = false;
}
async function hapusListing(id, btn){
  if (!confirm('Hapus listing ini dari Pasar Buku? Riwayat pesanan tetap tersimpan.')) return;
  btn.disabled = true;
  var r = await fetch('/api/pasar/listings/' + id, {method:'DELETE'});
  var j = await r.json().catch(function(){ return {}; });
  if (r.ok) { location.reload(); return; }
  alert(j.error || 'Gagal menghapus listing.');
  btn.disabled = false;
}
</script>`;

  if (embed) return inner;
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Toko Saya — Pasar Buku BERBIRRU</title>
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
${inner}
</body></html>`;
}
export { PAGE_CSS as TOKO_CSS };
