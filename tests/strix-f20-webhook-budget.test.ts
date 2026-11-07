// Strix F20: webhook QRIS tidak boleh membekukan callback sah.
// Kontrak urutan: (1) flood-limiter per-IP paling awal, (2) parse→lookup→404 unknown,
// (3) signature-verify SEBELUM budget per-order, (4) budget per-order sebelum reconcile,
// (5) verifyWebhook tepat SATU kali (dedupe), (6) kunci global lama 'klikqris:webhook' dihapus.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/routes/pasar.ts', import.meta.url), 'utf8');

const m = src.match(/app\.post\('\/api\/klikqris\/webhook'[\s\S]*?\n\}\);/);
assert.ok(m, 'handler webhook harus ada');
const h = m[0];

const order = (subs: string[]) => {
  const idx = subs.map((s) => {
    const i = h.indexOf(s);
    assert.ok(i >= 0, `harus ada di webhook: ${s}`);
    return i;
  });
  for (let k = 1; k < idx.length; k++) {
    assert.ok(idx[k - 1] < idx[k], `urutan salah: "${subs[k - 1]}" harus sebelum "${subs[k]}"`);
  }
};

order([
  "hitRate(c.env.DB, `klikqris:wh-ip:",
  "c.req.json()",
  "SELECT * FROM orders WHERE qris_order_id = ?",
  "verifyWebhook(body",
  "hitRate(c.env.DB, `klikqris:wh-order:",
  "reconcileQris(",
]);

// lapis-1 per-IP: budget terpisah (flood tak menyentuh budget callback sah)
assert.match(h, /klikqris:wh-ip:\$\{ip\}`, 120, 60/, 'flood limiter per-IP 120/menit');
assert.match(h, /cf-connecting-ip/, 'IP dari header CF (provider callback gak kena blok penyerang');

// lapis-2 per-order: SETELAH signature valid — sampah sah-bentuk tak membekukan callback asli
assert.match(h, /klikqris:wh-order:\$\{o\.id\}`, 10, 60/, 'budget per-order 10/menit setelah signature');

// verifyWebhook tepat satu kali (duplikasi verify expired-branch dihapus)
const nVerify = (h.match(/verifyWebhook\(/g) || []).length;
assert.equal(nVerify, 1, 'verifyWebhook harus dipanggil tepat satu kali (sekarang: ' + nVerify + ')');

// kunci global lama tidak boleh tinggal
assert.doesNotMatch(h, /hitRate\(c\.env\.DB, 'klikqris:webhook'/, 'budget global lama (kasus DoS) wajib dihapus');
// 404 unknown-order tetap sebelum verify & sebelum budget per-order
const i404 = h.indexOf("'order tak dikenal'");
const iV = h.indexOf('verifyWebhook(');
assert.ok(i404 > 0 && i404 < iV, 'unknown-order 404 sebelum verify (tanpa konsumsi budget per-order)');

console.log('OK — strix-f20: budget webhook terpisah, callback sah tidak bisa disandera');
