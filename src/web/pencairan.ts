// Bukti pencairan saldo: dokumen internal bernomor. Bisa dicetak/disimpan PDF.
// Catatan internal owner TIDAK ditampilkan; yang tampil hanya fakta + referensi transfer
// dan alasan penolakan (karena itu pesan untuk pemilik saldo).
import { THEME } from './theme';
import { escapeHtml } from '../lib/sanitize';
import { rupiah } from './pasar';

const METHOD: Record<string, string> = { qris: 'QRIS', bank: 'Transfer bank', ewallet: 'E-wallet' };
const STATUS: Record<string, { t: string; warna: string }> = {
  requested: { t: 'MENUNGGU DIPROSES', warna: '#92400E' },
  paid: { t: 'SUDAH DITRANSFER', warna: '#0F7A3D' },
  rejected: { t: 'DITOLAK', warna: '#B42318' },
};

const tgl = (s: any) => {
  const v = String(s || '').slice(0, 16).replace('T', ' ');
  return v ? escapeHtml(v) : '—';
};

export function renderBuktiPencairan(w: any, opts: { owner: boolean; penName: string }): string {
  const st = STATUS[w.status] || { t: String(w.status || ''), warna: '#334155' };
  const total = Number(w.amount) + Number(w.fee || 0);
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bukti Pencairan ${escapeHtml(w.kode || '')} — BERBIRRU</title>
<style>
  :root{--ink:${THEME.ink};--dim:#52627A;--muted:${THEME.muted};--ink-soft:${THEME.inkSoft};--line-soft:${THEME.lineSoft};--line:#CBD5E1;--blue:${THEME.blue}}
  *{box-sizing:border-box}
  body{margin:0;background:#EEF1F6;color:var(--ink);font:14px/1.5 'DM Sans',system-ui,-apple-system,sans-serif}
  .bar{max-width:720px;margin:0 auto;padding:14px 16px 0;display:flex;gap:8px;align-items:center}
  .bar a,.bar button{border:2px solid var(--ink);background:#fff;color:var(--ink);font:800 12px 'DM Sans';padding:8px 12px;cursor:pointer;text-decoration:none;box-shadow:2px 2px 0 var(--ink)}
  .paper{max-width:720px;margin:14px auto 40px;background:#fff;border:3px solid var(--ink);box-shadow:8px 8px 0 var(--ink-soft);padding:26px 26px 30px}
  .head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;border-bottom:3px solid var(--ink);padding-bottom:12px}
  .brand{font:400 20px 'Archivo Black',system-ui,sans-serif;letter-spacing:-.02em}
  .brand span{font:700 10px 'Roboto Mono',monospace;letter-spacing:.16em;color:var(--dim);display:block;margin-top:2px}
  .stamp{border:3px solid ${st.warna};color:${st.warna};font:900 11px 'DM Sans';letter-spacing:.08em;padding:6px 10px;transform:rotate(-3deg);white-space:nowrap}
  h1{font:400 22px 'Archivo Black',system-ui,sans-serif;margin:18px 0 2px}
  .kode{font:700 15px 'Roboto Mono',monospace;letter-spacing:.1em;background:#FFFDF2;border:2px solid var(--ink);display:inline-block;padding:6px 10px;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}
  td{padding:8px 0;border-bottom:1px dashed var(--line);vertical-align:top;font-size:13px}
  td:first-child{color:var(--dim);font-weight:700;width:42%}
  td:last-child{text-align:right;font-weight:700}
  .num{font-family:'Roboto Mono',monospace}
  .hero{border:3px solid var(--ink);background:#F0F6FE;padding:12px 14px;margin:0 0 18px}
  .hero-t{font:700 10px 'Roboto Mono',monospace;letter-spacing:.09em;text-transform:uppercase;color:var(--dim)}
  .hero-v{font:400 30px 'Archivo Black',system-ui,sans-serif;color:var(--blue);line-height:1.1;margin:4px 0 3px}
  .hero-s{font-size:11.5px;font-weight:700;color:#334155}
  .total td{border-top:2px solid var(--ink);border-bottom:none;font:400 16px 'Archivo Black',system-ui,sans-serif;padding-top:12px}
  .note{margin-top:18px;background:#FFFDF2;border:2px solid var(--ink);padding:11px 13px;font-size:12px;font-weight:600;line-height:1.6;color:#334155}
  .foot{margin-top:18px;font:600 10.5px 'Roboto Mono',monospace;color:var(--dim);line-height:1.7}
  .owner{margin-top:10px;font-size:11.5px;color:var(--dim)}
  @media print{
    body{background:#fff}.bar{display:none}
    .paper{border:1px solid #999;box-shadow:none;margin:0;padding:0;max-width:none}
  }
</style></head>
<body>
<div class="bar">
  ${opts.owner ? '<a href="/owner">&larr; Dashboard owner</a>' : '<a href="/pasar/saya?tab=saldo">&larr; Saldo saya</a>'}
  <button onclick="window.print()">Cetak / simpan PDF</button>
</div>
<div class="paper">
  <div class="head">
    <div class="brand">BERBIRRU<span>PASAR BUKU · BUKTI PENCAIRAN</span></div>
    <div class="stamp">${st.t}</div>
  </div>

  <h1>Bukti Pencairan Saldo</h1>
  <div class="kode">${escapeHtml(w.kode || '—')}</div>

  <div class="hero">
    <div class="hero-t">Total diterima</div>
    <div class="hero-v">${w.status === 'rejected' ? 'Rp0' : rupiah(Number(w.amount))}</div>
    <div class="hero-s">${w.status === 'rejected'
      ? 'Permintaan ditolak — saldo tidak terpotong, dana tetap di saldo kamu.'
      : Number(w.fee) > 0
        ? `Sudah dipotong biaya tarik ${rupiah(Number(w.fee))} · total terpotong dari saldo ${rupiah(total)}`
        : 'Tanpa biaya tarik (pembeli bebas biaya)'}</div>
  </div>

  <table>
    <tr><td>Pemilik saldo</td><td>@${escapeHtml(opts.penName)}</td></tr>
    <tr><td>Jenis</td><td>${w.kind === 'buyer' ? 'Pencairan pembeli (refund)' : 'Pencairan penjual'}</td></tr>
    <tr><td>Tujuan</td><td>${escapeHtml(METHOD[w.method] || w.method || 'QRIS')} · <span class="num">${escapeHtml(w.account || '—')}</span></td></tr>
    <tr><td>Diajukan</td><td>${tgl(w.requested_at)}</td></tr>
    <tr><td>Diproses</td><td>${tgl(w.paid_at || w.reviewed_at)}</td></tr>
    <tr><td>Jumlah diminta</td><td class="num">${rupiah(Number(w.amount))}</td></tr>
    <tr><td>Potongan biaya tarik${Number(w.fee) > 0 ? ` (${Number(w.amount) >= 200000 ? '≥ Rp200rb' : '&lt; Rp200rb'})` : ''}</td><td class="num">${Number(w.fee) > 0 ? '− ' + rupiah(Number(w.fee)) : 'Rp0'}</td></tr>
    <tr><td>Potongan lain</td><td class="num">Tidak ada</td></tr>
    <tr class="total"><td>Total terpotong dari saldo</td><td class="num">${rupiah(total)}</td></tr>
    <tr><td><b>Total diterima</b></td><td class="num"><b>${w.status === 'rejected' ? 'Rp0' : rupiah(Number(w.amount))}</b></td></tr>
    ${w.status === 'paid' && w.transfer_ref ? `<tr><td>Referensi transfer</td><td class="num">${escapeHtml(w.transfer_ref)}</td></tr>` : ''}
  </table>

  ${w.status === 'rejected' && w.review_note ? `<div class="note"><b>Alasan penolakan:</b><br>${escapeHtml(w.review_note)}</div>` : ''}
  ${w.status === 'paid' ? `<div class="note">Dana sudah ditransfer ke tujuan di atas. Kalau belum masuk dalam 1×24 jam kerja, hubungi owner dengan menyebutkan nomor bukti <b>${escapeHtml(w.kode || '')}</b>.</div>` : ''}
  ${w.status === 'requested' ? `<div class="note">Permintaan masih menunggu diproses owner. Saldo sudah dikunci sebesar total di atas.</div>` : ''}

  <div class="foot">
    Dokumen internal BERBIRRU · dibuat otomatis, tidak perlu tanda tangan.<br>
    Bukan bukti transfer bank — bukti transfer tetap dari bank/e-wallet tujuan.
    ${opts.owner ? '<div class="owner">Dibuka dalam mode owner. Catatan internal tidak ditampilkan di halaman ini.</div>' : ''}
  </div>
</div>
</body></html>`;
}
