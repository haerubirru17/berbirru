// Kern preset v2 — font FULL-AXIS asli + hairline-grid outline design (bukan kartu).
const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');
const B = 'https://berbirru-uji.haerubirru17.workers.dev';
const OUT = 'golden/visual/mockup';

const KERN = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1;1,9..144,100..900,0..100,0..1&family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&family=Roboto+Flex:opsz,slnt,wdth,wght,GRAD@8..144,-10..0,25..151,100..1000,-200..150&display=swap');
  :root{--ink:#0E0E0E !important;--ink-soft:#3A3733 !important;--muted:#6E6A63 !important;
    --line-soft:#0E0E0E !important;--blue:#FF3B1A !important;--deep:#0E0E0E !important;
    --blue-deep:#0E0E0E !important;--yellow:#FF3B1A !important;--accent:#FF3B1A !important;
    --paper:#EFEBE3 !important;--soft:#EFEBE3 !important;--coral:#FF3B1A !important;--mint:#EFEBE3 !important;
    --ink-soft:#3A3733 !important;}
  *{box-shadow:none !important;border-radius:0 !important;}
  body{background:#EFEBE3 !important;color:#0E0E0E !important;
    font-family:'Roboto Flex','Arial Narrow',Arial,sans-serif !important;
    font-variation-settings:'wght' 420,'wdth' 96,'opsz' 20 !important;}
  /* DISPLAY: Fraunces (morrow) */
  .st-big,h1,h2,.hero-title,.thread-name-row a{font-family:'Fraunces',Georgia,serif !important;
    font-variation-settings:'opsz' 60,'wght' 560,'SOFT' 30 !important;letter-spacing:-.015em !important;}
  /* LABEL: Recursive mono uppercase — gaya situs asli */
  .bnav-lbl,.badge,.notif-time,.thread-city,.date-sub{font-family:'Recursive',Consolas,monospace !important;
    font-variation-settings:'MONO' 1,'wght' 480 !important;font-size:9.5px !important;
    letter-spacing:.08em !important;text-transform:uppercase !important;}
  /* OUTLINE DESIGN: hairline 1px, latar kartu = kertas (tanpa fill beda) */
  .thread-card,.ak-card,.notif-card,.st-card,article,div[class*="card"]{
    background:transparent !important;border:1px solid #0E0E0E !important;}
  .btn,.b-blue,button.b-blue{background:#0E0E0E !important;color:#EFEBE3 !important;
    border:1px solid #0E0E0E !important;font-family:'Recursive',monospace !important;
    text-transform:uppercase !important;font-size:10.5px !important;letter-spacing:.08em !important;
    font-variation-settings:'MONO' 1 !important;}
  .bnav{background:#EFEBE3 !important;border-top:1px solid #0E0E0E !important;}
  .bnav-plus .p{background:transparent !important;border:1px solid #0E0E0E !important;}
  .bnav-plus .p svg{stroke:#FF3B1A !important;}
  .bnav-item.is-on .bnav-lbl{background:#0E0E0E !important;color:#EFEBE3 !important;}
  /* sinyal: aksen #FF3B1A hanya di satu titik fokus — gaya situs */
  .badge{background:transparent !important;border:1px solid #FF3B1A !important;color:#FF3B1A !important;}
  a{color:#0E0E0E !important;text-decoration-color:#FF3B1A !important;text-underline-offset:3px !important;}
  /* fokus ala situs: outline 2px offset (aksesibilitas jadi identitas) */
  a:focus-visible,button:focus-visible{outline:2px solid #FF3B1A !important;outline-offset:3px !important;}
  .thread-card .isi,[class*="isi"]{font-variation-settings:'wght' 430 !important;}
`;
const PAGES = [['feed', '/feed'], ['pasar', '/pasar'], ['profile', '/u/snap1']];
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
await ctx.addCookies([{ name: 'berbirru_session', value: 'snap-session-token-01', domain: 'berbirru-uji.haerubirru17.workers.dev', path: '/' }]);
for (const [name, path] of PAGES) {
  const p = await ctx.newPage();
  await p.goto(B + path, { waitUntil: 'domcontentloaded' });
  await p.addStyleTag({ content: KERN, wait: true }).catch(() => {});
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/kern-v2.${name}.png` });
  await p.close();
  console.log('kern-v2', name, 'ok');
}
await br.close();
