// Plays the game from New Game to an ending in Chromium, following a script
// of steps, and checks that every step is possible (no softlocks).
//
// Usage: node tools/walkthrough.js [routeName] [--shots dir]
// Routes live in js/content/walkthrough.js as G.WALKTHROUGH = { name: [steps] }.
// Steps:
//   {use: 'objId'}             walk next to object (path must exist) and press Z
//   {door: 'objId'}            same as use, for doors and floor exits
//   {answer: value}            answer the open puzzle screen (code string, piano array, true, {h,m}, order array)
//   {choose: n}                pick option n in the next choice box (default 0)
//   {item: 'id'}               use an item from the inventory (runs its use event)
//   {pick: 'id'}               answer an item picker with this item
//   {wait: seconds}
//   {expect: {map, has:[...], flags:[...], not:[...]}}
//   {chase: 'end'}             end an active chase (survival is tested separately)
//   {note: 'text'}             comment
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const route = process.argv[2] || 'main';
  const shotDir = process.argv.includes('--shots') ? process.argv[process.argv.indexOf('--shots') + 1] : null;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 832, height: 480 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../index.html') + '?dev=1');
  await p.waitForTimeout(300);
  const steps = await p.evaluate((r) => (window.__G.WALKTHROUGH || {})[r] || null, route);
  if (!steps) { console.log('no route', route); process.exit(1); }
  // start a new game directly
  await p.evaluate(() => { const G = window.__G; G.setScene(G.newGame()); });
  const settle = async (choose) => {
    // advance dialogue until nothing is running; answer choices with `choose`
    for (let i = 0; i < 400; i++) {
      const st = await p.evaluate(() => { const G = window.__G; const top = G.UI.stack[G.UI.stack.length - 1]; return { busy: G.EV.busy, dlg: G.Dialog.active, choice: !!(G.Dialog.choice), ui: G.UI.active, kind: top && top.kind, hidden: G.EX && G.EX.p.hidden, chasing: !!G.Chase.active, scene: G.getScene() && G.getScene().constructor && G.getScene() === G.EX }; });
      if (st.ui && st.kind) return st; // puzzle waiting for an answer
      if (st.choice) {
        const n = choose === undefined ? 0 : choose;
        await p.evaluate((n) => { const G = window.__G; G.Dialog.chars = G.Dialog.total; G.Dialog.choice.sel = n; G.press('ok'); }, n);
        choose = undefined;
        await p.waitForTimeout(40);
        continue;
      }
      if (st.dlg) { await p.evaluate(() => { const G = window.__G; G.Dialog.chars = G.Dialog.total; G.press('ok'); }); await p.waitForTimeout(30); continue; }
      if (st.ui && !st.kind) { await p.evaluate(() => window.__G.press('ok')); await p.waitForTimeout(60); continue; }
      if (st.busy) { await p.waitForTimeout(50); continue; }
      return st;
    }
    return { stuck: true };
  };
  let fail = null;
  for (let i = 0; i < steps.length && !fail; i++) {
    const s = steps[i];
    let st = await settle(s.choose);
    if (st.stuck) { fail = 'stuck before step ' + i; break; }
    if (s.use || s.door) {
      const id = s.use || s.door;
      const ok = await p.evaluate((id) => { const G = window.__G; if (!G.EX || !G.EX.room.obj(id)) return 'missing object ' + id + ' in ' + G.S.map; if (!G.EX.room.obj(id).visible) return 'object hidden: ' + id; if (!G.dev.reachable(id)) return 'no path to ' + id + ' in ' + G.S.map; G.dev.use(id); return 'ok'; }, id);
      if (ok !== 'ok') { fail = 'step ' + i + ': ' + ok; break; }
      await p.waitForTimeout(80);
      st = await settle(s.choose);
    }
    if (s.item) { await p.evaluate((id) => { const G = window.__G; const it = G.ITEMS[id]; if (it && it.use) G.EV.run(it.use); }, s.item); await p.waitForTimeout(60); st = await settle(s.choose); }
    if (s.answer !== undefined || s.pick !== undefined) {
      const v = s.answer !== undefined ? s.answer : s.pick;
      const r = await p.evaluate((v) => { const G = window.__G; const top = G.UI.stack[G.UI.stack.length - 1]; if (!top || !top._done) return 'no puzzle open'; top._done(v); return 'ok'; }, v);
      if (r !== 'ok') { fail = 'step ' + i + ': ' + r; break; }
      await p.waitForTimeout(60);
      st = await settle(s.choose);
    }
    if (s.chase === 'end') { await p.evaluate(() => { const G = window.__G; if (G.Chase.active) G.Chase.stop(); }); await p.waitForTimeout(60); st = await settle(); }
    if (s.wait) { await p.waitForTimeout(s.wait * 1000); st = await settle(s.choose); }
    if (s.expect) {
      const r = await p.evaluate((e) => {
        const G = window.__G, out = [];
        if (e.map && G.S.map !== e.map) out.push('map is ' + G.S.map + ' not ' + e.map);
        for (const h of e.has || []) if (!G.S.items.includes(h)) out.push('missing item ' + h);
        for (const f of e.flags || []) if (!G.S.flags[f]) out.push('missing flag ' + f);
        for (const f of e.not || []) if (G.S.items.includes(f) || G.S.flags[f]) out.push('should not have ' + f);
        if (e.ending && G.S.ending !== e.ending) out.push('ending is ' + G.S.ending);
        return out;
      }, s.expect);
      if (r.length) { fail = 'step ' + i + ' expect: ' + r.join('; '); break; }
    }
    // a death means the route is wrong
    const dead = await p.evaluate(() => { const G = window.__G; const top = G.UI.stack[0]; return !!(top && G.UI.stack.length && G.S.deaths > 0); });
    if (dead) { fail = 'died at step ' + i; break; }
    if (shotDir && (s.shot || i % 10 === 0)) await p.screenshot({ path: path.join(shotDir, 'wt_' + String(i).padStart(3, '0') + '.png') });
  }
  const end = await p.evaluate(() => ({ map: window.__G.S.map, ending: window.__G.S.ending, time: window.__G.S.time, items: window.__G.S.items }));
  console.log(fail ? 'FAIL: ' + fail : 'PASS (' + steps.length + ' steps)', JSON.stringify(end));
  if (errs.length) console.log('ERRORS:\n' + errs.slice(0, 20).join('\n'));
  await b.close();
  process.exit(fail || errs.length ? 1 : 0);
})();
