// Checkout "Kwitansi Rekber" — pembeli pilih kecamatan tujuan, tarif kurir dihitung live
// (BinderByte), lalu bayar sekali via QRIS. Harga ongkir TIDAK dipercaya dari klien:
// server mengutip ulang saat order dibuat (lihat POST /api/pasar/orders).

import { escapeHtml } from '../lib/sanitize';
import { PASAR_BASE_CSS, rupiah } from './pasar';

const PAGE_CSS = `
  .wrap{width:min(680px,calc(100% - 28px));margin:auto;padding:18px 0 130px}.page-head{margin:8px 0 22px}.page-head h1{margin:0 0 8px;font:700 clamp(40px,7vw,64px)/.95 'Newsreader';letter-spacing:-.04em}.page-head p{margin:0;color:#52627A;line-height:1.6}
  .kw-card{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;padding:18px;margin-bottom:18px}
  .sec-t{font:700 23px 'Newsreader';margin-bottom:12px}
  .prod-line{display:flex;justify-content:space-between;gap:10px;font-size:13px;font-weight:700;padding:5px 0;color:#334155}
  .prod-line.tot{border-top:2px dashed #0B192C;margin-top:8px;padding-top:12px;font:400 17px 'Archivo Black';color:#0F3E99}
  .lbl{display:block;font:700 11px 'Roboto Mono';letter-spacing:.04em;margin:0 0 6px}
  .inp{width:100%;min-height:46px;font:700 13.5px 'DM Sans';padding:10px 12px;border:2.5px solid #0B192C;background:#fff;color:#0B192C;outline:none}
  .inp:focus{box-shadow:3px 3px 0 #1D61E7}textarea.inp{min-height:90px;resize:vertical;line-height:1.5}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
  .hint{font-size:11px;font-weight:600;color:#64748B;margin-top:6px;line-height:1.5}
  .note{margin-top:14px;background:#E0EEFD;border:2px solid #0B192C;padding:11px 13px;font-size:11px;font-weight:700;color:#0F3E99;line-height:1.55}
  .err{display:none;background:#FEE2E2;border:2px solid #991B1B;color:#991B1B;padding:10px 12px;font-size:12px;font-weight:700;margin-bottom:14px}
  .btn-ongkir{width:100%;min-height:46px;background:#fff;border:2.5px solid #0B192C;font:900 13px 'DM Sans';cursor:pointer;box-shadow:3px 3px 0 #26364A;margin-top:10px}
  .btn-ongkir:active{transform:translate(2px,2px);box-shadow:none}
  .opt{display:flex;justify-content:space-between;align-items:center;gap:10px;border:2.5px solid #CBD5E1;padding:10px 12px;margin-top:8px;cursor:pointer;font-size:12.5px;font-weight:700;background:#fff}
  .opt input{accent-color:#1D61E7;width:18px;height:18px;flex:none}
  .opt.sel{border-color:#0B192C;box-shadow:3px 3px 0 #26364A;background:#FFFDF2}
  .opt .eta{font:600 10.5px 'Roboto Mono';color:#64748B}
  .paybar{position:fixed;bottom:0;left:0;right:0;width:100%;background:#fff;border-top:3px solid #0B192C;box-shadow:0 -5px 0 rgba(11,25,44,.08);padding:10px max(14px,calc((100% - 680px)/2));display:flex;justify-content:space-between;align-items:center;gap:12px;z-index:80}
  .paybar .l{font:700 10px 'Roboto Mono';color:#64748B;letter-spacing:.04em}.paybar .t{font:400 18px 'Archivo Black';color:#0F3E99}
  .paybar button{min-height:48px;background:#FDE047;color:#0B192C;border:3px solid #0B192C;padding:10px 18px;font-size:13px;font-weight:900;cursor:pointer;box-shadow:3px 4px 0 #26364A;white-space:nowrap}
  .paybar button:disabled{opacity:.5;cursor:not-allowed;box-shadow:none}
  @media(max-width:420px){.paybar{padding:9px 14px}.paybar button{padding:9px 12px}.wrap{padding-top:8px}.grid3{grid-template-columns:1fr}}
`;

