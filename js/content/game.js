// NOBODY HOME: shared game setup used by every chapter.
// Speakers, deaths, endings, the title screen, the hint phone, save nightlights and small helpers.
// Chapter files (js/content/prologue.js, ch1.js ... finale.js) add maps, items and hints.
(function (G) {
  'use strict';
  const TS = G.TS;
  const P = (name, fallback) => (e) => (G.PORTRAITS[name] ? G.PORTRAITS[name](e) : fallback ? fallback(e) : null);

  // ---------------- speakers ----------------
  // In text: '@haru:scared Line', '@mom Line', '@ narration'.
  Object.assign(G.SPEAKERS, {
    haru: { name: 'Haru', color: '#8fb0d4', blip: 560, portrait: P('haru') },
    old_haru: { name: 'Haru', color: '#c8b48a', blip: 300, speed: 30, portrait: P('old_haru') },
    caretaker: { get name() { return G.S.flags.knowsSato ? 'Mr. Sato' : '???'; }, color: '#8a9a94', blip: 120, blipWave: 'sawtooth', speed: 22, textColor: '#c8d4ce' },
    mom: { name: 'Mom', color: '#e8a8b8', blip: 700, blipWave: 'sine', speed: 34, textColor: '#f4dce4', portrait: P('phone') },
    voice: { name: '???', color: '#e8a8b8', blip: 700, blipWave: 'sine', speed: 30, textColor: '#f4dce4' },
    yui: { name: 'Yui', color: '#e0b890', blip: 600, blipWave: 'sine', portrait: P('yui') },
    nurse: { name: 'Mr. Sato', color: '#90c0d8', blip: 260, portrait: P('nurse') },
    ota: { name: 'Mrs. Ota', color: '#b8a0d8', blip: 820, blipWave: 'sine', speed: 30, portrait: P('ota') },
    kuroda: { name: 'Mr. Kuroda', color: '#a8a8b0', blip: 240, speed: 32, portrait: P('kuroda') },
    shota: { name: 'Shota', color: '#e0a060', blip: 640, portrait: P('shota') },
    shota_cap: { name: 'Shota', color: '#e0a060', blip: 640, portrait: P('shota_cap') },
    guest: { name: '???', color: '#d8d0c0', blip: 180, blipWave: 'triangle', speed: 24 },
    tama: { name: 'Tama', color: '#a8a8b8', blip: 900, blipWave: 'sine' },
  });

  // ---------------- game over texts (cause -> text) ----------------
  G.DEATHS = Object.assign(G.DEATHS || {}, {
    caretaker: 'A hand on your shoulder. "It\'s late. Back to bed now."',
    okaeri: 'You opened the door.',
    guests: 'The party goes on without you.',
    hands: 'The laundry chute took you down.',
    steam: 'The steam burns.',
  });

  // ---------------- endings ----------------
  G.ENDINGS = Object.assign(G.ENDINGS || {}, {
    okaeri: {
      title: 'OKAERI', subtitle: 'Ending 1 of 4', color: '#c84050', music: 'badend',
      lines: ['You opened the door for the voice.', 'Something in the dark said "Welcome home."', 'It was not your mother.'],
      hint: 'Mom said: do not open the door for anyone.',
    },
    nobody_home: {
      title: 'NOBODY HOME', subtitle: 'Ending 2 of 4', color: '#8090b0', music: 'badend',
      lines: ['Haru ran out into the storm and did not stop.', 'The building was gone. The road was empty.', 'They found him at dawn on the river road,', 'asking every car if they had seen his mother.'],
      hint: 'Some phone calls are worth answering.',
    },
    lights_out: {
      title: 'LIGHTS OUT', subtitle: 'Ending 3 of 4', color: '#a0a0c0', music: 'sad',
      lines: ['Haru took the Caretaker\'s hand.', 'For a second the room was white and smelled of soap.', 'Then it was 404 again, and the rain, and the dark.', 'Tomorrow night, the knocking starts again.'],
      hint: 'Read every letter. Help the neighbours. Do not leave the cat behind.',
    },
    welcome_home: {
      title: 'WELCOME HOME', subtitle: 'Ending 4 of 4', color: '#f0c890', music: 'ending',
      lines: ['Morning came to Hinata Hills.', 'The cat slept on the blanket. The rain had stopped.', 'Someone had brought oranges.', 'Thank you for playing.'],
    },
  });

  // ---------------- true ending conditions ----------------
  G.LETTERS_TOTAL = 5;
  G.trueEnd = function () {
    const E = G.EV.api;
    const missing = [];
    if (E.notesCount('letter_') < G.LETTERS_TOTAL) missing.push('letters');
    if (!E.flag('tama_saved')) missing.push('tama');
    for (const t of ['helped_ota', 'helped_kuroda', 'helped_shota']) if (!E.flag(t)) missing.push(t);
    return missing;
  };

  // ---------------- hint phone (call home: 404) ----------------
  // E.goal(text, id) sets the goal. G.HINTS[id] is one of:
  //   ['@mom line', ...]                         always the same hint
  //   [['@mom tier 1'], ['@mom tier 2'], [...]]   tiers: vague -> names the room -> names the clue.
  //                                               Each call on the same goal, or every 4 minutes
  //                                               stuck on it, unlocks the next tier.
  //   function (E) -> either of the above (for goals with sub-steps)
  G.HINTS = G.HINTS || {};
  G.hintLines = function (E) {
    const id = E.flag('@goalId');
    let h = id && G.HINTS[id];
    if (typeof h === 'function') h = h(E);
    if (!h || !h.length) return null;
    if (!Array.isArray(h[0])) return h;
    const calls = E.flag('@goalCalls') || 0;
    const mins = (G.S.time - (E.flag('@goalSince') || 0)) / 240;
    return h[Math.min(h.length - 1, Math.max(calls, Math.floor(mins)))];
  };
  G.callHome = function* (E) {
    E.sfx('dial');
    yield* E.wait(0.9);
    E.sfx('ring');
    yield* E.wait(1.2);
    if (E.flag('phoneDead')) { yield* E.say('@ Nothing. Not even a dial tone.'); return; }
    E.inc('hintCalls');
    // once, from the third floor on: the real world leaks through
    if (E.flag('reached3F') && !E.flag('rareCall') && E.count('hintCalls') >= 3) {
      E.set('rareCall');
      E.sfx('static');
      yield* E.say('@voice Hinata Hills, night desk... hello?', '@voice Mr. Aoki? Mr. Aoki, is that you? Stay where you are, we\'re coming-');
      E.sfx('static');
      yield* E.say('@ Click.', '@haru:scared ...Wrong number?');
      return;
    }
    const h = G.hintLines(E) || ['@mom Haru? The line is so bad tonight...', '@mom Look carefully, sweetheart. Read everything. Somebody always leaves a clue.'];
    G.S.flags['@goalCalls'] = (E.flag('@goalCalls') || 0) + 1;
    yield* E.say(...h);
    E.sfx('blip');
  };
  // a black rotary phone object. opts: {id, sprite, text}
  G.phoneObj = function (x, y, opts) {
    opts = opts || {};
    return Object.assign({
      id: opts.id || 'phone', x: x, y: y, sprite: 'phone',
      on: function* (E) {
        const i = yield* E.ask('@ A black rotary phone. Your fingers know one number by heart.', ['Call home (404)', 'Leave it'], { cancel: 1 });
        if (i === 0) yield* G.callHome(E);
      },
    }, opts.extra || {});
  };

  // ---------------- save nightlight (wall object on the lower wall row) ----------------
  G.nightlightObj = function (x, y, id) {
    return {
      id: id || 'nightlight', x: x, y: y, z: 'wall', sprite: 'nightlight',
      light: { r: 30, col: '#ffb060', glow: 0.5, dy: -6 },
      on: function* (E) {
        if (!E.flag('sawNightlight')) {
          E.set('sawNightlight');
          yield* E.say('@ A little plug-in nightlight, glowing orange.', '@haru Mom put these in every hallway so I wouldn\'t be scared at night.', '@haru ...It still works. That helps.');
        }
        yield* E.save();
      },
    };
  };

  // ---------------- apartment / service doors ----------------
  // G.aptDoor('401', x, y, 'a401', tx, ty, {lock, lockText, ...}) -> door object on the wall row
  G.aptDoor = function (num, x, y, to, tx, ty, opts) {
    return Object.assign({
      id: 'door_' + num, x: x, y: y, w: 1, h: 2, z: 'wall', sprite: 'door_apt_' + num,
      door: { to: to, x: tx, y: ty, dir: 'down' }, latch: true,
    }, opts || {});
  };

  // ---------------- small event helpers ----------------
  G.HELP = {
    // Tama warns: a hiss and a "!" over her head, if she is following
    *tamaHiss(E) {
      if (E.flag('follower') !== 'tama') return;
      E.sfx('hiss');
      yield* E.bubble('follower', '!', 0.8);
    },
    // a mirror shows the truth for a split second: swaps the sprite and back
    *mirrorFlash(E, objId, flashSprite, normalSprite, t) {
      E.setSprite(objId, flashSprite);
      E.sfx('static');
      yield* E.wait(t || 0.18);
      E.setSprite(objId, normalSprite);
    },
    // keys jingling somewhere outside, then fading
    *keysPass(E) {
      E.sfx('keys');
      yield* E.wait(1.2);
      E.sfx('steps_away');
    },
  };

  G.GAMEOVER_TITLE = 'LIGHTS OUT';

  // from chapter 3 on, once per session: the tab title changes while the player looks away
  let metaDone = false;
  window.addEventListener('blur', () => {
    if (metaDone || !G.S || !G.S.flags.metaTitle || G.TEST) return;
    metaDone = true;
    const old = document.title;
    document.title = 'Mr. Aoki?';
    window.addEventListener('focus', function back() { document.title = old; window.removeEventListener('focus', back); });
  });

  // ---------------- new game / title ----------------
  // the prologue sets G.START = {map, x, y, dir} and G.OPENING (generator) for the first scene
  G.START = G.START || { map: 'home_bed', x: 3, y: 4, dir: 'down' };
  G.GAME = {
    boot() { if (G.KID && G.KID.build) G.KID.build(); },
    newGame() {
      const ex = new G.Explore();
      ex.start(G.START.map, G.START.x, G.START.y, G.START.dir);
      return ex;
    },
    titleDraw(c, t) { drawTitle(c, t); },
    scenes: {},
  };

  // ---------------- title screen: Hinata Heights in the rain ----------------
  let titleBg = null;
  function buildTitle() {
    const W = G.W, H = G.H;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d');
    // sky
    for (let y = 0; y < H; y++) {
      const k = y / H;
      x.fillStyle = G.css(G.mix(G.C('#06040c'), G.C('#1a1428'), k));
      x.fillRect(0, y, W, 1);
    }
    const r = G.rng(404);
    // distant city
    for (let i = 0; i < 40; i++) {
      const bw = 8 + r.int(24), bh = 10 + r.int(40), bx = r.int(W);
      x.fillStyle = '#0c0a14'; x.fillRect(bx, H - 40 - bh, bw, bh + 40);
      for (let k = 0; k < 4; k++) if (r() < 0.3) { x.fillStyle = 'rgba(200,170,100,0.35)'; x.fillRect(bx + 2 + r.int(Math.max(1, bw - 4)), H - 40 - bh + 3 + r.int(bh), 1, 1); }
    }
    // the building: 5 floors of open corridors, facing us
    const bx = 120, bw = 210, fh = 26, top = 54;
    x.fillStyle = '#1c1a22'; x.fillRect(bx, top, bw, fh * 5 + 30);
    x.fillStyle = '#26232c'; x.fillRect(bx, top, bw, 3);
    x.fillStyle = '#121016'; x.fillRect(bx + bw - 6, top, 6, fh * 5 + 30);
    // roof water tank
    x.fillStyle = '#18161c'; x.fillRect(bx + 150, top - 18, 26, 14); x.fillRect(bx + 152, top - 4, 2, 4); x.fillRect(bx + 172, top - 4, 2, 4);
    for (let f = 0; f < 5; f++) {
      const fy = top + 8 + f * fh;
      // corridor slab and railing
      x.fillStyle = '#2c2a32'; x.fillRect(bx - 4, fy + fh - 6, bw + 8, 3);
      x.fillStyle = '#3a3742'; x.fillRect(bx - 4, fy + fh - 12, bw + 8, 1);
      for (let k = bx - 2; k < bx + bw + 4; k += 4) { x.fillStyle = '#24222a'; x.fillRect(k, fy + fh - 12, 1, 6); }
      // doors along the corridor
      for (let d = 0; d < 6; d++) {
        const dx = bx + 14 + d * 32;
        x.fillStyle = '#16141a'; x.fillRect(dx, fy + 2, 10, fh - 14);
        x.fillStyle = '#0e0c12'; x.fillRect(dx + 13, fy + 4, 9, 6);
      }
      // stairwell column on the left
      x.fillStyle = '#18161e'; x.fillRect(bx - 18, fy, 14, fh);
    }
    x.fillStyle = '#18161e'; x.fillRect(bx - 18, top, 14, 8);
    // ground
    x.fillStyle = '#0a0910'; x.fillRect(0, H - 40, W, 40);
    x.fillStyle = '#141220'; x.fillRect(0, H - 40, W, 1);
    titleBg = cv;
  }
  function drawTitle(c, t) {
    const W = G.W, H = G.H;
    if (!titleBg) buildTitle();
    c.drawImage(titleBg, 0, 0);
    // the lit window of 404 (4th floor, 4th door), flickering
    const bx = 120, top = 54, fh = 26;
    const fy = top + 8 + 1 * fh;
    const lit = Math.sin(t * 13) > -0.92 && !(t % 9 > 8.6 && t % 9 < 8.7);
    if (lit) {
      c.fillStyle = '#e8b860'; c.fillRect(bx + 14 + 3 * 32 + 13, fy + 4, 9, 6);
      c.globalAlpha = 0.18; c.fillStyle = '#ffb040'; c.fillRect(bx + 14 + 3 * 32 + 9, fy + 1, 17, 12); c.globalAlpha = 1;
    }
    // lightning every ~9 s: the building flashes; a tall figure stands on the 4th floor corridor
    const lt = t % 9;
    if (lt > 8.55 && lt < 8.75) {
      c.globalAlpha = lt < 8.62 ? 0.55 : 0.25; c.fillStyle = '#c8c8e8'; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
      c.fillStyle = '#060408'; const sx = bx + 14 + 5 * 32 + 2, sy = fy + fh - 30;
      c.fillRect(sx, sy, 5, 18); c.fillRect(sx + 1, sy - 4, 3, 4); c.fillRect(sx - 1, sy - 4, 7, 1);
    }
    // rain
    c.fillStyle = 'rgba(150,160,200,0.35)';
    for (let i = 0; i < 140; i++) {
      const rx = (G.hash(i, 7, 1) * W + t * 40) % W;
      const ry = (G.hash(i, 3, 2) * H + t * (300 + G.hash(i, 1, 1) * 120)) % H;
      c.fillRect(Math.round(rx), Math.round(ry), 1, 5);
    }
    G.vignette(c, 0.7);
    // a dark band behind the menu
    for (let y = 136; y < 206; y++) { const k = 1 - Math.abs(y - 171) / 35; c.fillStyle = 'rgba(4,2,8,' + (0.75 * Math.min(1, k * 1.6)).toFixed(3) + ')'; c.fillRect(0, y, W, 1); }
    // title
    G.text(c, 'NOBODY HOME', W / 2 + 1, 25, { align: 'center', scale: 3, color: '#3a0a14' });
    G.text(c, 'NOBODY HOME', W / 2, 24, { align: 'center', scale: 3, color: '#d8d0dc' });
    G.text(c, 'Hinata Heights, Apartment 404', W / 2, 52, { align: 'center', color: '#7a7088', shadow: '#000' });
    // endings seen
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem('horror_endings') || '[]'); } catch (e) { seen = []; }
    if (!Array.isArray(seen)) seen = [];
    const ids = ['okaeri', 'nobody_home', 'lights_out', 'welcome_home'];
    if (ids.some((k) => seen.includes(k))) {
      ids.forEach((k, i) => {
        const x0 = W - 52 + i * 11, y0 = H - 30;
        c.fillStyle = seen.includes(k) ? (G.ENDINGS[k].color || '#fff') : '#2a2434';
        c.fillRect(x0, y0, 8, 8);
      });
      G.text(c, 'Endings', W - 52, H - 41, { color: '#5a5466', shadow: '#000' });
    }
  }
})(window.G);
