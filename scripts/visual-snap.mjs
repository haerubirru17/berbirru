// Baseline & diff visual (Wave 0 plan tema). Modes: snap | diff
// node scripts/visual-snap.mjs snap  → simpan PNG per halaman (mobile+desktop)
// node scripts/visual-snap.mjs diff  → bandingkan, exit 1 bila deviasi
// playwright diambil dari cache npx (bukan dependency repo — repo tak memasang playwright)
const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const B = 'https://berbirru-uji.haerubirru17.workers.dev';
const MODE = process.argv[2] || 'snap';
const DIR = 'golden/visual';
const SESSION = process.env.VISUAL_SESSION || 'snap-session-token-01';

// halaman: [nama, path, butuhAuth]
const PAGES = [
  ['landing', '/'],
  ['feed', '/feed'],
  ['pasar', '/pasar'],
  ['login', '/login'],
  ['profile', '/u/snap1'],
  ['notifications', '/notifications'],
  ['akun', '/akun'],
  ['alamat', '/akun/alamat'],
  ['pesanan', '/pesanan'],
];
const VIEWPORTS = [['m', 412, 915], ['d', 1280, 900]];

// diff piksel via canvas di dalam browser (tanpa dependency baru):
async function pngDiffPct(br, bufA, bufB) {
  const page = await br.newPage();
  const a64 = bufA.toString('base64'), b64 = bufB.toString('base64');
  const pct = await page.evaluate(async ([a, b]) => {
    const load = (s) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + s; });
    const ia = await load(a), ib = await load(b);
    if (ia.width !== ib.width || ia.height !== ib.height) return 100;
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
    const x = c.getContext('2d');
    x.drawImage(ia, 0, 0); const da = x.getImageData(0, 0, ia.width, ia.height).data;
    x.clearRect(0, 0, c.width, c.height);
    x.drawImage(ib, 0, 0); const db = x.getImageData(0, 0, ia.width, ia.height).data;
    let diff = 0;
    for (let i = 0; i < da.length; i++) if (da[i] !== db[i]) diff++;
    return diff / da.length * 100;
  }, [a64, b64]);
  await page.close();
  return pct;
}

mkdirSync(DIR, { recursive: true });
const br = await chromium.launch();
const ctx = await br.newContext();
await ctx.addCookies([{ name: 'berbirru_session', value: SESSION, domain: new URL(B).hostname, path: '/' }]);
const page = await ctx.newPage();

let fail = 0, total = 0;
for (const [name, pathUrl] of PAGES) {
  for (const [vk, w, h] of VIEWPORTS) {
    await page.setViewportSize({ width: w, height: h });
    const res = await page.goto(B + pathUrl, { waitUntil: 'networkidle' }).catch(() => null);
    if (!res) { console.log(name + '/' + vk + ': GAGAL akses'); continue; }
    await page.waitForTimeout(700); // settle font/render
    const shot = await page.screenshot();
    const file = path.join(DIR, `${name}.${vk}.png`);
    if (MODE === 'snap') {
      writeFileSync(file, shot);
      console.log(`${name}.${vk}: baseline disimpan (${res.status()})`);
    } else {
      if (!existsSync(file)) { console.log(`${name}.${vk}: baseline TIDAK ADA — lewati`); continue; }
      total++;
      const pct = await pngDiffPct(br, readFileSync(file), shot);
      const ok = pct === 0;
      if (!ok) fail++;
      console.log(`${name}.${vk}: deviasi ${pct.toFixed(3)}% ${ok ? 'OK' : '** BERBEDA **'}`);
      if (!ok) writeFileSync(file.replace('.png', `.${vk}.diff.png`), shot);
    }
  }
}
await br.close();
if (MODE === 'diff') {
  console.log(total === 0 ? 'TIDAK ADA BASELINE — jalankan snap dulu' : (fail === 0 ? `DIFF VISUAL: ${total} halaman IDENTIK` : `DIFF VISUAL: ${fail}/${total} halaman berbeda`));
  process.exit(fail > 0 ? 1 : 0);
}
