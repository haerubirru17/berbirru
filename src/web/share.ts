// Script share warkah — dikirim verbatim ke browser (pola feed.ts).
// Kanvas client-side: kartu PNG krem-kern (kertas, tinta, aksen oranye).
// Tinggi kartu OTOMATIS mengikuti panjang konten; bait digambar rata kiri-kanan (justify).
// ponytail: tanpa dependensi; fallback desktop = salin hook + unduh PNG.

export const SHARE_CARD_JS = `<script id="bb-share">
var bbNL = String.fromCharCode(10); // newline — aman dari perbedaan escape antar lapisan

function bbWrapPara(ctx, para, maxW) {
  var words = para.split(' ').filter(function (w) { return w; });
  var lines = [], line = [];
  for (var i = 0; i < words.length; i++) {
    var t = line.concat(words[i]).join(' ');
    if (ctx.measureText(t).width > maxW && line.length) {
      lines.push(line); line = [words[i]];
    } else { line.push(words[i]); }
  }
  if (line.length) lines.push(line);
  return lines;
}

// Batas karakter bait di kartu. Panjang + berjudul -> cukup judul saja.
function bbCardText(title, excerpt) {
  var MAXC = 260, MAXT = 140;
  var e = String(excerpt || '');
  var t = String(title || '');
  var titik = String.fromCharCode(8230);
  if (t && (t.length + e.length) > MAXC) return t.slice(0, MAXT) + (t.length > MAXT ? titik : '');
  if (e.length > MAXC) {
    var pot = e.slice(0, MAXC).split(' ');
    pot.pop();
    return pot.join(' ') + ' ' + titik;
  }
  return t ? t + bbNL + bbNL + e : e;
}

function bbShareCard(p) {
  var W = 1080;
  var ink = '#0E0E0E', oranye = '#FF3B1A', krem = '#EFEBE3', kremMuda = '#F6F3EB', abu = '#6E6A63';
  var cv = document.createElement('canvas'); cv.width = W; cv.height = 1350;
  var x = cv.getContext('2d');
  x.textBaseline = 'top';
  var fontBait = "500 56px 'Newsreader', Georgia, serif";
  x.font = fontBait;

  var teks = bbCardText(p.title, p.excerpt);
  var MAXC2 = 260; var judulSaja = !!(p.title && (String(p.title).length + String(p.excerpt || '').length) > MAXC2);
  var paras = teks.split(bbNL);
  var groups = [], cur = [];
  for (var i = 0; i < paras.length; i++) {
    if (paras[i].trim() === '') { if (cur.length) { groups.push(cur); cur = []; } }
    else cur.push(paras[i]);
  }
  if (cur.length) groups.push(cur);

  // susun baris; justify: tiap baris paragraf rata kiri-kanan, baris terakhir tiap paragraf rata kiri
  var maxW = W - 192, lineH = 80, paraGap = 56, maxRows = 10;
  var layout = [], sisa = maxRows;
  var titik = String.fromCharCode(8230);
  outer: for (var g = 0; g < groups.length; g++) {
    var lines = bbWrapPara(x, groups[g].join(' '), maxW);
    for (var li = 0; li < lines.length; li++) {
      if (sisa <= 0) {
        var last = layout[layout.length - 1];
        if (last && !last.gap && !last.ellipsis) {
          while (last.words.join(' ').length > 90 && last.words.length > 1) last.words.pop();
          last.words.push(titik); last.ellipsis = true; last.justify = false;
        }
        break outer;
      }
      layout.push({ words: lines[li], justify: !(li === lines.length - 1) && lines[li].length > 1 });
      sisa--;
    }
    if (g < groups.length - 1) layout.push({ gap: true });
  }

  // tinggi otomatis: mengikuti jumlah baris + jarak antar paragraf
  // kartu judul-saja: persegi 1080x1080, judul dipusatkan vertikal di ruang bebas
  var topY = 320, footH = 280;
  var textH = layout.reduce(function (acc, r) { return acc + (r.gap ? paraGap : lineH); }, 0);
  var H = judulSaja ? 1080 : Math.max(1000, Math.min(2200, topY + textH + footH));
  if (judulSaja) topY = 292 + Math.max(40, (H - footH + 40 - 292 - textH) / 2);
  cv.height = H;
  x = cv.getContext('2d');
  x.textBaseline = 'top';

  // latar + bingkai tinta
  x.fillStyle = krem; x.fillRect(0, 0, W, H);
  x.fillStyle = kremMuda; x.fillRect(40, 40, W - 80, H - 80);
  x.strokeStyle = ink; x.lineWidth = 4; x.strokeRect(2, 2, W - 4, H - 4);

  // wordmark
  x.fillStyle = ink; x.font = "700 52px 'Newsreader', Georgia, serif";
  x.fillText('BERBIRRU', 96, 96);
  var wBer = x.measureText('BERBIRRU').width;
  x.fillStyle = oranye; x.fillText('.COM', 96 + wBer, 96);
  x.fillRect(96, 176, W - 192, 2);

  // label tanggal
  var tgl;
  try { tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch (e) { tgl = ''; }
  x.fillStyle = abu; x.font = "600 30px 'DM Sans', Arial, sans-serif";
  x.fillText(('WARKAH · ' + tgl).toUpperCase(), 96, 232);

  // bait — justify; kartu judul-saja rata tengah
  x.fillStyle = ink; x.font = fontBait;
  if (judulSaja) for (var q = 0; q < layout.length; q++) layout[q].justify = false;
  var cy = topY;
  for (var r = 0; r < layout.length; r++) {
    var row = layout[r];
    if (row.gap) { cy += paraGap; continue; }
    var ws = row.words;
    if (row.justify) {
      var sum = 0;
      for (var k = 0; k < ws.length; k++) sum += x.measureText(ws[k]).width;
      var extra = maxW - sum;
      if (extra > 0 && extra < 400) {
        var step = extra / (ws.length - 1), cx = 96;
        for (var j = 0; j < ws.length; j++) {
          x.fillText(ws[j], cx, cy);
          cx += x.measureText(ws[j]).width + step;
        }
      } else if (judulSaja) { x.textAlign = 'center'; x.fillText(ws.join(' '), W / 2, cy); x.textAlign = 'left'; }
      else { x.fillText(ws.join(' '), 96, cy); }
    } else if (judulSaja) { x.textAlign = 'center'; x.fillText(ws.join(' '), W / 2, cy); x.textAlign = 'left'; }
    else { x.fillText(ws.join(' '), 96, cy); }
    cy += lineH;
  }

  // footer
  var footY = H - footH + 40;
  var who = '@' + p.pen_name + (p.city ? ' · ' + p.city : '');
  x.fillStyle = abu; x.font = "500 38px 'DM Sans', Arial, sans-serif";
  x.fillText(who, 96, footY);
  x.fillStyle = ink; x.font = "700 42px 'Newsreader', Georgia, serif";
  x.fillText('Baca selengkapnya di BERBIRRU.COM', 96, footY + 88);
  x.fillStyle = oranye; x.fillRect(96, footY + 148, 260, 6);

  return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
}

function sharePostBtn(btn) {
  var card = btn.closest('.thread-card');
  if (!card) return;
  var id = btn.getAttribute('data-id');
  var parent = btn.getAttribute('data-parent') || '';
  var root = (/^[0-9a-f-]{16,}$/i.test(parent)) ? parent : id;
  var q = function (s) { var el = card.querySelector(s); return el ? el.textContent.trim() : ''; };
  var pen = q('.thread-pen-name').replace(/^@/, '');
  var city = q('.thread-city');
  var title = q('.thread-title');
  var tEl = document.getElementById('text-' + id);
  var excerpt = tEl ? tEl.textContent.trim() : q('.thread-text');
  var p = { id: id, pen_name: pen, city: city, title: title, excerpt: excerpt };

  var url = 'https://berbirru.com/chain/' + root;
  var baruL = String.fromCharCode(10);
  var emD = String.fromCharCode(8212), kiri = String.fromCharCode(8220), kanan = String.fromCharCode(8221), titik = String.fromCharCode(8230), panah = String.fromCharCode(8594), titikDua = String.fromCharCode(183);
  var longPost = (title.length + excerpt.length) > 260;
  var hookUtama;
  if (longPost) {
    // teks share = SETENGAH isi bait (biar penasaran), dipotong di batas kata
    var h = excerpt.slice(0, Math.floor(excerpt.length / 2)).split(' ');
    if (h.length > 1) h.pop();
    hookUtama = h.join(' ').replace(/[,;:.]$/, '') + (titik);
  } else {
    // kutipan pendek: langsung utuh (sama seperti yang tampil di gambar)
    hookUtama = (title || excerpt).slice(0, 160);
  }
  var hook = kiri + hookUtama + kanan + ' ' + emD + ' @' + pen + (city ? ' ' + titikDua + ' ' + city : '') + baruL + 'Baca selengkapnya di BERBIRRU.COM ' + panah + ' ' + url;

  bbShareCard(p).then(function (blob) {
    var file = null;
    try { file = new File([blob], 'warkah-' + id.slice(0, 8) + '.png', { type: 'image/png' }); } catch (e) {}
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'BERBIRRU', text: hook, url: url }).catch(function () {});
      return;
    }
    // Fallback desktop: salin hook + unduh PNG
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(hook).then(function () {
        bbToast('Teks & tautan disalin. Gambar kartu ikut diunduh.', 'success');
      }).catch(function () { bbToast('Gambar kartu diunduh.', 'info'); });
    } else { bbToast('Gambar kartu diunduh.', 'info'); }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'warkah-' + id.slice(0, 8) + '.png';
    document.body.appendChild(a); a.click(); a.remove();
  }).catch(function () { bbToast('Gagal membuat kartu share.', 'error'); });
}
</script>`;
