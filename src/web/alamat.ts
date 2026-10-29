import { THEME } from './theme';
import { escapeHtml } from '../lib/sanitize';
import { PASAR_BASE_CSS } from './pasar';
import { renderBottomNav } from './layout';

const CSS = `
  .al-card{background:#fff;border:3px solid var(--ink);box-shadow:5px 6px 0 var(--ink-soft);padding:13px;margin-bottom:14px}
  .al-card.utama{border-color:var(--blue);box-shadow:5px 6px 0 var(--deep)}
  .al-lbl{font:800 9.5px 'Roboto Mono';letter-spacing:.07em;text-transform:uppercase;color:#7A8798;margin-bottom:6px}
  .al-nm{font:800 14px 'DM Sans';display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:4px}
  .al-tag{font:800 8.5px 'Roboto Mono';background:#E0EEFD;color:var(--deep);border:1.5px solid var(--deep);padding:2px 5px;letter-spacing:.05em}
  .al-tag.utama{background:var(--yellow);color:var(--ink);border-color:var(--ink)}
  .al-addr{font:600 12px/1.55 'DM Sans';color:#2C3A4D}
  .al-meta{font:600 11px 'DM Sans';color:#5B6B80;margin-top:3px}
  .al-row{display:flex;gap:8px;margin-top:11px;padding-top:11px;border-top:2px dashed #D8D2C0}
  .al-row form{flex:1;margin:0}
  .al-mini{width:100%;font:800 11px 'DM Sans';border:2px solid var(--ink);background:#fff;color:var(--ink);padding:7px 6px;cursor:pointer;box-shadow:2px 2px 0 var(--ink)}
  .al-mini.blue{background:var(--blue);color:#fff}
  .al-mini.red{color:#B42318}
  .al-tambah{width:100%;min-height:46px;background:var(--yellow);color:var(--ink);border:3px solid var(--ink);box-shadow:3px 4px 0 var(--ink-soft);font:900 13px 'DM Sans';cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none;margin-bottom:8px}
  .al-note{font:600 11px/1.5 'DM Sans';color:#5B6B80;margin:0 0 18px}
  .al-f{margin-bottom:12px}
  .al-f label{display:block;font:800 9.5px 'Roboto Mono';letter-spacing:.06em;text-transform:uppercase;color:#5B6B80;margin-bottom:5px}
  .al-f input,.al-f textarea,.al-f select{width:100%;border:2.5px solid var(--ink);padding:10px 11px;font:700 12.5px 'DM Sans';background:#fff;outline:none;border-radius:0}
  .al-f textarea{min-height:74px;resize:vertical}
  .al-f .hint{font:600 10.5px 'DM Sans';color:#8792A2;margin-top:4px}
  .al-f2{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .al-chips{display:flex;gap:7px;flex-wrap:wrap}
  .al-chip{font:800 11px 'DM Sans';border:2px solid var(--ink);background:#fff;padding:7px 11px;cursor:pointer;box-shadow:2px 2px 0 var(--ink-soft)}
  .al-chip:active{transform:translate(1px,1px);box-shadow:1px 1px 0 var(--ink-soft)}
  .al-simpan{width:100%;min-height:48px;background:var(--blue);color:#fff;border:3px solid var(--ink);box-shadow:3px 4px 0 var(--ink-soft);font:900 13px 'DM Sans';cursor:pointer;margin-bottom:10px}
  .al-batal{display:block;text-align:center;font:800 12px 'DM Sans';color:var(--ink);text-decoration:underline;padding:8px}
  .al-err{background:#FEE2E2;border:2.5px solid #B42318;color:#7F1D1D;font:700 12px 'DM Sans';padding:10px 12px;margin-bottom:14px}
  .al-ok{background:#DCFCE7;border:2.5px solid #059669;color:#065F46;font:700 12px 'DM Sans';padding:10px 12px;margin-bottom:14px}
  .al-cek{display:flex;gap:9px;align-items:flex-start;font:700 12px 'DM Sans';margin:2px 0 16px}
  .al-cek input{width:19px;height:19px;margin-top:1px}
`;

const KEPALA = (judul: string, sub: string) =>
  `<div class="page-head"><h1>${judul}</h1><p>${sub}</p></div>`;

