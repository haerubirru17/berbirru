import { THEME } from './theme';
import { renderBottomNav } from './layout';
import { NOTIFY_HTML } from './notify';

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
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,500;0,6..72,700;1,6..72,500&family=Roboto+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root{--blue:${THEME.blue};--deep:${THEME.blueDeep};--ink:${THEME.ink};--paper:#FFF9E9;--white:#FFFEF8;--yellow:${THEME.accent};--coral:#FF735F;--mint:#88E6BD;--soft:#E0EEFD;--red:#EF4444;--green:#059669;--muted:${THEME.muted};--ink-soft:${THEME.inkSoft};--line-soft:${THEME.lineSoft};--line:${THEME.borderW} solid var(--ink);--thin:2px solid var(--ink);--shadow:6px 7px 0 ${THEME.inkSoft};--small-shadow:3px 4px 0 ${THEME.inkSoft};--bg-main:var(--paper);--bg-card:#fff;--bg-blue-subtle:var(--soft);--shadow-ink:${THEME.inkSoft};--blue-primary:var(--blue);--blue-deep:var(--deep);--blue-light:#60A5FA;--accent-yellow:var(--yellow);--border-thick:var(--line);--border-med:3px solid var(--ink);--border-thin:var(--thin);--shadow-hard:var(--small-shadow);--shadow-hard-lg:var(--shadow);--shadow-hard-sm:2px 3px 0 ${THEME.inkSoft};--radius:0;--radius-sm:0}
    body {
      font-family: 'DM Sans', -apple-system, sans-serif;
      background:var(--paper); color: var(--ink); min-height: 100vh;
      padding: 20px 16px 80px;
    }
    .container { max-width: 480px; margin: 0 auto; }
    .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
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
    .nav-btn {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 7px 14px; font-size: 12px; font-weight: 800; box-shadow: var(--shadow-hard-sm);
      display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--ink);
    }
    @media (max-width: 768px) {
      .top-nav .nav-btn { display: none !important; }
      .top-nav { justify-content: center; margin-bottom: 10px; }
    }
    .feed-mode-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 0; }
    .feed-search { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .feed-search input { flex: 1; min-width: 0; font: inherit; font-size: 13px; font-weight: 700; padding: 9px 12px; border: var(--border-thin); border-radius: var(--radius-sm); background: var(--bg-card); color: var(--ink); box-shadow: var(--small-shadow); outline: none; }
    .feed-search input:focus { border-color: var(--blue-primary); }
    .feed-search button { background: var(--blue-primary); color: #fff; border: var(--border-thin); border-radius: var(--radius-sm); width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; box-shadow: var(--shadow-hard-sm); cursor: pointer; }
    .feed-search button.btn-tulis { background: var(--yellow); color: var(--ink); }
    .feed-search button.btn-tulis svg { stroke: var(--ink); }
    .feed-search button svg { width: 16px; height: 16px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; }
    .feed-search button:active { transform: translate(1px, 1px); box-shadow: none; }
    .mode-tab {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 8px 6px; font-size: 11.5px; font-weight: 900; text-align: center; cursor: pointer;
      box-shadow: var(--shadow-hard-sm); color: var(--ink); display: flex; justify-content: center; align-items: center; gap: 5px;
      transition: transform .06s ease, box-shadow .06s ease, background .06s ease;
    }
    .mode-tab:active { transform: translate(2px, 2px); box-shadow: none; }
    .mode-tab.active { background: var(--blue-primary); color: #FFFFFF; box-shadow: none; transform: translate(2px, 2px); }

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
      border-radius: 12px; display: grid; place-items: center; font-family: 'Archivo Black', sans-serif;
      font-weight: 900; font-size: 23px; box-shadow: none;
      transform: rotate(-2deg); z-index: 5;
    }
    .trigger-placeholder { flex: 1; font-size: 13px; font-weight: 700; color: var(--muted); }
    .trigger-pen-btn { background: var(--accent-yellow); border: var(--border-thin); border-radius: 8px; padding: 6px 10px; font-size: 11px; font-weight: 900; display: inline-flex; align-items: center; gap: 4px; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); }

    /* Card Feed Threads-Style dengan Overlap Avatar & Paperclip Efek */
    .log-feed { display: flex; flex-direction: column; gap: 10px; }
    .thread-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: 0px;
      box-shadow: var(--shadow-hard-lg); overflow: visible; position: relative; margin-top: 14px;
    }
    .thread-header-soft {
      background: var(--bg-blue-subtle); padding: 8px 12px 8px 68px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin); border-radius: 0px;
      position: relative; min-height: 44px;
    }
    .thread-author-wrap { display: flex; align-items: center; gap: 8px; }
    
    /* Avatar Menonjol Melewati Frame (Logika Dijepit Tanpa Bayangan) */
    .thread-avatar-clip {
      position: absolute; left: 10px; top: -14px; width: 48px; height: 50px;
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: 0px; display: grid; place-items: center; font-family: 'Newsreader', serif;
      font-size: 24px; font-weight: 700; box-shadow: none;
      transform: rotate(-2deg); z-index: 5;
    }
    /* SVG Paperclip / Jepitan Kertas Metalik */
    .paperclip-svg {
      position: absolute; top: -10px; right: -7px; width: 18px; height: 28px;
      z-index: 6; transform: rotate(18deg); filter: drop-shadow(1px 1px 0 rgba(0,0,0,0.25));
    }

    .thread-author-info { display: flex; flex-direction: column; line-height: 1.25; }
    .thread-pen-name { font-size: 13px; font-weight: 800; color: var(--ink); text-decoration: none; }
    .vis-private { display: inline-flex; align-items: center; gap: 3px; margin-top: 2px; padding: 1px 6px; border: 1.5px solid var(--line-soft); border-radius: 999px; font: 800 9px 'Roboto Mono', monospace; color: var(--muted); letter-spacing: .3px; }
    .vis-private svg { width: 9px; height: 9px; }
    .thread-name-row { display: flex; align-items: center; gap: 3px; }
    .vcheck { width: 13px; height: 13px; flex: none; }
    .thread-city { font-size: 10px; font-weight: 700; color: var(--muted); }
    
    /* Timestamp 2 Baris Sejajar: Jam di atas, Tanggal di bawah */
    .thread-timestamp-stack {
      display: flex; flex-direction: column; align-items: flex-end; line-height: 1.25;
    }
    .time-main { font-size: 11px; font-weight: 800; color: var(--ink); }
    .date-sub { font-size: 9.5px; font-weight: 700; color: var(--muted); }

    /* Sambung Bait Connector Line */
    .thread-parent-connector {
      background: #F8FAFC; border-left: 4px solid var(--blue-primary); border-bottom: 1.5px dashed var(--line-soft);
      padding: 8px 12px; margin: 0; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
    }
    .thread-parent-connector:hover { background: var(--bg-blue-subtle); }
    .chain-inline { padding: 9px 12px 4px; background: #FBFDFF; border-top: 1.5px solid #E2E8F0; }
    .mini-bait { position: relative; background: #F4F8FE; border: 1.5px solid #C9D6E8; border-radius: 9px; padding: 7px 9px; margin-bottom: 7px; }
    .mini-who { font-size:10px; font-weight: 900; color: var(--blue-primary); margin-bottom: 3px; }
    .mini-who a { color: var(--blue-primary); text-decoration: none; }
    .mini-txt { font-size: 12px; line-height: 1.55; color: #3A4C68; }
    .ctamini { text-align: center; font-size: 11.5px; font-weight: 900; margin: 4px 0 6px; }
    .ctamini a { color: var(--ink); background: var(--accent-yellow); border: 1.5px solid var(--ink); border-radius: 8px; padding: 5px 10px; text-decoration: none; display: inline-block; }

    .thread-body { padding: 14px 14px 12px; flex: 1; display: flex; flex-direction: column; }
    .thread-title { font-family: 'Newsreader', serif; font-size: 17px; font-weight: 600; color: var(--ink); margin-bottom: 6px; line-height: 1.3; }
    .thread-text { font-size: 14px; font-weight: 600; line-height: 1.6; color: #0F172A; flex: 1; }
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
      margin: 8px 0;
      font-style: italic;
      border-radius: 0px;
      color: #334155;
    }
    
    .font-serif { font-family: 'Newsreader', serif !important; font-size: 16px; }
    .font-sans { font-family: 'DM Sans', sans-serif !important; }
    .font-mono { font-family: 'Roboto Mono', monospace !important; background: #E0EEFD; padding: 1px 5px; border-radius: 4px; font-size: 13.5px; }

    .thread-footer {
      padding: 8px 10px; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center;
      border-top: var(--border-thin); border-radius: 0px; gap: 6px; flex-wrap: nowrap; overflow: hidden; /* ATURAN OWNER: love+simpan+sambungan selalu 1 baris */
    }
    .actions-left { display: flex; gap: 4px; flex-shrink: 1; min-width: 0; }
    .act-btn {
      background: var(--bg-main); border: var(--border-thin); border-radius: var(--radius-sm);
      padding: 4px 7px; font-size: 11px; font-weight: 800; cursor: pointer; display: inline-flex;
      align-items: center; gap: 3px; min-width: 0; overflow: hidden; /* menyusut dulu sebelum menggusur sambungan */
    }
    .act-btn span { overflow: hidden; text-overflow: ellipsis; }
    .act-btn svg, .act-btn .ico { flex-shrink: 0; }
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
    /* V1 split-button: badan = tulis sambung, segmen panah = buka/tutup daftar */
    .chain-split { display: inline-flex; align-items: stretch; background: var(--accent-yellow); border: var(--border-thin); border-radius: var(--radius-sm); box-shadow: 2px 2px 0 #1E293B; overflow: hidden; flex-shrink: 0; }
    .chain-split:active { transform: translate(1px, 1px); box-shadow: none; }
    .chain-btn { background: none; color: var(--ink); border: none; padding: 4px 8px; font-size: 11px; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; font-family: inherit; }
    .chain-arrow { background: none; border: none; border-left: 2px solid rgba(11,25,44,.30); padding: 4px 8px; font-size: 11px; font-weight: 900; cursor: pointer; color: var(--ink); font-family: inherit; display: inline-flex; align-items: center; }

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
      font-size: 13px; font-weight: 800; color: var(--muted); background: none; border: none; cursor: pointer; padding: 6px 4px;
    }
    .header-title-clean {
      font-family: 'Archivo Black', sans-serif; font-size: 15.5px; font-weight: 800; color: var(--ink); letter-spacing: -0.3px;
    }
    .btn-publish-pill {
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-med); border-radius: 999px;
      padding: 6px 16px; font-size: 12.5px; font-weight: 900; cursor: pointer; box-shadow: 2px 2px 0 var(--shadow-ink);
      display: inline-flex; align-items: center; gap: 5px; transition: transform 0.05s ease;
    }
    .btn-publish-pill:active { transform: translate(1.5px, 1.5px); box-shadow: none; }

    .composer-body {
      padding: 18px 18px 12px; flex: 1; display: flex; flex-direction: column; gap: 18px;
    }
    .title-input {
      font-family: 'Archivo Black', sans-serif; font-size: 20px; font-weight: 800; color: var(--ink);
      border: none; outline: none; width: 100%; line-height: 1.3; letter-spacing: -0.4px;
      border-bottom: 1.5px solid #E2E8F0; padding-bottom: 10px; background: transparent;
    }
    .title-input:focus { border-bottom-color: var(--blue-primary); }
    .title-input::placeholder { color: #94A3B8; font-weight: 700; font-size: 18px; }

    /* Visibilitas: label kecil + segmented control dalam satu panel */
    .vis-row {
      display: flex; align-items: center; gap: 10px;
      background: #F6F8FB; border: 1.5px solid #E8ECF2; border-radius: 14px; padding: 8px 12px;
    }
    .vis-label { font-size: 11px; font-weight: 800; color: #8A94A6; text-transform: uppercase; letter-spacing: .4px; }
    .vis-toggle { display: inline-flex; flex: 0 0 auto; border: 1.5px solid var(--ink); border-radius: 10px; overflow: hidden; background: #FFFFFF; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); }
    .vis-opt { border: 0; background: transparent; padding: 6px 14px; font-size: 12px; font-weight: 900; cursor: pointer; color: var(--ink); transition: transform .06s ease, box-shadow .06s ease, background .06s ease; }
    .vis-opt + .vis-opt { border-left: 1.5px solid var(--ink); }
    .vis-opt.active { background: var(--blue-primary); color: #FFF; box-shadow: none; transform: translate(1px, 1px); }
    .vis-hint { margin-left: auto; font-size: 11px; font-weight: 700; color: #8A94A6; white-space: nowrap; flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; text-align: right; }
    @media (max-width: 430px) {
      .vis-row { flex-wrap: wrap; row-gap: 4px; }
      .vis-hint { flex: 1 0 100%; white-space: normal; text-align: left; overflow: visible; }
    }

    /* Kanvas editor: panel berisi, bukan whitespace mengambang */
    .rich-editor-canvas {
      width: 100%; flex: 1; min-height: 300px; font-size: 16.5px; line-height: 1.8;
      color: #1E293B; outline: none; word-break: break-word;
      background: #F6F8FB; border: 1.5px solid #E8ECF2; border-radius: 14px; padding: 16px;
    }
    .rich-editor-canvas:focus { border-color: var(--blue-primary); background: #FFFFFF; }
    .rich-editor-canvas:empty:before { content: attr(placeholder); color: #94A3B8; font-weight: 500; }
    .rich-editor-canvas blockquote {
      background: var(--bg-blue-subtle); border-left: 3.5px solid var(--blue-primary);
      padding: 8px 14px; margin: 12px 0; font-style: italic; border-radius: 8px; color: var(--ink);
    }

    /* Floating Docked Bottom Toolbar — dua baris, konsisten */
    .docked-footer {
      position: sticky; bottom: 0; background: #FFFFFF;
      border-top: 1px solid #E8ECF2; box-shadow: 0 -4px 12px rgba(11,25,44,.05);
      padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
      display: flex; flex-direction: column; gap: 8px; z-index: 20;
    }
    .tools-row { display: flex; align-items: center; gap: 8px; }
    .tools-segment { display: flex; align-items: center; gap: 6px; }
    .t-btn {
      width: 38px; height: 38px; border: 1.5px solid var(--ink); border-radius: 11px;
      background: #FFFFFF; color: var(--ink); font-weight: 900; font-size: 14px; cursor: pointer;
      display: grid; place-items: center; box-shadow: 1.5px 1.5px 0 var(--shadow-ink); transition: all 0.05s ease;
    }
    .t-btn:active { transform: translate(1px, 1px); box-shadow: none; }
    .t-btn.active { background: var(--blue-primary); color: #FFFFFF; box-shadow: inset 1px 1px 0 rgba(0,0,0,0.3); }

    .font-select-picker {
      height: 38px; padding: 0 10px; border: 1.5px solid var(--ink); border-radius: 11px;
      background: #FFFFFF; font-size: 12.5px; font-weight: 800; color: var(--ink);
      box-shadow: 1.5px 1.5px 0 var(--shadow-ink); outline: none; cursor: pointer;
    }
    .stats-row { display: flex; justify-content: flex-end; align-items: center; padding-top: 6px; border-top: 1px solid #EEF1F5; }
    .stats-label { font-family: 'Roboto Mono', monospace; font-size: 11.5px; font-weight: 700; color: #94A3B8; white-space: nowrap; }

    /* 5-TAB DOCKED BOTTOM NAVBAR — Shadcn / Lucide Style */
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

    /* Middle Action Button (Lucide PenTool/SquarePen Style) */
    .nav-item-center {
      position: relative; top: -8px;
    }
    .btn-create-floating {
width:46px;height:46px;display:grid;place-items:center;background:var(--yellow);color:var(--ink);border:2.5px solid var(--ink);box-shadow:3px 3px 0 var(--ink);transform:rotate(-2deg)
    }
    .btn-create-floating svg { width: 20px; height: 20px; stroke: var(--ink); stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
    .btn-create-floating:active { transform: translate(1.5px, 1.5px); box-shadow: none; }

    /* Feed Tabs: kartu yang ikut mengalir/tenggelam saat scroll (tanpa sticky) */
    .feed-sticky { background: var(--bg-card);
      margin: 0 0 10px; padding: 5px; border: var(--border-med); border-radius: var(--radius-sm);
      box-shadow: var(--shadow-hard-sm); }
    .feed-sticky .feed-mode-tabs { margin-bottom: 0; }

    /* Skeleton Loading */
    .skeleton-card { background: var(--bg-card); border: var(--border-thick); box-shadow: var(--shadow-hard-lg);
      position: relative; margin-top: 14px; overflow: hidden; }
    .sk-row { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--bg-blue-subtle);
      border-bottom: var(--border-thin); }
    .sk-avatar { width: 40px; height: 40px; background: #C7DDF7; flex-shrink: 0; }
    .sk-lines { flex: 1; }
    .sk-line { height: 10px; background: #C7DDF7; margin: 6px 0; border-radius: 3px; }
    .sk-line.w60 { width: 60%; } .sk-line.w40 { width: 40%; }
    .sk-body { padding: 16px 14px; }
    .sk-line.tall { height: 14px; width: 45%; margin-bottom: 10px; }
    .sk-line.full { width: 100%; } .sk-line.w90 { width: 90%; } .sk-line.w75 { width: 75%; }
    .sk-footer { display: flex; justify-content: space-between; padding: 10px 14px; border-top: var(--border-thin); }
    .sk-pill { width: 72px; height: 24px; background: #EEF2F7; border: var(--border-thin); border-radius: 10px; }
    .sk-pill.yellow { background: #FEF3C0; width: 96px; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
    .sk-line, .sk-avatar, .sk-pill { animation: pulse 1.3s ease-in-out infinite; }
    .skeleton-card:nth-of-type(even) .sk-line, .skeleton-card:nth-of-type(even) .sk-avatar,
    .skeleton-card:nth-of-type(even) .sk-pill { animation-delay: .35s; }
    .fade-in { animation: fadein .35s ease; }
    @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

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

    <div class="feed-search" role="search">
      <input type="search" id="feedSearchInput" placeholder="Cari @nama_pena atau kata kunci…" autocomplete="off" aria-label="Cari penulis atau warkah">
      <button type="button" onclick="feedSearch()" aria-label="Cari"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
      <button type="button" class="btn-tulis" onclick="typeof openStudioModal==='function' ? openStudioModal() : (location.href='/feed?action=compose')" aria-label="Tulis warkah" title="Tulis warkah">
        <svg viewBox="0 0 24 24"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
      </button>
    </div>

    <div class="feed-sticky">
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
        <div class="vis-row">
          <span class="vis-label">Visibilitas</span>
          <div class="vis-toggle" id="visToggle" role="radiogroup" aria-label="Visibilitas postingan">
            <button type="button" class="vis-opt active" data-vis="public" onclick="setVisibility('public')">Publik</button>
            <button type="button" class="vis-opt" data-vis="private" onclick="setVisibility('private')">Privat</button>
          </div>
          <span class="vis-hint" id="visHint">Terlihat semua orang</span>
        </div>
        <div class="rich-editor-canvas font-sans" id="editorCanvas" contenteditable="true" placeholder="Mulai tuliskan bait puisi, kutipan, atau cerita absurdmu di sini..."></div>
      </main>

      <footer class="docked-footer">
        <div class="tools-row">
          <div class="tools-segment">
            <button type="button" class="t-btn" id="btnBold" onclick="formatCmd('bold')"><b>B</b></button>
            <button type="button" class="t-btn" id="btnItalic" onclick="formatCmd('italic')"><i>I</i></button>
            <button type="button" class="t-btn" id="btnUnderline" onclick="formatCmd('underline')"><u>U</u></button>
            <button type="button" class="t-btn" id="btnQuote" onclick="applyQuote()">”</button>
          </div>
          <select class="font-select-picker" id="fontDropdown" onchange="handleFontDropdown(this.value)">
            <option value="font-sans">Font: Sans</option>
            <option value="font-serif">Font: Serif</option>
            <option value="font-mono">Font: Mono</option>
          </select>
        </div>
        <div class="stats-row">
          <div class="stats-label" id="studioWordCount">0 kata · 0 huruf</div>
        </div>
      </footer>
    </div>
  </div>

  <!-- 5-TAB DOCKED BOTTOM NAVBAR -->
  ${renderBottomNav('feed', user, false)}

  <script>
    let currentMode = 'viral';
    let currentChainParentId = null;
    let currentFontClass = 'font-sans';
    let currentVisibility = 'public';
    const isUserLoggedIn = ${Boolean(user)};

    function formatTimestamp(isoStr) {
      if (!isoStr) return '';
      const d = new Date(isoStr.endsWith('Z') ? isoStr : isoStr + 'Z');
      const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(':', '.');
      return '<div class="thread-timestamp-stack"><span class="time-main">' + timePart + ' WIB</span><span class="date-sub">' + datePart + '</span></div>';
    }

    const SKELETON_HTML = \`
      <div class="skeleton-card">
        <div class="sk-row"><div class="sk-avatar"></div>
          <div class="sk-lines"><div class="sk-line w40"></div><div class="sk-line w60"></div></div></div>
        <div class="sk-body"><div class="sk-line tall"></div><div class="sk-line full"></div><div class="sk-line w90"></div><div class="sk-line w75"></div></div>
        <div class="sk-footer"><div style="display:flex;gap:6px"><div class="sk-pill"></div><div class="sk-pill"></div></div><div class="sk-pill yellow"></div></div>
      </div>
      <div class="skeleton-card">
        <div class="sk-row"><div class="sk-avatar"></div>
          <div class="sk-lines"><div class="sk-line w40"></div><div class="sk-line w60"></div></div></div>
        <div class="sk-body"><div class="sk-line tall"></div><div class="sk-line full"></div><div class="sk-line w90"></div></div>
        <div class="sk-footer"><div style="display:flex;gap:6px"><div class="sk-pill"></div><div class="sk-pill"></div></div><div class="sk-pill yellow"></div></div>
      </div>\`;

    async function loadFeed() {
      const container = document.getElementById('feedContainer');
      container.innerHTML = SKELETON_HTML;
      try {
        const url = '/api/posts?mode=' + currentMode;
        const res = await fetch(url);
        const data = await res.json();

        if (data.message && currentMode === 'following') {
          container.innerHTML = '<div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">' + data.message + ' <br><br><a href="/login" style="display:inline-block;padding:8px 16px;background:#1D61E7;color:#FFF;border-radius:8px;text-decoration:none;font-weight:900;">Masuk Sekarang</a></div>';
          return;
        }

        if (!data.posts || !data.posts.length) {
          container.innerHTML = '<div style="background:#FFF;padding:24px;border:3px solid #0B192C;border-radius:16px;text-align:center;font-weight:700;box-shadow:4px 4px 0 #1E293B;">Belum ada warkah di feed ini. Jadilah yang pertama menggoreskan bait!</div>';
          return;
        }
        container.innerHTML = data.posts.map(p => renderPostCard(p)
          .replace('class="thread-card"', 'class="thread-card fade-in"')).join('');
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
            <div class="thread-avatar-clip" style="background:\${getAvatarColor(p.pen_name)};\${p.avatar_key ? \`background-image:url(/media/\${p.avatar_key});background-size:cover;background-position:center;color:transparent;\` : ''}">
              \${(p.pen_name[0] || 'D').toUpperCase()}
              <svg class="paperclip-svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </div>
            <div class="thread-author-wrap">
              <div class="thread-author-info">
                <span class="thread-name-row"><a href="/u/\${p.pen_name}" class="thread-pen-name">@\${escapeHtml(p.pen_name)}</a>\${p.is_admin ? '<svg class="vcheck" viewBox="0 0 24 24" fill="none" aria-label="Akun admin" role="img"><circle cx="12" cy="12" r="10" fill="#1D61E7"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}</span>
                <span class="thread-city">\${escapeHtml(p.city || 'Nusantara')}</span>
                \${p.visibility === 'private' ? '<span class="vis-private"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>Privat</span>' : ''}
              </div>
            </div>
            \${formatTimestamp(p.created_at)}
          </div>

          \${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(String(p.parent_id || '')) && p.parent_author ? \`
            <div class="thread-parent-connector" onclick="window.location.href='/chain/\${p.parent_id}'">
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
            <span class="chain-split">
              <button class="chain-btn" data-title="\${escapeHtml(p.title || p.pen_name)}" onclick="openStudioModal('\${p.id}', this.dataset.title)">
                <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span>\${p.chains_count ? p.chains_count + ' Sambungan' : 'Sambung Bait'}</span>
              </button>\${p.chains_count > 0 ? \`
              <button class="chain-arrow" id="chainlbl-\${p.id}" onclick="toggleChain('\${p.id}')" aria-label="Buka sambungan">\u25be</button>\` : ''}
            </span>
          </div>
          \${p.chains_count > 0 ? \`
            <div class="chain-inline" id="chainbox-\${p.id}" style="display:none"></div>
          \` : ''}
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
      else bbToast('Warkah induk dimuat di bagian sebelumnya.', 'info');
    }

    // ---- Expand/Collapse Sambungan ala TikTok ----
    const chainState = new Map(); // postId -> 'open'|'closed'
    const chainCache = new Map(); // postId -> html mini-bait

    async function toggleChain(postId) {
      const box = document.getElementById('chainbox-' + postId);
      const lbl = document.getElementById('chainlbl-' + postId);
      if (!box || !lbl) return;
      if (chainState.get(postId) === 'open') {
        box.style.display = 'none';
        chainState.set(postId, 'closed');
        lbl.textContent = '\u25be';
        return;
      }
      if (chainCache.has(postId)) {
        box.innerHTML = chainCache.get(postId);
        box.style.display = 'block';
        chainState.set(postId, 'open');
        lbl.textContent = '\u25be';
        return;
      }
      lbl.textContent = '\u2026';
      try {
        const res = await fetch('/api/posts/' + postId + '/chains');
        const data = await res.json();
        const html = (data.chains || []).map(function (b) {
          return '<div class="mini-bait">'
            + '<div class="mini-who"><a href="/u/' + escapeHtml(b.pen_name) + '">@' + escapeHtml(b.pen_name) + '</a> \u00b7 ' + escapeHtml(String(b.created_at || '').slice(0, 16).replace('T', ' ')) + '</div>'
            + '<div class="mini-txt">' + escapeHtml(stripHtml(b.content).slice(0, 140)) + ((stripHtml(b.content).length > 140) ? '...' : '') + '</div>'
            + '</div>';
        }).join('')
          + '<div class="ctamini"><a href="/chain/' + postId + '">\u26d3 Lembar Sambungan penuh \u2197</a></div>';
        chainCache.set(postId, html);
        box.innerHTML = html;
        box.style.display = 'block';
        chainState.set(postId, 'open');
        lbl.textContent = '\u25be';
      } catch (e) {
        lbl.textContent = '\u2715';
      }
    }
    window.toggleChain = toggleChain;

    function openStudioModal(parentId = null, parentName = '') {
      if (!isUserLoggedIn) {
        bbConfirm('Anda perlu masuk terlebih dahulu untuk menggoreskan warkah. Buka halaman masuk?').then(function (ok) {
          if (ok) window.location.href = '/login';
        });
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

    // Bug UX (laporan owner): tombol tulis di halaman selain feed fallback ke
    // /feed?action=compose — tanpa handler ini modal tidak terbuka otomatis dan
    // pengguna harus klik dua kali. Sekali klik di halaman mana pun = bilik terbuka.
    if (new URLSearchParams(location.search).get('action') === 'compose') {
      history.replaceState(null, '', '/feed');
      openStudioModal();
    }

    function closeStudioModal() {
      document.getElementById('studioModal').style.display = 'none';
      document.body.style.overflow = 'auto';
      document.getElementById('studioTitle').value = '';
      document.getElementById('editorCanvas').innerHTML = '';
      setVisibility('public');
    }

    function setVisibility(vis) {
      currentVisibility = vis === 'private' ? 'private' : 'public';
      document.querySelectorAll('#visToggle .vis-opt').forEach(o => {
        o.classList.toggle('active', o.dataset.vis === currentVisibility);
      });
      const hint = document.getElementById('visHint');
      if (hint) hint.textContent = currentVisibility === 'private' ? 'Hanya kamu yang bisa melihat' : 'Terlihat semua orang';
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
      if (!content || stripHtml(content).trim() === '') return bbToast('Tuliskan isi warkah terlebih dahulu.', 'warning');

      try {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, parent_id: currentChainParentId, visibility: currentVisibility })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menerbitkan warkah');
        closeStudioModal();
        loadFeed();
      } catch (err) {
        bbToast(err.message || 'Terjadi kesalahan.', 'error');
      }
    }

    function feedSearch() {
      const q = (document.getElementById('feedSearchInput').value || '').trim();
      window.location.href = '/search?q=' + encodeURIComponent(q);
    }
    const feedInput = document.getElementById('feedSearchInput');
    if (feedInput) feedInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); feedSearch(); } });
    function switchFeed(mode, el) {
      currentMode = mode;
      document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
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
        if (data.error) return bbToast(data.error, 'error');
        bbToast(data.following ? 'Berhasil mengikuti @' + penName : 'Batal mengikuti @' + penName, data.following ? 'success' : 'info');
      } catch (err) {
        console.error(err);
      }
    }

    let unreadTimer = null;
    let unreadBusy = false;
    const UNREAD_POLL_MS = 12000;
    async function checkUnreadNotifs() {
      if (unreadBusy || document.visibilityState !== 'visible') return;
      unreadBusy = true;
      try {
        const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
        const data = await res.json();
        const dot = document.getElementById('notifDot');
        if (dot) dot.style.display = data.count > 0 ? 'block' : 'none';
      } catch (err) {} finally {
        unreadBusy = false;
        clearTimeout(unreadTimer);
        if (document.visibilityState === 'visible') unreadTimer = setTimeout(checkUnreadNotifs, UNREAD_POLL_MS);
      }
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkUnreadNotifs();
      else clearTimeout(unreadTimer);
    });

    loadFeed();
    checkUnreadNotifs();
  </script>
  ${NOTIFY_HTML}
</body>
</html>`;
}
