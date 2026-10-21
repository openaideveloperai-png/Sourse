// Engine test scenario (temporary): exercises doors, locks, items, notes,
// code lock, piano, hiding and a chase.
(function (G) {
  'use strict';
  // placeholder characters from the old kid sprites
  G.defChar('kid', () => ({ down: G.KID.down, up: G.KID.up, left: G.KID.left }));
  G.defChar('shade', () => {
    const tint = (f) => {
      const cv = document.createElement('canvas'); cv.width = f.w; cv.height = f.h;
      const x = cv.getContext('2d'); x.drawImage(f.c, 0, 0);
      x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(20,10,40,0.85)'; x.fillRect(0, 0, f.w, f.h);
      return { c: cv, ax: f.ax, ay: f.ay, w: f.w, h: f.h };
    };
    return { down: G.KID.down.map(tint), up: G.KID.up.map(tint), left: G.KID.left.map(tint) };
  });
  G.PLAYER_CHAR = 'kid';
  G.SPEAKERS.kid = { name: 'Kid', color: '#9fc8ff', blip: 560, portrait: (f) => G.KID.portrait(f) };
  G.ITEMS.brass_key = { name: 'Brass Key', desc: 'A small brass key. The tag says "study".' };
  G.ITEMS.diary = { name: 'Torn Diary Page', note: true, pages: ['Day 12.\nThe piano only plays the old song now.\nE, D, C, D, E, E, E.\n\nThe safe in the study wants the year she was born. 1987.'] };
  G.DEATHS = { monster: 'It caught you.' };
  G.ENDINGS = { test: { title: 'TEST ENDING', lines: ['The house is quiet.', 'For now.'] } };

  G.MAPS.hall = {
    name: 'Hallway', floor: { '.': 'wood', ',': 'carpet_red' }, wall: 'green', dark: 0.55, music: 'house', ambience: 'house',
    tiles: [
      '##################',
      'WWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWW',
      '..,,,,,,,,,,,,,,..',
      '..,,,,,,,,,,,,,,..',
      '..................',
      '##################',
    ],
    objects: [
      { id: 'door_bed', x: 3, y: 1, h: 2, sprite: 'door', z: 'wall', door: { to: 'bedroom', x: 4, y: 7, dir: 'up' } },
      { id: 'door_study', x: 13, y: 1, h: 2, sprite: 'door_red', z: 'wall', door: { to: 'study', x: 5, y: 7, dir: 'up' }, lock: 'brass_key', lockText: "@ It's locked. There's a small keyhole." },
      { id: 'clock', x: 8, y: 3, sprite: 'clock', on: function* (E) { yield* E.say('@ The clock ticks loudly.'); } },
      { id: 'painting', x: 6, y: 1, sprite: 'painting_portrait', z: 'wall', on: function* (E) { yield* E.say('@kid:scared Its eyes follow me...'); } },
      { id: 'win', x: 10, y: 1, sprite: 'window', z: 'wall' },
      { id: 'cand', x: 16, y: 3, sprite: 'candelabra', light: { r: 44, col: '#ffb040', flicker: true } },
      { id: 'save', x: 1, y: 3, sprite: 'candle', light: { r: 30, col: '#c890ff' }, on: function* (E) { yield* E.save(); } },
    ],
    first: function* (E) { E.chapter('TEST HOUSE'); yield* E.say('@kid:neutral Where am I?'); },
  };
  G.MAPS.bedroom = {
    name: 'Bedroom', floor: { '.': 'darkwood', ',': 'carpet_blue' }, wall: 'blue', dark: 0.6, music: 'house',
    tiles: [
      '##########',
      'WWWWWWWWWW',
      'WWWWWWWWWW',
      '.........#',
      '..,,,,,..#',
      '..,,,,,..#',
      '.........#',
      '####.#####',
    ],
    objects: [
      { id: 'bed', x: 1, y: 3, h: 2, sprite: 'bed' },
      { id: 'ward', x: 7, y: 3, sprite: 'wardrobe', hide: true, hideSprite: 'wardrobe_open' },
      { id: 'desk', x: 3, y: 3, w: 2, sprite: 'desk', on: function* (E) {
        if (!E.has('brass_key')) { yield* E.say('@ There is a key in the drawer.'); yield* E.give('brass_key'); yield* E.give('diary'); E.set('gotKey'); }
        else yield* E.say('@ An empty drawer.');
      } },
      { id: 'mirror', x: 6, y: 2, sprite: 'mirror', z: 'wall', on: function* (E) { yield* E.say('@ For a moment, someone else looks back.'); } },
      { id: 'exit', x: 4, y: 7, touch: true, door: { to: 'hall', x: 3, y: 3, dir: 'down', walk: true } },
      { id: 'blood', x: 2, y: 6, sprite: 'blood', z: 'floor', solid: false },
    ],
  };
  G.MAPS.study = {
    name: 'Study', floor: { '.': 'parquet' }, wall: 'red', dark: 0.5,
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
      { id: 'shelf1', x: 1, y: 3, sprite: 'bookshelf' }, { id: 'shelf2', x: 2, y: 3, sprite: 'bookshelf_messy' },
      { id: 'piano', x: 7, y: 3, w: 2, sprite: 'piano', on: function* (E) {
        const s = yield* E.piano({ title: 'The old piano', max: 7 });
        if (s.join('') === 'EDCDEEE') { E.sfx('solve'); yield* E.say('@ Something clicks inside the wall.'); E.set('pianoDone'); }
      } },
      { id: 'safe', x: 10, y: 3, sprite: 'safe', on: function* (E) {
        if (E.flag('safeOpen')) { yield* E.say('@ Empty.'); return; }
        const c = yield* E.code({ len: 4, title: 'Safe' });
        if (c === '1987') { E.set('safeOpen'); E.sfx('unlock'); yield* E.say('@ The safe opens. Inside: nothing but a lock of hair.', '@ Then the lights go out.'); E.dark(0.9); E.chase({ char: 'shade', speed: 56, at: [1, 6], follow: true, cause: 'monster' }); }
        else if (c !== null) { E.sfx('locked'); yield* E.say('@ Wrong.'); }
      } },
      { id: 'fire', x: 4, y: 3, w: 2, sprite: 'fireplace', light: { r: 60, col: '#ff8a3a', flicker: true } },
      { id: 'exit', x: 5, y: 7, h: 1, touch: true, door: { to: 'hall', x: 13, y: 3, dir: 'down', walk: true } },
    ],
  };
  G.GAME = {
    boot() { G.KID.build(); },
    newGame() { const ex = new G.Explore(); ex.start('hall', 2, 4, 'down'); return ex; },
    titleDraw(c, t) { c.fillStyle = '#05030a'; c.fillRect(0, 0, G.W, G.H); G.text(c, 'ENGINE TEST', G.W / 2, 60, { align: 'center', scale: 3, color: '#c8b8d8' }); },
    scenes: {},
  };
})(window.G);
