// Mockup preset "Kern" (krem koran) di atas Berbirru — token + font asli Kern.
const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');
const B = 'https://berbirru-uji.haerubirru17.workers.dev';
const OUT = 'golden/visual/mockup';

const KERN = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&family=Recursive:wght@300..1000&display=swap');
  :root{--ink:#0E0E0E !important;--ink-soft:#3A3733 !important;--muted:#6E6A63 !important;
    --line-soft:#D8D2C4 !important;--blue:#FF3B1A !important;--deep:#0E0E0E !important;
    --blue-deep:#0E0E0E !important;--yellow:#FF3B1A !important;--accent:#FF3B1A !important;
    --paper:#EFEBE3 !important;--soft:#E6E1D5 !important;--coral:#FF3B1A !important;--mint:#DFE3D6 !important;
    --ink-soft:#3A3733 !important;}
  *{box-shadow:none !important;border-radius:0 !important;}
  body{background:#EFEBE3 !important;color:#0E0E0E !important;
    font-family:'Roboto Flex','Arial Narrow',Arial,sans-serif !important;font-stretch:95% !important;}
  /* judul & display: Fraunces */
  .st-big,h1,h2,.hero-title,.thread-name-row a{font-family:'Fraunces',Georgia,serif !important;font-weight:600 !important;letter-spacing:-.01em !important;}
  /* label mono */
  .bnav-lbl,.badge,.notif-time,.st-sub,.thread-city,.date-sub{font-family:'Recursive',Consolas,monospace !important;font-size:10px !important;letter-spacing:.04em !important;text-transform:uppercase !important;}
  /* kartu: permukaan krem muda + garis tinta tegas */
  .thread-card,.ak-card,.notif-card,.st-card,article,div[class*="card"]{
    background:#F6F3EB !important;border:2px solid #0E0E0E !important;border-radius:0 !important;}
  /* tombol: tinta penuh / aksen */
  .btn,.b-blue,button.b-blue{background:#0E0E0E !important;color:#EFEBE3 !important;border:2px solid #0E0E0E !important;border-radius:0 !important;font-family:'Recursive',monospace !important;text-transform:uppercase !important;font-size:11px !important;letter-spacing:.06em !important;}
  .bnav{background:#EFEBE3 !important;border-top:2px solid #0E0E0E !important;}
  .bnav-plus .p{background:#FF3B1A !important;border:2px solid #0E0E0E !important;}
  .bnav-plus .p svg{stroke:#EFEBE3 !important;}
  .bnav-item.is-on .bnav-lbl{background:#0E0E0E !important;color:#EFEBE3 !important;border-color:#0E0E0E !important;}
  .notif-quote-preview{} /* biar warisan */
  .badge{background:#FFEFEA !important;border:1.5px solid #FF3B1A !important;color:#B52710 !important;}
  a{color:#B52710 !important;}
`;
const PAGES = [['feed', '/feed'], ['pasar', '/pasar'], ['profile', '/u/snap1'], ['akun', '/akun']];
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
await ctx.addCookies([{ name: 'berbirru_session', value: 'snap-session-token-01', domain: 'berbirru-uji.haerubirru17.workers.dev', path: '/' }]);
for (const [name, path] of PAGES) {
  const p = await ctx.newPage();
  await p.goto(B + path, { waitUntil: 'domcontentloaded' });
  await p.addStyleTag({ content: KERN, wait: true }).catch(() => {});
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/kern-preset.${name}.png` });
  await p.close();
  console.log('kern', name, 'ok');
}
await br.close();
