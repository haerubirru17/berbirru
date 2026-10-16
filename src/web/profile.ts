import { renderBottomNav } from './layout';
import { NOTIFY_HTML } from './notify';

export function renderProfilePage(penName: string, isMe = false, currentUser: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@${penName} — Paspor Penulis BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <meta property="og:title" content="@${penName} — Paspor Penulis BERBIRRU.COM">
  <meta property="og:description" content="Kumpulan antologi puisi, warkah, dan kutipan rasa dari @${penName}.">
  <meta property="og:image" content="https://berbirru.com/og-image.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@600;800&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
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
      font-family: 'DM Sans', -apple-system, sans-serif;
      background-color: var(--paper, #FBF8F3); color: var(--ink); min-height: 100vh;
      padding: 12px 14px 90px;
    }
    .container { max-width: 480px; margin: 0 auto; position: relative; }

    /* Profile Card with Integrated Cover Banner (Zero Dead Space) */
    .profile-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: hidden; margin-bottom: 18px; position: relative;
    }

    /* Banner Gradasi Transparan Halus ke Bawah */
    .cover-banner {
      height: 120px; width: 100%;
      background: linear-gradient(180deg, #1D61E7 0%, rgba(29, 97, 231, 0.45) 60%, rgba(251, 248, 243, 0) 100%);
      position: relative;
    }

    /* Floating Navigation di dalam banner */
    .banner-floating-nav {
      position: absolute; top: 10px; left: 10px; right: 10px;
      display: flex; justify-content: space-between; align-items: center; z-index: 10;
    }
    .nav-btn-glass {
      background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px);
      border: 1.5px solid #0B192C; border-radius: 99px; padding: 5px 12px;
      font-size: 11.5px; font-weight: 800; color: var(--ink); text-decoration: none;
      box-shadow: 2px 2px 0 var(--shadow-ink); display: inline-flex; align-items: center; gap: 4px;
    }
    .nav-menu-glass {
      width: 32px; height: 32px; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px);
      border: 1.5px solid #0B192C; border-radius: 10px; display: grid; place-items: center;
      box-shadow: 2px 2px 0 var(--shadow-ink); cursor: pointer; color: var(--ink);
    }
    .nav-btn-glass:active, .nav-menu-glass:active { transform: translate(1px, 1px); box-shadow: none; }

    /* Settings Menu Dropdown */
    .settings-popover {
      display: none; position: absolute; top: 48px; right: 10px; width: 190px;
      background: #FFFFFF; border: var(--border-thick); border-radius: var(--radius-sm);
      box-shadow: var(--shadow-hard); z-index: 100; padding: 6px; flex-direction: column; gap: 2px;
    }
    .settings-item {
      padding: 8px 10px; border-radius: 6px; font-size: 11.5px; font-weight: 800;
      color: var(--ink); display: flex; align-items: center; gap: 8px; cursor: pointer;
      text-decoration: none;
    }
    .settings-item:hover, .settings-item:active { background: var(--bg-blue-subtle); color: var(--blue-primary); }
    .settings-item.danger { color: var(--accent-red); }
    .settings-item.danger:hover, .settings-item.danger:active { background: #FEE2E2; }
    .settings-divider { height: 1px; background: #E2E8F0; margin: 3px 6px; }

    /* Profile Content */
    .profile-meta-wrap { padding: 0 16px 16px; }
    .avatar-action-row {
      display: flex; justify-content: space-between; align-items: flex-end;
      margin-top: -38px; margin-bottom: 12px;
    }
    .avatar-wrapper { position: relative; display: inline-flex; }
    .avatar-box {
      width: 72px; height: 72px; background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: 18px; display: grid; place-items: center; font-family: 'Newsreader', serif;
      font-size: 34px; font-weight: 700; box-shadow: var(--shadow-hard-sm); flex-shrink: 0;
      position: relative; user-select: none;
    }
    .btn-follow-badge {
      position: absolute; right: -8px; bottom: -4px; width: 28px; height: 28px;
      background: var(--accent-yellow); color: var(--ink); border: 2px solid var(--ink);
      border-radius: 50%; display: grid; place-items: center; box-shadow: 2px 2px 0 var(--shadow-ink);
      cursor: pointer; transition: transform 0.1s ease; z-index: 5;
    }
    .btn-follow-badge svg { width: 14px; height: 14px; stroke: #0B192C; stroke-width: 3; fill: none; }
    .btn-follow-badge:active { transform: scale(0.92); box-shadow: none; }
    .profile-right-actions {
      display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
    }
    .city-badge-top {
      font-size: 11px; font-weight: 800; color: var(--blue-primary); background: var(--bg-blue-subtle);
      padding: 4px 10px; border-radius: 99px; border: 1.5px solid var(--ink);
      box-shadow: 2px 2px 0 var(--shadow-ink); display: inline-flex; align-items: center; gap: 4px;
    }
    .pen-name-group { display: flex; flex-direction: column; margin-bottom: 8px; }
    .bio-box {
      font-size: 13.5px; font-weight: 500; line-height: 1.5; color: #334155; margin-bottom: 14px;
    }
    
    /* Reddit-Style 3-Column Metrics */
    .reddit-stats-row {
      display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1.5px solid #E2E8F0;
      padding-top: 12px; margin-top: 4px;
    }
    .stat-col {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      border-right: 1.5px solid #E2E8F0;
    }
    .stat-col:last-child { border-right: none; }
    .stat-number {
      font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 800; color: var(--ink);
      line-height: 1; margin-bottom: 2px;
    }
    .stat-label {
      font-size: 9.5px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* Tab Underline Bersih (Hanya 1 Aktif) */
    .profile-tabs-reddit {
      display: flex; border-bottom: 2px solid #E2E8F0; margin-bottom: 16px; justify-content: space-around; padding: 0 4px;
    }
    .tab-reddit-item {
      padding: 9px 8px; font-size: 12.5px; font-weight: 700; color: #64748B;
      cursor: pointer; position: relative; text-decoration: none; user-select: none;
    }
    .tab-reddit-item.active {
      color: var(--blue-primary); font-weight: 800;
    }
    .tab-reddit-item.active::after {
      content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 3px;
      background: var(--blue-primary); border-radius: 3px 3px 0 0;
    }
    .feed-list { display: flex; flex-direction: column; gap: 16px; }

    /* Unified Threads Card Style in Profile with Paperclip Badge */
    .feed-list { display: flex; flex-direction: column; gap: 20px; }
    .thread-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: 0px;
      box-shadow: var(--shadow-hard-lg); overflow: visible; position: relative; margin-top: 14px;
    }
    .thread-header-soft {
      background: var(--bg-blue-subtle); padding: 8px 12px 8px 68px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin); border-radius: 0px;
      min-height: 44px; position: relative;
    }
    .thread-author-wrap { display: flex; align-items: center; gap: 8px; }
    
    /* Paperclip Avatar */
    .thread-avatar-clip {
      position: absolute; left: 10px; top: -14px; width: 48px; height: 50px;
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: 0px; display: grid; place-items: center; font-family: 'Space Grotesk', sans-serif;
      font-size: 23px; font-weight: 900; box-shadow: none;
      transform: rotate(-2deg); z-index: 5;
    }
    .paperclip-svg {
      position: absolute; top: -10px; right: -7px; width: 18px; height: 28px;
      z-index: 6; transform: rotate(18deg); filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.25));
    }

    .thread-author-info { display: flex; flex-direction: column; line-height: 1.25; }
    .thread-pen-name { font-size: 13px; font-weight: 800; color: var(--ink); text-decoration: none; }
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
      background: #F8FAFC;
      border-left: 3.5px solid var(--ink);
      padding: 10px 14px;
      margin: 10px 0;
      font-style: italic;
      border-radius: 4px;
      color: #334155;
    }
    
    .font-serif { font-family: 'Merriweather', serif !important; }
    .font-sans { font-family: 'Plus Jakarta Sans', sans-serif !important; }
    .font-mono { font-family: 'JetBrains Mono', monospace !important; background: #E0EEFD; padding: 1px 4px; border-radius: 4px; }

    .thread-footer {
      padding: 8px 12px; background: #FFFFFF; border-top: var(--border-thin);
      display: flex; justify-content: space-between; align-items: center;
      border-bottom-left-radius: 13px; border-bottom-right-radius: 13px;
    }
    
    /* Popover Menu Aksi Profil */
    .avatar-popover {
      display: none; position: absolute; top: 64px; left: 0; background: #FFFFFF; border: var(--border-thick);
      border-radius: var(--radius-sm); box-shadow: var(--shadow-hard); z-index: 10; width: 170px; overflow: hidden;
    }
    .avatar-popover-item {
      padding: 10px 14px; font-size: 12px; font-weight: 800; color: var(--ink); display: flex; align-items: center;
      gap: 8px; cursor: pointer; border-bottom: var(--border-thin); text-decoration: none;
    }
    .avatar-popover-item:last-child { border-bottom: none; color: #EF4444; }
    .avatar-popover-item:hover { background: var(--bg-blue-subtle); }

    .edit-modal {
      display: none; background: #FFF; border: var(--border-thick); border-radius: var(--radius);
      padding: 18px; margin-bottom: 20px; box-shadow: var(--shadow-hard);
    }
    /* 5-TAB DOCKED BOTTOM NAVBAR — Lucide Style */
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

    /* Middle Action Button (Pen Icon) */
    .nav-item-center {
      position: relative; top: -8px;
    }
    .btn-create-floating {
      width: 46px; height: 46px; background: var(--accent-yellow); color: var(--ink);
      border: 2.5px solid var(--ink); border-radius: 14px; display: grid; place-items: center;
      box-shadow: 2.5px 2.5px 0 var(--shadow-ink); transform: rotate(-2deg); transition: transform 0.05s ease;
    }
    .btn-create-floating svg { width: 20px; height: 20px; stroke: #0B192C; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
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

    <!-- Profile Card with Cover/Banner Header -->
    <div class="profile-card">
      <div class="cover-banner">
        <!-- Floating Navigation di dalam banner -->
        <div class="banner-floating-nav">
          <a href="/feed" class="nav-btn-glass">
            <svg style="width:13px;height:13px;stroke:currentColor;stroke-width:2.5;fill:none;" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>
            <span>Feed</span>
          </a>

          <button class="nav-menu-glass" onclick="toggleSettingsMenu(event)" aria-label="Menu Pengaturan">
            <svg style="width:16px;height:16px;stroke:currentColor;stroke-width:2.4;fill:none;stroke-linecap:round;" viewBox="0 0 24 24"><line x1="4" x2="20" y1="7" y2="7"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="17" y2="17"/></svg>
          </button>
          <div class="settings-popover" id="settingsPopover">
            ${isMe ? `
              <div class="settings-item" onclick="toggleEditModal(true); toggleSettingsMenu(false);">
                <svg style="width:14px;height:14px;stroke:currentColor;stroke-width:2.2;fill:none;" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>Edit Profil</span>
              </div>
              <div class="settings-item" onclick="bbToast('BERBIRRU — Platform sastra & kolaborasi warkah di edge.', 'info'); toggleSettingsMenu(false);">
                <svg style="width:14px;height:14px;stroke:currentColor;stroke-width:2.2;fill:none;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                <span>Informasi Akun</span>
              </div>
              <div class="settings-divider"></div>
              <div class="settings-item danger" onclick="handleLogout()">
                <svg style="width:14px;height:14px;stroke:currentColor;stroke-width:2.2;fill:none;" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Keluar Akun</span>
              </div>
            ` : `
              <div class="settings-item" onclick="navigator.clipboard.writeText(location.href); bbToast('Tautan profil disalin!', 'success'); toggleSettingsMenu(false);">
                <svg style="width:14px;height:14px;stroke:currentColor;stroke-width:2.2;fill:none;" viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                <span>Salin Tautan</span>
              </div>
              <div class="settings-divider"></div>
              <div class="settings-item danger" onclick="bbToast('Laporan diterima untuk ditinjau.', 'success'); toggleSettingsMenu(false);">
                <svg style="width:14px;height:14px;stroke:currentColor;stroke-width:2.2;fill:none;" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
                <span>Laporkan Akun</span>
              </div>
            `}
          </div>
        </div>
      </div>

      <div class="profile-meta-wrap">
        <div class="avatar-action-row">
          <div class="avatar-wrapper">
            <div class="avatar-box" id="avatarLetter">
              ${(penName[0] || 'D').toUpperCase()}
            </div>
            ${!isMe ? `
              <button class="btn-follow-badge" onclick="followUser('${penName}')" aria-label="Ikuti Penulis" title="Ikuti Penulis">
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            ` : ''}
          </div>
          <div class="profile-right-actions">
            <div class="city-badge-top">
              <svg style="width:11px;height:11px;stroke:currentColor;stroke-width:2.5;fill:none;" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <span id="cityDisplay">Nusantara</span>
            </div>
          </div>
        </div>

        <div class="pen-name-group">
          <span class="display-name-main">${penName}</span>
          <span class="pen-name" id="penNameDisplay">@${penName}</span>
        </div>

        <div class="bio-box" id="bioDisplay">
          "Goresan perenungan rasa dan bait kata di Berbirru."
        </div>

        <div class="reddit-stats-row">
          <div class="stat-col">
            <span class="stat-number" id="countPosts">0</span>
            <span class="stat-label">Warkah</span>
          </div>
          <div class="stat-col">
            <span class="stat-number" id="countLikes">0</span>
            <span class="stat-label">Terpaut</span>
          </div>
          <div class="stat-col">
            <span class="stat-number" id="countSaved">0</span>
            <span class="stat-label">Tersimpan</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div class="edit-modal" id="editModal">
      <h3 style="font-family:'Space Grotesk';font-size:15px;font-weight:800;margin-bottom:10px;">Perbarui Profil Anda</h3>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Nama Pena</label>
        <input type="text" id="editPenName" style="width:100%;padding:8px;border:2px solid #0B192C;border-radius:8px;font-weight:700;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Kota / Asal</label>
        <input type="text" id="editCity" style="width:100%;padding:8px;border:2px solid #0B192C;border-radius:8px;font-weight:700;">
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Bio / Catatan Pribadi</label>
        <textarea id="editBio" style="width:100%;height:60px;padding:8px;border:2px solid #0B192C;border-radius:8px;font-weight:600;"></textarea>
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Kata Sandi Baru <span style="color:#64748B;font-weight:600;">(opsional)</span></label>
        <input type="password" id="editPassword" autocomplete="new-password" placeholder="Kosongkan bila tidak diganti" oninput="document.getElementById('currentPasswordRow').style.display=this.value?'block':'none'" style="width:100%;padding:8px;border:2px solid #0B192C;border-radius:8px;font-weight:700;">
      </div>
      <div style="margin-bottom:12px;display:none;" id="currentPasswordRow">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Kata Sandi Saat Ini <span style="color:#64748B;font-weight:600;">(wajib bila ganti sandi)</span></label>
        <input type="password" id="editCurrentPassword" autocomplete="current-password" placeholder="Sandi yang kamu pakai sekarang" style="width:100%;padding:8px;border:2px solid #0B192C;border-radius:8px;font-weight:700;">
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="toggleEditModal(false)" style="padding:6px 12px;border:2px solid #0B192C;border-radius:6px;font-weight:800;background:#FFF;cursor:pointer;">Batal</button>
        <button onclick="saveProfile()" style="padding:6px 14px;border:2px solid #0B192C;border-radius:6px;font-weight:900;background:#1D61E7;color:#FFF;cursor:pointer;">Simpan</button>
      </div>
    </div>

    <!-- Underline Tab Navigation (Reddit Style) -->
    <div class="profile-tabs-reddit">
      <div class="tab-reddit-item active" onclick="switchProfileTab('original', this)">Karya</div>
      ${isMe ? `
      <div class="tab-reddit-item" onclick="switchProfileTab('likes', this)">Disukai</div>
      <div class="tab-reddit-item" onclick="switchProfileTab('saved', this)">Tersimpan</div>
      ` : ''}
      <div class="tab-reddit-item" onclick="switchProfileTab('chains', this)">Estafet</div>
    </div>

    <div class="feed-list" id="profileFeed"></div>
  </div>

  <!-- 5-TAB DOCKED BOTTOM NAVBAR -->
  ${renderBottomNav('profile', currentUser, isMe)}

  <script>
    const currentPenName = '${penName}';
    let currentUserData = null;

    function toggleSettingsMenu(show) {
      const pop = document.getElementById('settingsPopover');
      if (pop) {
        if (typeof show === 'boolean') {
          pop.style.display = show ? 'flex' : 'none';
        } else {
          pop.style.display = pop.style.display === 'flex' ? 'none' : 'flex';
        }
      }
    }

    document.addEventListener('click', (e) => {
      const pop = document.getElementById('settingsPopover');
      const btn = document.querySelector('.nav-menu-btn');
      if (pop && btn && !btn.contains(e.target) && !pop.contains(e.target)) {
        pop.style.display = 'none';
      }
    });

    function toggleEditModal(show) {
      document.getElementById('editModal').style.display = show ? 'block' : 'none';

      if (show && currentUserData) {
        document.getElementById('editPenName').value = currentUserData.pen_name;
        document.getElementById('editCity').value = currentUserData.city || 'Nusantara';
        document.getElementById('editBio').value = currentUserData.bio || '';
        document.getElementById('editPassword').value = '';
        document.getElementById('editCurrentPassword').value = '';
      }
    }

    async function saveProfile() {
      const pen_name = document.getElementById('editPenName').value.trim();
      const city = document.getElementById('editCity').value.trim();
      const bio = document.getElementById('editBio').value.trim();

      try {
        const res = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pen_name, city, bio })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan profil');

        // Reset kata sandi hanya bila diisi — wajib sandi saat ini (step-up, Strix #31/#vuln-0008).
        const newPassword = document.getElementById('editPassword').value;
        if (newPassword) {
          const currentPassword = document.getElementById('editCurrentPassword').value;
          if (!currentPassword) {
            throw new Error('Isi kata sandi saat ini untuk mengganti sandi.');
          }
          const cp = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword, current_password: currentPassword })
          });
          const cpData = await cp.json().catch(() => ({}));
          if (!cp.ok) throw new Error(cpData.error || 'Gagal mengganti kata sandi');
        }

        toggleEditModal(false);
        window.location.href = '/u/' + encodeURIComponent(data.user.pen_name);
      } catch (err) {
        bbToast(err.message || 'Gagal menyimpan profil.', 'error');
      }
    }

    async function handleLogout() {
      const ok = await bbConfirm('Apakah Anda yakin ingin keluar dari akun?', { title: 'Keluar akun?', danger: true, confirmText: 'Ya, keluar' });
      if (!ok) return;
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    }

    function getAvatarColor(name) {
      const colors = ['#1D61E7', '#0F3E99', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4F46E5'];
      const str = String(name || '');
      let sum = 0;
      for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i) * (i + 1);
      }
      return colors[sum % colors.length];
    }

    async function loadUserData() {
      try {
        const res = await fetch('/api/users/' + encodeURIComponent(currentPenName));
        const data = await res.json();
        if (data.user) {
          currentUserData = data.user;
          document.getElementById('penNameDisplay').textContent = '@' + data.user.pen_name;
          document.getElementById('avatarLetter').textContent = (data.user.pen_name[0] || 'D').toUpperCase();
          document.getElementById('cityDisplay').textContent = data.user.city || 'Nusantara';
          document.getElementById('bioDisplay').textContent = '"' + (data.user.bio || 'Goresan perenungan rasa dan bait kata di Berbirru.') + '"';
          document.getElementById('countPosts').textContent = data.user.posts_count || 0;
          document.getElementById('countLikes').textContent = data.user.likes_count || 0;
          document.getElementById('countSaved').textContent = data.user.saves_count || 0;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function formatTimestamp(isoStr) {
      if (!isoStr) return '';
      const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
      const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(':', '.');
      return '<div style="display:flex;flex-direction:column;align-items:flex-end;line-height:1.25;font-family:JetBrains Mono,monospace;"><span style="font-size:11px;font-weight:800;color:#0B192C;">' + timePart + ' WIB</span><span style="font-size:9.5px;font-weight:700;color:#64748B;">' + datePart + '</span></div>';
    }


    function escapeHtml(t) {
      return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    async function loadProfilePosts(tab = 'original') {
      try {
        const res = await fetch('/api/users/' + encodeURIComponent(currentPenName) + '/posts?tab=' + tab);
        const data = await res.json();
        const container = document.getElementById('profileFeed');
        if (!data.posts || !data.posts.length) {
          container.innerHTML = '<div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">Belum ada warkah di kategori ini.</div>';
          return;
        }
        container.innerHTML = data.posts.map(p => \`
          <div class="thread-card">
            <div class="thread-header-soft">
              <div class="thread-avatar-clip" style="background:\${getAvatarColor(p.pen_name)};">
                \${(p.pen_name[0] || 'D').toUpperCase()}
                <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </div>
              <div class="thread-author-wrap">
                <div class="thread-author-info">
                  <span class="thread-pen-name">@\${escapeHtml(p.pen_name)}</span>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                \${formatTimestamp(p.created_at)}
              </div>
            </div>
            <div class="thread-body">
              \${p.title ? \`<h3 class="thread-title">\${escapeHtml(p.title)}</h3>\` : ''}
              <div class="thread-text">\${p.content}</div>
            </div>
            <div class="thread-footer">
              <span style="font-size:11.5px;font-weight:800;color:#1D61E7;">\${p.likes_count || 0} Terpaut · \${p.saves_count || 0} Simpan · \${p.chains_count || 0} Sambungan</span>
              ${isMe ? `
                <button onclick="deletePost('\${p.id}')" title="Hapus Warkah" style="background:transparent;border:none;cursor:pointer;color:#EF4444;display:flex;align-items:center;padding:4px;flex-shrink:0;" aria-label="Hapus Warkah">
                  <svg style="width:15px;height:15px;stroke:currentColor;stroke-width:2.2;fill:none;" viewBox="0 0 24 24"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </button>
              ` : ''}
            </div>
          </div>
        \`).join('');
      } catch (err) {
        console.error(err);
      }
    }

    function switchProfileTab(tab, el) {
      document.querySelectorAll('.tab-reddit-item').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      loadProfilePosts(tab);
    }

    async function deletePost(postId) {
      const ok = await bbConfirm('Warkah yang dihapus tidak dapat dikembalikan.', { title: 'Hapus warkah ini?', danger: true, confirmText: 'Ya, hapus' });
      if (!ok) return;
      try {
        const res = await fetch('/api/posts/' + postId, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menghapus');
        loadProfilePosts('original');
        loadUserData();
      } catch (err) {
        bbToast(err.message || 'Gagal menghapus.', 'error');
      }
    }

    loadUserData();
    loadProfilePosts('original');
  </script>
  ${NOTIFY_HTML}
</body>
</html>`;
}
