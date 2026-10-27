// Pusat Pasar Buku — satu halaman untuk pesanan, toko, saldo, dan aktivitas transaksi.
// Isi tiap tab memakai renderer yang sudah ada (mode embed), jadi tidak ada duplikasi markup.
import { escapeHtml } from '../lib/sanitize';
import { renderBottomNav } from './layout';
import { PASAR_BASE_CSS } from './pasar';
import { renderPesananPage, PESANAN_CSS } from './pesanan';
import { ringkasBeli } from '../lib/toko';
import { renderTokoPage, TOKO_CSS } from './toko';
import { renderSaldoPage, SALDO_CSS } from './saldo';

const SHELL_CSS = `
  .wrap{width:min(680px,calc(100% - 26px));margin:auto;padding:16px 0 40px}
  .wrap.hub-top{padding-bottom:0}
  .hub-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin:4px 0 14px}
  .hub-head h1{margin:0;font:700 clamp(32px,5.8vw,44px)/.98 'Newsreader';letter-spacing:-.035em}
  .hub-head .sub{margin:5px 0 0;font-size:12px;font-weight:700;color:#64748B}
  .verif{display:inline-flex;align-items:center;gap:5px;font:800 9px 'Roboto Mono';letter-spacing:.05em;text-transform:uppercase;
    background:#DCFCE7;border:2px solid #0B192C;padding:4px 7px;box-shadow:2px 2px 0 #26364A;white-space:nowrap;margin-top:2px}
  .verif svg{width:10px;height:10px;stroke:#0B192C;stroke-width:3;fill:none}
  .verif.gate{background:#FDE047}
  .hub-body{padding-top:14px}
  .hub-body .wrap{padding-top:0;padding-bottom:24px}
  .hub-tabs{display:grid;grid-template-columns:repeat(4,1fr);border:2.5px solid #0B192C;background:#fff;
    box-shadow:4px 5px 0 #26364A;margin-bottom:0}
  .hub-tab{padding:9px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    font:800 9.5px/1.15 'DM Sans';letter-spacing:-.01em;color:#0B192C;text-decoration:none;border-right:2px solid #0B192C;text-align:center;position:relative}
  .hub-tab:last-child{border-right:0}
  .hub-tab .c{font:700 9px 'Roboto Mono';color:#64748B}
  /* mode pasar: aksen kuning-amber, konsisten dengan navbar */
  .hub-tab.on{background:#B45309;color:#fff}.hub-tab.on .c{color:#FEF3C7}
  .hub-body .tab.on,.hub-body .tabs .tab.on,.hub-body .tabs-seller .tab.on{background:#B45309;color:#fff}
  .hub-body .tab.on .c,.hub-body .tabs .tab.on .c,.hub-body .tabs-seller .tab.on .c{color:#FEF3C7}
  .hub-tab.locked{color:#94A3B8}.hub-tab.locked .c{color:#CBD5E1}
  .hub-tab .dot{position:absolute;top:5px;right:6px;min-width:15px;height:15px;border-radius:9px;background:#B42318;color:#fff;
    font:800 9px/15px 'Roboto Mono';text-align:center;padding:0 3px;border:1.5px solid #fff}
  .akt{display:flex;gap:10px;align-items:flex-start;background:#fff;border:2.5px solid #0B192C;box-shadow:4px 5px 0 #26364A;
    padding:11px 12px;margin-bottom:9px;text-decoration:none;color:#0B192C}
  .akt:active{transform:translate(2px,3px);box-shadow:none}
  .akt .ic{width:26px;height:26px;flex:none;display:grid;place-items:center;border:2px solid #0B192C;background:#DBEAFE}
  .akt .ic svg{width:13px;height:13px;stroke:#0B192C;stroke-width:2.4;fill:none}
  .akt .tx{min-width:0;flex:1}
  .akt .t1{font:700 12.5px/1.35 'DM Sans'}
  .akt .t2{font:600 10.5px 'DM Sans';color:#64748B;margin-top:3px;overflow-wrap:anywhere}
  .akt.unread{border-left:6px solid #1D61E7}
  .akt .go{font:800 10px 'Roboto Mono';color:#94A3B8;align-self:center}
  .akt-bar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 0 10px}
  .akt-bar .lbl{font:700 10px 'Roboto Mono';color:#64748B;letter-spacing:.04em;text-transform:uppercase}
  .akt-bar button{font:900 10.5px 'DM Sans';background:#fff;border:2px solid #0B192C;padding:5px 9px;box-shadow:2px 2px 0 #26364A;cursor:pointer}
  .akt-bar button:active{transform:translate(1px,2px);box-shadow:none}
  .shop-link{background:#fff;border:2.5px solid #0B192C;box-shadow:4px 5px 0 #26364A;padding:12px;margin-top:4px}
  .shop-link .sl-t{font:800 9.5px 'Roboto Mono';color:#64748B;letter-spacing:.05em;text-transform:uppercase}
  .shop-link .sl-u{font:700 12px 'Roboto Mono';color:#0F3E99;margin-top:5px;overflow-wrap:anywhere}
  .shop-link .sl-b{display:flex;gap:8px;margin-top:9px}
  .shop-link .sl-b a,.shop-link .sl-b button{flex:1;min-height:38px;display:inline-flex;align-items:center;justify-content:center;
    border:2px solid #0B192C;background:#fff;font:900 11px 'DM Sans';color:#0B192C;text-decoration:none;cursor:pointer;box-shadow:2px 2px 0 #26364A}
  .shop-link .sl-b a{background:#1D61E7;color:#fff}
  .jual-cta{display:block;text-align:center;font:800 11px 'DM Sans';color:#0B192C;text-decoration:none;
    background:#FFFDF2;border:2px dashed #94A3B8;padding:11px;margin-top:4px}
  .locked-box{background:#FFFDF2;border:2.5px solid #0B192C;box-shadow:4px 5px 0 #26364A;padding:16px}
  .locked-box h2{margin:0 0 6px;font:700 20px 'Newsreader'}
  .locked-box p{margin:0 0 12px;font-size:12.5px;font-weight:600;color:#475569;line-height:1.6}
  .locked-box a{display:inline-flex;min-height:44px;align-items:center;background:#1D61E7;color:#fff;border:2.5px solid #0B192C;
    padding:9px 14px;font:900 12.5px 'DM Sans';text-decoration:none;box-shadow:3px 3px 0 #26364A}
  .cari-wrap{margin:0 0 12px}
  .cari-wrap input{width:100%;min-height:44px;border:2.5px solid #0B192C;border-radius:8px;padding:10px 12px;font:600 13.5px 'DM Sans';background:#fff}
  .empty-akt{background:#F8FAFC;border:2px dashed #CBD5E1;padding:18px 14px;text-align:center;font:700 12px 'DM Sans';color:#64748B;line-height:1.6}
`;

