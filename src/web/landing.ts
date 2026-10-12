export function renderLandingPage(user: any = null): string {
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="color-scheme" content="light" />
  <meta name="theme-color" content="#f4f0e7" />
  <link rel="icon" href="data:," />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap" rel="stylesheet" />
  <title>BERBIRRU.COM — Pustaka Tulisan &amp; Kolaborasi Kata</title>
  <meta name="description" content="Tempat segala bentuk tulisan—puisi, kutipan bermakna, cerita kilat, resensi buku, hingga perenungan absurd—dicatat abadi dan disambung bersama." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://berbirru.com/" />
  <meta property="og:title" content="BERBIRRU.COM — Pustaka Tulisan &amp; Kolaborasi Kata" />
  <meta property="og:description" content="Pernah tiba-tiba nulis ide bagus, tapi pas mau dibaca lagi malah lupa ditaruh di mana? Berbirru adalah rumahnya." />
  <meta property="og:image" content="https://berbirru.com/og-image.png?v=6" />
  <meta property="og:image:secure_url" content="https://berbirru.com/og-image.png?v=6" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="745" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="BERBIRRU.COM — Pustaka Tulisan &amp; Kolaborasi Kata" />
  <meta name="twitter:description" content="Pernah tiba-tiba nulis ide bagus, tapi pas mau dibaca lagi malah lupa ditaruh di mana? Berbirru adalah rumahnya." />
  <meta name="twitter:image" content="https://berbirru.com/og-image.png?v=6" />
  <style>
    :root{
      color-scheme:light;
      --paper:#f4f0e7;
      --paper-2:#fffdf7;
      --ink:#122031;
      --muted:#53606c;
      --navy:#123f67;
      --sky:#9dcbe6;
      --yellow:#f2cc57;
      --coral:#ee9a79;
      --mint:#b9d8c6;
      --line:#122031;
      --shadow:#122031;
      --soft:rgba(18,32,49,.16);
      --dots:rgba(18,63,103,.16);
      --focus:#be3f1a;
    }
    *{box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{margin:0;min-width:320px;overflow-x:hidden;background:var(--paper);color:var(--ink);font-family:"DM Sans",sans-serif;line-height:1.55}
    a{color:inherit}
    button,a{-webkit-tap-highlight-color:transparent}
    :focus-visible{outline:3px solid var(--focus);outline-offset:4px}
    .shell{width:min(1180px,calc(100% - 40px));margin-inline:auto}
    h1,h2,h3,p,blockquote{margin-top:0}
    .serif{font-family:"Newsreader",serif}
    .skip{position:fixed;left:8px;top:8px;transform:translateY(-160%);background:var(--yellow);color:#122031;border:2px solid #122031;padding:10px 14px;font-weight:800;z-index:50}.skip:focus{transform:translateY(0)}

    .topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;min-height:82px;border-bottom:2px solid var(--line)}
    .brand-wrap{display:inline-flex;align-items:center;text-decoration:none;position:relative}
    .brand-badge{display:inline-flex;align-items:center;gap:6px;background:var(--blue-primary,#1D61E7);color:#FFFFFF;padding:6px 14px;border:3px solid var(--ink,#0B192C);border-radius:12px;box-shadow:4px 4px 0 var(--shadow-ink,#1E293B);transform:rotate(-1deg);position:relative;z-index:2}
    .brand-badge h1{margin:0;font-family:'Space Grotesk','DM Sans',sans-serif;font-size:18px;font-weight:800;letter-spacing:0.5px;color:#FFFFFF;line-height:1}
    .brand-badge svg{width:16px;height:16px;stroke:#FFFFFF;stroke-width:2;fill:none;flex-shrink:0}
    .brand-com-tag{font-family:'Space Grotesk','DM Sans',sans-serif;font-size:24px;font-weight:900;color:var(--blue-primary,#1D61E7);position:relative;display:inline-block;transform:rotate(2deg);margin-left:4px;margin-top:2px;z-index:1;line-height:1;padding-bottom:3px}
    .brand-com-tag::after{content:'';position:absolute;left:-24px;bottom:-3px;width:calc(100% + 28px);height:6px;background:var(--accent-yellow,#FDE047);border-radius:3px;z-index:-1}
    .nav{display:flex;align-items:center;gap:28px}
    .nav a{font-size:14px;font-weight:800;text-decoration:none}
    .nav a:not(.nav-cta){text-decoration-line:underline;text-decoration-color:transparent;text-decoration-thickness:3px;text-underline-offset:8px;transition:text-decoration-color .18s ease}
    .nav a:not(.nav-cta):hover{text-decoration-color:var(--yellow)}
    .nav-cta,.button{display:inline-flex;align-items:center;justify-content:center;gap:9px;border:2px solid var(--line);background:var(--yellow);color:#122031;box-shadow:4px 4px 0 var(--shadow);padding:12px 17px;font-weight:800;text-decoration:none;transition:transform .16s ease,box-shadow .16s ease}
    .nav-cta:hover,.button:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--shadow)}
    .button.secondary{background:var(--paper-2);color:var(--ink)}
    .button svg,.nav-cta svg{width:18px;height:18px}
    .menu{display:none;width:46px;height:44px;place-items:center;border:2px solid var(--line);background:var(--paper-2);color:var(--ink);box-shadow:3px 3px 0 var(--shadow)}
    .menu svg{width:22px;height:22px}

    .hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(380px,.95fr);gap:clamp(36px,5vw,72px);align-items:center;padding:84px 0 106px;min-height:720px}
    .kicker{display:flex;align-items:center;gap:11px;margin-bottom:24px;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
    .kicker::before{content:"";width:38px;height:4px;border:1px solid var(--line);background:var(--yellow)}
    h1{max-width:760px;margin-bottom:28px;font-family:"Newsreader",serif;font-size:clamp(56px,7.6vw,98px);font-weight:500;line-height:.92;letter-spacing:-.052em}
    h1 em{font-weight:500;color:var(--navy);text-decoration-line:underline;text-decoration-color:var(--yellow);text-decoration-thickness:.1em;text-underline-offset:.11em}
    .hero-lead{max-width:650px;margin-bottom:34px;color:var(--muted);font-family:"Newsreader",serif;font-size:clamp(21px,2.2vw,29px);line-height:1.34}
    .actions{display:flex;gap:14px;flex-wrap:wrap}
    .reading-card{position:relative;min-height:500px;padding:34px 32px;display:flex;flex-direction:column;justify-content:space-between;isolation:isolate}
    .reading-card::before,.reading-card::after{content:"";position:absolute;border:2px solid var(--line);z-index:-1}
    .reading-card::before{inset:16px -4px -8px 18px;background:var(--sky);box-shadow:9px 9px 0 var(--shadow);transform:rotate(2.6deg)}
    .reading-card::after{inset:0 16px 14px 0;background:var(--paper-2);transform:rotate(-1.3deg)}
    .card-meta{display:flex;justify-content:space-between;gap:16px;padding-bottom:13px;border-bottom:1px solid var(--soft);font-size:12px;font-weight:800}
    .reading-card blockquote{max-width:440px;margin:46px 0;font-family:"Newsreader",serif;font-size:clamp(34px,3.8vw,48px);line-height:1.15}
    .reading-card blockquote span{background:linear-gradient(transparent 69%,var(--yellow) 69%)}
    .card-foot{display:flex;align-items:center;gap:14px;padding-top:18px;border-top:1px dashed var(--line);color:var(--muted);font-size:13px}
    .relay-dots{display:flex}.relay-dots i{width:28px;height:28px;margin-left:-6px;border:1.5px solid #122031;border-radius:50%;background:var(--mint);display:grid;place-items:center;color:#122031;font-style:normal;font-size:10px;font-weight:900}.relay-dots i:first-child{margin-left:0}.relay-dots i:nth-child(2){background:var(--yellow)}.relay-dots i:nth-child(3){background:var(--coral)}
    .burst{position:absolute;right:-31px;top:-36px;width:112px;aspect-ratio:1;display:grid;place-items:center;padding:16px;background:var(--yellow);color:#122031;border:2px solid var(--line);clip-path:polygon(50% 0,60% 13%,75% 5%,79% 22%,97% 22%,88% 39%,100% 50%,87% 60%,96% 77%,77% 78%,73% 96%,59% 87%,50% 100%,40% 87%,25% 96%,22% 78%,4% 76%,13% 60%,0 50%,14% 39%,4% 21%,23% 22%,27% 5%,41% 13%);font-size:11px;font-weight:900;line-height:1.1;text-align:center;transform:rotate(8deg)}

    .principle{border-block:2px solid var(--line);background:var(--navy);color:var(--paper-2)}
    .principle-inner{display:grid;grid-template-columns:.65fr 1.35fr;gap:64px;align-items:center;padding:62px 0}
    .principle strong{font-size:12px;letter-spacing:.12em;text-transform:uppercase}
    .principle blockquote{margin:0;font-family:"Newsreader",serif;font-size:clamp(31px,4.2vw,54px);line-height:1.08}

    section{scroll-margin-top:24px}
    .section-head{max-width:790px;margin-bottom:50px}
    .section-head h2{margin-bottom:16px;font-family:"Newsreader",serif;font-size:clamp(42px,5.2vw,68px);font-weight:500;line-height:1.01;letter-spacing:-.04em}
    .section-head p{max-width:660px;margin-bottom:0;color:var(--muted);font-size:18px}

    .voices{padding:112px 0 122px}
    .feed{display:grid;grid-template-columns:repeat(12,1fr);gap:22px;align-items:start}
    .quote{border:2px solid var(--line);background:var(--paper-2);box-shadow:7px 7px 0 var(--shadow)}
    .quote:nth-child(1){grid-column:1/span 6}.quote:nth-child(2){grid-column:7/span 6;margin-top:42px}.quote:nth-child(3){grid-column:1/span 6;margin-top:42px}
    .quote:nth-child(4){grid-column:7/span 6;margin-top:84px}
    .quote-head{display:flex;align-items:center;gap:12px;padding:15px 17px;border-bottom:2px solid var(--line)}
    .portrait{width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;border:2px solid var(--line);border-radius:50%;background:var(--sky);color:#122031;font-family:"Newsreader",serif;font-weight:600}.quote:nth-child(2) .portrait{background:var(--yellow)}.quote:nth-child(3) .portrait{background:var(--coral)}
    .identity{min-width:0;line-height:1.2}.identity strong,.identity span{display:block}.identity strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px}.identity span{margin-top:4px;color:var(--muted);font-size:11px}
    .monogram{margin-left:auto;width:25px;height:25px;display:grid;place-items:center;border:1.5px solid var(--line);background:var(--paper);font-family:"Newsreader",serif;font-weight:700}
    .quote-body{min-height:300px;padding:28px 22px 22px;display:flex;flex-direction:column;justify-content:space-between}
    .quote blockquote{margin-bottom:30px;font-family:"Newsreader",serif;font-size:clamp(28px,2.7vw,38px);line-height:1.12}
    .quote blockquote::before{content:"“";display:block;height:32px;color:var(--navy);font-size:64px;line-height:.65}
    .quote-source{display:flex;justify-content:space-between;gap:15px;align-items:end;padding-top:14px;border-top:1px dashed var(--line);color:var(--muted);font-size:12px}.quote-source cite{display:block;color:var(--ink);font-style:normal;font-weight:800}.tag{border:1px solid var(--line);background:var(--paper);color:var(--ink);padding:4px 7px;font-weight:800;white-space:nowrap}

    .ways{padding:112px 0 122px;border-top:2px solid var(--line);background:color-mix(in srgb,var(--sky) 28%,var(--paper))}
    .ways-layout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:clamp(30px,6vw,78px);align-items:start}
    .tabs{display:grid;gap:12px}
    .tab{appearance:none;width:100%;padding:18px 20px;border:2px solid var(--line);background:var(--paper-2);color:var(--ink);box-shadow:4px 4px 0 var(--shadow);font:inherit;font-weight:800;text-align:left;cursor:pointer;transition:transform .16s ease,background .16s ease}
    .tab span{float:right;font-family:"Newsreader",serif;font-weight:500}.tab[aria-selected="true"]{background:var(--yellow);color:#122031;box-shadow:1px 1px 0 var(--shadow);transform:translate(3px,3px)}
    .panel{position:relative;min-height:420px;overflow:hidden;border:2px solid var(--line);background:var(--paper-2);box-shadow:8px 8px 0 var(--shadow);padding:clamp(30px,5.5vw,64px)}.panel[hidden]{display:none}
    .panel h3{max-width:650px;margin-bottom:20px;font-family:"Newsreader",serif;font-size:clamp(38px,4.6vw,57px);font-weight:500;line-height:1.05}.panel p{max-width:650px;color:var(--muted);font-size:18px}.chips{display:flex;flex-wrap:wrap;gap:10px;margin:30px 0 0;padding:0;list-style:none}.chips li{padding:8px 12px;border:1.5px solid var(--line);background:var(--paper);font-size:13px;font-weight:800}.panel-letter{position:absolute;right:-25px;bottom:-56px;color:var(--sky);font-family:"Newsreader",serif;font-size:210px;line-height:1;opacity:.38;pointer-events:none}

    .relay{padding:118px 0}
    .relay-layout{display:grid;grid-template-columns:minmax(0,1.06fr) minmax(330px,.94fr);gap:28px;align-items:stretch}
    .relay-main,.relay-side article{border:2px solid var(--line);background:var(--paper-2);box-shadow:7px 7px 0 var(--shadow)}
    .relay-main{min-height:570px;padding:clamp(32px,5vw,58px);display:flex;flex-direction:column;justify-content:space-between}
    .city-bars{display:grid;grid-template-columns:repeat(4,1fr);align-items:end;gap:10px;min-height:230px;margin-bottom:42px}.city{height:var(--h);min-height:92px;padding:11px 8px;border:2px solid var(--line);background:var(--c);color:#122031;font-size:11px;font-weight:900;writing-mode:vertical-rl;transform:rotate(180deg)}
    .feature-no{font-family:"Newsreader",serif;font-size:21px}.relay h3{margin-bottom:13px;font-family:"Newsreader",serif;font-size:clamp(34px,4.2vw,51px);font-weight:500;line-height:1.05}.relay p{margin-bottom:0;color:var(--muted)}
    .relay-side{display:grid;gap:28px}.relay-side article{padding:31px;display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center}.relay-side h3{font-size:31px}.relay-side p{font-size:15px}.symbol{width:86px;height:86px;display:grid;place-items:center;border:2px solid var(--line);background:var(--yellow);color:#122031;transform:rotate(4deg)}.relay-side article:nth-child(2) .symbol{background:var(--mint);transform:rotate(-4deg)}.symbol svg{width:44px;height:44px}

    .care{padding:8px 0 120px}
    .care-card{display:grid;grid-template-columns:.82fr 1.18fr;overflow:hidden;border:2px solid var(--line);background:var(--paper-2);box-shadow:10px 10px 0 var(--shadow)}
    .care-art{min-height:410px;padding:44px;border-right:2px solid var(--line);background:var(--coral);color:#122031;display:grid;place-items:center}.safe-mark{width:190px;height:218px;display:grid;place-items:center;border:3px solid #122031;border-radius:95px 95px 22px 22px;background:#fff7df;box-shadow:10px 10px 0 #122031;transform:rotate(-3deg)}.safe-mark svg{width:84px;height:84px}
    .care-copy{align-self:center;padding:clamp(40px,6vw,76px)}.care-copy h2{margin-bottom:20px;font-family:"Newsreader",serif;font-size:clamp(40px,5vw,62px);font-weight:500;line-height:1.03;letter-spacing:-.035em}.care-copy>p{color:var(--muted);font-size:18px}.care-list{display:grid;gap:15px;margin-top:28px}.care-point{display:grid;grid-template-columns:25px 1fr;gap:12px;font-weight:700}.care-point svg{width:22px;margin-top:2px}

    .ending{padding:28px 0 110px}.ending-inner{display:grid;grid-template-columns:1fr auto;gap:60px;align-items:end;padding-top:72px;border-top:2px solid var(--line)}.ending h2{max-width:820px;margin:0;font-family:"Newsreader",serif;font-size:clamp(46px,6.2vw,78px);font-weight:500;line-height:.99;letter-spacing:-.045em}.ending-side{max-width:340px;color:var(--muted)}.ending-side .button{margin-top:18px}
    footer{border-top:2px solid var(--line);background:var(--yellow);color:#122031}.footer-inner{min-height:90px;display:flex;align-items:center;justify-content:space-between;gap:22px;font-size:14px;font-weight:800}.footer-inner p{margin:0}.footer-inner a{text-underline-offset:4px;text-decoration-thickness:2px}

    @media(max-width:920px){
      .hero{grid-template-columns:1fr;padding-top:64px}.hero-copy{max-width:780px}.reading-card{max-width:600px;width:calc(100% - 20px);margin:auto}
      .principle-inner{grid-template-columns:1fr;gap:24px}
      .feed{grid-template-columns:repeat(2,minmax(0,1fr))}.quote:nth-child(1),.quote:nth-child(2),.quote:nth-child(3),.quote:nth-child(4){grid-column:auto}.quote:nth-child(2),.quote:nth-child(4){margin-top:42px}.quote:nth-child(3){margin-top:0}
      .ways-layout{grid-template-columns:1fr}.tabs{grid-template-columns:repeat(3,1fr)}
      .relay-layout{grid-template-columns:1fr}.relay-main{min-height:520px}
      .care-card{grid-template-columns:1fr}.care-art{min-height:300px;border-right:0;border-bottom:2px solid var(--line)}
      .ending-inner{grid-template-columns:1fr;gap:32px}
    }
    @media(max-width:680px){
      .shell{width:min(100% - 28px,1180px)}
      .topbar{min-height:70px;position:relative}.menu{display:grid}.nav{display:none;position:absolute;z-index:20;top:62px;left:0;right:0;flex-direction:column;align-items:stretch;gap:14px;padding:18px;border:2px solid var(--line);background:var(--paper-2);box-shadow:6px 6px 0 var(--shadow)}.nav.open{display:flex}.nav a{padding:8px}.nav-cta{margin-top:2px}
      .hero{min-height:auto;padding:58px 0 88px;gap:66px}h1{font-size:clamp(51px,14.8vw,70px)}.actions{display:grid}.button{width:100%}.reading-card{min-height:440px;padding:25px}.burst{right:-9px;top:-42px;width:94px;font-size:9px}
      .principle-inner{padding:45px 0 49px}.voices,.ways,.relay{padding:84px 0}.section-head{margin-bottom:40px}
      .feed{grid-template-columns:minmax(0,1fr)}.quote:nth-child(2),.quote:nth-child(3),.quote:nth-child(4){margin-top:0}.quote-body{min-height:0}.quote blockquote{font-size:32px}
      .tabs{grid-template-columns:1fr}.tab span{display:none}.panel{min-height:430px}
      .relay-main{min-height:500px;padding:28px}.city-bars{min-height:190px;gap:7px}.city{padding:8px 4px}.relay-side article{grid-template-columns:1fr}.symbol{width:74px;height:74px}
      .care{padding-bottom:94px}.care-art{min-height:275px}.safe-mark{width:148px;height:172px}.ending{padding-bottom:84px}
      .footer-inner{align-items:flex-start;flex-direction:column;padding:24px 0}
    }
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
  </style>
  <style>
    /* Kartu postingan BERBIRRU — disalin dari src/web/feed.ts + landing.ts */
    .quotes-feed-grid{--bg-main:#F0F6FE;--bg-card:#FFFFFF;--bg-blue-subtle:#E0EEFD;--ink:#0B192C;--shadow-ink:#1E293B;--blue-primary:#1D61E7;--accent-yellow:#FDE047;--border-thick:3px solid var(--ink);--border-thin:1.5px solid var(--ink);--shadow-hard-lg:6px 6px 0 var(--shadow-ink);--radius:16px;--radius-sm:10px;font-family:'DM Sans',-apple-system,sans-serif;display:grid;grid-template-columns:minmax(0,1fr);gap:18px}
    @media(min-width:768px){.quotes-feed-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px}}
    .ico{width:14px;height:14px;stroke:currentColor;stroke-width:2.5;fill:none;stroke-linecap:round;stroke-linejoin:round}
    .thread-card{background:var(--bg-card);border:var(--border-thick);border-radius:0px;box-shadow:var(--shadow-hard-lg);overflow:visible;position:relative;margin-top:14px;display:flex;flex-direction:column;justify-content:space-between;height:100%}
    .thread-header-soft{background:var(--bg-blue-subtle);padding:8px 12px 8px 68px;display:flex;justify-content:space-between;align-items:center;border-bottom:var(--border-thin);border-radius:0px;min-height:44px;position:relative}
    .thread-avatar-clip{position:absolute;left:10px;top:-14px;width:48px;height:50px;background:var(--blue-primary);color:#FFFFFF;border:var(--border-thick);border-radius:0px;display:grid;place-items:center;font-family:'Newsreader',serif;font-size:24px;font-weight:700;transform:rotate(-2deg);z-index:5}
    .paperclip-svg{position:absolute;top:-10px;right:-7px;width:18px;height:28px;z-index:6;transform:rotate(18deg);filter:drop-shadow(1px 1px 0 rgba(0,0,0,0.25))}
    .thread-author-info{display:flex;flex-direction:column;line-height:1.25}
    .thread-pen-name{font-size:13px;font-weight:800;color:var(--ink)}
    .thread-city{font-size:10px;font-weight:700;color:#64748B}
    .thread-timestamp-stack{display:flex;flex-direction:column;align-items:flex-end;line-height:1.25}
    .time-main{font-size:11px;font-weight:800;color:var(--ink)}
    .date-sub{font-size:9.5px;font-weight:700;color:#64748B}
    .thread-body{padding:14px 14px 12px;flex:1;display:flex;flex-direction:column}
    .thread-title{font-family:'Newsreader',serif;font-size:17px;font-weight:600;color:var(--ink);margin-bottom:6px}
    .thread-text{font-size:14px;font-weight:600;line-height:1.6;color:#0F172A;flex:1}
    .thread-text blockquote{background:#F8FAFC;border-left:3.5px solid var(--ink);padding:10px 14px;margin:8px 0;font-style:italic;border-radius:0px;color:#334155}
    .thread-footer{padding:8px 10px;background:#FFFFFF;border-top:var(--border-thin);display:flex;justify-content:space-between;align-items:center;border-radius:0px;gap:4px}
    .actions-left{display:flex;gap:4px;flex-shrink:0}
    .act-btn-mock{background:var(--bg-main);border:var(--border-thin);border-radius:var(--radius-sm);padding:4px 7px;font-size:11px;font-weight:800;display:inline-flex;align-items:center;gap:3px;white-space:nowrap}
    .chain-btn-mock{background:var(--accent-yellow);color:var(--ink);border:var(--border-thin);border-radius:var(--radius-sm);padding:4px 8px;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;flex-shrink:0}
    @media(max-width:380px){
      .thread-footer{padding:6px 6px;gap:2px}
      .actions-left{gap:2px}
      .act-btn-mock{padding:3px 5px;font-size:10px;gap:2px}
      .chain-btn-mock{padding:3px 6px;font-size:10px;gap:2px}
      .act-btn-mock .ico, .chain-btn-mock .ico{width:11px;height:11px}
    }
  </style>
</head>
<body>
  <a class="skip" href="#utama">Lewati ke isi utama</a>
  <header class="shell">
    <nav class="topbar" aria-label="Navigasi utama">
      <a href="/" class="brand-wrap">
        <div class="brand-badge">
          <svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h1>BERBIRRU</h1>
        </div>
        <span class="brand-com-tag">.com</span>
      </a>
      <button class="menu" type="button" aria-expanded="false" aria-controls="nav" aria-label="Buka menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      <div class="nav" id="nav"><a href="#suara">Ruang inspirasi</a><a href="#cara">Eksplorasi</a><a href="#estafet">Estafet kota</a><a href="#ruang">Ruang aman</a>` + (user ? `<a href="/u/${user.pen_name}">@${user.pen_name}</a>` : `<a href="/login">Masuk</a>`) + `<a class="nav-cta" href="/feed">Jelajahi warkah<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></a></div>
    </nav>
  </header>

  <main id="utama">
    <section class="hero shell">
      <div class="hero-copy">
        <div class="kicker">Pustaka tulisan &amp; kolaborasi kata</div>
        <h1>Merawat <em>Rasa</em>, Menguntai Kata.</h1>
        <p class="hero-lead">Pernah tiba-tiba nulis ide bagus, puisi kilat, atau curahan rasa di sembarang tempat, tapi pas mau dibaca lagi malah lupa ditaruh di mana? Berbirru adalah rumahnya—tempat mengabadikan setiap patah kata agar tersimpan rapi, mudah ditemukan kembali, dan bisa dilanjutkan bersama.</p>
        <div class="actions"><a class="button" href="/login">Mulai Menulis<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></a><a class="button secondary" href="/feed">Jelajahi warkah</a></div>
      </div>
      <div class="reading-card" aria-label="Ilustrasi bait yang tumbuh bersama">
        <div class="burst">3 PENULIS<br/>LINTAS KOTA</div>
        <div class="card-meta"><span>#UNTAIAN-8910</span><span>Contoh nyata</span></div>
        <blockquote>Kita tak pulang ke kota yang sama, tapi membawa <span>langit yang serupa.</span></blockquote>
        <div class="card-foot"><div class="relay-dots" aria-hidden="true"><i>S</i><i>L</i><i>P</i></div><span>@senja_kelabu · Jakarta &nbsp;@langit_biru · Bandung &nbsp;@penyair_nusantara · Yogyakarta</span></div>
      </div>
    </section>

    <section class="principle"><div class="principle-inner shell"><strong>Prinsip BERBIRRU</strong><blockquote><strong>Lalu, apa bedanya Berbirru dengan media sosial lain?</strong><br/><span style='font-size:16px;font-weight:500;display:inline-block;margin-top:6px;'>Berbirru adalah media sosial berbasis komunitas untuk siapa saja yang suka membaca dan menulis—mulai dari quotes, puisi, hingga catatan harian. Bedanya, di sini tidak ada konten toxic atau ujaran kebencian karena setiap tulisan dikurasi agar linimasa tetap bersih. Dan kamu tidak perlu jadi penulis hebat untuk bergabung; siapa pun bebas membaca, menulis, mengikuti akun lain, serta menyimpan tulisan yang disukai.</span></blockquote></div></section>

    <section class="voices shell" id="suara">
      <div class="section-head"><div class="kicker">Intip Linimasa</div><h2>Tulis karyamu sendiri, atau arsipkan kutipan yang kamu suka.</h2><p>Di linimasa Berbirru, kamu bebas menuangkan tulisan pribadimu atau membagikan puisi dan kutipan buku favorit dari penulis lain yang membekas di hati—agar tetap tersimpan rapi dan bisa dinikmati bersama pembaca lain.</p></div>
      <div class="quotes-feed-grid">
        <div class="thread-card">
          <div class="thread-header-soft">
            <div class="thread-avatar-clip">S
              <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <div class="thread-author-info">
              <span class="thread-pen-name">@sapardi_damono</span>
              <span class="thread-city">Surakarta · Maestro Sastra</span>
            </div>
            <div class="thread-timestamp-stack">
              <span class="time-main">Puisi Klasik</span>
              <span class="date-sub">Tahun 1989</span>
            </div>
          </div>
          <div class="thread-body">
            <h3 class="thread-title">Aku Ingin</h3>
            <div class="thread-text" style="font-family:'Newsreader',serif;font-size:15.5px;line-height:1.7;">"Aku ingin mencintaimu dengan sederhana: dengan kata yang tak sempat diucapkan kayu kepada api yang menjadikannya abu.<br><br>Aku ingin mencintaimu dengan sederhana: dengan isyarat yang tak sempat disampaikan awan kepada hujan yang menjadikannya tiada."</div>
          </div>
          <div class="thread-footer">
            <div class="actions-left">
              <span class="act-btn-mock" style="background:#EF4444;color:#FFF;"><svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>9.4k Terpaut</span></span>
              <span class="act-btn-mock" style="background:#1D61E7;color:#FFF;"><svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg><span>4.2k Simpan</span></span>
            </div>
            <span class="chain-btn-mock"><svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>890 Sambungan</span></span>
          </div>
        </div>
        <div class="thread-card">
          <div class="thread-header-soft">
            <div class="thread-avatar-clip" style="background:#0F3E99;">C
              <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <div class="thread-author-info">
              <span class="thread-pen-name">@chairil_anwar</span>
              <span class="thread-city">Medan · Pelopor Angkatan '45</span>
            </div>
            <div class="thread-timestamp-stack">
              <span class="time-main">Jiwa Merdeka</span>
              <span class="date-sub">Tahun 1943</span>
            </div>
          </div>
          <div class="thread-body">
            <h3 class="thread-title">Aku</h3>
            <div class="thread-text" style="font-family:'DM Sans',sans-serif;font-weight:700;">"Aku ini binatang jalang, dari kumpulannya terbuang.<br>Biar peluru menembus kulitku, aku tetap meradang menerjang.<br><br>Luka dan bisa kubawa berlari, berlari hingga hilang pedih peri. Dan aku akan lebih tidak perduli. Aku mau hidup seribu tahun lagi."</div>
          </div>
          <div class="thread-footer">
            <div class="actions-left">
              <span class="act-btn-mock" style="background:#EF4444;color:#FFF;"><svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>14.8k Terpaut</span></span>
              <span class="act-btn-mock" style="background:#1D61E7;color:#FFF;"><svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg><span>6.1k Simpan</span></span>
            </div>
            <span class="chain-btn-mock"><svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>1.2k Sambungan</span></span>
          </div>
        </div>
        <div class="thread-card">
          <div class="thread-header-soft">
            <div class="thread-avatar-clip" style="background:#059669;">P
              <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <div class="thread-author-info">
              <span class="thread-pen-name">@pramoedya_toer</span>
              <span class="thread-city">Blora · Suara Abadi</span>
            </div>
            <div class="thread-timestamp-stack">
              <span class="time-main">Kutipan Sastra</span>
              <span class="date-sub">Tetralogi Buru</span>
            </div>
          </div>
          <div class="thread-body">
            <h3 class="thread-title">Suara yang Tak Padam</h3>
            <div class="thread-text"><blockquote>"Tahu kau mengapa aku sayangi kau lebih dari siapa pun? Karena kau menulis. Suaramu takkan padam ditelan angin, akan abadi sampai jauh di kemudian hari."</blockquote></div>
          </div>
          <div class="thread-footer">
            <div class="actions-left">
              <span class="act-btn-mock" style="background:#EF4444;color:#FFF;"><svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>18.2k Terpaut</span></span>
              <span class="act-btn-mock" style="background:#1D61E7;color:#FFF;"><svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg><span>9.5k Simpan</span></span>
            </div>
            <span class="chain-btn-mock"><svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>2.4k Sambungan</span></span>
          </div>
        </div>
        <div class="thread-card">
          <div class="thread-header-soft">
            <div class="thread-avatar-clip" style="background:#D97706;">R
              <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <div class="thread-author-info">
              <span class="thread-pen-name">@jalaluddin_rumi</span>
              <span class="thread-city">Balkh · Penyair Sufi</span>
            </div>
            <div class="thread-timestamp-stack">
              <span class="time-main">Perenungan</span>
              <span class="date-sub">Abad 13</span>
            </div>
          </div>
          <div class="thread-body">
            <h3 class="thread-title">Luka &amp; Cahaya</h3>
            <div class="thread-text"><blockquote>"Jangan berduka. Apapun yang hilang darimu akan kembali dalam bentuk yang lain. Luka adalah tempat di mana cahaya memasuki jiwamu."</blockquote></div>
          </div>
          <div class="thread-footer">
            <div class="actions-left">
              <span class="act-btn-mock" style="background:#EF4444;color:#FFF;"><svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg><span>22.5k Terpaut</span></span>
              <span class="act-btn-mock" style="background:#1D61E7;color:#FFF;"><svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg><span>11.3k Simpan</span></span>
            </div>
            <span class="chain-btn-mock"><svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span>3.1k Sambungan</span></span>
          </div>
        </div>
      </div>
    </section>

    <section class="ways" id="cara"><div class="shell"><div class="section-head"><div class="kicker">Eksplorasi tanpa batas</div><h2>Apa yang bisa kamu lakukan?</h2><p>Empat hal yang bisa kamu lakukan di BERBIRRU—dari menulis bait pertama sampai merawat karya bersama lintas kota.</p></div>
      <div class="ways-layout"><div class="tabs" role="tablist" aria-label="Fitur BERBIRRU"><button class="tab" id="tab-goreskan" role="tab" aria-selected="true" aria-controls="panel-goreskan" data-panel="panel-goreskan">Goreskan <span>01</span></button><button class="tab" id="tab-estafet" role="tab" aria-selected="false" aria-controls="panel-estafet" data-panel="panel-estafet">Estafet <span>02</span></button><button class="tab" id="tab-paspor" role="tab" aria-selected="false" aria-controls="panel-paspor" data-panel="panel-paspor">Paspor <span>03</span></button><button class="tab" id="tab-apresiasi" role="tab" aria-selected="false" aria-controls="panel-apresiasi" data-panel="panel-apresiasi">Apresiasi <span>04</span></button></div>
        <div>
          <article class="panel" id="panel-goreskan" role="tabpanel" aria-labelledby="tab-goreskan"><h3>Goreskan segala bentuk tulisan.</h3><p>Mulai dari puisi, kutipan bermakna, micro-fiction, resensi buku, hingga cerita absurd dengan tipografi Serif, Sans, dan Mono.</p><ul class="chips"><li>Puisi</li><li>Kutipan bermakna</li><li>Micro-fiction</li><li>Resensi buku</li><li>Cerita absurd</li></ul><span class="panel-letter" aria-hidden="true">G</span></article><article class="panel" id="panel-estafet" role="tabpanel" aria-labelledby="tab-estafet" hidden><h3>Sambung estafet lintas kota.</h3><p>Lanjutkan bait warkah penulis lain dari kota berbeda dalam satu klik. Jadilah bagian dari rantai untaian karya kolaboratif.</p><ul class="chips"><li>Estafet kota</li><li>Satu klik</li><li>Karya kolaboratif</li></ul><span class="panel-letter" aria-hidden="true">E</span></article><article class="panel" id="panel-paspor" role="tabpanel" aria-labelledby="tab-paspor" hidden><h3>Pustaka antologi paspor.</h3><p>Setiap bait karyamu, riwayat warkah yang disukai, dan simpanan favorit tersusun rapi dalam paspor antologi pribadimu.</p><ul class="chips"><li>Paspor antologi</li><li>Riwayat warkah</li><li>Simpanan favorit</li></ul><span class="panel-letter" aria-hidden="true">P</span></article><article class="panel" id="panel-apresiasi" role="tabpanel" aria-labelledby="tab-apresiasi" hidden><h3>Mendukung sesama penikmat kata.</h3><p>Nggak perlu takut tulisanmu dinilai jelek. Di sini semua orang sama-sama belajar menulis, membaca, dan memberi semangat satu sama lain.</p><ul class="chips"><li>Saling dukung</li><li>Ramah pemula</li><li>Komunitas hangat</li></ul><span class="panel-letter" aria-hidden="true">A</span></article>
        </div>
      </div>
    </div></section>

    <section class="relay shell" id="estafet"><div class="section-head"><div class="kicker">Lebih dari tombol terbit</div><h2>Sastra yang terus bergerak.</h2><p>Sebuah tulisan bisa menjadi perjalanan, perjumpaan, dan arsip tentang siapa saja yang pernah merawatnya.</p></div>
      <div class="relay-layout"><article class="relay-main"><div class="city-bars" aria-hidden="true"><div class="city" style="--h:55%;--c:var(--mint)">Jakarta</div><div class="city" style="--h:82%;--c:var(--yellow)">Bandung</div><div class="city" style="--h:68%;--c:var(--coral)">Yogyakarta</div><div class="city" style="--h:100%;--c:var(--sky)">Surakarta</div></div><div><span class="feature-no">01</span><h3>Estafet lintas kota</h3><p>Lanjutkan bait warkah penulis lain dari kota berbeda dalam satu klik. Jadilah bagian dari rantai untaian karya kolaboratif.</p></div></article>
        <div class="relay-side"><article><div><span class="feature-no">02</span><h3>Pustaka antologi paspor</h3><p>Setiap bait karyamu, riwayat warkah yang disukai, dan simpanan favorit tersusun rapi dalam paspor antologi pribadimu.</p></div><div class="symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="1"/><circle cx="12" cy="11" r="3.3"/><path d="M8.7 11h6.6M12 7.7c1.2 1.1 1.8 2.2 1.8 3.3s-.6 2.2-1.8 3.3c-1.2-1.1-1.8-2.2-1.8-3.3s.6-2.2 1.8-3.3Z"/></svg></div></article><article><div><span class="feature-no">03</span><h3>Apresiasi murni bebas toxic</h3><p>Sistem feed berbasis gravitasi makna dan kesegaran rasa. Tanpa tekanan angka followers dan tanpa DM bising.</p></div><div class="symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v16H7z"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3"/></svg></div></article></div>
      </div>
    </section>

    <section class="care shell" id="ruang"><div class="care-card"><div class="care-art" aria-hidden="true"><div class="safe-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#122031" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m8.8 12.3 2 2.1 4.6-5.1"/></svg></div></div><div class="care-copy"><div class="kicker">Ruang aman terkurasi</div><h2>Platform bersih bebas racun: proteksi 2 lapis.</h2><p>Berbirru dirancang khusus sebagai oase yang menenangkan pikiran. Setiap tulisan yang dipublikasikan dijaga ketat dari ujaran kebencian, pelecehan, spam, dan konten destruktif melalui sistem keamanan terpadu.</p><div class="care-list"><div class="care-point"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><span>Lapis 1 — AI Guardian pelindung ruang: memindai setiap naskah warkah dalam hitungan milidetik. Konten toxic, ujaran kebencian, dan pelecehan otomatis dicegat sebelum sempat tampil di linimasa publik.</span></div><div class="care-point"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><span>Lapis 2 — Kurasi manusia &amp; etika komunitas: tim kurator memastikan estetika karya, etika estafet kata, dan iklim literasi yang saling menguatkan tetap terjaga.</span></div></div></div></div></section>

    <section class="ending shell" id="mulai"><div class="ending-inner"><h2>Pustaka warkah dan ruang kolaborasi rasa.</h2><div class="ending-side"><p>Merawat setiap bait kata, perenungan hidup, dan cerita lintas kota tanpa distraksi algoritma bising.</p><a class="button" href="/login">Masuk / buka bilik warkah<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></a><a class="button secondary" href="/feed" style="margin-top:10px">Jelajahi warkah</a></div></div></section>
  </main>

  <footer><div class="footer-inner shell" style="flex-wrap:wrap;align-items:flex-start;gap:34px;padding:38px 0"><div><p style="margin-bottom:8px">BERBIRRU.COM</p><p style="font-weight:600;color:var(--muted)">Pustaka warkah dan ruang kolaborasi rasa. Merawat setiap bait kata, perenungan hidup, dan cerita lintas kota tanpa distraksi algoritma bising.</p><p style="font-weight:600;color:var(--muted);margin-top:10px">© 2026 BERBIRRU.COM · Dirawat dengan rasa dan integritas karya. Bebas iklan · Bebas pelacak pihak ketiga.</p></div><div><p style="margin-bottom:8px">Navigasi pustaka</p><a href="/">Beranda</a> · <a href="/feed">Warkah</a> · <a href="/feed?tab=search">Telusuri penulis &amp; bait</a> · <a href="/login">Masuk / buka bilik warkah</a></div><div><p style="margin-bottom:8px">Pusat hubungan</p><p style="font-weight:600;color:var(--muted)">Kolaborasi &amp; kerjasama:<br/><a href="mailto:admin@berbirru.com">admin@berbirru.com</a></p><p style="font-weight:600;color:var(--muted);margin-top:8px">Laporan bug &amp; teknis:<br/><a href="mailto:developer@berbirru.com">developer@berbirru.com</a></p></div></div></footer>
  <script>
    (function(){
      var tabs=Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
      var panels=Array.prototype.slice.call(document.querySelectorAll('[role="tabpanel"]'));
      var menu=document.querySelector('.menu');
      var nav=document.getElementById('nav');
      function activate(tab){
        tabs.forEach(function(item){var selected=item===tab;item.setAttribute('aria-selected',selected?'true':'false');item.tabIndex=selected?0:-1});
        panels.forEach(function(panel){panel.hidden=panel.id!==tab.getAttribute('data-panel')});
      }
      tabs.forEach(function(tab,index){
        tab.addEventListener('click',function(){activate(tab)});
        tab.addEventListener('keydown',function(event){
          if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].indexOf(event.key)<0)return;
          event.preventDefault();var nextIndex=index;
          if(event.key==='Home')nextIndex=0;else if(event.key==='End')nextIndex=tabs.length-1;else nextIndex=(index+((event.key==='ArrowDown'||event.key==='ArrowRight')?1:-1)+tabs.length)%tabs.length;
          activate(tabs[nextIndex]);tabs[nextIndex].focus();
        });
      });
      menu.addEventListener('click',function(){var open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open?'true':'false');menu.setAttribute('aria-label',open?'Tutup menu':'Buka menu')});
      nav.addEventListener('click',function(event){if(event.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Buka menu')}});
    }());
  </script>
</body>
</html>
`;
}
