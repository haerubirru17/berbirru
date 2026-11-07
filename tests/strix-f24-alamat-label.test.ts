// Strix F24: label alamat di form edit harus di-escape di boundary renderer.
// Cek runnable: npm test
import assert from 'node:assert/strict';
import { register } from 'node:module';
register(new URL('./ts-ext-hook.mjs', import.meta.url));

const { renderAlamatFormPage } = await import('../src/web/alamat.ts');

// Payload Strix: mematahkan atribut value & membuat event handler onfocus.
const html = renderAlamatFormPage({} as any, { label: '" onfocus=window.__xss=1//', receiver: 'abc' });
const line = html.split('\n').find((l) => l.includes('name="label"'));
assert.ok(line, 'input label harus ada');
assert.match(line, /value="&quot; onfocus=window\.__xss=1\/\/"/, 'label ter-escape jadi &quot;');
// parse atribut tag sungguhan (bukan string-match) — onfocus tidak boleh JADI atribut
const tag = line.match(/<input[^>]*>/)?.[0] || '';
const attrs = [...tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)].map((a) => a[1]);
assert.ok(!attrs.includes('onfocus'), 'atribut event-handler tidak boleh ter-render (sekarang: ' + attrs.join(',') + ')');
assert.ok(attrs.includes('value'), 'atribut value tetap ada dan valid');
// nilai murni tanpa markup harus utuh
const plain = renderAlamatFormPage({} as any, { label: 'Rumah', receiver: 'abc' });
assert.match(plain, /value="Rumah"/, 'label bersih utuh');

console.log('OK — strix-f24: label alamat ter-escape di form edit');
