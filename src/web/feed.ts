export function renderFeedPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beranda Warkah — BERBIRRU.COM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Kalam:wght@700&family=Plus+Jakarta+Sans:wght@500;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@600;800&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
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
    .brand-badge {
      display: inline-flex; align-items: center; gap: 8px; background: var(--blue-primary);
      color: #FFFFFF; padding: 6px 14px; border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); transform: rotate(-1deg); text-decoration: none;
    }
    .brand-badge h1 { font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 700; letter-spacing: 0.5px; }
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

    /* Trigger Box Tulis di Beranda */
    .trigger-create-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); padding: 12px 14px; margin-bottom: 20px; cursor: pointer;
      display: flex; align-items: center; gap: 10px; transition: transform 0.05s ease;
    }
    .trigger-create-card:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--shadow-ink); }
    .trigger-avatar { width: 34px; height: 34px; background: var(--blue-primary); color: #FFF; border: 2px solid var(--ink); border-radius: 10px; display: grid; place-items: center; font-weight: 900; font-size: 15px; flex-shrink: 0; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); }
    .trigger-placeholder { flex: 1; font-size: 13px; font-weight: 700; color: #64748B; }
    .trigger-pen-btn { background: var(--accent-yellow); border: var(--border-thin); border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 900; display: inline-flex; align-items: center; gap: 4px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); }

    /* Card Feed Threads-Style */
    .log-feed { display: flex; flex-direction: column; gap: 16px; }
    .thread-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: hidden;
    }
    .thread-header-soft {
      background: var(--bg-blue-subtle); padding: 10px 14px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin);
    }
    .thread-author-wrap { display: flex; align-items: center; gap: 8px; }
    .thread-avatar { width: 28px; height: 28px; background: var(--blue-primary); color: #FFF; border: 1.5px solid var(--ink); border-radius: 8px; display: grid; place-items: center; font-size: 13px; font-weight: 900; }
    .thread-author-info { display: flex; flex-direction: column; }
    .thread-pen-name { font-size: 12.5px; font-weight: 800; color: var(--ink); text-decoration: none; }
    .thread-city { font-size: 10.5px; font-weight: 700; color: #64748B; }
    .thread-timestamp { font-size: 10.5px; font-weight: 800; color: #475569; font-family: 'JetBrains Mono', monospace; }

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
    .thread-text blockquote { background: var(--bg-blue-subtle); border-left: 3px solid var(--blue-primary); padding: 4px 8px; margin: 6px 0; font-style: italic; border-radius: 4px; }
    
    .font-serif { font-family: 'Merriweather', serif !important; }
    .font-sans { font-family: 'Plus Jakarta Sans', sans-serif !important; }
    .font-mono { font-family: 'JetBrains Mono', monospace !important; background: #E0EEFD; padding: 1px 4px; border-radius: 4px; }

    .thread-footer { padding: 8px 12px; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center; border-top: var(--border-thin); }
    .actions-left { display: flex; gap: 6px; }
    .act-btn {
      background: var(--bg-main); border: var(--border-thin); border-radius: var(--radius-sm);
      padding: 5px 10px; font-size: 11.5px; font-weight: 800; cursor: pointer; display: inline-flex;
      align-items: center; gap: 5px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink);
    }
    .act-btn.active { background: var(--blue-primary); color: #FFFFFF; }
    .act-btn.saved { background: var(--accent-yellow); color: var(--ink); }
    .chain-btn {
      background: var(--accent-yellow); color: var(--ink); border: var(--border-thin);
      border-radius: var(--radius-sm); padding: 5px 12px; font-size: 11.5px; font-weight: 900;
      cursor: pointer; display: inline-flex; align-items: center; gap: 5px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink);
    }

    /* FULLSCREEN BILIK WARKAH MODAL */
    .studio-overlay {
      display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: var(--bg-main); z-index: 10000; overflow-y: auto;
      flex-direction: column;
    }
    .studio-card-full {
      width: 100%; max-width: 640px; min-height: 100vh; margin: 0 auto;
      background: #FFFFFF; border-left: var(--border-thick); border-right: var(--border-thick);
      display: flex; flex-direction: column;
    }
    @media (max-width: 640px) {
      .studio-card-full { border-left: none; border-right: none; }
    }
    .studio-header {
      background: var(--bg-blue-subtle); padding: 14px 18px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thick); position: sticky; top: 0; z-index: 10;
    }
    .studio-title-handwriting {
      font-family: 'Kalam', 'Caveat', cursive; font-size: 24px; font-weight: 700;
      color: var(--blue-deep); display: flex; align-items: center; gap: 8px; line-height: 1;
    }
    .btn-studio-close {
      background: #FFF; border: var(--border-med); border-radius: var(--radius-sm);
      padding: 6px 12px; font-size: 12px; font-weight: 900; cursor: pointer; box-shadow: var(--shadow-hard-sm);
    }
    .btn-studio-close:active { transform: translate(1px, 1px); box-shadow: none; }
    .studio-body {
      padding: 18px; display: flex; flex-direction: column; gap: 14px; flex: 1;
    }

    /* Judul Warkah */
    .input-title {
      width: 100%; border: none; border-bottom: 2.5px dashed #CBD5E1; padding: 8px 0;
      font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 800; color: var(--ink);
      outline: none; background: transparent;
    }
    .input-title::placeholder { color: #94A3B8; font-weight: 700; }

    /* Rich Toolbar */
    .rich-toolbar {
      display: flex; flex-wrap: wrap; gap: 6px; align-items: center;
      background: var(--bg-blue-subtle); padding: 8px 10px; border: var(--border-med);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-hard-sm);
    }
    .toolbar-group { display: flex; gap: 4px; align-items: center; border-right: 2px solid #CBD5E1; padding-right: 6px; margin-right: 2px; }
    .toolbar-group:last-child { border-right: none; padding-right: 0; margin-right: 0; }
    .tool-btn {
      background: #FFFFFF; border: 1.5px solid var(--ink); border-radius: 6px;
      padding: 5px 10px; font-size: 12px; font-weight: 900; cursor: pointer;
      box-shadow: 1.5px 1.5px 0 var(--shadow-ink); display: inline-flex; align-items: center; gap: 4px;
      transition: all 0.1s ease;
    }
    .tool-btn:active { transform: translate(1px, 1px); box-shadow: none; }
    .tool-btn.active {
      background: var(--blue-primary); color: #FFFFFF; border-color: var(--ink);
      box-shadow: inset 1.5px 1.5px 0 rgba(0,0,0,0.3); transform: translate(1px, 1px);
    }
    .tool-btn-pill { background: #F1F5F9; font-size: 11px; }
    .tool-btn-pill.active { background: var(--accent-yellow); color: var(--ink); }

    /* Canvas Kanvas Tulis ContentEditable Native Full Screen */
    .rich-editor-canvas {
      width: 100%; flex: 1; min-height: 280px; border: var(--border-med); border-radius: var(--radius-sm);
      padding: 16px; font-size: 15.5px; line-height: 1.7; color: var(--ink); background: #FAFAFA;
      outline: none; box-shadow: inset 1px 1px 0 rgba(0,0,0,0.05); overflow-y: auto;
    }
    .rich-editor-canvas:focus { background: #FFFFFF; border-color: var(--blue-primary); }
    .rich-editor-canvas:empty:before { content: attr(placeholder); color: #94A3B8; font-weight: 600; }

    .studio-footer {
      padding: 14px 18px; background: #F8FAFC; border-top: var(--border-thick);
      display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: 0; z-index: 10;
    }
    .btn-publish {
      background: var(--blue-primary); color: #FFF; border: var(--border-thick); border-radius: var(--radius-sm);
      padding: 10px 22px; font-size: 14px; font-weight: 900; cursor: pointer; box-shadow: var(--shadow-hard);
      display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-publish:active { transform: translate(2px, 2px); box-shadow: none; }

    .ico { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-nav">
      <a href="/" class="brand-badge">
        <svg class="ico" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <h1>BERBIRRU</h1>
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

    <!-- Trigger Masuk ke Bilik Warkah -->
    <div class="trigger-create-card" onclick="openStudioModal()">
      <div class="trigger-avatar">${user ? (user.pen_name[0] || 'D').toUpperCase() : 'B'}</div>
      <div class="trigger-placeholder">Goreskan bait, kutipan, atau perenungan...</div>
      <div class="trigger-pen-btn">
        <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
        <span>Tulis</span>
      </div>
    </div>

    <div class="log-feed" id="feedContainer"></div>
  </div>

  <!-- FULLSCREEN MODAL: BILIK WARKAH -->
  <div class="studio-overlay" id="studioModal">
    <div class="studio-card-full">
      <div class="studio-header">
        <div class="studio-title-handwriting">
          <svg class="ico" style="width:20px;height:20px;color:var(--blue-primary);" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
          <span id="studioModalHeading">Bilik Warkah</span>
        </div>
        <button class="btn-studio-close" onclick="closeStudioModal()">✕ Batal</button>
      </div>
      <div class="studio-body">
        <input type="text" class="input-title" id="studioTitle" placeholder="Beri judul warkah (opsional)...">
        
        <!-- Rich Formatting Toolbar with Active States -->
        <div class="rich-toolbar">
          <div class="toolbar-group">
            <button type="button" class="tool-btn" id="btnBold" onclick="formatCmd('bold')"><b>B</b></button>
            <button type="button" class="tool-btn" id="btnItalic" onclick="formatCmd('italic')"><i>I</i></button>
            <button type="button" class="tool-btn" id="btnUnderline" onclick="formatCmd('underline')"><u>U</u></button>
          </div>
          <div class="toolbar-group">
            <button type="button" class="tool-btn tool-btn-pill" id="fontSerifBtn" onclick="selectFont('font-serif', this)">Serif</button>
            <button type="button" class="tool-btn tool-btn-pill active" id="fontSansBtn" onclick="selectFont('font-sans', this)">Sans</button>
            <button type="button" class="tool-btn tool-btn-pill" id="fontMonoBtn" onclick="selectFont('font-mono', this)">Mono</button>
          </div>
          <button type="button" class="tool-btn" id="btnQuote" onclick="formatCmd('formatBlock', 'blockquote')">Kutipan</button>
        </div>

        <div class="rich-editor-canvas" id="editorCanvas" contenteditable="true" placeholder="Tuliskan bait puisi, cerita absurd, atau resensimu di sini..."></div>
      </div>
      <div class="studio-footer">
        <span style="font-size:11px;font-weight:700;color:#64748B;">Format aktif otomatis menyesuaikan</span>
        <button class="btn-publish" onclick="submitStudioWarkah()">
          <svg class="ico" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <span>Terbitkan Warkah</span>
        </button>
      </div>
    </div>
  </div>

  <script>
    let currentMode = 'viral';
    let searchQuery = '';
    let currentChainParentId = null;
    let currentActiveFontClass = 'font-sans';
    const isUserLoggedIn = ${Boolean(user)};

    function formatTimestamp(isoStr) {
      if (!isoStr) return '';
      const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
      const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(':', '.');
      return datePart + ' · ' + timePart + ' WIB';
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

    function renderPostCard(p) {
      const isLikedClass = p.is_liked ? 'active' : '';
      const isSavedClass = p.is_saved ? 'saved' : '';

      return \`
        <div class="thread-card" id="post-\${p.id}">
          <div class="thread-header-soft">
            <div class="thread-author-wrap">
              <div class="thread-avatar">\${(p.pen_name[0] || 'D').toUpperCase()}</div>
              <div class="thread-author-info">
                <a href="/u/\${p.pen_name}" class="thread-pen-name">@\${p.pen_name}</a>
                <span class="thread-city">\${p.city || 'Nusantara'}</span>
              </div>
            </div>
            <span class="thread-timestamp">\${formatTimestamp(p.created_at)}</span>
          </div>

          \${p.parent_id ? \`
            <div class="thread-parent-connector" onclick="scrollToPost('\${p.parent_id}')">
              <svg class="ico" style="color:#1D61E7;" viewBox="0 0 24 24"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>
              <span>Menyambung warkah <b>@\${p.parent_author}</b>: <i>"\${escapeHtml(p.parent_content ? p.parent_content.slice(0, 40) + '...' : 'Warkah')}"</i></span>
            </div>
          \` : ''}

          <div class="thread-body">
            \${p.title ? \`<h3 class="thread-title">\${escapeHtml(p.title)}</h3>\` : ''}
            <div class="thread-text">\${p.content}</div>
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
            <button class="chain-btn" onclick="openStudioModal('\${p.id}', '\${escapeHtml(p.title || p.pen_name)}')">
              <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>\${p.chains_count ? p.chains_count + ' Sambungan' : 'Sambung Bait'}</span>
            </button>
          </div>
        </div>
      \`;
    }

    function escapeHtml(t) {
      return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

    function formatCmd(cmd, val = null) {
      document.execCommand(cmd, false, val);
      document.getElementById('editorCanvas').focus();
      updateToolbarState();
    }

    function selectFont(className, btn) {
      document.querySelectorAll('.tool-btn-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentActiveFontClass = className;

      const selection = window.getSelection();
      const canvas = document.getElementById('editorCanvas');

      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = className;
        span.appendChild(range.extractContents());
        range.insertNode(span);
        selection.removeAllRanges();
      } else {
        // Terapkan font langsung ke canvas/typing stream tanpa alert
        canvas.className = 'rich-editor-canvas ' + className;
      }
      canvas.focus();
    }

    const editorEl = document.getElementById('editorCanvas');
    if (editorEl) {
      editorEl.addEventListener('keyup', updateToolbarState);
      editorEl.addEventListener('mouseup', updateToolbarState);
      editorEl.addEventListener('click', updateToolbarState);
    }

    async function submitStudioWarkah() {
      const title = document.getElementById('studioTitle').value.trim();
      const content = document.getElementById('editorCanvas').innerHTML.trim();
      if (!content || content === '<br>') return alert('Tuliskan isi warkah terlebih dahulu.');

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

    loadFeed();
  </script>
</body>
</html>`;
}
