// Guard regresi putaran-4 Strix — vuln-0002 (owner decision 50KB).
// Aturan: cap konten warkah = 50.000 karakter, ditegakkan SEBELUM sanitasi
// (input raksasa tak menyentuh sanitizeRich) dan SESUDAH (jaga ekspansi
// sanitizer). 50KB = keputusan owner 15 Okt 2026 — JANGAN diturunkan.
// Runnable: npm test

const MAX_POST_CHARS = 50_000;

// Replika urutan cek di app.post('/api/posts'):
function postTooLong(raw: unknown, sanitizedLen: number): boolean {
  if (typeof raw === 'string' && raw.length > MAX_POST_CHARS) return true;
  if (sanitizedLen > MAX_POST_CHARS) return true;
  return false;
}

if (postTooLong('a'.repeat(50_000), 50_000)) throw new Error('GAGAL: 50.000 karakter harusnya LOLOS');
if (!postTooLong('a'.repeat(50_001), 50_001)) throw new Error('GAGAL: 50.001 karakter harusnya DITOLAK');
if (postTooLong(undefined, 10)) throw new Error('GAGAL: input non-string tak boleh kena cap pre-sanitize');
if (!postTooLong('<b>x</b>', 50_001)) throw new Error('GAGAL: ekspansi sanitizer harusnya terjaga');

console.log('OK — cap 50.000 karakter: pas dalam, 1 di atasnya ditolak, non-string aman, ekspansi terjaga.');
