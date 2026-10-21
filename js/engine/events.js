// Event runner + scripting API.
// Events are generator functions: on: function* (E) { yield* E.say('...'); }
// Every E.* that takes time is a generator used with yield*; queries are plain.
(function (G) {
  'use strict';
  const TS = G.TS;

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
    visited: (map) => !!G.S.flags['@visited:' + map],

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
      // automatic combinations: G.RECIPES = [{needs: [...], gives: 'id', text: '...'}]
      for (const rc of G.RECIPES || []) {
        if (G.S.items.includes(rc.gives) || G.S.flags['@made:' + rc.gives]) continue;
        if (!rc.needs.every((n) => G.S.items.includes(n))) continue;
        for (const n of rc.needs) E.take(n);
        G.S.flags['@made:' + rc.gives] = true;
        yield* E.say(rc.text || '@ The pieces fit together.');
        yield* E.give(rc.gives);
      }
    },
    take(id) { const i = G.S.items.indexOf(id); if (i >= 0) G.S.items.splice(i, 1); },
    hide(id) { const o = E.obj(id); if (o) { G.S.flags[o.key('hidden')] = true; delete G.S.flags[o.key('shown')]; ex().room.refresh(); } },
    show(id) { const o = E.obj(id); if (o) { G.S.flags[o.key('shown')] = true; delete G.S.flags[o.key('hidden')]; ex().room.refresh(); } },
    setSprite(id, name) { const o = E.obj(id); if (o) { G.S.flags[o.key('sprite')] = name; o.update(); } },
    setChar(id, name) { const o = E.obj(id); if (o) { G.S.flags[o.key('char')] = name; o.update(); } },
    face(id, dir) {
      if (id === 'player') { ex().p.dir = dir; return; }
      const o = E.obj(id); if (o) { G.S.flags[o.key('dir')] = dir; o.dir = dir; }
    },
    place(id, x, y) { const o = E.obj(id); if (o) o.setPos(x, y); },

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
      // show a document page by page
      const it = G.ITEMS[id];
      let done = false;
      G.UI.openNote(it, () => { done = true; });
      while (!done) yield;
    },
    *picture(name, opts) {
      let done = false;
      G.UI.openPicture(name, opts || {}, () => { done = true; });
      while (!done) yield;
    },

    // ---------- movement ----------
    *goto(map, x, y, dir, opts) {
      yield* ex().transfer(map, x, y, dir, opts || {});
    },
    // walk the player along a list of [dx,dy] tile steps or to an absolute tile {x,y}
    *walk(steps, speed) {
      const p = ex().p;
      const list = Array.isArray(steps) ? steps : [[steps.x - Math.floor(p.x / TS), steps.y - Math.floor((p.y - 1) / TS)]];
      for (const [dx, dy] of list) {
        const tx = p.x + dx * TS, ty = p.y + dy * TS;
        p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        p.moving = true;
        while (Math.hypot(tx - p.x, ty - p.y) > 0.5) {
          const d = Math.hypot(tx - p.x, ty - p.y), s = Math.min(d, (speed || G.PLAYER.speed) * EV.dt);
          p.x += ((tx - p.x) / d) * s;
          p.y += ((ty - p.y) / d) * s;
          p.walkT += EV.dt;
          yield;
        }
        p.x = tx; p.y = ty;
      }
      p.moving = false;
    },
    // move an object/NPC by tile steps [[dx,dy],...] at px/s
    *move(id, steps, speed) {
      const o = E.obj(id);
      if (!o) return;
      speed = speed || 50;
      for (const [dx, dy] of steps) {
        const n = Math.max(Math.abs(dx), Math.abs(dy));
        const sx = Math.sign(dx), sy = Math.sign(dy);
        if (o.char) o.dir = sx > 0 ? 'right' : sx < 0 ? 'left' : sy > 0 ? 'down' : 'up';
        for (let k = 0; k < n; k++) {
          o.walkT = o.walkT || 0;
          let moved = 0;
          while (moved < TS) {
            const s = Math.min(TS - moved, speed * EV.dt);
            moved += s;
            o.offX += sx * s; o.offY += sy * s;
            o.walkT += EV.dt;
            yield;
          }
          o.offX = 0; o.offY = 0;
          G.S.flags[o.key('pos')] = [o.x + sx, o.y + sy];
          o.update();
        }
      }
      o.walkT = null;
      G.S.flags[o.key('dir')] = o.dir;
      ex().room.refresh();
    },
    // move object to absolute tile via BFS
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
    // lights flicker: darkness jumps between values a few times
    *flicker(times, to) {
      const base = ex().darkOverride !== null && ex().darkOverride !== undefined ? ex().darkOverride : ex().room.def.dark || 0;
      for (let i = 0; i < (times || 4); i++) {
        ex().darkOverride = 0.95; G.Audio.sfx('tick');
        yield* E.wait(0.06 + Math.random() * 0.08);
        ex().darkOverride = base;
        yield* E.wait(0.08 + Math.random() * 0.2);
      }
      ex().darkOverride = to === undefined ? base : to;
    },
    // the protagonist's current objective, shown in the pause menu
    // the current objective (pause menu); id selects the phone hint G.HINTS[id]
    goal(text, id) {
      if (G.S.flags['@goalId'] !== (id || null) || G.S.flags['@goal'] !== text) { G.S.flags['@goalSince'] = G.S.time; G.S.flags['@goalCalls'] = 0; }
      G.S.flags['@goal'] = text; G.S.flags['@goalId'] = id || null;
    },
    // chapter banner; also autosaves (browser tabs get closed) unless something is hunting you
    chapter(text) {
      G.S.chapter = text; ex().banner = { text: text, t: 0 };
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
    chase(cfg) { G.Chase.start(cfg); },
    walker(cfg) { G.Chase.walker(cfg); },
    ambushReady: (chance, cooldown) => G.Chase.ambushReady(chance, cooldown),
    notesCount: (prefix) => G.S.notes.filter((n) => n.startsWith(prefix)).length,
    endChase(silent) { G.Chase.stop(silent); },
    *die(cause, opts) { ex().gameOver(cause, opts || {}); for (;;) yield; },
    checkpoint() { ex().checkpoint(); },
    *save() {
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
