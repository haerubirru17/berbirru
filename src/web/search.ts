import { renderBottomNav } from './layout';

export function renderSearchPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telusuri — BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <meta property="og:title" content="Telusuri — BERBIRRU.COM">
  <meta property="og:description" content="Cari penulis dan warkah di BERBIRRU.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-main: #F0F6FE; --bg-card: #FFFFFF; --bg-blue-subtle: #E0EEFD;
      --ink: #0B192C; --shadow-ink: #1E293B; --blue-primary: #1D61E7;
      --blue-deep: #0F3E99; --blue-light: #60A5FA; --accent-yellow: #FDE047;
      --border-thick: 3px solid var(--ink); --border-med: 2.5px solid var(--ink); --border-thin: 2px solid var(--ink);
      --shadow-hard: 4px 4px 0 var(--shadow-ink); --shadow-hard-sm: 2.5px 2.5px 0 var(--shadow-ink);
      --radius: 16px; --radius-sm: 10px;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: #FBF8F3; color: var(--ink); min-height: 100vh;
      padding: 20px 16px 80px;
    }
    .container { max-width: 480px; margin: 0 auto; }
    .search-hero { margin-bottom: 16px; }
    .search-title { font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 12px; }
    .search-box { display: flex; gap: 8px; }
    .search-input {
      flex: 1; font: inherit; font-size: 14px; font-weight: 700; padding: 12px 14px;
      border: var(--border-med); border-radius: var(--radius-sm); background: #FFFFFF; color: var(--ink);
      outline: none; box-shadow: var(--shadow-hard-sm); min-width: 0;
    }
    .search-input:focus { border-color: var(--blue-primary); }
    .search-btn {
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-med);
      border-radius: var(--radius-sm); padding: 0 14px; font-size: 12px; font-weight: 900;
      box-shadow: var(--shadow-hard-sm); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    }
    .search-btn:active { transform: translate(1.5px, 1.5px); box-shadow: none; }
    .search-hint { font-size: 11.5px; color: #64748B; margin-top: 8px; font-weight: 600; }
    /* Saran akun instan (autocomplete) */
    .suggest-wrap { position: relative; }
    .suggest-list {
      position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 200;
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      box-shadow: var(--shadow-hard); overflow: hidden; display: none;
    }
    .suggest-list.show { display: block; }
    .suggest-item {
      display: flex; align-items: center; gap: 10px; padding: 9px 12px; cursor: pointer;
      text-decoration: none; color: var(--ink); border-bottom: 1px solid #E2E8F0;
    }
    .suggest-item:last-child { border-bottom: none; }
    .suggest-item:active { background: var(--bg-blue-subtle); }
    .suggest-item .chip-avatar { width: 32px; height: 32px; border-radius: 10px; font-size: 13px; }
    .suggest-item .chip-pen { font-weight: 800; font-size: 13px; }
    .suggest-item .chip-city { font-size: 11px; }
    .result-section-title { font-size: 11.5px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #64748B; margin: 18px 0 8px; }
    .user-chip {
      display: flex; align-items: center; gap: 10px; background: var(--bg-card);
      border: var(--border-thin); border-radius: var(--radius-sm); padding: 10px 12px;
      margin-bottom: 8px; text-decoration: none; color: var(--ink); box-shadow: var(--shadow-hard-sm);
    }
    .user-chip:active { transform: translate(1.5px, 1.5px); box-shadow: none; }
    .chip-avatar {
      width: 38px; height: 38px; border-radius: 12px; border: var(--border-thin);
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 15px; color: #FFFFFF; flex-shrink: 0;
    }
    .chip-meta { min-width: 0; }
    .chip-pen { font-weight: 800; font-size: 13.5px; }
    .chip-city { font-size: 11.5px; color: #64748B; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    /* Kartu warkah hasil cari — kembar kartu feed (desain terkunci) */
    .thread-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); overflow: hidden; margin-bottom: 10px;
    }
    .thread-header-soft {
      background: var(--bg-blue-subtle); padding: 8px 12px 8px 68px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin);
    }
    /* footer 1 baris */
    .thread-footer {
      padding: 8px 10px; background: #FFFFFF; border-top: var(--border-thin);
      display: flex; justify-content: space-between; align-items: center; flex-wrap: nowrap; overflow: hidden; gap: 8px;
    }
    .res-empty {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); padding: 24px 18px; text-align: center; margin-top: 18px;
    }
    .res-empty p { font-size: 13.5px; font-weight: 600; color: #475569; line-height: 1.6; margin-bottom: 14px; }
    .res-empty a.btn-write {
      display: inline-block; background: var(--accent-yellow); border: var(--border-med);
      border-radius: var(--radius-sm); padding: 8px 16px; font-weight: 900; font-size: 12.5px;
      color: var(--ink); text-decoration: none; box-shadow: var(--shadow-hard-sm); cursor: pointer;
    }
    /* 5-TAB DOCKED BOTTOM NAVBAR — Shadcn / Lucide Style (kembar feed) */
    .bottom-navbar {
      position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-top: 1.5px solid #0B192C; padding: 6px 12px calc(6px + env(safe-area-inset-bottom));
      display: flex; justify-content: space-between; z-index: 1000; box-shadow: 0 -4px 20px rgba(11,25,44,0.08);
    }
    .navbar-inner {
      width: 100%; max-width: 480px; margin: 0 auto; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; align-items: center;
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 3px; text-decoration: none; color: #64748B; padding: 5px 0; cursor: pointer;
      transition: color 0.15s ease, transform 0.1s ease;
    }
    .nav-item span { font-size: 10.5px; font-weight: 700; letter-spacing: -0.01em; }
    .nav-item svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .nav-item.active { color: var(--blue-primary); }
    .nav-item.active span { color: var(--blue-primary); font-weight: 900; }
    .nav-item.active svg { stroke: var(--blue-primary); stroke-width: 2.3; }
    .nav-item-center { position: relative; top: -8px; }
    .btn-create-floating {
      width: 46px; height: 46px; background: var(--accent-yellow); color: var(--ink);
      border: 2.5px solid var(--ink); border-radius: 14px; display: grid; place-items: center;
      box-shadow: 2.5px 2.5px 0 var(--shadow-ink); transform: rotate(-2deg); transition: transform 0.05s ease;
    }
    .btn-create-floating svg { width: 20px; height: 20px; stroke: #0B192C; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .btn-create-floating:active { transform: translate(1.5px, 1.5px); box-shadow: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="search-hero">
      <h1 class="search-title">Telusuri 🔍</h1>
      <div class="search-box suggest-wrap">
        <input type="text" id="searchInput" class="search-input" placeholder="Cari @nama_pena atau kata kunci..." autocomplete="off">
        <button class="search-btn" onclick="doSearch()">
          <svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;stroke-width:2.5;fill:none;stroke-linecap:round;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <div id="suggestList" class="suggest-list"></div>
      </div>
      <p class="search-hint">Cari penulis dengan @ di depan · warkah dengan kata kunci</p>
      <button onclick="doSearch()" id="searchEnterHook" style="display:none;">​</button>
    </div>

    <div id="searchResults"></div>
  </div>

  <!-- 5-TAB DOCKED BOTTOM NAVBAR -->
  ${renderBottomNav('search', user, false)}

  <script>
    const input = document.getElementById('searchInput');
    input.focus();

    function escapeHtml(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function avatarColor(name) {
      let h = 0;
      for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
      return 'hsl(' + (h % 360) + ' 55% 45%)';
    }

    async function doSearch() {
      const q = input.value.trim();
      const box = document.getElementById('searchResults');
      if (!q) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="res-empty"><p>Menelusuri…</p></div>';
      try {
        // 1) Cari akun (khusus awalan @; pakai endpoint profil yang sudah ada, strict equality by route)
        let usersHTML = '';
        if (q.startsWith('@')) {
          const uname = q.slice(1).replace(/^@+/, '').toLowerCase();
          if (uname) {
            const res = await fetch('/api/users/' + encodeURIComponent(uname));
            if (res.ok) {
              const data = await res.json();
              const u = data.user || data;
              usersHTML = '<h2 class="result-section-title">Penulis</h2>'
                + '<a class="user-chip" href="/u/' + encodeURIComponent(u.pen_name) + '">'
                + '<div class="chip-avatar" style="background:' + avatarColor(u.pen_name) + ';">' + escapeHtml((u.pen_name[0] || 'D').toUpperCase()) + '</div>'
                + '<div class="chip-meta"><div class="chip-pen">@' + escapeHtml(u.pen_name) + '</div>'
                + (u.city ? '<div class="chip-city">' + escapeHtml(u.city) + '</div>' : '')
                + '</div></a>';
            } else if (res.status === 404) {
              usersHTML = '<h2 class="result-section-title">Penulis</h2><p style="font-size:12.5px;color:#64748B;font-weight:600;">Penulis @' + escapeHtml(uname) + ' tidak ditemukan.</p>';
            }
          }
        }

        // 2) Cari warkah — reuse /api/posts?q= (sudah hidup, backend nol baru)
        let postsHTML = '';
        const res2 = await fetch('/api/posts?q=' + encodeURIComponent(q));
        const data2 = await res2.json();
        if (data2.posts && data2.posts.length) {
          postsHTML = '<h2 class="result-section-title">Warkah</h2>' + data2.posts.map(p => renderWarkah(p)).join('');
        }

        if (!usersHTML && !postsHTML) {
          box.innerHTML = '<div class="res-empty"><p>Belum ada yang menulis tentang "' + escapeHtml(q) + '"…<br>jadilah yang pertama ✍️</p><a class="btn-write" href="/feed?action=compose">Tulis warkah</a></div>';
          return;
        }
        box.innerHTML = usersHTML + postsHTML;
      } catch (err) {
        box.innerHTML = '<div class="res-empty"><p>Ada gangguan jaringan. Coba lagi ya.</p></div>';
      }
    }

    function renderWarkah(p) {
      const href = '/u/' + encodeURIComponent(p.pen_name);
      return '<div class="thread-card">'
        + '<div class="thread-header-soft" style="padding-left:12px;gap:8px;">'
        + '<a href="' + href + '" style="text-decoration:none;color:inherit;font-weight:800;font-size:13px;">@' + escapeHtml(p.pen_name) + '</a>'
        + '</div>'
        + '<div style="padding:12px 14px;">'
        + (p.title ? '<div style="font-family:\\'Newsreader\\',serif;font-size:17px;font-weight:600;margin-bottom:6px;">' + escapeHtml(p.title) + '</div>' : '')
        + '<div style="font-size:14px;line-height:1.6;color:#334155;">' + String(p.content || '') + '</div>'
        + '</div>'
        + '<div class="thread-footer"><span style="font-size:11.5px;font-weight:800;color:#1D61E7;">'
        + (p.likes_count || 0) + ' Terpaut · ' + (p.saves_count || 0) + ' Simpan · ' + (p.chains_count || 0) + ' Sambungan</span>'
        + '<a href="' + href + '" style="font-size:11.5px;font-weight:800;color:#64748B;text-decoration:none;flex-shrink:0;">Lihat</a>'
        + '</div></div>';
    }

    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

    // Saran akun instan: 1-2 huruf pun langsung muncul (debounce 250ms)
    let suggestTimer = null;
    let suggestSeq = 0;
    function hideSuggest() {
      document.getElementById('suggestList').classList.remove('show');
    }
    input.addEventListener('input', () => {
      clearTimeout(suggestTimer);
      const q = input.value.trim().replace(/^@+/, '');
      if (q.length < 1) { hideSuggest(); return; }
      suggestTimer = setTimeout(showSuggest, 250);
    });
    input.addEventListener('blur', () => { setTimeout(hideSuggest, 180); });

    async function showSuggest() {
      const q = input.value.trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_.]/g, '');
      const list = document.getElementById('suggestList');
      if (!q) { hideSuggest(); return; }
      const seq = ++suggestSeq;
      try {
        const res = await fetch('/api/users/suggest?q=' + encodeURIComponent(q));
        const data = await res.json();
        if (seq !== suggestSeq) return; // jawaban basi, abaikan
        const users = data.users || [];
        if (!users.length) { hideSuggest(); return; }
        list.innerHTML = users.map(u =>
          '<a class="suggest-item" href="/u/' + encodeURIComponent(u.pen_name) + '">'
          + '<div class="chip-avatar" style="background:' + avatarColor(u.pen_name) + ';">' + escapeHtml((u.pen_name[0] || 'D').toUpperCase()) + '</div>'
          + '<div class="chip-meta"><div class="chip-pen">@' + escapeHtml(u.pen_name) + '</div>'
          + (u.city ? '<div class="chip-city">' + escapeHtml(u.city) + '</div>' : '')
          + '</div></a>'
        ).join('');
        list.classList.add('show');
      } catch (err) { hideSuggest(); }
    }
  </script>
</body>
</html>`;
}
