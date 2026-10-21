// The kid: hand-placed pixel rows for every frame, outlined automatically.
// Each frame is 16x24 of fill pixels inside an 18x26 canvas (1px for outline).
(function (G) {
  'use strict';
  const P = G.pal({
    h: '#2e2738', H: '#4d4364', i: '#6e6290',
    s: '#f7d0a8', S: '#dca17c', c: '#f2a28e',
    e: '#22192c', w: '#ffffff', m: '#a1544c',
    j: '#3c476a', J: '#283052', k: '#5a6896',
    O: '#ec8a3a', o: '#b85f22',
    t: '#ebe5d8', T: '#bdb4a6',
    p: '#34323f', P: '#23222d',
    q: '#efebe3', Q: '#a7a199',
    b: '#f7f6f1', B: '#c9c6bc', g: '#9b978d',
    r: '#cf3d3d', R: '#8a2121',
    x: '#ffffff',
  });
  G.KIDPAL = P;

  // ---------------- FRONT (facing down) ----------------
  const HEAD_D = [
    '.....hhhhhh.....',
    '...hhhHHhhhhh...',
    '..hhHHhhhhhhhh..',
    '.hhHhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhshhhsshhhshh.',
    '.hhsssssssssshh.',
    '.hsssessssesssh.',
    '.hsssessssesssh.',
    '..hscssmmsscsh..',
    '....SssssssS....',
  ];
  const TORSO_D = [
    '...kjjjSSjjjJ...',
    '..OJkjjttjjjJO..',
    '..OJkjjttjjjJO..',
    '..OJkjjttjjjJO..',
    '..OJkjjttjjjJO..',
    '..ssJJJJJJJJss..',
  ];
  const LEGS_D = [
    '.....pppppp.....',
    '.....ppPppP.....',
    '.....ppPppP.....',
    '.....ppPppP.....',
    '....qqqQqqqQ....',
    '....QQQ..QQQ....',
  ];
  // stepping: one foot lifted
  const LEGS_D_A = [
    '.....pppppp.....',
    '.....ppPppP.....',
    '.....ppPppP.....',
    '.....ppPqqQ.....',
    '....qqqQQQQ.....',
    '....QQQ.........',
  ];
  const LEGS_D_B = [
    '.....pppppp.....',
    '.....ppPppP.....',
    '.....ppPppP.....',
    '.....qqQppP.....',
    '.....QQQqqqQ....',
    '.........QQQ....',
  ];
  const BAG_D = ['.bb.', 'bbbB', 'bOOB', '.BB.'];

  // ---------------- BACK (facing up) ----------------
  const HEAD_U = [
    '.....hhhhhh.....',
    '...hhhHHhhhhh...',
    '..hhHHhhhhhhhh..',
    '.hhHhhhhhhhhhhh.',
    '.hhHhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.Shhhhhhhhhhhhs.',
    '.Shhhhhhhhhhhhs.',
    '..hhhhhhhhhhhh..',
    '....hhSSSShh....',
  ];
  const TORSO_U = [
    '...kjjjjjjjjJ...',
    '..OJkjjjjjjjJO..',
    '..OJkjjjjjjjJO..',
    '..OJkjjOOjjjJO..',
    '..OJkjjjjjjjJO..',
    '..ssJJJJJJJJss..',
  ];
  const LEGS_U = LEGS_D;
  const LEGS_U_A = LEGS_D_B;
  const LEGS_U_B = LEGS_D_A;

  // ---------------- SIDE (facing left) ----------------
  const HEAD_L = [
    '.....hhhhhh.....',
    '...hhhHHhhhhh...',
    '..hhHHhhhhhhhh..',
    '.hhHhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hhhhhhhhhhhhhh.',
    '.hshhshhhhhhhhh.',
    '.sssssshhhhhhhh.',
    '.ssessssShhhhhh.',
    '.ssessssShhhhhh.',
    '..cssssshhhhhh..',
    '...msssSShhh....',
  ];
  const TORSO_L = [
    '.....jjjjjjJ....',
    '....kjjjjjjjJ...',
    '....kjjOOjjjJ...',
    '....kjjOOjjjJ...',
    '....kjjOOjjjJ...',
    '....JJJssJJJJ...',
  ];
  const LEGS_L = [
    '......pppp......',
    '......pppP......',
    '......pppP......',
    '......pppP......',
    '....qqqqqQ......',
    '....QQQQQQ......',
  ];
  const LEGS_L_A = [
    '......pppp......',
    '.....ppp.PP.....',
    '....ppP...PP....',
    '....ppP...PP....',
    '..qqqqQ..QqQ....',
    '..QQQQQ..QQQ....',
  ];
  const LEGS_L_B = [
    '......pppp......',
    '.....PP.ppp.....',
    '....PP...ppP....',
    '....PP...ppP....',
    '..QqQQ..qqqqQ...',
    '..QQQQ..QQQQQ...',
  ];
  const TORSO_L_A = [
    '.....jjjjjjJ....',
    '....kjjjjjjjJ...',
    '....kjOjjjjjJ...',
    '...kOjjjjjjjJ...',
    '..ssJjjjjjjjJ...',
    '..ss.JJJJJJJ....',
  ];
  const TORSO_L_B = [
    '.....jjjjjjJ....',
    '....kjjjjjjjJ...',
    '....kjjjjjOjJ...',
    '....kjjjjjjOJ...',
    '....JJJJJJJJss..',
    '............ss..',
  ];
  const BAG_L = ['.bb.', 'bbbB', 'bOOB', '.BB.'];

  function build(head, torso, legs, opts) {
    opts = opts || {};
    const px = new G.PX(18, 26);
    const bob = opts.bob || 0;
    px.stamp(legs, P, 1, 19);
    px.stamp(torso, P, 1, 13 + bob);
    px.stamp(head, P, 1, 1 + bob);
    if (opts.bag) px.stamp(opts.bag, P, 1 + opts.bagX, 19 + bob + (opts.bagY || 0));
    if (opts.post) opts.post(px);
    px.outline();
    return px;
  }

  const K = {};
  G.KID = K;

  function addFrames() {
    const fr = (px) => G.frame(px, 9, 25);
    K.down = [
      fr(build(HEAD_D, TORSO_D, LEGS_D, { bag: BAG_D, bagX: 0 })),
      fr(build(HEAD_D, TORSO_D, LEGS_D_A, { bag: BAG_D, bagX: 0, bob: 1 })),
      fr(build(HEAD_D, TORSO_D, LEGS_D_B, { bag: BAG_D, bagX: 1, bob: 1 })),
    ];
    K.up = [
      fr(build(HEAD_U, TORSO_U, LEGS_U, { bag: BAG_D, bagX: 12 })),
      fr(build(HEAD_U, TORSO_U, LEGS_U_A, { bag: BAG_D, bagX: 12, bob: 1 })),
      fr(build(HEAD_U, TORSO_U, LEGS_U_B, { bag: BAG_D, bagX: 11, bob: 1 })),
    ];
    // blink: eyes become a closed line for a few frames while idle
    const blinkD = HEAD_D.map((row, i) => (i === 8 ? row.replace(/e/g, 's') : i === 9 ? row.replace(/e/g, 'S') : row));
    const blinkL = HEAD_L.map((row, i) => (i === 8 ? row.replace(/e/g, 's') : i === 9 ? row.replace(/e/g, 'S') : row));
    K.downBlink = fr(build(blinkD, TORSO_D, LEGS_D, { bag: BAG_D, bagX: 0 }));
    K.leftBlink = fr(build(blinkL, TORSO_L, LEGS_L, { bag: BAG_L, bagX: 6, bagY: -1 }));
    K.left = [
      fr(build(HEAD_L, TORSO_L, LEGS_L, { bag: BAG_L, bagX: 6, bagY: -1 })),
      fr(build(HEAD_L, TORSO_L_A, LEGS_L_A, { bag: BAG_L, bagX: 1, bagY: -1, bob: 1 })),
      fr(build(HEAD_L, TORSO_L_B, LEGS_L_B, { bag: BAG_L, bagX: 11, bagY: -1, bob: 1 })),
    ];
  }


  // ---------------- dialogue portrait (40x40) ----------------
  // Drawn with shapes, then outlined. Expressions swap eyes/brows/mouth.
  function portrait(expr) {
    const C = G.C;
    const px = new G.PX(42, 42);
    const ox = 1, oy = 1;
    const X = (v) => ox + v, Y = (v) => oy + v;
    // shoulders + jacket
    px.poly([[X(3), Y(40)], [X(6), Y(33)], [X(13), Y(30)], [X(27), Y(30)], [X(34), Y(33)], [X(37), Y(40)]], P.j);
    px.poly([[X(3), Y(40)], [X(6), Y(33)], [X(9), Y(32)], [X(8), Y(40)]], P.k);
    px.poly([[X(32), Y(40)], [X(31), Y(32)], [X(34), Y(33)], [X(37), Y(40)]], P.J);
    px.line(X(5), Y(35), X(10), Y(31), P.O); px.line(X(6), Y(36), X(11), Y(32), P.O);
    px.line(X(35), Y(35), X(30), Y(31), P.O); px.line(X(34), Y(36), X(29), Y(32), P.O);
    // shirt + collar
    px.poly([[X(15), Y(30)], [X(25), Y(30)], [X(22), Y(40)], [X(18), Y(40)]], P.t);
    px.poly([[X(13), Y(29)], [X(17), Y(29)], [X(19), Y(36)], [X(15), Y(33)]], P.k);
    px.poly([[X(27), Y(29)], [X(23), Y(29)], [X(21), Y(36)], [X(25), Y(33)]], P.J);
    // neck
    px.rect(X(16), Y(26), 8, 5, P.S);
    // ears
    px.ellipse(X(8), Y(19), 2, 3, P.s); px.ellipse(X(32), Y(19), 2, 3, P.S);
    // face
    px.poly([[X(8.5), Y(11)], [X(31.5), Y(11)], [X(31.5), Y(21)], [X(28.5), Y(26)], [X(23.5), Y(30)], [X(16.5), Y(30)], [X(11.5), Y(26)], [X(8.5), Y(21)]], P.s);
    // right side shading
    px.poly([[X(28.5), Y(13)], [X(31.5), Y(13)], [X(31.5), Y(21)], [X(28.5), Y(26)], [X(24), Y(29.5)], [X(26.5), Y(25)]], P.S);
    // hair mass
    px.ellipse(X(20), Y(9), 13.5, 7.5, P.h);
    px.poly([[X(6.5), Y(9)], [X(8), Y(22)], [X(10.5), Y(13)]], P.h);
    px.poly([[X(33.5), Y(9)], [X(32), Y(22)], [X(29.5), Y(13)]], P.h);
    // spikes on top
    px.poly([[X(9), Y(4)], [X(6), Y(0.5)], [X(13), Y(2.5)]], P.h);
    px.poly([[X(17), Y(2)], [X(19), Y(-0.5)], [X(22), Y(2)]], P.h);
    px.poly([[X(27), Y(2.5)], [X(32), Y(0.5)], [X(30.5), Y(5)]], P.h);
    // bangs: jagged tips over the forehead
    const tips = [[10, 16], [13, 18], [16.5, 15], [19.5, 18], [22.5, 15.5], [25.5, 17.5], [28.5, 15], [30.5, 17]];
    for (let i = 0; i < tips.length; i++) {
      const [tx, ty] = tips[i];
      px.poly([[X(tx - 3), Y(9)], [X(tx + 3), Y(9)], [X(tx), Y(ty)]], P.h);
    }
    // hair highlight arc
    for (let a = 0; a < 14; a++) {
      const ang = Math.PI * (1.15 + a * 0.035);
      px.set(X(20 + Math.cos(ang) * 10), Y(9 + Math.sin(ang) * 6), P.H);
      px.set(X(20 + Math.cos(ang) * 9), Y(9 + Math.sin(ang) * 5), P.i);
    }
    px.line(X(12), Y(7), X(15), Y(10), P.H);
    // shadow under bangs
    for (let x = 10; x <= 30; x++) {
      for (let y = 11; y <= 20; y++) {
        if (px.get(X(x), Y(y)) === P.h && px.get(X(x), Y(y + 1)) === P.s) { px.set(X(x), Y(y + 1), P.S); break; }
      }
    }
    // ---- expression ----
    const ink = C('#1a1220'), white = C('#f6f2ea'), iris = C('#4a3a62'), irisD = C('#2a2038'), shine = C('#ffffff');
    const eye = (cx, mode) => {
      const ey = 20;
      if (mode === 'closed') { px.hline(X(cx - 2), X(cx + 2), Y(ey + 1), ink); return; }
      if (mode === 'happy') { px.set(X(cx - 2), Y(ey + 1), ink); px.hline(X(cx - 1), X(cx + 1), Y(ey), ink); px.set(X(cx + 2), Y(ey + 1), ink); return; }
      if (mode === 'squeeze') { px.line(X(cx - 2), Y(ey - 1), X(cx + 1), Y(ey + 1), ink); px.line(X(cx + 1), Y(ey + 1), X(cx - 2), Y(ey + 2), ink); return; }
      const half = mode === 'half';
      px.rect(X(cx - 2), Y(ey - (half ? 0 : 1)), 5, half ? 3 : 4, white);
      const small = mode === 'wide';
      if (small) { px.rect(X(cx - 0.5), Y(ey), 2, 2, iris); }
      else { px.rect(X(cx - 1), Y(ey - (half ? 0 : 1)), 3, half ? 3 : 4, iris); px.rect(X(cx), Y(ey), 1, 2, irisD); px.set(X(cx - 1), Y(ey - (half ? 0 : 1)), shine); }
      // lid
      px.hline(X(cx - 3), X(cx + 2), Y(ey - (half ? 1 : 2)), ink);
      px.set(X(cx + 3), Y(ey - (half ? 0 : 1)), ink);
      if (mode === 'dead') { px.rect(X(cx - 1), Y(ey - 1), 3, 4, irisD); }
    };
    const brow = (cx, tilt) => {
      // tilt: -1 worried (inner up), 1 angry (inner down), 0 flat
      const inner = cx < 20 ? 1 : -1;
      if (tilt === 0) { px.hline(X(cx - 2), X(cx + 2), Y(16), ink); return; }
      px.line(X(cx - 2 * inner), Y(16 - tilt), X(cx + 2 * inner), Y(16 + tilt), ink);
    };
    const E = {
      neutral: { eyes: 'open', brows: 0, mouth: 'line' },
      shock: { eyes: 'wide', brows: -1, mouth: 'o' },
      scared: { eyes: 'wide', brows: -1, mouth: 'wave', sweat: true },
      annoyed: { eyes: 'half', brows: 1, mouth: 'flat' },
      determined: { eyes: 'open', brows: 1, mouth: 'smirk' },
      pain: { eyes: 'squeeze', brows: -1, mouth: 'open', sweat: true },
      happy: { eyes: 'happy', brows: 0, mouth: 'smile' },
      dead: { eyes: 'dead', brows: 0, mouth: 'flat', pale: true },
      sad: { eyes: 'open', brows: -1, mouth: 'frown' },
    }[expr] || {};
    eye(15, E.eyes);
    eye(25, E.eyes);
    if (E.brows !== undefined) { brow(15, E.brows); brow(25, E.brows); }
    // nose
    px.set(X(20), Y(23), P.S); px.set(X(21), Y(24), P.S);
    // cheeks
    if (E.eyes !== 'dead') { px.set(X(12), Y(23), P.c); px.set(X(13), Y(23), P.c); px.set(X(27), Y(23), P.c); px.set(X(28), Y(23), P.c); }
    const m = E.mouth;
    if (m === 'line') px.hline(X(19), X(21), Y(27), P.m);
    if (m === 'flat') px.hline(X(18), X(22), Y(27), P.m);
    if (m === 'o') { px.rect(X(19), Y(26), 3, 3, P.m); px.set(X(20), Y(27), ink); }
    if (m === 'open') { px.rect(X(18), Y(26), 5, 2, ink); px.hline(X(19), X(21), Y(27), P.m); }
    if (m === 'wave') { px.set(X(17), Y(27), P.m); px.set(X(18), Y(26), P.m); px.set(X(19), Y(27), P.m); px.set(X(20), Y(26), P.m); px.set(X(21), Y(27), P.m); px.set(X(22), Y(26), P.m); }
    if (m === 'smirk') { px.hline(X(18), X(21), Y(27), P.m); px.set(X(22), Y(26), P.m); }
    if (m === 'smile') { px.set(X(17), Y(26), P.m); px.hline(X(18), X(22), Y(27), P.m); px.set(X(23), Y(26), P.m); }
    if (m === 'frown') { px.set(X(17), Y(28), P.m); px.hline(X(18), X(22), Y(27), P.m); px.set(X(23), Y(28), P.m); }
    if (E.sweat) { px.set(X(31), Y(12), C('#9fd8ff')); px.rect(X(31), Y(13), 2, 2, C('#9fd8ff')); px.set(X(32), Y(13), C('#ffffff')); }
    if (E.pale) px.map((c) => G.mix(c, C('#5a6a8a'), 0.35));
    px.outline();
    return px.canvas();
  }
  K.portraits = {};
  K.portrait = function (expr) {
    if (!K.portraits[expr]) K.portraits[expr] = portrait(expr);
    return K.portraits[expr];
  };

  K.build = function () {
    addFrames();
  };
})(window.G);
