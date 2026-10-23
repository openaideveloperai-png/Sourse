// Nightlight Maker editor: wiring. Top bar, tabs, keyboard shortcuts, first load.
(function () {
  'use strict';
  const G = window.G, NL = window.NL, ED = window.ED;
  const st = ED.st;
  if (G.KID && G.KID.build) G.KID.build();

  const ACT = {
    new: () => ED.newProject(), open: () => ED.openFile(), save: () => ED.saveFile(), export: () => ED.exportGame(), sample: () => ED.loadSample(), help: () => ED.help(),
    undo: () => ED.undo(), redo: () => ED.redo(), problems: () => ED.showProblems(), play: () => ED.playtest(), playhere: () => ED.playHere(),
  };
  document.querySelectorAll('#top [data-act]').forEach((b) => b.addEventListener('click', () => ACT[b.dataset.act]()));
  document.querySelectorAll('#leftTabs button').forEach((b) => b.addEventListener('click', () => { st.view = b.dataset.view; st.sel = null; ED.refresh(); }));
  const title = ED.$('#projTitle');
  title.addEventListener('input', () => { ED.P.title = title.value; ED.commitSoon(); });
  title.addEventListener('change', () => ED.commit());
  ED.views.title = () => { if (document.activeElement !== title) title.value = ED.P.title || ''; };

  const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable); };
  window.addEventListener('keydown', (e) => {
    const k = e.key, mod = e.ctrlKey || e.metaKey;
    if (k === 'Escape') {
      const menu = ED.$('#ctxMenu');
      if (!menu.hidden) { menu.hidden = true; return; }
      if (ED.modals.length) { ED.modals[ED.modals.length - 1].close(); return; }
      if (st.place) { st.place = null; ED.refresh('left', 'status', 'map'); return; }
      if (st.sel) { st.sel = null; ED.refresh('inspector', 'map', 'left'); }
      return;
    }
    if (k === 'F5') { e.preventDefault(); return ED.playtest(); }
    if (k === 'F6') { e.preventDefault(); return ED.playHere(); }
    if (mod && k.toLowerCase() === 's') { e.preventDefault(); return ED.saveFile(); }
    if (ED.modals.length || typing()) return;
    if (mod && !e.shiftKey && k.toLowerCase() === 'z') { e.preventDefault(); return ED.undo(); }
    if (mod && (k.toLowerCase() === 'y' || (e.shiftKey && k.toLowerCase() === 'z'))) { e.preventDefault(); return ED.redo(); }
    if (st.view !== 'map') return;
    if (k === 'Delete' || k === 'Backspace') { if (st.sel) { e.preventDefault(); ED.deleteSel(); } return; }
    if (mod && k.toLowerCase() === 'd') { e.preventDefault(); return ED.dupSel(); }
    const o = ED.selObj();
    const arrows = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (arrows[k] && o) { e.preventDefault(); o.x += arrows[k][0]; o.y += arrows[k][1]; ED.commitSoon(); ED.refresh('map', 'inspector'); return; }
    const modes = { t: 'tiles', o: 'objects', e: 'entries', l: 'lights' };
    if (!mod && !e.altKey && modes[k.toLowerCase()]) { st.mode = modes[k.toLowerCase()]; st.sel = null; st.place = null; ED.refresh('left', 'toolbar', 'map', 'inspector', 'status'); }
  });
  window.addEventListener('beforeunload', () => { try { localStorage.setItem('nightlight_project', JSON.stringify(ED.P)); } catch (e) { /* storage full */ } });

  ED.initMap();
  const stored = ED.loadStored();
  ED.load(stored && stored.maps ? stored : NL.sample());
  if (!stored) setTimeout(() => ED.toast('This is a sample game. Press Play to try it, or New to start your own.'), 600);
})();
