// NOBODY HOME: Chapter 3a, the second floor. See docs/design.md.
(function (G) {
  'use strict';

  // ======================================================================
  // ITEMS AND DOCUMENTS
  // ======================================================================
  Object.assign(G.ITEMS, {
    gate_key: { name: 'Yard Key', desc: 'A small key on a paper tag: YARD. It was stuck in a slice of cake like a candle.', icon: 'icon_gate_key' },
    hatch_key: { name: 'Hatch Key', desc: 'A key on a wooden tag: AOKI - BALCONY HATCH. Our family\'s key.', icon: 'icon_hatch_key' },
    birthday_card: {
      name: 'Birthday Card', note: true, icon: 'icon_note', desc: 'From the party in 201.',
      pages: ['Happy birthday, December friends!\n\nHouse rule: ELDERS BLOW FIRST!\n\nLove,\n- the staff'],
    },
    letter_3: {
      name: 'Letter from Mom (3)', note: true, icon: 'icon_letter', desc: 'On the table in 203.',
      pages: ["October 1975.\n\nSunday you marry Michiko. I ironed your shirt three times.\n\nYour father would have cried, so I'll cry for both of us.\n\n- Mom"],
    },
  });

  // ======================================================================
  // HINTS
  // ======================================================================
  Object.assign(G.HINTS, {
    c3_main: function (E) {
      if (!E.flag('c3_slipped')) { E.set('c3_slipped'); return ['@mom Haru? You\'re on the second floor? Be careful, Da--', '@mom ...Be careful, Haru.']; }
      if (!E.has('hatch_key') && !E.flag('hatchOpen')) {
        if (!E.flag('c3_memory')) return [['@mom You need to get to the ground floor. The stairs are no good?'], ['@mom Every balcony has a fire-escape hatch, Haru. Our family had a key.'], ['@mom Look in our old flat. Our name is on the door.']];
        return [['@mom Look in our old closet, sweetheart.']];
      }
      if (!E.flag('hatchOpen')) return [['@mom The balcony hatch. The empty flat, 202, has a balcony.']];
      return [['@mom Go down the ladder, Haru. Carefully.']];
    },
    c3_party: [['@mom A party? Then there\'s a card. There\'s always a card.'], ['@mom Look at the photos on the wall. Everybody has a year.'], ['@mom Elders first, Haru. The oldest one blows first.']],
    c3_memory: [['@mom Our old flat? ...What did I write on the fridge that night?'], ['@mom Read my note again, Haru. It\'s in your notes. In order.']],
  });

  // ======================================================================
  // CHASE 2 (armed by the lift in chapter 2)
  // ======================================================================
  G.CHASES.c2 = {
    char: 'caretaker', at: [8, 3], speed: 54, delay: 1.2, follow: true, followDelay: 2.2, timer: 16, loseAfterHide: 6,
    safe: ['a201', 'a203'], cause: 'caretaker', retry: { delay: 1.6 },
    onEnd: function* (E) {
      E.set('chase2_done');
      E.set('metaTitle');
      yield* E.wait(1.0);
      E.chapter('Chapter 3: The Second Floor', 'Ch.3 2F');
      E.goal('Get to the ground floor.', 'c3_main');
    },
  };
  const hunted = function* (E) {
    if (E.chasing()) { E.sfx('locked'); yield* E.say('@ Locked. From inside, muffled: slow singing.'); return false; }
    return true;
  };

  // ======================================================================
  // MAPS
  // ======================================================================
  G.MAPS.c2 = {
    name: 'Second Floor', location: 'Hinata Heights - 2F', wall: 'danchi', floor: { '.': 'corridor' },
    dark: 0.8, rain: 'rail', ambience: 'rain', floorSound: 'water',
    lights: [{ x: 2, y: 2, r: 34, col: '#40ff80', glow: 0.25 }],
    entries: { from_lift: [9, 3, 'down'], from_stair2: [2, 3, 'down'], from_201: [14, 3, 'down'], from_202: [20, 3, 'down'], from_203: [26, 3, 'down'] },
    tiles: [
      '####################################',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      '....................................',
      '....................................',
      '....................................',
      'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    ],
    objects: [
      { id: 'door_stairs', x: 2, y: 1, h: 2, z: 'wall', sprite: 'door_stairs', latch: true, door: { to: 'stair2', entry: 'from_c2', dir: 'down' } },
      G.nightlightObj(4, 2, 'nightlight'),
      { id: 'lift', x: 8, y: 1, w: 2, h: 2, z: 'wall', sprite: 'elevator_open', text: ['@ The lift is jammed between floors. The car is dark. Nobody inside. ...Nobody.'] },
      G.aptDoor('201', 14, 1, 'a201', null, null, { door: { to: 'a201', entry: 'from_c2', dir: 'down' }, before: hunted }),
      { id: 'win201', x: 15, y: 2, z: 'wall', sprite: 'window_frosted', text: (E) => (E.flag('c3_party') ? ['@ 201\'s window. Dark and quiet now.'] : ['@ 201\'s window. Candlelight behind the glass. Shapes standing very still.']) },
      { id: 'puddle1', x: 11, y: 4, sprite: 'puddle', z: 'floor', solid: false },
      { id: 'puddle2', x: 23, y: 5, sprite: 'puddle', z: 'floor', solid: false },
      G.aptDoor('202', 20, 1, 'a202', null, null, { door: { to: 'a202', entry: 'from_c2', dir: 'down' } }),
      { id: 'win202', x: 21, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ 202. UNDER REPAIR - KEEP OUT. The glass is taped.'] },
      G.aptDoor('203', 26, 1, 'a203', null, null, { door: { to: 'a203', entry: 'from_c2', dir: 'down' }, before: function* (E) {
        if (E.chasing()) { E.sfx('locked'); yield* E.say('@ Locked.', "@haru:confused ...AOKI? That's our name?"); return false; }
        return true;
      } }),
      { id: 'plate203', x: 27, y: 2, z: 'wall', sprite: 'nameplate_enamel', text: ['@ An old white enamel nameplate, chipped at the corner: AOKI.', "@haru That's our nameplate. ...We live on the fourth floor. Don't we?"] },
      { id: 'umbrella', x: 31, y: 3, sprite: 'umbrella_stand', text: ['@ Umbrellas, dripping. One is a small yellow one like mine.'] },
      { id: 'bike', x: 33, y: 3, w: 2, sprite: 'bicycle', text: ['@ A child\'s bicycle with training wheels, rusted to the railing.'] },
    ],
    enter: function* (E) {
      if (E.flag('chase2_armed') && !E.flag('chase2_done') && !E.chasing()) {
        // stumbling out of the lift: a few steps of head start, then he comes out after Haru
        if (E.tile()[0] === 9 && E.tile()[1] === 3) {
          E.sfx('splash');
          yield* E.walk([[0, 1], [3, 0]], 70);
          yield* E.say('@ Ankle-deep water. Haru\'s slippers are soaked.', '@haru:scared Run. RUN.');
        }
        E.sfx('ding');
        E.chase('c2');
      }
    },
    update(E, dt) {
      const s = this._s || (this._s = { t: 8, sing: 3 });
      s.t -= dt;
      if (s.t <= 0 && !G.EV.busy) { s.t = 22 + (s.t * 0) + 6 * Math.random(); E.flash('#c8c8e8', 0.25); E.sfx('thunder'); }
      // 2F sound landmark: a slow, warped birthday song behind 201 (silent once it's solved)
      s.sing -= dt;
      if (s.sing <= 0 && !E.flag('c3_party') && !E.chasing() && !G.Chase.walkers.length) { s.sing = 16; E.tune(BDAY, { wave: 'hum', slow: 1.8, detune: 30, vol: 0.35 }); E.sfx('record'); }
    },
  };
  const BDAY = [['G4', 0.3], ['G4', 0.15], ['A4', 0.45], ['G4', 0.45], ['C5', 0.45], ['B4', 0.9], ['G4', 0.3], ['G4', 0.15], ['A4', 0.45], ['G4', 0.45], ['D5', 0.45], ['C5', 0.9]];

  G.MAPS.stair2 = {
    name: 'Stairwell 2F', wall: 'concrete', floor: { '.': 'concrete' },
    dark: 0.6, ambience: 'wind',
    lights: [{ x: 5, y: 2, r: 40, col: '#40ff80', glow: 0.3 }],
    entries: { from_c2: [5, 3, 'down'], from_3f: [2, 5, 'down'], from_1f: [8, 5, 'down'] },
    tiles: [
      '##########',
      'WWWWWWWWWW',
      'WWWWWWWWWW',
      '..........',
      '..........',
      '..........',
      '..........',
      '##########',
    ],
    objects: [
      { id: 'door_c2', x: 5, y: 1, h: 2, z: 'wall', sprite: 'door_stairs', latch: true, door: { to: 'c2', entry: 'from_stair2', dir: 'down' } },
      { id: 'floorsign', x: 3, y: 1, w: 2, z: 'wall', sprite: 'sign_floor_2f' },
      { id: 'sign_up', x: 1, y: 2, w: 2, z: 'wall', sprite: 'sign_up_3f' },
      { id: 'up_block', x: 1, y: 3, w: 2, sprite: 'barricade', cond: (E) => !E.flag('stairsOpen'), text: ['@ Chair legs. Table legs. The whole pile from upstairs, jammed into the stairs going up.'] },
      { id: 'up', x: 1, y: 3, w: 2, sprite: 'stairs_up', touch: true, solid: false, stairs: true, cond: (E) => !!E.flag('stairsOpen'), door: { to: 'stair3', entry: 'from_2f', dir: 'down', walk: true } },
      { id: 'sign_down', x: 7, y: 2, w: 2, z: 'wall', sprite: 'sign_down_1f' },
      { id: 'down', x: 7, y: 3, w: 2, h: 2, sprite: 'stairs_down2', z: 'floor', touch: true, solid: false, stairs: true,
        lock: (E) => !!E.flag('stairsOpen'), lockText: ['@ At the bottom of the stairs, the door to the ground floor is locked. From the other side.', "@haru There's a lobby down there. I can almost smell the rain."],
        door: { to: 'stair1', entry: 'from_2f', dir: 'down', walk: true } },
      { id: 'under', x: 9, y: 6, sprite: 'boxes_stack', hide: true, hidePrompt: '@ A dark space behind some boxes in the corner. Squeeze in and hide?' },
    ],
  };

  // ---------------- 201: the party ----------------
  const ORDER = ['KIYO', 'SHIN', 'SHOTA', 'HARU'];
  const candle = (name, x) => ({
    id: 'candle_' + name.toLowerCase(), x: x, y: 8, sprite: (E) => (E.count('c3_blown') > ORDER.indexOf(name) ? 'cake_candle_out' : 'cake_candle'),
    light: { r: 22, col: '#ffb040', glow: 0.35, flicker: true }, cond: (E) => !E.flag('c3_party'),
    on: function* (E) {
      const ok = yield* E.yesno('@ A tall candle with a folded name card: ' + name + '. Blow it out?');
      if (!ok) return;
      const n = E.count('c3_blown');
      if (ORDER[n] === name) {
        E.set('c3_blown', n + 1);
        E.sfx('whoosh');
        if (n + 1 < ORDER.length) { yield* E.say('@ Phhh. The ' + name + ' candle goes out. The singing goes on, slower.'); return; }
        yield* partyDone(E);
        return;
      }
      // wrong: the singing stops, every candle relights, and they come closer in the dark
      E.sfx('whoosh');
      yield* E.say('@ Phhh. The ' + name + ' candle goes out...', '@ The singing stops.');
      E.set('c3_blown', 0);
      yield* E.creep(['staff1', 'staff2', 'staff3'], { steps: 1, cause: 'guests', time: 0.7 });
      yield* E.say('@ The lights flicker back. Every candle is burning again.', '@ The guests are standing closer.');
      E.inc('c3_mistakes');
    },
  });
  function* partyDone(E) {
    E.set('c3_party');
    yield* E.say('@ The last candle goes out. The singing stops.');
    yield* E.wait(0.8);
    yield* E.say('@ On a paper plate: one slice of cake. HARU, in pink icing.', '@ And stuck in the icing like a candle, a small key on a tag: YARD.');
    yield* E.give('gate_key');
    yield* E.say('@haru:sad Someone had a party for me. ...I don\'t remember it.');
    for (const id of ['staff1', 'staff2', 'staff3']) E.face(id, 'down');
    E.sfx('sting', 0.4);
    yield* E.say('@ All three guests turn their heads to Haru at the same moment. And stay like that.', '@haru:scared ...Thank you for the cake. Excuse me.');
  }
  G.MAPS.a201 = {
    name: '201 - The Party', wall: 'pink', floor: { ';': 'genkan', ',': 'tatami', '.': 'wood' },
    dark: (E) => (E.flag('c3_party') ? 0.88 : 0.5 + 0.08 * E.count('c3_blown')), ambience: 'hum',
    entries: { from_c2: [1, 3, 'down'] },
    tiles: [
      '################',
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
      ';;..............',
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '################',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c2', entry: 'from_201', dir: 'down' } },
      { id: 'banner', x: 5, y: 1, w: 3, z: 'wall', sprite: 'streamers', text: ['@ A hand-made banner: HAPPY BIRTHDAY, DECEMBER FRIENDS!', '@ Paper chains. Balloons going soft.'] },
      { id: 'photos', x: 11, y: 2, w: 2, z: 'wall', sprite: 'family_photos',
        on: function* (E) {
          yield* E.picture('pic_family_photos', { caption: 'KIYO 1929   SHIN 1934   SHOTA 1947   HARU 1948' });
          yield* E.say('@ Four childhood photos, each with a name and a year: KIYO 1929. SHIN 1934. SHOTA 1947. HARU 1948.', '@haru:confused That\'s me. In the last one. ...1948? That\'s the year I was born.');
          E.goal('Blow out the birthday candles.', 'c3_party');
        } },
      { id: 'table', x: 6, y: 5, w: 3, h: 2, sprite: 'party_table',
        text: (E) => (E.flag('c3_party') ? ['@ An empty paper plate where the HARU slice was.'] : ['@ A long table with a white cloth. A big cake with pink letters: HARU.', '@ Paper plates for everybody. Nobody has eaten.']) },
      { id: 'card', x: 10, y: 7, sprite: 'birthday_card', z: 'floor', solid: false,
        on: function* (E) {
          if (!E.has('birthday_card')) yield* E.give('birthday_card', { silent: true });
          yield* E.note('birthday_card');
          yield* E.say('@haru Elders first. The oldest one blows first.');
          E.goal('Blow out the birthday candles.', 'c3_party');
        } },
      candle('KIYO', 5), candle('SHOTA', 6), candle('HARU', 7), candle('SHIN', 8),
      { id: 'chair1', x: 7, y: 3, sprite: 'chair' },
      { id: 'chair2', x: 12, y: 4, sprite: 'chair' },
      { id: 'chair3', x: 13, y: 7, sprite: 'chair' },
      { id: 'staff1', x: 7, y: 4, char: 'staff1', dir: 'down', text: ['@ A very tall guest in a paper party hat and a white mask. Swaying, singing, very slowly.'] },
      { id: 'staff2', x: 12, y: 3, char: 'staff2', dir: 'left', text: ['@ A tall guest in an apron and a paper hat. The mask moves where the mouth is. Singing.'] },
      { id: 'staff3', x: 14, y: 7, char: 'staff3', dir: 'left', text: ['@ A guest in a cardigan and a paper hat, so tall the hat brushes the ceiling.'] },
    ],
    first: function* (E) {
      yield* E.say('@ A birthday party. Three very tall guests in paper hats and white masks stand around the table, singing.', '@ Very... slowly.', '@haru:scared (Don\'t look at their faces. Don\'t look at their faces.)');
      E.goal('Blow out the birthday candles.', 'c3_party');
    },
    enter: function* (E) {
      // every entry: the guests are back at their places (positions saved in the retry point)
      E.set('c3_blown', 0);
    },
    update(E, dt) {
      const s = this._s || (this._s = { t: 1 });
      s.t -= dt;
      if (s.t <= 0 && !E.flag('c3_party') && !G.EV.busy) { s.t = 14; E.tune(BDAY, { wave: 'hum', slow: 2.2, detune: 20, vol: 0.8 }); }
    },
  };

  // ---------------- 202: renovation, balcony hatch ----------------
  G.MAPS.a202 = {
    name: '202', wall: 'concrete', floor: { ';': 'genkan', '.': 'concrete' },
    dark: 0.7, ambience: 'wind', rain: 'rail',
    entries: { from_c2: [1, 3, 'down'], from_office: [10, 6, 'up'] },
    tiles: [
      '##############',
      'WWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWW',
      ';;............',
      '..............',
      '..............',
      '..............',
      '..............',
      'RRRRRRRRRRRRRR',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c2', entry: 'from_202', dir: 'down' } },
      { id: 'radiator', x: 4, y: 3, sprite: 'radiator', text: ['@ An old radiator, cold.'] },
      { id: 'cans', x: 6, y: 3, sprite: 'barrel', text: ['@ Paint cans. CREAM. CREAM. CREAM.'] },
      { id: 'ladder', x: 2, y: 6, sprite: 'crate', text: ['@ Tools and a stepladder. UNDER REPAIR.'] },
      { id: 'tarp', x: 10, y: 3, w: 2, sprite: 'tarp_bags', hide: true, hideSprite: 'tarp_bags_hide', hidePrompt: '@ Stacked tatami under a grey tarp. Crawl under and hide?' },
      { id: 'hatch', x: 11, y: 6, w: 2, h: 2, z: 'floor', solid: false, sprite: (E) => (E.flag('hatchOpen') ? 'escape_hatch_open' : 'escape_hatch'),
        on: function* (E) {
          if (E.flag('hatchOpen')) {
            const ok = yield* E.yesno('@ The ladder goes down to the floor below. Climb down?');
            if (ok) yield* E.goto('office', 'from_hatch', null, 'down', { sfx: 'stairs' });
            return;
          }
          yield* E.say("@ A steel fire-escape hatch in the balcony floor. Every balcony has one.", '@ IN EMERGENCY, OPEN WITH YOUR HOUSEHOLD KEY.');
          if (!E.has('hatch_key')) { E.goal('Get to the ground floor.', 'c3_main'); return; }
          E.sfx('unlock');
          yield* E.say('@ The AOKI key turns. The lid swings up. A folding ladder rattles down into the dark.');
          E.set('hatchOpen'); E.set('ch3a_done');
        } },
    ],
    enter: function* (E) {
      // the latch lesson: chased in here for the first time
      const ch = G.Chase.active;
      if (!ch || !ch.away || E.flag('c3_latchTaught')) return;
      E.set('c3_latchTaught');
      const i = yield* E.ask('@haru:scared A chain! Latch it!', ['Latch it', 'Keep running']);
      if (i !== 0) return;
      const door = E.obj('exit');
      if (door) G.S.flags[door.key('latched')] = true;
      G.Chase.latch(6);
      yield* E.say('@ The chain rattles into place.');
      E.sfx('door'); E.shake(2, 0.3);
      yield* E.say('@ The door opens a hand\'s width and stops against the chain.', '@ A long grey hand slides in, feeling for the chain.');
      for (let k = 0; k < 3; k++) { E.sfx('unlock'); yield* E.wait(0.5); }
      yield* E.scare('caretaker_gap');
      yield* E.say('@haru:scared (Hide. HIDE.)');
    },
  };

  // ---------------- 203: AOKI, 1958 ----------------
  const NOTE_LINES = ["I'll be home before midnight.", 'Lock the door.', "Don't open it for anyone.", "Dinner's in the fridge."];
  G.MAPS.a203 = {
    name: '203 - Aoki', wall: 'cream', floor: { ';': 'genkan', '-': 'linoleum', ',': 'tatami' },
    dark: 0.15, music: 'sad', ambience: 'hum', follower: false,
    lights: [{ x: 7, y: 5, r: 90, col: '#ffe0b0', glow: 0.25 }],
    entries: { from_c2: [1, 3, 'down'] },
    tiles: [
      '##############',
      'WWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWW',
      ';;;-----,,,,,,',
      ';;;-----,,,,,,',
      '...-----,,,,,,',
      '...,,,,,,,,,,,',
      '...,,,,,,,,,,,',
      '...,,,,,,,,,,,',
      '##############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', door: { to: 'c2', entry: 'from_203', dir: 'down' } },
      { id: 'mirror', x: 2, y: 2, z: 'wall', sprite: 'mirror',
        on: function* (E) {
          if (!E.flag('c3_mirror')) {
            E.set('c3_mirror');
            E.music(null);
            yield* E.picture('pic_mirror_old');
            yield* E.say('@ Haru raises his hand. The reflection raises its hand a beat late, touches the glass, and mouths: Mom?');
            yield* E.wait(1.0);
            yield* E.say("@haru:shock ...That's not me. That's not me.");
            E.music('sad');
            return;
          }
          yield* E.say('@ The mirror. Haru, ten years old. He doesn\'t look for long.');
        } },
      { id: 'fridge', x: 4, y: 3, sprite: 'fridge_small',
        text: ['@ A note on the fridge, the same as ours. It\'s been rained on: the ink has run.', '@ Only the first and last lines can be read: "Dinner\'s in the fridge." ... "...before midnight. Promise."'] },
      { id: 'counter', x: 6, y: 3, w: 2, sprite: 'counter', text: ['@ The counter. Rice in the cooker, still warm. A cake box from the bakery by the station, tied with string.'] },
      { id: 'mom', x: 6, y: 4, char: 'mom_memory', dir: 'up', alpha: 0.6, cond: (E) => !E.flag('c3_memory'),
        on: function* (E) {
          if (!E.flag('c3_metMom')) {
            E.set('c3_metMom');
            yield* E.say('@haru:shock Mom? ...Mom!', '@ She doesn\'t turn around. In her nurse\'s cardigan, she writes a note at the counter, crosses something out, starts again.', '@ She writes, and writes, and never finishes.', '@haru:sad (What did she write that night? ...If I remember it right, maybe she\'ll hear me.)');
            E.goal('Remember what Mom wrote that night.', 'c3_memory');
          }
          const r = yield* E.order({ title: 'What did Mom write?', items: NOTE_LINES });
          if (!r) return;
          if (r.join(',') !== '3,1,2,0') { yield* E.say('@ She keeps writing. She doesn\'t look up.'); return; }
          E.set('c3_memory');
          E.face('mom', 'down');
          yield* E.wait(0.6);
          yield* E.say("@ She stops writing. She turns, and almost looks at him.", "@mom I'll be home before midnight. I promise.", '@mom ...Happy birthday, Haru.');
          yield* E.fadeOut(0.6);
          E.set('c3_momGone');
          yield* E.fadeIn(1.0);
          yield* E.say('@ She\'s gone. On the low table, an envelope. And the closet door has slid open.');
          E.goal('Get to the ground floor.', 'c3_main');
        } },
      { id: 'kotatsu', x: 9, y: 5, w: 2, h: 2, sprite: 'kotatsu_on', light: { r: 26, col: '#ff7040', glow: 0.25 }, text: ['@ The kotatsu is warm. Somebody just got out of it.'] },
      { id: 'letter', x: 11, y: 7, sprite: 'sparkle', z: 'floor', solid: false, cond: (E) => !!E.flag('c3_memory') && !E.notesCount('letter_3', 'found'),
        on: function* (E) {
          yield* E.give('letter_3', { silent: true });
          yield* E.note('letter_3');
          yield* E.say('@haru:annoyed Married? ...Gross.', '@haru:confused ...Why is this Mom\'s writing?');
        } },
      { id: 'closet', x: 11, y: 1, w: 2, h: 2, z: 'wall', sprite: (E) => (E.flag('c3_memory') ? 'fusuma_open' : 'fusuma'),
        on: function* (E) {
          if (!E.flag('c3_memory')) { yield* E.say('@ The closet. It won\'t open. Like it\'s waiting for something.'); return; }
          if (!E.has('hatch_key') && !E.flag('hatchOpen')) {
            yield* E.say('@ Futons, a sewing box, Dad\'s old toolbox. On a hook inside the door: a key on a wooden tag.');
            yield* E.give('hatch_key');
            yield* E.say('@haru AOKI - BALCONY HATCH. Mom showed me once. "Only in an emergency."', '@haru:determined This is an emergency.');
            return;
          }
          yield* E.say('@ Futons. Mom\'s sewing box. It smells like home.');
        } },
      { id: 'radio', x: 13, y: 3, sprite: 'table_small', text: ['@ A radio, playing very quietly. A baseball game from 1958. The Giants are winning.'] },
      { id: 'butsudan', x: 8, y: 3, sprite: 'butsudan', text: ['@ Dad\'s photo. The candles are lit here.'] },
    ],
    first: function* (E) {
      yield* E.say('@ Warm air. Light. The smell of rice and soy sauce.', '@haru:confused This is... our flat. Our real flat.', '@ Tama won\'t come in. She sits in the doorway, very still.');
    },
  };

  // ======================================================================
  // TEST ROUTE
  // ======================================================================
  G.WALKTHROUGH = G.WALKTHROUGH || {};
  G.WALKTHROUGH.ch3 = [
    { start: { map: 'c2', x: 'from_lift', items: ['flashlight', 'photo_1977', 'fishing_rod'], flags: { follower: 'tama', ch2_done: true, chase2_armed: true, reached3F: true, c2_kuroda: true, c2_shota: true, ota_tea: true }, notes: ['note_fridge', 'letter_1', 'letter_2'] } },
    { escape: ['door_202', { hide: 'tarp' }], latch: true },
    { expect: { flags: ['chase2_done', 'c3_latchTaught'], goal: 'c3_main' } },
    { door: 'exit' },
    { door: 'door_201' },
    { use: 'photos' },
    { use: 'card' },
    { use: 'candle_kiyo', choose: [0] },
    { use: 'candle_haru', choose: [0] },
    { expect: { flags: ['c3_mistakes'] } },
    { use: 'candle_kiyo', choose: [0] },
    { use: 'candle_shin', choose: [0] },
    { use: 'candle_shota', choose: [0] },
    { use: 'candle_haru', choose: [0] },
    { expect: { has: ['gate_key'], flags: ['c3_party'] } },
    { door: 'exit' },
    { door: 'door_203' },
    { use: 'mirror' },
    { use: 'mom' },
    { answer: [3, 1, 2, 0] },
    { use: 'letter' },
    { use: 'closet' },
    { expect: { has: ['hatch_key'], flags: ['c3_memory'], notes: 3 } },
    { door: 'exit' },
    { door: 'door_202' },
    { use: 'hatch' },
    { use: 'hatch', choose: [0] },
    { expect: { map: 'office', flags: ['hatchOpen', 'ch3a_done'] } },
  ];
})(window.G);
