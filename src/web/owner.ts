// Halaman owner — konsol admin (Tabler, dual mode terang/gelap).
// Isi & alur keputusan tidak berubah: setiap keputusan wajib bercatatan sebagai bukti.
import { escapeHtml } from '../lib/sanitize';
import { rupiah } from './pasar';

const PAGE_CSS = `
  body{background:var(--tblr-bg-surface-secondary)}
  .navbar-vertical.navbar-expand-lg{width:238px;position:sticky;top:0;height:100vh;border-right:1px solid var(--tblr-border-color);padding-top:2px}
  .navbar-vertical .navbar-collapse{display:block!important}
  .page-wrapper{display:grid;grid-template-columns:238px minmax(0,1fr);align-items:start}
  .brandmark{width:30px;height:30px;border-radius:8px;background:linear-gradient(140deg,#3DD6D0,#1D61E7);display:grid;place-items:center;font-weight:800;color:#04121F;font-size:14px}
  .badge-owner{background:#1D61E7;color:#fff;font-weight:700;letter-spacing:.06em}
  .num{font-variant-numeric:tabular-nums;font-weight:700;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
  .muted{color:var(--tblr-secondary);font-size:.78rem;line-height:1.45}
  .table td,.table th{vertical-align:middle}
  .table-sm td,.table-sm th{padding:.5rem .6rem}
  .sect{scroll-margin-top:70px}
  .navmobile{display:none;gap:6px;overflow-x:auto;padding:8px 12px;border-bottom:1px solid var(--tblr-border-color);background:var(--tblr-bg-surface);position:sticky;top:0;z-index:20}
  .navmobile a{white-space:nowrap;font-size:13px;font-weight:600;color:var(--tblr-secondary);text-decoration:none;padding:6px 10px;border-radius:8px;background:var(--tblr-bg-surface-secondary)}
  .navmobile a.on{background:#1D61E7;color:#fff}
  .trk{margin-top:8px}
  .trk .row{border-left:3px solid #1D61E7;padding:5px 0 5px 10px;margin-bottom:6px;background:var(--tblr-bg-surface-secondary);border-radius:0 6px 6px 0}
  .trk .d{font-weight:700;font-size:.68rem;color:var(--tblr-secondary)}
  .trk .m{font-weight:600;font-size:.78rem}
  .trk .l{font-size:.72rem;color:var(--tblr-secondary)}
  .trk .bad{color:#D63939;font-weight:700;font-size:.78rem}
  .trk .ok{color:#2FB344;font-weight:700;font-size:.78rem}
  @media(max-width:991px){
    .page-wrapper{grid-template-columns:minmax(0,1fr)}
    .navbar-vertical.navbar-expand-lg{display:none}
    .navmobile{display:flex}
  }
  @media(max-width:576px){
    .h1{font-size:1.25rem}.card-body{padding:.8rem}.page-header .btn-list{flex-wrap:nowrap;overflow-x:auto}
  }
`;

// Terapkan tema sebelum paint: simpan pilihan, default ikut preferensi sistem.
const THEME_JS = `(function(){try{var t=localStorage.getItem('owner-theme')||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-bs-theme',t)}catch(e){document.documentElement.setAttribute('data-bs-theme','dark')}})();`;

const rp = (n: any) => rupiah(Number(n || 0));
const tgl = (s: any) => escapeHtml(String(s || '').slice(0, 16).replace('T', ' '));

function stats(label: string, s: any): string {
  return `<div class="muted">${label}: ${Number(s?.selesai || 0)} transaksi selesai · ${Number(s?.sengketa || 0)} sengketa · akun sejak ${tgl(s?.sejak) || '—'}</div>`;
}

const AKSI_LABEL: Record<string, string> = {
  seller_approve: 'Setujui penjual',
  seller_reject: 'Tolak penjual',
  dispute_refund: 'Refund pembeli',
  dispute_release: 'Lepas dana ke penjual',
  withdrawal_pay: 'Cairkan saldo',
  withdrawal_reject: 'Tolak pencairan',
  sweep: 'Sweep manual',
  listing_remove: 'Sembunyikan buku',
  listing_ignore: 'Abaikan laporan',
};

