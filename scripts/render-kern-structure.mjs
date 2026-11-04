const { chromium } = await import('/home/ubuntu/.npm/_npx/d537ee5ee2a13f03/node_modules/playwright/index.mjs');
import { readFileSync } from 'node:fs';
const br=await chromium.launch();
for(const [n,w,h] of [['mobile',412,915],['desktop',1440,900]]){
 const p=await br.newPage({viewport:{width:w,height:h}});
 await p.goto('file:///tmp/main-merge/scripts/kern-feed-structure.html');
 await p.waitForTimeout(1800);
 await p.screenshot({path:`/tmp/kern-structure-${n}.png`,fullPage:true});
 console.log(n, await p.title(), await p.locator('.specimen').count());
 await p.close();
}
await br.close();