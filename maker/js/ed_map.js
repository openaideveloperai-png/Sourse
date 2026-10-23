// Nightlight Maker editor: the room view. Left panel (room list + palette), toolbar, and the
// map canvas drawn with the engine's own room renderer and sprites.
(function () {
  'use strict';
  const G = window.G, NL = window.NL, ED = window.ED, h = ED.h, TS = 16;
  const st = ED.st;

  // ---------------------------------------------------------------- tiles
  const STRUCT = [['#', 'Ceiling', 'Solid dark. The outside of rooms.'], ['W', 'Wall face', 'Two rows under a ceiling row.'], ['R', 'Railing', 'Outdoor rail with the city beyond.'], [' ', 'Nothing', 'Black void.']];
  const FREE = '.,:;_-+=~abcdefghijklmnopqrstuvxyz0123456789'.split('');
  ED.size = (m) => ({ w: m.tiles.reduce((a, r) => Math.max(a, r.length), 0), h: m.tiles.length });
  ED.floorChar = function (m, type) {
    for (const k of Object.keys(m.floor)) if (m.floor[k] === type) return k;
    const all = m.tiles.join('');
    const ch = FREE.find((c) => !(c in m.floor) && !all.includes(c)) || '.';
    m.floor[ch] = type;
    return ch;
  };
  const brushChar = (m) => (st.brush.k === 'floor' ? ED.floorChar(m, st.brush.v) : st.brush.v);
  function setTile(m, x, y, ch) {
    const sz = ED.size(m);
    if (x < 0 || y < 0 || x >= sz.w || y >= sz.h) return false;
    const row = m.tiles[y].padEnd(sz.w, ' ');
    if (row[x] === ch) return false;
    m.tiles[y] = row.slice(0, x) + ch + row.slice(x + 1);
    return true;
  }
  const tileAt = (m, x, y) => (m.tiles[y] || '')[x] || ' ';
  function flood(m, x, y, ch) {
    const from = tileAt(m, x, y), sz = ED.size(m);
    if (from === ch) return;
    const q = [[x, y]], seen = new Set();
    while (q.length) {
      const [cx, cy] = q.pop();
      const k = cx + ',' + cy;
      if (seen.has(k) || cx < 0 || cy < 0 || cx >= sz.w || cy >= sz.h || tileAt(m, cx, cy) !== from) continue;
      seen.add(k);
      setTile(m, cx, cy, ch);
      q.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
  }
  // a room shell inside the rectangle: ceiling, two wall rows, floor, ceiling
  function roomBox(m, x0, y0, x1, y1) {
    const fl = st.brush.k === 'floor' ? ED.floorChar(m, st.brush.v) : Object.keys(m.floor)[0] || ED.floorChar(m, 'wood');
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const r = y - y0;
      setTile(m, x, y, r === 0 || y === y1 ? '#' : r <= 2 ? 'W' : fl);
    }
  }
  // drop floor letters no tile uses any more
  ED.tidyFloor = function (m) { const all = m.tiles.join(''); for (const k of Object.keys(m.floor)) if (!all.includes(k) && Object.keys(m.floor).length > 1) delete m.floor[k]; };

  // ---------------------------------------------------------------- left panel
  ED.views.left = function () {
    const box = ED.clear(ED.$('#leftBody'));
    ED.$$('#leftTabs button').forEach((b) => b.classList.toggle('on', b.dataset.view === st.view));
    if (st.view === 'db') return ED.dbList(box);
    if (st.view === 'game') return box.appendChild(h('div.sec', h('p.hint', 'Title screen, start position, player character and what every new game starts with.')));
    const P = ED.P;
    // rooms
    const rooms = h('div.list');
    for (const id of Object.keys(P.maps)) {
      const m = P.maps[id];
      rooms.appendChild(h('div.row' + (id === st.map ? '.on' : ''), { on: { click: () => { st.map = id; st.sel = null; ED.lists(); ED.refresh('left', 'map', 'inspector', 'toolbar'); } }, title: 'Room id: ' + id },
        P.start && P.start.map === id ? h('span.start', { title: 'The game starts here' }, 'START') : null, h('span', m.name || id), h('span.id', id)));
    }
    box.appendChild(h('div.sec', h('h3', h('span.grow', 'Rooms'),
      h('button.small', { type: 'button', title: 'New room', on: { click: ED.newRoom } }, 'New'),
      h('button.small', { type: 'button', title: 'Copy this room', on: { click: ED.dupRoom } }, 'Copy'),
      h('button.small.danger', { type: 'button', title: 'Delete this room', on: { click: ED.delRoom } }, 'Delete')), rooms));
    // palette
    const pal = h('div.sec');
    box.appendChild(pal);
    const m = ED.map();
    if (!m) return;
    if (st.mode === 'tiles') {
      pal.appendChild(h('h3', 'Floors'));
      const sw = h('div.swatches');
      for (const f of Object.keys(G.FLOORS)) sw.appendChild(h('div.sw' + (st.brush.k === 'floor' && st.brush.v === f ? '.on' : ''), { title: 'Paint ' + f, on: { click: () => { st.brush = { k: 'floor', v: f }; ED.refresh('left'); } } }, ED.tileThumb('floor', f), f.replace('_', ' ')));
      pal.appendChild(sw);
      pal.appendChild(h('h3', { style: { marginTop: '12px' } }, 'Structure'));
      const s2 = h('div.swatches');
      for (const [ch, name, tip] of STRUCT) {
        const c = document.createElement('canvas'); c.width = c.height = 16;
        const x = c.getContext('2d');
        if (ch === 'W') x.drawImage(ED.tileThumb('wall', m.wall || 'plaster'), 0, 0);
        else { x.fillStyle = ch === '#' ? '#1a1520' : ch === 'R' ? '#2c2a32' : '#000'; x.fillRect(0, 0, 16, 16); if (ch === 'R') { x.fillStyle = '#5a5664'; x.fillRect(0, 4, 16, 2); for (let i = 1; i < 16; i += 4) x.fillRect(i, 4, 1, 10); } if (ch === ' ') { x.strokeStyle = '#3a3242'; x.strokeRect(0.5, 0.5, 15, 15); } }
        s2.appendChild(h('div.sw' + (st.brush.k === 'tile' && st.brush.v === ch ? '.on' : ''), { title: tip, on: { click: () => { st.brush = { k: 'tile', v: ch }; ED.refresh('left'); } } }, c, name));
      }
      pal.appendChild(s2);
      pal.appendChild(h('h3', { style: { marginTop: '12px' } }, 'Wall style (whole room)'));
      const s3 = h('div.swatches');
      for (const w of Object.keys(G.WALLS)) s3.appendChild(h('div.sw' + ((m.wall || 'plaster') === w ? '.on' : ''), { title: 'Walls: ' + w, on: { click: () => { m.wall = w; ED.commit(); ED.refresh('left', 'map', 'inspector'); } } }, ED.tileThumb('wall', w), w));
      pal.appendChild(s3);
      pal.appendChild(h('p.hint', { style: { marginTop: '10px' } }, 'Rooms are a ceiling row, two wall rows, then floor. Use Room box to draw one in a single drag. Alt+click picks up a tile.'));
    } else if (st.mode === 'objects') {
      pal.appendChild(h('h3', 'Ready-made objects'));
      for (const t of NL.TEMPLATES) {
        const on = st.place && st.place.k === 'tpl' && st.place.id === t.id;
        pal.appendChild(h('div.tpl' + (on ? '.on' : ''), { on: { click: () => { st.place = on ? null : { k: 'tpl', id: t.id }; ED.refresh('left', 'status'); } } }, ED.thumb(t.sprite, 24), t.label));
      }
      pal.appendChild(h('h3', { style: { marginTop: '12px' } }, 'Characters'));
      const cg = h('div.sprites');
      for (const c of G.charNames().slice().sort()) {
        const on = st.place && st.place.k === 'char' && st.place.v === c;
        cg.appendChild(h('div.sp' + (on ? '.on' : ''), { title: c, on: { click: () => { st.place = on ? null : { k: 'char', v: c }; ED.refresh('left', 'status'); } } }, ED.thumb('char:' + c, 40), h('span', c)));
      }
      pal.appendChild(cg);
      pal.appendChild(h('h3', { style: { marginTop: '12px' } }, 'Sprites'));
      const q = h('input.search', { type: 'text', placeholder: 'Search sprites', value: st.spriteFilter });
      const grid = h('div.sprites');
      const draw = () => {
        ED.clear(grid);
        const f = q.value.trim().toLowerCase();
        st.spriteFilter = q.value;
        let n = 0;
        for (const s of ED.spriteNames()) {
          if (f ? s.indexOf(f) < 0 : /^(icon_|pic_|scare_)/.test(s)) continue;
          if (++n > 400) break;
          const on = st.place && st.place.k === 'sprite' && st.place.v === s;
          grid.appendChild(h('div.sp' + (on ? '.on' : ''), { title: s, on: { click: () => { st.place = on ? null : { k: 'sprite', v: s }; ED.refresh('left', 'status'); } } }, ED.thumb(s, 44), h('span', s)));
        }
      };
      q.addEventListener('input', draw);
      draw();
      pal.appendChild(q); pal.appendChild(grid);
    } else if (st.mode === 'entries') {
      pal.appendChild(h('h3', 'Entry points'));
      pal.appendChild(h('p.hint', 'Named spots where the player arrives. Doors and "Go to room" point at them. Click the map to add one.'));
      const l = h('div.list');
      for (const k of Object.keys(m.entries || {})) l.appendChild(h('div.row' + (st.sel && st.sel.k === 'entry' && st.sel.id === k ? '.on' : ''), { on: { click: () => { st.sel = { k: 'entry', id: k }; ED.refresh('left', 'map', 'inspector'); } } }, h('span', k), h('span.id', m.entries[k].slice(0, 2).join(', '))));
      pal.appendChild(l);
    } else if (st.mode === 'lights') {
      pal.appendChild(h('h3', 'Lights'));
      pal.appendChild(h('p.hint', 'Glows that cut through the darkness. Click the map to add one. Turn on Darkness to see the room as the player will.'));
      const l = h('div.list');
      (m.lights || []).forEach((li, i) => l.appendChild(h('div.row' + (st.sel && st.sel.k === 'light' && st.sel.i === i ? '.on' : ''), { on: { click: () => { st.sel = { k: 'light', i: i }; ED.refresh('left', 'map', 'inspector'); } } }, h('span', { style: { color: li.col } }, 'Light ' + (i + 1)), h('span.id', li.x + ', ' + li.y + '  r' + li.r))));
      pal.appendChild(l);
    }
  };

  ED.newRoom = async function () {
    const name = await ED.prompt('New room', 'New room', 'Name');
    if (!name) return;
    const id = ED.uniq(ED.slug(name) || 'room', ED.P.maps);
    const cur = ED.map();
    ED.P.maps[id] = NL.newMap(name, 14, 9, cur ? cur.wall : 'plaster', cur ? Object.values(cur.floor)[0] : 'wood');
    st.map = id; st.sel = null;
    ED.commit(); ED.lists(); ED.refresh();
  };
  ED.dupRoom = function () {
    const m = ED.map();
    if (!m) return;
    const id = ED.uniq(st.map + '_copy', ED.P.maps);
    const c = ED.clone(m); c.name = (m.name || st.map) + ' (copy)';
    ED.P.maps[id] = c; st.map = id; st.sel = null;
    ED.commit(); ED.lists(); ED.refresh();
  };
  ED.delRoom = async function () {
    if (Object.keys(ED.P.maps).length < 2) return ED.toast('A game needs at least one room.');
    if (!(await ED.confirm('Delete the room "' + (ED.map().name || st.map) + '"? Doors that lead here will stop working.', 'Delete room', true))) return;
    delete ED.P.maps[st.map];
    st.map = Object.keys(ED.P.maps)[0]; st.sel = null;
    ED.commit(); ED.lists(); ED.refresh();
  };

  // ---------------------------------------------------------------- toolbar + status
  ED.views.toolbar = function () {
    const tb = ED.clear(ED.$('#toolbar'));
    const seg = (items, cur, set, label) => h('div.seg', { role: 'group', 'aria-label': label }, items.map(([v, l, tip]) => h('button' + (cur === v ? '.on' : ''), { type: 'button', title: tip || l, on: { click: () => set(v) } }, l)));
    tb.appendChild(seg([['tiles', 'Tiles', 'Paint floors and walls (T)'], ['objects', 'Objects', 'Place things and events (O)'], ['entries', 'Entries', 'Where the player arrives (E)'], ['lights', 'Lights', 'Lamps and glows (L)']], st.mode, (v) => { st.mode = v; st.sel = null; st.place = null; ED.refresh('left', 'toolbar', 'map', 'inspector', 'status'); }, 'Mode'));
    if (st.mode === 'tiles') tb.appendChild(seg([['pencil', 'Pencil'], ['rect', 'Rectangle'], ['fill', 'Fill'], ['room', 'Room box', 'Drag to draw a whole room: ceiling, walls and floor']], st.tool, (v) => { st.tool = v; ED.refresh('toolbar', 'status'); }, 'Tool'));
    tb.appendChild(seg([[1, '1x'], [2, '2x'], [3, '3x'], [4, '4x']], st.zoom, (v) => { st.zoom = v; ED.refresh('toolbar', 'map'); }, 'Zoom'));
    tb.appendChild(h('label.chk', h('input', { type: 'checkbox', checked: st.grid, on: { change: (e) => { st.grid = e.target.checked; ED.refresh('map'); } } }), 'Grid'));
    tb.appendChild(h('label.chk', h('input', { type: 'checkbox', checked: st.dark, on: { change: (e) => { st.dark = e.target.checked; ED.refresh('map'); } } }), 'Darkness'));
    const m = ED.map();
    if (m) { const s = ED.size(m); tb.appendChild(h('span.tb-label', { style: { marginLeft: 'auto' } }, s.w + ' x ' + s.h + ' tiles')); }
  };
  ED.views.status = function () {
    const hint = ED.$('#stHint');
    if (!hint) return;
    let t = '';
    if (st.mode === 'tiles') t = { pencil: 'Click and drag to paint. Alt+click picks up a tile.', rect: 'Drag a rectangle to fill it.', fill: 'Click to fill an area of the same tile.', room: 'Drag to draw a room: ceiling, two wall rows, floor.' }[st.tool];
    else if (st.mode === 'objects') t = st.place ? 'Click to place. Hold Shift to place more than one. Esc cancels.' : 'Click to select, drag to move, double-click to edit its event. Del deletes, Ctrl+D copies.';
    else if (st.mode === 'entries') t = 'Click to add an entry point, drag to move one.';
    else if (st.mode === 'lights') t = 'Click to add a light, drag to move one.';
    hint.textContent = t + '  Right-click for more.';
  };

  // ---------------------------------------------------------------- canvas drawing
  const cv = () => ED.$('#mapCanvas');
  let roomKey = '', roomCv = null, hover = null, drag = null;
  function roomCanvas(m) {
    const sz = ED.size(m);
    const key = m.tiles.join('|') + JSON.stringify(m.floor) + m.wall + sz.w;
    if (key !== roomKey) {
      roomKey = key;
      try { roomCv = G.renderRoom({ w: sz.w, h: sz.h, tiles: m.tiles.map((r) => r.padEnd(sz.w, ' ')), floor: m.floor, wall: m.wall || 'plaster' }); }
      catch (e) { console.error(e); roomCv = null; }
    }
    return roomCv;
  }
  const sortY = (o) => (o.z === 'floor' ? -1e6 + o.y : o.z === 'over' ? 1e6 : o.z === 'wall' ? (o.y + (o.h || 1)) * TS - 1e5 : (o.y + (o.h || 1)) * TS);
  let t0 = performance.now();
  ED.views.map = function () {
    const c = cv(), m = ED.map();
    if (!c) return;
    ED.$('#mapView').hidden = st.view !== 'map';
    ED.$('#dbView').hidden = st.view !== 'db';
    ED.$('#gameView').hidden = st.view !== 'game';
    document.body.classList.toggle('wide', st.view !== 'map');
    if (!m || st.view !== 'map') return;
    const sz = ED.size(m), W = sz.w * TS, H = sz.h * TS;
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    c.style.width = W * st.zoom + 'px'; c.style.height = H * st.zoom + 'px';
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    const rc = roomCanvas(m);
    if (rc) x.drawImage(rc, 0, 0);
    const t = (performance.now() - t0) / 1000;
    // objects
    const objs = (m.objects || []).slice().sort((a, b) => sortY(a) - sortY(b));
    for (const o of objs) {
      const ax = (o.x + (o.w || 1) / 2) * TS, ay = (o.y + (o.h || 1)) * TS;
      if (o.char) G.drawChar(x, o.char, ax, ay - 1, o.dir || 'down', null, o.alpha === undefined ? 1 : +o.alpha);
      else if (o.sprite) G.drawSprite(x, o.sprite, ax, ay, t, !!o.flip, o.alpha === undefined ? 1 : +o.alpha);
      else {
        // invisible: trigger zones and floor exits
        x.save();
        x.strokeStyle = o.door ? 'rgba(232,184,96,0.9)' : 'rgba(180,140,255,0.9)';
        x.fillStyle = o.door ? 'rgba(232,184,96,0.15)' : 'rgba(180,140,255,0.12)';
        x.setLineDash([2, 2]);
        x.fillRect(o.x * TS, o.y * TS, (o.w || 1) * TS, (o.h || 1) * TS);
        x.strokeRect(o.x * TS + 0.5, o.y * TS + 0.5, (o.w || 1) * TS - 1, (o.h || 1) * TS - 1);
        x.restore();
        G.text(x, o.door ? 'EXIT' : 'STEP', o.x * TS + (o.w || 1) * 8, o.y * TS + 4, { align: 'center', color: o.door ? '#e8b860' : '#c8b0ff' });
      }
    }
    // start position
    if (ED.P.start && ED.P.start.map === st.map) {
      const s = ED.P.start;
      let sx = s.x, sy = s.y;
      if (s.entry && m.entries && m.entries[s.entry]) [sx, sy] = m.entries[s.entry];
      G.drawChar(x, ED.P.player || 'haru', sx * TS + 8, sy * TS + 13, s.dir || 'down', null, 0.55);
      G.text(x, 'START', sx * TS + 8, sy * TS - 14, { align: 'center', color: '#e8b860', shadow: '#000' });
    }
    // darkness preview
    if (st.dark && +m.dark > 0) {
      const d = document.createElement('canvas'); d.width = W; d.height = H;
      const dx = d.getContext('2d');
      dx.fillStyle = 'rgba(6,4,12,' + Math.min(0.97, +m.dark) + ')'; dx.fillRect(0, 0, W, H);
      dx.globalCompositeOperation = 'destination-out';
      const glow = (lx, ly, r) => { const g = dx.createRadialGradient(lx, ly, 0, lx, ly, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); dx.fillStyle = g; dx.fillRect(lx - r, ly - r, r * 2, r * 2); };
      for (const l of m.lights || []) glow(l.x * TS + 8, l.y * TS + 8, +l.r || 40);
      for (const o of m.objects || []) if (o.light && +o.light.r) glow((o.x + (o.w || 1) / 2) * TS, (o.y + (o.h || 1) / 2) * TS, +o.light.r);
      if (ED.P.start && ED.P.start.map === st.map && +ED.P.startLight) { const s = ED.P.start; glow(s.x * TS + 8, s.y * TS + 6, +ED.P.startLight); }
      x.drawImage(d, 0, 0);
    }
    // lights
    if (st.mode === 'lights' || st.dark) (m.lights || []).forEach((l, i) => {
      const on = st.sel && st.sel.k === 'light' && st.sel.i === i;
      x.strokeStyle = on ? '#e8b860' : 'rgba(255,220,150,0.5)'; x.setLineDash(on ? [] : [3, 3]);
      x.beginPath(); x.arc(l.x * TS + 8, l.y * TS + 8, +l.r || 40, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
      x.fillStyle = l.col || '#ffc080'; x.fillRect(l.x * TS + 5, l.y * TS + 5, 6, 6);
      x.strokeStyle = '#000'; x.strokeRect(l.x * TS + 4.5, l.y * TS + 4.5, 7, 7);
    });
    // entries
    if (st.mode === 'entries' || st.mode === 'objects') for (const k of Object.keys(m.entries || {})) {
      const [ex, ey, dir] = m.entries[k];
      const on = st.sel && st.sel.k === 'entry' && st.sel.id === k;
      x.fillStyle = on ? 'rgba(232,184,96,0.35)' : 'rgba(132,185,140,0.22)';
      x.fillRect(ex * TS, ey * TS, TS, TS);
      x.strokeStyle = on ? '#e8b860' : '#84b98c'; x.strokeRect(ex * TS + 0.5, ey * TS + 0.5, TS - 1, TS - 1);
      const a = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir || 'down'] || [0, 1];
      x.fillStyle = on ? '#e8b860' : '#84b98c';
      x.fillRect(ex * TS + 7 + a[0] * 4, ey * TS + 7 + a[1] * 4, 2, 2);
      if (st.mode === 'entries' || on) G.text(x, k, ex * TS + 8, ey * TS - 8, { align: 'center', color: on ? '#e8b860' : '#a8d8b0', shadow: '#000' });
    }
    // grid
    if (st.grid) {
      x.fillStyle = 'rgba(255,255,255,0.07)';
      for (let gx = TS; gx < W; gx += TS) x.fillRect(gx, 0, 1, H);
      for (let gy = TS; gy < H; gy += TS) x.fillRect(0, gy, W, 1);
    }
    // selection
    const so = ED.selObj();
    if (so) {
      x.strokeStyle = '#e8b860'; x.lineWidth = 1;
      x.strokeRect(so.x * TS + 0.5, so.y * TS + 0.5, (so.w || 1) * TS - 1, (so.h || 1) * TS - 1);
      x.fillStyle = 'rgba(232,184,96,0.12)'; x.fillRect(so.x * TS, so.y * TS, (so.w || 1) * TS, (so.h || 1) * TS);
    }
    // hover / drag preview
    if (drag && (drag.k === 'rect' || drag.k === 'room')) {
      const [x0, y0, x1, y1] = norm(drag.a, drag.b);
      x.strokeStyle = '#e8b860'; x.setLineDash([3, 2]); x.strokeRect(x0 * TS + 0.5, y0 * TS + 0.5, (x1 - x0 + 1) * TS - 1, (y1 - y0 + 1) * TS - 1); x.setLineDash([]);
    } else if (hover) {
      x.strokeStyle = 'rgba(255,255,255,0.55)';
      let hw = 1, hh = 1;
      if (st.mode === 'objects' && st.place && st.place.k === 'tpl') { const tp = NL.TEMPLATES.find((tt) => tt.id === st.place.id); const o = tp && tp.make(0, 0); hw = (o && o.w) || 1; hh = (o && o.h) || 1; }
      x.strokeRect(hover[0] * TS + 0.5, hover[1] * TS + 0.5, hw * TS - 1, hh * TS - 1);
      if (st.mode === 'objects' && st.place) {
        const name = st.place.k === 'char' ? 'char:' + st.place.v : st.place.k === 'sprite' ? st.place.v : (NL.TEMPLATES.find((tt) => tt.id === st.place.id) || {}).sprite;
        x.globalAlpha = 0.6;
        if (name && name.indexOf('char:') === 0) G.drawChar(x, name.slice(5), hover[0] * TS + 8, hover[1] * TS + 15, 'down', null, 0.6);
        else if (name) G.drawSprite(x, name, (hover[0] + hw / 2) * TS, (hover[1] + hh) * TS, 0, false, 0.6);
        x.globalAlpha = 1;
      }
    }
  };
  // animate sprites while the room view is visible (cheap: ~8 fps)
  setInterval(() => { if (st.view === 'map' && !document.hidden && !drag && ED.P) ED.views.map(); }, 125);
  const norm = (a, b) => [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];

  // ---------------------------------------------------------------- hit testing
  function tileOf(e) {
    const c = cv(), r = c.getBoundingClientRect(), m = ED.map(), sz = ED.size(m);
    return [Math.floor(((e.clientX - r.left) / r.width) * sz.w), Math.floor(((e.clientY - r.top) / r.height) * sz.h)];
  }
  function objAt(m, tx, ty) {
    const hits = (m.objects || []).filter((o) => tx >= o.x && tx < o.x + (o.w || 1) && ty >= o.y && ty < o.y + (o.h || 1));
    if (hits.length) return hits.sort((a, b) => sortY(b) - sortY(a))[0];
    // tall sprites: clicking the part above the footprint also selects
    const tall = (m.objects || []).filter((o) => tx >= o.x && tx < o.x + (o.w || 1) && ty < o.y && ty >= o.y - 2 && (o.sprite || o.char)).sort((a, b) => sortY(b) - sortY(a));
    return tall[0] || null;
  }
  const entryAt = (m, tx, ty) => Object.keys(m.entries || {}).find((k) => m.entries[k][0] === tx && m.entries[k][1] === ty);
  const lightAt = (m, tx, ty) => (m.lights || []).findIndex((l) => l.x === tx && l.y === ty);

  // ---------------------------------------------------------------- placing objects
  ED.placeAt = function (tx, ty) {
    const m = ED.map(), p = st.place;
    let o;
    if (p.k === 'tpl') {
      const t = NL.TEMPLATES.find((tt) => tt.id === p.id);
      o = Object.assign({ id: '', x: tx, y: ty }, ED.clone(t.make(tx, ty)));
      o.id = ED.uniq(t.id, m.objects.map((q) => q.id));
      // self-references in template events
      const fix = (list) => { for (const c of list || []) if (c.c === 'hide' && c.id === '') delete c.id; };
      fix(o.on); fix(o.touch);
      if (o.z === 'wall') { o.y = Math.max(0, ty); }
    } else if (p.k === 'char') {
      o = { id: ED.uniq(p.v, m.objects.map((q) => q.id)), x: tx, y: ty, char: p.v, dir: 'down', on: [{ c: 'say', text: '...' }] };
    } else {
      o = { id: ED.uniq(p.v.replace(/_(open|on|off)$/, ''), m.objects.map((q) => q.id)), x: tx, y: ty, sprite: p.v };
      if (/^(door|window|painting|mirror|clock|calendar|nightlight|fluoro|wall_|name|notice|drawing|yui_drawing|height_marks|music_chart|timetable|family_photos|streamers|cuckoo|lift_buttons|elevator_panel|fusuma|oshiire|hole_wall|sign_|key_board|pipe|valve)/.test(p.v)) o.z = 'wall';
      if (/^(door|elevator|fusuma|oshiire|lift_doors)/.test(p.v)) o.h = 2;
      if (/^(rug|blood|footprints|puddle|drain|hole_floor|futon|stairs_down)/.test(p.v)) { o.z = 'floor'; o.solid = false; }
    }
    m.objects.push(o);
    st.sel = { k: 'obj', id: o.id };
    ED.commit(); ED.lists();
    ED.refresh('map', 'inspector', 'left');
    return o;
  };
  ED.deleteSel = function () {
    const m = ED.map(), s = st.sel;
    if (!m || !s) return;
    if (s.k === 'obj') m.objects = m.objects.filter((o) => o.id !== s.id);
    else if (s.k === 'entry') delete m.entries[s.id];
    else if (s.k === 'light') m.lights.splice(s.i, 1);
    st.sel = null;
    ED.commit(); ED.lists(); ED.refresh('map', 'inspector', 'left');
  };
  ED.dupSel = function () {
    const m = ED.map(), o = ED.selObj();
    if (!o) return;
    const c = ED.clone(o);
    c.id = ED.uniq(o.id.replace(/\d+$/, ''), m.objects.map((q) => q.id));
    c.x = Math.min(ED.size(m).w - 1, o.x + 1);
    m.objects.push(c);
    st.sel = { k: 'obj', id: c.id };
    ED.commit(); ED.refresh('map', 'inspector');
  };

  // ---------------------------------------------------------------- mouse
  function down(e) {
    const m = ED.map();
    if (!m || e.button !== 0) return;
    e.preventDefault();
    ED.$('#stage').focus();
    const [tx, ty] = tileOf(e);
    if (st.mode === 'tiles') {
      if (e.altKey) { const ch = tileAt(m, tx, ty); st.brush = m.floor[ch] ? { k: 'floor', v: m.floor[ch] } : { k: 'tile', v: ch }; ED.refresh('left'); return; }
      if (st.tool === 'pencil') { setTile(m, tx, ty, brushChar(m)); drag = { k: 'paint' }; }
      else if (st.tool === 'fill') { flood(m, tx, ty, brushChar(m)); ED.commit(); }
      else drag = { k: st.tool, a: [tx, ty], b: [tx, ty] };
    } else if (st.mode === 'objects') {
      const o = objAt(m, tx, ty);
      if (st.place) {
        ED.placeAt(tx, ty);
        if (!e.shiftKey) { st.place = null; ED.refresh('left', 'status'); }
        return;
      }
      if (o) { st.sel = { k: 'obj', id: o.id }; drag = { k: 'move', id: o.id, off: [tx - o.x, ty - o.y], moved: false }; }
      else st.sel = null;
      ED.refresh('inspector');
    } else if (st.mode === 'entries') {
      const k = entryAt(m, tx, ty);
      if (k) { st.sel = { k: 'entry', id: k }; drag = { k: 'entry', id: k }; }
      else {
        m.entries = m.entries || {};
        const id = ED.uniq('entry', m.entries);
        m.entries[id] = [tx, ty, 'down'];
        st.sel = { k: 'entry', id: id };
        ED.commit();
      }
      ED.refresh('inspector', 'left');
    } else if (st.mode === 'lights') {
      const i = lightAt(m, tx, ty);
      if (i >= 0) { st.sel = { k: 'light', i: i }; drag = { k: 'light', i: i }; }
      else { m.lights = m.lights || []; m.lights.push({ x: tx, y: ty, r: 40, col: '#ffc080', glow: 0.2 }); st.sel = { k: 'light', i: m.lights.length - 1 }; ED.commit(); }
      ED.refresh('inspector', 'left');
    }
    ED.views.map();
  }
  function move(e) {
    const m = ED.map();
    if (!m) return;
    const [tx, ty] = tileOf(e);
    hover = [tx, ty];
    ED.$('#stTile').textContent = tx + ', ' + ty + '  ' + JSON.stringify(tileAt(m, tx, ty)).slice(1, -1).replace(' ', 'void');
    if (drag) {
      if (drag.k === 'paint') setTile(m, tx, ty, brushChar(m));
      else if (drag.k === 'rect' || drag.k === 'room') drag.b = [tx, ty];
      else if (drag.k === 'move') { const o = ED.obj(drag.id); if (o && (o.x !== tx - drag.off[0] || o.y !== ty - drag.off[1])) { o.x = tx - drag.off[0]; o.y = ty - drag.off[1]; drag.moved = true; } }
      else if (drag.k === 'entry') { m.entries[drag.id][0] = tx; m.entries[drag.id][1] = ty; }
      else if (drag.k === 'light') { m.lights[drag.i].x = tx; m.lights[drag.i].y = ty; }
    }
    ED.views.map();
  }
  function up() {
    const m = ED.map();
    if (!drag || !m) { drag = null; return; }
    if (drag.k === 'rect') { const [x0, y0, x1, y1] = norm(drag.a, drag.b); const ch = brushChar(m); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setTile(m, x, y, ch); }
    if (drag.k === 'room') { const [x0, y0, x1, y1] = norm(drag.a, drag.b); if (y1 - y0 >= 4) roomBox(m, x0, y0, x1, y1); else ED.toast('A room box needs at least 5 rows: ceiling, 2 walls, floor, ceiling.'); }
    drag = null;
    ED.tidyFloor(m);
    ED.commit();
    ED.refresh('map', 'inspector', 'left');
  }
  function dbl(e) {
    const m = ED.map();
    if (!m || st.mode !== 'objects') return;
    const [tx, ty] = tileOf(e);
    const o = objAt(m, tx, ty);
    if (o) ED.editEvent(o, o.touch && o.touch.length && !(o.on && o.on.length) ? 'touch' : 'on');
  }
  // right-click menu
  function ctx(e) {
    const m = ED.map();
    if (!m) return;
    e.preventDefault();
    const [tx, ty] = tileOf(e);
    const menu = ED.$('#ctxMenu');
    ED.clear(menu);
    const item = (label, fn) => menu.appendChild(h('button', { type: 'button', on: { click: () => { menu.hidden = true; fn(); } } }, label));
    item('Play from here', () => ED.playtest({ from: { map: st.map, x: tx, y: ty, dir: 'down' } }));
    item('Start the game here', () => { ED.P.start = { map: st.map, x: tx, y: ty, dir: 'down' }; ED.commit(); ED.refresh('map', 'left'); ED.toast('New games start here.'); });
    item('Add entry point here', () => { m.entries = m.entries || {}; const id = ED.uniq('entry', m.entries); m.entries[id] = [tx, ty, 'down']; st.mode = 'entries'; st.sel = { k: 'entry', id: id }; ED.commit(); ED.refresh(); });
    item('Add light here', () => { m.lights = m.lights || []; m.lights.push({ x: tx, y: ty, r: 40, col: '#ffc080', glow: 0.2 }); st.mode = 'lights'; st.sel = { k: 'light', i: m.lights.length - 1 }; ED.commit(); ED.refresh(); });
    const o = objAt(m, tx, ty);
    if (o) {
      item('Edit event of "' + o.id + '"', () => ED.editEvent(o, 'on'));
      item('Copy "' + o.id + '"', () => { st.sel = { k: 'obj', id: o.id }; ED.dupSel(); });
      item('Delete "' + o.id + '"', () => { st.sel = { k: 'obj', id: o.id }; ED.deleteSel(); });
    }
    menu.hidden = false;
    menu.style.left = Math.min(e.clientX, innerWidth - 210) + 'px';
    menu.style.top = Math.min(e.clientY, innerHeight - menu.offsetHeight - 10) + 'px';
  }
  ED.initMap = function () {
    const c = cv();
    c.addEventListener('mousedown', down);
    c.addEventListener('dblclick', dbl);
    c.addEventListener('contextmenu', ctx);
    c.addEventListener('mouseleave', () => { hover = null; ED.views.map(); });
    window.addEventListener('mousemove', (e) => { if (drag || e.target === c) move(e); });
    window.addEventListener('mouseup', up);
    document.addEventListener('mousedown', (e) => { const menu = ED.$('#ctxMenu'); if (!menu.hidden && !menu.contains(e.target)) menu.hidden = true; });
    // touch: one finger acts as the mouse
    const tm = (type) => (e) => { if (e.touches.length > 1) return; const t = e.changedTouches[0]; const fake = { clientX: t.clientX, clientY: t.clientY, button: 0, altKey: false, shiftKey: false, target: c, preventDefault: () => e.preventDefault() }; if (type === 'down') down(fake); else if (type === 'move') move(fake); else up(fake); };
    c.addEventListener('touchstart', tm('down'), { passive: false });
    c.addEventListener('touchmove', tm('move'), { passive: false });
    c.addEventListener('touchend', tm('up'));
  };
})();