const bungkus = (user: any, judul: string, isi: string) => `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${judul} | BERBIRRU</title>
<link rel="icon" type="image/svg+xml" href="/favicon.ico">
${PASAR_BASE_CSS}
<style>
    :root{--muted:${THEME.muted};--ink-soft:${THEME.inkSoft};--line-soft:${THEME.lineSoft};}${CSS}</style></head>
<body>
<div class="wrap">${isi}</div>
${renderBottomNav('akun' as any, user, false, { mode: 'pasar', marketTab: 'akun' as any })}
</body></html>`;

/** Daftar alamat tersimpan (maks 5). */
export function renderAlamatListPage(user: any, list: any[], pesan = ''): string {
  const kartu = list.map((a, i) => `
    <div class="al-card${a.is_default ? ' utama' : ''}">
      <div class="al-lbl">${a.is_default ? 'Alamat utama' : 'Alamat ' + (i + 1)}</div>
      <div class="al-nm">${escapeHtml(a.receiver)}
        ${a.label ? `<span class="al-tag">${escapeHtml(a.label)}</span>` : ''}
        ${a.is_default ? '<span class="al-tag utama">UTAMA</span>' : ''}
      </div>
      <div class="al-addr">${escapeHtml(a.text)}</div>
      <div class="al-meta">${escapeHtml([a.district_name, a.city_name, a.province_name].filter(Boolean).join(', '))}${a.postal ? ' ' + escapeHtml(a.postal) : ''} · ${escapeHtml(a.phone)}</div>
      <div class="al-row">
        <form method="get" action="/akun/alamat/${escapeHtml(a.id)}/ubah"><button class="al-mini blue">Ubah</button></form>
        ${a.is_default ? '' : `<form method="post" action="/akun/alamat/${escapeHtml(a.id)}/utama"><button class="al-mini">Jadikan utama</button></form>`}
        ${list.length > 1 ? `<form method="post" action="/akun/alamat/${escapeHtml(a.id)}/hapus" onsubmit="return confirm('Hapus alamat ini?')"><button class="al-mini red">Hapus</button></form>` : ''}
      </div>
    </div>`).join('');

  return bungkus(user, 'Alamat Pengiriman', `
  ${KEPALA('Alamat Pengiriman', list.length ? 'Simpan beberapa alamat. Saat checkout tinggal pilih.' : 'Belum ada alamat. Tambahkan satu supaya checkout lebih cepat.')}
  ${pesan ? `<div class="al-ok">${escapeHtml(pesan)}</div>` : ''}
  ${kartu || '<div class="al-card"><div class="al-addr">Belum ada alamat tersimpan.</div></div>'}
  ${list.length < 5 ? '<a class="al-tambah" href="/akun/alamat/baru">+ Tambah alamat baru</a>' : '<p class="al-note">Sudah 5 alamat — hapus salah satu untuk menambah.</p>'}
  <p class="al-note">Alamat utama dipakai otomatis saat checkout. Maksimal 5 alamat, minimal satu harus jadi utama.</p>`);
}

