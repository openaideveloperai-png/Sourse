// NOBODY HOME: Chapter 2, the third floor. See docs/design.md.
(function (G) {
  'use strict';

  // ======================================================================
  // ITEMS AND DOCUMENTS
  // ======================================================================
  Object.assign(G.ITEMS, {
    sheet_1: { name: 'Torn Sheet Music (1)', desc: 'A torn strip of sheet music. Pencil letters under the notes: "mi so la so".', icon: 'icon_sheet_1' },
    sheet_2: { name: 'Torn Sheet Music (2)', desc: 'A torn strip of sheet music: "mi re".', icon: 'icon_sheet_2' },
    sheet_3: { name: 'Torn Sheet Music (3)', desc: 'The last strip: "do (hold it, let it ring)".', icon: 'icon_sheet_3' },
    kuroda_song: {
      name: 'The Go-Home Song', note: true, icon: 'icon_kuroda_song', desc: "Mr. Kuroda's song, taped back together.",
      pages: ['THE GO-HOME SONG\n(Hinata Elementary, 5 PM)\n\nmi  so  la  so\nmi  re\ndo  (hold it, let it ring)\n\nIn the corner, in pencil: "Play it slowly. Let them hear it all the way home. - K."'],
    },
    music_chart: {
      name: 'Music Chart', note: true, icon: 'icon_note', desc: "Shota's school music chart.",
      pages: ['DO  RE  MI  FA  SO  LA  TI  DO\n C   D   E   F   G   A   B   C\n\n(Shota has drawn a baseball on the C.)'],
    },
    developer: { name: 'Developer', desc: 'A brown bottle. "DEVELOPER - property of 303. Do NOT mix with bleach!"', icon: 'icon_developer' },
    photo_1977: {
      name: 'Old Group Photo', note: true, icon: 'icon_photo_1977', desc: 'The photo that came up in the tray.',
      pages: ['A black-and-white group photo: about a dozen people in front of the building, under a banner: HINATA HEIGHTS 20th ANNIVERSARY.\n\nOn the back, in neat handwriting:\n"Hinata Heights, 20th anniversary, 1977. Photo: H. Aoki."'],
    },
    lift_key: { name: 'Lift Key', desc: 'A small key on a red tag: MAINTENANCE. Mr. Kuroda gave it to you.', icon: 'icon_lift_key' },
    fishing_rod: { name: "Shota's Fishing Rod", desc: "Shota's fishing game. A toy rod with a strong magnet on a string.", icon: 'icon_fishing_rod' },
    letter_2: {
      name: 'Letter from Mom (2)', note: true, icon: 'icon_letter', desc: 'Found in the pocket of a brown cardigan.',
      pages: ["March 1967.\n\nYou left for the photo lab this morning and your futon's still warm. Eighteen and a working man.\n\nI'm sorry I was never home at night. You grew up kind anyway.\n\nWear the cardigan, it's cold in that lab.\n\n- Mom"],
    },
  });
  G.RECIPES = G.RECIPES || [];
  G.RECIPES.push({
    needs: ['sheet_1', 'sheet_2', 'sheet_3'], gives: 'kuroda_song',
    text: '@haru The three pieces fit together. A whole song.',
    then: function* (E) { yield* E.note('kuroda_song'); yield* E.say('@haru Mi, so, la... I don\'t know which keys those are. Somebody here must have a chart.'); E.goal('Play Mr. Kuroda\'s song for him.', 'c2_song'); },
  });

  // ======================================================================
  // HINTS
  // ======================================================================
  Object.assign(G.HINTS, {
    c2_down: function (E) {
      if (!E.flag('c2_kuroda')) return [["@mom You need to go down, Haru. The stairs are blocked? ...Then think of another way."], ["@mom That lift... somebody must have the key. Mr. Kuroda's been on that floor forever."], ["@mom He can't hear, sweetheart. Find the rest of his song. It's torn into pieces."]];
      if (!E.flag('c2_shota')) return [['@mom Shota wants to play? Then play with him. He knows things.'], ['@mom Shota watched that man ride the lift. Win his game and he\'ll tell you.']];
      return [['@mom You have the key. Which buttons look used?'], ['@mom Shota told you the order: five, one, B.']];
    },
    c2_song: [['@mom A song, Haru? Read the notes out loud.'], ['@mom Do re mi... Shota has a music chart on his wall.'], ['@mom Mi is E. So is G. La is A. Re is D. Do is C. Seven notes.']],
    c2_shota: function (E) {
      const r = E.count('c2_round');
      if (r === 0) return [['@mom Warm... what is still burning in that building?'], ['@mom The heater in Shota\'s flat. What is next to it?']];
      if (r === 1) return [['@mom The sun goes down in the west, Haru.'], ['@mom Is there a map in the corridor? Which end is west?'], ['@mom The cupboard at the west end of the corridor.']];
      return [['@mom Where can you see yourself?'], ['@mom A mirror, sweetheart. Shota\'s mother has a tall one.']];
    },
    c2_dark: [['@mom A darkroom? You need the red light, Haru. Never the white one.'], ['@mom And developer. Photographers keep chemicals near the water... the laundry?']],
  });

  // ======================================================================
  // SHARED 3F LOGIC
  // ======================================================================
  function* arrive3F(E) {
    if (E.flag('reached3F') || E.chasing()) return;
    E.set('reached3F');
    yield* E.wait(0.3);
    E.chapter('Chapter 2: The Third Floor', 'Ch.2 3F');
    E.goal('Find another way down.', 'c2_down');
  }
  // apartment doors on 3F are held shut while he hunts
  const heldShut = function* (E) {
    if (E.chasing()) { E.sfx('locked'); yield* E.say('@ Locked. Someone is holding it shut from inside.'); return false; }
    return true;
  };
  // Kuroda's four notes (the 3F sound landmark); the full phrase once he is helped
  const PHRASE4 = [['E4', 0.45], ['G4', 0.45], ['A4', 0.45], ['G4', 0.9]];
  const PHRASE7 = [['E4', 0.45], ['G4', 0.45], ['A4', 0.45], ['G4', 0.6], ['E4', 0.45], ['D4', 0.45], ['C4', 1.6]];
  const landmark = (vol) => function (E, dt) {
    const s = this._s || (this._s = { t: 4 });
    s.t -= dt;
    if (s.t > 0 || E.chasing() || G.Chase.walkers.length) return;
    s.t = 20;
    E.tune(E.flag('c2_kuroda') ? PHRASE7 : PHRASE4, { wave: 'piano', vol: vol });
  };

  // ======================================================================
  // HIDE-AND-SEEK (Shota)
  // ======================================================================
  const SPOTS = ['oshiire', 'cupboard_w', 'mirror']; // the right spot for rounds 1, 2, 3
  const RIDDLES = ["I always hide where it's warm!", 'Where the sun goes down!', 'Where you can see yourself!'];
  const LIFT = ['@shota The scary man always pushes 5 first. Top floor. Like he\'s checking on somebody.', '@shota ...then 1. All the way down.', '@shota ...then B. Bottom-bottom. Where nobody\'s allowed.'];
  // a spot: returns true if it handled the event as hide-and-seek
  function* seek(E, spotId) {
    if (!E.flag('c2_seeking')) return false;
    const r = E.count('c2_round');
    if (SPOTS[r] !== spotId) {
      const w = E.inc('c2_wrong');
      if (w >= 2) {
        E.set('c2_wrong', 0);
        E.sfx('laugh');
        yield* E.say('@ Not here. Somewhere else in the building, a giggle.', '@shota Cheater! I moved!', '@shota ' + RIDDLES[r]);
      } else yield* E.say('@ Not here.');
      return true;
    }
    // found him
    E.set('c2_wrong', 0); E.unset('c2_seeking');
    if (r === 2) {
      yield* E.glimpse('mirror_stand_old', { time: 0.3, sfx: 'static' });
      yield* E.say('@ In the mirror, for a moment, there is an old man in a blue baseball cap.', '@haru:confused ...Shota?', '@shota Found me.');
      yield* E.wait(0.4);
      yield* E.glimpse('scare_shota', { time: 0.7 });
      yield* E.say('@ Shota stands facing the wall, very still. For a moment too long.', '@ Then he turns around, grinning.');
    } else {
      E.sfx('laugh');
      yield* E.say('@shota Aw! You found me!');
    }
    yield* E.say(LIFT[r]);
    E.inc('c2_round');
    if (r === 2) {
      yield* E.say("@shota My fishing game! The magnet's super strong. I fish bottle caps out of the drain in the yard with it. You can borrow it.");
      yield* E.give('fishing_rod');
      yield* E.say("@shota The scary man keeps everybody's keys in the basement.", "@shota ...I lost my cap somewhere outside. Mom's gonna kill me.");
      E.set('c2_shota');
      E.goal('Find another way down.', 'c2_down');
    } else yield* E.say('@shota Again! Again! I\'m going back to my room. Come and play!');
    return true;
  }

  // ======================================================================
  // MAPS
  // ======================================================================
  G.MAPS.stair3 = {
    name: 'Stairwell 3F', wall: 'concrete', floor: { '.': 'concrete' },
    dark: 0.6, ambience: 'wind',
    lights: [{ x: 5, y: 2, r: 40, col: '#40ff80', glow: 0.3 }],
    entries: { from_4f: [2, 5, 'down'], from_c3: [5, 3, 'down'], from_2f: [8, 5, 'down'] },
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
      { id: 'door_c3', x: 5, y: 1, h: 2, z: 'wall', sprite: 'door_stairs', latch: true, door: { to: 'c3', entry: 'from_stair3', dir: 'down' } },
      { id: 'floorsign', x: 3, y: 1, w: 2, z: 'wall', sprite: 'sign_floor_3f' },
      { id: 'sign_up', x: 1, y: 2, w: 2, z: 'wall', sprite: 'sign_up_4f' },
      { id: 'up', x: 1, y: 3, w: 2, sprite: 'stairs_up', touch: true, solid: false, stairs: true, door: { to: 'stair4', entry: 'from_3f', dir: 'down', walk: true } },
      { id: 'sign_down', x: 7, y: 2, w: 2, z: 'wall', sprite: 'sign_down_2f' },
      { id: 'barricade', x: 7, y: 3, w: 3, h: 2, sprite: 'barricade', cond: (E) => !E.flag('stairsOpen'),
        text: ['@ Every chair in the building is piled here, on top of the stairs down. Tables. A mattress.', "@haru The way down is buried. Someone moved them all... quietly. When?", '@haru (The door to the third floor is right there, under the EXIT light.)'] },
      { id: 'down', x: 7, y: 3, w: 2, h: 2, sprite: 'stairs_down2', z: 'floor', touch: true, solid: false, stairs: true, cond: (E) => !!E.flag('stairsOpen'), door: { to: 'stair2', entry: 'from_3f', dir: 'down', walk: true } },
      { id: 'chairs', x: 9, y: 6, sprite: 'chair', cond: (E) => !!E.flag('stairsOpen'), text: ['@ The chairs stand in a neat row against the wall.', '@haru Somebody put all the chairs back.'] },
    ],
    enter: function* (E) {
      yield* arrive3F(E);
      if (!E.flag('stairsOpen') && !E.flag('c2_sawBarricade') && !E.chasing()) {
        E.set('c2_sawBarricade');
        yield* E.say('@haru:shock The stairs down... someone piled furniture all over them!', '@haru:determined The third floor door, then. The one with the EXIT light.');
      }
    },
  };

  G.MAPS.c3 = {
    name: 'Third Floor', location: 'Hinata Heights - 3F', wall: 'danchi', floor: { '.': 'corridor' },
    dark: 0.55, rain: 'rail', ambience: 'rain',
    lights: [{ x: 2, y: 2, r: 34, col: '#40ff80', glow: 0.25 }, { x: 31, y: 3, r: 40, col: '#fff0d0', glow: 0.2 }],
    entries: { from_stair3: [2, 3, 'down'], from_301: [13, 3, 'down'], from_302: [19, 3, 'down'], from_303: [25, 3, 'down'], from_laundry: [31, 3, 'down'], from_lift: [8, 3, 'down'] },
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
      { id: 'door_stairs', x: 2, y: 1, h: 2, z: 'wall', sprite: 'door_stairs', latch: true, door: { to: 'stair3', entry: 'from_c3', dir: 'down' } },
      { id: 'cupboard_w', x: 0, y: 3, sprite: 'wardrobe', hideSprite: 'wardrobe_open',
        on: function* (E, self) {
          if (yield* seek(E, 'cupboard_w')) return;
          yield* E.hideIn(self);
        } },
      { id: 'map', x: 4, y: 2, w: 2, z: 'wall', sprite: 'notice_board',
        text: ['@ A floor map of Hinata Heights, 3F. A compass rose in the corner: N points up. W points LEFT, to the stairwell end.', '@ RESIDENTS\' NOTICE: The lift is for maintenance staff only. Hinata Heights has no lift. (This notice is wrong. There it is.)'] },
      { id: 'lift', x: 8, y: 1, w: 2, h: 2, z: 'wall', sprite: (E) => (E.flag('c2_liftOpen') ? 'elevator_open' : 'elevator'),
        on: function* (E) {
          if (!E.flag('c2_liftOpen')) { yield* E.say('@ The lift doors are shut tight. OUT OF ORDER.'); return; }
          if (!E.flag('c2_shota')) { yield* E.say("@haru:sad Shota is still hiding somewhere. I promised I'd find him first."); return; }
          if (E.notesCount('letter_2', 'found') === 0 && !E.flag('c2_forgetWarn')) { E.set('c2_forgetWarn'); yield* E.say("@haru:confused I feel like I'm forgetting something on this floor..."); }
          yield* E.goto('lift', 'from_c3', null, 'up');
        } },
      { id: 'panel', x: 10, y: 2, z: 'wall', sprite: 'elevator_panel',
        on: function* (E) {
          yield* E.say('@ A keyhole: MAINTENANCE. Buttons 1 to 5 and B. Three of them are worn smooth: 5, 1 and B.');
          if (E.flag('c2_liftOpen')) { yield* E.say('@ The doors are open.'); return; }
          if (!E.has('lift_key')) return;
          E.sfx('unlock');
          yield* E.say('@ Haru turns the maintenance key.');
          E.sfx('ding');
          E.set('c2_liftOpen');
          yield* E.say('@ The lift doors grind open. The car is dark inside.');
          if (!E.flag('c2_shota')) yield* E.say("@haru:sad Shota is still hiding somewhere, though. I promised I'd find him first.");
        } },
      G.aptDoor('301', 13, 1, 'a301', null, null, { door: { to: 'a301', entry: 'from_c3', dir: 'down' }, before: heldShut }),
      { id: 'win301', x: 14, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ Mr. Kuroda\'s window. A faint yellow light. Piano music, very soft.'] },
      { id: 'plant', x: 16, y: 3, sprite: 'plant_pot', text: ['@ A dusty rubber plant. Someone tied a paper fortune to it.'] },
      G.aptDoor('302', 19, 1, 'a302', null, null, { door: { to: 'a302', entry: 'from_c3', dir: 'down' }, before: heldShut }),
      { id: 'win302', x: 20, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ Shota\'s window. A baseball cap drawn on the glass with a finger.'] },
      G.aptDoor('303', 25, 1, 'a303', null, null, { door: { to: 'a303', entry: 'from_c3', dir: 'down' }, before: heldShut }),
      { id: 'win303', x: 26, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ 303\'s window is painted black on the inside.'] },
      G.nightlightObj(28, 2, 'nightlight3'),
      { id: 'door_laundry', x: 31, y: 1, h: 2, z: 'wall', sprite: (E) => (E.chasing() ? 'door_steel_open' : 'door_steel'), latch: true, door: { to: 'laundry', entry: 'from_c3', dir: 'down' } },
      { id: 'sign', x: 32, y: 2, z: 'wall', sprite: 'paper', text: ['@ LAUNDRY ROOM. Machines off at 10 PM. Do NOT use the chute.'] },
      { id: 'bags', x: 35, y: 3, sprite: 'trash_bags', text: ['@ Bags of old newspapers, tied with string.'] },
    ],
    enter: function* (E) {
      yield* arrive3F(E);
      // the walk-by lesson: the first time Haru leaves the darkroom after the photo
      if (E.flag('c2_photo') && !E.flag('c2_walkby') && !E.chasing() && E.tile()[0] >= 24 && E.tile()[0] <= 26) {
        E.set('c2_walkby');
        if (E.flag('follower') === 'tama') { E.sfx('chirp'); E.bubbleNow('follower', '!', 1.2); }
        E.sfx('keys');
        yield* E.say('@ Keys. Coming from the stairwell end.', '@haru:scared Don\'t move... stay by the wall... don\'t move...');
        E.walkBy({ char: 'caretaker', from: [0, 5], to: [35, 5], delay: 1.5, speed: 45, cause: 'walkby' });
      } else if (E.flag('c2_walkby') && E.flag('c2_kuroda') && E.ambushReady(0.25, 300)) {
        E.sfx('keys');
        E.walkBy({ char: 'caretaker', from: [35, 5], to: [0, 5], delay: 2.5, speed: 46, warn: true, cause: 'walkby' });
      }
    },
    update: landmark(0.35),
  };

  // ---------------- 301: Mr. Kuroda ----------------
  G.MAPS.a301 = {
    name: '301 - Kuroda', wall: 'plaster', floor: { ';': 'genkan', ',': 'tatami', '.': 'wood' },
    dark: 0.3, music: 'sad', ambience: 'hum',
    lights: [{ x: 7, y: 4, r: 56, col: '#ffd890', glow: 0.25 }],
    entries: { from_c3: [1, 3, 'down'] },
    tiles: [
      '##############',
      'WWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWW',
      ';;;...........',
      ';;;...........',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      '##############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c3', entry: 'from_301', dir: 'down' } },
      { id: 'photos', x: 3, y: 2, z: 'wall', sprite: 'painting_portrait', text: ['@ Rows and rows of children. HINATA ELEMENTARY - MUSIC CLUB - 1962.', '@ Another frame: 1971. Another: 1985. The same tall teacher at the back of every one, getting older.'] },
      { id: 'piano', x: 6, y: 3, w: 2, sprite: 'piano',
        on: function* (E) {
          if (E.flag('c2_kuroda')) { yield* E.say('@ The lid is closed. Mr. Kuroda\'s hand rests on it.'); return; }
          if (!E.has('kuroda_song')) {
            E.tune(PHRASE4, { wave: 'piano' });
            yield* E.say('@ Mr. Kuroda plays four notes and stops. Mi, so, la, so. He starts again. Stops again.', '@ Faded pencil on the white keys: "do" written on one, "so" on another. For students?');
            return;
          }
          const ok = yield* E.yesno('@ Play the go-home song for him?');
          if (!ok) return;
          const r = yield* E.piano({ title: 'The go-home song', max: 7 });
          if (!r) return;
          if (r.join(' ') !== 'E G A G E D C') { yield* E.say('@ Mr. Kuroda shakes his head without looking up. He felt it through the floor.'); return; }
          E.set('c2_kuroda');
          yield* E.wait(0.8);
          yield* E.say('@ The last note rings. Mr. Kuroda lays his palm flat on the lid, feeling it.', '@kuroda ...There\'s the rest of it.', '@kuroda I can\'t hear it any more, you know. But I felt it come up through the keys.', '@haru It\'s the go-home song.', '@kuroda:sad Forty years I played it for the children. Go home, go home.', '@kuroda ...You play like a man who used to play, son.');
          yield* E.say('@kuroda The man with the keys closes my lid at ten every night. Tonight he left this on it.', '@kuroda Go on home.');
          yield* E.give('lift_key');
          E.goal('Find another way down.', 'c2_down');
        } },
      { id: 'kuroda', x: 6, y: 4, char: 'kuroda', dir: 'up',
        on: function* (E) {
          if (E.flag('c2_kuroda')) { yield* E.say('@kuroda:happy Go home, son. Go home. ...Thank you.'); return; }
          if (E.has('kuroda_song')) { yield* E.say('@haru:determined (He can\'t hear me. But maybe he can hear the piano.)'); return; }
          if (!E.flag('c2_metKuroda')) {
            E.set('c2_metKuroda');
            yield* E.say('@haru Excuse me, Mr. Kuroda. Have you seen my mom?', "@kuroda Eh? Speak up, son. Or don't. I can't hear it either way.", '@kuroda I had a song. The children used to go home to it. Now I only have the start of it.', '@kuroda Mi, so, la, so... and then nothing. Like a door closing.');
            E.goal('Find the rest of Mr. Kuroda\'s song.', 'c2_down');
            return;
          }
          yield* E.say('@kuroda Mi, so, la, so... and then nothing.');
        } },
      { id: 'basket', x: 11, y: 3, sprite: 'basket',
        on: function* (E) {
          if (!E.has('sheet_1') && !E.flag('@made:kuroda_song')) {
            yield* E.say('@ A waste basket full of crumpled paper. One strip is sheet music, torn.');
            yield* E.give('sheet_1');
            yield* E.say('@haru "mi so la so"... That\'s his four notes. The rest is torn off.');
            return;
          }
          yield* E.say('@ Crumpled paper. Old concert programmes. HINATA ELEMENTARY CHRISTMAS CONCERT.');
        } },
      { id: 'shelf', x: 12, y: 3, sprite: 'bookshelf', text: ['@ Sheet music, piles of it. Every piece is marked with pencil: slower. Softer. LET IT RING.'] },
      G.nightlightObj(9, 2, 'nightlight'),
      G.phoneObj(13, 6, { id: 'phone' }),
      { id: 'radio_table', x: 2, y: 7, sprite: 'table_small', text: ['@ A hearing trumpet, a cup of cold tea, a metronome that has stopped.'] },
      { id: 'futon', x: 10, y: 7, h: 2, sprite: 'futon', z: 'floor', solid: false, text: ['@ A neatly made futon. Nobody has slept in it tonight.'] },
    ],
    enter: arrive3F,
    update: landmark(1),
  };

  // ---------------- 302: Shota ----------------
  G.MAPS.a302 = {
    name: '302 - Ishida', wall: 'cream', floor: { ';': 'genkan', ',': 'tatami' },
    dark: 0.5, ambience: 'hum',
    entries: { from_c3: [1, 3, 'down'] },
    tiles: [
      '##############',
      'WWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWW',
      ';;,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      '##############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c3', entry: 'from_302', dir: 'down' } },
      { id: 'chart', x: 3, y: 2, w: 2, z: 'wall', sprite: 'music_chart',
        on: function* (E) {
          if (!E.has('music_chart')) yield* E.give('music_chart', { silent: true });
          yield* E.note('music_chart');
          yield* E.say('@haru Do is C. Re is D. Mi is E...');
        } },
      { id: 'oshiire', x: 6, y: 1, w: 2, h: 2, z: 'wall', sprite: 'oshiire',
        on: function* (E) {
          if (yield* seek(E, 'oshiire')) return;
          yield* E.say('@ The futon closet. Warm, from the heater next to it.');
        } },
      { id: 'heater', x: 8, y: 3, sprite: 'heater', light: { r: 34, col: '#ff8040', glow: 0.35, flicker: true }, text: ['@ A kerosene heater, still burning. The only warm thing in the building.'] },
      { id: 'toybox', x: 11, y: 3, sprite: 'toy_box',
        on: function* (E) {
          if (yield* seek(E, 'toybox')) return;
          yield* E.say('@ Shota\'s toys. Baseball cards, a glove, three marbles that are definitely mine.');
        } },
      { id: 'mirror', x: 12, y: 6, sprite: 'mirror_stand',
        on: function* (E) {
          if (yield* seek(E, 'mirror')) return;
          yield* E.say('@ A tall dressing mirror. Haru in striped pajamas. ...Right.');
        } },
      { id: 'desk', x: 2, y: 7, sprite: 'kids_desk', text: ['@ Shota\'s homework. Every answer is wrong. On purpose, I think.'] },
      { id: 'futon', x: 5, y: 6, h: 2, sprite: 'futon', z: 'floor', solid: false, text: ['@ Shota\'s futon, kicked into a tangle.'] },
      { id: 'shota', x: 9, y: 6, char: 'shota', dir: 'down', cond: (E) => !E.flag('c2_seeking') && !E.flag('c2_shota'),
        on: function* (E) {
          const r = E.count('c2_round');
          if (r === 0 && !E.flag('c2_metShota')) {
            E.set('c2_metShota');
            yield* E.say('@shota:happy Haru! You came! I knew you\'d come.', '@haru:confused Shota? What are you doing up? Have you seen my mom?', '@shota Play hide-and-seek first! You\'re it! Count to ten!');
          } else yield* E.say('@shota Again! You\'re it! Count to ten!');
          yield* E.fadeOut(0.4);
          yield* E.say('@haru One... two... three... ...ten! Ready or not!');
          E.set('c2_seeking'); E.set('c2_wrong', 0);
          yield* E.fadeIn(0.4);
          E.sfx('laugh');
          yield* E.say('@ Shota is gone. From somewhere, his voice:', '@shota ' + RIDDLES[r]);
          E.goal('Find Shota: "' + RIDDLES[r] + '"', 'c2_shota');
        } },
      { id: 'shota_done', x: 9, y: 6, char: 'shota', dir: 'down', cond: (E) => !!E.flag('c2_shota') && !E.flag('shota_bench'),
        text: ['@shota Go on, Haru. I\'ll find my cap tomorrow. ...Probably.'] },
    ],
    enter: arrive3F,
  };

  // ---------------- 303: the darkroom ----------------
  G.MAPS.a303 = {
    name: '303 - Darkroom', wall: 'concrete', floor: { ';': 'genkan', '.': 'linoleum' },
    dark: (E) => (E.flag('c2_safelight') ? 0.55 : 0.85),
    tint: (E) => (E.flag('c2_safelight') ? ['#5a0008', 0.35] : null),
    ambience: 'hum',
    lights: (E) => (E.flag('c2_safelight') ? [{ x: 6, y: 3, r: 80, col: '#ff2020', glow: 0.3 }] : []),
    entries: { from_c3: [1, 3, 'down'] },
    tiles: [
      '############',
      'WWWWWWWWWWWW',
      'WWWWWWWWWWWW',
      ';;..........',
      '............',
      '............',
      '............',
      '............',
      '############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c3', entry: 'from_303', dir: 'down' } },
      { id: 'switch', x: 3, y: 2, z: 'wall', sprite: 'switch',
        on: function* (E) {
          if (E.flag('c2_safelight')) { yield* E.say('@ The red light is on. Everything looks like the inside of an eyelid.'); return; }
          E.set('c2_safelight'); E.sfx('click');
          yield* E.say('@ Click. A deep red light comes on.', '@haru:confused A safelight. ...How do I know that word?');
        } },
      { id: 'safelight', x: 6, y: 1, w: 2, h: 2, z: 'wall', sprite: (E) => (E.flag('c2_safelight') ? 'safelight_on' : 'safelight_off'), text: ['@ A red lamp on the wall. Darkroom light.'] },
      { id: 'line', x: 9, y: 2, w: 2, z: 'wall', sprite: 'photo_line',
        on: function* (E) {
          if (!E.flag('c2_safelight')) { yield* E.say('@ A string across the wall with clothes pegs. Too dark to see what is hanging there.'); return; }
          if (!E.has('sheet_3') && !E.flag('@made:kuroda_song')) {
            yield* E.say('@ In the red light: photographs pegged on the line. And between them, a strip of sheet music.');
            yield* E.give('sheet_3');
            return;
          }
          yield* E.say('@ Photographs of the building. The corridor. The courtyard swings. A boy in a baseball cap. They look a lot like the ones I would take.');
        } },
      { id: 'tray', x: 5, y: 4, w: 2, sprite: 'darkroom_tray',
        on: function* (E) {
          if (E.flag('c2_photo')) { yield* E.say('@ The trays smell of vinegar and something sharp.'); return; }
          if (!E.flag('c2_safelight')) { yield* E.say('@ Three trays on a table. You can\'t develop anything in the dark... or in white light. You need the red one.'); E.goal('Develop the photo in 303.', 'c2_dark'); return; }
          if (!E.has('developer')) { yield* E.say('@ Three trays. A sheet of photo paper lies in the first one. But the trays are dry. No developer.'); E.goal('Develop the photo in 303.', 'c2_dark'); return; }
          yield* E.say('@haru Developer, stop bath, fixer. ...How do I know that?');
          E.take('developer');
          yield* E.picture('pic_blank', { morph: 'pic_photo_1977', morphTime: 2.5, caption: 'Something is coming up in the tray...' });
          E.set('c2_photo');
          yield* E.give('photo_1977', { silent: true });
          yield* E.note('photo_1977');
          yield* E.say('@haru:confused H. Aoki. ...I didn\'t take this.', '@haru But the boy in the front with the camera strap... he looks like Dad. Older, though.');
          E.goal('Find another way down.', 'c2_down');
        } },
      { id: 'enlarger', x: 9, y: 4, sprite: 'enlarger', text: ['@ An enlarger. A big black camera on a pole, pointing down at nothing.'] },
      { id: 'table', x: 2, y: 6, sprite: 'table_small', text: ['@ A table with a newspaper on it.'] },
      { id: 'paper', x: 3, y: 6, sprite: 'newspaper',
        text: ['@ A newspaper. DECEMBER 9, 2019. Something about a typhoon. A photo of a train I have never seen.', '@haru:confused 2019? That\'s... sixty years from now.', '@haru Somebody\'s joke. A newspaper from the future.'] },
      { id: 'shelf', x: 10, y: 6, sprite: 'bookshelf_messy', text: ['@ Boxes of photo paper. Film canisters. A camera bag with the initials H.A.'] },
    ],
    enter: arrive3F,
  };

  // ---------------- the laundry ----------------
  G.MAPS.laundry = {
    name: 'Laundry Room', wall: 'tiles', floor: { '.': 'tile_white' },
    dark: 0.65, ambience: 'hum',
    lights: [{ x: 6, y: 4, r: 50, col: '#e0f0ff', glow: 0.18, flicker: true }],
    entries: { from_c3: [1, 3, 'down'] },
    tiles: [
      '##############',
      'WWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWW',
      '..............',
      '..............',
      '..............',
      '..............',
      '..............',
      '##############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c3', entry: 'from_laundry', dir: 'down' } },
      { id: 'washer1', x: 3, y: 3, sprite: 'washer', text: ['@ A washing machine. Empty. The drum is still wet.'] },
      { id: 'washer2', x: 4, y: 3, sprite: 'washer_run',
        on: function* (E) {
          if (!E.notesCount('letter_2', 'found')) {
            yield* E.say('@ A brown cardigan in the drum, far too big for me. There\'s something in the pocket.');
            yield* E.give('letter_2', { silent: true });
            yield* E.note('letter_2');
            yield* E.say('@haru:confused Photo lab? ...I\'m ten.');
            return;
          }
          yield* E.say('@ The brown cardigan. It smells like... me?');
        } },
      { id: 'behind', x: 5, y: 3, sprite: 'washer',
        on: function* (E) {
          if (E.has('sheet_2') || E.flag('@made:kuroda_song')) { yield* E.say('@ The gap behind the machines is empty now.'); return; }
          yield* E.say('@ Something paper is stuck in the gap behind the machines. Too narrow for me.');
          if (E.flag('follower') !== 'tama') return;
          yield* E.say('@haru Tama? Can you reach it?');
          E.followerOut();
          const [px, py] = E.tile();
          yield* E.moveTo('follower', 6, 4, 50);
          E.face('follower', 'up');
          E.hide('follower');
          yield* E.wait(1.2);
          E.show('follower');
          yield* E.followerIn(50);
          yield* E.say('@ Tama comes back with a strip of paper in her teeth.', '@haru:happy Good girl.');
          yield* E.give('sheet_2');
        } },
      { id: 'shelf', x: 8, y: 3, sprite: 'shelf_bottles',
        on: function* (E) {
          if (!E.has('developer') && !E.flag('c2_photo')) {
            yield* E.say('@ Bottles of bleach, soap, starch. And a brown bottle: DEVELOPER - property of 303. Do NOT mix with bleach!');
            yield* E.give('developer');
            return;
          }
          yield* E.say('@ Bleach, soap, starch.');
        } },
      { id: 'chute', x: 12, y: 1, h: 2, z: 'wall', sprite: 'chute',
        on: function* (E) {
          if (E.chasing()) { yield* E.say('@ The chute hatch. Not now.'); return; }
          const n = E.inc('c2_chute');
          if (n === 1) { yield* E.say('@ The laundry chute. Warm air breathes up the chute. It smells of soap.'); return; }
          if (n === 2) { E.sfx('keys'); yield* E.say("@ Far below: keys. A man's voice: 'Aoki-san?'", "@haru:scared Don't. Don't, Haru."); return; }
          const yes = (yield* E.ask('@ Reach inside?', ['No', 'Yes'], { cancel: 0 })) === 1;
          if (!yes) { yield* E.say('@haru No. Nope.'); return; }
          E.setSprite('chute', 'chute_open');
          yield* E.die('chute', { scare: 'caretaker' });
        } },
      { id: 'basket1', x: 10, y: 6, sprite: 'basket',
        on: function* (E, self) {
          if (yield* seek(E, 'basket1')) return;
          yield* E.hideIn(self);
        }, hidePrompt: '@ A big laundry basket full of sheets. Climb in and hide?' },
      { id: 'basket2', x: 12, y: 6, sprite: 'basket', hide: true, hidePrompt: '@ A big laundry basket full of sheets. Climb in and hide?' },
      { id: 'table', x: 2, y: 7, w: 2, sprite: 'table', text: ['@ A folding table. Someone folded the sheets very neatly, with hospital corners.'] },
    ],
    first: function* (E) {
      // Tama's keys: the only false alarm
      if (E.flag('follower') !== 'tama') return;
      E.set('c2_fakekeys');
      E.sfx('keys');
      yield* E.say('@haru:scared !', '@ Keys. Inside the laundry. Close.');
      yield* E.wait(0.6);
      E.sfx('keys');
      yield* E.say('@ ...It\'s Tama, batting at a ring of coin-box keys hanging from a machine dial.', '@haru:annoyed Tama! ...Don\'t do that.');
    },
    enter: arrive3F,
  };

  // ---------------- the lift car ----------------
  G.MAPS.lift = {
    name: 'Lift', wall: 'concrete', floor: { '.': 'linoleum' },
    dark: 0.6, ambience: 'hum',
    lights: [{ x: 3, y: 3, r: 40, col: '#e8f0ff', glow: 0.2, flicker: true }],
    entries: { from_c3: [3, 4, 'up'] },
    tiles: [
      '#######',
      'WWWWWWW',
      'WWWWWWW',
      '.......',
      '.......',
      '.......',
      '#######',
    ],
    objects: [
      { id: 'doors', x: 2, y: 1, w: 2, h: 2, z: 'wall', sprite: 'lift_doors_in', door: { to: 'c3', entry: 'from_lift', dir: 'down' } },
      { id: 'buttons', x: 5, y: 2, z: 'wall', sprite: 'lift_buttons',
        on: function* (E) {
          yield* E.say('@ MAINTENANCE - RESET SEQUENCE. Buttons 1 2 3 4 5 B. Three buttons worn smooth: 5, 1, B.');
          E.goal('Make the lift go down.', 'c2_down');
          const c = yield* E.code({ len: 3, chars: '12345B', title: 'MAINTENANCE - RESET SEQUENCE' });
          if (c === null) return;
          if (c !== '51B') { E.shake(2, 0.3); yield* E.say('@ The lift shudders. Nothing.'); return; }
          yield* liftScene(E);
        } },
      { id: 'rail', x: 0, y: 2, z: 'wall', sprite: 'lift_wall' },
      { id: 'rail2', x: 6, y: 2, z: 'wall', sprite: 'lift_wall' },
    ],
  };
  function* liftScene(E) {
    E.sfx('ding');
    yield* E.say('@ The doors close. The car jerks, and starts down. 3... 2...');
    E.shake(4, 1.0); E.sfx('crash');
    yield* E.say('@ ...and grinds to a stop.', '@ Stuck. Through the gap in the doors: a floor sign. 2F.');
    yield* E.flicker(4);
    E.spawn({ id: 'ct', char: 'caretaker', x: 5, y: 3, dir: 'down', alpha: 0.9 });
    E.dark(0.4);
    E.sfx('sting');
    yield* E.wait(1.5);
    E.dark(0.97);
    E.despawn('ct');
    yield* E.wait(0.4);
    E.sfx('breath');
    yield* E.say('@ In the dark, a hand settles on Haru\'s shoulder. Long fingers. Warm.');
    E.shake(5, 0.4);
    yield* E.say('@haru:scared NO!', '@ Haru twists free and shoves through the gap in the doors.');
    E.set('ch2_done'); E.set('chase2_armed');
    E.sfx('splash');
    yield* E.goto('c2', 'from_lift', null, 'down', { checkpoint: false });
  }

  // ======================================================================
  // TEST ROUTE
  // ======================================================================
  G.WALKTHROUGH = G.WALKTHROUGH || {};
  G.WALKTHROUGH.ch2 = [
    { start: { map: 'stair3', x: 'from_4f', items: ['flashlight', 'ota_keyring'], flags: { follower: 'tama', ch1_done: true, chase1_done: true, ota_tea: true }, notes: ['note_fridge', 'letter_1'] } },
    { expect: { flags: ['reached3F'], goal: 'c2_down' } },
    { use: 'barricade' },
    { door: 'door_c3' },
    { expect: { map: 'c3' } },
    { door: 'door_laundry' },
    { use: 'washer2' },
    { use: 'behind' },
    { use: 'shelf' },
    { expect: { has: ['sheet_2', 'developer'] } },
    { door: 'exit' },
    { door: 'door_301' },
    { use: 'kuroda' },
    { use: 'basket' },
    { door: 'exit' },
    { door: 'door_302' },
    { use: 'chart' },
    { use: 'shota' },
    { use: 'toybox' },
    { use: 'oshiire' },
    { use: 'shota' },
    { door: 'exit' },
    { use: 'cupboard_w' },
    { door: 'door_302' },
    { use: 'shota' },
    { use: 'mirror' },
    { expect: { has: ['fishing_rod'], flags: ['c2_shota'] } },
    { door: 'exit' },
    { door: 'door_303' },
    { use: 'tray' },
    { use: 'switch' },
    { use: 'line' },
    { use: 'tray' },
    { expect: { has: ['kuroda_song', 'photo_1977'] } },
    { door: 'exit' },
    { expect: { flags: ['c2_walkby'] } },
    { wait: 14 },
    { door: 'door_301' },
    { use: 'piano', choose: [0] },
    { answer: ['E', 'G', 'A', 'G', 'E', 'D', 'C'] },
    { expect: { has: ['lift_key'], flags: ['c2_kuroda'] } },
    { door: 'exit' },
    { use: 'panel' },
    { use: 'lift' },
    { expect: { map: 'lift' } },
    { use: 'buttons' },
    { answer: '51B' },
    { expect: { map: 'c2', flags: ['chase2_armed', 'ch2_done'] } },
  ];
})(window.G);
