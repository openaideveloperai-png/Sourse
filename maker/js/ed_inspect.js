// Nightlight Maker editor: the inspector (right panel). Shows the room's settings, or whatever
// is selected on the map: an object, an entry point or a light.
(function () {
  'use strict';
  const G = window.G, NL = window.NL, ED = window.ED, h = ED.h;
  const st = ED.st;
  const F = ED.field;
  const sec = (title, ...kids) => h('div.sec', title ? h('h3', title) : null, ...kids);
  const form = (...kids) => h('div.form', ...kids);
  const count = (l) => (l || []).reduce((n, c) => n + 1 + ['then', 'else', 'ok', 'fail', 'cancel'].reduce((a, k) => a + (c[k] ? count(c[k]) : 0), 0) + (c.branches ? c.branches.reduce((a, b) => a + count(b), 0) : 0), 0);
  ED.countCmds = count;
  ED.evButton = (label, list, open) => h('button.evbtn' + (list && list.length ? '.has' : ''), { type: 'button', on: { click: open } }, h('span', label), h('span.n', list && list.length ? count(list) + ' commands' : 'empty'));

  ED.views.inspector = function () {
    const box = ED.clear(ED.$('#inspector'));
    if (st.view !== 'map') {
      box.appendChild(sec(null, h('p.hint', st.view === 'db' ? 'Pick something on the left to edit it.' : 'These settings apply to the whole game.')));
      return;
    }
    const m = ED.map();
    if (!m) { box.appendChild(sec(null, h('p.hint', 'Make a room to start.'))); return; }
    const s = st.sel;
    if (s && s.k === 'obj' && ED.selObj()) return objPanel(box, m, ED.selObj());
    if (s && s.k === 'entry' && m.entries && m.entries[s.id]) return entryPanel(box, m, s.id);
    if (s && s.k === 'light' && m.lights && m.lights[s.i]) return lightPanel(box, m, s.i);
    roomPanel(box, m);
  };

  // ---------------------------------------------------------------- room
  function roomPanel(box, m) {
    const id = st.map;
    const sz = ED.size(m);
    box.appendChild(h('div.insp-head', ED.tileThumb('wall', m.wall || 'plaster'), h('div', h('div.t', m.name || id), h('div.s', 'Room  ' + id))));
    box.appendChild(sec('Room', form(
      F(m, 'name', 'text', 'Name', { full: true, refresh: ['left'] }),
      F(m, 'location', 'text', 'Banner on entering', { full: true, def: 'e.g. Hinata Heights - 4F' }),
      F(m, 'wall', 'select', 'Wall style', { options: Object.keys(G.WALLS).map((w) => [w, w]), refresh: ['map', 'left'] }),
      F(m, 'rain', 'select', 'Rain', { options: [['', 'none'], ['rail', 'beyond the railing'], ['full', 'everywhere']] }),
      F(m, 'dark', 'range:0|0.95|0.05', 'Darkness', { full: true, def: 0, refresh: ['map'] }),
      F(m, 'light', 'number', 'Player light radius', { def: 'from the game' }),
      F(m, 'music', 'music', 'Music', { def: 'silence' }),
      F(m, 'ambience', 'ambience', 'Background sound', { def: 'none' }),
    ), h('div.btnrow', { style: { marginTop: '10px' } },
      h('button.small', { type: 'button', on: { click: () => renameRoom(id) } }, 'Change id'),
      h('button.small', { type: 'button', on: { click: () => ED.playtest({ from: centerOf(m) }) } }, 'Play this room'),
      h('button.small', { type: 'button', on: { click: () => { const c = centerOf(m); ED.P.start = c; ED.commit(); ED.refresh('map', 'left'); ED.toast('New games start in this room.'); } } }, 'Start game here'))));
    box.appendChild(sec('Events', h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
      ED.evButton('First visit', m.events && m.events.first, () => ED.editRoomEvent(id, 'first')),
      ED.evButton('Every visit', m.events && m.events.enter, () => ED.editRoomEvent(id, 'enter')))));
    // size
    const wIn = h('input', { type: 'number', min: 3, max: 120, value: sz.w }), hIn = h('input', { type: 'number', min: 4, max: 80, value: sz.h });
    box.appendChild(sec('Size', h('div.form', h('label.f', h('span', 'Width'), wIn), h('label.f', h('span', 'Height'), hIn)),
      h('div.btnrow', { style: { marginTop: '8px' } }, h('button.small', { type: 'button', on: { click: () => resize(m, +wIn.value, +hIn.value) } }, 'Resize'), h('span.hint', 'Grows to the right and down with ceiling.'))));
    // floors in use
    const fl = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } });
    for (const ch of Object.keys(m.floor)) {
      const sel = h('select', Object.keys(G.FLOORS).map((f) => h('option', { value: f, selected: m.floor[ch] === f }, f)));
      sel.addEventListener('change', () => { m.floor[ch] = sel.value; ED.commit(); ED.refresh('map', 'inspector'); });
      fl.appendChild(h('div.kv', h('code', { style: { fontFamily: 'var(--f-mono)', color: 'var(--dim)' } }, JSON.stringify(ch)), sel, ED.tileThumb('floor', m.floor[ch])));
    }
    box.appendChild(sec('Floors in this room', fl, h('p.hint', { style: { marginTop: '6px' } }, 'Change a floor here to repaint every tile of it.')));
  }
  const centerOf = (m) => {
    const sz = ED.size(m);
    const e = Object.values(m.entries || {})[0];
    if (e) return { map: st.map, x: e[0], y: e[1], dir: e[2] || 'down' };
    for (let r = 3; r < sz.h; r++) for (let c = Math.floor(sz.w / 2); c < sz.w; c++) { const ch = (m.tiles[r] || '')[c]; if (ch && !'#WR '.includes(ch)) return { map: st.map, x: c, y: r, dir: 'down' }; }
    return { map: st.map, x: 1, y: 3, dir: 'down' };
  };
  function resize(m, w, hh) {
    w = Math.max(3, Math.min(120, w | 0)); hh = Math.max(4, Math.min(80, hh | 0));
    const rows = m.tiles.slice(0, hh).map((r) => r.padEnd(w, '#').slice(0, w));
    while (rows.length < hh) rows.push('#'.repeat(w));
    m.tiles = rows;
    ED.commit(); ED.refresh('map', 'inspector', 'toolbar');
  }
  async function renameRoom(old) {
    const nu = ED.slug(await ED.prompt('Room id', old, 'Letters, numbers and _ only. Doors and commands that use the old id are updated.'));
    if (!nu || nu === old) return;
    if (ED.P.maps[nu]) return ED.toast('There is already a room called ' + nu);
    const P = ED.P;
    const maps = {};
    for (const k of Object.keys(P.maps)) maps[k === old ? nu : k] = P.maps[k];
    P.maps = maps;
    if (P.start && P.start.map === old) P.start.map = nu;
    for (const m of Object.values(P.maps)) for (const o of m.objects || []) { if (o.door && o.door.to === old) o.door.to = nu; for (const k of o.show || []) if (k.map === old) k.map = nu; }
    ED.eachCmd((c) => { if (c.map === old) c.map = nu; for (const k of c.cond || []) if (k.map === old) k.map = nu; });
    for (const ch of Object.values(P.chases || {})) ch.safe = (ch.safe || []).map((s) => (s === old ? nu : s));
    st.map = nu;
    ED.commit(); ED.lists(); ED.refresh();
  }

  // ---------------------------------------------------------------- object
  function objPanel(box, m, o) {
    const kind = o.door ? (o.door.walk ? 'Exit' : 'Door') : o.char ? 'Character' : o.hide ? 'Hiding spot' : o.save ? 'Save point' : o.touch && o.touch.length ? 'Trigger' : 'Object';
    const head = h('div.insp-head', ED.thumb(o.char ? 'char:' + o.char : o.sprite || '', 40), h('div', h('div.t', o.id), h('div.s', kind + '  at ' + o.x + ', ' + o.y)));
    box.appendChild(head);
    const re = ['map'];
    box.appendChild(sec('Object', form(
      h('label.f.full', h('span', 'Id (used by commands)'), h('div.pair', h('input.mono', { type: 'text', value: o.id, readOnly: true }), h('button.small', { type: 'button', on: { click: () => renameObj(m, o) } }, 'Change'))),
      F(o, 'x', 'number', 'X', { refresh: re }), F(o, 'y', 'number', 'Y', { refresh: re }),
      F(o, 'w', 'number', 'Width (tiles)', { def: 1, refresh: re }), F(o, 'h', 'number', 'Height (tiles)', { def: 1, refresh: re }),
    )));
    box.appendChild(sec('Looks', form(
      F(o, 'sprite', 'sprite', 'Sprite', { full: true, def: '(invisible)', refresh: ['map', 'inspector'] }),
      F(o, 'char', 'char', 'Or a character', { def: '(none)', refresh: ['map', 'inspector'] }),
      F(o, 'dir', 'dir', 'Facing', { refresh: re }),
      F(o, 'z', 'select', 'Layer', { options: [['', 'normal'], ['wall', 'on the wall'], ['floor', 'on the floor (under people)'], ['over', 'above everything']], refresh: re }),
      F(o, 'solid', 'select', 'Blocks walking', { options: [['', 'auto'], ['true', 'yes'], ['false', 'no']], onChange: () => { if (o.solid === 'true') o.solid = true; if (o.solid === 'false') o.solid = false; } }),
      F(o, 'alpha', 'number', 'Opacity 0-1', { def: 1, refresh: re }),
      F(o, 'flip', 'check', 'Mirror', { refresh: re }),
    )));
    box.appendChild(sec('Events', h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
      ED.evButton('When examined (Z)', o.on, () => ED.editEvent(o, 'on')),
      (!o.on || !o.on.length) ? F(o, 'text', 'textarea', 'Or just show this text (one box per line)', { rows: 2 }) : null,
      ED.evButton('When stepped on', o.touch, () => ED.editEvent(o, 'touch')),
      F(o, 'once', 'check', 'Step event happens only once'),
      h('div', { style: { marginTop: '4px' } }, F(o, 'show', 'cond', 'Only there while', { onChange: () => ED.refresh('map') })),
    )));
    // door
    const door = h('div.sec', h('h3', h('label.chk', h('input', { type: 'checkbox', checked: !!o.door, on: { change: (e) => { if (e.target.checked) o.door = { to: '', entry: '' }; else delete o.door; ED.commit(); ED.refresh('inspector', 'map'); } } }), 'Door or exit')));
    if (o.door) door.appendChild(form(
      F(o.door, 'to', 'map', 'Leads to room', { refresh: ['inspector'] }),
      F(o.door, 'entry', 'entry:to', 'Arrive at entry'),
      F(o.door, 'x', 'number', 'Or at X'), F(o.door, 'y', 'number', 'Y'),
      F(o.door, 'walk', 'check', 'Walk onto it to go through (floor exit)', { full: true, refresh: ['map'] }),
      F(o.door, 'stairs', 'check', 'Stairs sound'), F(o.door, 'latch', 'check', 'Has a chain (chases)'),
    ));
    box.appendChild(door);
    // lock
    const lock = h('div.sec', h('h3', h('label.chk', h('input', { type: 'checkbox', checked: o.lock !== undefined, on: { change: (e) => { if (e.target.checked) { o.lock = ''; o.lockText = 'Locked.'; } else { delete o.lock; delete o.lockText; delete o.unlockText; delete o.consume; } ED.commit(); ED.refresh('inspector'); } } }), 'Locked')));
    if (o.lock !== undefined) lock.appendChild(form(
      F(o, 'lock', 'item', 'Opens with item', { full: true }),
      F(o, 'lockText', 'textarea', 'Text while locked', { rows: 2 }),
      F(o, 'unlockText', 'textarea', 'Text when it opens', { rows: 2 }),
      F(o, 'consume', 'check', 'The item is used up', { full: true }),
    ));
    box.appendChild(lock);
    // hiding spot
    const hide = h('div.sec', h('h3', h('label.chk', h('input', { type: 'checkbox', checked: !!o.hide, on: { change: (e) => { if (e.target.checked) o.hide = true; else { delete o.hide; delete o.hideSprite; delete o.hidePrompt; } ED.commit(); ED.refresh('inspector'); } } }), 'Hiding spot')));
    if (o.hide) hide.appendChild(form(F(o, 'hideSprite', 'sprite', 'Sprite while hiding', { full: true }), F(o, 'hidePrompt', 'textarea', 'Question', { rows: 2, def: 'Hide inside?' })));
    box.appendChild(hide);
    // light
    const light = h('div.sec', h('h3', h('label.chk', h('input', { type: 'checkbox', checked: !!o.light, on: { change: (e) => { if (e.target.checked) o.light = { r: 40, col: '#ffc080', glow: 0.2 }; else delete o.light; ED.commit(); ED.refresh('inspector', 'map'); } } }), 'Gives off light')));
    if (o.light) light.appendChild(form(F(o.light, 'r', 'number', 'Radius', { refresh: re }), F(o.light, 'col', 'color', 'Color', { def: '#ffc080' }), F(o.light, 'glow', 'number', 'Glow 0-1', { def: 0.2 }), F(o.light, 'flicker', 'check', 'Flickers')));
    box.appendChild(light);
    box.appendChild(sec(null, form(F(o, 'save', 'check', 'Save point (examining it offers to save)', { full: true }))));
    box.appendChild(sec(null, h('div.btnrow', h('button.small', { type: 'button', on: { click: ED.dupSel } }, 'Copy (Ctrl+D)'), h('button.small.danger', { type: 'button', on: { click: ED.deleteSel } }, 'Delete (Del)'))));
  }
  async function renameObj(m, o) {
    const nu = ED.slug(await ED.prompt('Object id', o.id, 'Commands in this room that use the old id are updated.'));
    if (!nu || nu === o.id) return;
    if (m.objects.some((q) => q.id === nu)) return ED.toast('There is already an object called ' + nu);
    const old = o.id;
    o.id = nu;
    const fix = (list) => { for (const c of list || []) { if (c && c.id === old && ['hide', 'show', 'move', 'face', 'place', 'sprite', 'bubble', 'hidein'].includes(c.c)) c.id = nu; for (const k of ['then', 'else', 'ok', 'fail', 'cancel']) fix(c[k]); (c.branches || []).forEach(fix); } };
    for (const q of m.objects) { fix(q.on); fix(q.touch); }
    if (m.events) { fix(m.events.first); fix(m.events.enter); }
    st.sel = { k: 'obj', id: nu };
    ED.commit(); ED.lists(); ED.refresh('inspector', 'map');
  }

  // ---------------------------------------------------------------- entry
  function entryPanel(box, m, id) {
    const e = m.entries[id];
    box.appendChild(h('div.insp-head', h('div', h('div.t', id), h('div.s', 'Entry point  at ' + e[0] + ', ' + e[1]))));
    const ex = { x: e[0], y: e[1], dir: e[2] || 'down' };
    const sync = () => { m.entries[id] = [ex.x === undefined ? 0 : ex.x, ex.y === undefined ? 0 : ex.y, ex.dir || 'down']; ED.refresh('map'); };
    box.appendChild(sec('Entry point', form(
      h('label.f.full', h('span', 'Name'), h('div.pair', h('input.mono', { type: 'text', value: id, readOnly: true }), h('button.small', { type: 'button', on: { click: () => renameEntry(m, id) } }, 'Change'))),
      F(ex, 'x', 'number', 'X', { onChange: sync }), F(ex, 'y', 'number', 'Y', { onChange: sync }),
      F(ex, 'dir', 'select', 'Player faces', { options: [['down', 'down'], ['up', 'up'], ['left', 'left'], ['right', 'right']], onChange: sync }),
    ), h('p.hint', { style: { marginTop: '8px' } }, 'Doors pick this as "Arrive at entry". Name entries after where you come from, like from_hall.'),
    h('div.btnrow', { style: { marginTop: '8px' } },
      h('button.small', { type: 'button', on: { click: () => { ED.P.start = { map: st.map, entry: id }; ED.commit(); ED.refresh('map', 'left'); ED.toast('New games start here.'); } } }, 'Start game here'),
      h('button.small.danger', { type: 'button', on: { click: ED.deleteSel } }, 'Delete'))));
  }
  async function renameEntry(m, old) {
    const nu = ED.slug(await ED.prompt('Entry name', old, 'Doors and commands that use the old name are updated.'));
    if (!nu || nu === old) return;
    if (m.entries[nu]) return ED.toast('That name is taken.');
    const ents = {};
    for (const k of Object.keys(m.entries)) ents[k === old ? nu : k] = m.entries[k];
    m.entries = ents;
    const mid = st.map;
    for (const mm of Object.values(ED.P.maps)) for (const o of mm.objects || []) if (o.door && o.door.to === mid && o.door.entry === old) o.door.entry = nu;
    ED.eachCmd((c) => { if (c.c === 'goto' && c.map === mid && c.entry === old) c.entry = nu; });
    if (ED.P.start && ED.P.start.map === mid && ED.P.start.entry === old) ED.P.start.entry = nu;
    st.sel = { k: 'entry', id: nu };
    ED.commit(); ED.refresh();
  }

  // ---------------------------------------------------------------- light
  function lightPanel(box, m, i) {
    const l = m.lights[i];
    box.appendChild(h('div.insp-head', h('div', h('div.t', 'Light ' + (i + 1)), h('div.s', 'at ' + l.x + ', ' + l.y))));
    const re = ['map'];
    box.appendChild(sec('Light', form(
      F(l, 'x', 'number', 'X', { refresh: re }), F(l, 'y', 'number', 'Y', { refresh: re }),
      F(l, 'r', 'number', 'Radius (pixels)', { refresh: re }), F(l, 'col', 'color', 'Color', { def: '#ffc080', refresh: re }),
      F(l, 'glow', 'number', 'Glow 0-1', { def: 0.2 }), F(l, 'flicker', 'check', 'Flickers'),
    ), h('div.btnrow', { style: { marginTop: '8px' } }, h('button.small.danger', { type: 'button', on: { click: ED.deleteSel } }, 'Delete'))));
  }
})();
