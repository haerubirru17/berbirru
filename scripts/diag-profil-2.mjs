import { chromium } from '/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs';
const br = await chromium.launch();
const ctx = await br.newContext({ storageState: '/tmp/golden-state-snap1.json' });
const page = await ctx.newPage();
await page.goto(process.env.BASE + '/u/snap1', { waitUntil: 'domcontentloaded', timeout: 30000 });
const html = await page.content();
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
console.log('blok script:', scripts.length);
scripts.forEach((s, i) => {
  try { new Function(s); }
  catch (e) {
    console.log(`=== script-${i} ERROR: ${e.message}`);
    // cari baris & kolom
    const m = /<anonymous>:(\d+):(\d+)/.exec(e.stack) || [];
    const lineNo = Number(m[1] || 1) - 1;
    const lines = ('\n' + s).split('\n');
    for (let k = Math.max(0, lineNo - 2); k <= Math.min(lines.length - 1, lineNo + 1); k++) {
      console.log(`${k === lineNo ? '>>' : '  '} ${k}: ${lines[k]?.slice(0, 220)}`);
    }
  }
});
await br.close();
