import { renderBottomNav } from './layout';

function esc(t: any): string {
  return String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function stripTags(t: any): string {
  return String(t || '').replace(/<[^>]*>/g, ' ');
}
function fmtTime(t: any): string {
  return String(t || '').slice(0, 16).replace('T', ' ');
}

// Lembar Sambungan — halaman baca rantai bait. id = post mana pun di rantai.
// ponytail: semua SSR, nol fetch klien; rantai dalam ditampilkan penuh (limit 50).
export function renderChainPage(opts: {
  user: any;
  root: any;
  rootAuthor: string;
  orphans: boolean;           // induk asli sudah dihapus penulisnya
  children: any[];
}): string {
  const { user, root, rootAuthor, orphans, children } = opts;
  const rootAva = (rootAuthor[0] || 'D').toUpperCase();

  const childrenHtml = children.map((b: any) => `
    <div class="tcard">
      <span class="knob"></span>
      <div class="tmini">
        <div class="tava" style="background:${['#1D5FD6', '#7A4FBF', '#C2410C', '#0F7B3D', '#B45309'][(b.pen_name || 'D').charCodeAt(0) % 5]}">${(b.pen_name[0] || 'D').toUpperCase()}</div>
        <div><a class="tname" href="/u/${esc(b.pen_name)}">@${esc(b.pen_name)}</a> <span class="ttime">· ${esc(fmtTime(b.created_at))}</span></div>
      </div>
      ${b.title ? `<div class="ttitle">${esc(b.title)}</div>` : ''}
      <div class="tbody">${b.content}</div>
      <div class="tfoot-mini">♡ ${b.likes_count || 0} · ⛓ ${b.chains_count || 0}</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lembar Sambungan — BERBIRRU.COM</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&family=Space+Grotesk:wght@600;700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-main: #F0F6FE; --bg-card: #FFFFFF; --bg-blue-subtle: #E0EEFD;
      --ink: #0B192C; --shadow-ink: #1E293B; --blue-primary: #1D61E7;
      --blue-deep: #0F3E99; --blue-light: #60A5FA; --accent-yellow: #FDE047;
      --border-thick: 3px solid var(--ink); --border-med: 2.5px solid var(--ink); --border-thin: 2px solid var(--ink);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #EAF2FB; font-family: 'Plus Jakarta Sans', sans-serif; color: #0B192C; padding-bottom: 96px; }
    .wrap { max-width: 560px; margin: 0 auto; padding: 14px; }
    .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .brand { display: flex; align-items: center; gap: 7px; font-family: 'Space Grotesk'; font-weight: 900; font-size: 15px; letter-spacing: 0.5px; text-decoration: none; color: #0B192C; }
    .back { font-size: 12.5px; font-weight: 900; border: 2px solid #0B192C; background: #FFF; border-radius: 9px; padding: 6px 12px; box-shadow: 2px 2px 0 #1E293B; text-decoration: none; color: #0B192C; }
    .badge-open { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 900; letter-spacing: 0.5px; color: #0F7B3D; background: #DDF5E4; border: 1.5px solid #0F7B3D; border-radius: 6px; padding: 3px 8px; white-space: nowrap; }
    .notice { background: #FFF8E6; border: 2px dashed #C79A2E; border-radius: 12px; padding: 11px 13px; font-size: 12.5px; font-weight: 600; color: #7A5A00; margin-bottom: 12px; line-height: 1.5; }
    .tcard { background: #FFF; border: 2.5px solid #22314A; border-radius: 13px; box-shadow: 3px 3px 0 #C9D6E8; padding: 12px 13px; margin-bottom: 12px; position: relative; }
    .tcard.root { background: #F4F8FE; }
    .root-tag { font-size: 10px; font-weight: 900; letter-spacing: 1px; color: #5A6B85; text-transform: uppercase; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .tmini { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; flex-wrap: wrap; }
    .tava { width: 28px; height: 28px; flex: none; border-radius: 50%; background: #1D5FD6; color: #FFF; border: 2px solid #0B192C; display: grid; place-items: center; font-family: 'Space Grotesk'; font-weight: 900; font-size: 13px; }
    .tname { font-size: 13px; font-weight: 900; color: #0B192C; text-decoration: none; }
    .ttime { font-size: 10.5px; color: #8895AC; font-weight: 600; }
    .ttitle { font-family: 'Newsreader', serif; font-size: 16.5px; font-weight: 600; color: #0B192C; margin-bottom: 4px; }
    .tbody { font-size: 13.5px; line-height: 1.65; color: #22314A; }
    .tbody p { margin-bottom: 8px; }
    .tfoot-mini { margin-top: 8px; font-size: 11px; font-weight: 800; color: #64748B; }
    .rail { position: relative; padding-left: 17px; margin-top: 14px; }
    .rail::before { content: ''; position: absolute; left: 5px; top: 6px; bottom: 30px; width: 2.5px; background: #B7D3F8; border-radius: 2px; }
    .rail .tcard .knob { position: absolute; left: -17px; top: 15px; width: 9px; height: 9px; background: #1D5FD6; border: 2px solid #0B192C; border-radius: 50%; }
    /* 5-TAB DOCKED BOTTOM NAVBAR — kembar search/feed (renderBottomNav menyuntik HTML-nya,
       CSS-nya harus ikut di setiap halaman yang memakai navbar) */
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
    .bell-wrap { position: relative; }
    .notif-dot { position: absolute; top: -4px; right: -6px; width: 9px; height: 9px; background: #E11D48; border: 1.5px solid #FFF; border-radius: 50%; }
    .lbl { font-size: 11px; font-weight: 900; letter-spacing: 1px; color: #5A6B85; text-transform: uppercase; margin: 16px 2px 10px; }
    .cta { display: flex; align-items: center; justify-content: center; gap: 7px; background: #FFD834; border: 2.5px solid #0B192C; border-radius: 11px; box-shadow: 3px 3px 0 #1E293B; padding: 11px; text-align: center; font-weight: 900; font-size: 13.5px; text-decoration: none; color: #0B192C; }
    .cta:active { transform: translate(2px, 2px); box-shadow: none; }
    .ico { width: 16px; height: 16px; stroke: #0B192C; stroke-width: 2.2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <a class="brand" href="/feed">
        <svg class="ico" style="width:15px;height:15px;" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        BERBIRRU
      </a>
      <a class="back" href="/feed">‹ Beranda</a>
    </div>

    ${orphans ? `<div class="notice">🕊️ Bait asli telah dihapus penulisnya. Sambungan di bawah tetap hidup sebagai karya masing-masing penulis.</div>` : ''}

    <div class="tcard root">
      <div class="root-tag">
        <span>${orphans ? 'Bait Sambungan Tertua' : 'Bait Asli'}</span>
        ${orphans ? '' : '<span class="badge-open">🔓 BUKA UNTUK SIAPAPUN</span>'}
      </div>
      <div class="tmini">
        <div class="tava">${rootAva}</div>
        <div><a class="tname" href="/u/${esc(rootAuthor)}">@${esc(rootAuthor)}</a> <span class="ttime">· ${esc(fmtTime(root.created_at))}</span></div>
      </div>
      ${root.title ? `<div class="ttitle">${esc(root.title)}</div>` : ''}
      <div class="tbody">${root.content}</div>
      <div class="tfoot-mini">♡ ${root.likes_count || 0} terpaut · ⛓ ${root.chains_count || 0} sambungan</div>
    </div>

    <div class="lbl">Sambungan (${children.length})</div>
    <div class="rail">
      ${childrenHtml || '<div style="font-size:12.5px;font-weight:600;color:#64748B;padding:6px 0;">Belum ada yang menyambung bait ini.</div>'}
    </div>

    <a class="cta" href="/feed?sambung=${esc(root.id)}&oleh=${esc(rootAuthor)}">
      <svg class="ico" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
      Sambung Bait Ini
    </a>
  </div>

  ${renderBottomNav('feed', user, false)}
</body>
</html>`;
}
