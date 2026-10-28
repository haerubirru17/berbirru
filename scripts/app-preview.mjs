// Regenerasi public/app-preview.png (layar iPhone di hero landing).
// Status bar iOS disuntikkan sebelum capture supaya hasilnya terlihat seperti
// screenshot layar iPhone asli (notch digambar oleh CSS di landing).
// Pakai: node scripts/app-preview.mjs [url]  (default: sandbox uji /feed)
import { chromium } from "/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs";

const url = process.argv[2] || "https://berbirru-uji.haerubirru17.workers.dev/feed";
const out = new URL("../public/app-preview.png", import.meta.url);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });

// nav bawah dibuat menempel di akhir dokumen (bukan fixed), supaya ikut terlihat saat scroll
await page.addStyleTag({ content: ".bottom-navbar,.bnav{display:none!important}" });
// mockup saja: label 'Terpaut'/'Simpan' dibuang, sisakan angka
await page.evaluate(() => {
  document.querySelectorAll(".act-btn span").forEach((el) => {
    el.textContent = (el.textContent.match(/\d+/) || ["0"])[0];
  });
});
await page.waitForTimeout(400);

// potong ke tinggi konten sebenarnya supaya tidak ada area kosong
await page.waitForSelector(".thread-card", { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(300);

const clipHeight = await page.evaluate(() => {
  const cards = document.querySelectorAll(".thread-card");
  const last = cards[cards.length - 1];
  const bottom = last ? last.getBoundingClientRect().bottom + window.scrollY : 844;
  return Math.max(600, Math.min(Math.ceil(bottom + 24), 2200));
});
await page.screenshot({ path: out.pathname, fullPage: true, clip: { x: 0, y: 0, width: 390, height: clipHeight } });
await browser.close();
console.log("tersimpan:", out.pathname);
