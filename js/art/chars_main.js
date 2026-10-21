// Main characters: Haru (10, striped pajamas) and old Haru (82, cardigan, glasses).
// Built from the kid sprite rows (js/art_kid.js) with palette swaps and small edits.
(function (G) {
  'use strict';
  const C = G.C;
  const R = () => G.KID_ROWS;
  const swapRows = (rows, rowIdx, from, to) => rows.map((r, i) => (rowIdx.includes(i) ? r.replace(new RegExp('[' + from + ']', 'g'), to) : r));

  const HARU = G.pal({
    j: '#8fb0d4', J: '#6a8ab0', k: '#b0cae6', O: '#8fb0d4', x: '#e8eef6', t: '#e8eef6', T: '#b8c4d0',
    p: '#7896bc', P: '#5a76a0', q: '#9a6a46', Q: '#6a4630',
  });
  const OLD = G.pal({
    h: '#8e8c96', H: '#b4b2bc', i: '#d0ced8', s: '#e8c0a0', S: '#c49878', c: '#d8a090',
    j: '#7a5a42', J: '#5a4232', k: '#94704f', O: '#7a5a42', x: '#c8b48a', t: '#d8d0c0', T: '#b0a898',
    p: '#5a5a64', P: '#44444c', q: '#7a5a46', Q: '#54402e', g: '#2e2a34',
  });
  G.HARU_PAL = HARU;
  G.OLD_PAL = OLD;

  function frames(pal, head, opts) {
    const K = R();
    opts = opts || {};
    const P = Object.assign({}, G.KIDPAL, pal);
    // pajama stripes: rows 2 and 4 of each torso
    const stripe = (rows) => (opts.stripes ? swapRows(rows, [2, 4], 'jkJO', 'x') : rows);
    const b = (hd, tr, lg, bob) => G.frame(G.kidBuild(hd, stripe(tr), lg, { pal: P, bob: bob || 0 }), 9, 25);
    return {
      down: [b(head.down, K.TORSO_D, K.LEGS_D), b(head.down, K.TORSO_D, K.LEGS_D_A, 1), b(head.down, K.TORSO_D, K.LEGS_D_B, 1)],
      up: [b(head.up, K.TORSO_U, K.LEGS_D), b(head.up, K.TORSO_U, K.LEGS_D_B, 1), b(head.up, K.TORSO_U, K.LEGS_D_A, 1)],
      left: [b(head.left, K.TORSO_L, K.LEGS_L), b(head.left, K.TORSO_L_A, K.LEGS_L_A, 1), b(head.left, K.TORSO_L_B, K.LEGS_L_B, 1)],
    };
  }

  G.defChar('haru', () => {
    const K = R();
    return frames(HARU, { down: K.HEAD_D, up: K.HEAD_U, left: K.HEAD_L }, { stripes: true });
  });

  G.defChar('old_haru', () => {
    const K = R();
    // glasses on the front and side views
    const down = K.HEAD_D.slice();
    down[1] = '...hhsSSssshh...';
    down[2] = '..hhHsSsssshhh..';
    down[3] = '.hhHhhSsshhhhhh.';
    down[8] = '.hssgegssgegssh.';
    down[10] = '..hsSssmmssSsh..';
    const up = K.HEAD_U.slice();
    up[1] = '...hhsSSssshh...';
    up[2] = '..hhHsSsssshhh..';
    up[3] = '.hhHhhSsshhhhhh.';
    const left = K.HEAD_L.slice();
    left[1] = '...hsSSsshhhh...';
    left[2] = '..hhsSsssshhhh..';
    left[8] = '.sgegssSShhhhhh.';
    // buttons down the cardigan
    return frames(OLD, { down: down, up: up, left: left }, { stripes: false });
  });

  // portraits
  G.haruPortrait = (expr) => G.KID.portraitWith('haru', HARU, expr, (cv) => {
    // pajama stripes across the shoulders
    const x = cv.getContext('2d');
    x.fillStyle = '#e8eef6';
    for (let y = 33; y < 41; y += 3) for (let px = 4; px < 38; px++) {
      const d = x.getImageData(px, y, 1, 1).data;
      if (d[3] && Math.abs(d[0] - 0x8f) < 30 && Math.abs(d[2] - 0xd4) < 40) x.fillRect(px, y, 1, 1);
    }
  });
  G.oldHaruPortrait = (expr) => G.KID.portraitWith('old_haru', OLD, expr, (cv, e) => {
    const x = cv.getContext('2d');
    // wrinkles and glasses (eye centers at x=16 and x=26, y=21 in the 42px canvas)
    x.fillStyle = '#a87a5e';
    for (const ex of [16, 26]) { x.fillRect(ex - 2, 24, 4, 1); }
    x.fillRect(13, 26, 1, 3); x.fillRect(29, 26, 1, 3);
    x.fillStyle = '#2e2a34';
    for (const ex of [16, 26]) {
      if (e === 'dead') continue;
      x.fillRect(ex - 4, 18, 8, 1); x.fillRect(ex - 4, 23, 8, 1); x.fillRect(ex - 4, 18, 1, 6); x.fillRect(ex + 3, 18, 1, 6);
    }
    x.fillRect(20, 19, 2, 1);
  });
})(window.G);
