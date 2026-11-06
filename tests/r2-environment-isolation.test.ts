import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const uji = readFileSync(new URL('../wrangler.uji.toml', import.meta.url), 'utf8');
const prod = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');

const bucket = (config: string) => config.match(/binding = "MEDIA"[\s\S]{0,80}?bucket_name = "([^"]+)"/)?.[1];
const ujiBucket = bucket(uji);
const prodBucket = bucket(prod);

assert.equal(ujiBucket, 'berbirru-media-uji', 'sandbox MEDIA wajib memakai bucket dedicated');
assert.equal(prodBucket, 'berbirru-media', 'production MEDIA wajib tetap memakai bucket produksi');
assert.notEqual(ujiBucket, prodBucket, 'sandbox dan production tidak boleh berbagi bucket MEDIA');
assert.doesNotMatch(uji, /bucket_name = "berbirru-media"\s*$/m, 'sandbox tidak boleh fallback ke bucket produksi');

console.log('OK — R2 sandbox memakai bucket dedicated dan production binding tetap terpisah');
