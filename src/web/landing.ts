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
      --blue-deep: #0F3E99; --blue-light: #60A5FA; --accent-yellow: #FDE047;
      --border-thick: 3px solid var(--ink); --border-med: 2px solid var(--ink); --border-thin: 1.5px solid var(--ink);
      --shadow-hard: 4px 4px 0 var(--shadow-ink); --shadow-hard-lg: 6px 6px 0 var(--shadow-ink); --shadow-hard-sm: 2.5px 2.5px 0 var(--shadow-ink);
      --radius: 16px; --radius-sm: 10px;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg-main); color: var(--ink); min-height: 100vh;
      background-image: radial-gradient(#CBD5E1 1.5px, transparent 1.5px);
      background-size: 22px 22px; padding: 24px 16px 80px;
    }
    .container { max-width: 1080px; margin: 0 auto; width: 100%; }
    
    /* Top Navigation */
    .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
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
      gap: 24px;
      margin-bottom: 40px;
    }
    @media (min-width: 860px) {
      .hero-split-grid {
        grid-template-columns: 1.1fr 0.9fr;
        align-items: stretch;
        gap: 32px;
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

    /* Section Header */
    .section-label {
      font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px; margin: 32px 0 16px; display: flex; align-items: center; gap: 10px;
    }
    .section-label::after { content: ''; flex: 1; height: 2.5px; background: var(--ink); }

    /* 4 Feature Capabilities Grid */
    .features-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 32px;
    }
    @media (min-width: 640px) {
      .features-grid { grid-template-columns: repeat(2, 1fr); gap: 18px; }
    }
    @media (min-width: 960px) {
      .features-grid { grid-template-columns: repeat(4, 1fr); gap: 18px; }
    }
    .feature-box {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      padding: 18px 16px; box-shadow: var(--shadow-hard); display: flex; flex-direction: column;
      gap: 10px; height: 100%;
    }
    .feature-icon-box {
      width: 40px; height: 40px; background: var(--blue-primary); color: #FFFFFF;
      border: 2px solid var(--ink); border-radius: 10px; display: grid; place-items: center;
      box-shadow: 2px 2px 0 var(--shadow-ink);
    }
    .feature-title { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 800; color: var(--ink); }
    .feature-desc { font-size: 12.5px; font-weight: 600; color: #475569; line-height: 1.5; }

    /* Famous Poems & Quotes Grid */
    .quotes-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 36px;
    }
    @media (min-width: 768px) {
      .quotes-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
    }
    .quote-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); padding: 20px 18px; display: flex; flex-direction: column;
      justify-content: space-between; gap: 14px; position: relative;
    }
    .quote-author-row { display: flex; justify-content: space-between; align-items: center; }
    .quote-author-badge {
      font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 800; color: var(--ink);
      background: var(--bg-blue-subtle); padding: 3px 10px; border-radius: 6px; border: 1.5px solid var(--ink);
    }
    .quote-body-text { font-family: 'Newsreader', serif; font-size: 16.5px; font-style: italic; line-height: 1.6; color: #0F172A; }
    .quote-tag { font-size: 11px; font-weight: 700; color: #64748B; }

    /* AI & Human 2-Layer Moderation Card (Dark Shield Theme) */
    .moderation-card {
      background: #0F172A; color: #FFFFFF; border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); padding: 28px 22px; margin-bottom: 36px; position: relative;
    }
    @media (min-width: 860px) {
      .moderation-card { padding: 36px 32px; }
    }
    .mod-pill {
      display: inline-flex; align-items: center; gap: 6px; background: #10B981; color: #FFFFFF;
      padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 900;
      letter-spacing: 0.3px; margin-bottom: 14px; border: 1.5px solid #000;
    }
    .mod-title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 10px; line-height: 1.3; }
    @media (min-width: 860px) {
      .mod-title { font-size: 28px; }
    }
    .mod-desc { font-size: 14px; color: #CBD5E1; line-height: 1.6; margin-bottom: 24px; max-width: 800px; }
    
    .mod-layers-grid {
      display: grid; grid-template-columns: 1fr; gap: 16px;
    }
    @media (min-width: 768px) {
      .mod-layers-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
    }
    .mod-layer-box {
      background: rgba(255, 255, 255, 0.06); border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px; padding: 18px 16px; display: flex; flex-direction: column; gap: 8px;
    }
    .mod-layer-badge {
      display: inline-flex; align-items: center; gap: 6px; font-family: 'Space Grotesk', sans-serif;
      font-size: 13.5px; font-weight: 800; color: var(--accent-yellow);
    }
    .mod-layer-text { font-size: 12.5px; color: #94A3B8; line-height: 1.55; }

    /* Footer Banner Card */
    .footer-cta-card {
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick); border-radius: var(--radius);
      padding: 32px 24px; text-align: center; box-shadow: var(--shadow-hard-lg);
    }
    @media (min-width: 768px) {
      .footer-cta-card { padding: 48px 32px; }
    }
    .footer-title { font-family: 'Space Grotesk', sans-serif; font-size: 26px; font-weight: 800; margin-bottom: 8px; }
    .footer-sub { font-size: 14px; color: #DBEAFE; margin-bottom: 22px; max-width: 520px; margin-left: auto; margin-right: auto; }
    .btn-footer {
      background: var(--accent-yellow); color: var(--ink); border: var(--border-thick); border-radius: var(--radius-sm);
      padding: 12px 28px; font-size: 14px; font-weight: 900; text-decoration: none; display: inline-flex;
      align-items: center; gap: 8px; box-shadow: 3px 3px 0 #000000; transition: transform 0.05s ease;
    }
    .btn-footer:active { transform: translate(1.5px, 1.5px); box-shadow: none; }
    .ico { width: 15px; height: 15px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
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

    <!-- SECTION 1: APA YANG BISA DILAKUKAN DI BERBIRRU -->
    <div class="section-label">
      <span>Eksplorasi Tanpa Batas — Apa yang Bisa Kamu Lakukan?</span>
    </div>

    <div class="features-grid">
      <div class="feature-box">
        <div class="feature-icon-box">
          <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
        </div>
        <h3 class="feature-title">Goreskan Segala Bentuk Tulisan</h3>
        <p class="feature-desc">Mulai dari puisi, kutipan bermakna, micro-fiction, resensi buku, hingga cerita absurd. Lengkap dengan pilihan tipografi sastra Serif, Sans, dan Mono.</p>
      </div>

      <div class="feature-box">
        <div class="feature-icon-box" style="background:#0F3E99;">
          <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <h3 class="feature-title">Sambung Estafet Lintas Kota</h3>
        <p class="feature-desc">Lanjutkan bait warkah penulis lain dari kota berbeda dalam satu klik. Jadilah bagian dari rantai untaian karya kolaboratif yang terus hidup.</p>
      </div>

      <div class="feature-box">
        <div class="feature-icon-box" style="background:#059669;">
          <svg class="ico" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <h3 class="feature-title">Pustaka Antologi Paspor</h3>
        <p class="feature-desc">Setiap bait karyamu, riwayat warkah yang kamu sukai, dan simpanan tulisan favorit tersusun rapi dalam paspor antologi pribadimu selamanya.</p>
      </div>

      <div class="feature-box">
        <div class="feature-icon-box" style="background:#D97706;">
          <svg class="ico" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <h3 class="feature-title">Apresiasi Murni Tanpa Toxic</h3>
        <p class="feature-desc">Sistem feed berbasis gravitasi makna dan kesegaran rasa. Tanpa penghakiman jumlah followers, tanpa DM bising, dan tanpa tombol downvote.</p>
      </div>
    </div>

    <!-- SECTION 2: PUISI & KUTIPAN TOKOH TERKENAL -->
    <div class="section-label">
      <span>Ruang Inspirasi — Jejak Kata &amp; Perenungan Abadi</span>
    </div>

    <div class="quotes-grid">
      
      <!-- Sapardi Djoko Damono -->
      <div class="quote-card">
        <div class="quote-author-row">
          <span class="quote-author-badge">Sapardi Djoko Damono</span>
          <span class="quote-tag">Puisi Klasik</span>
        </div>
        <p class="quote-body-text">
          "Aku ingin mencintaimu dengan sederhana: dengan kata yang tak sempat diucapkan kayu kepada api yang menjadikannya abu."
        </p>
        <div style="font-size:11px;font-weight:700;color:#64748B;">Dari: Aku Ingin (1989)</div>
      </div>

      <!-- Chairil Anwar -->
      <div class="quote-card">
        <div class="quote-author-row">
          <span class="quote-author-badge">Chairil Anwar</span>
          <span class="quote-tag">Pelopor Sastra</span>
        </div>
        <p class="quote-body-text">
          "Aku ini binatang jalang, dari kumpulannya terbuang. Biar peluru menembus kulitku, aku tetap meradang menerjang."
        </p>
        <div style="font-size:11px;font-weight:700;color:#64748B;">Dari: Aku (1943)</div>
      </div>

      <!-- Pramoedya Ananta Toer -->
      <div class="quote-card">
        <div class="quote-author-row">
          <span class="quote-author-badge">Pramoedya Ananta Toer</span>
          <span class="quote-tag">Kutipan Sastra</span>
        </div>
        <p class="quote-body-text" style="font-family:'JetBrains Mono',monospace;font-size:14.5px;font-style:normal;">
          "Tahu kau mengapa aku sayangi kau lebih dari siapa pun? Karena kau menulis. Suaramu takkan padam ditelan angin, akan abadi sampai jauh di kemudian hari."
        </p>
        <div style="font-size:11px;font-weight:700;color:#64748B;">Dari: Anak Semua Bangsa</div>
      </div>

      <!-- Jalaluddin Rumi -->
      <div class="quote-card">
        <div class="quote-author-row">
          <span class="quote-author-badge">Jalaluddin Rumi</span>
          <span class="quote-tag">Perenungan Jiwa</span>
        </div>
        <p class="quote-body-text">
          "Jangan berduka. Apapun yang hilang darimu akan kembali dalam bentuk yang lain. Luka adalah tempat di mana cahaya memasuki jiwamu."
        </p>
        <div style="font-size:11px;font-weight:700;color:#64748B;">Kutipan Pencerahan</div>
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
        <!-- Layer 1: Edge-Native AI -->
        <div class="mod-layer-box">
          <div class="mod-layer-badge">
            <svg class="ico" style="width:16px;height:16px;" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>Lapis 1: AI Guardian di Edge Network</span>
          </div>
          <p class="mod-layer-text">
            Kecerdasan buatan (NLP &amp; Sentiment Analyzer) memindai setiap input warkah dalam hitungan milidetik secara senyap di level Cloudflare Edge. Konten toxic, bot spam, dan pelecehan otomatis dicegat sebelum sempat tampil di linimasa publik.
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

    <!-- SECTION 4: BOTTOM CTA BANNER CARD -->
    <div class="footer-cta-card">
      <h3 class="footer-title">Siap Menggoreskan Kata Pertamamu?</h3>
      <p class="footer-sub">Bergabunglah dengan ratusan penulis lainnya di seluruh Nusantara. Cukup daftarkan nama pena dan mulailah merawat rasa.</p>
      <a href="/login" class="btn-footer">
        <span>Buka Bilik Warkah</span>
        <svg class="ico" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
    </div>

  </div>
</body>
</html>`;
}
