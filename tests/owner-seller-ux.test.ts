// Cek runnable: npm test
// Wiring run-3 (laporan owner): /akun tidak menawarkan "Buka Toko"/verifikasi ke owner.
import { readFileSync } from 'node:fs';
const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

const akun = readFileSync(new URL('../src/web/akun.ts', import.meta.url), 'utf8');
assert(akun.includes("${owner ? '' : baris("), 'CTA toko harus disembunyikan untuk owner');
const pasarSrc = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');
assert(pasarSrc.includes("if (isOwner(c.env, user)) return c.redirect('/owner')"), '/pasar/jual harus redirect owner ke dashboard');

console.log('OK — owner tidak ditawari jualan/verifikasi');
