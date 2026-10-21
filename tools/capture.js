// Scripted screenshots: node tools/capture.js <url> <outPrefix> <steps...>
// steps: w<ms> wait, k<Key> press key, h<Key>:<ms> hold key, s<name> screenshot, e<js> eval
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [, , target, prefix, ...steps] = process.argv;
  const url = /^https?:|^file:/.test(target) ? target : 'file://' + path.resolve(target);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 832, height: 480 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(url);
  await p.waitForTimeout(300);
  for (const s of steps) {
    const a = s[0], v = s.slice(1);
    if (a === 'w') await p.waitForTimeout(+v);
    else if (a === 'k') { await p.keyboard.down(v); await p.waitForTimeout(40); await p.keyboard.up(v); }
    else if (a === 'h') { const [key, ms] = v.split(':'); await p.keyboard.down(key); await p.waitForTimeout(+ms); await p.keyboard.up(key); }
    else if (a === 's') await p.screenshot({ path: prefix + v + '.png' });
    else if (a === 'e') { const r = await p.evaluate(v); if (r !== undefined) console.log('eval', JSON.stringify(r)); }
  }
  await b.close();
  if (errs.length) console.log(errs.join('\n'));
  console.log('done');
})();
