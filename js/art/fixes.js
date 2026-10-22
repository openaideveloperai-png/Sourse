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

  // ======================================================================
  // HARU'S FUTON (the first thing the player sees), and the empty one
  // ======================================================================
  function futon(withHaru) {
    const px = new G.PX(18, 34);
    const sheet = C('#e8e4da'), sheetD = C('#c8c2b4'), blue = C('#4a6a9a'), blueL = C('#6a8ab8'), blueD = C('#344e78'), stripe = C('#a8c0e0');
    // mattress
    px.rect(1, 2, 16, 31, sheet); px.vline(16, 2, 32, sheetD); px.hline(1, 16, 32, sheetD);
    // pillow
    px.rect(3, 3, 12, 6, C('#f6f2ea')); px.hline(3, 14, 8, C('#d8d0c0')); px.set(3, 3, sheet); px.set(14, 3, sheet);
    if (withHaru) {
      // Haru's head on the pillow: black hair, a sleepy face turned slightly
      px.ellipse(9, 7, 4.5, 3.6, C('#2e2738'));
      px.rect(6, 7, 6, 4, C('#f7d0a8')); px.hline(6, 11, 11, C('#dca17c'));
      px.hline(7, 8, 9, C('#22192c')); px.hline(10, 11, 9, C('#22192c'));
      px.set(9, 4, C('#4d4364')); px.set(8, 5, C('#4d4364'));
    }
    // blanket: blue with pale stripes; turned down at the top
    const top = withHaru ? 11 : 20;
    px.rect(1, top, 16, 33 - top - 1, blue);
    for (let y = top + 3; y < 32; y += 5) px.hline(1, 16, y, stripe);
    px.rect(1, top, 16, 2, blueL); px.hline(1, 16, top + 2, blueD);
    px.vline(16, top, 31, blueD);
    if (!withHaru) {
      // thrown back: a rumpled fold and an empty dent in the sheet
      px.rect(2, top - 3, 14, 3, blueL); px.hline(2, 15, top - 3, stripe);
      px.rect(5, 12, 8, 5, sheetD); px.rect(6, 13, 6, 3, C('#d8d2c4'));
    }
    px.outline();
    return G.frame(px, 9, 33);
  }
  G.defSprite('haru_futon', () => futon(true));
  G.defSprite('haru_futon_empty', () => futon(false));

  // ======================================================================
  // THE STANDING MIRROR (Shota's room) and the reflection Haru glimpses
  // ======================================================================
  G.defSprite('mirror_stand', () => {
    const px = new G.PX(16, 32);
    const wood = C('#7a5034'), woodL = C('#9a6a44'), woodD = C('#553420');
    px.rect(2, 1, 12, 24, wood); px.vline(2, 1, 24, woodL); px.vline(13, 1, 24, woodD); px.hline(2, 13, 1, woodL);
    px.rect(4, 3, 8, 20, C('#8a9ab0'));
    for (let y = 3; y < 23; y++) px.set(4 + ((y * 3) % 7), y, C('#b8c8d8'));
    px.line(5, 5, 9, 9, C('#d8e4f0')); px.line(6, 5, 10, 9, C('#c8d6e6'));
    px.rect(4, 15, 8, 8, C('#6a7a90'));
    px.rect(5, 25, 2, 6, woodD); px.rect(9, 25, 2, 6, woodD); px.rect(3, 30, 10, 2, wood);
    px.outline();
    return G.frame(px, 8, 32);
  });
  // glimpsed full-screen: the mirror shows an old man in a blue baseball cap
  G.defSprite('mirror_stand_old', () => {
    const W = 64, H = 80;
    const px = new G.PX(W, H);
    const wood = C('#7a5034'), woodL = C('#9a6a44'), woodD = C('#553420');
    px.rect(0, 0, W, H, C('#0c0a10'));
    px.rect(6, 2, 52, 76, wood); px.rect(6, 2, 2, 76, woodL); px.rect(56, 2, 2, 76, woodD);
    px.rect(10, 6, 44, 68, C('#5a6878'));
    for (let y = 6; y < 74; y++) for (let x = 10; x < 54; x++) if (G.bayer(x, y) > 0.82) px.set(x, y, C('#647484'));
    // the old man: blue cap, grey hair at the sides, a lined face, a smile with a gap
    const skin = C('#d8b090'), skinD = C('#b08868'), cap = C('#3858a8'), capD = C('#283c78');
    px.ellipse(32, 44, 13, 15, skin);
    px.rect(19, 44, 26, 14, skin);
    px.ellipse(32, 30, 15, 7, cap); px.rect(17, 30, 30, 5, cap); px.rect(14, 34, 22, 3, capD); px.hline(14, 35, 37, C('#1c2850'));
    px.rect(18, 37, 3, 8, C('#b8b8c0')); px.rect(43, 37, 3, 8, C('#b8b8c0'));
    px.rect(25, 43, 4, 2, C('#2a2028')); px.rect(35, 43, 4, 2, C('#2a2028'));
    px.hline(24, 29, 40, skinD); px.hline(34, 39, 40, skinD);
    px.hline(23, 28, 47, skinD); px.hline(36, 41, 47, skinD);
    px.rect(28, 52, 8, 2, C('#6a3a38')); px.set(31, 52, C('#1a1218'));
    px.hline(26, 37, 56, skinD);
    px.rect(20, 60, 24, 14, C('#e8e8ee')); px.rect(29, 60, 6, 4, skin);
    px.line(12, 8, 22, 18, C('#8a98a8')); px.line(13, 8, 23, 18, C('#8090a0'));
    px.outline();
    return G.frame(px, 32, 80);
  });

  // ======================================================================
  // OLD HARU IN THE CARE BED (the true ending), 2x3 tiles
  // ======================================================================
  G.defSprite('old_haru_bed', () => {
    const W = 34, H = 50;
    const px = new G.PX(W, H);
    const rail = C('#c8ccd4'), railD = C('#8a909a'), sheet = C('#f2f0ea'), sheetD = C('#d0ccc0'), blanket = C('#e8dcc8'), blanketD = C('#c8b898');
    px.rect(2, 2, 30, 6, rail); px.hline(2, 31, 2, C('#e8ecf0')); px.vline(2, 2, 46, railD); px.vline(31, 2, 46, railD);
    px.rect(3, 8, 28, 38, sheet);
    px.rect(8, 9, 18, 7, C('#ffffff')); px.hline(8, 25, 15, sheetD);
    // old Haru: grey hair, glasses, eyes closed, a small smile
    px.ellipse(17, 14, 5.5, 4.5, C('#b8b6c0')); px.rect(13, 14, 9, 5, C('#e8c0a0')); px.hline(13, 21, 19, C('#c49878'));
    px.hline(14, 15, 16, C('#2e2a34')); px.hline(18, 19, 16, C('#2e2a34')); px.set(16, 16, C('#2e2a34'));
    px.hline(16, 18, 18, C('#a87060'));
    px.rect(3, 20, 28, 24, blanket);
    for (let y = 23; y < 44; y += 4) px.hline(4, 30, y, blanketD);
    px.hline(3, 30, 20, C('#f8f0e0'));
    px.rect(6, 21, 6, 3, C('#e8c0a0'));
    px.rect(3, 44, 28, 3, rail); px.hline(3, 30, 46, railD);
    px.rect(4, 47, 2, 3, railD); px.rect(28, 47, 2, 3, railD);
    px.outline();
    return G.frame(px, 17, 50);
  });

  // ======================================================================
  // PORTRAITS for the cast (42x42), built on the kid portrait like old Haru's
  // ======================================================================
  const pal = (o) => G.pal(o);
  function draw(cv, fn) { const x = cv.getContext('2d'); fn(x); }
  const rect = (x, col, r) => { x.fillStyle = col; for (const [a, b, w, h] of r) x.fillRect(a, b, w, h); };
  function makePortrait(key, palette, map, post, exprs) {
    const fn = (expr) => G.KID.portraitWith(key, palette, map[expr] || map.neutral || 'neutral', (cv) => post(cv, expr));
    fn.exprs = exprs;
    return fn;
  }
  const OTA = pal({ h: '#8e8c98', H: '#aaa8b4', i: '#c8c6d0', s: '#efc8a8', S: '#cfa080', c: '#e0a090', j: '#9888c0', J: '#7868a0', k: '#b8a8d8', O: '#efe8f4', t: '#efe8f4', m: '#a06058' });
  G.PORTRAITS.ota = makePortrait('ota', OTA, { neutral: 'neutral', happy: 'happy', sad: 'sad' }, (cv) => draw(cv, (x) => {
    rect(x, '#8e8c98', [[15, 0, 12, 4], [14, 1, 14, 3]]);
    rect(x, '#aaa8b4', [[17, 0, 6, 1]]);
    rect(x, '#2a2230', [[13, 3, 16, 1]]);
    rect(x, '#c49878', [[13, 24, 3, 1], [26, 24, 3, 1], [12, 26, 1, 2], [29, 26, 1, 2]]);
    rect(x, '#d0b0e0', [[17, 34, 8, 1]]);
  }), ['neutral', 'happy', 'sad']);
  const KURODA = pal({ h: '#d8d8e2', H: '#ececf4', i: '#ffffff', s: '#e8c0a0', S: '#c49878', c: '#d8a090', j: '#2a2a32', J: '#1a1a22', k: '#3a3a46', O: '#e8e8f0', t: '#e8e8f0', m: '#905050' });
  G.PORTRAITS.kuroda = makePortrait('kuroda', KURODA, { neutral: 'neutral', sad: 'sad', happy: 'happy' }, (cv) => draw(cv, (x) => {
    rect(x, '#e8c0a0', [[13, 2, 16, 7], [11, 5, 20, 5]]);
    rect(x, '#f4d4b8', [[16, 3, 6, 2]]);
    rect(x, '#c49878', [[13, 25, 3, 1], [26, 25, 3, 1], [12, 27, 1, 2], [29, 27, 1, 2], [17, 13, 8, 1]]);
    rect(x, '#ffffff', [[12, 16, 6, 1], [24, 16, 6, 1]]);
    rect(x, '#6a3030', [[20, 34, 2, 5]]);
  }), ['neutral', 'sad', 'happy']);
  const SHOTA = pal({ h: '#5a3a28', H: '#7a5038', i: '#9a6a48', s: '#f2c8a0', S: '#d4a078', j: '#ececf0', J: '#c4c4cc', k: '#ffffff', O: '#c84040', t: '#ececf0' });
  G.PORTRAITS.shota = makePortrait('shota', SHOTA, { neutral: 'neutral', happy: 'happy', creepy: 'dead' }, (cv, e) => draw(cv, (x) => {
    if (e === 'creepy') rect(x, '#a06058', [[17, 27, 1, 1], [18, 28, 6, 1], [24, 27, 1, 1]]);
  }), ['neutral', 'happy', 'creepy']);
  G.PORTRAITS.shota_cap = makePortrait('shota_cap', SHOTA, { neutral: 'happy', happy: 'happy' }, (cv) => draw(cv, (x) => {
    rect(x, '#3858a8', [[9, 2, 24, 7], [7, 5, 28, 4]]);
    rect(x, '#5878c8', [[12, 3, 10, 2]]);
    rect(x, '#283c78', [[5, 9, 22, 3]]);
    rect(x, '#e8e8f0', [[19, 4, 3, 3]]);
  }), ['happy']);
  const YUI = pal({ h: '#2a2432', H: '#4a4254', i: '#8a8496', s: '#f2c8a8', S: '#d4a484', c: '#e8a898', j: '#c8b090', J: '#a89070', k: '#e0c8a8', O: '#a04848', t: '#f0e8dc', m: '#b06060' });
  G.PORTRAITS.yui = makePortrait('yui', YUI, { neutral: 'neutral', sad: 'sad', happy: 'happy' }, (cv, e) => draw(cv, (x) => {
    rect(x, '#2a2432', [[5, 12, 4, 20], [33, 12, 4, 20], [6, 30, 4, 4], [32, 30, 4, 4]]);
    rect(x, '#8a8496', [[9, 4, 2, 6], [10, 9, 2, 3]]);
    if (e === 'happy') rect(x, '#9fd8ff', [[13, 23, 1, 2], [28, 23, 1, 2]]);
  }), ['neutral', 'sad', 'happy']);
  const NURSE = pal({ h: '#18161e', H: '#2c2a34', i: '#44424e', s: '#f0c8a8', S: '#d0a484', c: '#e0a898', j: '#88b0cc', J: '#6890ac', k: '#a8cce0', O: '#d8d8e0', t: '#88b0cc', m: '#a86060' });
  G.PORTRAITS.nurse = makePortrait('nurse', NURSE, { neutral: 'neutral', kind: 'happy', tired: 'sad' }, (cv, e) => draw(cv, (x) => {
    rect(x, '#e8e8f0', [[13, 37, 6, 3]]);
    rect(x, '#3a6a9a', [[14, 38, 4, 1]]);
    rect(x, '#d8d8e0', [[11, 31, 1, 7], [30, 31, 1, 7]]);
    if (e === 'tired') rect(x, '#b88a70', [[13, 22, 4, 1], [24, 22, 4, 1]]);
    // the mask pulled down under the chin
    rect(x, '#f4f6fa', [[14, 29, 14, 3]]); rect(x, '#d8dce4', [[14, 31, 14, 1]]);
  }), ['neutral', 'kind', 'tired']);
  G.PORTRAITS.sato = G.PORTRAITS.nurse;
  // Mom's voice on the phone: a black receiver, no face
  const PHONEC = {};
  G.PORTRAITS.phone = function (expr) {
    if (PHONEC[expr]) return PHONEC[expr];
    const px = new G.PX(42, 42);
    px.rect(1, 1, 40, 40, C('#1a1420'));
    for (let y = 1; y < 41; y++) for (let x = 1; x < 41; x++) if (G.bayer(x, y) > 0.9) px.set(x, y, C('#241c2c'));
    // the receiver, diagonal
    const k = C('#121014'), kL = C('#3a3440'), kD = C('#060508');
    px.thick(12, 30, 30, 12, 4, k);
    px.ellipse(10, 31, 6, 4.5, k); px.ellipse(31, 10, 6, 4.5, k);
    px.line(13, 27, 28, 12, kL); px.ellipse(9, 30, 3, 2, kL); px.ellipse(31, 9, 3, 2, kL);
    px.set(10, 32, kD); px.set(32, 11, kD);
    // cord
    for (let i = 0; i < 9; i++) px.set(4 + (i % 2), 34 + i % 4 + Math.floor(i / 3), C('#2a2430'));
    // a soft glow: the voice
    for (const [x0, y0] of [[34, 22], [37, 26], [33, 28]]) px.set(x0, y0, C('#e8a8b8'));
    px.outline();
    if (expr === 'static') px.map((c, x, y) => (G.hash(x, y, 7) > 0.8 ? C('#8a8094') : c));
    return (PHONEC[expr] = px.canvas());
  };
  G.PORTRAITS.phone.exprs = ['neutral', 'static'];

  // ======================================================================
  // ITEM ICONS (16x16, anchor (8,16))
  // ======================================================================
  const icon = (name, fn) => G.defSprite(name, () => { const px = new G.PX(16, 16); fn(px); px.outline(); return G.frame(px, 8, 16); });
  // a key with a coloured tag; shape: 'round' bow, 'square' bow; tag text dots
  function key(px, metal, metalD, tag, tagD, opts) {
    opts = opts || {};
    const big = !!opts.big;
    // bow
    if (opts.square) { px.rect(1, 4, 5, 5, metal); px.rect(2, 5, 3, 3, C('#00000000')); px.set(3, 6, 0); }
    else { px.disc(3.5, 6.5, big ? 3.2 : 2.6, metal); px.disc(3.5, 6.5, 1.1, 0); }
    px.set(2, 5, G.mix(metal, C('#ffffff'), 0.4));
    // shaft and teeth
    px.rect(6, 6, big ? 8 : 7, 2, metal); px.hline(6, big ? 13 : 12, 7, metalD);
    px.rect(big ? 11 : 10, 8, 1, 2, metal); px.rect(big ? 13 : 12, 8, 1, 3, metal);
    // string and tag
    px.set(3, 10, C('#c8c0a8')); px.set(4, 11, C('#c8c0a8'));
    px.rect(3, 11, 6, 4, tag); px.hline(3, 8, 14, tagD); px.set(3, 11, 0);
    if (opts.mark) px.rect(5, 12, 2, 1, opts.mark);
  }
  const gold = C('#d8b048'), goldD = C('#a07c28'), steel = C('#b8bcc8'), steelD = C('#7a7e8a'), rust = C('#a8683a'), rustD = C('#6a4020');
  icon('icon_key_403', (px) => { key(px, gold, goldD, C('#f0d040'), C('#b89820')); px.disc(7, 12, 1.5, C('#f0d040')); });
  icon('icon_key_stairs4', (px) => key(px, steel, steelD, C('#3a9a5a'), C('#28683c'), { mark: C('#e8f0e8') }));
  icon('icon_lift_key', (px) => key(px, steel, steelD, C('#c83838'), C('#882020'), { mark: C('#ffffff') }));
  icon('icon_gate_key', (px) => key(px, gold, goldD, C('#f0ece0'), C('#c8c0a8'), { mark: C('#e88a9a') }));
  icon('icon_hatch_key', (px) => key(px, steel, steelD, C('#a07040'), C('#6a4a28'), { square: true, mark: C('#2a1a10') }));
  icon('icon_keeper_key', (px) => key(px, C('#8a8e98'), C('#5a5e68'), C('#5a5e68'), C('#3a3e48'), { big: true, mark: C('#d8d8e0') }));
  icon('icon_basement_key', (px) => key(px, rust, rustD, C('#e88a30'), C('#a85818'), { mark: C('#2a1a10') }));
  icon('icon_front_key', (px) => key(px, gold, goldD, C('#3858a8'), C('#283c78'), { big: true, mark: C('#ffffff') }));
  icon('icon_ota_keyring', (px) => {
    px.disc(7, 5, 3.5, steel); px.disc(7, 5, 2.2, 0);
    px.rect(2, 8, 2, 6, gold); px.rect(1, 13, 4, 2, gold);
    px.rect(6, 9, 2, 6, steel); px.rect(5, 14, 4, 1, steel);
    px.rect(10, 8, 2, 7, C('#c88a3a')); px.rect(10, 14, 4, 1, C('#c88a3a'));
    px.set(11, 9, C('#f0c070'));
  });
  icon('icon_flashlight', (px) => {
    px.rect(3, 6, 9, 5, C('#c83838')); px.hline(3, 11, 6, C('#e86060')); px.hline(3, 11, 10, C('#882020'));
    px.rect(12, 5, 3, 7, C('#b8bcc8')); px.vline(14, 5, 11, C('#e8f0ff'));
    px.disc(2, 8, 1.5, steel); px.set(1, 12, steel); px.set(2, 13, steel);
  });
  icon('icon_batteries', (px) => {
    for (const x0 of [3, 9]) { px.rect(x0, 4, 4, 10, C('#3a3a40')); px.rect(x0, 9, 4, 5, C('#d8a030')); px.rect(x0 + 1, 3, 2, 1, steel); px.vline(x0, 4, 13, C('#5a5a64')); }
  });
  icon('icon_fish_sausage', (px) => {
    px.thick(3, 12, 13, 4, 2.2, C('#d84848')); px.line(4, 11, 12, 4, C('#f08080'));
    px.set(2, 13, C('#e8d8a8')); px.set(14, 3, C('#e8d8a8')); px.set(1, 14, C('#c8b888'));
  });
  function paper(px, col, lines, torn) {
    px.rect(3, 2, 10, 13, col || C('#f0ece0')); px.vline(12, 2, 14, C('#c8c0a8')); px.hline(3, 12, 14, C('#c8c0a8'));
    for (let y = 5; y < 13; y += 2) if (lines) px.hline(5, 10, y, lines);
    if (torn) for (let y = 2; y < 15; y += 2) px.set(torn === 'r' ? 12 : 3, y, 0);
  }
  icon('icon_note', (px) => { paper(px, null, C('#a8a090')); px.line(9, 2, 12, 5, C('#d8d0c0')); });
  icon('icon_letter', (px) => {
    px.rect(1, 4, 14, 10, C('#f2ecdc')); px.hline(1, 14, 13, C('#c8c0a8')); px.vline(14, 4, 13, C('#c8c0a8'));
    px.line(1, 4, 8, 9, C('#c8c0a8')); px.line(14, 4, 8, 9, C('#c8c0a8'));
    px.rect(11, 5, 3, 3, C('#c83838'));
  });
  icon('icon_postcard', (px) => {
    px.rect(1, 3, 14, 10, C('#f0ece0')); px.rect(2, 4, 7, 8, C('#e89058')); px.rect(2, 9, 7, 3, C('#5a4a6a')); px.disc(6, 7, 1.4, C('#f8d070'));
    px.hline(10, 13, 6, C('#a8a090')); px.hline(10, 13, 8, C('#a8a090')); px.rect(12, 4, 2, 1, C('#c83838'));
  });
  for (const [n, k] of [['icon_sheet_1', 1], ['icon_sheet_2', 2], ['icon_sheet_3', 3]]) {
    icon(n, (px) => {
      paper(px, null, null, k === 2 ? 'r' : 'l');
      for (let y = 5; y <= 11; y += 2) px.hline(4, 11, y, C('#8a8478'));
      for (let i = 0; i < k + 1; i++) { px.disc(5 + i * 2.5, 7 + (i % 2) * 2, 1, C('#2a2430')); px.vline(6 + i * 2.5, 3 + (i % 2) * 2, 7 + (i % 2) * 2, C('#2a2430')); }
    });
  }
  icon('icon_kuroda_song', (px) => {
    paper(px);
    for (let y = 4; y <= 12; y += 2) px.hline(4, 11, y, C('#8a8478'));
    px.rect(3, 6, 10, 1, C('#e8e0b0')); px.rect(3, 10, 10, 1, C('#e8e0b0'));
    for (const [x0, y0] of [[5, 8], [7, 6], [9, 7], [11, 9]]) { px.disc(x0, y0, 1, C('#2a2430')); }
  });
  icon('icon_developer', (px) => {
    px.rect(5, 1, 6, 2, C('#2a2a30')); px.rect(4, 3, 8, 12, C('#6a3a1a')); px.vline(5, 4, 13, C('#8a5a30')); px.vline(11, 3, 14, C('#4a2810'));
    px.rect(5, 7, 6, 5, C('#f0ece0')); px.hline(6, 9, 9, C('#2a2430'));
  });
  icon('icon_photo_1977', (px) => {
    px.rect(1, 2, 14, 12, C('#f4f0e8')); px.rect(2, 3, 12, 9, C('#8a8478'));
    px.rect(2, 3, 12, 3, C('#b8b0a0')); for (let x = 3; x < 13; x += 2) px.rect(x, 8, 1, 3, C('#3a3630'));
    px.vline(14, 2, 13, C('#c8c0b0'));
  });
  icon('icon_fishing_rod', (px) => {
    px.line(2, 14, 11, 2, C('#c89a5a')); px.line(3, 14, 12, 2, C('#9a6a3a'));
    px.line(12, 2, 13, 9, C('#e8e8f0'));
    px.rect(12, 9, 3, 3, C('#d83838')); px.set(13, 11, 0); px.rect(12, 12, 1, 1, C('#c8c8d0')); px.rect(14, 12, 1, 1, C('#c8c8d0'));
  });
  icon('icon_cap', (px) => {
    px.ellipse(8, 8, 6, 5, C('#3858a8')); px.rect(2, 8, 12, 3, C('#3858a8'));
    px.rect(1, 10, 9, 3, C('#283c78')); px.hline(1, 9, 12, C('#1c2850'));
    px.rect(6, 4, 4, 2, C('#5878c8')); px.rect(9, 6, 2, 2, C('#ffffff'));
  });
  icon('icon_wire_cutters', (px) => {
    px.thick(3, 13, 8, 7, 1.5, C('#c83838')); px.thick(7, 14, 9, 8, 1.5, C('#a82828'));
    px.line(8, 7, 12, 2, steel); px.line(9, 8, 14, 4, steelD); px.disc(8.5, 7.5, 1.2, steelD);
  });
  icon('icon_pressure_chart', (px) => {
    paper(px, C('#f0ece0'));
    px.hline(5, 11, 5, C('#c83838')); px.hline(5, 8, 8, C('#3858c8')); px.hline(5, 10, 11, C('#8a8a92'));
    px.set(12, 5, C('#2a2430')); px.set(9, 8, C('#2a2430')); px.set(11, 11, C('#2a2430'));
  });
  icon('icon_brass_key', (px) => key(px, gold, goldD, C('#c8a060'), C('#8a6a30')));
  icon('icon_diary', (px) => { paper(px, null, C('#a8a090'), 'r'); });
})(window.G);
