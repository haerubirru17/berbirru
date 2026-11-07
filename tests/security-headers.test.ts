import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const source = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8');

assert.match(source, /Strict-Transport-Security',\s*'max-age=86400'/,
  'Wave 4 tahap awal harus memakai HSTS 1 hari');
assert.doesNotMatch(source, /Strict-Transport-Security',\s*'[^']*includeSubDomains/,
  'includeSubDomains belum boleh diaktifkan pada tahap awal');
assert.doesNotMatch(source, /Strict-Transport-Security',\s*'[^']*preload/,
  'preload belum boleh diaktifkan pada tahap awal');

console.log('OK — HSTS tahap awal 86400 detik tanpa includeSubDomains/preload');
