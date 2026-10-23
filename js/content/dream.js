// NOBODY HOME: the dream ending (HAPPY BIRTHDAY, ending 7 of 7).
// Once Tama is free, the wire cutters open the chained roof door on 4F. On the roof the rain
// stops and the sun goes down over the city. Sit on the bench with Tama and watch it, and Haru
// wakes up in his futon on the morning of his tenth birthday, with Mom home.
(function (G) {
  'use strict';
  const P = (name) => (e) => (G.PORTRAITS[name] ? G.PORTRAITS[name](e) : null);
  G.SPEAKERS.mama = { name: 'Mom', color: '#e8a8b8', blip: 700, blipWave: 'sine', speed: 34, textColor: '#f4dce4', portrait: P('mama') };
  const BDAY = [['G4', 0.3], ['G4', 0.15], ['A4', 0.45], ['G4', 0.45], ['C5', 0.45], ['B4', 0.9], ['G4', 0.3], ['G4', 0.15], ['A4', 0.45], ['G4', 0.45], ['D5', 0.45], ['C5', 0.9]];

  G.ENDINGS.happy_birthday = {
    title: 'HAPPY BIRTHDAY', subtitle: 'Ending 7 of 7 - the real one', color: '#ffd890', music: 'ending',
    lines: ['Fumiko Aoki took the rest of the day off.', 'There was cake, and ten candles, and Mrs. Ota from next door with a pot of tea.', 'Shota came up from downstairs in his blue cap.', 'A grey cat nobody had invited sat on the windowsill and watched.', 'Haru blew out every candle in one breath.', 'By lunchtime he had forgotten the dream.', 'A long, long way from that morning, an old man smiled in his sleep.'],
    hint: 'Some nights end with the sun coming up.',
  };

  Object.assign(G.HINTS, {
    roof_sun: [['@mom Haru? Where are you? It sounds like... wind.'], ['@mom (very faint) Sit down a while, sweetheart. You must be so tired.']],
  });

  // ---------------- the roof ----------------
  const dusk = (E) => !!E.flag('roof_dusk');
  G.MAPS.roof = {
    name: 'Roof', location: 'Hinata Heights - Roof', wall: 'concrete', floor: { '.': 'concrete' },
    dark: (E) => (dusk(E) ? 0 : 0.5), light: 70,
    rain: (E) => (dusk(E) ? null : 'full'),
    ambience: (E) => (dusk(E) ? 'wind' : 'rain'), music: null,
    tint: (E) => (dusk(E) ? ['#ff8a40', 0.08] : null),
    vignette: 0.4,
    entries: { from_stairs: [4, 12, 'up'] },
    tiles: [
      '##########################',
      '##########################',
      '##########################',
      '##########################',
      '##########################',
      '##########################',
      '##########################',
      '##########################',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '..........................',
      '##########################',
    ],
    objects: [
      { id: 'sky', x: 0, y: 0, w: 26, h: 8, z: 'wall', sprite: (E) => (dusk(E) ? 'roof_sky_sunset' : 'roof_sky_night'),
        text: (E) => (dusk(E) ? ['@ The sun is going down behind the city. The new tower is black against the gold.'] : ['@ Black sky. The new tower is a dark shape with one red light.']) },
      { id: 'bench', x: 12, y: 8, w: 2, sprite: 'bench', on: function* (E) { yield* sunset(E); } },
      { id: 'tank', x: 20, y: 9, w: 3, h: 2, sprite: 'water_tank', text: ['@ The building\'s water tank. Somebody painted 404 on its leg, small, like a secret.'] },
      { id: 'plant1', x: 7, y: 8, sprite: 'plant_pot', text: ['@ Somebody grows tomatoes up here. They are small and green.'] },
      { id: 'plant2', x: 17, y: 8, sprite: 'plant_pot', text: ['@ A pot of morning glories, closed up tight.'] },
      { id: 'puddle1', x: 9, y: 11, z: 'floor', solid: false, sprite: 'puddle', text: (E) => (dusk(E) ? ['@ The puddle is full of orange sky.'] : ['@ Rain rings spread across the puddle.']) },
      { id: 'puddle2', x: 16, y: 12, z: 'floor', solid: false, sprite: 'puddle' },
      { id: 'down', x: 2, y: 11, w: 2, h: 2, sprite: 'stairs_down2', z: 'floor', touch: true, solid: false, stairs: true, door: { to: 'stair4', entry: 'from_roof', dir: 'down', walk: true } },
    ],
    enter: function* (E) {
      if (dusk(E)) return;
      yield* E.say('@ The roof. Wind and rain, and the whole city dark below.');
      if (E.flag('follower') === 'tama') {
        E.sfx('chirp'); E.bubbleNow('follower', '!', 1.2);
        yield* E.say('@ Tama sits down in a puddle and looks up at the sky, as if she is waiting for something.');
      }
      yield* E.wait(0.8);
      E.music(null);
      yield* E.fadeOut(1.4);
      E.set('roof_dusk');
      G.Audio.ambience('wind');
      yield* E.wait(0.6);
      yield* E.fadeIn(2.2);
      E.sfx('chime');
      yield* E.say('@ The rain has stopped.', '@ The clouds have pulled apart, and behind them the sky is orange and gold. The sun is going down over the city.', '@haru:confused ...The sun? It was the middle of the night.', '@haru:happy ...It\'s pretty, though.');
      E.goal('Watch the sunset with Tama.', 'roof_sun');
    },
  };

  // sit on the bench with Tama and watch until it is morning
  function* sunset(E) {
    if (!dusk(E)) { yield* E.say('@ A wet bench by the railing.'); return; }
    if (E.flag('follower') !== 'tama') { yield* E.say('@haru It\'s too big to watch alone. ...Tama?'); return; }
    const ok = yield* E.yesno('@ A bench by the railing, facing the sunset. Sit down with Tama?');
    if (!ok) return;
    // Haru sits; Tama hops up beside him
    yield* E.walk({ x: 12, y: 9 });
    E.face('player', 'up');
    yield* E.walk([[0, -1]], 30);
    if (G.EX) G.EX.p.y = 9 * G.TS + 1; // on the seat, drawn in front of the bench
    E.pose('player', 'haru_sit_back');
    E.followerOut();
    yield* E.moveTo('follower', 13, 9, 50);
    yield* E.move('follower', [[0, -1]], 40);
    E.face('follower', 'up');
    E.sfx('meow');
    yield* E.wait(1.2);
    yield* E.say('@ Haru sits down. Tama jumps up beside him and leans on his arm.');
    yield* E.wait(1.0);
    if (E.flag('fin_unlocked')) yield* E.say('@ Far below, very faintly, a phone is ringing. Then it stops.');
    yield* E.say('@haru Mom says the sky is prettiest just before the night.', '@haru It\'s my birthday, Tama. I\'m ten today.');
    E.tune(BDAY, { wave: 'chime', slow: 1.6, vol: 0.5 });
    yield* E.wait(1.6);
    yield* E.say('@ Tama climbs into his lap and purrs. She is warm. Everything is warm.', '@haru (So sleepy...)');
    // the light grows until there is nothing but light
    for (let a = 0; a <= 1.001; a += 0.025) { E.tint('#fff2dc', a); yield* E.wait(0.07); }
    E.unset('fin_ringing');
    E.unset('follower');
    E.set('dream_white', 1);
    E.pose('player', 'haru_futon');
    yield* E.goto('home_morning', 2, 5, 'down', { sfx: null, fade: 0, checkpoint: false });
  }

  // ---------------- the morning: Haru's room, sunlight, Mom home ----------------
  G.MAPS.home_morning = {
    name: "Haru's Room (morning)", wall: 'cream', floor: { ',': 'tatami', '.': 'wood' },
    dark: 0, music: null, ambience: null, follower: false, vignette: 0.25,
    tint: (E) => (E.flag('dream_white') ? ['#fff2dc', E.flag('dream_white')] : ['#ffd8a0', 0.07]),
    lights: [{ x: 5, y: 3, r: 70, col: '#ffe0a0', glow: 0.4 }, { x: 5, y: 6, r: 50, col: '#ffe8c0', glow: 0.2 }],
    tiles: [
      '############',
      'WWWWWWWWWWWW',
      'WWWWWWWWWWWW',
      ',,,,,,,,,,,,',
      ',,,,,,,,,,,,',
      ',,,,,,,,,,,,',
      ',,,,,,,,,,,,',
      ',,,,,,,,,,,,',
      '#####.######',
    ],
    objects: [
      { id: 'window', x: 5, y: 2, z: 'wall', sprite: 'window_sunrise' },
      { id: 'closet', x: 8, y: 1, w: 2, h: 2, z: 'wall', sprite: 'oshiire' },
      { id: 'drawing', x: 1, y: 2, z: 'wall', sprite: 'drawing2' },
      { id: 'calendar', x: 10, y: 2, z: 'wall', sprite: 'calendar' },
      { id: 'desk', x: 5, y: 3, sprite: 'kids_desk' },
      { id: 'books', x: 10, y: 4, sprite: 'picture_book', z: 'floor', solid: false },
    ],
    first: function* (E) { yield* morning(E); },
  };

  function* morning(E) {
    // out of the white light, into the morning
    for (let a = 1; a >= 0; a -= 0.02) { E.set('dream_white', Math.max(0, a)); yield* E.wait(0.05); }
    E.unset('dream_white');
    yield* E.wait(0.8);
    E.sfx('chirp'); yield* E.wait(0.5); E.sfx('chirp');
    yield* E.wait(1.0);
    yield* E.say('@ Sunlight on the tatami. Birds on the balcony rail. The smell of rice.');
    yield* E.wait(0.6);
    for (let i = 0; i < 4; i++) { E.sfx('step'); yield* E.wait(0.35); }
    E.sfx('door');
    E.spawn({ id: 'mom', char: 'mom_memory', x: 5, y: 7, dir: 'up' });
    yield* E.moveTo('mom', 3, 5, 38);
    E.face('mom', 'left');
    yield* E.wait(0.6);
    yield* E.say('@mama Haru. Haru-chan.', '@mama:happy Wake up, sleepyhead.');
    yield* E.wait(0.5);
    E.pose('player', 'haru_futon_sit');
    yield* E.bubble('player', '!', 0.8);
    yield* E.say('@haru:shock ...Mom?', '@mama:happy Who else? I\'m home, silly. I promised, didn\'t I?');
    yield* E.say('@haru:scared There was a man with keys... and the building was all wrong, and the stairs went down forever, and you weren\'t there, and...');
    yield* E.say('@mama:kind Shh. Shh. Just a bad dream.');
    // the hug
    E.face('mom', 'left');
    E.sfx('closet');
    yield* E.picture('pic_birthday_hug', { caption: 'She smells like soap, and rain, and the hospital. She holds on for a long time.' });
    yield* E.bubble('mom', 'heart', 1.0);
    yield* E.say('@mama:happy Happy birthday, Haru. Ten years old!', '@mama:happy Come on now. Everyone is waiting for you.', '@mama:happy Go and blow out the candles, before they melt all over the cake.');
    yield* E.wait(0.6);
    yield* E.say('@haru:happy Mom?', '@mama Hm?');
    yield* E.wait(0.4);
    yield* E.say('@haru:happy I love you, Mom.');
    yield* E.wait(0.5);
    yield* E.say('@mama:crying ...I love you too, sweetheart. So much.', '@mama:happy Now go! Shoo!');
    // he gets up and runs out to the party
    E.spawn({ id: 'futon', x: 2, y: 4, h: 2, sprite: 'haru_futon_empty', z: 'floor', solid: false });
    E.pose('player', null);
    yield* E.walk([[0, 1]], 70);
    E.face('mom', 'down');
    E.tune(BDAY, { wave: 'piano', slow: 1.2, vol: 0.6 });
    yield* E.walk([[3, 0], [0, 2]], 90);
    yield* E.fadeOut(1.4);
    yield* credits(E);
    yield* E.ending('happy_birthday');
  }

  // ---------------- credits: they roll up over a birthday cake ----------------
  const CREDITS = [
    ['NOBODY HOME', 'title'], '', '',
    ['- cast -', 'head'], '',
    'Haru Aoki, ten years old today', 'Fumiko Aoki, his mother', 'Tama, a grey cat', '',
    'Mrs. Ota, 401', 'Mr. Kuroda, 302', 'Shota, who lost his cap', 'Yui', '',
    'and Mr. Sato,', 'who works the night shift', '', '',
    ['- inspired by -', 'head'], '',
    'Ao Oni   Mad Father   Ib', 'and every game made in RPG Maker', 'in somebody\'s bedroom, late at night', '', '',
    ['Thank you for playing.', 'head'], '', '', '', '',
    ['Happy birthday, Haru.', 'end'],
  ];
  function* credits(E) {
    let done = false;
    const W = G.W, H = G.H, LH = 14;
    const total = CREDITS.length * LH;
    G.UI.push({
      t: 0, y: H + 10, hold: 0,
      update(dt, inp) {
        this.t += dt;
        const endY = H / 2 - (CREDITS.length - 1) * LH;
        if (this.y > endY) this.y = Math.max(endY, this.y - dt * (inp.ok || G.held.ok ? 60 : 16));
        else { this.hold += dt; if (this.hold > 3 || (this.hold > 0.8 && inp.ok)) { G.UI.pop(); done = true; } }
      },
      draw(ctx) {
        ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, W, H);
        // the cake with ten candles, glowing at the top while the names go by
        const k = Math.min(1, this.t / 2);
        ctx.globalAlpha = k * Math.max(0, Math.min(1, (this.y + total - 40) / 120));
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(W / 2, 58); ctx.scale(2, 2);
        G.drawSprite(ctx, 'birthday_cake', 0, 0, this.t, false, 1);
        ctx.restore();
        ctx.globalAlpha = 1;
        CREDITS.forEach((ln, i) => {
          const y = Math.round(this.y + i * LH);
          if (y < -10 || y > H + 10) return;
          const [txt, kind] = Array.isArray(ln) ? ln : [ln, 'line'];
          if (!txt) return;
          const fade = Math.max(0, Math.min(1, (y - 70) / 30, (H - y) / 20));
          ctx.globalAlpha = kind === 'end' ? 1 : fade;
          if (kind === 'title') G.text(ctx, txt, W / 2, y, { align: 'center', scale: 2, color: '#e8e0f0', shadow: '#2a0a18' });
          else if (kind === 'head') G.text(ctx, txt, W / 2, y, { align: 'center', color: '#f0c890', shadow: '#000' });
          else if (kind === 'end') G.text(ctx, txt, W / 2, y, { align: 'center', scale: 2, color: '#ffd8a0', shadow: '#3a1a08' });
          else G.text(ctx, txt, W / 2, y, { align: 'center', color: '#b8b0c8', shadow: '#000' });
          ctx.globalAlpha = 1;
        });
      },
    });
    while (!done) yield;
  }

  // the route the tests play: from the lobby with Tama, up to the roof, to the end
  G.WALKTHROUGH = G.WALKTHROUGH || {};
  G.WALKTHROUGH.ending_dream = [
    { start: { map: 'lobby', x: 'from_stair1', items: ['flashlight', 'front_key', 'wire_cutters'], flags: { stairsOpen: true, chase4_done: true, ch3_done: true, '@visited:lobby': true, tama_saved: true, follower: 'tama', fin_unlocked: true } } },
    { door: 'door_stair1' }, { door: 'up' }, { door: 'up' }, { door: 'up' }, { expect: { map: 'stair4' } },
    { use: 'up', choose: [0] }, { expect: { map: 'roof', flags: ['roof_dusk', 'roof_open'] } },
    { use: 'bench', choose: [0] }, { expect: { ending: 'happy_birthday' } },
  ];
})(window.G);
