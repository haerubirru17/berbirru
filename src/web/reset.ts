import { escapeHtml } from '../lib/sanitize';

/** Halaman reset sandi: 3 langkah (email → kode → sandi baru). */
export function renderResetPage(siteKey = ''): string {
  const sk = escapeHtml(siteKey);
  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Atur Ulang Sandi — BERBIRRU.COM</title>
<link rel="icon" type="image/svg+xml" href="/favicon.ico">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@500;600;700;800&family=Newsreader:opsz,wght@6..72,500;6..72,700&display=swap" rel="stylesheet">
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<style>
  :root{--ink:#0B192C;--paper:#FFF9E9;--blue:#1D61E7;--yellow:#FDE047}
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--ink);font-family:'DM Sans',sans-serif;min-height:100vh;display:grid;place-items:center;padding:24px 16px}
  .card{width:min(440px,100%);background:#fff;border:3px solid var(--ink);box-shadow:6px 7px 0 #26364A;padding:22px}
  h1{font:700 26px/1.1 'Newsreader';margin:0 0 6px}
  p.sub{font:600 12px/1.5 'DM Sans';color:#52627A;margin:0 0 18px}
  label{display:block;font:800 10px 'DM Sans';letter-spacing:.08em;text-transform:uppercase;color:#52627A;margin:0 0 6px}
  input{width:100%;min-height:46px;border:2.5px solid var(--ink);padding:10px 12px;font:700 14px 'DM Sans';outline:none;background:#fff}
  input:focus{box-shadow:3px 3px 0 var(--blue)}
  .f{margin-bottom:14px}
  button{width:100%;min-height:48px;border:3px solid var(--ink);background:var(--blue);color:#fff;font:900 14px 'DM Sans';cursor:pointer;box-shadow:3px 4px 0 #26364A}
  button.y{background:var(--yellow);color:var(--ink)}
  button:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
  .step{display:none}.step.on{display:block}
  .msg{font:700 12px/1.5 'DM Sans';padding:9px 11px;border:2px solid var(--ink);margin-bottom:12px;display:none}
  .msg.ok{background:#DCFCE7;border-color:#059669;color:#065F46;display:block}
  .msg.err{background:#FEE2E2;border-color:#991B1B;color:#991B1B;display:block}
  .hint{font:600 11px/1.5 'DM Sans';color:#64748B;margin:8px 0 0}
  a{color:var(--blue);font-weight:800}
  .cf-turnstile{margin:4px 0 12px}
</style></head>
<body>
<div class="card">
  <h1>Atur Ulang Sandi</h1>
  <p class="sub">Kami kirim kode ke emailmu, lalu kamu tentukan sandi baru. Semua perangkat lain akan keluar otomatis.</p>
  <div class="msg" id="msg"></div>
  <div class="cf-turnstile" data-sitekey="${sk}" data-theme="light"></div>

  <div class="step on" id="s1">
    <div class="f"><label>Email akun</label><input id="email" type="email" inputmode="email" placeholder="nama@email.com" autocomplete="email"></div>
    <button id="b1" onclick="kirim()">Kirim kode</button>
  </div>

  <div class="step" id="s2">
    <div class="f"><label>Kode 6 angka</label><input id="otp" inputmode="numeric" maxlength="6" placeholder="••••••" style="letter-spacing:6px;text-align:center;font-size:22px"></div>
    <button id="b2" onclick="cek()">Verifikasi kode</button>
    <p class="hint">Tidak menerima kode? <a href="javascript:void(0)" onclick="ulang()">Kirim ulang</a></p>
  </div>

  <div class="step" id="s3">
    <div class="f"><label>Sandi baru</label><input id="pwd" type="password" placeholder="Minimal 8 karakter" autocomplete="new-password"></div>
    <div class="f"><label>Ulangi sandi baru</label><input id="pwd2" type="password" placeholder="Ketik ulang" autocomplete="new-password"></div>
    <button class="y" id="b3" onclick="simpan()">Simpan sandi baru</button>
    <p class="hint">Setelah tersimpan, kamu masuk ulang dengan sandi baru.</p>
  </div>

  <p class="hint" style="margin-top:16px;"><a href="/login">← Kembali ke halaman masuk</a></p>
</div>

<script>
var step = 1, email = '';
function el(i){return document.getElementById(i)}
function say(t, ok){ var m=el('msg'); m.className='msg '+(ok?'ok':'err'); m.textContent=t; }
function clearMsg(){ el('msg').className='msg'; }
function token(){
  var e=document.querySelector('[name="cf-turnstile-response"]');
  return e? e.value : '';
}
async function tungguToken(ms){
  var t0=Date.now();
  while(Date.now()-t0<ms){ if(token()) return token(); await new Promise(r=>setTimeout(r,200)); }
  return '';
}
function tampil(n){ step=n; [1,2,3].forEach(function(i){ el('s'+i).className='step'+(i===n?' on':'') }); clearMsg(); }

async function kirim(){
  email = el('email').value.trim();
  if(!email) return say('Email wajib diisi.', false);
  el('b1').disabled = true;
  try{
    var r = await fetch('/api/auth/reset/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,turnstile_token:token()})});
    var j = await r.json().catch(function(){return {}});
    if(!r.ok) throw new Error(j.error||'Gagal mengirim kode.');
    tampil(2); say(j.message||'Kode dikirim. Cek email (dan folder spam).', true);
    try{ if(window.turnstile) window.turnstile.reset(); }catch(e){}
  }catch(e){ say(e.message, false); try{ if(window.turnstile) window.turnstile.reset(); }catch(_){} }
  el('b1').disabled = false;
}

async function cek(){
  var kode = el('otp').value.trim();
  if(kode.length!==6) return say('Masukkan 6 angka.', false);
  el('b2').disabled = true;
  try{
    var t = token() || await tungguToken(12000);
    var r = await fetch('/api/auth/reset/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,otp:kode,turnstile_token:t})});
    var j = await r.json().catch(function(){return {}});
    if(!r.ok) throw new Error(j.error||'Kode salah atau kedaluwarsa.');
    tampil(3); say('Kode benar. Tentukan sandi baru.', true);
  }catch(e){ say(e.message,false); try{ if(window.turnstile) window.turnstile.reset(); }catch(_){} }
  el('b2').disabled = false;
}

async function simpan(){
  var a = el('pwd').value, b = el('pwd2').value;
  if(a.length < 8) return say('Sandi minimal 8 karakter.', false);
  if(a !== b) return say('Sandi tidak sama.', false);
  el('b3').disabled = true;
  try{
    var r = await fetch('/api/auth/reset/finish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:a})});
    var j = await r.json().catch(function(){return {}});
    if(!r.ok) throw new Error(j.error||'Gagal menyimpan sandi.');
    say('Sandi tersimpan. Mengalihkan ke halaman masuk…', true);
    setTimeout(function(){ location.href='/login'; }, 1500);
  }catch(e){ say(e.message,false); el('b3').disabled=false; }
}

function ulang(){ tampil(1); el('b1').disabled=false; }
</script>
</body></html>`;
}
