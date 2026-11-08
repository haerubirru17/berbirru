import { chromium } from '/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs';
const B = process.env.BASE || 'https://berbirru-uji.haerubirru17.workers.dev';
const br = await chromium.launch();
const ctx = await br.newContext({ storageState: '/tmp/golden-state-snap1.json', viewport: { width: 480, height: 860 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(B + '/u/snap1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.locator('.nav-menu-glass').first().click();
await page.waitForTimeout(300);
const m = await page.evaluate(() => {
  const pop = document.querySelector('.settings-popover');
  const card = document.querySelector('.profile-card');
  const banner = document.querySelector('.cover-banner');
  const skinItems = [...document.querySelectorAll('.settings-item')].map((el) => ({
    teks: el.textContent.trim().slice(0, 30),
    atas: Math.round(el.getBoundingClientRect().top),
    bawah: Math.round(el.getBoundingClientRect().bottom),
  }));
  const pr = pop?.getBoundingClientRect();
  const cr = card?.getBoundingClientRect();
  const skin = document.documentElement.getAttribute('data-skin') || document.body.className;
  return {
    skin,
    popover: pr && { top: Math.round(pr.top), bottom: Math.round(pr.bottom), height: Math.round(pr.height) },
    card: cr && { top: Math.round(cr.top), bottom: Math.round(cr.bottom), height: Math.round(cr.height) },
    bannerStyle: banner ? getComputedStyle(banner).position : null,
    cardOverflow: card ? getComputedStyle(card).overflow : null,
    skinItems,
  };
});
console.log(JSON.stringify(m, null, 1));
console.log('pageerror:', errs.length ? errs : 'tidak ada');
// screenshot utk lihat visual
await page.screenshot({ path: '/tmp/profil-popover.png' });
console.log('screenshot: /tmp/profil-popover.png');
await br.close();
