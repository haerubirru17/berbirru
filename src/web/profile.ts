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
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg-main); color: var(--ink); min-height: 100vh;
      background-image: radial-gradient(#CBD5E1 1.5px, transparent 1.5px);
      background-size: 22px 22px; padding: 20px 16px 60px;
    }
    .container { max-width: 480px; margin: 0 auto; }
    .top-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .nav-back-btn {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 6px 14px; font-size: 12px; font-weight: 800; box-shadow: var(--shadow-hard-sm);
      display: inline-flex; align-items: center; gap: 6px; text-decoration: none; color: var(--ink);
    }
    .brand-wrap { display: inline-flex; align-items: center; text-decoration: none; position: relative; }
    .brand-badge {
      display: inline-flex; align-items: center; gap: 4px; background: var(--blue-primary);
      color: #FFFFFF; padding: 4px 10px; border: var(--border-med); border-radius: var(--radius-sm);
      box-shadow: var(--shadow-hard-sm); transform: rotate(-1deg); position: relative; z-index: 2;
    }
    .brand-badge span { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 800; }
    .brand-com-tag {
      font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 900;
      color: var(--blue-primary); position: relative; display: inline-block;
      transform: rotate(2deg); margin-left: 2px; margin-top: 1px; z-index: 1;
    }
    .brand-com-tag::after {
      content: ''; position: absolute; left: -16px; bottom: 0px; width: calc(100% + 20px); height: 4.5px;
      background: var(--accent-yellow); border-radius: 2px; z-index: 0;
    }
    .profile-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); padding: 18px 16px; margin-bottom: 20px; position: relative;
    }
    .profile-top-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .profile-avatar-wrap { display: flex; gap: 12px; align-items: center; position: relative; }
    .avatar-box {
      width: 54px; height: 54px; background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: 14px; display: grid; place-items: center; font-family: 'Space Grotesk', sans-serif;
      font-size: 24px; font-weight: 700; box-shadow: var(--shadow-hard-sm); flex-shrink: 0; cursor: pointer;
      position: relative; user-select: none;
    }
    .pen-name-group { display: flex; flex-direction: column; }
    .pen-name { font-family: 'JetBrains Mono', monospace; font-size: 16.5px; font-weight: 800; color: var(--ink); }
    .city-badge { font-size: 11px; font-weight: 700; color: #64748B; display: flex; align-items: center; gap: 4px; margin-top: 2px; }
    .btn-follow {
      background: var(--accent-yellow); color: var(--ink); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 7px 14px; font-size: 12px; font-weight: 900; box-shadow: var(--shadow-hard-sm); cursor: pointer;
      display: inline-flex; align-items: center; gap: 5px;
    }
    .bio-box {
      font-size: 13px; font-weight: 600; line-height: 1.45; color: #334155; background: var(--bg-blue-subtle);
      border: 1.5px solid var(--ink); border-radius: var(--radius-sm); padding: 10px 12px; margin-bottom: 14px;
    }
    .metrics-bar {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #0F172A;
      padding: 10px; border: var(--border-med); border-radius: var(--radius-sm); box-shadow: 2px 2px 0 var(--shadow-ink);
    }
    .metric-cell { text-align: center; border-right: 1px dashed rgba(255,255,255,0.2); }
    .metric-cell:last-child { border-right: none; }
    .metric-val { font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 800; color: var(--accent-yellow); line-height: 1.1; }
    .metric-lbl { font-size: 9.5px; font-weight: 800; color: #94A3B8; text-transform: uppercase; margin-top: 2px; }
    /* Soft Pastel Colors for Profile Tabs (Zero Harsh Dark Blue) */
    .tiktok-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 20px; }
    .tab-btn {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 9px 4px; font-size: 11px; font-weight: 900; cursor: pointer; box-shadow: var(--shadow-hard-sm);
      display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--ink);
      transition: all 0.05s ease;
    }
    .tab-btn:active { transform: translate(1px, 1px); box-shadow: none; }
    .tab-btn.active {
      background: var(--bg-blue-subtle);
      color: var(--blue-primary);
      border-color: var(--blue-primary);
      box-shadow: inset 0 -3px 0 var(--blue-primary), 2px 2px 0 var(--shadow-ink);
    }
    .tab-btn.active svg { stroke: var(--blue-primary); stroke-width: 2.8; }
    .feed-list { display: flex; flex-direction: column; gap: 16px; }

    /* Unified Threads Card Style in Profile with Paperclip Badge */
    .feed-list { display: flex; flex-direction: column; gap: 20px; }
    .thread-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: visible; position: relative; margin-top: 14px;
    }
    .thread-header-soft {
      background: var(--bg-blue-subtle); padding: 8px 12px 8px 68px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin); border-top-left-radius: 13px; border-top-right-radius: 13px;
      min-height: 44px; position: relative;
    }
    .thread-author-wrap { display: flex; align-items: center; gap: 8px; }
    
    /* Paperclip Avatar */
    .thread-avatar-clip {
      position: absolute; left: 10px; top: -14px; width: 48px; height: 50px;
      background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: 12px; display: grid; place-items: center; font-family: 'Space Grotesk', sans-serif;
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

    .ico { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-nav">
      <a href="/feed" class="nav-back-btn">
        <svg class="ico" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        <span>Kembali ke Feed</span>
      </a>
      <a href="/" class="brand-wrap">
        <div class="brand-badge">
          <span>BERBIRRU</span>
        </div>
        <span class="brand-com-tag">.com</span>
      </a>
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
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button onclick="toggleEditModal(false)" style="padding:6px 12px;border:2px solid #0B192C;border-radius:6px;font-weight:800;background:#FFF;cursor:pointer;">Batal</button>
        <button onclick="saveProfile()" style="padding:6px 14px;border:2px solid #0B192C;border-radius:6px;font-weight:900;background:#1D61E7;color:#FFF;cursor:pointer;">Simpan</button>
      </div>
    </div>

    <div class="profile-card">
      <div class="profile-top-row">
        <div class="profile-avatar-wrap">
          <div class="avatar-box" id="avatarLetter" onclick="toggleAvatarPopover()">
            ${(penName[0] || 'D').toUpperCase()}
          </div>
          <div class="pen-name-group">
            <span class="pen-name" id="penNameDisplay">@${penName}</span>
            <div class="city-badge">
              <svg class="ico" style="width:11px;height:11px;" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span id="cityDisplay">Nusantara · Penulis Aktif</span>
            </div>
          </div>

          <!-- Popover Menu Khusus Pemilik Akun -->
          ${isMe ? `
            <div class="avatar-popover" id="avatarPopover">
              <div class="avatar-popover-item" onclick="toggleEditModal(true)">
                <svg class="ico" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>Edit Profil</span>
              </div>
              <div class="avatar-popover-item" onclick="handleLogout()">
                <svg class="ico" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                <span>Keluar Akun</span>
              </div>
            </div>
          ` : ''}
        </div>

        ${!isMe ? `
          <button class="btn-follow" onclick="followUser('${penName}')">
            <svg class="ico" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Ikuti</span>
          </button>
        ` : ''}
      </div>

      <div class="bio-box" id="bioDisplay">
        "Goresan perenungan rasa dan bait kata di Berbirru."
      </div>

      <div class="metrics-bar">
        <div class="metric-cell">
          <div class="metric-val" id="countPosts">0</div>
          <div class="metric-lbl">Warkah</div>
        </div>
        <div class="metric-cell">
          <div class="metric-val" id="countLikes">0</div>
          <div class="metric-lbl">Terpaut</div>
        </div>
        <div class="metric-cell">
          <div class="metric-val" id="countSaved">0</div>
          <div class="metric-lbl">Tersimpan</div>
        </div>
      </div>
    </div>

    <div class="tiktok-tabs">
      <div class="tab-btn active" onclick="switchProfileTab('original', this)">
        <svg class="ico" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span>Karya</span>
      </div>
      <div class="tab-btn" onclick="switchProfileTab('likes', this)">
        <svg class="ico" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span>Suka</span>
      </div>
      <div class="tab-btn" onclick="switchProfileTab('saved', this)">
        <svg class="ico" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <span>Simpan</span>
      </div>
      <div class="tab-btn" onclick="switchProfileTab('chains', this)">
        <svg class="ico" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span>Estafet</span>
      </div>
    </div>

    <div class="feed-list" id="profileFeed"></div>
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

      <a href="/notifications" class="nav-item">
        <div class="bell-wrap">
          <svg class="ico" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <span>Aktivitas</span>
      </a>

      <a href="${currentUser ? '/u/' + currentUser.pen_name : '/login'}" class="nav-item active">
        <svg class="ico" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Akun</span>
      </a>
    </div>
  </nav>

  <script>
    const currentPenName = '${penName}';
    let currentUserData = null;

    function toggleAvatarPopover() {
      const pop = document.getElementById('avatarPopover');
      if (pop) {
        pop.style.display = pop.style.display === 'block' ? 'none' : 'block';
      }
    }

    document.addEventListener('click', (e) => {
      const pop = document.getElementById('avatarPopover');
      const avatar = document.getElementById('avatarLetter');
      if (pop && avatar && !avatar.contains(e.target) && !pop.contains(e.target)) {
        pop.style.display = 'none';
      }
    });

    function toggleEditModal(show) {
      document.getElementById('editModal').style.display = show ? 'block' : 'none';
      const pop = document.getElementById('avatarPopover');
      if (pop) pop.style.display = 'none';

      if (show && currentUserData) {
        document.getElementById('editPenName').value = currentUserData.pen_name;
        document.getElementById('editCity').value = currentUserData.city || 'Nusantara';
        document.getElementById('editBio').value = currentUserData.bio || '';
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
        toggleEditModal(false);
        window.location.href = '/u/' + encodeURIComponent(data.user.pen_name);
      } catch (err) {
        alert(err.message);
      }
    }

    async function handleLogout() {
      if (!confirm('Apakah Anda yakin ingin keluar dari akun?')) return;
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
          document.getElementById('cityDisplay').textContent = (data.user.city || 'Nusantara') + ' · Penulis Aktif';
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
                  <span class="thread-pen-name">@\${p.pen_name}</span>
                </div>
              </div>
              \${formatTimestamp(p.created_at)}
            </div>
            <div class="thread-body">
              \${p.title ? \`<h3 class="thread-title">\${p.title}</h3>\` : ''}
              <div class="thread-text">\${p.content}</div>
            </div>
            <div class="thread-footer">
              <span style="font-size:11.5px;font-weight:800;color:#1D61E7;">\${p.likes_count || 0} Terpaut · \${p.saves_count || 0} Simpan · \${p.chains_count || 0} Sambungan</span>
            </div>
          </div>
        \`).join('');
      } catch (err) {
        console.error(err);
      }
    }

    function switchProfileTab(tab, el) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
      loadProfilePosts(tab);
    }

    loadUserData();
    loadProfilePosts('original');
  </script>
</body>
</html>`;
}
