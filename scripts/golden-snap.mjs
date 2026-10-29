// Golden snapshot: tangkap respons endpoint, normalisasi field volatile, bandingkan.
// Pakai: node scripts/golden-snap.mjs snap   → tulis golden/current.json
//        node scripts/golden-snap.mjs diff   → bandingkan current vs golden/baseline.json (exit 1 jika beda)
//        node scripts/golden-snap.mjs save   → jadikan current sebagai baseline baru (amnesty, bukti di pesan)
import { chromium } from '/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs';
import fs from 'fs';
import path from 'path';

const B = process.env.GOLDEN_BASE || 'https://berbirru-uji.haerubirru17.workers.dev';
const DIR = new URL('../golden/', import.meta.url).pathname;
const STATE = '/tmp/golden-state-snap1.json';

const GUEST = ['/', '/login', '/feed', '/sitemap.xml', '/robots.txt',
  '/api/posts?mode=latest', '/api/posts?mode=viral', '/api/posts?mode=following',
  '/api/posts?mode=latest&q=kijangemas10', '/api/posts?mode=latest&q=%25',
  '/api/users/suggest?q=snap', '/api/auth/me',
  '/api/notifications', '/api/notifications/unread-count', '/api/notifications?scope=pasar',
  '/pasar', '/api/kurir/wilayah?parent=31.01'];

const AUTHED = ['/api/auth/me', '/api/users/snap1',
  '/api/users/snap1/follows?type=followers', '/api/users/snap1/follows?type=following',
  '/api/users/snap1/follows?type=xxx', '/api/users/snap1/posts?tab=original', '/api/users/snap1/posts?tab=liked', '/api/users/snap1/posts?tab=saved',
  '/feed', '/u/snap1', '/notifications', '/api/notifications', '/api/notifications/unread-count', '/api/notifications?scope=pasar',
  '/api/posts?mode=following',
  '/pasar', '/pasar/saya', '/akun', '/saldo', '/pesanan', '/toko'];

function norm(x) {
  if (typeof x === 'string') {
    return x
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '<UUID>')
      .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z| UTC)?/g, '<TS>')
      // Cache-buster ?v=<epoch> dari pasar.ts (Date.now())
      .replace(/\?v=\d{10,}/g, '?v=<V>')
      // Jam hidup di mockup landing (<time data-tz="Asia/Singapore">14.04)
      .replace(/<time data-tz="[^"]*">\d{1,2}[.:]\d{2}(:\d{2})?<\/time>/g, '<time>HK</time>')
      .replace(/\d{1,2}\.\d{2} (?:WIB|WITA|WIT), \d{1,2} \w{3} \d{4}/g, '<TS>');
  }
  if (Array.isArray(x)) return x.map(norm);
  if (x && typeof x === 'object') {
    const out = {};
    for (const k of Object.keys(x).sort()) out[k] = norm(x[k]);
    return out;
  }
  return x;
}

async function snap() {
  fs.mkdirSync(DIR, { recursive: true });
  const br = await chromium.launch();
  const guest = await br.newContext();
  const authed = await br.newContext({ storageState: STATE });
  const out = { base: B, at: new Date().toISOString(), guest: {}, authed: {} };
  for (const [side, ctx, list] of [['guest', guest, GUEST], ['authed', authed, AUTHED]]) {
    for (const p of list) {
      const res = await ctx.request.get(B + p);
      const ct = res.headers()['content-type'] || '';
      let body;
      try { body = ct.includes('json') ? norm(await res.json()) : norm(await res.text()).slice(0, 30000); }
      catch { body = '<unreadable>'; }
      out[side][p] = { status: res.status(), ct: ct.split(';')[0], body };
      process.stdout.write(`${side} ${res.status()} ${p}\n`);
    }
  }
  await br.close();
  fs.writeFileSync(path.join(DIR, 'current.json'), JSON.stringify(out, null, 1));
  console.log('saved golden/current.json');
}

function diff() {
  const base = JSON.parse(fs.readFileSync(path.join(DIR, 'baseline.json')));
  const cur = JSON.parse(fs.readFileSync(path.join(DIR, 'current.json')));
  let diffs = 0;
  for (const side of ['guest', 'authed']) {
    for (const p of Object.keys(base[side])) {
      const b = base[side][p], c = cur[side][p];
      if (b.status !== c.status) { console.log(`STATUS ${side} ${p}: ${b.status} -> ${c.status}`); diffs++; continue; }
      const bs = JSON.stringify(b.body), cs = JSON.stringify(c.body);
      if (bs !== cs) {
        diffs++;
        for (let i = 0; i < Math.min(bs.length, cs.length); i++) {
          if (bs[i] !== cs[i]) {
            console.log(`BODY ${side} ${p}:\n  beda@~${i}\n  baseline: ...${bs.slice(Math.max(0, i - 80), i + 120)}\n  current : ...${cs.slice(Math.max(0, i - 80), i + 120)}`);
            break;
          }
        }
        if (bs.length !== cs.length && !cs.includes(bs.slice(0, 40))) console.log(`  (panjang ${bs.length} vs ${cs.length})`);
      }
    }
  }
  console.log(diffs === 0 ? 'GOLDEN DIFF: 0 (identik)' : `GOLDEN DIFF: ${diffs} perbedaan`);
  process.exit(diffs === 0 ? 0 : 1);
}

const arg = process.argv[2] || 'snap';
if (arg === 'snap') await snap();
else if (arg === 'diff') diff();
else if (arg === 'save') { fs.copyFileSync(path.join(DIR, 'current.json'), path.join(DIR, 'baseline.json')); console.log('baseline diperbarui'); }
