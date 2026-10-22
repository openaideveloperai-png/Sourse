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
    // white surgical mask: lit, base, in the brim's shadow, pleat line, ear loop
    mask: C('#eceef0'), maskB: C('#d2d6da'), maskS: C('#9aa0a8'), maskD: C('#747a84'), loop: C('#bcc0c6'),
  };
  // the mask sits right under the cap brim: its top edge in the brim's shadow, a pleat across the
  // middle, the lit lower edge over the chin; loops run back to the ears
  function maskFront(px, cx, my) {
    const P = PAL;
    px.hline(cx - 3, cx + 3, my, P.maskS); px.set(cx + 3, my, P.maskD);
    px.hline(cx - 3, cx + 3, my + 1, P.mask); px.set(cx + 2, my + 1, P.maskB); px.set(cx + 3, my + 1, P.maskS);
    px.set(cx - 2, my + 1, P.maskB); px.set(cx, my + 1, P.maskB);
    px.hline(cx - 2, cx + 2, my + 2, P.mask); px.set(cx + 2, my + 2, P.maskS);
    px.set(cx - 4, my, P.loop); px.set(cx + 4, my, P.maskS);
  }
  function maskSide(px, cx, my) {
    const P = PAL;
    px.hline(cx - 5, cx - 1, my, P.maskS);
    px.hline(cx - 6, cx - 1, my + 1, P.mask); px.set(cx - 3, my + 1, P.maskB); px.set(cx - 1, my + 1, P.maskS);
    px.hline(cx - 5, cx - 2, my + 2, P.mask); px.set(cx - 2, my + 2, P.maskB);
    px.set(cx, my + 1, P.maskD); px.set(cx + 1, my, P.maskD);
  }

  // dir: 'down' | 'up' | 'left'; step: 0 stand, 1/2 strides
  // head: optional function (px, cx, hy) that draws a different head (raised poses)
  function body(dir, step, head) {
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
    if (head) head(px, cx, hy);
    else if (dir === 'up') {
      px.ellipse(cx, hy + 5, 4.5, 5, P.cap);
      px.hline(cx - 3, cx + 3, hy + 2, P.capL);
    } else if (dir === 'left') {
      px.ellipse(cx - 1, hy + 6, 4, 4.5, P.void);
      px.ellipse(cx, hy + 3, 4.5, 3.5, P.cap);
      px.rect(cx - 6, hy + 5, 6, 2, P.brim);
      px.hline(cx - 2, cx + 3, hy + 1, P.capL);
      maskSide(px, cx, hy + 7);
    } else {
      px.ellipse(cx, hy + 6, 4, 4.5, P.void);
      px.ellipse(cx, hy + 3, 5, 3.5, P.cap);
      px.hline(cx - 6, cx + 6, hy + 6, P.brim);
      px.hline(cx - 5, cx + 5, hy + 7, P.brim);
      px.hline(cx - 3, cx + 3, hy + 1, P.capL);
      maskFront(px, cx, hy + 8);
    }
    px.outline();
    return G.frame(px, cx, 44);
  }
  G.CARETAKER = { PAL: PAL, body: body, maskFront: maskFront };

  G.defChar('caretaker', () => ({
    down: [body('down', 0), body('down', 1), body('down', 2)],
    up: [body('up', 0), body('up', 1), body('up', 2)],
    left: [body('left', 0), body('left', 1), body('left', 2)],
  }));

  // the head raised toward you (scripted reveals): the cap tips back, the brow and eyes stay in
  // its shadow (two deeper hollows, no eyes), the mask lit from below by the corridor light
  function raisedHead(px, cx, hy, faceCol) {
    const P = PAL;
    px.ellipse(cx, hy + 7, 3.8, 4.6, faceCol || C('#3a3532'));
    px.ellipse(cx, hy + 2.5, 5, 3, P.cap);
    px.hline(cx - 3, cx + 2, hy + 0, P.capL);
    px.hline(cx - 6, cx + 6, hy + 4, P.brim);
    px.hline(cx - 5, cx + 5, hy + 5, C('#2a2e36'));
  }
  G.CARETAKER.raisedHead = raisedHead;
  G.defSprite('caretaker_raised', () => body('down', 0, (px, cx, hy) => {
    const P = PAL;
    raisedHead(px, cx, hy);
    // brow in the brim's shadow, two hollows where the eyes are
    px.hline(cx - 3, cx + 3, hy + 6, C('#221e20'));
    px.rect(cx - 3, hy + 7, 2, 1, C('#0c090b')); px.rect(cx + 1, hy + 7, 2, 1, C('#0c090b'));
    px.set(cx - 1, hy + 7, C('#2e2a2a')); px.set(cx, hy + 7, C('#3a3532')); px.set(cx + 3, hy + 7, C('#2e2a2a'));
    // the mask: top edge in shadow over the nose, a pleat, the lower edge lit from below
    px.hline(cx - 4, cx + 4, hy + 8, P.maskS); px.set(cx, hy + 8, P.maskB);
    px.hline(cx - 4, cx + 4, hy + 9, P.maskB); px.set(cx + 4, hy + 9, P.maskS);
    px.hline(cx - 4, cx + 4, hy + 10, P.maskS); px.set(cx + 4, hy + 10, P.maskD);
    px.hline(cx - 3, cx + 3, hy + 11, P.mask); px.set(cx + 3, hy + 11, P.maskB);
    px.hline(cx - 2, cx + 2, hy + 12, P.mask);
    // loops back to the ears
    px.set(cx - 5, hy + 7, P.loop); px.set(cx + 5, hy + 7, P.maskS);
  }));

  // full-screen scare: the masked face very close, under the cap brim, lit from below. The brow
  // and eyes are lost in the brim's shadow; the pleated mask breathes in and out.
  G.defSprite('scare_caretaker', () => {
    const frames = [];
    const BG = C('#040306');
    for (let k = 0; k < 3; k++) {
      const px = new G.PX(64, 48);
      px.rect(0, 0, 64, 48, BG);
      const tilt = [0, 1, -1][k], breath = [0, 1, -1][k];
      const fx = (y) => 32 + tilt * (y - 24) * 0.05;
      const inFace = (x, y, grow) => { const dx = (x + 0.5 - fx(y)) / (15 + (grow || 0)), dy = (y + 0.5 - 28) / 24; return dx * dx + dy * dy <= 1; };
      // ears at the sides, half in shadow
      for (const ex of [16, 48]) px.ellipse(ex + tilt, 25, 2.2, 4, C('#2a2624'));
      // face: lit from below so everything above the mask falls into shadow
      for (let y = 6; y < 48; y++)
        for (let x = 10; x < 54; x++) {
          if (!inFace(x, y)) continue;
          const dx = (x - fx(y)) / 15, dy = (y - 28) / 24;
          const l = dy * 0.9 - Math.abs(dx) * 0.5, b = G.bayer(x, y) * 0.18;
          px.set(x, y, l > 0.0 + b ? C('#5e5852') : l > -0.35 + b ? C('#3e3936') : C('#221e1e'));
        }
      // hollows where the eyes should be: dark, nothing in them
      for (const ex of [26, 38]) {
        px.ellipse(ex + tilt, 21, 3.6, 2.4, C('#141012'));
        px.ellipse(ex + tilt, 21.4, 2.2, 1.3, C('#060405'));
      }
      // the mask: wider than the face at the cheeks, top edge curving over the nose
      const top = (x) => 26 + Math.round(Math.abs(x - fx(26)) / 7);
      for (let y = 25; y < 48; y++)
        for (let x = 9; x < 55; x++) {
          if (y < top(x) || !inFace(x, y, 0.5)) continue;
          const t = (y - 25) / 22, dx = (x - fx(y)) / 16;
          let v = 0.12 + t * 0.72 - Math.abs(dx) * 0.42 + G.bayer(x, y) * 0.1;
          // the fabric draws in over the mouth on an in-breath and puffs out on the out-breath
          const md = Math.hypot((x - fx(y)) / 6, (y - 38) / 3);
          if (md < 1) v += breath * -0.2 * (1 - md);
          const col = v > 0.74 ? C('#dfe2e5') : v > 0.55 ? C('#b6bcc2') : v > 0.38 ? C('#8c9299') : v > 0.22 ? C('#646a71') : C('#44484f');
          px.set(x, y, col);
        }
      // top edge in shadow, nose ridge
      for (let x = 9; x < 55; x++) { const y = top(x); if (inFace(x, y, 0.5)) px.set(x, y, C('#3e4248')); }
      px.vline(32 + tilt, 27, 30, C('#8a9098'));
      // three pleats: a shadow line with a lit fold below it, sagging a little at the sides
      for (const py of [33, 40]) {
        for (let x = 9; x < 55; x++) {
          const y = py + Math.round(Math.abs(x - fx(py)) / 10);
          if (!inFace(x, y, 0.5) || y < top(x) + 1) continue;
          px.set(x, y, G.darken(px.get(x, y), 0.32));
          if (inFace(x, y + 1, 0.5)) px.set(x, y + 1, G.lighten(px.get(x, y + 1), 0.12));
        }
      }
      // ear loops: thin strings from the mask corners, along the jaw, back behind the ears
      const fl = (y) => Math.round(fx(y) - 15 * Math.sqrt(Math.max(0, 1 - ((y + 0.5 - 28) / 24) ** 2)));
      const fr2 = (y) => Math.round(fx(y) + 15 * Math.sqrt(Math.max(0, 1 - ((y + 0.5 - 28) / 24) ** 2)));
      for (let y = 26; y <= 44; y++) { px.set(fl(y), y, y < 30 ? C('#8a9098') : C('#6a7078')); px.set(fr2(y) - 1, y, C('#50565e')); }
      // cap brim across the top and its shadow on the brow
      for (let y = 7; y < 13; y++) for (let x = 0; x < 64; x++) { const c = px.get(x, y); if (c !== BG) px.set(x, y, G.darken(c, 0.55 - (y - 7) * 0.07)); }
      px.rect(0, 0, 64, 7, C('#1e222a'));
      px.ellipse(32, 2, 26, 7, C('#2e343e'));
      px.hline(10, 54, 1, C('#3c4450'));
      px.hline(6, 58, 7, C('#14161c'));
      // grain
      const r = G.rng(70 + k);
      for (let i = 0; i < 110; i++) { const x = r.int(64), y = r.int(48); if (px.get(x, y) !== BG) px.set(x, y, G.darken(px.get(x, y), 0.22)); }
      frames.push(G.frame(px, 32, 48));
    }
    return frames;
  }, 4);
})(window.G);
