import { escapeHtml } from '../lib/sanitize';
import { svgCode128, svgQr } from '../lib/barcode';

const FONTS = `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+DW+Pica:ital@0;1&family=Special+Elite&family=DM+Sans:wght@600;700&display=swap" rel="stylesheet">`;

const rp = (n: any) => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const tglPanjang = (iso: any) => {
  const d = new Date(String(iso || '').replace(' ', 'T') + (String(iso || '').includes('Z') ? '' : 'Z'));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
};
const tglPendek = (iso: any) => {
  const d = new Date(String(iso || '').replace(' ', 'T') + (String(iso || '').includes('Z') ? '' : 'Z'));
  if (Number.isNaN(d.getTime())) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  const j = new Date(d.getTime() + 7 * 3600 * 1000);
  return `${p(j.getUTCDate())} · ${p(j.getUTCMonth() + 1)} · ${j.getUTCFullYear()}`;
};
const kodeOrder = (id: string) => 'BBR-' + String(id || '').slice(0, 8).toUpperCase();

const STATUS: Record<string, string> = {
  created: 'BELUM DIBAYAR', paid: 'LUNAS', handed: 'DIKIRIM',
  completed: 'SELESAI', disputed: 'SENGKETA', refunded: 'DIBATALKAN', expired: 'KEDALUWARSA',
};