const AKT_LABEL: Record<string, string> = {
  order_paid: 'Pesanan dibayar — siap dikirim',
  order_handed: 'Paket dikirim penjual',
  order_done: 'Pesanan selesai — dana cair',
  order_dispute: 'Sengketa pesanan dibuka',
  order_refund: 'Refund masuk saldo kamu',
  order_cancel: 'Pembeli membatalkan pesanan sebelum dikirim',
  order_seller_approved: 'Toko kamu disetujui — buku sudah bisa dipasang',
  order_seller_rejected: 'Pengajuan toko ditolak — lihat alasan & ajukan ulang',
  order_withdraw_paid: 'Pencairan saldo sudah ditransfer',
  order_withdraw_reject: 'Pencairan saldo ditolak — saldo dikembalikan',
};

export interface HubData {
  pesanan: { orders: any[]; sub: string };
  toko: { orders: any[]; listings: any[]; gmv?: number; escrow?: number };
  saldo: { balance: number; ledger: any[]; withdrawals: any[]; ditahan?: any[] };
  aktivitas: { items: any[]; unread: number };
}

export function renderPasarSaya(user: any, tab: string, sub: string, d: HubData): string {
  const approved = user.seller_status === 'approved';
  // Pembeli biasa: hanya dua tab. Toko & Saldo tidak dirender sama sekali (bukan dinding "terkunci").
  const tabs: { key: string; label: string; count: string; dot?: number }[] = approved
    ? [
        { key: 'pesanan', label: 'Pesanan', count: String(Object.values(ringkasBeli(d.pesanan.orders)).reduce((a, b) => a + b, 0)) },
        { key: 'toko', label: 'Toko', count: String(d.toko.orders.filter((o: any) => ['created', 'paid', 'handed', 'disputed'].includes(String(o.status))).length) },
        { key: 'saldo', label: 'Saldo', count: 'Rp' + Number(d.saldo.balance || 0).toLocaleString('id-ID') },
        { key: 'aktivitas', label: 'Aktivitas', count: String(d.aktivitas.items.length), dot: d.aktivitas.unread },
      ]
    : [
        { key: 'pesanan', label: 'Pesanan', count: String(Object.values(ringkasBeli(d.pesanan.orders)).reduce((a, b) => a + b, 0)) },
        { key: 'saldo', label: 'Saldo', count: 'Rp' + Number(d.saldo.balance || 0).toLocaleString('id-ID') },
        { key: 'aktivitas', label: 'Aktivitas', count: String(d.aktivitas.items.length), dot: d.aktivitas.unread },
      ];
  const aktif = tabs.some((t) => t.key === tab) ? tab : 'pesanan';

  const tabBar = tabs.map((t) => `
    <a class="hub-tab ${aktif === t.key ? 'on' : ''}" href="/pasar/saya?tab=${t.key}">
      ${t.label}<span class="c">${t.count}</span>${t.dot ? `<span class="dot">${t.dot}</span>` : ''}
    </a>`).join('');

  // Ringkasan pembeli: uangku di mana + aktivitas belanja. Penjual pakai kotak di tab Toko.
  const beli = d.pesanan.orders || [];
  const uangDi = (st: string[]) => beli.filter((o: any) => st.includes(String(o.status)))
    .reduce((a: number, o: any) => a + Number(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0)), 0);
  const dashBeli = approved ? '' : `
  <div class="dash">
    <div class="dbox d-escrow"><div class="dk">Di rekber</div><div class="dn">${'Rp' + uangDi(['paid', 'handed', 'disputed']).toLocaleString('id-ID')}</div></div>
    <div class="dbox d-gmv"><div class="dk">Belanja</div><div class="dn">${'Rp' + uangDi(['completed']).toLocaleString('id-ID')}</div></div>
    <div class="dbox d-produk"><div class="dk">Berjalan</div><div class="dn">${beli.filter((o: any) => ['created', 'paid', 'handed'].includes(String(o.status))).length}</div></div>
    <div class="dbox d-saldo"><div class="dk">Selesai</div><div class="dn">${beli.filter((o: any) => String(o.status) === 'completed').length}</div></div>
  </div>
  <div class="dash-hint">Di rekber = uangmu yang masih ditahan. Belanja = total transaksi selesai.</div>`;

  let isi = '';
  if (aktif === 'pesanan') {
    isi = dashBeli + `<div class="cari-wrap"><input id="cariPesanan" type="search" placeholder="Cari judul buku di pesanan…" oninput="saringPesanan(this.value)"></div>`
      + renderPesananPage(user, d.pesanan.orders, sub || 'bayar', true);
  } else if (aktif === 'toko') {
    isi = renderTokoPage(user, d.toko.orders, d.toko.listings, d.saldo.balance, sub || 'perlu', true, { gmv: d.toko.gmv || 0, escrow: d.toko.escrow || 0 });
  } else if (aktif === 'saldo') {
    isi = renderSaldoPage(user, d.saldo.balance, d.saldo.ledger, d.saldo.withdrawals, true, d.saldo.ditahan || []);
  } else {
    const items = d.aktivitas.items || [];
    isi = `<div class="akt-bar"><span class="lbl">${items.length} aktivitas pesanan</span>
      ${d.aktivitas.unread > 0 ? '<button onclick="bacaSemua()">Tandai dibaca</button>' : ''}</div>` +
      (items.length ? items.map((n) => `
        <a class="akt ${n.is_read ? '' : 'unread'}" href="${n.order_id ? '/pasar/order/' + escapeHtml(n.order_id) : n.type === 'order_seller_approved' ? '/pasar/saya?tab=toko' : n.type === 'order_seller_rejected' ? '/pasar/jual' : '/pasar/saya?tab=saldo'}">
          <span class="ic"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></span>
          <span class="tx">
            <span class="t1">${escapeHtml(AKT_LABEL[n.type] || 'Pembaruan pesanan')}</span>
            <span class="t2">@${escapeHtml(n.actor_pen_name || '-')}${n.order_title ? ' · ' + escapeHtml(n.order_title) : ''} · ${escapeHtml(String(n.created_at || '').slice(0, 16).replace('T', ' '))}</span>
          </span>
          <span class="go">&rsaquo;</span>
        </a>`).join('') : '<div class="empty-akt">Belum ada aktivitas pesanan.</div>') +
      `<script>async function bacaSemua(){await fetch('/api/notifications/read-all?scope=pasar',{method:'POST'});location.reload()}</script>`;
  }

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pasar Saya — BERBIRRU</title>
${PASAR_BASE_CSS}
<style>${SHELL_CSS}${PESANAN_CSS}${TOKO_CSS}${SALDO_CSS}</style></head>
<body>
<div class="wrap hub-top">
  <div class="hub-head">
    <div style="min-width:0;">
      <h1>Pasar Saya</h1>
      <p class="sub">${user.shop_name ? `<b>${escapeHtml(user.shop_name)}</b> · ` : ''}@${escapeHtml(user.pen_name || '')}</p>
    </div>
    <span class="verif ${approved ? '' : 'gate'}">
      ${approved ? '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>Penjual' : 'Pembeli'}
    </span>
  </div>
  <div class="hub-tabs" style="grid-template-columns:repeat(${tabs.length},1fr)">${tabBar}</div>
