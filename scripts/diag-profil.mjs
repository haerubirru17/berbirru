import { chromium } from '/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs';
import fs from 'fs';

const B = process.env.BASE || 'https://berbirru-uji.haerubirru17.workers.dev';
const br = await chromium.launch();
const ctx = await br.newContext({ storageState: '/tmp/golden-state-snap1.json' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 160)); });

await page.goto(B + '/u/snap1', { waitUntil: 'networkidle', timeout: 30000 });
console.log('URL:', page.url(), '| title:', await page.title());

const tab = page.locator('.profil-tab, [data-tab], .tab').first();
console.log('tab ditemukan:', await tab.count());

// coba klik tab kedua (Disukai) jika ada
const tabs = page.locator('[onclick*="tab"], .ptab');
console.log('elemen tab onclick:', await tabs.count());
if (await tabs.count() > 1) {
  await tabs.nth(1).click().catch((e) => console.log('klik gagal:', e.message.slice(0, 80)));
  await page.waitForTimeout(800);
  console.log('setelah klik URL:', page.url());
}

// klik tombol lain (menu settings)
const menu = page.locator('.nav-menu-glass');
if (await menu.count()) {
  await menu.first().click().catch((e) => console.log('klik menu gagal:', e.message.slice(0, 80)));
  await page.waitForTimeout(300);
  const pop = await page.locator('.settings-popover').first().isVisible().catch(() => false);
  console.log('popover settings terbuka:', pop);
}

console.log('--- console/pageerror terkumpul:', errs.length);
errs.slice(0, 8).forEach((e) => console.log(' ', e.slice(0, 160)));
await br.close();
