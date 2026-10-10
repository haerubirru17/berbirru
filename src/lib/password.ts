// Password hashing: PBKDF2-SHA256 600k iterasi via WebCrypto native (tanpa dependency).
// Native crypto di Workers ~75ms/600k — tidak menyentuh limit CPU 10ms.
// Format simpanan: pbkdf2$sha256$<iterasi>$<salt-b64>$<hash-b64> (salt 16 byte per user).
// Verifikasi tetap menerima hash lama (SHA-256 + salt statis) supaya login user lama
// tidak putus; hash lama otomatis di-upgrade saat login berikutnya (rehash transparan).

const PBKDF2_ITER = 600_000;
const LEGACY_SALT = 'berbirru-salt-2026';

const b64 = (b: Uint8Array): string => btoa(String.fromCharCode(...b));
const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Perbandingan waktu-konstan (hand-rolled; Workers tanpa nodejs_compat tak punya timingSafeEqual). */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return b64(new Uint8Array(bits));
}

async function legacySha256(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password + LEGACY_SALT));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITER);
  return `pbkdf2$sha256$${PBKDF2_ITER}$${b64(salt)}$${hash}`;
}

/** true bila cocok. Juga mengembalikan apakah hash perlu di-upgrade (format lama). */
export async function verifyPassword(password: string, stored: string): Promise<{ ok: boolean; needsRehash: boolean }> {
  const s = String(stored || '');
  if (s.startsWith('pbkdf2$')) {
    const parts = s.split('$');
    const iter = parseInt(parts[2], 10);
    if (!iter || !parts[3] || !parts[4]) return { ok: false, needsRehash: false };
    const hash = await pbkdf2(password, unb64(parts[3]), iter);
    return { ok: timingSafeEqualStr(hash, parts[4]), needsRehash: iter < PBKDF2_ITER };
  }
  const legacy = await legacySha256(password);
  return { ok: timingSafeEqualStr(legacy, s), needsRehash: true };
}

// Daftar singkat password terlarang — cukup untuk menutup "123", "password", dll.
const COMMON = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'password123',
  'qwerty123', 'qwertyui', 'iloveyou', 'admin123', 'administrator', 'letmein1',
  'welcome1', 'welcome123', 'monkey123', 'dragon123', 'football', 'baseball',
  'sunshine', 'princess', 'abcd1234', 'a1b2c3d4', 'passw0rd', 'p@ssw0rd',
  'berbirru', 'berbirru123', 'katasandi', 'rahasia123', 'indonesia1',
]);

/** Kembalikan pesan masalah, atau null bila kata sandi lolos kebijakan. */
export function passwordIssue(password: unknown, email?: string, penName?: string): string | null {
  const s = String(password ?? '');
  if (s.length < 8) return 'Kata sandi minimal 8 karakter.';
  if (s.length > 200) return 'Kata sandi terlalu panjang (maksimal 200 karakter).';
  const low = s.toLowerCase();
  if (COMMON.has(low)) return 'Kata sandi terlalu umum. Pilih kombinasi lain.';
  if (email && low === String(email).trim().toLowerCase()) return 'Kata sandi tidak boleh sama dengan email.';
  if (penName && low === String(penName).trim().toLowerCase()) return 'Kata sandi tidak boleh sama dengan nama pena.';
  return null;
}
