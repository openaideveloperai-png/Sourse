// The chaser: a monster that hunts the player through rooms.
// cfg = {
//   char: 'monster',            character sprite set
//   speed: 58,                  px/s (player walks 62)
//   at: [x, y] | 'behind',      spawn tile in the current room
//   delay: 0.6,                 seconds before it starts moving
//   follow: true,               follows through doors
//   followDelay: 1.6,           seconds after you leave before it appears
//   safe: ['mapId', ...],       rooms it will not follow into
//   duration: null,             seconds until it gives up (null = until lost)
//   loseAfterHide: 5.5,         seconds hidden before it gives up
//   timer: 14,                  after this many seconds, the next room change ends the chase
//   seenText: '...',            game over text when it sees you climb into a hiding spot
//   music: 'hunt',              music while chasing
//   cause: 'monster',           game over cause id
//   onEnd: function* (E) {}     runs when the chase ends normally
// }
(function (G) {
  'use strict';
  const TS = G.TS;
  const Ch = (G.Chase = {
    active: null,
    start(cfg) {
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
      this.active = { cfg: cfg, map: G.S.map, x: x, y: y, dir: 'down', t: 0, delay: cfg.delay === undefined ? 0.6 : cfg.delay, path: null, repath: 0, state: 'hunt', hiddenT: 0, walkT: 0, away: null, searchT: 0 };
      // chain latches work once per chase
      for (const k of Object.keys(G.S.flags)) if (k.indexOf('@latched:') === 0) delete G.S.flags[k];
      G.Audio.music(this.musicName());
      G.Audio.sfx('sting');
    },
    musicName() { const a = this.active; return (a && a.cfg.music) || 'hunt'; },
    stop(silent) {
      const a = this.active;
      this.active = null;
      G.S.flags['@lastChase'] = G.S.time;
      if (!silent) G.Audio.music(G.EX.room.def.music || null);
      if (a && a.cfg.onEnd) G.EV.run(a.cfg.onEnd);
    },
    // called by the explore scene when the player changes rooms
    onTransfer(fromMap, toMap, arrive) {
      const a = this.active;
      if (!a) return;
      const cfg = a.cfg;
      if (!cfg.follow || (cfg.safe && cfg.safe.includes(toMap))) {
        if (a.map === fromMap) { this.stop(); }
        return;
      }
      // Ao Oni rule: once the timer has run out, changing rooms ends the chase
      if (cfg.timer && a.t >= cfg.timer) { this.vanish(true); return; }
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
      a.map = null;
      G.Audio.sfx('keys');
    },
    // the player chains a door shut behind them: buys time while he works through his keys
    latch(extra) {
      const a = this.active;
      if (!a || !a.away) return false;
      a.away.t += extra || 5;
      G.Audio.sfx('latch');
      return true;
    },
    update(dt) {
      const a = this.active;
      if (!a) return;
      const ex = G.EX, p = ex.p, cfg = a.cfg;
      a.t += dt;
      if (cfg.duration && a.t > cfg.duration) { this.vanish(); return; }
      // in transit to the player's room
      if (a.away) {
        a.away.t -= dt;
        if (a.away.t <= 0 && a.away.map === G.S.map) {
          a.map = G.S.map; a.x = a.away.x; a.y = a.away.y; a.away = null; a.delay = cfg.arriveDelay === undefined ? 0.5 : cfg.arriveDelay;
          a.latched = {};
          G.Audio.sfx('door');
        } else if (a.away.map !== G.S.map) a.away.map = G.S.map; // player moved on again
        return;
      }
      if (a.map !== G.S.map) return;
      if (a.delay > 0) { a.delay -= dt; return; }
      const room = ex.room;
      // hiding
      if (p.hidden) {
        a.hiddenT += dt;
        a.state = 'search';
        a.searchT += dt;
        // wander a little near where it lost you
        if (!a.path || a.path.length === 0) {
          const c = Math.floor(a.x / TS), r = Math.floor((a.y - 2) / TS);
          const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !room.isSolid(c + dx, r + dy));
          if (opts.length) { const o = opts[Math.floor(G.hash(Math.floor(a.t * 3), c, r) * opts.length)]; a.path = [[c + o[0], r + o[1]]]; }
        }
        // he is in the room: breathing, heartbeat, keys when he is close
        a.hideBeat = (a.hideBeat || 0) - dt;
        if (a.hideBeat <= 0) { a.hideBeat = 0.8; G.Audio.sfx('heartbeat', 0.45); }
        if (!a.breathed) { a.breathed = true; G.Audio.sfx('breath'); }
        if (Math.hypot(p.x - a.x, p.y - a.y) < TS * 2) { a.closeKeys = (a.closeKeys || 0) - dt; if (a.closeKeys <= 0) { a.closeKeys = 1.1; G.Audio.sfx('keys', 0.8); } }
        if (a.hiddenT > (cfg.loseAfterHide || 5.5)) { this.vanish(true); return; }
      } else {
        a.state = 'hunt';
        a.hiddenT = 0; a.breathed = false;
        a.repath -= dt;
        if (a.repath <= 0) {
          a.repath = 0.2;
          const c = Math.floor(a.x / TS), r = Math.floor((a.y - 2) / TS);
          const pc = Math.floor(p.x / TS), pr = Math.floor((p.y - 2) / TS);
          a.path = G.findPath(room, c, r, pc, pr) || [];
        }
      }
      // follow the path
      const sp = (cfg.speed || 58) * (a.state === 'search' ? 0.5 : 1);
      if (a.path && a.path.length) {
        const [tc, tr] = a.path[0];
        const tx = tc * TS + 8, ty = tr * TS + 14;
        const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
        if (d < 1) { a.path.shift(); }
        else {
          const s = Math.min(d, sp * dt);
          a.x += (dx / d) * s; a.y += (dy / d) * s;
          a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
          a.walkT += dt;
        }
      } else if (!p.hidden) {
        // same tile: close in directly
        const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
        if (d > 0.5) { a.x += (dx / d) * Math.min(d, sp * dt); a.y += (dy / d) * Math.min(d, sp * dt); }
      }
      // footsteps and keys, louder as he gets closer
      const dist = Math.hypot(p.x - a.x, p.y - a.y);
      const vol = G.clamp(1.2 - dist / 160, 0.15, 1);
      a.stepT = (a.stepT || 0) - dt;
      if (a.stepT <= 0) { a.stepT = 0.36; a.stepN = (a.stepN || 0) + 1; G.Audio.sfx('thud', 0.6 * vol); if (a.stepN % 2 === 0 && cfg.keys !== false) G.Audio.sfx('keys', vol * 0.7); }
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
    // ---- walkers: a figure that walks a fixed path; touching it is death ----
    walkers: [],
    walker(cfg) {
      const pts = cfg.path.map(([x, y]) => [x * TS + 8, y * TS + 14]);
      this.walkers.push({ cfg: cfg, map: G.S.map, pts: pts, i: 1, x: pts[0][0], y: pts[0][1], dir: 'down', walkT: 0, wait: cfg.delay || 0 });
      if (cfg.sound !== false) G.Audio.sfx('keys');
    },
    updateWalkers(dt) {
      const p = G.EX.p;
      for (let k = this.walkers.length - 1; k >= 0; k--) {
        const w = this.walkers[k];
        if (w.map !== G.S.map) { this.walkers.splice(k, 1); continue; }
        if (w.wait > 0) { w.wait -= dt; continue; }
        const t = w.pts[w.i];
        if (!t) { this.walkers.splice(k, 1); if (w.cfg.onEnd) G.EV.run(w.cfg.onEnd); continue; }
        const dx = t[0] - w.x, dy = t[1] - w.y, d = Math.hypot(dx, dy);
        if (d < 1) { w.i++; continue; }
        const s = Math.min(d, (w.cfg.speed || 45) * dt);
        w.x += (dx / d) * s; w.y += (dy / d) * s;
        w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        w.walkT += dt;
        if (!p.hidden && Math.abs(p.x - w.x) < 8 && Math.abs(p.y - w.y) < 7) {
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
        if (w.map !== G.S.map) continue;
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
