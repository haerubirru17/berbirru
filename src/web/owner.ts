// Halaman owner: putuskan sengketa (refund / lepas dana) + setujui pencairan saldo penjual.
// Setiap keputusan WAJIB disertai catatan — itu satu-satunya bukti kalau nanti ada protes.
import { escapeHtml } from '../lib/sanitize';
import { PASAR_BASE_CSS, rupiah } from './pasar';

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
  .ev{margin-top:12px;border:2px dashed #94A3B8;background:#F8FAFC;padding:0}
  .ev>summary{cursor:pointer;padding:9px 12px;font:800 10.5px 'DM Sans';letter-spacing:.02em;color:#0F3E99;list-style:none}
  .ev>summary::-webkit-details-marker{display:none}
  .ev>summary::before{content:'▸ ';font-size:11px}
  .ev[open]>summary::before{content:'▾ '}
  .ev .in{padding:0 12px 12px}
  .tl{list-style:none;margin:0;padding:0}
  .tl li{position:relative;padding:4px 0 4px 14px;font-size:11.5px;font-weight:600;color:#334155;line-height:1.5}
  .tl li::before{content:'';position:absolute;left:2px;top:10px;width:6px;height:6px;background:#1D61E7;border:1px solid #0B192C}
  .tl .t{font:700 9.5px 'Roboto Mono';color:#64748B}
  .meta{font:700 10.5px 'Roboto Mono';color:#475569;margin-top:8px;line-height:1.7}
  .warn{background:#FEF3C7;border:2px solid #B45309;color:#7C2D12;font:800 11px 'DM Sans';padding:8px 10px;margin-top:8px}
  .inp{width:100%;margin-top:6px;min-height:44px;padding:9px 11px;border:2.5px solid #0B192C;background:#fff;font:600 12.5px 'DM Sans';color:#0B192C;outline:none;box-sizing:border-box}
  textarea.inp{min-height:64px;resize:vertical}
  .inp:focus{box-shadow:3px 3px 0 #1D61E7}
  .field{margin-top:12px}
  .trk{margin-top:8px}
  .trk .row{border-left:3px solid #1D61E7;padding:5px 0 5px 10px;margin-bottom:6px;background:#F8FAFC}
  .trk .d{font:700 9.5px 'Roboto Mono';color:#64748B}
  .trk .m{font:700 11.5px 'DM Sans';color:#0B192C;line-height:1.45}
  .trk .l{font:600 10.5px 'DM Sans';color:#475569}
  .trk .bad{color:#B42318;font-weight:800;font-size:11.5px}
  .trk .ok{color:#0F7A3D;font-weight:800;font-size:11.5px}
`;

const rp = (n: any) => rupiah(Number(n || 0));
const tgl = (s: any) => escapeHtml(String(s || '').slice(0, 16).replace('T', ' '));

function stats(label: string, s: any): string {
  return `<div class="meta">${label}: ${Number(s?.selesai || 0)} transaksi selesai · ${Number(s?.sengketa || 0)} sengketa · akun sejak ${tgl(s?.sejak) || '—'}</div>`;
}

export function renderOwnerPage(disputes: any[], withdrawals: any[], calonPenjual: any[] = []): string {
  const dispCards = (disputes || []).map((o) => `
    <div class="st-card">
      <div class="lbl">Sengketa · ${tgl(o.updated_at)}</div>
      <div class="st-big">${escapeHtml(o.title || 'Buku')}</div>
      <div class="st-sub">Pembeli @${escapeHtml(o.buyer_name || '?')} · Penjual @${escapeHtml(o.seller_name || '?')}</div>
      <div class="kw">${escapeHtml(o.kesepakatan || '—')}</div>
      ${o.kurir && o.resi ? `<div class="st-sub">${escapeHtml(o.kurir)} · resi ${escapeHtml(o.resi)} · ${Number(o.resi_verified) ? 'terverifikasi kurir' : 'BELUM terverifikasi'}</div>
      <button class="btn b-blue" style="margin-top:8px" onclick="lacak('${escapeHtml(o.id)}',this)">Lihat riwayat pengiriman (${escapeHtml(o.kurir)})</button>
      <div class="trk" id="trk-${escapeHtml(o.id)}"></div>` : '<div class="st-sub">Tanpa ekspedisi (COD / antar langsung)</div>'}
      <div class="sum-row"><span>Harga buku</span><span>${rp(o.price)}</span></div>
      <div class="sum-row"><span>Ongkir</span><span>${rp(o.shipping)}</span></div>
      <div class="sum-row tot"><span>Dana ditahan</span><span>${rp(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0))}</span></div>

      <details class="ev"><summary>Lihat bukti &amp; riwayat (${(o.events || []).length} kejadian)</summary>
        <div class="in">
          ${o.receiver_name ? `<div class="meta">Penerima: ${escapeHtml(o.receiver_name)} · ${escapeHtml(o.receiver_phone || '—')} · ${escapeHtml(o.dest_district_name || '')} ${escapeHtml(o.postal_code || '')}</div>
          <div class="st-sub" style="margin-top:4px;">${escapeHtml(o.dest_address || '')}</div>` : ''}
          <div class="meta">Tujuan: ${escapeHtml(o.dest_district_name || o.dest_district_id || '—')}</div>
          <div class="meta">Dibayar: ${rp(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0))} · Kurir: ${escapeHtml(o.courier_name || o.kurir || '—')} ${escapeHtml(o.service || '')}</div>
          ${stats('Pembeli', o.buyer_stats)}
          ${stats('Penjual', o.seller_stats)}
          <ul class="tl">${(o.events || []).map((e: any) => `<li><span class="t">${tgl(e.created_at)} · ${escapeHtml(e.actor || '?')}${e.from_st ? ' ' + escapeHtml(e.from_st) + ' →' : ''} ${escapeHtml(e.to_st || '')}</span><br>${escapeHtml(e.note || '')}</li>`).join('') || '<li>Belum ada riwayat.</li>'}</ul>
        </div>
      </details>

      <div class="field"><label class="lbl">Alasan keputusan (wajib)</label>
        <textarea class="inp" id="note-${escapeHtml(o.id)}" maxlength="300" placeholder="Contoh: resi terverifikasi & pembeli tidak respons 3 hari."></textarea>
      </div>
      <div class="btns">
        <button class="btn b-red" onclick="resolve('${escapeHtml(o.id)}','refund',this)">Refund Pembeli</button>
        <button class="btn b-green" onclick="resolve('${escapeHtml(o.id)}','release',this)">Lepas ke Penjual</button>
      </div>
    </div>`).join('') || `<div class="empty">Tidak ada sengketa menunggu.</div>`;

  const wdCards = (withdrawals || []).map((w) => `
    <div class="st-card">
      <div class="lbl">Pencairan · ${tgl(w.requested_at)}</div>
      <div class="st-big">${rp(w.amount)}</div>
      <div class="st-sub">@${escapeHtml(w.pen_name || '?')} · ${escapeHtml(w.method || 'qris')} · ${escapeHtml(w.account || '—')}</div>
      ${Number(w.sengketa_aktif) > 0 ? `<div class="warn">⚠ Ada ${Number(w.sengketa_aktif)} sengketa aktif milik penjual ini — jangan cairkan sebelum diputuskan.</div>` : ''}

      <details class="ev"><summary>Lihat rincian saldo &amp; riwayat</summary>
        <div class="in">
          <div class="sum-row"><span>Saldo saat ini</span><span>${rp(w.saldo)}</span></div>
          <div class="sum-row"><span>Diminta</span><span>${rp(w.amount)}</span></div>
          ${(w.ledger_ringkas || []).map((l: any) => `<div class="sum-row"><span>${escapeHtml(l.kind)}</span><span>${rp(l.total)}</span></div>`).join('') || '<div class="st-sub">Belum ada mutasi saldo.</div>'}
          <div class="meta">Riwayat pencairan selesai: ${Number(w.riwayat_pencairan?.jumlah || 0)}× · total ${rp(w.riwayat_pencairan?.total)}</div>
          <div class="meta">Sengketa aktif: ${Number(w.sengketa_aktif)}</div>
        </div>
      </details>

      <div class="field"><label class="lbl">Catatan keputusan (wajib)</label>
        <textarea class="inp" id="wnote-${escapeHtml(w.id)}" maxlength="300" placeholder="Contoh: transfer BCA 26/10 14:20, nama penerima cocok."></textarea>
      </div>
      <div class="field"><label class="lbl">Referensi / bukti transfer (wajib untuk transfer)</label>
        <input class="inp" id="wref-${escapeHtml(w.id)}" maxlength="80" placeholder="No. referensi / 4 digit terakhir / ID transaksi">
      </div>
      <div class="btns">
        <button class="btn b-green" onclick="settle('${escapeHtml(w.id)}','pay',this)">Sudah Ditransfer</button>
        <button class="btn b-red" onclick="settle('${escapeHtml(w.id)}','reject',this)">Tolak</button>
      </div>
    </div>`).join('') || `<div class="empty">Tidak ada permintaan pencairan.</div>`;

  const sellerCards = (calonPenjual || []).map((u) => `
    <div class="st-card">
      <div class="lbl">Pengajuan · ${tgl(u.seller_applied_at)}</div>
      <div class="st-big">${escapeHtml(u.shop_name || '(tanpa nama toko)')}</div>
      <div class="st-sub">${escapeHtml(u.seller_full_name || u.pen_name)} · @${escapeHtml(u.pen_name)} · ${escapeHtml(u.city || '-')} · ${Number(u.listing_aktif || 0)} listing aktif</div>
      <div class="kw">WA: ${escapeHtml(u.seller_phone || '—')}
Pemilik rekening: ${escapeHtml(u.seller_bank_name || '—')}
Tujuan pencairan: ${escapeHtml(u.seller_bank_account || '—')}${u.seller_note ? `

${escapeHtml(u.seller_note)}` : ''}</div>
      <div class="field"><label class="lbl">Catatan verifikasi</label>
        <input class="inp" id="snote-${escapeHtml(u.id)}" maxlength="200" placeholder="Contoh: WA dicek 26/10, nama rekening cocok.">
      </div>
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
<div class="wrap">
  <div class="page-head"><h1>Owner</h1><p>Putuskan sengketa dan cairkan saldo penjual. Setiap keputusan menyimpan alasan sebagai bukti.</p></div>
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
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function val(id){var e=document.getElementById(id);return e?e.value.trim():''}
async function post(url,body){
  err('');
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){err(j.error||'Gagal.');return false}
  location.reload(); return true;
}
async function resolve(id,decision,btn){
  const note=val('note-'+id);
  if(note.length<5){err('Tulis alasan keputusan dulu (min 5 karakter).');return}
  if(decision==='refund' && !confirm('Refund ke pembeli? Dana tidak akan dilepas ke penjual.')) return;
  btn.disabled=true; if(!await post('/api/owner/orders/'+id+'/resolve',{decision,note})) btn.disabled=false;
}
async function reviewSeller(id,decision,btn){
  let reason=val('snote-'+id);
  if(decision==='reject' && reason.length<5){
    reason=(prompt('Alasan penolakan (dikirim ke penjual):')||'').trim();
    if(reason.length<5){err('Alasan penolakan minimal 5 karakter.');return}
  } else if(decision==='approve' && !confirm('Setujui akun ini sebagai penjual? Dia bisa langsung memasang buku.')) return;
  btn.disabled=true; if(!await post('/api/owner/sellers/'+id+'/review',{decision,reason})) btn.disabled=false;
}
async function lacak(id,btn){
  const box=document.getElementById('trk-'+id);
  box.innerHTML='<div class="m">Menghubungi kurir…</div>';
  btn.disabled=true;
  try{
    const r=await fetch('/pasar/order/'+id+'/track',{method:'POST'});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||!j.ok){
      const nota = j.kind==='error'
        ? 'Kurir tidak bisa dihubungi — coba lagi nanti (bukan berarti resi palsu).'
        : j.kind==='notfound'
          ? 'Resi tidak ditemukan di sistem kurir. Minta penjual periksa kembali nomor resi.'
          : (j.error||'Riwayat tidak tersedia.');
      box.innerHTML='<div class="bad">'+esc(nota)+'</div>'; btn.disabled=false; return;
    }
    const rows=(j.history||[]).map(function(h){return '<div class="row"><div class="d">'+esc(h.date)+'</div><div class="m">'+esc(h.desc)+'</div><div class="l">'+esc(h.location)+'</div></div>'}).join('');
    box.innerHTML='<div class="ok">Status kurir: '+esc(j.status||'-')+'</div>'+rows+(rows?'':'<div class="l">Belum ada riwayat.</div>');
  }catch(e){ box.innerHTML='<div class="bad">Gagal menghubungi kurir.</div>' }
  btn.disabled=false;
}
async function settle(id,decision,btn){
  const note=val('wnote-'+id), ref=val('wref-'+id);
  if(note.length<5){err('Tulis catatan keputusan dulu (min 5 karakter).');return}
  if(decision==='pay'){
    if(ref.length<4){err('Isi referensi/bukti transfer dulu.');return}
    if(!confirm('Pastikan transfer sudah benar-benar terkirim ke tujuan penjual.')) return;
  }
  btn.disabled=true; if(!await post('/api/owner/withdrawals/'+id+'/settle',{decision,note,transfer_ref:ref})) btn.disabled=false;
}
</script>
</body></html>`;
}
