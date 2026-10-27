type Mode = 'sosial' | 'pasar';
type MarketTab = 'pasar' | 'pesanan' | 'toko' | 'akun';

export function renderBottomNav(
  activeTab: 'feed' | 'pasar' | 'compose' | 'notifications' | 'profile' | 'akun' | '',
  currentUser: any = null,
  isMe = false,
  opts: { mode?: Mode; marketTab?: MarketTab } = {},
): string {
  // Dua dunia, dua navbar: sosial (biru) vs pasar (kuning). Ini satu-satunya pembeda
  // yang selalu terlihat, jadi pengguna tahu sedang di mana.
  const mode: Mode = opts.mode || (activeTab === 'pasar' ? 'pasar' : 'sosial');
  const mt: MarketTab = opts.marketTab || (activeTab === 'pasar' ? 'pasar' : 'pesanan');
  const akun = currentUser ? '/u/' + currentUser.pen_name : '/login';
  const on = (k: string) => (activeTab === k ? ' is-on' : '');
  const mon = (k: MarketTab) => (mode === 'pasar' && mt === k ? ' is-on' : '');

  const item = (href: string, label: string, svg: string, aktif: string) => `
      <a href="${href}" class="bnav-item${aktif}">
        <svg viewBox="0 0 24 24">${svg}</svg>
        <span class="bnav-lbl">${label}</span>
      </a>`;

  const icoHome = '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
  const icoPasar = '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>';
  const icoPesanan = '<path d="M9 11h6M9 15h4"/><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/>';
  const icoToko = '<path d="M3 9h18M3 9l1.5-4.5h15L21 9M4 9v11h16V9M9 20v-6h6v6"/>';
  const icoBell = '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>';
  const icoUser = '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>';
  const icoTulis = '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4Z"/>';
  const plus = '<path d="M12 5v14M5 12h14"/>';

  const isi = mode === 'pasar'
    ? item('/pasar', 'Pasar', icoPasar, mon('pasar'))
      + item('/pasar/saya?tab=pesanan', 'Pesanan', icoPesanan, mon('pesanan'))
      + `
      <a href="/pasar/jual" class="bnav-plus" data-mode="pasar">
        <span class="p"><svg viewBox="0 0 24 24">${plus}</svg></span>
        <span>Jual</span>
      </a>`
      // Belum punya toko: label jujur "Buka Toko" + tanda +, menuju pengajuan (bukan halaman kosong).
      + (() => {
        const punya = currentUser && currentUser.seller_status === 'approved';
        const nunggu = currentUser && currentUser.seller_status === 'pending';
        const label = punya ? 'Toko' : nunggu ? 'Menunggu' : 'Buka Toko';
        const href = punya ? '/pasar/saya?tab=toko' : '/pasar/jual';
        const tanda = !punya && !nunggu ? '<span class="bnav-plusmark">+</span>' : '';
        return `
      <a href="${href}" class="bnav-item${mon('toko')}${punya ? '' : ' is-baru'}">
        <span class="bnav-ico">${tanda}<svg viewBox="0 0 24 24">${icoToko}</svg></span>
        <span class="bnav-lbl">${label}</span>
      </a>`;
      })()
      + item('/akun', 'Akun', icoUser, mon('akun'))
    : item('/feed', 'Beranda', icoHome, on('feed'))
      + item('/pasar', 'Pasar', icoPasar, '')
      + `
      <a href="/feed?action=compose" class="bnav-plus" data-mode="sosial" onclick="if(typeof openStudioModal==='function'){event.preventDefault();openStudioModal()}">
        <span class="p"><svg viewBox="0 0 24 24">${icoTulis}</svg></span>
        <span>Tulis</span>
      </a>`
      + item('/notifications', 'Notifikasi', icoBell, on('notifications'))
      + item(akun, 'Profil', icoUser, activeTab === 'profile' && isMe ? ' is-on' : '');

  return `
  <style>
    body:has(> nav.bnav){padding-bottom:92px}
    .bnav{position:fixed;left:0;right:0;bottom:0;z-index:75;background:#fff;border-top:2.5px solid #0B192C;
      padding:7px 10px calc(7px + env(safe-area-inset-bottom));box-shadow:0 -4px 0 rgba(11,25,44,.06)}
    .bnav[data-mode="sosial"]{border-top-color:#0B192C}
    .bnav[data-mode="pasar"]{border-top-color:#B45309;background:#FFFDF5}
    .bnav-in{max-width:560px;margin:auto;display:grid;grid-template-columns:repeat(5,1fr);align-items:end;gap:2px}
    .bnav-item{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;min-height:46px;
      text-decoration:none;color:#64748B;font:800 9.5px 'DM Sans';letter-spacing:.01em;cursor:pointer;-webkit-tap-highlight-color:transparent}
    .bnav-item svg{width:21px;height:21px;stroke:currentColor;stroke-width:2.1;fill:none;stroke-linecap:round;stroke-linejoin:round}
    .bnav-lbl{padding:1px 6px;border:1.5px solid transparent}
    .bnav[data-mode="sosial"] .bnav-item.is-on{color:#1D61E7}
    .bnav[data-mode="pasar"] .bnav-item.is-on{color:#B45309}
    .bnav-item.is-on svg{stroke-width:2.5}
    .bnav[data-mode="sosial"] .bnav-item.is-on .bnav-lbl{background:#DBEAFE;border-color:#0B192C;box-shadow:1px 1px 0 #26364A}
    .bnav[data-mode="pasar"] .bnav-item.is-on .bnav-lbl{background:#FDE047;border-color:#0B192C;box-shadow:1px 1px 0 #26364A}
    .bnav-plus{display:flex;flex-direction:column;align-items:center;gap:2px;text-decoration:none;color:#0B192C;
      font:900 9.5px 'DM Sans';transform:translateY(-11px)}
    .bnav-plus .p{width:46px;height:46px;display:grid;place-items:center;background:#FDE047;border:2.5px solid #0B192C;box-shadow:3px 3px 0 #26364A}
    .bnav-plus[data-mode="sosial"] .p{background:#DBEAFE}
    .bnav-plus .p svg{width:22px;height:22px;stroke:#0B192C;stroke-width:2.8;fill:none;stroke-linecap:round}
    .bnav-plus:active .p{transform:translate(2px,2px);box-shadow:1px 1px 0 #26364A}
    .bnav-ico{position:relative;display:inline-flex;line-height:0}
    .bnav-plusmark{position:absolute;top:-4px;right:-7px;display:grid;place-items:center;width:13px;height:13px;
      background:#FDE047;border:1.5px solid #0B192C;border-radius:50%;font:900 10px/1 'DM Sans';color:#0B192C}
    .bnav-item.is-baru .bnav-lbl{font-size:8.5px;letter-spacing:0}
    .bnav-bell{position:relative;display:inline-flex}
    .bnav-dot{position:absolute;top:-2px;right:-3px;width:8px;height:8px;border-radius:50%;background:#B42318;border:1.5px solid #fff}
  </style>
  <nav class="bnav" data-mode="${mode}">
    <div class="bnav-in">${isi}
    </div>
  </nav>
  `;
}
