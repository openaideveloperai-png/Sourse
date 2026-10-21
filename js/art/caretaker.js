// The Caretaker: the main pursuer. Tall (about 1.5x Haru), grey work uniform and cap,
// head bowed so the face is shadow, long arms, a big ring of keys at the hip.
(function (G) {
  'use strict';
  const C = G.C;
  const PAL = {
    cap: C('#2e343e'), capL: C('#46505c'), brim: C('#1e222a'),
    uni: C('#56605c'), uniD: C('#3e4644'), uniL: C('#6e7a74'),
    pants: C('#33383a'), pantsD: C('#24282a'), shoe: C('#141418'),
    skin: C('#a8a49c'), skinD: C('#86827a'), void: C('#060408'),
    key: C('#c8b060'), keyD: C('#8a7a3a'), ring: C('#9a9aa4'),
  };

  // dir: 'down' | 'up' | 'left'; step: 0 stand, 1/2 strides
  function body(dir, step) {
    const W = 22, H = 46;
    const px = new G.PX(W, H);
    const P = PAL;
    const cx = 11;
    const bob = step ? 1 : 0;
    // long legs
    if (dir === 'left') {
      const a = [0, -3, 3][step], b = -a;
      px.thick(cx, 29 + bob, cx + a, 42, 1.2, P.pantsD);
      px.thick(cx, 29 + bob, cx + b, 42, 1.2, P.pants);
      px.rect(cx + a - 3, 42, 4, 2, P.shoe);
      px.rect(cx + b - 3, 42, 4, 2, P.shoe);
    } else {
      const la = step === 1 ? -1 : 0, ra = step === 2 ? -1 : 0;
      px.rect(cx - 3, 29 + bob, 2, 13 + la, P.pants); px.vline(cx - 2, 29 + bob, 41 + la, P.pantsD);
      px.rect(cx + 1, 29 + bob, 2, 13 + ra, P.pants); px.vline(cx + 2, 29 + bob, 41 + ra, P.pantsD);
      px.rect(cx - 4, 42 + la, 3, 2, P.shoe); px.rect(cx + 1, 42 + ra, 3, 2, P.shoe);
    }
    const y0 = 13 + bob;
    // thin torso, hunched shoulders
    px.poly([[cx - 5, y0 + 1], [cx + 5, y0 + 1], [cx + 4, y0 + 17], [cx - 4, y0 + 17]], P.uni);
    px.poly([[cx - 6, y0 + 2], [cx - 3, y0], [cx + 3, y0], [cx + 6, y0 + 2]], P.uniD);
    if (dir !== 'up') {
      px.vline(cx, y0 + 2, y0 + 16, P.uniD);
      px.rect(cx - 4, y0 + 7, 2, 2, P.uniD); px.rect(cx + 2, y0 + 7, 2, 2, P.uniD);
      px.hline(cx - 4, cx + 4, y0 + 14, P.uniD);
    } else {
      px.hline(cx - 4, cx + 4, y0 + 14, P.uniD);
      px.vline(cx, y0 + 2, y0 + 13, P.uniD);
    }
    px.vline(cx - 5, y0 + 1, y0 + 9, P.uniL);
    // arms: far too long, hands hanging at the knees
    const sw = [0, 1, -1][step];
    if (dir === 'left') {
      px.thick(cx - 1, y0 + 2, cx - 2 + sw * 2, y0 + 19, 1.1, P.uniD);
      px.rect(cx - 3 + sw * 2, y0 + 19, 2, 6, P.skin); px.set(cx - 3 + sw * 2, y0 + 24, P.skinD);
    } else {
      px.thick(cx - 6, y0 + 2, cx - 7, y0 + 19 + sw, 1.0, P.uniD);
      px.thick(cx + 6, y0 + 2, cx + 7, y0 + 19 - sw, 1.0, P.uniD);
      px.rect(cx - 8, y0 + 19 + sw, 2, 6, P.skin); px.vline(cx - 8, y0 + 23 + sw, y0 + 25 + sw, P.skinD);
      px.rect(cx + 7, y0 + 19 - sw, 2, 6, P.skin); px.vline(cx + 8, y0 + 23 - sw, y0 + 25 - sw, P.skinD);
    }
    // key ring
    if (dir !== 'up') {
      const kx = dir === 'left' ? cx + 2 : cx + 4, ky = y0 + 15;
      px.disc(kx, ky + 1, 1.6, P.ring);
      px.set(kx, ky + 1, P.uniD);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI + (step ? 0.3 : 0);
        px.set(Math.round(kx - 1 + Math.cos(a) * 2), ky + 3 + Math.round(Math.sin(a)), P.key);
        px.set(Math.round(kx - 1 + Math.cos(a) * 2), ky + 4 + Math.round(Math.sin(a)), P.keyD);
      }
    }
    // long neck bent forward, head bowed: cap and shadow, no face
    const hy = y0 - 11;
    px.rect(cx - 1, hy + 9, 3, 4, P.skinD);
    if (dir === 'up') {
      px.ellipse(cx, hy + 5, 4.5, 5, P.cap);
      px.hline(cx - 3, cx + 3, hy + 2, P.capL);
    } else if (dir === 'left') {
      px.ellipse(cx - 1, hy + 6, 4, 4.5, P.void);
      px.ellipse(cx, hy + 3, 4.5, 3.5, P.cap);
      px.rect(cx - 6, hy + 5, 6, 2, P.brim);
      px.hline(cx - 2, cx + 3, hy + 1, P.capL);
    } else {
      px.ellipse(cx, hy + 6, 4, 4.5, P.void);
      px.ellipse(cx, hy + 3, 5, 3.5, P.cap);
      px.hline(cx - 6, cx + 6, hy + 6, P.brim);
      px.hline(cx - 5, cx + 5, hy + 7, P.brim);
      px.hline(cx - 3, cx + 3, hy + 1, P.capL);
    }
    px.outline();
    return G.frame(px, cx, 44);
  }

  G.defChar('caretaker', () => ({
    down: [body('down', 0), body('down', 1), body('down', 2)],
    up: [body('up', 0), body('up', 1), body('up', 2)],
    left: [body('left', 0), body('left', 1), body('left', 2)],
  }));

  // standing still with the head raised: the blank face (scripted reveals)
  G.defSprite('caretaker_raised', () => {
    const f = body('down', 0);
    const px = new G.PX(f.w, f.h);
    const cv = document.createElement('canvas'); cv.width = f.w; cv.height = f.h;
    const x = cv.getContext('2d'); x.drawImage(f.c, 0, 0);
    // a smooth pale face where the shadow was
    const P = PAL;
    x.fillStyle = '#c8c4bc'; x.fillRect(f.ax - 3, 4, 7, 7); x.fillRect(f.ax - 2, 3, 5, 1); x.fillRect(f.ax - 2, 11, 5, 1);
    x.fillStyle = '#1a1618'; x.fillRect(f.ax - 2, 6, 2, 1); x.fillRect(f.ax + 1, 6, 2, 1);
    x.fillStyle = '#a8a49c'; x.fillRect(f.ax + 2, 5, 2, 6);
    return { c: cv, ax: f.ax, ay: f.ay, w: f.w, h: f.h };
  });

  // full-screen scare: a long featureless face lit from below, under the cap brim
  G.defSprite('scare_caretaker', () => {
    const frames = [];
    for (let k = 0; k < 3; k++) {
      const px = new G.PX(64, 48);
      px.rect(0, 0, 64, 48, C('#040306'));
      const tilt = [0, 1, -1][k];
      // face: tall oval, light from below so the brow is in shadow
      for (let y = 6; y < 48; y++)
        for (let x = 10; x < 54; x++) {
          const dx = (x - 32 - tilt * (y - 24) * 0.05) / 15, dy = (y - 28) / 24;
          if (dx * dx + dy * dy > 1) continue;
          const l = dy * 0.9 - Math.abs(dx) * 0.5;
          const b = G.bayer(x, y) * 0.18;
          let c = l > 0.35 + b ? C('#d6d0c6') : l > 0.0 + b ? C('#aaa49a') : l > -0.35 + b ? C('#6e6a64') : C('#2e2a2c');
          px.set(x, y, c);
        }
      // hollows where eyes would be: dark, empty, no eyes
      for (const ex of [26, 38]) {
        px.ellipse(ex + tilt, 22, 3.5, 2.5, C('#1a1618'));
        px.ellipse(ex + tilt, 22.5, 2, 1.2, C('#0a0808'));
      }
      // a crease where the mouth should be, a little too wide
      px.hline(25 + tilt, 39 + tilt, 36, C('#5a5650'));
      px.set(24 + tilt, 35, C('#5a5650')); px.set(40 + tilt, 35, C('#5a5650'));
      // cap brim across the top
      px.rect(0, 0, 64, 7, C('#1e222a'));
      px.ellipse(32, 2, 26, 7, C('#2e343e'));
      px.hline(6, 58, 7, C('#14161c'));
      // noise
      const r = G.rng(70 + k);
      for (let i = 0; i < 90; i++) { const x = r.int(64), y = r.int(48); if (px.get(x, y)) px.set(x, y, G.darken(px.get(x, y), 0.25)); }
      frames.push(G.frame(px, 32, 48));
    }
    return frames;
  }, 12);
})(window.G);
