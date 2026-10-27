// Halaman order (Kwitansi Rekber) — kwitansi terkunci + stepper + aksi per peran.
// Pembeli: bayar (QRIS), konfirmasi terima, sengketa. Penjual: tandai serah, lihat kesepakatan.

import { posisiDana } from '../lib/dana';
import { escapeHtml } from '../lib/sanitize';
import { PASAR_BASE_CSS, rupiah, trackUrl } from './pasar';

const PAGE_CSS = `
  .wrap{width:min(680px,calc(100% - 28px));margin:auto;padding:18px 0 180px}.page-head{margin:8px 0 22px}.page-head h1{margin:0 0 8px;font:700 clamp(40px,7vw,64px)/.95 'Newsreader';letter-spacing:-.04em}.page-head p{margin:0;color:#52627A;line-height:1.6}.dana{border:3px solid #0B192C;padding:11px 13px;margin:0 0 16px;box-shadow:4px 5px 0 #26364A}
.dana-t{font:900 14px 'DM Sans';letter-spacing:-.01em}
.dana-s{font:600 11.5px 'DM Sans';line-height:1.5;margin-top:3px;color:#334155}
.dana-abu{background:#F1F5F9}.dana-kuning{background:#FEF3C7}.dana-hijau{background:#DCFCE7}.dana-merah{background:#FEE2E2}
.st-card{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;padding:18px;margin-bottom:20px}.st-big{font:700 23px 'Newsreader';display:flex;align-items:center;gap:9px}.st-sub{font-size:12px;font-weight:600;color:#475569;margin-top:7px;line-height:1.55}.steps{display:flex;margin:18px 0 4px}.step{flex:1;text-align:center;position:relative;font:700 9.5px 'Roboto Mono';color:#94A3B8;letter-spacing:.04em}.step::before{content:'';display:block;width:24px;height:24px;border:2.5px solid #CBD5E1;background:#fff;margin:0 auto 6px;box-sizing:border-box}.step:not(:last-child)::after{content:'';position:absolute;top:11px;left:calc(50% + 14px);width:calc(100% - 28px);height:2.5px;background:#CBD5E1}.step.on,.step.done{color:#0F3E99}.step.on::before{border-color:#0B192C;background:#FDE047}.step.done::before{border-color:#0B192C;background:#1D61E7;content:'✓';color:#fff;font-size:12px;line-height:19px}.kw{background:#FFFDF2;border:2px solid #0B192C;padding:12px 14px;font-size:12.5px;font-weight:600;line-height:1.6;color:#334155;white-space:pre-wrap;word-break:break-word}.kw-lock{font:700 10px 'Roboto Mono';color:#92400E;letter-spacing:.04em;margin-bottom:7px}.sum-row{display:flex;justify-content:space-between;font-size:13px;font-weight:700;padding:4px 0;color:#334155}.sum-row.tot{border-top:2px dashed #0B192C;margin-top:8px;padding-top:11px;font:400 16px 'Archivo Black';color:#0F3E99}.qris-img{display:block;width:min(280px,82%);margin:14px auto;border:3px solid #0B192C}.btn{width:100%;min-height:48px;border:3px solid #0B192C;padding:11px 15px;font-size:13.5px;font-weight:900;cursor:pointer;box-shadow:3px 4px 0 #26364A;font-family:inherit;display:flex;justify-content:center;align-items:center;gap:8px;margin-top:10px;text-decoration:none;box-sizing:border-box}.btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #26364A}.b-yellow{background:#FDE047;color:#0B192C}.b-blue{background:#1D61E7;color:#fff}.b-ghost{background:#fff;color:#991B1B}.tl{list-style:none;margin:8px 0 0;padding:0}.tl li{font-size:11.5px;font-weight:600;color:#475569;padding:5px 0 5px 17px;position:relative;line-height:1.5}.tl li::before{content:'';position:absolute;left:2px;top:11px;width:8px;height:8px;background:#1D61E7;border:1px solid #0B192C}.tl b{color:#0B192C}.actionbar{position:fixed;bottom:0;left:0;right:0;width:100%;background:#fff;border-top:3px solid #0B192C;box-shadow:0 -5px 0 rgba(11,25,44,.08);padding:10px max(14px,calc((100% - 680px)/2));display:flex;gap:10px;z-index:80}.actionbar .btn{margin:0;flex:1}.err{display:none;background:#FEE2E2;border:2px solid #991B1B;color:#991B1B;padding:10px 12px;font-size:12px;font-weight:700;margin-bottom:14px}@media(max-width:420px){.wrap{padding-top:8px}.actionbar{padding:9px 14px}.actionbar .btn{font-size:11px;padding:8px}}
`;

