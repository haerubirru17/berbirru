import { THEME } from './theme';
import { renderBottomNav } from './layout';
import { NOTIFY_HTML } from './notify';

export function renderProfilePage(penName: string, isMe = false, currentUser: any = null): string {
  const SKIN_MENU_ITEMS = `
              <div class="settings-divider"></div>
              <div class="settings-item" data-skin="neo" onclick="setSkin('neo')" title="Ganti gaya halaman">
                <svg style="width:14px;height:14px;stroke:currentColor;stroke-width:2.2;fill:none;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20"/></svg>
                <span>Klasik · Neobrutalism</span>
              </div>
              <div class="settings-item" data-skin="kern" onclick="setSkin('kern')" title="Ganti gaya halaman">
                <svg style="width:14px;height:14px;stroke:currentColor;stroke-width:2.2;fill:none;" viewBox="0 0 24 24"><path d="M2 3h20v18H2z"/><path d="M2 8h20M8 3v5"/></svg>
                <span>Kern · Kertas Krem</span>
              </div>`;
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
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,500&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root{--blue:${THEME.blue};--deep:${THEME.blueDeep};--ink:${THEME.ink};--paper:#FFF9E9;--white:#FFFEF8;--yellow:${THEME.accent};--coral:#FF735F;--mint:#88E6BD;--soft:#E0EEFD;--red:#EF4444;--green:#059669;--muted:${THEME.muted};--ink-soft:${THEME.inkSoft};--line-soft:${THEME.lineSoft};--line:3px solid var(--ink);--thin:2px solid var(--ink);--shadow:6px 7px 0 ${THEME.inkSoft};--small-shadow:3px 4px 0 ${THEME.inkSoft};--bg-main:var(--paper);--bg-card:#fff;--bg-blue-subtle:var(--soft);--shadow-ink:var(--ink-soft);--blue-primary:var(--blue);--blue-deep:var(--deep);--blue-light:#60A5FA;--accent-yellow:var(--yellow);--border-thick:var(--line);--border-med:3px solid var(--ink);--border-thin:var(--thin);--shadow-hard:var(--small-shadow);--shadow-hard-lg:var(--shadow);--shadow-hard-sm:2px 3px 0 ${THEME.inkSoft};--radius:0;--radius-sm:0}
    body {
      font-family: 'DM Sans', -apple-system, sans-serif;
      background:var(--paper); color: var(--ink); min-height: 100vh;
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
      background: linear-gradient(180deg, var(--blue) 0%, rgba(29, 97, 231, 0.45) 60%, rgba(251, 248, 243, 0) 100%);
      position: relative;
    }

    /* Floating Navigation di dalam banner */
    .banner-floating-nav {
      position: absolute; top: 10px; left: 10px; right: 10px;
      display: flex; justify-content: space-between; align-items: center; z-index: 10;
    }
    .nav-btn-glass {
      background:#fff;
      border: 1.5px solid var(--ink); border-radius: 99px; padding: 5px 12px;
      font-size: 11.5px; font-weight: 800; color: var(--ink); text-decoration: none;
      box-shadow: 2px 2px 0 var(--shadow-ink); display: inline-flex; align-items: center; gap: 4px;
    }
    .nav-menu-glass {
      width: 32px; height: 32px; background:#fff;
      border: 1.5px solid var(--ink); border-radius: 10px; display: grid; place-items: center;
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
    /* badge kamera edit media (akun sendiri) */
    .media-edit-badge {
      position: absolute; right: -8px; bottom: -4px; width: 28px; height: 28px;
      background: var(--accent-yellow); color: var(--ink); border: 2px solid var(--ink);
      border-radius: 50%; display: grid; place-items: center; cursor: pointer; z-index: 5;
      box-shadow: 0 2px 0 rgba(11,25,44,0.35);
    }
    .media-edit-badge svg { width: 14px; height: 14px; stroke: var(--ink); stroke-width: 2.4; fill: none; }
    .cover-edit-badge {
      /* menimpa posisi badge kamera avatar untuk dipakai di banner */
      right: 12px; bottom: 44px; z-index: 11;
    }
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
    .btn-follow-badge svg { width: 14px; height: 14px; stroke: var(--ink); stroke-width: 3; fill: none; }
    .btn-follow-badge:active { transform: scale(0.92); box-shadow: none; }
    .btn-follow-badge.is-following { background: var(--blue-primary); box-shadow: 2px 2px 0 var(--shadow-ink); }
    .profile-right-actions {
      display: flex; align-items: center; gap: 8px; margin-bottom: 4px;
    }
    .city-badge-top {
      font-size: 11px; font-weight: 800; color: var(--blue-primary); background: var(--bg-blue-subtle);
      padding: 4px 10px; border-radius: 99px; border: 1.5px solid var(--ink);
      box-shadow: 2px 2px 0 var(--shadow-ink); display: inline-flex; align-items: center; gap: 4px;
    }
    .pen-name-group { display: flex; flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 7px; row-gap: 2px; margin-bottom: 8px; }
    .pen-name {
      font-family: 'Archivo Black', sans-serif; font-size: 21px; font-weight: 900; color: var(--ink);
      letter-spacing: -0.5px; line-height: 1.15;
    }
    .display-name-main {
      font-size: 12.5px; font-weight: 700; color: var(--muted); letter-spacing: 0.2px;
    }
    .display-name-main::before { content: '• '; color: #94A3B8; }
    .bio-box {
      font-size: 13.5px; font-weight: 500; line-height: 1.5; color: #334155; margin-bottom: 14px;
    }
    
    /* Statistik inline: icon + angka, 1 baris (Varian 2) */
    .vis-private { display: inline-flex; align-items: center; gap: 3px; margin-top: 2px; padding: 1px 6px; border: 1.5px solid var(--line-soft); border-radius: 999px; font: 800 9px 'Roboto Mono', monospace; color: var(--muted); letter-spacing: .3px; }
    .vis-private svg { width: 9px; height: 9px; }
    .thread-name-row { display: flex; align-items: center; gap: 3px; }
    .vcheck { width: 13px; height: 13px; flex: none; }
    .admin-badge { display: inline-flex; align-items: center; margin-left: 1px; vertical-align: 1px; }
    .admin-badge[hidden] { display: none; }
    .admin-badge svg { width: 19px; height: 19px; display: block; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
    .stats-inline { display: flex; justify-content: center; align-items: center; gap: 26px; margin-top: 14px; padding-top: 12px; border-top: 2px solid #E2E8F0; }
    .si { display: inline-flex; align-items: center; gap: 6px; color: var(--ink); }
    .si svg { width: 17px; height: 17px; flex: none; }
    .si b {
      font-family: 'Archivo Black', sans-serif; font-size: 16px; font-weight: 800; line-height: 1;
    }
    .stats-button { border: 0; background: transparent; cursor: pointer; font: inherit; padding: 0; }
    .follow-sheet-backdrop { display:none; position:fixed; inset:0; z-index:900; background:rgba(11,25,44,.42); }
    .follow-sheet { display:none; position:fixed; z-index:901; left:50%; bottom:0; transform:translateX(-50%); width:min(480px,100%); max-height:min(620px,86vh); overflow:auto; background:#FFFFFF; border:var(--border-thick); border-bottom:0; box-shadow:0 -6px 0 var(--ink-soft); padding:16px 16px 88px; }
    .follow-sheet-head { display:flex; align-items:center; justify-content:space-between; padding-bottom:11px; border-bottom:2px solid #E2E8F0; }
    .follow-sheet-title { font-family:'Newsreader',serif; font-size:24px; font-weight:700; }
    .follow-sheet-hint { color:var(--muted); font-size:11px; font-weight:700; margin-top:3px; }
    .follow-sheet-close { width:34px; height:34px; border:2px solid var(--ink); background:#FFF; box-shadow:2px 2px 0 var(--ink-soft); font-size:20px; font-weight:800; cursor:pointer; }
    .follow-switch { display:grid; grid-template-columns:1fr 1fr; margin:13px 0 8px; border:2px solid var(--ink); background:#FFF; }
    .follow-switch button { border:0; padding:9px 6px; background:#FFF; color:var(--muted); font:800 11px 'DM Sans',sans-serif; cursor:pointer; }
    .follow-switch button.active { background:var(--blue); color:#FFF; }
    .follow-list { min-height:120px; }
    .follow-row { display:flex; align-items:center; gap:10px; padding:12px 0; border-bottom:1px solid #E2E8F0; }
    .follow-avatar { width:42px; height:42px; display:grid; place-items:center; flex:none; border:2px solid var(--ink); background:var(--blue); color:#FFF; font:22px 'Newsreader',serif; }
    .follow-info { flex:1; min-width:0; }
    .follow-name { display:flex; align-items:center; gap:4px; font-size:13px; font-weight:800; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .follow-verified { width:14px; height:14px; flex:none; }
    .follow-meta { color:var(--muted); font-size:10px; font-weight:700; margin-top:2px; }
    .follow-action { border:2px solid var(--ink); background:var(--blue); color:#FFF; box-shadow:2px 2px 0 var(--ink-soft); padding:7px 10px; font-size:10px; font-weight:800; cursor:pointer; }
    .follow-empty, .follow-loading { padding:34px 10px; text-align:center; color:var(--muted); font-size:12px; font-weight:700; }

    /* Tab Underline Bersih (Hanya 1 Aktif) */
    .profile-tabs-reddit {
      display: flex; border-bottom: 2px solid #E2E8F0; margin-bottom: 16px; justify-content: space-around; padding: 0 4px;
    }
    .tab-reddit-item {
      padding: 9px 8px; font-size: 12.5px; font-weight: 700; color: var(--muted);
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
    .profile-empty{background:#FFF;padding:24px;border:3px solid var(--ink);border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B}

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
      border-radius: 0px; display: grid; place-items: center; font-family: 'Archivo Black', sans-serif;
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
      font-family: 'Roboto Mono', monospace;
    }
    .time-main { font-size: 11px; font-weight: 800; color: var(--ink); }
    .date-sub { font-size: 9.5px; font-weight: 700; color: var(--muted); }
    .thread-body { padding: 14px 14px 12px; }
    .thread-title { font-family: 'Archivo Black', sans-serif; font-size: 15px; font-weight: 800; color: var(--ink); margin-bottom: 6px; }
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
    
    .font-serif { font-family: 'Newsreader', serif !important; }
    .font-sans { font-family: 'DM Sans', sans-serif !important; }
    .font-mono { font-family: 'Roboto Mono', monospace !important; background: #E0EEFD; padding: 1px 4px; border-radius: 4px; }

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

    /* modal crop media */
    .crop-overlay {
      display: none; position: fixed; inset: 0; z-index: 9999;
      background: rgba(11,25,44,0.72); align-items: center; justify-content: center; padding: 16px;
    }
    .crop-box {
      background: #FFF; border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); width: 100%; max-width: 420px; padding: 16px;
    }
    .crop-stage {
      position: relative; overflow: hidden; border: 2px solid var(--ink); border-radius: 10px;
      background: var(--ink); touch-action: none; cursor: grab;
      height: 300px;
    }
    .crop-stage.round { border-radius: 50%; aspect-ratio: 1 / 1; }
    .crop-stage.wide { aspect-ratio: 16 / 9; }
    .crop-img {
      position: absolute; top: 50%; left: 50%; transform-origin: 0 0;
      max-width: none; user-select: none; -webkit-user-drag: none; pointer-events: none;
    }
    .crop-hint { font-size: 11px; font-weight: 600; color: var(--muted); margin-top: 8px; text-align: center; }

    .edit-modal {
      display: none; background: #FFF; border: var(--border-thick); border-radius: var(--radius);
      padding: 18px; margin-bottom: 20px; box-shadow: var(--shadow-hard);
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
    .btn-create-floating svg { width: 20px; height: 20px; stroke: var(--ink); stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .btn-create-floating:active { transform: translate(1.5px, 1.5px); box-shadow: none; }

    .bell-wrap { position: relative; }
    .notif-dot {
      position: absolute; top: -2px; right: -3px; width: 8px; height: 8px;
      background: var(--accent-red); border: 1.5px solid #FFF; border-radius: 50%;
    }

    .ico { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }

    .kern-profile-brand,.profile-eyebrow,.profile-since,.profile-liked-count{display:none}
  </style>
</head>
<body>
  <div class="container">

    <!-- Profile Card with Cover/Banner Header -->
    <div class="profile-card">
      <div class="cover-banner" ${isMe ? `onclick="if(!event.target.closest('.banner-floating-nav'))document.getElementById('coverInput').click()" style="cursor:pointer" title="Ganti foto sampul"` : ''}>
        <a href="/" class="kern-profile-brand" aria-label="BERBIRRU Beranda" onclick="event.stopPropagation()"><span class="kern-brand-mark">B</span><span>BERBIRRU</span></a>
      ${isMe ? '<input type="file" id="coverInput" data-kind="cover" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="pickMedia(this)">' : ''}
        ${isMe ? `
        <div class="cover-edit-badge media-edit-badge" onclick="event.stopPropagation(); document.getElementById('coverInput').click();" title="Ganti foto sampul">
          <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        </div>` : ''}
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
            ${SKIN_MENU_ITEMS}
          </div>
        </div>
      </div>

      <div class="profile-meta-wrap">
        <div class="profile-eyebrow">Profil publik / Penulis</div>
        <div class="profile-cover-photo" id="profileCoverPhoto" ${isMe ? 'onclick="document.getElementById(\'coverInput\').click()" role="button" tabindex="0" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();document.getElementById(\'coverInput\').click()}" aria-label="Ganti foto sampul"' : 'aria-hidden="true"'}></div>
        <div class="profile-since" id="profileSince"></div>
        <div class="avatar-action-row">
          <div class="avatar-wrapper">
            <div class="avatar-box" id="avatarLetter" ${isMe ? 'onclick="document.getElementById(\'avatarInput\').click()" style="cursor:pointer" title="Ganti foto profil"' : ''}>
              ${(penName[0] || 'D').toUpperCase()}
            </div>
            ${isMe ? `<input type="file" id="avatarInput" data-kind="avatar" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="pickMedia(this)">
            <div class="media-edit-badge" onclick="event.stopPropagation(); document.getElementById('avatarInput').click();" title="Ganti foto profil">
              <svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>` : ''}
            ${!isMe ? `
              <button class="btn-follow-badge" id="btnFollow" onclick="toggleFollow('${penName}')" aria-label="Ikuti Penulis" title="Ikuti Penulis">
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
          <span class="pen-name" id="penNameDisplay">@${penName}</span><span class="admin-badge" id="adminBadge" hidden title="Akun admin BERBIRRU"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1D61E7"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sr-only">Akun admin</span></span>
          <span class="display-name-main" id="displayNameDisplay">${penName}</span>
        </div>

        <div class="bio-box" id="bioDisplay">
          "Goresan perenungan rasa dan bait kata di Berbirru."
        </div>

        <div class="stats-inline">
          <span class="si" title="Karya">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>
            <b id="countPosts">0</b>
          </span>
          <button class="si stats-button" title="Pengikut" aria-label="Lihat pengikut" onclick="openFollowSheet('followers')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M15.5 15.2c2.8.2 5.2 1.6 6 4.3"/></svg>
            <b id="countFollowers">0</b>
          </button>
          <button class="si stats-button" title="Mengikuti" aria-label="Lihat akun yang diikuti" onclick="openFollowSheet('following')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8.5" cy="8" r="3.5"/><path d="M2.5 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5"/><path d="M17 8h5M19.5 5.5v5"/></svg>
            <b id="countFollowing">0</b>
          </button>
        </div>
        <div class="profile-liked-count" id="profileLikedCount"></div>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div class="edit-modal" id="editModal">
      <h3 style="font-family:'Archivo Black';font-size:15px;font-weight:800;margin-bottom:10px;">Perbarui Profil Anda</h3>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Nama Pena <span style="color:var(--muted);font-weight:600;">(@handle, unik)</span></label>
        <input type="text" id="editPenName" style="width:100%;padding:8px;border:2px solid var(--ink);border-radius:8px;font-weight:700;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Nama Tampilan <span style="color:var(--muted);font-weight:600;">(opsional)</span></label>
        <input type="text" id="editDisplayName" maxlength="40" placeholder="Kosongkan = pakai nama pena" style="width:100%;padding:8px;border:2px solid var(--ink);border-radius:8px;font-weight:700;">
      </div>
      <div style="margin-bottom:10px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Kota / Asal</label>
        <input type="text" id="editCity" style="width:100%;padding:8px;border:2px solid var(--ink);border-radius:8px;font-weight:700;">
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Bio / Catatan Pribadi <span id="bioCount" style="color:var(--muted);font-weight:600;float:right;"></span></label>
        <textarea id="editBio" maxlength="300" oninput="document.getElementById('bioCount').textContent=this.value.length + '/300';" style="width:100%;height:60px;padding:8px;border:2px solid var(--ink);border-radius:8px;font-weight:600;"></textarea>
      </div>
      <div style="margin-bottom:12px;">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Kata Sandi Baru <span style="color:var(--muted);font-weight:600;">(opsional)</span></label>
        <input type="password" id="editPassword" autocomplete="new-password" placeholder="Kosongkan bila tidak diganti" oninput="document.getElementById('currentPasswordRow').style.display=this.value?'block':'none'" style="width:100%;padding:8px;border:2px solid var(--ink);border-radius:8px;font-weight:700;">
      </div>
      <div style="margin-bottom:12px;display:none;" id="currentPasswordRow">
        <label style="font-size:11px;font-weight:800;display:block;margin-bottom:4px;">Kata Sandi Saat Ini <span style="color:var(--muted);font-weight:600;">(wajib bila ganti sandi)</span></label>
        <input type="password" id="editCurrentPassword" autocomplete="current-password" placeholder="Sandi yang kamu pakai sekarang" style="width:100%;padding:8px;border:2px solid var(--ink);border-radius:8px;font-weight:700;">
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="toggleEditModal(false)" style="padding:6px 12px;border:2px solid var(--ink);border-radius:6px;font-weight:800;background:#FFF;cursor:pointer;">Batal</button>
        <button onclick="saveProfile()" style="padding:6px 14px;border:2px solid var(--ink);border-radius:6px;font-weight:900;background:var(--blue);color:#FFF;cursor:pointer;">Simpan</button>
      </div>
    </div>

    <!-- Crop Preview Modal -->
    <div class="crop-overlay" id="cropOverlay">
      <div class="crop-box">
        <h3 style="font-family:'Archivo Black';font-size:14px;font-weight:800;margin-bottom:10px;" id="cropTitle">Atur Posisi Foto</h3>
        <div class="crop-stage" id="cropStage">
          <img class="crop-img" id="cropImg" alt="pratinjau">
        </div>
        <div class="crop-hint">Geser untuk memindah • scroll/tonjol dua jari untuk memperbesar</div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
          <button onclick="cropCancel()" style="padding:6px 12px;border:2px solid var(--ink);border-radius:6px;font-weight:800;background:#FFF;cursor:pointer;">Batal</button>
          <button onclick="cropSave()" style="padding:6px 14px;border:2px solid var(--ink);border-radius:6px;font-weight:900;background:var(--blue);color:#FFF;cursor:pointer;">Simpan</button>
        </div>
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
      <span class="profile-tab-total" id="profileTabTotal" aria-live="polite"></span>
    </div>

    <div class="feed-list" id="profileFeed"></div>
  </div>

  <div class="follow-sheet-backdrop" id="followSheetBackdrop" onclick="closeFollowSheet()"></div>
  <section class="follow-sheet" id="followSheet" role="dialog" aria-modal="true" aria-labelledby="followSheetTitle">
    <div class="follow-sheet-head">
      <div><div class="follow-sheet-title" id="followSheetTitle">Pengikut</div><div class="follow-sheet-hint" id="followSheetHint"></div></div>
      <button class="follow-sheet-close" type="button" aria-label="Tutup" onclick="closeFollowSheet()">×</button>
    </div>
    <div class="follow-switch" role="tablist">
      <button id="followTabFollowers" type="button" role="tab" onclick="openFollowSheet('followers')">Pengikut</button>
      <button id="followTabFollowing" type="button" role="tab" onclick="openFollowSheet('following')">Mengikuti</button>
    </div>
    <div class="follow-list" id="followList"><div class="follow-loading">Pilih daftar untuk melihat akun.</div></div>
  </section>

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
    function setSkin(v) {
      document.cookie = 'bb_skin=' + v + ';path=/;max-age=31536000;SameSite=Lax';
      location.reload();
    }
    window.setSkin = setSkin;
    (function markActiveSkin() {
      const m = /(?:^|;\\s*)bb_skin=(kern|neo)(?:;|$)/.exec(document.cookie || '');
      const cur = m ? m[1] : 'neo';
      document.querySelectorAll('#settingsPopover .settings-item[data-skin]').forEach(el => {
        if (el.dataset.skin === cur) el.querySelector('span')?.before('✓ ');
      });
    })();

    document.addEventListener('click', (e) => {
      const pop = document.getElementById('settingsPopover');
      const btn = document.querySelector('.nav-menu-glass');
      if (pop && btn && !btn.contains(e.target) && !pop.contains(e.target)) {
        pop.style.display = 'none';
      }
    });

    function toggleEditModal(show) {
      document.getElementById('editModal').style.display = show ? 'block' : 'none';

      if (show && currentUserData) {
        document.getElementById('editPenName').value = currentUserData.pen_name;
        document.getElementById('editDisplayName').value = currentUserData.display_name || '';
        document.getElementById('editCity').value = currentUserData.city || 'Nusantara';
        document.getElementById('editBio').value = currentUserData.bio || '';
        document.getElementById('bioCount').textContent = (currentUserData.bio || '').length + '/300';
        document.getElementById('editPassword').value = '';
        document.getElementById('editCurrentPassword').value = '';
      }
    }

    async function saveProfile() {
      const pen_name = document.getElementById('editPenName').value.trim();
      const display_name = document.getElementById('editDisplayName').value.trim();
      const city = document.getElementById('editCity').value.trim();
      const bio = document.getElementById('editBio').value.trim();

      try {
        const res = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pen_name, display_name, city, bio })
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
      const colors = ['var(--blue)', 'var(--deep)', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#4F46E5'];
      const str = String(name || '');
      let sum = 0;
      for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i) * (i + 1);
      }
      return colors[sum % colors.length];
    }

    async function refreshProfileCounts() {
      if (profileCountsBusy) return;
      profileCountsBusy = true;
      try {
        const res = await fetch('/api/users/' + encodeURIComponent(currentPenName), { cache: 'no-store' });
        const data = await res.json();
        if (!data.user) return;
        document.getElementById('countPosts').textContent = data.user.posts_count || 0;
        document.getElementById('countFollowers').textContent = data.user.followers_count || 0;
        document.getElementById('countFollowing').textContent = data.user.following_count || 0;
        setFollowBtn(!!data.user.is_following);
      } finally {
        profileCountsBusy = false;
      }
    }
    function scheduleProfileCountsPoll() {
      clearTimeout(profileCountsTimer);
      if (document.visibilityState === 'visible') profileCountsTimer = setTimeout(async () => { await refreshProfileCounts().catch(() => {}); scheduleProfileCountsPoll(); }, PROFILE_COUNTS_POLL_MS);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') { refreshProfileCounts().catch(() => {}); scheduleProfileCountsPoll(); }
      else { clearTimeout(profileCountsTimer); clearTimeout(followListTimer); }
    });

    async function loadUserData() {
      try {
        const res = await fetch('/api/users/' + encodeURIComponent(currentPenName), { cache: 'no-store' });
        const data = await res.json();
        if (data.user) {
          currentUserData = data.user;
          document.getElementById('penNameDisplay').textContent = '@' + data.user.pen_name;
          document.getElementById('displayNameDisplay').textContent = data.user.display_name || data.user.pen_name;
          if (data.user.is_admin) document.getElementById('adminBadge').hidden = false;
          applyAvatar(data.user.avatar_key, data.user.pen_name);
          applyCover(data.user.cover_key);
          document.getElementById('cityDisplay').textContent = data.user.city || 'Nusantara';
          document.getElementById('bioDisplay').textContent = '"' + (data.user.bio || 'Goresan perenungan rasa dan bait kata di Berbirru.') + '"';
          document.getElementById('countPosts').textContent = data.user.posts_count || 0;
          document.getElementById('countFollowers').textContent = data.user.followers_count || 0;
          document.getElementById('countFollowing').textContent = data.user.following_count || 0;
          const joined = data.user.created_at && new Date(data.user.created_at).getFullYear();
          document.getElementById('profileSince').textContent = Number.isFinite(joined) ? 'Sejak ' + joined : '';
          document.getElementById('profileLikedCount').textContent = (data.user.likes_count || 0) + ' disukai';
          setFollowBtn(!!data.user.is_following);
        }
      } catch (err) { console.error(err); }
    }

    function formatTimestamp(isoStr) {
      if (!isoStr) return '';
      const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
      const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(':', '.');
      return '<div style="display:flex;flex-direction:column;align-items:flex-end;line-height:1.25;font-family:Roboto Mono,monospace;"><span style="font-size:11px;font-weight:800;color:var(--ink);">' + timePart + ' WIB</span><span style="font-size:9.5px;font-weight:700;color:var(--muted);">' + datePart + '</span></div>';
    }


    // ---- MEDIA PROFIL (avatar & cover) ----
    function avatarKeyValid(key) {
      return new RegExp('^[a-z0-9_-]+/[a-z0-9_-]+[.](jpg|png|webp)([?]v=[0-9]+)?$', 'i').test(String(key || ''));
    }
    // versi unik per-load: bikin URL gambar selaluFresh lintas sesi/halaman
    const MEDIA_V = Date.now() + '' + Math.floor(Math.random() * 1e6);
    function freshKey(key) {
      const s = String(key || '');
      if (s.includes('?v=')) return s; // sudah bawa versi anti-cache sendiri (mis. dari server saat upload)
      return s ? s + '?v=' + MEDIA_V : s;
    }
    function applyAvatar(key, penName) {
      const box = document.getElementById('avatarLetter');
      if (!box) return;
      if (avatarKeyValid(key)) {
        box.textContent = '';
        box.style.backgroundImage = 'url(/media/' + freshKey(key) + ')';
        box.style.backgroundSize = 'cover';
        box.style.backgroundPosition = 'center';
        box.style.color = 'transparent';
      } else {
        box.textContent = (penName[0] || 'D').toUpperCase();
      }
    }
    function applyCover(key) {
      const el = document.querySelector('.cover-banner');
      const kernCover = document.getElementById('profileCoverPhoto');
      if (!el) return;
      if (kernCover) {
        kernCover.classList.toggle('has-cover', avatarKeyValid(key));
        kernCover.style.backgroundImage = avatarKeyValid(key) ? 'url(/media/' + freshKey(key) + ')' : '';
      }
      if (avatarKeyValid(key)) {
        // foto + ramp gradient: gelap tipis di atas (kontras nav), fade warna kartu di bawah (nyatu kartu)
        el.style.background = 'linear-gradient(180deg, rgba(11,25,44,0.30) 0%, rgba(11,25,44,0.05) 30%, rgba(255,255,255,0) 55%, #FFFFFF 100%), url(/media/' + freshKey(key) + ')';
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center';
      }
    }

    // ---- CROP PREVIEW (drag + zoom, canvas export, tanpa library) ----
    const crop = { file: null, kind: 'avatar', scale: 1, minScale: 1, tx: 0, ty: 0, imgW: 0, imgH: 0, dragging: false, lastX: 0, lastY: 0, pinchD: 0 };

    function cropStageSize() {
      const st = document.getElementById('cropStage');
      return { w: st.clientWidth, h: st.clientHeight };
    }
    function cropClamp() {
      const { w, h } = cropStageSize();
      // gambar tak boleh meninggalkan celah: tx/ty dibatasi pinggir
      const dispW = crop.imgW * crop.scale, dispH = crop.imgH * crop.scale;
      const mx = Math.max(0, (dispW - w) / 2), my = Math.max(0, (dispH - h) / 2);
      crop.tx = Math.max(-mx, Math.min(mx, crop.tx));
      crop.ty = Math.max(-my, Math.min(my, crop.ty));
    }
    function cropRender() {
      const img = document.getElementById('cropImg');
      img.style.width = (crop.imgW * crop.scale) + 'px';
      img.style.transform = 'translate(' + (crop.tx - (crop.imgW * crop.scale) / 2) + 'px,' + (crop.ty - (crop.imgH * crop.scale) / 2) + 'px)';
    }
    function cropClampRender() { cropClamp(); cropRender(); }
    function cropOpen(file, kind) {
      crop.file = file; crop.kind = kind;
      const st = document.getElementById('cropStage');
      st.className = 'crop-stage ' + (kind === 'cover' ? 'wide' : 'round');
      const url = URL.createObjectURL(file);
      const img = document.getElementById('cropImg');
      img.onload = () => {
        crop.imgW = img.naturalWidth; crop.imgH = img.naturalHeight;
        // tampilkan modal DULU — ukuran stage valid baru setelah terlihat
        document.getElementById('cropOverlay').style.display = 'flex';
        const { w, h } = cropStageSize();
        // scale awal: "cover" — isi penuh stage
        const cover = Math.max(w / crop.imgW, h / crop.imgH);
        crop.scale = cover; crop.minScale = cover;
        crop.tx = 0; crop.ty = 0;
        cropClampRender();
      };
      img.onerror = () => { URL.revokeObjectURL(url); bbToast('Gagal membaca gambar.', 'error'); };
      img.src = url;
    }
    function cropClose() {
      document.getElementById('cropOverlay').style.display = 'none';
      if (crop.file && crop.file._url) { URL.revokeObjectURL(crop.file._url); crop.file._url = null; }
    }
    function cropCancel() { cropClose(); }
    function cropSave() {
      // render transform LIVE ke canvas sesuai frame stage
      const st = document.getElementById('cropStage');
      const { w, h } = cropStageSize();
      const out = crop.kind === 'cover' ? 1080 : 256;
      const canvas = document.createElement('canvas');
      canvas.width = out; canvas.height = Math.round(out * h / w);
      const ctx = canvas.getContext('2d');
      if (!ctx) { cropClose(); return; }
      const k = canvas.width / w; // stage -> output
      // gambar digeser +tx,+ty dari tengah stage (sama arah dgn preview — tadinya tanda kebalik)
      const dx = (w / 2 + crop.tx) * k - (crop.imgW * crop.scale * k) / 2;
      const dy = (h / 2 + crop.ty) * k - (crop.imgH * crop.scale * k) / 2;
      const dw = crop.imgW * crop.scale * k;
      const dh = crop.imgH * crop.scale * k;
      ctx.drawImage(document.getElementById('cropImg'), dx, dy, dw, dh);
      canvas.toBlob(b => {
        cropClose();
        if (!b) { bbToast('Gagal memproses gambar.', 'error'); return; }
        uploadMediaBlob(b, crop.kind);
      }, 'image/webp', 0.85);
    }
    window.cropCancel = cropCancel; window.cropSave = cropSave;

    // interaksi: drag mouse/touch + zoom wheel/pinch
    (function () {
      const st = document.getElementById('cropStage');
      const down = (x, y) => { crop.dragging = true; crop.lastX = x; crop.lastY = y; st.style.cursor = 'grabbing'; };
      const move = (x, y) => {
        if (!crop.dragging) return;
        crop.tx += x - crop.lastX; crop.ty += y - crop.lastY;
        crop.lastX = x; crop.lastY = y;
        cropClampRender();
      };
      const up = () => { crop.dragging = false; st.style.cursor = 'grab'; };
      st.addEventListener('mousedown', e => { e.preventDefault(); down(e.clientX, e.clientY); });
      window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
      window.addEventListener('mouseup', up);
      st.addEventListener('touchstart', e => {
        if (e.touches.length === 1) down(e.touches[0].clientX, e.touches[0].clientY);
        else if (e.touches.length === 2) {
          crop.pinchD = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        }
      }, { passive: true });
      st.addEventListener('touchmove', e => {
        e.preventDefault();
        if (e.touches.length === 1 && crop.pinchD === 0) move(e.touches[0].clientX, e.touches[0].clientY);
        else if (e.touches.length === 2) {
          const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
          if (crop.pinchD > 0) {
            crop.scale = Math.max(crop.minScale, Math.min(crop.minScale * 4, crop.scale * d / crop.pinchD));
            cropClampRender();
          }
          crop.pinchD = d;
        }
      }, { passive: false });
      st.addEventListener('touchend', e => { if (e.touches.length === 0) { up(); crop.pinchD = 0; } }, { passive: true });
      st.addEventListener('wheel', e => {
        e.preventDefault();
        const f = e.deltaY < 0 ? 1.1 : 0.9;
        crop.scale = Math.max(crop.minScale, Math.min(crop.minScale * 4, crop.scale * f));
        cropClampRender();
      }, { passive: false });
    })();

    window.pickMedia = function (input) {
      const kind = input.dataset.kind || 'avatar';
      const file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      if (!new RegExp('^image/(jpeg|png|webp)$').test(file.type)) { bbToast('Pilih gambar JPG, PNG, atau WebP.', 'warning'); return; }
      if (file.size > 15 * 1024 * 1024) { bbToast('Gambar terlalu besar (maks 15MB sebelum dikompres).', 'warning'); return; }
      file._url = null;
      cropOpen(file, kind);
    };

    async function uploadMediaBlob(blob, kind) {
      try {
        const res = await fetch('/api/me/media/' + kind, {
          method: 'PUT',
          headers: { 'Content-Type': blob.type },
          body: blob
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { bbToast(data.error || 'Gagal menyimpan gambar.', 'error'); return; }
        // tampil instan dengan URL anti-cache (?v=) dari server
        const k = String((data && data.url) || '').split('/media/')[1] || '';
        if (k && avatarKeyValid(k)) {
          if (kind === 'avatar') applyAvatar(k, currentPenName);
          else applyCover(k);
        }
        await loadUserData();
        // refresh kartu feed di profil
        loadProfilePosts('original');
      } catch (e) {
        bbToast('Gagal memproses gambar. Coba gambar lain.', 'error');
      }
    }

    // ---- FOLLOW (profil orang lain) ----
    // tanda "+" kuning = belum ikut; centang biru = sedang ikut. Klik = toggle (API sama dgn feed)
    function setFollowBtn(on) {
      const b = document.getElementById('btnFollow');
      if (!b) return;
      b.classList.toggle('is-following', on);
      b.title = on ? 'Berhenti ikuti' : 'Ikuti Penulis';
      b.innerHTML = on
        ? '<svg viewBox="0 0 24 24" style="stroke:#FFF"><path d="M20 6L9 17l-5-5"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>';
    }
    async function toggleFollow(penName) {
      try {
        const res = await fetch('/api/users/' + encodeURIComponent(penName) + '/follow', { method: 'POST' });
        const data = await res.json();
        if (data.error) return bbToast(data.error, 'error');
        setFollowBtn(!!data.following);
        bbToast(data.following ? 'Berhasil mengikuti @' + penName : 'Batal mengikuti @' + penName, data.following ? 'success' : 'info');
      } catch (err) {
        console.error(err);
      }
    }

    function escapeHtml(t) {
      return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    let followSheetType = 'followers';
    let followTouchX = 0;
    let followListTimer = null;
    let followListBusy = false;
    let profileCountsTimer = null;
    let profileCountsBusy = false;
    const FOLLOW_LIST_POLL_MS = 12000;
    const PROFILE_COUNTS_POLL_MS = 12000;
    function followAvatarStyle(name, key) {
      if (avatarKeyValid(key)) return 'background-image:url(/media/' + freshKey(key) + ');background-size:cover;background-position:center;color:transparent;';
      return 'background:' + getAvatarColor(name) + ';';
    }
    function renderFollowRows(users) {
      const list = document.getElementById('followList');
      if (!users.length) {
        list.innerHTML = '<div class="follow-empty">' + (followSheetType === 'followers' ? 'Belum ada yang mengikuti.' : 'Belum mengikuti penulis lain.') + '</div>';
        return;
      }
      list.innerHTML = users.map(u => \`
        <div class="follow-row">
          <div class="follow-avatar" style="\${followAvatarStyle(u.pen_name, u.avatar_key)}">\${escapeHtml((u.pen_name || 'D')[0].toUpperCase())}</div>
          <div class="follow-info"><div class="follow-name">@\${escapeHtml(u.pen_name)}\${u.is_admin ? '<svg class="follow-verified" viewBox="0 0 24 24" fill="none" aria-label="Akun admin" role="img"><circle cx="12" cy="12" r="10" fill="#1D61E7"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</div><div class="follow-meta">\${escapeHtml(u.display_name || u.pen_name)}\${u.city ? ' · ' + escapeHtml(u.city) : ''}</div></div>
          \${u.pen_name !== currentPenName ? \`<button class="follow-action" data-pen="\${escapeHtml(u.pen_name)}" data-on="\${u.is_following ? '1' : '0'}">\${u.is_following ? 'Mengikuti' : 'Ikuti'}</button>\` : ''}
        </div>\`).join('');
      list.querySelectorAll('.follow-action').forEach(btn => btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const res = await fetch('/api/users/' + encodeURIComponent(btn.dataset.pen) + '/follow', { method: 'POST' });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal mengubah status ikuti');
          if (!data.following && followSheetType === 'following') {
            const row = btn.closest('.follow-row');
            row?.remove();
            const count = Math.max(0, Number(document.getElementById('countFollowing')?.textContent || 0) - 1);
            const countEl = document.getElementById('countFollowing');
            if (countEl) countEl.textContent = String(count);
            document.getElementById('followTabFollowing').textContent = 'Mengikuti · ' + count;
            document.getElementById('followSheetHint').textContent = count + ' akun diikuti @' + currentPenName;
            if (!document.querySelector('#followList .follow-row')) renderFollowRows([]);
          } else {
            btn.dataset.on = data.following ? '1' : '0'; btn.textContent = data.following ? 'Mengikuti' : 'Ikuti';
          }
          btn.disabled = false;
          await refreshProfileCounts();
          await loadFollowList(followSheetType, false);
        } catch (err) { btn.disabled = false; bbToast(err.message || 'Gagal mengubah status ikuti.', 'error'); }
      }));
    }
    function scheduleFollowPoll() {
      clearTimeout(followListTimer);
      if (document.visibilityState === 'visible' && document.getElementById('followSheet').style.display === 'block') {
        followListTimer = setTimeout(() => loadFollowList(followSheetType, false), FOLLOW_LIST_POLL_MS);
      }
    }
    async function loadFollowList(type, showLoading = true) {
      if (followListBusy) return;
      const list = document.getElementById('followList');
      if (showLoading) list.innerHTML = '<div class="follow-loading">Memuat daftar…</div>';
      followListBusy = true;
      try {
        const res = await fetch('/api/users/' + encodeURIComponent(currentPenName) + '/follows?type=' + type);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memuat daftar');
        renderFollowRows(data.users || []);
        const label = (type === 'followers' ? 'Pengikut · ' : 'Mengikuti · ') + (data.users || []).length;
        document.getElementById(type === 'followers' ? 'followTabFollowers' : 'followTabFollowing').textContent = label;
        document.getElementById('followSheetHint').textContent = (data.users || []).length + ' ' + (type === 'followers' ? 'orang mengikuti' : 'akun diikuti') + ' @' + currentPenName;
      } catch (err) { list.innerHTML = '<div class="follow-empty">' + escapeHtml(err.message || 'Gagal memuat daftar.') + '</div>'; }
      finally { followListBusy = false; scheduleFollowPoll(); }
    }
    function openFollowSheet(type) {
      followSheetType = type;
      document.getElementById('followSheet').style.display = 'block';
      document.getElementById('followSheetBackdrop').style.display = 'block';
      document.body.style.overflow = 'hidden';
      document.getElementById('followSheetTitle').textContent = type === 'followers' ? 'Pengikut' : 'Mengikuti';
      document.getElementById('followTabFollowers').classList.toggle('active', type === 'followers');
      document.getElementById('followTabFollowing').classList.toggle('active', type === 'following');
      clearTimeout(followListTimer);
      loadFollowList(type);
    }
    function closeFollowSheet() { clearTimeout(followListTimer); document.getElementById('followSheet').style.display = 'none'; document.getElementById('followSheetBackdrop').style.display = 'none'; document.body.style.overflow = ''; }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFollowSheet(); });
    document.getElementById('followSheet')?.addEventListener('touchstart', e => { followTouchX = e.touches[0].clientX; }, { passive: true });
    document.getElementById('followSheet')?.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - followTouchX; if (Math.abs(dx) > 45) openFollowSheet(dx < 0 ? 'following' : 'followers'); });

    let activeProfileTab = 'original';
    async function loadProfilePosts(tab = 'original') {
      try {
        const res = await fetch('/api/users/' + encodeURIComponent(currentPenName) + '/posts?tab=' + tab);
        if (!res.ok) return;
        const data = await res.json();
        if (tab !== activeProfileTab) return;
        const total = document.getElementById('profileTabTotal');
        const labels = { original:'karya', likes:'disukai', saved:'tersimpan', chains:'estafet' };
        total.textContent = (data.total ?? data.posts?.length ?? 0) + ' ' + labels[tab];
        const container = document.getElementById('profileFeed');
        if (!data.posts || !data.posts.length) {
          container.innerHTML = '<div class="profile-empty">Belum ada warkah di kategori ini.</div>';
          return;
        }
        container.innerHTML = data.posts.map(p => \`
          <div class="thread-card">
            <div class="thread-header-soft">
              <div class="thread-avatar-clip" style="background:\${getAvatarColor(p.pen_name)};\${p.avatar_key ? \`background-image:url(/media/\${freshKey(p.avatar_key)});background-size:cover;background-position:center;color:transparent;\` : ''}">
                \${(p.pen_name[0] || 'D').toUpperCase()}
                <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="var(--line-soft)" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </div>
              <div class="thread-author-wrap">
                <div class="thread-author-info">
                  <span class="thread-name-row"><span class="thread-pen-name">@\${escapeHtml(p.pen_name)}</span>\${p.is_admin ? '<svg class="vcheck" viewBox="0 0 24 24" fill="none" aria-label="Akun admin" role="img"><circle cx="12" cy="12" r="10" fill="#1D61E7"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span></span>
                </div>
                \${p.visibility === 'private' ? '<span class="vis-private"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Privat</span>' : ''}
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
              <span style="font-size:11.5px;font-weight:800;color:var(--blue);">\${p.likes_count || 0} Terpaut · \${p.saves_count || 0} Simpan · \${p.chains_count || 0} Sambungan</span>
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
      activeProfileTab = tab;
      document.querySelectorAll('.tab-reddit-item').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      document.getElementById('profileTabTotal').textContent = '…';
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

    // fungsi dipanggil onclick inline -> wajib global (module scope tak terlihat oleh atribut HTML)
    window.saveProfile = saveProfile;
    window.toggleEditModal = toggleEditModal;
    window.handleLogout = handleLogout;
    window.switchProfileTab = switchProfileTab;
    window.deletePost = deletePost;
    window.toggleSettingsMenu = toggleSettingsMenu;
    window.toggleFollow = toggleFollow;
    window.openFollowSheet = openFollowSheet;
    window.closeFollowSheet = closeFollowSheet;

    loadUserData();
    scheduleProfileCountsPoll();
    loadProfilePosts('original');
  </script>
  ${NOTIFY_HTML}
</body>
</html>`;
}
