// Event runner + scripting API.
// Events are generator functions: on: function* (E) { yield* E.say('...'); }
// Every E.* that takes time is a generator used with yield*; queries are plain.
(function (G) {
  'use strict';
  const TS = G.TS;
  G.CHASES = G.CHASES || {};
  G.missingHints = G.missingHints || [];

  const EV = (G.EV = {
    queue: [],
    cur: null,
    dt: 0,
    inp: {},
    get busy() { return !!this.cur || this.queue.length > 0; },
    run(genFn, src) {
      if (!genFn) return;
      this.queue.push({ fn: genFn, src: src });
    },
    update(dt, inp) {
      this.dt = dt;
      this.inp = inp;
      if (!this.cur && this.queue.length) {
        const q = this.queue.shift();
        this.cur = { it: q.fn(E, q.src), src: q.src };
      }
      if (!this.cur) return;
      let r;
      try { r = this.cur.it.next(); }
      catch (e) { console.error('event error', e); r = { done: true }; }
      if (r.done) {
        this.cur = null;
        this.worldRuns = false;
        if (G.EX && G.EX.room) G.EX.room.refresh();
      }
    },
    clear() { this.queue = []; this.cur = null; this.worldRuns = false; },
    worldRuns: false,
  });

  const ex = () => G.EX;
  // parse "@who:face text" speaker prefixes
  function parseLines(args) {
    let who = null, face = 'neutral';
    const out = [];
    for (const a of args) {
      if (a === null || a === undefined) continue;
      if (typeof a === 'object') { out.push(a); continue; }
      let s = String(a);
      const m = s.match(/^@(\S*)\s*(.*)$/s);
      if (m) {
        const sp = m[1];
        if (!sp) { who = null; face = 'neutral'; }
        else { const [w, f] = sp.split(':'); who = w; face = f || 'neutral'; }
        s = m[2];
        if (!s) continue;
      }
      out.push({ who: who, face: face, text: s });
    }
    return out;
  }
  // object fields that may be a string, an array of lines, or E => either
  G.evalText = function (v, o) {
    if (typeof v === 'function') { try { v = v(E, o); } catch (e) { G.contentError('text of ' + (o ? o.id : '?'), e); v = null; } }
    return v === null || v === undefined ? [] : [].concat(v);
  };
  const tileOf = (p) => [Math.floor(p.x / TS), Math.floor((p.y - 2) / TS)];

  const E = (EV.api = {
    // ---------- queries ----------
    flag: (k) => G.S.flags[k],
    has: (id) => G.S.items.includes(id),
    get map() { return G.S.map; },
    get player() { return ex() ? ex().p : null; },
    get dt() { return EV.dt; },
    get inp() { return EV.inp; },
    obj: (id) => ex().room.obj(id),
    count: (k) => G.S.flags[k] || 0,
    chasing: () => !!(G.Chase && G.Chase.active),
    // has the player ever entered this map (the 'first' event may still be pending: see afterEnter)
    visited: (map) => !!(G.S.flags['@seen:' + map] || G.S.flags['@visited:' + map]),
    // the player's tile [x, y]
    tile: () => tileOf(ex().p),

    // ---------- state ----------
    set(k, v) { G.S.flags[k] = v === undefined ? true : v; if (ex() && ex().room) ex().room.refresh(); },
    unset(k) { delete G.S.flags[k]; if (ex() && ex().room) ex().room.refresh(); },
    inc(k, n) { G.S.flags[k] = (G.S.flags[k] || 0) + (n === undefined ? 1 : n); return G.S.flags[k]; },
    *give(id, opts) {
      opts = opts || {};
      if (!G.S.items.includes(id)) G.S.items.push(id);
      const it = G.ITEMS[id];
      if (it && it.note && !G.S.notes.includes(id)) G.S.notes.push(id);
      if (!opts.silent) {
        G.Audio.sfx('item');
        yield* E.say('@ Obtained ' + (it ? it.name : id) + '.');
      }
      // automatic combinations: G.RECIPES = [{needs: [...], gives: 'id', text: '...', then: function* (E) {}}]
      for (const rc of G.RECIPES || []) {
        if (G.S.items.includes(rc.gives) || G.S.flags['@made:' + rc.gives]) continue;
        if (!rc.needs.every((n) => G.S.items.includes(n))) continue;
        for (const n of rc.needs) E.take(n);
        G.S.flags['@made:' + rc.gives] = true;
        yield* E.say(rc.text || '@ The pieces fit together.');
        yield* E.give(rc.gives);
        if (rc.then) yield* rc.then(E);
      }
    },
    // removes an item (and the note from the NOTES tab if it is a document)
    take(id) {
      const i = G.S.items.indexOf(id); if (i >= 0) G.S.items.splice(i, 1);
      const k = G.S.notes.indexOf(id); if (k >= 0) G.S.notes.splice(k, 1);
    },
    hide(id) { const o = E.obj(id); if (o) { o.setSt('hidden', true); o.setSt('shown', undefined); ex().room.refresh(); } },
    show(id) { const o = E.obj(id); if (o) { o.setSt('shown', true); o.setSt('hidden', undefined); ex().room.refresh(); } },
    setSprite(id, name) { const o = E.obj(id); if (o) { o.setSt('sprite', name || undefined); o.update(); } },
    setChar(id, name) { const o = E.obj(id); if (o) { o.setSt('char', name || undefined); o.update(); } },
    face(id, dir) {
      if (id === 'player') { ex().p.dir = dir; return; }
      const o = E.obj(id);
      if (o) { o.setSt('dir', dir); o.dir = dir; }
      else if (id === 'follower') ex().folDir = dir;
    },
    place(id, x, y) { const o = E.obj(id); if (o) { o.offX = 0; o.offY = 0; o.setPos(x, y); } },
    // draw spriteName instead of the character (null: back to normal). Saved per object; 'player' too.
    pose(id, name) {
      if (id === 'player') { if (name) G.S.flags['@pose:player'] = name; else delete G.S.flags['@pose:player']; return; }
      const o = E.obj(id); if (o) { o.setSt('pose', name || undefined); o.update(); }
    },
    // translucency 0..1 (saved); 'player' too
    alpha(id, a) {
      if (id === 'player') { if (a === 1 || a === undefined || a === null) delete G.S.flags['@alpha:player']; else G.S.flags['@alpha:player'] = a; return; }
      const o = E.obj(id); if (o) { o.setSt('alpha', a === null ? undefined : a); o.update(); }
    },

    // ---------- runtime actors (never saved; gone when the room is loaded again) ----------
    // E.spawn({id, char | sprite, x, y, dir, solid: false, alpha, ...any object field})
    spawn(cfg) {
      if (!cfg || !cfg.id || cfg.x === undefined || cfg.y === undefined) throw new Error('E.spawn needs {id, x, y}');
      return ex().room.spawn(Object.assign({ solid: false }, cfg));
    },
    despawn(id) { return ex().room.despawn(id); },
    // the companion (flags.follower) becomes a real object with id 'follower' where she stands
    followerOut() {
      const x = ex(), fol = G.S.flags.follower;
      if (!x || !fol) return null;
      if (G.S.flags['@followerOut'] && x.room.obj('follower')) return x.room.obj('follower');
      const fp = x.followerPos ? x.followerPos() : [x.p.x, x.p.y, x.p.dir];
      let c = Math.floor(fp[0] / TS), r = Math.floor((fp[1] - 2) / TS);
      if (x.room.tileSolid(c, r)) [c, r] = tileOf(x.p);
      const o = x.room.spawn({ id: 'follower', char: fol, x: c, y: r, dir: fp[2] || x.p.dir, solid: false });
      // start exactly where the trail ghost was drawn (E.move glides onto the tile first)
      o.offX = Math.round(fp[0] - (c * TS + 8));
      o.offY = Math.round(fp[1] - (r * TS + 15));
      G.S.flags['@followerOut'] = true;
      return o;
    },
    // walk the 'follower' object back to the player, then she follows the trail again
    *followerIn(speed) {
      const x = ex(), room = x.room, o = room.obj('follower');
      if (!o || !o.temp) { delete G.S.flags['@followerOut']; return; }
      const p = x.p, [pc, pr] = tileOf(p);
      const bv = G.DIRV[p.dir] || [0, 1];
      const cands = [[pc - bv[0], pr - bv[1]], [pc, pr + 1], [pc - 1, pr], [pc + 1, pr], [pc, pr - 1]];
      let best = null;
      for (const [c, r] of cands) {
        if (room.isSolid(c, r)) continue;
        if (c === o.x && r === o.y) { best = { c: c, r: r, n: 0 }; break; }
        const pa = G.findPath(room, o.x, o.y, c, r);
        if (pa && (!best || pa.length < best.n - 2)) best = { c: c, r: r, n: pa.length };
        if (best && best.c === pc - bv[0] && best.r === pr - bv[1]) break; // behind the player: take it
      }
      if (best) yield* E.moveTo('follower', best.c, best.r, speed || 50);
      if (o.offX || o.offY) yield* E.move('follower', [], speed || 50);
      if (x.resetTrail) x.resetTrail([o.x * TS + 8, o.y * TS + 15, o.dir]);
      room.despawn('follower');
      delete G.S.flags['@followerOut'];
    },

    // ---------- time ----------
    *wait(s) { let t = 0; while (t < s) { t += EV.dt; yield; } },
    *waitKey() { yield; while (!EV.inp.ok) yield; },

    // ---------- talking ----------
    // E.say('@mia:scared Who is there?', 'Second line, same speaker.', '@ Narration.')
    *say(...args) {
      const lines = parseLines(args);
      if (!lines.length) return;
      let done = false;
      G.Dialog.say(lines, () => { done = true; });
      while (!done) yield;
    },
    // returns index of chosen option
    *ask(question, options, opts) {
      opts = opts || {};
      const lines = parseLines([question]);
      let res = -1;
      G.Dialog.ask(lines[0] || { who: null, text: '' }, options, (i) => { res = i; }, opts.cancel);
      while (res === -1) yield;
      return res;
    },
    *yesno(question) { return (yield* E.ask(question, ['Yes', 'No'], { cancel: 1 })) === 0; },
    *note(id) {
      // show a document page by page (marks it read)
      const it = G.ITEMS[id];
      let done = false;
      G.UI.openNote(it, () => { done = true; }, id);
      while (!done) yield;
    },
    // full-screen picture; opts {caption, scale, time (closes by itself), sfx, morph: 'sprite2', morphTime: 2}
    *picture(name, opts) {
      opts = opts || {};
      if (opts.sfx) E.sfx(opts.sfx);
      let done = false;
      G.UI.openPicture(name, opts, () => { done = true; });
      while (!done) yield;
    },
    // a split-second full-screen picture that closes by itself (mirror truths, memories)
    *glimpse(name, opts) {
      yield* E.picture(name, Object.assign({ time: 0.25 }, opts || {}, { glimpse: true }));
    },

    // ---------- movement ----------
    // opts: {sfx, fade, checkpoint: false (scripted sequences: no retry point on arrival)}
    *goto(map, x, y, dir, opts) {
      yield* ex().transfer(map, x, y, dir, opts || {});
    },
    // walk the player along a list of [dx,dy] tile steps or to an absolute tile {x,y}
    *walk(steps, speed) {
      const x = ex(), p = x.p;
      const list = Array.isArray(steps) ? steps : [[steps.x - Math.floor(p.x / TS), steps.y - Math.floor((p.y - 1) / TS)]];
      for (const [dx, dy] of list) {
        if (!dx && !dy) continue;
        const tx = p.x + dx * TS, ty = p.y + dy * TS;
        p.dir = G.dirOf(dx, dy);
        while (Math.hypot(tx - p.x, ty - p.y) > 0.5) {
          const d = Math.hypot(tx - p.x, ty - p.y), s = Math.min(d, (speed || G.PLAYER.speed) * EV.dt);
          p.x += ((tx - p.x) / d) * s;
          p.y += ((ty - p.y) / d) * s;
          if (x.stepPlayer) x.stepPlayer(s); else { p.moving = true; G.walkClock(p, s); }
          yield;
        }
        p.x = tx; p.y = ty;
      }
      p.moving = false;
      p.walkT = null;
    },
    // move an object/NPC by tile steps [[dx,dy],...] at px/s (saved for map objects)
    *move(id, steps, speed) {
      const o = E.obj(id);
      if (!o) return;
      speed = speed || 50;
      // a spawned actor may start off-grid (followerOut): glide onto its tile first
      while (Math.abs(o.offX) + Math.abs(o.offY) > 0.01) {
        const d = Math.hypot(o.offX, o.offY), s = Math.min(d, speed * EV.dt);
        if (o.char) { o.dir = G.dirOf(-o.offX, -o.offY); G.walkClock(o, s); }
        o.offX -= (o.offX / d) * s; o.offY -= (o.offY / d) * s;
        if (Math.hypot(o.offX, o.offY) < 0.01) { o.offX = 0; o.offY = 0; }
        yield;
      }
      for (const [dx, dy] of steps) {
        const n = Math.max(Math.abs(dx), Math.abs(dy));
        if (!n) continue;
        const sx = Math.sign(dx), sy = Math.sign(dy);
        if (o.char || o.pose) { o.dir = G.dirOf(sx, sy); o.setSt('dir', o.dir); }
        for (let k = 0; k < n; k++) {
          let moved = 0;
          while (moved < TS) {
            const s = Math.min(TS - moved, speed * EV.dt);
            moved += s;
            o.offX += sx * s; o.offY += sy * s;
            if (o.char) G.walkClock(o, s * (sx && sy ? Math.SQRT2 : 1));
            yield;
          }
          o.offX = 0; o.offY = 0;
          o.setSt('pos', [o.x + sx, o.y + sy]);
          o.room.refresh();
        }
      }
      o.walkT = null;
      o.room.refresh();
    },
    // move object to absolute tile via BFS (around solid things)
    *moveTo(id, x, y, speed) {
      const o = E.obj(id);
      if (!o) return;
      const path = G.findPath(ex().room, o.x, o.y, x, y, null) || [];
      let cx = o.x, cy = o.y;
      const steps = path.map(([c, r]) => { const s = [c - cx, r - cy]; cx = c; cy = r; return s; });
      yield* E.move(id, steps, speed);
    },

    // ---------- presentation ----------
    sfx: (n, a, b) => G.Audio.sfx(n, a, b),
    music: (n) => (n ? G.Audio.music(n) : G.Audio.stopMusic()),
    // plays a note sequence [['E4', 0.5], [null, 0.25], ...]; returns {stop(), duration}
    tune: (notes, opts) => (G.Audio.tune ? G.Audio.tune(notes, opts) : { stop() {}, duration: 0 }),
    shake: (amt, t) => G.Shake.add(amt || 3, t || 0.3),
    flash(color, t) { ex().flash = { color: color || '#ffffff', t: t || 0.25, age: 0 }; },
    tint(color, alpha) { ex().tint = color ? { color: color, alpha: alpha === undefined ? 0.3 : alpha } : null; },
    dark(v) { ex().darkOverride = v; },
    *fadeOut(t) { yield* ex().fadeTo(1, t || 0.5); },
    *fadeIn(t) { yield* ex().fadeTo(0, t || 0.5); },
    *scare(name, opts) {
      let done = false;
      G.UI.openScare(name, opts || {}, () => { done = true; });
      while (!done) yield;
    },
    *bubble(id, kind, time) {
      ex().bubbles.push({ id: id, kind: kind, t: 0, life: time || 0.9 });
      yield* E.wait(time || 0.9);
    },
    // lights flicker: darkness jumps between values a few times (base: the room's current darkness)
    *flicker(times, to) {
      const x = ex();
      const base = x.darkOverride !== null && x.darkOverride !== undefined ? x.darkOverride : x.mapDark ? x.mapDark() : x.room.def.dark || 0;
      for (let i = 0; i < (times || 4); i++) {
        x.darkOverride = 0.95; G.Audio.sfx('tick');
        yield* E.wait(0.06 + Math.random() * 0.08);
        x.darkOverride = base;
        yield* E.wait(0.08 + Math.random() * 0.2);
      }
      x.darkOverride = to === undefined ? base : to;
    },
    // the current objective (pause menu); id selects the phone hint G.HINTS[id]
    goal(text, id) {
      if (G.TEST && text) {
        const k = id || text;
        if ((!id || !G.HINTS || !G.HINTS[id]) && !G.missingHints.includes(k)) G.missingHints.push(k);
      }
      if (G.S.flags['@goalId'] !== (id || null) || G.S.flags['@goal'] !== text) { G.S.flags['@goalSince'] = G.S.time; G.S.flags['@goalCalls'] = 0; }
      G.S.flags['@goal'] = text; G.S.flags['@goalId'] = id || null;
    },
    // chapter banner (short: the menu's label, default text); also autosaves unless something hunts you
    chapter(text, short) {
      G.S.chapter = text; G.S.chapterShort = short || text;
      ex().banner = { text: text, t: 0 };
      if (!G.Chase.active && !G.TEST) G.saveGame();
    },
    // a speech bubble that does not wait (safe during chases); id may be 'player' or 'follower'
    bubbleNow(id, kind, time) { ex().bubbles.push({ id: id, kind: kind, t: 0, life: time || 0.9 }); },
    // let the chaser and walkers keep moving while this event runs (cutscenes during a chase)
    worldRuns(on) { EV.worldRuns = on !== false; },
    location(text) { ex().banner = { text: text, t: 0, small: true }; },

    // ---------- puzzles (return values) ----------
    *code(opts) { let r; G.UI.openPuzzle('code', opts, (v) => { r = v; }); while (r === undefined) yield; return r; },
    *piano(opts) { let r; G.UI.openPuzzle('piano', opts, (v) => { r = v; }); while (r === undefined) yield; return r; },
    *slider(opts) { let r; G.UI.openPuzzle('slider', opts, (v) => { r = v; }); while (r === undefined) yield; return r; },
    *clock(opts) { let r; G.UI.openPuzzle('clock', opts, (v) => { r = v; }); while (r === undefined) yield; return r; },
    *order(opts) { let r; G.UI.openPuzzle('order', opts, (v) => { r = v; }); while (r === undefined) yield; return r; },
    *pickItem(prompt) { let r; G.UI.openPuzzle('pickItem', { prompt: prompt }, (v) => { r = v; }); while (r === undefined) yield; return r; },

    // ---------- danger ----------
    // E.chase('id') starts G.CHASES[id]: a retry point is taken first, and dying (or loading)
    // restarts the chase from here with cfg.retry overrides. E.chase({...}) runs a one-off chase.
    chase(cfg) {
      if (typeof cfg === 'string') {
        const c = G.CHASES[cfg];
        if (!c) throw new Error('Unknown chase "' + cfg + '" (define G.CHASES.' + cfg + ')');
        G.S.flags['@chase'] = cfg;
        ex().checkpoint();
        G.Chase.start(c, cfg);
        return;
      }
      G.Chase.start(cfg);
    },
    walker(cfg) { G.Chase.walker(cfg); },
    // someone crosses the room from one door to another: {char, from, to, delay, speed, warn, harmless, cause}
    walkBy(cfg) { return G.Chase.walkBy ? G.Chase.walkBy(cfg) : false; },
    ambushReady: (chance, cooldown, max) => G.Chase.ambushReady(chance, cooldown, max),
    // notes read (opened at least once) whose id starts with prefix; mode 'found' counts picked-up notes
    notesCount: (prefix, mode) => G.S.notes.filter((n) => n.startsWith(prefix || '') && (mode === 'found' || G.S.flags['@read:' + n])).length,
    endChase(silent) { G.Chase.stop(silent); },
    *die(cause, opts) { ex().gameOver(cause, opts || {}); for (;;) yield; },
    checkpoint() { ex().checkpoint(); },
    // hide inside object id from its own on() handler (same rules as hide: true objects)
    *hideIn(id) {
      const o = typeof id === 'string' ? E.obj(id) : id;
      if (o) yield* ex().tryHide(E, o);
    },
    // "they move when you are not looking": the lights die, each object steps toward Haru
    // opts {steps: 1, dark: 0.95, time: 0.5, reach: 1, cause: 'guests', sfx: 'tick'}
    *creep(ids, opts) {
      ids = [].concat(ids);
      opts = Object.assign({ steps: 1, dark: 0.95, time: 0.5, reach: 1, cause: 'guests', sfx: 'tick' }, opts || {});
      const x = ex(), room = x.room;
      const prev = x.darkOverride;
      x.darkOverride = opts.dark;
      if (opts.sfx) E.sfx(opts.sfx);
      const [pc, pr] = tileOf(x.p);
      const at = (q, c, r) => c >= q.x && c < q.x + q.w && r >= q.y && r < q.y + q.h;
      for (const id of ids) {
        const o = E.obj(id);
        if (!o || !o.visible) continue;
        const others = (c, r) => ids.some((j) => { if (j === id) return false; const q = E.obj(j); return q && q.visible && at(q, c, r); });
        const path = G.findPath(room, o.x, o.y, pc, pr, others);
        if (!path || !path.length) continue;
        const n = Math.min(opts.steps, opts.reach > 0 ? path.length - 1 : path.length);
        if (n <= 0) continue;
        const [c, r] = path[n - 1];
        o.dir = G.dirOf(c - o.x, r - o.y); o.setSt('dir', o.dir);
        E.place(id, c, r);
      }
      yield* E.wait(opts.time);
      x.darkOverride = prev;
      for (const id of ids) {
        const o = E.obj(id);
        if (!o || !o.visible) continue;
        let d = 1e9;
        for (let r = o.y; r < o.y + o.h; r++) for (let c = o.x; c < o.x + o.w; c++) d = Math.min(d, Math.abs(c - pc) + Math.abs(r - pr));
        if (d <= opts.reach) { yield* E.die(opts.cause); return; }
      }
    },
    *save() {
      if (G.Chase.active) { yield* E.say(G.SAVE_REFUSED || '@haru:scared Not now!'); return; }
      const ok = yield* E.yesno('@ Save your progress?');
      if (ok) { G.saveGame(); G.Audio.sfx('save'); yield* E.say('@ Progress saved.'); }
    },
    *ending(id) {
      G.S.ending = id;
      let done = false;
      ex().ending(id, () => { done = true; });
      while (!done) yield;
    },
  });
})(window.G);
