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
    '...F.F....F.....',
    '...FkF...FkF....',
    '...ffffffffF....',
    '..lfkfffkfffF...',
    '..lffkfkfffFF...',
    '...lfffffffF....',
    '..lfkfffffkffF..',
    '..lffkfkfkfffF..',
    '..lffffffffffF..',
    '...lfffffffFF...',
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
    px.stamp(CAT_BACK, CAT, 1, 1 + bob);
    // hind legs; a lifted paw shows its pink pad
    const lift = [[0, 0], [0, 1], [1, 0]][k];
    for (const [x, li] of [[4, lift[0]], [10, lift[1]]]) {
      for (let y = 10 + bob; y < 11 - li; y++) { cset(px, x, y, CAT.f); cset(px, x + 1, y, CAT.F); }
      cset(px, x, 11 - li, li ? CAT.p : CAT.F); cset(px, x + 1, 11 - li, li ? CAT.p : CAT.k);
    }
    // tail raised over the back, swaying
    catTail(px, [[[7, 9], [8, 8], [9, 7], [10, 6], [10, 5], [10, 4]], [[7, 9], [8, 8], [9, 7], [10, 6], [11, 5], [11, 4]], [[7, 9], [8, 8], [9, 7], [9, 6], [10, 5], [10, 4]]][k].map(([x, y], i) => [x, y]), bob);
    // light edge on the tail so it separates from the back
    const tp = [[[8, 8], [9, 7], [10, 6]], [[8, 8], [9, 7], [10, 6]], [[8, 8], [9, 7], [9, 6]]][k];
    for (const [x, y] of tp) cset(px, x - 1, y + bob, CAT.L);
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
  // dirs: {down|up|left: {head, torso:[3], legs:[3], hx, extra(step) -> [[rows,x,y,fixed]]}}
  function adultChar(pal, dirs, ov) {
    const out = {};
    for (const d of ['down', 'up', 'left']) {
      const D = dirs[d];
      out[d] = [0, 1, 2].map((k) => {
        const head = D.head, torso = D.torso[k] || D.torso[0], legs = D.legs[k];
        const H = head.length + torso.length + legs.length - (ov || 0);
        const bob = k ? 1 : 0;
        const yl = H - legs.length, yt = yl - torso.length + bob, yh = yt - head.length + (ov || 0);
        const layers = [];
        if (D.back) for (const e of D.back(k)) layers.push([e[0], e[1], e[2] + (e[3] ? 0 : yt)]);
        layers.push([legs, 0, yl], [torso, 0, yt], [head, D.hx || 0, yh]);
        if (D.extra) for (const e of D.extra(k)) layers.push([e[0], e[1], e[2] + (e[3] ? 0 : yt)]);
        return fig(pal, 16, H, layers, 8, D.post ? (px) => D.post(px, k, yt + 1, yh + 1) : null);
      });
    }
    return out;
  }
  // shared leg blocks: p/P trousers or stockings, q/Q shoes
  const LEGS_TROUSER = {
    down: [
      ['.....pppppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '....qqqQqqqQ....', '....QQQ..QQQ....'],
      ['.....pppppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '....qqqQppP.....', '....QQQ.qqqQ....', '........QQQ.....'],
      ['.....pppppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPppP.....', '.....ppPqqqQ....', '....qqqQQQQ.....', '....QQQ.........'],
    ],
    left: [
      ['......pppP......', '......pppP......', '......pppP......', '......pppP......', '......pppP......', '......pppP......', '....qqqqqQ......', '....QQQQQQ......'],
      ['......pppP......', '.....pppPPP.....', '.....ppP.PPP....', '....ppP...PPP...', '....ppP....PP...', '...ppP.....PP...', '.qqqqQ....QQQ...', '.QQQQQ.....QQ...'],
      ['......PppP......', '.....PPPppp.....', '....PPP..ppP....', '....PP....ppP...', '....PP.....ppP..', '....PP.....ppP..', '..QQQQ...qqqqQ..', '..QQQQ...QQQQQ..'],
    ],
  };
  LEGS_TROUSER.up = [LEGS_TROUSER.down[0], LEGS_TROUSER.down[2], LEGS_TROUSER.down[1]];
  // thin legs under a coat or dress (6 rows)
  const LEGS_SKIRT = {
    down: [
      ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '....qqQ..qqQ....', '....QQQ..QQQ....'],
      ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '....qqQ..pP.....', '....QQQ..qqQ....', '.........QQQ....'],
      ['.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '.....pP..qqQ....', '....qqQ..QQQ....', '....QQQ.........'],
    ],
    left: [
      ['......pP........', '......pP........', '......pP........', '......pP........', '.....qqQ........', '.....QQQ........'],
      ['......pPP.......', '.....pP..P......', '....pP....PP....', '....pP....PP....', '...qqQ....QQQ...', '...QQQ.....QQ...'],
      ['......PpP.......', '.....PP..pP.....', '....PP....pP....', '....PP....pP....', '...QQQ....qqQ...', '...QQQ....QQQ...'],
    ],
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
      extra: (k) => [[ORANGES, 0 + (k === 2 ? 1 : 0), 7]],
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
      extra: (k) => [[ORANGES, 12 - (k === 1 ? 1 : 0), 7]],
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
      extra: (k) => [[ORANGES, [6, 2, 10][k], 7]],
    },
  };
  G.defChar('yui', () => adultChar(YUI, YUI_DIRS));

  // ---------------- KURODA (resident, Haru's scale): thin old pianist, wild white hair, worn black suit ----------------
  const KURODA = G.pal({
    w: '#eceaf0', W: '#c2c0cc', V: '#9290a2', v: '#66647a',
    s: '#e6bc9a', S: '#c49274', r: '#a87862', e: '#261c26', m: '#8e5a50',
    j: '#3a3742', J: '#25232b', k: '#57525f', b: '#8a8070',
    t: '#e0dace', T: '#aca69a', x: '#6e2c36', X: '#4a1c26',
    p: '#2f2d37', P: '#1e1c24', q: '#4a3630', Q: '#22181a',
  });
  // thin trousers and old black shoes, 6 rows (shared by the down and up views)
  const KLEGS_D = [
    ['.....pppppP.....', '.....pP..pP.....', '.....pP..pP.....', '.....pP..pP.....', '....qqQ..qqQ....', '....QQQ..QQQ....'],
    ['.....pppppP.....', '.....pP..pP.....', '.....pP..pP.....', '....qqQ..pP.....', '....QQQ..qqQ....', '.........QQQ....'],
    ['.....pppppP.....', '.....pP..pP.....', '.....pP..pP.....', '.....pP..qqQ....', '....qqQ..QQQ....', '....QQQ.........'],
  ];
  const KLEGS_L = [
    ['......pppP......', '......ppP.......', '......ppP.......', '......ppP.......', '....qqqqQ.......', '....QQQQQ.......'],
    ['......pppP......', '.....ppPPP......', '.....pp..PP.....', '....pp....PP....', '..qqqqQ..QQQ....', '..QQQQ...QQ.....'],
    ['......pppP......', '.....PPppP......', '.....PP..pp.....', '....PP....pp....', '..QQQQ...qqqQ...', '..QQQ....QQQQ...'],
  ];
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
        '.....wWwwWw.....',
        '...wwWsssSwwW...',
        '..wwWsssssSWWV..',
        '.wWwWsssSSWWWVV.',
        'wWWwWWSSSWWVWVVv',
        'wWVWwWWWWVWVWVVv',
        '.sVWWVWVWVVVVVS.',
        '.SvVWVVWVVvVVvS.',
        '..vVVvVVvVVvVv..',
        '...vVvvVvvVvv...',
        '....SSssssSS....',
      ],
      torso: [[
        '....kjjttjjJ....',
        '...kjjjjjjjjJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjJjjJJ...',
        '...sJjjjJjjJS...',
        '....JJJJJJJJ....',
      ], [
        '....kjjttjjJ....',
        '...kjjjjjjjjJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjjjjJJ...',
        '...kJjjjJjjJS...',
        '...kJjjjJjjJ....',
        '...sJJJJJJJJ....',
      ], [
        '....kjjttjjJ....',
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
        '....jjjjkjJ.....',
        '....jjjjjkJ.....',
        '....jjjjjjkJ....',
        '....jjjjjjJs....',
        '....JJJJJJJ.....',
      ], [
        '.....tjjjJ......',
        '....xjjjjjJ.....',
        '....jjkjjjJ.....',
        '....jkjjjjJ.....',
        '...kjjjjjjJ.....',
        '...sjjjjjjJ.....',
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
    const shins = (rows) => rows.map((r, i) => (i >= 2 && i <= 3 ? r.replace(/p/g, 's').replace(/P/g, 'S') : r));
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
      LL: legs(K.LEGS_L), LLA: legs(K.LEGS_L_A), LLB: legs(K.LEGS_L_B),
    };
  }
  function shotaChar(cap) {
    const R = shotaRows(cap);
    const P = Object.assign({}, G.KIDPAL, SHOTA);
    const b = (hd, tr, lg, bob) => G.frame(G.kidBuild(hd, tr, lg, { pal: P, bob: bob || 0 }), 9, 25);
    return {
      down: [b(R.HD, R.TD, R.LD), b(R.HD, R.TD, R.LDA, 1), b(R.HD, R.TD, R.LDB, 1)],
      up: [b(R.HU, R.TU, R.LD), b(R.HU, R.TU, R.LDB, 1), b(R.HU, R.TU, R.LDA, 1)],
      left: [b(R.HL, R.TL, R.LL), b(R.HL, R.TLA, R.LLA, 1), b(R.HL, R.TLB, R.LLB, 1)],
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

  // ---------------- MOM (1974): young, long black hair tied back, apron over a yellow dress ----------------
  const MOM = G.pal({
    h: '#221c28', H: '#3a3044', i: '#5a4e66', r: '#9a4a4a',
    s: '#f2cca8', S: '#d0a07e', c: '#eaa496', e: '#2a1e2a', m: '#b8685e',
    y: '#d2b04e', Y: '#a88a34', u: '#e4c86a',
    w: '#ece6d6', W: '#c6bea8', V: '#a29884',
    p: '#dcb492', P: '#b48c6c', q: '#6a4232', Q: '#46281e',
  });
  const PONY_U = ['.r.', 'hHh', 'hHh', 'hhh', 'hHh', '.h.'];
  const MOM_DIRS = {
    down: {
      head: [
        '......hhhh......',
        '....hhHiHhhh....',
        '...hHiHhhhhhh...',
        '..hHhhhhhhhhhh..',
        '..hhhhhhshhhhh..',
        '..hhhssssssshh..',
        '..hssssssssssh..',
        '..hssessssesSh..',
        '..hscesssSecSh..',
        '...hsssmmsssh...',
        '....hSssssSh....',
      ],
      torso: [[
        '....uywwwwyY....',
        '...uyywwwwyyY...',
        '..uuyywwwwyyYY..',
        '..sYVwwwwwwVYS..',
        '..sYVVVVVVVVYS..',
        '..sYwwwwwwwwYS..',
        '..SywwwwwwwwYS..',
        '...ywwwwwwwwY...',
        '...yWwwwwwwWY...',
        '...YYWWWWWWYY...',
      ]],
      legs: LEGS_SKIRT.down,
    },
    up: {
      head: [
        '......hhhh......',
        '....hhHiHhhh....',
        '...hHiHhhhhhh...',
        '..hHhhhhhhhhhh..',
        '..hhhhhHhhhhhh..',
        '..hhhhhHhhhhhh..',
        '..hhhhhhHhhhhh..',
        '..hhhhhhHhhhhh..',
        '..Shhhhhhhhhhs..',
        '...hhhhhhhhhh...',
        '....hSSrrSSh....',
      ],
      torso: [[
        '....uyyyyyyY....',
        '...uyyyyyyyyY...',
        '..uuyyyyyyyyYY..',
        '..sYyyyyyyyyYS..',
        '..sYVVVwwVVVYS..',
        '..sYyyywwyyyYS..',
        '..SyyyyyyyyyYS..',
        '...yyyyyyyyyY...',
        '...yyyyyyyyyY...',
        '...YYYYYYYYYY...',
      ]],
      legs: LEGS_SKIRT.up,
      extra: () => [[PONY_U, 6, -1]],
    },
    left: {
      head: [
        '......hhhh......',
        '....hhHiHhhh....',
        '...hHiHhhhhhh...',
        '..hHhhhhhhhhhh..',
        '..hhhhhhhhhhhhr.',
        '..ssshhhhhhhhhh.',
        '..ssssssshhhhhh.',
        '.ssesssSShhhhh..',
        '..scsssShhhhh...',
        '..msssSShhhh....',
        '...SssShhh......',
      ],
      torso: [[
        '.....uyyyY......',
        '....wwyyyyY.....',
        '....wwyuuyY.....',
        '....wwyuuyY.....',
        '....VVVsVVY.....',
        '....wwyyyyY.....',
        '....wwyyyyY.....',
        '....wwwyyyyY....',
        '....wWwyyyyY....',
        '....WWYYYYYY....',
      ], [
        '.....uyyyY......',
        '....wwyyyyY.....',
        '....wwuuyyY.....',
        '....wuuyyyY.....',
        '...suVVVVVY.....',
        '....wwyyyyY.....',
        '....wwyyyyY.....',
        '....wwwyyyyY....',
        '....wWwyyyyY....',
        '....WWYYYYYY....',
      ], [
        '.....uyyyY......',
        '....wwyyyyY.....',
        '....wwyyuuY.....',
        '....wwyyyuuY....',
        '....VVVVVVYs....',
        '....wwyyyyY.....',
        '....wwyyyyY.....',
        '....wwwyyyyY....',
        '....wWwyyyyY....',
        '....WWYYYYYY....',
      ]],
      legs: LEGS_SKIRT.left,
      back: () => [[['hh', 'hH', 'Hh', 'hh', '.h'], 11, -1]],
    },
  };
  G.defChar('mom_memory', () => adultChar(MOM, MOM_DIRS));
})(window.G);
