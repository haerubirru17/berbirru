export function renderBottomNav(activeTab: 'feed' | 'search' | 'compose' | 'notifications' | 'profile' | '', currentUser: any = null, isMe = false): string {
  return `
  <!-- 5-TAB DOCKED BOTTOM NAVBAR — Shared Component -->
  <nav class="bottom-navbar">
    <div class="navbar-inner">
      <a href="/feed" class="nav-item ${activeTab === 'feed' ? 'active' : ''}">
        <!-- Lucide Home -->
        <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Beranda</span>
      </a>

      <a href="/feed?tab=search" class="nav-item ${activeTab === 'search' ? 'active' : ''}">
        <!-- Lucide Search -->
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span>Telusuri</span>
      </a>

      <div class="nav-item nav-item-center" onclick="typeof openStudioModal === 'function' ? openStudioModal() : (location.href='/feed?action=compose')">
        <div class="btn-create-floating">
          <!-- Lucide SquarePen -->
          <svg viewBox="0 0 24 24"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"/></svg>
        </div>
      </div>

      <a href="/notifications" class="nav-item ${activeTab === 'notifications' ? 'active' : ''}">
        <div class="bell-wrap">
          <!-- Lucide Bell -->
          <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <div class="notif-dot" id="notifDot" style="display:none;"></div>
        </div>
        <span>Aktivitas</span>
      </a>

      <a href="${currentUser ? '/u/' + currentUser.pen_name : '/login'}" class="nav-item ${activeTab === 'profile' && isMe ? 'active' : ''}">
        <!-- Lucide User -->
        <svg viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Akun</span>
      </a>
    </div>
  </nav>
  `;
}
