// Plays the game in Chromium following a scripted route and checks that every step is possible
// (no softlocks, no missing paths, no deaths, no console errors). The game loop is paused and
// stepped frame by frame, so runs are fast and deterministic.
//
// Usage: node tools/walkthrough.js [routeName] [--shots dir] [--verbose]
// Routes live in G.WALKTHROUGH (js/content/*.js): G.WALKTHROUGH[name] = [steps] or () => [steps].
// Steps:
//   {start: {map, x, y, dir, items, flags, notes}}   (first step only) begin from this state
//                              instead of New Game, to test one chapter on its own
//   {use: 'objId'}             check a path to the object, stand next to it, press Z
//   {door: 'objId'}            same as use, for doors and floor exits
//   {walkTo: [x, y]}           check a path to tile x,y and stand there (touch triggers fire)
//   {answer: value}            answer the open puzzle screen (code string, piano array, true, {h,m}, order array)
//   {pick: 'itemId'}           answer an item picker
//   {item: 'id'}               use an item from the inventory (runs its use event)
//   {choose: n | [n, ...]}     on any step: options picked in the choice boxes it opens, in order (default 0)
//   {wait: seconds}            let time pass (game time)
//   {escape: [target, ...], latch: bool, max: s}
//                              a chase is on: a bot WALKS the route (door ids, {hide: id},
//                              {tile: [x, y]}, {wait: s}) and must survive until the chase ends
//   {chase: 'end'}             end an active chase (use only where escape is tested elsewhere)
//   {expect: {map, has: [...], flags: [...], not: [...], ending, goal}}
//   {note: 'text'}             comment
//   {shot: 'name'}             screenshot (with --shots dir)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const args = process.argv.slice(2);
  const route = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--shots') || 'main';
  const shotDir = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : null;
  const verbose = args.includes('--verbose');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 832, height: 480 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../index.html') + '?dev=1');
  await p.waitForTimeout(300);
  await p.evaluate(() => { window.__G.TEST = true; window.__G.dev.paused = true; });
  const steps = await p.evaluate((r) => { const R = (window.__G.WALKTHROUGH || {})[r]; return typeof R === 'function' ? R() : R || null; }, route);
  if (!steps) { console.log('no route', route); process.exit(1); }
  if (steps[0] && steps[0].start) {
    const r = await p.evaluate((cfg) => { try { window.__G.dev.start(cfg); return 'ok'; } catch (e) { return String(e); } }, steps[0].start);
    if (r !== 'ok') { console.log('FAIL: start: ' + r); process.exit(1); }
    steps.shift();
  } else await p.evaluate(() => { const G = window.__G; G.dev.step(1); G.setScene(G.newGame()); });
  const settle = (picks) => p.evaluate((pk) => window.__G.dev.settle(pk), picks === undefined ? null : picks);
  let fail = null;
  let st = await settle();
  for (let i = 0; i < steps.length && !fail; i++) {
    const s = steps[i];
    const where = () => p.evaluate(() => window.__G.S.map);
    if (verbose) console.log(i, JSON.stringify(s));
    if (st.gameover) { fail = 'game over before step ' + i; break; }
    if (st.stuck) { fail = 'stuck before step ' + i; break; }
    if (s.use || s.door) {
      const id = s.use || s.door;
      const ok = await p.evaluate((id) => {
        const G = window.__G;
        if (!G.EX || !G.EX.room.obj(id)) return 'missing object ' + id + ' in ' + G.S.map;
        if (!G.EX.room.obj(id).visible) return 'object hidden: ' + id + ' in ' + G.S.map;
        if (!G.dev.reachable(id)) return 'no path to ' + id + ' in ' + G.S.map;
        const r = G.dev.face(id);
        if (typeof r === 'string') return r + ' (' + id + ')';
        G.press('ok');
        return 'ok';
      }, id);
      if (ok !== 'ok') { fail = 'step ' + i + ': ' + ok; break; }
      st = await settle(s.choose);
    }
    if (s.walkTo) {
      const r = await p.evaluate((xy) => { const G = window.__G; const r = G.dev.walkTo(xy[0], xy[1]); G.dev.step(2); return r; }, s.walkTo);
      if (r !== 'ok') { fail = 'step ' + i + ': ' + r + ' in ' + (await where()); break; }
      st = await settle(s.choose);
    }
    if (s.item) {
      const r = await p.evaluate((id) => { const G = window.__G; if (!G.S.items.includes(id)) return 'item not held: ' + id; const it = G.ITEMS[id]; if (it && it.use) G.EV.run(it.use); return 'ok'; }, s.item);
      if (r !== 'ok') { fail = 'step ' + i + ': ' + r; break; }
      st = await settle(s.choose);
    }
    if (s.answer !== undefined || s.pick !== undefined) {
      const v = s.answer !== undefined ? s.answer : s.pick;
      const r = await p.evaluate((v) => { const G = window.__G; const top = G.UI.stack[G.UI.stack.length - 1]; if (!top || !top._done) return 'no puzzle open'; top._done(v); return 'ok'; }, v);
      if (r !== 'ok') { fail = 'step ' + i + ': ' + r + ' in ' + (await where()); break; }
      st = await settle(s.choose);
    }
    if (s.escape) {
      const r = await p.evaluate((s) => window.__G.dev.escape(s.escape, { latch: s.latch, max: s.max, until: s.until }), s);
      if (verbose || !r.ok) console.log('  escape log:\n   ' + r.log.join('\n   '));
      if (!r.ok) { fail = 'step ' + i + ': escape failed: ' + (r.caught ? 'caught' : r.err) + ' after ' + r.t.toFixed(1) + 's in ' + (await where()); break; }
      st = await settle(s.choose);
    }
    if (s.chase === 'end') { await p.evaluate(() => { const G = window.__G; if (G.Chase.active) G.Chase.stop(); G.Chase.walkers = []; }); st = await settle(); }
    if (s.wait) { await p.evaluate((t) => window.__G.dev.step(Math.round(t * 60)), s.wait); st = await settle(s.choose); }
    if (s.choose !== undefined && !(s.use || s.door || s.walkTo || s.item || s.answer !== undefined || s.pick !== undefined || s.escape || s.wait)) st = await settle(s.choose);
    if (st.gameover) { fail = 'died at step ' + i + ' ' + JSON.stringify(s) + ' in ' + (await where()); break; }
    if (st.stuck) { fail = 'stuck after step ' + i + ' ' + JSON.stringify(s); break; }
    if (s.expect) {
      const r = await p.evaluate((e) => {
        const G = window.__G, out = [];
        if (e.map && G.S.map !== e.map) out.push('map is ' + G.S.map + ' not ' + e.map);
        for (const h of e.has || []) if (!G.S.items.includes(h)) out.push('missing item ' + h);
        for (const f of e.flags || []) if (!G.S.flags[f]) out.push('missing flag ' + f);
        for (const f of e.not || []) if (G.S.items.includes(f) || G.S.flags[f]) out.push('should not have ' + f);
        if (e.ending && G.S.ending !== e.ending) out.push('ending is ' + G.S.ending);
        if (e.goal && G.S.flags['@goalId'] !== e.goal) out.push('goal is ' + G.S.flags['@goalId']);
        if (e.notes !== undefined && G.S.notes.filter((n) => n.indexOf('letter_') === 0).length !== e.notes) out.push('letters ' + G.S.notes.filter((n) => n.indexOf('letter_') === 0).length);
        return out;
      }, s.expect);
      if (r.length) { fail = 'step ' + i + ' expect: ' + r.join('; '); break; }
    }
    if (shotDir && (s.shot || i % 15 === 0)) {
      await p.evaluate(() => { const G = window.__G; G.dev.paused = false; });
      await p.waitForTimeout(60);
      await p.screenshot({ path: path.join(shotDir, 'wt_' + String(i).padStart(3, '0') + (s.shot ? '_' + s.shot : '') + '.png') });
      await p.evaluate(() => { window.__G.dev.paused = true; });
    }
  }
  const end = await p.evaluate(() => { const G = window.__G; return { map: G.S.map, ending: G.S.ending, time: Math.round(G.S.time), deaths: G.S.deaths, items: G.S.items, letters: G.S.notes.filter((n) => n.indexOf('letter_') === 0).length, missingArt: Object.keys(G.missingArt || {}) }; });
  console.log(fail ? 'FAIL: ' + fail : 'PASS (' + steps.length + ' steps)', JSON.stringify(end));
  if (errs.length) console.log('ERRORS:\n' + errs.slice(0, 20).join('\n'));
  await b.close();
  process.exit(fail || errs.length ? 1 : 0);
})();
