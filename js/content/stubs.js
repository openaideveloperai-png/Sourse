// Placeholder rooms for every map in docs/MANIFEST.md, so a chapter can be tested before its
// neighbours exist. Loaded before the chapter files: a chapter's real `G.MAPS.id = {...}`
// replaces the stub. Stubs are plain grey rooms with the manifest's named entries and doors.
(function (G) {
  'use strict';
  const MAPS = {
    // A
    home_bed: {}, home_main: {}, home_bath: {}, c4: {}, a401: {}, a402: {}, a403: {},
    stair4: { entries: ['from_3f'], doors: [['down', 'stair3', 'from_4f']] },
    // B
    stair3: { entries: ['from_4f', 'from_2f'], doors: [['up', 'stair4', 'from_3f'], ['down', 'stair2', 'from_3f']] },
    c3: { entries: ['from_stair3'] }, a301: {}, a302: {}, a303: {}, laundry: {}, lift: {},
    // C
    c2: { entries: ['from_lift'] },
    stair2: { entries: ['from_3f', 'from_1f'], doors: [['up', 'stair3', 'from_2f'], ['down', 'stair1', 'from_2f']] },
    a201: {}, a202: { doors: [['hole', 'office', 'from_rope']] }, a203: {},
    // D
    office: { entries: ['from_rope'] }, lobby: {},
    stair1: { entries: ['from_2f', 'from_b1'], doors: [['up', 'stair2', 'from_1f'], ['b1door', 'b1_hall', 'from_1f']] },
    yard: {}, bikes: {}, reality: {},
    // E
    b1_hall: { entries: ['from_1f'], doors: [['up', 'stair1', 'from_b1']] },
    storage: {}, boiler: {}, keeper: {},
  };
  for (const id of Object.keys(MAPS)) {
    if (G.MAPS[id]) continue;
    const m = MAPS[id];
    const entries = {};
    (m.entries || []).forEach((n, i) => { entries[n] = [3 + i * 4, 5, 'down']; });
    const objects = (m.doors || []).map((d, i) => ({
      id: d[0], x: 3 + i * 4, y: 1, h: 2, z: 'wall', sprite: 'door_iron', door: { to: d[1], entry: d[2], dir: 'down' },
    }));
    objects.push({ id: 'stub_sign', x: 12, y: 3, sprite: 'paper', solid: false, z: 'floor', text: '@ (Placeholder room "' + id + '": not written yet.)' });
    G.MAPS[id] = {
      name: id + ' (stub)', stub: true, wall: 'concrete', floor: { '.': 'concrete' }, dark: 0, entries: entries,
      tiles: ['####################', 'WWWWWWWWWWWWWWWWWWWW', 'WWWWWWWWWWWWWWWWWWWW', '....................', '....................', '....................', '....................', '....................', '####################'],
      objects: objects,
    };
  }
})(window.G);
