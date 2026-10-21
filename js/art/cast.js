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
  // YUI: about 50, short dark hair going grey, beige coat, bag of oranges
  // ======================================================================
  const YUI = G.pal({
    h: '#2a2530', H: '#453c4c', g: '#86828e',
    s: '#eec6a2', S: '#c99a7a', c: '#e0a08c', e: '#2a1c26', m: '#a05c52',
    a: '#bba67e', L: '#d6c69e', A: '#97825f', d: '#73614a', b: '#5a4a38',
    u: '#5e7c7c', U: '#45605e',
    p: '#4a4450', P: '#34303a', q: '#4e342a', Q: '#2e1e18',
    o: '#e08a2a', O: '#ac5c1a', w: '#e6e4de', W: '#b2aea6', k: '#5a7a3a',
  });
  const YUI_HEAD_D = [
    '......hhhh......',
    '....hhHHhhhh....',
    '...hHHhhhhhhh...',
    '..hHhhhhhhhhgh..',
    '..hhhhhhhhhhgh..',
    '..hhhsssshhhhh..',
    '..hhsssssssssh..',
    '..hssessssesSh..',
    '..hscsssssscSh..',
    '...hsssmmsSSh...',
    '....hSssssSh....',
  ];
  const YUI_TORSO_D = [
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
  ];
  const YUI_LEGS_D = [
    '.....pP..pP.....',
    '.....pP..pP.....',
    '.....pP..pP.....',
    '.....pP..pP.....',
    '....qqQ..qqQ....',
    '....QQQ..QQQ....',
  ];
  const ORANGES = ['.ww.', 'w..W', 'woOW', 'oOoO', 'WoOW', '.WW.'];
  G.defChar('yui', () => {
    const f = (bob, legs) => person(YUI, YUI_HEAD_D, YUI_TORSO_D, legs, bob, [[ORANGES, 0, 15]]);
    const d = [f(0, YUI_LEGS_D), f(1, YUI_LEGS_D), f(1, YUI_LEGS_D)];
    return { down: d, up: d, left: d };
  });
})(window.G);