/** Form tambah/ubah alamat. */
export function renderAlamatFormPage(user: any, a: any = null, err = ''): string {
  // Form dipakai untuk tambah (tanpa id) dan ubah (dengan id). Nilai awal boleh ada walau tanpa id.
  const ada = !!(a && a.id);
  const d = a || {};
  const v = (k: string, d2 = '') => escapeHtml(String(d[k] ?? d2));
  const judul = ada ? 'Ubah Alamat' : 'Tambah Alamat';
  const label = String(d.label || '');
  return bungkus(user, judul, `
  ${KEPALA(judul, 'Dipakai sebagai tujuan pengiriman saat checkout.')}
  ${err ? `<div class="al-err">${escapeHtml(err)}</div>` : ''}
  <form method="post" action="${ada ? '/akun/alamat/' + escapeHtml(a.id) : '/akun/alamat'}">
    <div class="al-f">
      <label>Label alamat</label>
      <input name="label" id="fLabel" maxlength="20" value="${label}" placeholder="Rumah / Kantor / Kos">
      <div class="al-chips" style="margin-top:7px;">
        ${['Rumah', 'Kantor', 'Kos', 'Orang tua'].map((c) => `<button type="button" class="al-chip" onclick="document.getElementById('fLabel').value='${c}'">${c}</button>`).join('')}
      </div>
    </div>
    <div class="al-f"><label>Nama penerima *</label><input name="receiver" maxlength="60" required value="${v('receiver')}" placeholder="Nama yang menerima paket"></div>
    <div class="al-f"><label>Nomor HP *</label><input name="phone" type="tel" inputmode="tel" maxlength="20" required value="${v('phone')}" placeholder="08xxxxxxxxxx"></div>
    <div class="al-f"><label>Kecamatan tujuan *</label>
      <div class="al-f2" style="grid-template-columns:1fr 1fr;">
        <select id="fProv"><option value="">Provinsi</option></select>
        <select id="fKab"><option value="">Kota/Kabupaten</option></select>
      </div>
      <select id="fKec" style="margin-top:9px;"><option value="">Kecamatan</option></select>
      <div class="hint">Kecamatan menentukan tarif ongkir.</div>
    </div>
    <div class="al-f"><label>Kode pos *</label><input name="postal" inputmode="numeric" maxlength="5" required value="${v('postal')}" placeholder="40115"></div>
    <div class="al-f"><label>Alamat lengkap *</label><textarea name="text" maxlength="300" required placeholder="Jalan, nomor rumah, RT/RW, kelurahan, patokan">${v('text')}</textarea>
      <div class="hint">Sertakan patokan supaya kurir tidak tersesat.</div>
    </div>
    <input type="hidden" name="province_id" id="hProv" value="${v('province_id')}">
    <input type="hidden" name="province_name" id="hProvN" value="${v('province_name')}">
    <input type="hidden" name="city_id" id="hKab" value="${v('city_id')}">
    <input type="hidden" name="city_name" id="hKabN" value="${v('city_name')}">
    <input type="hidden" name="district_id" id="hKec" value="${v('district_id')}">
    <input type="hidden" name="district_name" id="hKecN" value="${v('district_name')}">
    <label class="al-cek"><input type="checkbox" name="utama" value="1" ${!ada || a.is_default ? 'checked' : ''}> <span>Jadikan alamat utama<br><span style="font-weight:600;color:#5B6B80">Alamat utama terpilih otomatis saat checkout.</span></span></label>
    <button class="al-simpan">${ada ? 'Simpan perubahan' : 'Simpan alamat'}</button>
    <a class="al-batal" href="/akun/alamat">Batal</a>
  </form>
  <script>
  function el(i){return document.getElementById(i)}
  async function isiWilayah(sel,parent,label){
    sel.innerHTML='<option value="">'+label+'</option>';
    try{
      var j=await (await fetch('/api/kurir/wilayah'+(parent?'?parent='+encodeURIComponent(parent):''))).json();
      if(!j.ok){sel.innerHTML='<option value="">'+(j.error||'Gagal memuat')+'</option>';return}
      j.items.forEach(function(it){var o=document.createElement('option');o.value=it.id;o.textContent=it.name;sel.appendChild(o)});
    }catch(e){sel.innerHTML='<option value="">Gagal memuat wilayah</option>'}
  }
  var P=el('fProv'),K=el('fKab'),C=el('fKec');
  function sync(){
    var p=P.options[P.selectedIndex],k=K.options[K.selectedIndex],c=C.options[C.selectedIndex];
    el('hProv').value=P.value; el('hProvN').value=p?p.textContent:'';
    el('hKab').value=K.value;   el('hKabN').value=k?k.textContent:'';
    el('hKec').value=C.value;   el('hKecN').value=c?c.textContent:'';
  }
  P.onchange=function(){K.innerHTML='<option value="">Kota/Kabupaten</option>';C.innerHTML='<option value="">Kecamatan</option>';sync();if(P.value)isiWilayah(K,P.value,'Kota/Kabupaten')};
  K.onchange=function(){C.innerHTML='<option value="">Kecamatan</option>';sync();if(K.value)isiWilayah(C,K.value,'Kecamatan')};
  C.onchange=sync;
  (async function(){
    var P0='${v('province_id')}',K0='${v('city_id')}',C0='${v('district_id')}';
    await isiWilayah(P,null,'Provinsi');
    if(!P0) return;
    P.value=P0; await isiWilayah(K,P0,'Kota/Kabupaten'); K.value=K0;
    if(!K0) return;
    await isiWilayah(C,K0,'Kecamatan'); C.value=C0; sync();
  })();
  </script>`);
}
