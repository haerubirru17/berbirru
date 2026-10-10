export function renderNotificationsPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktivitas — BERBIRRU.COM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-main: #F0F6FE; --bg-card: #FFFFFF; --bg-blue-subtle: #E0EEFD;
      --ink: #0B192C; --shadow-ink: #1E293B; --blue-primary: #1D61E7;
      --accent-yellow: #FDE047; --accent-red: #EF4444;
      --border-thick: 3px solid var(--ink); --border-med: 2px solid var(--ink); --border-thin: 1.5px solid var(--ink);
      --shadow-hard: 4px 4px 0 var(--shadow-ink); --shadow-hard-sm: 2px 2px 0 var(--shadow-ink);
      --radius: 16px; --radius-sm: 10px;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg-main); color: var(--ink); min-height: 100vh;
      background-image: radial-gradient(#CBD5E1 1.5px, transparent 1.5px);
      background-size: 22px 22px; padding: 16px 14px 90px;
    }
    .container { max-width: 480px; margin: 0 auto; }

    /* Top Bar */
    .top-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;
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

    .btn-mark-read {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 6px 12px; font-size: 11.5px; font-weight: 800; box-shadow: var(--shadow-hard-sm);
      cursor: pointer; display: flex; align-items: center; gap: 4px; color: var(--ink);
    }

    /* Notification Feed */
    .notif-section-label {
      font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 10px; display: block;
    }
    .notif-list { display: flex; flex-direction: column; gap: 10px; }

    .notif-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); padding: 12px 14px; display: flex; gap: 12px;
      align-items: flex-start; text-decoration: none; color: var(--ink); position: relative;
    }
    .notif-card.unread {
      background: #FFFFFF;
      border-left: 6px solid var(--blue-primary);
    }

    /* Avatar with Action Badge Clip */
    .notif-avatar-wrap { position: relative; flex-shrink: 0; }
    .notif-avatar {
      width: 44px; height: 44px; background: var(--blue-primary); color: #FFFFFF;
      border: var(--border-med); border-radius: 12px; display: grid; place-items: center;
      font-family: 'Space Grotesk', sans-serif; font-size: 19px; font-weight: 900;
    }
    .action-badge {
      position: absolute; bottom: -4px; right: -4px; width: 18px; height: 18px;
      border: 1.5px solid var(--ink); border-radius: 50%; display: grid; place-items: center;
    }
    .badge-like { background: var(--accent-red); color: #FFF; }
    .badge-chain { background: var(--accent-yellow); color: var(--ink); }
    .badge-save { background: var(--blue-primary); color: #FFF; }
    .badge-follow { background: #10B981; color: #FFF; }

    .notif-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .notif-text { font-size: 13.5px; font-weight: 600; line-height: 1.4; color: #1E293B; }
    .notif-text b { font-weight: 800; color: var(--ink); }
    .notif-quote-preview {
      font-size: 12px; font-style: italic; color: #64748B; background: var(--bg-blue-subtle);
      padding: 4px 8px; border-radius: 4px; margin-top: 3px; display: inline-block;
    }
    .notif-time {
      font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: #64748B; margin-top: 2px;
    }

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

    .ico { width: 18px; height: 18px; stroke: currentColor; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Top Header -->
    <div class="top-header">
      <a href="/" class="brand-wrap">
        <div class="brand-badge">
          <svg class="ico" style="width:16px;height:16px;" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <h1>BERBIRRU</h1>
        </div>
        <span class="brand-com-tag">.com</span>
      </a>
      <button class="btn-mark-read" onclick="markAllRead()">
        <svg class="ico" style="width:13px;height:13px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Tandai Dibaca</span>
      </button>
    </div>

    <!-- Notifications List Container -->
    <span class="notif-section-label">Aktivitas Terbaru</span>
    <div class="notif-list" id="notifListContainer">
      <div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">
        Memuat aktivitas...
      </div>
    </div>

  </div>

  <!-- 5-TAB DOCKED BOTTOM NAVBAR -->
  <nav class="bottom-navbar">
    <div class="navbar-inner">
      <a href="/feed" class="nav-item">
        <svg class="ico" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Beranda</span>
      </a>

      <a href="/feed?tab=search" class="nav-item">
        <svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Telusuri</span>
      </a>

      <a href="/feed?action=compose" class="nav-item nav-item-center">
        <div class="btn-create-floating">
          <svg style="width:19px;height:19px;stroke:#0B192C;stroke-width:2.5;fill:none;" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>
        </div>
      </a>

      <a href="/notifications" class="nav-item active">
        <div class="bell-wrap">
          <svg class="ico" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
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
    async function loadNotifications() {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        const container = document.getElementById('notifListContainer');

        if (!data.notifications || !data.notifications.length) {
          container.innerHTML = '<div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">Belum ada aktivitas baru. Bagikan warkahmu untuk mengundang tanggapan!</div>';
          return;
        }

        container.innerHTML = data.notifications.map(n => renderNotifCard(n)).join('');
      } catch (err) {
        console.error(err);
      }
    }

    function escapeHtml(t) {
      return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function renderNotifCard(n) {
      let badgeHtml = '';
      let actionText = '';
      let targetLink = n.post_id ? '/feed#post-' + n.post_id : '/u/' + n.actor_pen_name;

      if (n.type === 'like') {
        badgeHtml = '<div class="action-badge badge-like"><svg style="width:9px;height:9px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>';
        actionText = 'terpaut pada warkahmu.';
      } else if (n.type === 'chain') {
        badgeHtml = '<div class="action-badge badge-chain"><svg style="width:9px;height:9px;stroke:#000;stroke-width:3;fill:none;" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>';
        actionText = 'menyambung bait warkahmu.';
      } else if (n.type === 'save') {
        badgeHtml = '<div class="action-badge badge-save"><svg style="width:8px;height:8px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>';
        actionText = 'menyimpan warkahmu ke pustaka.';
      } else if (n.type === 'follow') {
        badgeHtml = '<div class="action-badge badge-follow"><svg style="width:9px;height:9px;stroke:#FFF;stroke-width:3;fill:none;" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>';
        actionText = 'mulai mengikuti goresan warkahmu.';
      }

      return \`
        <a href="\${targetLink}" class="notif-card \${n.is_read ? '' : 'unread'}" onclick="markOneRead('\${n.id}')">
          <div class="notif-avatar-wrap">
            <div class="notif-avatar">\${(n.actor_pen_name[0] || 'D').toUpperCase()}</div>
            \${badgeHtml}
          </div>
          <div class="notif-content">
            <div class="notif-text"><b>@\${escapeHtml(n.actor_pen_name)}</b> \${actionText}</div>
            \${n.post_title ? \`<div class="notif-quote-preview">"\${escapeHtml(n.post_title)}"</div>\` : ''}
            <div class="notif-time">\${escapeHtml(n.created_at)}</div>
          </div>
        </a>
      \`;
    }

    async function markAllRead() {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      loadNotifications();
    }

    async function markOneRead(id) {
      await fetch('/api/notifications/' + id + '/read', { method: 'POST' });
    }

    loadNotifications();
  </script>
</body>
</html>`;
}
