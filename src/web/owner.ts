// Halaman owner: putuskan sengketa (refund / lepas dana) + setujui pencairan saldo penjual.
import { escapeHtml } from '../lib/sanitize';
import { BRAND_HEADER, PASAR_BASE_CSS, rupiah } from './pasar';

const PAGE_CSS = `
  .wrap{width:min(760px,calc(100% - 28px));margin:auto;padding:18px 0 120px}
  .page-head{margin:8px 0 22px}.page-head h1{margin:0 0 8px;font:700 clamp(36px,6vw,56px)/.95 'Newsreader';letter-spacing:-.04em}
  .page-head p{margin:0;color:#52627A;line-height:1.6}
  .st-card{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;padding:18px;margin-bottom:16px}
  .st-big{font:700 20px 'Newsreader'}.st-sub{font-size:12px;font-weight:600;color:#475569;margin-top:6px;line-height:1.55}
  .kw{background:#FFFDF2;border:2px solid #0B192C;padding:10px 12px;font-size:12px;font-weight:600;line-height:1.6;color:#334155;margin-top:10px;word-break:break-word}
  .sum-row{display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;padding:3px 0;color:#334155}
  .sum-row.tot{border-top:2px dashed #0B192C;margin-top:8px;padding-top:9px;font:400 15px 'Archivo Black';color:#0F3E99}
  .btns{display:flex;gap:10px;margin-top:12px}
  .btn{flex:1;min-height:46px;border:3px solid #0B192C;padding:10px 12px;font-size:13px;font-weight:900;cursor:pointer;box-shadow:3px 4px 0 #26364A;font-family:inherit;background:#fff;color:#0B192C}
  .btn.b-blue{background:#1D61E7;color:#fff}.btn.b-red{background:#B42318;color:#fff}
  .btn.b-green{background:#0F7A3D;color:#fff}.btn:active{transform:translate(2px,3px);box-shadow:none}
  .lbl{font:700 10px 'Roboto Mono';color:#64748B;letter-spacing:.06em;text-transform:uppercase}
  .empty{color:#64748B;font-size:12.5px;font-weight:600;padding:10px 0}
  .err{color:#B42318;font-weight:700;font-size:12.5px;margin-top:10px}
`;

export function renderOwnerPage(disputes: any[], withdrawals: any[], calonPenjual: any[] = []): string {
  const dispCards = (disputes || []).map((o) => `
    <div class="st-card">
      <div class="lbl">Sengketa · ${escapeHtml(String(o.updated_at || '').slice(0, 16).replace('T', ' '))}</div>
      <div class="st-big">${escapeHtml(o.title || 'Buku')}</div>
      <div class="st-sub">Pembeli @${escapeHtml(o.buyer_name || '?')} · Penjual @${escapeHtml(o.seller_name || '?')}</div>
      <div class="kw">${escapeHtml(o.kesepakatan || '—')}</div>
      ${o.kurir ? `<div class="st-sub">${escapeHtml(o.kurir)} · resi ${escapeHtml(o.resi || '—')}</div>` : ''}
      <div class="sum-row"><span>Harga buku</span><span>${rupiah(Number(o.price))}</span></div>
      <div class="sum-row"><span>Ongkir</span><span>${rupiah(Number(o.shipping || 0))}</span></div>
      <div class="sum-row tot"><span>Dana ditahan</span><span>${rupiah(Number(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0)))}</span></div>
      <div class="btns">
        <button class="btn b-red" onclick="resolve('${escapeHtml(o.id)}','refund',this)">Refund Pembeli</button>
        <button class="btn b-green" onclick="resolve('${escapeHtml(o.id)}','release',this)">Lepas ke Penjual</button>
      </div>
    </div>`).join('') || `<div class="empty">Tidak ada sengketa menunggu.</div>`;

  const wdCards = (withdrawals || []).map((w) => `
    <div class="st-card">
      <div class="lbl">Pencairan · ${escapeHtml(String(w.requested_at || '').slice(0, 16).replace('T', ' '))}</div>
      <div class="st-big">${rupiah(Number(w.amount))}</div>
      <div class="st-sub">@${escapeHtml(w.pen_name || '?')} · ${escapeHtml(w.method || 'qris')} · ${escapeHtml(w.account || '—')}</div>
      <div class="btns">
        <button class="btn b-green" onclick="settle('${escapeHtml(w.id)}','pay',this)">Sudah Ditransfer</button>
        <button class="btn b-red" onclick="settle('${escapeHtml(w.id)}','reject',this)">Tolak</button>
      </div>
    </div>`).join('') || `<div class="empty">Tidak ada permintaan pencairan.</div>`;

  const sellerCards = (calonPenjual || []).map((u) => `
    <div class="st-card">
      <div class="lbl">Pengajuan · ${escapeHtml(String(u.seller_applied_at || '').slice(0, 16).replace('T', ' '))}</div>
      <div class="st-big">${escapeHtml(u.shop_name || '(tanpa nama toko)')}</div>
      <div class="st-sub">${escapeHtml(u.seller_full_name || u.pen_name)} · @${escapeHtml(u.pen_name)} · ${escapeHtml(u.city || '-')} · ${Number(u.listing_aktif || 0)} listing aktif</div>
      <div class="kw">WA: ${escapeHtml(u.seller_phone || '—')}${u.seller_note ? `\n\n${escapeHtml(u.seller_note)}` : ''}</div>
      <div class="btns">
        <button class="btn b-green" onclick="reviewSeller('${escapeHtml(u.id)}','approve',this)">Setujui</button>
        <button class="btn b-red" onclick="reviewSeller('${escapeHtml(u.id)}','reject',this)">Tolak</button>
      </div>
    </div>`).join('') || `<div class="empty">Tidak ada pengajuan penjual.</div>`;

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Owner — Pasar Buku BERBIRRU</title>
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
${BRAND_HEADER}
<div class="wrap">
  <div class="page-head"><h1>Owner</h1><p>Putuskan sengketa dan cairkan saldo penjual. Keputusan tercatat di riwayat pesanan.</p></div>
  <div class="err" id="err"></div>

  <div class="st-big" style="margin:18px 0 10px;">Verifikasi Penjual</div>
  ${sellerCards}

  <div class="st-big" style="margin:26px 0 10px;">Sengketa Menunggu</div>
  ${dispCards}

  <div class="st-big" style="margin:26px 0 10px;">Pencairan Menunggu</div>
  ${wdCards}
</div>
<script>
function err(t){document.getElementById('err').textContent=t||''}
async function post(url,body){
  err('');
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){err(j.error||'Gagal.');return false}
  location.reload(); return true;
}
async function resolve(id,decision,btn){
  if(decision==='refund' && !confirm('Refund ke pembeli? Dana tidak akan dilepas ke penjual.')) return;
  btn.disabled=true; await post('/api/owner/orders/'+id+'/resolve',{decision});
}
async function reviewSeller(id,decision,btn){
  let reason='';
  if(decision==='reject'){
    reason=(prompt('Alasan penolakan (dikirim ke penjual):')||'').trim();
    if(reason.length<5){err('Alasan penolakan minimal 5 karakter.');return}
  } else if(!confirm('Setujui akun ini sebagai penjual? Dia bisa langsung memasang buku.')) return;
  btn.disabled=true; await post('/api/owner/sellers/'+id+'/review',{decision,reason});
}
async function settle(id,decision,btn){
  if(decision==='pay' && !confirm('Pastikan transfer sudah benar-benar terkirim ke tujuan penjual.')) return;
  btn.disabled=true; await post('/api/owner/withdrawals/'+id+'/settle',{decision});
}
</script>
</body></html>`;
}