export function renderCheckoutPage(user: any, p: any, saldo = 0): string {
  const u = user || {};
  const harga = Number(p.price);
  let couriers: string[] = [];
  try { couriers = JSON.parse(p.couriers || '[]'); } catch { couriers = []; }
  const NAMA: Record<string, string> = { jne: 'JNE', jnt: 'J&T', sicepat: 'SiCepat', pos: 'POS', anteraja: 'AnterAja' };
  const kurirTxt = couriers.length ? couriers.map((c) => NAMA[c] || c).join(' · ') : 'belum ditentukan penjual';

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beli — ${escapeHtml(p.title)} | BERBIRRU</title>
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
<div class="wrap">
  <div class="page-head"><h1>Checkout</h1><p>Pilih alamat &amp; layanan kurir, lalu bayar sekali lewat QRIS.</p></div>
  <div class="err" id="err"></div>

  <div class="kw-card">
    <div class="sec-t">Alamat Pengiriman</div>
    <label class="lbl">Nama penerima *</label>
    <input class="inp" id="fNama" maxlength="60" placeholder="Nama orang yang menerima paket" value="${escapeHtml(String(u.addr_receiver || ''))}">
    <label class="lbl" style="margin-top:12px;">Nomor HP penerima *</label>
    <input class="inp" id="fHp" type="tel" inputmode="tel" maxlength="20" placeholder="08xxxxxxxxxx" value="${escapeHtml(String(u.addr_phone || ''))}">
    <label class="lbl" style="margin-top:12px;">Kecamatan tujuan *</label>
    <div class="grid3">
      <select class="inp" id="fProv"><option value="">Provinsi</option></select>
      <select class="inp" id="fKab"><option value="">Kota/Kabupaten</option></select>
      <select class="inp" id="fKec"><option value="">Kecamatan</option></select>
    </div>
    <label class="lbl" style="margin-top:12px;">Kode pos *</label>
    <input class="inp" id="fPos" inputmode="numeric" maxlength="5" placeholder="40115" value="${escapeHtml(String(u.addr_postal || ''))}">
    <label class="lbl" style="margin-top:12px;">Alamat lengkap *</label>
    <textarea class="inp" id="fAlamat" maxlength="300" placeholder="Jalan, nomor rumah, RT/RW, kelurahan, patokan (mis. pagar hitam sebelah warung).">${escapeHtml(String(u.addr_text || ''))}</textarea>
    <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:11.5px;font-weight:800;">
      <input type="checkbox" id="fSimpan" checked style="width:18px;height:18px;">
      Simpan sebagai alamat utama (isi otomatis di checkout berikutnya)
    </label>
    <button type="button" class="btn-ongkir" id="btnOngkir">Cek Ongkir</button>
    <div class="hint" id="ongkirHint">Penjual melayani: ${escapeHtml(kurirTxt)}.</div>
    <div id="opsiBox"></div>
  </div>

  <div class="kw-card">
    <div class="sec-t">Kwitansi Rekber</div>
    <label class="lbl">Kesepakatan tambahan *</label>
    <textarea class="inp" id="kesepakatan" minlength="10" maxlength="500"
      placeholder="Contoh: buku dibungkus plastik + kardus, kirim hari ini."></textarea>
    <div class="hint">Teks ini <b>terkunci</b> setelah bayar dan terlihat penjual — jadi bahan bukti kalau ada perbedaan.</div>
    <div class="note">Uang ditahan rekber BERBIRRU dan baru diteruskan ke penjual setelah kamu mengonfirmasi pesanan diterima.</div>
  </div>

  <div class="kw-card">
    <div class="sec-t">Rincian</div>
    <div class="prod-line"><span>${escapeHtml(p.title)}</span><span>${rupiah(harga)}</span></div>
    <div class="prod-line"><span>Ongkir (<span id="lblKurir">belum dipilih</span>)</span><span id="lblOngkir">—</span></div>
    <div style="font:600 10.5px/1.5 'DM Sans';color:#64748B;margin:8px 0 0">Tarif kurir dihitung per kg, dibulatkan ke atas (minimum 1 kg), sudah termasuk estimasi hari tiba.</div>
    <div class="prod-line tot"><span>Total (belum termasuk biaya layanan)</span><span id="lblTotal">${rupiah(harga)}</span></div>
  </div>
</div>

<div style="font:600 10.5px/1.5 'DM Sans';color:#64748B;margin:0 0 90px">*Biaya layanan QRIS dihitung otomatis oleh penyedia pembayaran (bukan oleh BERBIRRU) dan tampil di halaman pesanan.</div>
<div id="saldoBox" style="display:none;background:#FEF3C7;border:2.5px solid #0B192C;box-shadow:4px 5px 0 #26364A;padding:12px;margin:0 0 90px;">
  <label style="display:flex;gap:9px;align-items:flex-start;font:800 13px 'DM Sans';">
    <input type="checkbox" id="fSaldo" onchange="pakaiSaldo()" style="width:20px;height:20px;margin-top:1px;">
    <span>Pakai saldo <b id="lblSaldo">${rupiah(saldo)}</b></span>
  </label>
  <div id="saldoHint" style="font:600 11px/1.5 'DM Sans';color:#78350F;margin-top:6px;"></div>
</div>

<div class="paybar">
  <div><div class="l">Total bayar*</div><div class="t" id="lblTotalBar">${rupiah(harga)}</div></div>
  <button type="button" id="btnBayar" onclick="pay()" disabled>Bayar via QRIS</button>
</div>

<script>
var HARGA = ${harga};
var SALDO = ${Number(saldo) || 0};
var LISTING = '${p.id}';
var pilihan = null;
var labelKec = '';

function el(id){return document.getElementById(id)}
function rp(n){return 'Rp'+Number(n||0).toLocaleString('id-ID')}
function err(t,focusId){
  var e=el('err');
  if(!t){e.style.display='none';return}
  e.textContent=t; e.style.display='block';
  // bar tombol bayar fixed di bawah: tanpa scroll, pesan error tampak "tidak terjadi apa-apa"
  try{e.scrollIntoView({block:'center',behavior:'smooth'})}catch(_){e.scrollIntoView()}
  var f=focusId&&el(focusId); if(f){try{f.focus({preventScroll:true})}catch(_){f.focus()}}
}

async function isiWilayah(sel, parent, label){
  sel.innerHTML='<option value="">'+label+'</option>';
  try{
    var j=await (await fetch('/api/kurir/wilayah'+(parent?'?parent='+encodeURIComponent(parent):''))).json();
    if(!j.ok){sel.innerHTML='<option value="">'+(j.error||'Gagal memuat')+'</option>';return}
    j.items.forEach(function(it){var o=document.createElement('option');o.value=it.id;o.textContent=it.name;sel.appendChild(o)});
  }catch(e){sel.innerHTML='<option value="">Gagal memuat wilayah</option>'}
}

var fProv=el('fProv'),fKab=el('fKab'),fKec=el('fKec');
isiWilayah(fProv,null,'Provinsi');
fProv.onchange=function(){fKab.innerHTML='<option value="">Kota/Kabupaten</option>';fKec.innerHTML='<option value="">Kecamatan</option>';resetOngkir();if(fProv.value)isiWilayah(fKab,fProv.value,'Kota/Kabupaten')};
fKab.onchange=function(){fKec.innerHTML='<option value="">Kecamatan</option>';resetOngkir();if(fKab.value)isiWilayah(fKec,fKab.value,'Kecamatan')};
fKec.onchange=function(){
  resetOngkir();
  if(!fKec.value){labelKec='';return}
  var k=fKec.options[fKec.selectedIndex],b=fKab.options[fKab.selectedIndex],p=fProv.options[fProv.selectedIndex];
  labelKec=[k&&k.textContent,b&&b.textContent,p&&p.textContent].filter(Boolean).join(', ');
};

function resetOngkir(){
  pilihan=null; el('opsiBox').innerHTML='';
  el('lblOngkir').textContent='—'; el('lblKurir').textContent='belum dipilih';
  el('lblTotal').textContent=rp(HARGA); el('lblTotalBar').textContent=rp(HARGA);
  el('btnBayar').disabled=true;
}

function pilih(o,box){
  pilihan=o;
  Array.prototype.forEach.call(document.querySelectorAll('.opt'),function(x){x.classList.remove('sel')});
  box.classList.add('sel'); box.querySelector('input').checked=true;
  el('lblKurir').textContent=o.courierName+' '+o.service;
  el('lblOngkir').textContent=rp(o.price);
  var tot=HARGA+o.price;
  el('lblTotal').textContent=rp(tot); el('lblTotalBar').textContent=rp(tot);
  el('btnBayar').disabled=false;
  aturSaldo(tot);
}

// Saldo hanya boleh dipakai kalau MENUTUP SELURUH tagihan (harga + ongkir).
function aturSaldo(tot){
  var box=el('saldoBox'), cb=el('fSaldo'), hint=el('saldoHint');
  if(SALDO<=0){box.style.display='none';cb.checked=false;return}
  box.style.display='block';
  var cukup = SALDO>=tot;
  cb.disabled=!cukup;
  if(!cukup){cb.checked=false;}
  hint.textContent = cukup
    ? 'Saldo cukup untuk seluruh tagihan — tidak perlu QRIS. Sisa saldo '+rp(SALDO-tot)+'.'
    : 'Saldo '+rp(SALDO)+' belum menutup tagihan '+rp(tot)+'. Tidak bisa dipakai — bayar penuh via QRIS.';
  pakaiSaldo();
}

function pakaiSaldo(){
  var cb=el('fSaldo'), b=el('btnBayar');
  b.textContent = (cb.checked ? 'Bayar dengan saldo' : 'Bayar via QRIS');
}

el('btnOngkir').onclick=async function(){
  err('');
  if(!fKec.value){err('Pilih kecamatan tujuan dulu ya.');return}
  var btn=this; btn.disabled=true; btn.textContent='Menghitung…';
  try{
    var r=await fetch('/api/pasar/ongkir',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({listing_id:LISTING,dest_id:fKec.value,dest_name:labelKec})});
    var j=await r.json();
    if(!r.ok||!j.ok){err(j.error||'Tarif tidak tersedia.');el('opsiBox').innerHTML='';return}
    var box=el('opsiBox');
    box.innerHTML='<label class="lbl" style="margin-top:14px;">Pilih layanan</label>'+
      j.options.map(function(o,i){
        return '<label class="opt" data-i="'+i+'"><span><b>'+o.courierName+' '+o.service+'</b><div class="eta">'+o.eta+'</div></span>'+
               '<span style="text-align:right;"><b>'+rp(o.price)+'</b><input type="radio" name="ship" value="'+i+'"></span></label>';
      }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('.opt'),function(node){
      node.onclick=function(ev){ev.preventDefault();pilih(j.options[Number(node.getAttribute('data-i'))],node)};
    });
  }catch(e){err('Gagal menghitung ongkir. Coba lagi.')}
  finally{btn.disabled=false;btn.textContent='Cek Ongkir'}
};

