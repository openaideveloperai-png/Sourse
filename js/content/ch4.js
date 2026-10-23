// NOBODY HOME: Chapter 4, the basement. See docs/design.md.
(function (G) {
  'use strict';
  const TS = G.TS;

  // ======================================================================
  // ITEMS AND DOCUMENTS
  // ======================================================================
  Object.assign(G.ITEMS, {
    pressure_chart: {
      name: 'Pressure Chart', note: true, icon: 'icon_pressure_chart', desc: 'Pinned up in the management cage.',
      pages: ['WINTER SETTINGS\n\nHOT WATER  -  high\nHEATING    -  low, or she shakes\nLAUNDRY    -  mid\n\n- K.'],
    },
    front_key: { name: 'Front Door Key', desc: 'A big key on a tag: FRONT. From the lock box on the key board.', icon: 'icon_front_key' },
    night_log: {
      name: 'Rounds Sheet', note: true, icon: 'icon_note', desc: 'A clipboard on a nail in the staff room.',
      pages: ["ROUNDS - NIGHT OF 9 DEC\n\n23:58  404 up again (bed mat). Asking for his mother.\n00:10  Called daughter - coming AM.\n00:20  404 at the front door.\n01:05  404 at the front door AGAIN.\n\nChanged the box code to his room number. - S."],
    },
    bento_note: {
      name: 'Folded Note', note: true, icon: 'icon_note', desc: 'Tucked under a bento box.',
      pages: ['Kenta -\neat something.\n\n- Mom'],
    },
    letter_5: {
      name: 'Letter from Mom (5)', note: true, icon: 'icon_letter', desc: 'In the memory box, in cage 404. The handwriting shakes.',
      pages: ["November 1989.\n\nI'm in the hospital now. Come in the mornings, not at night.\n\nThe night nurse here is a boy younger than you, and he always knocks first.\n\nWhen you're old and frightened, let them help you. Let someone come home to you.\n\n- Mom"],
    },
  });

  // ======================================================================
  // HINTS
  // ======================================================================
  Object.assign(G.HINTS, {
    c4_find: function (E) {
      if (!E.flag('c4_steamOff')) return [['@mom Downstairs? Oh, Haru. Stay in the light.'], ['@mom The staff room is past the boiler. That\'s where he keeps the keys. And your cat.'], ['@mom The steam is in the way? Somebody must have written down how the valves go.']];
      if (!E.has('front_key')) return [['@mom The staff room. The key board.'], ['@mom The one who keeps trying to leave... who could that be?'], ['@mom Read the rounds sheet, Haru. He changed the code to a room number.']];
      return [['@mom Go up to the lobby, Haru. The ground floor. Quickly.'], ['@mom The front doors in the lobby. Your key opens the chain.']];
    },
    c4_steam: [['@mom Steam? Someone must have written down how the valves go.'], ['@mom Hot water high, heating low, laundry in the middle. ...(far away) Is he all right? ...Yes, I\'m still here.'], ['@mom The pipes in the hall have painted bands. Which colour is which?']],
    c4_box: [['@mom The one who keeps trying to leave... who could that be?'], ['@mom Read the rounds sheet, Haru.'], ['@mom His room number, sweetheart. 404.']],
    c4_cage: [['@mom Our box is down there. Your birthday keeps it safe.'], ['@mom Month and day, Haru. December the ninth.']],
    c4_tama: [['@mom You wouldn\'t leave her down there, would you?'], ['@mom The staff room. The carrier is wired shut. Something to cut wire...']],
  });

  // ======================================================================
  // CHASES
  // ======================================================================
  G.CHASES.c4stalk = {
    char: 'caretaker', at: [1, 4], speed: 54, delay: 1.0, follow: true, followDelay: 1.8, timer: 12, loseAfterHide: 6, cause: 'caretaker', retry: { delay: 1.6 },
    onEnd: function* (E) { E.set('c4_stalkDone'); },
  };
  G.CHASES.c4 = {
    char: 'caretaker', at: [12, 3], speed: 58, delay: 1.2, follow: true, followDelay: 2.0, safe: ['lobby'], loseAfterHide: 6, cause: 'caretaker', retry: { delay: 1.6 },
    onEnd: function* (E) { E.set('chase4_done'); },
  };

  // B1 warning: the boiler's thrum is the floor's sound; it cuts out before every appearance
  const thrum = function (E, dt) {
    const s = this._s || (this._s = { t: 1 });
    s.t -= dt;
    if (s.t <= 0) { s.t = 2.6; if (!E.flag('c4_quiet') && !E.chasing()) E.sfx('rumble'); }
  };

  // ======================================================================
  // MAPS
  // ======================================================================
  G.MAPS.b1_hall = {
    name: 'Basement', location: 'Hinata Heights - B1', wall: 'concrete', floor: { '.': 'basement' },
    dark: 0.85, light: 64, ambience: 'basement', floorSound: 'water',
    lights: [{ x: 5, y: 3, r: 34, col: '#ffd890', glow: 0.25, flicker: true }, { x: 16, y: 3, r: 34, col: '#ffd890', glow: 0.25, flicker: true }],
    entries: { from_1f: [3, 4, 'right'], from_storage: [8, 3, 'down'], from_boiler: [20, 3, 'down'] },
    tiles: [
      '##############################',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      '..............................',
      '..............................',
      '..............................',
      '..............................',
      '##############################',
    ],
    objects: [
      { id: 'up', x: 1, y: 3, w: 2, sprite: 'stairs_up', touch: true, solid: false, stairs: true, door: { to: 'stair1', entry: 'from_b1', dir: 'down', walk: true } },
      { id: 'door_storage', x: 8, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'storage', entry: 'from_hall', dir: 'down' } },
      { id: 'pipe_hot', x: 11, y: 2, w: 2, z: 'wall', sprite: 'pipe_hot', text: ['@ A pipe with a RED band, stencilled: HOT WATER. It runs along the wall toward the boiler room.'] },
      { id: 'pipe_heat', x: 13, y: 2, w: 2, z: 'wall', sprite: 'pipe_heat', text: ['@ A pipe with a BLUE band: HEATING.'] },
      { id: 'pipe_laundry', x: 15, y: 2, w: 2, z: 'wall', sprite: 'pipe_laundry', text: ['@ A pipe with a GREY band: LAUNDRY.'] },
      { id: 'door_boiler', x: 20, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'boiler', entry: 'from_hall', dir: 'down' } },
      { id: 'door_staff', x: 26, y: 1, h: 2, z: 'wall', sprite: 'door_basement', text: ['@ A door marked STAFF. Locked. From the other side.', '@ Under the door: a thin line of warm light.'] },
      { id: 'boxes', x: 23, y: 6, sprite: 'boxes_stack', text: ['@ Boxes: CHRISTMAS DECORATIONS. RESIDENTS - LOST PROPERTY.'] },
      { id: 'mop', x: 28, y: 3, sprite: 'mop_bucket', text: ['@ A mop and bucket. The water is clean.'] },
    ],
    first: function* (E) {
      E.chapter('Chapter 4: The Basement', 'Ch.4 B1');
      yield* E.say('@ A low concrete corridor. Pipes along the walls. A deep thrum from somewhere: the boiler.', '@haru:determined Tama? ...TAMA?', '@ Only the thrum answers.');
      E.goal('Find Tama. Find the key board.', 'c4_find');
    },
    update: thrum,
  };

  // ---------------- storage cages ----------------
  const cage = (id, num, x, y, text, extra) => Object.assign({ id: id, x: x, y: y, w: 2, h: 2, sprite: 'storage_cage', text: ['@ Cage ' + num + '. ' + text] }, extra || {});
  G.MAPS.storage = {
    name: 'Storage', wall: 'concrete', floor: { '.': 'basement' },
    dark: 0.8, light: 64, ambience: 'basement',
    lights: [{ x: 9, y: 6, r: 40, col: '#ffd890', glow: 0.25, flicker: true }],
    entries: { from_hall: [1, 3, 'down'] },
    tiles: [
      '####################',
      'WWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWW',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '....................',
      '####################',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'b1_hall', entry: 'from_storage', dir: 'down' } },
      G.nightlightObj(3, 2, 'nightlight'),
      cage('cage_301', '301', 5, 3, 'A music stand. Boxes of sheet music. Locked.'),
      cage('cage_401', '401', 8, 3, 'A man\'s good shoes, polished. A train timetable from 1983. Locked.'),
      cage('cage_404', '404', 11, 3, '', {
        sprite: (E) => (E.flag('c4_cage404') ? 'storage_cage_open' : 'storage_cage'), text: null,
        on: function* (E) {
          if (E.flag('c4_cage404')) {
            if (!E.notesCount('letter_5', 'found')) { yield* boxScene(E); return; }
            yield* E.say('@ Haru\'s old box. The glove. The photo. Mom\'s last letter.');
            return;
          }
          yield* E.say('@ Cage 404. A cardboard box inside, labelled AOKI in Mom\'s handwriting.', '@ The padlock has four dials. A label: MONTH / DAY.');
          if (E.notesCount('letter_4')) yield* E.say('@haru Month and day... my birthday?');
          E.goal('Open cage 404.', 'c4_cage');
          const c = yield* E.code({ len: 4, title: 'Cage 404 - MONTH / DAY' });
          if (c === null) { E.goal('Find Tama. Find the key board.', 'c4_find'); return; }
          if (c === '0912') { E.sfx('locked'); yield* E.say('@ Click... no. Month first. Then day.'); return; }
          if (c !== '1209') { E.sfx('locked'); yield* E.say('@ The dials don\'t move.'); return; }
          E.set('c4_cage404'); E.sfx('unlock');
          yield* E.say('@ 12. 09. The padlock falls open.');
          yield* boxScene(E);
          E.goal('Find Tama. Find the key board.', 'c4_find');
        } }),
      cage('cage_kanri', 'KANRI (management)', 14, 3, '', {
        sprite: 'storage_cage_open', text: null,
        on: function* (E) {
          if (E.has('pressure_chart')) { yield* E.say('@ Tools. Fuses. A box of spare light bulbs.'); return; }
          yield* E.say('@ The management cage, open. Tools, fuses, and a chart pinned to the wire.');
          yield* E.give('pressure_chart', { silent: true });
          yield* E.picture('pic_pressure_chart');
          yield* E.note('pressure_chart');
          yield* E.say('@haru Hot water high. Heating low. Laundry mid.');
          yield* stalk(E);
        } }),
      cage('cage_302', '302', 5, 8, 'Baseball bats, a glove, a trophy: HINATA LITTLE LEAGUE 1959. Locked.'),
      cage('cage_304', '304', 14, 8, '', {
        sprite: 'storage_cage_open', text: null,
        on: function* (E, self) {
          yield* E.say('@ Cage 304. Empty, door open. A grey tarp in the corner, big enough to crawl under.');
          yield* E.hideIn(self);
        }, hidePrompt: '@ Crawl under the tarp and hide?' }),
      { id: 'boxes', x: 9, y: 8, sprite: 'boxes_stack', text: ['@ Boxes stacked to the ceiling. Names on every one. So many names.'] },
      { id: 'boxes2', x: 18, y: 5, sprite: 'boxes_stack', text: ['@ Boxes: 2F. 3F. 4F.'] },
    ],
    update: thrum,
  };
  function* boxScene(E) {
    yield* E.say('@ Inside the box: a baseball glove.', '@haru:happy My glove! ...It\'s so small.');
    yield* E.picture('pic_mom_photo', { caption: 'Fumiko and Haru, 1949' });
    yield* E.say('@ And an envelope, the handwriting all wobbly.');
    yield* E.give('letter_5', { silent: true });
    yield* E.note('letter_5');
    yield* E.say('@haru:sad Mom\'s writing is all shaky.');
  }
  // taking the chart: the thrum stops. Keys at the far door.
  function* stalk(E) {
    E.set('c4_quiet');
    yield* E.wait(1.0);
    yield* E.say('@ The thrum of the boiler stops.');
    E.sfx('keys');
    yield* E.say('@ Keys. At the door.');
    const i = yield* E.ask('@haru:scared (Hide!)', ['Hide under the tarp in cage 304', 'Stay still']);
    const ex = G.EX;
    if (i !== 0) {
      yield* E.say('@haru:scared (Don\'t move... don\'t move...)');
      E.unset('c4_quiet');
      E.chase('c4stalk');
      return;
    }
    yield* E.fadeOut(0.25);
    ex.p.x = 15 * TS + 8; ex.p.y = 9 * TS + 12; ex.p.dir = 'up';
    ex.p.hidden = true;
    E.sfx('closet');
    yield* E.fadeIn(0.25);
    yield* E.wait(0.6);
    E.sfx('door');
    E.spawn({ id: 'ct', char: 'caretaker', x: 1, y: 3, dir: 'down' });
    yield* E.moveTo('ct', 14, 7, 34);
    E.face('ct', 'down');
    E.sfx('keys'); E.shake(2, 0.3);
    yield* E.say('@ He stops at cage 304. He rattles the cage door with his keys.');
    for (let k = 0; k < 3; k++) { E.sfx('heartbeat', 0.7); yield* E.wait(0.9); }
    yield* E.say('@caretaker ...Mr. Aoki?');
    yield* E.wait(1.0);
    yield* E.moveTo('ct', 1, 3, 36);
    E.sfx('door');
    E.despawn('ct');
    yield* E.wait(0.8);
    E.unset('c4_quiet');
    E.sfx('rumble');
    yield* E.say('@ The thrum comes back.');
    ex.p.hidden = false;
    E.sfx('closet');
    E.set('c4_stalkDone');
    yield* E.say('@haru:scared (He has a voice like... a person.)');
  }

  // ---------------- boiler room (the steam) ----------------
  const VALVES = { red: 'High', blue: 'Low', grey: 'Mid' };
  const valve = (col, x) => ({
    id: 'valve_' + col, x: x, y: 2, z: 'wall', sprite: 'valve_' + col,
    on: function* (E) {
      if (E.flag('c4_steamOff')) { yield* E.say('@ The ' + col + ' valve. Set to ' + E.flag('c4_v_' + col) + '.'); return; }
      const opts = ['Low', 'Mid', 'High'];
      const i = yield* E.ask('@ A ' + col + ' valve wheel. Set it to...', opts);
      if (i === null || i === undefined || i < 0) return;
      E.set('c4_v_' + col, opts[i]);
      E.sfx('push');
      yield* E.say('@ Haru turns the ' + col + ' valve to ' + opts[i] + '.');
      if (!['red', 'blue', 'grey'].every((c) => E.flag('c4_v_' + c))) return;
      const wrong = ['red', 'blue', 'grey'].find((c) => E.flag('c4_v_' + c) !== VALVES[c]);
      if (wrong) {
        E.sfx('static'); E.shake(4, 0.5); E.flash('#ffffff', 0.3);
        yield* E.say('@ A blast of steam! Haru is shoved back.', '@ The ' + wrong + ' one rattles like it\'s going to burst.');
        yield* E.walk([[0, 1]], 90);
        return;
      }
      E.set('c4_steamOff');
      E.sfx('slide');
      yield* E.say('@ The pipes groan... and the steam dies down to a hiss, then nothing.', '@haru The way to that door is clear.');
      E.goal('Find Tama. Find the key board.', 'c4_find');
    },
  });
  const steam = (x, y) => ({ id: 'steam_' + x + '_' + y, x: x, y: y, sprite: 'steam', cond: (E) => !E.flag('c4_steamOff'),
    on: function* (E) { yield* E.say('@ Scalding steam pours out of a split pipe. I can\'t get past.'); E.goal('Stop the steam.', 'c4_steam'); } });
  G.MAPS.boiler = {
    name: 'Boiler Room', wall: 'concrete', floor: { '.': 'basement' },
    dark: 0.7, light: 64, ambience: 'basement',
    lights: [{ x: 9, y: 5, r: 50, col: '#ff9050', glow: 0.25, flicker: true }],
    entries: { from_hall: [1, 3, 'down'], from_keeper: [13, 4, 'down'] },
    tiles: [
      '################',
      'WWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWW',
      '................',
      '................',
      '................',
      '................',
      '................',
      '################',
    ],
    objects: [
      { id: 'door_hall', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'b1_hall', entry: 'from_boiler', dir: 'down' } },
      valve('red', 3), valve('blue', 5), valve('grey', 7),
      { id: 'pipes', x: 9, y: 2, w: 2, z: 'wall', sprite: 'pipes', text: ['@ Three pipes come in from the hall: a red band, a blue band, a grey band. Each one ends at a valve.'] },
      { id: 'boiler', x: 7, y: 5, w: 3, h: 2, sprite: 'boiler', text: ['@ The boiler. It thrums like a sleeping animal.'] },
      { id: 'door_keeper', x: 13, y: 1, h: 2, z: 'wall', sprite: 'door_basement', latch: true, lock: 'keeper_key',
        lockText: ['@ A heavy door with a padlock: CARETAKER.'], unlockText: '@ The CARETAKER key turns.',
        door: { to: 'keeper', entry: 'from_boiler', dir: 'down' } },
      steam(12, 3), steam(13, 3), steam(14, 3), steam(12, 4), steam(14, 4), steam(13, 5),
      { id: 'tub', x: 2, y: 6, w: 2, sprite: 'bath_tub', text: ['@ A big tub with handrails, in the corner of a boiler room. A towel folded on the edge.', '@haru:confused Why is there a bath down here?'] },
    ],
    first: function* (E) {
      yield* E.say('@ Heat. Steam everywhere, pouring out around a heavy door.');
      E.goal('Stop the steam.', 'c4_steam');
    },
    update: thrum,
  };

  // ---------------- the Caretaker's room (the staff room) ----------------
  G.MAPS.keeper = {
    name: "Caretaker's Room", wall: 'plaster', floor: { '.': 'linoleum' },
    dark: 0.7, ambience: 'hum',
    lights: [{ x: 5, y: 4, r: 54, col: '#ffd890', glow: 0.3 }],
    entries: { from_boiler: [1, 3, 'down'] },
    tiles: [
      '##############',
      'WWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWW',
      '..............',
      '..............',
      '..............',
      '..............',
      '..............',
      '..............',
      '##############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_basement', latch: true, door: { to: 'boiler', entry: 'from_keeper', dir: 'down' } },
      { id: 'board', x: 6, y: 2, w: 2, z: 'wall', sprite: (E) => (E.has('front_key') ? 'key_board_open' : 'key_board'),
        on: function* (E) {
          if (E.has('front_key')) { yield* E.say('@ Every key in the building, on hooks. And one empty hook: FRONT.'); return; }
          yield* E.say('@ A board of hooks with every key in the building, each with a room number.', '@ A small lock box with three dials: FRONT - THE ONE WHO KEEPS TRYING TO LEAVE.');
          E.goal('Open the lock box on the key board.', 'c4_box');
          const c = yield* E.code({ len: 3, title: 'FRONT - the one who keeps trying to leave' });
          if (c === null) return;
          if (c !== '404') { E.sfx('locked'); yield* E.say('@ The box stays shut.'); return; }
          E.sfx('unlock');
          yield* E.say('@haru:confused ...404? That\'s MY room.', "@haru:annoyed I don't try to leave. I'm just looking for Mom.");
          yield* E.give('front_key');
          E.goal('Run up to the lobby (1F). Open the front doors.', 'fin_go');
          yield* chase4(E);
        } },
      { id: 'rounds', x: 9, y: 2, z: 'wall', sprite: 'rounds_sheet',
        on: function* (E) { if (!E.has('night_log')) yield* E.give('night_log', { silent: true }); yield* E.note('night_log'); yield* E.say('@haru 404. Up again. At the front door. ...That\'s me?'); } },
      { id: 'inner', x: 12, y: 1, h: 2, z: 'wall', sprite: 'door_steel', text: ['@ A second door, STAFF. Locked.'] },
      { id: 'cot', x: 2, y: 6, h: 2, sprite: 'staff_cot', text: ['@ A narrow folding cot with a grey blanket. A paperback face-down on the pillow.', '@haru He sleeps here? ...When does he sleep?'] },
      { id: 'bento', x: 4, y: 3, sprite: 'thermos_bento',
        on: function* (E) {
          yield* E.say('@ A thermos and a bento box wrapped in a cloth. A folded note tucked under it.');
          if (!E.has('bento_note')) yield* E.give('bento_note', { silent: true });
          yield* E.note('bento_note');
          yield* E.say('@haru:confused The scary man has a mom.');
        } },
      { id: 'carrier', x: 10, y: 6, sprite: (E) => (E.flag('tama_saved') ? 'pet_carrier' : 'carrier_wired'),
        on: function* (E) {
          if (E.flag('tama_saved')) { yield* E.say('@ The empty carrier. A few grey hairs.'); return; }
          E.sfx('meow');
          yield* E.say('@haru:shock Tama!', '@ Tama, inside a pet carrier. The little door is twisted shut with wire.');
          if (!E.has('wire_cutters')) { yield* E.say('@haru It\'s wired shut. I need cutters.'); E.goal('Free Tama.', 'c4_tama'); return; }
          E.sfx('click');
          yield* E.say('@ Snip. Snip. The wire falls away.');
          E.set('tama_saved'); E.set('follower', 'tama');
          yield* E.say('@haru:happy Tama! Did he hurt you?', '@ Tama yawns. She smells of someone else\'s hands, and of fish.');
          E.goal('Find Tama. Find the key board.', 'c4_find');
        } },
      { id: 'desk', x: 4, y: 5, sprite: 'desk', light: { r: 30, col: '#ffd890', glow: 0.3, dy: -12 }, text: ['@ A desk lamp. A pile of name cards waiting to be printed. A Polaroid of a young man with a cat on his shoulder.'] },
      { id: 'mirror', x: 3, y: 2, z: 'wall', sprite: 'mirror_small', text: ['@ A little mirror. In it, behind me, the room looks... brighter. Clean. A kettle. Lockers.'] },
    ],
    first: function* (E) {
      yield* E.say('@ A small room. A cot. A desk lamp. And a wall of keys.', '@haru This is where he lives.');
    },
  };
  function* chase4(E) {
    if (E.flag('tama_saved')) {
      yield* E.say('@ Tama purrs against Haru\'s legs. Then her ears go forward.');
      E.sfx('chirp'); E.bubbleNow('follower', '!', 1.2);
    }
    E.sfx('keys');
    yield* E.wait(0.6);
    E.sfx('unlock');
    yield* E.say('@ The second door, the one that was locked, opens.');
    if (!E.flag('tama_saved')) {
      yield* E.say('@haru:sad Tama-- I\'ll come back!');
      E.goal('Go back for Tama.', 'c4_tama');
    }
    yield* E.say("@caretaker Haru-san, it's me... Sa-to.");
    E.chase('c4');
  }

  // ======================================================================
  // TEST ROUTE
  // ======================================================================
  const READ4 = { '@read:letter_1': true, '@read:letter_2': true, '@read:letter_3': true, '@read:letter_4': true };
  G.WALKTHROUGH = G.WALKTHROUGH || {};
  G.WALKTHROUGH.ch4 = [
    { start: { map: 'b1_hall', x: 'from_1f', items: ['flashlight', 'keeper_key', 'wire_cutters'], flags: Object.assign({ stairsOpen: true, tama_taken: true, ch3_done: true, ota_tea: true, helped_shota: true, shota_bench: true }, READ4), notes: ['note_fridge', 'letter_1', 'letter_2', 'letter_3', 'letter_4'] } },
    { use: 'pipe_hot' },
    { door: 'door_storage' },
    { use: 'cage_404' },
    { answer: '1209' },
    { expect: { notes: 5 } },
    { use: 'cage_kanri', choose: [0] },
    { expect: { has: ['pressure_chart'], flags: ['c4_stalkDone'] } },
    { door: 'exit' },
    { door: 'door_boiler' },
    { use: 'valve_red', choose: [2] },
    { use: 'valve_blue', choose: [1] },
    { use: 'valve_grey', choose: [1] },
    { expect: { not: ['c4_steamOff'] } },
    { use: 'valve_blue', choose: [0] },
    { expect: { flags: ['c4_steamOff'] } },
    { door: 'door_keeper' },
    { expect: { map: 'keeper' } },
    { use: 'carrier' },
    { expect: { flags: ['tama_saved'] } },
    { use: 'rounds' },
    { use: 'bento' },
    { use: 'board' },
    { answer: '404' },
    { expect: { has: ['front_key'] } },
    { escape: ['exit', { latch: 'door_keeper' }, 'door_hall', 'up', 'door_lobby'], latch: true, max: 60 },
    { expect: { map: 'lobby', flags: ['chase4_done'] } },
  ];
})(window.G);
