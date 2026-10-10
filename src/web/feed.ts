export function renderFeedPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beranda Warkah — BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <meta property="og:title" content="Beranda Warkah — BERBIRRU.COM">
  <meta property="og:description" content="Linimasa sastra, puisi, dan sambung bait kata bersama.">
  <meta property="og:image" content="https://berbirru.com/og-image.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
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
      background-size: 22px 22px; padding: 20px 16px 60px;
    }
    .container { max-width: 480px; margin: 0 auto; }
    .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
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
    .search-box { display: flex; gap: 8px; margin-bottom: 14px; }
    .search-input {
      flex: 1; font: inherit; font-size: 13px; font-weight: 700; padding: 10px 14px;
      border: var(--border-med); border-radius: var(--radius-sm); background: #FFFFFF; color: var(--ink);
      outline: none; box-shadow: var(--shadow-hard-sm);
    }
    .search-btn {
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-med);
      border-radius: var(--radius-sm); padding: 0 14px; font-size: 12px; font-weight: 900;
      box-shadow: var(--shadow-hard-sm); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    }
    .feed-mode-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 16px; }
    .mode-tab {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 8px 6px; font-size: 11.5px; font-weight: 900; text-align: center; cursor: pointer;
      box-shadow: var(--shadow-hard-sm); color: var(--ink); display: flex; justify-content: center; align-items: center; gap: 5px;
    }
    .mode-tab.active { background: var(--blue-primary); color: #FFFFFF; box-shadow: 2px 2px 0 var(--shadow-ink); }

    /* Trigger Box Tulis di Beranda dengan Badge Efek */
    .trigger-create-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); padding: 14px 14px 14px 70px; margin-bottom: 24px; cursor: pointer;
      display: flex; align-items: center; gap: 10px; transition: transform 0.05s ease; position: relative;
    }
    .trigger-create-card:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--shadow-ink); }
    .trigger-avatar-clip {
      position: absolute; left: 12px; top: -14px; width: 48px; height: 50px;
      background: var(--blue-primary); color: #FFF; border: var(--border-thick);
      border-radius: 12px; display: grid; place-items: center; font-family: 'Space Grotesk', sans-serif;
      font-weight: 900; font-size: 23px; box-shadow: none;
      transform: rotate(-2deg); z-index: 5;
    }
    .trigger-placeholder { flex: 1; font-size: 13px; font-weight: 700; color: #64748B; }
    .trigger-pen-btn { background: var(--accent-yellow); border: var(--border-thin); border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 900; display: inline-flex; align-items: center; gap: 4px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); }

    /* Card Feed Threads-Style dengan Overlap Avatar & Paperclip Efek */
    .log-feed { display: flex; flex-direction: column; gap: 22px; }
    .thread-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: visible; position: relative; margin-top: 14px;
    }
    .thread-header-soft {
      background: var(--bg-blue-subtle); padding: 8px 12px 8px 68px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin); border-top-left-radius: 13px; border-top-right-radius: 13px;
      position: relative; min-height: 44px;
    }
    .thread-author-wrap { display: flex; align-items: center; gap: 8px; }
    
    /* Avatar Menonjol Melewati Frame (Logika Dijepit Tanpa Bayangan) */
    .thread-avatar-clip {
      position: absolute; left: 10px; top: -14px; width: 48px; height: 50px;
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: 12px; display: grid; place-items: center; font-family: 'Space Grotesk', sans-serif;
      font-size: 23px; font-weight: 900; box-shadow: none;
      transform: rotate(-2deg); z-index: 5;
    }
    /* SVG Paperclip / Jepitan Kertas Metalik */
    .paperclip-svg {
      position: absolute; top: -10px; right: -7px; width: 18px; height: 28px;
      z-index: 6; transform: rotate(18deg); filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.25));
    }

    .thread-author-info { display: flex; flex-direction: column; line-height: 1.25; }
    .thread-pen-name { font-size: 13px; font-weight: 800; color: var(--ink); text-decoration: none; }
    .thread-city { font-size: 10px; font-weight: 700; color: #64748B; }
    
    /* Timestamp 2 Baris Sejajar: Jam di atas, Tanggal di bawah */
    .thread-timestamp-stack {
      display: flex; flex-direction: column; align-items: flex-end; line-height: 1.25;
      font-family: 'JetBrains Mono', monospace;
    }
    .time-main { font-size: 11px; font-weight: 800; color: var(--ink); }
    .date-sub { font-size: 9.5px; font-weight: 700; color: #64748B; }

    /* Sambung Bait Connector Line */
    .thread-parent-connector {
      background: #F8FAFC; border-left: 4px solid var(--blue-primary); border-bottom: 1.5px dashed #CBD5E1;
      padding: 8px 12px; margin: 0; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
    }
    .thread-parent-connector:hover { background: var(--bg-blue-subtle); }

    .thread-body { padding: 16px 14px 12px; }
    .thread-title { font-family: 'Space Grotesk', sans-serif; font-size: 16px; font-weight: 800; color: var(--ink); margin-bottom: 8px; line-height: 1.3; }
    .thread-text { font-size: 14.5px; font-weight: 600; line-height: 1.65; color: #0F172A; }
    .thread-text-wrap { position: relative; }
    .thread-text-collapsed {
      max-height: 110px;
      overflow: hidden;
      -webkit-mask-image: linear-gradient(180deg, #000 55%, transparent);
      mask-image: linear-gradient(180deg, #000 55%, transparent);
    }
    .btn-expand-text {
      background: none; border: none; font-size: 12px; font-weight: 800;
      color: var(--blue-primary); cursor: pointer; padding: 4px 0; margin-top: 4px;
      display: inline-flex; align-items: center; gap: 3px; font-family: inherit;
    }
    .thread-text blockquote {
      background: #F8FAFC;
      border-left: 3.5px solid var(--ink);
      padding: 10px 14px;
      margin: 10px 0;
      font-style: italic;
      border-radius: 4px;
      color: #334155;
    }
    
    .font-serif { font-family: 'Newsreader', serif !important; font-size: 16px; }
    .font-sans { font-family: 'Plus Jakarta Sans', sans-serif !important; }
    .font-mono { font-family: 'JetBrains Mono', monospace !important; background: #E0EEFD; padding: 1px 5px; border-radius: 4px; font-size: 13.5px; }

    .thread-footer {
      padding: 8px 12px; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center;
      border-top: var(--border-thin); border-bottom-left-radius: 13px; border-bottom-right-radius: 13px;
    }
    .actions-left { display: flex; gap: 6px; }
    .act-btn {
      background: var(--bg-main); border: var(--border-thin); border-radius: var(--radius-sm);
      padding: 5px 10px; font-size: 11.5px; font-weight: 800; cursor: pointer; display: inline-flex;
      align-items: center; gap: 5px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink);
    }
    .act-btn.active {
      background: #EF4444;
      color: #FFFFFF;
      border-color: var(--ink);
    }
    .act-btn.active svg { fill: #FFFFFF; stroke: #FFFFFF; }
    .act-btn.saved {
      background: var(--blue-primary);
      color: #FFFFFF;
      border-color: var(--ink);
    }
    .act-btn.saved svg { fill: #FFFFFF; stroke: #FFFFFF; }
    .chain-btn {
      background: var(--accent-yellow); color: var(--ink); border: var(--border-thin);
      border-radius: var(--radius-sm); padding: 5px 12px; font-size: 11.5px; font-weight: 900;
      cursor: pointer; display: inline-flex; align-items: center; gap: 5px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink);
    }

    /* FULLSCREEN BILIK WARKAH COMPOSER (MODERN SEAMLESS CANVAS) */
    .studio-overlay {
      display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: #FFFFFF; z-index: 10000; overflow-y: auto; flex-direction: column;
    }
    .studio-card-full {
      width: 100%; max-width: 520px; min-height: 100vh; margin: 0 auto;
      background: #FFFFFF; border-left: var(--border-thick); border-right: var(--border-thick);
      display: flex; flex-direction: column; position: relative;
    }
    @media (max-width: 520px) {
      .studio-card-full { border-left: none; border-right: none; }
    }
    .composer-header {
      padding: 12px 16px; display: flex; justify-content: space-between; align-items: center;
      border-bottom: var(--border-thick); background: #FFFFFF; position: sticky; top: 0; z-index: 20;
    }
    .btn-cancel {
      font-size: 13px; font-weight: 800; color: #64748B; background: none; border: none; cursor: pointer; padding: 6px 4px;
    }
    .header-title-clean {
      font-family: 'Space Grotesk', sans-serif; font-size: 15.5px; font-weight: 800; color: var(--ink); letter-spacing: -0.3px;
    }
    .btn-publish-pill {
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-med); border-radius: 999px;
      padding: 6px 16px; font-size: 12.5px; font-weight: 900; cursor: pointer; box-shadow: 2px 2px 0 var(--shadow-ink);
      display: inline-flex; align-items: center; gap: 5px; transition: transform 0.05s ease;
    }
    .btn-publish-pill:active { transform: translate(1.5px, 1.5px); box-shadow: none; }

    .composer-body {
      padding: 20px 18px 90px; flex: 1; display: flex; flex-direction: column; gap: 14px;
    }
    .title-input {
      font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; color: var(--ink);
      border: none; outline: none; width: 100%; line-height: 1.25; letter-spacing: -0.4px;
    }
    .title-input::placeholder { color: #CBD5E1; font-weight: 700; }

    .rich-editor-canvas {
      width: 100%; flex: 1; min-height: 320px; font-size: 16px; line-height: 1.75;
      color: #1E293B; outline: none; word-break: break-word;
    }
    .rich-editor-canvas:empty:before { content: attr(placeholder); color: #94A3B8; font-weight: 500; }
    .rich-editor-canvas blockquote {
      background: var(--bg-blue-subtle); border-left: 3.5px solid var(--blue-primary);
      padding: 8px 14px; margin: 12px 0; font-style: italic; border-radius: 6px; color: #0B192C;
    }

    /* Floating Docked Bottom Toolbar */
    .docked-footer {
      position: sticky; bottom: 0; background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(8px);
      border-top: var(--border-thick); padding: 10px 16px; display: flex; justify-content: space-between;
      align-items: center; z-index: 20;
    }
    .tools-segment { display: flex; align-items: center; gap: 6px; }
    .t-btn {
      width: 32px; height: 32px; border: 1.5px solid var(--ink); border-radius: 8px;
      background: #FFFFFF; color: var(--ink); font-weight: 900; font-size: 13px; cursor: pointer;
      display: grid; place-items: center; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); transition: all 0.05s ease;
    }
    .t-btn:active { transform: translate(1px, 1px); box-shadow: none; }
    .t-btn.active { background: var(--blue-primary); color: #FFFFFF; box-shadow: inset 1px 1px 0 rgba(0,0,0,0.3); }
    
    .font-select-picker {
      height: 32px; padding: 0 8px; border: 1.5px solid var(--ink); border-radius: 8px;
      background: #FFFFFF; font-size: 12px; font-weight: 800; color: var(--ink);
      box-shadow: 1.5px 1.5px 0 var(--shadow-ink); outline: none; cursor: pointer;
    }
    .stats-label { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; font-weight: 700; color: #64748B; }

    /* 5-TAB DOCKED BOTTOM NAVBAR */
    .bottom-navbar {
      position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px); border-top: var(--border-thick); padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
      display: flex; justify-content: space-between; z-index: 1000; box-shadow: 0 -4px 16px rgba(11,25,44,0.06);
    }
    .navbar-inner {
      width: 100%; max-width: 480px; margin: 0 auto; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; align-items: center;
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 3px; text-decoration: none; color: #64748B; padding: 4px 0; cursor: pointer;
    }
    .nav-item span { font-size: 10px; font-weight: 800; }
    .nav-item.active { color: var(--blue-primary); }
    .nav-item.active span { color: var(--blue-primary); font-weight: 900; }
    .nav-item.active svg { stroke: var(--blue-primary); stroke-width: 2.8; }

    /* Middle Action Button (Pen Icon) */
    .nav-item-center {
      position: relative; top: -10px;
    }
    .btn-create-floating {
      width: 46px; height: 46px; background: var(--accent-yellow); color: var(--ink);
      border: var(--border-thick); border-radius: 14px; display: grid; place-items: center;
      box-shadow: 2.5px 2.5px 0 var(--shadow-ink); transform: rotate(-2deg); transition: transform 0.05s ease;
    }
    .btn-create-floating:active { transform: translate(1.5px, 1.5px); box-shadow: none; }

    .bell-wrap { position: relative; }
    .notif-dot {
      position: absolute; top: -2px; right: -3px; width: 8px; height: 8px;
      background: var(--accent-red); border: 1.5px solid #FFF; border-radius: 50%;
    }

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

    <div class="search-box">
      <input type="text" id="searchInput" class="search-input" placeholder="Telusuri bait puisi, kata kunci, atau @nama_pena...">
      <button class="search-btn" onclick="handleSearch()">
        <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
    </div>

    <div class="feed-mode-tabs">
      <div class="mode-tab active" onclick="switchFeed('viral', this)">
        <svg class="ico" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>Menggema</span>
      </div>
      <div class="mode-tab" onclick="switchFeed('latest', this)">
        <svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>Teranyar</span>
      </div>
      <div class="mode-tab" onclick="switchFeed('following', this)">
        <svg class="ico" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>Diikuti</span>
      </div>
    </div>

    <div class="log-feed" id="feedContainer"></div>
  </div>

  <!-- FULLSCREEN MODAL: BILIK WARKAH (SEAMLESS CLEAN CANVAS) -->
  <div class="studio-overlay" id="studioModal">
    <div class="studio-card-full">
      <header class="composer-header">
        <button class="btn-cancel" onclick="closeStudioModal()">Batal</button>
        <h2 class="header-title-clean" id="studioModalHeading">Bilik Warkah</h2>
        <button class="btn-publish-pill" onclick="submitStudioWarkah()">
          <span>Terbitkan</span>
          <svg class="ico" style="width:11px;height:11px;" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </header>

      <main class="composer-body">
        <input type="text" class="title-input" id="studioTitle" placeholder="Beri Judul (opsional)...">
        <div class="rich-editor-canvas font-sans" id="editorCanvas" contenteditable="true" placeholder="Mulai tuliskan bait puisi, kutipan, atau cerita absurdmu di sini..."></div>
      </main>

      <footer class="docked-footer">
        <div class="tools-segment">
          <button type="button" class="t-btn" id="btnBold" onclick="formatCmd('bold')"><b>B</b></button>
          <button type="button" class="t-btn" id="btnItalic" onclick="formatCmd('italic')"><i>I</i></button>
          <button type="button" class="t-btn" id="btnUnderline" onclick="formatCmd('underline')"><u>U</u></button>
          <button type="button" class="t-btn" id="btnQuote" onclick="applyQuote()">”</button>
          
          <select class="font-select-picker" id="fontDropdown" onchange="handleFontDropdown(this.value)">
            <option value="font-sans">Font: Sans</option>
            <option value="font-serif">Font: Serif</option>
            <option value="font-mono">Font: Mono</option>
          </select>
        </div>

        <div class="stats-label" id="studioWordCount">
          0 kata · 0 huruf
        </div>
      </footer>
    </div>
  </div>

  <!-- 5-TAB DOCKED BOTTOM NAVBAR -->
  <nav class="bottom-navbar">
    <div class="navbar-inner">
      <a href="/feed" class="nav-item active">
        <svg class="ico" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Beranda</span>
      </a>

      <div class="nav-item" onclick="focusSearchInput()">
        <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Telusuri</span>
      </div>

      <div class="nav-item nav-item-center" onclick="openStudioModal()">
        <div class="btn-create-floating">
          <svg style="width:19px;height:19px;stroke:#0B192C;stroke-width:2.5;fill:none;" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
        </div>
      </div>

      <a href="/notifications" class="nav-item">
        <div class="bell-wrap">
          <svg class="ico" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <div class="notif-dot" id="notifDot" style="display:none;"></div>
        </div>
        <span>Aktivitas</span>
      </a>

      <a href="${user ? '/u/' + user.pen_name : '/login'}" class="nav-item">
        <svg class="ico" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Akun</span>
      </a>
    </div>
  </nav>

  <script>
    let currentMode = 'viral';
    let searchQuery = '';
    let currentChainParentId = null;
    let currentFontClass = 'font-sans';
    const isUserLoggedIn = ${Boolean(user)};

    function formatTimestamp(isoStr) {
      if (!isoStr) return '';
      const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
      const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(':', '.');
      return '<div class="thread-timestamp-stack"><span class="time-main">' + timePart + ' WIB</span><span class="date-sub">' + datePart + '</span></div>';
    }

    async function loadFeed() {
      try {
        const url = searchQuery 
          ? '/api/posts?q=' + encodeURIComponent(searchQuery)
          : '/api/posts?mode=' + currentMode;
        const res = await fetch(url);
        const data = await res.json();
        const container = document.getElementById('feedContainer');
        
        if (data.message && currentMode === 'following') {
          container.innerHTML = '<div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">' + data.message + ' <br><br><a href="/login" style="display:inline-block;padding:8px 16px;background:#1D61E7;color:#FFF;border-radius:8px;text-decoration:none;font-weight:900;">Masuk Sekarang</a></div>';
          return;
        }

        if (!data.posts || !data.posts.length) {
          container.innerHTML = '<div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">Belum ada warkah di feed ini. Jadilah yang pertama menggoreskan bait!</div>';
          return;
        }
        container.innerHTML = data.posts.map(p => renderPostCard(p)).join('');
      } catch (err) {
        console.error(err);
      }
    }

    /* Function Deterministic Vibrant Colors based on Pen Name */
    function getAvatarColor(name) {
      const colors = ['#1D61E7', '#0F3E99', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4F46E5'];
      const str = String(name || '');
      let sum = 0;
      for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i) * (i + 1);
      }
      return colors[sum % colors.length];
    }

    function stripHtml(html) {
      const tmp = document.createElement('div');
      tmp.innerHTML = html || '';
      return tmp.textContent || tmp.innerText || '';
    }

    function renderPostCard(p) {
      const isLikedClass = p.is_liked ? 'active' : '';
      const isSavedClass = p.is_saved ? 'saved' : '';

      return \`
        <div class="thread-card" id="post-\${p.id}">
          <div class="thread-header-soft">
            <div class="thread-avatar-clip" style="background:\${getAvatarColor(p.pen_name)};">
              \${(p.pen_name[0] || 'D').toUpperCase()}
              <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <div class="thread-author-wrap">
              <div class="thread-author-info">
                <a href="/u/\${p.pen_name}" class="thread-pen-name">@\${escapeHtml(p.pen_name)}</a>
                <span class="thread-city">\${escapeHtml(p.city || 'Nusantara')}</span>
              </div>
            </div>
            \${formatTimestamp(p.created_at)}
          </div>

          \${p.parent_id ? \`
            <div class="thread-parent-connector" onclick="scrollToPost('\${p.parent_id}')">
              <svg class="ico" style="color:#1D61E7;" viewBox="0 0 24 24"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
              <span>Menyambung warkah <b>@\${escapeHtml(p.parent_author)}</b>: <i>"\${escapeHtml(stripHtml(p.parent_content).slice(0, 45) + '...')}"</i></span>
            </div>
          \` : ''}

          <div class="thread-body">
            \${p.title ? \`<h3 class="thread-title">\${escapeHtml(p.title)}</h3>\` : ''}
            <div class="thread-text-wrap" id="wrap-\${p.id}">
              <div class="thread-text \${stripHtml(p.content).length > 220 ? 'thread-text-collapsed' : ''}" id="text-\${p.id}">\${p.content}</div>
              \${stripHtml(p.content).length > 220 ? \`
                <button class="btn-expand-text" onclick="toggleExpandPost('\${p.id}', this)">
                  <span>Baca Selengkapnya ▾</span>
                </button>
              \` : ''}
            </div>
          </div>

          <div class="thread-footer">
            <div class="actions-left">
              <button class="act-btn \${isLikedClass}" onclick="likePost('\${p.id}', this)">
                <svg class="ico" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span>\${p.likes_count || 0} Terpaut</span>
              </button>
              <button class="act-btn \${isSavedClass}" onclick="bookmarkPost('\${p.id}', this)">
                <svg class="ico" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                <span>\${p.saves_count || 0} Simpan</span>
              </button>
            </div>
            <button class="chain-btn" onclick="openStudioModal('\${p.id}', '\${escapeHtml(p.title || p.pen_name).replace(/'/g, '’')}')">
              <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>\${p.chains_count ? p.chains_count + ' Sambungan' : 'Sambung Bait'}</span>
            </button>
          </div>
        </div>
      \`;
    }

    function escapeHtml(t) {
      return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function toggleExpandPost(id, btn) {
      const textEl = document.getElementById('text-' + id);
      const isCollapsed = textEl.classList.contains('thread-text-collapsed');
      if (isCollapsed) {
        textEl.classList.remove('thread-text-collapsed');
        btn.querySelector('span').textContent = 'Sembunyikan ▴';
      } else {
        textEl.classList.add('thread-text-collapsed');
        btn.querySelector('span').textContent = 'Baca Selengkapnya ▾';
      }
    }

    function scrollToPost(id) {
      const el = document.getElementById('post-' + id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      else alert('Warkah induk dimuat di bagian sebelumnya.');
    }

    function openStudioModal(parentId = null, parentName = '') {
      if (!isUserLoggedIn) {
        if (confirm('Anda perlu masuk terlebih dahulu untuk menggoreskan warkah. Buka halaman masuk?')) {
          window.location.href = '/login';
        }
        return;
      }
      currentChainParentId = parentId;
      document.getElementById('studioModalHeading').textContent = parentId ? 'Sambung Bait (@' + parentName + ')' : 'Bilik Warkah';
      document.getElementById('studioModal').style.display = 'flex';
      document.body.style.overflow = 'hidden';
      document.getElementById('editorCanvas').focus();
      updateToolbarState();
      updateWordCounter();
    }

    function closeStudioModal() {
      document.getElementById('studioModal').style.display = 'none';
      document.body.style.overflow = 'auto';
      document.getElementById('studioTitle').value = '';
      document.getElementById('editorCanvas').innerHTML = '';
    }

    function updateToolbarState() {
      document.getElementById('btnBold').classList.toggle('active', document.queryCommandState('bold'));
      document.getElementById('btnItalic').classList.toggle('active', document.queryCommandState('italic'));
      document.getElementById('btnUnderline').classList.toggle('active', document.queryCommandState('underline'));
    }

    function updateWordCounter() {
      const text = document.getElementById('editorCanvas').innerText || '';
      const chars = text.length;
      const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
      document.getElementById('studioWordCount').textContent = words + ' kata · ' + chars + ' huruf';
    }

    function formatCmd(cmd, val = null) {
      document.execCommand(cmd, false, val);
      document.getElementById('editorCanvas').focus();
      updateToolbarState();
      updateWordCounter();
    }

    function applyQuote() {
      const selection = window.getSelection();
      const canvas = document.getElementById('editorCanvas');
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const bq = document.createElement('blockquote');
        bq.appendChild(range.extractContents());
        range.insertNode(bq);
        selection.removeAllRanges();
      } else {
        document.execCommand('formatBlock', false, '<blockquote>');
      }
      canvas.focus();
      updateToolbarState();
      updateWordCounter();
    }

    function handleFontDropdown(fontClass) {
      currentFontClass = fontClass;
      const selection = window.getSelection();
      const canvas = document.getElementById('editorCanvas');

      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = fontClass;
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
      } else {
        document.execCommand('insertHTML', false, '<span class="' + fontClass + '">&#8203;</span>');
      }
      canvas.focus();
    }

    const editorEl = document.getElementById('editorCanvas');
    if (editorEl) {
      editorEl.addEventListener('keyup', () => { updateToolbarState(); updateWordCounter(); });
      editorEl.addEventListener('mouseup', updateToolbarState);
      editorEl.addEventListener('input', updateWordCounter);
    }

    async function submitStudioWarkah() {
      const title = document.getElementById('studioTitle').value.trim();
      const content = document.getElementById('editorCanvas').innerHTML.trim();
      if (!content || stripHtml(content).trim() === '') return alert('Tuliskan isi warkah terlebih dahulu.');

      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, parent_id: currentChainParentId })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menerbitkan warkah');
        closeStudioModal();
        loadFeed();
      } catch (err) {
        alert(err.message);
      }
    }

    function switchFeed(mode, el) {
      searchQuery = '';
      currentMode = mode;
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      loadFeed();
    }

    function handleSearch() {
      searchQuery = document.getElementById('searchInput').value.trim();
      loadFeed();
    }

    async function likePost(id, btn) {
      if (!isUserLoggedIn) return window.location.href = '/login';
      try {
        const res = await fetch('/api/posts/' + id + '/like', { method: 'POST' });
        const data = await res.json();
        btn.classList.toggle('active', data.liked);
        btn.querySelector('span').textContent = (data.likes_count || 0) + ' Terpaut';
      } catch (err) {
        console.error(err);
      }
    }

    async function bookmarkPost(id, btn) {
      if (!isUserLoggedIn) return window.location.href = '/login';
      try {
        const res = await fetch('/api/posts/' + id + '/bookmark', { method: 'POST' });
        const data = await res.json();
        btn.classList.toggle('saved', data.bookmarked);
        btn.querySelector('span').textContent = (data.saves_count || 0) + ' Simpan';
      } catch (err) {
        console.error(err);
      }
    }

    async function followUser(penName) {
      if (!isUserLoggedIn) return window.location.href = '/login';
      try {
        const res = await fetch('/api/users/' + encodeURIComponent(penName) + '/follow', { method: 'POST' });
        const data = await res.json();
        if (data.error) return alert(data.error);
        alert(data.following ? 'Berhasil mengikuti @' + penName : 'Batal mengikuti @' + penName);
      } catch (err) {
        console.error(err);
      }
    }

    function focusSearchInput() {
      const el = document.getElementById('searchInput');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }

    async function checkUnreadNotifs() {
      try {
        const res = await fetch('/api/notifications/unread-count');
        const data = await res.json();
        const dot = document.getElementById('notifDot');
        if (dot && data.count > 0) dot.style.display = 'block';
      } catch (err) {}
    }

    loadFeed();
    checkUnreadNotifs();
  </script>
</body>
</html>`;
}
