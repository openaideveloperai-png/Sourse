// NOBODY HOME: Prologue + Chapter 1 (home 404 and the fourth floor). See docs/design.md.
(function (G) {
  'use strict';
  const H = (...a) => a; // tiny helper for hint tiers

  // ======================================================================
  // ITEMS AND DOCUMENTS
  // ======================================================================
  Object.assign(G.ITEMS, {
    flashlight_dead: { name: 'Keychain Flashlight', desc: "Mom's present. A little red flashlight on a keychain. It doesn't turn on: no batteries.", icon: 'icon_flashlight' },
    batteries: { name: 'Batteries', desc: 'Two small batteries from the living room clock.', icon: 'icon_batteries' },
    flashlight: {
      name: 'Flashlight', desc: "Mom's present. It works now. A small warm circle of light.", icon: 'icon_flashlight',
      use: function* (E) { yield* E.say('@haru It works. Mom thinks of everything.'); },
    },
    fish_sausage: { name: 'Fish Sausage', desc: "Mom's emergency dinner. Wrapped in red plastic. Smells fishy.", icon: 'icon_fish_sausage' },
    key_403: { name: 'Key with a Bell', desc: 'A spare door key on a little bell keychain. The tag says 403.', icon: 'icon_key_403' },
    key_stairs4: { name: 'Stairwell Key', desc: 'A heavy padlock key. The tag says 4F STAIRS in grown-up handwriting.', icon: 'icon_key_stairs4' },
    ota_keyring: { name: "Mr. Ota's Keys", desc: 'A ring of keys from the residents\' committee. One small brass key is polished from use.', icon: 'icon_ota_keyring' },
    note_fridge: {
      name: "Mom's Note", note: true, icon: 'icon_note',
      desc: 'The note from the fridge.',
      pages: ["Haru -\n\nDinner's in the fridge.\nLock the door.\nDon't open it for anyone.\nI'll be home before midnight. Promise.\n\n- Mom\n\nP.S. Happy birthday, my big ten-year-old."],
    },
    letter_1: {
      name: 'Letter from Mom (1)', note: true, icon: 'icon_letter', desc: 'A birthday card from Mom.',
      pages: ["December 9, 1958.\n\nTo Haru, on your birthday.\n\nTen years ago tonight you came out yelling, and you haven't stopped since. I'm on nights again, I'm sorry. This is so you're never scared of the dark while I'm gone.", "Batteries not included (your mother is hopeless): borrow the clock's till I'm home.\n\nThe hospital put the phone in for my shifts, so if you're frightened, call. I'll always pick up.\n\nLove, Mom"],
    },
    postcard: {
      name: "Mr. Ota's Postcard", note: true, icon: 'icon_postcard', desc: 'A postcard of a train station at dusk.',
      pages: ["Kiyo -\n\nThe 6:40 gets me into Hinata Station. Then the ten-minute walk past the bakery, and I'll be home before the kettle boils.\n\n- Kenji\n(Ota Kenji, Chairman, Hinata Heights Residents' Committee)"],
    },
    timetable: {
      name: 'Train Timetable', note: true, icon: 'icon_note', desc: "A timetable card from Mrs. Ota's entrance.",
      pages: ['HINATA LINE - EVENING ARRIVALS\n\n17:52   18:08   18:24\n(18:40)  <- circled in red\n18:56   19:12   19:28\n\nIn pencil, next to the circle: "+10 walk"'],
    },
    kids_note: {
      name: "Kids' Note", note: true, icon: 'icon_note', desc: 'Found in a picture book in 403.',
      pages: ['PASSWORD = count our pictures!!\n(in order)\n\n- Taro and Jiro\n\nP.S. dont tell'],
    },
    stair_note: {
      name: 'Scribbled Note', note: true, icon: 'icon_note', desc: 'Found in the toy safe.',
      pages: ["we took the scary man's stair key hehe\n\nnow he cant go up and down\n\n- the Tanabe brothers"],
    },
    crayon_drawing: {
      name: 'Crayon Drawing', note: true, icon: 'icon_note', desc: 'Tama brought it back from 403.',
      pages: ["A crayon drawing: a small boy in striped pajamas, holding hands with a very, very tall grey man.\n\nThe man has no face. Just a white square where the mouth should be.\n\nUnder it, in careful letters: HARU."],
    },
  });
  G.RECIPES = G.RECIPES || [];
  G.RECIPES.push({
    needs: ['flashlight_dead', 'batteries'], gives: 'flashlight',
    text: '@haru Batteries in... Click!',
    then: function* (E) {
      E.set('playerLight', 92); E.set('playerLightCol', '#fff0c8'); E.set('p_lit');
      yield* E.say('@ A small warm circle of light.', '@haru:happy Thanks, Mom.');
    },
  });

  // ======================================================================
  // HINTS (the phone: "Call home: 404")
  // ======================================================================
  Object.assign(G.HINTS, {
    p_wait: [['@haru (Mom said to call only if it is an emergency. ...Maybe I should just look around the flat.)']],
    p_door: [['@haru (Someone is at the door. Mom has her own keys...)']],
    c1_find: function (E) {
      if (!E.flag('c1_tama') && !E.has('key_403')) {
        if (!E.has('fish_sausage')) return [['@mom Haru? Are you all right? ...You\'re out of the flat? Stay close to the walls.'], ['@mom A cat? Cats are always hungry, sweetheart. Is there anything in our fridge?'], ['@mom The fish sausage, Haru. My emergency dinner. Cats love those.']];
        return [['@mom A stray cat? Be gentle. Cats remember who feeds them.'], ['@mom She was sitting by 402, you said? Give her something to eat.']];
      }
      if (!E.has('key_403') && !E.has('key_stairs4')) return [['@mom Somebody always has a spare key, Haru.'], ['@mom 402 is empty, isn\'t it? Empty flats have holes in the walls. Small ones.'], ['@mom That cat of yours can fit where you can\'t. Show her the hole in 402.']];
      if (E.has('key_403') && !E.has('key_stairs4')) return [['@mom The Tanabe boys take everything that isn\'t nailed down.'], ['@mom Kids always hide passwords in plain sight. Look at their walls.'], ['@mom Count, sweetheart. Count what is in each drawing, in order.']];
      if (!E.has('ota_keyring')) return [['@mom The stairwell has two locks? Then you need two keys.'], ['@mom Mrs. Ota\'s husband ran the residents\' committee. Go and see her in 401.'], ['@mom The clocks stopped? Then set one for when Mr. Ota comes home. The train gets in at 6:40... and then he still has to walk.']];
      return [['@mom You have both keys? Then go, Haru. The stairs are at the end of the corridor.']];
    },
    c1_down: [['@mom Go down, Haru. Quietly. Keep moving.']],
    c1_clock: [['@mom Mr. Ota always comes home on the same train.'], ['@mom Read his postcard, and the timetable by her door.'], ['@mom The train gets in at 6:40. Then ten minutes of walking. What time is that?']],
    c1_safe: [['@mom The Tanabe boys love secrets.'], ['@mom Look at their drawings, Haru. Every one has a number in the corner.'], ['@mom Count what is in each drawing: cats, suns, people, stars. In order.']],
  });

  // ======================================================================
  // PROLOGUE: HOME (404)
  // ======================================================================
  const homeDark = (E) => (E.flag('powerOut') ? 0.8 : 0.25);
  G.START = { map: 'home_bed', x: 2, y: 5, dir: 'down' };

  G.MAPS.home_bed = {
    name: "Haru's Room", wall: 'cream', floor: { ',': 'tatami', '.': 'wood' },
    dark: homeDark, music: null, ambience: 'rain',
    lights: [{ x: 5, y: 2, r: 26, col: '#8090c0', glow: 0.15 }],
    entries: { from_main: [5, 7, 'up'] },
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
      { id: 'futon', x: 2, y: 4, h: 2, sprite: (E) => (E.flag('p_up') ? 'haru_futon_empty' : 'futon'), z: 'floor', solid: false,
        on: function* (E) {
          if (!E.flag('powerOut')) { yield* E.say('@haru My futon. Still warm.'); return; }
          if (E.flag('ch1_done')) { yield* E.say('@haru My futon. ...Not now. I have to find Mom.'); return; }
          // the secret ending: she did say to stay in your room
          yield* E.say('@haru I could get back in and pull the blanket over my head...', '@haru Mom said: stay in your room tonight. Whatever you hear.');
          const i = yield* E.ask('@ Get back into the futon?', ['Stay in your room', 'Not yet']);
          if (i !== 0) { yield* E.say('@haru:determined ...No. I have to find her.'); return; }
          E.pose('player', 'haru_futon');
          E.music(null);
          yield* E.wait(1.2);
          yield* E.fadeOut(2.0);
          yield* E.ending('stay');
        } },
      { id: 'yui_drawing', x: 1, y: 2, z: 'wall', sprite: 'yui_drawing',
        on: function* (E) {
          yield* E.say('@ A crayon drawing: a tall man with a camera, holding a little girl\'s hand. MY PAPA - YUI, 6.');
          if (!E.flag('p_yui')) { E.set('p_yui'); yield* E.say('@haru:confused I didn\'t draw this. ...Who\'s Yui?'); }
          else yield* E.say('@haru It\'s nice. Whoever drew it.');
        } },
      { id: 'window', x: 5, y: 2, z: 'wall', sprite: 'window_rain', text: ['@ Rain on the glass. The other buildings of Hinata Heights are dark.', '@haru Everyone\'s asleep. Except me.'] },
      { id: 'closet', x: 8, y: 1, w: 2, h: 2, z: 'wall', sprite: 'oshiire', text: ["@ The closet. Mom's futon is folded inside, the way she left it this morning.", '@haru She works nights at the hospital. She sleeps in the day. I hardly see her awake.'] },
      G.nightlightObj(11, 2, 'nightlight'),
      { id: 'desk', x: 5, y: 3, sprite: 'kids_desk', text: ['@ Haru\'s desk. A pencil case, a comic, a test with a red 100 on it.', '@haru I was going to show Mom tonight.'] },
      { id: 'toys', x: 10, y: 3, sprite: 'toy_box', text: ['@ A box of toys: a tin robot, a baseball, marbles.', '@haru Shota still owes me three marbles.'] },
      { id: 'exit', x: 5, y: 8, touch: true, solid: false, door: { to: 'home_main', entry: 'from_bed', dir: 'down', walk: true } },
    ],
    first: function* (E) {
      E.pose('player', 'haru_futon');
      E.chapter('December 9, 1958. 11:58 PM', 'Prologue');
      yield* E.wait(1.2);
      E.sfx('thunder'); E.flash('#c8c8e8', 0.3);
      yield* E.wait(0.8);
      yield* E.say('@haru:scared ...Mom?');
      E.pose('player', null); E.set('p_up');
      yield* E.say("@ Rain. Mom's futon is still folded in the corner.", '@haru She said she\'d be home before midnight.');
      E.goal("Mom said she'd be home by midnight.", 'p_wait');
    },
    update(E) {
      // the first step off the futon: a soft distant chime (the bed-exit sensor, in reality)
      if (E.flag('p_up') && !E.flag('p_chime') && !G.EV.busy) {
        const [x, y] = E.tile();
        if (x !== 2 || (y !== 4 && y !== 5)) {
          E.set('p_chime');
          G.EV.run(function* (E) { E.sfx('chime'); yield* E.wait(0.6); yield* E.say('@haru:confused ...A lift? We don\'t have a lift.'); });
        }
      }
    },
  };

  G.MAPS.home_main = {
    name: 'Home', wall: 'cream', floor: { ';': 'genkan', '-': 'linoleum', ',': 'tatami', '.': 'wood' },
    dark: homeDark, music: null, ambience: (E) => (E.flag('powerOut') ? 'rain' : 'hum'),
    lights: (E) => (E.flag('powerOut') ? [] : [{ x: 13, y: 5, r: 70, col: '#ffd8a0', glow: 0.2 }]),
    entries: { from_bed: [15, 3, 'down'], from_bath: [9, 3, 'down'], from_c4: [1, 3, 'down'] },
    tiles: [
      '####################',
      'WWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWW',
      ';;;;-------,,,,,,,,,',
      ';;;;-------,,,,,,,,,',
      '....-------,,,,,,,,,',
      '....-------,,,,,,,,,',
      '....,,,,,,,,,,,,,,,,',
      '....,,,,,,,,,,,,,,,,',
      '....,,,,,,,,,,,,,,,,',
      '####################',
    ],
    objects: [
      // the front door: closed (prologue), then open (leads to the corridor)
      { id: 'front_door', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', cond: (E) => !E.flag('doorOpen'),
        on: function* (E) {
          if (!E.flag('p_knock')) { yield* E.say("@haru Mom said lock the door. It's locked. And chained. Good."); return; }
          if (E.flag('p_dontOpen')) { yield* E.say('@ The phone is ringing.'); return; }
          let line = "@voice Haru? It's Mom. I'm home. Open the door.";
          for (;;) {
            const i = yield* E.ask(line, ['Open the door', 'Look through the peephole', "Don't open it"]);
            if (i === 0) {
              E.sfx('unlock'); yield* E.wait(0.4); E.sfx('door');
              yield* E.fadeOut(0.8);
              yield* E.ending('okaeri');
              return;
            }
            if (i === 1) {
              yield* E.picture('pic_peephole', { caption: 'The corridor. Rain. Nobody...' });
              E.sfx('keys');
              line = '@voice Haru? Why are you looking at me like that? Open the door.';
              continue;
            }
            break;
          }
          yield* E.say('@haru:scared (Mom has her own keys.)', '@haru:scared (Mom never knocks.)');
          yield* E.wait(1.0);
          yield* E.say('@voice Haru. ...It\'s late.');
          E.sfx('keys'); yield* E.wait(1.2); E.sfx('steps_away');
          yield* E.wait(1.5);
          E.set('p_dontOpen');
          E.setSprite('phone', 'phone_ring');
          E.sfx('ring');
          E.goal('The phone is ringing.', 'p_door');
        } },
      { id: 'front_open', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel_open', cond: (E) => !!E.flag('doorOpen'),
        door: { to: 'c4', entry: 'from_404', dir: 'down' } },
      { id: 'shoes', x: 0, y: 3, sprite: 'shoe_cabinet', text: ["@ The shoe cabinet. Mom's work shoes are gone. My school shoes are here.", '@haru I\'ll keep my slippers on. Shoes are for outside.'] },
      { id: 'genkan', x: 2, y: 3, sprite: 'genkan_step', z: 'floor', solid: false },
      { id: 'win_kitchen', x: 3, y: 2, z: 'wall', sprite: 'window_frosted', text: (E) => (E.flag('powerOut') ? ['@ Frosted glass. The corridor beyond is pitch dark.'] : ['@ Frosted glass onto the corridor. The corridor light makes it glow.']) },
      { id: 'fridge', x: 5, y: 3, sprite: 'fridge_small',
        on: function* (E) {
          if (!E.flag('p_note')) {
            E.set('p_note');
            yield* E.say('@ A note is stuck to the fridge with a magnet.');
            yield* E.give('note_fridge', { silent: true });
            yield* E.note('note_fridge');
            yield* E.say('@haru Dinner was rice and pickles. I ate it all. I locked the door. I didn\'t open it.', '@haru So now she just has to come home.');
          }
          if (!E.has('fish_sausage') && !E.flag('c1_tama')) {
            const t = yield* E.yesno("@ There's a fish sausage in the fridge. Mom's emergency dinner. Take it?");
            if (t) yield* E.give('fish_sausage');
          } else yield* E.say('@ The fridge hums. Pickles, milk, tomorrow\'s rice.');
        } },
      { id: 'sink', x: 6, y: 3, sprite: 'kitchen_sink', text: ['@ The dishes are washed. I did them myself.'] },
      { id: 'stove', x: 7, y: 3, sprite: 'gas_stove', text: ['@ The gas is off. Mom checks it twice before she leaves. Then a third time.'] },
      { id: 'counter', x: 8, y: 3, sprite: 'counter', text: ['@ The counter. A jar of plum pickles, a rice paddle.'] },
      { id: 'door_bath', x: 9, y: 1, h: 2, z: 'wall', sprite: 'door_wood', door: { to: 'home_bath', entry: 'from_main', dir: 'up' } },
      { id: 'pills', x: 11, y: 3, sprite: 'pill_box', text: ["@haru Mom's candy. One a day.", "@haru They don't taste like candy."] },
      { id: 'clock', x: 12, y: 2, z: 'wall', sprite: (E) => (E.flag('p_batt') ? 'clock_stopped' : 'wall_clock'),
        on: function* (E) {
          if (E.flag('p_batt')) { yield* E.say('@ The clock has stopped at 11:59.', '@haru:determined It isn\'t midnight. So she isn\'t late.'); return; }
          yield* E.say('@ 11:58. The second hand is very loud.');
          if (!E.has('flashlight_dead')) return;
          const ok = yield* E.yesno('@ Borrow the clock\'s batteries, like Mom wrote?');
          if (!ok) return;
          E.set('p_batt'); E.sfx('click');
          yield* E.say('@ The clock stops at 11:59.', '@haru:determined There. Now it isn\'t midnight. So she isn\'t late.');
          yield* E.give('batteries');
          yield* E.wait(0.8);
          E.sfx('bell');
          yield* E.say('@ Somewhere in the building, another clock strikes twelve.', '@haru:scared ...');
        } },
      { id: 'calendar', x: 14, y: 2, z: 'wall', sprite: 'calendar', text: ['@ The calendar: DECEMBER 1958. The 9th is circled in red: HARU 10!!', "@haru Today. My birthday. December 9th."] },
      { id: 'fusuma', x: 15, y: 1, w: 2, h: 2, z: 'wall', sprite: 'fusuma', door: { to: 'home_bed', entry: 'from_main', dir: 'down' }, sfx: 'slide' },
      { id: 'win_living', x: 18, y: 2, z: 'wall', sprite: 'window_rain', text: ['@ Rain. Far below, the courtyard swings move in the wind.'] },
      { id: 'phone', x: 18, y: 4, sprite: 'phone',
        on: function* (E) {
          if (E.flag('p_dontOpen') && !E.flag('powerOut')) {
            E.setSprite('phone', 'phone');
            yield* E.say('@ Haru picks up the phone.');
            E.sfx('static');
            yield* E.say("@mom Haru? It's me. Listen. Stay in your room tonight, okay? Whatever you hear.", "@mom ...I'm coming. I'll be there in the morning. I--");
            E.sfx('static');
            yield* E.say('@ The line goes dead.');
            yield* E.wait(0.6);
            E.set('powerOut'); E.sfx('click');
            E.music(null);
            yield* E.say('@ The lights die.');
            yield* E.wait(1.0);
            E.sfx('unlock');
            yield* E.say('@ Somewhere, a lock turns.');
            E.sfx('creak');
            E.set('doorOpen');
            yield* E.wait(0.8);
            yield* E.say('@ The front door swings open by itself. The chain hangs loose.', '@haru:scared Mom...?');
            yield* E.wait(0.5);
            E.chapter('Chapter 1: The Fourth Floor', 'Ch.1 4F');
            E.goal('Find Mom. Get out of the building.', 'c1_find');
            return;
          }
          if (!E.flag('powerOut')) { yield* E.say('@haru Mom said only call if it\'s an emergency.', '@haru ...Is a clock an emergency?'); return; }
          const i = yield* E.ask('@ A black rotary phone. Your fingers know one number by heart.', ['Call home (404)', 'Leave it'], { cancel: 1 });
          if (i === 0) yield* G.callHome(E);
        } },
      { id: 'kotatsu', x: 13, y: 6, w: 2, h: 2, sprite: 'kotatsu',
        on: function* (E) {
          if (!E.flag('p_gift')) {
            yield* E.say('@ A present on the kotatsu, wrapped in newspaper. The card says: TO HARU - OPEN AT MIDNIGHT.', "@haru It's nearly midnight. ...Close enough.");
            E.sfx('paper');
            E.set('p_gift');
            yield* E.say("@ Inside: Mom's little red keychain flashlight. And a card.");
            yield* E.give('flashlight_dead');
            yield* E.give('letter_1', { silent: true });
            yield* E.note('letter_1');
            yield* E.say('@haru She\'ll be home soon. ...Soon.', '@haru (Borrow the clock\'s batteries... okay, Mom.)');
            return;
          }
          yield* E.say('@ The kotatsu is cold. Mom turns it off to save money when she\'s not home.');
        } },
      { id: 'gift', x: 13, y: 6, sprite: 'sparkle', z: 'over', solid: false, cond: (E) => !E.flag('p_gift') },
      { id: 'zabuton1', x: 12, y: 7, sprite: 'zabuton', z: 'floor', solid: false },
      { id: 'zabuton2', x: 15, y: 6, sprite: 'zabuton', z: 'floor', solid: false },
      { id: 'heater', x: 19, y: 8, sprite: 'heater', text: ['@ The kerosene heater. Mom says never, ever leave it on when you sleep.'] },
      { id: 'butsudan', x: 17, y: 3, sprite: 'butsudan', text: ['@ The family altar. A photo of Dad in his uniform. Two little candles, not lit.', '@haru I was four. I remember his laugh. ...I think I do.'] },
    ],
    enter: function* (E) {
      // the knock: when Haru has his light, someone comes to the door
      if (E.flag('p_lit') && !E.flag('p_knock')) {
        E.set('p_knock');
        yield* E.wait(0.8);
        for (let i = 0; i < 3; i++) { E.sfx('knock'); yield* E.wait(0.35); }
        yield* E.wait(0.5);
        yield* E.say('@haru:shock !', "@haru:scared Someone's at the door.");
        E.goal('Someone is at the door.', 'p_door');
      }
    },
    update(E, dt) {
      const s = this._s || (this._s = { t: 0 });
      s.t += dt;
      if (E.flag('p_knock') && !E.flag('p_dontOpen') && s.t > 5) { s.t = 0; E.sfx('knock'); }
      if (E.flag('p_dontOpen') && !E.flag('powerOut') && s.t > 2.2) { s.t = 0; E.sfx('ring'); }
    },
  };

  G.MAPS.home_bath = {
    name: 'Bathroom', wall: 'tiles', floor: { '.': 'tile_white' },
    dark: homeDark, ambience: 'rain',
    entries: { from_main: [4, 6, 'up'] },
    tiles: [
      '#########',
      'WWWWWWWWW',
      'WWWWWWWWW',
      '.........',
      '.........',
      '.........',
      '.........',
      '####.####',
    ],
    objects: [
      { id: 'tub', x: 1, y: 3, w: 2, sprite: 'bath_tub', text: ['@ The bath, with its lid on. The water is cold.', '@ In the black water under the lid, for a second, two wrinkled hands... no. Just my hands.'] },
      { id: 'mirror', x: 6, y: 2, z: 'wall', sprite: 'mirror_small' },
      { id: 'basin', x: 6, y: 3, sprite: 'washbasin',
        on: function* (E) {
          yield* E.say('@ The washbasin. Two toothbrushes: a big one and a small one. A little mirror above it.');
          if (!E.flag('p_mirror')) {
            E.set('p_mirror');
            yield* E.glimpse('pic_mirror_old', { time: 0.2, sfx: 'static' });
            yield* E.say('@haru:shock ...Huh?', '@haru Must be the steam.');
            return;
          }
          yield* E.say('@ Haru in the mirror. Ten years old, messy hair, striped pajamas.', '@haru ...Right?');
        } },
      { id: 'towel', x: 4, y: 2, z: 'wall', sprite: 'paper', text: ['@ A towel on a hook. It smells like Mom\'s soap.'] },
      { id: 'exit', x: 4, y: 7, touch: true, solid: false, door: { to: 'home_main', entry: 'from_bath', dir: 'down', walk: true } },
    ],
  };

  // ======================================================================
  // CHAPTER 1: THE FOURTH FLOOR
  // ======================================================================
  // registry chases (see docs/CONTENT_GUIDE.md)
  G.CHASES.c1 = {
    char: 'caretaker', at: [11, 3], speed: 54, delay: 1.0, follow: true, followDelay: 1.6, timer: 20, loseAfterHide: 5.5, cause: 'caretaker',
    onEnd: function* (E) { E.set('chase1_done'); E.goal('Go down the stairs.', 'c1_down'); },
  };
  G.CHASES.c1_403 = {
    char: 'caretaker', at: [1, 4], speed: 52, delay: 1.2, follow: true, followDelay: 1.6, timer: 14, loseAfterHide: 5.5, cause: 'caretaker',
  };

  const tube = (id, x) => ({ id: id, x: x, y: 1, z: 'wall', sprite: 'fluoro', light: { r: 46, col: '#c8e0f0', glow: 0.18, flicker: true, dy: 8 },
    cond: (E) => !E.flag('c4_dark_' + id), text: ['@ A fluorescent tube, buzzing. It flickers like it\'s trying to remember how.'] });

  G.MAPS.c4 = {
    name: 'Fourth Floor', location: 'Hinata Heights - 4F', wall: 'danchi', floor: { '.': 'corridor' },
    dark: 0.55, rain: 'rail', ambience: 'rain', music: null,
    lights: [{ x: 2, y: 2, r: 34, col: '#40ff80', glow: 0.25 }],
    entries: { from_404: [31, 3, 'down'], from_401: [7, 3, 'down'], from_402: [17, 3, 'down'], from_403: [23, 3, 'down'], from_stair4: [2, 3, 'down'] },
    tiles: [
      '########################################',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      '........................................',
      '........................................',
      '........................................',
      'RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR',
    ],
    objects: [
      { id: 'stairdoor', x: 2, y: 1, h: 2, z: 'wall', latch: true,
        sprite: (E) => (E.flag('c4_stairsOpen') ? 'door_stairs' : 'door_stairs_chained'),
        door: { to: 'stair4', entry: 'from_c4', dir: 'down' },
        lock: (E) => E.has('key_stairs4') && E.has('ota_keyring'),
        lockText: (E) => {
          if (E.has('key_stairs4')) return ['@ The padlock opens... but the little brass lock on the chain won\'t.', '@haru RESIDENTS\' COMMITTEE. Somebody on this floor must have that key.'];
          if (E.has('ota_keyring')) return ['@ The little brass lock clicks open... but the big padlock won\'t.', '@haru 4F STAIRS. That key is somewhere else.'];
          return ['@ Two locks. A big padlock with a tag: 4F STAIRS.', "@ And a little brass lock on the chain: RESIDENTS' COMMITTEE - EMERGENCY USE ONLY.", '@haru The way down. And it\'s locked twice.'];
        },
        unlockText: '@ The padlock opens. The brass lock opens. The chain slides off.',
        before: function* (E) {
          if (E.flag('chase1_done') || E.flag('c4_chase1')) return true;
          E.set('c4_stairsOpen'); E.set('c4_chase1'); E.set('ch1_done');
          if (E.flag('follower') === 'tama') { E.sfx('chirp'); E.bubbleNow('follower', '!', 1.2); }
          yield* E.wait(0.5);
          E.sfx('ding');
          E.setSprite('lift', 'elevator_open');
          yield* E.say('@ Behind Haru, the lift says DING.');
          yield* E.wait(0.4);
          yield* E.say("@caretaker It's late. Back to bed now.");
          E.chase('c1');
          return true;
        } },
      { id: 'notice', x: 4, y: 2, w: 2, z: 'wall', sprite: 'notice_board', text: ["@ RESIDENTS' SAFETY: NO STAIRS AFTER 11 PM.", '@ HINATA HEIGHTS RESIDENTS\' COMMITTEE - CHAIRMAN: OTA K.'] },
      tube('t1', 6),
      G.aptDoor('401', 7, 1, 'a401', 'from_c4', null, { door: { to: 'a401', entry: 'from_c4', dir: 'down' } }),
      { id: 'win401', x: 8, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ Mrs. Ota\'s kitchen window. A warm light behind the frosted glass. A kettle shape.'] },
      { id: 'lift', x: 11, y: 1, w: 2, h: 2, z: 'wall', sprite: 'elevator',
        text: (E) => (E.flag('chase1_done') ? ['@ The lift doors are shut. The little lamp above them is dark.'] : ['@ OUT OF ORDER.', "@haru We don't have a lift. We've never had a lift."]) },
      tube('t2', 14),
      { id: 'plant', x: 15, y: 3, sprite: 'plant_pot', text: ['@ Mrs. Ota\'s rubber plant. She talks to it in the mornings.'] },
      G.aptDoor('402', 17, 1, 'a402', null, null, { door: { to: 'a402', entry: 'from_c4', dir: 'down' } }),
      { id: 'win402', x: 18, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ 402\'s window. Dark. Nobody has lived there since summer.'] },
      tube('t3', 20),
      G.aptDoor('403', 23, 1, 'a403', null, null, { door: { to: 'a403', entry: 'from_c4', dir: 'down' }, lock: 'key_403', lockText: ["@ Locked. The Tanabe brothers' flat. TARO & JIRO is written on the door in crayon.", '@haru They always have the best toys. And they never share.'], unlockText: '@ The little bell jingles. The key turns.' }),
      { id: 'win403', x: 24, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ The Tanabe brothers\' window. Paper stars stuck to the glass from inside.'] },
      tube('t4', 27),
      { id: 'umbrellas', x: 29, y: 3, sprite: 'umbrella_stand', text: ["@ Mom's umbrella is missing. She took it. Good."] },
      G.aptDoor('404', 31, 1, 'home_main', null, null, { door: { to: 'home_main', entry: 'from_c4', dir: 'down' }, latch: true }),
      { id: 'card404', x: 30, y: 2, z: 'wall', sprite: 'name_card', text: ['@ The name card by our door: AOKI. Printed, in a little plastic holder.', '@haru Since when do we have a printed one? Ours is the old white one with the chip in it.'] },
      { id: 'win404', x: 32, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ Our kitchen window. Dark now.'] },
      G.nightlightObj(33, 2, 'nightlight'),
      tube('t5', 35),
      { id: 'bike', x: 36, y: 3, w: 2, sprite: 'bicycle', text: ["@ Mr. Tanabe's bicycle. The bell is rusty. I'm not allowed to ring it."] },
      { id: 'bags', x: 39, y: 3, sprite: 'trash_bags', text: ['@ Garbage for tomorrow. Burnable on Tuesdays.'] },
      // Tama, at 402's door
      { id: 'tama_npc', x: 17, y: 4, char: 'tama', dir: 'up', cond: (E) => !E.flag('c1_tama'),
        on: function* (E) {
          if (!E.has('fish_sausage')) {
            E.sfx('meow');
            yield* E.say('@ A scruffy grey cat with a torn ear. She keeps meowing at 402\'s door.', '@ When Haru reaches out, she backs away.', '@haru You\'re hungry, huh. Me too.');
            return;
          }
          E.take('fish_sausage');
          yield* E.say('@haru Here. Happy birthday to me.');
          E.sfx('meow');
          yield* E.say('@ The cat eats the whole fish sausage, plastic and all... no, she spits the plastic out. Smart.', '@ She purrs and rubs against Haru\'s slippers.', '@haru I\'ll call you Tama. ...You can come with me, if you want.');
          E.set('c1_tama'); E.set('follower', 'tama');
          yield* E.say('@ Tama follows.');
        } },
      // walking past the lift with Tama: the first warning
      { id: 'lift_scare', x: 10, y: 3, w: 4, h: 3, touch: function* (E) {
          if (E.flag('follower') !== 'tama' || E.flag('c1_liftScare') || E.chasing()) return;
          E.set('c1_liftScare');
          E.sfx('chirp'); E.bubbleNow('follower', '!', 1.4);
          yield* E.say('@ Tama stops. Her ears go forward. She stares at the lift.', '@haru Tama? What do you hear?');
          E.sfx('ding');
          E.setSprite('lift', 'elevator_open');
          yield* E.wait(0.6);
          yield* E.say('@ The lift doors slide open a hand\'s width. Darkness inside.');
          E.sfx('keys');
          yield* E.wait(0.9);
          yield* E.say('@caretaker ...Aoki-san.');
          yield* E.wait(0.4);
          E.setSprite('lift', 'elevator');
          E.sfx('thud', 0.4);
          yield* E.say('@ The doors close.', '@haru:confused He knows my name.', "@haru:annoyed ...Mister? I'm ten.");
        }, solid: false },
    ],
    first: function* (E) {
      // the tubes go out one by one toward the lift; the lift counts down
      yield* E.wait(0.6);
      for (const id of ['t5', 't4', 't3', 't2']) { E.set('c4_dark_' + id); E.sfx('click'); yield* E.wait(0.45); }
      yield* E.wait(0.3);
      E.sfx('ding');
      yield* E.say('@ Above the lift, a little lamp lights up: 4.');
      for (const n of ['3', '2', '1', 'B']) { yield* E.wait(0.7); E.sfx('ding'); E.location(n); }
      yield* E.wait(0.6);
      yield* E.say('@haru:confused Since when is there a lift here?');
      E.sfx('meow');
      yield* E.say('@ Somewhere along the corridor, a cat is meowing.');
    },
    update(E, dt) {
      // 4F sound landmark: Mrs. Ota's clocks, out of sync (in sync once her husband is "home")
      const s = this._s || (this._s = { t: 0, n: 0 });
      s.t -= dt;
      if (s.t <= 0 && !E.chasing()) {
        s.n++;
        if (E.flag('c1_ota')) { s.t = 1.0; if (s.n % 2) E.sfx('clock'); }
        else { s.t = 0.6 + ((s.n * 7) % 5) * 0.17; if (s.n % 3 === 0) E.sfx('clock'); }
      }
    },
  };

  G.MAPS.stair4 = {
    name: 'Stairwell 4F', wall: 'concrete', floor: { '.': 'concrete' },
    dark: 0.6, ambience: 'wind',
    lights: [{ x: 5, y: 2, r: 40, col: '#40ff80', glow: 0.3 }, { x: 8, y: 4, r: 34, col: '#e8f0ff', glow: 0.15 }],
    entries: { from_c4: [5, 3, 'down'], from_3f: [8, 5, 'down'] },
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
      { id: 'door_c4', x: 5, y: 1, h: 2, z: 'wall', sprite: 'door_stairs', latch: true, door: { to: 'c4', entry: 'from_stair4', dir: 'down' } },
      { id: 'floorsign', x: 3, y: 1, w: 2, z: 'wall', sprite: 'sign_floor_4f' },
      { id: 'up', x: 1, y: 3, w: 2, sprite: 'stairs_up', text: ['@ The stairs up to the roof. The roof door is chained shut.', "@haru Good. I don't want to go up. I want to go DOWN."] },
      { id: 'sign_up', x: 1, y: 1, z: 'wall', sprite: 'sign_up_roof', w: 2 },
      { id: 'sign_down', x: 7, y: 2, w: 2, z: 'wall', sprite: 'sign_down_3f' },
      { id: 'down', x: 7, y: 3, w: 2, h: 2, sprite: 'stairs_down2', z: 'floor', touch: true, solid: false, stairs: true, door: { to: 'stair3', entry: 'from_4f', dir: 'down', walk: true } },
      { id: 'cupboard', x: 1, y: 6, sprite: 'wardrobe', hide: true, hidePrompt: '@ A cleaning cupboard. Mops and buckets... and just enough room. Hide inside?', hideSprite: 'wardrobe_open' },
      { id: 'mop', x: 9, y: 6, sprite: 'mop_bucket', text: ['@ A mop and a bucket. The water in it is still warm.'] },
    ],
    first: function* (E) {
      if (E.chasing()) return;
      yield* E.say('@haru The stairs down are right there. 3F.');
    },
  };

  // ---------------- 401: Mrs. Ota ----------------
  G.MAPS.a401 = {
    name: '401 - Ota', wall: 'plaster', floor: { ';': 'genkan', ',': 'tatami' },
    dark: (E) => (E.flag('ota_tea') ? 0.55 : 0.35), music: null, ambience: 'hum',
    lights: [{ x: 6, y: 5, r: 60, col: '#ffc080', glow: 0.25 }],
    entries: { from_c4: [1, 3, 'down'] },
    tiles: [
      '##############',
      'WWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWW',
      ';;;,,,,,,,,,,,',
      ';;;,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      '##############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c4', entry: 'from_401', dir: 'down' } },
      { id: 'timetable', x: 2, y: 2, z: 'wall', sprite: 'timetable',
        on: function* (E) {
          if (!E.has('timetable')) yield* E.give('timetable', { silent: true });
          yield* E.note('timetable');
          yield* E.say('@haru 18:40 is twenty to seven. And then "+10 walk".');
        } },
      { id: 'shoes', x: 0, y: 3, sprite: 'shoe_cabinet', text: ['@ Two pairs of slippers. A small lavender pair. A big brown pair that nobody has worn in a long time.'] },
      { id: 'win', x: 4, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ The kitchen window. Mrs. Ota keeps a little paper crane on the sill.'] },
      { id: 'fridge', x: 5, y: 3, sprite: 'fridge_small', text: ['@ Two of everything. Two bowls of potato salad. Two plums.'] },
      { id: 'sink', x: 6, y: 3, sprite: 'kitchen_sink', text: ['@ Two teacups, washed and drying.'] },
      { id: 'stove', x: 7, y: 3, sprite: (E) => (E.flag('c1_ota') ? 'kettle_steam' : 'gas_stove'), text: (E) => (E.flag('c1_ota') ? ['@ The kettle is singing softly.'] : ['@ A kettle on the stove, full and cold. Waiting.']) },
      { id: 'cuckoo', x: 9, y: 2, z: 'wall', sprite: 'cuckoo_clock', text: (E) => (E.flag('c1_ota') ? ['@ The cuckoo clock is ticking again.'] : ['@ A cuckoo clock. Stopped at 11:59. The little bird is stuck halfway out.']) },
      { id: 'tv', x: 10, y: 3, sprite: 'tv_crt', text: ['@haru:happy A television! Mrs. Ota has a TELEVISION.', '@ It\'s off. A doily on top, and a photo of a man with a moustache.'] },
      { id: 'pendulum', x: 11, y: 2, z: 'wall', sprite: 'wall_clock',
        on: function* (E) {
          if (E.flag('c1_ota')) { yield* E.say('@ 6:50. The pendulum swings. Tick. Tock.'); return; }
          if (!E.flag('c1_metOta')) { yield* E.say('@ A pendulum clock. Stopped at 11:59, like all the others.'); return; }
          yield* E.say(E.has('postcard') ? '@haru The train gets in at 6:40... and then he walks.' : '@ A pendulum clock, stopped at 11:59. The hands can be moved.');
          E.goal('Set Mrs. Ota\'s clock for when Mr. Ota gets home.', 'c1_clock');
          const r = yield* E.clock({ title: 'Wall clock', h: 11, m: 55 });
          if (!r) return;
          if (r.h % 12 === 6 && r.m === 50) {
            E.set('c1_ota');
            E.sfx('clock');
            yield* E.say('@ The pendulum starts to swing. Tick. Tock. In the other room, the cuckoo clock wakes up too.');
            yield* E.wait(0.6);
            E.sfx('kettle');
            yield* E.say('@ On the stove, the kettle begins to whistle.');
            E.face('ota', 'down');
            yield* E.say('@ota:happy There. That\'s the 6:40. Kenji always says the kettle knows before I do.', "@ota Kenji was chairman of the residents' committee, you know. He never went anywhere without these.", "@ota Take them, dear. He'd want them used.");
            yield* E.give('ota_keyring');
            E.goal('Find Mom. Get out of the building.', 'c1_find');
            yield* otaTea(E);
          } else if (r.h % 12 === 6 && r.m === 40) {
            yield* E.say('@ota The 6:40 gets into the station then, dear. He still has to walk.');
          } else {
            yield* E.say('@ota Not yet, dear. The kettle isn\'t even warm.');
          }
        } },
      { id: 'dresser', x: 12, y: 3, sprite: 'dresser',
        on: function* (E) {
          if (!E.has('postcard')) {
            yield* E.say('@ On the dresser: a postcard of a train station at dusk, propped against a vase.');
            yield* E.give('postcard', { silent: true });
            yield* E.note('postcard');
            yield* E.say('@haru The 6:40. Then ten minutes of walking.');
            return;
          }
          yield* E.say('@ The vase holds dried chrysanthemums. Very old ones.');
        } },
      { id: 'mantel', x: 13, y: 3, sprite: 'mantel_clock', text: (E) => (E.flag('c1_ota') ? ['@ The little clock ticks along with the others now.'] : ['@ A small clock on a cabinet. 11:59.']) },
      { id: 'butsudan', x: 0, y: 6, sprite: 'butsudan', text: ['@ A small family altar. A photo of a smiling man with a moustache. A fresh stick of incense.', '@haru:confused Is that... Mr. Ota?'] },
      { id: 'table', x: 6, y: 6, w: 2, sprite: 'chabudai', text: ['@ The low table is set for two. Two cups. Two pairs of chopsticks.'] },
      { id: 'ota', x: 6, y: 5, char: 'ota', dir: 'down', cond: (E) => !E.flag('ota_tea'),
        on: function* (E) {
          if (!E.flag('c1_ota')) {
            yield* E.say('@ota My husband\'s train is late. He\'s never late.', '@ota The clocks all stopped. Now he won\'t know when to come home.');
            return;
          }
          yield* otaTea(E);
        } },
      { id: 'cushion', x: 7, y: 7, sprite: 'zabuton', z: 'floor', solid: false, text: ['@ An empty cushion. Kenji\'s place.'] },
      { id: 'sleeping', x: 11, y: 6, h: 2, sprite: 'futon_lump', z: 'floor', cond: (E) => !!E.flag('ota_tea'), text: ['@ Mrs. Ota is asleep, breathing slow and soft. She\'s smiling a little.'] },
      G.phoneObj(13, 7, { id: 'phone' }),
      { id: 'heater', x: 2, y: 8, sprite: 'heater', light: { r: 30, col: '#ff8040', glow: 0.3, flicker: true }, text: ['@ A kerosene heater, glowing. It\'s warm in here. Warmer than anywhere.'] },
    ],
    first: function* (E) {
      E.set('c1_metOta');
      yield* E.say('@ota Kenji? Oh. You\'re the Aoki boy. Come in, come in, you\'ll catch cold.', '@haru:sad Good evening, Mrs. Ota. Excuse me. Have you seen my mom?', "@ota Your mother? At the hospital, dear, like every night. She's a good girl, your mother.", "@ota My husband's train is late. He's never late.", '@ota The clocks all stopped. Now he won\'t know when to come home.');
    },
  };
  // the tea: a true-ending act. Offered after her puzzle and on every visit until accepted.
  function* otaTea(E) {
    const i = yield* E.ask('@ota Sit, dear. Drink his while it\'s hot.', ['Sit with her', 'I have to go']);
    if (i !== 0) { yield* E.say("@ota Come back for your tea. I'm always home."); return; }
    E.music(null);
    yield* E.fadeOut(0.8);
    yield* E.say('@ Haru sits on the empty cushion. The tea is too hot, then just right.');
    yield* E.wait(1.0);
    E.sfx('kettle');
    yield* E.say('@ Rain on the window. The clocks tick together. Nobody says anything for a while.', '@ It is the first time tonight that Haru is not afraid.');
    yield* E.fadeIn(0.8);
    yield* E.say("@ota You have kind hands. ...Old hands. Like Kenji's.", '@haru:confused (Old?)', '@ota I think I can sleep now.');
    E.set('ota_tea');
    yield* E.say('@ Mrs. Ota lies down on her futon and closes her eyes.');
  }

  // ---------------- 402: empty ----------------
  G.MAPS.a402 = {
    name: '402', wall: 'dirty', floor: { ';': 'genkan', ',': 'tatami' },
    dark: 0.75, ambience: 'wind',
    entries: { from_c4: [1, 3, 'down'] },
    tiles: [
      '############',
      'WWWWWWWWWWWW',
      'WWWWWWWWWWWW',
      ';;,,,,,,,,,,',
      ',,,,,,,,,,,,',
      ',,,,,,,,,,,,',
      ',,,,,,,,,,,,',
      ',,,,,,,,,,,,',
      '############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c4', entry: 'from_402', dir: 'down' } },
      { id: 'win', x: 3, y: 2, z: 'wall', sprite: 'window_frosted', text: ['@ The glass is cracked. Cold air comes through.'] },
      { id: 'closet', x: 5, y: 1, w: 2, h: 2, z: 'wall', sprite: 'fusuma', hide: true, hideSprite: 'fusuma_open', hidePrompt: '@ An empty closet. Hide inside?' },
      { id: 'boxes', x: 8, y: 3, sprite: 'boxes_stack', text: ['@ Moving boxes, taped shut. KITCHEN. BOOKS. WINTER.', '@haru Somebody never finished moving in. Or out.'] },
      { id: 'boxes2', x: 1, y: 7, sprite: 'boxes_stack', text: ['@ More boxes. One is open: photo albums, all empty.'] },
      { id: 'hole', x: 10, y: 2, z: 'wall', sprite: 'hole_wall',
        on: function* (E) {
          if (E.has('key_403') || E.flag('c1_fetch')) { yield* E.say('@ The hole into 403. Just cat-sized.'); return; }
          yield* E.say('@ A ragged hole low in the wall, about the size of a cat.');
          E.sfx('bell');
          yield* E.say("@ Something jingles on the other side. A little bell? The hole goes into 403... too small for me.");
          if (E.flag('follower') !== 'tama') return;
          yield* E.say('@haru Tama. Can you get it? The jingly thing?');
          E.set('c1_fetch');
          E.followerOut();
          yield* E.moveTo('follower', 10, 3, 50);
          E.face('follower', 'up');
          yield* E.wait(0.3);
          E.hide('follower');
          E.sfx('meow');
          yield* E.say('@ Tama squeezes through the hole and is gone.');
          yield* E.wait(1.0);
          yield* E.say('@ On the other side, the sound of crayons scribbling... stops.');
          yield* E.wait(0.6);
          E.sfx('laugh');
          yield* E.say('@ A child giggles. Very close to the wall.', '@haru:scared ...Tama?');
          yield* E.wait(1.0);
          E.sfx('bell');
          E.show('follower');
          yield* E.say('@ Tama wriggles back through the hole with a key on a bell keychain in her mouth. And a piece of paper.');
          yield* E.followerIn(50);
          yield* E.say('@haru:happy Good girl!');
          yield* E.give('key_403');
          yield* E.give('crayon_drawing', { silent: true });
          yield* E.note('crayon_drawing');
          yield* E.say('@haru:scared ...Who draws stuff like this?');
        } },
    ],
  };

  // ---------------- 403: the Tanabe brothers ----------------
  const drawings = [
    ['drawing1', '1. our cats', 'Three cats: a fat one, a thin one, a tiny one.'],
    ['drawing2', '2. sunny day', 'One big yellow sun with a smiling face.'],
    ['drawing3', '3. our family', 'Four people holding hands: Mom, Dad, Taro, Jiro.'],
    ['drawing4', '4. night sky', 'A dark blue sky with seven stars. Somebody counted them very carefully.'],
  ];
  G.MAPS.a403 = {
    name: '403 - Tanabe', wall: 'cream', floor: { ';': 'genkan', ',': 'tatami' },
    dark: 0.6, ambience: 'hum',
    lights: [{ x: 5, y: 3, r: 36, col: '#ffe0a0', glow: 0.2 }],
    entries: { from_c4: [1, 3, 'down'] },
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
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', latch: true, door: { to: 'c4', entry: 'from_403', dir: 'down' } },
      { id: 'win', x: 3, y: 2, z: 'wall', sprite: (E) => (E.flag('c1_shadow') ? 'window_frosted_shadow' : 'window_frosted'), text: ['@ Frosted glass onto the corridor. Paper stars stuck on it.'] },
      ...drawings.map(([id, cap, txt], i) => ({
        id: id, x: 6 + i, y: 2, z: 'wall', sprite: id,
        on: function* (E) { yield* E.picture('pic_drawings', { caption: cap }); yield* E.say('@ ' + txt); },
      })),
      { id: 'desk', x: 5, y: 3, sprite: 'kids_desk', light: { r: 30, col: '#ffe0a0', glow: 0.25, dy: -10 }, text: ['@ A desk with a lamp still on. Crayons everywhere. A half-finished drawing of a tall grey man.', '@haru:scared ...'] },
      { id: 'bunk', x: 11, y: 3, w: 2, h: 2, sprite: 'bunk_bed', text: ['@ A bunk bed. TARO on top, JIRO on the bottom. There\'s a dark gap underneath, just big enough for a kid.'] },
      { id: 'toys', x: 1, y: 7, sprite: 'toy_box', text: ['@ Toys. A tin robot exactly like mine. Exactly like mine. Even the dent.'] },
      { id: 'book', x: 7, y: 6, sprite: 'picture_book', z: 'floor', solid: false,
        on: function* (E) {
          if (!E.has('kids_note')) {
            yield* E.say('@ A picture book about a cat who goes to the moon. A note falls out.');
            yield* E.give('kids_note', { silent: true });
            yield* E.note('kids_note');
            E.goal('Open the Tanabe brothers\' toy safe.', 'c1_safe');
            return;
          }
          yield* E.say('@ The cat on the moon is lonely. On the last page, it comes home.');
        } },
      { id: 'safe', x: 10, y: 7, sprite: (E) => (E.flag('c1_safe') ? 'toy_safe_open' : 'toy_safe'),
        on: function* (E) {
          if (E.flag('c1_safe')) { yield* E.say('@ The toy safe is open and empty.'); return; }
          yield* E.say('@ A red tin toy safe with four dials. Each dial has a sticker: a cat, a sun, a person, a star.');
          E.goal('Open the Tanabe brothers\' toy safe.', 'c1_safe');
          const c = yield* E.code({ len: 4, title: 'Toy safe' });
          if (c === null) return;
          if (c !== '3147') {
            E.sfx('locked');
            if (c[0] === '3') yield* E.say('@ The cat dial clicks. The rest don\'t.');
            else yield* E.say('@ Nothing. The safe rattles like it\'s laughing.');
            return;
          }
          E.set('c1_safe'); E.sfx('unlock');
          yield* E.say('@ Click-click-click-click. The little door swings open.', '@ Inside: a heavy key with a tag, 4F STAIRS. And a scribbled note.');
          yield* E.give('key_stairs4');
          yield* E.give('stair_note', { silent: true });
          yield* E.note('stair_note');
          yield* hideScene(E);
        } },
    ],
  };
  // taking the stair key: someone comes. The hiding lesson.
  function* hideScene(E) {
    const ex = G.EX;
    E.set('c1_hideScene');
    if (E.flag('follower') === 'tama') { E.sfx('chirp'); E.bubbleNow('follower', '!', 1.4); yield* E.say('@ Tama freezes, ears forward, staring at the door.'); }
    E.sfx('keys'); yield* E.wait(0.8); E.sfx('thud', 0.4); yield* E.wait(0.5); E.sfx('keys');
    E.set('c1_shadow');
    yield* E.say('@ Keys. Footsteps in the corridor, coming closer. A tall shadow slides across the frosted glass.');
    const ok = yield* E.yesno('@haru:scared Someone\'s coming. Hide under the bunk bed?');
    if (!ok) {
      yield* E.say('@haru:scared No... I have to get out!');
      E.unset('c1_shadow');
      E.chase('c1_403');
      return;
    }
    // scripted: Haru hides, the Caretaker looks in and leaves
    yield* E.fadeOut(0.25);
    ex.p.x = 11 * G.TS + 8; ex.p.y = 5 * G.TS + 12; ex.p.dir = 'up';
    E.sfx('closet');
    ex.p.hidden = true;
    yield* E.fadeIn(0.25);
    E.unset('c1_shadow');
    yield* E.wait(0.8);
    E.sfx('door');
    E.spawn({ id: 'ct', char: 'caretaker', x: 1, y: 3, dir: 'down' });
    yield* E.wait(0.6);
    yield* E.moveTo('ct', 9, 6, 32);
    E.face('ct', 'right');
    E.sfx('heartbeat', 0.6); yield* E.wait(1.0); E.sfx('heartbeat', 0.6); yield* E.wait(1.0); E.sfx('heartbeat', 0.6);
    yield* E.wait(0.8);
    yield* E.say("@caretaker Mr... Aoki? ...It's late.");
    yield* E.wait(0.8);
    yield* E.moveTo('ct', 1, 3, 34);
    E.sfx('door');
    E.despawn('ct');
    yield* E.wait(0.6);
    E.sfx('steps_away');
    yield* E.wait(1.0);
    ex.p.hidden = false;
    E.sfx('closet');
    yield* E.say("@haru:scared (He's looking for someone. ...Not me. Right?)", '@haru:determined The stairs. I have the stair key now. If I can open that second lock...');
    E.goal('Find Mom. Get out of the building.', 'c1_find');
  }

  // ======================================================================
  // TEST ROUTE (tools/walkthrough.js ch1)
  // ======================================================================
  G.WALKTHROUGH = G.WALKTHROUGH || {};
  // the secret ending: answer the phone, then go back to bed
  G.WALKTHROUGH.ending_stay = [
    { start: { map: 'home_main', x: 'from_bed', items: ['flashlight'], flags: { p_up: true, p_chime: true, p_lit: true, p_knock: true, p_dontOpen: true, p_gift: true, p_note: true, '@visited:home_main': true, '@visited:home_bed': true } } },
    { use: 'phone' },
    { expect: { flags: ['powerOut'] } },
    { door: 'fusuma' },
    { use: 'futon', choose: [0] },
    { expect: { ending: 'stay' } },
  ];
  G.WALKTHROUGH.ch1 = [
    { expect: { map: 'home_bed' } },
    { walkTo: [3, 5] },
    { use: 'yui_drawing' },
    { door: 'exit' },
    { expect: { map: 'home_main' } },
    { use: 'fridge', choose: [0] },
    { expect: { has: ['fish_sausage'] } },
    { use: 'kotatsu' },
    { expect: { has: ['flashlight_dead'] } },
    { use: 'clock', choose: [0] },
    { expect: { has: ['flashlight'], flags: ['p_lit'] } },
    { door: 'door_bath' },
    { use: 'basin' },
    { door: 'exit' },
    { expect: { flags: ['p_knock'] } },
    { use: 'front_door', choose: [1, 2] },
    { expect: { flags: ['p_dontOpen'] } },
    { use: 'phone' },
    { expect: { flags: ['powerOut', 'doorOpen'], goal: 'c1_find' } },
    { door: 'front_open' },
    { expect: { map: 'c4' } },
    { door: 'door_401' },
    { use: 'dresser' },
    { use: 'timetable' },
    { use: 'pendulum' },
    { answer: { h: 6, m: 50 }, choose: [0] },
    { expect: { has: ['ota_keyring'], flags: ['ota_tea'] } },
    { door: 'exit' },
    { use: 'tama_npc' },
    { expect: { flags: ['c1_tama'] } },
    { walkTo: [11, 4] },
    { expect: { flags: ['c1_liftScare'] } },
    { door: 'door_402' },
    { use: 'hole' },
    { expect: { has: ['key_403'] } },
    { door: 'exit' },
    { door: 'door_403' },
    { use: 'book' },
    { use: 'safe' },
    { answer: '3147', choose: [0] },
    { expect: { has: ['key_stairs4'] } },
    { door: 'exit' },
    { door: 'stairdoor' },
    { expect: { map: 'stair4' } },
    { escape: [{ latch: 'door_c4' }, { hide: 'cupboard' }] },
    { expect: { flags: ['chase1_done'] } },
    { door: 'down' },
    { expect: { map: 'stair3' } },
  ];
})(window.G);
