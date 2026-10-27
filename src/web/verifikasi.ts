// Gerbang verifikasi penjual. Sebelum approved, /pasar/jual menampilkan status ini, bukan form jual.
import { renderBottomNav } from './layout';
import { escapeHtml } from '../lib/sanitize';
import { PASAR_BASE_CSS } from './pasar';

const PAGE_CSS = `
  .wrap{width:min(620px,calc(100% - 28px));margin:auto;padding:18px 0 120px}
  .page-head{margin:8px 0 20px}.page-head h1{margin:0 0 8px;font:700 clamp(36px,6vw,56px)/.95 'Newsreader';letter-spacing:-.04em}
  .page-head p{margin:0;color:#52627A;line-height:1.6}
  .card{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;padding:18px;margin-bottom:18px}
  .sec-t{font:700 21px 'Newsreader';margin-bottom:10px}
  .sub{font-size:12.5px;font-weight:600;color:#475569;line-height:1.65}
  .lbl{display:block;font:700 10px 'Roboto Mono';color:#64748B;letter-spacing:.05em;text-transform:uppercase;margin:12px 0 5px}
  .inp{width:100%;min-height:46px;font:700 13.5px 'DM Sans';padding:10px 12px;border:2.5px solid #0B192C;background:#fff;color:#0B192C;outline:none;box-sizing:border-box}
  .inp:focus{box-shadow:3px 3px 0 #1D61E7}textarea.inp{min-height:88px;resize:vertical;line-height:1.5}
  .btn{width:100%;min-height:48px;border:3px solid #0B192C;padding:11px 15px;font:900 13.5px 'DM Sans';cursor:pointer;box-shadow:3px 4px 0 #26364A;background:#1D61E7;color:#fff;margin-top:14px}
  .btn:active{transform:translate(2px,3px);box-shadow:none}
  .err{display:none;background:#FEE2E2;border:2px solid #991B1B;color:#991B1B;padding:10px 12px;font-size:12px;font-weight:700;margin-bottom:12px}
  .state{display:inline-block;font:800 10px 'Roboto Mono';letter-spacing:.06em;text-transform:uppercase;padding:4px 9px;border:2px solid #0B192C;background:#FDE047;margin-bottom:10px}
  .list{margin:10px 0 0;padding-left:18px;font-size:12.5px;font-weight:600;color:#334155;line-height:1.75}
  .doc{border:2.5px dashed #0B192C;background:#FFFDF2;padding:10px 12px;margin-top:10px}
  .doc.ok{border-style:solid;background:#DCFCE7;border-color:#166534}
  .doc b{display:block;font:800 12.5px 'DM Sans';margin-bottom:3px}
  .doc .hint{font-size:11.5px;font-weight:600;color:#475569;line-height:1.45}
  .doc input[type=file]{width:100%;margin-top:7px;font-size:11.5px}
  .doc .st{font:800 10px 'Roboto Mono';letter-spacing:.05em;text-transform:uppercase;color:#166534;margin-top:6px;display:none}
  .doc.ok .st{display:block}
  .doc .galat{font-size:11px;font-weight:700;color:#991B1B;margin-top:5px;display:none}
`;

const STATUS_TXT: Record<string, string> = {
  none: 'Belum diverifikasi',
  pending: 'Menunggu review owner',
  rejected: 'Ditolak',
  approved: 'Terverifikasi',
};

