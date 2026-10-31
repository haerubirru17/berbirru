// Cek runnable: npm test
// Gate 1-2 rencana 2026-10-31_200330: CSP memuat frame-src Turnstile (satu origin),
// guard /api/posts mengukur BYTE UTF-8 di q yang sama yang masuk ke sink LIKE.
import { readFileSync } from 'node:fs';
const assert = (ok: unknown, msg: string) => { if (!ok) throw new Error('GAGAL: ' + msg); };

const header = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');
assert(/frame-src https:\/\/challenges\.cloudflare\.com/.test(header), 'CSP mengizinkan iframe Turnstile');
assert(!/frame-src \*/.test(header), 'frame-src tidak wildcard');
const csp = header.match(/Content-Security-Policy', "([^"]+)"/)?.[1] || '';
const directives = csp.split(';').map((s) => s.trim().split(' ')[0]);
assert(directives.filter((d) => d === 'frame-src').length === 1, 'frame-src hanya satu');

const social = readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8');
assert(social.includes('new TextEncoder().encode(q).byteLength > 48'), 'guard /api/posts pakai byte UTF-8');
assert(!social.includes('if (q.length > 48)'), 'guard codepoint lama sudah hilang');

// Bukti matematika byte: batas 48 benar untuk 1-4 byte per karakter.
const enc = new TextEncoder();
assert(enc.encode('a'.repeat(48)).byteLength === 48 && enc.encode('a'.repeat(49)).byteLength === 49, 'ascii 48/49');
assert(enc.encode('é'.repeat(24)).byteLength === 48 && enc.encode('é'.repeat(25)).byteLength === 50, '2-byte 24/25');
assert(enc.encode('中'.repeat(16)).byteLength === 48 && enc.encode('中'.repeat(17)).byteLength === 51, '3-byte 16/17');
assert(enc.encode('𝕏'.repeat(12)).byteLength === 48 && enc.encode('𝕏'.repeat(13)).byteLength === 52, '4-byte 12/13');

console.log('OK — CSP frame-src Turnstile + guard byte UTF-8 terkunci');
