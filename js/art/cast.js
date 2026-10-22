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
    w: '#d4cec8', W: '#a8a29e', p: '#a87882', e: '#c8c25a', E: '#1a1420', n: '#c27880', m: '#2c2430',
  });
  // Tama is drawn from 14x11 string rows per direction and frame.
  // facing down (walking toward the viewer)
  const CAT_D = [
    [ // stand
      '..F.....F.F...',
      '..fpF...FpF...',
      '..lfkfkfffF..k',
      '.LlfffffffFF.F',
      '.lfeEfffEefF.F',
      'llfffwnwffFF.F',
      '..fFWmwmWFF.F.',
      '...FFwwwFF..F.',
      '..lfFwwwFfF.F.',
      '...lf.F.fFF...',
      '...ww...wW....',
    ],
    [ // step: left paw forward, head dips
      '..............',
      '..F.....F.F...',
      '..fpF...FpF...',
      '..lfkfkfffF.k.',
      '.LlfffffffFF.F',
      '.lfeEfffEefF.F',
      'llfffwnwffFF.F',
      '..fFWmwmWFF.F.',
      '...FFwwwFF.F..',
      '..lfFwwwFfF...',
      '...ww...fF....',
    ],
    [ // step: right paw forward
      '..............',
      '..F.....F.F...',
      '..fpF...FpF..k',
      '..lfkfkfffF..F',
      '.LlfffffffFF.F',
      '.lfeEfffEefF.F',
      'llfffwnwffFF.F',
      '..fFWmwmWFF.F.',
      '...FFwwwFF..F.',
      '..lfFwwwFfFF..',
      '...lf...wW....',
    ],
  ];
  // facing up (walking away): back of the head, striped back, tail up and swaying
  const CAT_U = [
    [
      '..F.....F.F...',
      '..fF....FfF...',
      '..lfkfkfkfF...',
      '.LlfkfkfkfFF..',
      '.lffffffffFF.k',
      '..lfffffffF..F',
      '...FFFFFFF..F.',
      '..lfkfffkfF.F.',
      '..lffkfkffF.F.',
      '..lfffffffFF..',
      '...FF...FF....',
    ],
    [
      '..............',
      '..F.....F.F...',
      '..fF....FfF...',
      '..lfkfkfkfF.k.',
      '.LlfkfkfkfFF.F',
      '.lffffffffFF.F',
      '..lfffffffF.F.',
      '...FFFFFFF..F.',
      '..lfkfffkfF.F.',
      '..lffkfkffFF..',
      '...FF...lF....',
    ],
    [
      '..............',
      '..F.....F.F...',
      '..fF....FfF..k',
      '..lfkfkfkfF..F',
      '.LlfkfkfkfFF.F',
      '.lffffffffFF.F',
      '..lfffffffF.F.',
      '...FFFFFFF..F.',
      '..lfkfffkfF.F.',
      '..lffkfkffFF..',
      '...lF...FF....',
    ],
  ];
  // facing left (profile): the torn ear is the near one
  const CAT_L = [
    [
      '.F.F.F........',
      '.fFpFF......k.',
      '.lffffF.....kF',
      'leEfff.....F..',
      'nwffffLlklkFF.',
      '.wWfFffkfkfffF',
      '..wfffkffkfffF',
      '...WwfFfffffF.',
      '...fF.fF.fFfF.',
      '...fF..F..fFF.',
      '...wW..W..wW..',
    ],
    [
      '..............',
      '.F.F.F......k.',
      '.fFpFF......kF',
      '.lffffF....F..',
      'leEfffLlklkFF.',
      'nwffffkfkffffF',
      '.wWfFkffkffffF',
      '..wwfFfffffFF.',
      '..fF..fF.fFfF.',
      '.fF....fF..FF.',
      '.wW.....wW.wW.',
    ],
    [
      '..............',
      '.F.F.F.......k',
      '.fFpFF......kF',
      '.lffffF....F..',
      'leEfffLlklkFF.',
      'nwffffkfkffffF',
      '.wWfFkffkffffF',
      '..wwfFfffffFF.',
      '...fFfF.fFfF..',
      '....fFF.FfF...',
      '....wWW.wW....',
    ],
  ];
  const catFrame = (rows) => fig(CAT, 14, 11, [[rows, 0, 0]], 6);

  G.defChar('tama', () => ({
    down: CAT_D.map(catFrame),
    up: CAT_U.map(catFrame),
    left: CAT_L.map(catFrame),
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
