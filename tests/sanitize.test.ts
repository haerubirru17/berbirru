// Cek runnable: node --experimental-strip-types src/lib/sanitize.test.ts
import { sanitizeRich, escapeHtml, stripTags } from '../src/lib/sanitize.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

// 1. Vektor XSS harus hilang total.
const xss = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg/onload=alert(1)>',
  '<iframe src="//evil.com"></iframe>',
  '<a href="javascript:alert(1)">x</a>',
  '<div onclick="alert(1)">x</div>',
  '<body onload=alert(1)>',
  '<input autofocus onfocus=alert(1)>',
  '<style>@import url(//evil.com)</style>',
];
for (const p of xss) {
  const out = sanitizeRich(p);
  assert(!/<(script|img|svg|iframe|a|div|body|input|style)\b/i.test(out), `tag lolos: ${p} -> ${out}`);
  assert(!/on\w+\s*=/i.test(out), `handler lolos: ${p} -> ${out}`);
  assert(!/javascript:/i.test(out), `js-url lolos: ${p} -> ${out}`);
}

// 2. Script bersarang di dalam tag allowlist harus ikut hilang.
const nested = sanitizeRich('<b>tebal<script>alert(1)</script></b>');
assert(!/script/i.test(nested), 'script bersarang lolos: ' + nested);
assert(nested.includes('<b>') && nested.includes('tebal'), 'format sah hilang: ' + nested);

// 3. Format editor yang sah harus TETAP utuh (jangan rusak rich text).
const good = '<b>Halo</b> <i>miring</i> <u>garis</u> <blockquote>"Kutipan"</blockquote><br><span class="font-serif">serif</span>';
assert(sanitizeRich(good) === good, 'format sah berubah: ' + sanitizeRich(good));

// 4. Class asing dibuang, class font dipertahankan.
assert(sanitizeRich('<span class="evil font-mono">x</span>') === '<span class="font-mono">x</span>', 'class filter salah');

// 5. Data lama di DB (dari dump produksi) tetap utuh.
const legacy = '<b>Halo cek system, </b>cek system, <i>cek system, <u><span class="font-mono"><span class="font-serif">cek system,&nbsp;';
assert(sanitizeRich(legacy) === legacy, 'data lama rusak: ' + sanitizeRich(legacy));

// 6. Judul & bio plain-text.
assert(escapeHtml('<script>a</script>') === '&lt;script&gt;a&lt;/script&gt;', 'escapeHtml salah');
assert(!/</.test(escapeHtml('<b>x</b>')), 'escapeHtml bocor <');
assert(stripTags('<b>Halo</b> dunia') === 'Halo dunia', 'stripTags salah');

console.log('OK — sanitize: semua cek lolos');