function labelOf(id){
  var sel=el(id); if(!sel||!sel.selectedIndex) return '';
  return (sel.options[sel.selectedIndex]||{}).text||'';
}

async function pay(){
  err('');
  var t=el('kesepakatan').value.trim();
  var alamat=el('fAlamat').value.trim();
  var nama=el('fNama').value.trim();
  var hp=el('fHp').value.replace(/[^0-9+]/g,'');
  var pos=el('fPos').value.replace(/[^0-9]/g,'');
  if(nama.length<3){err('Isi nama penerima (minimal 3 huruf).','fNama');return}
  if(hp.replace(/[^0-9]/g,'').length<9){err('Isi nomor HP penerima yang bisa dihubungi kurir.','fHp');return}
  if(pos.length!==5){err('Kode pos harus 5 angka.','fPos');return}
  if(!fKec.value){err('Pilih kecamatan tujuan dulu ya.','fKec');return}
  if(alamat.length<10){err('Tulis alamat lengkap minimal 10 karakter.','fAlamat');return}
  if(!pilihan){err('Cek ongkir lalu pilih layanan pengiriman.','btnOngkir');return}
  if(t.length<10){err('Tuliskan kesepakatan minimal 10 karakter ya.','kesepakatan');return}
  var b=el('btnBayar'); b.disabled=true; b.textContent='Menyiapkan…';
  try{
    var r=await fetch('/api/pasar/orders',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({listing_id:LISTING,kesepakatan:t,dest_id:fKec.value,dest_name:labelKec,
        dest_address:alamat,courier:pilihan.courier,service:pilihan.service,shipping:pilihan.price,
        receiver_name:nama,receiver_phone:hp,postal_code:pos,
        save_address:!!(el('fSimpan')&&el('fSimpan').checked),
        dest_province_id:(el('fProv').value||''),dest_province_name:labelOf('fProv'),
        dest_city_id:(el('fKab').value||''),dest_city_name:labelOf('fKab')})});
    var j=await r.json();
    if(r.ok&&j.ok){location.href='/pasar/order/'+j.id;return}
    err(j.error||'Gagal membuat pesanan');
  }catch(e){err('Gagal membuat pesanan. Coba lagi.')}
  b.disabled=false; pakaiSaldo();
}
// isi otomatis alamat tersimpan (kalau ada)
(async function prefill(){
  var P='${escapeHtml(String(u.addr_province_id || ''))}',
      K='${escapeHtml(String(u.addr_city_id || ''))}',
      C='${escapeHtml(String(u.addr_district_id || ''))}';
  if(!P) return;
  try{
    var selP=el('fProv');
    for(var i=0;i<40;i++){ if(selP.options.length>1) break; await new Promise(function(r){setTimeout(r,250)}); }
    selP.value=P; selP.dispatchEvent(new Event('change'));
    for(var j=0;j<40;j++){ if(el('fKab').options.length>1) break; await new Promise(function(r){setTimeout(r,250)}); }
    el('fKab').value=K; el('fKab').dispatchEvent(new Event('change'));
    for(var k=0;k<40;k++){ if(el('fKec').options.length>1) break; await new Promise(function(r){setTimeout(r,250)}); }
    el('fKec').value=C; el('fKec').dispatchEvent(new Event('change'));
  }catch(e){}
})();
</script>
</body></html>`;
}
