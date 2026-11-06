import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const source = readFileSync(new URL('../src/routes/social.ts', import.meta.url), 'utf8');

assert.match(source, /const POST_MODES\s*=\s*new Set\(\['viral',\s*'latest',\s*'following'\]\)/,
  'mode harus punya allowlist eksplisit');
assert.match(source, /if \(!POST_MODES\.has\(mode\)\) return c\.json\(\{ error: '[^']+' \}, 400\)/,
  'mode tidak dikenal harus ditolak 400 dan tidak dipantulkan');
assert.match(source, /const mode = c\.req\.query\('mode'\) \|\| 'viral';/,
  'mode kosong harus tetap memakai default viral');

console.log('OK — posts mode allowlist menolak input arbitrary');
