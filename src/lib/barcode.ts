// Code128-B dan QR → SVG, tanpa layanan luar.
// Dipakai nota pengiriman: barcode berisi nomor resi, QR berisi URL pesanan.
import qrcode from 'qrcode-generator';

// 107 pola Code128 (6 elemen: lebar bar/space bergantian, mulai dari bar).
const POLA = [
  '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
  '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
  '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
  '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
  '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
  '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
  '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
  '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
  '114131','311141','411131','211412','211214','211232','2331112',
];

/** Code128-B: cukup untuk huruf/angka/spasi (nomor resi). */
export function code128B(teks: string): string {
  const data = String(teks || '');
  const nilai: number[] = [104]; // START B
  for (const ch of data) {
    const c = ch.charCodeAt(0);
    if (c < 32 || c > 126) throw new Error('Karakter di luar Code128-B: ' + ch);
    nilai.push(c - 32);
  }
  let jumlah = 104;
  for (let i = 1; i < nilai.length; i++) jumlah += nilai[i] * i;
  nilai.push(jumlah % 103, 106); // checksum + STOP

  // Gabungkan pola jadi deret lebar: bar, space, bar, ...
  let bits = '';
  nilai.forEach((n, idx) => {
    const pola = POLA[n];
    for (let i = 0; i < pola.length; i++) {
      const lebar = Number(pola[i]);
      const hitam = i % 2 === 0;
      // elemen terakhir STOP punya 7 angka (bar penutup)
      bits += (hitam ? '1' : '0').repeat(lebar);
    }
    if (idx < nilai.length - 1) bits += '';
  });
  return bits;
}

/** SVG barcode siap tempel. `tinggi` dalam mm; lebar mengikuti modul. */
export function svgCode128(teks: string, opts: { tinggi?: number; modul?: number; quiet?: number; label?: boolean } = {}): string {
  const bits = code128B(teks);
  const modul = opts.modul ?? 0.33;   // mm per modul (aman untuk thermal 203dpi)
  const tinggi = opts.tinggi ?? 16;   // mm
  const quiet = opts.quiet ?? 2;
  const lebarModul = bits.length + quiet * 2;
  let x = quiet;
  let rects = '';
  for (let i = 0; i < bits.length; ) {
    if (bits[i] === '0') { i++; x++; continue; }
    let run = 0;
    while (i < bits.length && bits[i] === '1') { run++; i++; }
    rects += `<rect x="${(x * modul).toFixed(3)}" y="0" width="${(run * modul).toFixed(3)}" height="${tinggi}" fill="#000"/>`;
    x += run;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${(lebarModul * modul).toFixed(2)}mm" height="${tinggi}mm" viewBox="0 0 ${(lebarModul * modul).toFixed(2)} ${tinggi}" shape-rendering="crispEdges">${rects}</svg>`;
}

/** QR ke halaman pesanan (SVG, hitam-putih). */
export function svgQr(data: string, opts: { sel?: number; margin?: number } = {}): string {
  const qr = (qrcode as any)(0, 'M');
  qr.addData(String(data), 'Byte');
  qr.make();
  const sel = opts.sel ?? 3;
  const margin = opts.margin ?? 2;
  const n = qr.getModuleCount();
  const ukuran = (n + margin * 2) * sel;
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue;
      rects += `<rect x="${(c + margin) * sel}" y="${(r + margin) * sel}" width="${sel}" height="${sel}" fill="#000"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ukuran}" height="${ukuran}" viewBox="0 0 ${ukuran} ${ukuran}" shape-rendering="crispEdges"><rect width="${ukuran}" height="${ukuran}" fill="#fff"/>${rects}</svg>`;
}
