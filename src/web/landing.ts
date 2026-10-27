// Landing publik — komposisi ala DepoBudget (hero kobalt, marquee, kartu tebal)
// dengan seluruh materi landing lama: prinsip, kartu warkah, empat fitur, estafet kota, ruang aman.
export function renderLandingPage(user: any = null): string {
  const masuk = user ? `/u/${user.pen_name}` : '/login';
  const labelMasuk = user ? `@${user.pen_name}` : 'Masuk';
  const ctaHref = user ? '/feed' : '/login';

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
<meta property="og:image" content="https://berbirru.com/og-image.png?v=6">
<meta property="og:image:secure_url" content="https://berbirru.com/og-image.png?v=6">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="745">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="BERBIRRU.COM — Merawat rasa, menguntai kata">
<meta name="twitter:description" content="Pustaka tulisan &amp; kolaborasi kata. Tulis karyamu, arsipkan kutipan, sambung estafet lintas kota.">
<meta name="twitter:image" content="https://berbirru.com/og-image.png?v=6">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,700;1,6..72,500&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
<style>
  :root{
    --ink:#0B192C; --ink-soft:#3F4F63; --blue:#1D61E7; --blue-deep:#0F3E99;
    --cream:#FAF7F2; --paper:#FFFFFF; --lime:#C8E832; --amber:#F5B83C;
    --coral:#FF5B45; --sky:#DCE9FF; --line:2.5px solid var(--ink);
    --shadow:5px 6px 0 var(--ink);
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:var(--cream);color:var(--ink);font:16px/1.55 'DM Sans',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;min-width:320px;overflow-x:hidden}
  a{color:inherit}
  :focus-visible{outline:3px solid var(--blue);outline-offset:3px}
  .shell{width:min(1180px,calc(100% - 40px));margin-inline:auto}
  .kicker{font:700 10.5px 'Roboto Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:#5B6B80}
  .skip{position:fixed;left:8px;top:8px;transform:translateY(-160%);background:var(--lime);border:var(--line);padding:10px 14px;font-weight:800;z-index:60;text-decoration:none;color:var(--ink)}
  .skip:focus{transform:translateY(0)}

  /* nav */
  header.top{position:sticky;top:0;z-index:40;background:rgba(250,247,242,.94);backdrop-filter:blur(8px);border-bottom:3px solid var(--ink)}
  .nav-in{display:flex;align-items:center;gap:16px;height:64px}
  .brand{display:flex;align-items:center;gap:8px;text-decoration:none;font:400 21px 'Archivo Black',sans-serif;letter-spacing:-.02em;color:var(--ink)}
  .brand .com{font:700 10.5px 'Roboto Mono',monospace;background:var(--ink);color:var(--lime);padding:2px 6px;border-radius:4px;letter-spacing:.04em}
  .nav-links{display:flex;gap:16px;margin-left:8px}
  .nav-links a{font:700 13px 'DM Sans';text-decoration:none;opacity:.82}
  .nav-links a:hover{opacity:1;text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:4px}
  .nav-sp{flex:1}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:var(--line);border-radius:12px;background:var(--lime);color:var(--ink);font:900 14px 'DM Sans';padding:12px 18px;text-decoration:none;box-shadow:4px 5px 0 var(--ink);transition:transform .14s ease,box-shadow .14s ease}
  .btn:hover{transform:translate(2px,2px);box-shadow:2px 3px 0 var(--ink)}
  .btn.dark{background:var(--ink);color:#fff;box-shadow:4px 5px 0 rgba(11,25,44,.28)}
  .btn.ghost{background:transparent;color:#fff;border-color:#fff;box-shadow:4px 5px 0 rgba(0,0,0,.32)}
  .btn.sm{padding:9px 14px;font-size:13px}
  .menu{display:none;border:var(--line);background:#fff;border-radius:10px;padding:8px;cursor:pointer}
  .menu svg{width:20px;height:20px;stroke:var(--ink);fill:none;stroke-width:2.4;stroke-linecap:round}

  /* hero */
  .hero{background:var(--blue);color:#fff;border-bottom:3px solid var(--ink);overflow:hidden;position:relative}
  .hero:after{content:'';position:absolute;right:-80px;bottom:-140px;width:340px;height:340px;border:3px solid rgba(255,255,255,.2);border-radius:50%;pointer-events:none}
  .hero-in{display:grid;grid-template-columns:1.05fr .95fr;gap:34px;align-items:center;padding:52px 0 46px;position:relative}
  .eyebrow{display:inline-flex;align-items:center;gap:8px;border:2.5px solid #fff;border-radius:20px;padding:5px 11px;font:700 10.5px 'Roboto Mono';letter-spacing:.1em;text-transform:uppercase;background:rgba(255,255,255,.1)}
  h1{font:400 clamp(40px,6vw,72px)/.94 'Archivo Black',sans-serif;letter-spacing:-.035em;margin-top:16px}
  h1 em{font-family:'Newsreader',serif;font-style:italic;font-weight:500;color:var(--lime)}
  .hero-lead{font-size:16.5px;line-height:1.55;color:rgba(255,255,255,.93);max-width:46ch;margin-top:14px}
  .hero-search{display:flex;gap:8px;margin-top:22px;max-width:440px}
  .hero-search input{flex:1;min-width:0;border:2.5px solid var(--ink);border-radius:10px;padding:12px 13px;font:700 14px 'DM Sans';color:var(--ink);background:#fff;outline:none}
  .hero-search input:focus{box-shadow:0 0 0 3px rgba(200,232,50,.55)}
  .hero-search button{border:2.5px solid var(--ink);border-radius:10px;background:var(--lime);color:var(--ink);padding:0 14px;cursor:pointer;box-shadow:3px 3px 0 var(--ink);display:inline-flex;align-items:center}
  .hero-search button svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:2.6;stroke-linecap:round}
  .cta-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
  .proof{display:flex;align-items:center;gap:9px;margin-top:20px;font-size:12px;color:rgba(255,255,255,.88)}
  .avs{display:flex}
  .avs i{width:26px;height:26px;border-radius:50%;border:2px solid var(--blue);display:grid;place-items:center;font:800 10px 'DM Sans';color:var(--ink);margin-left:-8px;background:var(--amber);font-style:normal}
  .avs i:nth-child(2){background:var(--lime)}
  .avs i:nth-child(3){background:var(--coral);color:#fff}
  .avs i:first-child{margin-left:0}

  /* kartu hero */
  .hero-card-wrap{position:relative;max-width:430px;margin-left:auto}
  .sticker{position:absolute;top:-16px;right:-8px;width:92px;height:92px;border:3px solid var(--ink);border-radius:50%;background:var(--lime);color:var(--ink);display:grid;place-items:center;text-align:center;font:900 11.5px/1.15 'DM Sans';transform:rotate(8deg);box-shadow:5px 5px 0 rgba(0,0,0,.3);z-index:2}
  .hero-card{background:#fff;color:var(--ink);border:3px solid var(--ink);border-radius:16px;box-shadow:9px 10px 0 rgba(0,0,0,.33);padding:16px 16px 12px;transform:rotate(-2deg)}
  .hc-meta{display:flex;justify-content:space-between;font:700 9.5px 'Roboto Mono';letter-spacing:.08em;text-transform:uppercase;color:#64748B}
  .hc-quote{font:400 25px/1.28 'Newsreader',serif;margin:10px 0 12px}
  .hc-quote span{border-bottom:3px solid var(--lime)}
  .hc-foot{display:flex;align-items:center;gap:8px;font:600 10.5px 'Roboto Mono';color:#475569;border-top:2px dashed #CBD5E1;padding-top:10px;flex-wrap:wrap}
  .relay-dots{display:flex}
  .relay-dots i{width:22px;height:22px;border-radius:50%;border:2px solid var(--ink);display:grid;place-items:center;font:800 9px 'DM Sans';font-style:normal;margin-left:-6px;background:var(--sky);color:var(--ink)}
  .relay-dots i:first-child{margin-left:0;background:var(--amber)}
  .relay-dots i:nth-child(3){background:var(--coral);color:#fff}

  /* marquee */
  .marq{background:var(--lime);border-bottom:3px solid var(--ink);overflow:hidden}
  .marq-track{display:flex;gap:22px;white-space:nowrap;padding:11px 0;font:800 12px 'Roboto Mono';letter-spacing:.1em;text-transform:uppercase;width:max-content;animation:geser 30s linear infinite}
  .marq-track span{display:inline-flex;align-items:center;gap:22px}
  @keyframes geser{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  @media(prefers-reduced-motion:reduce){.marq-track{animation:none}}

  /* sections */
  section{border-bottom:3px solid var(--ink);padding:54px 0;scroll-margin-top:80px}
  h2{font:400 clamp(27px,3.3vw,42px)/1.02 'Archivo Black',sans-serif;letter-spacing:-.03em;margin-top:8px}
  .section-head{max-width:820px}
  .section-head p{color:var(--ink-soft);font-weight:600;max-width:64ch;margin-top:10px}

  .principle{background:var(--cream)}
  .principle blockquote{background:#fff;border:var(--line);border-radius:14px;box-shadow:var(--shadow);padding:22px;margin-top:18px;font:400 19px/1.6 'Newsreader',serif}
  .principle blockquote strong{font-family:'DM Sans';font-weight:900;font-size:15px}
  .principle .detail{display:block;margin-top:8px;font:500 14.5px/1.65 'DM Sans';color:var(--ink-soft)}

  .feed-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:26px}
  .thread{position:relative;background:#fff;border:3px solid var(--ink);border-radius:14px;box-shadow:var(--shadow);padding:18px 18px 12px;display:flex;flex-direction:column}
  .thread-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
  .thread-av{width:40px;height:40px;border:2.5px solid var(--ink);border-radius:8px;display:grid;place-items:center;font:700 17px 'Newsreader';color:#fff;background:var(--blue);flex:0 0 auto}
  .thread-who b{display:block;font:800 13px 'DM Sans'}
  .thread-who span{display:block;font:600 10px 'Roboto Mono';color:#64748B;text-transform:uppercase;letter-spacing:.05em}
  .thread-meta{margin-left:auto;text-align:right;font:700 9.5px/1.35 'Roboto Mono';color:#64748B;text-transform:uppercase}
  .thread h3{font:400 21px/1.2 'Newsreader',serif;margin-bottom:6px}
  .thread-body{font:400 14.5px/1.65 'Newsreader',serif;color:#334155;flex:1}
  .thread-body blockquote{border-left:3px solid var(--ink);padding-left:10px;font-style:italic}
  .thread-foot{display:flex;align-items:center;gap:10px;margin-top:12px;padding-top:9px;border-top:2px dashed #CBD5E1;font:700 10.5px 'DM Sans';color:#475569;flex-wrap:wrap}
  .mock{display:inline-flex;align-items:center;gap:5px;border:2px solid var(--ink);border-radius:8px;padding:4px 8px;font-size:10px;font-weight:800}
  .mock.love{background:#EF4444;color:#fff;border-color:#B91C1C}
  .mock.save{background:var(--blue);color:#fff}
  .mock.chain{background:#fff;margin-left:auto}

  .ways{background:#fff}
  .ways-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:24px}
  .way{border:3px solid var(--ink);border-radius:14px;padding:16px;background:var(--cream);box-shadow:4px 5px 0 var(--ink)}
  .way:nth-child(2){background:var(--lime)}
  .way:nth-child(3){background:var(--sky)}
  .way:nth-child(4){background:#FFE9E4}
  .way .no{font:700 9.5px 'Roboto Mono';letter-spacing:.1em;color:#3F4F63}
  .way h3{font:900 15.5px/1.3 'DM Sans';margin-top:6px}
  .way p{font-size:12.7px;line-height:1.55;color:#3F4F63;margin-top:5px}
  .chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px;list-style:none}
  .chips li{font:700 9.5px 'DM Sans';border:2px solid var(--ink);border-radius:20px;padding:2px 7px;background:#fff}

  .relay{background:var(--ink);color:#fff}
  .relay h2{color:#fff}
  .relay .section-head p{color:#CBD5E1}
  .relay-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:22px;margin-top:26px}
  .city-bars{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;align-items:end;min-height:200px;border:2.5px dashed #64748B;border-radius:14px;padding:14px}
  .city{border:2.5px solid #0B192C;border-radius:8px;padding:9px 6px;color:#0B192C;font:900 10px 'Roboto Mono';writing-mode:vertical-rl;transform:rotate(180deg);height:var(--h);min-height:70px;text-align:center;background:var(--c)}
  .relay-side{display:grid;gap:12px;align-content:start}
  .relay-card{border:2.5px solid #64748B;border-radius:14px;padding:16px;background:#111E33}
  .relay-card .no{font:700 9.5px 'Roboto Mono';color:#9DB2D0;letter-spacing:.1em}
  .relay-card h3{font:900 16px 'DM Sans';margin-top:5px;color:#fff}
  .relay-card p{font-size:13px;color:#CBD5E1;margin-top:5px;line-height:1.55}

  .care{background:var(--cream)}
  .care-card{display:grid;grid-template-columns:.85fr 1.15fr;border:3px solid var(--ink);border-radius:16px;overflow:hidden;box-shadow:8px 9px 0 var(--ink);background:#fff}
  .care-art{background:var(--coral);display:grid;place-items:center;padding:34px;border-right:3px solid var(--ink)}
  .safe{width:150px;height:172px;border:3px solid var(--ink);border-radius:76px 76px 18px 18px;background:#FFF7DF;display:grid;place-items:center;box-shadow:8px 8px 0 var(--ink);transform:rotate(-3deg)}
  .safe svg{width:66px;height:66px;stroke:var(--ink);fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
  .care-copy{padding:26px}
  .care-copy h2{margin-top:6px}
  .care-copy>p{color:var(--ink-soft);font-weight:600;margin-top:8px}
  .care-list{margin-top:14px;display:grid;gap:9px}
  .care-point{display:flex;gap:9px;font-size:13px;line-height:1.55;color:#334155}
  .care-point svg{width:18px;height:18px;flex:0 0 auto;stroke:#0F7A3D;fill:none;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;margin-top:2px}
  .care-point b{color:var(--ink)}

  .ending{background:var(--blue);color:#fff;border-bottom:none}
  .ending-in{display:grid;grid-template-columns:1.1fr .9fr;gap:26px;align-items:center}
  .ending h2{color:#fff}
  .ending p{color:#D7E3FF;font-weight:600;margin-top:8px}
  .ending .cta-row{margin-top:0;justify-content:flex-end}

  footer{background:var(--ink);color:#CBD5E1;padding:36px 0 28px;font-size:12.5px}
  footer .cols{display:flex;gap:36px;flex-wrap:wrap;justify-content:space-between}
  footer .brand{color:#fff}
  footer p{font-weight:600;line-height:1.6}
  footer a{color:#E2E8F0;text-decoration:none}
  footer a:hover{text-decoration:underline}
  footer .ttl{font:700 9.5px 'Roboto Mono';letter-spacing:.12em;text-transform:uppercase;color:#94A3B8;margin-bottom:7px}

  @media(max-width:960px){
    .hero-in{grid-template-columns:1fr;padding:36px 0}
    .hero-card-wrap{margin:6px auto 0;max-width:380px}
    .feed-grid{grid-template-columns:1fr}
    .ways-grid{grid-template-columns:1fr 1fr}
    .relay-grid{grid-template-columns:1fr}
    .care-card{grid-template-columns:1fr}
    .care-art{border-right:none;border-bottom:3px solid var(--ink);padding:26px}
    .ending-in{grid-template-columns:1fr}
    .ending .cta-row{margin-top:14px;justify-content:flex-start}
    .nav-links{display:none}
    .menu{display:inline-flex}
    .nav-links.open{display:flex;position:absolute;left:0;right:0;top:64px;flex-direction:column;background:var(--cream);border-bottom:3px solid var(--ink);padding:12px 22px;gap:12px;margin:0;z-index:41}
  }
  @media(max-width:560px){
    .ways-grid{grid-template-columns:1fr}
    h1{font-size:38px}
    .sticker{width:78px;height:78px;font-size:10px}
    section{padding:40px 0}
    .shell{width:calc(100% - 28px)}
  }
</style>
</head>
<body>
<a class="skip" href="#utama">Lompat ke konten utama</a>

<header class="top">
  <div class="shell nav-in">
    <a class="brand" href="/">BERBIRRU <span class="com">.COM</span></a>
    <nav class="nav-links" id="nav" aria-label="Navigasi utama">
      <a href="#suara">Ruang inspirasi</a>
      <a href="#cara">Eksplorasi</a>
      <a href="#estafet">Estafet kota</a>
      <a href="#ruang">Ruang aman</a>
      <a href="${masuk}">${labelMasuk}</a>
    </nav>
    <div class="nav-sp"></div>
    <a class="btn dark sm" href="/feed">Jelajahi warkah →</a>
    <button class="menu" type="button" aria-expanded="false" aria-controls="nav" aria-label="Buka menu">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
    </button>
  </div>
</header>

<main id="utama">
  <section class="hero" style="padding:0">
    <div class="shell hero-in">
      <div>
        <span class="eyebrow">Pustaka tulisan &amp; kolaborasi kata</span>
        <h1>Merawat <em>rasa</em>,<br>menguntai <em>kata</em>.</h1>
        <p class="hero-lead">Pernah menulis ide bagus di sembarang tempat, lalu lupa di mana menyimpannya? Berbirru rumahnya — tempat mengabadikan setiap patah kata agar tersimpan rapi, mudah ditemukan, dan bisa dilanjutkan bersama.</p>
        <div class="hero-search" role="search">
          <input type="search" id="heroSearchInput" placeholder="Cari @nama_pena atau kata kunci…" autocomplete="off" aria-label="Cari penulis atau warkah">
          <button type="button" onclick="heroSearch()" aria-label="Cari">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
        </div>
        <div class="cta-row">
          <a class="btn" href="${ctaHref}">Mulai menulis →</a>
          <a class="btn ghost" href="/feed">Jelajahi warkah</a>
        </div>
        <div class="proof">
          <span class="avs" aria-hidden="true"><i>S</i><i>L</i><i>P</i></span>
          <span>3 penulis lintas kota sedang menguntai #Untaian-8910</span>
        </div>
      </div>
      <div class="hero-card-wrap">
        <div class="sticker">100%<br>GRATIS</div>
        <div class="hero-card" aria-label="Contoh warkah estafet">
          <div class="hc-meta"><span>#UNTAIAN-8910</span><span>Contoh nyata</span></div>
          <p class="hc-quote">“Kita tak pulang ke kota yang sama, tapi membawa <span>langit yang serupa.</span>”</p>
          <div class="hc-foot">
            <span class="relay-dots" aria-hidden="true"><i>S</i><i>L</i><i>P</i></span>
            <span>@senja_kelabu · Jakarta · @langit_biru · Bandung</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="marq" aria-hidden="true">
    <div class="marq-track">
      <span>Untuk yang menulis</span><span>✳</span><span>Untuk yang membaca</span><span>✳</span><span>Estafet lintas kota</span><span>✳</span><span>Paspor antologi</span><span>✳</span><span>Bebas iklan</span><span>✳</span>
      <span>Untuk yang menulis</span><span>✳</span><span>Untuk yang membaca</span><span>✳</span><span>Estafet lintas kota</span><span>✳</span><span>Paspor antologi</span><span>✳</span><span>Bebas iklan</span><span>✳</span>
    </div>
  </div>

  <section class="principle">
    <div class="shell">
      <div class="kicker">Prinsip BERBIRRU</div>
      <h2>Apa bedanya dengan media sosial lain?</h2>
      <blockquote>
        <strong>Media sosial berbasis komunitas untuk siapa saja yang suka membaca dan menulis.</strong>
        <span class="detail">Mulai dari kutipan, puisi, hingga catatan harian. Di sini tidak ada konten toxic atau ujaran kebencian karena setiap tulisan dikurasi agar linimasa tetap bersih. Kamu tidak perlu jadi penulis hebat untuk bergabung — siapa pun bebas membaca, menulis, mengikuti akun lain, dan menyimpan tulisan yang disukai.</span>
      </blockquote>
    </div>
  </section>

  <section id="suara" style="background:var(--cream)">
    <div class="shell">
      <div class="section-head">
        <div class="kicker">Intip linimasa</div>
        <h2>Tulis karyamu sendiri, atau arsipkan kutipan yang kamu suka.</h2>
        <p>Di linimasa Berbirru, kamu bebas menuangkan tulisan pribadi atau membagikan puisi dan kutipan buku favorit dari penulis lain yang membekas — agar tetap tersimpan rapi dan bisa dinikmati pembaca lain.</p>
      </div>
      <div class="feed-grid">
        <article class="thread">
          <div class="thread-head">
            <div class="thread-av" style="background:var(--blue)">S</div>
            <div class="thread-who"><b>@sapardi_damono</b><span>Surakarta · Maestro sastra</span></div>
            <div class="thread-meta">Puisi klasik<br>1989</div>
          </div>
          <h3>Aku Ingin</h3>
          <div class="thread-body">“Aku ingin mencintaimu dengan sederhana: dengan kata yang tak sempat diucapkan kayu kepada api yang menjadikannya abu.<br><br>Aku ingin mencintaimu dengan sederhana: dengan isyarat yang tak sempat disampaikan awan kepada hujan yang menjadikannya tiada.”</div>
          <div class="thread-foot">
            <span class="mock love">♥ 9.4k Terpaut</span>
            <span class="mock save">▮ 4.2k Simpan</span>
            <span class="mock chain">890 Sambungan</span>
          </div>
        </article>
        <article class="thread">
          <div class="thread-head">
            <div class="thread-av" style="background:var(--blue-deep)">C</div>
            <div class="thread-who"><b>@chairil_anwar</b><span>Medan · Angkatan '45</span></div>
            <div class="thread-meta">Jiwa merdeka<br>1943</div>
          </div>
          <h3>Aku</h3>
          <div class="thread-body" style="font-family:'DM Sans',sans-serif;font-weight:700">“Aku ini binatang jalang, dari kumpulannya terbuang. Biar peluru menembus kulitku, aku tetap meradang menerjang.<br><br>Luka dan bisa kubawa berlari, berlari hingga hilang pedih peri. Dan aku akan lebih tidak perduli. Aku mau hidup seribu tahun lagi.”</div>
          <div class="thread-foot">
            <span class="mock love">♥ 14.8k Terpaut</span>
            <span class="mock save">▮ 6.1k Simpan</span>
            <span class="mock chain">1.2k Sambungan</span>
          </div>
        </article>
        <article class="thread">
          <div class="thread-head">
            <div class="thread-av" style="background:#059669">P</div>
            <div class="thread-who"><b>@pramoedya_toer</b><span>Blora · Suara abadi</span></div>
            <div class="thread-meta">Kutipan sastra<br>Tetralogi Buru</div>
          </div>
          <h3>Suara yang Tak Padam</h3>
          <div class="thread-body"><blockquote>“Tahu kau mengapa aku sayangi kau lebih dari siapa pun? Karena kau menulis. Suaramu takkan padam ditelan angin, akan abadi sampai jauh di kemudian hari.”</blockquote></div>
          <div class="thread-foot">
            <span class="mock love">♥ 18.2k Terpaut</span>
            <span class="mock save">▮ 9.5k Simpan</span>
            <span class="mock chain">2.4k Sambungan</span>
          </div>
        </article>
        <article class="thread">
          <div class="thread-head">
            <div class="thread-av" style="background:#D97706">R</div>
            <div class="thread-who"><b>@jalaluddin_rumi</b><span>Balkh · Penyair sufi</span></div>
            <div class="thread-meta">Perenungan<br>Abad 13</div>
          </div>
          <h3>Luka &amp; Cahaya</h3>
          <div class="thread-body"><blockquote>“Jangan berduka. Apa pun yang hilang darimu akan kembali dalam bentuk yang lain. Luka adalah tempat di mana cahaya memasuki jiwamu.”</blockquote></div>
          <div class="thread-foot">
            <span class="mock love">♥ 22.5k Terpaut</span>
            <span class="mock save">▮ 11.3k Simpan</span>
            <span class="mock chain">3.1k Sambungan</span>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section class="ways" id="cara">
    <div class="shell">
      <div class="section-head">
        <div class="kicker">Eksplorasi tanpa batas</div>
        <h2>Apa yang bisa kamu lakukan?</h2>
        <p>Empat hal yang bisa kamu lakukan di Berbirru — dari menulis bait pertama sampai merawat karya bersama lintas kota.</p>
      </div>
      <div class="ways-grid">
        <div class="way"><div class="no">01</div><h3>Goreskan segala bentuk tulisan</h3><p>Puisi, kutipan bermakna, micro-fiction, resensi buku, hingga cerita absurd dengan tipografi Serif, Sans, dan Mono.</p><ul class="chips"><li>Puisi</li><li>Kutipan</li><li>Micro-fiction</li><li>Resensi</li></ul></div>
        <div class="way"><div class="no">02</div><h3>Sambung estafet lintas kota</h3><p>Lanjutkan bait warkah penulis lain dari kota berbeda dalam satu klik. Jadi bagian rantai untaian kolaboratif.</p><ul class="chips"><li>Estafet kota</li><li>Satu klik</li><li>Kolaboratif</li></ul></div>
        <div class="way"><div class="no">03</div><h3>Pustaka antologi paspor</h3><p>Setiap bait karyamu, riwayat warkah yang disukai, dan simpanan favorit tersusun rapi dalam paspor pribadimu.</p><ul class="chips"><li>Paspor antologi</li><li>Riwayat</li><li>Simpanan</li></ul></div>
        <div class="way"><div class="no">04</div><h3>Mendukung sesama penikmat kata</h3><p>Tidak perlu takut tulisanmu dinilai jelek. Semua orang sama-sama belajar menulis, membaca, dan memberi semangat.</p><ul class="chips"><li>Saling dukung</li><li>Ramah pemula</li><li>Komunitas</li></ul></div>
      </div>
    </div>
  </section>

  <section class="relay" id="estafet">
    <div class="shell">
      <div class="section-head">
        <div class="kicker" style="color:#9DB2D0">Lebih dari tombol terbit</div>
        <h2>Sastra yang terus bergerak.</h2>
        <p>Sebuah tulisan bisa menjadi perjalanan, perjumpaan, dan arsip tentang siapa saja yang pernah merawatnya.</p>
      </div>
      <div class="relay-grid">
        <div class="city-bars" aria-hidden="true">
          <div class="city" style="--h:55%;--c:var(--lime)">Jakarta</div>
          <div class="city" style="--h:82%;--c:var(--amber)">Bandung</div>
          <div class="city" style="--h:68%;--c:var(--coral)">Yogyakarta</div>
          <div class="city" style="--h:100%;--c:var(--sky)">Surakarta</div>
        </div>
        <div class="relay-side">
          <div class="relay-card"><div class="no">01</div><h3>Estafet lintas kota</h3><p>Lanjutkan bait penulis lain dari kota berbeda dalam satu klik. Jadilah bagian dari rantai untaian karya kolaboratif.</p></div>
          <div class="relay-card"><div class="no">02</div><h3>Pustaka antologi paspor</h3><p>Setiap bait karyamu, riwayat warkah yang disukai, dan simpanan favorit tersusun rapi dalam paspor antologi pribadimu.</p></div>
          <div class="relay-card"><div class="no">03</div><h3>Apresiasi murni bebas toxic</h3><p>Feed berbasis gravitasi makna dan kesegaran rasa. Tanpa tekanan angka followers, tanpa DM bising.</p></div>
        </div>
      </div>
      <div style="margin-top:20px"><a class="btn" href="${ctaHref}">Ikut estafet →</a></div>
    </div>
  </section>

  <section class="care" id="ruang">
    <div class="shell">
      <div class="care-card">
        <div class="care-art" aria-hidden="true">
          <div class="safe"><svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.8 2.8 8.1 7 10 4.2-1.9 7-5.2 7-10V6l-7-3Z"/><path d="m8.8 12.3 2 2.1 4.6-5.1"/></svg></div>
        </div>
        <div class="care-copy">
          <div class="kicker">Ruang aman terkurasi</div>
          <h2>Platform bersih bebas racun: proteksi 2 lapis.</h2>
          <p>Berbirru dirancang sebagai oase yang menenangkan pikiran. Setiap tulisan yang dipublikasikan dijaga ketat dari ujaran kebencian, pelecehan, spam, dan konten destruktif.</p>
          <div class="care-list">
            <div class="care-point"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><span><b>Lapis 1 — AI Guardian pelindung ruang.</b> Memindai setiap naskah warkah dalam hitungan milidetik. Konten toxic, ujaran kebencian, dan pelecehan otomatis dicegat sebelum sempat tampil di linimasa publik.</span></div>
            <div class="care-point"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg><span><b>Lapis 2 — Kurasi manusia &amp; etika komunitas.</b> Tim kurator memastikan estetika karya, etika estafet kata, dan iklim literasi yang saling menguatkan tetap terjaga.</span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="ending" id="mulai">
    <div class="shell ending-in">
      <div>
        <div class="kicker" style="color:#C9DAFF">Mulai dari satu bait</div>
        <h2>Pustaka warkah dan ruang kolaborasi rasa.</h2>
        <p>Merawat setiap bait, perenungan hidup, dan cerita lintas kota — tanpa distraksi algoritma bising.</p>
      </div>
      <div class="cta-row">
        <a class="btn" href="${ctaHref}">${user ? 'Buka bilik warkah →' : 'Masuk / buka bilik warkah →'}</a>
        <a class="btn ghost" href="/feed">Jelajahi warkah</a>
      </div>
    </div>
  </section>
</main>

<footer>
  <div class="shell cols">
    <div style="max-width:340px">
      <a class="brand" href="/" style="font-size:17px">BERBIRRU <span class="com">.COM</span></a>
      <p style="margin-top:8px">Pustaka warkah dan ruang kolaborasi rasa. Merawat setiap bait kata, perenungan hidup, dan cerita lintas kota.</p>
      <p style="margin-top:8px;color:#94A3B8">© 2026 BERBIRRU.COM · Dirawat dengan rasa dan integritas karya. Bebas iklan · Bebas pelacak pihak ketiga.</p>
    </div>
    <div>
      <div class="ttl">Navigasi pustaka</div>
      <p><a href="/">Beranda</a> · <a href="/feed">Warkah</a> · <a href="/search">Telusuri penulis &amp; bait</a> · <a href="${masuk}">${labelMasuk}</a></p>
    </div>
    <div>
      <div class="ttl">Pusat hubungan</div>
      <p>Kolaborasi &amp; kerja sama:<br><a href="mailto:admin@berbirru.com">admin@berbirru.com</a></p>
      <p style="margin-top:8px">Laporan bug &amp; teknis:<br><a href="mailto:developer@berbirru.com">developer@berbirru.com</a></p>
    </div>
  </div>
</footer>

<script>
  (function(){
    var menu=document.querySelector('.menu'), nav=document.getElementById('nav');
    if(menu&&nav){
      menu.addEventListener('click',function(){
        var open=nav.classList.toggle('open');
        menu.setAttribute('aria-expanded',open?'true':'false');
        menu.setAttribute('aria-label',open?'Tutup menu':'Buka menu');
      });
      nav.addEventListener('click',function(e){
        if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Buka menu')}
      });
    }
    var heroInput=document.getElementById('heroSearchInput');
    window.heroSearch=function(){
      var q=(heroInput&&heroInput.value||'').trim();
      window.location.href = q ? '/search?q='+encodeURIComponent(q) : '/search';
    };
    if(heroInput){heroInput.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();heroSearch()}})}
  }());
</script>
</body>
</html>`;
}
