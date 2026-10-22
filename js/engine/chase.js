// The chaser: a monster that hunts the player through rooms.
// cfg = {
//   char: 'monster',            character sprite set
//   speed: 58,                  px/s (player walks 62)
//   at: [x, y] | 'behind',      spawn tile in the current room
//   delay: 0.6,                 seconds before it starts moving
//   follow: true,               follows through doors
//   followDelay: 1.6,           seconds after you leave before it appears
//   arriveDelay: 0.5,           seconds it pauses in the doorway after arriving
//   safe: ['mapId', ...],       rooms it will not follow into (entering one ends the chase)
//   duration: null,             seconds until it gives up (null = until lost)
//   loseAfterHide: 5.5,         seconds hidden before it gives up
//   timer: 14,                  after this many seconds, the next room change ends the chase
//   timerFrom: 'transfer',      optional: the timer starts at the first room change
//   hearHide: 2.5,              hiding less than this before he comes through the door: he heard it
//   heardText: '...',           game over text for that
//   seenText: '...',            game over text when it sees you climb into a hiding spot
//   music: 'hunt',              music while chasing
//   cause: 'monster',           game over cause id
//   scare: 'name',              game over scare (default: char)
//   retry: {at, delay},         registry chases (G.CHASES[id]): overrides when restarted after a retry
//   onEnd: function* (E) {}     runs when the chase ends normally
// }
(function (G) {
  'use strict';
  const TS = G.TS;
  G.CHASES = G.CHASES || {};
  const Ch = (G.Chase = {
    active: null,
    start(cfg, id) {
      const ex = G.EX, room = ex.room, p = ex.p;
      let x, y;
      if (Array.isArray(cfg.at)) { x = cfg.at[0] * TS + 8; y = cfg.at[1] * TS + 14; }
      else {
        // behind the player: the farthest walkable tile within 5 tiles, opposite to facing
        const back = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[p.dir] || [0, 1];
        let c = Math.floor(p.x / TS), r = Math.floor((p.y - 2) / TS);
        for (let i = 0; i < 4 && !room.isSolid(c + back[0], r + back[1]); i++) { c += back[0]; r += back[1]; }
        x = c * TS + 8; y = r * TS + 14;
      }
      if (id) G.S.flags['@chase'] = id; else delete G.S.flags['@chase'];
      this.active = {
        cfg: cfg, id: id || null, map: G.S.map, x: x, y: y, dir: cfg.dir || 'down', t: 0, tt: cfg.timerFrom === 'transfer' ? null : 0,
        delay: cfg.delay === undefined ? 0.6 : cfg.delay, path: null, repath: 0, state: 'hunt', hiddenT: 0, walkT: null, away: null, searchT: 0,
      };
      // chain latches work once per chase
      for (const k of Object.keys(G.S.flags)) if (k.indexOf('@latched:') === 0) delete G.S.flags[k];
      G.Audio.music(this.musicName());
      G.Audio.sfx('sting');
    },
    // restart a registry chase after a retry / load (called by the explore scene after the fade-in)
    resume(id) {
      const c = G.CHASES[id];
      if (!c) { console.warn('unknown chase ' + id); delete G.S.flags['@chase']; return false; }
      const cfg = Object.assign({}, c, c.retry || {});
      if (!c.retry || c.retry.delay === undefined) cfg.delay = 1.5;
      G.Audio.sfx('keys');
      this.start(cfg, id);
      return true;
    },
    musicName() { const a = this.active; return (a && a.cfg.music) || 'hunt'; },
    stop(silent) {
      const a = this.active;
      this.active = null;
      delete G.S.flags['@chase'];
      G.S.flags['@lastChase'] = G.S.time;
      if (!silent && G.EX && G.EX.room) G.Audio.music((G.EX.mapVal ? G.EX.mapVal('music') : G.EX.room.def.music) || null);
      if (a && a.cfg.onEnd) G.EV.run(a.cfg.onEnd);
    },
    // Tama's warning: a chirp and a "!" over the cat when he starts to follow
    warn() {
      if (G.S.flags.follower !== 'tama' || G.S.flags['@followerOut']) return;
      if (G.EX && G.EX.room && G.EX.room.def.follower === false) return;
      G.Audio.sfx('chirp');
      G.EV.api.bubbleNow('follower', '!', 1.2);
    },
    // called by the explore scene when the player changes rooms
    onTransfer(fromMap, toMap, arrive) {
      const a = this.active;
      if (!a) return;
      const cfg = a.cfg;
      // he does not follow (or not into this room): the chase ends, even if he was already on his way
      if (!cfg.follow || (cfg.safe && cfg.safe.includes(toMap))) {
        if (a.map === fromMap || a.away) this.vanish(true);
        return;
      }
      // Ao Oni rule: once the timer has run out, changing rooms ends the chase
      if (cfg.timer && a.tt !== null && a.tt >= cfg.timer) { this.vanish(true); return; }
      if (a.tt === null) a.tt = 0; // timerFrom: 'transfer'
      const fd = cfg.followDelay === undefined ? 1.6 : cfg.followDelay;
      // already on his way: doubling back toward him does not reset the timer (no door-dancing)
      if (a.away) {
        const back = toMap === a.away.from;
        a.away.map = toMap; a.away.from = fromMap; a.away.x = arrive.x; a.away.y = arrive.y;
        a.away.t = back ? Math.min(a.away.t, 0.5) : Math.min(a.away.t + 0.5, fd);
        G.Audio.sfx('keys');
        return;
      }
      a.away = { map: toMap, from: fromMap, x: arrive.x, y: arrive.y, t: fd };
      a.map = null; a.heard = null; a.path = null; a.walkT = null;
      G.Audio.sfx('keys');
      this.warn();
    },
    // the player chains a door shut behind them: buys time while he works through his keys
    latch(extra) {
      const a = this.active;
      if (!a || !a.away) return false;
      a.away.t += extra || 5;
      G.Audio.sfx('latch');
      return true;
    },
    // walk along a.path ([[c, r], ...] tile centres) at sp px/s; the step carries on through
    // corners in the same frame, so speed and the walk cycle stay continuous. Returns px moved.
    walkPath(a, sp, dt) {
      let budget = sp * dt, moved = 0;
      while (budget > 1e-6 && a.path && a.path.length) {
        const [tc, tr] = a.path[0];
        const dx = tc * TS + 8 - a.x, dy = tr * TS + 14 - a.y, d = Math.hypot(dx, dy);
        if (d < 0.01) { a.path.shift(); continue; }
        const s = Math.min(d, budget);
        a.x += (dx / d) * s; a.y += (dy / d) * s;
        a.dir = G.dirOf(dx, dy);
        budget -= s; moved += s;
        if (s >= d - 1e-6) a.path.shift();
      }
      return moved;
    },
    approach(a, tx, ty, sp, dt) {
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
      if (d <= 0.5) return 0;
      const s = Math.min(d, sp * dt);
      a.x += (dx / d) * s; a.y += (dy / d) * s;
      if (d > 2) a.dir = G.dirOf(dx, dy);
      return s;
    },
    update(dt) {
      const a = this.active;
      if (!a) return;
      const ex = G.EX, p = ex.p, cfg = a.cfg;
      a.t += dt;
      if (a.tt !== null) a.tt += dt;
      if (cfg.duration && a.t > cfg.duration) { this.vanish(); return; }
      // in transit to the player's room (onTransfer keeps a.away.map on the player's room)
      if (a.away) {
        a.away.t -= dt;
        if (a.away.t <= 0 && a.away.map === G.S.map) {
          a.map = G.S.map; a.x = a.away.x; a.y = a.away.y; a.away = null; a.delay = cfg.arriveDelay === undefined ? 0.5 : cfg.arriveDelay;
          a.path = null; a.repath = 0;
          G.Audio.sfx('door');
          // he heard the closet: hiding right behind a door only works if the door holds him back (latch)
          const hh = cfg.hearHide === undefined ? 2.5 : cfg.hearHide;
          if (p.hidden && p.hideObj && G.S.time - (p.hideAt === undefined ? -1e9 : p.hideAt) < hh) { a.heard = p.hideObj; a.goal = null; }
        }
        return;
      }
      if (a.map !== G.S.map) return;
      if (a.delay > 0) { a.delay -= dt; a.walkT = null; return; }
      const room = ex.room;
      const c = Math.floor(a.x / TS), r = Math.floor((a.y - 2) / TS);
      if (a.heard && !p.hidden) { a.heard = null; a.path = null; a.repath = 0; }
      let moved = 0;
      if (a.heard) {
        // straight to the hiding spot he heard, then he opens it
        a.state = 'heard';
        a.repath -= dt;
        if (!a.goal || a.repath <= 0) {
          a.repath = 0.5;
          a.goal = G.frontTile(room, a.heard, c, r) || [c, r];
          a.path = c === a.goal[0] && r === a.goal[1] ? [] : G.findPath(room, c, r, a.goal[0], a.goal[1]);
          if (!a.path) { a.heard = null; a.path = []; }
        }
        if (a.heard) {
          const gx = a.goal[0] * TS + 8, gy = a.goal[1] * TS + 14;
          moved = a.path.length ? this.walkPath(a, cfg.speed || 58, dt) : this.approach(a, gx, gy, cfg.speed || 58, dt);
          if (!a.path.length && Math.hypot(gx - a.x, gy - a.y) < 1) {
            const o = a.heard;
            a.dir = G.dirOf(o.x * TS + (o.w * TS) / 2 - a.x, o.y * TS + o.h * TS - 2 - a.y);
            this.active = null;
            G.Audio.sfx('closet');
            ex.gameOver(cfg.cause || 'monster', { scare: cfg.scare || cfg.char, text: cfg.heardText || 'He heard the closet door close.' });
            return;
          }
        }
      }
      if (!a.heard && p.hidden) {
        a.hiddenT += dt;
        a.state = 'search';
        a.searchT += dt;
        // wander a little near where it lost you
        if (!a.path || a.path.length === 0) {
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !room.isSolid(c + dx, r + dy));
          if (opts.length) { const o = opts[Math.floor(G.hash(Math.floor(a.t * 3), c, r) * opts.length)]; a.path = [[c + o[0], r + o[1]]]; }
        }
        // he is in the room: breathing, heartbeat, keys when he is close
        a.hideBeat = (a.hideBeat || 0) - dt;
        if (a.hideBeat <= 0) { a.hideBeat = 0.8; G.Audio.sfx('heartbeat', 0.45); }
        if (!a.breathed) { a.breathed = true; G.Audio.sfx('breath'); }
        if (Math.hypot(p.x - a.x, p.y - a.y) < TS * 2) { a.closeKeys = (a.closeKeys || 0) - dt; if (a.closeKeys <= 0) { a.closeKeys = 1.1; G.Audio.sfx('keys', 0.8); } }
        if (a.hiddenT > (cfg.loseAfterHide || 5.5)) { this.vanish(true); return; }
        moved = this.walkPath(a, (cfg.speed || 58) * 0.5, dt);
      } else if (!a.heard) {
        a.state = 'hunt';
        a.hiddenT = 0; a.breathed = false;
        a.repath -= dt;
        if (a.repath <= 0) {
          a.repath = 0.2;
          const pc = Math.floor(p.x / TS), pr = Math.floor((p.y - 2) / TS);
          a.path = G.findPath(room, c, r, pc, pr) || [];
        }
        // same tile: close in directly
        moved = a.path && a.path.length ? this.walkPath(a, cfg.speed || 58, dt) : this.approach(a, p.x, p.y, cfg.speed || 58, dt);
      }
      // walk cycle by distance; footsteps (and keys) land on his steps, louder as he gets closer
      const dist = Math.hypot(p.x - a.x, p.y - a.y);
      const vol = G.clamp(1.2 - dist / 160, 0.15, 1);
      if (G.walkClock(a, moved)) {
        a.stepN = (a.stepN || 0) + 1;
        G.Audio.sfx('thud', 0.6 * vol * (a.state === 'search' ? 0.6 : 1));
        if (a.stepN % 2 === 0 && cfg.keys !== false) G.Audio.sfx('keys', vol * 0.7);
      }
      // caught?
      if (!p.hidden && Math.abs(p.x - a.x) < 9 && Math.abs(p.y - a.y) < 8) {
        const cause = cfg.cause || 'monster';
        this.active = null;
        ex.gameOver(cause, { scare: cfg.scare || cfg.char });
      }
    },
    vanish(lost) {
      const a = this.active;
      if (!a) return;
      if (lost) G.Audio.sfx('steps_away');
      this.stop();
    },
    // called when the player tries to hide: caught if the monster is close and in the same room
    seesHiding() {
      const a = this.active;
      if (!a || a.map !== G.S.map || a.away) return false;
      const p = G.EX.p;
      return Math.hypot(p.x - a.x, p.y - a.y) < TS * 3.2;
    },
    // ---- walkers: a figure that walks a fixed path; touching it is death (unless harmless) ----
    // cfg {char, path: [[x, y], ...], speed: 45, delay: 0, cause, scare, harmless, onEnd,
    //      appear: true (invisible until the delay is over), doors: true (door sound at both ends)}
    walkers: [],
    walker(cfg) {
      const pts = cfg.path.map(([x, y]) => [x * TS + 8, y * TS + 14]);
      const w = { cfg: cfg, map: G.S.map, pts: pts, i: 1, x: pts[0][0], y: pts[0][1], dir: 'down', walkT: null, wait: cfg.delay || 0, shown: !cfg.appear };
      if (pts[1]) w.dir = G.dirOf(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
      this.walkers.push(w);
      if (cfg.sound !== false) G.Audio.sfx('keys');
      if (!cfg.appear && cfg.doors) G.Audio.sfx('door');
      return w;
    },
    // someone crosses the room between two doors (or tiles): E.walkBy({char, from, to, delay: 2.5,
    // speed: 46, warn: true, harmless: false, cause, scare, onEnd}). Door ids resolve to the free
    // tile in front of the door. Returns false if there is no way between them.
    walkBy(cfg) {
      const room = G.EX.room;
      const end = (v) => {
        if (Array.isArray(v)) return v;
        const o = room.obj(v);
        return o ? G.frontTile(room, o) : null;
      };
      const a = end(cfg.from), b = end(cfg.to);
      if (!a || !b) { console.warn('walkBy: no such door/tile', cfg.from, cfg.to); return false; }
      const path = a[0] === b[0] && a[1] === b[1] ? [] : G.findPath(room, a[0], a[1], b[0], b[1]);
      if (!path) { console.warn('walkBy: no way from', cfg.from, 'to', cfg.to); return false; }
      this.walker({
        char: cfg.char || 'caretaker', path: [a].concat(path), speed: cfg.speed || 46, delay: cfg.delay === undefined ? 2.5 : cfg.delay,
        harmless: !!cfg.harmless, cause: cfg.cause, scare: cfg.scare, onEnd: cfg.onEnd, appear: true, doors: true, sound: false,
      });
      if (cfg.warn !== false) this.warn();
      return true;
    },
    updateWalkers(dt) {
      const p = G.EX.p;
      for (let k = this.walkers.length - 1; k >= 0; k--) {
        const w = this.walkers[k];
        if (w.map !== G.S.map) { this.walkers.splice(k, 1); continue; }
        if (w.wait > 0) { w.wait -= dt; if (w.wait > 0) continue; }
        if (!w.shown) { w.shown = true; if (w.cfg.doors) G.Audio.sfx('door'); }
        if (!w.pts[w.i]) {
          this.walkers.splice(k, 1);
          if (w.cfg.doors) G.Audio.sfx('door');
          if (w.cfg.onEnd) G.EV.run(w.cfg.onEnd);
          continue;
        }
        // constant speed through the corners of the path
        let budget = (w.cfg.speed || 45) * dt, s = 0;
        while (budget > 1e-6 && w.pts[w.i]) {
          const t = w.pts[w.i];
          const dx = t[0] - w.x, dy = t[1] - w.y, d = Math.hypot(dx, dy);
          if (d < 0.01) { w.i++; continue; }
          const m = Math.min(d, budget);
          w.x += (dx / d) * m; w.y += (dy / d) * m;
          w.dir = G.dirOf(dx, dy);
          budget -= m; s += m;
          if (m >= d - 1e-6) w.i++;
        }
        if (G.walkClock(w, s) && w.cfg.steps !== false) G.Audio.sfx('thud', 0.3 * G.clamp(1.2 - Math.hypot(p.x - w.x, p.y - w.y) / 160, 0.15, 1));
        if (!w.cfg.harmless && !p.hidden && Math.abs(p.x - w.x) < 8 && Math.abs(p.y - w.y) < 7) {
          this.walkers = [];
          G.EX.gameOver(w.cfg.cause || 'monster', { scare: w.cfg.scare || w.cfg.char });
          return;
        }
      }
    },
    // ---- rationed ambush: returns true at most once per cooldown, with a chance ----
    // never in tests, at most `max` per game (default 3), never within 30 s of a retry or load
    lastAmbush: -1e9,
    ambushReady(chance, cooldown, max) {
      if (G.TEST || this.active || this.walkers.length) return false;
      if ((G.S.flags['@ambushes'] || 0) >= (max || 3)) return false;
      if (G.S.time - (G.lastLoadTime || -1e9) < 30) return false;
      if (G.S.time - Math.max(this.lastAmbush, G.S.flags['@lastChase'] || -1e9) < (cooldown || 240)) return false;
      if (Math.random() > (chance === undefined ? 0.4 : chance)) return false;
      this.lastAmbush = G.S.time;
      G.S.flags['@ambushes'] = (G.S.flags['@ambushes'] || 0) + 1;
      return true;
    },
    // a dim cold light around him in very dark rooms, so he is seen before he is on you
    lights(ox, oy, dark, out) {
      const a = this.active;
      if (!a || a.map !== G.S.map || a.away || dark < 0.7) return;
      out.push({ x: a.x + ox, y: a.y - 14 + oy, r: 24, col: '#7a8a9a', glow: 0.12, i: 0.8 });
    },
    draw(ctx, list) {
      for (const w of this.walkers) {
        if (w.map !== G.S.map || !w.shown) continue;
        list.push({ y: w.y, draw: (c, ox, oy) => {
          c.fillStyle = 'rgba(8,4,14,0.45)'; c.fillRect(Math.round(ox + w.x - 7), Math.round(oy + w.y - 2), 14, 3);
          G.drawChar(c, w.cfg.char, ox + w.x, oy + w.y, w.dir, w.walkT);
        } });
      }
      const a = this.active;
      if (!a || a.map !== G.S.map || a.away) return;
      const cfg = a.cfg;
      list.push({ y: a.y, draw: (c, ox, oy) => {
        c.fillStyle = 'rgba(8,4,14,0.45)';
        c.fillRect(Math.round(ox + a.x - 7), Math.round(oy + a.y - 2), 14, 3);
        G.drawChar(c, cfg.char, ox + a.x, oy + a.y, a.dir, a.walkT);
      } });
    },
  });
})(window.G);
