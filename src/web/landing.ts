export function renderLandingPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BERBIRRU.COM — Pustaka Tulisan & Kolaborasi Kata</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@600;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-main: #F0F6FE; --bg-card: #FFFFFF; --bg-blue-subtle: #E0EEFD;
      --ink: #0B192C; --shadow-ink: #1E293B; --blue-primary: #1D61E7;
      --blue-deep: #0F3E99; --blue-light: #60A5FA; --accent-yellow: #FDE047;
      --border-thick: 3px solid var(--ink); --border-med: 2.5px solid var(--ink); --border-thin: 2px solid var(--ink);
      --shadow-hard: 4px 4px 0 var(--shadow-ink); --shadow-hard-lg: 6px 6px 0 var(--shadow-ink); --shadow-hard-sm: 2.5px 2.5px 0 var(--shadow-ink);
      --radius: 16px; --radius-sm: 10px;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg-main); color: var(--ink); min-height: 100vh;
      background-image: radial-gradient(#CBD5E1 1.5px, transparent 1.5px);
      background-size: 22px 22px; padding: 24px 16px 60px;
    }
    .container { max-width: 480px; margin: 0 auto; }
    .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .brand-wrap { display: inline-flex; align-items: center; text-decoration: none; position: relative; }
    .brand-badge {
      display: inline-flex; align-items: center; gap: 6px; background: var(--blue-primary);
      color: #FFFFFF; padding: 6px 14px; border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); transform: rotate(-1deg); position: relative; z-index: 2;
    }
    .brand-badge h1 { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 800; letter-spacing: 0.5px; }
    .brand-com-tag {
      font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 900;
      color: var(--blue-primary); position: relative; display: inline-block;
      transform: rotate(2deg); margin-left: 4px; margin-top: 2px; z-index: 1;
    }
    .brand-com-tag::after {
      content: ''; position: absolute; left: -24px; bottom: 0px; width: calc(100% + 28px); height: 6px;
      background: var(--accent-yellow); border-radius: 3px; z-index: 0;
    }
    .nav-btn {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 7px 14px; font-size: 12px; font-weight: 800; box-shadow: var(--shadow-hard-sm);
      display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--ink);
    }
    .hero-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); padding: 24px 20px; margin-bottom: 24px; position: relative;
    }
    .hero-pill {
      display: inline-flex; align-items: center; gap: 6px; background: var(--accent-yellow);
      border: 1.5px solid var(--ink); border-radius: 999px; padding: 4px 12px; font-size: 10.5px;
      font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 12px;
    }
    .hero-title { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 800; line-height: 1.25; color: var(--ink); margin-bottom: 10px; }
    .hero-title span { color: var(--blue-primary); text-decoration: underline; text-decoration-color: var(--accent-yellow); text-decoration-thickness: 4px; }
    .hero-desc { font-size: 13.5px; font-weight: 600; line-height: 1.55; color: #334155; margin-bottom: 18px; }
    .hero-cta-group { display: flex; flex-direction: column; gap: 8px; }
    .btn-primary-cta {
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick); border-radius: var(--radius-sm);
      padding: 12px; font-size: 13.5px; font-weight: 900; text-align: center; box-shadow: var(--shadow-hard);
      text-decoration: none; display: flex; justify-content: center; align-items: center; gap: 8px;
    }
    .btn-secondary-cta {
      background: #FFFFFF; color: var(--ink); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 10px; font-size: 13px; font-weight: 800; text-align: center; box-shadow: var(--shadow-hard-sm);
      text-decoration: none; display: flex; justify-content: center; align-items: center; gap: 6px;
    }
    .section-label {
      font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
    }
    .section-label::after { content: ''; flex: 1; height: 2px; background: var(--ink); }
    .ticket-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: hidden; margin-bottom: 24px;
    }
    .ticket-header {
      background: #0F172A; color: #FFFFFF; padding: 9px 12px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thick);
    }
    .ticket-id-group { display: flex; align-items: center; gap: 6px; }
    .ticket-id { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; font-weight: 800; color: var(--accent-yellow); background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; }
    .viral-badge { background: #EF4444; color: #FFFFFF; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: 900; display: inline-flex; align-items: center; gap: 3px; }
    .ticket-body { padding: 16px 14px 12px; background: #FFFFFF; }
    .stanza-chain-box { background: var(--bg-blue-subtle); border: var(--border-med); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 12px; }
    .stanza-item { padding: 7px 10px; background: #FFFFFF; border: 1.5px solid var(--ink); border-radius: 8px; margin-bottom: 6px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); }
    .stanza-item:last-child { margin-bottom: 0; border-left: 4px solid var(--blue-primary); }
    .stanza-top { font-size: 10px; font-weight: 800; color: var(--blue-deep); font-family: 'JetBrains Mono', monospace; margin-bottom: 2px; display: flex; justify-content: space-between; }
    .stanza-txt { font-size: 13px; font-weight: 700; line-height: 1.4; color: var(--ink); }
    .ai-bar { background: #EFF6FF; border-top: var(--border-thin); border-bottom: var(--border-thin); padding: 7px 12px; font-size: 11px; font-weight: 700; color: var(--blue-deep); display: flex; align-items: center; gap: 6px; }
    .pillars-grid { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
    .pillar-card { background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius-sm); padding: 14px; box-shadow: var(--shadow-hard); display: flex; gap: 12px; align-items: flex-start; }
    .pillar-icon-box { width: 38px; height: 38px; background: var(--blue-primary); color: #FFFFFF; border: 2px solid var(--ink); border-radius: 10px; display: grid; place-items: center; flex-shrink: 0; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); }
    .pillar-title { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
    .pillar-desc { font-size: 12px; font-weight: 600; color: #475569; line-height: 1.45; }
    .footer-cta-card { background: #0F172A; color: #FFFFFF; border: var(--border-thick); border-radius: var(--radius); padding: 20px; text-align: center; box-shadow: var(--shadow-hard-lg); }
    .footer-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 6px; }
    .footer-sub { font-size: 12px; color: #94A3B8; margin-bottom: 16px; }
    .btn-footer { background: var(--accent-yellow); color: var(--ink); border: var(--border-med); border-radius: var(--radius-sm); padding: 10px 20px; font-size: 13px; font-weight: 900; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; box-shadow: 2px 2px 0 #000000; }
    .ico { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-nav">
      <a href="/" class="brand-wrap">
        <div class="brand-badge">
          <svg class="ico" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h1>BERBIRRU</h1>
        </div>
        <span class="brand-com-tag">.com</span>
      </a>
      ${user ? `
        <a href="/u/${user.pen_name}" class="nav-btn">
          <svg class="ico" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span>@${user.pen_name}</span>
        </a>
      ` : `
        <a href="/login" class="nav-btn">
          <svg class="ico" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          <span>Masuk</span>
        </a>
      `}
    </div>

    <div class="hero-card">
      <div class="hero-pill">
        <svg class="ico" style="width:11px;height:11px;" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Pustaka Tulisan & Kolaborasi Kata</span>
      </div>
      <h2 class="hero-title">Merawat Rasa,<br><span>Menguntai Kata.</span></h2>
      <p class="hero-desc">Bukan media sosial yang bising. Tempat segala bentuk tulisan—dari puisi, kutipan, cerita kilat, resensi buku, hingga perenungan absurd—dicatat abadi dan disambung bersama.</p>
      <div class="hero-cta-group">
        <a href="${user ? '/feed' : '/login'}" class="btn-primary-cta">
          <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
          <span>Goreskan Tulisan Pertama</span>
        </a>
        <a href="/feed" class="btn-secondary-cta">
          <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span>Jelajahi Warkah Teranyar</span>
        </a>
      </div>
    </div>

    <div class="section-label"><span>BENTUK KARYA KOLABORASI</span></div>
    <div class="ticket-card">
      <div class="ticket-header" style="background:#1E40AF;">
        <div class="ticket-id-group">
          <span class="ticket-id" style="color:#60A5FA;">#UNTAIAN-8910</span>
          <span class="viral-badge" style="background:#FDE047;color:#0B192C;">
            <svg class="ico" style="width:10px;height:10px;" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
            3 PENULIS
          </span>
        </div>
        <span style="font-size:10.5px;color:#94A3B8;font-weight:700;">CONTOH NYATA</span>
      </div>
      <div class="ticket-body">
        <div class="stanza-chain-box">
          <div class="stanza-item">
            <div class="stanza-top"><span>BAGIAN 1 · @senja_kelabu</span><span>Jakarta</span></div>
            <div class="stanza-txt">"kotaku basah oleh hujan yang tak kunjung reda,"</div>
          </div>
          <div class="stanza-item">
            <div class="stanza-top"><span>BAGIAN 2 · @langit_biru</span><span>Bandung</span></div>
            <div class="stanza-txt">"seperti kepalaku yang penuh tanya tanpa jeda."</div>
          </div>
          <div class="stanza-item">
            <div class="stanza-top"><span>BAGIAN 3 · @damiyati</span><span>Tangerang</span></div>
            <div class="stanza-txt">"namun langkah kecil ini tetap kupaksa melangkah juga."</div>
          </div>
        </div>
      </div>
      <div class="ai-bar">
        <svg class="ico" style="color:#2563EB;" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
        <span>Tiga penulis lintas kota menyambung satu alur cerita.</span>
      </div>
    </div>

    <div class="section-label"><span>MENGAPA BERBIRRU?</span></div>
    <div class="pillars-grid">
      <div class="pillar-card">
        <div class="pillar-icon-box"><svg class="ico" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
        <div>
          <h3 class="pillar-title">Ruang Bebas Berekspresi</h3>
          <p class="pillar-desc">Dari bait puitis, kutipan buku, hingga cerita absurd. Karyamu bernilai tanpa tuntutan algoritma bising.</p>
        </div>
      </div>
      <div class="pillar-card">
        <div class="pillar-icon-box" style="background:#0F172A;"><svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
        <div>
          <h3 class="pillar-title">Estafet Tulisan Lintas Kota</h3>
          <p class="pillar-desc">Bukan sekadar komentar biasa. Sambung dan kembangkan cerita atau alur pemikiran bersama penulis lain.</p>
        </div>
      </div>
      <div class="pillar-card">
        <div class="pillar-icon-box" style="background:#2563EB;"><svg class="ico" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>
        <div>
          <h3 class="pillar-title">Pustaka Digital Personal</h3>
          <p class="pillar-desc">Semua goresan tulisan, catatan, dan resensimu terangkum rapi menjadi portofolio literasi yang estetik.</p>
        </div>
      </div>
    </div>

    <div class="footer-cta-card">
      <h3 class="footer-title">Mulai Goresan Pertamamu</h3>
      <p class="footer-sub">Masuk tanpa kata sandi rumit. Cukup gunakan email dan kode masuk instan.</p>
      <a href="${user ? '/feed' : '/login'}" class="btn-footer">
        <svg class="ico" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        <span>Mulai Sekarang</span>
      </a>
    </div>
  </div>
</body>
</html>`;
}
