// Task 7 — driver race real-D1 (dipanggil tests/account-status-real-d1.sh).
// Murni HTTP konkuren; TIDAK meng-assert state DB (shell yang menghakimi via D1).
// argv: <base> <mode> <targetId|email> <n> <cookieOwner|cookieVictim> [slot...]
const [base, mode, target, nStr, cookie, extra] = process.argv.slice(2);
const n = Number(nStr);

const hits = async (paths, init) => Promise.all(paths.map(async (p) => {
  try {
    const r = await fetch(base + p, init(p));
    let body = '';
    try { body = (await r.json()).error || ''; } catch { body = (await r.text()).slice(0, 80); }
    return { status: r.status, setCookie: r.headers.get('set-cookie') || '', err: String(body) };
  } catch (e) { return { status: 0, setCookie: '', err: String(e) }; }
}));

if (mode === 'suspend' || mode === 'reinstate') {
  const act = mode === 'suspend' ? 'suspend' : 'reinstate';
  const out = await hits(Array.from({ length: n }, () => `/api/admin/users/${target}/${act}`), () => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie, Origin: base },
    body: JSON.stringify({ reason: `harness ${mode} race uji cukup panjang` }),
  }));
  console.log(JSON.stringify(out));
} else if (mode === 'login') {
  // extra = JSON {email, password, turnstile_token}
  const body = JSON.parse(extra);
  const out = await hits(Array.from({ length: n }, () => '/api/auth/login'), () => ({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
  console.log(JSON.stringify(out));
} else {
  throw new Error('mode tidak dikenal: ' + mode);
}