const CSS = `
  :root{--ink:#111}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#DED5C2;color:var(--ink);font-family:'IM Fell English',serif}
  .bar{position:sticky;top:0;z-index:9;background:#111;color:#fff;display:flex;gap:10px;align-items:center;justify-content:space-between;padding:10px 14px;font:700 12px 'DM Sans'}
  .bar a,.bar button{font:800 12px 'DM Sans';border:2px solid #fff;background:#fff;color:#111;padding:7px 12px;cursor:pointer;text-decoration:none}
  .bar em{font-style:normal;font-weight:600;opacity:.75;font-size:11px}
  .stage{padding:18px 12px 40px;display:flex;justify-content:center}

  /* ---------- stiker 8 x 11,5 cm ---------- */
  .stk{width:80mm;height:115mm;background:#fff;border:1px solid var(--ink);padding:2.4mm;position:relative;display:flex;flex-direction:column;box-shadow:7px 8px 0 #3A3227}
  .stk:before{content:'';position:absolute;inset:1.5mm;border:.5px solid var(--ink);pointer-events:none}
  .stk-in{position:relative;display:flex;flex-direction:column;height:100%;padding:1.6mm 1.8mm}
  .stk .head{position:relative;text-align:center}
  .stk .atas{font:400 5.4pt 'IM Fell English';letter-spacing:.3em;text-transform:uppercase;text-align:left;padding-top:.4mm}
  /* prangko & cap pos sengaja menimpa judul — seperti cap basah di kertas lama */
  .stk .marks{position:absolute;top:-1.6mm;right:-1mm;z-index:3;pointer-events:none}
  .stk h1{margin:1mm 0 0;font:400 13.4pt 'IM Fell DW Pica';letter-spacing:.02em;text-transform:uppercase;line-height:1.15;white-space:nowrap;text-align:center;position:relative;z-index:2}
  .stk .it{font:italic 400 5.8pt/1.4 'IM Fell English';margin-top:.8mm;white-space:nowrap;text-align:center}
  .stk .stamp{position:absolute;top:0;right:0;width:9.6mm;height:11.4mm;border:.7px dashed var(--ink);display:grid;place-items:center;transform:rotate(4deg);background:transparent;opacity:.9}
  .stk .stamp .in2{border:.4px solid var(--ink);width:7.6mm;height:9.4mm;display:grid;place-items:center;padding:.2mm;text-align:center;font:400 3.5pt/1.2 'IM Fell DW Pica';letter-spacing:0;text-transform:uppercase}
  .stk .postmark{position:absolute;top:1.2mm;right:9.4mm;width:10mm;height:10mm;border:.8px solid var(--ink);border-radius:50%;display:grid;place-items:center;text-align:center;transform:rotate(-13deg);font:400 3.7pt/1.2 'IM Fell English';letter-spacing:.06em;opacity:.9}
  .stk .rule{display:flex;align-items:center;gap:1.4mm;margin:1.4mm 0 1.2mm}
  .stk .rule:before,.stk .rule:after{content:'';flex:1;border-top:.8px solid var(--ink)}
  .stk .rule span{font:400 6pt 'IM Fell English';letter-spacing:.2em}
  .stk .to{display:flex;gap:2mm;align-items:flex-start;margin-top:1mm}
  .stk .to .l{font:400 5.2pt 'IM Fell English';letter-spacing:.18em;text-transform:uppercase;width:9mm;padding-top:.6mm}
  .stk .to .lines{flex:1;border-bottom:.6px dotted var(--ink);padding-bottom:1.2mm}
  .stk .to .nm{font:400 8.6pt 'IM Fell English';line-height:1.25}
  .stk .to .sm{font:400 5.6pt/1.4 'IM Fell English'}
  .stk .resi{margin-top:1.6mm;text-align:center}
  .stk .resi .k{font:400 4.8pt 'IM Fell English';letter-spacing:.26em;text-transform:uppercase}
  .stk .resi .v{font:700 12.4pt 'Special Elite';line-height:1;margin-top:.4mm;word-break:break-all}
  .stk .bc{margin:1.1mm 0 .6mm;line-height:0}
  .stk .bc svg{width:100%;height:auto;display:block}
  .stk .isi{border-top:.6px solid var(--ink);border-bottom:.6px solid var(--ink);padding:1.2mm 0;margin:.8mm 0}
  .stk .isi .k{font:400 4.6pt 'IM Fell English';letter-spacing:.24em;text-transform:uppercase}
  .stk .isi .v{font:400 8.4pt 'IM Fell English';margin-top:.2mm}
  .stk .fine{display:flex;justify-content:space-between;font:400 5.4pt/1.55 'IM Fell English';gap:3mm}
  .stk .fine b{font-weight:400;font-style:italic;text-align:right}
  .stk .foot{margin-top:auto;display:flex;align-items:flex-end;gap:2mm;padding-top:1mm}
  .stk .qr{width:15.5mm;height:15.5mm;flex:none}
  .stk .qr svg{width:100%;height:100%;display:block}
  .stk .ft{font:400 4.9pt/1.5 'IM Fell English'}
  .stk .ft b{font:400 6.2pt 'IM Fell DW Pica';letter-spacing:.2em;text-transform:uppercase}

  /* ---------- nota A5 ---------- */
  .paper{width:148mm;min-height:210mm;background:#fff;border:1px solid var(--ink);padding:4mm;position:relative;display:flex;flex-direction:column;box-shadow:8px 9px 0 #3A3227}
  .paper:before{content:'';position:absolute;inset:2mm;border:.6px solid var(--ink);pointer-events:none}
  .paper .in{position:relative;padding:3mm 3.5mm;display:flex;flex-direction:column;height:100%}
  .kop{text-align:center;border-bottom:2px solid var(--ink);padding-bottom:2mm}
  .kop .atas{font:700 5.4pt 'Special Elite';letter-spacing:.3em;text-transform:uppercase}
  .kop h1{margin:.9mm 0 0;font:400 15pt 'IM Fell DW Pica';letter-spacing:.28em;text-transform:uppercase}
  .kop .sub{font:italic 400 6.4pt/1.45 'IM Fell English';margin-top:.8mm}
  .kop .orn{font:400 7.5pt 'IM Fell English';letter-spacing:.38em;margin-top:.5mm}
  .meta{display:flex;justify-content:space-between;gap:5mm;margin:2.8mm 0 3mm;font:400 7pt 'IM Fell English';padding-right:27mm}
  .meta .r{display:flex;gap:1.6mm;align-items:baseline}
  .meta .k{font:400 5.2pt 'IM Fell English';letter-spacing:.13em;text-transform:uppercase;min-width:13mm}
  .meta .v{font-weight:700}
  .meta .kanan{text-align:right;font-style:italic;line-height:1.5}
  .sec{font:400 5.6pt 'IM Fell English';letter-spacing:.2em;text-transform:uppercase;margin-bottom:1mm}
  .paper table{width:100%;border-collapse:collapse;font:400 7.4pt 'IM Fell English'}
  .paper th{font:400 5.3pt 'IM Fell English';letter-spacing:.11em;text-transform:uppercase;text-align:left;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);padding:1mm .6mm}
  .paper td{padding:1.5mm .6mm;border-bottom:1px dotted #9C9484;vertical-align:top}
  .paper td.r,.paper th.r{text-align:right}
  .paper td em{font-style:italic}
  .uang{margin-top:2.6mm;width:62%;margin-left:auto;font:400 7.2pt 'IM Fell English'}
  .ur{display:flex;justify-content:space-between;padding:.6mm 0}
  .ur.tot{border-top:1.4px solid var(--ink);margin-top:1mm;padding-top:1mm;font:700 8.8pt 'IM Fell English'}
  .ur.net{border-top:1px dotted var(--ink);margin-top:1.4mm;padding-top:1mm;font:700 7.4pt 'IM Fell English'}
  .ket2{margin-top:3mm;border-top:1px dotted #9C9484;padding-top:2mm;font:400 7pt/1.5 'IM Fell English'}
  .ket2 .k{font:400 5.2pt 'IM Fell English';letter-spacing:.18em;text-transform:uppercase;margin-bottom:.6mm}
  .ket2 q{font-style:italic}
  .paper .foot{margin-top:auto;padding-top:3mm;display:flex;justify-content:space-between;align-items:flex-end;gap:5mm}
  .paper .foot .kecil{font:400 5.6pt/1.5 'IM Fell English';max-width:60mm}
  .stempel{width:21mm;height:21mm;border:1.4px dashed var(--ink);display:grid;place-items:center;text-align:center;font:700 5.8pt/1.25 'Special Elite';letter-spacing:.08em;transform:rotate(-7deg);border-radius:50%}
  .statuscap{position:absolute;right:5mm;top:31mm;border:2px solid var(--ink);font:800 9pt 'Special Elite';letter-spacing:.16em;padding:1.2mm 2.4mm;transform:rotate(-6deg)}

  @media print{
    html,body{background:#fff}
    .bar{display:none}
    .stage{padding:0}
    .stk,.paper{box-shadow:none;border-color:#000}
  }
`;

