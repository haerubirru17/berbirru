export function renderFeedPage(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beranda Warkah — BERBIRRU.COM</title>
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
    .create-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); padding: 14px; margin-bottom: 20px;
    }
    .create-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .create-title { font-size: 11.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: var(--blue-deep); display: inline-flex; align-items: center; gap: 5px; }
    .author-handle-tag { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 800; background: var(--bg-blue-subtle); border: 1.5px solid var(--ink); border-radius: 6px; padding: 2px 8px; }
    .textarea-box {
      width: 100%; height: 76px; border: var(--border-med); border-radius: var(--radius-sm);
      padding: 10px 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 600;
      background: #FAFAFA; color: var(--ink); resize: none; outline: none; margin-bottom: 8px;
    }
    .btn-submit {
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-med); border-radius: var(--radius-sm);
      padding: 7px 16px; font-size: 12px; font-weight: 900; box-shadow: var(--shadow-hard-sm); cursor: pointer;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .log-feed { display: flex; flex-direction: column; gap: 18px; }
    .ticket-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: hidden;
    }
    .ticket-header {
      background: #0F172A; color: #FFFFFF; padding: 9px 12px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thick);
    }
    .ticket-id-group { display: flex; align-items: center; gap: 6px; }
    .ticket-id { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; font-weight: 800; color: var(--accent-yellow); background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; }
    .viral-badge { background: #EF4444; color: #FFFFFF; padding: 2px 7px; border-radius: 4px; font-size: 9.5px; font-weight: 900; display: inline-flex; align-items: center; gap: 4px; }
    .ticket-meta { font-size: 10.5px; font-weight: 700; color: #94A3B8; }
    .ticket-body { padding: 16px 14px 12px; background: #FFFFFF; }
    .poem-text { font-size: 14.5px; font-weight: 700; line-height: 1.6; color: #0F172A; white-space: pre-line; margin-bottom: 12px; }
    .author-row { display: flex; justify-content: space-between; align-items: center; }
    .author-info { display: flex; align-items: center; gap: 7px; text-decoration: none; color: inherit; }
    .author-avatar { width: 22px; height: 22px; background: var(--blue-light); border: 1.5px solid var(--ink); border-radius: 6px; display: grid; place-items: center; font-size: 11px; font-weight: 900; color: var(--ink); }
    .author-name { font-size: 12px; font-weight: 800; color: #334155; }
    .follow-chip { background: var(--bg-main); border: 1.5px solid var(--ink); border-radius: 6px; padding: 3px 8px; font-size: 10.5px; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; }
    .stanza-chain-box { background: var(--bg-blue-subtle); border: var(--border-med); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 12px; }
    .stanza-item { padding: 7px 10px; background: #FFFFFF; border: 1.5px solid var(--ink); border-radius: 8px; margin-bottom: 6px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); }
    .stanza-item:last-child { margin-bottom: 0; border-left: 4px solid var(--blue-primary); }
    .stanza-top { font-size: 10px; font-weight: 800; color: var(--blue-deep); font-family: 'JetBrains Mono', monospace; margin-bottom: 2px; display: flex; justify-content: space-between; }
    .stanza-txt { font-size: 13px; font-weight: 700; line-height: 1.4; color: var(--ink); }
    .ai-bar { background: #EFF6FF; border-top: var(--border-thin); border-bottom: var(--border-thin); padding: 7px 12px; font-size: 11px; font-weight: 700; color: var(--blue-deep); display: flex; align-items: center; gap: 6px; }
    .ticket-footer { padding: 8px 12px; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center; }
    .actions-left { display: flex; gap: 6px; }
    .act-btn {
      background: var(--bg-main); border: var(--border-thin); border-radius: var(--radius-sm);
      padding: 5px 10px; font-size: 11.5px; font-weight: 800; cursor: pointer; display: inline-flex;
      align-items: center; gap: 5px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); transition: transform 0.05s ease;
    }
    .act-btn.active { background: var(--blue-primary); color: #FFFFFF; }
    .act-btn.saved { background: var(--accent-yellow); color: var(--ink); }
    .chain-btn {
      background: var(--accent-yellow); color: var(--ink); border: var(--border-thin);
      border-radius: var(--radius-sm); padding: 5px 12px; font-size: 11.5px; font-weight: 900;
      cursor: pointer; display: inline-flex; align-items: center; gap: 5px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink);
    }
    .ico { width: 13px; height: 13px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-nav">
      <a href="/" class="brand-badge">
        <svg class="ico" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <h1>BERBIRRU</h1>
      </a>
      <a href="/u/saya" class="nav-btn">
        <svg class="ico" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Pustaka Saya</span>
      </a>
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

    <div class="create-card">
      <div class="create-head">
        <span class="create-title">
          <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
          Goreskan Bait Baru
        </span>
      </div>
      <textarea id="postInput" class="textarea-box" placeholder="Tuliskan 2–4 baris bait puisi, kutipan, atau perenungan jiwamu..."></textarea>
      <div style="display:flex;justify-content:flex-end;">
        <button class="btn-submit" onclick="submitPost()">
          <svg class="ico" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          Terbitkan Warkah
        </button>
      </div>
    </div>

    <div class="log-feed" id="feedContainer">
      <!-- Live dynamic posts from /api/posts rendered here -->
    </div>
  </div>

  <script>
    let currentMode = 'viral';

    async function loadFeed() {
      try {
        const res = await fetch('/api/posts?mode=' + currentMode);
        const data = await res.json();
        const container = document.getElementById('feedContainer');
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
      return \`
        <div class="ticket-card">
          <div class="ticket-header">
            <div class="ticket-id-group">
              <span class="ticket-id">#WARKAH-\${p.id.slice(0,6)}</span>
              \${p.is_viral ? '<span class="viral-badge"><svg class="ico" style="width:10px;height:10px;" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> BERGEMA</span>' : ''}
            </div>
            <span class="ticket-meta">\${new Date(p.created_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})} WIB</span>
          </div>
          <div class="ticket-body">
            <div class="poem-text">\${escapeHtml(p.content)}</div>
            <div class="author-row">
              <a href="/u/\${p.pen_name}" class="author-info">
                <div class="author-avatar">\${(p.pen_name[0] || 'A').toUpperCase()}</div>
                <span class="author-name">Karya <b>@\${p.pen_name}</b> · \${p.city || 'Nusantara'}</span>
              </a>
              <button class="follow-chip" onclick="followUser('\${p.pen_name}')">+ Ikuti</button>
            </div>
          </div>
          <div class="ticket-footer">
            <div class="actions-left">
              <button class="act-btn" onclick="likePost('\${p.id}', this)">
                <svg class="ico" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                <span>\${p.likes_count || 0} Terpaut</span>
              </button>
              <button class="act-btn" onclick="bookmarkPost('\${p.id}', this)">
                <svg class="ico" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                <span>\${p.saves_count || 0} Simpan</span>
              </button>
            </div>
            <button class="chain-btn" onclick="chainPost('\${p.id}')">
              <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>Sambung Bait</span>
            </button>
          </div>
        </div>
      \`;
    }

    function escapeHtml(t) {
      return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function switchFeed(mode, el) {
      currentMode = mode;
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      loadFeed();
    }

    async function submitPost() {
      const content = document.getElementById('postInput').value.trim();
      if (!content) return alert('Tuliskan bait puisi terlebih dahulu.');
      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        if (!res.ok) throw new Error('Gagal menerbitkan warkah');
        document.getElementById('postInput').value = '';
        loadFeed();
      } catch (err) {
        alert(err.message);
      }
    }

    loadFeed();
  </script>
</body>
</html>`;
}
