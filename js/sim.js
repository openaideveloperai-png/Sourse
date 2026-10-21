// Simulation: level parsing, tiles, hazards, player movement and death checks.
// Pure logic with no DOM access so tools/solve.js can run it in Node.
(function (G) {
  'use strict';
  const TS = G.TS, COLS = G.COLS, ROWS = G.ROWS;
  const LW = COLS * TS, LH = ROWS * TS;
  G.LW = LW;
  G.LH = LH;

  // ---------------- player constants ----------------
  // Position (x,y) is the point between the feet.
  const PL = (G.PLAYER = {
    speed: 70, // px per second
    // box used against walls
    wl: -4, wr: 4, wt: -5, wb: 0,
    // box used against hazards (lower body)
    hl: -4, hr: 4, ht: -11, hb: 0,
    idleTime: 2.0, // seconds of standing still before the knight comes
    idleRadius: 8,
    knightWarn: 1.0,
    knightSpeed: 330,
  });

  // ---------------- tiles ----------------
  // Solid props / walls
  const PROPS = {
    T: 'tree', r: 'rock', n: 'sign', B: 'barrel', l: 'lamp', g: 'grave', P: 'pillar',
    V: 'vending', f: 'fence', W: 'statue', Q: 'crystal', h: 'house', C: 'crate', U: 'bush', A: 'altar',
  };
  G.PROPS = PROPS;
  function info(ch) {
    if (ch === '#' || ch === 'i' || ch === 'h') return { solid: true, wall: true, torch: ch === 'i', house: ch === 'h' };
    if (PROPS[ch]) return { solid: true, prop: PROPS[ch] };
    if (ch === 'v') return { pit: true };
    if (ch === '~') return { water: true };
    if (ch === 'L') return { lava: true };
    if (ch === 'x') return { trap: 1 };
    if (ch === 'c') return { trap: 2 };
    if (ch >= '1' && ch <= '9') return { spikes: +ch };
    return { floor: true };
  }
  G.tileInfo = info;

  // ---------------- hazards ----------------
  // Every hazard exposes shapes(t, out) -> pushes {k:0,x,y,r} circles or {k:1,x,y,w,h} rects
  // and state(t) for drawing. Coordinates are level pixels.
  const tc = (v) => v * TS + TS / 2; // tile coordinate -> pixel center

  function pathLen(pts) {
    let L = 0;
    for (let i = 0; i + 1 < pts.length; i++) L += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    return L;
  }
  function pointAt(pts, s) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (s <= L || i === pts.length - 2) {
        const u = L ? G.clamp(s / L, 0, 1) : 0;
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, b[0] - a[0], b[1] - a[1]];
      }
      s -= L;
    }
    const p = pts[pts.length - 1];
    return [p[0], p[1], 0, 0];
  }

  const H = {};
  // Moves along points. mode 'ping' goes back and forth, 'loop' returns to the start.
  H.patrol = function (d) {
    const pts = d.pts.map((p) => [tc(p[0]), tc(p[1])]);
    if (d.mode === 'loop') pts.push(pts[0].slice());
    const L = pathLen(pts);
    const speed = (d.speed || 3) * TS;
    const cycle = d.mode === 'loop' ? L : 2 * L;
    const r = d.r || 5;
    return {
      kind: 'patrol', skin: d.skin || 'slime', death: d.death, r: r, period: cycle / speed,
      state(t) {
        let s = G.mod((d.phase || 0) * cycle + speed * t, cycle);
        let back = false;
        if (d.ease) {
          // smooth turnarounds: s follows a sine
          const u = s / cycle;
          s = d.mode === 'loop' ? u * L : ((1 - Math.cos(u * Math.PI * 2)) / 2) * L;
          back = d.mode !== 'loop' && u > 0.5;
        } else if (d.mode !== 'loop' && s > L) { s = 2 * L - s; back = true; }
        const p = pointAt(pts, s);
        let dx = p[2], dy = p[3];
        if (back) { dx = -dx; dy = -dy; }
        return { x: p[0], y: p[1], dx: dx, dy: dy };
      },
      shapes(t, out) {
        const s = this.state(t);
        out.push({ k: 0, x: s.x, y: s.y, r: r });
      },
    };
  };
  // Circles around a center. n orbiters spread evenly.
  H.orbit = function (d) {
    const cx = tc(d.cx), cy = tc(d.cy), R = d.R * TS, r = d.r || 5, n = d.n || 1;
    return {
      kind: 'orbit', skin: d.skin || 'wisp', death: d.death, r: r, cx: cx, cy: cy, R: R, period: d.period,
      state(t) {
        const a0 = ((d.phase || 0) + ((d.dir || 1) * t) / d.period) * Math.PI * 2;
        const list = [];
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / n) * Math.PI * 2;
          list.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, a: a });
        }
        return { list: list };
      },
      shapes(t, out) {
        for (const p of this.state(t).list) out.push({ k: 0, x: p.x, y: p.y, r: r });
      },
    };
  };
  // Rotating bar of fireballs (arms 1, 2, 3 or 4)
  H.bar = function (d) {
    const cx = tc(d.cx), cy = tc(d.cy), r = d.r || 4, n = d.n || 4, gap = d.gap || 9, arms = d.arms || 1, start = d.start || 0;
    return {
      kind: 'bar', skin: d.skin || 'fire', death: d.death || 'burn', r: r, cx: cx, cy: cy, period: d.period,
      state(t) {
        const a0 = ((d.phase || 0) + ((d.dir || 1) * t) / d.period) * Math.PI * 2;
        const list = [];
        for (let k = 0; k < arms; k++) {
          const a = a0 + (k / arms) * Math.PI * 2;
          for (let i = 0; i < n; i++) {
            const R = start + i * gap;
            list.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, i: i });
          }
        }
        return { list: list, a: a0 };
      },
      shapes(t, out) {
        for (const p of this.state(t).list) out.push({ k: 0, x: p.x, y: p.y, r: r });
      },
    };
  };
  // Pendulum: hangs from pivot, swings by amp radians.
  H.swing = function (d) {
    const cx = tc(d.cx), cy = tc(d.cy), L = d.L * TS, r = d.r || 7;
    return {
      kind: 'swing', skin: d.skin || 'blade', death: d.death || 'slash', r: r, cx: cx, cy: cy, period: d.period,
      state(t) {
        const a = (d.amp || 1) * Math.sin(((d.phase || 0) + t / d.period) * Math.PI * 2) + (d.base || 0);
        return { x: cx + Math.sin(a) * L, y: cy + Math.cos(a) * L, a: a };
      },
      shapes(t, out) {
        const s = this.state(t);
        out.push({ k: 0, x: s.x, y: s.y, r: r });
      },
    };
  };
  // A lane of vehicles that wrap around the screen (carriages, crows).
  H.lane = function (d) {
    const len = d.len || 34, h = d.h || 12;
    const margin = len + 24;
    const span = LW + margin * 2;
    const n = d.n || 3;
    const spacing = span / n;
    const v = (d.speed || 3) * TS * (d.dir || 1);
    const slots = d.slots || null; // e.g. [1,0,1] which slots hold a vehicle
    const y = tc(d.row) + (d.dy || 0);
    return {
      kind: 'lane', skin: d.skin || 'carriage', death: d.death || 'crush', dir: d.dir || 1, len: len, h: h, y: y,
      period: span / Math.abs(v),
      state(t) {
        const list = [];
        for (let i = 0; i < n; i++) {
          if (slots && !slots[i % slots.length]) continue;
          const x = G.mod((d.offset || 0) * TS + i * spacing + v * t, span) - margin;
          list.push({ x: x, y: y, i: i });
        }
        return { list: list };
      },
      shapes(t, out) {
        for (const p of this.state(t).list) out.push({ k: 1, x: p.x - len / 2 + 2, y: y - h / 2, w: len - 4, h: h });
      },
    };
  };
  // Wall turret that fires arrows until they hit a wall.
  H.arrow = function (d, lvl) {
    const dirs = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
    const [dx, dy] = dirs[d.dir];
    const ox = tc(d.c) + dx * 8, oy = tc(d.r) + dy * 8 + (dy === 0 ? (d.dy || 0) : 0);
    // travel distance until a solid tile
    let dist = 0;
    for (;;) {
      const px = ox + dx * (dist + 2), py = oy + dy * (dist + 2);
      const c = Math.floor(px / TS), r = Math.floor(py / TS);
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS || lvl.solidAt(c, r)) break;
      dist += 2;
      if (dist > 1000) break;
    }
    const speed = (d.speed || 6) * TS;
    const life = dist / speed;
    return {
      kind: 'arrow', skin: 'arrow', death: 'arrow', dx: dx, dy: dy, ox: ox, oy: oy, tc: d.c, tr: d.r, period: d.period,
      state(t) {
        const list = [];
        const ph = (d.phase || 0) * d.period;
        const kNow = Math.floor((t - ph) / d.period);
        for (let k = kNow; k >= kNow - Math.ceil(life / d.period) - 1; k--) {
          const ft = ph + k * d.period;
          const age = t - ft;
          if (age < 0 || age > life + 0.25) continue;
          const s = Math.min(age, life) * speed;
          list.push({ x: ox + dx * s, y: oy + dy * s, stuck: age > life, age: age });
        }
        // charge = how close the next shot is (for the turret glow)
        const charge = 1 - G.mod(t - ph, d.period) / d.period;
        return { list: list, charge: charge };
      },
      shapes(t, out) {
        for (const a of this.state(t).list) {
          if (a.stuck) continue;
          if (dx) out.push({ k: 1, x: a.x - 5, y: a.y - 2, w: 10, h: 4 });
          else out.push({ k: 1, x: a.x - 2, y: a.y - 5, w: 4, h: 10 });
        }
      },
    };
  };
  // Falling rock with a growing shadow first.
  H.rock = function (d) {
    const x = tc(d.c), y = tc(d.r), fall = d.fall || 1.0, hit = 0.14, r = d.size || 10;
    return {
      kind: 'rock', skin: d.skin || 'rock', death: 'crush', x: x, y: y, fall: fall, period: d.period,
      state(t) {
        const lt = G.mod(t - (d.phase || 0) * d.period, d.period);
        return { lt: lt, u: lt / fall, landed: lt >= fall, deadly: lt >= fall && lt < fall + hit };
      },
      shapes(t, out) {
        if (this.state(t).deadly) out.push({ k: 0, x: x, y: y, r: r });
      },
    };
  };
  // A fake shard that bites.
  H.mimic = function (d) {
    const x = tc(d.c), y = tc(d.r);
    return {
      kind: 'mimic', skin: 'mimic', death: 'chomp', x: x, y: y,
      state() { return { x: x, y: y }; },
      shapes(t, out) { out.push({ k: 0, x: x, y: y, r: 5 }); },
    };
  };
  // Static deadly circle (fake exit etc.)
  H.static = function (d) {
    const x = tc(d.c), y = tc(d.r), r = d.r2 || 6;
    return {
      kind: 'static', skin: d.skin, death: d.death || 'grab', x: x, y: y,
      state() { return { x: x, y: y }; },
      shapes(t, out) { out.push({ k: 0, x: x, y: y, r: r }); },
    };
  };
  G.HAZ = H;

  // ---------------- level ----------------
  G.parseLevel = function (def) {
    const rows = def.map;
    if (rows.length !== ROWS) throw new Error(def.id + ': map needs ' + ROWS + ' rows, has ' + rows.length);
    rows.forEach((row, i) => {
      if (row.length !== COLS) throw new Error(def.id + ': row ' + i + ' has ' + row.length + ' cols');
    });
    const L = {
      def: def, id: def.id, name: def.name, theme: def.theme,
      grid: rows.map((r) => r.split('')),
      shards: [], checkpoints: [], start: null, exit: null, fakeExits: [],
    };
    const g = L.grid;
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const ch = g[r][c];
        const p = { c: c, r: r, x: tc(c), y: tc(r) };
        if (ch === 'S') { L.start = p; g[r][c] = '.'; }
        else if (ch === 'E') { L.exit = p; g[r][c] = '.'; }
        else if (ch === 'o') { p.id = L.shards.length; L.shards.push(p); g[r][c] = '.'; }
        else if (ch === 'K') { p.id = L.checkpoints.length; L.checkpoints.push(p); g[r][c] = '.'; }
        else if (ch === 'F') { p.mimic = true; L.fakes = L.fakes || []; L.fakes.push(p); g[r][c] = '.'; }
        else if (ch === 'X') { L.fakeExits.push(p); g[r][c] = '.'; }
      }
    if (!L.start) throw new Error(def.id + ': no start');
    L.at = (c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS ? '#' : g[r][c]);
    L.solidAt = (c, r) => info(L.at(c, r)).solid === true;
    L.spikes = def.spikes || {};
    L.hazards = [];
    for (const hd of def.hazards || []) {
      if (!H[hd.type]) throw new Error(def.id + ': unknown hazard ' + hd.type);
      L.hazards.push(H[hd.type](hd, L));
    }
    for (const f of L.fakes || []) L.hazards.push(H.mimic({ c: f.c, r: f.r }));
    for (const f of L.fakeExits) L.hazards.push(H.static({ c: f.c, r: f.r, skin: 'fakeportal', death: 'grab', r2: 6 }));
    // collapse wave: time at which tile (c,r) falls
    const wave = def.wave;
    L.waveAt = function (c, r) {
      if (!wave) return Infinity;
      const ch = g[r][c];
      if (info(ch).solid || ch === 'v') return Infinity;
      if (wave.safe && wave.safe.some((s) => s[0] === c && s[1] === r)) return Infinity;
      if (c < (wave.from || 0)) return Infinity;
      return wave.t0 + (c - (wave.from || 0)) / wave.speed + G.hash(c, r, 7) * (wave.jitter || 0);
    };
    L.idleKnight = def.idleKnight !== false;
    return L;
  };

  // spike group phase: returns 0 down, 1 warning, 2 up
  G.spikeState = function (L, group, t) {
    const s = L.spikes[group];
    if (!s) return 0;
    const lt = G.mod(t + (s.phase || 0) * s.period, s.period);
    const warn = s.warn !== undefined ? s.warn : 0.35;
    if (lt < warn) return 1;
    if (lt < warn + s.up) return 2;
    return 0;
  };

  // ---------------- run state ----------------
  // A run is one attempt from the last save point.
  G.newRun = function (L, save) {
    const S = {
      L: L,
      t: save ? save.t : 0,
      x: save ? save.x : L.start.x,
      y: save ? save.y : L.start.y + 6,
      got: save ? save.got.slice() : L.shards.map(() => false),
      crack: new Float32Array(COLS * ROWS).fill(-1), // time a cracked tile started breaking
      fallen: new Uint8Array(COLS * ROWS), // 1 when a tile is gone
      dead: null,
      won: false,
      checkpoint: save ? save.cp : -1,
      // knight
      still: 0, ax: 0, ay: 0, knight: null,
      moving: false, dir: 'right',
    };
    if (save) { S.crack.set(save.crack); S.fallen.set(save.fallen); }
    S.ax = S.x;
    S.ay = S.y;
    return S;
  };
  G.saveOf = function (S, cp) {
    return { t: S.t, x: S.L.checkpoints[cp].x, y: S.L.checkpoints[cp].y + 6, got: S.got.slice(), crack: S.crack.slice(), fallen: S.fallen.slice(), cp: cp };
  };

  // Is tile gone (pit) right now?
  G.tileGone = function (S, c, r) {
    const L = S.L, i = r * COLS + c;
    if (S.fallen[i]) return true;
    return L.waveAt(c, r) <= S.t;
  };

  function boxHitsSolid(L, l, t, r, b) {
    const c0 = Math.floor(l / TS), c1 = Math.floor((r - 0.001) / TS);
    const r0 = Math.floor(t / TS), r1 = Math.floor((b - 0.001) / TS);
    for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) if (L.solidAt(cc, rr)) return true;
    return false;
  }
  G.boxHitsSolid = boxHitsSolid;

  // move with axis-separated collision, plus corner sliding: when a wall
  // corner blocks you by a few pixels you get nudged around it.
  G.movePlayer = function (S, mx, my, dt) {
    const L = S.L;
    let len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    const v = PL.speed * dt;
    const hit = (x, y) => boxHitsSolid(L, x + PL.wl, y + PL.wt, x + PL.wr, y + PL.wb);
    const NUDGE = 5;
    let nx = S.x + mx * v;
    if (mx !== 0 && hit(nx, S.y)) {
      let slid = false;
      if (my === 0) {
        for (let d = 1; d <= NUDGE && !slid; d++)
          for (const sgn of [-1, 1]) {
            const ty = S.y + sgn * d;
            if (!hit(S.x, ty) && !hit(S.x + mx * Math.max(1, d), ty)) { S.y += sgn * Math.min(d, v); slid = true; break; }
          }
      }
      if (mx > 0) nx = Math.floor((nx + PL.wr) / TS) * TS - PL.wr;
      else nx = Math.floor((nx + PL.wl) / TS + 1) * TS - PL.wl;
      if (hit(nx, S.y)) nx = S.x;
    }
    nx = G.clamp(nx, -PL.wl, LW - PL.wr);
    S.x = nx;
    let ny = S.y + my * v;
    if (my !== 0 && hit(S.x, ny)) {
      if (mx === 0) {
        let slid = false;
        for (let d = 1; d <= NUDGE && !slid; d++)
          for (const sgn of [-1, 1]) {
            const tx = S.x + sgn * d;
            if (!hit(tx, S.y) && !hit(tx, S.y + my * Math.max(1, d))) { S.x += sgn * Math.min(d, v); slid = true; break; }
          }
      }
      if (my > 0) ny = Math.floor((ny + PL.wb) / TS) * TS - PL.wb;
      else ny = Math.floor((ny + PL.wt) / TS + 1) * TS - PL.wt;
      if (hit(S.x, ny)) ny = S.y;
    }
    ny = G.clamp(ny, -PL.wt, LH - PL.wb);
    S.y = ny;
  };

  function circleRect(cx, cy, cr, l, t, r, b) {
    const px = G.clamp(cx, l, r), py = G.clamp(cy, t, b);
    const dx = cx - px, dy = cy - py;
    return dx * dx + dy * dy < cr * cr;
  }
  G.circleRect = circleRect;
  const shapeBuf = [];
  // check hazards against a hurtbox; returns hazard or null
  G.hazardHit = function (L, t, l, tp, r, b, inflate) {
    inflate = inflate || 0;
    for (const hz of L.hazards) {
      shapeBuf.length = 0;
      hz.shapes(t, shapeBuf);
      for (const s of shapeBuf) {
        if (s.k === 0) {
          if (circleRect(s.x, s.y, s.r + inflate, l, tp, r, b)) return hz;
        } else if (s.x - inflate < r && s.x + s.w + inflate > l && s.y - inflate < b && s.y + s.h + inflate > tp) return hz;
      }
    }
    return null;
  };

  // Advance one step. input {mx,my}. Returns events array.
  G.step = function (S, input, dt) {
    const L = S.L, ev = [];
    if (S.dead || S.won) return ev;
    S.t += dt;
    const ox = S.x, oy = S.y;
    G.movePlayer(S, input.mx, input.my, dt);
    S.moving = Math.abs(S.x - ox) + Math.abs(S.y - oy) > 0.01;
    if (S.moving) {
      if (Math.abs(S.x - ox) > Math.abs(S.y - oy) + 0.01) S.dir = S.x > ox ? 'right' : 'left';
      else if (Math.abs(S.y - oy) > 0.01) S.dir = S.y > oy ? 'down' : 'up';
    }
    const fx = S.x, fy = S.y - 2;
    const fc = Math.floor(fx / TS), fr = Math.floor(fy / TS);
    const ch = L.at(fc, fr);
    const ti = info(ch);
    const idx = fr * COLS + fc;

    // cracked / hidden tiles
    if (ti.trap && !S.fallen[idx]) {
      if (ti.trap === 1) {
        S.fallen[idx] = 1;
        ev.push({ e: 'collapse', c: fc, r: fr, hidden: true });
      } else if (S.crack[idx] < 0) {
        S.crack[idx] = S.t;
        ev.push({ e: 'crack', c: fc, r: fr });
      }
    }
    // cracked tiles finish breaking
    for (let i = 0; i < S.crack.length; i++) {
      if (S.crack[i] >= 0 && !S.fallen[i] && S.t - S.crack[i] >= (L.def.crackTime || 0.42)) {
        S.fallen[i] = 1;
        ev.push({ e: 'collapse', c: i % COLS, r: Math.floor(i / COLS) });
      }
    }
    const kill = (type, by) => {
      S.dead = { type: type, by: by, x: S.x, y: S.y, t: S.t };
      ev.push({ e: 'die', type: type, by: by });
    };
    // ground
    if (ch === 'v' || G.tileGone(S, fc, fr)) { kill('fall', 'pit'); return ev; }
    if (ti.water) { kill('drown', 'water'); return ev; }
    if (ti.lava) { kill('burn', 'lava'); return ev; }
    // spikes: any overlap of the hurtbox with an inset spike tile
    const hl = S.x + PL.hl, hr = S.x + PL.hr, ht = S.y + PL.ht, hb = S.y + PL.hb;
    {
      const c0 = Math.floor((hl + 3) / TS), c1 = Math.floor((hr - 3) / TS), r0 = Math.floor((S.y - 6) / TS), r1 = Math.floor((hb - 1) / TS);
      for (let rr = r0; rr <= r1; rr++)
        for (let cc = c0; cc <= c1; cc++) {
          const ci = info(L.at(cc, rr));
          if (ci.spikes && G.spikeState(L, ci.spikes, S.t) === 2) {
            const tl = cc * TS + 3, tr = cc * TS + TS - 3, tt = rr * TS + 3, tb = rr * TS + TS - 2;
            if (hr > tl && hl < tr && hb > tt && S.y - 6 < tb) { kill('impale', 'spikes'); return ev; }
          }
        }
    }
    // hazards
    const hz = G.hazardHit(L, S.t, hl + 1, ht + 2, hr - 1, hb - 1, 0);
    if (hz) { kill(hz.death || 'hit', hz.skin); return ev; }
    // knight
    if (L.idleKnight) {
      // standing still fills the meter; moving drains it twice as fast
      if (S.moving) S.still = Math.max(0, S.still - dt * 2);
      else S.still += dt;
      const K = S.knight;
      if (!K && S.still >= PL.idleTime) {
        const dirK = S.x < LW / 2 ? -1 : 1; // comes from the far side
        S.knight = { y: S.y, dir: dirK, t0: S.t, x: dirK > 0 ? -60 : LW + 60, phase: 'warn' };
        ev.push({ e: 'knight' });
      }
      if (S.knight) {
        const k = S.knight;
        const age = S.t - k.t0;
        if (age >= PL.knightWarn) {
          if (k.phase === 'warn') { k.phase = 'charge'; ev.push({ e: 'charge' }); }
          k.x = (k.dir > 0 ? -60 : LW + 60) + k.dir * PL.knightSpeed * (age - PL.knightWarn);
          // the lance/sword sweeps a band around the row
          if (Math.abs(S.y - k.y) < 9 && Math.abs(S.x - k.x) < 16) { kill('slash', 'knight'); return ev; }
          if ((k.dir > 0 && k.x > LW + 80) || (k.dir < 0 && k.x < -80)) { S.knight = null; S.still = 0; S.ax = S.x; S.ay = S.y; }
        }
      }
    }
    // shards
    L.shards.forEach((s, i) => {
      if (!S.got[i] && circleRect(s.x, s.y, 6, hl, ht, hr, hb)) { S.got[i] = true; ev.push({ e: 'shard', i: i }); }
    });
    // checkpoints
    L.checkpoints.forEach((cp, i) => {
      if (S.checkpoint !== i && Math.abs(S.x - cp.x) < 8 && Math.abs(fy - cp.y) < 8) {
        S.checkpoint = i;
        ev.push({ e: 'checkpoint', i: i });
      }
    });
    // exit
    if (L.exit && S.got.every(Boolean)) {
      if (Math.abs(S.x - L.exit.x) < 7 && Math.abs(fy - L.exit.y) < 7) { S.won = true; ev.push({ e: 'win' }); }
    }
    return ev;
  };
})(typeof window !== 'undefined' ? window.G : globalThis.G);
