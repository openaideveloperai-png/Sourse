// Nightlight Maker: what the editor knows about commands, conditions and object templates,
// plus the blank and sample projects. Pure data and small helpers (no DOM).
(function (G) {
  'use strict';
  const NL = (window.NL = window.NL || {});

  // ------------------------------------------------------------------ field types
  // text textarea number check select:a|b|c speaker item map entry:<mapField> sprite char
  // sfx music ambience flag dir color ending death chase common object portrait path code cond
  // Each command: {label, cat, fields: [[key, type, label, default]], branches, sum(c) -> string}
  const q = (s) => '"' + String(s || '').replace(/\s+/g, ' ').slice(0, 60) + (String(s || '').length > 60 ? '...' : '') + '"';
  const who = (c) => (c.who ? c.who + (c.face ? ':' + c.face : '') : 'narration');
  NL.CATS = ['Message', 'Flow', 'State', 'Room', 'Screen', 'Audio', 'Puzzle', 'Danger', 'Advanced'];
  NL.CMDS = {
    say: { label: 'Show text', cat: 'Message', fields: [['who', 'speaker', 'Speaker'], ['face', 'face', 'Expression'], ['text', 'textarea', 'Text (one box per line)'], ['shake', 'check', 'Shake the box']], sum: (c) => '[' + who(c) + '] ' + q(c.text) },
    choice: {
      label: 'Show choices', cat: 'Message', fields: [['who', 'speaker', 'Speaker'], ['face', 'face', 'Expression'], ['text', 'textarea', 'Question'], ['options', 'list', 'Choices (one per line)'], ['cancel', 'number', 'X picks choice # (blank: X does nothing)']],
      branches: (c) => (c.options || []).map((o, i) => ['branches.' + i, 'If "' + o + '"']), sum: (c) => q(c.text) + '  [' + (c.options || []).join(' / ') + ']',
    },
    note: { label: 'Open a note', cat: 'Message', fields: [['item', 'item', 'Readable item'], ['give', 'check', 'Give it first if missing']], sum: (c) => c.item || '?' },
    picture: { label: 'Show picture', cat: 'Message', fields: [['sprite', 'sprite', 'Picture (any sprite)'], ['caption', 'text', 'Caption']], sum: (c) => (c.sprite || '?') + (c.caption ? ' ' + q(c.caption) : '') },
    glimpse: { label: 'Flash a picture', cat: 'Message', fields: [['sprite', 'sprite', 'Picture'], ['time', 'number', 'Seconds', 0.4]], sum: (c) => (c.sprite || '?') + ' for ' + (c.time || 0.4) + 's' },
    chapter: { label: 'Chapter title', cat: 'Message', fields: [['text', 'text', 'Title (also autosaves)'], ['short', 'text', 'Short name for the menu']], sum: (c) => q(c.text) },
    goal: { label: 'Set objective', cat: 'Message', fields: [['text', 'text', 'Objective (shown in the menu)']], sum: (c) => q(c.text) },
    location: { label: 'Location banner', cat: 'Message', fields: [['text', 'text', 'Text']], sum: (c) => q(c.text) },
    bubble: { label: 'Balloon icon', cat: 'Message', fields: [['id', 'object', 'Over (blank: player)'], ['kind', 'select:!|?|...|heart|note', 'Icon', '!']], sum: (c) => (c.kind || '!') + ' over ' + (c.id || 'player') },

    if: { label: 'If...', cat: 'Flow', fields: [['cond', 'cond', 'Conditions (all must be true)']], branches: () => [['then', 'Then'], ['else', 'Else']], sum: (c) => NL.condText(c.cond) },
    wait: { label: 'Wait', cat: 'Flow', fields: [['s', 'number', 'Seconds', 0.5]], sum: (c) => (c.s || 0.5) + ' s' },
    stop: { label: 'Stop this event', cat: 'Flow', fields: [], sum: () => '' },
    call: { label: 'Run common event', cat: 'Flow', fields: [['id', 'common', 'Common event']], sum: (c) => c.id || '?' },
    comment: { label: 'Comment', cat: 'Flow', fields: [['text', 'textarea', 'Note to yourself (does nothing)']], sum: (c) => q(c.text) },

    set: { label: 'Set flag', cat: 'State', fields: [['k', 'flag', 'Flag'], ['v', 'text', 'Value (blank = on)']], sum: (c) => (c.k || '?') + ' = ' + (c.v === undefined || c.v === '' ? 'on' : c.v) },
    unset: { label: 'Clear flag', cat: 'State', fields: [['k', 'flag', 'Flag']], sum: (c) => c.k || '?' },
    add: { label: 'Add to counter', cat: 'State', fields: [['k', 'flag', 'Counter'], ['n', 'number', 'Add (negative subtracts)', 1]], sum: (c) => (c.k || '?') + ' += ' + (c.n === undefined ? 1 : c.n) },
    random: { label: 'Random number', cat: 'State', fields: [['k', 'flag', 'Store in'], ['n', 'number', 'From 1 to', 3]], sum: (c) => (c.k || '?') + ' = 1..' + (c.n || 3) },
    give: { label: 'Give item', cat: 'State', fields: [['item', 'item', 'Item'], ['silent', 'check', 'No "Obtained" message']], sum: (c) => c.item || '?' },
    take: { label: 'Take item', cat: 'State', fields: [['item', 'item', 'Item']], sum: (c) => c.item || '?' },
    save: { label: 'Ask to save', cat: 'State', fields: [], sum: () => '' },
    checkpoint: { label: 'Retry point', cat: 'State', fields: [], sum: () => 'game over returns here' },

    goto: { label: 'Go to room', cat: 'Room', fields: [['map', 'map', 'Room'], ['entry', 'entry:map', 'Entry point (or use X/Y)'], ['x', 'number', 'X'], ['y', 'number', 'Y'], ['dir', 'dir', 'Facing']], sum: (c) => (c.map || '?') + (c.entry ? ' @ ' + c.entry : ' (' + (c.x || 0) + ', ' + (c.y || 0) + ')') },
    walk: { label: 'Move player', cat: 'Room', fields: [['path', 'path', 'Steps, e.g. U2 R3 D1'], ['speed', 'number', 'Speed (blank: walking)']], sum: (c) => c.path || '' },
    move: { label: 'Move object', cat: 'Room', fields: [['id', 'object', 'Object'], ['path', 'path', 'Steps, e.g. L4 D1'], ['speed', 'number', 'Speed (blank: walking)']], sum: (c) => (c.id || 'this') + ': ' + (c.path || '') },
    face: { label: 'Turn to face', cat: 'Room', fields: [['id', 'object', 'Who (blank: player)'], ['dir', 'dir', 'Direction']], sum: (c) => (c.id || 'player') + ' ' + (c.dir || 'down') },
    place: { label: 'Put object at', cat: 'Room', fields: [['id', 'object', 'Object'], ['x', 'number', 'X'], ['y', 'number', 'Y']], sum: (c) => (c.id || 'this') + ' (' + (c.x || 0) + ', ' + (c.y || 0) + ')' },
    hide: { label: 'Remove object', cat: 'Room', fields: [['id', 'object', 'Object (blank: this one)']], sum: (c) => c.id || 'this object' },
    show: { label: 'Bring object back', cat: 'Room', fields: [['id', 'object', 'Object']], sum: (c) => c.id || 'this object' },
    sprite: { label: 'Change object picture', cat: 'Room', fields: [['id', 'object', 'Object'], ['sprite', 'sprite', 'New sprite (blank: original)']], sum: (c) => (c.id || 'this') + ' -> ' + (c.sprite || 'original') },
    npc: { label: 'Make a character appear', cat: 'Room', fields: [['id', 'text', 'Name for it', 'npc'], ['char', 'char', 'Character'], ['x', 'number', 'X'], ['y', 'number', 'Y'], ['dir', 'dir', 'Facing']], sum: (c) => (c.char || '?') + ' as ' + (c.id || 'npc') },
    despawn: { label: 'Remove that character', cat: 'Room', fields: [['id', 'text', 'Name it was given', 'npc']], sum: (c) => c.id || 'npc' },
    follower: { label: 'Companion follows', cat: 'Room', fields: [['char', 'char', 'Character (blank: nobody)']], sum: (c) => c.char || 'nobody' },
    playerchar: { label: 'Change player look', cat: 'Room', fields: [['char', 'char', 'Character (blank: default)']], sum: (c) => c.char || 'default' },

    fadeout: { label: 'Fade out', cat: 'Screen', fields: [['t', 'number', 'Seconds', 0.5]], sum: (c) => (c.t || 0.5) + ' s' },
    fadein: { label: 'Fade in', cat: 'Screen', fields: [['t', 'number', 'Seconds', 0.5]], sum: (c) => (c.t || 0.5) + ' s' },
    flash: { label: 'Flash screen', cat: 'Screen', fields: [['color', 'color', 'Color', '#ffffff'], ['t', 'number', 'Seconds', 0.25]], sum: (c) => c.color || '#ffffff' },
    tint: { label: 'Tint screen', cat: 'Screen', fields: [['color', 'color', 'Color (blank clears)', '#300010'], ['a', 'number', 'Strength 0-1', 0.3]], sum: (c) => c.color || 'clear' },
    shake: { label: 'Shake screen', cat: 'Screen', fields: [['amt', 'number', 'Strength', 3], ['t', 'number', 'Seconds', 0.4]], sum: (c) => (c.amt || 3) + ' for ' + (c.t || 0.4) + 's' },
    dark: { label: 'Room darkness', cat: 'Screen', fields: [['v', 'number', '0 lit ... 0.95 black', 0.6]], sum: (c) => String(c.v === undefined ? 0.6 : c.v) },
    flicker: { label: 'Lights flicker', cat: 'Screen', fields: [['n', 'number', 'Times', 3]], sum: (c) => (c.n || 3) + ' times' },
    scare: { label: 'Jump scare', cat: 'Screen', fields: [['name', 'char', 'Character (or a scare_ sprite name)']], sum: (c) => c.name || '?' },
    light: { label: 'Player light', cat: 'Screen', fields: [['r', 'number', 'Radius (0: none)', 80]], sum: (c) => String(c.r || 0) },

    sfx: { label: 'Play sound', cat: 'Audio', fields: [['name', 'sfx', 'Sound']], sum: (c) => c.name || '?' },
    music: { label: 'Play music', cat: 'Audio', fields: [['name', 'music', 'Song (blank: silence)']], sum: (c) => c.name || 'silence' },
    ambience: { label: 'Background sound', cat: 'Audio', fields: [['name', 'ambience', 'Ambience (blank: none)']], sum: (c) => c.name || 'none' },

    code: { label: 'Code lock', cat: 'Puzzle', fields: [['answer', 'text', 'Answer'], ['len', 'number', 'Length (blank: answer length)'], ['chars', 'text', 'Symbols', '0123456789'], ['title', 'text', 'Title', 'Enter the code'], ['hint', 'text', 'Hint under the dials']], branches: () => [['ok', 'If right'], ['fail', 'If wrong'], ['cancel', 'If cancelled']], sum: (c) => 'answer ' + (c.answer || '?') },
    piano: { label: 'Play a tune', cat: 'Puzzle', fields: [['answer', 'text', 'Notes, e.g. E G A G E D C'], ['title', 'text', 'Title', 'Play the tune']], branches: () => [['ok', 'If right'], ['fail', 'If wrong'], ['cancel', 'If cancelled']], sum: (c) => c.answer || '?' },
    order: { label: 'Put in order', cat: 'Puzzle', fields: [['items', 'textarea', 'Things (one per line, any order)'], ['answer', 'text', 'Right order as line numbers, e.g. 3 1 2'], ['title', 'text', 'Title', 'Put them in order']], branches: () => [['ok', 'If right'], ['fail', 'If wrong'], ['cancel', 'If cancelled']], sum: (c) => c.answer || '?' },
    clock: { label: 'Set the clock', cat: 'Puzzle', fields: [['h', 'number', 'Hour', 3], ['m', 'number', 'Minute', 15], ['title', 'text', 'Title', 'Set the time']], branches: () => [['ok', 'If right'], ['fail', 'If wrong'], ['cancel', 'If cancelled']], sum: (c) => (c.h || 12) + ':' + String(c.m || 0).padStart(2, '0') },
    useitem: { label: 'Use an item here', cat: 'Puzzle', fields: [['text', 'text', 'Prompt', 'Use what?'], ['item', 'item', 'The right item'], ['consume', 'check', 'Use it up']], branches: () => [['ok', 'If the right item'], ['fail', 'If another item'], ['cancel', 'If cancelled']], sum: (c) => c.item || '?' },

    chase: { label: 'Start a chase', cat: 'Danger', fields: [['id', 'chase', 'Chase']], sum: (c) => c.id || '?' },
    endchase: { label: 'End the chase', cat: 'Danger', fields: [], sum: () => '' },
    hidein: { label: 'Hide inside', cat: 'Danger', fields: [['id', 'object', 'Hiding spot (blank: this one)']], sum: (c) => c.id || 'this object' },
    die: { label: 'Game over', cat: 'Danger', fields: [['cause', 'death', 'Cause']], sum: (c) => c.cause || 'caught' },
    ending: { label: 'Ending', cat: 'Danger', fields: [['id', 'ending', 'Ending']], sum: (c) => c.id || '?' },

    script: { label: 'Script (JavaScript)', cat: 'Advanced', fields: [['code', 'code', 'Generator body. E is the event API; use yield* for waits. Return false to stop.']], sum: (c) => String(c.code || '').split('\n')[0].slice(0, 50) },
  };

  // ------------------------------------------------------------------ conditions
  NL.CONDS = {
    flag: { label: 'Flag is on', fields: [['k', 'flag'], ['v', 'text', 'equals (optional)']] },
    noflag: { label: 'Flag is off', fields: [['k', 'flag']] },
    count: { label: 'Counter', fields: [['k', 'flag'], ['op', 'select:>=|<=|==|>|<|!='], ['n', 'number']] },
    item: { label: 'Has item', fields: [['i', 'item']] },
    noitem: { label: 'Does not have item', fields: [['i', 'item']] },
    visited: { label: 'Has been in room', fields: [['map', 'map']] },
    chasing: { label: 'A chase is on', fields: [] },
    notchasing: { label: 'No chase is on', fields: [] },
    chance: { label: 'Random chance %', fields: [['n', 'number']] },
    notes: { label: 'Notes read', fields: [['prefix', 'text', 'id starts with'], ['n', 'number', 'at least']] },
  };
  NL.condText = function (conds) {
    if (!conds || !conds.length) return 'always';
    return conds.map((k) => {
      switch (k.t) {
        case 'flag': return k.k + (k.v !== undefined && k.v !== '' ? ' = ' + k.v : '');
        case 'noflag': return 'not ' + k.k;
        case 'count': return k.k + ' ' + (k.op || '>=') + ' ' + (k.n || 0);
        case 'item': return 'has ' + k.i;
        case 'noitem': return 'no ' + k.i;
        case 'visited': return 'visited ' + k.map;
        case 'chasing': return 'chase on';
        case 'notchasing': return 'no chase';
        case 'chance': return (k.n || 0) + '% chance';
        case 'notes': return (k.n || 0) + '+ notes ' + (k.prefix || '');
        default: return k.t;
      }
    }).join(' and ');
  };

  // ------------------------------------------------------------------ object templates
  // Each makes a new object at x, y. `ask` lists which fields the editor opens right after placing.
  NL.TEMPLATES = [
    { id: 'look', label: 'Something to look at', sprite: 'paper', make: (x, y) => ({ sprite: 'paper', text: 'A note. The handwriting is shaky.' }) },
    { id: 'door', label: 'Door (wall)', sprite: 'door_wood', make: (x, y) => ({ sprite: 'door_wood', z: 'wall', h: 2, door: { to: '', entry: '' } }) },
    { id: 'exit', label: 'Floor exit (walk on)', sprite: 'stairs_down', make: (x, y) => ({ sprite: '', door: { to: '', entry: '', walk: true } }) },
    { id: 'locked', label: 'Locked door', sprite: 'door_iron', make: (x, y) => ({ sprite: 'door_iron', z: 'wall', h: 2, door: { to: '', entry: '' }, lock: '', lockText: 'Locked.', unlockText: 'The key turns.' }) },
    { id: 'pickup', label: 'Item to pick up', sprite: 'sparkle', make: (x, y) => ({ sprite: 'sparkle', solid: false, on: [{ c: 'say', text: 'Something glints on the floor.' }, { c: 'give', item: '' }, { c: 'hide', id: '' }] }) },
    { id: 'npc', label: 'Character', sprite: 'char:shota', make: (x, y) => ({ char: 'shota', dir: 'down', on: [{ c: 'say', who: '', text: 'Hello?' }] }) },
    { id: 'hide', label: 'Hiding spot', sprite: 'wardrobe', make: (x, y) => ({ sprite: 'wardrobe', hide: true, hideSprite: 'wardrobe_open', hidePrompt: 'Hide inside?' }) },
    { id: 'save', label: 'Save point', sprite: 'nightlight', make: (x, y) => ({ sprite: 'nightlight', z: 'wall', save: true, light: { r: 30, col: '#ffb060', glow: 0.3 } }) },
    { id: 'trigger', label: 'Step-on trigger', sprite: '', make: (x, y) => ({ sprite: '', once: true, touch: [{ c: 'say', who: '', text: '...Did something move?' }] }) },
    { id: 'lamp', label: 'Light source', sprite: 'lamp', make: (x, y) => ({ sprite: 'lamp', light: { r: 50, col: '#ffc080', flicker: false, glow: 0.25 } }) },
    { id: 'codelock', label: 'Code lock', sprite: 'safe', make: (x, y) => ({ sprite: 'safe', on: [{ c: 'code', answer: '1234', title: 'Enter the code', ok: [{ c: 'sfx', name: 'unlock' }, { c: 'say', text: 'Click. It opens.' }], fail: [{ c: 'sfx', name: 'locked' }, { c: 'say', text: 'Wrong.' }] }] }) },
    { id: 'chase', label: 'Chase trigger', sprite: '', make: (x, y) => ({ sprite: '', once: true, touch: [{ c: 'chase', id: '' }] }) },
  ];

  // ------------------------------------------------------------------ projects
  NL.uid = () => Math.random().toString(36).slice(2, 10);
  // a room shell: ceiling row, two wall rows, floor, ceiling row (RPG Maker style)
  NL.roomTiles = function (w, h, fch) {
    fch = fch || '.';
    const rows = ['#'.repeat(w), 'W'.repeat(w), 'W'.repeat(w)];
    for (let r = 3; r < h - 1; r++) rows.push(fch.repeat(w));
    rows.push('#'.repeat(w));
    return rows;
  };
  NL.newMap = function (name, w, h, wall, floor) {
    return { name: name || 'New room', wall: wall || 'plaster', floor: { '.': floor || 'wood' }, dark: 0.3, music: null, ambience: null, tiles: NL.roomTiles(w || 12, h || 9), entries: {}, lights: [], objects: [], events: { first: [], enter: [] } };
  };
  NL.blank = function () {
    return {
      format: 'nightlight/1', id: NL.uid(), title: 'Untitled', subtitle: '', player: 'haru', startLight: 70,
      start: { map: 'room1', x: 5, y: 5, dir: 'down' },
      titleScreen: { bg: '#05030a', bg2: '#1a1428', color: '#d8d0dc', rain: true },
      maps: { room1: NL.newMap('First room', 12, 9, 'plaster', 'tatami') },
      items: {}, speakers: { me: { name: 'Me', color: '#8fb0d4', portrait: 'haru' } }, endings: { end: { title: 'THE END', subtitle: 'Ending 1 of 1', lines: 'You made it out.', color: '#e8d8a0', music: 'ending' } },
      deaths: { caught: 'You were caught.' }, chases: {}, common: {}, recipes: [], gameOverTitle: 'GAME OVER',
      assets: { images: {} },
    };
  };

  // A short complete sample game: three rooms, a key, a note with a code, a chase and two endings.
  NL.sample = function () {
    const P = NL.blank();
    P.title = 'LIGHTS OUT';
    P.subtitle = 'A sample game made with Nightlight Maker';
    P.player = 'haru';
    P.startLight = 72;
    P.start = { map: 'bedroom', x: 3, y: 5, dir: 'down' };
    P.speakers = {
      ren: { name: 'Ren', color: '#8fb0d4', portrait: 'haru', blip: 560 },
      voice: { name: '???', color: '#e8a8b8', blip: 700, wave: 'sine', textColor: '#f4dce4' },
    };
    P.items = {
      brass_key: { name: 'Brass Key', desc: 'Small and cold. A paper tag: STUDY.', icon: 'icon_brass_key' },
      diary: { name: "Dad's Diary", desc: 'A thin notebook.', icon: 'icon_diary', note: true, pages: 'Oct 3. Changed the front door code again.\nThe day Ren was born. Month first, then day.\n---\nRen was born on April 13th. Of course I remember.' },
      flashlight: { name: 'Flashlight', desc: 'The batteries are low but it works.', icon: 'icon_flashlight' },
    };
    P.endings = {
      outside: { title: 'OUTSIDE', subtitle: 'Ending 1 of 2 - good', color: '#e8d8a0', music: 'ending', lines: 'The door opened onto cold air and streetlights.\nRen did not look back at the house.\nSomewhere behind him, a door closed very softly.' },
      stayed: { title: 'STAYED UP', subtitle: 'Ending 2 of 2 - bad', color: '#c84050', music: 'badend', lines: 'Ren opened the door for the voice.\nIt was not Mom.', retry: true },
    };
    P.deaths = { caught: 'A cold hand on your shoulder. "Bedtime."' };
    P.chases = {
      shadow: { char: 'caretaker', at: 'behind', speed: 52, delay: 1.2, follow: true, timer: 14, loseAfterHide: 5, cause: 'caught', safe: ['bedroom'], onEnd: [{ c: 'set', k: 'chased' }, { c: 'goal', text: 'Get into the study.' }] },
    };
    P.common = { knock: { list: [{ c: 'sfx', name: 'knock' }, { c: 'shake', amt: 2, t: 0.3 }] } };
    const bed = NL.newMap("Ren's room", 12, 9, 'cream', 'tatami');
    bed.dark = 0.6; bed.ambience = 'rain';
    bed.tiles[bed.tiles.length - 1] = '#####.######';
    bed.lights = [{ x: 5, y: 2, r: 26, col: '#8090c0', glow: 0.15 }];
    bed.entries = { from_hall: [5, 7, 'up'] };
    bed.objects = [
      { id: 'futon', x: 2, y: 4, h: 2, sprite: 'futon', z: 'floor', solid: false, text: 'My futon. Still warm.' },
      { id: 'window', x: 5, y: 2, z: 'wall', sprite: 'window_rain', text: 'Rain. Every window across the street is dark.' },
      { id: 'desk', x: 8, y: 3, sprite: 'kids_desk', on: [
        { c: 'if', cond: [{ t: 'noitem', i: 'flashlight' }], then: [{ c: 'say', text: 'My desk. The flashlight is in the drawer.' }, { c: 'give', item: 'flashlight' }, { c: 'light', r: 92 }, { c: 'goal', text: 'Find Mom and Dad.' }], else: [{ c: 'say', who: 'ren', text: 'Nothing else in here.' }] },
      ] },
      { id: 'nightlight', x: 11, y: 2, z: 'wall', sprite: 'nightlight', save: true, light: { r: 30, col: '#ffb060', glow: 0.3 } },
      { id: 'exit', x: 5, y: 8, sprite: '', door: { to: 'hall', entry: 'from_bedroom', walk: true } },
    ];
    bed.events = { first: [
      { c: 'chapter', text: 'LIGHTS OUT', short: 'Night' },
      { c: 'wait', s: 0.6 },
      { c: 'say', who: 'ren', face: 'scared', text: "...The power's out.\nMom? Dad?" },
      { c: 'call', id: 'knock' },
      { c: 'say', text: 'Three knocks. From the front door.' },
      { c: 'goal', text: 'Check the desk for the flashlight.' },
    ], enter: [] };

    const hall = NL.newMap('Hallway', 18, 9, 'cream', 'wood');
    hall.dark = 0.75; hall.ambience = 'house';
    hall.tiles[hall.tiles.length - 1] = '#####.############';
    hall.entries = { from_bedroom: [5, 7, 'up'], from_study: [13, 3, 'down'], from_kitchen: [2, 3, 'down'] };
    hall.objects = [
      { id: 'to_kitchen', x: 2, y: 1, h: 2, z: 'wall', sprite: 'door_wood', door: { to: 'kitchen', entry: 'from_hall' } },
      { id: 'to_study', x: 13, y: 1, h: 2, z: 'wall', sprite: 'door_red', door: { to: 'study', entry: 'from_hall' }, lock: 'brass_key', lockText: 'Locked. The study. Dad keeps the key somewhere in the kitchen.', unlockText: 'The brass key turns.' },
      { id: 'front', x: 16, y: 1, h: 2, z: 'wall', sprite: 'door_iron', on: [
        { c: 'if', cond: [{ t: 'flag', k: 'chased' }], then: [], else: [
          { c: 'call', id: 'knock' },
          { c: 'choice', who: 'voice', text: "Ren? It's Mom. I forgot my keys. Open the door, sweetie.", options: ['Open the door', "Don't"], branches: [[{ c: 'fadeout', t: 1 }, { c: 'ending', id: 'stayed' }], [{ c: 'say', who: 'ren', face: 'scared', text: "...Mom has her own keys." }]] },
          { c: 'stop' },
        ] },
        { c: 'code', answer: '0413', title: 'Front door keypad', hint: 'MM DD', ok: [{ c: 'sfx', name: 'unlock' }, { c: 'say', text: 'The lock clicks open.' }, { c: 'fadeout', t: 1.2 }, { c: 'ending', id: 'outside' }], fail: [{ c: 'sfx', name: 'locked' }, { c: 'say', text: 'A red light. Wrong code.' }] },
      ] },
      { id: 'clock', x: 8, y: 2, z: 'wall', sprite: 'wall_clock', text: 'The clock stopped at 11:58.' },
      { id: 'plant', x: 10, y: 3, sprite: 'plant', text: 'A rubber plant. Mom talks to it.' },
      { id: 'exit', x: 5, y: 8, sprite: '', door: { to: 'bedroom', entry: 'from_hall', walk: true } },
    ];
    hall.lights = [{ x: 8, y: 3, r: 28, col: '#c0c8ff', glow: 0.1 }];

    const kit = NL.newMap('Kitchen', 12, 9, 'white', 'tile_check');
    kit.dark = 0.65; kit.ambience = 'hum';
    kit.entries = { from_hall: [2, 4, 'down'] };
    kit.objects = [
      { id: 'door', x: 2, y: 1, h: 2, z: 'wall', sprite: 'door_wood', door: { to: 'hall', entry: 'from_kitchen' } },
      { id: 'fridge', x: 5, y: 3, sprite: 'fridge', text: 'The fridge is silent. The light inside stays off.' },
      { id: 'stove', x: 6, y: 3, sprite: 'stove', text: 'Cold.' },
      { id: 'table', x: 7, y: 5, w: 2, sprite: 'table', text: 'Two plates. Dinner was never eaten.' },
      { id: 'key', x: 9, y: 6, sprite: 'sparkle', solid: false, on: [
        { c: 'say', text: 'Something brass under the table.' },
        { c: 'give', item: 'brass_key' },
        { c: 'hide' },
        { c: 'wait', s: 0.4 },
        { c: 'sfx', name: 'keys' },
        { c: 'say', who: 'ren', face: 'scared', text: 'Footsteps. In the hall. Coming this way.' },
        { c: 'goal', text: 'Run. Hide. Lose him.' },
        { c: 'chase', id: 'shadow' },
      ] },
      { id: 'cupboard', x: 10, y: 3, sprite: 'wardrobe', hide: true, hideSprite: 'wardrobe_open', hidePrompt: 'The pantry. Just enough room. Hide inside?' },
    ];

    const study = NL.newMap('Study', 12, 9, 'wood', 'carpet_red');
    study.dark = 0.7; study.music = 'dread';
    study.entries = { from_hall: [2, 4, 'down'] };
    study.objects = [
      { id: 'door', x: 2, y: 1, h: 2, z: 'wall', sprite: 'door_red', door: { to: 'hall', entry: 'from_study' } },
      { id: 'shelf', x: 5, y: 3, w: 2, sprite: 'bookshelf_wide', text: 'Dad\'s books. All about bridges.' },
      { id: 'desk', x: 8, y: 5, w: 2, sprite: 'desk', on: [
        { c: 'if', cond: [{ t: 'noitem', i: 'diary' }], then: [{ c: 'say', text: 'A diary lies open on the desk.' }, { c: 'give', item: 'diary' }, { c: 'note', item: 'diary' }, { c: 'goal', text: 'Open the front door. The code is in the diary.' }], else: [{ c: 'say', text: 'The desk. Dad\'s pen, still uncapped.' }] },
      ] },
      { id: 'portrait', x: 9, y: 2, z: 'wall', sprite: 'painting_portrait_eyes', text: 'A portrait. Its eyes follow you.' },
    ];
    study.lights = [{ x: 8, y: 5, r: 40, col: '#ffb040', flicker: true, glow: 0.3 }];
    P.maps = { bedroom: bed, hall: hall, kitchen: kit, study: study };
    return P;
  };
  // scripted playthroughs (node tools/walkthrough.js sample --page maker/play.html)
  NL.ROUTES = {
    sample: [
      { use: 'desk' }, { expect: { has: ['flashlight'] } },
      { walkTo: [5, 8] }, { expect: { map: 'hall' } },
      { use: 'front', choose: [1] }, { expect: { map: 'hall' } },
      { door: 'to_kitchen' }, { expect: { map: 'kitchen' } },
      { use: 'key' }, { expect: { has: ['brass_key'] } },
      { escape: ['door', 'exit'] }, { expect: { map: 'bedroom', flags: ['chased'] } },
      { walkTo: [5, 8] }, { door: 'to_study' }, { expect: { map: 'study' } },
      { use: 'desk' }, { expect: { has: ['diary'] } },
      { door: 'door' }, { use: 'front' }, { answer: '0413' }, { expect: { ending: 'outside' } },
    ],
  };
})(window.G);