</div>
<div class="hub-body">${isi}</div>
${approved && user.shop_slug ? `<div class="wrap" style="padding-top:0"><div class="shop-link">
      <div class="sl-t">Toko publik</div>
      <div class="sl-u">berbirru.com/toko/${escapeHtml(user.shop_slug)}</div>
      <div class="sl-b"><a href="/toko/${escapeHtml(user.shop_slug)}">Lihat</a><button type="button" onclick="salinToko(this)">Salin link</button></div>
    </div>
    <script>function salinToko(b){var u='https://'+location.host+'/toko/${escapeHtml(user.shop_slug)}';if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){b.textContent='Tersalin ✓'},function(){prompt('Salin:',u)})}else{prompt('Salin:',u)}}</script></div>` : ''}
${approved ? '' : `<div class="wrap" style="padding-top:0"><a class="jual-cta" href="/pasar">Mau jual buku juga? Ajukan verifikasi &rsaquo;</a></div>`}
<script>
function saringPesanan(q){
  var s=String(q||'').toLowerCase();
  document.querySelectorAll('.o-card').forEach(function(c){
    c.style.display = (!s || c.textContent.toLowerCase().indexOf(s)>=0) ? '' : 'none';
  });
}
</script>
${renderBottomNav('pasar', user, false, { mode: 'pasar', marketTab: (aktif === 'toko' ? 'toko' : aktif === 'pesanan' ? 'pesanan' : 'pasar') })}
</body></html>`;
}
