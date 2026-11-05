// Task 4: setiap mutation user-driven membawa predicate active pada statement hakimnya.
// Dependents dijaga dependensi-alam (EXISTS baris hasil hakim) — kontrak plan §82-85.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const auth = read('../src/routes/auth.ts');
const social = read('../src/routes/social.ts');
const media = read('../src/routes/media.ts');
const pasar = read('../src/routes/pasar.ts');
const owner = read('../src/routes/owner.ts');

// === auth.ts — sisa write user-driven (login/verify/reset/mint sudah T2/T3) ===
assert.match(auth, /UPDATE users SET pen_name = \?, city = \? WHERE id = \? AND account_status = 'active'/,
  'register existing-user claim wajib active');
assert.match(auth, /UPDATE users SET password_hash = \? WHERE id = \? AND account_status = 'active'/,
  'login pw-upgrade wajib active');
assert.match(auth, /DELETE FROM sessions WHERE user_id = \? AND token_hash IS NOT NULL AND token_hash <> \?[\s\S]{0,120}account_status = 'active'/,
  'change-password revoke wajib active');
assert.match(auth, /DELETE FROM sessions WHERE user_id = \? AND \(token_hash IS NULL OR token_hash != \?\)[\s\S]{0,120}account_status = 'active'/,
  'logout-all wajib active');

// === social.ts ===
assert.match(social, /UPDATE users SET pen_name = \?, city = \?, bio = \?, display_name = \? WHERE id = \? AND account_status = 'active'/,
  'update profil wajib active');
// create warkah: hakim INSERT posts via INSERT...SELECT guarded active (root dan chain)
assert.equal((social.match(/INSERT INTO posts \(id, author_id, title, content, parent_id, visibility\)[\s\S]{0,140}(SELECT|VALUES)/g) || []).filter(m => m.includes('SELECT')).length, 2,
  'dua branch create warkah (root+chain) wajib INSERT...SELECT');
assert.equal((social.match(/INSERT INTO posts \(id, author_id, title, content, parent_id, visibility\)[\s\S]{0,520}?(u|au)\.account_status = 'active'/g) || []).length, 2,
  'dua hakim create warkah wajib guard active');
