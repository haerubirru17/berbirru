// Mockup Wave 7 — presemakan penuh via CSS token override (aplikasi tak disentuh).
// Medium.com & Surat Vintage × 4 halaman kunci (mobile 412×915).
const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');

const B = 'https://berbirru-uji.haerubirru17.workers.dev';
const OUT = 'golden/visual/mockup';
import { mkdirSync } from 'node:fs';
mkdirSync(OUT, { recursive: true });

const THEMES = {
  medium: `/* Medium.com — putih bersih, hijau, tipografi serif untuk isi, UI sans */
    :root{--ink:#242424 !important;--ink-soft:#424242 !important;--muted:#757575 !important;
      --line-soft:#E9E9E9 !important;--blue:#1A8917 !important;--deep:#0F730C !important;
      --blue-deep:#0F730C !important;--yellow:#FFC017 !important;--accent:#FFC017 !important;
      --paper:#FFFFFF !important;--soft:#F2F8F1 !important;--coral:#C94A4A !important;--mint:#D9F2D5 !important;
      --ink-soft:#424242 !important;}
    *{box-shadow:none !important;border-top-width:1px !important;border-left-width:1px !important;
      border-right-width:1px !important;border-bottom-width:1px !important;border-radius:4px !important;}
    body{font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif !important;background:#fff !important;}
    .thread-card p, .notif-quote-preview, .warkah-isi, .bait, article p, .notif-text, .card p, .st-sub{
      font-family:Charter,'Iowan Old Style',Georgia,serif !important;font-weight:400 !important;}
    .bnav{background:#fff !important;border-top:1px solid #E9E9E9 !important;box-shadow:0 -1px 4px rgba(0,0,0,.04) !important;}
    a,button{letter-spacing:0 !important;}
    .bnav-plus .p{border-width:1px !important;background:#fff !important;}
    .bnav-plus .p svg{stroke:#1A8917 !important;}`,
  vintage: `/* Surat Vintage — kertas krem, tinta cokelat, aksen merahhabil stempel, serif penuh */
    :root{--ink:#4A3728 !important;--ink-soft:#6B5240 !important;--muted:#8A7259 !important;
      --line-soft:#D9C7A7 !important;--blue:#B33A3A !important;--deep:#7C2B2B !important;
      --blue-deep:#7C2B2B !important;--yellow:#C9A227 !important;--accent:#C9A227 !important;
      --paper:#F7F1E3 !important;--soft:#EFE4CC !important;--coral:#B33A3A !important;--mint:#D9E4C0 !important;
      --ink-soft:#6B5240 !important;}
    *{border-top-width:1.5px !important;border-left-width:1.5px !important;border-right-width:1.5px !important;
      border-bottom-width:1.5px !important;border-radius:2px !important;
      box-shadow:2px 3px 0 rgba(74,55,40,.28) !important;
      font-family:Georgia,'Times New Roman',serif !important;}
    body{background:
      radial-gradient(ellipse at 15% 8%, rgba(201,162,39,.06), transparent 45%),
      radial-gradient(ellipse at 85% 90%, rgba(74,55,40,.05), transparent 40%),
      #F7F1E3 !important;}
    .bnav{background:#F3EADA !important;}
    .bnav-plus .p{background:#C9A227 !important;}
    .notif-quote-preview{font-style:italic !important;background:#EFE4CC !important;}`,
};

const PAGES = [['feed', '/feed'], ['pasar', '/pasar'], ['profile', '/u/snap1'], ['akun', '/akun']];

const br = await chromium.launch();
for (const [themeName, css] of Object.entries(THEMES)) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  await ctx.addCookies([{ name: 'berbirru_session', value: 'snap-session-token-01', domain: 'berbirru-uji.haerubirru17.workers.dev', path: '/' }]);
  const page = await ctx.newPage();
  await page.addStyleTag instanceof Function; // noop
  await ctx.addInitScript(() => {});
  for (const [name, path] of PAGES) {
    const p2 = await ctx.newPage();
    await p2.goto(B + path, { waitUntil: 'domcontentloaded' });
    await p2.addStyleTag({ content: css });
    await p2.waitForTimeout(600);
    await p2.screenshot({ path: `${OUT}/${themeName}.${name}.png` });
    await p2.close();
  }
  await ctx.close();
  console.log(themeName, 'selesai');
}
await br.close();
