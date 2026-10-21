// Proves each chapter can be beaten.
// Breadth-first search over (position, time, shards collected) using the
// game's own hazard code, then replays the found route through the real
// simulation (which also has crumbling floors and the stand-still knight).
//
// Usage: node tools/solve.js [levelIndex|all] [margin=1] [horizonSeconds=90] [--path out.json]
globalThis.window = undefined;
require('../js/core.js');
require('../js/sim.js');
require('../js/levels.js');
const G = globalThis.G;
const PL = G.PLAYER;

const args = process.argv.slice(2);
const which = args[0] || 'all';
const margin = args[1] !== undefined ? +args[1] : 1;
const horizon = args[2] !== undefined ? +args[2] : 90;
const pathOut = args.includes('--path') ? args[args.indexOf('--path') + 1] : null;

const NX = 208, NY = 112, N = NX * NY;
const DT = 2 / PL.speed; // one 2px grid step per tick at full speed
const cx = (i) => i * 2 + 1, cy = (j) => j * 2 + 1;

function solve(idx) {
  const def = G.LEVELS[idx];
  const L = G.parseLevel(def);
  const TS = G.TS;
  // static walkability
  const walk = new Uint8Array(N);
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const x = cx(i), y = cy(j);
      if (x < -PL.wl || x > G.LW - PL.wr || y < -PL.wt || y > G.LH) continue;
      if (G.boxHitsSolid(L, x + PL.wl, y + PL.wt, x + PL.wr, y + PL.wb)) continue;
      // the foot point (with margin) must stay on safe ground
      let bad = false;
      for (const [ox, oy] of [[0, 0], [-margin, -margin], [margin, -margin], [-margin, margin], [margin, margin]]) {
        const fc = Math.floor((x + ox) / TS), fr = Math.floor((y - 2 + oy) / TS);
        const inf = G.tileInfo(L.at(fc, fr));
        if (L.at(fc, fr) === 'v' || inf.water || inf.lava || inf.trap === 1) bad = true;
      }
      if (bad) continue;
      walk[j * NX + i] = 1;
    }
  // cells standing on a cracked tile (no waiting there)
  const cracked = new Uint8Array(N);
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const x = cx(i), y = cy(j);
      for (const [ox, oy] of [[0, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]]) {
        if (G.tileInfo(L.at(Math.floor((x + ox) / TS), Math.floor((y - 2 + oy) / TS))).trap === 2) cracked[j * NX + i] = 1;
      }
    }
  // shard bits per cell, exit cells
  const shardBits = new Uint32Array(N);
  const exitCell = new Uint8Array(N);
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const x = cx(i), y = cy(j), k = j * NX + i;
      L.shards.forEach((s, si) => {
        if (G.circleRect(s.x, s.y, 3.5, x + PL.hl, y + PL.ht, x + PL.hr, y + PL.hb)) shardBits[k] |= 1 << si;
      });
      if (L.exit && Math.abs(x - L.exit.x) < 5 && Math.abs(y - 2 - L.exit.y) < 5) exitCell[k] = 1;
    }
  const FULL = (1 << L.shards.length) - 1;
  // danger at time t
  const danger = new Uint8Array(N);
  const shapes = [];
  function buildDanger(t) {
    danger.fill(0);
    shapes.length = 0;
    for (const hz of L.hazards) hz.shapes(t, shapes);
    const hl = -3, hr = 3, ht = -9, hb = -1, m = margin;
    for (const s of shapes) {
      let x0, x1, y0, y1;
      if (s.k === 0) { x0 = s.x - s.r - m - hr; x1 = s.x + s.r + m - hl; y0 = s.y - s.r - m - hb; y1 = s.y + s.r + m - ht; }
      else { x0 = s.x - m - hr; x1 = s.x + s.w + m - hl; y0 = s.y - m - hb; y1 = s.y + s.h + m - ht; }
      const i0 = Math.max(0, Math.floor((x0 - 1) / 2)), i1 = Math.min(NX - 1, Math.ceil((x1 - 1) / 2));
      const j0 = Math.max(0, Math.floor((y0 - 1) / 2)), j1 = Math.min(NY - 1, Math.ceil((y1 - 1) / 2));
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const x = cx(i), y = cy(j);
          let hit;
          if (s.k === 0) hit = G.circleRect(s.x, s.y, s.r + m, x + hl, y + ht, x + hr, y + hb);
          else hit = s.x - m < x + hr && s.x + s.w + m > x + hl && s.y - m < y + hb && s.y + s.h + m > y + ht;
          if (hit) danger[j * NX + i] = 1;
        }
    }
    // spikes and the collapse wave, using the game's foot probe
    for (let j = 0; j < NY; j++)
      for (let i = 0; i < NX; i++) {
        const k = j * NX + i;
        if (!walk[k] || danger[k]) continue;
        const x = cx(i), y = cy(j);
        const fc = Math.floor(x / TS), fr = Math.floor((y - 2) / TS);
        if (L.waveAt(fc, fr) <= t + 0.05) { danger[k] = 1; continue; }
        const c0 = Math.floor((x - 4 + 3 - m) / TS), c1 = Math.floor((x + 4 - 3 + m) / TS), r0 = Math.floor((y - 6 - m) / TS), r1 = Math.floor((y - 1 + m) / TS);
        for (let rr = r0; rr <= r1 && !danger[k]; rr++)
          for (let cc = c0; cc <= c1; cc++) {
            const ci = G.tileInfo(L.at(cc, rr));
            if (!ci.spikes) continue;
            // dangerous if up now or within the next tick
            if (G.spikeState(L, ci.spikes, t) === 2 || G.spikeState(L, ci.spikes, t + DT) === 2) {
              const tl = cc * TS + 3 - m, tr = cc * TS + TS - 3 + m, tt = rr * TS + 3 - m, tb = rr * TS + TS - 2 + m;
              if (x + 4 > tl && x - 4 < tr && y > tt && y - 6 < tb) { danger[k] = 1; break; }
            }
          }
      }
  }
  // start cell
  const sx = L.start.x, sy = L.start.y + 6;
  const si = Math.round((sx - 1) / 2), sj = Math.round((sy - 1) / 2);
  const startK = sj * NX + si;
  const W32 = Math.ceil(N / 32);
  // State key = mask * 5 + dir. dir is the last move while standing on
  // cracked ground (1 right, 2 left, 3 down, 4 up) so the search can't wait
  // on crumbling tiles by shuffling back and forth. 0 elsewhere.
  const layers = [];
  let cur = new Map();
  const startMask = shardBits[startK];
  const b0 = new Uint32Array(W32);
  b0[startK >> 5] |= 1 << (startK & 31);
  cur.set(startMask * 5, b0);
  layers.push(cur);
  const maxT = Math.round(horizon / DT);
  let goal = null;
  const has = (b, k) => (b[k >> 5] >>> (k & 31)) & 1;
  const NB = [0, 1, -1, NX, -NX];
  const OPP = [0, 2, 1, 4, 3];
  let bestMask = 0;
  for (let step = 1; step <= maxT && !goal; step++) {
    const t = step * DT;
    buildDanger(t);
    const next = new Map();
    for (const [key, bits] of cur) {
      const mask = Math.floor(key / 5), dir = key % 5;
      for (let w = 0; w < W32; w++) {
        let v = bits[w];
        while (v) {
          const low = v & -v;
          const bit = 31 - Math.clz32(low);
          v ^= low;
          const k = (w << 5) + bit;
          const ki = k % NX;
          for (let di = 0; di < 5; di++) {
            const d = NB[di];
            const k2 = k + d;
            if (k2 < 0 || k2 >= N) continue;
            if ((d === 1 && ki === NX - 1) || (d === -1 && ki === 0)) continue;
            if (!walk[k2] || danger[k2]) continue;
            let nd = 0;
            if (cracked[k2]) {
              if (di === 0) continue;
              if (cracked[k] && dir && di === OPP[dir]) continue;
              nd = di;
            }
            const m2 = mask | shardBits[k2];
            const key2 = m2 * 5 + nd;
            let nb = next.get(key2);
            if (!nb) { nb = new Uint32Array(W32); next.set(key2, nb); }
            nb[k2 >> 5] |= 1 << (k2 & 31);
            if (m2 === FULL && exitCell[k2] && !goal) goal = { step, k: k2, key: key2 };
            if (popcount(m2) > popcount(bestMask)) bestMask = m2;
          }
        }
      }
    }
    layers.push(next);
    cur = next;
    if (next.size === 0) break;
  }
  const res = { idx, id: def.id, solved: !!goal, margin };
  if (!goal) {
    res.bestShards = popcount(bestMask) + '/' + L.shards.length;
    res.reached = layers.length - 1;
    return res;
  }
  res.time = +(goal.step * DT).toFixed(2);
  // backtrack
  const path = [];
  let k = goal.k, key = goal.key;
  for (let step = goal.step; step >= 0; step--) {
    path.push(k);
    if (step === 0) break;
    const prev = layers[step - 1];
    const mask = Math.floor(key / 5), dir = key % 5;
    let found = false;
    for (const [pkey, b] of prev) {
      const pm = Math.floor(pkey / 5), pd = pkey % 5;
      if ((pm | shardBits[k]) !== mask) continue;
      for (let di = 0; di < 5 && !found; di++) {
        const k0 = k - NB[di];
        if (k0 < 0 || k0 >= N || !has(b, k0)) continue;
        // re-check the forward transition k0 -> k with move di
        let nd = 0;
        if (cracked[k]) {
          if (di === 0) continue;
          if (cracked[k0] && pd && di === OPP[pd]) continue;
          nd = di;
        }
        if (nd !== dir) continue;
        k = k0; key = pkey; found = true;
      }
      if (found) break;
    }
    if (!found) { res.backtrackFail = step; break; }
  }
  path.reverse();
  res.path = path.map((kk) => [cx(kk % NX), cy(Math.floor(kk / NX))]);
  res.replay = replay(idx, res.path);
  return res;
}
function popcount(x) { let c = 0; while (x) { x &= x - 1; c++; } return c; }

