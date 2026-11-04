// Kern skin di atas HALAMAN PROFIL ASLI sandbox — zero layout change.
const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');
const br = await chromium.launch();
const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
await ctx.addCookies([{ name: 'berbirru_session', value: 'snap-session-token-01', domain: 'berbirru-uji.haerubirru17.workers.dev', path: '/' }]);
const page = await ctx.newPage();
await page.goto('https://berbirru-uji.haerubirru17.workers.dev/u/senja_kelabu', { waitUntil: 'domcontentloaded', timeout: 45000 });
await page.waitForTimeout(2500);
// BEFORE screenshot (skin lama)
await page.screenshot({ path: '/tmp/profil-before.png', fullPage: true });
// KERN SKIN: hanya token + font + radius. Tidak ada display:none, tidak ada layout override.
await page.addStyleTag({ content: `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,100..900,0..100,0..1&family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&family=Roboto+Flex:opsz,slnt,wdth,wght,GRAD@8..144,-10..0,25..151,100..1000,-200..150&display=swap');
  :root{
    --paper:#EFEBE3; --cream:#EFEBE3; --bg:#EFEBE3;
    --ink:#0E0E0E; --ink-soft:#3A3733;
    --blue:#FF3B1A; --accent:#FF3B1A; --signal:#FF3B1A;
    --border:1px solid #0E0E0E; --border-w:1px;
  }
  body{background:#EFEBE3 !important;color:#0E0E0E !important;
    font-family:'Roboto Flex',Arial,sans-serif !important;}
  *{border-radius:0 !important;box-shadow:none !important;}
  h1,h2,h3,.thread-title,.brand-header,.intro-title{font-family:'Fraunces',Georgia,serif !important;font-weight:550 !important;letter-spacing:-.02em !important;}
  .bnav-lbl,.badge,.thread-city,.notif-time,[class*="meta"],[class*="meta"] span{font-family:'Recursive',monospace !important;letter-spacing:.04em !important;}
  .thread-card,.card,banner-kapsul{background:#F6F3EB !important;border:1px solid #0E0E0E !important;}
  a,.act-btn,.chain-btn{color:#B52710 !important;}
  img{filter:grayscale(.92) !important;}
` });
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/profil-after-kern.png', fullPage: true });
console.log('before/after captured');
await br.close();