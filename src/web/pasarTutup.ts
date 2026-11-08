// Halaman info: Pasar Buku sedang dipersiapkan (gate PASAR_TUTUP — Strix run-4 followup).
// Desain: varian mockup #1 (krem editorial) yang dipilih owner.
export function renderPasarTutupPage(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pasar Buku — BERBIRRU</title>
<link rel="icon" type="image/svg+xml" href="/favicon.ico">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,600;6..72,700&family=Roboto+Mono:wght@600&family=DM+Sans:wght@500;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #F6F3EB; color: #0B192C;
         min-height: 100vh; display: flex; flex-direction: column; -webkit-font-smoothing: antialiased; }
  .topbar { display: flex; justify-content: center; padding: 14px 0 6px; }
  .brand { font-family: 'Newsreader', serif; font-size: 23px; font-weight: 700; }
  .brand .com { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #E8641C; font-weight: 700; vertical-align: super; }
  main { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
         text-align: center; padding: 30px 26px 90px; }
  .ikon { width: 64px; height: 64px; border: 1px solid #CED8C8; background: #FFFEF8; border-radius: 16px;
          display: grid; place-items: center; margin-bottom: 20px; }
  .ikon svg { width: 30px; height: 30px; stroke: #1D61E7; stroke-width: 1.8; fill: none; }
  .label { font-family: 'Roboto Mono', monospace; font-size: 10px; letter-spacing: .18em;
           text-transform: uppercase; color: #8A8578; margin-bottom: 10px; }
  h1 { font-family: 'Newsreader', serif; font-size: 27px; font-weight: 700; margin-bottom: 12px; }
  p { font-size: 14.5px; line-height: 1.65; color: #4D473C; max-width: 290px; margin-bottom: 28px; }
  p b { color: #0B192C; }
  a.kembali { font-family: 'Roboto Mono', monospace; font-size: 11.5px; letter-spacing: .08em;
              color: #1D61E7; text-decoration: none; border: 1px solid #1D61E7; padding: 10px 22px; }
  a.kembali:hover { background: #1D61E7; color: #fff; }
  .bnav { position: fixed; bottom: 0; left: 0; right: 0; background: #FFFDF6;
          border-top: 1px solid #DED9C8; display: flex; justify-content: space-around; padding: 10px 8px 14px; }
  .bnav a { font-family: 'Roboto Mono', monospace; font-size: 9.5px; letter-spacing: .06em;
            color: #8A8578; text-decoration: none; text-transform: uppercase; }
  .bnav a.on { color: #0B192C; border-bottom: 2px solid #1D61E7; padding-bottom: 3px; }
</style>
</head>
<body>
  <div class="topbar"><div class="brand">BERBIRRU<span class="com">.COM</span></div></div>
  <main>
    <div class="ikon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M20 17v5H6.5A2.5 2.5 0 0 1 4 19.5"/><path d="M9 7h7M9 10h5"/></svg></div>
    <div class="label">Pasar Buku</div>
    <h1>Sedang dipersiapkan</h1>
    <p>Fitur <b>jual-beli buku</b> sedang disempurnakan agar transaksi lebih aman dan nyaman. Halaman ini akan dibuka segera.</p>
    <a class="kembali" href="/feed">Kembali ke Beranda</a>
  </main>
  <nav class="bnav">
    <a href="/feed">Beranda</a>
    <a class="on" href="/pasar">Pasar</a>
    <a href="/pasar/jual">+</a>
    <a href="/notifications">Notifikasi</a>
    <a href="/akun">Profil</a>
  </nav>
</body>
</html>`;
}
