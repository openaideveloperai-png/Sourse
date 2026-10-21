// Furniture and props for house interiors, drawn in 3/4 view.
// Convention: anchor = bottom-center of the footprint. Tall objects (shelves,
// wardrobes, clocks) stand on the floor row under a wall and extend upward
// over the wall face. Wall objects (doors, windows, paintings) sit on 'W' tiles.
(function (G) {
  'use strict';
  const C = G.C, TS = G.TS;
  const def = G.defSprite;
  const fr = (px, ax, ay) => G.frame(px, ax, ay);
  const WOOD = { base: C('#6a4630'), dark: C('#4a3020'), light: C('#86603f'), top: C('#7e5638'), ink: C('#2a1a12') };
  const DWOOD = { base: C('#3e2a22'), dark: C('#2a1c16'), light: C('#54392c'), top: C('#4a3328'), ink: C('#1a100c') };
  const brass = C('#c8a050'), brassD = C('#8a6a30');

  // ---------- doors (1x2 on the wall face) ----------
  function door(kind, open) {
    const px = new G.PX(16, 32);
    const frame = kind === 'iron' ? C('#4a4a52') : kind === 'white' ? C('#b8b0a4') : C('#3a2418');
    const body = kind === 'iron' ? C('#5e5e68') : kind === 'white' ? C('#d8d0c4') : kind === 'red' ? C('#6a2420') : C('#6a4430');
    const bodyD = G.darken(body, 0.25), bodyL = G.lighten(body, 0.12);
    px.rect(0, 2, 16, 30, frame);
    px.hline(0, 15, 2, G.lighten(frame, 0.2));
    if (open) {
      px.rect(2, 4, 12, 28, C('#08050a'));
      px.rect(2, 4, 3, 28, body); px.vline(4, 4, 31, bodyD);
    } else {
      px.rect(2, 4, 12, 28, body);
      // panels
      px.rect(4, 6, 8, 9, bodyD); px.rect(5, 7, 6, 7, body); px.hline(5, 10, 7, bodyL);
      px.rect(4, 18, 8, 11, bodyD); px.rect(5, 19, 6, 9, body); px.hline(5, 10, 19, bodyL);
      px.vline(2, 4, 31, bodyL);
      px.set(12, 17, brass); px.set(12, 18, brassD); px.set(11, 17, brass);
      if (kind === 'iron') for (let y = 6; y < 30; y += 6) { px.set(3, y, C('#8a8a96')); px.set(12, y, C('#8a8a96')); }
    }
    px.outline();
    return fr(px, 8 + 0, 32);
  }
  for (const k of ['wood', 'red', 'white', 'iron']) {
    def('door_' + k, () => door(k, false));
    def('door_' + k + '_open', () => door(k, true));
  }
  def('door', () => door('wood', false));
  def('door_open', () => door('wood', true));
  // open doorway / arch (no door)
  def('doorway', () => { const px = new G.PX(16, 32); px.rect(0, 2, 16, 30, C('#3a2418')); px.rect(2, 4, 12, 28, C('#06040a')); px.outline(); return fr(px, 8, 32); });

  // ---------- windows (on the wall, 1x1 or 2x1) ----------
  function windowSprite(w, night) {
    const px = new G.PX(w, 18);
    const fcol = C('#4a3020');
    px.rect(0, 0, w, 18, fcol);
    const glass = night === 'red' ? C('#3a0a14') : night ? C('#1a2448') : C('#9ac0e0');
    px.rect(2, 2, w - 4, 13, glass);
    // moon glow + rain streaks
    if (night) {
      for (let i = 0; i < w * 2; i++) px.set(2 + (i * 7) % (w - 4), 2 + ((i * 5) % 13), G.lighten(glass, 0.12));
      if (night !== 'red') { px.disc(w - 7, 5, 1.6, C('#d8e0f0')); }
    }
    px.vline(Math.floor(w / 2), 2, 14, fcol);
    px.hline(2, w - 3, 8, fcol);
    px.rect(0, 15, w, 3, G.lighten(fcol, 0.15));
    // curtains
    px.rect(0, 0, 3, 18, C('#5a1a22')); px.rect(w - 3, 0, 3, 18, C('#5a1a22'));
    px.vline(1, 0, 17, C('#7a2a32')); px.vline(w - 2, 0, 17, C('#3a0e14'));
    px.outline();
    return fr(px, w / 2, 17);
  }
  def('window', () => windowSprite(16, true));
  def('window_wide', () => windowSprite(32, true));
  def('window_red', () => windowSprite(16, 'red'));

  // ---------- bookshelf (1x1 footprint, 32 tall) ----------
  function bookshelf(w, messy) {
    const px = new G.PX(w, 32);
    G.box3(px, 0, 0, w, 32, WOOD.top, WOOD.dark, { topH: 3 });
    const rnd = G.rng(w * 7 + (messy ? 3 : 0));
    const cols = ['#7a2a2a', '#2a4a6a', '#2a5a3a', '#6a5a2a', '#4a2a5a', '#8a6a4a', '#3a3a4a'].map((h) => C(h));
    for (const sy of [4, 13, 22]) {
      px.rect(2, sy, w - 4, 8, C('#1e130c'));
      let x = 2;
      while (x < w - 2) {
        const bw = 1 + rnd.int(2), bh = 5 + rnd.int(3);
        if (messy && rnd() < 0.25) { x += bw; continue; }
        const c = rnd.pick(cols);
        px.rect(x, sy + 8 - bh, bw, bh, c);
        px.set(x, sy + 8 - bh, G.lighten(c, 0.25));
        x += bw;
      }
      px.hline(1, w - 2, sy + 8, WOOD.light);
    }
    px.rect(0, 30, w, 2, WOOD.ink);
    px.outline();
    return fr(px, w / 2, 32);
  }
  def('bookshelf', () => bookshelf(16, false));
  def('bookshelf_wide', () => bookshelf(32, false));
  def('bookshelf_messy', () => bookshelf(16, true));

  // ---------- wardrobe / closet (hide spot) ----------
  function wardrobe(open) {
    const px = new G.PX(16, 32);
    G.box3(px, 0, 0, 16, 32, DWOOD.top, DWOOD.base, { topH: 3 });
    px.vline(7, 4, 29, DWOOD.dark); px.vline(8, 4, 29, DWOOD.light);
    px.rect(2, 6, 4, 10, DWOOD.dark); px.rect(10, 6, 4, 10, DWOOD.dark);
    px.rect(2, 18, 4, 9, DWOOD.dark); px.rect(10, 18, 4, 9, DWOOD.dark);
    px.set(6, 17, brass); px.set(9, 17, brass);
    if (open) { px.rect(1, 4, 6, 26, C('#06040a')); }
    px.rect(1, 30, 2, 2, DWOOD.dark); px.rect(13, 30, 2, 2, DWOOD.dark);
    px.outline();
    return fr(px, 8, 32);
  }
  def('wardrobe', () => wardrobe(false));
  def('wardrobe_open', () => wardrobe(true));

  // ---------- table (2x1), small table, desk ----------
  def('table', () => {
    const px = new G.PX(32, 22);
    px.rect(0, 0, 32, 10, C('#7a5236'));
    G.woodFill(px, 1, 1, 30, 8, C('#7a5236'), C('#6a4630'), C('#8a603e'), 5);
    px.hline(0, 31, 0, C('#9a7048'));
    px.rect(0, 10, 32, 3, WOOD.dark);
    px.rect(1, 13, 3, 9, WOOD.dark); px.rect(28, 13, 3, 9, WOOD.dark);
    px.outline();
    return fr(px, 16, 22);
  });
  def('table_cloth', () => {
    const px = new G.PX(32, 22);
    px.rect(0, 0, 32, 10, C('#d8d0c0'));
    px.rect(0, 10, 32, 8, C('#c4bcac'));
    for (let x = 0; x < 32; x += 3) px.set(x, 17, C('#a8a090'));
    px.hline(0, 31, 0, C('#f0e8d8'));
    px.rect(1, 18, 3, 4, WOOD.dark); px.rect(28, 18, 3, 4, WOOD.dark);
    px.outline();
    return fr(px, 16, 22);
  });
  def('table_small', () => {
    const px = new G.PX(16, 18);
    G.woodFill(px, 0, 0, 16, 8, C('#7a5236'), C('#6a4630'), C('#8a603e'), 7);
    px.hline(0, 15, 0, C('#9a7048'));
    px.rect(0, 8, 16, 2, WOOD.dark);
    px.rect(2, 10, 2, 8, WOOD.dark); px.rect(12, 10, 2, 8, WOOD.dark);
    px.outline();
    return fr(px, 8, 18);
  });
  def('desk', () => {
    const px = new G.PX(32, 24);
    G.box3(px, 0, 0, 32, 24, WOOD.top, WOOD.base, { topH: 9 });
    px.rect(18, 12, 12, 4, WOOD.dark); px.set(24, 14, brass);
    px.rect(18, 17, 12, 4, WOOD.dark); px.set(24, 19, brass);
    px.rect(2, 11, 14, 11, C('#1e130c'));
    // papers and an inkwell
    px.rect(4, 2, 8, 6, C('#e0d6c0')); px.hline(5, 10, 4, C('#8a8070')); px.hline(5, 9, 6, C('#8a8070'));
    px.rect(22, 2, 3, 3, C('#141018')); px.set(23, 1, C('#e8e8f0'));
    px.outline();
    return fr(px, 16, 24);
  });
  def('chair', () => {
    const px = new G.PX(12, 22);
    px.rect(2, 0, 8, 10, WOOD.base); px.rect(3, 1, 6, 8, C('#6a2a2a'));
    px.rect(1, 10, 10, 4, WOOD.light); px.rect(1, 14, 10, 1, WOOD.dark);
    px.rect(1, 15, 2, 7, WOOD.dark); px.rect(9, 15, 2, 7, WOOD.dark);
    px.outline();
    return fr(px, 6, 22);
  });
  def('chair_back', () => {
    const px = new G.PX(12, 18);
    px.rect(1, 6, 10, 4, WOOD.light); px.rect(2, 0, 8, 7, WOOD.base); px.hline(2, 9, 0, WOOD.light);
    px.rect(1, 10, 2, 8, WOOD.dark); px.rect(9, 10, 2, 8, WOOD.dark);
    px.outline();
    return fr(px, 6, 18);
  });

  // ---------- beds ----------
  function bed(color, bloody) {
    const px = new G.PX(16, 30);
    px.rect(0, 0, 16, 6, DWOOD.base); px.hline(0, 15, 0, DWOOD.light);
    px.rect(2, 4, 12, 6, C('#e8e4dc')); px.hline(2, 13, 9, C('#c8c4bc'));
    px.rect(1, 10, 14, 16, color); px.hline(1, 14, 10, G.lighten(color, 0.2));
    for (let y = 13; y < 26; y += 4) px.hline(1, 14, y, G.darken(color, 0.15));
    px.rect(0, 26, 16, 4, DWOOD.dark);
    if (bloody) { px.disc(9, 16, 3, C('#6a0a12')); px.disc(7, 18, 2, C('#8a1018')); px.set(11, 21, C('#6a0a12')); }
    px.outline();
    return fr(px, 8, 30);
  }
  def('bed', () => bed(C('#6a2a3a')));
  def('bed_blue', () => bed(C('#2a3a6a')));
  def('bed_white', () => bed(C('#c8c0b8')));
  def('bed_blood', () => bed(C('#c8c0b8'), true));

  // ---------- dresser / cabinet / mirror ----------
  def('dresser', () => {
    const px = new G.PX(16, 22);
    G.box3(px, 0, 0, 16, 22, WOOD.top, WOOD.base, { topH: 4 });
    for (const y of [6, 11, 16]) { px.hline(1, 14, y, WOOD.dark); px.set(5, y + 2, brass); px.set(10, y + 2, brass); }
    px.outline();
    return fr(px, 8, 22);
  });
  def('cabinet', () => {
    const px = new G.PX(16, 28);
    G.box3(px, 0, 0, 16, 28, C('#7a7268'), C('#625a52'), { topH: 3 });
    px.rect(2, 5, 12, 10, C('#9ab0c0')); px.line(3, 13, 7, 6, C('#d0e0e8'));
    px.rect(2, 17, 12, 9, C('#4a443e')); px.set(8, 21, C('#c8c0b0'));
    px.outline();
    return fr(px, 8, 28);
  });
  function mirror(cracked, bloody) {
    const px = new G.PX(14, 20);
    px.rect(0, 0, 14, 20, brassD);
    px.rect(1, 1, 12, 18, brass);
    px.rect(2, 2, 10, 16, C('#8aa0b0'));
    px.line(3, 15, 9, 3, C('#c8d8e0')); px.line(4, 16, 10, 4, C('#a8bcc8'));
    if (cracked) { px.line(7, 2, 5, 9, C('#2a3038')); px.line(5, 9, 8, 17, C('#2a3038')); px.line(5, 9, 2, 12, C('#2a3038')); }
    if (bloody) { G.speckle(px, 3, 3, 8, 10, C('#7a0a14'), 14, G.rng(5)); px.vline(6, 8, 15, C('#7a0a14')); }
    px.outline();
    return fr(px, 7, 18);
  }
  def('mirror', () => mirror(false));
  def('mirror_cracked', () => mirror(true));
  def('mirror_blood', () => mirror(true, true));

  // ---------- piano (2x1) ----------
  def('piano', () => {
    const px = new G.PX(32, 30);
    px.rect(0, 0, 32, 14, C('#18121c')); px.hline(0, 31, 0, C('#3a3040'));
    px.rect(2, 2, 28, 3, C('#2a2230')); px.rect(10, 3, 12, 6, C('#e0d6c0')); px.hline(11, 20, 5, C('#6a6058')); px.hline(11, 19, 7, C('#6a6058'));
    px.rect(0, 14, 32, 6, C('#f0ece4'));
    for (let x = 1; x < 32; x += 3) px.vline(x, 14, 19, C('#a8a49c'));
    for (let x = 2; x < 31; x += 3) if (x % 21 !== 2 && x % 21 !== 11) px.rect(x, 14, 2, 3, C('#141018'));
    px.rect(0, 20, 32, 6, C('#1e1822')); px.rect(1, 26, 3, 4, C('#141018')); px.rect(28, 26, 3, 4, C('#141018'));
    px.set(14, 24, brass); px.set(18, 24, brass);
    px.outline();
    return fr(px, 16, 30);
  });

  // ---------- grandfather clock ----------
  function clock(stopped) {
    const f = [];
    for (let k = 0; k < (stopped ? 1 : 4); k++) {
      const px = new G.PX(14, 36);
      G.box3(px, 1, 0, 12, 36, DWOOD.top, DWOOD.base, { topH: 2 });
      px.disc(7, 7, 4.5, C('#d8ccb0')); px.disc(7, 7, 4.5, C('#d8ccb0'));
      px.line(7, 7, 7, 4, C('#1a1210')); px.line(7, 7, stopped ? 9 : 10, stopped ? 9 : 7, C('#1a1210'));
      px.rect(4, 14, 6, 16, C('#140e10'));
      const sw = stopped ? 0 : [-2, -1, 1, 2][k];
      px.vline(7 + Math.round(sw / 2), 14, 24, brassD);
      px.disc(7 + sw, 26, 2, brass);
      px.rect(0, 33, 14, 3, DWOOD.dark);
      px.outline();
      f.push(fr(px, 7, 36));
    }
    return stopped ? f[0] : [f[0], f[1], f[2], f[3], f[2], f[1]];
  }
  def('clock', () => clock(false), 3);
  def('clock_stopped', () => clock(true));

  // ---------- paintings (wall) ----------
  function painting(w, h, kind) {
    const px = new G.PX(w, h);
    px.rect(0, 0, w, h, brassD);
    px.rect(1, 1, w - 2, h - 2, brass);
    const ix = 2, iy = 2, iw = w - 4, ih = h - 4;
    const rnd = G.rng(w * 31 + h + kind.length);
    if (kind === 'landscape') {
      for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) px.set(ix + x, iy + y, y < ih * 0.55 ? G.mix(C('#3a4a6a'), C('#8a6a5a'), y / (ih * 0.55)) : C('#2a3a24'));
      px.disc(ix + iw * 0.7, iy + ih * 0.3, 1.5, C('#e8d8a0'));
    } else if (kind === 'portrait' || kind === 'portrait_eyes' || kind === 'portrait_blank') {
      px.rect(ix, iy, iw, ih, C('#2a1a1e'));
      const cx = ix + iw / 2;
      px.ellipse(cx, iy + ih * 0.42, iw * 0.24, ih * 0.22, C('#c8a088'));
      px.rect(Math.round(cx - iw * 0.3), Math.round(iy + ih * 0.66), Math.round(iw * 0.6), Math.round(ih * 0.34), C('#3a2a3a'));
      px.ellipse(cx, iy + ih * 0.28, iw * 0.27, ih * 0.13, C('#2a1a12'));
      if (kind === 'portrait') { px.set(Math.round(cx - 2), Math.round(iy + ih * 0.42), C('#1a1010')); px.set(Math.round(cx + 2), Math.round(iy + ih * 0.42), C('#1a1010')); }
      if (kind === 'portrait_eyes') { px.set(Math.round(cx - 2), Math.round(iy + ih * 0.42), C('#ff2020')); px.set(Math.round(cx + 2), Math.round(iy + ih * 0.42), C('#ff2020')); }
      if (kind === 'portrait_blank') px.ellipse(cx, iy + ih * 0.42, iw * 0.24, ih * 0.22, C('#1a1214'));
    } else if (kind === 'flowers') {
      px.rect(ix, iy, iw, ih, C('#2a2430'));
      for (let i = 0; i < 6; i++) px.disc(ix + 3 + rnd.int(iw - 6), iy + 3 + rnd.int(ih - 6), 1.5, rnd.pick([C('#c83a4a'), C('#e8c84a'), C('#e8e8f0')]));
    } else if (kind === 'abstract') {
      px.rect(ix, iy, iw, ih, C('#1a1420'));
      for (let i = 0; i < 4; i++) px.thick(ix + rnd.int(iw), iy + rnd.int(ih), ix + rnd.int(iw), iy + rnd.int(ih), 0.8, rnd.pick([C('#8a1a2a'), C('#3a2a6a'), C('#c8a050')]));
    } else if (kind === 'sea') {
      for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) px.set(ix + x, iy + y, y < ih * 0.45 ? C('#5a6a8a') : (x + y * 3) % 7 === 0 ? C('#8aa0c0') : C('#2a3a5a'));
    } else {
      px.rect(ix, iy, iw, ih, C('#141018'));
    }
    px.outline();
    return fr(px, w / 2, h);
  }
  for (const k of ['landscape', 'portrait', 'portrait_eyes', 'portrait_blank', 'flowers', 'abstract', 'sea', 'empty']) {
    def('painting_' + k, () => painting(14, 14, k));
    def('painting_' + k + '_big', () => painting(28, 18, k));
  }

  // ---------- fireplace (2x1 against the wall) ----------
  def('fireplace', () => {
    const f = [];
    for (let k = 0; k < 4; k++) {
      const px = new G.PX(32, 30);
      px.rect(0, 0, 32, 30, C('#5a5058')); px.rect(0, 0, 32, 4, C('#6e6470')); px.hline(0, 31, 0, C('#8a8090'));
      px.rect(6, 10, 20, 20, C('#0e0a0c'));
      for (let y = 6; y < 30; y += 4) { px.hline(1, 4, y, C('#463e46')); px.hline(27, 30, y, C('#463e46')); }
      const r = G.rng(k * 9 + 1);
      for (let i = 0; i < 3; i++) G.teardrop(px, 11 + i * 5, 25, 3, 11 + i * 5 + r.int(3) - 1, 15 + r.int(4), C('#e85a1a'));
      for (let i = 0; i < 3; i++) G.teardrop(px, 11 + i * 5, 26, 1.8, 11 + i * 5, 20 + r.int(3), C('#ffd060'));
      px.rect(7, 27, 18, 2, C('#3a2418'));
      px.outline();
      f.push(fr(px, 16, 30));
    }
    return f;
  }, 8);
  def('fireplace_cold', () => {
    const px = new G.PX(32, 30);
    px.rect(0, 0, 32, 30, C('#5a5058')); px.rect(0, 0, 32, 4, C('#6e6470')); px.hline(0, 31, 0, C('#8a8090'));
    px.rect(6, 10, 20, 20, C('#0e0a0c')); px.rect(8, 25, 16, 3, C('#2a2428')); G.speckle(px, 8, 24, 16, 4, C('#5a5458'), 10, G.rng(3));
    px.outline();
    return fr(px, 16, 30);
  });

  // ---------- small props ----------
  def('candle', () => {
    const f = [];
    for (let k = 0; k < 4; k++) {
      const px = new G.PX(10, 18);
      px.rect(3, 9, 4, 8, C('#e8e0c8')); px.vline(3, 9, 16, C('#fffaf0')); px.rect(1, 16, 8, 2, brassD);
      G.teardrop(px, 5, 7, 1.8, 5 + [0, 1, 0, -1][k], 2, C('#ffb040'));
      px.set(5, 7, C('#fff0c0'));
      px.outline();
      f.push(fr(px, 5, 18));
    }
    return f;
  }, 8);
  def('candelabra', () => {
    const f = [];
    for (let k = 0; k < 4; k++) {
      const px = new G.PX(16, 30);
      px.vline(8, 10, 27, brassD); px.rect(5, 27, 7, 3, brassD); px.hline(3, 13, 12, brass);
      for (const x of [3, 8, 13]) { px.rect(x - 1, 7, 2, 5, C('#e8e0c8')); G.teardrop(px, x, 5, 1.4, x + [0, 1, 0, -1][(k + x) % 4], 1, C('#ffb040')); }
      px.outline();
      f.push(fr(px, 8, 30));
    }
    return f;
  }, 8);
  def('lamp', () => {
    const px = new G.PX(12, 30);
    px.poly([[2, 10], [10, 10], [8, 2], [4, 2]], C('#e8c890')); px.hline(2, 9, 10, C('#c8a870'));
    px.vline(6, 11, 27, brassD); px.rect(3, 27, 7, 3, brassD);
    px.outline();
    return fr(px, 6, 30);
  });
  def('plant', () => {
    const px = new G.PX(16, 24);
    px.rect(4, 15, 8, 9, C('#8a4a30')); px.hline(3, 12, 15, C('#a85a3a'));
    G.shadeDisc(px, 8, 9, 6, C('#2f5a34'), C('#4a7a44'), C('#1e3a24'));
    G.shadeDisc(px, 5, 12, 3.5, C('#2f5a34'), C('#4a7a44'), C('#1e3a24'));
    G.shadeDisc(px, 11, 12, 3.5, C('#2f5a34'), C('#4a7a44'), C('#1e3a24'));
    px.outline();
    return fr(px, 8, 24);
  });
  def('plant_dead', () => {
    const px = new G.PX(16, 24);
    px.rect(4, 15, 8, 9, C('#6a4a3a')); px.hline(3, 12, 15, C('#8a5a4a'));
    px.line(8, 15, 6, 6, C('#4a3a2a')); px.line(8, 15, 11, 7, C('#4a3a2a')); px.line(7, 10, 4, 8, C('#4a3a2a'));
    px.outline();
    return fr(px, 8, 24);
  });
  def('vase', () => { const px = new G.PX(10, 16); px.ellipse(5, 10, 4, 5, C('#3a5a8a')); px.rect(3, 2, 4, 4, C('#3a5a8a')); px.hline(2, 7, 2, C('#5a7aaa')); px.line(3, 8, 3, 12, C('#7a9aca')); px.outline(); return fr(px, 5, 16); });
  def('chest', () => {
    const px = new G.PX(16, 14);
    G.box3(px, 0, 0, 16, 14, C('#7a5236'), C('#5e3e28'), { topH: 5 });
    px.hline(0, 15, 5, C('#3a2418')); px.rect(7, 6, 3, 3, brass);
    px.vline(3, 0, 13, C('#4a4a52')); px.vline(12, 0, 13, C('#4a4a52'));
    px.outline();
    return fr(px, 8, 14);
  });
  def('chest_open', () => {
    const px = new G.PX(16, 18);
    px.rect(0, 0, 16, 6, C('#5e3e28')); px.hline(0, 15, 0, C('#7a5236'));
    G.box3(px, 0, 6, 16, 12, C('#140c08'), C('#5e3e28'), { topH: 4 });
    px.outline();
    return fr(px, 8, 18);
  });
  def('safe', () => {
    const px = new G.PX(16, 18);
    G.box3(px, 0, 0, 16, 18, C('#5a5e66'), C('#44484e'), { topH: 3 });
    px.rect(3, 6, 10, 9, C('#3a3e44')); px.disc(8, 10, 2.5, C('#a8acb4')); px.set(8, 10, C('#2a2a30')); px.set(11, 12, C('#c8a050'));
    px.outline();
    return fr(px, 8, 18);
  });
  def('crate', () => { const px = new G.PX(16, 16); G.box3(px, 0, 0, 16, 16, C('#9a7a50'), C('#7a5a38'), { topH: 5 }); px.line(1, 6, 14, 15, C('#5a4028')); px.line(1, 15, 14, 6, C('#5a4028')); px.outline(); return fr(px, 8, 16); });
  def('barrel', () => {
    const px = new G.PX(14, 18);
    px.rect(1, 3, 12, 15, C('#7a5236')); px.ellipse(7, 3, 6, 2.5, C('#8a603e')); px.ellipse(7, 3, 4.5, 1.5, C('#4a3020'));
    px.hline(1, 12, 7, C('#4a4a52')); px.hline(1, 12, 14, C('#4a4a52')); px.vline(3, 4, 17, C('#9a7048'));
    px.outline();
    return fr(px, 7, 18);
  });
  def('sofa', () => {
    const px = new G.PX(32, 22);
    const c = C('#5a2030'), cd = C('#3e1420'), cl = C('#7a3040');
    px.rect(2, 0, 28, 10, c); px.hline(2, 29, 0, cl);
    px.rect(0, 4, 5, 16, cd); px.rect(27, 4, 5, 16, cd);
    px.rect(4, 10, 24, 7, cl); px.vline(16, 10, 16, cd);
    px.rect(2, 17, 28, 3, cd); px.rect(2, 20, 2, 2, DWOOD.dark); px.rect(28, 20, 2, 2, DWOOD.dark);
    px.outline();
    return fr(px, 16, 22);
  });
  def('rug_spot', () => { const px = new G.PX(32, 16); px.ellipse(16, 8, 15, 7, C('#6a1e26')); px.ellipse(16, 8, 12, 5, C('#7e2a32')); px.ellipse(16, 8, 6, 2.5, C('#c9a24a')); return fr(px, 16, 16); });
  def('blood', () => { const px = new G.PX(16, 12); const r = G.rng(12); px.ellipse(8, 6, 6, 3.5, C('#5a0810')); px.ellipse(7, 6, 4, 2.2, C('#7a0e18')); for (let i = 0; i < 6; i++) px.set(1 + r.int(14), 1 + r.int(10), C('#6a0a12')); return fr(px, 8, 12); });
  def('blood_trail', () => {
    const px = new G.PX(16, 16);
    const r = G.rng(13);
    for (let i = 0; i < 14; i++) { const x = 1 + i, y = 8 + Math.round(Math.sin(i * 0.6) * 2); px.disc(x, y, 1.4 - (i % 3) * 0.3, i % 4 ? C('#5a0810') : C('#7a0e18')); }
    for (let i = 0; i < 5; i++) px.set(r.int(16), 4 + r.int(9), C('#4a060c'));
    return fr(px, 8, 16);
  });
  def('footprints', () => {
    const px = new G.PX(16, 16);
    const foot = (x, y, flip) => { px.rect(x, y, 2, 3, C('#4a1218')); px.set(x + (flip ? 0 : 1), y - 1, C('#4a1218')); px.set(x, y + 4, C('#4a1218')); px.set(x + 1, y + 4, C('#4a1218')); };
    foot(4, 1, false); foot(9, 6, true); foot(4, 11, false);
    return fr(px, 8, 16);
  });
  def('paper', () => { const px = new G.PX(10, 8); px.poly([[1, 2], [8, 0], [9, 6], [2, 7]], C('#e0d6c0')); px.line(3, 3, 7, 2, C('#8a8070')); px.line(3, 5, 6, 4, C('#8a8070')); px.outline(); return fr(px, 5, 8); });
  def('sparkle', () => {
    const f = [];
    for (let k = 0; k < 4; k++) {
      const px = new G.PX(9, 9);
      const s = [1, 3, 2, 0][k];
      const c = C('#ffffff');
      px.set(4, 4, c);
      for (let i = 1; i <= s; i++) { px.set(4 - i, 4, c); px.set(4 + i, 4, c); px.set(4, 4 - i, c); px.set(4, 4 + i, c); }
      f.push(fr(px, 4, 8));
    }
    return f;
  }, 6);
  // staircase going up, seen from below: steps get narrower and darker toward the top
  def('stairs_up', () => {
    const px = new G.PX(32, 32);
    const tread = C('#8a6446'), riser = C('#5a3e2c'), edge = C('#a87e58'), rail = C('#3a2418');
    for (let i = 0; i < 7; i++) {
      const y = 28 - i * 4;
      const k = i / 8;
      px.rect(3, y, 26, 2, G.mix(tread, C('#1e140e'), k));
      px.hline(3, 28, y, G.mix(edge, C('#2a1c14'), k));
      px.rect(3, y + 2, 26, 2, G.mix(riser, C('#140c08'), k));
    }
    // carpet runner
    for (let y = 2; y < 32; y++) px.hline(11, 20, y, G.mix(px.get(11, y), C('#6a1e26'), 0.7));
    px.rect(0, 0, 3, 32, rail); px.rect(29, 0, 3, 32, rail);
    px.vline(1, 0, 31, C('#5a3a26')); px.vline(30, 0, 31, C('#5a3a26'));
    for (let y = 4; y < 32; y += 6) { px.set(1, y, C('#7a5236')); px.set(30, y, C('#7a5236')); }
    px.outline();
    return fr(px, 16, 32);
  });
  def('stairs_down', () => {
    const px = new G.PX(32, 16);
    for (let i = 0; i < 4; i++) {
      const y = i * 4;
      px.rect(3, y, 26, 4, G.mix(C('#6a4a34'), C('#06040a'), i / 3.5));
      px.hline(3, 28, y, G.mix(C('#8a6446'), C('#06040a'), i / 3.5));
    }
    px.rect(0, 0, 3, 16, C('#3a2418')); px.rect(29, 0, 3, 16, C('#3a2418'));
    return fr(px, 16, 16);
  });
  def('switch', () => { const px = new G.PX(6, 8); px.rect(0, 0, 6, 8, C('#d8d0c0')); px.rect(2, 2, 2, 4, C('#5a5048')); px.outline(); return fr(px, 3, 10); });
  def('sink', () => { const px = new G.PX(16, 22); px.rect(1, 6, 14, 8, C('#d8dcdc')); px.ellipse(8, 9, 5, 2.5, C('#9aa4a8')); px.rect(7, 1, 2, 6, C('#a8acb4')); px.rect(5, 14, 6, 8, C('#c8ccd0')); px.outline(); return fr(px, 8, 22); });
  def('toilet', () => { const px = new G.PX(14, 20); px.rect(2, 0, 10, 7, C('#e0e4e4')); px.ellipse(7, 12, 5.5, 4, C('#e8ecec')); px.ellipse(7, 12, 3.5, 2.5, C('#9aa4a8')); px.rect(4, 15, 6, 5, C('#d0d4d4')); px.outline(); return fr(px, 7, 20); });
  def('bathtub', () => { const px = new G.PX(32, 18); px.rect(0, 0, 32, 18, C('#e8ecec')); px.rect(3, 2, 26, 10, C('#9aa4a8')); px.rect(4, 3, 24, 8, C('#6a8090')); px.hline(0, 31, 0, C('#ffffff')); px.rect(0, 12, 32, 6, C('#c8d0d0')); px.outline(); return fr(px, 16, 18); });
  def('bathtub_red', () => { const px = new G.PX(32, 18); px.rect(0, 0, 32, 18, C('#e8ecec')); px.rect(3, 2, 26, 10, C('#4a0810')); px.rect(4, 3, 24, 8, C('#6a0a14')); px.hline(0, 31, 0, C('#ffffff')); px.rect(0, 12, 32, 6, C('#c8d0d0')); px.outline(); return fr(px, 16, 18); });
  def('stove', () => { const px = new G.PX(16, 24); G.box3(px, 0, 0, 16, 24, C('#3a3a40'), C('#2a2a30'), { topH: 7 }); px.disc(4, 3, 2, C('#141418')); px.disc(11, 3, 2, C('#141418')); px.rect(2, 10, 12, 10, C('#1a1a20')); px.hline(3, 12, 11, C('#5a5a64')); px.outline(); return fr(px, 8, 24); });
  def('counter', () => { const px = new G.PX(16, 22); G.box3(px, 0, 0, 16, 22, C('#c8c0b0'), C('#7a5a40'), { topH: 6 }); px.rect(2, 9, 12, 10, C('#6a4a34')); px.set(12, 13, brass); px.outline(); return fr(px, 8, 22); });
  def('fridge', () => { const px = new G.PX(16, 32); G.box3(px, 0, 0, 16, 32, C('#d8dcd8'), C('#c0c4c0'), { topH: 2 }); px.hline(1, 14, 12, C('#8a8e8a')); px.vline(13, 4, 10, C('#8a8e8a')); px.vline(13, 15, 26, C('#8a8e8a')); px.outline(); return fr(px, 8, 32); });
  def('doll', () => {
    const px = new G.PX(12, 16);
    px.poly([[2, 15], [10, 15], [8, 7], [4, 7]], C('#a83a4a'));
    px.disc(6, 5, 3.5, C('#f0d8c8'));
    px.ellipse(6, 3, 4, 2.5, C('#e8c860')); px.rect(2, 3, 2, 6, C('#e8c860')); px.rect(8, 3, 2, 6, C('#e8c860'));
    px.set(5, 5, C('#141018')); px.set(7, 5, C('#141018'));
    px.outline();
    return fr(px, 6, 16);
  });
  def('doll_bloody', () => {
    const px = new G.PX(12, 16);
    px.poly([[2, 15], [10, 15], [8, 7], [4, 7]], C('#a83a4a'));
    px.disc(6, 5, 3.5, C('#f0d8c8'));
    px.ellipse(6, 3, 4, 2.5, C('#e8c860'));
    px.set(5, 5, C('#c80010')); px.set(7, 5, C('#c80010')); px.vline(5, 6, 9, C('#8a0010'));
    px.outline();
    return fr(px, 6, 16);
  });
  def('cage', () => { const px = new G.PX(16, 24); for (let x = 1; x < 16; x += 3) px.vline(x, 2, 22, C('#5a5a64')); px.hline(0, 15, 2, C('#7a7a84')); px.hline(0, 15, 22, C('#7a7a84')); px.ellipse(8, 2, 7, 2, C('#7a7a84')); px.outline(); return fr(px, 8, 24); });
  def('statue', () => {
    const px = new G.PX(16, 32);
    const s = C('#a8a4b0'), sd = C('#76728a'), sl = C('#c8c4d0');
    px.rect(1, 26, 14, 6, sd); px.hline(1, 14, 26, s);
    px.ellipse(8, 6, 3.5, 4, s); px.rect(4, 10, 8, 13, s); px.vline(4, 10, 22, sl); px.vline(11, 10, 22, sd);
    px.rect(5, 23, 2, 3, s); px.rect(9, 23, 2, 3, sd);
    px.outline();
    return fr(px, 8, 32);
  });

  // speech bubbles for E.bubble
  function bubble(kind) {
    const px = new G.PX(13, 13);
    const w = C('#ffffff'), k = C('#140c1c');
    px.rect(1, 1, 11, 9, w); px.set(5, 10, w); px.set(6, 10, w); px.set(5, 11, w);
    if (kind === '!') { px.vline(6, 2, 6, C('#c81a2a')); px.set(6, 8, C('#c81a2a')); }
    if (kind === '?') { px.hline(5, 7, 2, k); px.set(8, 3, k); px.set(7, 4, k); px.set(6, 5, k); px.set(6, 6, k); px.set(6, 8, k); }
    if (kind === '...') { px.set(3, 6, k); px.set(6, 6, k); px.set(9, 6, k); }
    if (kind === 'heart') { const r = C('#c81a2a'); px.set(4, 3, r); px.set(8, 3, r); px.hline(3, 9, 4, r); px.hline(3, 9, 5, r); px.hline(4, 8, 6, r); px.hline(5, 7, 7, r); px.set(6, 8, r); }
    if (kind === 'note') { px.vline(7, 2, 7, k); px.hline(7, 9, 2, k); px.disc(5.5, 7.5, 1.5, k); }
    px.outline(k);
    return G.frame(px, 6, 12);
  }
  G.MOB_BUBBLES = {};
  for (const k of ['!', '?', '...', 'heart', 'note']) Object.defineProperty(G.MOB_BUBBLES, k, { get: () => (G._bub || (G._bub = {}))[k] || (G._bub[k] = bubble(k)) });
})(window.G);