const ALASAN: Record<string, string> = {
  mismatch: 'Barang tidak sesuai deskripsi',
  fraud: 'Penipuan / tidak mengirim',
  misleading: 'Judul atau foto menyesatkan',
  price: 'Harga tidak wajar',
  other: 'Lain-lain',
};

export function renderOwnerPage(disputes: any[], withdrawals: any[], calonPenjual: any[] = [], audit: any[] = [], liab: { saldo?: number; escrow?: number; fee?: number } = {}, laporan: any[] = []): string {
  const dispRows = (disputes || []).map((o) => `
    <tr>
      <td>
        <div class="fw-bold">${escapeHtml(o.title || 'Buku')}</div>
        <div class="muted">${tgl(o.updated_at)}<br>${escapeHtml(o.kesepakatan || '—')}</div>
        <a class="small" href="/pasar/order/${escapeHtml(o.id)}" target="_blank" rel="noopener">Buka pesanan →</a>
      </td>
      <td>
        <a class="fw-bold" href="/owner/akun/${escapeHtml(o.buyer_id)}">@${escapeHtml(o.buyer_name || '?')}</a><div class="muted">pembeli</div>
        <a class="fw-bold mt-2 d-block" href="/owner/akun/${escapeHtml(o.seller_id)}">@${escapeHtml(o.seller_name || '?')}</a><div class="muted">penjual</div>
      </td>
      <td>
        <div class="num">${rp(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0))}</div>
        <div class="muted">${rp(o.price)} + ${rp(o.shipping)} ongkir</div>
      </td>
      <td>
        ${o.kurir && o.resi
          ? `<span class="badge ${Number(o.resi_verified) ? 'bg-cyan-lt' : 'bg-yellow-lt'}">${Number(o.resi_verified) ? 'terverifikasi' : 'belum terverifikasi'}</span>
             <div class="muted mt-1">${escapeHtml(o.kurir)} · ${escapeHtml(o.resi)}</div>
             <button class="btn btn-sm btn-outline-secondary mt-1" onclick="lacak('${escapeHtml(o.id)}',this)">Riwayat kirim</button>
             <div class="trk" id="trk-${escapeHtml(o.id)}"></div>`
          : '<div class="muted">Tanpa ekspedisi</div>'}
        ${(o.evidence || []).length ? `<div class="mt-2"><div class="muted fw-bold">Bukti ${(o.evidence || []).length} foto</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:4px;">
            ${(o.evidence || []).map((b: any) => `<a href="/berkas/sengketa/${escapeHtml(b.id)}" target="_blank" rel="noopener" title="${escapeHtml(b.role === 'buyer' ? 'Pembeli' : 'Penjual')}${b.note ? ' · ' + escapeHtml(b.note) : ''}">
              <img src="/berkas/sengketa/${escapeHtml(b.id)}" alt="Bukti" style="width:44px;height:44px;object-fit:cover;border:1px solid var(--tblr-border-color);border-radius:6px;"></a>`).join('')}
          </div></div>` : '<div class="muted mt-1">Belum ada bukti foto</div>'}
      </td>
      <td class="d-none d-lg-table-cell">
        <details>
          <summary class="small text-secondary">Bukti &amp; riwayat (${(o.events || []).length})</summary>
          <div class="mt-2">
            ${o.receiver_name ? `<div class="muted">Penerima: ${escapeHtml(o.receiver_name)} · ${escapeHtml(o.receiver_phone || '—')} · ${escapeHtml(o.dest_district_name || '')} ${escapeHtml(o.postal_code || '')}</div>
            <div class="small">${escapeHtml(o.dest_address || '')}</div>` : ''}
            <div class="muted mt-1">Kurir: ${escapeHtml(o.courier_name || o.kurir || '—')} ${escapeHtml(o.service || '')}</div>
            ${stats('Pembeli', o.buyer_stats)}
            ${stats('Penjual', o.seller_stats)}
            <ul class="list-unstyled mt-2 mb-0">
              ${(o.events || []).map((e: any) => `<li class="mb-1"><span class="muted">${tgl(e.created_at)} · ${escapeHtml(e.actor || '?')}${e.from_st ? ' ' + escapeHtml(e.from_st) + ' →' : ''} ${escapeHtml(e.to_st || '')}</span><br><span class="small">${escapeHtml(e.note || '')}</span></li>`).join('') || '<li class="muted">Belum ada riwayat.</li>'}
            </ul>
          </div>
        </details>
      </td>
      <td class="w-1">
        <div class="btn-list flex-nowrap mb-1">
          <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('note-${escapeHtml(o.id)}','Resi terverifikasi kurir, pembeli tidak respons 3 hari')">Resi valid</button>
          <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('note-${escapeHtml(o.id)}','Barang tidak sesuai bukti foto pembeli')">Bukti cocok</button>
        </div>
        <input class="form-control form-control-sm mb-2" id="note-${escapeHtml(o.id)}" maxlength="300" placeholder="Alasan keputusan (wajib)">
        <div class="btn-list flex-nowrap">
          <button class="btn btn-sm btn-outline-danger" onclick="resolve('${escapeHtml(o.id)}','refund',this)">Refund</button>
          <button class="btn btn-sm btn-outline-success" onclick="resolve('${escapeHtml(o.id)}','release',this)">Lepas</button>
        </div>
      </td>
    </tr>`).join('');

  const wdRows = (withdrawals || []).map((w) => `
    <tr>
      <td>
        <a class="fw-bold" href="/owner/akun/${escapeHtml(w.user_id)}">@${escapeHtml(w.pen_name || '?')}</a>
        <div class="muted">${escapeHtml(w.method || 'bank')} · ${escapeHtml(w.account || '—')} · ${tgl(w.requested_at)}</div>
        ${w.kode ? `<a class="small" href="/saldo/pencairan/${escapeHtml(w.kode)}" target="_blank" rel="noopener">Bukti ${escapeHtml(w.kode)} →</a>` : ''}
      </td>
      <td><span class="badge ${w.kind === 'buyer' ? 'bg-cyan-lt' : 'bg-green-lt'}">${w.kind === 'buyer' ? 'pembeli · refund' : 'penjual'}</span></td>
      <td><div class="num">${rp(w.amount)}</div></td>
      <td>
        <div class="num">${Number(w.fee) > 0 ? rp(w.fee) : 'Rp0'}</div>
        <div class="muted">${Number(w.fee) > 0 ? 'masuk kas' : 'bebas biaya'}</div>
      </td>
      <td class="d-none d-lg-table-cell">
        <details>
          <summary class="small text-secondary">Rincian saldo</summary>
          <div class="mt-2">
            <div class="muted">Saldo saat ini: <b class="num text-body">${rp(w.saldo)}</b></div>
            <div class="muted">Total terpakai: <b class="num text-body">${rp(Number(w.amount) + Number(w.fee))}</b></div>
            ${(w.ledger_ringkas || []).map((l: any) => `<div class="muted">${escapeHtml(l.kind)}: ${rp(l.total)}</div>`).join('') || '<div class="muted">Belum ada mutasi.</div>'}
            <div class="muted mt-1">Pencairan selesai: ${Number(w.riwayat_pencairan?.jumlah || 0)}× · ${rp(w.riwayat_pencairan?.total)}</div>
            <div class="muted">Sengketa aktif: ${Number(w.sengketa_aktif)}</div>
          </div>
        </details>
        ${Number(w.sengketa_aktif) > 0 ? `<span class="badge bg-red-lt mt-1">${Number(w.sengketa_aktif)} sengketa aktif</span>` : ''}
      </td>
      <td class="w-1">
        <div class="btn-list flex-nowrap mb-1">
          <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('wnote-${escapeHtml(w.id)}','Transfer sesuai rekening tujuan')">Sesuai rekening</button>
          <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('wnote-${escapeHtml(w.id)}','Nama penerima cocok dengan data penjual')">Nama cocok</button>
          <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('wnote-${escapeHtml(w.id)}','Mutasi bank sudah dicek')">Mutasi dicek</button>
        </div>
        <input class="form-control form-control-sm mb-1" id="wnote-${escapeHtml(w.id)}" maxlength="300" placeholder="Catatan keputusan (wajib)">
        <input class="form-control form-control-sm mb-2" id="wref-${escapeHtml(w.id)}" maxlength="80" placeholder="Ref / bukti transfer">
        <div class="btn-list flex-nowrap">
          <button class="btn btn-sm btn-success" onclick="settle('${escapeHtml(w.id)}','pay',this)">Sudah ditransfer</button>
          <button class="btn btn-sm btn-outline-danger" onclick="settle('${escapeHtml(w.id)}','reject',this)">Tolak</button>
        </div>
      </td>
    </tr>`).join('');

  const sellerCards = (calonPenjual || []).map((u) => `
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <a class="fw-bold" href="/owner/akun/${escapeHtml(u.id)}">${escapeHtml(u.shop_name || '(tanpa nama toko)')}</a>
          <div class="muted">${escapeHtml(u.seller_full_name || u.pen_name)} · @${escapeHtml(u.pen_name)} · ${escapeHtml(u.city || '-')} · ${Number(u.listing_aktif || 0)} listing aktif</div>
        </div>
        <span class="badge bg-yellow-lt">menunggu</span>
      </div>
      <div class="d-flex gap-2 mt-2">
        ${Number(u.doc_ktp) ? `<a href="/berkas/dokumen/${escapeHtml(u.id)}/ktp" target="_blank" rel="noopener"><img src="/berkas/dokumen/${escapeHtml(u.id)}/ktp" alt="KTP" style="width:64px;height:44px;object-fit:cover;border:1px solid var(--tblr-border-color);border-radius:6px;"><span class="d-block muted" style="font-size:.62rem;">KTP</span></a>` : '<span class="badge bg-red-lt">KTP belum ada</span>'}
        ${Number(u.doc_bank) ? `<a href="/berkas/dokumen/${escapeHtml(u.id)}/bank" target="_blank" rel="noopener"><img src="/berkas/dokumen/${escapeHtml(u.id)}/bank" alt="Buku tabungan" style="width:64px;height:44px;object-fit:cover;border:1px solid var(--tblr-border-color);border-radius:6px;"><span class="d-block muted" style="font-size:.62rem;">Rekening</span></a>` : '<span class="badge bg-red-lt">Rekening belum ada</span>'}
      </div>
      <div class="row g-2 mt-1 muted">
        <div class="col-sm-4">WA: <span class="text-body">${escapeHtml(u.seller_phone || '—')}</span></div>
        <div class="col-sm-4">Rekening: <span class="text-body">${escapeHtml(u.seller_bank_name || '—')} ${escapeHtml(u.seller_bank_account || '')}</span></div>
        <div class="col-sm-4">Pengajuan: <span class="text-body">${tgl(u.seller_applied_at)}</span></div>
      </div>
      ${u.seller_note ? `<div class="small text-secondary mt-1">${escapeHtml(u.seller_note)}</div>` : ''}
      <div class="btn-list flex-nowrap mt-2">
        <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('snote-${escapeHtml(u.id)}','KTP & rekening cocok, WA aktif')">Data cocok</button>
        <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('snote-${escapeHtml(u.id)}','Nama rekening beda dengan KTP')">Rekening beda</button>
      </div>
      <div class="input-group input-group-sm mt-1">
        <input class="form-control" id="snote-${escapeHtml(u.id)}" maxlength="200" placeholder="Catatan verifikasi">
        <button class="btn btn-success" onclick="reviewSeller('${escapeHtml(u.id)}','approve',this)">Setujui</button>
        <button class="btn btn-outline-danger" onclick="reviewSeller('${escapeHtml(u.id)}','reject',this)">Tolak</button>
      </div>
    </div>`).join('');

  const laporCards = (laporan || []).map((r) => `
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <a class="fw-bold" href="/pasar/${escapeHtml(r.listing_id)}" target="_blank" rel="noopener">${escapeHtml(r.title || 'Buku')}</a>
          <div class="muted"><a href="/owner/akun/${escapeHtml(r.seller_id)}">@${escapeHtml(r.seller_name || '?')}</a> · ${rp(r.price)} · ${Number(r.jumlah)} pelapor · ${tgl(r.created_at)}</div>
        </div>
        <span class="badge bg-red-lt">dilaporkan</span>
      </div>
      <div class="muted mt-1">Rekam jejak: ${Number(r.trx_selesai)} transaksi selesai · ${Number(r.sengketa)} sengketa</div>
      <div class="border-start border-3 ps-2 mt-2 small text-secondary">
        ${(r.items || []).map((i: any) => `“${escapeHtml(ALASAN[i.reason] || i.reason)}” — @${escapeHtml(i.reporter)}${i.note ? `<br><span class="muted">${escapeHtml(i.note)}</span>` : ''}`).join('<br>')}
      </div>
      <div class="btn-list flex-nowrap mt-2">
        <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('rnote-${escapeHtml(r.listing_id)}','Foto/deskripsi tidak sesuai laporan')">Terbukti</button>
        <button class="btn btn-sm btn-ghost-secondary" onclick="isiCatatan('rnote-${escapeHtml(r.listing_id)}','Laporan tidak berdasar, buku sesuai deskripsi')">Tidak terbukti</button>
      </div>
      <input class="form-control form-control-sm mt-2" id="rnote-${escapeHtml(r.listing_id)}" maxlength="300" placeholder="Catatan keputusan (wajib)">
      <div class="btn-list mt-2">
        <button class="btn btn-sm btn-danger" onclick="putusLaporan('${escapeHtml(r.listing_id)}','hide',this)">Sembunyikan buku</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="putusLaporan('${escapeHtml(r.listing_id)}','ignore',this)">Abaikan laporan</button>
      </div>
    </div>`).join('');

  const auditRows = (audit || []).map((a) => `
    <div class="list-group-item">
      <span class="muted num me-2">${tgl(a.created_at)}</span>
      <span class="fw-semibold">${escapeHtml(AKSI_LABEL[a.action] || a.action)}</span>
      <span class="muted">· ${escapeHtml(a.target_type === 'system' || !a.target_id ? 'Sistem' : (a.target_type === 'order' ? 'Order ' : a.target_type === 'user' ? 'Akun ' : 'Kotak ') + a.target_id)}</span>
      ${a.note ? `<div class="small text-secondary">“${escapeHtml(a.note)}”</div>` : ''}
    </div>`).join('');

  const jmlSengketa = (disputes || []).length;
  const jmlCair = (withdrawals || []).length;
  const jmlVerif = (calonPenjual || []).length;
  const jmlLapor = (laporan || []).length;

  return `<!DOCTYPE html>
<html lang="id" data-bs-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Owner — Pasar Buku BERBIRRU</title>
<script>${THEME_JS}</script>
<link rel="stylesheet" href="/assets/tabler.min.css">
<style>${PAGE_CSS}</style></head>
<body>
<header class="navbar navbar-expand-md d-print-none">
  <div class="container-xl">
    <div class="navbar-brand navbar-brand-autodark d-flex align-items-center gap-2">
      <span class="brandmark">B</span><span class="fw-bold">Berbirru</span>
      <span class="badge badge-owner ms-1">OWNER</span>
    </div>
    <div class="navbar-nav flex-row order-md-last align-items-center gap-2">
      <button class="btn btn-sm btn-ghost-secondary" id="themeBtn" onclick="toggleTheme()" title="Ganti mode terang/gelap" aria-label="Ganti mode terang/gelap">☾</button>
      <span class="muted d-none d-md-inline">haeru@berbirru.com</span>
      <span class="avatar avatar-sm">HD</span>
    </div>
  </div>
</header>

<nav class="navmobile">
  <a class="on" href="#ringkasan">Ringkasan</a>
  <a href="#sengketa">Sengketa (${jmlSengketa})</a>
  <a href="#pencairan">Pencairan (${jmlCair})</a>
  <a href="#verifikasi">Verifikasi (${jmlVerif})</a>
  <a href="#laporan">Laporan (${jmlLapor})</a>
  <a href="#jejak">Jejak</a>
</nav>

<div class="page-wrapper">
  <aside class="navbar navbar-vertical navbar-expand-lg">
    <div class="container-fluid">
      <div class="collapse navbar-collapse show" id="owner-sidebar">
        <ul class="navbar-nav pt-lg-2">
          <li class="nav-item active"><a class="nav-link" href="#ringkasan"><span class="nav-link-title">Ringkasan</span></a></li>
          <li class="nav-item"><a class="nav-link" href="#sengketa"><span class="nav-link-title">Sengketa</span><span class="badge bg-yellow text-dark ms-auto">${jmlSengketa}</span></a></li>
          <li class="nav-item"><a class="nav-link" href="#pencairan"><span class="nav-link-title">Pencairan</span><span class="badge bg-blue-lt ms-auto">${jmlCair}</span></a></li>
          <li class="nav-item"><a class="nav-link" href="#verifikasi"><span class="nav-link-title">Verifikasi</span><span class="badge bg-blue-lt ms-auto">${jmlVerif}</span></a></li>
          <li class="nav-item"><a class="nav-link" href="#laporan"><span class="nav-link-title">Laporan</span><span class="badge bg-red-lt ms-auto">${jmlLapor}</span></a></li>
          <li class="nav-item"><a class="nav-link" href="#jejak"><span class="nav-link-title">Jejak tindakan</span></a></li>
        </ul>
      </div>
    </div>
  </aside>

  <div class="page-body">
    <div class="container-xl">
      <div class="page-header mb-3 sect" id="ringkasan">
        <div class="row align-items-center">
          <div class="col">
            <h2 class="page-title">Ringkasan Pasar Buku</h2>
            <div class="text-secondary mt-1">Setiap keputusan menyimpan alasan dan tampil di jejak tindakan.</div>
          </div>
          <div class="col-auto ms-auto d-print-none">
            <div class="btn-list">
              <a class="btn btn-outline-primary" href="/feed">Akun sosial</a>
              <button class="btn btn-outline-secondary" id="swp" onclick="sweep()">Sweep manual</button>
              <button class="btn btn-primary" onclick="location.reload()">Muat ulang</button>
            </div>
          </div>
        </div>
        <div class="text-danger fw-bold small mt-2" id="err"></div>
      </div>

      <div class="row row-cards mb-3">
        <div class="col-6 col-lg-3"><div class="card"><div class="card-body">
          <div class="subheader">Escrow ditahan</div><div class="h1 mb-1 num">${rp(liab.escrow || 0)}</div><div class="muted">dana pesanan berjalan</div>
        </div></div></div>
        <div class="col-6 col-lg-3"><div class="card"><div class="card-body">
          <div class="subheader">Saldo pengguna</div><div class="h1 mb-1 num">${rp(liab.saldo || 0)}</div><div class="muted">bisa ditarik kapan saja</div>
        </div></div></div>
        <div class="col-6 col-lg-3"><div class="card"><div class="card-body">
          <div class="subheader">Biaya rekber</div><div class="h1 mb-1 num">${rp(liab.fee || 0)}</div><div class="muted">terkumpul (kas)</div>
        </div></div></div>
        <div class="col-6 col-lg-3"><div class="card"><div class="card-body">
          <div class="subheader text-yellow">Perlu keputusan</div><div class="h1 mb-1 num text-yellow">${jmlSengketa + jmlCair + jmlVerif + jmlLapor}</div>
          <div class="muted">${jmlSengketa} sengketa · ${jmlCair} cair · ${jmlVerif} verif · ${jmlLapor} lapor</div>
        </div></div></div>
      </div>

      <div class="card mb-3 sect" id="sengketa">
        <div class="card-header"><h3 class="card-title">Sengketa menunggu <span class="badge bg-yellow text-dark ms-2">${jmlSengketa}</span></h3></div>
        ${jmlSengketa ? `<div class="table-responsive"><table class="table table-vcenter card-table table-sm">
          <thead><tr><th>Pesanan</th><th>Pihak</th><th>Dana ditahan</th><th>Resi</th><th class="d-none d-lg-table-cell">Bukti</th><th class="w-1">Keputusan</th></tr></thead>
          <tbody>${dispRows}</tbody>
        </table></div>` : `<div class="card-body text-secondary">Tidak ada sengketa menunggu.</div>`}
        <div class="card-footer muted">Refund menambah saldo pembeli (bukan transfer bank). Catatan wajib minimal 5 karakter.</div>
      </div>

      <div class="card mb-3 sect" id="pencairan">
        <div class="card-header"><h3 class="card-title">Pencairan menunggu <span class="badge bg-blue-lt ms-2">${jmlCair}</span></h3></div>
        ${jmlCair ? `<div class="table-responsive"><table class="table table-vcenter card-table table-sm">
          <thead><tr><th>Pemohon</th><th>Jenis</th><th>Transfer</th><th>Biaya</th><th class="d-none d-lg-table-cell">Rincian</th><th class="w-1">Aksi</th></tr></thead>
          <tbody>${wdRows}</tbody>
        </table></div>` : `<div class="card-body text-secondary">Tidak ada permintaan pencairan.</div>`}
        <div class="card-footer muted">Pembeli bebas biaya tarik. Penjual: Rp3.500 (&lt;Rp200rb) / Rp7.500 (≥Rp200rb) — masuk kas.</div>
      </div>

      <div class="row row-cards mb-3">
        <div class="col-lg-7 sect" id="verifikasi">
          <div class="card h-100">
            <div class="card-header"><h3 class="card-title">Verifikasi penjual <span class="badge bg-blue-lt ms-2">${jmlVerif}</span></h3></div>
            ${jmlVerif ? `<div class="list-group list-group-flush">${sellerCards}</div>` : `<div class="card-body text-secondary">Tidak ada pengajuan penjual.</div>`}
          </div>
        </div>
        <div class="col-lg-5 sect" id="laporan">
          <div class="card h-100">
            <div class="card-header"><h3 class="card-title">Laporan listing <span class="badge bg-red-lt ms-2">${jmlLapor}</span></h3></div>
            ${jmlLapor ? `<div class="list-group list-group-flush">${laporCards}</div>` : `<div class="card-body text-secondary">Tidak ada laporan listing.</div>`}
          </div>
        </div>
      </div>

      <div class="card sect" id="jejak">
        <div class="card-header"><h3 class="card-title">Jejak tindakan</h3></div>
        ${auditRows ? `<div class="list-group list-group-flush">${auditRows}</div>` : `<div class="card-body text-secondary">Belum ada tindakan.</div>`}
      </div>
    </div>
  </div>
</div>

<script>
function toggleTheme(){
  var h=document.documentElement, next=h.getAttribute('data-bs-theme')==='dark'?'light':'dark';
  h.setAttribute('data-bs-theme',next);
  try{localStorage.setItem('owner-theme',next)}catch(e){}
  tandaTema();
}
function tandaTema(){
  var b=document.getElementById('themeBtn');
  if(b) b.textContent = document.documentElement.getAttribute('data-bs-theme')==='dark' ? '☀' : '☾';
}
tandaTema();

function err(t){document.getElementById('err').textContent=t||''}
function isiCatatan(id, teks){
  var e=document.getElementById(id);
  if(!e) return;
  e.value = e.value.trim() ? (e.value.trim() + ' · ' + teks) : teks;
  e.focus();
}
function esc(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function val(id){var e=document.getElementById(id);return e?e.value.trim():''}
async function post(url,body){
  err('');
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){err(j.error||'Gagal.');return false}
  location.reload(); return true;
}
async function putusLaporan(id,decision,btn){
  const note=val('rnote-'+id);
  if(note.length<5){err('Tulis catatan keputusan dulu (min 5 karakter).');return}
  if(decision==='hide' && !confirm('Sembunyikan buku ini dari Pasar & toko publik?')) return;
  btn.disabled=true;
  if(!await post('/api/owner/reports/'+id+'/resolve',{decision,note})) btn.disabled=false;
}
async function resolve(id,decision,btn){
  const note=val('note-'+id);
  if(note.length<5){err('Tulis alasan keputusan dulu (min 5 karakter).');return}
  if(decision==='refund'){
    if(!confirm('Refund akan menambah SALDO pembeli (bukan transfer bank). Lanjut?')) return;
  }
  btn.disabled=true; if(!await post('/api/owner/orders/'+id+'/resolve',{decision,note,transfer_ref:''})) btn.disabled=false;
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
async function sweep(){
  const btn=document.getElementById('swp'); btn.disabled=true;
  err('');
  try{
    const r=await fetch('/api/owner/sweep',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    const j=await r.json().catch(()=>({}));
    if(!r.ok){err(j.error||'Gagal.');btn.disabled=false;return}
    alert('Sweep selesai: '+j.hasil); location.reload();
  }catch(e){err('Gagal menghubungi server.');btn.disabled=false}
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
