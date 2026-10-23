// Tests for Nightlight Maker (run: node tools/test_maker.js). Needs Playwright + Chromium.
//  1. the editor opens without errors, and every command can be added through the picker
//  2. every command runs in the real game with the expected result (puzzles answered)
//  3. the sample game plays from New Game to its good ending (tools/walkthrough.js)
//  4. the one-file maker builds, exports a game, and the exported game plays to the ending
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const url = (f) => 'file://' + path.join(root, f);
let failed = 0;
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) failed++; };

(async () => {
  const b = await chromium.launch();
  // ---------------------------------------------------------------- 1. editor
  {
    const p = await b.newPage({ viewport: { width: 1440, height: 860 } });
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(url('maker/index.html'));
    await p.waitForFunction(() => window.ED && window.ED.P);
    await p.evaluate(() => { localStorage.removeItem('nightlight_project'); ED.load(NL.sample()); ED.st.mode = 'objects'; ED.st.sel = { k: 'obj', id: 'desk' }; ED.refresh(); ED.editEvent(ED.obj('desk'), 'on'); });
    const types = await p.evaluate(() => Object.keys(NL.CMDS));
    const before = await p.evaluate(() => ED.obj('desk').on.length);
    for (const t of types) {
      await p.locator('.cmds > .cl.slot').last().click();
      await p.keyboard.press('Enter');
      const label = await p.evaluate((x) => NL.CMDS[x].label, t);
      await p.locator('.picker button', { hasText: label }).first().click();
    }
    const after = await p.evaluate(() => ED.obj('desk').on.length);
    ok(after - before === types.length, 'editor: all ' + types.length + ' commands added through the picker');
    await p.keyboard.press('Escape');
    // undo removes the last command
    await p.keyboard.press('Control+z');
    ok((await p.evaluate(() => ED.obj('desk').on.length)) === after - 1, 'editor: undo');
    // views render
    for (const v of ['db', 'game', 'map']) await p.evaluate((x) => { ED.st.view = x; ED.refresh(); }, v);
    for (const c of ['items', 'speakers', 'endings', 'deaths', 'chases', 'common', 'recipes', 'images']) await p.evaluate((x) => { ED.st.view = 'db'; ED.st.dbCat = x; ED.st.dbSel = null; ED.refresh(); }, c);
    ok(errs.length === 0, 'editor: no errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
    await p.close();
  }
  // ---------------------------------------------------------------- 2. runtime commands
  {
    const p = await b.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(url('maker/play.html') + '?dev=1');
    await p.waitForFunction(() => window.__G && window.__G.dev);
    await p.evaluate(() => {
      const G = window.__G;
      G.TEST = true; G.dev.paused = true;
      const P = window.NL.sample();
      P.items.coin = { name: 'Coin', desc: '' };
      P.common.ping = { list: [{ c: 'set', k: 'pinged' }] };
      P.maps.kitchen.objects.push({ id: 'box', x: 8, y: 3, sprite: 'crate' });
      G.MAKER.apply(P, {});
      G.dev.start({ map: 'kitchen', x: 4, y: 5, dir: 'down' });
      G.dev.settle();
      G.EV.run(G.MAKER.compile([
        { c: 'say', who: 'ren', face: 'scared', text: 'Hello {n}\nSecond box' }, { c: 'set', k: 'n', v: '3' }, { c: 'add', k: 'n', n: 2 }, { c: 'random', k: 'r', n: 3 },
        { c: 'if', cond: [{ t: 'count', k: 'n', op: '==', n: 5 }], then: [{ c: 'set', k: 'ifok' }], else: [{ c: 'set', k: 'ifbad' }] },
        { c: 'choice', text: 'Pick', options: ['A', 'B'], branches: [[{ c: 'set', k: 'pickedA' }], [{ c: 'set', k: 'pickedB' }]] },
        { c: 'give', item: 'coin' }, { c: 'take', item: 'coin' }, { c: 'give', item: 'diary', silent: true }, { c: 'note', item: 'diary' },
        { c: 'picture', sprite: 'pic_peephole', caption: 'x' }, { c: 'glimpse', sprite: 'pic_peephole' }, { c: 'chapter', text: 'Ch' }, { c: 'goal', text: 'Goal!' },
        { c: 'location', text: 'Loc' }, { c: 'bubble', kind: '!' }, { c: 'wait', s: 0.2 }, { c: 'call', id: 'ping' }, { c: 'script', code: 'E.set("scripted", 7); yield* E.wait(0.1);' },
        { c: 'walk', path: 'R1 D1' }, { c: 'move', id: 'box', path: 'L1' }, { c: 'face', dir: 'up' }, { c: 'place', id: 'box', x: 9, y: 4 }, { c: 'hide', id: 'box' }, { c: 'show', id: 'box' },
        { c: 'sprite', id: 'box', sprite: 'barrel' }, { c: 'npc', id: 'n1', char: 'shota', x: 3, y: 6 }, { c: 'despawn', id: 'n1' }, { c: 'follower', char: 'tama' }, { c: 'follower' },
        { c: 'playerchar', char: 'shota' }, { c: 'playerchar' }, { c: 'fadeout', t: 0.1 }, { c: 'fadein', t: 0.1 }, { c: 'flash' }, { c: 'tint', color: '#300010' }, { c: 'tint' },
        { c: 'shake' }, { c: 'dark', v: 0.4 }, { c: 'flicker', n: 1 }, { c: 'light', r: 90 }, { c: 'sfx', name: 'knock' }, { c: 'music', name: 'dread' }, { c: 'ambience', name: 'rain' },
        { c: 'code', answer: '12', len: 2, ok: [{ c: 'set', k: 'codeok' }], fail: [] }, { c: 'piano', answer: 'E G A', ok: [{ c: 'set', k: 'pianook' }], fail: [] },
        { c: 'order', items: 'a\nb\nc', answer: '2 3 1', ok: [{ c: 'set', k: 'orderok' }], fail: [] }, { c: 'clock', h: 3, m: 15, ok: [{ c: 'set', k: 'clockok' }], fail: [] },
        { c: 'give', item: 'coin' }, { c: 'useitem', item: 'coin', consume: true, ok: [{ c: 'set', k: 'useok' }], fail: [] },
        { c: 'checkpoint' }, { c: 'comment', text: 'x' }, { c: 'stop' }, { c: 'set', k: 'afterstop' },
      ]));
    });
    const answers = { code: '12', piano: ['E', 'G', 'A'], order: [1, 2, 0], clock: { h: 3, m: 15 }, pickItem: 'coin' };
    for (let i = 0; i < 20; i++) {
      const s = await p.evaluate(() => window.__G.dev.settle([0]));
      if (s.puzzle) { await p.evaluate((v) => { const G = window.__G; G.UI.stack[G.UI.stack.length - 1]._done(v); }, answers[s.puzzle]); continue; }
      break;
    }
    const F = await p.evaluate(() => { const G = window.__G, f = G.S.flags, o = G.EX.room.obj('box'); return { f: f, items: G.S.items, box: [o.x, o.y, o.visible, o.sprite] }; });
    const want = ['ifok', 'pickedA', 'pinged', 'codeok', 'pianook', 'orderok', 'clockok', 'useok'];
    ok(want.every((k) => F.f[k]) && F.f.n === 5 && F.f.scripted === 7 && !F.f.afterstop && !F.f.ifbad, 'runtime: flags, branches, puzzles, scripts, stop');
    ok(JSON.stringify(F.items) === '["diary"]' && JSON.stringify(F.box) === '[9,4,true,"barrel"]', 'runtime: items and object commands');
    const chase = await p.evaluate(() => { const G = window.__G; G.EV.run(G.MAKER.compile([{ c: 'chase', id: 'shadow' }])); G.dev.settle(); const on = !!G.Chase.active; G.EV.run(G.MAKER.compile([{ c: 'endchase' }])); G.dev.settle(); return on && !G.Chase.active; });
    ok(chase, 'runtime: chase starts and ends');
    const die = await p.evaluate(() => { const G = window.__G; G.EV.run(G.MAKER.compile([{ c: 'die', cause: 'caught' }])); return G.dev.settle().gameover; });
    ok(die, 'runtime: game over');
    ok(errs.length === 0, 'runtime: no errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
    await p.close();
  }
  // ---------------------------------------------------------------- 3 + 4. sample route, one-file build, export
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nlmaker-'));
  const run = (args) => { try { return execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', env: process.env }); } catch (e) { return String(e.stdout || '') + String(e.stderr || ''); } };
  const r1 = run(['tools/walkthrough.js', 'sample', '--page', 'maker/play.html']);
  ok(/^PASS/m.test(r1), 'sample game: New Game to the good ending' + (/^PASS/m.test(r1) ? '' : '\n' + r1.split('\n').filter((l) => /FAIL|step/.test(l)).join('\n')));
  ok(/wrote/.test(run(['tools/build_maker.js'])), 'one-file maker builds');
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
    const p = await ctx.newPage();
    await p.goto(url('dist/nightlight-maker.html'));
    await p.waitForFunction(() => window.ED && window.ED.P);
    await p.evaluate(() => ED.load(NL.sample()));
    const route = await p.evaluate(() => NL.ROUTES.sample);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => ED.exportGame())]);
    const game = path.join(tmp, 'exported.html');
    await dl.saveAs(game);
    fs.writeFileSync(path.join(tmp, 'route.json'), JSON.stringify(route));
    await ctx.close();
    const r2 = run(['tools/walkthrough.js', 'x', '--page', game, '--route-file', path.join(tmp, 'route.json')]);
    ok(/^PASS/m.test(r2), 'exported game plays to the ending on its own');
  }
  await b.close();
  console.log(failed ? failed + ' failed' : 'all passed');
  process.exit(failed ? 1 : 0);
})();
