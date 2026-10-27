import { escapeHtml } from '../lib/sanitize';
import { PASAR_BASE_CSS } from './pasar';
import { renderBottomNav } from './layout';

const rupiah = (n: number) => 'Rp' + Number(n || 0).toLocaleString('id-ID');

const CSS = `
  .ak-card{background:#fff;border:3px solid #0B192C;box-shadow:5px 6px 0 #26364A;border-radius:12px;overflow:hidden;margin-bottom:16px}
  .ak-row{display:flex;align-items:center;gap:12px;padding:14px;border-bottom:2px solid #E2E8F0;text-decoration:none;color:#0B192C}
  .ak-row:last-child{border-bottom:0}
  .ak-row:active{background:#FEF9C3}
  .ak-ic{width:34px;height:34px;flex:none;display:grid;place-items:center;background:#F1F5F9;border:2px solid #0B192C;border-radius:8px}
  .ak-ic svg{width:17px;height:17px;stroke:#0B192C;stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round}
  .ak-t{flex:1;min-width:0}
  .ak-t b{display:block;font:800 14px 'DM Sans'}
  .ak-t span{display:block;font:600 11.5px 'DM Sans';color:#64748B;margin-top:2px}
  .ak-arw{font:900 15px 'DM Sans';color:#94A3B8}
  .ak-row.danger .ak-ic{background:#FEE2E2}.ak-row.danger b{color:#B42318}
  .ak-btn{width:100%;min-height:46px;background:#fff;border:3px solid #0B192C;box-shadow:3px 4px 0 #26364A;font:900 13px 'DM Sans';cursor:pointer;border-radius:8px}
`;

const KEPALA = (judul: string, sub: string) =>
  `<div class="page-head"><h1>${judul}</h1><p>${sub}</p></div>`;

function baris(href: string, ikon: string, judul: string, sub: string, danger = false) {
  return `<a class="ak-row${danger ? ' danger' : ''}" href="${href}">
      <span class="ak-ic"><svg viewBox="0 0 24 24">${ikon}</svg></span>
      <span class="ak-t"><b>${judul}</b><span>${sub}</span></span>
      <span class="ak-arw">›</span>
    </a>`;
}

