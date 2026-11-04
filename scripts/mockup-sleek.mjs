// Dua varian dark yang dikerjakan proper: A "Malam Kabut" (abu netral), B "Malam + Amber".
// Override per-komponen (bukan blanket *), jaga permukaan & hierarki.
const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');
const B = 'https://berbirru-uji.haerubirru17.workers.dev';
const OUT = 'golden/visual/mockup';

const BASE = `
    body{background:#0D0F14 !important;color:#E8EAF0 !important;font-family:-apple-system,'Segoe UI',Roboto,sans-serif !important;}
    *{box-shadow:none !important;}
    /* permukaan kartu */
    .thread-card,.ak-card,.notif-card,.st-card,article,div[class*="card"]{
      background:#151821 !important;border:1px solid #23262F !important;border-radius:12px !important;}
    .bnav{background:#0B0D12 !important;border-top:1px solid #23262F !important;}
    .bnav-plus .p{background:#E8EAF0 !important;border:1px solid #E8EAF0 !important;}
    .bnav-plus .p svg{stroke:#0D0F14 !important;}
    .st-big,h1,h2{font-family:Georgia,'Times New Roman',serif !important;letter-spacing:-.01em !important;color:#F5F6F8 !important;}
    .thread-card p,.notif-quote-preview,.warkah-isi,.bait,.notif-text,[class*="isi"],.st-sub{font-size:19px !important;line-height:1.6 !important;}
    img{opacity:.9 !important;}
    /* aksi */
    .btn,.b-blue,button.b-blue{background:#E8EAF0 !important;color:#0D0F14 !important;border-radius:8px !important;border:1px solid #E8EAF0 !important;}
    a{color:#C9CEDB !important;}
`;
const V = {
  A: BASE, // tanpa aksen — abu netral murni
  B: BASE + `
    :root{--blue:#E0B14C !important;--deep:#C9A14B !important;--accent:#E0B14C !important;--yellow:#E0B14C !important;}
    .b-blue,.btn.b-blue{background:#E0B14C !important;border-color:#E0B14C !important;color:#12100B !important;}
    .bnav-lbl{border-color:#E0B14C !important;}
    .bnav[data-mode="pasar"] .bnav-lbl{background:#E0B14C !important;}
    .bnav-item.is-on{color:#E0B14C !important;}
  `,
};
const PAGES = [['feed', '/feed'], ['pasar', '/pasar']];
const br = await chromium.launch();
for (const [vn, css] of Object.entries(V)) {
  const ctx = await br.newContext({ viewport: { width: 412, height: 915 } });
  await ctx.addCookies([{ name: 'berbirru_session', value: 'snap-session-token-01', domain: 'berbirru-uji.haerubirru17.workers.dev', path: '/' }]);
  for (const [name, path] of PAGES) {
    const p = await ctx.newPage();
    await p.goto(B + path, { waitUntil: 'domcontentloaded' });
    await p.addStyleTag({ content: css });
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/sleek-${vn}.${name}.png` });
    await p.close();

  }
  await ctx.close();
  console.log(vn, 'ok');
}
await br.close();