const STATUS_LABEL: Record<string, string> = {
  created: 'Menunggu Pembayaran',
  paid: 'Dibayar — Siap Diserahkan',
  handed: 'Sudah Diserahkan',
  completed: 'Selesai',
  expired: 'Kedaluwarsa',
  canceled: 'Dibatalkan',
  disputed: 'Sengketa — Owner Review',
  refunded: 'Dana Dikembalikan ke Pembeli',
};

const STEP_ORDER = ['created', 'paid', 'handed', 'completed'];

export function renderOrderPage(o: any, p: any, photos: string[], viewer: any): string {
  const isBuyer = viewer.id === o.buyer_id;
  const isSeller = viewer.id === o.seller_id;
  const total = Number(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0));
  const st = o.status;

  const dana = posisiDana(o, isBuyer ? 'pembeli' : 'penjual');
  const stepIdx = st === 'disputed' ? 99 : STEP_ORDER.indexOf(st === 'handed' ? 'handed' : st);
  const steps = STEP_ORDER.map((s, i) => {
    const cls = stepIdx > i ? 'done' : stepIdx === i ? 'on' : '';
    const label = { created: 'Bayar', paid: 'Dibayar', handed: 'Diserahkan', completed: 'Selesai' }[s];
    return `<div class="step ${cls}">${label}</div>`;
  }).join('');

  let photoKeys: string[] = [];
  try { photoKeys = JSON.parse(photos as any || '[]'); } catch { photoKeys = []; }

  // ---- blok aksi ----
  let actions = '';
  if (st === 'created' && isBuyer) {
    actions = `<a class="btn b-yellow" href="${escapeHtml(o.qris_url || '#')}" id="btn-qris">Buka QRIS & Bayar</a>
      <button class="btn b-ghost" style="margin-top:8px;" onclick="batalkan()">Batalkan pesanan</button>`;
  } else if (st === 'paid' && isSeller) {
    actions = `<button class="btn b-blue" onclick="showHandover()">Tandai Sudah Diserahkan</button>
      <div id="handover-box" style="display:none;margin-top:10px;background:#fff;border:2.5px solid #0B192C;border-radius:12px;padding:12px;">
        <label style="display:flex;gap:8px;align-items:center;font-weight:700;"><input type="radio" name="hmode" value="cod" checked onchange="hmodeBox()"> COD / Antar langsung / jumpsit</label>
        <label style="display:flex;gap:8px;align-items:center;font-weight:700;margin-top:6px;"><input type="radio" name="hmode" value="ekspedisi" onchange="hmodeBox()"> Kirim via Ekspedisi</label>
        <div id="ekspedisi-fields" style="display:none;margin-top:10px;">
          <select id="kurir" style="width:100%;padding:10px;border:2px solid #0B192C;border-radius:8px;font-weight:700;">
            <option value="">— Pilih kurir —</option>
            <option>JNE</option><option>J&T</option><option>SiCepat</option><option>POS</option><option>AnterAja</option><option>Ninja</option>
          </select>
          <input id="resi" placeholder="Nomor resi" style="width:100%;padding:10px;border:2px solid #0B192C;border-radius:8px;margin-top:8px;font-weight:700;">
        </div>
        <button class="btn b-blue" style="width:100%;margin-top:10px;" onclick="handover()">Konfirmasi</button>
      </div>`;
  } else if (st === 'handed' && isBuyer) {
    actions = `<button class="btn b-blue" onclick="receive()">Pesanan Diterima — Lepas Dana</button>
      <button class="btn b-ghost" onclick="showDispute()">Ada Masalah (Sengketa)</button>`;
  } else if (st === 'paid' && isBuyer) {
    actions = `<button class="btn b-ghost" onclick="showDispute()">Ada Masalah (Sengketa)</button>
      <div class="st-sub" style="margin-top:8px;">Menunggu penjual menyerahkan buku…</div>`;
  } else if (st === 'disputed') {
    actions = `<div class="st-sub">Owner BERBIRRU sedang meninjau sengketa ini. Semua pesan & kwitansi sudah terkirim ke owner.</div>`;
  } else if (st === 'completed' && isSeller) {
    actions = `<div class="st-sub">Saldo bertambah Rp${(Number(o.price) - 5000 + Number(o.shipping)).toLocaleString('id-ID')} (fee rekber Rp5.000 dipotong).</div>
      <a class="btn b-ghost" style="text-align:center;" href="/saldo">Lihat Saldo & Tarik Dana</a>`;
  } else if (st === 'completed' && isBuyer) {
    actions = Number(o.review_stars) > 0
      ? `<div class="st-sub">Ulasanmu: <b>${'★'.repeat(Number(o.review_stars))}${'☆'.repeat(5 - Number(o.review_stars))}</b>${o.review_body ? ` — “${escapeHtml(o.review_body)}”` : ''}</div>`
      : `<div class="st-sub" style="margin-bottom:8px;">Bagaimana bukunya? Ulasan membantu pembeli lain.</div>
        <div class="chip-pick" id="rvStars">
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="chip${n === 5 ? ' on' : ''}" data-n="${n}" onclick="pilihBintang(${n})">${n} ★</button>`).join('')}
        </div>
        <textarea id="rvBody" maxlength="300" placeholder="Ceritakan kondisi buku & pelayanan penjual (opsional)" style="width:100%;min-height:70px;margin-top:8px;border:2.5px solid #0B192C;padding:9px;font:600 13px 'DM Sans';border-radius:10px;"></textarea>
        <button class="btn b-blue" style="margin-top:8px;" onclick="kirimUlasan()">Kirim ulasan</button>`;
  } else if (st === 'refunded') {
    actions = `<div class="st-sub">Dana dikembalikan ke pembeli. Penjual tidak menerima saldo untuk pesanan ini.</div>
      <div class="sum-row" style="margin-top:8px;"><span>Masuk saldo</span><span><b>${rupiah(Number(o.refund_amount || total))}</b></span></div>
      <div class="sum-row"><span>Waktu</span><span>${o.refunded_at ? escapeHtml(String(o.refunded_at)) : '—'}</span></div>
      <div class="sum-row"><span>Status</span><span>Bisa dipakai belanja atau ditarik</span></div>`;
  }

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pesanan | BERBIRRU</title>
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
<div class="wrap">
  <div class="page-head"><h1>Pesanan</h1><p>Kwitansi rekber dan perjalanan buku.</p></div>

  <div class="dana dana-${dana.tone}">
    <div class="dana-t">${escapeHtml(dana.judul)}</div>
    <div class="dana-s">${escapeHtml(dana.isi)}</div>
  </div>
  <div class="err" id="err"></div>

  <div class="st-card">
    <div class="st-big">${STATUS_LABEL[st] || st}</div>
    ${st === 'created' ? `<div class="st-sub">Selesaikan bayar sebelum QRIS kedaluwarsa${o.qris_expired_at ? ` · ${escapeHtml(String(o.qris_expired_at).slice(0, 16).replace('T', ' '))}` : ''}. Dana aman di rekber.</div>` : ''}
    ${st === 'paid' ? '<div class="st-sub">Dana sudah ditahan rekber. Kesepakatan terkunci di bawah — penjual wajib menepati.</div>' : ''}
    ${st === 'handed' ? '<div class="st-sub">Penjual menandai buku sudah diserahkan. Konfirmasi saat kamu benar-benar sudah terima & oke dengan bukunya.</div>' : ''}
    <div class="steps">${steps}</div>
  </div>

  <div class="st-card">
    <div class="kw-lock">🔐 Terkunci sejak dibayar</div>
    <div class="kw">${escapeHtml(o.kesepakatan)}</div>
  </div>

  ${o.dest_address ? `<div class="st-card"><div class="st-big" style="font-size:14px;">Tujuan</div>
    ${o.receiver_name ? `<div class="st-sub" style="margin-top:6px;"><b>${escapeHtml(o.receiver_name)}</b>${o.receiver_phone ? ' · ' + escapeHtml(o.receiver_phone) : ''}</div>` : ''}
    <div class="st-sub" style="margin-top:4px;">${escapeHtml(o.dest_district_name || o.dest_district_id || '-')}${o.postal_code ? ' · ' + escapeHtml(o.postal_code) : ''}</div>
    <div style="margin-top:6px;font-size:12.5px;font-weight:600;line-height:1.6;color:#334155;">${escapeHtml(o.dest_address)}</div>
    ${o.receiver_name ? `<button type="button" id="btnSalin" class="btn b-ghost" style="width:100%;margin-top:10px;" onclick="salinAlamat(this)">Salin alamat penerima</button>
    <script>function salinAlamat(btn){var t=${JSON.stringify(`${o.receiver_name}\n${o.receiver_phone || ''}\n${o.dest_address || ''}\n${o.dest_district_name || ''} ${o.postal_code || ''}`.trim())};if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){if(btn)btn.textContent='Tersalin ✓'},function(){prompt('Salin manual:',t)})}else{prompt('Salin manual:',t)}}</script>` : ''}
  </div>` : ''}

  ${o.kurir && o.resi ? `<div class="st-card"><div class="st-big" style="font-size:14px;">Pengiriman</div>
    <div style="margin-top:8px;font-weight:800;">${escapeHtml(o.kurir)}</div>
    <div style="font-family:monospace;font-size:15px;background:#F0F6FE;border:2px dashed #1D61E7;border-radius:8px;padding:8px 10px;margin-top:6px;letter-spacing:1px;">${escapeHtml(o.resi)}</div>
    <div style="font:700 10px 'Roboto Mono';letter-spacing:.04em;margin-top:6px;color:${Number(o.resi_verified) ? '#166534' : '#92400E'};">
      ${Number(o.resi_verified) ? '✓ RESI TERVERIFIKASI KURIR' : 'RESI BELUM TERVERIFIKASI — DICEK OTOMATIS, DANA DITAHAN'}
    </div>
    <div id="track-box"></div>
    <a class="btn b-ghost" style="width:100%;margin-top:10px;text-align:center;" href="${trackUrl(o.kurir, o.resi)}" target="_blank" rel="noopener">Buka Web Kurir</a>
    <button class="btn b-blue" style="width:100%;margin-top:8px;" onclick="cekStatus()">Cek Status Paket</button>
  </div>` : ''}

  ${o.courier_name && !o.resi ? `<div class="st-card"><div class="st-big" style="font-size:14px;">Layanan Pengiriman</div>
    <div class="st-sub" style="margin-top:6px;">${escapeHtml(o.courier_name)} ${escapeHtml(o.service || '')}${o.eta ? ' · estimasi ' + escapeHtml(o.eta) : ''} · ${rupiah(Number(o.shipping || 0))}</div>
  </div>` : ''}

  ${st === 'created' && o.qris_url && o.qris_url.startsWith('data:') ? `<div class="st-card"><div class="st-big" style="font-size:14px;">Scan QRIS</div><img class="qris-img" src="${o.qris_url}" alt="QRIS"><div class="st-sub" style="text-align:center;">Halaman ini otomatis update setelah pembayaran terdeteksi.</div></div>` : ''}

  <div class="st-card">
    <div class="st-big" style="font-size:15px;">${escapeHtml(p.title)}</div>
    ${photoKeys[0] ? `<img src="/media/${escapeHtml(photoKeys[0])}?v=${Date.now()}" style="width:100%;border:2.5px solid #0B192C;border-radius:12px;margin-top:10px;" alt="Foto buku">` : ''}
    <div style="margin-top:10px;">
      <div class="sum-row"><span>Harga buku</span><span>${rupiah(o.price)}</span></div>
      ${Number(o.shipping) > 0 ? `<div class="sum-row"><span>Ongkir ${o.courier_name ? escapeHtml(o.courier_name) : ''}${o.service ? ' ' + escapeHtml(o.service) : ''}</span><span>${rupiah(o.shipping)}</span></div>` : ''}
      ${Number(o.qris_final_amount || 0) > Number(o.price) + Number(o.shipping || 0) ? `<div class="sum-row"><span>Biaya layanan QRIS</span><span>${rupiah(Number(o.qris_final_amount) - Number(o.price) - Number(o.shipping || 0))}</span></div>` : ''}
      <div class="sum-row tot"><span>${st === 'completed' ? `Total diterima penjual` : 'Total QRIS'}</span><span>${st === 'completed' ? rupiah(Number(o.price) - 5000 + Number(o.shipping)) : rupiah(total)}</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-big" style="font-size:14px;">Riwayat</div>
    <ul class="tl">
      ${(o.events || []).map((e: any) => `<li><b>${e.actor === 'buyer' ? 'Pembeli' : e.actor === 'seller' ? 'Penjual' : e.actor === 'owner' ? 'Owner' : 'Sistem'}</b> — ${escapeHtml(e.note || e.to_st)} <span style="color:#94A3B8;">· ${escapeHtml(String(e.created_at).slice(0, 16).replace('T', ' '))}</span></li>`).join('')}
    </ul>
  </div>

  <div class="st-card" id="dispute-box" style="display:none;">
    <div class="st-big" style="font-size:14px;">Ajukan Sengketa</div>
    <div class="st-sub">Ceritakan masalahnya — owner akan baca kwitansi + riwayat ini lalu memutuskan.</div>
    <textarea class="kw" id="dispute-note" style="margin-top:10px;min-height:80px;" placeholder="Contoh: buku tidak pernah diserahkan / kondisi beda dari foto…"></textarea>
    <button class="btn b-ghost" onclick="sendDispute()">Kirim Laporan ke Owner</button>
  </div>
</div>

${actions ? `<div class="actionbar" id="actionbar">${st === 'created' && isBuyer ? `<div style="min-width:112px"><div style="font:700 10px 'Roboto Mono';color:#64748B">TOTAL QRIS</div><div style="font:400 17px 'Archivo Black';color:#0F3E99">${rupiah(total)}</div></div>` : ''}${actions}</div>` : ''}

<script>
function showDispute(){document.getElementById('dispute-box').style.display='block';document.getElementById('dispute-box').scrollIntoView({behavior:'smooth'});}
async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Gagal');return j;}
function showHandover(){document.getElementById('handover-box').style.display='block';}
function hmodeBox(){const eksp=document.querySelector('input[name=hmode]:checked').value==='ekspedisi';document.getElementById('ekspedisi-fields').style.display=eksp?'block':'none';}
async function handover(){try{const m=document.querySelector('input[name=hmode]:checked').value;await post(location.pathname+'/handover',{mode:m,kurir:(document.getElementById('kurir')||{}).value,resi:(document.getElementById('resi')||{}).value});location.reload();}catch(e){alerterr(e)}}
async function receive(){try{await post(location.pathname+'/receive');location.reload();}catch(e){alerterr(e)}}
async function sendDispute(){try{await post(location.pathname+'/dispute',{note:document.getElementById('dispute-note').value});location.reload();}catch(e){alerterr(e)}}
let rvN=5;function pilihBintang(n){rvN=n;document.querySelectorAll('#rvStars .chip').forEach(function(b){b.classList.toggle('on',Number(b.dataset.n)===n)})}
async function batalkan(){if(!confirm('Batalkan pesanan ini? Buku akan dilepas lagi.'))return;try{await post('/api/pasar/order/'+${JSON.stringify(o.id)}+'/cancel');location.reload();}catch(e){alerterr(e)}}
async function kirimUlasan(){try{await post('/api/pasar/order/'+${JSON.stringify(o.id)}+'/review',{stars:rvN,body:(document.getElementById('rvBody')||{}).value||''});location.reload();}catch(e){alerterr(e)}}
async function cekStatus(){const b=document.getElementById('track-box');b.innerHTML='<div class="st-sub">Menghubungi kurir…</div>';try{const j=await post(location.pathname+'/track');if(j.ok){b.innerHTML='<div style="margin-top:10px;border:2.5px solid #0B192C;border-radius:10px;padding:10px;background:#fff;"><div style="font-weight:800;">'+(j.status||'-')+'</div>'+(j.desc?'<div class="st-sub">'+j.desc+'</div>':'')+(j.history||[]).slice(0,3).map(h=>'<div class="st-sub" style="border-top:1px dashed #CBD5E1;margin-top:6px;padding-top:6px;">'+h.date+' — '+h.desc+'</div>').join('')+'</div>';}else{b.innerHTML='<div class="st-sub">'+j.error+' — coba "Buka Web Kurir".</div>';}}catch(e){alerterr(e);b.innerHTML='';}}
function alerterr(e){const el=document.getElementById('err');el.textContent=e.message;el.style.display='block';}
// polling status kalau masih menunggu bayar
if('${st}'==='created'){const t=setInterval(async()=>{try{const r=await fetch('${o.id ? '/api/pasar/orders/' + o.id + '/status' : ''}');const j=await r.json();if(j.ok&&j.status!=='created'){clearInterval(t);location.reload();}}catch(_){}},5000);}
</script>
</body></html>`;
}
