// Saldo penjual + tarik dana. Saldo = ledger terkumpul − permintaan tarik yang masih diproses.
import { escapeHtml } from '../lib/sanitize';
import { PASAR_BASE_CSS, rupiah } from './pasar';
import { WITHDRAW_MIN, withdrawFee } from '../lib/pasar-settlement';

const PAGE_CSS = `
  .wrap{width:min(680px,calc(100% - 28px));margin:auto;padding:18px 0 120px}
  .back{display:inline-block;font:800 11px 'DM Sans';color:#64748B;text-decoration:none;margin-bottom:6px}
  .back:active{color:#0B192C}
  .page-head{margin:8px 0 22px}.page-head h1{margin:0 0 8px;font:700 clamp(40px,7vw,64px)/.95 'Newsreader';letter-spacing:-.04em}
  .page-head p{margin:0;color:#52627A;line-height:1.6}
  .st-card{background:#fff;border:3px solid #0B192C;box-shadow:6px 7px 0 #26364A;padding:18px;margin-bottom:20px}
  .st-big{font:700 23px 'Newsreader'}.st-sub{font-size:12px;font-weight:600;color:#475569;margin-top:7px;line-height:1.55}
  .bal{font:400 34px 'Archivo Black';color:#0F3E99;margin:6px 0 2px;letter-spacing:-.02em}
  .row{display:flex;justify-content:space-between;gap:12px;font-size:12.5px;font-weight:700;color:#334155;padding:9px 0;border-top:1px dashed #CBD5E1}
  .row>div{min-width:0}
  .row:first-child{border-top:0}.row .t{color:#94A3B8;font:600 10.5px 'Roboto Mono';overflow-wrap:anywhere}
  .pos{color:#0F7A3D}.neg{color:#B42318}
  .btn{width:100%;min-height:48px;border:3px solid #0B192C;padding:11px 15px;font-size:13.5px;font-weight:900;cursor:pointer;box-shadow:3px 4px 0 #26364A;font-family:inherit;display:flex;justify-content:center;align-items:center;gap:8px;margin-top:10px;background:#fff;color:#0B192C}
  .btn.b-blue{background:#1D61E7;color:#fff}.btn:active{transform:translate(2px,3px);box-shadow:none}
  .fld{width:100%;padding:11px;border:2px solid #0B192C;border-radius:8px;font-weight:700;font-family:inherit;font-size:13px;margin-top:8px}
  .lbl{font:700 10px 'Roboto Mono';color:#64748B;letter-spacing:.06em;text-transform:uppercase}
  .err{color:#B42318;font-weight:700;font-size:12.5px;margin-top:10px}
  .empty{color:#64748B;font-size:12.5px;font-weight:600;padding:10px 0}
`;

const KIND: Record<string, string> = { sale: 'Penjualan buku', fee: 'Biaya rekber', withdraw: 'Tarik dana', refund: 'Pengembalian dana' };
const WD: Record<string, string> = { requested: 'Diproses owner', paid: 'Sudah dicairkan', rejected: 'Ditolak' };
const METHOD: Record<string, string> = { qris: 'QRIS', bank: 'Rekening bank', ewallet: 'E-wallet' };

