// Strix run-4 #4: ID alamat di inline JS wajib jsonScript (bukan escapeHtml).
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const { renderAlamatFormPage } = await import('../src/web/alamat.ts');
const html = renderAlamatFormPage({} as any, {
  label: 'ok',
  receiver: 'Budi',
  province_id: "x\\",
  city_id: ";name=1//",
  district_id: "safe",
} as any, '');

// P0/K0/C0 harus berupa JSON-string (double-quote, backslash + < sudah dinetralkan)
const line = html.split('\n').find((l) => l.includes('var P0='));
assert.ok(line, 'baris inisialisasi P0 ada');
assert.ok(line.includes('var P0="x\\\\",K0=";name=1//",C0="safe";'), 'value diserialisasi JSON aman-JS (backslash di-escape JSON)');
// tidak ada pelarian string single-quote lama
assert.ok(!line.includes("P0='x\\'"), 'pola rentan lama tidak boleh ada');
// </script> dinetralkan jsonScript
const html2 = renderAlamatFormPage({} as any, { province_id: '</script><b>x</b>' } as any, '');
assert.doesNotMatch(html2, /<\/script><b>/, '</script> harian tidak boleh lolos di konteks JS');

console.log('OK — strix-r4-4: ID alamat aman konteks script (jsonScript)');
