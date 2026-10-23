// Nightlight Maker runtime.
// Turns a project (plain JSON made in the editor) into a game on the NOBODY HOME engine:
// maps, objects, event command lists, items, speakers, endings, deaths, chases, common events
// and imported images. Loaded by maker/play.html (playtest) and by exported games.
//
//   G.MAKER.apply(project, {from: {map, x, y, dir}})   build everything (sync)
//   G.MAKER.loadAssets(project) -> Promise               decode imported images first
(function (G) {
  'use strict';
  const M = (G.MAKER = G.MAKER || {});
  const TS = G.TS;
  M.FORMAT = 'nightlight/1';

  // ---------------------------------------------------------------- text
  // {name} in text is replaced by the value of flag `name` (numbers, words).
  const fill = (s) => String(s == null ? '' : s).replace(/\{([A-Za-z0-9_]+)\}/g, (m, k) => (G.S.flags[k] === undefined ? '0' : String(G.S.flags[k])));
  const lines = (s) => String(s || '').split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.length);
  // one Show Text command -> engine lines ('@who:face text' / '@ text')
  function sayLines(c) {
    const ls = lines(c.text).map(fill);
    if (!ls.length) return [];
    const head = c.who ? '@' + c.who + (c.face ? ':' + c.face : '') + ' ' : '@ ';
    if (ls[0][0] !== '@') ls[0] = head + ls[0];
    if (c.shake) ls[0] = '~' + ls[0];
    return ls;
  }
  M.sayLines = sayLines;
  const steps = (s) => {
    // "U2 R3 D1 L4" (or "up 2, right 3") -> [[0,-2],[3,0],[0,1],[-4,0]]
    const out = [];
    const re = /([udlr])[a-z]*\s*(\d*)/gi;
    let m;
    while ((m = re.exec(String(s || '')))) {
      const n = m[2] ? +m[2] : 1, d = m[1].toLowerCase();
      out.push(d === 'u' ? [0, -n] : d === 'd' ? [0, n] : d === 'l' ? [-n, 0] : [n, 0]);
    }
    return out;
  };
  M.steps = steps;
  const num = (v, d) => (v === '' || v === undefined || v === null || isNaN(+v) ? d : +v);
  const val = (v) => (v === 'true' ? true : v === 'false' ? false : v !== '' && !isNaN(+v) ? +v : v);

  // ---------------------------------------------------------------- conditions
  // A condition list is AND-ed. Types:
  //  flag k [v]    flag is set (or equals v)         noflag k      flag is not set
  //  count k op n  number compare (op: >= <= == > < !=)
  //  item i        has item                          noitem i      lacks item
  //  visited map   has been in that room             chasing / notchasing
  //  chance n      n percent                         notes prefix n  read at least n notes
  M.test = function (E, conds) {
    for (const k of conds || []) {
      let ok = true;
      const f = G.S.flags;
      switch (k.t) {
        case 'flag': ok = k.v === undefined || k.v === '' ? !!f[k.k] : String(f[k.k]) === String(k.v); break;
        case 'noflag': ok = !f[k.k]; break;
        case 'count': {
          const a = +(f[k.k] || 0), b = +k.n || 0;
          ok = { '>=': a >= b, '<=': a <= b, '==': a === b, '>': a > b, '<': a < b, '!=': a !== b }[k.op || '>='];
          break;
        }
        case 'item': ok = G.S.items.includes(k.i); break;
        case 'noitem': ok = !G.S.items.includes(k.i); break;
        case 'visited': ok = !!f['@visited:' + k.map]; break;
        case 'chasing': ok = !!G.Chase.active; break;
        case 'notchasing': ok = !G.Chase.active; break;
        case 'chance': ok = Math.random() * 100 < (+k.n || 0); break;
        case 'notes': ok = G.S.notes.filter((n) => n.indexOf(k.prefix || '') === 0).length >= (+k.n || 0); break;
        default: ok = true;
      }
      if (!ok) return false;
    }
    return true;
  };

  // ---------------------------------------------------------------- commands
  // Each command is {c: 'name', ...fields}. Branching commands hold nested lists.
  const STOP = { stop: true };
  function* run(E, list, self) {
    for (const c of list || []) {
      if (!c || c.off) continue;
      const h = CMD[c.c];
      if (!h) { console.warn('[maker] unknown command', c.c); continue; }
      const r = yield* h(E, c, self || null);
      if (r === STOP) return STOP;
    }
    return null;
  }
  M.run = run;
  const selfId = (id, self) => (!id || id === '@self' ? (self && self.id) : id);
  const scripts = {};
  function scriptFn(code) {
    if (!scripts[code]) {
      // eslint-disable-next-line no-new-func
      try { scripts[code] = new Function('return function* (E, self, G) {\n' + code + '\n}')(); } catch (e) { console.error('[maker] script error', e); scripts[code] = function* () { yield* E0().say('@ (script error: ' + e.message + ')'); }; }
    }
    return scripts[code];
  }
  const E0 = () => G.EV.api;

  const CMD = {
    // --- message
    *say(E, c) { const l = sayLines(c); if (l.length) yield* E.say(...l); },
    *choice(E, c, self) {
      const opts = (c.options || []).map(fill);
      if (!opts.length) return;
      const q = c.text ? sayLines(c) : [];
      const prompt = q.length ? q[q.length - 1] : '@ ';
      if (q.length > 1) yield* E.say(...q.slice(0, -1));
      const i = yield* E.ask(prompt, opts, c.cancel !== undefined && c.cancel !== '' ? { cancel: +c.cancel } : undefined);
      const br = (c.branches || [])[i];
      if (br) return yield* run(E, br, self);
    },
    *note(E, c) { if (c.item) { if (!G.S.items.includes(c.item) && c.give) yield* E.give(c.item, { silent: true }); yield* E.note(c.item); } },
    *picture(E, c) { yield* E.picture(c.sprite, { caption: fill(c.caption || '') || undefined }); },
    *glimpse(E, c) { yield* E.glimpse(c.sprite, { time: num(c.time, 0.4), sfx: c.sfx || 'static' }); },
    *chapter(E, c) { E.chapter(fill(c.text), c.short || undefined); },
    *goal(E, c) { E.goal(fill(c.text)); },
    *location(E, c) { E.location(fill(c.text)); },
    *bubble(E, c, self) { yield* E.bubble(selfId(c.id, self) || 'player', c.kind || '!', num(c.time, 0.9)); },
    // --- flow
    *if(E, c, self) {
      if (M.test(E, c.cond)) return yield* run(E, c.then, self);
      return yield* run(E, c.else, self);
    },
    *wait(E, c) { yield* E.wait(num(c.s, 0.5)); },
    *stop() { return STOP; },
    *comment() {},
    *call(E, c, self) { const ce = M.project && M.project.common && M.project.common[c.id]; if (ce) return yield* run(E, ce.list || ce, self); },
    *script(E, c, self) { const f = scriptFn(c.code || ''); const r = yield* f(E, self, G); if (r === false) return STOP; },
    // --- state
    *set(E, c) { E.set(c.k, c.v === undefined || c.v === '' ? true : val(c.v)); },
    *unset(E, c) { E.unset(c.k); },
    *add(E, c) { E.inc(c.k, num(c.n, 1)); },
    *random(E, c) { E.set(c.k, 1 + Math.floor(Math.random() * Math.max(1, num(c.n, 2)))); },
    *give(E, c) { if (c.item) yield* E.give(c.item, c.silent ? { silent: true } : undefined); },
    *take(E, c) { if (c.item) E.take(c.item); },
    *checkpoint(E) { E.checkpoint(); },
    *save(E) { yield* E.save(); },
    // --- map and movement
    *goto(E, c) {
      if (!c.map) return;
      if (c.entry) yield* E.goto(c.map, c.entry, null, c.dir || undefined, { sfx: c.sfx || undefined });
      else yield* E.goto(c.map, num(c.x, 1), num(c.y, 1), c.dir || 'down', { sfx: c.sfx || undefined });
      return STOP;
    },
    *walk(E, c) { const s = steps(c.path); if (s.length) yield* E.walk(s, c.speed ? +c.speed : undefined); },
    *move(E, c, self) { const s = steps(c.path); const id = selfId(c.id, self); if (s.length && id) yield* E.move(id, s, c.speed ? +c.speed : undefined); },
    *face(E, c, self) { E.face(selfId(c.id, self) || 'player', c.dir || 'down'); },
    *place(E, c, self) { const id = selfId(c.id, self); if (id) E.place(id, num(c.x, 0), num(c.y, 0)); },
    *hide(E, c, self) { const id = selfId(c.id, self); if (id) E.hide(id); },
    *show(E, c, self) { const id = selfId(c.id, self); if (id) E.show(id); },
    *sprite(E, c, self) { const id = selfId(c.id, self); if (id) E.setSprite(id, c.sprite || null); },
    *npc(E, c) { E.spawn({ id: c.id || 'npc', x: num(c.x, 1), y: num(c.y, 1), char: c.char || 'shota', dir: c.dir || 'down' }); },
    *despawn(E, c) { E.despawn(c.id); },
    *follower(E, c) { if (c.char) E.set('follower', c.char); else E.unset('follower'); },
    *playerchar(E, c) { if (c.char) E.set('@playerChar', c.char); else E.unset('@playerChar'); },
    // --- screen
    *fadeout(E, c) { yield* E.fadeOut(num(c.t, 0.5)); },
    *fadein(E, c) { yield* E.fadeIn(num(c.t, 0.5)); },
    *flash(E, c) { E.flash(c.color || '#ffffff', num(c.t, 0.25)); },
    *tint(E, c) { E.tint(c.color || null, num(c.a, 0.3)); },
    *shake(E, c) { E.shake(num(c.amt, 3), num(c.t, 0.4)); },
    *dark(E, c) { E.dark(num(c.v, 0.6)); },
    *flicker(E, c) { yield* E.flicker(num(c.n, 3)); },
    *scare(E, c) { yield* E.scare(c.name); },
    *light(E, c) { E.set('playerLight', num(c.r, 80)); },
    // --- audio
    *sfx(E, c) { E.sfx(c.name); },
    *music(E, c) { E.music(c.name || null); },
    *ambience(E, c) { G.Audio.ambience(c.name || null); },
    // --- puzzles: each has ok / fail branches
    *code(E, c, self) {
      const ans = String(c.answer || '');
      const r = yield* E.code({ len: num(c.len, ans.length || 4), chars: c.chars || '0123456789', title: fill(c.title || 'Enter the code'), hint: fill(c.hint || '') || undefined });
      if (r === null || r === undefined || r === false) return yield* run(E, c.cancel, self);
      return yield* run(E, String(r).toUpperCase() === ans.toUpperCase() ? c.ok : c.fail, self);
    },
    *piano(E, c, self) {
      const want = String(c.answer || '').trim().split(/[\s,]+/).filter(Boolean).map((k) => k.toUpperCase());
      const r = yield* E.piano({ title: fill(c.title || 'Play the tune'), max: Math.max(1, want.length || 7) });
      if (!r) return yield* run(E, c.cancel, self);
      return yield* run(E, r.join(' ').toUpperCase() === want.join(' ') ? c.ok : c.fail, self);
    },
    *order(E, c, self) {
      const items = lines(c.items).map(fill);
      const want = String(c.answer || '').split(/[\s,]+/).filter(Boolean).map((n) => +n - 1);
      const r = yield* E.order({ items: items, title: fill(c.title || 'Put them in order') });
      if (!r) return yield* run(E, c.cancel, self);
      return yield* run(E, r.join(',') === want.join(',') ? c.ok : c.fail, self);
    },
    *clock(E, c, self) {
      const r = yield* E.clock({ title: fill(c.title || 'Set the time'), h: 12, m: 0 });
      if (!r) return yield* run(E, c.cancel, self);
      return yield* run(E, r.h % 12 === num(c.h, 12) % 12 && r.m === num(c.m, 0) ? c.ok : c.fail, self);
    },
    *useitem(E, c, self) {
      const r = yield* E.pickItem(fill(c.text || 'Use what?'));
      if (!r) return yield* run(E, c.cancel, self);
      if (r === c.item) { if (c.consume) E.take(r); return yield* run(E, c.ok, self); }
      return yield* run(E, c.fail, self);
    },
    // --- danger
    *chase(E, c) { if (c.id && G.CHASES[c.id]) E.chase(c.id); },
    *endchase(E) { E.endChase(); },
    *hidein(E, c, self) { const id = selfId(c.id, self); if (id) yield* E.hideIn(id); },
    *die(E, c) { yield* E.die(c.cause || 'caught'); },
    *ending(E, c) { if (c.id) yield* E.ending(c.id); },
  };
  M.CMD = CMD;
  const compile = (list) => (list && list.length ? function* (E, self) { yield* run(E, list, self); } : undefined);
  M.compile = compile;

  // ---------------------------------------------------------------- objects and maps
  function buildObj(o, mapId) {
    const d = { id: o.id, x: +o.x || 0, y: +o.y || 0, w: +o.w || 1, h: +o.h || 1 };
    if (o.char) { d.char = o.char; d.dir = o.dir || 'down'; } else if (o.sprite) d.sprite = o.sprite;
    if (o.flip) d.flip = true;
    if (o.z && o.z !== 'auto') d.z = o.z;
    if (o.solid === true || o.solid === false) d.solid = o.solid;
    if (o.alpha !== undefined && o.alpha !== '') d.alpha = +o.alpha;
    if (o.show && o.show.length) d.cond = (E) => M.test(E, o.show);
    if (o.light && +o.light.r > 0) d.light = { r: +o.light.r, col: o.light.col || '#ffc080', flicker: !!o.light.flicker, glow: o.light.glow === undefined ? 0.2 : +o.light.glow };
    const on = compile(o.on);
    if (on) d.on = on;
    if (o.touch && o.touch.length) {
      const t = compile(o.touch), key = '@once:' + mapId + ':' + o.id;
      d.touch = o.once ? function* (E, self) { if (G.S.flags[key]) return; G.S.flags[key] = true; yield* t(E, self); } : t;
      if (d.solid === undefined) d.solid = false;
    }
    if (o.door && o.door.to) {
      d.door = { to: o.door.to, dir: o.door.dir || undefined, walk: !!o.door.walk };
      if (o.door.entry) d.door.entry = o.door.entry; else { d.door.x = +o.door.x || 1; d.door.y = +o.door.y || 1; }
      if (o.door.walk) { d.touch = d.touch || true; if (d.solid === undefined) d.solid = false; }
      if (o.door.stairs) d.stairs = true;
      if (o.door.latch) d.latch = true;
    }
    if (o.lock) {
      d.lock = o.lock;
      if (o.lockText) d.lockText = lines(o.lockText);
      if (o.unlockText) d.unlockText = lines(o.unlockText);
      if (o.consume) d.consume = true;
    }
    if (o.hide) { d.hide = true; if (o.hideSprite) d.hideSprite = o.hideSprite; if (o.hidePrompt) d.hidePrompt = lines(o.hidePrompt); }
    if (o.text && !on) d.text = lines(o.text);
    if (o.save) d.on = function* (E) { yield* E.save(); };
    return d;
  }
  function buildMap(id, m) {
    const d = {
      name: m.name || id, tiles: (m.tiles || []).slice(), floor: Object.assign({}, m.floor || {}), wall: m.wall || 'plaster',
      dark: num(m.dark, 0), music: m.music || null, ambience: m.ambience || null,
      lights: (m.lights || []).map((l) => ({ x: +l.x, y: +l.y, r: num(l.r, 40), col: l.col || '#ffc080', flicker: !!l.flicker, glow: num(l.glow, 0.2) })),
      entries: {}, objects: (m.objects || []).map((o) => buildObj(o, id)),
    };
    if (m.location) d.location = m.location;
    if (m.light) d.light = +m.light;
    if (m.rain) d.rain = m.rain;
    if (m.tint) d.tint = m.tint;
    for (const k of Object.keys(m.entries || {})) { const e = m.entries[k]; d.entries[k] = [+e[0], +e[1], e[2] || 'down']; }
    const ev = m.events || {};
    if (ev.first && ev.first.length) d.first = compile(ev.first);
    if (ev.enter && ev.enter.length) d.enter = compile(ev.enter);
    return d;
  }

  // ---------------------------------------------------------------- imported images
  // assets.images[name] = {kind: 'sprite'|'char'|'portrait'|'title', data: dataURL, frames, fps}
  // char sheets use the RPG Maker layout: 3 columns (step, stand, step) x 4 rows (down, left, right, up).
  const IMG = {};
  M.loadAssets = function (project) {
    const ims = (project.assets && project.assets.images) || {};
    return Promise.all(Object.keys(ims).map((k) => new Promise((res) => {
      if (IMG[k] && IMG[k].src === ims[k].data) return res();
      const im = new Image();
      im.onload = () => { IMG[k] = im; res(); };
      im.onerror = () => { console.warn('[maker] could not load image', k); res(); };
      im.src = ims[k].data;
    })));
  };
  function cut(im, sx, sy, w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(im, sx, sy, w, h, 0, 0, w, h);
    return { c: c, ax: Math.floor(w / 2), ay: h, w: w, h: h };
  }
  function applyAssets(project) {
    const ims = (project.assets && project.assets.images) || {};
    for (const k of Object.keys(ims)) {
      const a = ims[k], im = IMG[k];
      if (!im) continue;
      if (a.kind === 'char') {
        const fw = Math.floor(im.width / 3), fh = Math.floor(im.height / 4);
        G.defChar(k, () => {
          const row = (r) => [cut(im, fw, r * fh, fw, fh), cut(im, 0, r * fh, fw, fh), cut(im, 2 * fw, r * fh, fw, fh)];
          return { down: row(0), left: row(1), right: row(2), up: row(3) };
        });
      } else if (a.kind === 'portrait') {
        const c = document.createElement('canvas'); c.width = 42; c.height = 42;
        const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
        const s = Math.min(42 / im.width, 42 / im.height);
        x.drawImage(im, Math.round((42 - im.width * s) / 2), Math.round((42 - im.height * s) / 2), Math.round(im.width * s), Math.round(im.height * s));
        G.PORTRAITS[k] = () => c;
      } else if (a.kind === 'title') {
        M.titleImage = im;
      } else {
        const n = Math.max(1, +a.frames || 1), fw = Math.floor(im.width / n);
        G.defSprite(k, () => Array.from({ length: n }, (_, i) => cut(im, i * fw, 0, fw, im.height)), +a.fps || 6);
      }
    }
  }

  M.applyAssets = applyAssets;

  // ---------------------------------------------------------------- title screen
  function drawTitle(c, t) {
    const P = M.project || {}, ts = P.titleScreen || {}, W = G.W, H = G.H;
    const top = G.C(ts.bg || '#05030a'), bot = G.C(ts.bg2 || '#1a1428');
    for (let y = 0; y < H; y += 2) { c.fillStyle = G.css(G.mix(top, bot, y / H)); c.fillRect(0, y, W, 2); }
    if (M.titleImage) {
      const im = M.titleImage, s = Math.min(W / im.width, H / im.height);
      c.imageSmoothingEnabled = false;
      c.drawImage(im, Math.round((W - im.width * s) / 2), Math.round((H - im.height * s) / 2), Math.round(im.width * s), Math.round(im.height * s));
    }
    if (ts.rain !== false) {
      c.fillStyle = 'rgba(150,160,200,0.3)';
      for (let i = 0; i < 120; i++) {
        const rx = (G.hash(i, 7, 1) * W + t * 40) % W, ry = (G.hash(i, 3, 2) * H + t * (300 + G.hash(i, 1, 1) * 120)) % H;
        c.fillRect(Math.round(rx), Math.round(ry), 1, 5);
      }
    }
    G.vignette(c, 0.7);
    for (let y = 136; y < 206; y++) { const k = 1 - Math.abs(y - 171) / 35; c.fillStyle = 'rgba(4,2,8,' + (0.7 * Math.min(1, k * 1.6)).toFixed(3) + ')'; c.fillRect(0, y, W, 1); }
    const title = P.title || 'Untitled';
    const sc = G.textWidth(title, 3) <= W - 20 ? 3 : 2;
    G.text(c, title, W / 2 + 1, 25, { align: 'center', scale: sc, color: '#2a0810' });
    G.text(c, title, W / 2, 24, { align: 'center', scale: sc, color: ts.color || '#d8d0dc' });
    if (P.subtitle) G.text(c, P.subtitle, W / 2, 24 + sc * 9 + 6, { align: 'center', color: ts.subColor || '#7a7088', shadow: '#000' });
    // endings seen
    const ids = Object.keys(P.endings || {});
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(G.ENDINGS_KEY) || '[]'); } catch (e) { seen = []; }
    if (Array.isArray(seen) && ids.some((k) => seen.includes(k))) {
      ids.forEach((k, i) => {
        c.fillStyle = seen.includes(k) ? (P.endings[k].color || '#ffffff') : '#2a2434';
        c.fillRect(W - 8 - (ids.length - i) * 11, H - 30, 8, 8);
      });
    }
  }

  // ---------------------------------------------------------------- apply a project
  // Removes everything a previous project registered (maps, items...) and builds this one.
  const owned = { MAPS: [], ITEMS: [], SPEAKERS: [], CHASES: [] };
  M.apply = function (project, opts) {
    opts = opts || {};
    const P = (M.project = project || {});
    for (const k of Object.keys(owned)) { for (const id of owned[k]) delete G[k][id]; owned[k] = []; }
    G.CHASES = G.CHASES || {};
    const reg = (k, id, v) => { G[k][id] = v; owned[k].push(id); };
    for (const id of Object.keys(P.maps || {})) reg('MAPS', id, buildMap(id, P.maps[id]));
    for (const id of Object.keys(P.items || {})) {
      const it = P.items[id];
      const d = { name: it.name || id, desc: it.desc || '' };
      if (it.icon) d.icon = it.icon;
      if (it.note) { d.note = true; d.pages = String(it.pages || '').split(/\n-{3,}\n/).map((p) => p.trim()).filter(Boolean); if (!d.pages.length) d.pages = ['(blank)']; }
      if (it.use && it.use.length) d.use = compile(it.use);
      reg('ITEMS', id, d);
    }
    for (const id of Object.keys(P.speakers || {})) {
      const s = P.speakers[id];
      const port = s.portrait;
      reg('SPEAKERS', id, {
        name: s.name || id, color: s.color || '#c8c0d0', blip: num(s.blip, 520), blipWave: s.wave || undefined, speed: s.speed ? +s.speed : undefined, textColor: s.textColor || undefined,
        portrait: port ? (e) => (G.PORTRAITS[port] ? G.PORTRAITS[port](e || s.face || undefined) : null) : undefined,
      });
    }
    for (const id of Object.keys(P.chases || {})) {
      const ch = P.chases[id];
      const at = ch.at === 'xy' ? [num(ch.x, 1), num(ch.y, 1)] : undefined;
      reg('CHASES', id, {
        char: ch.char || 'caretaker', at: at, speed: num(ch.speed, 54), delay: num(ch.delay, 1), follow: ch.follow !== false, followDelay: num(ch.followDelay, 1.6),
        timer: ch.timer ? +ch.timer : undefined, duration: ch.duration ? +ch.duration : undefined, loseAfterHide: num(ch.loseAfterHide, 5.5),
        cause: ch.cause || 'caught', safe: (ch.safe || []).slice(), music: ch.music || undefined, onEnd: compile(ch.onEnd),
      });
    }
    G.ENDINGS = {};
    for (const id of Object.keys(P.endings || {})) {
      const e = P.endings[id];
      G.ENDINGS[id] = { title: e.title || id.toUpperCase(), subtitle: e.subtitle || '', color: e.color || '#c8c0d0', music: e.music || 'ending', lines: lines(e.lines), hint: e.hint || undefined, retry: !!e.retry };
    }
    G.DEATHS = Object.assign({ caught: 'You were caught.' }, P.deaths || {});
    G.GAMEOVER_TITLE = P.gameOverTitle || 'GAME OVER';
    G.RECIPES = (P.recipes || []).filter((r) => r.a && r.b && r.gives).map((r) => ({ needs: [r.a, r.b], gives: r.gives, text: r.text ? lines(r.text) : undefined }));
    G.PLAYER_CHAR = P.player || 'haru';
    const gid = (P.id || 'game').replace(/[^a-z0-9_]/gi, '');
    G.SAVE_KEY = 'nightlight_save_' + gid;
    G.ENDINGS_KEY = 'nightlight_endings_' + gid;
    G.START = Object.assign({ map: Object.keys(P.maps || {})[0], x: 2, y: 4, dir: 'down' }, P.start || {});
    applyAssets(P);
    const startAt = (s) => {
      const ex = new G.Explore();
      if (P.startLight) G.S.flags.playerLight = +P.startLight;
      for (const f of String(P.startFlags || '').split(/[\s,]+/).filter(Boolean)) G.S.flags[f] = true;
      ex.start(s.map, s.entry || num(s.x, 2), s.entry ? null : num(s.y, 4), s.dir || 'down');
      return ex;
    };
    G.GAME = {
      boot() { if (G.KID && G.KID.build) G.KID.build(); },
      newGame() { return startAt(G.START); },
      titleDraw: drawTitle,
      // playtest "from here": skip the title and start in the room being edited
      firstScene() {
        if (!opts.from) return null;
        G.S = G.newState();
        for (const it of opts.items || []) G.S.items.push(it);
        for (const f of opts.flags || []) G.S.flags[f] = true;
        return startAt(opts.from);
      },
      scenes: {},
    };
    return P;
  };

  // ---------------------------------------------------------------- checks (used by the editor)
  // Lists references that point at nothing: unknown maps, entries, items, speakers, endings...
  M.check = function (P) {
    const out = [];
    const maps = P.maps || {}, items = P.items || {};
    const where = (m, o) => (m ? m + (o ? ' / ' + o : '') : 'project');
    const needMap = (id, w) => { if (id && !maps[id]) out.push({ where: w, msg: 'Room "' + id + '" does not exist.' }); };
    const needEntry = (map, e, w) => { if (map && e && maps[map] && !(maps[map].entries || {})[e]) out.push({ where: w, msg: 'Room "' + map + '" has no entry point "' + e + '".' }); };
    const needItem = (id, w) => { if (id && !items[id]) out.push({ where: w, msg: 'Item "' + id + '" does not exist.' }); };
    const walk = (list, w) => {
      for (const c of list || []) {
        if (!c || c.off) continue;
        const need = { give: 'item', take: 'item', note: 'item', useitem: 'item', goto: 'map', chase: 'id', ending: 'id', call: 'id', picture: 'sprite', glimpse: 'sprite', set: 'k', unset: 'k', add: 'k', random: 'k' }[c.c];
        if (need && !c[need]) out.push({ where: w, msg: '"' + c.c + '" command has nothing chosen.' });
        if (c.c === 'goto') { needMap(c.map, w); needEntry(c.map, c.entry, w); }
        if (['give', 'take', 'note'].includes(c.c)) needItem(c.item, w);
        if (c.c === 'useitem') needItem(c.item, w);
        if (c.c === 'say' && c.who && !(P.speakers || {})[c.who]) out.push({ where: w, msg: 'Speaker "' + c.who + '" does not exist.' });
        if (c.c === 'ending' && c.id && !(P.endings || {})[c.id]) out.push({ where: w, msg: 'Ending "' + c.id + '" does not exist.' });
        if (c.c === 'chase' && c.id && !(P.chases || {})[c.id]) out.push({ where: w, msg: 'Chase "' + c.id + '" does not exist.' });
        if (c.c === 'call' && c.id && !(P.common || {})[c.id]) out.push({ where: w, msg: 'Common event "' + c.id + '" does not exist.' });
        for (const k of ['then', 'else', 'ok', 'fail', 'cancel']) if (c[k]) walk(c[k], w);
        if (c.branches) c.branches.forEach((b) => walk(b, w));
        for (const k of c.cond || []) if ((k.t === 'item' || k.t === 'noitem')) needItem(k.i, w);
      }
    };
    if (!P.start || !maps[P.start.map]) out.push({ where: 'project', msg: 'The game has no valid start room (Game settings).' });
    else if (P.start.entry) needEntry(P.start.map, P.start.entry, 'Game settings');
    for (const mid of Object.keys(maps)) {
      const m = maps[mid];
      const ids = {};
      for (const o of m.objects || []) {
        const w = where(mid, o.id);
        if (ids[o.id]) out.push({ where: w, msg: 'Two objects are called "' + o.id + '".' });
        ids[o.id] = true;
        if (o.door && !o.door.to) out.push({ where: w, msg: 'Door leads nowhere: pick a room.' });
        if (o.door && o.door.to) { needMap(o.door.to, w); needEntry(o.door.to, o.door.entry, w); }
        if (o.lock === '') out.push({ where: w, msg: 'Locked, but no item opens it.' });
        if (o.lock) needItem(o.lock, w);
        walk(o.on, w); walk(o.touch, w);
        for (const k of o.show || []) if (k.t === 'item' || k.t === 'noitem') needItem(k.i, w);
      }
      walk((m.events || {}).first, where(mid, 'first visit'));
      walk((m.events || {}).enter, where(mid, 'every visit'));
    }
    for (const id of Object.keys(P.chases || {})) walk(P.chases[id].onEnd, 'chase ' + id);
    for (const id of Object.keys(P.common || {})) walk((P.common[id] || {}).list, 'common event ' + id);
    for (const id of Object.keys(items)) walk(items[id].use, 'item ' + id);
    return out;
  };
})(window.G);
