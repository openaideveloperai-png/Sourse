// Scripted routes used by tools/walkthrough.js to prove the game can be finished.
(function (G) {
  'use strict';
  G.WALKTHROUGH = Object.assign(G.WALKTHROUGH || {}, {
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
      // hiding right behind a door gets you heard: chain it first (+5 s), then hide
      { escape: ['exit', 'door_bed', { latch: 'exit' }, { hide: 'ward' }] },
      { expect: { flags: ['safeOpen'] } },
    ],
    // the whole game, New Game to the true ending, chaining the chapter routes (each chapter's
    // {start} step is dropped: the previous chapter ends in its hand-off state)
    main: function () {
      const W = G.WALKTHROUGH;
      const tail = (r) => W[r].filter((s) => !s.start);
      return [].concat(W.ch1, tail('ch2'), tail('ch3'), tail('ch1f'), tail('ch4'),
        [{ use: 'front' }, { expect: { flags: ['fin_ringing'] } }, { use: 'payphone', choose: [0, 0] }, { expect: { ending: 'welcome_home' } }]);
    },
  });
})(window.G);
