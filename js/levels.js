// Chapters. Maps are 26x14 tiles.
// Legend: # wall, . floor, , floor detail, d dirt path, = road, v pit,
// x hidden collapsing floor, c cracked floor (falls 0.4s after you step on it),
// ~ water, L lava, b bridge, 1-9 spike groups, S start, E exit portal,
// o shard, K save point, F fake shard, X fake portal,
// T tree, r rock, n sign, B barrel, C crate, l lamp, g grave, P pillar, W statue, U bush, Q crystal, i wall torch.
(function (G) {
  'use strict';
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };

  const LEVELS = [];

  // ---------------- 1: WRONG WAY ----------------
  LEVELS.push({
    id: 'wrongway', chapter: 'CHAPTER 1', name: 'WRONG WAY', theme: 'meadow', music: 'meadow',
    map: [
      '##########################',
      '######,,.......,...,.#####',
      '######......o........#####',
      '#xxxx#...............#####',
      '#xxxn#...............#####',
      '#xxxx#...............#...#',
      '#xxS.................c.xE#',
      '#xxxx#...............#...#',
      '#xxxx#...............#####',
      '#xxxx#...............#####',
      '######...............#####',
      '######......o.....o..#####',
      '######,.......,......#####',
      '##########################',
    ],
    floorUnder: { x: '.', c: '.', n: '.' },
    hazards: [
      ...[7, 9, 11, 13, 15, 17, 19].map((c, i) => ({ type: 'patrol', skin: 'slime', pts: [[c, 1], [c, 12]], speed: 5.5, phase: i % 2 ? 0.5 : 0, r: 5 })),
      { type: 'patrol', skin: 'slimeB', pts: [[6, 4], [20, 4]], speed: 3.6, phase: 0, r: 5 },
      { type: 'patrol', skin: 'slimeB', pts: [[6, 9], [20, 9]], speed: 3.6, phase: 0.5, r: 5 },
    ],
    intro: [
      { who: 'sign', text: '"→ THIS WAY"' },
      { who: 'kid', face: 'annoyed', text: 'A sign. Pointing right. Super helpful.' },
      { who: 'kid', face: 'neutral', text: 'Those blobs are bouncing around in a weirdly organized way...' },
      { who: 'narr', text: 'Collect every shard. Reach the portal. Don\'t stand still.' },
    ],
  });

  // ---------------- 2: CROSSING THE ROAD, AGAIN ----------------
  LEVELS.push({
    id: 'road', chapter: 'CHAPTER 2', name: 'CROSSING THE ROAD, AGAIN', theme: 'village', music: 'road',
    map: [
      '##########################',
      '#.l...,.....E......,..l..#',
      '#..B.....,.......,....C..#',
      '==========================',
      '=====o====================',
      ',,c,,,c,,,,,,c,,,,c,,,,c,,',
      '===================o======',
      '==========================',
      ',,,,,c,,,,,c,,,,,,,c,,,,,,',
      '==========================',
      '=========o================',
      '#....,.......,......,....#',
      '#..l.......S.........l...#',
      '##########################',
    ],
    floorUnder: { c: ',', l: '.', B: '.', C: '.' },
    hazards: [
      { type: 'lane', row: 3, dir: 1, speed: 5, n: 3, len: 78, offset: 0 },
      { type: 'lane', row: 4, dir: -1, speed: 6, n: 3, len: 78, offset: 6 },
      { type: 'lane', row: 6, dir: 1, speed: 7.5, n: 2, len: 78, offset: 3 },
      { type: 'lane', row: 7, dir: -1, speed: 4.5, n: 4, len: 78, offset: 9 },
      { type: 'lane', row: 9, dir: 1, speed: 9, n: 2, len: 42, h: 12, skin: 'knight', death: 'slash', offset: 1 },
      { type: 'lane', row: 10, dir: -1, speed: 6, n: 3, len: 78, offset: 4 },
    ],
    intro: [
      { who: 'kid', face: 'annoyed', text: 'Oh come on.' },
      { who: 'kid', face: 'annoyed', text: 'A road. Of course it\'s a road.' },
      { who: 'kid', face: 'scared', text: 'Those are carriages. Big ones. Going very fast.' },
      { who: 'kid', face: 'determined', text: '...Look both ways. Then look both ways again.' },
    ],
  });

  // ---------------- 3: THE HUNGRY WOODS ----------------
  LEVELS.push({
    id: 'woods', chapter: 'CHAPTER 3', name: 'THE HUNGRY WOODS', theme: 'forest', music: 'forest',
    map: [
      '##########################',
      '#E..,..........o.........#',
      '############.#########.###',
      '#.......,..........o.....#',
      '#####.##############.#####',
      '#..o.........,..........K#',
      '###########.##########.###',
      '#.....,..............o...#',
      '###.###########.##########',
      '#........o.......,.......#',
      '######################.###',
      '#.....,........,......S..#',
      '##########################',
      '##########################',
    ],
    floorUnder: {},
    hazards: [
      { type: 'patrol', skin: 'wolf', pts: [[1, 11], [24, 11]], speed: 6, phase: 0.1, r: 6 },
      { type: 'patrol', skin: 'wolf', pts: [[1, 9], [24, 9]], speed: 7, phase: 0.6, r: 6 },
      { type: 'patrol', skin: 'wolf', pts: [[1, 9], [24, 9]], speed: 5, phase: 0.1, r: 6 },
      { type: 'patrol', skin: 'wolf', pts: [[1, 7], [24, 7]], speed: 8, phase: 0.3, r: 6 },
      { type: 'lane', row: 7, dir: -1, speed: 11, n: 1, len: 14, h: 10, skin: 'crow', death: 'hit', offset: 3 },
      { type: 'patrol', skin: 'wolf', pts: [[1, 5], [24, 5]], speed: 7, phase: 0.75, r: 6 },
      { type: 'patrol', skin: 'wolf', pts: [[1, 5], [24, 5]], speed: 7, phase: 0.25, r: 6 },
      { type: 'patrol', skin: 'wolf', pts: [[1, 3], [24, 3]], speed: 9, phase: 0.5, r: 6 },
      { type: 'lane', row: 3, dir: 1, speed: 12, n: 1, len: 14, h: 10, skin: 'crow', death: 'hit', offset: 10 },
      { type: 'patrol', skin: 'wolf', pts: [[1, 1], [24, 1]], speed: 8, phase: 0.0, r: 6 },
      { type: 'patrol', skin: 'wolf', pts: [[1, 1], [24, 1]], speed: 6, phase: 0.55, r: 6 },
    ],
    intro: [
      { who: 'kid', face: 'scared', text: 'It\'s so dark I can barely see my own feet.' },
      { who: 'kid', face: 'scared', text: '...Something is growling.' },
      { who: 'kid', face: 'annoyed', text: 'Those wolves look hungry. And I look delicious.' },
    ],
  });

  // ---------------- 4: GARDEN OF SPIKES ----------------
  // Spike columns rise in a wave moving right: group = column % 4.
  const spikeRow = (r) => {
    let s = '#';
    for (let c = 1; c <= 24; c++) s += c >= 3 && c <= 22 ? String((c % 4) + 1) : '.';
    return s + '#';
  };
  LEVELS.push({
    id: 'spikes', chapter: 'CHAPTER 4', name: 'GARDEN OF SPIKES', theme: 'castle', music: 'castle',
    map: [
      '##########################',
      '#........................#',
      '#..' + '########i#######i###' + '..#',
      '#..' + spikeRow(3).slice(3, 23) + '..#',
      '#..' + spikeRow(4).slice(3, 23) + '..#',
      '#..' + spikeRow(5).slice(3, 23) + '..#',
      '#S.' + spikeRow(6).slice(3, 12) + 'K' + spikeRow(6).slice(13, 23) + '.E#',
      '#..' + spikeRow(7).slice(3, 23) + '..#',
      '#..' + spikeRow(8).slice(3, 23) + '..#',
      '#..' + spikeRow(9).slice(3, 23) + '..#',
      '#..' + '###i#######i########' + '..#',
      '#........................#',
      '#W......................W#',
      '##########################',
    ],
    floorUnder: { W: '.' },
    spikes: {
      1: { period: 2.0, up: 1.15, warn: 0.35, phase: 0.0 },
      2: { period: 2.0, up: 1.15, warn: 0.35, phase: 0.75 },
      3: { period: 2.0, up: 1.15, warn: 0.35, phase: 0.5 },
      4: { period: 2.0, up: 1.15, warn: 0.35, phase: 0.25 },
    },
    hazards: [
      { type: 'arrow', c: 9, r: 2, dir: 'D', period: 1.6, phase: 0, speed: 9 },
      { type: 'arrow', c: 17, r: 2, dir: 'D', period: 1.6, phase: 0.5, speed: 9 },
      { type: 'arrow', c: 6, r: 10, dir: 'U', period: 1.6, phase: 0.25, speed: 9 },
      { type: 'arrow', c: 14, r: 10, dir: 'U', period: 1.6, phase: 0.75, speed: 9 },
      { type: 'swing', cx: 12.5, cy: -0.5, L: 1.5, amp: 1.2, period: 1.7, phase: 0, r: 6 },
      { type: 'patrol', skin: 'fire', pts: [[1, 11], [24, 11]], speed: 7, phase: 0, r: 4 },
      { type: 'patrol', skin: 'fire', pts: [[1, 1], [24, 1]], speed: 7, phase: 0.5, r: 4 },
    ],
    extraShards: [[5, 1], [20, 1], [8, 11], [19, 11], [16, 6]],
    intro: [
      { who: 'kid', face: 'shock', text: 'Who designs a garden like this?!' },
      { who: 'kid', face: 'neutral', text: 'The spikes go up and down in waves. If I move with the wave...' },
      { who: 'kid', face: 'annoyed', text: '...I\'ll probably still die. But less.' },
    ],
  });

  // ---------------- 5: THE CATACOMBS ----------------
  LEVELS.push({
    id: 'crypt', chapter: 'CHAPTER 5', name: 'THE CATACOMBS', theme: 'crypt', music: 'crypt',
    map: [
      '##########################',
      '###i#####i######i#####i###',
      '#.......#.........#......#',
      '#..o....#....o....#...o..#',
      '#.......#.........#......#',
      '#.......c.........c......#',
      '#S......#....K....#.....E#',
      '#.......c.........c......#',
      '#.......#.........#......#',
      '#..o....#....o....#...o..#',
      '#.......#.........#......#',
      '###i#####i######i#####i###',
      '##########################',
      '##########################',
    ],
    floorUnder: { c: '.' },
    hazards: [
      { type: 'bar', cx: 4, cy: 6, n: 5, gap: 10, arms: 2, period: 3.2, phase: 0, start: 0, r: 4, skin: 'fire' },
      { type: 'orbit', cx: 4, cy: 6, R: 3.6, period: 4.4, dir: -1, n: 3, r: 5, skin: 'ghost', death: 'hit' },
      { type: 'bar', cx: 13, cy: 6, n: 4, gap: 10, arms: 4, period: 3.6, phase: 0.1, start: 14, r: 4, skin: 'fire', dir: -1 },
      { type: 'orbit', cx: 13, cy: 6, R: 1.6, period: 2.2, n: 2, r: 4, skin: 'wisp', death: 'burn' },
      { type: 'bar', cx: 21.5, cy: 3.5, n: 4, gap: 9, arms: 2, period: 2.6, phase: 0.25, start: 0, r: 4, skin: 'fire' },
      { type: 'bar', cx: 21.5, cy: 8.5, n: 4, gap: 9, arms: 2, period: 2.6, phase: 0.75, start: 0, r: 4, skin: 'fire', dir: -1 },
      { type: 'orbit', cx: 21.5, cy: 6, R: 2.2, period: 3.0, n: 2, r: 5, skin: 'ghost', death: 'hit' },
    ],
    intro: [
      { who: 'kid', face: 'scared', text: 'It\'s dark. I can\'t see anything.' },
      { who: 'kid', face: 'scared', text: 'That\'s fine. Totally fine. Spinning fire is fine.' },
    ],
  });

  // ---------------- 6: BRIDGE OF CINDERS ----------------
  // One long path of crumbling bridges between stone landings.
  LEVELS.push({
    id: 'bridge', chapter: 'CHAPTER 6', name: 'BRIDGE OF CINDERS', theme: 'volcano', music: 'volcano',
    map: [
      '##########################',
      '#' + 'L'.repeat(24) + '#',
      '#S.bccccccbobcccccbbbLLLL#',
      '#' + 'L'.repeat(17) + 'bbb' + 'L'.repeat(4) + '#',
      '#' + 'L'.repeat(17) + 'bob' + 'L'.repeat(4) + '#',
      '#' + 'L'.repeat(18) + 'c' + 'L'.repeat(5) + '#',
      '#LLbbbcccccbKbcccccbLLLLL#',
      '#LLbob' + 'L'.repeat(19) + '#',
      '#LLLc' + 'L'.repeat(20) + '#',
      '#LLbbb' + 'L'.repeat(19) + '#',
      '#LLbbbccccccbobccccccbbE.#',
      '#' + 'L'.repeat(24) + '#',
      '#' + 'L'.repeat(24) + '#',
      '##########################',
    ],
    floorUnder: { c: 'b' },
    crackTime: 0.45,
    hazards: [
      // fireballs leaping out of the lava across each bridge
      ...[[5, 2, 0.0], [7, 2, 0.35], [9, 2, 0.7], [14, 2, 0.15], [16, 2, 0.55]].map(([c, r, ph]) => ({ type: 'patrol', skin: 'fire', pts: [[c, r - 1.4], [c, r + 1.4]], speed: 4, ease: true, phase: ph, r: 4, death: 'burn' })),
      ...[[7, 6, 0.2], [9, 6, 0.6], [15, 6, 0.1], [17, 6, 0.45]].map(([c, r, ph]) => ({ type: 'patrol', skin: 'fire', pts: [[c, r - 1.4], [c, r + 1.4]], speed: 4.2, ease: true, phase: ph, r: 4, death: 'burn' })),
      ...[[7, 10, 0.05], [9, 10, 0.4], [11, 10, 0.75], [16, 10, 0.3], [18, 10, 0.65], [20, 10, 0.95]].map(([c, r, ph]) => ({ type: 'patrol', skin: 'fire', pts: [[c, r - 1.4], [c, r + 1.4]], speed: 4.4, ease: true, phase: ph, r: 4, death: 'burn' })),
      { type: 'rock', c: 19, r: 3, period: 2.2, phase: 0, fall: 0.9 },
      { type: 'rock', c: 4, r: 9, period: 2.0, phase: 0.5, fall: 0.8 },
      { type: 'rock', c: 13, r: 10, period: 1.9, phase: 0.2, fall: 0.8 },
      { type: 'rock', c: 11, r: 2, period: 2.3, phase: 0.6, fall: 0.85 },
    ],
    intro: [
      { who: 'kid', face: 'shock', text: 'The bridge is crumbling behind me.' },
      { who: 'kid', face: 'determined', text: 'Great. No going back, then. Story of my life.' },
    ],
  });

  // ---------------- 7: THE WITCH'S GATE ----------------
  LEVELS.push({
    id: 'gate', chapter: 'FINAL CHAPTER', name: "THE WITCH'S GATE", theme: 'void', music: 'witch',
    map: [
      '##########################',
      '#P......P......P......P..#',
      '#....o..........,....o...#',
      '#.X.....######..####.....#',
      '#.......#....#..#..#.....#',
      '#..vv......o..........vv.#',
      '#S.vv...,......K......vvE#',
      '#..vv.................vv.#',
      '#.......#....#..#..#.....#',
      '#.......######..####.....#',
      '#....o..........,....o...#',
      '#P......P......P......P..#',
      '##########################',
      '##########################',
    ],
    floorUnder: { P: '.' },
    wave: { t0: 6, speed: 0.75, from: 1, jitter: 0.5 },
    hazards: [
      { type: 'bar', cx: 5, cy: 6, n: 4, gap: 10, arms: 2, period: 2.4, phase: 0, r: 4, skin: 'hex' },
      { type: 'bar', cx: 11, cy: 6.5, n: 3, gap: 10, arms: 3, period: 3.0, phase: 0.2, start: 12, r: 4, skin: 'hex', dir: -1 },
      { type: 'patrol', skin: 'hand', pts: [[9, 2], [9, 10]], speed: 5, phase: 0, r: 5, death: 'grab' },
      { type: 'patrol', skin: 'hand', pts: [[14, 10], [14, 2]], speed: 5, phase: 0.25, r: 5, death: 'grab' },
      { type: 'patrol', skin: 'hand', pts: [[19, 2], [19, 10]], speed: 5.5, phase: 0.5, r: 5, death: 'grab' },
      { type: 'bar', cx: 19, cy: 6, n: 4, gap: 10, arms: 2, period: 2.2, phase: 0.6, r: 4, skin: 'hex' },
      { type: 'orbit', cx: 22, cy: 6, R: 2.4, period: 2.6, n: 3, r: 4, skin: 'hex', death: 'burn' },
    ],
    intro: [
      { who: 'witch', text: 'Don\'t go.' },
      { who: 'kid', face: 'determined', text: 'Sorry. I have pudding in this bag, and it\'s getting warm.' },
      { who: 'witch', text: 'Stay with me. Forever.' },
      { who: 'kid', face: 'scared', text: 'The floor behind me is... disappearing?!' },
    ],
  });

  // extra shards placed on the map via coordinates
  for (const L of LEVELS) {
    if (!L.extraShards) continue;
    L.map = L.map.map((row) => row.split(''));
    for (const [c, r] of L.extraShards) L.map[r][c] = 'o';
    L.map = L.map.map((row) => row.join(''));
  }

  G.LEVELS = LEVELS;

  // ---------------- story text ----------------
  G.STORY = {
    firstDeath: [
      { who: 'kid', face: 'pain', text: 'Haah... haah...!' },
      { who: 'kid', face: 'scared', text: 'I fell. I fell and I died. I FELT it.' },
      { who: 'kid', face: 'shock', text: 'So why am I... back here?' },
      { who: 'witch', text: 'I love you.' },
      { who: 'kid', face: 'shock', text: '...!? Who said that?!' },
      { who: 'kid', face: 'neutral', text: '...Okay. Okay. When I die, I come back. Back to the last purple flame.' },
      { who: 'kid', face: 'determined', text: 'So I just have to not die. Simple.' },
      { who: 'narr', text: 'It was not simple.' },
    ],
    milestones: {
      10: [{ who: 'kid', face: 'annoyed', text: 'Ten times. I\'ve died ten times.' }],
      25: [{ who: 'witch', text: 'Again.' }],
      50: [{ who: 'kid', face: 'dead', text: 'Fifty. My body remembers every single one.' }],
      100: [{ who: 'witch', text: 'One hundred times you have come back to me.' }, { who: 'kid', face: 'determined', text: 'And one hundred times I\'m leaving again.' }],
      250: [{ who: 'narr', text: 'He no longer screams.' }],
      500: [{ who: 'kid', face: 'dead', text: '...' }, { who: 'kid', face: 'determined', text: 'Pudding. Think about the pudding.' }],
      1000: [{ who: 'witch', text: 'A thousand deaths. You are mine now.' }, { who: 'kid', face: 'annoyed', text: 'Nope.' }],
    },
  };
})(typeof window !== 'undefined' ? window.G : globalThis.G);
