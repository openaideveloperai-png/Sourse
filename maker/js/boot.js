// Starts a Nightlight game: finds the project, decodes imported images, builds the game, then
// starts the engine's main loop. Used by maker/play.html (playtest) and by exported games.
//   exported game: window.NL_PROJECT (the project) and window.NL_MAIN (the main loop as a function)
//   playtest: the editor posts {type: 'nl-play', project, opts} into this page's window
(function () {
  'use strict';
  const G = window.G;
  let started = false;
  function start(project, opts) {
    if (started) return;
    started = true;
    G.MAKER.loadAssets(project).then(() => {
      G.MAKER.apply(project, opts || {});
      if (window.parent !== window) window.parent.postMessage({ type: 'nl-started' }, '*');
      document.title = project.title || 'Nightlight game';
      if (window.NL_MAIN) window.NL_MAIN();
      else { const s = document.createElement('script'); s.src = '../js/main.js'; document.body.appendChild(s); }
    });
  }
  window.NL_START = start;
  if (window.NL_PROJECT) { start(window.NL_PROJECT, window.NL_OPTS || {}); return; }
  window.addEventListener('message', (e) => {
    if (e.source !== window.parent || !e.data || e.data.type !== 'nl-play') return;
    start(e.data.project, e.data.opts);
  });
  if (window.parent !== window) window.parent.postMessage({ type: 'nl-ready' }, '*');
  else {
    // opened on its own: the last playtest, or the sample game
    let P = null;
    try { P = JSON.parse(localStorage.getItem('nightlight_project') || 'null'); } catch (e) { P = null; }
    start(P || (window.NL && NL.sample ? NL.sample() : null), {});
  }
})();
