// Sanitasi HTML untuk konten kaya (warkah) — allowlist, tanpa DOM, jalan di Workers & Node.
//
// ponytail: regex-based, bukan parser HTML penuh. Ceiling: markup cacat yang aneh
// (tag tak tertutup, entitas eksotis) bisa lolos sebagai teks ter-escape — aman,
// cuma tampil sebagai teks. Upgrade path: ganti ke parser sungguhan (mis. DOMPurify
// + linkedom) kalau nanti benar-benar perlu menoleransi HTML arbitrer.

const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 's', 'br', 'blockquote', 'span'];
const FONT_CLASSES = ['font-sans', 'font-serif', 'font-mono'];

// Elemen yang isinya dibuang total (bukan cuma tag-nya) — ini vektor XSS/script.
const DANGEROUS = [
  'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template',
  'noscript', 'title', 'textarea', 'link', 'meta', 'base', 'form', 'input',
  'button', 'select', 'option', 'applet', 'frame', 'frameset', 'audio', 'video',
];

export function escapeHtml(t: unknown): string {
  return String(t ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Buang semua tag, sisakan teksnya (dipakai untuk hitung panjang preview). */
export function stripTags(html: unknown): string {
  return String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * Sanitasi konten warkah: pertahankan format editor (b/i/u/s, blockquote,
 * span.font-*), buang sisanya. Titik tunggal di API layer — semua sink render
 * (feed, profil, notifikasi) jadi aman sekaligus.
 */
export function sanitizeRich(input: unknown): string {
  let s = String(input ?? '');

  // 1. Buang elemen berbahaya beserta isinya (pasangan dulu, lalu sisa tag).
  for (const tag of DANGEROUS) {
    s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '');
    s = s.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi'), '');
  }

  // 2. Filter tag: hanya allowlist yang lolos; atribut selain font-class dibuang.
  // `[^>]*` menjadikan filter total — tag apa pun (termasuk kutip tak seimbang,
  // vektor vuln-0010) pasti habis di sini; tak ada sisa '<' yang lolos ke step-3.
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (m, name, attrsRaw) => {
    const t = String(name).toLowerCase();
    const closing = m.startsWith('</');
    if (!ALLOWED_TAGS.includes(t)) return '';
    if (t === 'br') return '<br>';
    if (t === 'span') {
      if (closing) return '</span>';
      const raw = String(attrsRaw ?? '');
      const mm = /class\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(raw);
      const cls = ((mm ? (mm[1] ?? mm[2]) : '').split(/\s+/)).filter((x) => FONT_CLASSES.includes(x));
      return cls.length ? `<span class="${cls.join(' ')}">` : '<span>';
    }
    return closing ? `</${t}>` : `<${t}>`;
  });

  // 3. Sisa '<' yang bukan tag allowlist yang utuh → jadikan teks biasa.
  s = s.replace(/<(?!\/?(?:b|strong|i|em|u|s|br|blockquote|span)\b[^>]*>)/gi, '&lt;');

  return s;
}

// Embed aman di dalam blok <script> (audit C-02): JSON.stringify tidak menetralkan
// '</script>' → HTML parser memutus blok. Ganti semua '<' dengan \u003c (semantics identik).
export function jsonScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
