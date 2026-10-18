// Halaman order (Kwitansi Rekber) — kwitansi terkunci + stepper + aksi per peran.
// Pembeli: bayar (QRIS), konfirmasi terima, sengketa. Penjual: tandai serah, lihat kesepakatan.

import { escapeHtml } from '../lib/sanitize';
import { BRAND_HEADER, PASAR_BASE_CSS, rupiah, trackUrl } from './pasar';

const PAGE_CSS = `
  .wrap{max-width:480px;margin:0 auto;padding:0 14px 110px}
  .st-card{background:#fff;border:2.5px solid #0B192C;border-radius:16px;box-shadow:4px 4px 0 #1E293B;padding:16px;margin-bottom:14px}
  .st-big{font-family:'Space Grotesk';font-size:17px;font-weight:800;display:flex;align-items:center;gap:9px}
  .st-sub{font-size:12px;font-weight:600;color:#475569;margin-top:6px;line-height:1.55}
  .steps{display:flex;margin:14px 0 4px}
  .step{flex:1;text-align:center;position:relative;font-size:9.5px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:.4px}
  .step::before{content:'';display:block;width:22px;height:22px;border-radius:50%;border:2.5px solid #CBD5E1;background:#fff;margin:0 auto 5px;box-sizing:border-box}
  .step:not(:last-child)::after{content:'';position:absolute;top:10px;left:calc(50% + 14px);width:calc(100% - 28px);height:2.5px;background:#CBD5E1}
  .step.on{color:#0F3E99}
  .step.on::before{border-color:#0B192C;background:#FDE047}
  .step.done{color:#0F3E99}
  .step.done::before{border-color:#0F3E99;background:#1D61E7;content:'✓';color:#fff;font-size:12px;line-height:18px}
  .kw{background:#FFFDF2;border:2px solid #0B192C;border-radius:12px;padding:11px 13px;font-size:12.5px;font-weight:600;line-height:1.6;color:#334155;white-space:pre-wrap;word-break:break-word}
  .kw-lock{font-size:10px;font-weight:800;color:#92400E;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;display:flex;gap:5px;align-items:center}
  .sum-row{display:flex;justify-content:space-between;font-size:13px;font-weight:700;padding:3px 0;color:#334155}
  .sum-row.tot{border-top:1.5px dashed #CBD5E1;margin-top:8px;padding-top:10px;font-size:15px;font-weight:900;color:#0F3E99}
  .qris-img{display:block;width:min(240px,70%);margin:10px auto;border:2.5px solid #0B192C;border-radius:12px}
  .btn{width:100%;border:2.5px solid #0B192C;border-radius:12px;padding:12px;font-size:13.5px;font-weight:900;cursor:pointer;box-shadow:3px 3px 0 #1E293B;font-family:inherit;display:flex;justify-content:center;align-items:center;gap:8px;margin-top:10px;text-decoration:none;box-sizing:border-box}
  .btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #1E293B}
  .b-yellow{background:#FDE047;color:#0B192C}
  .b-blue{background:#1D61E7;color:#fff}
  .b-ghost{background:#fff;color:#991B1B}
  .tl{list-style:none;margin-top:8px}
  .tl li{font-size:11.5px;font-weight:600;color:#475569;padding:4px 0 4px 16px;position:relative;line-height:1.5}
  .tl li::before{content:'';position:absolute;left:2px;top:10px;width:7px;height:7px;border-radius:50%;background:#1D61E7}
  .tl b{color:#0B192C}
  .actionbar{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:452px;background:#fff;border:3px solid #0B192C;border-radius:16px;box-shadow:5px 5px 0 #1E293B;padding:10px 14px;display:flex;gap:10px;z-index:50}
  .actionbar .btn{margin:0;flex:1;padding:11px}
  .err{display:none;background:#FEE2E2;border:2px solid #991B1B;color:#991B1B;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;margin-bottom:12px}
`;

const STATUS_LABEL: Record<string, string> = {
  created: 'Menunggu Pembayaran',
  paid: 'Dibayar — Siap Diserahkan',
  handed: 'Sudah Diserahkan',
  completed: 'Selesai',
  expired: 'Kedaluwarsa',
  canceled: 'Dibatalkan',
  disputed: 'Sengketa — Owner Review',
};

const STEP_ORDER = ['created', 'paid', 'handed', 'completed'];

