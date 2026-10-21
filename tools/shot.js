// Usage: node tools/shot.js <url-or-file> <out.png> [width] [height] [waitMs] [js-to-eval]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [, , target, out, w, h, wait, evalJs] = process.argv;
  const url = /^https?:|^file:/.test(target) ? target : 'file://' + path.resolve(target);
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: +(w || 1280), height: +(h || 800) } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  await p.goto(url);
  await p.waitForTimeout(+(wait || 300));
  if (evalJs) { const r = await p.evaluate(evalJs); if (r !== undefined) console.log('eval:', JSON.stringify(r)); }
  await p.waitForTimeout(100);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
  if (errs.length) console.log(errs.join('\n'));
  console.log('saved', out);
})();
