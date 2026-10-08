export function renderProfilePage(penName: string, isMe = false, currentUser: any = null): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@${penName} — Pustaka Penulis BERBIRRU.COM</title>
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
    .brand-badge {
      display: inline-flex; align-items: center; gap: 6px; background: var(--blue-primary);
      color: #FFFFFF; padding: 4px 12px; border: var(--border-med); border-radius: var(--radius-sm);
      box-shadow: var(--shadow-hard-sm); text-decoration: none;
    }
    .brand-badge span { font-family: 'Space Grotesk', sans-serif; font-size: 14px; font-weight: 700; }
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
    .tiktok-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 18px; }
    .tab-btn {
      background: var(--bg-card); border: var(--border-med); border-radius: var(--radius-sm);
      padding: 8px 4px; font-size: 11px; font-weight: 900; cursor: pointer; box-shadow: var(--shadow-hard-sm);
      display: flex; flex-direction: column; align-items: center; gap: 4px; color: var(--ink);
    }
    .tab-btn.active { background: var(--blue-primary); color: #FFFFFF; box-shadow: 2px 2px 0 var(--shadow-ink); }
    .feed-list { display: flex; flex-direction: column; gap: 16px; }

    /* Unified Threads Card Style in Profile */
    .thread-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); overflow: hidden;
    }
    .thread-header-soft {
      background: var(--bg-blue-subtle); padding: 10px 14px; display: flex; justify-content: space-between;
      align-items: center; border-bottom: var(--border-thin);
    }
    .thread-author-wrap { display: flex; align-items: center; gap: 8px; }
    .thread-avatar { width: 26px; height: 26px; background: var(--blue-primary); color: #FFF; border: 1.5px solid var(--ink); border-radius: 6px; display: grid; place-items: center; font-size: 12px; font-weight: 900; }
    .thread-author-info { display: flex; flex-direction: column; }
    .thread-pen-name { font-size: 12px; font-weight: 800; color: var(--ink); text-decoration: none; }
    .thread-timestamp { font-size: 10px; font-weight: 800; color: #475569; font-family: 'JetBrains Mono', monospace; }
    .thread-body { padding: 14px 14px 12px; }
    .thread-title { font-family: 'Space Grotesk', sans-serif; font-size: 15px; font-weight: 800; color: var(--ink); margin-bottom: 6px; }
    .thread-text { font-size: 14px; font-weight: 600; line-height: 1.6; color: #0F172A; }
    .thread-text blockquote { background: var(--bg-blue-subtle); border-left: 3px solid var(--blue-primary); padding: 4px 8px; margin: 6px 0; font-style: italic; border-radius: 4px; }
    
    .font-serif { font-family: 'Merriweather', serif !important; }
    .font-sans { font-family: 'Plus Jakarta Sans', sans-serif !important; }
    .font-mono { font-family: 'JetBrains Mono', monospace !important; background: #E0EEFD; padding: 1px 4px; border-radius: 4px; }

    .thread-footer { padding: 8px 12px; background: #FFFFFF; border-top: var(--border-thin); display: flex; justify-content: space-between; align-items: center; }
    
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
      <a href="/" class="brand-badge">
        <span>BERBIRRU</span>
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
        window.location.href = '/u/' + data.user.pen_name;
      } catch (err) {
        alert(err.message);
      }
    }

    async function handleLogout() {
      if (!confirm('Apakah Anda yakin ingin keluar dari akun?')) return;
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
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
          document.getElementById('bioDisplay').textContent = '"' + (data.user.bio || 'Goresan perenungan rasa.') + '"';
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
      const datePart = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', timeZone: 'Asia/Jakarta' });
      const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).replace(':', '.');
      return datePart + ' · ' + timePart + ' WIB';
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
              <div class="thread-author-wrap">
                <div class="thread-avatar">\${(p.pen_name[0] || 'D').toUpperCase()}</div>
                <div class="thread-author-info">
                  <span class="thread-pen-name">@\${p.pen_name}</span>
                </div>
              </div>
              <span class="thread-timestamp">\${formatTimestamp(p.created_at)}</span>
            </div>
            <div class="thread-body">
              \${p.title ? \`<h3 class="thread-title">\${p.title}</h3>\` : ''}
              <div class="thread-text">\${p.content}</div>
            </div>
            <div class="thread-footer">
              <span style="font-size:11.5px;font-weight:800;color:#1D61E7;">\${p.likes_count || 0} Terpaut · \${p.saves_count || 0} Simpan</span>
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
