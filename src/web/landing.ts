import { WARKAH_CARD_CSS, WARKAH_EMPTY, renderWarkahCard } from './warkahCard';
// Landing BERBIRRU — komposisi mengikuti template clone depobudget.com
// (hero kobalt bergrid, marquee lime, kartu tebal berwarna, galeri ungu,
// grid teal, FAQ merah, marquee kuning, CTA kobalt, footer hitam).
export function renderLandingPage(user: any = null, warkah: any[] = [], tz: string = 'Asia/Jakarta'): string {
  // jam status bar iPhone mengikuti zona waktu pengunjung (dari IP, via request.cf.timezone)
  let jam = '09:41';
  try { jam = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date()); } catch {}
  const masuk = user ? `/u/${user.pen_name}` : '/login';
  const labelMasuk = user ? `@${user.pen_name}` : 'Masuk';
  const ctaHref = user ? '/feed' : '/login';
  // Warkah kurasi: penulis asli (bukan akun uji).
  const KURASI = [
    { pen_name: 'sapardi_damono', city: 'Surakarta', title: 'Aku Ingin', timeLabel: '1989', dateLabel: 'Puisi klasik', likes_count: 142, saves_count: 38, chains_count: 12, is_liked: true, is_saved: true,
      content: 'Aku ingin mencintaimu dengan sederhana: dengan kata yang tak sempat diucapkan kayu kepada api yang menjadikannya abu. Aku ingin mencintaimu dengan sederhana: dengan isyarat yang tak sempat disampaikan awan kepada hujan yang menjadikannya tiada.' },
    { pen_name: 'chairil_anwar', city: 'Medan', title: 'Aku', timeLabel: '1943', dateLabel: 'Angkatan 45', likes_count: 218, saves_count: 76, chains_count: 21, is_liked: true, is_saved: true,
      content: 'Aku ini binatang jalang, dari kumpulannya terbuang. Biar peluru menembus kulitku, aku tetap meradang menerjang. Luka dan bisa kubawa berlari, berlari hingga hilang pedih peri. Dan aku akan lebih tidak perduli. Aku mau hidup seribu tahun lagi.' },
    { pen_name: 'pramoedya_toer', city: 'Blora', title: 'Suara yang Tak Padam', timeLabel: '1980', dateLabel: 'Tetralogi Buru', likes_count: 96, saves_count: 24, chains_count: 7, is_liked: true, is_saved: true,
      content: 'Tahu kau mengapa aku sayangi kau lebih dari siapa pun? Karena kau menulis. Suaramu takkan padam ditelan angin, akan abadi sampai jauh di kemudian hari.' },
    { pen_name: 'jalaluddin_rumi', city: 'Balkh', title: 'Luka & Cahaya', timeLabel: 'abad 13', dateLabel: 'Perenungan sufi', likes_count: 311, saves_count: 105, chains_count: 34, is_liked: true, is_saved: true,
      content: 'Jangan berduka. Apa pun yang hilang darimu akan kembali dalam bentuk yang lain. Luka adalah tempat di mana cahaya memasuki jiwamu.' },
  ];
  const kartu = KURASI.map((w) => renderWarkahCard(w, { timeLabel: w.timeLabel, dateLabel: w.dateLabel })).join('\n');

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#FAF7F2">
<title>BERBIRRU.COM — Pustaka tulisan &amp; kolaborasi kata</title>
<meta name="description" content="Ruang tenang untuk menulis dan membaca: puisi, kutipan, cerita lintas kota. Tanpa algoritma bising, bebas iklan.">
<link rel="icon" type="image/svg+xml" href="/favicon.ico">
<meta property="og:type" content="website">
<meta property="og:url" content="https://berbirru.com/">
<meta property="og:title" content="BERBIRRU.COM — Merawat rasa, menguntai kata">
<meta property="og:description" content="Pustaka tulisan &amp; kolaborasi kata. Tulis karyamu, arsipkan kutipan, sambung estafet lintas kota.">
<meta property="og:image" content="https://berbirru.com/og-image.png?v=15">
<meta property="og:image:secure_url" content="https://berbirru.com/og-image.png?v=15">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BERBIRRU.COM — Merawat rasa, menguntai kata">
<meta name="twitter:description" content="Pustaka tulisan &amp; kolaborasi kata. Tulis karyamu, arsipkan kutipan, sambung estafet lintas kota.">
<meta name="twitter:image" content="https://berbirru.com/og-image.png?v=15">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;700;800&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
<style>
${WARKAH_CARD_CSS}
  :root{
    --cream:#F6EEDF; --ink:#111111; --cobalt:#1769E8; --coral:#FF5B45; --page:#FAF7F2;
    --purple:#7C3AED; --blue:#4A9FD4; --lime:#C8E832; --yellow:#F5B83C; --teal:#3CBDB1; --red:#D95C5C;
    --shadow:4px 4px 0 #000; --shadow-hover:5px 5px 0 #000;
    --display:'Archivo Black',sans-serif; --body:'DM Sans',system-ui,sans-serif; --mono:'Roboto Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth;overflow-x:clip}
  body{background:var(--page);color:var(--ink);font:16px/1.5 var(--body);-webkit-font-smoothing:antialiased;overflow-x:hidden;overflow-wrap:break-word}
  a{color:inherit;text-decoration:none}
  img{display:block;max-width:100%}
  h1,h2,h3{text-wrap:balance}
  p,li,blockquote{text-wrap:pretty}
  ::selection{background:var(--lime);color:var(--ink)}
  :focus-visible{outline:3px solid var(--blue);outline-offset:2px}
  .skip{position:fixed;left:16px;top:16px;z-index:100;transform:translateY(-150%);background:#fff;border:3px solid var(--ink);border-radius:8px;padding:8px 16px;font-weight:700;transition:transform .15s}
  .skip:focus{transform:translateY(0)}
  .wrap{max-width:1280px;margin:0 auto;padding:0 16px}
  @media(min-width:640px){.wrap{padding:0 24px}}
  .mono{font-family:var(--mono)}
  .display{font-family:var(--display);font-weight:400;letter-spacing:-.02em}
  .shadow{box-shadow:var(--shadow)}
  .lift{transition:transform .12s,box-shadow .12s}
  .lift:hover{transform:translate(-1px,-1px);box-shadow:var(--shadow-hover)}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:3px solid var(--ink);border-radius:8px;font:700 16px var(--body);letter-spacing:.02em;padding:16px 32px;box-shadow:var(--shadow);cursor:pointer;transition:transform .12s,box-shadow .12s}
  .btn:hover{box-shadow:var(--shadow-hover);transform:translate(-1px,-1px)}
  .btn:active{box-shadow:none;transform:translate(4px,4px)}
  .btn.coral{background:var(--coral);color:var(--ink)}
  .btn.lime{background:var(--lime);color:var(--ink)}
  .btn.ghost{background:transparent;color:#fff;border-color:#fff;box-shadow:4px 4px 0 rgba(0,0,0,.35)}

  /* ---------- header ---------- */
  header{position:sticky;top:0;z-index:50;border-bottom:3px solid var(--ink);background:var(--page);color:var(--ink)}
  .nav{display:flex;align-items:center;justify-content:space-between;padding:9px 0}
  /* Logo resmi BERBIRRU — disalin utuh dari src/web/login.ts (.brand-header) */
  .brandplaque{display:inline-flex;align-items:center;transform:scale(.86);transform-origin:left center;margin-right:-30px}
  .brand-wrap{display:inline-flex;align-items:center;text-decoration:none;position:relative}
  .brand-badge{display:inline-flex;align-items:center;gap:6px;background:#1769E8;color:#fff;padding:6px 14px;border:3px solid var(--ink);border-radius:8px;box-shadow:4px 4px 0 var(--ink);transform:rotate(-1deg);position:relative;z-index:2}
  .brand-badge h1{margin:0;font-family:var(--display);font-size:19px;font-weight:800;letter-spacing:.5px;color:#fff;line-height:1}
  .brand-badge svg{width:16px;height:16px;stroke:#fff;stroke-width:2;fill:none;flex-shrink:0}
  .brand-com-tag{font-family:var(--display);font-size:26px;font-weight:900;color:#1769E8;position:relative;display:inline-block;transform:rotate(2deg);margin-left:4px;margin-top:2px;z-index:1;line-height:1;padding-bottom:3px}
  .brand-com-tag::after{content:'';position:absolute;left:-24px;bottom:-3px;width:calc(100% + 28px);height:6px;background:var(--yellow);border-radius:3px;z-index:-1}
  .navlinks{display:none;align-items:center;gap:18px;font:700 13.5px var(--body)}
  @media(min-width:900px){.navlinks{display:flex}}
  .navlinks a:not(.navcta):hover{text-decoration:underline;text-underline-offset:5px;text-decoration-thickness:2px}
  .navcta{border:3px solid var(--ink);border-radius:8px;padding:8px 14px;font-weight:700;font-size:13px;box-shadow:3px 3px 0 rgba(0,0,0,.6);background:var(--lime);color:var(--ink)}
  .navright{display:flex;align-items:center;gap:8px}
  .mobtn{display:inline-flex;border:3px solid var(--ink);border-radius:8px;padding:8px;background:var(--cream);color:var(--cobalt);cursor:pointer;box-shadow:3px 3px 0 rgba(0,0,0,.5)}
  @media(min-width:900px){.mobtn{display:none}}
  .mobtn svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round}
  .mobnav{display:none;border-top:3px solid var(--ink);padding:8px 0 16px}
  .mobnav.open{display:block}
  .mobnav a{display:flex;align-items:center;min-height:44px;padding:8px 0;border-bottom:2px solid rgba(255,255,255,.12);font:700 15px var(--body)}
  .mobnav .navcta{justify-content:center;margin-top:12px;border-bottom:0}

  /* ---------- hero ---------- */
  .hero{background:var(--cobalt);border-bottom:4px solid var(--ink);background-image:linear-gradient(90deg,#ffffff1a 1px,transparent 1px),linear-gradient(#ffffff1a 1px,transparent 1px);background-size:100px 100px;background-position:50%;color:#fff;overflow:hidden;padding:clamp(1.5rem,4.5vw,2.75rem) 0 0}
  .hero-grid{display:grid;grid-template-columns:1fr;gap:24px;align-items:center}
  @media(min-width:1024px){.hero-grid{grid-template-columns:1fr 1fr;gap:100px}}
  .hero-copy{display:flex;flex-direction:column;align-items:center;text-align:center;gap:clamp(.6rem,2vw,1.5rem)}
  @media(min-width:1024px){.hero-copy{align-items:flex-start;text-align:left}}
  .pill{border:3px solid var(--ink);border-radius:6px;background:var(--cream);color:var(--ink);padding:8px 16px;font:700 14px var(--mono);text-transform:uppercase;letter-spacing:.05em}
  .hero h1{font-family:var(--display);font-weight:400;font-size:9.6vw;line-height:1.06;letter-spacing:-.03em}
  @media(min-width:700px){.hero h1{font-size:5.3vw}}
  @media(min-width:1024px){.hero h1{font-size:clamp(52px,5.1vw,76px);width:max-content;max-width:calc(100% + 24px)}}
  .hero h1 .l2{white-space:nowrap}
  .hero h1 em{font-style:normal;color:var(--lime)}
  /* typing: "rasa" selesai dulu, baru "kata" */
  .tw{display:inline-grid;vertical-align:baseline}
  .tw>*{grid-area:1/1}
  .tw .ghost{visibility:hidden}
  .tw .ty{position:relative;justify-self:start;width:0;overflow:hidden;white-space:nowrap}
  .ty::after{content:'';position:absolute;right:0;bottom:.08em;width:3px;height:.82em;background:currentColor;opacity:0}
  h1.typing .ty::after{animation:caret .55s step-end infinite,caretOff .01s 1.25s forwards}
  h1.typing .ty1{animation:typeIn .45s steps(5,end) .18s forwards}
  h1.typing .ty2{animation:typeIn .36s steps(4,end) .86s forwards}
  @keyframes typeIn{from{width:0}to{width:100%}}
  @keyframes caret{0%,50%{opacity:1}50.01%,100%{opacity:0}}
  @keyframes caretOff{to{opacity:0}}
  @media(prefers-reduced-motion:reduce){.tw .ty{width:auto!important;animation:none!important}.ty::after{display:none}}
  .hero p{max-width:28rem;font-size:clamp(17px,2vw,20px);line-height:1.6;color:#fff}
  .hero-ctas{display:flex;flex-wrap:nowrap;gap:10px;justify-content:center;width:100%;max-width:26rem}
  .hero-ctas .btn{flex:1 1 0;min-width:0;padding:14px 10px;font-size:15px;white-space:nowrap}
  @media(min-width:1024px){.hero-ctas{justify-content:flex-start}}
  .stage{position:relative;display:flex;justify-content:center;align-items:center;padding:34px 0 44px;order:2}
  .hero-copy{order:1}
  .burst,.sparkle{position:absolute;pointer-events:none;z-index:3}
  .burst{width:clamp(52px,7vw,84px);height:clamp(52px,7vw,84px);top:6px;right:6px;animation:spin 20s linear infinite}
  .sparkle{width:clamp(44px,6vw,66px);height:clamp(44px,6vw,66px);bottom:16px;left:2px;animation:pulse 4s ease-in-out infinite}
  .burst svg,.sparkle svg{width:100%;height:100%}
  .sparkle svg{filter:drop-shadow(3px 3px #111)}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{transform:scale(.92)}50%{transform:scale(1.04)}}
  /* iPhone mockup — mengikuti frame template Depo: border 5px, radius 2rem,
     tilt perspektif 3D, hard shadow 4px, tanpa notch/bezel palsu. */
  .phone{position:relative;z-index:2;width:clamp(260px,26vw,340px);aspect-ratio:9/19.2;background:var(--ink);border:5px solid var(--ink);border-radius:2rem;box-shadow:4px 4px 0 #000;overflow:hidden;transform:perspective(1000px) rotateY(-12deg) rotateX(6deg);transition:transform .3s}
  .phone:hover{transform:perspective(1000px) rotateY(0) rotateX(0) scale(1.02)}
  .screen{height:100%;border-radius:1.6rem;overflow-y:auto;overflow-x:hidden;background:var(--page);-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:none}
  .screen::-webkit-scrollbar{display:none}
  .screen img{width:100%;height:auto;display:block}
  .appbar{position:sticky;top:0;display:flex;align-items:center;justify-content:space-between;height:34px;padding:0 14px;background:#FAF7F2;font:700 12px var(--sans);color:#111;z-index:4}
  .appbar svg{width:38px;height:10px;display:block}
  .appnav{position:sticky;bottom:0;display:grid;grid-template-columns:repeat(5,1fr);background:#fff;border-top:2px solid #0B192C;padding:6px 4px 8px;z-index:3}
  .appnav span{display:flex;flex-direction:column;align-items:center;gap:2px;font:800 8px var(--mono);color:#6A788D;line-height:1}
  .appnav svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
  .appnav .on{color:#1D61E7}
  .appnav .fab{width:30px;height:30px;border:2.5px solid #0B192C;background:var(--yellow);color:#0B192C;box-shadow:3px 3px 0 #0B192C;transform:rotate(-2deg);display:grid;place-items:center;margin-top:-16px}
  .hero-phone-frame .screen img{width:100%!important;height:auto!important;object-fit:fill!important}
  /* iPhone 18: Dynamic Island (pil hitam mengambang), bukan notch poni */
  .island{position:absolute;top:7px;left:50%;transform:translateX(-50%);width:30%;height:20px;background:#0B0B0C;border-radius:999px;z-index:6;box-shadow:inset 0 -1px 0 rgba(255,255,255,.06),0 1px 2px rgba(0,0,0,.25)}
  .island:after{content:'';position:absolute;right:13%;top:50%;transform:translateY(-50%);width:7px;height:7px;border-radius:50%;background:#151517;box-shadow:inset 0 0 2px 1px #2E2E32}
  .marquee{border-top:4px solid var(--ink);background:var(--lime);height:clamp(72px,9vw,104px);display:flex;align-items:center;overflow:hidden}
  .marquee-track{display:flex;white-space:nowrap;width:max-content;animation:slide 45s linear infinite}
  .marquee:hover .marquee-track{animation-play-state:paused}
  .marquee b{font-family:var(--display);font-weight:400;font-size:clamp(17px,2vw,23px);text-transform:uppercase;letter-spacing:.04em;padding:0 14px}
  .marquee b:after{content:'•';margin-left:28px}
  @keyframes slide{to{transform:translateX(-50%)}}

  /* ---------- section umum ---------- */
  section{border-bottom:3px solid var(--ink);scroll-margin-top:76px}
  .pad{padding:64px 0}
  @media(min-width:640px){.pad{padding:96px 0}}
  h2.display{font-size:clamp(28px,4.4vw,60px);line-height:1.05;letter-spacing:-.03em}
  .lead{font-size:clamp(16px,2vw,20px);line-height:1.6;color:#333;max-width:52rem;margin-top:12px}

  /* 4 kartu */
  .steps{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 0 10px;margin:0;scrollbar-width:none}
  .steps::-webkit-scrollbar{display:none}
  @media(min-width:640px){.steps{display:grid;grid-template-columns:repeat(2,1fr);gap:24px;overflow:visible;margin:0;padding:0}}
  @media(min-width:1024px){.steps{grid-template-columns:repeat(4,1fr)}}
  .step{flex:0 0 80vw;max-width:300px;scroll-snap-align:start;display:flex;flex-direction:column;border:3px solid var(--ink);border-radius:12px;overflow:hidden;padding:32px 24px;color:var(--ink)}
  @media(min-width:640px){.step{flex:none;max-width:none}}
  .step .no{font:700 30px var(--mono)}
  .step h3{font-family:var(--display);font-weight:400;font-size:24px;line-height:1.15;margin-top:16px}
  .step p{font-size:15px;line-height:1.55;margin-top:8px}
  .step .foot{margin-top:auto;padding-top:24px}
  .step .foot div{border-top:3px solid var(--ink);padding-top:12px}
  .step .val{font:700 22px var(--mono)}
  .step .note{font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;opacity:.75}

  /* cream + kartu besar */
  .cream{background:var(--cream)}
  .two{display:grid;grid-template-columns:1fr;gap:32px;align-items:center}
  @media(min-width:1024px){.two{grid-template-columns:1fr 1fr;gap:80px}}

  /* estafet */

  /* chips */

  /* Lembar Sambungan — disalin dari src/web/chain.ts */
  .lembar-wrap{background:#FFF9E9;border:3px solid var(--ink);border-radius:14px;padding:14px;box-shadow:6px 6px 0 #000}
  .lembar{max-width:34rem;margin:0 auto;color:#0B192C}
  .lembar .tcard{background:#fff;border:2.5px solid #22314A;border-radius:13px;box-shadow:3px 3px 0 #C9D6E8;padding:12px 13px;margin-bottom:12px;position:relative}
  .lembar .tcard.root{background:#F4F8FE}
  .lembar .root-tag{font:900 10px var(--mono);letter-spacing:1px;color:#5A6B85;text-transform:uppercase;margin-bottom:6px}
  .lembar .tmini{display:flex;align-items:center;gap:7px;margin-bottom:6px;flex-wrap:wrap}
  .lembar .tava{width:28px;height:28px;flex:none;border-radius:50%;color:#fff;border:2px solid #0B192C;display:grid;place-items:center;font-family:var(--display);font-size:13px}
  .lembar .tname{font-size:13px;font-weight:900;color:#0B192C;text-decoration:none}
  .lembar .ttime{font-size:10px;color:#8895AC;font-weight:600}
  .lembar .ttitle{font-family:'Newsreader',serif;font-size:16.5px;font-weight:600;color:#0B192C;margin-bottom:4px}
  .lembar .tbody{font-size:13.5px;line-height:1.65;color:#22314A}
  .lembar .tbody p{margin:0}
  .lembar .tfoot-mini{margin-top:8px;font-size:11px;font-weight:800;color:#64748B}
  .lembar .lbl{font:900 11px var(--mono);letter-spacing:1px;color:#5A6B85;text-transform:uppercase;margin:14px 2px 10px}
  .lembar .rail{position:relative;padding-left:17px;margin-top:6px}
  .lembar .rail:before{content:'';position:absolute;left:5px;top:6px;bottom:18px;width:2.5px;background:#B7D3F8;border-radius:2px}
  .lembar .rail .knob{position:absolute;left:-17px;top:15px;width:9px;height:9px;background:#1D5FD6;border:2px solid #0B192C;border-radius:50%}
  @media(min-width:900px){.lembar-wrap{padding:18px}}

  /* galeri ungu */
  .purple{background:var(--purple);color:#fff}
  .purple h2,.purple .lead{color:#fff}
  .galeri-warkah{display:grid;grid-template-columns:minmax(0,1fr);grid-auto-rows:1fr;gap:20px;margin-top:8px}
  @media(min-width:900px){.galeri-warkah{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px;grid-auto-rows:1fr}}
  /* teal grid */
  .teal{background:var(--teal)}
  .tag{display:inline-block;border:3px solid var(--ink);border-radius:6px;background:var(--yellow);padding:8px 16px;font:700 14px var(--mono);text-transform:uppercase;letter-spacing:.05em;margin-bottom:16px}
  .more{display:grid;grid-template-columns:1fr;gap:16px;margin-top:32px}
  @media(min-width:640px){.more{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1024px){.more{grid-template-columns:repeat(3,1fr)}}
  .mcard{display:flex;align-items:flex-start;gap:16px;border:3px solid var(--ink);border-radius:12px;background:#fff;padding:20px;box-shadow:var(--shadow)}
  .mcard svg{width:28px;height:28px;flex:0 0 auto;stroke:var(--ink);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}
  .mcard h3{font-family:var(--display);font-weight:400;font-size:18px;line-height:1.25}
  .mcard p{font-size:14px;line-height:1.55;margin-top:4px}

  /* FAQ merah */
  .red{background:var(--red)}
  .faq{max-width:56rem;margin:0 auto}
  .faq summary{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px;cursor:pointer;list-style:none}
  .faq summary::-webkit-details-marker{display:none}
  .faq summary h3{font-family:var(--display);font-weight:400;font-size:clamp(16px,2vw,20px);line-height:1.3}
  .faq summary svg{width:24px;height:24px;flex:0 0 auto;stroke:var(--ink);fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s}
  .faq details[open] summary svg{transform:rotate(180deg)}
  .faq details{border:3px solid var(--ink);border-radius:12px;background:#fff;box-shadow:var(--shadow);margin-bottom:16px;overflow:hidden}
  .faq details p{padding:0 20px 20px;font-size:15px;line-height:1.65;color:#333}
  .faq .center{text-align:center;margin-bottom:32px}

  /* testimoni kuning */
  .yellow{background:var(--yellow)}
  .tm{overflow:hidden;padding-bottom:8px}
  .tm-track{display:flex;gap:16px;width:max-content;animation:slide 40s linear infinite}
  .tm:hover .tm-track{animation-play-state:paused}
  .quote{flex:0 0 auto;border:3px solid var(--ink);border-radius:12px;background:#fff;padding:20px;box-shadow:var(--shadow);font-size:15px;line-height:1.6}
  .quote b{display:block;font-family:var(--display);font-weight:400;font-size:16px;margin-top:10px}
  .quote span{display:block;font:600 10px var(--mono);text-transform:uppercase;letter-spacing:.05em;color:#666;margin-top:2px}

  /* CTA */
  .cta{background:var(--cobalt);color:var(--cream);background-image:linear-gradient(90deg,#ffffff1a 1px,transparent 1px),linear-gradient(#ffffff1a 1px,transparent 1px);background-size:100px 100px;background-position:50%;text-align:center;padding:80px 0;overflow:hidden;position:relative}
  @media(min-width:640px){.cta{padding:112px 0}}
  .cta .inner{position:relative;max-width:56rem;margin:0 auto;padding:0 16px}
  .cta h2{font-family:var(--display);font-weight:400;font-size:clamp(36px,7vw,76px);line-height:1.05;letter-spacing:-.03em}
  .cta p{font-size:clamp(17px,2vw,22px);line-height:1.6;margin-top:20px}
  .cta .small{font-size:15px;font-weight:600;margin-top:20px}
  .cta .acts{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:36px}
  .cta .deco{position:absolute;pointer-events:none;z-index:0}
  .cta .deco.a{width:clamp(48px,8vw,84px);height:clamp(48px,8vw,84px);top:-8px;right:-4px;animation:spin 20s linear infinite}
  .cta .deco.b{width:clamp(44px,7vw,72px);height:clamp(44px,7vw,72px);bottom:-6px;left:-6px;animation:pulse 4s ease-in-out infinite}
  .cta .deco svg{width:100%;height:100%;filter:drop-shadow(3px 3px #111)}

  /* footer */
  footer{background:var(--ink);color:var(--cream);padding:32px 0 24px;border-top:4px solid var(--ink)}
  @media(min-width:768px){footer{padding:48px 0 28px}}
  .fcols{display:grid;grid-template-columns:1fr;gap:24px}
  @media(min-width:640px){.fcols{grid-template-columns:2fr 1fr 1fr 1fr 1fr;gap:32px}}
  .fcol p.t{font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.1em;color:rgba(246,238,223,.4);margin-bottom:6px}
  .fcol a{display:flex;align-items:center;min-height:38px;font:700 13px var(--body);color:var(--cream)}
  .fcol a:hover{color:var(--lime);text-decoration:underline}
  .fabout p{font-size:13.5px;line-height:1.6;color:rgba(246,238,223,.75);margin-top:10px;max-width:30rem}
  .fbottom{margin-top:24px;border-top:3px solid rgba(246,238,223,.2);padding-top:16px;font:600 12px var(--mono);color:rgba(246,238,223,.5)}

  @media(prefers-reduced-motion:reduce){
    .marquee-track,.tm-track,.burst,.sparkle,.cta .deco{animation:none}
  }
</style>
</head>
<body>
<a class="skip" href="#utama">Lompat ke konten utama</a>

<header id="hdr">
  <div class="wrap">
    <div class="nav">
      <a class="brandplaque brand-wrap" href="/" aria-label="Berbirru beranda">
        <span class="brand-badge"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg><h1>BERBIRRU</h1></span>
        <span class="brand-com-tag">.com</span>
      </a>
      <nav class="navlinks" aria-label="Navigasi utama">
        <a href="#tulis">Cara kerja</a>
        <a href="#estafet">Estafet</a>
        <a href="#tanya">Tanya jawab</a>
        <a href="${masuk}">${labelMasuk}</a>
        <a class="navcta" href="/feed">Jelajahi warkah</a>
      </nav>
      <div class="navright">
        <button class="mobtn" id="mobtn" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="mobnav">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <nav class="mobnav" id="mobnav" aria-label="Navigasi seluler">
      <a href="#tulis">Cara kerja</a>
      <a href="#estafet">Estafet</a>
      <a href="#tanya">Tanya jawab</a>
      <a href="${masuk}">${labelMasuk}</a>
      <a href="/feed" class="navcta">Jelajahi warkah</a>
    </nav>
  </div>
</header>

<main id="utama">
  <div data-header-bg="#1769E8">
    <section class="hero">
      <div class="wrap">
        <div class="hero-grid">
          <div class="stage">
            <div class="burst" aria-hidden="true">
              <svg viewBox="0 0 100 100"><polygon points="50,2 68,19 92,26 86,50 92,74 68,81 50,98 32,81 8,74 14,50 8,26 32,19" fill="#4B9FD3" stroke="#111" stroke-width="5" stroke-linejoin="miter"/></svg>
            </div>
            <div class="sparkle" aria-hidden="true">
              <svg viewBox="0 0 100 100"><path d="M 50,10 L 56,40 L 90,50 L 56,60 L 50,90 L 44,60 L 10,50 L 44,40 Z" fill="#C8E832" stroke="#111" stroke-width="5" stroke-linejoin="miter"/></svg>
            </div>
            <div class="phone" aria-label="Tampilan aplikasi Berbirru">
              <div class="island" aria-hidden="true"></div>
              <div class="screen"><div class="appbar" aria-hidden="true"><time data-tz="${tz}">${jam}</time>
                  <svg viewBox="0 0 42 10"><rect x="0" y="6" width="2.4" height="4" rx=".6" fill="#111"/><rect x="4.4" y="4.4" width="2.4" height="5.6" rx=".6" fill="#111"/><rect x="8.8" y="2.8" width="2.4" height="7.2" rx=".6" fill="#111"/><rect x="13.2" y="1.2" width="2.4" height="8.8" rx=".6" fill="#111"/><path d="M19.5 4.9a7 7 0 0 1 8.4 0" stroke="#111" stroke-width="1.2" fill="none" stroke-linecap="round"/><circle cx="23.7" cy="7.5" r="1.1" fill="#111"/><rect x="32" y="2.6" width="9" height="5.6" rx="1.5" stroke="#111" stroke-width=".9" fill="none"/><rect x="33.3" y="3.9" width="5.6" height="3" rx=".7" fill="#111"/><rect x="41.4" y="4.4" width="1.2" height="2" rx=".5" fill="#111"/></svg></div>
                <img src="/app-preview.png" alt="Linimasa warkah di aplikasi Berbirru" width="390" height="844" loading="lazy">
                <div class="appnav" aria-hidden="true">
                <span class="on"><svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>Beranda</span>
                <span><svg viewBox="0 0 24 24"><path d="M6 7h12l1 13H5L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>Pasar</span>
                <span class="fab"><svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke-width:2.4"><path d="M12 5v14M5 12h14"/></svg></span>
                <span><svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>Notifikasi</span>
                <span><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>Profil</span>
              </div>
              </div>
            </div>
          </div>
          <div class="hero-copy">
            <div class="pill">Pustaka tulisan &amp; kolaborasi kata</div>
            <h1 class="typing" aria-label="Merawat rasa, menguntai kata."><span aria-hidden="true">Merawat <span class="tw"><span class="ghost">rasa</span><em class="ty ty1">rasa</em></span>,<br><span class="l2">menguntai <span class="tw"><span class="ghost">kata</span><em class="ty ty2">kata</em></span>.</span></span></h1>
            <p>Pernah menulis ide bagus di sembarang tempat, lalu lupa di mana menyimpannya? Berbirru rumahnya — tempat mengabadikan setiap patah kata agar tersimpan rapi, mudah ditemukan, dan bisa dilanjutkan bersama.</p>
            <div class="hero-ctas">
              <a class="btn coral" href="${ctaHref}">Mulai menulis →</a>
              <a class="btn ghost" href="/feed">Jelajahi warkah</a>
            </div>
          </div>
        </div>
      </div>
      <div class="marquee" aria-label="Untuk siapa Berbirru">
        <div class="marquee-track">
          <b>Untuk yang menulis</b><b>Untuk yang membaca</b><b>Untuk yang menyimpan kutipan</b><b>Estafet lintas kota</b><b>Bebas iklan</b><b>Tanpa algoritma bising</b><b>Ramah pemula</b><b>Ruang aman terkurasi</b>
          <b aria-hidden="true">Untuk yang menulis</b><b aria-hidden="true">Untuk yang membaca</b><b aria-hidden="true">Untuk yang menyimpan kutipan</b><b aria-hidden="true">Estafet lintas kota</b><b aria-hidden="true">Bebas iklan</b><b aria-hidden="true">Tanpa algoritma bising</b><b aria-hidden="true">Ramah pemula</b><b aria-hidden="true">Ruang aman terkurasi</b>
        </div>
      </div>
    </section>
  </div>

  <div data-header-bg="#FAF7F2">
    <section class="pad" id="tulis">
      <div class="wrap">
        <h2 class="display">Mulai dari satu bait</h2>
        <p class="lead">Cara pakainya cuma empat langkah. Tidak ada setelan yang harus diisi dulu.</p>
        <div class="steps" style="margin-top:32px">
          <div class="step lift" style="background:var(--yellow)">
            <span class="no">01</span>
            <h3>Tulis</h3>
            <p>Tuangkan puisi, kutipan, cerita pendek, atau catatan harian dengan tipografi serif, sans, dan mono.</p>
            <div class="foot"><div><p class="val">3 pilihan</p><p class="note">tipografi</p></div></div>
          </div>
          <div class="step lift" style="background:var(--red)">
            <span class="no">02</span>
            <h3>Sambung</h3>
            <p>Lanjutkan bait penulis lain dari kota berbeda. Satu klik, dan kamu masuk ke rantai untaian.</p>
            <div class="foot"><div><p class="val">1 klik</p><p class="note">estafet kota</p></div></div>
          </div>
          <div class="step lift" style="background:var(--teal)">
            <span class="no">03</span>
            <h3>Simpan</h3>
            <p>Setiap warkah, riwayat suka, dan kutipan favorit tersusun rapi di paspor antologi pribadimu.</p>
            <div class="foot"><div><p class="val">∞</p><p class="note">pustaka pribadi</p></div></div>
          </div>
          <div class="step lift" style="background:var(--lime);box-shadow:5px 5px 0 #000">
            <span class="no">04</span>
            <h3>Terbit</h3>
            <p>Bagikan ke linimasa publik atau simpan sebagai privat. Kamu yang memutuskan siapa yang membaca.</p>
            <div class="foot"><div><p class="val">Rp0</p><p class="note">gratis selamanya</p></div></div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <div data-header-bg="#FAF7F2">
    <section class="pad" id="estafet">
      <div class="wrap">
        <div class="two">
          <div class="lembar-wrap">
            <div class="lembar" aria-label="Contoh lembar sambungan">
              <div class="tcard root">
                <div class="root-tag"><span>Bait Asli</span></div>
                <div class="tmini">
                  <div class="tava" style="background:#1D5FD6">S</div>
                  <div><a class="tname" href="/u/senja_kelabu">@senja_kelabu</a> <span class="ttime">· 2 jam lalu</span></div>
                </div>
                <div class="ttitle">Kita tak pulang ke kota yang sama</div>
                <div class="tbody"><p>Kita tak pulang ke kota yang sama, tapi membawa langit yang serupa. Jakarta masih di punggung, Bandung belum sampai.</p></div>
                <div class="tfoot-mini">♡ 142 terpaut · ⛓ 12 sambungan</div>
              </div>
              <div class="lbl">Sambungan (2)</div>
              <div class="rail">
                <div class="tcard">
                  <span class="knob"></span>
                  <div class="tmini">
                    <div class="tava" style="background:#0F766E">L</div>
                    <div><a class="tname" href="/u/langit_biru">@langit_biru</a> <span class="ttime">· 1 jam lalu</span></div>
                  </div>
                  <div class="tbody"><p>Yang kita bawa bukan alamat, tapi cara hujan menyebut nama kita di dua kota berbeda.</p></div>
                  <div class="tfoot-mini">♡ 96 terpaut · ⛓ 4 sambungan</div>
                </div>
                <div class="tcard">
                  <span class="knob"></span>
                  <div class="tmini">
                    <div class="tava" style="background:#B45309">A</div>
                    <div><a class="tname" href="/u/aksara_hujan">@aksara_hujan</a> <span class="ttime">· 40 menit lalu</span></div>
                  </div>
                  <div class="tbody"><p>Dan di kota ketiga, bait ini masih menyala — siapa pun yang menyambung, dialah rumah berikutnya.</p></div>
                  <div class="tfoot-mini">♡ 41 terpaut · ⛓ 1 sambungan</div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 class="display">Bait pertama, lalu disambung</h2>
            <p class="lead">Kamu menulis bagian pembuka. Penulis lain di kota lain menambah bait berikutnya. Semua sambungan tercatat di <b>Lembar Sambungan</b>, urut dari bait asli sampai yang terakhir.</p>
            <p style="margin-top:24px"><a href="/feed" style="font-weight:700;color:var(--cobalt);text-decoration:underline;text-underline-offset:4px">Lihat contoh lembar sambungan <span aria-hidden="true">→</span></a></p>
          </div>
        </div>
      </div>
    </section>
  </div>

  <div data-header-bg="#7C3AED">
    <section class="pad purple">
      <div class="wrap">
        <h2 class="display">Bacaan dari penulis lain</h2>
        <p class="lead">Puisi dan kutipan yang kami pilih minggu ini. Baca, simpan, atau sambung kalau ada yang nyangkut.</p>
        <div class="wf galeri-warkah">${kartu}</div>
      </div>
    </section>
  </div>

  <div data-header-bg="#3CBDB1">
    <section class="pad teal">
      <div class="wrap">
        <p class="tag">Gratis untuk mulai. Tidak ada paywall bacaan.</p>
        <h2 class="display">Yang lain, kalau kamu butuh</h2>
        <p class="lead">Estafet, pasar buku, arsip pribadi. Semua ada di menu, tidak perlu dipelajari dulu.</p>
        <div class="more">
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg><div><h3>Estafet lintas kota</h3><p>Lanjutkan bait dari penulis di kota lain, satu klik.</p></div></div>
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg><div><h3>Riwayat tanpa batas</h3><p>Semua warkahmu tersimpan, bisa ditelusuri kapan saja.</p></div></div>
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/></svg><div><h3>Privat atau publik</h3><p>Sakelar visibilitas per warkah, bukan setelan global.</p></div></div>
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg><div><h3>Pasar buku</h3><p>Jual dan beli buku bekas dengan rekber, ongkir live.</p></div></div>
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg><div><h3>Paspor antologi</h3><p>Rekap karya, suka, dan simpanan jadi satu halaman.</p></div></div>
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg><div><h3>Tanpa iklan</h3><p>Tidak ada pelacak pihak ketiga, tidak ada sponsori.</p></div></div>
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m8.8 12.3 2 2.1 4.6-5.1"/></svg><div><h3>Ruang aman</h3><p>Kurasi AI dan manusia menahan ujaran kebencian.</p></div></div>
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M3 7h4l2-2h6l2 2h4v12H3z"/><circle cx="12" cy="13" r="3.5"/></svg><div><h3>Notifikasi tenang</h3><p>Hanya balasan dan sambungan, tanpa dering promo.</p></div></div>
          <div class="mcard lift"><svg viewBox="0 0 24 24"><path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2Z"/><path d="M8 7h6"/></svg><div><h3>Pustaka pribadi</h3><p>Arsip kutipan favorit, rapi dan bisa dicari.</p></div></div>
        </div>
      </div>
    </section>
  </div>

  <div data-header-bg="#D95C5C">
    <section class="pad red" id="tanya">
      <div class="wrap">
        <div class="faq">
          <h2 class="display center" style="margin-bottom:16px">Pertanyaan yang sering masuk</h2>
          <p class="center" style="max-width:42rem;margin:0 auto 32px;font-size:18px;line-height:1.6;color:rgba(17,17,17,.8)">Ini yang paling sering ditanyakan ke admin@berbirru.com. Kalau belum terjawab, kirim email.</p>
          <details open><summary><h3>Apakah Berbirru gratis?</h3><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><p>Ya. Membaca, menulis, menyimpan, dan menyambung estafet gratis. Tidak ada paywall bacaan dan tidak ada iklan. Biaya hanya muncul di Pasar Buku sebagai biaya layanan rekber saat kamu berjualan.</p></details>
          <details><summary><h3>Apakah tulisan saya bisa dilihat semua orang?</h3><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><p>Kamu yang menentukan per warkah. Sakelar privat membuat warkah hanya terlihat olehmu — termasuk dari tautan langsung, pencarian, dan halaman profil.</p></details>
          <details><summary><h3>Apa itu estafet kota?</h3><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><p>Warkah bisa dilanjutkan penulis lain sebagai bait berikutnya. Rantainya tampil terbuka, jadi pembaca bisa melihat siapa menulis bagian mana dan dari kota mana.</p></details>
          <details><summary><h3>Apakah saya harus jadi penulis hebat?</h3><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><p>Tidak. Berbirru dibuat untuk orang yang baru mulai. Tidak ada skor, tidak ada peringkat, dan tidak ada tombol tidak-suka untuk menjatuhkan tulisan orang.</p></details>
          <details><summary><h3>Bagaimana konten toxic ditangani?</h3><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><p>Dua lapis: penyaring otomatis untuk ujaran kebencian dan pelecehan, lalu kurasi manusia untuk etika estafet dan laporan pembaca. Warkah yang dilaporkan bisa disembunyikan sementara.</p></details>
          <details><summary><h3>Apakah data saya dijual?</h3><svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></summary><p>Tidak. Tidak ada pelacak iklan pihak ketiga. Email hanya dipakai untuk verifikasi akun dan notifikasi transaksi yang kamu picu sendiri.</p></details>
        </div>
      </div>
    </section>
  </div>

  <div data-header-bg="#F5B83C">
    <section class="pad yellow">
      <div class="wrap">
        <h2 class="display">Kalimat yang sering disalin</h2>
        <p class="lead">Bukan ulasan pengguna. Ini kalimat dari penulis yang paling sering disalin pembaca Berbirru.</p>
      </div>
      <div class="tm" aria-label="Kutipan penulis">
        <div class="tm-track">
          <div class="quote" style="width:300px">“Kau menulis. Suaramu takkan padam ditelan angin.”<b>Pramoedya Ananta Toer</b><span>Tetralogi Buru</span></div>
          <div class="quote" style="width:420px">“Luka adalah tempat di mana cahaya memasuki jiwamu.”<b>Jalaluddin Rumi</b><span>Perenungan sufi</span></div>
          <div class="quote" style="width:300px">“Aku ingin mencintaimu dengan sederhana.”<b>Sapardi Djoko Damono</b><span>Aku Ingin</span></div>
          <div class="quote" style="width:340px">“Aku mau hidup seribu tahun lagi.”<b>Chairil Anwar</b><span>Aku</span></div>
          <div class="quote" style="width:300px" aria-hidden="true">“Kau menulis. Suaramu takkan padam ditelan angin.”<b>Pramoedya Ananta Toer</b><span>Tetralogi Buru</span></div>
          <div class="quote" style="width:420px" aria-hidden="true">“Luka adalah tempat di mana cahaya memasuki jiwamu.”<b>Jalaluddin Rumi</b><span>Perenungan sufi</span></div>
          <div class="quote" style="width:300px" aria-hidden="true">“Aku ingin mencintaimu dengan sederhana.”<b>Sapardi Djoko Damono</b><span>Aku Ingin</span></div>
          <div class="quote" style="width:340px" aria-hidden="true">“Aku mau hidup seribu tahun lagi.”<b>Chairil Anwar</b><span>Aku</span></div>
        </div>
      </div>
    </section>
  </div>

  <div data-header-bg="#1769E8">
    <section class="cta">
      <div class="deco a" aria-hidden="true"><svg viewBox="0 0 100 100"><polygon points="50,2 68,19 92,26 86,50 92,74 68,81 50,98 32,81 8,74 14,50 8,26 32,19" fill="#C8E832" stroke="#111" stroke-width="5" stroke-linejoin="miter"/></svg></div>
      <div class="deco b" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="M 50,10 L 56,40 L 90,50 L 56,60 L 50,90 L 44,60 L 10,50 L 44,40 Z" fill="#FF5B45" stroke="#111" stroke-width="5" stroke-linejoin="miter"/></svg></div>
      <div class="inner">
        <h2>Tulis satu bait malam ini</h2>
        <p>Buka Berbirru, tulis yang tadi kepikiran. Tidak harus rapi.</p>
        <div class="acts">
          <a class="btn coral" href="${ctaHref}">${user ? 'Buka bilik warkah →' : 'Masuk / buka bilik warkah →'}</a>
          <a class="btn ghost" href="/feed">Baca dulu</a>
        </div>
        <p class="small">Tanpa iklan. Tanpa pelacak. Hanya kamu dan kata-katamu.</p>
      </div>
    </section>
  </div>
</main>

<footer>
  <div class="wrap">
    <div class="fcols">
      <div class="fcol fabout">
        <a class="brandplaque" href="/" aria-label="Berbirru beranda" style="box-shadow:none">
          <span class="brand-badge"><svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg><h1>BERBIRRU</h1></span>
          <span class="brand-com-tag">.com</span>
        </a>
        <p>Pustaka warkah dan ruang kolaborasi rasa. Merawat setiap bait kata, perenungan hidup, dan cerita lintas kota.</p>
      </div>
      <div class="fcol">
        <p class="t">Pustaka</p>
        <a href="/feed">Warkah</a>
        <a href="/search">Telusuri</a>
        <a href="${masuk}">${labelMasuk}</a>
      </div>
      <div class="fcol">
        <p class="t">Jelajah</p>
        <a href="#estafet">Estafet kota</a>
        <a href="/pasar">Pasar buku</a>
      </div>
      <div class="fcol">
        <p class="t">Bantuan</p>
        <a href="mailto:admin@berbirru.com">admin@berbirru.com</a>
        <a href="mailto:developer@berbirru.com">developer@berbirru.com</a>
        <a href="/lupa-sandi">Lupa sandi</a>
      </div>
      <div class="fcol">
        <p class="t">Legal</p>
        <a href="/privasi">Privasi</a>
        <a href="/ketentuan">Ketentuan</a>
      </div>
    </div>
    <p class="fbottom">© 2026 BERBIRRU.COM · Dirawat dengan rasa. Bebas iklan · Bebas pelacak pihak ketiga.</p>
  </div>
</footer>

<script>
  (function(){
    // typing headline: main sekali, lalu ulang tiap 9 detik (kecuali reduced-motion)
    var jamEl=document.querySelector('.appbar time');
    if(jamEl){var tz=jamEl.getAttribute('data-tz')||'Asia/Jakarta';var tick=function(){try{jamEl.textContent=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:tz}).format(new Date())}catch(e){}};tick();setInterval(tick,20000);}
    var h1=document.querySelector('.hero h1');
    if(h1 && !matchMedia('(prefers-reduced-motion: reduce)').matches){
      var replay=function(){h1.classList.remove('typing');void h1.offsetWidth;h1.classList.add('typing')};
      h1.addEventListener('animationend',function(e){
        if(e.target.classList.contains('ty2')) setTimeout(replay,3500);
      });
    }
    // like/simpan kartu warkah: state warna via CSS (:has), angka diupdate bila JS aktif
    document.querySelectorAll('.wf .act-in').forEach(function(cb){
      cb.addEventListener('change',function(){
        cb.parentElement.toggleAttribute('data-on', cb.checked);
        var sp=cb.parentElement.querySelector('span');
        if(!sp) return;
        var parts=sp.textContent.trim().split(' ');
        var n=Math.max(0,(parseInt(parts[0],10)||0)+(cb.checked?1:-1));
        sp.textContent=n+(parts.length>1?' '+parts.slice(1).join(' '):'');
      });
    });
    var btn=document.getElementById('mobtn'), nav=document.getElementById('mobnav');
    if(btn&&nav){btn.addEventListener('click',function(){var open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',open?'true':'false');btn.setAttribute('aria-label',open?'Tutup menu':'Buka menu')});
      nav.addEventListener('click',function(e){if(e.target.closest('a')){nav.classList.remove('open');btn.setAttribute('aria-expanded','false')}})}
  }());
</script>
</body>
</html>`;
}
