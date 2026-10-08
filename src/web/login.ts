export function renderLoginPage(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Masuk — BERBIRRU.COM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&family=Space+Grotesk:wght@600;700;800&family=JetBrains+Mono:wght@600;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-main: #F0F6FE; --bg-card: #FFFFFF; --bg-blue-subtle: #E0EEFD;
      --ink: #0B192C; --shadow-ink: #1E293B; --blue-primary: #1D61E7;
      --border-thick: 3px solid var(--ink); --border-med: 2.5px solid var(--ink);
      --shadow-hard: 4px 4px 0 var(--shadow-ink); --shadow-hard-lg: 6px 6px 0 var(--shadow-ink); --shadow-hard-sm: 2.5px 2.5px 0 var(--shadow-ink);
      --radius: 16px; --radius-sm: 10px;
    }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      background-color: var(--bg-main); color: var(--ink); min-height: 100vh;
      background-image: radial-gradient(#CBD5E1 1.5px, transparent 1.5px);
      background-size: 22px 22px; padding: 24px 16px;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
    }
    .container { width: 100%; max-width: 400px; margin: 0 auto; }
    .brand-header { text-align: center; margin-bottom: 18px; }
    .brand-badge {
      display: inline-flex; align-items: center; gap: 8px; background: var(--blue-primary);
      color: #FFFFFF; padding: 8px 18px; border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard); transform: rotate(-1deg); text-decoration: none;
    }
    .brand-badge h1 { font-family: 'Space Grotesk', sans-serif; font-size: 21px; font-weight: 800; letter-spacing: 0.5px; }
    .auth-card {
      background: var(--bg-card); border: var(--border-thick); border-radius: var(--radius);
      box-shadow: var(--shadow-hard-lg); overflow: hidden;
    }
    .auth-tab-switch {
      display: grid; grid-template-columns: 1fr 1fr; border-bottom: var(--border-thick);
      background: var(--bg-blue-subtle);
    }
    .auth-tab {
      padding: 12px; font-family: 'Space Grotesk', sans-serif; font-size: 13.5px; font-weight: 800;
      text-align: center; background: transparent; color: #64748B; border: none; cursor: pointer;
      display: flex; justify-content: center; align-items: center; gap: 6px; transition: background 0.1s ease;
    }
    .auth-tab.active {
      background: #FFFFFF; color: var(--blue-primary); box-shadow: inset 0 -3px 0 var(--blue-primary);
    }
    .auth-body { padding: 22px 18px 20px; }
    .form-group { margin-bottom: 14px; }
    .form-label {
      display: block; font-size: 11.5px; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.3px; color: var(--ink); margin-bottom: 6px;
    }
    .form-input {
      width: 100%; font: inherit; font-size: 13.5px; font-weight: 700; padding: 10px 12px;
      border: var(--border-med); border-radius: var(--radius-sm); background: #FAFAFA; color: var(--ink);
      outline: none; box-shadow: inset 1px 1px 0 rgba(0,0,0,0.05);
    }
    .form-input:focus { background: #FFFFFF; border-color: var(--blue-primary); box-shadow: 2px 2px 0 var(--shadow-ink); }
    .btn-submit-auth {
      width: 100%; background: var(--blue-primary); color: #FFFFFF; border: var(--border-thick);
      border-radius: var(--radius-sm); padding: 11px; font-size: 13.5px; font-weight: 900;
      text-align: center; box-shadow: var(--shadow-hard); cursor: pointer; display: flex;
      justify-content: center; align-items: center; gap: 8px; margin-top: 6px; transition: transform 0.05s ease;
    }
    .btn-submit-auth:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 var(--shadow-ink); }
    .auth-footer-help { margin-top: 14px; text-align: center; font-size: 11.5px; font-weight: 700; color: #64748B; }
    .auth-footer-help a { color: var(--blue-primary); text-decoration: underline; }
    .ico { width: 14px; height: 14px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-header">
      <a href="/" class="brand-badge">
        <svg class="ico" style="width:18px;height:18px;" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <h1>BERBIRRU.COM</h1>
      </a>
    </div>

    <div class="auth-card">
      <div class="auth-tab-switch">
        <button class="auth-tab active" id="tabLogin" onclick="switchAuth(true)">
          <svg class="ico" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          <span>Masuk</span>
        </button>
        <button class="auth-tab" id="tabRegister" onclick="switchAuth(false)">
          <svg class="ico" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          <span>Daftar</span>
        </button>
      </div>

      <div class="auth-body">
        <form id="authForm" onsubmit="handleAuth(event)">
          <div class="form-group" id="penNameGroup" style="display:none;">
            <label class="form-label">Nama Pena (@)</label>
            <input type="text" id="penNameInput" class="form-input" placeholder="contoh: damiyati">
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" id="emailInput" class="form-input" placeholder="nama@email.com" required>
          </div>

          <div class="form-group">
            <label class="form-label">Kata Sandi</label>
            <input type="password" id="passwordInput" class="form-input" placeholder="••••••••" required>
          </div>

          <button type="submit" class="btn-submit-auth" id="btnSubmit">
            <svg class="ico" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <span id="btnSubmitText">Masuk</span>
          </button>
        </form>

        <div class="auth-footer-help">
          <p id="authHelperText">Lupa kata sandi? <a href="#">Kirim Tautan Masuk</a></p>
        </div>
      </div>
    </div>
  </div>

  <script>
    let isLoginMode = true;
    function switchAuth(isLogin) {
      isLoginMode = isLogin;
      document.getElementById('tabLogin').classList.toggle('active', isLogin);
      document.getElementById('tabRegister').classList.toggle('active', !isLogin);
      document.getElementById('penNameGroup').style.display = isLogin ? 'none' : 'block';
      document.getElementById('btnSubmitText').textContent = isLogin ? 'Masuk' : 'Daftar Pustaka';
      document.getElementById('authHelperText').style.display = isLogin ? 'block' : 'none';
    }

    async function handleAuth(e) {
      e.preventDefault();
      const email = document.getElementById('emailInput').value.trim();
      const password = document.getElementById('passwordInput').value.trim();
      const penName = document.getElementById('penNameInput').value.trim();
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, pen_name: penName })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan saat masuk');
        window.location.href = '/feed';
      } catch (err) {
        alert(err.message);
      }
    }
  </script>
</body>
</html>`;
}