const BUNGKUS = (judul: string, isi: string, kelaskan = '') => `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${judul} | BERBIRRU</title>${FONTS}<style>${CSS}</style>
<style>@page{size:${kelaskan === 'a5' ? 'A5' : '80mm 115mm'};margin:0}</style></head>
<body class="${kelaskan}">
<div class="bar"><span>${judul} <em>· ${kelaskan === 'a5' ? 'A5' : '8 × 11,5 cm'}</em></span>
  <span><button onclick="window.print()">Cetak / PDF</button> <a href="javascript:history.back()">Kembali</a></span></div>
<div class="stage">${isi}</div>
</body></html>`;

/** Stiker nota pengiriman — wajib: barcode, nomor resi, isi paket. */
export function renderNotaPengiriman(o: any, p: any, seller: any): string {
  const resi = String(o.resi || '');
  const kode = kodeOrder(o.id);
  const isi = `Buku · 1 pcs`;
  const kota = String(o.dest_district_name || o.dest_city || '').trim();
  const isiStiker = `
  <div class="stk">
    <div class="stk-in">
      <div class="head">
        <div class="atas">Berbirru</div>
        <div class="marks">
          <div class="postmark">CILEGON<br>${tglPendek(o.created_at).replace(/ · /g, '·')}<br>2026</div>
          <div class="stamp"><div class="in2">Berbirru<br>Rekber<br>2026</div></div>
        </div>
        <h1>Nota Pengiriman</h1>
        <div class="it">“Setiap buku punya jalan pulangnya”</div>
      </div>

      <div class="rule"><span>✦</span></div>

      <div class="to">
        <div class="l">Kepada</div>
        <div class="lines">
          <div class="nm">${escapeHtml(o.receiver_name || '—')}</div>
          <div class="sm">${escapeHtml(kota)}${o.postal_code ? ' · ' + escapeHtml(o.postal_code) : ''}</div>
        </div>
      </div>

      <div class="resi"><div class="k">Nomor Resi</div><div class="v">${escapeHtml(resi)}</div></div>
      <div class="bc">${svgCode128(resi, { tinggi: 17, modul: 0.33 })}</div>

      <div class="isi"><div class="k">Isi Paket</div><div class="v">${isi}</div></div>

      <div class="fine"><span>Jasa kirim</span><b>${escapeHtml([o.courier_name, o.service].filter(Boolean).join(' · '))}${p.weight_g ? ' · ' + Number(p.weight_g) + ' gr' : ''}</b></div>
      <div class="fine"><span>Pengirim</span><b>${escapeHtml(seller?.shop_name || seller?.pen_name || '—')}</b></div>
      <div class="fine"><span>Tanggal</span><b>${tglPanjang(o.created_at)}</b></div>

      <div class="foot">
        <div class="qr">${svgQr(`https://berbirru.com/pasar/order/${o.id}`, { sel: 2, margin: 1 })}</div>
        <div class="ft"><b>Berbirru</b><br>Pindai untuk melacak pesanan<br>berbirru.com · ${kode}</div>
      </div>
    </div>
  </div>`;
  return BUNGKUS('Nota Pengiriman ' + kode, isiStiker);
}

/** Nota pembelian A5 — pembeli atau penjual (penjual dapat baris dana diterima). */
export function renderNotaPembelian(o: any, p: any, seller: any, buyer: any, pihak: 'pembeli' | 'penjual'): string {
  const kode = kodeOrder(o.id);
  const harga = Number(o.price || 0);
  const ongkir = Number(o.shipping || 0);
  const total = Number(o.qris_final_amount || harga + ongkir);
  const biaya = 5000;
  const status = STATUS[String(o.status)] || String(o.status || '').toUpperCase();
  const judul = p.title || 'Buku';
  const penjual = seller?.shop_name || seller?.pen_name || '—';
  const pembeli = buyer?.pen_name ? '@' + buyer.pen_name : '—';

  const isi = `
  <div class="paper">
    <div class="in">
      <div class="kop">
        <div class="atas">Pasar Buku · Rekber</div>
        <h1>Nota Pembelian</h1>
        <div class="sub">berbirru.com — jual beli buku fisik dengan rekber</div>
        <div class="orn">✦ ────────── ✦ ────────── ✦</div>
      </div>
      <div class="statuscap">${escapeHtml(status)}</div>

      <div class="meta">
        <div>
          <div class="r"><span class="k">Nomor</span><span class="v">${kode}</span></div>
          <div class="r"><span class="k">Tanggal</span><span class="v">${tglPanjang(o.created_at)}</span></div>
          <div class="r"><span class="k">Pembayaran</span><span class="v">${o.paid_with === 'saldo' ? 'Saldo Berbirru' : 'QRIS'}</span></div>
        </div>
        <div class="kanan">
          Kepada Yth.<br><b>${escapeHtml(pihak === 'pembeli' ? (o.receiver_name || pembeli) : penjual)}</b><br>
          ${escapeHtml(pihak === 'pembeli' ? pembeli : '@' + (seller?.pen_name || ''))}${pihak === 'pembeli' && o.dest_district_name ? ' · ' + escapeHtml(o.dest_district_name) : ''}
        </div>
      </div>

      <div class="sec">${pihak === 'pembeli' ? 'Rincian pembelian' : 'Rincian penjualan'}</div>
      <table>
        <tr><th style="width:52%;">Uraian</th><th>${pihak === 'pembeli' ? 'Penjual' : 'Pembeli'}</th><th class="r">Jumlah</th></tr>
        <tr>
          <td>${escapeHtml(judul)}${p.author ? ` <em>— ${escapeHtml(p.author)}</em>` : ''}<br><span style="font-size:6pt;">1 buku · ${escapeHtml(String(p.cond || '').replace('_', ' '))}${p.weight_g ? ' · ' + Number(p.weight_g) + ' gr' : ''}</span></td>
          <td>${escapeHtml(pihak === 'pembeli' ? penjual : pembeli)}</td>
          <td class="r">${rp(harga)}</td>
        </tr>
      </table>

      <div class="uang">
        <div class="ur"><span>Harga barang</span><span>${rp(harga)}</span></div>
        <div class="ur"><span>Ongkos kirim${o.courier_name ? ' · ' + escapeHtml(o.courier_name) : ''}</span><span>${rp(ongkir)}</span></div>
        <div class="ur"><span>Biaya rekber</span><span>${pihak === 'pembeli' ? rp(biaya) : '−' + rp(biaya)}</span></div>
        <div class="ur tot"><span>${pihak === 'pembeli' ? 'Total dibayar' : 'Total dibayar pembeli'}</span><span>${rp(total)}</span></div>
        ${pihak === 'penjual' ? `<div class="ur net"><span>Dana diterima penjual</span><span>${rp(harga - biaya)}</span></div>
        <div style="font:400 5.8pt/1.45 'IM Fell English';margin-top:.8mm;">Dihitung dari harga barang − biaya rekber. Ongkos kirim diteruskan ke kurir, bukan ke penjual.</div>` : ''}
      </div>

      <div class="ket2">
        <div class="k">Pengiriman</div>
        ${o.resi ? `${escapeHtml([o.courier_name, o.service].filter(Boolean).join(' '))} · resi <b>${escapeHtml(o.resi)}</b> · ${o.handed_at ? 'dikirim ' + tglPanjang(o.handed_at) : 'menunggu dikirim'}` : 'Belum ada resi — pesanan belum dikirim.'}
      </div>

      ${o.kesepakatan ? `<div class="ket2" style="border-top:0;padding-top:1mm;"><div class="k">Catatan pembeli</div><q>${escapeHtml(o.kesepakatan)}</q></div>` : ''}

      <div class="foot">
        <div class="kecil">Dokumen ini diterbitkan otomatis oleh sistem Berbirru sebagai bukti ${pihak === 'pembeli' ? 'pembelian' : 'penjualan'}. Simpan untuk keperluan sengketa atau klaim.</div>
        <div class="stempel">${pihak === 'pembeli' ? 'BUKTI<br>PEMBELIAN' : 'SALINAN<br>PENJUAL'}<br>BERBIRRU</div>
      </div>
    </div>
  </div>`;
  return BUNGKUS('Nota Pembelian ' + kode, isi, 'a5');
}
