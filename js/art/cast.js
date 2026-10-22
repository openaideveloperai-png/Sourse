// Characters, portraits and scares for NOBODY HOME. Names and sizes: docs/ART_LIST.md.
(function (G) {
  'use strict';
  const C = G.C;
  const def = G.defSprite;

  // ---------------- helpers ----------------
  // Stamp layers of string rows into a (W+2)x(H+2) canvas (1px outline margin), outline, frame.
  // layers: [rows, x, y] in fill coordinates. ax: anchor column in fill coords.
  function fig(pal, W, H, layers, ax, post, noOutline) {
    const px = new G.PX(W + 2, H + 2);
    for (const L of layers) if (L && L[0]) px.stamp(L[0], pal, 1 + (L[1] || 0), 1 + (L[2] || 0), L[3]);
    if (post) post(px);
    if (!noOutline) px.outline();
    return G.frame(px, 1 + ax, H + 1);
  }
  // A person from head/torso/legs blocks (all 16 wide). bob drops head+torso 1px on step frames.
  function person(pal, head, torso, legs, bob, extra, post) {
    const H = head.length + torso.length + legs.length;
    const yl = H - legs.length, yt = yl - torso.length + (bob || 0), yh = yt - head.length;
    const layers = [[legs, 0, yl], [torso, 0, yt], [head, 0, yh]];
    if (extra) for (const e of extra) layers.push([e[0], e[1], e[2] + (e[3] ? 0 : bob || 0), e[4]]);
    return fig(pal, 16, H, layers, 8, post ? (px) => post(px, bob || 0, yh + 1) : null);
  }
  const sub = (rows, i, from, to) => rows.map((r, k) => (i.includes(k) ? r.replace(new RegExp('[' + from + ']', 'g'), to) : r));
  const mirrorRows = (rows) => rows.map((r) => r.split('').reverse().join(''));

  // ======================================================================
  // TAMA: scruffy grey stray, torn left ear, tabby marks
  // ======================================================================
  const CAT = G.pal({
    k: '#38343e', F: '#57535f', f: '#78747f', l: '#9c98a2', L: '#b8b4bc',
    w: '#d8d2cc', W: '#a8a29e', p: '#b07c86', e: '#d0c85a', E: '#1a1420', n: '#c27880', m: '#2c2430',
  });
  G.CAT_PAL = CAT;
  // Every Tama frame is the same head/body block (fixed shape) plus legs and a tail drawn per frame.
  // Fill area 16x12 inside an 18x14 canvas; ground row 11; anchor between the feet.
  const CAT_SIDE = [
    '.k.Fk...........',
    '.FpFk...........',
    '.ffffF..........',
    'leEfffF.........',
    'nfffffLlLlLlLf..',
    '.wWffkfkfkfkfF..',
    '..wwfffkfkffFF..',
    '...wwfffffffF...',
  ];
  const CAT_FRONT = [
    '...F......F.F...',
    '...FpF...FpFF...',
    '...fkfkfkffffF..',
    '..lffffkfffffF..',
    '..lfeEfffEeffF..',
    '.llfffwnwfffFF..',
    '...fFwmwmwFF....',
    '....FFwwwFF.....',
    '....lfwwwfF.....',
    '...lffwwwffF....',
  ];
  const CAT_BACK = [
    '..F.F....F......',
    '..FkF...FkF.....',
    '..lffffffff.....',
    '.lLLffffffFF....',
    '.lLfffffffFF....',
    '..lfffffFFF.....',
    '....lFFFFF......',
    '...lffFfffF.....',
    '..lLfFfFffFF....',
    '..lffFFFffFF....',
    '..lfFfFfFfFF....',
  ];
  function catPx() { return new G.PX(18, 14); }
  const cset = (px, x, y, c) => px.set(1 + x, 1 + y, c);
  // a leg from the hip (x, y0) down to the ground row, the foot shifted by dx; near legs are 2px wide
  function catLeg(px, x, y0, dx, near, lift) {
    const gy = 11 - (lift || 0);
    const n = gy - y0;
    for (let y = y0; y < gy; y++) {
      const xx = x + Math.round((dx * (y - y0 + 1)) / (n + 1));
      cset(px, xx, y, near ? CAT.f : CAT.F);
      if (near) cset(px, xx + 1, y, CAT.F);
    }
    cset(px, x + dx, gy, near ? CAT.w : CAT.F);
    if (near) cset(px, x + dx + 1, gy, CAT.W);
  }
  function catTail(px, pts, oy) {
    pts.forEach(([x, y], i) => cset(px, x, y + oy, i === pts.length - 1 ? CAT.k : i % 2 ? CAT.F : CAT.f));
  }
  function catSideFrame(k) {
    const px = catPx(), bob = k ? 1 : 0;
    // [near front, far front, near back, far back] foot offsets; diagonal pairs move together
    const st = [[0, 0, 0, 0], [-2, 2, 2, -2], [2, -2, -2, 2]][k];
    catLeg(px, 5, 7 + bob, st[1], false);
    catLeg(px, 12, 7 + bob, st[3], false);
    catTail(px, [[[13, 4], [14, 3], [14, 2], [15, 1], [15, 0]], [[13, 4], [14, 3], [15, 2], [15, 1], [14, 0]], [[13, 4], [14, 3], [14, 2], [14, 1], [15, 0]]][k], bob);
    px.stamp(CAT_SIDE, CAT, 1, 1 + bob);
    catLeg(px, 3, 8 + bob, st[0], true);
    catLeg(px, 10, 8 + bob, st[2], true);
    px.outline();
    return G.frame(px, 9, 13);
  }
  function catFrontFrame(k) {
    const px = catPx(), bob = k ? 1 : 0;
    catTail(px, [[[12, 8], [13, 7], [13, 6], [14, 5], [14, 4]], [[12, 8], [13, 7], [14, 6], [14, 5], [15, 4]], [[12, 8], [13, 7], [13, 6], [13, 5], [14, 4]]][k], bob);
    // hind paws peeking out behind the chest
    cset(px, 4, 11, CAT.F); cset(px, 11, 11, CAT.F);
    px.stamp(CAT_FRONT, CAT, 1, 1 + bob);
    // front legs: the lifted paw rises one pixel and tucks in
    const lift = [[0, 0], [1, 0], [0, 1]][k];
    for (const [x, li] of [[5, lift[0]], [9, lift[1]]]) {
      for (let y = 10 + bob; y < 11 - li; y++) { cset(px, x, y, CAT.f); cset(px, x + 1, y, CAT.F); }
      cset(px, x, 11 - li, CAT.w); cset(px, x + 1, 11 - li, CAT.W);
    }
    px.outline();
    return G.frame(px, 9, 13);
  }
  function catBackFrame(k) {
    const px = catPx(), bob = k ? 1 : 0;
    // tail swinging out to the right side of the rump
    catTail(px, [[[11, 9], [12, 8], [13, 7], [13, 6], [14, 5], [14, 4]], [[11, 9], [12, 8], [13, 7], [14, 6], [14, 5], [15, 4]], [[11, 9], [12, 8], [12, 7], [13, 6], [13, 5], [13, 4]]][k], bob);
    if (!bob) { cset(px, 11, 10, CAT.F); }
    px.stamp(CAT_BACK, CAT, 1, 1 + bob);
    // hind legs; a lifted paw shows its pink pad
    const lift = [[0, 0], [0, 1], [1, 0]][k];
    for (const [x, li] of [[3, lift[0]], [9, lift[1]]]) {
      for (let y = 11 + bob; y < 11 - li; y++) { cset(px, x, y, CAT.f); cset(px, x + 1, y, CAT.F); }
      if (li) { cset(px, x, 10, CAT.p); cset(px, x + 1, 10, CAT.p); }
      else { cset(px, x, 11, CAT.F); cset(px, x + 1, 11, CAT.k); }
    }
    px.outline();
    return G.frame(px, 9, 13);
  }
  G.defChar('tama', () => ({
    down: [0, 1, 2].map(catFrontFrame),
    up: [0, 1, 2].map(catBackFrame),
    left: [0, 1, 2].map(catSideFrame),
  }));


  // ======================================================================
  // ADULTS: 16-wide string rows like the kid sprites, taller bodies
  // ======================================================================
  // dirs: {down|up|left: {head, torso:[1 or 3], legs:[3 or 5], hx, swing:[lc, rc], extra(k, f) -> [[rows,x,y,fixed]]}}
  // 3 leg blocks: stand, step A, step B (played 0,1,0,2). 5 leg blocks (side views): stand, A (near
  // leg forward), passing, B (far leg forward), passing, played as stand + full cycle. Torso index
  // k: 0 arms down, 1 near arm forward, 2 near arm back; the arm always swings against the near leg.
  // A single front/back torso gets its arm swing from `swing` (the two arm columns).
  function adultChar(pal, dirs, ov) {
    const out = {};
    for (const d of ['down', 'up', 'left']) {
      const D = dirs[d];
      const plan = D.legs.length >= 5
        ? [[0, 0, 0], [2, 1, 1], [0, 2, 0], [1, 3, 1], [0, 4, 0]]
        : [[0, 0, 0], [1, 1, 1], [2, 2, 1]];
      out[d] = plan.map(([k, li, bob], f) => {
        const head = D.head, legs = D.legs[li];
        let torso = D.torso[k] || D.torso[0];
        if (k && D.torso.length === 1 && D.swing) torso = swingArms(torso, D.swing, k);
        const H = head.length + torso.length + legs.length - (ov || 0);
        const yl = H - legs.length, yt = yl - torso.length + bob, yh = yt - head.length + (ov || 0);
        const layers = [];
        if (D.back) for (const e of D.back(k, f)) layers.push([e[0], e[1], e[2] + (e[3] ? 0 : yt)]);
        layers.push([legs, 0, yl], [torso, 0, yt], [head, D.hx || 0, yh]);
        if (D.extra) for (const e of D.extra(k, f)) layers.push([e[0], e[1], e[2] + (e[3] ? 0 : yt)]);
        return fig(pal, 16, H, layers, 8, D.post ? (px) => D.post(px, k, yt + 1, yh + 1) : null);
      });
    }
    return out;
  }
  // front/back arm swing on a torso block: k 1 = left hand 1px higher (swung away), right hand
  // 1px lower (swung toward the viewer); k 2 the other way round. cols: the two arm columns.
  function swingArms(rows, cols, k) {
    const g = rows.map((r) => r.split(''));
    const bottom = (c) => { for (let y = g.length - 1; y >= 0; y--) if (g[y][c] !== '.') return y; return -1; };
    const shorten = (c) => { const y = bottom(c); if (y > 0) { g[y - 1][c] = g[y][c]; g[y][c] = '.'; } };
    const lengthen = (c) => { const y = bottom(c); if (y > 0 && y + 1 < g.length) { g[y + 1][c] = g[y][c]; g[y][c] = g[y - 1][c]; } };
    if (k === 1) { shorten(cols[0]); lengthen(cols[1]); } else { lengthen(cols[0]); shorten(cols[1]); }
    return g.map((r) => r.join(''));
  }
  // Side-view legs (facing left) built from a few numbers so every adult walks the same way.
  // n leg rows + 2 shoe rows. Poses: stand; A near leg forward (far heel up); passing (far foot
  // lifted behind, knee bent); B far leg forward (near heel up); passing (near foot swinging
  // through, lifted 2px). The hip row never moves; feet always land on the bottom row.
  // o: {n, hip (near leg's left column), w, fw (widths), fo (far leg offset), s (stride), shoe,
  //     p/e near fill/back edge, F far fill, q/Q near shoe, QF far shoe}
  function sideLegs(o) {
    const n = o.n, W = o.W || 16, w = o.w || 3, fw = o.fw || 2, shoe = o.shoe || 5, s = o.s || 3;
    const fo = o.fo === undefined ? w - fw + 1 : o.fo;
    const pose = (near, far) => {
      const g = Array.from({ length: n + 2 }, () => Array(W).fill('.'));
      const put = (x, y, ch) => { if (x >= 0 && x < W && y >= 0 && y < n + 2) g[y][x] = ch; };
      const rnd = (v) => Math.sign(v) * Math.round(Math.abs(v));
      const leg = (L, x0, wid, fill, edge, sf, se) => {
        const m = n - (L.lift || 0);
        let ax = x0;
        for (let r = 0; r < m; r++) {
          const t = m > 1 ? r / (m - 1) : 1;
          const sh = L.mode === 'knee' ? Math.max(0, 2 * t - 1) : L.mode === 'thigh' ? Math.min(1, 1.6 * t) : t;
          ax = x0 + rnd(L.dx * sh);
          for (let i = 0; i < wid; i++) put(ax + i, r, edge && i === wid - 1 ? edge : fill);
        }
        const t0 = ax - (shoe - wid), t1 = ax + wid - 1;
        if (L.toe) {
          // heel up: the shoe tips forward onto its toe
          for (let x = t0 + 1; x <= t1; x++) put(x, m, x === t1 ? se : sf);
          for (let x = t0; x <= t1 - 1; x++) put(x, m + 1, se);
        } else {
          for (let x = t0; x <= t1; x++) put(x, m, x === t1 ? se : sf);
          for (let x = t0; x <= t1; x++) put(x, m + 1, se);
        }
      };
      leg(far, o.hip + fo, fw, o.F || 'P', null, o.QF || 'Q', o.QF || 'Q');
      leg(near, o.hip, w, o.p || 'p', o.e || null, o.q || 'q', o.Q || 'Q');
      return g.map((r) => r.join(''));
    };
    return [
      pose({ dx: 0 }, { dx: 0 }),
      pose({ dx: -s }, { dx: s, toe: 1 }),
      pose({ dx: 0 }, { dx: o.lb === undefined ? 2 : o.lb, lift: 1, mode: 'knee' }),
      pose({ dx: s, toe: 1 }, { dx: -s }),
      pose({ dx: -(o.lf === undefined ? 2 : o.lf), lift: o.ln || 2, mode: 'thigh' }, { dx: 0 }),
    ];
  }
  G.SIDE_LEGS = sideLegs;
  // shared leg blocks: p/P trousers or stockings, q/Q shoes
  const LEGS_TROUSER = {
    down: [
      ['.....pppppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '....qqqQqqqQ....', '....QQQ..QQQ....'],
      ['.....pppppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '....qqqQppP.....', '....QQQ.qqqQ....', '........QQQ.....'],
      ['.....pppppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPqqqQ....', '....qqqQQQQ.....', '....QQQ.........'],
    ],
    left: sideLegs({ n: 6, hip: 6, w: 3, fw: 3, fo: 1, s: 3, shoe: 5 }),
  };
  LEGS_TROUSER.up = [LEGS_TROUSER.down[0], LEGS_TROUSER.down[2], LEGS_TROUSER.down[1]];
  // thin legs under a coat or dress (6 rows)
  const LEGS_SKIRT = {
    down: [
      ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '....qqQ..qqQ....', '....QQQ..QQQ....'],
      ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '....qqQ..pP.....', '....QQQ..qqQ....', '.........QQQ....'],
      ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '.....pP..qqQ....', '....qqQ..QQQ....', '....QQQ.........'],
    ],
    left: sideLegs({ n: 4, hip: 6, w: 2, fw: 2, fo: 0, e: 'P', s: 2, shoe: 3, lb: 1, lf: 1, ln: 1 }),
  };
  LEGS_SKIRT.up = [LEGS_SKIRT.down[0], LEGS_SKIRT.down[2], LEGS_SKIRT.down[1]];

  // ---------------- YUI: about 50, short dark hair going grey, beige coat, oranges ----------------
  const YUI = G.pal({
    h: '#2a2530', H: '#453c4c', i: '#5e5468', g: '#8a8692',
    s: '#eec6a2', S: '#c99a7a', c: '#e2a896', e: '#2a1c26', m: '#b07468',
    a: '#bba67e', L: '#d6c69e', A: '#97825f', d: '#73614a', b: '#5a4a38',
    u: '#5e7c7c', U: '#45605e',
    p: '#4a4450', P: '#34303a', q: '#4e342a', Q: '#2e1e18',
    o: '#d88a30', O: '#a85c1e', w: '#e6e4de', W: '#b2aea6',
  });
  const ORANGES = ['.ww.', 'w..W', 'woOW', 'oOoO', 'WoOW', '.WW.'];
  const YUI_DIRS = {
    down: {
      head: [
        '......hhhh......',
        '....hhHiHhhh....',
        '...hHiHhhhhhh...',
        '..hHhhhhhhhhgh..',
        '..hhhhhhhhhghh..',
        '..hhhhhhssshhh..',
        '..hhsssssssshh..',
        '..hhsesssseShh..',
        '..hhcsssSssShh..',
        '...hhssmmsShh...',
        '....hSssssSh....',
      ],
      torso: [[
        '....LauuuuaA....',
        '...LaaUuuUaaA...',
        '..LLaaadUaaaAA..',
        '..LAaaadaaaadA..',
        '..LAaaabaaaadA..',
        '..LAaaadaaaadA..',
        '..sAaaabaaaadS..',
        '...aaaadaaaaA...',
        '...AaaadaaaaA...',
        '...dAAAdAAAAd...',
      ]],
      legs: LEGS_SKIRT.down,
      swing: [2, 13],
      extra: (k) => [[ORANGES, 0, [7, 6, 8][k]]],
    },
    up: {
      head: [
        '......hhhh......',
        '....hhHiHhhh....',
        '...hHiHhhhhhh...',
        '..hHhhhhhhhhgh..',
        '..hhhhhhhhhghh..',
        '..hhhhhhhhhhhh..',
        '..hhhhhhhhhghh..',
        '..hhhhhhhhhhhh..',
        '..hhhhhhhhhhhh..',
        '...hhhhhhhhhh...',
        '....hhSSSShh....',
      ],
      torso: [[
        '....LaUuuUaA....',
        '...LaaaaaaaaA...',
        '..LLaaaaaaaaAA..',
        '..LAaaaaaaaadA..',
        '..LAaaaaaaaadA..',
        '..LAaddddddadA..',
        '..sAaaaaaaaadS..',
        '...aaaaaaaaaA...',
        '...AaaaadaaaA...',
        '...dAAAAdAAAd...',
      ]],
      legs: LEGS_SKIRT.up,
      swing: [2, 13],
      extra: (k) => [[ORANGES, 12, [7, 8, 6][k]]],
    },
    left: {
      head: [
        '......hhhh......',
        '....hhHiHhhh....',
        '...hHiHhhhhhh...',
        '..hHhhhhhhhhgh..',
        '..hhhhhhhhhghh..',
        '..ssshhhhhhhhh..',
        '..sssssshhhhhh..',
        '.ssesssShhhghh..',
        '..ssssSShhhhh...',
        '..msssShhhhh....',
        '...SssShhh......',
      ],
      torso: [[
        '.....uuuuA......',
        '....LaUuaaA.....',
        '....LaaaaaaA....',
        '....LaaAaaaA....',
        '....LaaAaaaA....',
        '....LaaAaaaA....',
        '....LaasSaaA....',
        '....aaaaaaaaA...',
        '....AaaaaaaaA...',
        '....dAAAAAAAd...',
      ], [
        '.....uuuuA......',
        '....LaUuaaA.....',
        '....LaaaaaaA....',
        '....LAaaaaaA....',
        '...LAaaaaaaA....',
        '...sSaaaaaaA....',
        '....aaaaaaaA....',
        '....aaaaaaaaA...',
        '....AaaaaaaaA...',
        '....dAAAAAAAd...',
      ], [
        '.....uuuuA......',
        '....LaUuaaA.....',
        '....LaaaaaaA....',
        '....LaaaaAaA....',
        '....LaaaaaAaA...',
        '....LaaaaaasS...',
        '....aaaaaaaaA...',
        '....aaaaaaaaA...',
        '....AaaaaaaaA...',
        '....dAAAAAAAd...',
      ]],
      legs: LEGS_SKIRT.left,
      extra: (k) => [[ORANGES, [6, 3, 9][k], [7, 6, 7][k]]],
    },
  };
  G.defChar('yui', () => adultChar(YUI, YUI_DIRS));

  // ---------------- KURODA (resident, Haru's scale): thin old pianist, wild white hair, worn black suit ----------------
  const KURODA = G.pal({
    w: '#eceaf0', W: '#c2c0cc', V: '#9290a2', v: '#66647a',
    s: '#e6bc9a', S: '#c49274', r: '#a87862', e: '#261c26', m: '#8e5a50',
    j: '#3a3742', J: '#25232b', k: '#57525f', b: '#8a8070',
    t: '#e0dace', T: '#aca69a', x: '#6e2c36', X: '#4a1c26',
    p: '#403c4a', P: '#24222b', q: '#5a4036', Q: '#2a1c1c',
  });
  // thin trousers and old black shoes, 6 rows (shared by the down and up views)
  const KLEGS_D = [
    ['.....pppppP.....', '.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '....qqQ..qqQ....', '....QQQ..QQQ....'],
    ['.....pppppP.....', '.....pP..pP.....', '.....pP..pP.....', '....qqQ..pP.....', '....QQQ..qqQ....', '.........QQQ....'],
    ['.....pppppP.....', '.....pP..pP.....', '.....pP..pP.....', '.....pP..qqQ....', '....qqQ..QQQ....', '....QQQ.........'],
  ];
  const KLEGS_L = sideLegs({ n: 4, hip: 6, w: 3, fw: 2, fo: 1, e: 'P', s: 2, shoe: 5, lb: 1, lf: 1, ln: 1 });
  const KURODA_DIRS = {
    down: {
      head: [
        '.....wWwwWw.....',
        '...wwWsswwwwW...',
        '..wwWwsssswwWV..',
        '.wWwwssssssWWVV.',
        'wWWwsssssssssWVv',
        'wWWsWWWssWWWsSVv',
        '.VWssessssesSSV.',
        '.vVsssssSsssSSv.',
        '..VSsSsssssSSS..',
        '...SsssmmssSS...',
        '....SSssssSS....',
      ],
      torso: [[
        '....kjtxxtjJ....',
        '...kjjtxXtjjJ...',
        '...kJjjtXtjJJ...',
        '...kJjjjXjjJJ...',
        '...kJjjjjjjJJ...',
        '...sJjjjbjjJS...',
        '....JJJJJJJJ....',
      ], [
        '....kjtxxtjJ....',
        '...kjjtxXtjjJ...',
        '...kJjjtXtjJJ...',
        '...kJjjjXjjJJ...',
        '...sJjjjjjjJJ...',
        '....JjjjbjjJJ...',
        '....JJJJJJJJS...',
      ], [
        '....kjtxxtjJ....',
        '...kjjtxXtjjJ...',
        '...kJjjtXtjJJ...',
        '...kJjjjXjjJJ...',
        '...kJjjjjjjJS...',
        '...kJjjjbjjJ....',
        '...sJJJJJJJJ....',
      ]],
      legs: KLEGS_D,
    },
    up: {
      head: [
        '......wW.Ww.....',
        '...wWwsssSSwW...',
        '..wWssssssSSWV..',
        '.wWwssssssSSVVV.',
        'wWWVsssssSSSVVvv',
        'wWVVWsSSSSSVWVvv',
        '.sVWVVWVVVVVVvS.',
        '.SvVWVvVWvVVvvS.',
        '..vVvVVvVvVvvv..',
        '...vvvVvvvVvv...',
        '....SSsssSSS....',
      ],
      torso: [[
        '....kjjjjjjJ....',
        '...kjjjjjjjjJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjJjjJJ...',
        '...sJjjjJjjJS...',
        '....JJJJJJJJ....',
      ], [
        '....kjjjjjjJ....',
        '...kjjjjjjjjJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjJjjJS...',
        '...kJjjjJjjJ....',
        '...sJJJJJJJJ....',
      ], [
        '....kjjjjjjJ....',
        '...kjjjjjjjjJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjjjjJJ...',
        '...sJjjjJjjJJ...',
        '....JjjjJjjJJ...',
        '....JJJJJJJJS...',
      ]],
      // walking away: the far (screen) leg pattern is mirrored so the lifted foot alternates
      legs: [KLEGS_D[0], KLEGS_D[2], KLEGS_D[1]],
    },
    left: {
      head: [
        '.....wwWwW......',
        '...wwssssWWV....',
        '..wwssssSWwWV...',
        '..ssssssWwWWVV..',
        '.ssssssWwWWVVvV.',
        '.WWssssWWsSVvVv.',
        '.seSsssWsSSVVv..',
        'sssssssSWVVvVv..',
        '.SSsssSSVvVv....',
        '.mssSSS.vv......',
        '..SSSS..........',
      ],
      torso: [[
        '.....tjjjJ......',
        '....xjjjjjJ.....',
        '....jjjkjjJ.....',
        '....jjjkjjJ.....',
        '....jjjkjjJ.....',
        '....jjjsjjJ.....',
        '....JJJJJJJ.....',
      ], [
        '.....tjjjJ......',
        '....xjjjjjJ.....',
        '....jjkjjjJ.....',
        '....jkjjjjJ.....',
        '...kjjjjjjJ.....',
        '...sjjjjjjJ.....',
        '....JJJJJJJ.....',
      ], [
        '.....tjjjJ......',
        '....xjjjjjJ.....',
        '....jjjjkjJ.....',
        '....jjjjjkJ.....',
        '....jjjjjjkJ....',
        '....jjjjjjJs....',
        '....JJJJJJJ.....',
      ]],
      legs: KLEGS_L,
    },
  };
  G.defChar('kuroda', () => adultChar(KURODA, KURODA_DIRS));

  // ---------------- OTA (resident): tiny hunched old woman, lavender kimono, grey bun ----------------
  const OTA = G.pal({
    h: '#8c8894', H: '#aeaab6', i: '#cecad4', g: '#6a6674', G: '#4e4a58',
    s: '#ecc6a6', S: '#c89c7e', c: '#e2a69a', e: '#3a2a30', m: '#9a6058',
    k: '#a898c6', K: '#8676a8', l: '#c6badc', d: '#62548a',
    o: '#5c3c62', O: '#3e2846', f: '#7a5484', y: '#c8a462', u: '#ece6da', U: '#b8b0a4',
    z: '#7a5440', Z: '#4e3428',
  });
  // feet under the kimono hem: white tabi, wooden zori; tiny shuffling steps
  const OLEGS_D = [
    ['....kkkkkkKd....', '....kkkkkdKd....', '.....uU..uU.....', '....zzZ..zzZ....'],
    ['....kkkkkkKd....', '....kkkkkdKd....', '....zzZ..uU.....', '.........zzZ....'],
    ['....kkkkkkKd....', '....kkkkkdKd....', '.....uU..zzZ....', '....zzZ.........'],
  ];
  const OLEGS_L = [
    ['....kkkkkKd.....', '....kkkkkKd.....', '.....uuU........', '....zzzZ........'],
    ['....kkkkkKd.....', '...kkkkkkKd.....', '...uuU..UU......', '..zzzZ..ZZZ.....'],
    ['....kkkkkKd.....', '...kkkkkkKd.....', '...UU...uuU.....', '..ZZZ...zzzZ....'],
  ];
  const OTA_HEAD_TOP = [
    '......gHhg......',
    '.....hiHhhg.....',
    '......gGGg......',
    '....hHHhhhhg....',
    '...hHihhhhhhg...',
    '..hHhhhhhhhhhg..',
  ];
  // front torso: hands clasped over the obi; they sway a pixel with each step
  const otaTorsoD = (hx) => [
    '....lkuSSukK....',
    '...lkkkuukkKd...',
    '..lkkkkkkkkkKd..',
    '..lkooooyoooKd..',
    ('..lkOOOOOOOOKd..').slice(0, 6 + hx) + 'ssSs' + ('..lkOOOOOOOOKd..').slice(10 + hx),
    '..dkkkkkkkkKdd..',
    '...dkkkkkkKdd...',
  ];
  const OTA_DIRS = {
    down: {
      ov: 2,
      head: OTA_HEAD_TOP.concat([
        '..hhhsssssshhg..',
        '..hsssssssssSg..',
        '..hseesssseeSg..',
        '..gscsssSssScg..',
        '...SsssmmsssS...',
        '....SSssssSS....',
      ]),
      torso: [otaTorsoD(0), otaTorsoD(1), otaTorsoD(-1)],
      legs: OLEGS_D,
    },
    up: {
      ov: 2,
      head: OTA_HEAD_TOP.concat([
        '..hhhhghhhghgg..',
        '..hhhghhhhhghg..',
        '..shghhhhhhhgS..',
        '..Sghhhhhhhggg..',
        '...gggggggggg...',
        '....SSSSSSSS....',
      ]),
      // the obi's drum knot (taiko) on her back, with the cord across it
      torso: [[
        '....lkkuukkK....',
        '...lkkkkkkkKd...',
        '..lkooooooooKd..',
        '..lkoffffffoKd..',
        '..lkofyyyyfoKd..',
        '..dkoffffffoKd..',
        '...dOOOOOOOOd...',
      ], [
        '....lkkuukkK....',
        '...lkkkkkkkKd...',
        '..lkooooooooKd..',
        '..lkoffffffoKd..',
        '..lkofyyyyfoKd..',
        '..dkoffffffoKd..',
        '...dOOOOOOOOdd..',
      ], [
        '....lkkuukkK....',
        '...lkkkkkkkKd...',
        '..lkooooooooKd..',
        '..lkoffffffoKd..',
        '..lkofyyyyfoKd..',
        '..dkoffffffoKd..',
        '..ddOOOOOOOOd...',
      ]],
      legs: [OLEGS_D[0], OLEGS_D[2], OLEGS_D[1]],
    },
    left: {
      ov: 3,
      hx: -1,
      head: [
        '........gHhg....',
        '.......hiHhhg...',
        '........gGGg....',
        '.....hHHhhhhg...',
        '....hHihhhhhhg..',
        '...hHhhhhhhhhg..',
        '..sshhhhhhhhgg..',
        '.ssssshhhhhhgg..',
        '.seesSShhhhgg...',
        '.cssSSSghhgg....',
        '.msssSSSgg......',
        '..SSSS..........',
      ],
      // rounded back, hands folded in front of the obi, the long sleeve hanging under them
      torso: [0, 1, -1].map((dx) => {
        const hand = (r, a) => r.slice(0, 3 + dx) + a + r.slice(5 + dx);
        return [
          '.....ukkkKd.....',
          '....lkkkkkkKd...',
          '...lkkkkkkkkKd..',
          hand('...lffffffkKd...', 'ss'),
          hand('...looooookKd...', 'SS'),
          hand('...lKKkkkkkKd...', 'KK'),
          '....dkkkkkKd....',
        ];
      }),
      legs: OLEGS_L,
    },
  };
  G.defChar('ota', () => adultChar(OTA, OTA_DIRS));

  // ---------------- SHOTA (resident child): built on the kid rows like Haru ----------------
  // messy brown hair, white t-shirt with a red 7, red shorts, white sneakers; optional blue cap
  const SHOTA = G.pal({
    h: '#5a3826', H: '#7c5034', i: '#a07048',
    s: '#f2c8a0', S: '#d29a74', c: '#eea08a',
    j: '#e8e4da', J: '#b4aea2', k: '#f8f6f0', O: '#e8e4da', o: '#b4aea2', t: '#e8e4da', T: '#b4aea2',
    n: '#c03a34', N: '#8e2a26',
    p: '#b8423a', P: '#88302a', q: '#f0ece4', Q: '#a29c94', a: '#4a6aa8',
    b: '#3a5aa0', B: '#263e78', d: '#5a7cc0', v: '#1a2440',
  });
  G.SHOTA_PAL = SHOTA;
  function shotaRows(cap) {
    const K = G.KID_ROWS;
    const sub2 = (rows, map) => rows.map((r, i) => (map[i] ? map[i](r) : r));
    const setAt = (r, i, ch) => r.slice(0, i) + ch + r.slice(i + 1);
    // legs: shorts on the top two rows, bare shins below
    const shins = (rows) => rows.map((r, i) => (i >= 2 ? r.replace(/p/g, 's').replace(/P/g, 'S') : r));
    // sneakers get a blue stripe
    const sneak = (rows) => rows.map((r) => r);
    const legs = (r) => sneak(shins(r));
    // front torso: short sleeves (row 1), bare arms below, a red number 7 on the chest
    const TD = K.TORSO_D.map((r, i) => {
      if (i >= 2 && i <= 4) r = setAt(setAt(r, 2, 's'), 13, 'S');
      if (i === 1) r = setAt(setAt(r, 2, 'k'), 13, 'J');
      return r.replace(/t/g, 'j');
    });
    TD[1] = setAt(setAt(setAt(TD[1], 6, 'n'), 7, 'n'), 8, 'n');
    TD[2] = setAt(TD[2], 8, 'N');
    TD[3] = setAt(TD[3], 7, 'n');
    const TU = K.TORSO_U.map((r, i) => {
      if (i >= 2 && i <= 4) r = setAt(setAt(r, 2, 's'), 13, 'S');
      if (i === 1) r = setAt(setAt(r, 2, 'k'), 13, 'J');
      return r.replace(/O(?=O)|(?<=O)O/g, 'j');
    });
    TU[1] = setAt(setAt(setAt(TU[1], 6, 'n'), 7, 'n'), 8, 'n');
    TU[2] = setAt(TU[2], 8, 'N');
    TU[3] = setAt(TU[3], 7, 'n');
    // side: the sleeve is the top of the arm, the forearm is bare
    const sideT = (rows) => rows.map((r, i) => {
      if (i === 2) return r.replace(/OO/g, 'JJ').replace(/O/g, 'j');
      if (i >= 3) return r.replace(/O/g, 's');
      return r;
    });
    // messy hair: tufts sticking up and out
    const HD = K.HEAD_D.slice(), HU = K.HEAD_U.slice(), HL = K.HEAD_L.slice();
    HD[0] = '....h.hhhh.h....'; HD[1] = '...hhhHHhhhhhh..'; HD[3] = 'hhhHhhhhhhhhhhh.'; HD[6] = '.hhshhhsshhhshhh';
    HU[0] = '....h.hhhh.h....'; HU[1] = '...hhhHHhhhhhh..'; HU[3] = 'hhhHhhhhhhhhhhh.'; HU[6] = '.hhhhhhhhhhhhhhh'; HU[10] = '..hhhhhhhhhhhh.h';
    HL[0] = '.....hhh.hh.h...'; HL[1] = '...hhhHHhhhhhh..'; HL[3] = '.hhHhhhhhhhhhhhh'; HL[5] = '.hhhhhhhhhhhhhh.'; HL[9] = '.ssessssShhhhhhh';
    if (cap) {
      // blue cap: crown over the top rows, brim over the forehead (front) / sticking out (side)
      HD[0] = '.....bbbbbb.....'; HD[1] = '...bbdbbbbbBb...'; HD[2] = '..bdbbbbbbbbBb..'; HD[3] = '.hbbbbbbbbbbbBh.'; HD[4] = '.hbbbbaabbbbbBh.'; HD[5] = '.dddddddddddddB.'; HD[6] = '.hvvvvvvvvvvvvh.'; HD[7] = '.hhsssssssssshh.';
      HU[0] = '.....bbbbbb.....'; HU[1] = '...bbdbbbbbBb...'; HU[2] = '..bdbbbbbbbbBb..'; HU[3] = '.hbbbbbbbbbbbBh.'; HU[4] = '.hbBBbbbbbbBBBh.'; HU[5] = '.hhhhvvvvvvhhhh.';
      HL[0] = '.....bbbbbb.....'; HL[1] = '...bbdbbbbbBb...'; HL[2] = '..bdbbbbbbbbBb..'; HL[3] = '.bbbbbbbbbbbbBh.'; HL[4] = 'dddddbbbbbbbBhh.'; HL[5] = '.vvvvhhhhhhhhhh.';
    }
    return {
      HD, HU, HL, TD, TU,
      TL: sideT(K.TORSO_L), TLA: sideT(K.TORSO_L_A), TLB: sideT(K.TORSO_L_B),
      LD: legs(K.LEGS_D), LDA: legs(K.LEGS_D_A), LDB: legs(K.LEGS_D_B),
      LL: legs(K.LEGS_L), LLA: legs(K.LEGS_L_A), LLB: legs(K.LEGS_L_B), LLPA: legs(K.LEGS_L_PA), LLPB: legs(K.LEGS_L_PB),
    };
  }
  function shotaChar(cap) {
    const R = shotaRows(cap);
    const P = Object.assign({}, G.KIDPAL, SHOTA);
    const b = (hd, tr, lg, bob) => G.frame(G.kidBuild(hd, tr, lg, { pal: P, bob: bob || 0 }), 9, 25);
    return {
      down: [b(R.HD, R.TD, R.LD), b(R.HD, R.TD, R.LDA, 1), b(R.HD, R.TD, R.LDB, 1)],
      up: [b(R.HU, R.TU, R.LD), b(R.HU, R.TU, R.LDB, 1), b(R.HU, R.TU, R.LDA, 1)],
      // side: stand + step, passing, step, passing like Haru; the arm swings against the near leg
      left: [b(R.HL, R.TL, R.LL), b(R.HL, R.TLB, R.LLA, 1), b(R.HL, R.TL, R.LLPA), b(R.HL, R.TLA, R.LLB, 1), b(R.HL, R.TL, R.LLPB)],
    };
  }
  G.SHOTA_ROWS = shotaRows;
  G.defChar('shota', () => shotaChar(false));
  G.defChar('shota_cap', () => shotaChar(true));

  // ---------------- NURSE: Mr. Sato, light-blue scrubs, lanyard, kind tired face ----------------
  const NURSE = G.pal({
    h: '#1e1a24', H: '#36303e', i: '#4e4658',
    s: '#efc6a2', S: '#cc9c7c', c: '#e2a492', e: '#241a26', m: '#a8665a', b: '#d6a88a',
    a: '#86aec6', A: '#6890ae', L: '#a8cadc', d: '#4e7290',
    l: '#2e3e6a', w: '#ece8e0', W: '#b8b4ac',
    p: '#7aa0ba', P: '#5e84a0', q: '#e4e2dc', Q: '#a8a49c',
  });
  const NURSE_DIRS = {
    down: {
      head: [
        '.....hhhhhh.....',
        '...hhHHhhhhhh...',
        '..hhHiHhhhhhhh..',
        '..hHhhhhhhhhhh..',
        '..hhhhhhhhhhhh..',
        '..hhhhshhhshhh..',
        '..shsssssssshS..',
        '..sssesssseSsS..',
        '..SssbssSsbsSS..',
        '...sssssmmssS...',
        '....SssssssS....',
      ],
      torso: [[
        '....LaasSaaA....',
        '...LaalsSlaaA...',
        '..LLaaallaaaAA..',
        '..sAaaawWaaaAS..',
        '..sAaaawWaaaAS..',
        '..sAaaaaaaaaAS..',
        '..sAaaaaaaaaAS..',
        '..sAAaaaaaaAAS..',
        '..SAaaaaaaaaAS..',
        '...AAAAAAAAAA...',
      ]],
      legs: LEGS_TROUSER.down,
      swing: [2, 13],
    },
    up: {
      head: [
        '.....hhhhhh.....',
        '...hhHHhhhhhh...',
        '..hhHiHhhhhhhh..',
        '..hHhhhhhhhhhh..',
        '..hhhhhhhhhhhh..',
        '..hhhhhhhhhhhh..',
        '..shhhhhhhhhhS..',
        '..shhhhhhhhhhS..',
        '...hhhhhhhhhh...',
        '....hhhhhhhh....',
        '....SssssssS....',
      ],
      torso: [[
        '....LallllaA....',
        '...LaaaaaaaaA...',
        '..LLaaaaaaaaAA..',
        '..sAaaaaaaaaAS..',
        '..sAaaaaaaaaAS..',
        '..sAaaaaaaaaAS..',
        '..sAaaaaaaaaAS..',
        '..sAaaaaaaaaAS..',
        '..SAaaaaaaaaAS..',
        '...AAAAAAAAAA...',
      ]],
      legs: LEGS_TROUSER.up,
      swing: [2, 13],
    },
    left: {
      head: [
        '.....hhhhhh.....',
        '...hhHHhhhhhh...',
        '..hhHiHhhhhhhh..',
        '..hHhhhhhhhhhh..',
        '..hhhhhhhhhhhh..',
        '..shhhshhhhhhh..',
        '..ssssssSShhhh..',
        '.ssessssSShhhh..',
        '..sbssssShhhh...',
        '..msssSShhhh....',
        '...SsssShh......',
      ],
      torso: [[
        '.....saaaA......',
        '....laaaaaA.....',
        '....laaLaaA.....',
        '....waasaaA.....',
        '....aaasaaA.....',
        '....aaasaaA.....',
        '....aaasaaA.....',
        '....aaasaaA.....',
        '....aaaSaaA.....',
        '....AAAAAAA.....',
      ], [
        '.....saaaA......',
        '....laaaaaA.....',
        '....laLaaaA.....',
        '....wsaaaaA.....',
        '...saaaaaaA.....',
        '...saaaaaaA.....',
        '..saaaaaaaA.....',
        '..S.aaaaaaA.....',
        '....aaaaaaA.....',
        '....AAAAAAA.....',
      ], [
        '.....saaaA......',
        '....laaaaaA.....',
        '....laaaLaA.....',
        '....waaaasA.....',
        '....aaaaaasA....',
        '....aaaaaasA....',
        '....aaaaaaAs....',
        '....aaaaaaA.S...',
        '....aaaaaaA.....',
        '....AAAAAAA.....',
      ]],
      legs: LEGS_TROUSER.left,
    },
  };
  G.defChar('nurse', () => adultChar(NURSE, NURSE_DIRS));

  // ---------------- MOM (1958): Fumiko, a young night-shift nurse: white dress and cap, dark grey
  // cardigan, black hair tied back in a low bun ----------------
  const MOM = G.pal({
    h: '#221c28', H: '#3a3044', i: '#5a4e66', r: '#6a3a44',
    s: '#f2cca8', S: '#d0a07e', c: '#eaa496', e: '#2a1e2a', m: '#b8685e',
    g: '#4c4a56', G: '#36343e', n: '#686674', N: '#24222a',
    w: '#ecebe6', W: '#c8c6c0', V: '#9e9c96', u: '#f8f6f0',
    p: '#dcc6b0', P: '#b49c86', q: '#e6e4de', Q: '#9e9a92',
  });
  const MOM_DIRS = {
    down: {
      head: [
        '.....uuuuuu.....',
        '....uWuuuuWu....',
        '...hHiHhhhhhh...',
        '..hHiHhhhhhhhh..',
        '..hhhhhhshhhhh..',
        '..hhhssssssshh..',
        '..hssssssssssh..',
        '..hssessssesSh..',
        '..sscesssSecSS..',
        '...ssssmmsssS...',
        '....SSssssSS....',
      ],
      torso: [[
        '....ngwVVwgG....',
        '...nggwwwwggG...',
        '..nnggwwwwggGG..',
        '..nNggwwwwggNG..',
        '..nNggwwwwggNG..',
        '..nNggwVVwggNG..',
        '..sNggwwwwggNS..',
        '...gggwwwwggG...',
        '...wwwwwwwwwW...',
        '...WWWWWWWWWW...',
      ]],
      legs: LEGS_SKIRT.down,
      swing: [2, 13],
    },
    up: {
      head: [
        '.....uuuuuu.....',
        '....uWuuuuWu....',
        '...hhHiHhhhhh...',
        '..hHiHhhhhhhhh..',
        '..hhhhhhhhhhhh..',
        '..hhhhhrrhhhhh..',
        '..hhhhHiHhhhhh..',
        '..shhHhhhHhhhS..',
        '..ShhhHHHhhhhS..',
        '...hhhhhhhhhh...',
        '....hSSSSSSh....',
      ],
      torso: [[
        '....ngggggG.....',
        '...nggggggggG...',
        '..nnggggggggGG..',
        '..nNggggggggNG..',
        '..nNggggggggNG..',
        '..nNgggGGgggNG..',
        '..sNggggggggNS..',
        '...ggggggggggG..',
        '...wwwwwwwwwW...',
        '...WWWWWWWWWW...',
      ]],
      legs: LEGS_SKIRT.up,
      swing: [2, 13],
    },
    left: {
      head: [
        '.....uuuuuu.....',
        '....uWuuuuWu....',
        '...hHiHhhhhhh...',
        '..hHhhhhhhhhhh..',
        '..hhhhhhhhhhhh..',
        '..ssshhhhhhhhhr.',
        '..ssssssshhhhhhh',
        '.ssesssSShhhhHih',
        '..scsssShhhhhhhh',
        '..msssSShhhh.hh.',
        '...SssShhh......',
      ],
      torso: [[
        '.....wggggG.....',
        '....wwgggggG....',
        '....wwgnNggG....',
        '....wwgnNggG....',
        '....wVgnNggG....',
        '....wwgnNggG....',
        '....wwgsSggG....',
        '....wwgggggG....',
        '....wwwwwwwwW...',
        '....WWWWWWWWW...',
      ], [
        '.....wggggG.....',
        '....wwgggggG....',
        '....wwnNgggG....',
        '....wnNggggG....',
        '...nNVgggggG....',
        '..sSwwgggggG....',
        '....wwgggggG....',
        '....wwgggggG....',
        '....wwwwwwwwW...',
        '....WWWWWWWWW...',
      ], [
        '.....wggggG.....',
        '....wwgggggG....',
        '....wwggnNgG....',
        '....wwgggnNG....',
        '....wVggggnNG...',
        '....wwgggggGsS..',
        '....wwgggggG....',
        '....wwgggggG....',
        '....wwwwwwwwW...',
        '....WWWWWWWWW...',
      ]],
      legs: LEGS_SKIRT.left,
    },
  };
  G.defChar('mom_memory', () => adultChar(MOM, MOM_DIRS));

  // ======================================================================
  // STAFF: the party guests are care staff, drawn at the Caretaker's scale (about 1.8x Haru):
  // white pleated surgical masks with ear loops, striped paper party-hat cones, eyes lost in the
  // shadow under the brow. staff1 cardigan over teal scrubs + lanyard; staff2 apron over rose
  // scrubs, hair in a bun; staff3 older man, grey hair, glasses glinting, olive sweater.
  // ======================================================================
  // canvas 24x56, anchor (12, 54): shoes on rows 52-53, legs from the hip row 40, torso rows 24-39,
  // neck 22-23, head 10-21, hat above. Head/torso/hat/arms bob down 1px on step frames.
  const SW = 24, SH = 56, SCX = 12;
  const S_HIP = 40, S_TOP = 24, S_HEAD = 10;
  const STAFF_HEADS = {
    short: {
      down: [
        '....hhhhhh....',
        '..hhHHhhhhhh..',
        '.hHHhhhhhhhjh.',
        '.hHhhhhhhhhjh.',
        '.hhhhhhhhhhjh.',
        '.hhvhhhhhvhjj.',
        '.hvvvvvvvvvvj.',
        '.svvxvvvvxvvS.',
        '.lmmmmmmmmmMl.',
        '..nnnnnnnnnN..',
        '..mmmmmmmmmM..',
        '...MmmmmmmM...',
      ],
      up: [
        '....hhhhhh....',
        '..hhHHhhhhhh..',
        '.hHHhhhhhhhjh.',
        '.hHhhhhhhhhjh.',
        '.hhhhhhhhhhjh.',
        '.hhhhhhhhhhjh.',
        '.hhhhhhhhhjjj.',
        '.shhhhhhhhjjS.',
        '.lhhhhhhhjjjl.',
        '..hhhhhhjjjj..',
        '...jjjjjjjj...',
        '....SSSSSS....',
      ],
      left: [
        '.....hhhhhh...',
        '...hhHHhhhhhh.',
        '..hHHhhhhhhhjh',
        '..hHhhhhhhhhjh',
        '.hhhhhhhhhhhjh',
        '.hvhhhhhhhhjjh',
        '.vvvvvvhhhhjj.',
        'vvxvvvSshhhjj.',
        'mmmmmMlShhjj..',
        'nnnnnNlShjj...',
        '.mmmmMSSjj....',
        '..MmmM........',
      ],
    },
    bun: {
      down: [
        '.....hHhh.....',
        '....hHihhj....',
        '..hhHhhhhhhh..',
        '.hHhhhhhhhhjh.',
        '.hHhhhhhhhhjh.',
        '.hhhhhhhhhhjj.',
        '.hhvvvvvvvvjh.',
        '.hvvxvvvvxvvj.',
        '.lmmmmmmmmmMl.',
        '..nnnnnnnnnN..',
        '..mmmmmmmmmM..',
        '...MmmmmmmM...',
      ],
      up: [
        '....hhhhhh....',
        '..hhhHHhhhhh..',
        '.hhhhHiHhhhjh.',
        '.hhhHhhhHhhjh.',
        '.hhhhHHHhhhjh.',
        '.hhhhhhhhhhjh.',
        '.hhhhhhhhhhjh.',
        '.hhhhhhhhhjjj.',
        '.lhhhhhhhhjjl.',
        '..hhhhhhhhjj..',
        '...hhhhhhhj...',
        '....SSSSSS....',
      ],
      left: [
        '....hhhhhh....',
        '..hhHHhhhhhHh.',
        '.hHHhhhhhhhiHh',
        '.hHhhhhhhhhhhj',
        '.hhhhhhhhhhjjj',
        '.hvhhhhhhhhjj.',
        '.vvvvvvhhhhj..',
        'vvxvvvShhhhj..',
        'mmmmmMlShhj...',
        'nnnnnNlShhj...',
        '.mmmmMSShj....',
        '..MmmM........',
      ],
    },
    grey: {
      down: [
        '.....hhhh.....',
        '...hhHHhhhh...',
        '..hHhhhhhhhj..',
        '.hHhhhhhhhhjj.',
        '.hhssssssssjh.',
        '.hsSSSSSSSSSj.',
        '.hvgggvvgggvj.',
        '.svvxvvvvxvvS.',
        '.lmmmmmmmmmMl.',
        '..nnnnnnnnnN..',
        '..mmmmmmmmmM..',
        '...MmmmmmmM...',
      ],
      up: [
        '.....hhhh.....',
        '...hhHHhhhh...',
        '..hHhhhhhhhj..',
        '.hHhhhhhhhhjj.',
        '.hhhhhhhhhhhj.',
        '.hhhhhhhhhhhj.',
        '.hhhhhhhhhhjj.',
        '.shhhhhhhhhjS.',
        '.lhhhhhhhhjjl.',
        '..hhhhhhhjjj..',
        '...SSSSSSSS...',
        '....SSSSSS....',
      ],
      left: [
        '.....hhhhh....',
        '...hhHHhhhhh..',
        '..hHhhhhhhhhj.',
        '..sshhhhhhhhjj',
        '.ssssShhhhhhhj',
        '.SSSSShhhhhhj.',
        '.vgggvhhhhhhj.',
        'vvxvvvSshhhjj.',
        'mmmmmMlShhhj..',
        'nnnnnNlShhj...',
        '.mmmmMSShj....',
        '..MmmM........',
      ],
    },
  };
  // front legs (12 + 2 shoe rows, 24 wide): stand, left foot lifted, right foot lifted
  function staffLegsD() {
    const row = (l, r) => '........' + l + r + '........';
    const hip = '.......pppppppPPP.......';
    const both = (n) => Array(n).fill(row('pppP', 'ppPP'));
    const shoes = ['.......qqqqQqqqQQ.......', '.......QQQQQQQQQQ.......'];
    const stand = [hip].concat(both(11), shoes);
    const lift = (side) => {
      const rows = [hip].concat(both(9));
      // the lifted leg ends 2px higher; its shoe is raised and seen a little from above
      const L = side === 0;
      rows.push(L ? '.......qqqqQppPP........' : '........pppPqqqQQ.......');
      rows.push(L ? '.......QQQQQppPP........' : '........pppPQQQQQ.......');
      rows.push(L ? '............ppPP........' : '........pppP............');
      rows.push(L ? '............qqqQQ.......' : '.......qqqqQ............');
      rows.push(L ? '............QQQQQ.......' : '.......QQQQQ............');
      return rows;
    };
    return [stand, lift(0), lift(1)];
  }
  const STAFF_LEGS_D = staffLegsD();
  const STAFF_LEGS_L = sideLegs({ n: 12, W: SW, hip: 10, w: 4, fw: 3, fo: 1, e: 'P', s: 4, shoe: 6, lb: 3, lf: 2, ln: 2 });

  function staffHat(px, bx, by, T) {
    // a paper cone 7 rows tall, base centred on bx, sitting on row by; diagonal stripes; a crinkled
    // paper pom on the tip
    const h = 6;
    for (let r = 0; r <= h; r++) {
      const wdt = r + 1, sh = Math.round((T.tilt * (h - r)) / h);
      const x0 = bx - Math.floor(wdt / 2) + sh;
      for (let i = 0; i < wdt; i++) {
        const x = x0 + i, y = by - h + r;
        let c = ((x + r * 2 + 64) >> 1) & 1 ? T.hatA : T.hatB;
        if (i === wdt - 1 && wdt > 2) c = G.darken(c, 0.28);
        else if (i === 0 && wdt > 2) c = G.lighten(c, 0.12);
        if (r === h) c = G.darken(c, i === wdt - 1 ? 0.4 : 0.18);
        px.set(x, y, c);
      }
    }
    const tx = bx + T.tilt;
    px.set(tx, by - h - 1, T.pom); px.set(tx - 1, by - h - 2, T.pom); px.set(tx + 1, by - h - 2, G.darken(T.pom, 0.2));
    px.set(tx, by - h - 2, G.lighten(T.pom, 0.3));
  }

  // torso pixels for one outfit, view and frame (y0 = shoulder row)
  function staffTorso(px, T, dir, y0) {
    const P = T.pal;
    if (dir === 'left') {
      // side: body columns 8-15, chest to the left
      for (let r = 0; r < 16; r++) {
        const x0 = r === 0 ? 9 : 8, x1 = r === 0 ? 14 : 15;
        for (let x = x0; x <= x1; x++) px.set(x, y0 + r, x >= 14 ? P.C : x === x0 ? P.k : P.c);
      }
      T.side(px, P, y0);
      return;
    }
    for (let r = 0; r < 16; r++) {
      const x0 = r === 0 ? 8 : 7, x1 = r === 0 ? 15 : 16;
      for (let x = x0; x <= x1; x++) px.set(x, y0 + r, x === x0 ? P.k : x >= x1 - 1 ? P.C : P.c);
    }
    if (dir === 'down') T.front(px, P, y0); else T.back(px, P, y0);
  }
  // arms. front/back: 2px columns outside the body, sleeves to the wrist, long grey-pale hands
  // reaching the thigh; sw shifts a hand 1px (-1 swung away, +1 toward the viewer)
  function staffArmsD(px, T, y0, swL, swR) {
    const P = T.pal;
    for (const [x, sw, lit] of [[5, swL, true], [17, swR, false]]) {
      const end = y0 + 13 + sw;
      for (let y = y0 + 1; y <= end; y++) { px.set(x, y, lit ? P.k : P.c); px.set(x + 1, y, lit ? P.c : P.C); }
      if (T.cuff) { px.set(x, end, P.K); px.set(x + 1, end, P.K); }
      for (let y = end + 1; y <= end + 3; y++) { px.set(x, y, P.s); px.set(x + 1, y, P.S); }
      px.set(lit ? x : x + 1, end + 3, P.S);
    }
  }
  // side arm: from the shoulder (11, y0+1), hand dx px forward (-) or back (+)
  function staffArmL(px, T, y0, dx) {
    const P = T.pal;
    const len = dx ? 12 : 13;
    let last = [11, y0 + 1];
    for (let i = 0; i <= len; i++) {
      const t = i / len, x = Math.round(11 + dx * t * t * 0.9 + dx * t * 0.1), y = y0 + 1 + i;
      px.set(x, y, P.k); px.set(x + 1, y, P.C);
      last = [x, y];
    }
    if (T.cuff) { px.set(last[0], last[1], P.K); px.set(last[0] + 1, last[1], P.K); }
    const [hx, hy] = last;
    px.set(hx, hy + 1, P.s); px.set(hx + 1, hy + 1, P.S);
    px.set(hx, hy + 2, P.s); px.set(hx + 1, hy + 2, P.S);
    px.set(hx + (dx > 0 ? 1 : 0), hy + 3, P.S);
  }

  function staffChar(T) {
    const P = T.pal, heads = STAFF_HEADS[T.hair];
    const build = (dir, legs, bob, armA, armB) => {
      const px = new G.PX(SW, SH);
      // apron ties and other things behind the body
      const y0 = S_TOP + bob;
      px.stamp(legs, P, 0, S_HIP);
      if (dir === 'left') {
        staffTorso(px, T, dir, y0);
        if (T.after) T.after(px, P, y0, dir);
        // neck
        px.rect(10, y0 - 2, 3, 2, P.S); px.set(10, y0 - 2, P.s);
        px.stamp(heads.left, P, 5, S_HEAD + bob);
        staffArmL(px, T, y0, armA);
        staffHat(px, 11 + (T.hatSide || 0), S_HEAD + bob + 1, T);
      } else {
        staffTorso(px, T, dir, y0);
        if (T.after) T.after(px, P, y0, dir);
        px.rect(10, y0 - 2, 4, 2, P.S); px.set(10, y0 - 2, P.s);
        px.stamp(heads[dir], P, 5, S_HEAD + bob);
        staffArmsD(px, T, y0, armA, armB);
        staffHat(px, 12 + (T.hatD || 0), S_HEAD + bob + 1, T);
      }
      px.outline();
      return G.frame(px, SCX, 54);
    };
    const L = STAFF_LEGS_D;
    return {
      down: [build('down', L[0], 0, 0, 0), build('down', L[1], 1, -1, 1), build('down', L[2], 1, 1, -1)],
      up: [build('up', L[0], 0, 0, 0), build('up', L[2], 1, -1, 1), build('up', L[1], 1, 1, -1)],
      left: [
        build('left', STAFF_LEGS_L[0], 0, 0),
        build('left', STAFF_LEGS_L[1], 1, 4),
        build('left', STAFF_LEGS_L[2], 0, 0),
        build('left', STAFF_LEGS_L[3], 1, -4),
        build('left', STAFF_LEGS_L[4], 0, 0),
      ],
    };
  }
  const MASK_PAL = { m: '#eef1f2', M: '#b2bac0', n: '#cdd4d8', l: '#c8ccd0', v: '#241c22', x: '#4c4046' };

  // staff1: cardigan (open) over teal scrubs, a lanyard with an ID card; white clogs
  const STAFF1 = {
    hair: 'short', tilt: 1, hatD: 0, hatSide: 0,
    hatA: C('#c87e94'), hatB: C('#ece2cc'), pom: C('#e2c45e'),
    pal: G.pal(Object.assign({}, MASK_PAL, {
      h: '#28222e', H: '#3e3648', i: '#544a60', j: '#18141c', s: '#e2b898', S: '#b88a6c',
      c: '#6a5848', k: '#86705a', C: '#4e4036', K: '#382e28',
      a: '#5e8e8a', A: '#446c6a', L: '#7aaaa4', y: '#34446e', w: '#e8e6de', b: '#8aa0b8',
      p: '#4a6e6c', P: '#344e4e', q: '#dcd8d0', Q: '#9a968e',
    })),
    front(px, P, y0) {
      for (let r = 0; r < 16; r++) for (let x = 10; x <= 13; x++) px.set(x, y0 + r, x === 13 ? P.A : x === 10 ? P.L : P.a);
      // V neck
      px.set(11, y0, P.S); px.set(12, y0, P.S); px.set(11, y0 + 1, P.s); px.set(12, y0 + 1, P.S); px.set(11, y0 + 2, P.S);
      // cardigan edges fall straight down beside the scrubs, pockets low
      for (let r = 1; r < 16; r++) { px.set(9, y0 + r, P.k); px.set(14, y0 + r, P.C); }
      px.hline(7, 8, y0 + 11, P.K); px.hline(15, 16, y0 + 11, P.K);
      for (let x = 7; x <= 16; x++) px.set(x, y0 + 15, x >= 10 && x <= 13 ? P.A : P.K);
      // lanyard and ID card
      px.set(10, y0 + 1, P.y); px.set(13, y0 + 1, P.y); px.set(10, y0 + 2, P.y); px.set(13, y0 + 2, P.y);
      px.set(11, y0 + 3, P.y); px.set(12, y0 + 3, P.y);
      px.rect(11, y0 + 4, 2, 3, P.w); px.set(11, y0 + 5, P.b); px.set(12, y0 + 6, P.Q);
    },
    back(px, P, y0) {
      px.hline(10, 13, y0, P.a); px.set(13, y0, P.A);
      for (let r = 2; r < 15; r++) px.set(12, y0 + r, P.C);
      for (let x = 7; x <= 16; x++) px.set(x, y0 + 15, P.K);
      px.set(10, y0, P.y); px.set(13, y0, P.y);
    },
    side(px, P, y0) {
      // scrubs at the open front, lanyard card hanging forward
      for (let r = 1; r < 16; r++) { px.set(8, y0 + r, P.a); px.set(9, y0 + r, P.k); }
      px.set(9, y0, P.S); px.set(9, y0 + 1, P.y); px.set(8, y0 + 2, P.y);
      px.rect(7, y0 + 3, 2, 3, P.w); px.set(7, y0 + 4, P.b);
      for (let x = 8; x <= 15; x++) px.set(x, y0 + 15, x === 8 ? P.A : P.K);
    },
  };
  // staff2: rose scrubs under a long white apron (straps, a pocket, a bow at the back); hair in a bun
  const STAFF2 = {
    hair: 'bun', tilt: -1, hatD: 0, hatSide: 0,
    hatA: C('#d8bc5a'), hatB: C('#5c9692'), pom: C('#d07070'),
    pal: G.pal(Object.assign({}, MASK_PAL, {
      h: '#4a3428', H: '#6a4a36', i: '#8a6446', j: '#30221a', s: '#f0c8a8', S: '#c89a7e',
      c: '#a87482', k: '#c08e9a', C: '#845864', K: '#5e3e48',
      w: '#ebe7dc', W: '#bdb6a6', V: '#9a9384',
      p: '#9a6c7a', P: '#74505c', q: '#e8e6e0', Q: '#a29e96',
    })),
    front(px, P, y0) {
      // bib and straps
      for (let r = 0; r < 3; r++) { px.set(9, y0 + r, P.w); px.set(14, y0 + r, P.W); }
      px.set(11, y0, P.S); px.set(12, y0, P.S);
      for (let r = 3; r < 16; r++) for (let x = 8; x <= 15; x++) px.set(x, y0 + r, x === 15 ? P.W : x === 8 ? P.W : P.w);
      px.hline(9, 14, y0 + 3, P.w);
      px.hline(8, 15, y0 + 8, P.W);
      px.rect(10, y0 + 10, 4, 1, P.V); px.set(10, y0 + 11, P.V); px.set(13, y0 + 11, P.V);
    },
    back(px, P, y0) {
      // straps crossing, the bow at the waist
      for (let r = 0; r < 8; r++) { px.set(8 + Math.round(r * 0.9), y0 + r, P.w); px.set(15 - Math.round(r * 0.9), y0 + r, P.W); }
      px.hline(7, 16, y0 + 8, P.w); px.set(16, y0 + 8, P.W);
      px.set(10, y0 + 7, P.w); px.set(13, y0 + 7, P.w); px.set(11, y0 + 8, P.W); px.set(12, y0 + 8, P.W);
      px.set(10, y0 + 9, P.w); px.set(13, y0 + 9, P.W); px.set(11, y0 + 10, P.w); px.set(12, y0 + 11, P.W);
    },
    side(px, P, y0) {
      // apron front stands a little proud of the body; the bow sticks out at the back
      px.set(9, y0, P.w); px.set(9, y0 + 1, P.w); px.set(9, y0 + 2, P.w);
      for (let r = 3; r < 16; r++) { px.set(7, y0 + r, P.w); px.set(8, y0 + r, P.w); px.set(9, y0 + r, P.W); }
      px.hline(9, 15, y0 + 8, P.w);
      px.set(16, y0 + 7, P.w); px.set(16, y0 + 9, P.W); px.set(17, y0 + 8, P.W);
    },
    after(px, P, y0, dir) {
      // the apron skirt hangs over the thighs
      if (dir === 'down') for (let r = 16; r < 20; r++) for (let x = 8; x <= 15; x++) px.set(x, y0 + r, r === 19 || x === 15 ? P.W : P.w);
      if (dir === 'left') for (let r = 16; r < 20; r++) for (let x = 7; x <= 9; x++) px.set(x, y0 + r, r === 19 ? P.W : P.w);
    },
  };
  // staff3: older man, grey hair, glasses, olive sweater with a pale knit band and ribbed cuffs
  const STAFF3 = {
    hair: 'grey', tilt: 0, hatD: 0, hatSide: 1, cuff: true,
    hatA: C('#9484b8'), hatB: C('#e6e2ea'), pom: C('#dcdce4'),
    pal: G.pal(Object.assign({}, MASK_PAL, {
      h: '#8a8890', H: '#aeacb4', i: '#c8c6ce', j: '#5e5c66', s: '#dcb090', S: '#b08466', g: '#a8b4bc',
      c: '#76703e', k: '#928a50', C: '#585230', K: '#3e3a22', w: '#d8d0b4',
      p: '#5a4a3e', P: '#3e322a', q: '#3e3028', Q: '#221a16',
    })),
    front(px, P, y0) {
      // shirt collar points in the crew neck
      px.hline(10, 13, y0, P.C); px.set(10, y0, P.w); px.set(13, y0, P.w); px.set(11, y0, P.S); px.set(12, y0, P.S);
      // knit band across the chest
      for (let x = 7; x <= 16; x++) { px.set(x, y0 + 4, (x & 1) ? P.w : P.C); px.set(x, y0 + 5, P.K); px.set(x, y0 + 3, P.K); }
      // ribbed hem
      for (let x = 7; x <= 16; x++) { px.set(x, y0 + 14, (x & 1) ? P.c : P.C); px.set(x, y0 + 15, (x & 1) ? P.C : P.K); }
    },
    back(px, P, y0) {
      px.hline(10, 13, y0, P.C);
      for (let x = 7; x <= 16; x++) { px.set(x, y0 + 4, (x & 1) ? P.w : P.C); px.set(x, y0 + 5, P.K); px.set(x, y0 + 3, P.K); }
      for (let x = 7; x <= 16; x++) { px.set(x, y0 + 14, (x & 1) ? P.c : P.C); px.set(x, y0 + 15, (x & 1) ? P.C : P.K); }
    },
    side(px, P, y0) {
      px.set(9, y0, P.w); px.set(10, y0, P.C);
      for (let x = 8; x <= 15; x++) { px.set(x, y0 + 4, (x & 1) ? P.w : P.C); px.set(x, y0 + 5, P.K); px.set(x, y0 + 3, P.K); }
      for (let x = 8; x <= 15; x++) { px.set(x, y0 + 14, (x & 1) ? P.c : P.C); px.set(x, y0 + 15, (x & 1) ? P.C : P.K); }
    },
  };
  G.defChar('staff1', () => staffChar(STAFF1));
  G.defChar('staff2', () => staffChar(STAFF2));
  G.defChar('staff3', () => staffChar(STAFF3));
  G.STAFF = { STAFF1, STAFF2, STAFF3, staffChar, heads: STAFF_HEADS, hat: staffHat };

  // ======================================================================
  // CARETAKER_FACE: the finale reveal. Same body as the Caretaker (down, frame 0), head raised,
  // the mask pulled down under his chin: a young, tired, kind face (Mr. Sato). He holds up his
  // staff ID card so Haru can read it: SATO.
  // ======================================================================
  const F3 = { S: '###|#..|###|..#|###', A: '.#.|#.#|###|#.#|#.#', T: '###|.#.|.#.|.#.|.#.', O: '###|#.#|#.#|#.#|###' };
  function text3(px, s, x, y, col) {
    for (const ch of s) { F3[ch].split('|').forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === '#') px.set(x + i, y + j, col); }); x += 4; }
  }
  G.defSprite('caretaker_face', () => {
    const CT = G.CARETAKER, P = CT.PAL;
    return CT.body('down', 0, (px, cx, hy) => {
      const y0 = hy + 11;
      const skin = C('#dcb494'), skinL = C('#ecc8a8'), skinS = C('#b88e72'), skinD = C('#94705a');
      const hair = C('#1e1a22'), ink = C('#2a1e24'), mouth = C('#a06458');
      // the face, the cap pushed back; hand-placed 7x6 (columns cx-3..cx+3, rows hy+6..hy+11):
      // soft brows, tired eyes with shadows under them, a small mouth, the mask pulled down
      // around his chin with its loops still over the ears
      CT.raisedHead(px, cx, hy, skin);
      const FACE = [
        'sDsssDS',
        'Lesssed',
        'sSsSsSS',
        'Lssssss',
        'sSmMmSS',
        'wwwwwwW',
      ];
      const FP = { s: skin, L: skinL, S: skinS, D: skinD, e: ink, d: C('#3a2a30'), m: mouth, M: C('#b8786a'), w: P.mask, W: P.maskS };
      px.stamp(FACE, FP, cx - 3, hy + 6);
      px.hline(cx - 2, cx + 2, hy + 12, P.maskB); px.set(cx + 2, hy + 12, P.maskS);
      px.hline(cx - 3, cx + 3, hy + 5, C('#2a2e36'));
      px.set(cx - 4, hy + 5, hair); px.set(cx + 4, hy + 5, hair); px.set(cx - 4, hy + 6, hair); px.set(cx + 4, hy + 6, C('#16121a'));
      px.set(cx - 4, hy + 7, skin); px.set(cx + 4, hy + 7, skinS); px.set(cx - 4, hy + 8, skinS); px.set(cx + 4, hy + 8, skinD);
      px.set(cx - 4, hy + 9, P.loop); px.set(cx + 4, hy + 9, P.maskS); px.set(cx - 4, hy + 10, P.loop); px.set(cx + 4, hy + 10, P.maskD);
      // he is a person: warm hands and neck, not the grey of the nightmare
      px.replace(P.skin, C('#d4ac8c')); px.replace(P.skinD, C('#a8826a'));
      // his right arm comes up to hold the ID card in front of his chest: clear the hanging arm
      for (let y = y0 + 1; y <= y0 + 26; y++) for (let x = cx - 9; x <= cx - 6; x++) px.set(x, y, 0);
      px.thick(cx - 6, y0 + 2, cx - 7, y0 + 7, 1.0, P.uniD);
      // the card: white plastic, a blue band, SATO in black
      const x0 = cx - 9, yc = y0 + 4;
      px.rect(x0, yc, 17, 7, C('#eceae4'));
      px.hline(x0, x0 + 16, yc, C('#4a6a9a')); px.set(x0 + 16, yc, C('#3a5480'));
      px.vline(x0 + 16, yc + 1, yc + 6, C('#b8b4ac')); px.hline(x0 + 1, x0 + 16, yc + 6, C('#b8b4ac'));
      text3(px, 'SATO', x0 + 2, yc + 1, C('#24242e'));
      // the clip and lanyard up to his neck
      px.set(cx, yc - 1, C('#9a9aa4')); px.set(cx - 1, yc - 2, C('#3a4a7a')); px.set(cx + 1, yc - 2, C('#3a4a7a'));
      px.set(cx - 1, yc - 3, C('#3a4a7a')); px.set(cx + 1, yc - 3, C('#3a4a7a'));
      // the hand holding its edge, thumb over the front
      const hand = C('#d4ac8c'), handD = C('#a8826a');
      px.rect(x0 - 1, yc + 1, 2, 4, hand); px.set(x0 - 1, yc + 4, handD); px.set(x0 + 1, yc + 2, hand); px.set(x0 + 1, yc + 3, handD);
    });
  });
})(window.G);
