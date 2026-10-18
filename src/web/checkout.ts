// Checkout "Kwitansi Rekber" — platform BUKAN logistik.
// Pengiriman 100% antar penjual & pembeli; platform mencatat kesepakatan + menahan dana.
// Pembeli bayar harga listing persis (ongkir sudah masuk angka penjual bila ada).

import { escapeHtml } from '../lib/sanitize';
import { BRAND_HEADER, PASAR_BASE_CSS, rupiah } from './pasar';

const PAGE_CSS = `
  .wrap{max-width:480px;margin:0 auto;padding:0 14px 90px}
  .kw-card{background:#fff;border:2.5px solid #0B192C;border-radius:16px;box-shadow:4px 4px 0 #1E293B;padding:16px;margin-bottom:14px}
  .sec-t{font-family:'Space Grotesk';font-size:15px;font-weight:800;margin-bottom:10px;display:flex;align-items:center;gap:8px}
  .prod-line{display:flex;justify-content:space-between;gap:10px;font-size:13px;font-weight:700;padding:3px 0;color:#334155}
  .prod-line.tot{border-top:1.5px dashed #CBD5E1;margin-top:8px;padding-top:10px;font-size:15px;font-weight:900;color:#0F3E99}
  .lbl{display:block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.3px;margin:0 0 6px}
  .inp{width:100%;font:inherit;font-size:13.5px;font-weight:600;padding:10px 12px;border:2.5px solid #0B192C;border-radius:10px;background:#FAFAFA;color:#0B192C;outline:none}
  .inp:focus{background:#fff;border-color:#1D61E7;box-shadow:2px 2px 0 #1E293B}
  textarea.inp{min-height:96px;resize:vertical;line-height:1.5}
  .hint{font-size:11px;font-weight:600;color:#64748B;margin-top:6px;line-height:1.5}
  .note{margin-top:12px;background:#E0EEFD;border:2px solid #0B192C;border-radius:10px;padding:9px 12px;font-size:11px;font-weight:700;color:#0F3E99;line-height:1.55;display:flex;gap:7px}
  .err{display:none;background:#FEE2E2;border:2px solid #991B1B;color:#991B1B;border-radius:10px;padding:9px 12px;font-size:12px;font-weight:700;margin-bottom:12px}
  .btn-pay{width:100%;background:#FDE047;color:#0B192C;border:3px solid #0B192C;border-radius:12px;padding:13px;font-size:14px;font-weight:900;box-shadow:4px 4px 0 #1E293B;cursor:pointer;display:flex;justify-content:center;align-items:center;gap:8px;font-family:inherit}
  .btn-pay:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #1E293B}
  .paybar{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:452px;background:#fff;border:3px solid #0B192C;border-radius:16px;box-shadow:5px 5px 0 #1E293B;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;z-index:50}
  .paybar .l{font-size:9.5px;font-weight:800;text-transform:uppercase;color:#64748B;letter-spacing:.4px}
  .paybar .t{font-family:'Space Grotesk';font-size:17px;font-weight:800;color:#0F3E99}
  .paybar button{background:#1D61E7;color:#fff;border:2.5px solid #0B192C;border-radius:10px;padding:10px 18px;font-size:12.5px;font-weight:900;cursor:pointer;box-shadow:2.5px 2.5px 0 #1E293B;white-space:nowrap;font-family:inherit}
`;

export function renderCheckoutPage(user: any, p: any): string {
  const total = Number(p.price) + Number(p.shipping_flat || 0);
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beli — ${escapeHtml(p.title)} | BERBIRRU</title>
<link rel="stylesheet" href="/styling.css">
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
${BRAND_HEADER}
<div class="wrap">
  <div class="err" id="err"></div>

  <form id="kw_form" class="kw-card">
    <div class="sec-t">🧾 Kwitansi Rekber</div>
    <div class="lbl">Tuliskan kesepakatan kalian *</div>
    <textarea class="inp" id="kesepakatan" required minlength="10" maxlength="500"
      placeholder="Contoh: COD di dekos Cibiru, atau ongkir JNE Rp10rb diluar harga. Buku dibungkus plastik."></textarea>
    <div class="hint">Setelah bayar, teks ini <b>terkunci</b> & terlihat penjual — jadi bahan bukti kalau ada perbedaan. Tulis yang jelas: cara serah terima (COD/antar/kurir), ongkir, kondisi.</div>
    <div class="note">🔒 Uangmu ditahan rekber BERBIRRU — baru diteruskan ke penjual setelah kamu klik "Pesanan Diterima". Sengketa? Owner yang Putus.</div>
  </form>

  <div class="kw-card">
    <div class="sec-t">Rincian</div>
    <div class="prod-line"><span>${escapeHtml(p.title)}</span><span>Rp${Number(p.price).toLocaleString('id-ID')}</span></div>
    ${Number(p.shipping_flat) > 0 ? `<div class="prod-line"><span>Ongkir (ditanggung penjual urus)</span><span>Rp${Number(p.shipping_flat).toLocaleString('id-ID')}</span></div>` : ''}
    <div class="prod-line tot"><span>Total QRIS</span><span>Rp${total.toLocaleString('id-ID')}</span></div>
  </div>
</div>

<div class="paybar">
  <div><div class="l">Total bayar</div><div class="t">Rp${total.toLocaleString('id-ID')}</div></div>
  <button type="button" onclick="pay()">🔒 Bayar via QRIS</button>
</div>

<script>
async function pay(){
  const e=document.getElementById('err');e.style.display='none';
  const t=document.getElementById('kesepakatan').value.trim();
  if(t.length<10){e.textContent='Tuliskan kesepakatan minimal 10 karakter ya.';e.style.display='block';return;}
  const r=await fetch('/api/pasar/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({listing_id:'${p.id}',kesepakatan:t})});
  const j=await r.json();
  if(r.ok&&j.ok){location.href='/pasar/order/'+j.id;}
  else{e.textContent=j.error||'Gagal membuat pesanan';e.style.display='block';}
}
</script>
</body></html>`;
}
