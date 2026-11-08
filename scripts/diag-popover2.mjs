import { chromium } from '/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs';
const B = process.env.BASE || 'https://berbirru-uji.haerubirru17.workers.dev';
const br = await chromium.launch();
const ctx = await br.newContext({ storageState: '/tmp/golden-state-snap1.json', viewport: { width: 480, height: 860 } });
await ctx.addCookies([{ name: 'bb_skin', value: 'neo', url: B }]);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(B + '/u/snap1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.locator('.nav-menu-glass').first().click();
await page.waitForTimeout(350);
const m = await page.evaluate(() => {
  const pop = document.querySelector('.settings-popover');
  const card = document.querySelector('.profile-card');
  const pr = pop.getBoundingClientRect(), cr = card.getBoundingClientRect();
  const popStyle = getComputedStyle(pop);
  const items = [...pop.querySelectorAll('.settings-item')].map((el) => {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    const tertutup = hit && !el.contains(hit) && hit !== el;
    return {
      teks: el.textContent.trim().slice(0, 26),
      rect: Math.round(r.top) + '..' + Math.round(r.bottom),
      tertutupOleh: tertutup ? (hit.tagName + '.' + hit.className).slice(0, 40) : null,
    };
  });
  return {
    skin: document.documentElement.getAttribute('data-skin') || document.body.getAttribute('data-skin') || getComputedStyle(document.body).background.slice(0, 40),
    popover: { top: Math.round(pr.top), bottom: Math.round(pr.bottom), h: Math.round(pr.height), display: popStyle.display, overflow: popStyle.overflow, zIndex: popStyle.zIndex },
    card: { bottom: Math.round(cr.bottom), overflow: getComputedStyle(card).overflow },
    items,
  };
});
console.log(JSON.stringify(m, null, 1));
console.log('pageerror:', errs.length ? errs : '-');
await page.screenshot({ path: process.env.SHOT || '/tmp/pop-neo.png' });
await br.close();
