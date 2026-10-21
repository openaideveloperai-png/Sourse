// Interior tilesets in the classic RPG Maker horror layout:
//   '#' ceiling (dark, solid)   'W' wall face (solid, wallpaper)   ' ' void (black, solid)
//   any other char = floor, mapped to a floor type by the map's `floor` table.
// Floors and walls are painted procedurally in world coordinates so large
// rooms never look tiled.
(function (G) {
  'use strict';
  const TS = G.TS;
  const C = G.C;
  const P = (arr) => arr.map((h) => C(h));
  const hash = G.hash;

  // ---------------- floors ----------------
  const FLOORS = {};
  G.FLOORS = FLOORS;
  function planks(px, X, Y, wx, wy, pal, plankH, seed) {
    for (let y = 0; y < TS; y++) {
      const gy = wy + y;
      const row = Math.floor(gy / plankH);
      const inRow = gy % plankH;
      const off = Math.floor(hash(row, 7, seed) * 40);
      for (let x = 0; x < TS; x++) {
        const gx = wx + x;
        const seg = Math.floor((gx + off) / 37);
        const segX = (gx + off) % 37;
        const tone = hash(row, seg, seed + 1);
        let c = tone < 0.33 ? pal[0] : tone < 0.66 ? pal[1] : pal[2];
        const grain = G.vnoise(gx / 11, gy / 1.3 + row * 3, seed + 2);
        if (grain > 0.72) c = pal[3];
        else if (grain < 0.2) c = pal[4];
        if (inRow === plankH - 1) c = pal[5];
        else if (inRow === 0) c = G.lighten(c, 0.06);
        if (segX === 0) c = pal[5];
        px.set(X + x, Y + y, c);
      }
    }
  }
  FLOORS.wood = (px, X, Y, wx, wy) => planks(px, X, Y, wx, wy, P(['#7a5236', '#71492f', '#83593a', '#8e6442', '#61402a', '#4a2f20']), 5, 11);
  FLOORS.darkwood = (px, X, Y, wx, wy) => planks(px, X, Y, wx, wy, P(['#4a3326', '#432d22', '#51392a', '#5c4130', '#3a271d', '#2a1b14']), 5, 13);
  FLOORS.oldwood = (px, X, Y, wx, wy) => {
    planks(px, X, Y, wx, wy, P(['#5e4a3c', '#564436', '#655042', '#6e5847', '#4a3a2e', '#2e231c']), 6, 17);
    // gaps and stains
    if (hash(wx, wy, 5) < 0.25) { const x = X + 3 + Math.floor(hash(wx, wy, 6) * 9); px.hline(x, x + 4, Y + 6 + Math.floor(hash(wx, wy, 7) * 6), C('#1e1712')); }
    if (hash(wx, wy, 8) < 0.15) for (let i = 0; i < 6; i++) px.set(X + 4 + Math.floor(hash(wx + i, wy, 9) * 8), Y + 4 + Math.floor(hash(wx, wy + i, 9) * 8), C('#3a2a22'));
  };
  FLOORS.parquet = (px, X, Y, wx, wy) => {
    const pal = P(['#8a5a34', '#6f4628', '#9a6a40', '#5a3820']);
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const gx = wx + x, gy = wy + y;
        const bx = Math.floor(gx / 8), by = Math.floor(gy / 8);
        const horiz = (bx + by) % 2 === 0;
        const lx = gx % 8, ly = gy % 8;
        let c = horiz ? pal[0] : pal[1];
        if ((horiz ? ly : lx) % 4 === 3) c = pal[3];
        else if (G.vnoise(gx / (horiz ? 6 : 1.5), gy / (horiz ? 1.5 : 6), 21) > 0.7) c = pal[2];
        px.set(X + x, Y + y, c);
      }
  };
  function carpet(base, dark, light, motif, trim) {
    return (px, X, Y, wx, wy, edge) => {
      for (let y = 0; y < TS; y++)
        for (let x = 0; x < TS; x++) {
          const gx = wx + x, gy = wy + y;
          let c = (gx + gy) % 2 === 0 && G.hash(gx, gy, 31) < 0.3 ? dark : base;
          // diamond motif every 16px
          const mx = (gx + 8) % 16 - 8, my = (gy + 8) % 16 - 8;
          if (Math.abs(mx) + Math.abs(my) === 4) c = motif;
          else if (Math.abs(mx) + Math.abs(my) === 0) c = light;
          px.set(X + x, Y + y, c);
        }
      if (!edge) return;
      // gold trim along edges that border another floor type
      const t = trim;
      if (edge.t) { px.hline(X, X + 15, Y + 1, t); px.hline(X, X + 15, Y + 2, dark); }
      if (edge.b) { px.hline(X, X + 15, Y + 14, t); px.hline(X, X + 15, Y + 13, dark); }
      if (edge.l) { px.vline(X + 1, Y, Y + 15, t); px.vline(X + 2, Y, Y + 15, dark); }
      if (edge.r) { px.vline(X + 14, Y, Y + 15, t); px.vline(X + 13, Y, Y + 15, dark); }
    };
  }
  FLOORS.carpet_red = carpet(C('#7a1f26'), C('#5e161c'), C('#c9a24a'), C('#93303a'), C('#b88a3a'));
  FLOORS.carpet_blue = carpet(C('#26346a'), C('#1b2550'), C('#c9a24a'), C('#33468a'), C('#a8904a'));
  FLOORS.carpet_green = carpet(C('#28503a'), C('#1c3a2a'), C('#c9a24a'), C('#346a4c'), C('#a8904a'));
  FLOORS.carpet_purple = carpet(C('#4a2a5e'), C('#361e46'), C('#c9a24a'), C('#5e3a76'), C('#a8904a'));
  FLOORS.carpet_brown = carpet(C('#5a3e2e'), C('#46301f'), C('#a88a5a'), C('#6a4a36'), C('#8a6a3a'));
  FLOORS.tile_check = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const gx = wx + x, gy = wy + y;
        const w = (Math.floor(gx / 8) + Math.floor(gy / 8)) % 2 === 0;
        let c = w ? C('#d8d4cc') : C('#2a2830');
        if (gx % 8 === 7 || gy % 8 === 7) c = w ? C('#b8b4ac') : C('#1e1c24');
        if (w && hash(gx, gy, 3) < 0.04) c = C('#c4beb4');
        px.set(X + x, Y + y, c);
      }
  };
  function smallTiles(base, grout, hi) {
    return (px, X, Y, wx, wy) => {
      for (let y = 0; y < TS; y++)
        for (let x = 0; x < TS; x++) {
          const gx = wx + x, gy = wy + y;
          let c = base;
          if (gx % 6 === 5 || gy % 6 === 5) c = grout;
          else if (gx % 6 === 0 && gy % 6 === 0) c = hi;
          else if (hash(Math.floor(gx / 6), Math.floor(gy / 6), 4) < 0.15) c = G.darken(base, 0.08);
          px.set(X + x, Y + y, c);
        }
    };
  }
  FLOORS.tile_white = smallTiles(C('#c9cfd0'), C('#9aa2a4'), C('#e8eeee'));
  FLOORS.tile_blue = smallTiles(C('#6f8fa8'), C('#4a6278'), C('#9ab8cc'));
  FLOORS.tile_green = smallTiles(C('#6a8a72'), C('#4a6250'), C('#8aa892'));
  FLOORS.stone = (px, X, Y, wx, wy) => {
    const pal = P(['#4e4a52', '#58545c', '#45414a', '#2e2b32', '#66626b']);
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) px.set(X + x, Y + y, pal[3]);
    for (let gy = Math.floor(wy / 8) - 1; gy <= Math.floor((wy + 16) / 8); gy++) {
      const off = (gy & 1) * 5;
      for (let gx = Math.floor((wx - off) / 10) - 1; gx <= Math.floor((wx + 16) / 10) + 1; gx++) {
        const col = pal[Math.floor(hash(gx, gy, 41) * 3)];
        for (let y = 1; y < 8; y++)
          for (let x = 1; x < 10; x++) {
            const lx = gx * 10 + off + x - wx, ly = gy * 8 + y - wy;
            if (lx < 0 || ly < 0 || lx >= TS || ly >= TS) continue;
            let c = col;
            if (y === 1 || x === 1) c = pal[4];
            if (y === 7 || x === 9) c = G.darken(col, 0.2);
            px.set(X + lx, Y + ly, c);
          }
      }
    }
  };
  FLOORS.concrete = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const n = G.vnoise((wx + x) / 7, (wy + y) / 7, 51);
        const h = hash(wx + x, wy + y, 52);
        px.set(X + x, Y + y, h < 0.05 ? C('#4a4a4e') : n > 0.6 ? C('#6e6e72') : C('#626266'));
      }
  };
  FLOORS.dirt = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const n = G.vnoise((wx + x) / 6, (wy + y) / 6, 61);
        const h = hash(wx + x, wy + y, 62);
        px.set(X + x, Y + y, h < 0.06 ? C('#2e2218') : n > 0.62 ? C('#5e4834') : n < 0.3 ? C('#3e2e22') : C('#4e3c2c'));
      }
  };
  FLOORS.grass = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const n = G.vnoise((wx + x) / 9, (wy + y) / 9, 71);
        px.set(X + x, Y + y, n > 0.6 ? C('#3a5a34') : n < 0.3 ? C('#25402a') : C('#2f4c2f'));
      }
    const rnd = G.rng(wx * 3 + wy * 7);
    for (let i = 0; i < 8; i++) { const x = X + rnd.int(16), y = Y + 1 + rnd.int(15); px.set(x, y, C('#1c321f')); px.set(x, y - 1, C('#4a6e40')); }
  };
  FLOORS.void = (px, X, Y) => { px.rect(X, Y, TS, TS, C('#000000')); };
  // tatami: 16x32 mats with dark cloth borders, alternating direction
  FLOORS.tatami = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const gx = wx + x, gy = wy + y;
        const blockX = Math.floor(gx / 32), blockY = Math.floor(gy / 32);
        const vert = (blockX + blockY) % 2 === 0;
        const lx = vert ? gx % 16 : gx % 32, ly = vert ? gy % 32 : gy % 16;
        const mw = vert ? 16 : 32, mh = vert ? 32 : 16;
        let c = (vert ? gx : gy) % 2 === 0 ? C('#a8a46a') : C('#9c985e');
        if (G.hash(gx, gy, 3) < 0.04) c = C('#b4b07a');
        if (lx === 0 || lx === mw - 1 || ly === 0 || ly === mh - 1) c = C('#3a3a2a');
        else if ((vert ? (lx === 1 || lx === mw - 2) : (ly === 1 || ly === mh - 2))) c = C('#5a4a34');
        px.set(X + x, Y + y, c);
      }
  };
  // wet concrete of an open-air corridor
  FLOORS.corridor = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const gx = wx + x, gy = wy + y;
        const n = G.vnoise(gx / 9, gy / 7, 101), h = hash(gx, gy, 102);
        let c = n > 0.62 ? C('#5a5e66') : n < 0.3 ? C('#44484e') : C('#4e525a');
        if (h < 0.05) c = C('#3a3d42');
        // puddles with a cold reflection
        const pn = G.vnoise(gx / 14, gy / 10, 103);
        if (pn > 0.72) c = (gx + gy * 2) % 9 === 0 ? C('#7a8aa0') : C('#384050');
        if (gx % 48 === 0) c = C('#383b40');
        px.set(X + x, Y + y, c);
      }
  };
  FLOORS.terrazzo = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const gx = wx + x, gy = wy + y, h = hash(gx, gy, 111);
        let c = C('#8a8478');
        if (h < 0.08) c = C('#5e5a52'); else if (h < 0.14) c = C('#a8a294'); else if (h < 0.17) c = C('#6e4a3a');
        if (gx % 32 === 0 || gy % 32 === 0) c = C('#6a665c');
        px.set(X + x, Y + y, c);
      }
  };
  FLOORS.genkan = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const gx = wx + x, gy = wy + y;
        let c = hash(Math.floor(gx / 8), Math.floor(gy / 8), 121) < 0.5 ? C('#4a4844') : C('#54524c');
        if (gx % 8 === 7 || gy % 8 === 7) c = C('#2e2c2a');
        px.set(X + x, Y + y, c);
      }
  };
  FLOORS.basement = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const gx = wx + x, gy = wy + y;
        const n = G.vnoise(gx / 6, gy / 6, 131), h = hash(gx, gy, 132);
        let c = n > 0.6 ? C('#3e3e3a') : n < 0.3 ? C('#2a2a28') : C('#343430');
        if (h < 0.04) c = C('#4e4e48');
        if (G.vnoise(gx / 11, gy / 8, 133) > 0.75) c = C('#22262a');
        px.set(X + x, Y + y, c);
      }
  };
  FLOORS.linoleum = (px, X, Y, wx, wy) => {
    for (let y = 0; y < TS; y++)
      for (let x = 0; x < TS; x++) {
        const gx = wx + x, gy = wy + y;
        let c = (Math.floor(gx / 8) + Math.floor(gy / 8)) % 2 ? C('#b8b0a0') : C('#a8a090');
        if (hash(gx, gy, 141) < 0.03) c = C('#8a8274');
        px.set(X + x, Y + y, c);
      }
  };

  // ---------------- walls ----------------
  // pattern(px, X, Y, wx, y) paints the wallpaper; wainscot: height of lower panel (px, 0 = none)
  const WALLS = {};
  G.WALLS = WALLS;
  function wallpaper(base, stripe, motif, opt) {
    opt = opt || {};
    return {
      paper(px, X, Y, wx, wy, h) {
        for (let y = 0; y < h; y++)
          for (let x = 0; x < TS; x++) {
            const gx = wx + x, gy = wy + y;
            let c = base;
            if (opt.stripes && gx % opt.stripes === 0) c = stripe;
            if (opt.damask) {
              const mx = (gx % 12) - 6, my = (gy % 16) - 8;
              const d = Math.abs(mx) * 1.3 + Math.abs(my);
              if (d > 3.2 && d < 4.3) c = motif;
              if (d < 1) c = motif;
            }
            if (opt.dots && gx % 8 === 3 && gy % 8 === 3) c = motif;
            if (opt.grime) { const n = G.vnoise(gx / 5, gy / 9, 81); if (n > 0.7) c = G.darken(c, 0.18); }
            px.set(X + x, Y + y, c);
          }
      },
      wainscot: opt.wainscot === undefined ? 0 : opt.wainscot,
      panel: opt.panel || [C('#5a3a28'), C('#4a2e20'), C('#6e4a34')],
      base: opt.baseboard || C('#3a2418'),
    };
  }
  WALLS.green = wallpaper(C('#3f5a48'), C('#35503e'), C('#4e6e58'), { damask: true, wainscot: 9 });
  WALLS.red = wallpaper(C('#6a2a2e'), C('#5a2226'), C('#7e3a3e'), { damask: true, wainscot: 9 });
  WALLS.blue = wallpaper(C('#33405e'), C('#2a3650'), C('#44527a'), { stripes: 4, wainscot: 9 });
  WALLS.cream = wallpaper(C('#b8a888'), C('#a89878'), C('#c8b898'), { stripes: 6, wainscot: 9, grime: true });
  WALLS.purple = wallpaper(C('#4a3458'), C('#3e2a4a'), C('#5e4470'), { damask: true, wainscot: 9 });
  WALLS.pink = wallpaper(C('#a8707a'), C('#98626c'), C('#c08a92'), { dots: true, wainscot: 9 });
  WALLS.yellow = wallpaper(C('#a89058'), C('#98804a'), C('#b8a068'), { stripes: 5, wainscot: 9, grime: true });
  WALLS.white = wallpaper(C('#b8bcbc'), C('#a8acac'), C('#c8cccc'), { wainscot: 0, baseboard: C('#7a7e80'), grime: true });
  WALLS.dirty = wallpaper(C('#6e6658'), C('#5e5648'), C('#7e7668'), { stripes: 7, wainscot: 9, grime: true });
  WALLS.wood = {
    paper(px, X, Y, wx, wy, h) {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < TS; x++) {
          const gx = wx + x;
          let c = gx % 8 === 0 ? C('#3a2418') : G.vnoise(gx / 2, (wy + y) / 9, 91) > 0.6 ? C('#6e4a32') : C('#5e3e2a');
          px.set(X + x, Y + y, c);
        }
    },
    wainscot: 0, base: C('#2a1a12'),
  };
  WALLS.brick = {
    paper(px, X, Y, wx, wy, h) {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < TS; x++) {
          const gx = wx + x, gy = wy + y;
          const row = Math.floor(gy / 5), off = row % 2 ? 5 : 0;
          let c = hash(Math.floor((gx + off) / 10), row, 5) < 0.5 ? C('#6a3a30') : C('#5e322a');
          if (gy % 5 === 4 || (gx + off) % 10 === 0) c = C('#3a2a26');
          px.set(X + x, Y + y, c);
        }
    },
    wainscot: 0, base: C('#2a1e1a'),
  };
  WALLS.stone = {
    paper(px, X, Y, wx, wy, h) {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < TS; x++) {
          const gx = wx + x, gy = wy + y;
          const row = Math.floor(gy / 7), off = row % 2 ? 6 : 0;
          const b = Math.floor((gx + off) / 12);
          let c = [C('#4a4650'), C('#544f5a'), C('#423e48')][Math.floor(hash(b, row, 6) * 3)];
          if (gy % 7 === 6 || (gx + off) % 12 === 0) c = C('#2a2830');
          else if (gy % 7 === 0) c = G.lighten(c, 0.08);
          px.set(X + x, Y + y, c);
        }
    },
    wainscot: 0, base: C('#1e1c22'),
  };
  WALLS.concrete = {
    paper(px, X, Y, wx, wy, h) {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < TS; x++) {
          const gx = wx + x, gy = wy + y;
          const n = G.vnoise(gx / 5, gy / 9, 151);
          let c = n > 0.62 ? C('#7a7c80') : n < 0.3 ? C('#5e6064') : C('#6c6e72');
          if (gx % 64 === 0) c = C('#4a4c50');
          // rain stains running down
          if (G.vnoise(gx / 2.5, 0.5, 152) > 0.72 && G.hash(gx, Math.floor(gy / 3), 153) < 0.8) c = G.darken(c, 0.2);
          px.set(X + x, Y + y, c);
        }
    },
    wainscot: 0, base: C('#3a3c40'),
  };
  WALLS.plaster = wallpaper(C('#b4a68a'), C('#a4967a'), C('#c4b69a'), { wainscot: 0, baseboard: C('#5a4632'), grime: true });
  WALLS.danchi = wallpaper(C('#a8a490'), C('#989480'), C('#b8b4a0'), { wainscot: 10, panel: [C('#6a6e66'), C('#565a54'), C('#7e827a')], baseboard: C('#3a3c38'), grime: true });
  WALLS.tiles = {
    paper(px, X, Y, wx, wy, h) {
      for (let y = 0; y < h; y++)
        for (let x = 0; x < TS; x++) {
          const gx = wx + x, gy = wy + y;
          let c = gx % 6 === 5 || gy % 6 === 5 ? C('#8a9294') : C('#c4cccc');
          if (gx % 6 === 0 && gy % 6 === 0) c = C('#e0e8e8');
          px.set(X + x, Y + y, c);
        }
    },
    wainscot: 0, base: C('#6a7274'),
  };

  // ---------------- room renderer ----------------
  // map: {w, h, tiles:[rows], floor:{ch:type}, wall:type, ceiling:'#hex'}
  G.renderRoom = function (map) {
    const W = map.w * TS, H = map.h * TS;
    const px = new G.PX(W, H);
    const at = (c, r) => (c < 0 || r < 0 || c >= map.w || r >= map.h ? ' ' : map.tiles[r][c]);
    const isWall = (ch) => ch === 'W';
    const isCeil = (ch) => ch === '#' || ch === ' ' || ch === 'R';
    const isFloor = (ch) => !isWall(ch) && !isCeil(ch);
    const ceil = C(map.ceiling || '#120d16');
    const ceilRim = G.lighten(ceil, 0.12);
    const wall = WALLS[map.wall] || WALLS.green;
    for (let r = 0; r < map.h; r++)
      for (let c = 0; c < map.w; c++) {
        const ch = at(c, r);
        const X = c * TS, Y = r * TS;
        if (ch === ' ') { px.rect(X, Y, TS, TS, C('#000000')); continue; }
        if (ch === 'R') {
          // outside beyond the railing: dark sky, distant lit windows, then the parapet
          for (let y = 0; y < TS; y++)
            for (let x = 0; x < TS; x++) {
              const gx = X + x, gy = Y + y;
              let col = C('#0a0e18');
              if (y < 9 && G.hash(Math.floor(gx / 6), Math.floor(gy / 5), 160) < 0.04 && (gx % 6) < 3 && (gy % 5) < 2) col = C('#c8a860');
              if (y >= 9) col = y === 9 ? C('#8a8c90') : y < 12 ? C('#6c6e72') : C('#4a4c50');
              px.set(gx, gy, col);
            }
          // metal rail with posts
          px.hline(X, X + 15, Y + 3, C('#5a5e66'));
          px.hline(X, X + 15, Y + 4, C('#33363c'));
          px.vline(X + 7, Y + 4, Y + 8, C('#44484e'));
          continue;
        }
        if (ch === '#') {
          px.rect(X, Y, TS, TS, ceil);
          // rim where the ceiling meets something visible
          if (!isCeil(at(c, r + 1))) px.hline(X, X + 15, Y + 15, ceilRim);
          if (!isCeil(at(c - 1, r))) px.vline(X, Y, Y + 15, ceilRim);
          if (!isCeil(at(c + 1, r))) px.vline(X + 15, Y, Y + 15, ceilRim);
          continue;
        }
        if (ch === 'W') {
          // which row of the wall face is this?
          let top = r, bot = r;
          while (isWall(at(c, top - 1))) top--;
          while (isWall(at(c, bot + 1))) bot++;
          const wallTopY = top * TS, wallH = (bot - top + 1) * TS;
          const localY = Y - wallTopY;
          const wtype = (map.wallAt && map.wallAt(c, r)) || wall;
          wtype.paper(px, X, Y, X, Y, TS);
          // wainscot panel at the bottom of the face
          if (wtype.wainscot) {
            const py0 = wallH - wtype.wainscot - 3;
            for (let y = 0; y < TS; y++) {
              const ly = localY + y;
              if (ly < py0) continue;
              for (let x = 0; x < TS; x++) {
                const gx = X + x;
                let col = wtype.panel[0];
                if (ly === py0) col = wtype.panel[2];
                else if (ly === py0 + 1) col = wtype.panel[1];
                else if (gx % 16 === 0 || gx % 16 === 15) col = wtype.panel[1];
                px.set(X + x, Y + y, col);
              }
            }
          }
          // crown molding under the ceiling
          if (localY === 0) { px.hline(X, X + 15, Y, G.darken(px.get(X, Y + 2), 0.45)); px.hline(X, X + 15, Y + 1, G.lighten(px.get(X, Y + 2), 0.12)); }
          // baseboard
          if (r === bot) { px.rect(X, Y + 13, TS, 3, wtype.base); px.hline(X, X + 15, Y + 13, G.lighten(wtype.base, 0.2)); }
          // vertical corner shading next to ceiling columns
          if (isCeil(at(c - 1, r))) px.vline(X, Y, Y + 15, G.darken(px.get(X + 1, Y + 8), 0.35));
          if (isCeil(at(c + 1, r))) px.vline(X + 15, Y, Y + 15, G.darken(px.get(X + 14, Y + 8), 0.45));
          continue;
        }
        const ftype = (map.floor && map.floor[ch]) || (map.floor && map.floor['.']) || 'wood';
        const fn = FLOORS[ftype] || FLOORS.wood;
        const same = (cc, rr) => at(cc, rr) === ch;
        fn(px, X, Y, X, Y, { t: !same(c, r - 1), b: !same(c, r + 1), l: !same(c - 1, r), r: !same(c + 1, r) });
      }
    // shadows cast onto the floor by walls/ceilings
    for (let r = 0; r < map.h; r++)
      for (let c = 0; c < map.w; c++) {
        if (!isFloor(at(c, r))) continue;
        const X = c * TS, Y = r * TS;
        if (!isFloor(at(c, r - 1))) for (let y = 0; y < 5; y++) for (let x = 0; x < TS; x++) if (G.bayer(x, y) < 1 - y / 5) px.set(X + x, Y + y, G.darken(px.get(X + x, Y + y), 0.4 - y * 0.06));
        if (isCeil(at(c - 1, r)) || isWall(at(c - 1, r))) for (let y = 0; y < TS; y++) for (let x = 0; x < 3; x++) if (G.bayer(x, y) < 1 - x / 3) px.set(X + x, Y + y, G.darken(px.get(X + x, Y + y), 0.3));
        if (isCeil(at(c + 1, r)) || isWall(at(c + 1, r))) for (let y = 0; y < TS; y++) for (let x = 13; x < 16; x++) if (G.bayer(x, y) < (x - 12) / 3) px.set(X + x, Y + y, G.darken(px.get(X + x, Y + y), 0.2));
      }
    return px.canvas();
  };
})(window.G);