export function renderSaldoPage(user: any, balance: number, ledger: any[], withdrawals: any[], embed = false, ditahan: any[] = []): string {
  const peran: 'penjual' | 'pembeli' = user?.seller_status === 'approved' ? 'penjual' : 'pembeli';
  const minTarik = WITHDRAW_MIN;
  const kind: 'seller' | 'buyer' = peran === 'penjual' ? 'seller' : 'buyer';
  const feeMin = withdrawFee(kind, minTarik);
  const bisa = balance >= minTarik + feeMin;
  // Saldo negatif hanya mungkin kalau ledger tak konsisten — tetap tampilkan jujur, jangan "Rp-40.000".
  const balTxt = balance < 0 ? '−' + rupiah(Math.abs(balance)) : rupiah(balance);

  const ledgerRows = (ledger || []).map((l) => `
    <div class="row">
      <div>${escapeHtml(KIND[l.kind] || l.kind)}<div class="t">${escapeHtml(String(l.created_at || '').slice(0, 16).replace('T', ' '))}</div></div>
      <div class="${Number(l.delta) >= 0 ? 'pos' : 'neg'}">${Number(l.delta) >= 0 ? '+' : '−'}${rupiah(Math.abs(Number(l.delta)))}</div>
    </div>`).join('') || `<div class="empty">Belum ada transaksi.</div>`;

  const wdRows = (withdrawals || []).map((w) => `
    <div class="row">
      <div>${rupiah(Number(w.amount))}
        <div class="t">${escapeHtml(METHOD[w.method] || w.method || 'QRIS')} · ${escapeHtml(w.account || '—')}</div>
        ${w.kode ? `<a class="t" style="color:#1D61E7;text-decoration:none;font-weight:800;" href="/saldo/pencairan/${escapeHtml(w.kode)}">Bukti ${escapeHtml(w.kode)} →</a>` : ''}
      </div>
      <div style="text-align:right;">
        <div style="font-size:11.5px;color:${w.status === 'paid' ? '#0F7A3D' : w.status === 'rejected' ? '#B42318' : '#92400E'}">${escapeHtml(WD[w.status] || w.status)}</div>
        <div class="t">${escapeHtml(String(w.requested_at || '').slice(0, 10))}</div>
      </div>
    </div>`).join('') || `<div class="empty">Belum ada permintaan tarik dana.</div>`;

  const inner = `<div class="wrap">
  ${embed ? '' : `<a class="back" href="/pasar/saya?tab=pesanan">&larr; Pasar Saya</a>`}
  <div class="page-head"><h1>Saldo</h1><p>${peran === 'penjual'
    ? 'Hasil penjualan bukumu. Fee rekber Rp5.000 per pesanan sudah dipotong; ongkir utuh untukmu.'
    : 'Uang refund kamu. Bisa dipakai belanja lagi (asal saldo menutup seluruh tagihan) atau ditarik ke rekening.'}</p></div>

  <div class="st-card">
    <div class="lbl">${peran === 'penjual' ? 'Dana ditahan rekber' : 'Uangmu di rekber'}</div>
    <div class="big" style="font:400 26px 'Archivo Black';color:#92400E;margin:6px 0 2px;">${rupiah(ditahan.reduce((a: number, o: any) => a + Number(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0)), 0))}</div>
    <div class="hint" style="font-size:11.5px;font-weight:600;color:#64748B;">${peran === 'penjual'
      ? 'Uang pembeli yang sudah masuk tapi belum jadi saldo — cair setelah pembeli konfirmasi terima (otomatis D+5, resi wajib terverifikasi).'
      : 'Uangmu yang masih ditahan rekber — belum kembali jadi saldo sampai pesanan selesai atau sengketa diputuskan.'}</div>
    ${(ditahan.length ? ditahan.map((o: any) => `<div class="row"><div>${({ paid: 'Sudah dibayar', handed: 'Dikirim', disputed: 'Sengketa' } as any)[o.status] || o.status}<div class="t">${escapeHtml(String(o.id).slice(0, 12))}…</div></div><div class="pos">${rupiah(Number(o.qris_final_amount || Number(o.price) + Number(o.shipping || 0)))}</div></div>`).join('') : '<div class="empty" style="padding:10px 0;font-size:11.5px;">Tidak ada dana ditahan.</div>')}
  </div>

  <div class="st-card">
    <div class="lbl">Saldo bisa ditarik</div>
    <div class="bal">${balTxt}</div>
    <div class="st-sub">Minimal tarik ${rupiah(minTarik)}. ${peran === 'penjual'
      ? `Biaya tarik ${rupiah(withdrawFee(kind, minTarik))} (${rupiah(withdrawFee(kind, 200000))} untuk penarikan ≥${rupiah(200000)}).`
      : 'Tanpa biaya tarik.'} Permintaan diproses owner 1×24 jam.</div>
  </div>

  <div class="st-card">
    <div class="st-big">Tarik Dana</div>
    <div class="st-sub">Tulis tujuan pencairan dengan benar — uang dikirim ke tujuan ini.</div>
    <form id="wdForm" onsubmit="return tarik(event)">
      <input class="fld" id="wdAmount" inputmode="numeric" placeholder="Jumlah (min ${minTarik.toLocaleString('id-ID')})" ${bisa ? '' : 'disabled'}>
      <select class="fld" id="wdMethod" ${bisa ? '' : 'disabled'}>
        <option value="qris">QRIS</option>
        <option value="bank">Rekening bank</option>
        <option value="ewallet">E-wallet (GoPay/OVO/DANA)</option>
      </select>
      <input class="fld" id="wdAccount" placeholder="No. QRIS / nomor rekening / nomor e-wallet" ${bisa ? '' : 'disabled'}>
      <div class="st-sub" id="wdInfo" style="margin-top:10px;">${peran === 'penjual'
        ? 'Biaya tarik: Rp3.500 (Rp7.500 bila ≥ Rp200.000). Saldo harus menutup jumlah + biaya.'
        : 'Tanpa biaya tarik.'}</div>
      <button class="btn b-blue" type="submit" ${bisa ? '' : 'disabled style="opacity:.5"'}>${bisa ? 'Ajukan Pencairan' : `Saldo belum cukup (min ${rupiah(minTarik + feeMin)} termasuk biaya)`}</button>
    </form>
    <div class="err" id="err"></div>
  </div>

  <div class="st-card">
    <div class="st-big" style="margin-bottom:10px;">Riwayat Saldo</div>
    ${ledgerRows}
  </div>

  <div class="st-card">
    <div class="st-big" style="margin-bottom:10px;">Permintaan Tarik</div>
    ${wdRows}
  </div>
</div>
<script>
function rupiah(n){return 'Rp'+Number(n||0).toLocaleString('id-ID')}
function err(t){document.getElementById('err').textContent=t||''}
async function tarik(ev){
  ev.preventDefault(); err('');
  const amount=Number(String(document.getElementById('wdAmount').value).replace(/\\D/g,''));
  const method=document.getElementById('wdMethod').value;
  const account=document.getElementById('wdAccount').value.trim();
  if(!amount){err('Isi jumlah yang mau ditarik.');return false}
  const fee=${peran === 'pembeli' ? 0 : 0}; // dihitung server; di sini hanya cek kasar
  const minTotal=${minTarik + feeMin};
  if(amount<${minTarik}){err('Minimal tarik '+rupiah(${minTarik})+'.');return false}
  if(amount+ (${peran}==='pembeli'?0:(amount>=200000?7500:3500)) > ${Number(balance)}){err('Saldo tidak cukup untuk jumlah + biaya tarik.');return false}
  const r=await fetch('/api/saldo/withdraw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount,method,account})});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){err(j.error||'Gagal mengajukan pencairan.');return false}
  location.reload(); return false;
}
</script>`;

  if (embed) return inner;
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Saldo — Pasar Buku BERBIRRU</title>
${PASAR_BASE_CSS}
<style>${PAGE_CSS}</style></head>
<body>
${inner}
</body></html>`;
}
export { PAGE_CSS as SALDO_CSS };
