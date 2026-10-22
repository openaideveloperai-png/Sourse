// Stairwell clarity (a stair opening going down, painted floor signs), and small sprites
// that were still missing. Drawn in code like the rest (see js/core.js for the G.PX API).
(function (G) {
  'use strict';
  const C = G.C;

  // ---------------- tiny stencil font (3x5) for wall signs ----------------
  const FONT = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'], '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '111', '001', '111'], '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    F: ['111', '100', '110', '100', '100'], B: ['110', '101', '110', '101', '110'], R: ['110', '101', '110', '101', '101'],
    O: ['111', '101', '101', '101', '111'], 'v': ['11111', '11111', '01110', '00100', '00000'], '^': ['00000', '00100', '01110', '11111', '11111'],
  };
  function stencil(px, text, x, y, col, scale) {
    scale = scale || 1;
    let cx = x;
    for (const ch of text) {
      const g = FONT[ch];
      if (!g) { cx += 2 * scale; continue; }
      for (let r = 0; r < g.length; r++) for (let c = 0; c < g[r].length; c++) if (g[r][c] === '1') px.rect(cx + c * scale, y + r * scale, scale, scale, col);
      cx += (g[0].length + 1) * scale;
    }
    return cx;
  }
  const textW = (text, scale) => { let w = 0; for (const ch of text) w += ((FONT[ch] ? FONT[ch][0].length : 1) + 1) * (scale || 1); return w - (scale || 1); };

  // ---------------- a stairwell opening going down (2x2 floor) ----------------
  G.defSprite('stairs_down2', () => {
    const W = 32, H = 32;
    const px = new G.PX(W, H);
    const lip = C('#8c8c94'), lipL = C('#a8a8b0'), wall = C('#34343c'), wallD = C('#24242a');
    // the opening: side walls going down, steps getting darker
    px.rect(1, 2, W - 2, H - 2, C('#141418'));
    px.rect(1, 2, 4, H - 2, wall); px.rect(W - 5, 2, 4, H - 2, wallD);
    for (let i = 0; i < 6; i++) {
      const y = 4 + i * 5;
      const k = i / 6;
      const tread = G.mix(C('#7c7c84'), C('#141418'), k * 0.9), riser = G.mix(C('#4c4c54'), C('#0c0c10'), k * 0.9);
      px.rect(5, y, W - 10, 2, tread);
      px.rect(5, y + 2, W - 10, 3, riser);
      px.hline(5, W - 6, y, G.mix(tread, C('#ffffff'), 0.15));
    }
    // a yellow-and-black safety edge on the top lip, so the drop reads at once
    px.rect(0, 0, W, 3, lip); px.hline(0, W - 1, 0, lipL);
    for (let x = 1; x < W - 1; x += 4) { px.rect(x, 2, 2, 1, C('#d8b030')); px.rect(x + 2, 2, 2, 1, C('#202020')); }
    // handrails
    for (const hx of [5, W - 6]) {
      px.vline(hx, 3, H - 4, C('#9a9aa4'));
      for (let y = 6; y < H - 2; y += 8) px.set(hx, y, C('#d0d0d8'));
    }
    px.outline();
    return G.frame(px, 16, 32);
  });

  // ---------------- painted floor signs (wall, 2x1) ----------------
  // sign_<label>: the floor stencil, with a big arrow; e.g. 'v3F' = arrow down to 3F
  const SIGNS = { down_3f: 'v3F', down_2f: 'v2F', down_1f: 'v1F', down_b1: 'vB1', up_4f: '^4F', up_3f: '^3F', up_2f: '^2F', up_1f: '^1F', up_roof: '^R', floor_4f: '4F', floor_3f: '3F', floor_2f: '2F', floor_1f: '1F', floor_b1: 'B1' };
  for (const [id, text] of Object.entries(SIGNS)) {
    G.defSprite('sign_' + id, () => {
      const W = 32, H = 16;
      const px = new G.PX(W, H);
      const isFloor = id.indexOf('floor_') === 0;
      const plate = isFloor ? C('#2a4a3a') : C('#e8e0c8'), ink = isFloor ? C('#d8e8d0') : C('#2a2a30');
      px.rect(1, 2, W - 2, H - 4, plate);
      px.hline(1, W - 2, 2, G.mix(plate, C('#ffffff'), 0.25));
      px.hline(1, W - 2, H - 3, G.mix(plate, C('#000000'), 0.3));
      const sc = isFloor ? 2 : 1;
      const tw = textW(text, sc);
      stencil(px, text, Math.round((W - tw) / 2), isFloor ? 3 : 5, ink, sc);
      if (!isFloor) { px.set(2, 3, C('#c8b878')); px.set(W - 3, 3, C('#c8b878')); }
      px.outline();
      return G.frame(px, 16, 16);
    });
  }
})(window.G);