export function renderVerifikasiPage(user: any): string {
  const st = user.seller_status || 'none';
  const bolehAjukan = st === 'none' || st === 'rejected';

  const isi = st === 'pending'
    ? `<div class="card">
         <span class="state">Menunggu review</span>
         <div class="sec-t">Pengajuanmu sedang ditinjau owner</div>
         <div class="sub">Owner memeriksa data yang kamu kirim secara manual. Kamu akan bisa mulai berjualan begitu disetujui. Biasanya 1×24 jam.</div>
         <ul class="list">
           <li>Toko: ${escapeHtml(user.shop_name || '—')}</li>
           <li>Nama: ${escapeHtml(user.seller_full_name || '—')}</li>
           <li>WhatsApp: ${escapeHtml(user.seller_phone || '—')}</li>
           ${user.seller_note ? `<li>Catatan: ${escapeHtml(user.seller_note)}</li>` : ''}
         </ul>
       </div>`
    : `<div class="card">
         <span class="state">${escapeHtml(STATUS_TXT[st] || st)}</span>
         <div class="sec-t">Verifikasi Penjual</div>
         <div class="sub">Pasar Buku memakai rekber: uang pembeli ditahan platform. Karena itu penjual diverifikasi manual oleh owner dulu — supaya pembeli tidak bertransaksi dengan akun asal-asalan.</div>
         ${st === 'rejected' && user.seller_reject_reason ? `<div class="err" style="display:block;margin-top:12px;">Alasan ditolak: ${escapeHtml(user.seller_reject_reason)}</div>` : ''}
         <div class="err" id="err"></div>
         <label class="lbl" for="vShop">Nama toko *</label>
         <input class="inp" id="vShop" maxlength="40" placeholder="Contoh: Warkah Bekas Cibiru" value="${escapeHtml(user.shop_name || '')}">
         <label class="lbl" for="vName">Nama lengkap *</label>
         <input class="inp" id="vName" maxlength="80" placeholder="Sesuai KTP / nama yang bisa dihubungi" value="${escapeHtml(user.seller_full_name || '')}">
         <label class="lbl" for="vPhone">Nomor WhatsApp *</label>
         <input class="inp" id="vPhone" inputmode="numeric" maxlength="15" placeholder="08xxxxxxxxxx" value="${escapeHtml(user.seller_phone || '')}">
         <div class="doc ${user.doc_ktp ? 'ok' : ''}" id="docKtp">
           <b>Foto KTP *</b>
           <div class="hint">Pastikan nama & NIK terbaca. Hanya owner yang bisa melihat berkas ini.</div>
           <input type="file" accept="image/jpeg,image/png,image/webp" onchange="unggahDok('ktp',this)">
           <div class="st">✓ sudah diunggah</div>
           <div class="galat"></div>
         </div>
         <div class="doc ${user.doc_bank ? 'ok' : ''}" id="docBank">
           <b>Foto buku tabungan / rekening *</b>
           <div class="hint">Nama pemilik rekening harus sama dengan nama di KTP.</div>
           <input type="file" accept="image/jpeg,image/png,image/webp" onchange="unggahDok('bank',this)">
           <div class="st">✓ sudah diunggah</div>
           <div class="galat"></div>
         </div>
         <label class="lbl" for="vBankName">Nama pemilik rekening / QRIS *</label>
        <input class="inp" id="vBankName" maxlength="80" placeholder="Harus sama dengan nama di rekening — dipakai saat pencairan" value="${escapeHtml(user.seller_bank_name || '')}">
        <label class="lbl" for="vBankAcc">Nomor rekening / QRIS *</label>
        <input class="inp" id="vBankAcc" inputmode="numeric" maxlength="20" placeholder="8–20 angka" value="${escapeHtml(user.seller_bank_account || '')}">
        <label class="lbl" for="vNote">Buku apa yang mau kamu jual? (opsional)</label>
         <textarea class="inp" id="vNote" maxlength="300" placeholder="Contoh: koleksi sastra & buku bekas layak pakai, sekitar 40 judul.">${escapeHtml(user.seller_note || '')}</textarea>
         <button class="btn" id="btnAjukan" onclick="ajukan()">Ajukan Verifikasi</button>
         <div class="sub" style="margin-top:10px;">Dengan mengajukan, kamu setuju biaya rekber Rp5.000 per transaksi ditanggung penjual dan wajib mengirim sesuai kesepakatan.</div>
       </div>`;

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Verifikasi Penjual — Pasar Buku BERBIRRU</title>
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
<div class="wrap">
  <div class="page-head"><h1>Jual Buku</h1><p>Verifikasi penjual diperlukan sebelum buku bisa dipasang.</p></div>
  ${isi}
</div>
<script>
function err(t){var e=document.getElementById('err'); if(!t){e.style.display='none';return} e.textContent=t; e.style.display='block'}
var punyaKtp=${user.doc_ktp ? 'true' : 'false'}, punyaBank=${user.doc_bank ? 'true' : 'false'};
async function unggahDok(kind,input){
  var box=document.getElementById(kind==='ktp'?'docKtp':'docBank');
  var g=box.querySelector('.galat'); g.style.display='none';
  var f=input.files&&input.files[0];
  if(!f) return;
  if(f.size>5*1024*1024){g.textContent='Maksimal 5MB.';g.style.display='block';input.value='';return}
  box.querySelector('.hint').textContent='Mengunggah…';
  try{
    var r=await fetch('/api/pasar/seller/docs?kind='+kind,{method:'POST',headers:{'Content-Type':f.type},body:f});
    var j=await r.json().catch(function(){return{}});
    if(!r.ok){g.textContent=j.error||'Gagal mengunggah.';g.style.display='block';return}
    box.classList.add('ok');
    box.querySelector('.hint').textContent=kind==='ktp'?'Foto KTP tersimpan.':'Foto rekening tersimpan.';
    if(kind==='ktp') punyaKtp=true; else punyaBank=true;
  }catch(e){g.textContent='Gagal mengunggah. Coba lagi.';g.style.display='block'}
}
async function ajukan(){
  err('');
  var shop=document.getElementById('vShop').value.trim();
  var name=document.getElementById('vName').value.trim();
  var phone=document.getElementById('vPhone').value.replace(/\\D/g,'');
  var bankName=document.getElementById('vBankName').value.trim();
  var bankAcc=document.getElementById('vBankAcc').value.replace(/\\D/g,'');
  var note=document.getElementById('vNote').value.trim();
  if(shop.length<2){err('Isi nama toko minimal 2 karakter.');return}
  if(name.length<3){err('Isi nama lengkap minimal 3 karakter.');return}
  if(!/^0?8\\d{8,13}$/.test(phone)){err('Nomor WhatsApp tidak valid (contoh 08xxxxxxxxxx).');return}
  if(bankName.length<3){err('Isi nama pemilik rekening/QRIS (min 3 karakter).');return}
  if(bankAcc.length<8){err('Nomor rekening/QRIS minimal 8 angka.');return}
  if(!punyaKtp||!punyaBank){err('Unggah foto KTP dan buku tabungan dulu — owner memeriksanya manual.');return}
  var b=document.getElementById('btnAjukan'); b.disabled=true; b.textContent='Mengirim…';
  try{
    var r=await fetch('/api/pasar/seller/apply',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({shop_name:shop,full_name:name,phone:phone,note:note,bank_name:bankName,bank_account:bankAcc})});
    var j=await r.json();
    if(!r.ok||!j.ok){err(j.error||'Gagal mengirim pengajuan.');b.disabled=false;b.textContent='Ajukan Verifikasi';return}
    location.reload();
  }catch(e){err('Gagal mengirim pengajuan. Coba lagi.');b.disabled=false;b.textContent='Ajukan Verifikasi'}
}
</script>
${renderBottomNav('pasar', user, false, { mode: 'pasar', marketTab: 'toko' })}
</body></html>`;
}
