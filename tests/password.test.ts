// Cek runnable: npm test
import { hashPassword, verifyPassword, passwordIssue } from '../src/lib/password.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error('GAGAL: ' + msg); };

// 1. Hash baru: format PHC, bukan SHA-256 heksadesimal, dan ada salt acak.
const h1 = await hashPassword('rahasiaYangKuat123');
const h2 = await hashPassword('rahasiaYangKuat123');
assert(h1.startsWith('pbkdf2$sha256$600000$'), 'format hash salah: ' + h1.slice(0, 30));
assert(h1 !== h2, 'salt tidak acak — dua hash identik (rainbow table masih bisa)');
assert(h1.length !== 64, 'sepertinya masih SHA-256 heksadesimal');

// 2. Verifikasi benar/salah.
assert((await verifyPassword('rahasiaYangKuat123', h1)).ok === true, 'password benar ditolak');
assert((await verifyPassword('salahSekali', h1)).ok === false, 'password salah diterima');

// 3. Hash LAMA (SHA-256 + salt statis) harus tetap bisa diverifikasi + ditandai needsRehash.
const enc = new TextEncoder().encode('password123' + 'berbirru-salt-2026');
const buf = await crypto.subtle.digest('SHA-256', enc);
const legacy = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
const vLegacy = await verifyPassword('password123', legacy);
assert(vLegacy.ok === true, 'user lama tidak bisa login (migrasi putus)');
assert(vLegacy.needsRehash === true, 'hash lama tidak ditandai perlu upgrade');
assert((await verifyPassword('password123', h1)).needsRehash === false, 'hash baru salah ditandai perlu upgrade');

// 4. Sampah di kolom hash tidak boleh bikin crash / menerima apa pun.
assert((await verifyPassword('apa saja', 'pbkdf2$sha256$rusak')).ok === false, 'hash rusak diterima');

// 5. Kebijakan kata sandi.
assert(passwordIssue('123') !== null, '"123" seharusnya ditolak');
assert(passwordIssue('password') !== null, '"password" seharusnya ditolak');
assert(passwordIssue('1234567') !== null, '7 karakter seharusnya ditolak');
assert(passwordIssue('rahasiaYangKuat123') === null, 'kata sandi kuat malah ditolak');
assert(passwordIssue('rahasiaYangKuat123', 'rahasiaYangKuat123') !== null, 'sandi == email seharusnya ditolak');

console.log('OK — password: semua cek lolos');
