import { renderBottomNav } from './layout';

export function renderNotificationsPage(user: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktivitas — BERBIRRU.COM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,500&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root{--blue:#1D61E7;--deep:#0F3E99;--ink:#0B192C;--paper:#FFF9E9;--white:#FFFEF8;--yellow:#FDE047;--coral:#FF735F;--mint:#88E6BD;--soft:#E0EEFD;--red:#EF4444;--green:#059669;--line:3px solid var(--ink);--thin:2px solid var(--ink);--shadow:6px 7px 0 #26364A;--small-shadow:3px 4px 0 #26364A;--bg-main:var(--paper);--bg-card:#fff;--bg-blue-subtle:var(--soft);--shadow-ink:#26364A;--blue-primary:var(--blue);--blue-deep:var(--deep);--blue-light:#60A5FA;--accent-yellow:var(--yellow);--border-thick:var(--line);--border-med:3px solid var(--ink);--border-thin:var(--thin);--shadow-hard:var(--small-shadow);--shadow-hard-lg:var(--shadow);--shadow-hard-sm:2px 3px 0 #26364A;--radius:0;--radius-sm:0}
    body {
      font-family: 'DM Sans', -apple-system, sans-serif;
      background:var(--paper); color: var(--ink); min-height: 100vh;
      padding: 16px 14px 90px;
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
    .brand-badge h1 { font-family: 'Archivo Black', sans-serif; font-size: 19px; font-weight: 800; letter-spacing: 0.5px; }
    .brand-com-tag {
      font-family: 'Archivo Black', sans-serif; font-size: 26px; font-weight: 900;
      color: var(--blue-primary); position: relative; display: inline-block;
      transform: rotate(2deg); margin-left: 4px; margin-top: 2px; z-index: 1; line-height: 1;
      padding-bottom: 3px;
    }
    .brand-com-tag::after {
      content: ''; position: absolute; left: -24px; bottom: -3px; width: calc(100% + 28px); height: 6px;
      background: var(--accent-yellow); border-radius: 3px; z-index: -1;
    }

    /* Notification Feed */
    .notif-section-row {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      margin-bottom: 10px;
    }
    .notif-section-label {
      font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase;
      letter-spacing: 0.5px; margin: 0; display: block;
    }
    .btn-mark-read-small {
      background: none; border: none; padding: 0; cursor: pointer;
      display: inline-flex; align-items: center; gap: 4px;
      color: var(--blue-primary); font-size: 11px; font-weight: 800; font-family: inherit;
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
    .notif-avatar-stack { position: relative; flex-shrink: 0; display: flex; align-items: center; padding-left: 8px; }
    .notif-avatar-stack .notif-avatar.mini {
      width: 32px; height: 32px; font-size: 14px; border-radius: 10px;
      box-shadow: 0 0 0 2px #FFF; position: relative;
    }
    .notif-avatar-stack .action-badge { position: absolute; right: -5px; bottom: -5px; z-index: 20; }
    .notif-avatar {
      width: 44px; height: 44px; background: var(--blue-primary); color: #FFFFFF;
      border: var(--border-med); border-radius: 12px; display: grid; place-items: center;
      font-family: 'Archivo Black', sans-serif; font-size: 19px; font-weight: 900;
    }
    .action-badge {
      position: absolute; bottom: -4px; right: -4px; width: 18px; height: 18px;
      border: 1.5px solid var(--ink); border-radius: 50%; display: grid; place-items: center;
    }
    .badge-like { background: var(--accent-red); color: #FFF; }
    .badge-chain { background: var(--accent-yellow); color: var(--ink); }
    .badge-save { background: var(--blue-primary); color: #FFF; }
    .badge-follow { background: #10B981; color: #FFF; }
  .hub-link { display:inline-block;font:800 10.5px 'DM Sans';color:#0F3E99;text-decoration:none;background:#E0EEFD;
    border:2px solid #0B192C;padding:6px 10px;margin-bottom:12px;box-shadow:2px 2px 0 #26364A }
    

    .notif-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .notif-text { font-size: 13.5px; font-weight: 600; line-height: 1.4; color: #1E293B; }
    .notif-text b { font-weight: 800; color: var(--ink); }
    .notif-quote-preview {
      font-size: 12px; font-style: italic; color: #64748B; background: var(--bg-blue-subtle);
      padding: 4px 8px; border-radius: 4px; margin-top: 3px; display: inline-block;
    }
    .notif-time {
      font-family: 'Roboto Mono', monospace; font-size: 10px; font-weight: 700; color: #64748B; margin-top: 2px;
    }

    /* 5-TAB DOCKED BOTTOM NAVBAR — Lucide Style */
    .bottom-navbar {
      position:fixed;bottom:0;left:0;right:0;transform:none;width:100%;max-width:none;z-index:70;background:#fff;border-top:2px solid var(--ink);padding:6px 12px calc(6px + env(safe-area-inset-bottom));box-shadow:0 -5px 0 rgba(11,25,44,.07)
    }
    .navbar-inner {
      max-width:560px;margin:auto;background:transparent;border:0;border-radius:0;box-shadow:none;display:grid;grid-template-columns:repeat(5,1fr);padding:0
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
gap:2px;text-decoration:none;color:#6A788D;font-size:10px;font-weight:800;cursor:pointer;padding:0
    }
    .nav-item span { font-size:10px;font-weight:800; letter-spacing: -0.01em; }
    .nav-item svg { width: 20px; height: 20px; stroke: currentColor; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .nav-item.active { color: var(--blue-primary); }
    .nav-item.active span { color: var(--blue-primary); font-weight: 900; }
    .nav-item.active svg { stroke: var(--blue-primary); stroke-width: 2.3; }

    /* Middle Action Button (Pen Icon) */
    .nav-item-center {
      position: relative; top: -8px;
    }
    .btn-create-floating {
width:46px;height:46px;display:grid;place-items:center;background:var(--yellow);color:var(--ink);border:2.5px solid var(--ink);box-shadow:3px 3px 0 var(--ink);transform:rotate(-2deg)
    }
    .btn-create-floating svg { width: 20px; height: 20px; stroke: #0B192C; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
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
    </div>

    <!-- Notifications List Container -->
    <div class="notif-section-row">
      <span class="notif-section-label">Aktivitas Terbaru</span>
      <button class="btn-mark-read-small" onclick="markAllRead()">
        <svg class="ico" style="width:12px;height:12px;" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Tandai Dibaca</span>
      </button>
    </div>
    <div class="notif-list" id="notifListContainer">
      <div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">
        Memuat aktivitas...
      </div>
    </div>

  </div>

  <!-- 5-TAB DOCKED BOTTOM NAVBAR -->
  ${renderBottomNav('notifications', user, false)}

  <script>
    let notificationsBusy = false;
    let notificationsTimer = null;
    let notificationsFingerprint = null;
    const NOTIFICATIONS_POLL_MS = 12000;

    function scheduleNotificationsPoll() {
      clearTimeout(notificationsTimer);
      if (document.visibilityState !== 'visible') return;
      notificationsTimer = setTimeout(() => { loadNotifications(); }, NOTIFICATIONS_POLL_MS);
    }

    async function loadNotifications() {
      if (notificationsBusy || document.visibilityState !== 'visible') return;
      notificationsBusy = true;
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        const data = await res.json();
        const list = data.notifications || [];
        const fingerprint = list.map(n => [n.id, n.is_read, n.created_at].join(':')).join('|');
        // Dot unread di bottom nav (elemen dirender oleh layout; feed memakai fungsi sendiri).
        const dot = document.getElementById('notifDot');
        if (dot) {
          const unread = list.filter(n => !n.is_read).length;
          dot.style.display = unread > 0 ? 'block' : 'none';
        }
        const container = document.getElementById('notifListContainer');
        if (fingerprint !== notificationsFingerprint) {
          notificationsFingerprint = fingerprint;
          if (!list.length) {
            container.innerHTML = '<div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">Belum ada aktivitas baru. Bagikan warkahmu untuk mengundang tanggapan!</div>';
          } else {
            container.innerHTML = groupNotifs(list).map(renderNotifCard).join('');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        notificationsBusy = false;
        scheduleNotificationsPoll();
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') loadNotifications();
      else clearTimeout(notificationsTimer);
    });

    loadNotifications();

    // Kelompokkan ala TikTok: like/save/chain digroup per (tipe+post_id),
    // follow digroup per tipe — arena 1 baris: "A, B dan N lainnya ..."
    // ponytail: grouping murni di render, struktur DB tetap 1 baris per aktor.
    function groupNotifs(list) {
      const groups = [];
      const idx = new Map();
      for (const n of list) {
        const key = n.type === 'follow' ? 'follow' : n.type + ':' + (n.post_id || '');
        if (idx.has(key)) {
          groups[idx.get(key)].actors.push(n);
        } else {
          idx.set(key, groups.length);
          groups.push({ type: n.type, post_id: n.post_id, post_title: n.post_title, post_content: n.post_content,
            is_read: n.is_read, created_at: n.created_at, ids: [n.id], actors: [n] });
        }
      }
      return groups.map(g => ({
        id: g.ids[0], ids: g.ids, type: g.type, post_id: g.post_id,
        post_title: g.post_title, post_content: g.post_content,
        is_read: g.actors.some(a => !a.is_read),
        created_at: g.created_at,
        actor_pen_name: g.actors[0].actor_pen_name,
        actors: g.actors
      }));
    }

    function escapeHtml(t) {
      return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function renderNotifCard(n) {
      let badgeHtml = '';
      let actionText = '';
      const multi = n.actors && n.actors.length > 1;
      let targetLink = n.post_id ? '/feed#post-' + n.post_id : (multi ? '/notifications' : '/u/' + n.actor_pen_name);

      if (n.type === 'like') {
        badgeHtml = '<div class="action-badge badge-like"><svg style="width:9px;height:9px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>';
        actionText = multi ? 'menyukai warkahmu.' : 'terpaut pada warkahmu.';
      } else if (n.type === 'chain') {
        badgeHtml = '<div class="action-badge badge-chain"><svg style="width:9px;height:9px;stroke:#000;stroke-width:3;fill:none;" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>';
        actionText = 'menyambung bait warkahmu.';
      } else if (n.type === 'save') {
        badgeHtml = '<div class="action-badge badge-save"><svg style="width:8px;height:8px;fill:#FFF;stroke:#FFF;" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>';
        actionText = 'menyimpan warkahmu ke pustaka.';
      } else if (n.type === 'follow') {
        badgeHtml = '<div class="action-badge badge-follow"><svg style="width:9px;height:9px;stroke:#FFF;stroke-width:3;fill:none;" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>';
        actionText = multi ? 'mulai mengikuti goresan warkahmu.' : 'mulai mengikuti goresan warkahmu.';
      }

      // Teks aktor: "A" | "A dan B" | "A dan N lainnya" (maks 2 nama, sisanya dihitung)
      let actorHtml = '';
      if (multi) {
        const names = n.actors.map(a => a.actor_pen_name);
        const shown = names.slice(0, 2);
        const rest = names.length - shown.length;
        actorHtml = shown.map(s => '<b>@' + escapeHtml(s) + '</b>').join(' dan ') + (rest > 0 ? ' dan ' + rest + ' lainnya' : '');
      } else {
        actorHtml = '<b>@' + escapeHtml(n.actor_pen_name) + '</b>';
      }

      // Avatar: tunggal normal; multi = tumpuk 2-3 lingkaran kecil
      let avatarHtml = '';
      if (multi) {
        const upTo = n.actors.slice(0, 3);
        avatarHtml = '<div class="notif-avatar-stack">' + upTo.map((a, i) =>
          '<div class="notif-avatar mini" style="margin-left:' + (i * -8) + 'px;z-index:' + (10 - i) + '">' + ((a.actor_pen_name[0] || 'D').toUpperCase()) + '</div>'
        ).join('') + badgeHtml + '</div>';
      } else {
        avatarHtml = '<div class="notif-avatar-wrap"><div class="notif-avatar">' + ((n.actor_pen_name[0] || 'D').toUpperCase()) + '</div>' + badgeHtml + '</div>';
      }

      const allIds = (n.ids || [n.id]).join("','");
      const onClick = "markOneRead('" + allIds + "')";

      let card = '<a href="' + targetLink + '" class="notif-card ' + (n.is_read ? '' : 'unread') + '" onclick="' + onClick + '">';
      card += avatarHtml;
      card += '<div class="notif-content">';
      card += '<div class="notif-text">' + actorHtml + ' ' + actionText + '</div>';
      if (n.post_title) card += '<div class="notif-quote-preview">"' + escapeHtml(n.post_title) + '"</div>';
      card += '<div class="notif-time">' + escapeHtml(n.created_at) + '</div>';
      card += '</div></a>';
      return card;
    }

    async function markAllRead() {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      loadNotifications();
    }

    async function markOneRead(ids) {
      // ids: 'a' atau 'a','b','c' — grup dibaca semua sekaligus
      const list = String(ids).split("','");
      await Promise.all(list.map(id => fetch('/api/notifications/' + encodeURIComponent(id) + '/read', { method: 'POST' })));
      loadNotifications();
    }

    loadNotifications();
  </script>
</body>
</html>`;
}
