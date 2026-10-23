// Checkout "Kwitansi Rekber" — platform BUKAN logistik.
// Pengiriman 100% antar penjual & pembeli; platform mencatat kesepakatan + menahan dana.
// Pembeli bayar harga listing persis (ongkir sudah masuk angka penjual bila ada).

import { escapeHtml } from '../lib/sanitize';
import { BRAND_HEADER, PASAR_BASE_CSS, rupiah } from './pasar';

const PAGE_CSS = `
  .wrap{width:min(680px,calc(100% - 28px));margin:auto;padding:18px 0 116px}.page-head{margin:8px 0 22px}.page-head h1{margin:0 0 8px;font:700 clamp(40px,7vw,64px)/.95 'Newsreader';letter-spacing:-.04em}.page-head p{margin:0;color:#52627A;line-height:1.6}.kw-card{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;padding:18px;margin-bottom:20px}.sec-t{font:700 23px 'Newsreader';margin-bottom:12px}.prod-line{display:flex;justify-content:space-between;gap:10px;font-size:13px;font-weight:700;padding:5px 0;color:#334155}.prod-line.tot{border-top:2px dashed #0B192C;margin-top:8px;padding-top:12px;font:400 17px 'Archivo Black';color:#0F3E99}.lbl{display:block;font:700 11px 'Roboto Mono';letter-spacing:.04em;margin:0 0 6px}.inp{width:100%;min-height:46px;font:700 13.5px 'DM Sans';padding:10px 12px;border:2.5px solid #0B192C;background:#fff;color:#0B192C;outline:none}.inp:focus{box-shadow:3px 3px 0 #1D61E7}textarea.inp{min-height:105px;resize:vertical;line-height:1.5}.hint{font-size:11px;font-weight:600;color:#64748B;margin-top:6px;line-height:1.5}.note{margin-top:14px;background:#E0EEFD;border:2px solid #0B192C;padding:11px 13px;font-size:11px;font-weight:700;color:#0F3E99;line-height:1.55}.err{display:none;background:#FEE2E2;border:2px solid #991B1B;color:#991B1B;padding:10px 12px;font-size:12px;font-weight:700;margin-bottom:14px}.paybar{position:fixed;bottom:0;left:0;right:0;width:100%;background:#fff;border-top:3px solid #0B192C;box-shadow:0 -5px 0 rgba(11,25,44,.08);padding:10px max(14px,calc((100% - 680px)/2));display:flex;justify-content:space-between;align-items:center;gap:12px;z-index:80}.paybar .l{font:700 10px 'Roboto Mono';color:#64748B;letter-spacing:.04em}.paybar .t{font:400 18px 'Archivo Black';color:#0F3E99}.paybar button{min-height:48px;background:#FDE047;color:#0B192C;border:3px solid #0B192C;padding:10px 18px;font-size:13px;font-weight:900;cursor:pointer;box-shadow:3px 4px 0 #26364A;white-space:nowrap}@media(max-width:420px){.paybar{padding:9px 14px}.paybar button{padding:9px 12px}.wrap{padding-top:8px}}
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
<div class="wrap">
  <div class="page-head"><h1>Checkout</h1><p>Alamat dan ekspedisi disepakati, lalu bayar sekali melalui QRIS sandbox.</p></div>
  <div class="err" id="err"></div>

  <form id="kw_form" class="kw-card">
    <div class="sec-t">Kwitansi Rekber</div>
    <div class="lbl">Tuliskan kesepakatan kalian *</div>
    <textarea class="inp" id="kesepakatan" required minlength="10" maxlength="500"
      placeholder="Contoh: COD di dekos Cibiru, atau ongkir JNE Rp10rb diluar harga. Buku dibungkus plastik."></textarea>
    <div class="hint">Setelah bayar, teks ini <b>terkunci</b> & terlihat penjual — jadi bahan bukti kalau ada perbedaan. Tulis yang jelas: cara serah terima (COD/antar/kurir), ongkir, kondisi.</div>
    <div class="note">Uang ditahan rekber BERBIRRU dan baru diteruskan setelah pembeli mengonfirmasi pesanan diterima.</div>
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
  <button type="button" onclick="pay()">Bayar via QRIS</button>
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
