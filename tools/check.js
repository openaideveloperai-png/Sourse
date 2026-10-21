// Loads the pure game logic in Node and validates every level.
globalThis.window = undefined;
require('../js/core.js');
require('../js/sim.js');
require('../js/levels.js');
const G = globalThis.G;
let ok = true;
G.LEVELS.forEach((d, i) => {
  try {
    const L = G.parseLevel(d);
    console.log(i, d.id, 'shards', L.shards.length, 'cps', L.checkpoints.length, 'hazards', L.hazards.length, 'start', L.start.c, L.start.r, 'exit', L.exit && [L.exit.c, L.exit.r]);
  } catch (e) { ok = false; console.log('ERR', i, e.message); }
});
process.exit(ok ? 0 : 1);
