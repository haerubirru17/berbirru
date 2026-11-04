const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');
const br = await chromium.launch();
for (const [n, f] of [['profil','kern-pg-profil'], ['notif','kern-pg-notif'], ['pasar','kern-pg-pasar']]) {
  const p = await br.newPage({ viewport: { width: 412, height: 915 } });
  await p.goto('file:///tmp/main-merge/scripts/' + f + '.html');
  await p.waitForTimeout(1800);
  console.log(n, { posts: await p.locator('.post').count(), title: (await p.title()).slice(0, 30) });
  await p.screenshot({ path: `/tmp/kern-pg-${n}.png`, fullPage: true });
  await p.close();
}
await br.close();