// fts dependen alam: hanya nyipta bila baris posts hakim ada
assert.equal((social.match(/INSERT INTO posts_fts[\s\S]{0,300}EXISTS \(SELECT 1 FROM posts (np|p) WHERE (np|p)\.id = \?/g) || []).length, 2,
  'dua fts insert wajib dependent-baris-hakim');
// delete warkah: guard snapshot menyertakan active
assert.match(social, /const guard = `EXISTS[\s\S]{0,250}?account_status = 'active'/,
  'guard delete warkah wajib menyertakan active');
assert.match(social, /DELETE FROM posts WHERE id = \? AND author_id = \? AND moderation_status = 'visible'[\s\S]{0,140}account_status = 'active'/,
  'hakim DELETE posts wajib active');
// like/bookmark: hakim relation + state probe
for (const t of ['likes', 'bookmarks']) {
  assert.match(social, new RegExp(`INSERT OR IGNORE INTO ${t} \\(user_id, post_id\\)[\\s\\S]{0,320}?au\\.account_status = 'active'`),
    `hakim insert ${t} wajib active`);
}
assert.equal((social.match(/actor_active/g) || []).length, 4, 'like+bookmark state probe actor_active 2 lokasi tiap route (SELECT + #error)');
// follow: hakim insert/unfollow + notif cleanup ter-guard
assert.match(social, /INSERT OR IGNORE INTO follows[\s\S]{0,200}account_status = 'active'/, 'follow insert wajib active');
assert.match(social, /DELETE FROM follows WHERE follower_id = \? AND following_id = \?[\s\S]{0,220}account_status = 'active'/,
  'unfollow/remove-follower delete wajib active');

// === media.ts ===
assert.match(media, /UPDATE users SET \$\{spec\.col\} = \? WHERE id = \? AND account_status = 'active'/,
  'media update kolom wajib active');
assert.match(media, /MEDIA\.delete\(key\)/, 'upload gagal wajib best-effort hapus key baru (anti-orphan)');
assert.match(media, /if \(!up\.meta\.changes\)/, 'media handler wajib gagal-tertutup saat guard menolak');

// === pasar.ts — hakim-hakim user-driven (count threshold + bentuk kunci) ===
assert.equal((pasar.match(/account_status = 'active'/g) || []).length >= 24, true,
  'pasar wajib guard active di tiap hakim user-driven (>=24)');
assert.match(pasar, /INSERT INTO orders \(id, listing_id, buyer_id, seller_id, price, shipping, status, kesepakatan,[\s\S]{0,400}SELECT[\s\S]{0,700}account_status = 'active'/,
  'create order langsung wajib hakim INSERT...SELECT active');
assert.match(pasar, /INSERT INTO listings /, 'marker existence');
assert.match(pasar, /UPDATE users SET seller_status='pending'[\s\S]{0,240}account_status = 'active'/,
  'seller apply wajib active');
assert.match(pasar, /INSERT INTO withdrawals[\s\S]{0,400}account_status = 'active'/,
  'withdrawal hakim wajib INSERT...SELECT active');
assert.match(pasar, /UPDATE orders SET status = 'handed'[\s\S]{0,300}account_status = 'active'/,
  'handover hakim wajib active');
assert.match(pasar, /UPDATE orders SET status = 'completed'[\s\S]{0,300}account_status = 'active'/,
  'receive hakim wajib active');
assert.match(pasar, /UPDATE orders SET status = 'disputed'[\s\S]{0,300}account_status = 'active'/,
  'dispute hakim wajib active');
assert.match(pasar, /UPDATE orders SET resi_verified = 1[\s\S]{0,300}account_status = 'active'/,
  'track hakim wajib active');
assert.doesNotMatch(pasar, /UPDATE orders SET status = 'paid'[\s\S]{0,400}account_status/,
  'webhook pembayaran (system) TIDAK diguard user-active');
assert.doesNotMatch(pasar, /UPDATE orders SET status = 'expired'[\s\S]{0,400}account_status/,
  'cron expiry (system) TIDAK diguard user-active');

// === owner.ts — owner mutations juga active (defense-in-depth; owner tak tersuspend by design) ===
assert.equal((owner.match(/account_status = 'active'/g) || []).length >= 6, true,
  'owner hakim (resolve/review/settle/reconcile) wajib active (>=6)');
assert.match(owner, /UPDATE users SET seller_status=\?[\s\S]{0,300}account_status = 'active'/,
  'seller review users-update wajib active');

// === Rilis B: R2 upload bound (plan §91) ===
assert.equal((pasar.match(/putFoto\(\s*c: any,\s*keyName: \(ext: string\) => string,\s*uploaderId: string\s*\)/g) || []).length, 1,
  'putFoto wajib terima uploaderId utk cek active kedua');
assert.equal((pasar.match(/SELECT 1 AS ok FROM users WHERE id = \? AND account_status = 'active'/g) || []).length, 3,
  'putFoto + upload-delete + evidence fallback wajib cek active KEDUA (Rilis B W3+W4)');
assert.equal((pasar.match(/await putFoto\(c, \(ext\) =>[\s\S]{0,140}?, me\.id\)/g) || []).length, 3,
  'tiga caller putFoto wajib lolos identitas utk cek kedua');
assert.match(media, /SELECT 1 AS ok FROM users WHERE id = \? AND account_status = 'active'/,
  'media put wajib cek active kedua sebelum put');
assert.match(media, /orphan key setelah guard tolak/, 'cleanup gagal wajib tercatat server-side');

// === Rilis B pascareview: W1-W3 ===
assert.equal((auth.match(/INSERT INTO sessions \(id, user_id, token(_hash)?, expires_at\)[\s\S]{0,220}SELECT[\s\S]{0,180}account_status = 'active'/g) || []).length, 5,
  'verify-otp mint + tiket reset + issueOtp/issueResetOtp/issueOtpFlow wajib INSERT...SELECT active (T3 + W2)');
assert.doesNotMatch(auth, /flow && flowRes\.meta\.changes !== 1/,
  'flow-delete bukan invariant (W1: 0 sah, row bisa dimakan send-otp konkuren)');
assert.match(pasar, /evidence: orphan key setelah guard tolak/, 'W3: evidence cleanup wajib log orphan');
assert.match(pasar, /seller-docs: orphan key setelah guard tolak/, 'W3: seller-docs cleanup wajib log orphan');

console.log('OK — Task 4+Rilis B: predicate active pada seluruh hakim user-driven; R2 bound; W1-W4 closed; system paths bebas');
