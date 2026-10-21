// Core: namespace, constants, math helpers, seeded RNG, colors,
// the PX pixel buffer used to build every sprite, and the bitmap font.
(function (root) {
  'use strict';
  const G = (root.G = root.G || {});

  // Screen is 416x240 internal pixels. The level area is 26x14 tiles of 16px
  // under a 16px HUD band.
  G.W = 416;
  G.H = 240;
  G.TS = 16;
  G.COLS = 26;
  G.ROWS = 14;
  G.TOP = 16;

  // ---------- math ----------
  G.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.ease = {
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    out: (t) => 1 - (1 - t) * (1 - t),
    in: (t) => t * t,
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
  };
  G.mod = (a, n) => ((a % n) + n) % n;

  // Small deterministic RNG (mulberry32) so procedural art is the same every run.
  G.rng = function (seed) {
    let s = seed >>> 0;
    const f = function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.int = (n) => Math.floor(f() * n);
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    f.range = (a, b) => a + f() * (b - a);
    return f;
  };
  // Stable hash of integers -> [0,1)
  G.hash = function (a, b, c) {
    let h = (a * 374761393 + b * 668265263 + (c || 0) * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };

  // ---------- colors ----------
  // Colors are packed as 0xAABBGGRR so they can go straight into ImageData.
  const cache = {};
  G.C = function (hex, a) {
    const key = hex + (a === undefined ? '' : ':' + a);
    if (cache[key] !== undefined) return cache[key];
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const al = a === undefined ? 255 : Math.round(a * 255);
    return (cache[key] = ((al << 24) | (b << 16) | (g << 8) | r) >>> 0);
  };
  G.rgba = (c) => [c & 255, (c >>> 8) & 255, (c >>> 16) & 255, (c >>> 24) & 255];
  G.pack = (r, g, b, a) =>
    (((a === undefined ? 255 : a) << 24) | (G.clamp(b | 0, 0, 255) << 16) | (G.clamp(g | 0, 0, 255) << 8) | G.clamp(r | 0, 0, 255)) >>> 0;
  G.mix = function (c1, c2, t) {
    const a = G.rgba(c1), b = G.rgba(c2);
    return G.pack(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, Math.round(a[3] + (b[3] - a[3]) * t));
  };
  G.css = function (c) {
    const a = G.rgba(c);
    return 'rgba(' + a[0] + ',' + a[1] + ',' + a[2] + ',' + (a[3] / 255).toFixed(3) + ')';
  };
  const INK = '#140c1c';
  G.INK = INK;

  // ---------- PX: tiny pixel buffer ----------
  class PX {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.d = new Uint32Array(w * h);
    }
    in(x, y) {
      return x >= 0 && y >= 0 && x < this.w && y < this.h;
    }
    set(x, y, c) {
      x = Math.floor(x);
      y = Math.floor(y);
      if (c === undefined || c === null) return;
      if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c;
    }
    get(x, y) {
      x = Math.floor(x);
      y = Math.floor(y);
      return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : 0;
    }
    // set only where something is already drawn (used for shading passes)
    tint(x, y, c) {
      if (this.get(x, y)) this.set(x, y, c);
    }
    rect(x, y, w, h, c) {
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    }
    hline(x0, x1, y, c) {
      if (x1 < x0) [x0, x1] = [x1, x0];
      for (let x = x0; x <= x1; x++) this.set(x, y, c);
    }
    vline(x, y0, y1, c) {
      if (y1 < y0) [y0, y1] = [y1, y0];
      for (let y = y0; y <= y1; y++) this.set(x, y, c);
    }
    line(x0, y0, x1, y1, c) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        this.set(x0, y0, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    // thick line made of discs
    thick(x0, y0, x1, y1, r, c) {
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let i = 0; i <= n; i++) this.disc(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, r, c);
    }
    // filled ellipse, centered on pixel grid (cx,cy can be .5)
    ellipse(cx, cy, rx, ry, c) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.set(x, y, c);
        }
      }
    }
    disc(cx, cy, r, c) {
      if (r < 0.75) { this.set(cx, cy, c); return; }
      this.ellipse(cx, cy, r, r, c);
    }
    // filled polygon (even-odd scanline)
    poly(pts, c) {
      let minY = Infinity, maxY = -Infinity;
      for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
      for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        const yc = y + 0.5, xs = [];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], b = pts[(i + 1) % pts.length];
          if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
        xs.sort((p, q) => p - q);
        for (let k = 0; k + 1 < xs.length; k += 2)
          for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
      }
    }
    // stamp a list of strings; map: char -> color (packed). '.' and ' ' are transparent.
    stamp(rows, map, ox, oy, flip) {
      ox = ox || 0;
      oy = oy || 0;
      for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch === '.' || ch === ' ') continue;
          const c = map[ch];
          if (c === undefined) continue;
          const x = flip ? ox + row.length - 1 - i : ox + i;
          this.set(x, oy + j, c);
        }
      }
      return this;
    }
    blit(src, ox, oy, flip) {
      for (let y = 0; y < src.h; y++)
        for (let x = 0; x < src.w; x++) {
          const c = src.d[y * src.w + x];
          if (c >>> 24) this.set(ox + (flip ? src.w - 1 - x : x), oy + y, c);
        }
      return this;
    }
    // Selective outline: every empty pixel touching a filled one becomes a dark
    // version of that neighbour. fixed: use a single color instead.
    outline(fixed, diag) {
      const w = this.w, h = this.h, src = this.d.slice();
      const ink = G.C(INK);
      const nb = diag
        ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]
        : [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (src[y * w + x] >>> 24) continue;
          let found = 0;
          for (const [dx, dy] of nb) {
            const X = x + dx, Y = y + dy;
            if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
            const n = src[Y * w + X];
            if (n >>> 24 === 255) { found = n; break; }
          }
          if (found) this.d[y * w + x] = fixed !== undefined && fixed !== null ? fixed : G.mix(found, ink, 0.78);
        }
      return this;
    }
    replace(from, to) {
      for (let i = 0; i < this.d.length; i++) if (this.d[i] === from) this.d[i] = to;
      return this;
    }
    map(fn) {
      for (let i = 0; i < this.d.length; i++) if (this.d[i] >>> 24) this.d[i] = fn(this.d[i], i % this.w, (i / this.w) | 0);
      return this;
    }
    clone() {
      const p = new PX(this.w, this.h);
      p.d.set(this.d);
      return p;
    }
    flipped() {
      const p = new PX(this.w, this.h);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) p.d[y * this.w + (this.w - 1 - x)] = this.d[y * this.w + x];
      return p;
    }
    canvas() {
      const cv = document.createElement('canvas');
      cv.width = this.w;
      cv.height = this.h;
      const cx = cv.getContext('2d');
      const img = cx.createImageData(this.w, this.h);
      new Uint32Array(img.data.buffer).set(this.d);
      cx.putImageData(img, 0, 0);
      return cv;
    }
  }
  G.PX = PX;

  // A sprite frame: canvas + anchor (usually the feet point).
  G.frame = (px, ax, ay) => ({ c: px.canvas(), ax: ax, ay: ay, w: px.w, h: px.h });
  G.drawFrame = function (ctx, f, x, y, flip, alpha) {
    if (!f) return;
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    if (flip) {
      ctx.save();
      ctx.translate(Math.round(x), 0);
      ctx.scale(-1, 1);
      ctx.drawImage(f.c, -(f.w - f.ax), Math.round(y - f.ay));
      ctx.restore();
    } else ctx.drawImage(f.c, Math.round(x - f.ax), Math.round(y - f.ay));
    if (alpha !== undefined) ctx.globalAlpha = 1;
  };
  // palette helper: {k:'#hex'} -> {k: packed}
  G.pal = function (o) {
    const r = {};
    for (const k in o) r[k] = typeof o[k] === 'number' ? o[k] : G.C(o[k]);
    return r;
  };

  // ---------- bitmap font ----------
  // Proportional pixel font. Caps are 7px tall, descenders go 2px below.
  const GL = {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#',
    B: '####.|#...#|#...#|####.|#...#|#...#|####.',
    C: '.###.|#...#|#....|#....|#....|#...#|.###.',
    D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
    E: '#####|#....|#....|####.|#....|#....|#####',
    F: '#####|#....|#....|####.|#....|#....|#....',
    G: '.###.|#...#|#....|#.###|#...#|#...#|.####',
    H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
    I: '###|.#.|.#.|.#.|.#.|.#.|###',
    J: '..###|...#.|...#.|...#.|#..#.|#..#.|.##..',
    K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#',
    L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#',
    N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
    O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    P: '####.|#...#|#...#|####.|#....|#....|#....',
    Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#',
    R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    S: '.####|#....|#....|.###.|....#|....#|####.',
    T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
    U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
    W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#',
    X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..',
    Z: '#####|....#|...#.|..#..|.#...|#....|#####',
    a: '....|....|.###|...#|.###|#..#|.###',
    b: '#...|#...|###.|#..#|#..#|#..#|###.',
    c: '....|....|.###|#...|#...|#...|.###',
    d: '...#|...#|.###|#..#|#..#|#..#|.###',
    e: '....|....|.##.|#..#|####|#...|.###',
    f: '..##|.#..|####|.#..|.#..|.#..|.#..',
    g: '....|....|.###|#..#|#..#|#..#|.###|...#|.##.',
    h: '#...|#...|###.|#..#|#..#|#..#|#..#',
    i: '#|.|#|#|#|#|#',
    j: '..#|...|..#|..#|..#|..#|..#|#.#|.#.',
    k: '#...|#...|#..#|#.#.|##..|#.#.|#..#',
    l: '#.|#.|#.|#.|#.|#.|.#',
    m: '.....|.....|##.#.|#.#.#|#.#.#|#.#.#|#.#.#',
    n: '....|....|###.|#..#|#..#|#..#|#..#',
    o: '....|....|.##.|#..#|#..#|#..#|.##.',
    p: '....|....|###.|#..#|#..#|#..#|###.|#...|#...',
    q: '....|....|.###|#..#|#..#|#..#|.###|...#|...#',
    r: '...|...|#.#|##.|#..|#..|#..',
    s: '....|....|.###|#...|.##.|...#|###.',
    t: '.#.|.#.|###|.#.|.#.|.#.|..#',
    u: '....|....|#..#|#..#|#..#|#..#|.###',
    v: '.....|.....|#...#|#...#|#...#|.#.#.|..#..',
    w: '.....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.',
    x: '....|....|#..#|#..#|.##.|#..#|#..#',
    y: '....|....|#..#|#..#|#..#|#..#|.###|...#|.##.',
    z: '....|....|####|...#|.##.|#...|####',
    0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.',
    1: '.#.|##.|.#.|.#.|.#.|.#.|###',
    2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
    3: '####.|....#|....#|.###.|....#|....#|####.',
    4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.',
    5: '#####|#....|####.|....#|....#|#...#|.###.',
    6: '.###.|#....|#....|####.|#...#|#...#|.###.',
    7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
    8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
    9: '.###.|#...#|#...#|.####|....#|....#|.###.',
    ' ': '...',
    '.': '.|.|.|.|.|.|#',
    ',': '..|..|..|..|..|.#|.#|#.',
    '!': '#|#|#|#|#|.|#',
    '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
    ':': '.|.|#|.|.|.|#',
    ';': '..|..|.#|..|..|..|.#|#.',
    "'": '#|#|.',
    '"': '#.#|#.#|...',
    '-': '....|....|....|####|....',
    '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
    '(': '.#|#.|#.|#.|#.|#.|.#',
    ')': '#.|.#|.#|.#|.#|.#|#.',
    '[': '##|#.|#.|#.|#.|#.|##',
    ']': '##|.#|.#|.#|.#|.#|##',
    '/': '....#|...#.|...#.|..#..|.#...|.#...|#....',
    '=': '....|....|####|....|####|....',
    '_': '....|....|....|....|....|....|....|####',
    '<': '...#|..#.|.#..|#...|.#..|..#.|...#',
    '>': '#...|.#..|..#.|...#|..#.|.#..|#...',
    '%': '##...|##..#|...#.|..#..|.#...|#..##|...##',
    '#': '.#.#.|#####|.#.#.|.#.#.|#####|.#.#.|.....',
    '*': '.....|#.#.#|.###.|#####|.###.|#.#.#|.....',
    '~': '.....|.....|.#...|#.#.#|...#.',
    '♥': '.....|##.##|#####|#####|.###.|..#..|.....',
    '→': '.....|...#.|....#|#####|....#|...#.|.....',
    '←': '.....|.#...|#....|#####|#....|.#...|.....',
    '↑': '..#..|.###.|#.#.#|..#..|..#..|..#..|..#..',
    '↓': '..#..|..#..|..#..|..#..|#.#.#|.###.|..#..',
    '×': '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#',
    '…': '.....|.....|.....|.....|.....|.....|#.#.#',
  };
  const glyphs = {};
  for (const k in GL) {
    const rows = GL[k].split('|');
    glyphs[k] = { rows: rows, w: rows.reduce((m, r) => Math.max(m, r.length), 0) };
  }
  G.FONT_H = 11;
  G.glyphs = glyphs;

  G.textWidth = function (s, scale) {
    scale = scale || 1;
    let w = 0;
    for (const ch of s) {
      const g = glyphs[ch] || glyphs['?'];
      w += (g.w + 1) * scale;
    }
    return Math.max(0, w - scale);
  };

  // font atlas per color: canvas with every glyph drawn, cached
  const atlases = {};
  const order = Object.keys(glyphs);
  function atlasFor(color) {
    if (atlases[color]) return atlases[color];
    let x = 0;
    const pos = {};
    for (const k of order) { pos[k] = x; x += glyphs[k].w + 1; }
    const px = new PX(x, 9);
    const c = typeof color === 'number' ? color : G.C(color);
    for (const k of order) {
      const g = glyphs[k];
      g.rows.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) if (row[i] === '#') px.set(pos[k] + i, j, c);
      });
    }
    return (atlases[color] = { c: px.canvas(), pos: pos });
  }

  // Draw text. opts: color, shadow (color or false), scale, align ('left'|'center'|'right'), outline color
  G.text = function (ctx, s, x, y, opts) {
    opts = opts || {};
    const color = opts.color || '#ffffff';
    const scale = opts.scale || 1;
    let w = G.textWidth(s, scale);
    if (opts.align === 'center') x -= Math.floor(w / 2);
    else if (opts.align === 'right') x -= w;
    x = Math.round(x);
    y = Math.round(y);
    const draw = (col, dx, dy) => {
      const at = atlasFor(col);
      let cx = x + dx;
      for (const ch of s) {
        const g = glyphs[ch] || glyphs['?'];
        const key = glyphs[ch] ? ch : '?';
        ctx.drawImage(at.c, at.pos[key], 0, g.w, 9, cx, y + dy, g.w * scale, 9 * scale);
        cx += (g.w + 1) * scale;
      }
    };
    if (opts.outline) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) draw(opts.outline, dx * (opts.ow || 1), dy * (opts.ow || 1));
    }
    if (opts.shadow !== false && !opts.outline) draw(opts.shadow || '#140c1c', scale, scale);
    draw(color, 0, 0);
    return w;
  };

  // word-wrap a string to a pixel width
  G.wrap = function (s, maxW) {
    const words = s.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (G.textWidth(t) > maxW && cur) { lines.push(cur); cur = w; }
      else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  };
})(typeof window !== 'undefined' ? window : globalThis);
