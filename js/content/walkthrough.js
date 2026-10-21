// Scripted routes used by tools/walkthrough.js to prove the game can be finished.
(function (G) {
  'use strict';
  G.WALKTHROUGH = {
    enginetest: [
      { start: { map: 'hall', x: 2, y: 4 } },
      { door: 'door_bed' },
      { use: 'desk' },
      { expect: { has: ['brass_key'] } },
      { door: 'exit' },
      { door: 'door_study' },
      { expect: { map: 'study' } },
      { use: 'piano' }, { answer: ['E', 'D', 'C', 'D', 'E', 'E', 'E'] },
      { expect: { flags: ['pianoDone'] } },
      { use: 'safe' }, { answer: '1987' },
      { escape: ['exit', 'door_bed', { hide: 'ward' }] },
      { expect: { flags: ['safeOpen'] } },
    ],
  };
})(window.G);
