export function renderLandingPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BERBIRRU.COM — Pustaka Tulisan & Kolaborasi Kata</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@600;800&display=swap" rel="stylesheet">
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
      margin-bottom: 36px;
    }
    @media (min-width: 860px) {
      .hero-split-grid {
        grid-template-columns: 1.15fr 0.85fr;
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

    /* Interactive Sample Preview Card on Desktop Right Column */
    .sample-preview-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: visible; position: relative; display: flex;
      flex-direction: column; justify-content: space-between;
    }
    .sample-header-soft {
      background: var(--bg-blue-subtle); padding: 12px 14px 10px 72px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin); border-top-left-radius: 13px; border-top-right-radius: 13px;
      position: relative; min-height: 48px;
    }
    .sample-avatar-clip {
      position: absolute; left: 12px; top: -14px; width: 48px; height: 50px;
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: 12px; display: grid; place-items: center; font-family: 'Space Grotesk', sans-serif;
      font-size: 23px; font-weight: 900; box-shadow: none; transform: rotate(-2deg); z-index: 5;
    }
    .paperclip-svg {
      position: absolute; top: -10px; right: -7px; width: 18px; height: 28px;
      z-index: 6; transform: rotate(18deg); filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.25));
    }
    .sample-body { padding: 20px 18px 16px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
    .sample-title { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; color: var(--ink); }
    .sample-text { font-size: 15px; font-weight: 600; line-height: 1.65; color: #1E293B; }
    .sample-text blockquote {
      background: #F8FAFC; border-left: 3.5px solid var(--ink); padding: 10px 14px;
      margin: 8px 0; font-style: italic; border-radius: 4px; color: #334155;
    }
    .sample-footer {
      padding: 12px 16px; background: #FFFFFF; border-top: var(--border-thin);
      display: flex; justify-content: space-between; align-items: center;
      border-bottom-left-radius: 13px; border-bottom-right-radius: 13px;
    }

    /* 3 Pillars Grid Section (Desktop 3 Columns) */
    .section-label {
      font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
    }
    .section-label::after { content: ''; flex: 1; height: 2.5px; background: var(--ink); }

    .pillars-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 36px;
    }
    @media (min-width: 768px) {
      .pillars-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
    }
    .pillar-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      padding: 20px 18px; box-shadow: var(--shadow-hard); display: flex; flex-direction: column;
      gap: 12px; height: 100%;
    }
    .pillar-icon-box {
      width: 42px; height: 42px; background: var(--blue-primary); color: #FFFFFF;
      border: 2px solid var(--ink); border-radius: 12px; display: grid; place-items: center;
      box-shadow: 2px 2px 0 var(--shadow-ink);
    }
    .pillar-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 800; color: var(--ink); }
    .pillar-desc { font-size: 13px; font-weight: 600; color: #475569; line-height: 1.55; }

    /* Footer Banner Card */
    .footer-cta-card {
      background: #0F172A; color: #FFFFFF; border: var(--border-thick); border-radius: var(--radius);
      padding: 32px 24px; text-align: center; box-shadow: var(--shadow-hard-lg);
    }
    @media (min-width: 768px) {
      .footer-cta-card { padding: 48px 32px; }
    }
    .footer-title { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .footer-sub { font-size: 14px; color: #94A3B8; margin-bottom: 22px; max-width: 500px; margin-left: auto; margin-right: auto; }
    .btn-footer {
      background: var(--accent-yellow); color: var(--ink); border: var(--border-med); border-radius: var(--radius-sm);
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
            Bukan media sosial yang bising. Tempat segala bentuk tulisan—dari bait puisi, kutipan bermakna, cerita kilat, resensi buku, hingga perenungan absurd—dicatat abadi, saling terhubung, dan dilanjutkan bersama.
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

      <!-- Right Interactive Sample Card -->
      <div class="sample-preview-card">
        <div class="sample-header-soft">
          <div class="sample-avatar-clip">
            P
            <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </div>
          <div style="display:flex;flex-direction:column;line-height:1.25;">
            <span style="font-size:13px;font-weight:800;color:var(--ink);">@penyair_nusantara</span>
            <span style="font-size:10px;font-weight:700;color:#64748B;">Yogyakarta</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;line-height:1.25;font-family:'JetBrains Mono',monospace;">
            <span style="font-size:11px;font-weight:800;color:var(--ink);">12.20 WIB</span>
            <span style="font-size:9.5px;font-weight:700;color:#64748B;">08 Okt 2026</span>
          </div>
        </div>

        <div class="sample-body">
          <h3 class="sample-title">Kucing Oren yang Menolak Realita</h3>
          <p class="sample-text">
            Tadi pagi jam 03.14, seekor kucing oren menatapku lurus selama 7 menit tanpa berkedip. Aku yakin dia sedang memikirkan <span style="font-family:'JetBrains Mono',monospace;background:#E0EEFD;padding:1px 5px;border-radius:4px;font-size:13.5px;">rumus eksistensialisme semesta</span> atau sekadar menghakimi kebiasaanku begadang.
          </p>
          <blockquote>
            "Memaafkan bukan berarti melupakan, melainkan mengizinkan masa lalu berhenti menyakiti hari ini."
          </blockquote>
        </div>

        <div class="sample-footer">
          <div style="display:flex;gap:6px;">
            <span style="background:#EF4444;color:#FFF;padding:4px 10px;border-radius:6px;font-size:11.5px;font-weight:800;display:inline-flex;align-items:center;gap:4px;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              12 Terpaut
            </span>
            <span style="background:#1D61E7;color:#FFF;padding:4px 10px;border-radius:6px;font-size:11.5px;font-weight:800;display:inline-flex;align-items:center;gap:4px;">
              <svg style="width:11px;height:11px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              4 Simpan
            </span>
          </div>
          <span style="background:#FDE047;color:var(--ink);padding:4px 10px;border:1.5px solid var(--ink);border-radius:6px;font-size:11.5px;font-weight:900;">
            3 Sambungan
          </span>
        </div>
      </div>

    </div>

    <!-- 3 Pillars Section (Desktop 3 Columns Grid) -->
    <div class="section-label">
      <span>Mengapa Berbirru Berbeda</span>
    </div>

    <div class="pillars-grid">
      <div class="pillar-card">
        <div class="pillar-icon-box">
          <svg class="ico" style="width:20px;height:20px;" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h3 class="pillar-title">Ruang Bebas Berekspresi</h3>
        <p class="pillar-desc">Tanpa algoritma toxic, tanpa tekanan followers publik, dan tanpa pesan bising. Tulisanmu dihargai murni atas rasa dan maknanya.</p>
      </div>

      <div class="pillar-card">
        <div class="pillar-icon-box">
          <svg class="ico" style="width:20px;height:20px;" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </div>
        <h3 class="pillar-title">Estafet Tulisan Lintas Kota</h3>
        <p class="pillar-desc">Sambung bait puisi, lanjutkan cerita absurd, atau lengkapi perenungan bersama penulis lain dari berbagai kota di Nusantara.</p>
      </div>

      <div class="pillar-card">
        <div class="pillar-icon-box">
          <svg class="ico" style="width:20px;height:20px;" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <h3 class="pillar-title">Pustaka Digital Personal</h3>
        <p class="pillar-desc">Setiap goresan kata tersimpan rapi dalam paspor antologi pribadimu—abadi, berwibawa, dan dapat dibaca kapan saja.</p>
      </div>
    </div>

    <!-- Bottom CTA Banner Card -->
    <div class="footer-cta-card">
      <h3 class="footer-title">Siap Menggoreskan Kata Pertamamu?</h3>
      <p class="footer-sub">Bergabunglah dengan ratusan penulis lainnya. Cukup daftarkan nama pena dan mulailah merawat rasa.</p>
      <a href="/login" class="btn-footer">
        <span>Buka Bilik Warkah</span>
        <svg class="ico" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
    </div>

  </div>
</body>
</html>`;
}
