// Nightlight Maker editor: the Database (items, speakers, endings, game over texts, chases,
// common events, combine recipes, imported images) and the Game settings page.
(function () {
  'use strict';
  const G = window.G, NL = window.NL, ED = window.ED, h = ED.h;
  const st = ED.st, F = ED.field;
  const CATS = [
    ['items', 'Items', 'Things the player carries. Readable notes have pages.'],
    ['speakers', 'Speakers', 'Who talks: name, color, portrait and voice.'],
    ['endings', 'Endings', 'Each ending has a title card and a few lines of text.'],
    ['deaths', 'Game over texts', 'What the game over screen says for each cause.'],
    ['chases', 'Chases', 'Something that hunts the player through the rooms.'],
    ['common', 'Common events', 'Command lists you can run from anywhere with "Run common event".'],
    ['recipes', 'Combine', 'Two items that become one when the player holds both.'],
    ['images', 'Images', 'Your own pixel art: sprites, character sheets, portraits, a title picture.'],
  ];
  const coll = (cat) => {
    const P = ED.P;
    if (cat === 'recipes') return (P.recipes = P.recipes || []);
    if (cat === 'images') { P.assets = P.assets || {}; return (P.assets.images = P.assets.images || {}); }
    return (P[cat] = P[cat] || {});
  };

  // ---------------------------------------------------------------- left list
  ED.dbList = function (box) {
    const cats = h('div.list');
    for (const [k, label] of CATS) {
      const n = Array.isArray(coll(k)) ? coll(k).length : Object.keys(coll(k)).length;
      cats.appendChild(h('div.row' + (st.dbCat === k ? '.on' : ''), { on: { click: () => { st.dbCat = k; st.dbSel = null; ED.refresh('left', 'db'); } } }, h('span', label), h('span.id', String(n))));
    }
    box.appendChild(h('div.sec', h('h3', 'Database'), cats));
    const c = coll(st.dbCat), list = h('div.list');
    const keys = Array.isArray(c) ? c.map((_, i) => String(i)) : Object.keys(c);
    if (st.dbSel === null && keys.length) st.dbSel = keys[0];
    for (const k of keys) {
      const v = c[k];
      const label = st.dbCat === 'recipes' ? (v.a || '?') + ' + ' + (v.b || '?') : (v && (v.name || v.title)) || k;
      list.appendChild(h('div.row' + (st.dbSel === k ? '.on' : ''), { on: { click: () => { st.dbSel = k; ED.refresh('left', 'db'); } } },
        st.dbCat === 'items' && v.icon ? ED.thumb(v.icon, 16) : null, h('span', label), Array.isArray(c) ? null : h('span.id', k)));
    }
    const title = (CATS.find((x) => x[0] === st.dbCat) || [])[1];
    box.appendChild(h('div.sec', h('h3', h('span.grow', title), h('button.small', { type: 'button', on: { click: addEntry } }, st.dbCat === 'images' ? 'Import' : 'New')), list));
  };
  async function addEntry() {
    const cat = st.dbCat, c = coll(cat);
    if (cat === 'images') return ED.importImage();
    if (cat === 'recipes') { c.push({ a: '', b: '', gives: '', text: 'They fit together.' }); st.dbSel = String(c.length - 1); ED.commit(); ED.lists(); return ED.refresh('left', 'db'); }
    const name = await ED.prompt('New ' + ({ items: 'item', speakers: 'speaker', endings: 'ending', deaths: 'game over cause', chases: 'chase', common: 'common event' }[cat]), '', 'Name');
    if (!name) return;
    const id = ED.uniq(ED.slug(name), c);
    c[id] = {
      items: { name: name, desc: '' },
      speakers: { name: name, color: '#c8c0d0' },
      endings: { title: name.toUpperCase(), subtitle: '', lines: '', color: '#c8c0d0', music: 'ending' },
      deaths: name,
      chases: { char: 'caretaker', at: 'behind', speed: 54, delay: 1, follow: true, timer: 15, loseAfterHide: 5.5, cause: Object.keys(ED.P.deaths || {})[0] || 'caught', safe: [] },
      common: { name: name, list: [] },
    }[cat];
    st.dbSel = id;
    ED.commit(); ED.lists(); ED.refresh('left', 'db');
  }

  // ---------------------------------------------------------------- forms
  ED.views.db = function () {
    const v = ED.$('#dbView');
    if (st.view !== 'db') return;
    ED.clear(v);
    const [, label, lede] = CATS.find((x) => x[0] === st.dbCat);
    const c = coll(st.dbCat), k = st.dbSel;
    const body = h('div', { style: { padding: '16px 20px 40px', overflow: 'auto', height: '100%' } }, h('h2', label), h('p.lede', lede));
    v.appendChild(body);
    if (k === null || c[k] === undefined) { body.appendChild(h('p.hint', 'Nothing here yet. Press ' + (st.dbCat === 'images' ? 'Import' : 'New') + ' on the left.')); return; }
    const e = c[k];
    const idRow = () => h('label.f.full', h('span', 'Id (used by commands)'), h('div.pair', h('input.mono', { type: 'text', value: k, readOnly: true }), h('button.small', { type: 'button', on: { click: () => rename(st.dbCat, k) } }, 'Change'), h('button.small.danger', { type: 'button', on: { click: () => remove(st.dbCat, k) } }, 'Delete')));
    const re = ['left'];
    const form = h('div.form');
    body.appendChild(form);
    switch (st.dbCat) {
      case 'items':
        form.append(idRow(), F(e, 'name', 'text', 'Name', { refresh: re }), F(e, 'icon', 'sprite', 'Icon (16x16 sprite)', { refresh: re, def: 'icon_' + k }),
          F(e, 'desc', 'textarea', 'Description', { rows: 2 }),
          F(e, 'note', 'check', 'Readable (opens like a letter)', { full: true, refresh: ['db'] }));
        if (e.note) form.append(F(e, 'pages', 'textarea', 'Pages. A line with --- starts a new page.', { rows: 8 }));
        form.append(h('div.f.full', h('span', 'Using it from the menu'), ED.evButton('When used from the menu', e.use, () => { e.use = e.use || []; ED.editList(e.use, e.name + ': When used', () => { if (!e.use.length) delete e.use; ED.commit(); ED.refresh('db'); }); })));
        break;
      case 'speakers': {
        const pv = h('canvas', { width: 42, height: 42, style: { width: '84px', height: '84px', imageRendering: 'pixelated', background: 'var(--raise)', borderRadius: '4px' } });
        const draw = () => { const x = pv.getContext('2d'); x.clearRect(0, 0, 42, 42); const p = e.portrait && G.PORTRAITS[e.portrait]; if (p) { try { const cnv = p(); if (cnv) x.drawImage(cnv, 0, 0); } catch (er) { /* bad portrait */ } } };
        draw();
        form.append(idRow(), F(e, 'name', 'text', 'Name shown', { refresh: re }), F(e, 'color', 'color', 'Name color', { def: '#c8c0d0' }),
          F(e, 'portrait', 'portrait', 'Portrait', { def: '(none)', onChange: draw }), h('div.f', h('span', 'Preview'), pv),
          F(e, 'blip', 'number', 'Voice pitch (Hz)', { def: 520 }), F(e, 'wave', 'select', 'Voice', { options: [['', 'square'], ['sine', 'soft'], ['triangle', 'round'], ['sawtooth', 'harsh']] }),
          F(e, 'speed', 'number', 'Letters per second', { def: 40 }), F(e, 'textColor', 'color', 'Text color', { def: '#e8e2d6' }));
        break;
      }
      case 'endings':
        form.append(idRow(), F(e, 'title', 'text', 'Title card', { refresh: re }), F(e, 'subtitle', 'text', 'Under the title', { def: 'Ending 1 of 3 - good' }),
          F(e, 'lines', 'textarea', 'Text (one line each)', { rows: 6 }), F(e, 'color', 'color', 'Color', { def: '#c8c0d0' }), F(e, 'music', 'music', 'Music', { def: 'ending' }),
          F(e, 'hint', 'text', 'Hint shown afterwards', { full: true }), F(e, 'retry', 'check', 'Bad ending: offer to go back and try again', { full: true }));
        break;
      case 'deaths':
        form.append(idRow(), h('label.f.full', h('span', 'Game over text'), (() => { const t = h('textarea', { rows: 3 }); t.value = e; t.addEventListener('input', () => { c[k] = t.value; ED.commitSoon(); }); t.addEventListener('change', ED.commit); return t; })()),
          h('p.hint.f.full', 'Use this cause in "Game over" commands and in chases. The title of the game over screen is set on the Game page.'));
        break;
      case 'chases':
        form.append(idRow(), F(e, 'char', 'char', 'Who chases', { def: 'caretaker' }),
          F(e, 'at', 'select', 'Appears', { options: [['behind', 'just behind the player'], ['xy', 'at a spot (X, Y)']], refresh: ['db'] }));
        if (e.at === 'xy') form.append(F(e, 'x', 'number', 'X'), F(e, 'y', 'number', 'Y'));
        form.append(F(e, 'speed', 'number', 'Speed (player walks 62)', { def: 54 }), F(e, 'delay', 'number', 'Seconds before he moves', { def: 1 }),
          F(e, 'follow', 'check', 'Follows through doors'), F(e, 'followDelay', 'number', 'Seconds behind you at doors', { def: 1.6 }),
          F(e, 'timer', 'number', 'Gives up after (s), at the next door', { def: 'never' }), F(e, 'duration', 'number', 'Ends after (s) no matter what', { def: 'never' }),
          F(e, 'loseAfterHide', 'number', 'Seconds hidden until he leaves', { def: 5.5 }), F(e, 'cause', 'death', 'Game over cause', { def: 'caught' }),
          F(e, 'safe', 'list', 'Safe rooms (he will not follow into these; one room id per line)', { rows: 2 }), F(e, 'music', 'music', 'Music', { def: 'hunt' }),
          h('div.f.full', h('span', 'When it ends'), ED.evButton('When the chase ends', e.onEnd, () => { e.onEnd = e.onEnd || []; ED.editList(e.onEnd, 'Chase ' + k + ': When it ends', () => { ED.commit(); ED.refresh('db'); }); })),
          h('p.hint.f.full', 'Start it with the "Start a chase" command. The player cannot run while hunted; hiding spots and chained doors help. A fair chase: speed 50-60 and a few tiles of head start.'));
        break;
      case 'common':
        form.append(idRow(), F(e, 'name', 'text', 'Name', { refresh: re }),
          h('div.f.full', h('span', 'Commands'), ED.evButton('Edit commands', e.list, () => { e.list = e.list || []; ED.editList(e.list, 'Common event: ' + (e.name || k), () => { ED.commit(); ED.refresh('db'); }); })));
        break;
      case 'recipes':
        form.append(F(e, 'a', 'item', 'Item', { refresh: re }), F(e, 'b', 'item', 'plus item', { refresh: re }), F(e, 'gives', 'item', 'make'),
          F(e, 'text', 'textarea', 'Text when combined', { rows: 2 }),
          h('div.f.full', h('button.small.danger', { type: 'button', on: { click: () => { c.splice(+k, 1); st.dbSel = null; ED.commit(); ED.refresh('left', 'db'); } } }, 'Delete')));
        break;
      case 'images': {
        const im = new Image(); im.src = e.data; im.style.maxWidth = '100%'; im.style.imageRendering = 'pixelated';
        im.onload = () => { im.style.width = Math.min(400, im.naturalWidth * 4) + 'px'; info.textContent = im.naturalWidth + ' x ' + im.naturalHeight + ' pixels'; };
        const info = h('span.hint');
        form.append(idRow(), F(e, 'kind', 'select', 'Used as', { options: [['sprite', 'sprite (objects, pictures, icons)'], ['char', 'character sheet (3 x 4 frames)'], ['portrait', 'portrait (talking face)'], ['title', 'title screen picture']], refresh: ['db'], onChange: () => ED.reapply() }));
        if (e.kind === 'sprite' || !e.kind) form.append(F(e, 'frames', 'number', 'Frames side by side', { def: 1, onChange: () => ED.reapply() }), F(e, 'fps', 'number', 'Frames per second', { def: 6, onChange: () => ED.reapply() }));
        form.append(h('div.f.full', h('span', 'Picture'), h('div', { style: { background: 'var(--raise)', padding: '8px', borderRadius: '4px' } }, im), info),
          h('p.hint.f.full', e.kind === 'char' ? 'Character sheets use the RPG Maker layout: 3 columns (step, stand, step) and 4 rows (facing down, left, right, up). Frames of about 16 x 24 pixels match the built-in cast.' : e.kind === 'portrait' ? 'Portraits are shown at 42 x 42 pixels next to the text box. Pick it on a speaker.' : e.kind === 'title' ? 'Drawn behind the title text, scaled to fit 416 x 240.' : 'Sprites stand on the bottom middle of their tiles. Use it by name like any built-in sprite.'));
        break;
      }
    }
  };
  ED.reapply = function () { G.MAKER.loadAssets(ED.P).then(() => { ED.applyImages(); ED.refresh('map', 'left'); }); };

  // rename / delete with reference updates
  const REFS = {
    items: (c, o, n) => { if (['give', 'take', 'note', 'useitem'].includes(c.c) && c.item === o) c.item = n; for (const k of c.cond || []) if (k.i === o) k.i = n; },
    speakers: (c, o, n) => { if (c.who === o) c.who = n; },
    endings: (c, o, n) => { if (c.c === 'ending' && c.id === o) c.id = n; },
    deaths: (c, o, n) => { if (c.c === 'die' && c.cause === o) c.cause = n; },
    chases: (c, o, n) => { if (c.c === 'chase' && c.id === o) c.id = n; },
    common: (c, o, n) => { if (c.c === 'call' && c.id === o) c.id = n; },
  };
  async function rename(cat, old) {
    const nu = ED.slug(await ED.prompt('Change id', old, 'Letters, numbers and _ only. Commands that use the old id are updated.'));
    if (!nu || nu === old) return;
    const c = coll(cat);
    if (c[nu] !== undefined) return ED.toast('That id is taken.');
    const out = {};
    for (const k of Object.keys(c)) out[k === old ? nu : k] = c[k];
    if (cat === 'images') ED.P.assets.images = out; else ED.P[cat] = out;
    if (REFS[cat]) ED.eachCmd((cmd) => REFS[cat](cmd, old, nu));
    const P = ED.P;
    if (cat === 'items') {
      for (const m of Object.values(P.maps)) for (const o of m.objects || []) { if (o.lock === old) o.lock = nu; for (const k of o.show || []) if (k.i === old) k.i = nu; }
      for (const r of P.recipes || []) for (const f of ['a', 'b', 'gives']) if (r[f] === old) r[f] = nu;
    }
    if (cat === 'deaths') for (const ch of Object.values(P.chases || {})) if (ch.cause === old) ch.cause = nu;
    if (cat === 'images') {
      for (const m of Object.values(P.maps)) for (const o of m.objects || []) { if (o.sprite === old) o.sprite = nu; if (o.char === old) o.char = nu; }
      for (const s of Object.values(P.speakers || {})) if (s.portrait === old) s.portrait = nu;
      ED.reapply();
    }
    st.dbSel = nu;
    ED.commit(); ED.lists(); ED.refresh('left', 'db');
  }
  async function remove(cat, k) {
    if (!(await ED.confirm('Delete "' + k + '"? Commands that use it will show up under Problems.', 'Delete', true))) return;
    delete coll(cat)[k];
    st.dbSel = null;
    ED.commit(); ED.lists(); ED.refresh('left', 'db');
    if (cat === 'images') ED.reapply();
  }

  // ---------------------------------------------------------------- image import
  ED.importImage = function () {
    const inp = ED.$('#fileImg');
    inp.value = '';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      if (f.size > 2e6) return ED.toast('That image is over 2 MB. Pixel art should be much smaller.');
      const rd = new FileReader();
      rd.onload = () => {
        const imgs = coll('images');
        const id = ED.uniq(ED.slug(f.name.replace(/\.[a-z]+$/i, '')) || 'image', Object.assign({}, imgs, ED.spriteNames().reduce((o, n) => ((o[n] = 1), o), {})));
        const guess = /portrait|face/i.test(f.name) ? 'portrait' : /char|sheet|walk/i.test(f.name) ? 'char' : /title/i.test(f.name) ? 'title' : 'sprite';
        imgs[id] = { kind: guess, data: rd.result, frames: 1, fps: 6 };
        st.view = 'db'; st.dbCat = 'images'; st.dbSel = id;
        ED.commit(); ED.reapply(); ED.refresh();
        ED.toast('Imported as ' + id);
      };
      rd.readAsDataURL(f);
    };
    inp.click();
  };

  // ---------------------------------------------------------------- game settings
  ED.views.game = function () {
    const v = ED.$('#gameView');
    if (st.view !== 'game') return;
    ED.clear(v);
    const P = ED.P;
    P.start = P.start || { map: Object.keys(P.maps)[0], x: 2, y: 4 };
    P.titleScreen = P.titleScreen || {};
    v.appendChild(h('h2', 'Game'));
    v.appendChild(h('p.lede', 'The title screen, where a new game starts, and what the player has at the beginning.'));
    v.appendChild(h('div.form',
      F(P, 'title', 'text', 'Title', { onChange: () => { ED.$('#projTitle').value = P.title || ''; } }), F(P, 'subtitle', 'text', 'Line under the title'),
      F(P, 'player', 'char', 'Player character', { def: 'haru' }), F(P, 'startLight', 'number', 'Player light radius in dark rooms (0: none)', { def: 0 }),
      F(P.start, 'map', 'map', 'Start room', { refresh: ['left'] }), F(P.start, 'entry', 'entry:map', 'Start at entry (or X / Y)'),
      F(P.start, 'x', 'number', 'Start X'), F(P.start, 'y', 'number', 'Start Y'), F(P.start, 'dir', 'dir', 'Facing'),
      F(P, 'startFlags', 'text', 'Flags that start on (space separated)'),
      F(P, 'gameOverTitle', 'text', 'Game over title', { def: 'GAME OVER' }),
      F(P, 'id', 'mono', 'Save slot id (games with the same id share saves)'),
    ));
    v.appendChild(h('h2', { style: { marginTop: '24px' } }, 'Title screen'));
    v.appendChild(h('p.lede', 'Import an image as "title screen picture" in Database > Images to draw it behind the title.'));
    v.appendChild(h('div.form',
      F(P.titleScreen, 'bg', 'color', 'Sky top', { def: '#05030a' }), F(P.titleScreen, 'bg2', 'color', 'Sky bottom', { def: '#1a1428' }),
      F(P.titleScreen, 'color', 'color', 'Title color', { def: '#d8d0dc' }), F(P.titleScreen, 'subColor', 'color', 'Subtitle color', { def: '#7a7088' }),
      h('label.f.chk', { style: { flexDirection: 'row', alignItems: 'center', alignSelf: 'end', paddingBottom: '6px' } }, h('input', { type: 'checkbox', checked: P.titleScreen.rain !== false, on: { change: (e) => { P.titleScreen.rain = e.target.checked; ED.commit(); } } }), h('span', { style: { color: 'var(--bone)', fontSize: '12px' } }, 'Rain')),
    ));
  };
})();
