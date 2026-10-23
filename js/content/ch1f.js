// NOBODY HOME: Chapter 3b (the ground floor) and the Finale. See docs/design.md.
(function (G) {
  'use strict';
  const TS = G.TS;

  // ======================================================================
  // ITEMS AND DOCUMENTS
  // ======================================================================
  Object.assign(G.ITEMS, {
    keeper_key: { name: 'Caretaker Key', desc: 'A heavy key on a tag: B1 - CARETAKER.', icon: 'icon_keeper_key' },
    cap: { name: "Shota's Cap", desc: 'A blue baseball cap, soaked. Shota lost it in the sandbox.', icon: 'icon_cap' },
    basement_key: { name: 'Basement Key', desc: 'A key on a tag: B1. Fished out of the drain with a magnet.', icon: 'icon_basement_key' },
    wire_cutters: { name: 'Wire Cutters', desc: 'Snips. For wire.', icon: 'icon_wire_cutters' },
    clipboard: {
      name: 'Night List', note: true, icon: 'icon_note', desc: 'A clipboard from the office desk.',
      pages: ['NIGHT LIST - 2F / 3F / 4F\n\n401 OTA K. - waits at the window, 6:40.\n301 KURODA S. - lounge piano: lid locked 22:00.\n302 ISHIDA S. - check the cupboards.', "404 AOKI H. - 71 - wanders at night - tries the FRONT DOOR: keep the key locked up - daughter Yui: call any hour.\n\nNIGHT STAFF: SATO"],
    },
    notice_rules: {
      name: "Residents' Rules", note: true, icon: 'icon_note', desc: 'From the lobby notice board.',
      pages: ["HINATA HEIGHTS - RESIDENTS' RULES\n\n1. No going out after 9 PM.\n2. Answer the night staff.\n3. Lights out at 10.\n\nNIGHT STAFF ON DUTY: SATO"],
    },
    letter_4: {
      name: 'Letter from Mom (4)', note: true, icon: 'icon_letter', desc: 'Taped under the swing seat, wrapped in plastic.',
      pages: ["February 1980.\n\nShe's here. Yui. Your ears and your temper.\n\nDon't you dare work nights now, Haru. I know what it costs a child.\n\n- Mom (Grandma!)"],
    },
  });

  // ======================================================================
  // HINTS
  // ======================================================================
  Object.assign(G.HINTS, {
    c1f_office: [["@mom You're on the ground floor? Good. Find a way out of that room."], ['@mom Somebody keeps the keys locked up in there. The code is written somewhere.'], ['@mom Mirrors flip things, Haru. Read the numbers the other way round.']],
    c1f_out: function (E) {
      if (!E.has('cap') && !E.flag('tama_taken')) return [['@mom The front doors are chained? Then the key is somewhere in that building.'], ['@mom The tag said the staff board. Downstairs. ...Is there a way down from the yard?'], ['@mom You found a key in the cake, didn\'t you? YARD.']];
      return [['@mom The tag said the staff board. Downstairs.']];
    },
    c1f_tama: [['@mom Where\'s that cat of yours?'], ['@mom Downstairs, Haru. The B1 door is in the stairwell. But you need its key.'], ['@mom There\'s a key in the drain by the slide. Shota fishes things out of that drain.']],
    c1f_b1: [['@mom The B1 door is in the stairwell, Haru.'], ['@mom Use the key from the drain.']],
    fin_go: [['@mom Go up to the lobby, Haru. The ground floor. Quickly.'], ['@mom The front doors in the lobby. Your key opens the chain.']],
    fin_phone: function (E) {
      if (!E.flag('fin_unlocked')) return [['@mom The front doors, Haru. In the lobby. Your key opens the chain.']];
      return [['@mom Answer the phone, Haru.']];
    },
  });

  // ======================================================================
  // OFFICE (the nurse station)
  // ======================================================================
  G.MAPS.office = {
    name: 'Office', wall: 'white', floor: { '.': 'linoleum', ',': 'concrete' },
    dark: 0.7, ambience: 'hum', rain: 'rail',
    lights: [{ x: 7, y: 4, r: 40, col: '#e8f0ff', glow: 0.2 }],
    entries: { from_hatch: [11, 6, 'up'], from_lobby: [1, 3, 'down'] },
    tiles: [
      '##############',
      'WWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWW',
      '..............',
      '..............',
      '..............',
      ',,,,,,,,,,,,,,',
      ',,,,,,,,,,,,,,',
      'RRRRRRRRRRRRRR',
    ],
    objects: [
      { id: 'door_lobby', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', door: { to: 'lobby', entry: 'from_office', dir: 'down' },
        before: function* (E) {
          if (!E.flag('c1f_officeOpen')) { E.set('c1f_officeOpen'); E.sfx('unlock'); yield* E.say('@ Locked... from this side. There\'s a latch. Click.'); }
          return true;
        } },
      { id: 'files', x: 3, y: 3, sprite: 'filing_cabinet', text: ['@ Files, alphabetical. A-I. J-O. P-Z. Every folder has a photo clipped to it. Old faces.'] },
      { id: 'cabinet', x: 4, y: 3, sprite: 'cabinet',
        on: function* (E) {
          if (E.flag('c1f_cabinet')) { yield* E.say('@ The key cabinet is open and nearly empty.'); return; }
          yield* E.say('@ A key cabinet with a keypad: CODE ON THE BOARD.');
          E.goal('Open the key cabinet.', 'c1f_office');
          const c = yield* E.code({ len: 4, title: 'Key cabinet' });
          if (c === null) return;
          if (c === '2473') { E.sfx('locked'); yield* E.say('@ Click. No.', '@haru:confused ...Mirrors flip things, don\'t they?'); return; }
          if (c !== '3742') { E.sfx('locked'); yield* E.say('@ The keypad blinks red.'); return; }
          E.set('c1f_cabinet'); E.sfx('unlock');
          yield* E.say('@ The cabinet clicks open. Most of the hooks are empty. On one: a heavy key, B1 - CARETAKER.');
          yield* E.give('keeper_key');
          E.goal('Get out. The front doors are in the lobby.', 'c1f_out');
        } },
      { id: 'desk', x: 6, y: 4, w: 2, sprite: 'office_desk',
        on: function* (E) {
          if (!E.has('clipboard')) {
            yield* E.say('@ A steel desk. A clipboard with a list of names.');
            yield* E.give('clipboard', { silent: true });
            yield* E.note('clipboard');
            yield* E.say('@haru:confused Seventy-one? ...That\'s a mistake.', '@haru And who\'s Sato?');
            return;
          }
          yield* E.say('@ Papers. A mug that says WORLD\'S OKAYEST NURSE. A box of masks.');
        } },
      G.phoneObj(8, 4, { id: 'phone' }),
      { id: 'monitor', x: 9, y: 3, sprite: 'crt_monitor',
        on: function* (E) {
          if (!E.flag('c1f_monitor')) {
            E.set('c1f_monitor');
            yield* E.picture('pic_monitor', { caption: 'LOBBY - CAM 1' });
            yield* E.say('@haru:shock !');
            E.face('player', 'down');
            E.sfx('sting', 0.5);
            yield* E.wait(0.6);
            yield* E.say('@ Haru spins around. Nothing. On the screen, the lobby is empty again.');
            return;
          }
          yield* E.say('@ A security screen. The lobby, grey and grainy. Nobody there.');
        } },
      { id: 'mirror', x: 12, y: 2, z: 'wall', sprite: 'mirror',
        on: function* (E) {
          yield* E.glimpse('pic_whiteboard_mirror', { time: 0.45, sfx: 'static' });
          if (!E.flag('c1f_mirror')) { E.set('c1f_mirror'); yield* E.say('@ For a moment the mirror shows a different room: a whiteboard, a yellow sticky note with numbers.', '@haru The numbers in the mirror look... backwards.'); return; }
          yield* E.say('@ The sticky note again. 2473, back to front. Like mirror writing.');
        } },
      { id: 'ladder', x: 12, y: 6, sprite: 'ladder_up',
        on: function* (E) { const ok = yield* E.yesno('@ The ladder up to 202\'s balcony. Climb up?'); if (ok) yield* E.goto('a202', 'from_office', null, 'up', { sfx: 'stairs' }); } },
    ],
    first: function* (E) {
      E.chapter('Chapter 3: The Ground Floor', 'Ch.3 1F');
      yield* E.say('@ The ladder ends on a narrow balcony, and a window that opens into an office.', '@haru:confused An office? We don\'t have an office.');
      E.goal('Find a way out of the office.', 'c1f_office');
    },
  };

  // ======================================================================
  // LOBBY (and the finale)
  // ======================================================================
  G.MAPS.lobby = {
    name: 'Lobby', location: 'Hinata Heights - Lobby', wall: 'danchi', floor: { '.': 'terrazzo' },
    dark: (E) => (E.flag('fin_dark') ? 0.75 : 0.45), ambience: 'rain', music: null,
    lights: (E) => (E.flag('fin_dark') ? [] : [{ x: 21, y: 3, r: 30, col: '#ff6060', glow: 0.3 }]),
    entries: { from_office: [18, 3, 'down'], from_stair1: [1, 3, 'down'], from_yard: [12, 8, 'up'], from_bikes: [22, 3, 'down'] },
    tiles: [
      '########################',
      'WWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWW',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '........................',
      '############.###########',
    ],
    objects: [
      { id: 'door_stair1', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_stairs', latch: true, door: { to: 'stair1', entry: 'from_lobby', dir: 'down' } },
      { id: 'mailboxes', x: 4, y: 2, w: 2, z: 'wall', sprite: 'mailboxes', text: ['@ Mailboxes. 404 - AOKI: a printed card in a plastic holder.', '@ Inside ours: a postcard with no stamp. "See you in the morning, Dad. Y."'] },
      G.nightlightObj(7, 2, 'nightlight'),
      { id: 'front', x: 11, y: 1, w: 2, h: 2, z: 'wall', sprite: (E) => (E.flag('fin_unlocked') ? 'door_glass2' : 'door_glass2_chained'),
        on: function* (E) { yield* frontDoors(E); } },
      { id: 'notice', x: 14, y: 2, w: 2, z: 'wall', sprite: 'notice_board',
        on: function* (E) {
          if (!E.has('notice_rules')) yield* E.give('notice_rules', { silent: true });
          yield* E.note('notice_rules');
          yield* E.say('@haru Sato. Again.');
        } },
      { id: 'door_office', x: 18, y: 1, h: 2, z: 'wall', sprite: 'door_steel', door: { to: 'office', entry: 'from_lobby', dir: 'down' } },
      { id: 'phonelamp', x: 21, y: 2, z: 'wall', sprite: 'phone_booth_light' },
      { id: 'payphone', x: 21, y: 3, sprite: 'payphone', on: function* (E) { yield* payphone(E); } },
      { id: 'door_bikes', x: 23, y: 1, h: 2, z: 'wall', sprite: 'door_steel', door: { to: 'bikes', entry: 'from_lobby', dir: 'down' } },
      { id: 'bench', x: 4, y: 6, w: 2, sprite: (E) => (E.flag('shota_bench') ? 'bench' : 'bench_cardigan'),
        text: (E) => (E.flag('shota_bench') ? ['@ The lobby bench.'] : ['@ A bench. Someone left an old brown cardigan folded on it.']) },
      { id: 'shota', x: 4, y: 5, char: 'shota', dir: 'up', cond: (E) => !!E.flag('shota_bench'),
        on: function* (E) { yield* shotaBench(E); } },
      { id: 'plant', x: 9, y: 3, sprite: 'plant_pot', text: ['@ A big potted plant. Plastic. Dusty.'] },
      { id: 'plant2', x: 14, y: 3, sprite: 'plant_pot', text: ['@ Another plastic plant.'] },
      { id: 'yard', x: 12, y: 9, touch: true, solid: false, lock: 'gate_key',
        lockText: ['@ The door to the courtyard. Locked. A tag: YARD.'], unlockText: '@ The YARD key turns. The door to the courtyard opens. Rain.',
        door: { to: 'yard', entry: 'from_lobby', dir: 'down', walk: true } },
    ],
    first: function* (E) {
      E.sfx('sting', 0.5);
      yield* E.wait(0.5);
      yield* E.say('@ The lobby. Rain against the glass doors. A red public phone, humming.', '@haru The stairwell door... it\'s open now. From this side.');
      E.set('stairsOpen');
      yield* E.say('@haru:determined Out. The front doors. I can find Mom outside.');
      E.goal('Get out. The front doors are in the lobby.', 'c1f_out');
    },
    enter: function* (E) {
      if (E.flag('chase4_done') && E.has('front_key') && !E.flag('fin_rested')) {
        E.set('fin_rested');
        yield* E.say('@haru:scared (He\'s gone. For now.)', '@haru:determined (The front key. Finally.)');
        E.goal('Open the front doors.', 'fin_phone');
      }
    },
    update(E, dt) {
      const s = this._s || (this._s = { t: 0, wait: 0 });
      // the 1F sound landmark: the payphone's hum; in the finale, the ringing
      if (E.flag('fin_ringing')) {
        s.t -= dt;
        if (s.t <= 0) { s.t = 2; E.sfx('ring'); }
        if (!G.EV.busy) { s.wait += dt; if (s.wait > 20) { s.wait = 0; G.EV.run(function* (E) { yield* letItRing(E); }); } }
      } else s.wait = 0;
    },
  };

  // ---- Shota on the bench ----
  function* shotaBench(E) {
    if (E.flag('helped_shota')) { yield* E.say('@shota_cap Tomorrow, Haru. Same place.'); return; }
    if (!E.has('cap')) { yield* E.say('@ Shota sits on the bench, facing the wall.', '@shota It\'s cold without my cap.'); return; }
    E.take('cap');
    E.set('helped_shota');
    E.setChar('shota', 'shota_cap'); E.face('shota', 'down');
    yield* E.say('@shota_cap My cap! Always in that sandbox.');
    yield* E.wait(0.5);
    yield* E.say('@shota_cap ...Hey, Haru. You got old.', '@haru:confused What?', '@shota_cap Nothing. Same Haru. Same ears. Play tomorrow?', '@haru Yeah. Tomorrow.');
    yield* E.say('@ For the first time, Shota stays where he is.');
  }

  // ---- the finale ----
  function* frontDoors(E) {
    if (!E.has('front_key')) {
      yield* E.say('@ The front doors. A heavy chain and a padlock. A tag: FRONT - KEY ON THE STAFF BOARD (B1).');
      return;
    }
    if (!E.flag('fin_unlocked')) {
      E.sfx('unlock');
      yield* E.say('@ The front key turns. The padlock opens. The chain slides off and hits the floor.');
      E.set('fin_unlocked');
      yield* E.wait(0.8);
      E.set('fin_ringing');
      E.sfx('ring');
      yield* E.say('@ Before Haru can push the doors, the red phone starts to ring.');
      E.goal('The phone is ringing.', 'fin_phone');
      return;
    }
    if (!E.flag('fin_ringing')) { E.set('fin_ringing'); E.sfx('ring'); yield* E.say('@ The phone starts ringing again.'); }
    const leave = yield* E.yesno('@ The phone keeps ringing. Leave anyway?');
    if (!leave) return;
    yield* runOut(E);
  }
  function* runOut(E) {
    E.unset('fin_ringing');
    E.sfx('door');
    yield* E.fadeOut(1.0);
    yield* E.ending('nobody_home');
  }
  function* payphone(E) {
    if (!E.flag('fin_ringing')) {
      const i = yield* E.ask('@ A red public phone. It takes ten-yen coins... but the receiver hums. Your fingers know one number by heart.', ['Call home (404)', 'Leave it'], { cancel: 1 });
      if (i === 0) yield* G.callHome(E);
      return;
    }
    const i = yield* E.ask('@ The red phone is ringing.', ['Answer', 'Let it ring']);
    if (i === 1) { yield* letItRing(E); return; }
    E.unset('fin_ringing');
    const missing = G.trueEnd();
    if (!missing.length) { yield* trueEnding(E); return; }
    E.sfx('static');
    yield* E.say('@mom Haru? Oh, Haru. You\'re at the doors, aren\'t you.');
    const m = missing[0];
    if (m === 'letters') {
      const where = [['letter_2', 'One is in the laundry, in the pocket of that old cardigan.'], ['letter_3', 'One is on the table in our old flat.'], ['letter_4', 'One is under the swing in the yard. You always sat there.'], ['letter_5', 'The last one is with your old things, downstairs. Your birthday keeps it safe.']];
      const w = where.find(([id]) => !E.notesCount(id));
      yield* E.say('@mom Did you read everything I wrote you, Haru? All of it?', '@mom ' + (w ? w[1] : 'Read them again, sweetheart.'));
    } else if (m === 'ota_tea') yield* E.say("@mom Mrs. Ota's all alone up there. Did you have your tea with her?");
    else if (m === 'helped_shota') yield* E.say("@mom Your friend's still looking for something. He's waiting by the bench.");
    else yield* E.say("@mom Where's that cat of yours? You wouldn't leave her down there.");
    const c = yield* E.ask('@mom Will you go and look?', ["I'll go look", "I'm so tired, Mom"]);
    if (c === 0) { yield* E.say('@mom I\'ll be here. I\'m always here.'); E.goal('The phone is quiet. For now.', 'fin_phone'); return; }
    yield* caretakerArrives(E, false);
  }
  function* letItRing(E) {
    E.unset('fin_ringing');
    yield* caretakerArrives(E, G.trueEnd().length === 0);
  }
  // he walks in from the dark and stops two tiles away
  function* caretakerArrives(E, holdsPhone) {
    E.set('fin_dark');
    E.sfx('keys');
    yield* E.wait(1.0);
    E.spawn({ id: 'ct', char: 'caretaker', x: 1, y: 4, dir: 'right' });
    const [px, py] = E.tile();
    yield* E.moveTo('ct', Math.max(1, px - 2), py, 30);
    E.face('ct', 'right');
    if (holdsPhone) {
      yield* E.say('@ He walks past Haru to the ringing phone, lifts the receiver, and holds it out at arm\'s length. Head still bowed.', '@ He doesn\'t grab. He waits.');
      yield* trueEnding(E, true);
      return;
    }
    yield* E.say('@caretaker Shouldn\'t you answer that, Mr. Aoki? ...No?', '@ He hangs up the phone, gently. Then he holds out his hand.');
    const c = yield* E.ask('@caretaker It\'s late. Back to bed now.', ['Take his hand', 'Run']);
    if (c === 1) { yield* runOut(E); return; }
    yield* E.fadeOut(1.2);
    // two or more of the four acts of kindness: a gentler night
    yield* E.ending(4 - G.trueEnd().length >= 2 ? 'good_night' : 'lights_out');
  }
  function* trueEnding(E, already) {
    if (!already) {
      if (E.flag('follower') === 'tama') {
        E.sfx('chirp'); E.bubbleNow('follower', '!', 1.2);
        yield* E.say('@ Tama chirps and trots off into the dark.', '@haru:scared Tama, no!');
      }
      E.set('fin_dark');
      E.spawn({ id: 'ct', char: 'caretaker', x: 18, y: 3, dir: 'down' });
      yield* E.moveTo('ct', 20, 4, 30);
      E.face('ct', 'right');
      yield* E.say('@ The Caretaker steps into the light.');
      if (E.flag('tama_saved')) {
        E.spawn({ id: 'cat', char: 'tama', x: 20, y: 5, dir: 'left' });
        yield* E.say('@ Tama winds around his ankles, purring.');
        yield* E.bubble('cat', 'heart', 1.0);
      }
      yield* E.say('@ He lifts the receiver and holds it out at arm\'s length, head still bowed.', '@ He doesn\'t grab. He waits.');
    }
    E.music(null);
    yield* E.say('@ Haru takes the receiver.');
    E.sfx('static');
    yield* E.say("@yui Dad? ...Dad, it's me. It's Yui.", '@haru:confused Yui? ...Is Mom there?', "@yui No, Dad. Grandma's not coming. ...But I am. First train. I'll be there in the morning.", '@haru:sad She was late. On my birthday. She said midnight.');
    yield* E.say("@yui I know. She came home in the morning, didn't she? She always did.", "@yui ...I'm sorry I missed yours too. Happy birthday, Dad.", "@yui The desk keeps putting you through to me tonight. It's okay. I'm up.", '@yui Will you let Mr. Sato take you back to your room?');
    yield* E.picture('pic_hands_receiver');
    yield* E.say('@ Haru looks at the hand holding the phone. It is spotted, and thin, and old.', '@old_haru ...');
    E.set('knowsSato');
    E.music('ending');
    yield* E.say('@ The Caretaker hooks a finger in his white mask and pulls it down.');
    E.pose('ct', 'caretaker_face');
    yield* E.say('@ A young face. Tired. Kind. A name badge: SATO.', "@nurse Mr. Aoki. It's late. Let's get you back to bed.", '@old_haru You knocked.', "@nurse I always knock. It's your room.", '@old_haru My mother worked nights.', '@nurse I know. You tell me. She always came home in the morning, right?');
    const c = yield* E.ask('@ He holds out his hand.', ['Take his hand', 'Run']);
    if (c === 1) { yield* runOut(E); return; }
    yield* E.fadeOut(1.5);
    yield* E.say('@ For a moment the corridor has handrails. Every door has a photograph.');
    yield* E.picture('pic_dawn_1958');
    yield* E.say("@mom Tadaima, Haru. I'm so sorry I'm late. There was a fire by the station; they needed everyone.", '@haru:happy ...Okaeri.');
    yield* E.goto('reality', 'start', null, 'up', { checkpoint: false, fade: 1.2 });
  }

  // ======================================================================
  // STAIRWELL 1F, BIKE ROOM
  // ======================================================================
  G.MAPS.stair1 = {
    name: 'Stairwell 1F', wall: 'concrete', floor: { '.': 'concrete' },
    dark: 0.6, ambience: 'wind',
    lights: [{ x: 5, y: 2, r: 40, col: '#40ff80', glow: 0.3 }, { x: 8, y: 3, r: 30, col: '#ffb060', glow: 0.2 }],
    entries: { from_lobby: [5, 3, 'down'], from_2f: [2, 5, 'down'], from_b1: [8, 4, 'down'] },
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
      { id: 'door_lobby', x: 5, y: 1, h: 2, z: 'wall', sprite: 'door_stairs', latch: true, door: { to: 'lobby', entry: 'from_stair1', dir: 'down' } },
      { id: 'floorsign', x: 3, y: 1, w: 2, z: 'wall', sprite: 'sign_floor_1f' },
      { id: 'sign_up', x: 1, y: 1, w: 2, z: 'wall', sprite: 'sign_up_2f' },
      { id: 'up', x: 1, y: 3, w: 2, sprite: 'stairs_up', touch: true, solid: false, stairs: true, door: { to: 'stair2', entry: 'from_1f', dir: 'down', walk: true } },
      { id: 'sign_b1', x: 6, y: 1, w: 2, z: 'wall', sprite: 'sign_down_b1' },
      { id: 'b1door', x: 8, y: 1, h: 2, z: 'wall', sprite: 'door_basement', lock: 'basement_key', latch: true,
        lockText: ['@ A heavy rusted door. B1 - STAFF ONLY. Padlocked.', '@haru Tama is down there. I know it.'], unlockText: '@ The B1 key turns in the padlock.',
        door: { to: 'b1_hall', entry: 'from_1f', dir: 'down' } },
      { id: 'sign', x: 9, y: 2, z: 'wall', sprite: 'paper', text: ['@ A sign: B1 - BOILER - STORAGE - CARETAKER. Staff only.'] },
    ],
  };
  G.MAPS.bikes = {
    name: 'Bike Room', wall: 'concrete', floor: { '.': 'concrete' },
    dark: 0.75, ambience: 'rain',
    entries: { from_lobby: [1, 3, 'down'] },
    tiles: [
      '############',
      'WWWWWWWWWWWW',
      'WWWWWWWWWWWW',
      '............',
      '............',
      '............',
      '............',
      '############',
    ],
    objects: [
      { id: 'exit', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_steel', door: { to: 'lobby', entry: 'from_bikes', dir: 'down' } },
      { id: 'bike1', x: 3, y: 3, w: 2, sprite: 'bicycle', text: ['@ Bicycles in a row. A bell. A basket. A seat for a small child.'] },
      { id: 'bike2', x: 6, y: 3, w: 2, sprite: 'bicycle', text: ['@ A black delivery bicycle: OTA. The tyres are flat and the chain is rust.'] },
      { id: 'bike3', x: 3, y: 6, w: 2, sprite: 'bicycle', text: ['@ A small red bicycle with a name on the mudguard in marker: HARU.', '@haru That\'s mine. ...Why is it so small?'] },
      { id: 'toolbox', x: 10, y: 3, sprite: 'toolbox',
        on: function* (E) {
          if (!E.has('wire_cutters') && !E.flag('tama_saved')) { yield* E.say('@ A red toolbox, lid open. Spanners, a pump, a roll of tape. And wire cutters.'); yield* E.give('wire_cutters'); yield* E.say('@haru Snips. For wire.'); return; }
          yield* E.say('@ Spanners, a pump, a roll of tape.');
        } },
      { id: 'bags', x: 10, y: 6, sprite: 'trash_bags', text: ['@ Garbage bags. Somebody threw away a whole box of birthday candles.'] },
    ],
  };

  // ======================================================================
  // THE YARD (courtyard)
  // ======================================================================
  G.CHASES.c3yard = {
    char: 'caretaker', at: [13, 3], speed: 58, delay: 1.0, follow: false, duration: 12, cause: 'caretaker', retry: { delay: 1.5 },
    onEnd: function* (E) {
      E.flash('#ffffff', 0.5); E.sfx('thunder');
      yield* E.wait(0.4);
      yield* E.say('@ Lightning. When the light comes back, he\'s gone.', '@haru:scared (Downstairs. That\'s where he took her.)');
      E.set('ch3_done');
      E.goal('Tama is somewhere downstairs. The B1 door is in the stairwell.', 'c1f_b1');
    },
  };
  // the playground block in the middle: walk around it (24 tiles) and he never catches up
  const fence = (x, y) => ({ id: 'fence_' + x + '_' + y, x: x, y: y, sprite: 'fence_low', text: ['@ A low green fence.'] });
  G.MAPS.yard = {
    name: 'Courtyard', location: 'Hinata Heights - Courtyard', wall: 'concrete', floor: { '.': 'concrete', ',': 'dirt', '"': 'grass' },
    dark: 0.6, rain: 'full', ambience: 'rain', floorSound: 'water',
    lights: [{ x: 13, y: 2, r: 40, col: '#ffe8c0', glow: 0.2 }],
    entries: { from_lobby: [13, 3, 'down'] },
    tiles: [
      '############################',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWWWWWWWWWWW',
      '............................',
      '..,,,,,,,,,,,,,,,,,,,,,,,,..',
      '..,,,,,,,,,,,,,,,,,,,,,,,,..',
      '..,,,,,,,,,,,,,,,,,,,,,,,,..',
      '..,,,,,,,,,,,,,,,,,,,,,,,,..',
      '..,,,,,,,,,,,,,,,,,,,,,,,,..',
      '..,,,,,,,,,,,,,,,,,,,,,,,,..',
      '..""""""""""""""""""""""""..',
      '..""""""""""""""""""""""""..',
      '............................',
      '############################',
    ],
    objects: [
      { id: 'door_lobby', x: 13, y: 1, w: 2, h: 2, z: 'wall', sprite: 'door_glass2', door: { to: 'lobby', entry: 'from_yard', dir: 'up' },
        before: function* (E) {
          if (E.chasing()) { yield* E.say('@ He\'s standing in the doorway.'); return false; }
          return true;
        } },
      { id: 'swing', x: 4, y: 4, w: 2, h: 2, sprite: 'swing',
        on: function* (E) {
          if (!E.flag('tama_taken')) { yield* E.say('@ The swings, creaking in the wind. I used to swing so high Mom couldn\'t watch.'); return; }
          if (!E.notesCount('letter_4', 'found')) {
            E.music(null);
            yield* E.say('@ Haru sits on the swing. The rain soaks through his pajamas. He doesn\'t care.');
            yield* E.wait(2.0);
            yield* E.say('@haru:sad ...She was just a cat.', '@haru:sad She was just a stupid cat.');
            yield* E.wait(1.5);
            yield* E.say('@ Under the seat, his fingers find something taped there. Wrapped in plastic.');
            yield* E.give('letter_4', { silent: true });
            yield* E.note('letter_4');
            yield* E.say('@haru Yui. ...The drawing by my bed.', '@haru:determined Okay. Okay. Get up, Haru.');
            return;
          }
          yield* E.say('@ The swing. Still warm where he sat.');
        } },
      { id: 'slide', x: 11, y: 5, w: 2, h: 3, sprite: 'slide', text: ['@ The big concrete slide with the tube. We used to race down it.'] },
      fence(13, 5), fence(14, 5), fence(13, 6), fence(14, 6),
      { id: 'gym', x: 15, y: 5, w: 2, h: 2, sprite: 'jungle_gym', text: ['@ The climbing dome. Wet and cold.'] },
      fence(15, 7), fence(16, 7), fence(15, 8), fence(16, 8), fence(11, 8), fence(12, 8),
      { id: 'sandbox', x: 13, y: 7, w: 2, h: 2, sprite: 'sandbox',
        on: function* (E) {
          if (E.flag('tama_taken')) { yield* E.say('@ The sandbox. Little prints in the wet sand where Tama stood.'); return; }
          yield* E.say('@ The sandbox. A blue baseball cap lies half buried in the wet sand.', '@haru Shota\'s cap!');
          yield* E.give('cap');
          yield* tamaTaken(E);
        } },
      { id: 'drain', x: 10, y: 4, sprite: (E) => (E.has('basement_key') || E.flag('ch3_done') ? 'drain_grate' : 'drain_key'), z: 'floor', solid: false,
        on: function* (E) {
          if (E.has('basement_key') || E.flag('ch3_done')) { yield* E.say('@ The drain. Rainwater gurgling down into the dark.'); return; }
          yield* E.say('@ A drain grate beside the slide. Something glints below: a key on a tag. B1.', "@haru It's down in the drain. My arm's too short.");
          if (!E.has('fishing_rod')) { E.goal('Get the key out of the drain.', 'c1f_tama'); return; }
          yield* E.say('@haru Shota\'s magnet. ...Come on, come on.');
          E.sfx('click'); yield* E.wait(0.8);
          yield* E.say('@ Click. The magnet catches. Up comes the key.');
          yield* E.give('basement_key');
          // he comes for Haru: the lobby door bangs open, he stands in it
          E.sfx('door'); E.shake(3, 0.4);
          yield* E.say('@ Through the glass, the red light of the phone in the lobby goes out.', '@ The lobby door bangs open. He is standing in it.', "@caretaker Mr. Aoki... please.");
          E.chase('c3yard');
        } },
      { id: 'bench', x: 20, y: 4, w: 2, sprite: 'bench', text: ['@ A bench, soaked. Shota and I used to trade cards here.'] },
      { id: 'tree', x: 23, y: 7, w: 2, h: 2, sprite: 'tree', text: ['@ The old zelkova. It was smaller... wasn\'t it?'] },
      { id: 'puddle1', x: 7, y: 9, sprite: 'puddle', z: 'floor', solid: false },
      { id: 'puddle2', x: 19, y: 10, sprite: 'puddle', z: 'floor', solid: false },
    ],
    first: function* (E) {
      yield* E.wait(0.4);
      E.flash('#d8d8f0', 0.35); E.sfx('thunder');
      E.spawn({ id: 'figure', char: 'caretaker', x: 17, y: 9, dir: 'down', alpha: 0.85 });
      yield* E.wait(0.5);
      E.despawn('figure');
      if (E.flag('follower') === 'tama') { E.sfx('chirp'); E.bubbleNow('follower', '!', 1.2); }
      yield* E.say('@haru:scared Was someone... standing by the sandbox?');
      yield* E.wait(0.8);
      E.flash('#d8d8f0', 0.3); E.sfx('thunder');
      yield* E.say('@ Next flash: nobody.');
    },
  };
  function* tamaTaken(E) {
    if (E.flag('follower') !== 'tama') { E.set('tama_taken'); E.set('shota_bench'); return; }
    E.sfx('chirp');
    E.followerOut();
    E.bubbleNow('follower', '!', 1.5);
    yield* E.say('@ Tama freezes at the edge of the sandbox, ears forward, tail straight up.', '@haru Tama? What is it?');
    yield* E.wait(1.0);
    E.dark(0.9);
    E.spawn({ id: 'hand', char: 'caretaker', x: 15, y: 9, dir: 'left', alpha: 0.9 });
    E.sfx('sting');
    yield* E.wait(0.5);
    E.sfx('meow');
    E.despawn('follower');
    E.despawn('hand');
    E.dark(0.6);
    E.unset('follower');
    E.set('tama_taken'); E.set('shota_bench');
    yield* E.say('@ A huge grey hand out of the dark. A yowl. Then nothing.', '@haru:shock TAMA!');
    E.sfx('keys'); yield* E.wait(1.0); E.sfx('steps_away');
    yield* E.say('@ Keys, jingling away toward the lobby. Toward the stairs. Down.');
    E.goal('Get Tama back.', 'c1f_tama');
  }

  // ======================================================================
  // REALITY: 404 at sunrise (the true ending)
  // ======================================================================
  G.MAPS.reality = {
    name: 'Room 404', wall: 'white', floor: { '.': 'wood' },
    dark: 0, music: 'ending', ambience: null, follower: false,
    lights: [{ x: 6, y: 2, r: 90, col: '#ffd8a0', glow: 0.3 }],
    entries: { start: [6, 7, 'up'] },
    tiles: [
      '############',
      'WWWWWWWWWWWW',
      'WWWWWWWWWWWW',
      '............',
      '............',
      '............',
      '............',
      '............',
      '############',
    ],
    objects: [
      { id: 'window', x: 5, y: 1, w: 2, z: 'wall', sprite: 'window_sunrise' },
      { id: 'drawing', x: 3, y: 2, z: 'wall', sprite: 'yui_drawing' },
      { id: 'bed', x: 5, y: 3, w: 2, h: 3, sprite: 'old_haru_bed' },
      { id: 'cat', x: 7, y: 5, char: 'tama', dir: 'left', cond: (E) => !!E.flag('tama_saved') },
      { id: 'box', x: 9, y: 3, sprite: 'chest', text: ['@ A memory box.'] },
      { id: 'door', x: 1, y: 1, h: 2, z: 'wall', sprite: 'door_white' },
      { id: 'card', x: 2, y: 2, z: 'wall', sprite: 'name_card' },
    ],
    first: function* (E) {
      const ex = G.EX;
      ex.p.hidden = true; // Haru is in the bed now
      E.set('@playerChar', 'old_haru');
      yield* E.wait(1.5);
      yield* E.say('@ Morning. Room 404, Hinata Hills Care Residence.', '@ Sunlight on the blanket. The rain has stopped.');
      if (E.flag('tama_saved')) yield* E.say('@ A grey cat with a torn ear sleeps on the blanket.');
      yield* E.wait(1.0);
      yield* E.say("@nurse (outside the door) Long night. He sat with Mrs. Ota till her tea went cold. Got Mr. Kuroda playing again.", "@nurse And he found Mr. Ishida in the linen cupboard. I'd been looking for an hour.", '@yui (outside the door) That sounds like him.');
      E.sfx('knock'); yield* E.wait(0.5); E.sfx('knock');
      yield* E.say('@ A knock. This time, Haru isn\'t afraid.');
      E.sfx('door');
      E.spawn({ id: 'yui', char: 'yui', x: 1, y: 3, dir: 'down' });
      yield* E.moveTo('yui', 4, 5, 34);
      E.face('yui', 'right');
      yield* E.say("@yui Morning, Dad. ...Sorry I'm late.", '@ She has a bag of mikan, and a very small cake.', '@old_haru:happy Welcome home, Yui.', '@yui:happy ...You know me today.', '@old_haru I waited up.');
      yield* E.picture('pic_carepost');
      yield* E.ending('welcome_home');
    },
  };

  // ======================================================================
  // TEST ROUTES
  // ======================================================================
  const READ = (n) => Object.fromEntries(['letter_1', 'letter_2', 'letter_3', 'letter_4', 'letter_5'].slice(0, n).map((id) => ['@read:' + id, true]));
  const LETTERS = ['note_fridge', 'letter_1', 'letter_2', 'letter_3', 'letter_4', 'letter_5'];
  G.WALKTHROUGH = G.WALKTHROUGH || {};
  G.WALKTHROUGH.ch1f = [
    { start: { map: 'office', x: 'from_hatch', items: ['flashlight', 'photo_1977', 'fishing_rod', 'gate_key'], flags: Object.assign({ follower: 'tama', ch2_done: true, chase2_done: true, hatchOpen: true, ch3a_done: true, metaTitle: true, ota_tea: true }, READ(3)), notes: LETTERS.slice(0, 4) } },
    { use: 'desk' },
    { use: 'mirror' },
    { use: 'cabinet' },
    { answer: '2473' },
    { use: 'cabinet' },
    { answer: '3742' },
    { expect: { has: ['keeper_key'] } },
    { use: 'monitor' },
    { door: 'door_lobby' },
    { expect: { map: 'lobby', flags: ['stairsOpen'] } },
    { use: 'notice' },
    { door: 'door_bikes' },
    { use: 'toolbox' },
    { door: 'exit' },
    { walkTo: [12, 8] },
    { door: 'yard' },
    { expect: { map: 'yard' } },
    { use: 'sandbox' },
    { expect: { has: ['cap'], flags: ['tama_taken'], not: ['follower'] } },
    { use: 'swing' },
    { expect: { notes: 4 } },
    { use: 'drain' },
    { escape: [{ tile: [10, 9] }, { tile: [17, 9] }, { tile: [17, 4] }, { tile: [10, 4] }, { tile: [10, 9] }, { tile: [17, 9] }, { tile: [17, 4] }, { tile: [10, 4] }], max: 40 },
    { expect: { has: ['basement_key'], flags: ['ch3_done'] } },
    { door: 'door_lobby' },
    { use: 'shota' },
    { expect: { flags: ['helped_shota'] } },
    { door: 'door_stair1' },
    { door: 'b1door' },
    { expect: { map: 'b1_hall' } },
  ];
  const FIN = (extra) => ({ start: { map: 'lobby', x: 'from_stair1', items: ['flashlight', 'front_key'], flags: Object.assign({ stairsOpen: true, chase4_done: true, ch3_done: true, '@visited:lobby': true }, extra || {}), notes: LETTERS } });
  G.WALKTHROUGH.finale_true = [
    FIN(Object.assign({ tama_saved: true, follower: 'tama', ota_tea: true, helped_shota: true, shota_bench: true }, READ(5))),
    { use: 'front' }, { expect: { flags: ['fin_ringing'] } },
    { use: 'payphone', choose: [0, 0] },
    { expect: { ending: 'welcome_home' } },
  ];
  G.WALKTHROUGH.finale_leave = [FIN(READ(5)), { use: 'front' }, { use: 'front', choose: [0] }, { expect: { ending: 'nobody_home' } }];
  G.WALKTHROUGH.finale_normal = [
    FIN(READ(2)), { use: 'front' }, { use: 'payphone', choose: [0, 1, 0] }, { expect: { ending: 'lights_out' } },
  ];
  G.WALKTHROUGH.finale_good = [
    FIN(Object.assign({ ota_tea: true, helped_shota: true, shota_bench: true }, READ(4))), { use: 'front' }, { use: 'payphone', choose: [0, 1, 0] }, { expect: { ending: 'good_night' } },
  ];
  G.WALKTHROUGH.finale_wait = [
    FIN(Object.assign({ tama_saved: true, ota_tea: true, helped_shota: true, shota_bench: true }, READ(5))),
    { use: 'front' }, { wait: 24, choose: [0] }, { expect: { ending: 'welcome_home' } },
  ];
})(window.G);
