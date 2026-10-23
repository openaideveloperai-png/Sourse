// NOBODY HOME: shared game setup used by every chapter.
// Speakers, deaths, endings, the title screen, the hint phone, save nightlights and small helpers.
// Chapter files (js/content/ch1.js, ch2.js, ch3.js, ch1f.js, ch4.js) add maps, items and hints.
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

  G.SPEAKERS.sato = G.SPEAKERS.nurse;

  // ---------------- game over texts (cause -> text) ----------------
  G.GAMEOVER_TITLE = 'BACK TO BED';
  G.DEATHS = Object.assign(G.DEATHS || {}, {
    caretaker: 'A warm hand on your shoulder. "There you are. Back to bed now."',
    okaeri: 'You opened the door.',
    chute: 'A long grey sleeve came up the chute. "There you are, Aoki-san."',
    guests: 'They sang to him until the candles went out.',
    steam: 'The steam pushes you back, hot and white.',
    walkby: 'He was right there in the corridor. "Mr. Aoki? It\'s late."',
  });

  // ---------------- endings ----------------
  G.ENDINGS = Object.assign(G.ENDINGS || {}, {
    okaeri: {
      title: 'OKAERI', subtitle: 'Ending 1 of 7 - bad', color: '#c84050', music: 'badend', retry: true,
      lines: ['Haru opened the door.', 'It wasn\'t Mom.', 'Something very tall bent down until it filled the doorway.', 'It had a ring of keys. It had no face.', '"There you are," it said. "It\'s late."'],
      hint: 'Mom has her own keys.',
    },
    nobody_home: {
      title: 'NOBODY HOME', subtitle: 'Ending 2 of 7 - bad', color: '#8090b0', music: 'badend',
      lines: ['Haru let the phone ring.', 'He ran through the doors and into the rain,', 'until the building was gone and the road was empty.', 'They found him at dawn on the river road, in his slippers,', 'asking every car if they had seen his mother.', 'He was very polite about it.'],
      hint: 'Someone was trying to reach you.',
    },
    lights_out: {
      title: 'LIGHTS OUT', subtitle: 'Ending 3 of 7 - normal', color: '#a0a0c0', music: 'sad',
      lines: ['The hand was warm. Haru let it lead him.', 'For a moment the corridor had handrails, and every door had a photograph.', 'Then it was 404 again: the futon, the rain, the stopped clock.', '"Good night, Mr. Aoki."', 'Mister? thought Haru. I\'m ten.', 'Tomorrow night, the knocking starts again.'],
      hint: 'Mom wrote you five letters. Someone is still waiting for you.',
    },
    good_night: {
      title: 'GOOD NIGHT', subtitle: 'Ending 4 of 7 - good', color: '#a0c8e0', music: 'sad',
      lines: ['The hand was warm. Haru let it lead him.', 'Down the corridor, Mrs. Ota was asleep with a smile. Somewhere a piano finished its song.', 'Back in 404 the futon was warm, and someone had left the hall light on.', '"Good night, Mr. Aoki."', '"Good night," said Haru. "Tell Mom I waited up."', 'Nobody knocked again that night.'],
      hint: 'Almost. Did you read everything Mom wrote? Did you leave anyone behind?',
    },
    stay: {
      title: 'STAY IN YOUR ROOM', subtitle: 'Ending 5 of 7 - secret', color: '#d8b8e8', music: 'sad',
      lines: ['Haru got back into his futon and pulled the blanket over his head, like she said.', 'Stay in your room tonight. Whatever you hear.', 'He heard the rain. He heard keys, once, far away, and a door being checked.', 'Then it was morning. Someone knocked, and a voice he knew said, "Dad? It\'s me."', 'It was the shortest night in years.'],
      hint: 'Mom told you to stay in your room. Sometimes that is enough. But there is so much more to find out there.',
    },
    welcome_home: {
      title: 'WELCOME HOME', subtitle: 'Ending 6 of 7 - true', color: '#f0c890', music: 'ending',
      lines: ['Morning came to Hinata Hills.', 'The cat slept on the blanket. The rain had stopped.', 'Someone had brought oranges, and a very small cake.', 'He was not cured. It was just a good morning.', 'For everyone who waits up at night.'],
    },
  });

  // ---------------- true ending conditions ----------------
  // all four are optional acts of attention; none can be missed for good
  G.LETTERS_TOTAL = 5;
  G.NOTES_HEADER = () => 'Letters from Mom: ' + G.EV.api.notesCount('letter_') + '/' + G.LETTERS_TOTAL;
  G.trueEnd = function () {
    const E = G.EV.api;
    const missing = [];
    if (E.notesCount('letter_') < G.LETTERS_TOTAL) missing.push('letters');
    if (!E.flag('ota_tea')) missing.push('ota_tea');
    if (!E.flag('helped_shota')) missing.push('helped_shota');
    if (!E.flag('tama_saved')) missing.push('tama_saved');
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
        if (E.chasing()) { yield* E.say('@haru:scared Not now!'); return; }
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
    // after the true ending (or the dream ending), the title menu gets an Endings gallery
    titleItems() { const s = seenEndings(); return s.includes('welcome_home') || s.includes('happy_birthday') ? [{ label: 'Endings', act: () => G.fadeTo(() => new Gallery(), 0.6) }] : []; },
    scenes: {},
  };
  const ENDING_ORDER = ['okaeri', 'nobody_home', 'lights_out', 'good_night', 'stay', 'welcome_home', 'happy_birthday'];
  function seenEndings() {
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem('horror_endings') || '[]'); } catch (e) { seen = []; }
    return Array.isArray(seen) ? seen : [];
  }

  // ---------------- endings gallery: watch any ending again ----------------
  function Gallery() { this.t = 0; this.i = 0; this.ids = ENDING_ORDER.filter((k) => G.ENDINGS[k]); }
  G.Gallery = Gallery;
  Gallery.prototype.update = function (dt, inp) {
    this.t += dt;
    if (G.UI.active) { G.UI.update(dt, inp); return; }
    G.Audio.music('title');
    const n = this.ids.length + 1;
    if (inp.up) { this.i = (this.i + n - 1) % n; G.Audio.sfx('cursor'); }
    if (inp.down) { this.i = (this.i + 1) % n; G.Audio.sfx('cursor'); }
    if (inp.back || (inp.ok && this.i === this.ids.length)) { G.Audio.sfx('cancel'); G.fadeTo(() => new G.Title(), 0.6); return; }
    if (inp.ok) { G.Audio.sfx('select'); G.UI.openEnding(this.ids[this.i], () => {}, { replay: true }); }
  };
  Gallery.prototype.draw = function (c) {
    const W = G.W, H = G.H;
    if (G.UI.active) { G.UI.draw(c); return; }
    drawTitle(c, this.t);
    c.fillStyle = 'rgba(4,2,8,0.86)'; c.fillRect(0, 0, W, H);
    // hide the title text behind the heading
    c.fillStyle = 'rgba(4,2,8,0.97)'; c.fillRect(0, 0, W, 66); c.fillRect(W - 140, H - 40, 140, 40);
    G.text(c, 'ENDINGS', W / 2, 22, { align: 'center', scale: 2, color: '#d8d0dc', shadow: '#2a0a18' });
    const seen = seenEndings();
    this.ids.forEach((k, j) => {
      const E = G.ENDINGS[k], y = 52 + j * 19, sel = j === this.i;
      c.fillStyle = seen.includes(k) ? E.color || '#ffffff' : '#3a3444';
      c.fillRect(W / 2 - 120, y + 1, 7, 7);
      G.text(c, G.clean(E.title), W / 2 - 106, y, { color: sel ? '#ffffff' : '#a89aa8', shadow: '#000' });
      G.text(c, G.clean((E.subtitle || '').replace(/^Ending \d+ of \d+ - /, '')), W / 2 + 120, y, { align: 'right', color: sel ? E.color || '#ffffff' : '#5a5466', shadow: '#000' });
      if (sel) G.text(c, '\u2192', W / 2 - 134 - (Math.floor(this.t * 4) % 2), y, { color: '#c890ff', shadow: '#000' });
    });
    const by = 52 + this.ids.length * 19 + 6, bsel = this.i === this.ids.length;
    G.text(c, 'Back', W / 2 - 106, by, { color: bsel ? '#ffffff' : '#8a8298', shadow: '#000' });
    if (bsel) G.text(c, '\u2192', W / 2 - 134 - (Math.floor(this.t * 4) % 2), by, { color: '#c890ff', shadow: '#000' });
    G.text(c, 'Z watch   X back', W / 2, H - 12, { align: 'center', color: '#4a4458', shadow: '#000' });
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
    const ids = ['okaeri', 'nobody_home', 'lights_out', 'good_night', 'stay', 'welcome_home', 'happy_birthday'];
    if (ids.some((k) => seen.includes(k))) {
      ids.forEach((k, i) => {
        const x0 = W - 85 + i * 11, y0 = H - 30;
        c.fillStyle = seen.includes(k) ? (G.ENDINGS[k].color || '#fff') : '#2a2434';
        c.fillRect(x0, y0, 8, 8);
      });
      G.text(c, 'Endings', W - 85, H - 41, { color: '#5a5466', shadow: '#000' });
    }
  }
})(window.G);
