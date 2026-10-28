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

await page.evaluate(() => {
  const bar = document.createElement("div");
  bar.id = "__ios_status";
  bar.innerHTML = `
    <span>09:41</span>
    <svg viewBox="0 0 42 10" aria-hidden="true">
      <rect x="0" y="6" width="2.4" height="4" rx=".6" fill="#111"/>
      <rect x="4.4" y="4.4" width="2.4" height="5.6" rx=".6" fill="#111"/>
      <rect x="8.8" y="2.8" width="2.4" height="7.2" rx=".6" fill="#111"/>
      <rect x="13.2" y="1.2" width="2.4" height="8.8" rx=".6" fill="#111"/>
      <path d="M19.5 4.9a7 7 0 0 1 8.4 0" stroke="#111" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <circle cx="23.7" cy="7.5" r="1.1" fill="#111"/>
      <rect x="32" y="2.6" width="9" height="5.6" rx="1.5" stroke="#111" stroke-width=".9" fill="none"/>
      <rect x="33.3" y="3.9" width="5.6" height="3" rx=".7" fill="#111"/>
      <rect x="41.4" y="4.4" width="1.2" height="2" rx=".5" fill="#111"/>
    </svg>`;
  Object.assign(bar.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    height: "44px",
    zIndex: "9999",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 26px",
    background: "#FAF7F2",
    font: "700 15px 'DM Sans', system-ui, sans-serif",
    color: "#111",
  });
  bar.querySelector("svg").style.cssText = "width:42px;height:11px";
  document.body.prepend(bar);
  document.body.style.paddingTop = "44px";
});

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