export function renderAkunPage(user: any, refunds: any[] = []): string {
  const penjual = user.seller_status === 'approved';
  const menunggu = user.seller_status === 'pending';
  const icoTas = '<path d="M9 11h6M9 15h4"/><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/>';
  const icoToko = '<path d="M3 9h18M3 9l1.5-4.5h15L21 9M4 9v11h16V9M9 20v-6h6v6"/>';
  const icoDuit = '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>';
  const icoPin = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>';
  const icoOrang = '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
  const icoLuaran = '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>';
  const icoKeluar = '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>';

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Akun | BERBIRRU</title>
<link rel="icon" type="image/svg+xml" href="/favicon.ico">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700&display=swap" rel="stylesheet">
${PASAR_BASE_CSS}
<style>${CSS}</style></head>
<body>
<div class="wrap">
  ${KEPALA('Akun', penjual ? 'Kelola pesanan, toko, dan saldo.' : 'Pesanan, alamat, dan pengaturan akun.')}

  <div class="ak-card">
    <div class="ak-row" style="cursor:default;">
      <span class="ak-ic"><svg viewBox="0 0 24 24">${icoOrang}</svg></span>
      <span class="ak-t"><b>@${escapeHtml(user.pen_name)}</b><span>${escapeHtml(user.email || '')} · ${penjual ? 'Penjual terverifikasi' : menunggu ? 'Pengajuan toko diproses' : 'Pembeli'}</span></span>
    </div>
    ${baris('/pasar/saya?tab=pesanan', icoTas, 'Pesanan Saya', 'Belum bayar, dikirim, selesai')}
    ${baris(penjual ? '/pasar/saya?tab=toko' : '/pasar/jual', icoToko, penjual ? 'Toko Saya' : menunggu ? 'Pengajuan toko' : 'Buka Toko', penjual ? 'Buku, toko publik, kelola listing' : menunggu ? 'Menunggu review owner' : 'Ajukan verifikasi penjual')}
    ${penjual ? baris('/pasar/saya?tab=saldo', icoDuit, 'Saldo & Tarik Dana', 'Sisa saldo dan riwayat pencairan') : ''}
    ${baris('/akun/alamat', icoPin, 'Alamat Pengiriman', 'Nama, nomor HP, kode pos, alamat')}
    ${baris('/u/' + encodeURIComponent(user.pen_name), icoLuaran, 'Profil Publik', 'Warkah, pengikut, dan bio')}
  </div>

  ${refunds.length ? `
  <div class="ak-card">
    <div class="ak-row" style="cursor:default;">
      <span class="ak-ic"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 10 9 10"/></svg></span>
      <span class="ak-t"><b>Refund saya</b><span>Uang yang sudah dikembalikan ke kamu</span></span>
    </div>
    ${refunds.map((r: any) => `
      <a class="ak-row" href="/pasar/order/${escapeHtml(r.id)}">
        <span class="ak-t" style="padding-left:46px;">
          <b>${rupiah(Number(r.refund_amount || Number(r.qris_final_amount) || Number(r.price) + Number(r.shipping || 0)))}</b>
          <span>${escapeHtml(String(r.refunded_at || '').slice(0, 16))} · ref ${escapeHtml(r.refund_ref || '—')}</span>
        </span>
        <span class="ak-arw">›</span>
      </a>`).join('')}
  </div>` : ''}

  <button class="ak-btn" id="klr" style="color:#B42318;" onclick="keluar()">Keluar akun</button>
</div>
<script>
async function keluar(){
  if(!confirm('Keluar dari akun ini?')) return;
  const b=document.getElementById('klr'); b.disabled=true;
  try{ await fetch('/api/auth/logout',{method:'POST'}); location.href='/login'; }
  catch(e){ b.disabled=false; alert('Gagal keluar, coba lagi.'); }
}
</script>
${renderBottomNav('akun' as any, user, false, { mode: 'pasar', marketTab: 'akun' as any })}
</body></html>`;
}

export function renderAlamatPage(user: any, pesan = ''): string {
  const v = (x: any) => escapeHtml(x || '');
  const distrik = user.addr_district_name
    ? `${escapeHtml(user.addr_district_name)}${user.addr_city_name ? ', ' + escapeHtml(user.addr_city_name) : ''}${user.addr_province_name ? ', ' + escapeHtml(user.addr_province_name) : ''}`
    : '';
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Alamat Pengiriman | BERBIRRU</title>
<link rel="icon" type="image/svg+xml" href="/favicon.ico">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700&display=swap" rel="stylesheet">
${PASAR_BASE_CSS}
<style>${CSS}
  .f{margin-bottom:12px}.f label{display:block;font:800 10.5px 'Roboto Mono';letter-spacing:.05em;color:#52627A;margin-bottom:5px;text-transform:uppercase}
  .f input,.f textarea{width:100%;min-height:44px;border:2.5px solid #0B192C;border-radius:8px;padding:10px 12px;font:600 13.5px 'DM Sans';background:#fff}
  .f textarea{min-height:78px;resize:vertical}
  .f .hint{font:600 10.5px 'DM Sans';color:#64748B;margin-top:4px}
  .ok{background:#DCFCE7;border:2.5px solid #15803D;padding:10px 12px;font:800 12px 'DM Sans';margin-bottom:12px}
</style></head>
<body>
<div class="wrap">
  <div class="page-head"><h1>Alamat Pengiriman</h1><p>Dipakai otomatis saat checkout. Bisa diubah per pesanan.</p></div>
  ${pesan ? `<div class="ok">${escapeHtml(pesan)}</div>` : ''}
  <form class="ak-card" style="padding:16px" method="post" action="/akun/alamat">
    <div class="f"><label>Nama penerima</label><input name="receiver" value="${v(user.addr_receiver)}" maxlength="60" required placeholder="Nama yang menerima paket"></div>
    <div class="f"><label>Nomor HP</label><input name="phone" value="${v(user.addr_phone)}" inputmode="tel" maxlength="20" required placeholder="08xxxxxxxxxx"></div>
    <div class="f"><label>Kode pos</label><input name="postal" value="${v(user.addr_postal)}" inputmode="numeric" maxlength="5" required placeholder="5 angka"></div>
    <div class="f"><label>Alamat lengkap</label><textarea name="text" maxlength="300" required placeholder="Jalan, nomor rumah, RT/RW, patokan">${v(user.addr_text)}</textarea></div>
    <div class="f">
      <label>Kecamatan</label>
      <div style="font:700 13px 'DM Sans';padding:10px 12px;background:#F1F5F9;border:2px dashed #94A3B8;border-radius:8px;">${distrik || 'Belum dipilih'}</div>
      <div class="hint">Kecamatan menentukan tarif kurir. Diubah saat checkout (langkah pilih ongkir).</div>
    </div>
    <button class="ak-btn" style="background:#FDE047;" type="submit">Simpan alamat</button>
  </form>
</div>
${renderBottomNav('akun' as any, user, false, { mode: 'pasar', marketTab: 'akun' as any })}
</body></html>`;
}
