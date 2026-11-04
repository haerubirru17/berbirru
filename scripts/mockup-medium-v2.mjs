// Mockup preset Medium (nilai asli hasil observasi) — hanya regenerate tema medium.
const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');
import { mkdirSync } from 'node:fs';

const B = 'https://berbirru-uji.haerubirru17.workers.dev';
const OUT = 'golden/visual/mockup';

const MEDIUM = `
    :root{--ink:#FFFFFF !important;--ink-soft:#FFFFFF !important;--muted:#FFFFFF !important;
      --line-soft:#FFFFFF !important;--blue:#FFFFFF !important;--deep:#FFFFFF !important;
      --blue-deep:#FFFFFF !important;--yellow:#FFFFFF !important;--accent:#FFFFFF !important;
      --paper:#000000 !important;--soft:#000000 !important;--coral:#FFFFFF !important;--mint:#FFFFFF !important;
      --ink-soft:#FFFFFF !important;}
    *{box-shadow:none !important;border-top-width:1px !important;border-left-width:1px !important;
      border-right-width:1px !important;border-bottom-width:1px !important;border-radius:0 !important;
      color:#FFFFFF !important;border-color:#FFFFFF !important;background-color:transparent !important;}
    *:before,*:after{color:#FFFFFF !important;border-color:#FFFFFF !important;box-shadow:none !important;}
    body{font-family:sohne,'Helvetica Neue',Helvetica,Arial,sans-serif !important;background:#000000 !important;color:#FFF !important;}
    .thread-card p, .notif-quote-preview, .warkah-isi, .bait, article p, .notif-text, .card p,
    .st-sub, .thread-card .isi, [class*="isi"]{
      font-family:'Source Serif Pro',Charter,'Iowan Old Style',Georgia,serif !important;
      font-size:19px !important;line-height:1.58 !important;font-weight:400 !important;color:#FFF !important;}
    .st-big, h1, .hero-title{font-family:gt-super,Georgia,'Times New Roman',serif !important;font-weight:400 !important;}
    .bnav{background:#000000 !important;border-top:1px solid #FFF !important;}
    .bnav-plus .p{background:#000000 !important;}
    .bnav-plus .p svg{stroke:#FFF !important;}
    a{text-decoration:underline !important;}
    .btn{background:#FFF !important;color:#000000 !important;}
    img{filter:grayscale(1) contrast(1.05) !important;}
    svg{stroke:#FFF !important;fill:none !important;}
`;

const PAGES = [['feed', '/feed'], ['pasar', '/pasar'], ['profile', '/u/snap1'], ['akun', '/akun']];
mkdirSync(OUT, { recursive: true });
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
await ctx.addCookies([{ name: 'berbirru_session', value: 'snap-session-token-01', domain: 'berbirru-uji.haerubirru17.workers.dev', path: '/' }]);
for (const [name, path] of PAGES) {
  const p = await ctx.newPage();
  await p.goto(B + path, { waitUntil: 'domcontentloaded' });
  await p.addStyleTag({ content: MEDIUM });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/v5-bw.${name}.png` });
  await p.close();
  console.log('medium', name, 'ok');
}
await br.close();
