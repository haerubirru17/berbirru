export function renderBottomNav(activeTab: 'feed' | 'pasar' | 'compose' | 'notifications' | 'profile' | '', currentUser: any = null, isMe = false): string {
  // Navbar mandiri: markup + CSS di satu tempat supaya konsisten di semua halaman.
  const aktif = (k: string) => (activeTab === k ? ' is-on' : '');
  return `
  <style>
    /* beri ruang bawah supaya item terakhir tidak tertutup nav fixed */
    body:has(> nav.bnav){padding-bottom:92px}
    .bnav{position:fixed;left:0;right:0;bottom:0;z-index:75;background:#fff;border-top:2.5px solid #0B192C;
      padding:7px 10px calc(7px + env(safe-area-inset-bottom));box-shadow:0 -4px 0 rgba(11,25,44,.06)}
    .bnav-in{max-width:560px;margin:auto;display:grid;grid-template-columns:repeat(5,1fr);align-items:end;gap:2px}
    .bnav-item{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;min-height:46px;
      text-decoration:none;color:#64748B;font:800 9.5px 'DM Sans';letter-spacing:.01em;cursor:pointer;-webkit-tap-highlight-color:transparent}
    .bnav-item svg{width:21px;height:21px;stroke:currentColor;stroke-width:2.1;fill:none;stroke-linecap:round;stroke-linejoin:round}
    .bnav-item.is-on{color:#1D61E7}
    .bnav-item.is-on svg{stroke-width:2.5}
    .bnav-item.is-on .bnav-lbl{background:#DBEAFE;border:1.5px solid #0B192C;padding:1px 6px;box-shadow:1px 1px 0 #26364A}
    .bnav-lbl{padding:1px 6px;border:1.5px solid transparent}
    .bnav-plus{display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;color:#0B192C;
      font:900 9.5px 'DM Sans';transform:translateY(-11px)}
    .bnav-plus .p{width:46px;height:46px;display:grid;place-items:center;background:#FDE047;border:2.5px solid #0B192C;box-shadow:3px 3px 0 #26364A}
    .bnav-plus .p svg{width:22px;height:22px;stroke:#0B192C;stroke-width:2.8;fill:none;stroke-linecap:round}
    .bnav-plus:active .p{transform:translate(2px,2px);box-shadow:1px 1px 0 #26364A}
    .bnav-bell{position:relative;display:inline-flex}
    .bnav-dot{position:absolute;top:-2px;right:-3px;width:8px;height:8px;border-radius:50%;background:#B42318;border:1.5px solid #fff}
  </style>
  <nav class="bnav">
    <div class="bnav-in">
      <a href="/feed" class="bnav-item${aktif('feed')}">
        <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span class="bnav-lbl">Beranda</span>
      </a>
      <a href="/pasar" class="bnav-item${aktif('pasar')}">
        <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>
        <span class="bnav-lbl">Pasar</span>
      </a>
      <a href="/pasar/jual" class="bnav-plus">
        <span class="p"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>
        <span>Jual</span>
      </a>
      <a href="/notifications" class="bnav-item${aktif('notifications')}">
        <span class="bnav-bell">
          <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span class="bnav-dot" id="notifDot" style="display:none;"></span>
        </span>
        <span class="bnav-lbl">Notifikasi</span>
      </a>
      <a href="${currentUser ? '/u/' + currentUser.pen_name : '/login'}" class="bnav-item${activeTab === 'profile' && isMe ? ' is-on' : ''}">
        <svg viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="bnav-lbl">Profil</span>
      </a>
    </div>
  </nav>
  `;
}