export function renderOrderPage(o: any, p: any, photos: string[], viewer: any): string {
  const isBuyer = viewer.id === o.buyer_id;
  const isSeller = viewer.id === o.seller_id;
  const total = Number(o.price) + Number(o.shipping || 0);
  const st = o.status;

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
    actions = `<a class="btn b-yellow" href="${escapeHtml(o.qris_url || '#')}" id="btn-qris">🔒 Buka QRIS & Bayar</a>`;
  } else if (st === 'paid' && isSeller) {
    actions = `<button class="btn b-blue" onclick="showHandover()">📦 Tandai Sudah Diserahkan</button>
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
    actions = `<button class="btn b-blue" onclick="receive()">✅ Pesanan Diterima — Lepas Dana</button>
      <button class="btn b-ghost" onclick="showDispute()">⚠️ Ada Masalah (Sengketa)</button>`;
  } else if (st === 'paid' && isBuyer) {
    actions = `<button class="btn b-ghost" onclick="showDispute()">⚠️ Ada Masalah (Sengketa)</button>
      <div class="st-sub" style="margin-top:8px;">Menunggu penjual menyerahkan buku…</div>`;
  } else if (st === 'disputed') {
    actions = `<div class="st-sub">Owner BERBIRRU sedang meninjau sengketa ini. Semua pesan & kwitansi sudah terkirim ke owner.</div>`;
  } else if (st === 'completed' && isSeller) {
    actions = `<div class="st-sub">💰 Saldo bertambah Rp${(Number(o.price) - 5000 + Number(o.shipping)).toLocaleString('id-ID')} (fee rekber Rp5.000 dipotong).</div>`;
  }

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pesanan | BERBIRRU</title>
<link rel="stylesheet" href="/styling.css">
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
${BRAND_HEADER}
<div class="wrap">
  <div class="err" id="err"></div>

  <div class="st-card">
    <div class="st-big">${st === 'disputed' ? '⚖️' : st === 'completed' ? '🎉' : '📦'} ${STATUS_LABEL[st] || st}</div>
    ${st === 'created' ? '<div class="st-sub">Selesaikan bayar sebelum kwitansi kedaluwarsa (48 jam). Dana aman di rekber.</div>' : ''}
    ${st === 'paid' ? '<div class="st-sub">Dana sudah ditahan rekber. Kesepakatan terkunci di bawah — penjual wajib menepati.</div>' : ''}
    ${st === 'handed' ? '<div class="st-sub">Penjual menandai buku sudah diserahkan. Konfirmasi saat kamu benar-benar sudah terima & oke dengan bukunya.</div>' : ''}
    <div class="steps">${steps}</div>
  </div>

  <div class="st-card">
    <div class="kw-lock">🔐 Terkunci sejak dibayar</div>
    <div class="kw">${escapeHtml(o.kesepakatan)}</div>
  </div>

  ${o.kurir && o.resi ? `<div class="st-card"><div class="st-big" style="font-size:14px;">🚚 Pengiriman</div>
    <div style="margin-top:8px;font-weight:800;">${escapeHtml(o.kurir)}</div>
    <div style="font-family:monospace;font-size:15px;background:#F0F6FE;border:2px dashed #1D61E7;border-radius:8px;padding:8px 10px;margin-top:6px;letter-spacing:1px;">${escapeHtml(o.resi)}</div>
    <div id="track-box"></div>
    <a class="btn b-ghost" style="width:100%;margin-top:10px;text-align:center;" href="${trackUrl(o.kurir, o.resi)}" target="_blank" rel="noopener">🌐 Buka Web Kurir</a>
    <button class="btn b-blue" style="width:100%;margin-top:8px;" onclick="cekStatus()">🔍 Cek Status Paket</button>
  </div>` : ''}

  ${st === 'created' && o.qris_url && o.qris_url.startsWith('data:') ? `<div class="st-card"><div class="st-big" style="font-size:14px;">📱 Scan QRIS</div><img class="qris-img" src="${o.qris_url}" alt="QRIS"><div class="st-sub" style="text-align:center;">Halaman ini otomatis update setelah pembayaran terdeteksi.</div></div>` : ''}

  <div class="st-card">
    <div class="st-big" style="font-size:15px;">${escapeHtml(p.title)}</div>
    ${photoKeys[0] ? `<img src="/media/${escapeHtml(photoKeys[0])}?v=${Date.now()}" style="width:100%;border:2.5px solid #0B192C;border-radius:12px;margin-top:10px;" alt="Foto buku">` : ''}
    <div style="margin-top:10px;">
      <div class="sum-row"><span>Harga buku</span><span>${rupiah(o.price)}</span></div>
      ${Number(o.shipping) > 0 ? `<div class="sum-row"><span>Ongkir (urusan penjual)</span><span>${rupiah(o.shipping)}</span></div>` : ''}
      <div class="sum-row tot"><span>${st === 'completed' ? `Total diterima penjual` : 'Total QRIS'}</span><span>${st === 'completed' ? rupiah(Number(o.price) - 5000 + Number(o.shipping)) : rupiah(total)}</span></div>
    </div>
  </div>

  <div class="st-card">
    <div class="st-big" style="font-size:14px;">🧭 Riwayat</div>
    <ul class="tl">
      ${(o.events || []).map((e: any) => `<li><b>${e.actor === 'buyer' ? 'Pembeli' : e.actor === 'seller' ? 'Penjual' : e.actor === 'owner' ? 'Owner' : 'Sistem'}</b> — ${escapeHtml(e.note || e.to_st)} <span style="color:#94A3B8;">· ${escapeHtml(String(e.created_at).slice(0, 16).replace('T', ' '))}</span></li>`).join('')}
    </ul>
  </div>

  <div class="st-card" id="dispute-box" style="display:none;">
    <div class="st-big" style="font-size:14px;">⚠️ Ajukan Sengketa</div>
    <div class="st-sub">Ceritakan masalahnya — owner akan baca kwitansi + riwayat ini lalu memutuskan.</div>
    <textarea class="kw" id="dispute-note" style="margin-top:10px;min-height:80px;" placeholder="Contoh: buku tidak pernah diserahkan / kondisi beda dari foto…"></textarea>
    <button class="btn b-ghost" onclick="sendDispute()">Kirim Laporan ke Owner</button>
  </div>
</div>

${actions ? `<div class="actionbar" id="actionbar">${actions}</div>` : ''}

<script>
function showDispute(){document.getElementById('dispute-box').style.display='block';document.getElementById('dispute-box').scrollIntoView({behavior:'smooth'});}
async function post(url,body){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});const j=await r.json();if(!r.ok)throw new Error(j.error||'Gagal');return j;}
function showHandover(){document.getElementById('handover-box').style.display='block';}
function hmodeBox(){const eksp=document.querySelector('input[name=hmode]:checked').value==='ekspedisi';document.getElementById('ekspedisi-fields').style.display=eksp?'block':'none';}
async function handover(){try{const m=document.querySelector('input[name=hmode]:checked').value;await post(location.pathname+'/handover',{mode:m,kurir:(document.getElementById('kurir')||{}).value,resi:(document.getElementById('resi')||{}).value});location.reload();}catch(e){alerterr(e)}}
async function receive(){try{await post(location.pathname+'/receive');location.reload();}catch(e){alerterr(e)}}
async function sendDispute(){try{await post(location.pathname+'/dispute',{note:document.getElementById('dispute-note').value});location.reload();}catch(e){alerterr(e)}}
async function cekStatus(){const b=document.getElementById('track-box');b.innerHTML='<div class="st-sub">⏳ Menghubungi kurir…</div>';try{const j=await post(location.pathname+'/track');if(j.ok){b.innerHTML='<div style="margin-top:10px;border:2.5px solid #0B192C;border-radius:10px;padding:10px;background:#fff;"><div style="font-weight:800;">'+(j.status||'-')+'</div>'+(j.desc?'<div class="st-sub">'+j.desc+'</div>':'')+(j.history||[]).slice(0,3).map(h=>'<div class="st-sub" style="border-top:1px dashed #CBD5E1;margin-top:6px;padding-top:6px;">'+h.date+' — '+h.desc+'</div>').join('')+'</div>';}else{b.innerHTML='<div class="st-sub">⚠️ '+j.error+' — coba "Buka Web Kurir".</div>';}}catch(e){alerterr(e);b.innerHTML='';}}
function alerterr(e){const el=document.getElementById('err');el.textContent=e.message;el.style.display='block';}
// polling status kalau masih menunggu bayar
if('${st}'==='created'){const t=setInterval(async()=>{try{const r=await fetch('${o.id ? '/api/pasar/orders/' + o.id + '/status' : ''}');const j=await r.json();if(j.ok&&j.status!=='created'){clearInterval(t);location.reload();}}catch(_){}},5000);}
</script>
</body></html>`;
}