// Replay the route through the real game simulation at 60 Hz.
function replay(idx, path) {
  const L = G.parseLevel(G.LEVELS[idx]);
  const S = G.newRun(L, null);
  S.x = path[0][0]; S.y = path[0][1];
  const dt = 1 / 60;
  const total = (path.length - 1) * DT;
  let maxStill = 0, jig = 0;
  const at = (t) => {
    const u = Math.min(path.length - 1, Math.max(0, t / DT));
    const a = path[Math.floor(u)], b = path[Math.min(path.length - 1, Math.floor(u) + 1)];
    const f = u - Math.floor(u);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  };
  const v = PL.speed * dt;
  for (let n = 0; n < Math.ceil((total + 1) / dt); n++) {
    const [tx, ty] = at(S.t + dt);
    let best = [0, 0], bd = Infinity;
    for (let mx = -1; mx <= 1; mx++)
      for (let my = -1; my <= 1; my++) {
        const l = Math.hypot(mx, my) || 1;
        const nx = S.x + (mx / l) * v, ny = S.y + (my / l) * v;
        const d = Math.hypot(nx - tx, ny - ty) + (mx && my ? 0.05 : 0);
        if (d < bd - 1e-9) { bd = d; best = [mx, my]; }
      }
    // waiting: wiggle 1px so the knight never comes (what a player would do)
    if (best[0] === 0 && best[1] === 0 && S.still > 1.0) {
      jig = 1 - jig;
      best = [jig ? 1 : -1, 0];
    }
    const ev = G.step(S, { mx: best[0], my: best[1] }, dt);
    maxStill = Math.max(maxStill, S.still);
    for (const e of ev) {
      if (e.e === 'die') return { ok: false, t: +S.t.toFixed(2), by: e.by, type: e.type, at: [Math.round(S.x), Math.round(S.y)], want: [Math.round(tx), Math.round(ty)], maxStill: +maxStill.toFixed(2) };
      if (e.e === 'win') return { ok: true, t: +S.t.toFixed(2), maxStill: +maxStill.toFixed(2) };
    }
  }
  return { ok: false, t: +S.t.toFixed(2), reason: 'did not finish', at: [Math.round(S.x), Math.round(S.y)], got: S.got };
}

const list = which === 'all' ? G.LEVELS.map((_, i) => i) : [+which];
const out = {};
for (const i of list) {
  const t0 = Date.now();
  const r = solve(i);
  const p = r.path;
  delete r.path;
  console.log(JSON.stringify(r), ((Date.now() - t0) / 1000).toFixed(1) + 's');
  if (p) out[i] = p;
}
if (pathOut) require('fs').writeFileSync(pathOut, JSON.stringify(out));
