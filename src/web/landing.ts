export function renderLandingPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BERBIRRU.COM — Pustaka Tulisan & Kolaborasi Kata</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@600;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-main: #F0F6FE; --bg-card: #FFFFFF; --bg-blue-subtle: #E0EEFD;
      --ink: #0B192C; --shadow-ink: #1E293B; --blue-primary: #1D61E7;
      --blue-deep: #0F3E99; --blue-light: #60A5FA; --accent-yellow: #FDE047; --accent-red: #EF4444;
      --border-thick: 3px solid var(--ink); --border-med: 2px solid var(--ink); --border-thin: 1.5px solid var(--ink);
      --shadow-hard: 4px 4px 0 var(--shadow-ink); --shadow-hard-lg: 6px 6px 0 var(--shadow-ink); --shadow-hard-sm: 2.5px 2.5px 0 var(--shadow-ink);
      --radius: 16px; --radius-sm: 10px;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg-main); color: var(--ink); min-height: 100vh;
      background-image: radial-gradient(#CBD5E1 1.5px, transparent 1.5px);
      background-size: 22px 22px; padding: 18px 0 0;
      display: flex; flex-direction: column;
    }
    .container { max-width: 1080px; margin: 0 auto; width: 100%; padding: 0 16px; flex: 1; }
    
    /* Top Navigation */
    .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    @media (min-width: 860px) {
      .top-nav { margin-bottom: 32px; }
    }
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
      padding: 8px 18px; font-size: 13px; font-weight: 800; box-shadow: var(--shadow-hard-sm);
      display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--ink);
      transition: transform 0.05s ease;
    }
    .nav-btn:active { transform: translate(1.5px, 1.5px); box-shadow: none; }

    /* Desktop Responsive Hero Grid Layout */
    .hero-split-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    @media (min-width: 860px) {
      .hero-split-grid {
        grid-template-columns: 1.1fr 0.9fr;
        align-items: stretch;
        gap: 32px;
        margin-bottom: 40px;
      }
    }

    .hero-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); padding: 28px 24px; display: flex; flex-direction: column;
      justify-content: space-between; position: relative;
    }
    @media (min-width: 860px) {
      .hero-card { padding: 36px 32px; }
    }
    .hero-pill {
      display: inline-flex; align-items: center; gap: 6px; background: var(--accent-yellow);
      border: 1.5px solid var(--ink); border-radius: 999px; padding: 4px 12px; font-size: 11px;
      font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 16px; align-self: flex-start;
    }
    .hero-title { font-family: 'Space Grotesk', sans-serif; font-size: 32px; font-weight: 800; line-height: 1.2; color: var(--ink); margin-bottom: 14px; }
    @media (min-width: 860px) {
      .hero-title { font-size: 40px; }
    }
    .hero-title span { color: var(--blue-primary); text-decoration: underline; text-decoration-color: var(--accent-yellow); text-decoration-thickness: 5px; }
    .hero-desc { font-size: 15px; font-weight: 600; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    
    .hero-cta-group { display: flex; flex-direction: column; gap: 10px; }
    @media (min-width: 540px) {
      .hero-cta-group { flex-direction: row; }
    }
    .btn-primary-cta {
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick); border-radius: var(--radius-sm);
      padding: 12px 22px; font-size: 14px; font-weight: 900; text-align: center; box-shadow: var(--shadow-hard);
      text-decoration: none; display: inline-flex; justify-content: center; align-items: center; gap: 8px;
      flex: 1; transition: transform 0.05s ease;
    }
    .btn-primary-cta:active { transform: translate(2px, 2px); box-shadow: none; }
    .btn-secondary-cta {
      background: #FFFFFF; color: var(--ink); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 12px 20px; font-size: 13.5px; font-weight: 800; text-align: center; box-shadow: var(--shadow-hard-sm);
      text-decoration: none; display: inline-flex; justify-content: center; align-items: center; gap: 6px;
      flex: 1; transition: transform 0.05s ease;
    }
    .btn-secondary-cta:active { transform: translate(1.5px, 1.5px); box-shadow: none; }

    /* Estafet Bait Lintas Kota Card (Right Column) */
    .estafet-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: hidden; display: flex; flex-direction: column;
      justify-content: space-between;
    }
    .estafet-header {
      background: #0F172A; color: #FFFFFF; padding: 10px 14px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thick);
    }
    .estafet-badge { background: var(--accent-yellow); color: var(--ink); padding: 3px 8px; border-radius: 6px; font-size: 10.5px; font-weight: 900; font-family: 'JetBrains Mono', monospace; }
    .estafet-body { padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; background: #FFFFFF; }
    
    .stanza-step {
      background: #F8FAFC; border: 1.5px solid var(--ink); border-radius: 10px; padding: 10px 12px;
      box-shadow: 2px 2px 0 var(--shadow-ink); position: relative;
    }
    .stanza-step:last-child {
      border-left: 4.5px solid var(--blue-primary);
      background: var(--bg-blue-subtle);
    }
    .stanza-meta {
      display: flex; justify-content: space-between; font-size: 10px; font-weight: 800;
      color: #64748B; margin-bottom: 4px; font-family: 'JetBrains Mono', monospace;
    }
    .stanza-meta b { color: var(--blue-primary); }
    .stanza-quote { font-size: 13px; font-weight: 700; color: #0F172A; line-height: 1.45; }

    .estafet-footer {
      padding: 10px 14px; background: #F8FAFC; border-top: var(--border-thin);
      display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; font-weight: 800;
    }

    /* Compact Spacing Across All Sections */
    .section-label {
      font-family: 'Space Grotesk', sans-serif; font-size: 13.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px; margin: 16px 0 10px; display: flex; align-items: center; gap: 8px;
    }
    @media (min-width: 860px) {
      .section-label { font-size: 15px; margin: 24px 0 14px; gap: 10px; }
    }
    .section-label::after { content: ''; flex: 1; height: 2px; background: var(--ink); }

    /* Capabilities Section */
    .mobile-features-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin-bottom: 16px;
    }
    @media (min-width: 520px) {
      .mobile-features-grid {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
    }
    @media (min-width: 860px) {
      .mobile-features-grid { display: none; }
    }

    .desktop-marquee-viewport {
      display: none;
    }
    @media (min-width: 860px) {
      .desktop-marquee-viewport {
        display: block; width: 100%; overflow: hidden; position: relative;
        margin-bottom: 24px; padding: 4px 0 10px;
      }
      .marquee-track {
        display: flex; gap: 16px; width: max-content;
        animation: marqueeScroll 26s linear infinite;
      }
      .marquee-track:hover { animation-play-state: paused; }
    }

    .quotes-feed-grid {
      display: grid; grid-template-columns: 1fr; gap: 18px; margin-bottom: 20px;
    }
    @media (min-width: 768px) {
      .quotes-feed-grid { grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
    }
    .thread-header-soft {
      background: var(--bg-blue-subtle); padding: 8px 12px 8px 68px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin); border-top-left-radius: 13px; border-top-right-radius: 13px;
      min-height: 44px; position: relative;
    }
    .thread-avatar-clip {
      position: absolute; left: 10px; top: -14px; width: 48px; height: 50px;
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: 12px; display: grid; place-items: center; font-family: 'Space Grotesk', sans-serif;
      font-size: 23px; font-weight: 900; box-shadow: none; transform: rotate(-2deg); z-index: 5;
    }
    .paperclip-svg {
      position: absolute; top: -10px; right: -7px; width: 18px; height: 28px;
      z-index: 6; transform: rotate(18deg); filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.25));
    }
    .thread-author-info { display: flex; flex-direction: column; line-height: 1.25; }
    .thread-pen-name { font-size: 13px; font-weight: 800; color: var(--ink); }
    .thread-city { font-size: 10px; font-weight: 700; color: #64748B; }
    .thread-timestamp-stack {
      display: flex; flex-direction: column; align-items: flex-end; line-height: 1.25;
      font-family: 'JetBrains Mono', monospace;
    }
    .time-main { font-size: 11px; font-weight: 800; color: var(--ink); }
    .date-sub { font-size: 9.5px; font-weight: 700; color: #64748B; }

    .thread-body { padding: 14px 14px 12px; }
    .thread-title { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 800; color: var(--ink); margin-bottom: 6px; }
    .thread-text { font-size: 14px; font-weight: 600; line-height: 1.6; color: #0F172A; }
    .thread-text blockquote {
      background: #F8FAFC; border-left: 3.5px solid var(--ink); padding: 10px 14px;
      margin: 8px 0; font-style: italic; border-radius: 4px; color: #334155;
    }
    .thread-footer { padding: 8px 12px; background: #FFFFFF; border-top: var(--border-thin); display: flex; justify-content: space-between; align-items: center; border-bottom-left-radius: 13px; border-bottom-right-radius: 13px; }
    .actions-left { display: flex; gap: 6px; }
    .act-btn-mock {
      background: var(--bg-main); border: var(--border-thin); border-radius: var(--radius-sm);
      padding: 5px 10px; font-size: 11.5px; font-weight: 800; display: inline-flex; align-items: center; gap: 5px;
    }
    .chain-btn-mock {
      background: var(--accent-yellow); color: var(--ink); border: var(--border-thin);
      border-radius: var(--radius-sm); padding: 5px 12px; font-size: 11.5px; font-weight: 900;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .moderation-card {
      background: #0F172A; color: #FFFFFF; border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); padding: 20px 16px; margin-bottom: 20px; position: relative;
    }
    @media (min-width: 860px) {
      .moderation-card { padding: 28px 24px; margin-bottom: 24px; }
    }
    .mod-pill {
      display: inline-flex; align-items: center; gap: 6px; background: #10B981; color: #FFFFFF;
      padding: 3px 10px; border-radius: 999px; font-size: 10.5px; font-weight: 900;
      letter-spacing: 0.3px; margin-bottom: 10px; border: 1.5px solid #000;
    }
    .mod-title { font-family: 'Space Grotesk', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 8px; line-height: 1.25; }
    @media (min-width: 860px) {
      .mod-title { font-size: 24px; }
    }
    .mod-desc { font-size: 13px; color: #CBD5E1; line-height: 1.5; margin-bottom: 16px; max-width: 800px; }
    
    .mod-layers-grid {
      display: grid; grid-template-columns: 1fr; gap: 10px;
    }
    @media (min-width: 768px) {
      .mod-layers-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
    }
    .mod-layer-box {
      background: rgba(255, 255, 255, 0.06); border: 1.5px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px; padding: 14px 12px; display: flex; flex-direction: column; gap: 6px;
    }

    /* Edge-to-Edge Footer: Langsung Menempel Rapat */
    .main-footer {
      width: 100%;
      background: #0F172A;
      color: #FFFFFF;
      border-top: var(--border-thick);
      border-radius: 0;
      box-shadow: none;
      padding: 24px 16px 20px;
      margin-top: 10px;
    }
    .footer-inner-container {
      max-width: 1080px;
      margin: 0 auto;
      width: 100%;
    }
    @media (min-width: 768px) {
      .main-footer { padding: 36px 24px 28px; margin-top: 20px; }
    }
    .footer-top-grid {
      display: grid; grid-template-columns: 1fr; gap: 18px; border-bottom: 1.5px dashed rgba(255,255,255,0.2);
      padding-bottom: 18px; margin-bottom: 16px;
    }
    @media (min-width: 768px) {
      .footer-top-grid { grid-template-columns: 1.2fr 1fr 1fr; gap: 24px; }
    }
    .footer-brand-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; color: #FFFFFF; margin-bottom: 8px; }
    .footer-brand-desc { font-size: 13px; color: #94A3B8; line-height: 1.6; }
    
    .footer-col-title { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 800; color: var(--accent-yellow); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer-links { display: flex; flex-direction: column; gap: 8px; }
    .footer-link { font-size: 13px; color: #CBD5E1; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .footer-link:hover { color: var(--accent-yellow); }
    
    .contact-card-box {
      background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; font-size: 12px; color: #E2E8F0;
    }
    .contact-card-box a { color: var(--accent-yellow); font-family: 'JetBrains Mono', monospace; font-weight: 700; text-decoration: none; }
    
    .footer-bottom-row {
      display: flex; flex-direction: column; gap: 10px; align-items: center; text-align: center;
      font-size: 12px; color: #64748B; font-weight: 600;
    }
    @media (min-width: 768px) {
      .footer-bottom-row { flex-direction: row; justify-content: space-between; text-align: left; }
    }

    .ico { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Top Navigation Header -->
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

    <!-- Responsive Hero Split (Desktop 2 Columns) -->
    <div class="hero-split-grid">
      
      <!-- Left Hero Card -->
      <div class="hero-card">
        <div>
          <div class="hero-pill">
            <svg class="ico" style="width:11px;height:11px;" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <span>Pustaka Tulisan &amp; Kolaborasi Kata</span>
          </div>
          <h2 class="hero-title">
            Merawat Rasa,<br>
            <span>Menguntai Kata.</span>
          </h2>
          <p class="hero-desc">
            Bukan media sosial yang bising. Tempat segala bentuk tulisan—dari bait puisi, kutipan bermakna, cerita kilat, resensi buku, hingga perenungan absurd—dicatat abadi, saling terhubung, dan dilanjutkan bersama lintas kota.
          </p>
        </div>
        <div class="hero-cta-group">
          <a href="/login" class="btn-primary-cta">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
            <span>Goreskan Tulisan</span>
          </a>
          <a href="/feed" class="btn-secondary-cta">
            <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <span>Jelajahi Warkah</span>
          </a>
        </div>
      </div>

      <!-- Right Column: Mockup Estafet Bait Lintas Kota (#UNTAIAN-8910) -->
      <div class="estafet-card">
        <div class="estafet-header">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="estafet-badge">#UNTAIAN-8910</span>
            <span style="font-size:11px;font-weight:800;color:#94A3B8;">3 Penulis Lintas Kota</span>
          </div>
          <span style="font-size:10px;font-weight:800;color:var(--accent-yellow);font-family:'JetBrains Mono',monospace;">CONTOH NYATA</span>
        </div>

        <div class="estafet-body">
          <div class="stanza-step">
            <div class="stanza-meta">
              <span>BAGIAN 1 · <b>@senja_kelabu</b></span>
              <span>Jakarta</span>
            </div>
            <div class="stanza-quote">"kotaku basah oleh hujan yang tak kunjung reda,"</div>
          </div>

          <div class="stanza-step">
            <div class="stanza-meta">
              <span>BAGIAN 2 · <b>@langit_biru</b></span>
              <span>Bandung</span>
            </div>
            <div class="stanza-quote">"seperti kepalaku yang penuh tanya tanpa jeda,"</div>
          </div>

          <div class="stanza-step">
            <div class="stanza-meta">
              <span>BAGIAN 3 · <b>@penyair_nusantara</b></span>
              <span>Yogyakarta</span>
            </div>
            <div class="stanza-quote">"namun di sudut cangkir kopi ini, kita tahu cara merawat jeda bersama."</div>
          </div>
        </div>

        <div class="estafet-footer">
          <span style="color:#1D61E7;display:inline-flex;align-items:center;gap:4px;">
            <svg class="ico" style="width:12px;height:12px;" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Untaian Bersambung
          </span>
          <span style="color:#64748B;">42 Terpaut · 18 Simpan</span>
        </div>
      </div>

    </div>

    <!-- SECTION 1: EKSPLORASI FITUR -->
    <div class="section-label">
      <span>Eksplorasi Tanpa Batas — Apa yang Bisa Kamu Lakukan?</span>
    </div>

    <!-- Mobile View: Clean Compact Grid -->
    <div class="mobile-features-grid">
      <div class="feature-box">
        <div class="feature-icon-box">
          <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
        </div>
        <h3 class="feature-title">Goreskan Segala Bentuk Tulisan</h3>
        <p class="feature-desc">Mulai dari puisi, kutipan bermakna, micro-fiction, resensi buku, hingga cerita absurd dengan tipografi Serif, Sans, dan Mono.</p>
      </div>

      <div class="feature-box">
        <div class="feature-icon-box" style="background:#0F3E99;">
          <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <h3 class="feature-title">Sambung Estafet Lintas Kota</h3>
        <p class="feature-desc">Lanjutkan bait warkah penulis lain dari kota berbeda dalam satu klik. Jadilah bagian dari rantai untaian karya kolaboratif.</p>
      </div>

      <div class="feature-box">
        <div class="feature-icon-box" style="background:#059669;">
          <svg class="ico" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <h3 class="feature-title">Pustaka Antologi Paspor</h3>
        <p class="feature-desc">Setiap bait karyamu, riwayat warkah yang disukai, dan simpanan favorit tersusun rapi dalam paspor antologi pribadimu.</p>
      </div>

      <div class="feature-box">
        <div class="feature-icon-box" style="background:#D97706;">
          <svg class="ico" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <h3 class="feature-title">Apresiasi Murni Bebas Toxic</h3>
        <p class="feature-desc">Sistem feed berbasis gravitasi makna dan kesegaran rasa. Tanpa tekanan angka followers dan tanpa DM bising.</p>
      </div>
    </div>

    <!-- Desktop View: Infinite Marquee Track -->
    <div class="desktop-marquee-viewport">
      <div class="marquee-track">
        <!-- Set 1 -->
        <div class="feature-box">
          <div class="feature-icon-box">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
          </div>
          <h3 class="feature-title">Goreskan Segala Bentuk Tulisan</h3>
          <p class="feature-desc">Mulai dari puisi, kutipan bermakna, micro-fiction, resensi buku, hingga cerita absurd dengan tipografi Serif, Sans, dan Mono.</p>
        </div>

        <div class="feature-box">
          <div class="feature-icon-box" style="background:#0F3E99;">
            <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <h3 class="feature-title">Sambung Estafet Lintas Kota</h3>
          <p class="feature-desc">Lanjutkan bait warkah penulis lain dari kota berbeda dalam satu klik. Jadilah bagian dari rantai untaian karya kolaboratif.</p>
        </div>

        <div class="feature-box">
          <div class="feature-icon-box" style="background:#059669;">
            <svg class="ico" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <h3 class="feature-title">Pustaka Antologi Paspor</h3>
          <p class="feature-desc">Setiap bait karyamu, riwayat warkah yang disukai, dan simpanan favorit tersusun rapi dalam paspor antologi pribadimu.</p>
        </div>

        <div class="feature-box">
          <div class="feature-icon-box" style="background:#D97706;">
            <svg class="ico" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <h3 class="feature-title">Apresiasi Murni Bebas Toxic</h3>
          <p class="feature-desc">Sistem feed berbasis gravitasi makna dan kesegaran rasa. Tanpa tekanan angka followers dan tanpa DM bising.</p>
        </div>

        <!-- Duplicated for Seamless Loop on Desktop -->
        <div class="feature-box">
          <div class="feature-icon-box">
            <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
          </div>
          <h3 class="feature-title">Goreskan Segala Bentuk Tulisan</h3>
          <p class="feature-desc">Mulai dari puisi, kutipan bermakna, micro-fiction, resensi buku, hingga cerita absurd dengan tipografi Serif, Sans, dan Mono.</p>
        </div>

        <div class="feature-box">
          <div class="feature-icon-box" style="background:#0F3E99;">
            <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <h3 class="feature-title">Sambung Estafet Lintas Kota</h3>
          <p class="feature-desc">Lanjutkan bait warkah penulis lain dari kota berbeda dalam satu klik. Jadilah bagian dari rantai untaian karya kolaboratif.</p>
        </div>

        <div class="feature-box">
          <div class="feature-icon-box" style="background:#059669;">
            <svg class="ico" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          </div>
          <h3 class="feature-title">Pustaka Antologi Paspor</h3>
          <p class="feature-desc">Setiap bait karyamu, riwayat warkah yang disukai, dan simpanan favorit tersusun rapi dalam paspor antologi pribadimu.</p>
        </div>

        <div class="feature-box">
          <div class="feature-icon-box" style="background:#D97706;">
            <svg class="ico" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <h3 class="feature-title">Apresiasi Murni Bebas Toxic</h3>
          <p class="feature-desc">Sistem feed berbasis gravitasi makna dan kesegaran rasa. Tanpa tekanan angka followers dan tanpa DM bising.</p>
        </div>
      </div>
    </div>

    <!-- SECTION 2: QUOTES FEED 100% UNIFIED HOME FEED DESIGN -->
    <div class="section-label">
      <span>Ruang Inspirasi — Jejak Kata &amp; Perenungan Abadi</span>
    </div>

    <div class="quotes-feed-grid">
      
      <!-- 1. Sapardi Djoko Damono -->
      <div class="thread-card">
        <div class="thread-header-soft">
          <div class="thread-avatar-clip">
            S
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
          <div class="thread-text" style="font-family:'Newsreader',serif;font-size:15.5px;line-height:1.7;">
            "Aku ingin mencintaimu dengan sederhana: dengan kata yang tak sempat diucapkan kayu kepada api yang menjadikannya abu.<br><br>Aku ingin mencintaimu dengan sederhana: dengan isyarat yang tak sempat disampaikan awan kepada hujan yang menjadikannya tiada."
          </div>
        </div>
        <div class="thread-footer">
          <div class="actions-left">
            <span class="act-btn-mock" style="background:#EF4444;color:#FFF;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>9.4k Terpaut</span>
            </span>
            <span class="act-btn-mock" style="background:#1D61E7;color:#FFF;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span>4.2k Simpan</span>
            </span>
          </div>
          <span class="chain-btn-mock">
            <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>890 Sambungan</span>
          </span>
        </div>
      </div>

      <!-- 2. Chairil Anwar -->
      <div class="thread-card">
        <div class="thread-header-soft">
          <div class="thread-avatar-clip" style="background:#0F3E99;">
            C
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
          <div class="thread-text" style="font-family:'Space Grotesk',sans-serif;font-weight:700;">
            "Aku ini binatang jalang, dari kumpulannya terbuang.<br>Biar peluru menembus kulitku, aku tetap meradang menerjang.<br><br>Luka dan bisa kubawa berlari, berlari hingga hilang pedih peri. Dan aku akan lebih tidak perduli. Aku mau hidup seribu tahun lagi."
          </div>
        </div>
        <div class="thread-footer">
          <div class="actions-left">
            <span class="act-btn-mock" style="background:#EF4444;color:#FFF;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>14.8k Terpaut</span>
            </span>
            <span class="act-btn-mock" style="background:#1D61E7;color:#FFF;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span>6.1k Simpan</span>
            </span>
          </div>
          <span class="chain-btn-mock">
            <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>1.2k Sambungan</span>
          </span>
        </div>
      </div>

      <!-- 3. Pramoedya Ananta Toer -->
      <div class="thread-card">
        <div class="thread-header-soft">
          <div class="thread-avatar-clip" style="background:#059669;">
            P
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
          <div class="thread-text">
            <blockquote>
              "Tahu kau mengapa aku sayangi kau lebih dari siapa pun? Karena kau menulis. Suaramu takkan padam ditelan angin, akan abadi sampai jauh di kemudian hari."
            </blockquote>
          </div>
        </div>
        <div class="thread-footer">
          <div class="actions-left">
            <span class="act-btn-mock" style="background:#EF4444;color:#FFF;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>18.2k Terpaut</span>
            </span>
            <span class="act-btn-mock" style="background:#1D61E7;color:#FFF;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span>9.5k Simpan</span>
            </span>
          </div>
          <span class="chain-btn-mock">
            <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>2.4k Sambungan</span>
          </span>
        </div>
      </div>

      <!-- 4. Jalaluddin Rumi -->
      <div class="thread-card">
        <div class="thread-header-soft">
          <div class="thread-avatar-clip" style="background:#D97706;">
            R
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
          <div class="thread-text">
            <blockquote>
              "Jangan berduka. Apapun yang hilang darimu akan kembali dalam bentuk yang lain. Luka adalah tempat di mana cahaya memasuki jiwamu."
            </blockquote>
          </div>
        </div>
        <div class="thread-footer">
          <div class="actions-left">
            <span class="act-btn-mock" style="background:#EF4444;color:#FFF;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>22.5k Terpaut</span>
            </span>
            <span class="act-btn-mock" style="background:#1D61E7;color:#FFF;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              <span>11.3k Simpan</span>
            </span>
          </div>
          <span class="chain-btn-mock">
            <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>3.1k Sambungan</span>
          </span>
        </div>
      </div>

    </div>

    <!-- SECTION 3: 2-LAYER SAFE SPACE (AI + HUMAN SHIELD) -->
    <div class="moderation-card">
      <div class="mod-pill">
        <svg class="ico" style="width:12px;height:12px;" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>Ruang Aman Terkurasi</span>
      </div>
      <h3 class="mod-title">Platform Bersih Bebas Racun: Proteksi 2 Lapis (AI &amp; Manusia)</h3>
      <p class="mod-desc">
        Berbirru dirancang khusus sebagai oase yang menenangkan pikiran. Setiap tulisan yang dipublikasikan dijaga ketat dari ujaran kebencian, pelecehan, spam, dan konten destruktif melalui sistem keamanan terpadu:
      </p>

      <div class="mod-layers-grid">
        <!-- Layer 1: Intelligent AI -->
        <div class="mod-layer-box">
          <div class="mod-layer-badge">
            <svg class="ico" style="width:16px;height:16px;" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Lapis 1: AI Guardian Pelindung Ruang</span>
          </div>
          <p class="mod-layer-text">
            Sistem kecerdasan buatan memindai setiap naskah warkah dalam hitungan milidetik secara otomatis. Konten toxic, ujaran kebencian, dan pelecehan otomatis dicegat sebelum sempat tampil di linimasa publik.
          </p>
        </div>

        <!-- Layer 2: Human Curator -->
        <div class="mod-layer-box">
          <div class="mod-layer-badge">
            <svg class="ico" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Lapis 2: Kurasi Manusia &amp; Etika Komunitas</span>
          </div>
          <p class="mod-layer-text">
            Tim kurator manusia dan moderasi berbasis komunitas memastikan estetika karya, etika estafet kata bersama, serta iklim literasi yang saling menguatkan tetap terjaga dengan penuh rasa hormat.
          </p>
        </div>
      </div>
    </div>

    </div> <!-- End .container -->

    <!-- Full-Bleed Edge-to-Edge Footer -->
    <footer class="main-footer">
      <div class="footer-inner-container">
        <div class="footer-top-grid">
          <div>
            <div class="footer-brand-title">BERBIRRU.COM</div>
            <p class="footer-brand-desc">
              Pustaka warkah dan ruang kolaborasi rasa. Merawat setiap bait kata, perenungan hidup, dan cerita lintas kota tanpa distraksi algoritma bising.
            </p>
          </div>

          <div>
            <div class="footer-col-title">Navigasi Pustaka</div>
            <div class="footer-links">
              <a href="/feed" class="footer-link">
                <svg class="ico" style="width:12px;height:12px;" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                <span>Beranda Warkah</span>
              </a>
              <a href="/feed?tab=search" class="footer-link">
                <svg class="ico" style="width:12px;height:12px;" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                <span>Telusuri Penulis &amp; Bait</span>
              </a>
              <a href="/login" class="footer-link">
                <svg class="ico" style="width:12px;height:12px;" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                <span>Masuk / Buka Bilik Warkah</span>
              </a>
            </div>
          </div>

          <div>
            <div class="footer-col-title">Pusat Hubungan</div>
            <div class="contact-card-box">
              <span style="display:block;color:#94A3B8;margin-bottom:2px;">Kolaborasi &amp; Kerjasama:</span>
              <a href="mailto:admin@berbirru.com">admin@berbirru.com</a>
            </div>
            <div class="contact-card-box">
              <span style="display:block;color:#94A3B8;margin-bottom:2px;">Laporan Bug &amp; Teknis:</span>
              <a href="mailto:depelover@berbirru.com">depelover@berbirru.com</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom-row">
          <span>© 2026 BERBIRRU.COM · Dirawat dengan rasa dan integritas karya.</span>
          <span>Bebas Iklan · Bebas Pelacak Pihak Ketiga</span>
        </div>
      </div>
    </footer>
</body>
</html>`;
}
