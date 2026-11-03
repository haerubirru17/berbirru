// Script share warkah — dikirim verbatim ke browser (pola feed.ts).
// Kanvas client-side: kartu PNG 1080x1350 krem-kern (kertas, tinta, aksen oranye).
// ponytail: tanpa dependensi; fallback desktop = salin hook + unduh PNG.

export const SHARE_CARD_JS = `<script id="bb-share">
function bbWrapText(ctx, text, x, y, maxW, lineH, maxRows) {
  var words = String(text).replace(/\\s+/g, ' ').trim().split(' ');
  var line = '', rows = 0, cy = y;
  for (var i = 0; i < words.length; i++) {
    var t = line + words[i] + ' ';
    if (ctx.measureText(t).width > maxW && line !== '') {
      ctx.fillText(line.trim(), x, cy);
      cy += lineH; rows++; line = words[i] + ' ';
      if (rows >= maxRows) {
        var rest = words.slice(i).join(' ');
        ctx.fillText(line.trim().replace(/[,;:.\\s]+$/, '') + ' \\u2026', x, cy);
        return cy;
      }
    } else { line = t; }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy);
  return cy;
}

function bbShareCard(p) {
  var W = 1080, H = 1350;
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  var x = cv.getContext('2d');
  var ink = '#0E0E0E', oranye = '#FF3B1A', krem = '#EFEBE3', kremMuda = '#F6F3EB', abu = '#6E6A63';
  x.fillStyle = krem; x.fillRect(0, 0, W, H);
  x.fillStyle = kremMuda; x.fillRect(40, 40, W - 80, H - 80);
  x.strokeStyle = ink; x.lineWidth = 4; x.strokeRect(2, 2, W - 4, H - 4);

  // wordmark
  x.fillStyle = ink; x.textBaseline = 'top';
  x.font = "700 52px 'Newsreader', Georgia, serif";
  x.fillText('BERBIRRU', 96, 96);
  var wBer = x.measureText('BERBIRRU').width;
  x.fillStyle = oranye; x.fillText('.COM', 96 + wBer, 96);
  x.fillStyle = ink; x.lineWidth = 2;
  x.fillRect(96, 176, W - 192, 2);

  // label
  var tgl;
  try { tgl = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch (e) { tgl = ''; }
  x.fillStyle = abu; x.font = "600 30px 'DM Sans', Arial, sans-serif";
  x.fillText(('WARKAH \\u00b7 ' + tgl).toUpperCase(), 96, 232);

  // bait — Newsreader serif, maks 10 baris
  x.fillStyle = ink; x.font = "500 56px 'Newsreader', Georgia, serif";
  var teks = (p.title ? p.title + '\\n\\n' : '') + (p.excerpt || '');
  var akhirY = bbWrapText(x, teks, 96, 320, W - 192, 80, 10);

  // footer
  var who = '@' + p.pen_name + (p.city ? ' \\u00b7 ' + p.city : '');
  x.fillStyle = abu; x.font = "500 38px 'DM Sans', Arial, sans-serif";
  x.fillText(who, 96, H - 240);
  x.fillStyle = ink; x.font = "700 42px 'Newsreader', Georgia, serif";
  x.fillText('Baca selengkapnya di BERBIRRU.COM', 96, H - 152);
  x.fillStyle = oranye; x.fillRect(96, H - 92, 260, 6);

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
  var potongan = (title || excerpt).slice(0, 160);
  var hook = '\\u201c' + potongan + (potongan.length >= 160 ? '\\u2026' : '') + '\\u201d \\u2014 @' + pen + (city ? ' \\u00b7 ' + city : '') + '\\nBaca selengkapnya di BERBIRRU.COM \\u2192 ' + url;

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
