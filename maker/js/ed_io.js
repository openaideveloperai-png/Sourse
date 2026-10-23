// Nightlight Maker editor: playtest, export a finished game, open/save project files,
// the problems list and the help page.
(function () {
  'use strict';
  const G = window.G, NL = window.NL, ED = window.ED, h = ED.h;
  const st = ED.st;

  // fill in anything an older or hand-written project lacks
  NL.upgrade = function (P) {
    P = P || NL.blank();
    const B = NL.blank();
    for (const k of Object.keys(B)) if (P[k] === undefined) P[k] = B[k];
    P.maps = P.maps || {};
    if (!Object.keys(P.maps).length) P.maps.room1 = NL.newMap('First room', 12, 9);
    for (const m of Object.values(P.maps)) {
      m.tiles = m.tiles || NL.roomTiles(12, 9); m.floor = m.floor || { '.': 'wood' }; m.objects = m.objects || []; m.entries = m.entries || {}; m.lights = m.lights || [];
      m.events = m.events || {}; m.events.first = m.events.first || []; m.events.enter = m.events.enter || [];
    }
    P.assets = P.assets || {}; P.assets.images = P.assets.images || {};
    if (!P.id) P.id = NL.uid();
    return P;
  };

  // ---------------------------------------------------------------- playtest
  // opts.from = {map, x, y, dir} starts in a room instead of on the title screen
  ED.playtest = function (opts) {
    ED.commit();
    const P = ED.P;
    const bad = G.MAKER.check(P).filter((p) => /start room/.test(p.msg));
    if (bad.length && !(opts && opts.from)) return ED.toast(bad[0].msg);
    const fr = h('iframe', { title: 'Playtest' });
    // the one-file maker builds the game page itself; the repo version loads play.html
    if (window.NL_SOURCES) { fr.srcdoc = ED.buildGameHtml(window.NL_SOURCES, P, opts); fr.addEventListener('load', () => setTimeout(() => fr.focus(), 50)); }
    else fr.src = 'play.html';
    let started = false;
    const onMsg = (e) => {
      if (e.source === fr.contentWindow && e.data && e.data.type === 'nl-started') started = true;
      if (e.source !== fr.contentWindow || !e.data || e.data.type !== 'nl-ready') return;
      fr.contentWindow.postMessage({ type: 'nl-play', project: JSON.parse(JSON.stringify(P)), opts: opts || {} }, '*');
      setTimeout(() => fr.focus(), 50);
    };
    window.addEventListener('message', onMsg);
    setTimeout(() => {
      if (started || !fr.isConnected) return;
      fr.replaceWith(h('div', { style: { padding: '24px', maxWidth: '60ch' } }, h('p', 'The playtest could not start in this page. Some embedded viewers do not allow a game inside the editor.'), h('p.hint', 'Use Export game and open the file, or open the maker from the repository (maker/index.html).')));
    }, 6000);
    ED.modal({
      title: 'Playtest: ' + (P.title || 'Untitled') + (opts && opts.from ? '  (from ' + opts.from.map + ')' : ''), cls: 'playwrap', sticky: true, body: fr,
      header: [h('span.hint', 'Arrows move, Z examine, X menu, Shift run. Click the game if keys do nothing.')],
      onClose: () => { window.removeEventListener('message', onMsg); fr.src = 'about:blank'; },
    });
  };
  ED.playHere = function () {
    const m = ED.map();
    if (!m) return;
    const o = ED.selObj();
    if (o) return ED.playtest({ from: { map: st.map, x: o.x, y: o.y + (o.h || 1), dir: 'up' } });
    const e = Object.values(m.entries || {})[0];
    ED.playtest({ from: e ? { map: st.map, x: e[0], y: e[1], dir: e[2] } : { map: st.map, x: 2, y: 4, dir: 'down' } });
  };

  // ---------------------------------------------------------------- files
  const download = (name, text, type) => {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: type })), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  const fileBase = () => ED.slug(ED.P.title) || 'my_game';
  // some embedded viewers block downloads: there, also offer the text to copy
  const embedded = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  function offerCopy(title, what, text) {
    const ta = h('textarea.code', { rows: 6, readOnly: true });
    ta.value = text.length > 200000 ? text.slice(0, 2000) + '\n... (' + Math.round(text.length / 1024) + ' KB, use Copy)' : text;
    const copy = () => {
      const done = () => ED.toast('Copied ' + what);
      try { navigator.clipboard.writeText(text).then(done, () => { ta.value = text; ta.select(); ED.toast('Press Ctrl+C to copy'); }); }
      catch (e) { ta.value = text; ta.select(); ED.toast('Press Ctrl+C to copy'); }
    };
    ED.modal({ title: title, body: h('div', { style: { width: 'min(640px, 86vw)' } }, h('p.hint', 'If nothing was downloaded, this page is not allowed to save files here. Copy the text and save it in a file yourself.'), ta), buttons: [{ label: 'Close' }, { label: 'Copy ' + what, primary: true, act: () => copy() }] });
  }
  ED.saveFile = function () {
    ED.commit();
    const text = JSON.stringify(ED.P, null, 1);
    download(fileBase() + '.nightlight.json', text, 'application/json');
    ED.toast('Saved ' + fileBase() + '.nightlight.json');
    if (embedded) offerCopy('Save file', 'project', text);
  };
  const openText = (text, name) => {
    let P = null;
    try { P = JSON.parse(text); } catch (e) { ED.toast('That is not a Nightlight project (not JSON).'); return false; }
    if (!P || typeof P !== 'object' || !P.maps) { ED.toast('That is not a Nightlight project (no rooms).'); return false; }
    ED.load(P);
    ED.toast('Opened ' + (P.title || name || 'project'));
    return true;
  };
  ED.openFile = function () {
    const inp = ED.$('#fileOpen');
    inp.value = '';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { if (openText(rd.result, f.name) && ED.modals.length) ED.modals[ED.modals.length - 1].close(); };
      rd.readAsText(f);
    };
    if (!embedded) return inp.click();
    const ta = h('textarea.code', { rows: 8, placeholder: 'Or paste a project here' });
    ED.modal({ title: 'Open a project', body: h('div', { style: { width: 'min(640px, 86vw)', display: 'flex', flexDirection: 'column', gap: '10px' } }, h('div', h('button', { type: 'button', on: { click: () => inp.click() } }, 'Choose a .json file')), ta),
      buttons: [{ label: 'Cancel' }, { label: 'Open pasted text', primary: true, act: (c) => { if (openText(ta.value)) c(); } }] });
  };
  ED.newProject = async function () {
    if (!(await ED.confirm('Start a new, empty game? Save your current one first if you want to keep it (Save file).', 'New game', true))) return;
    ED.load(NL.blank());
    st.view = 'map'; ED.refresh();
  };
  ED.loadSample = async function () {
    if (!(await ED.confirm('Open the sample game? It replaces what is open now. Save first if you want to keep it.', 'Open sample', true))) return;
    ED.load(NL.sample());
    st.view = 'map'; ED.refresh();
  };

  // ---------------------------------------------------------------- export
  // A finished game is one HTML file: the engine, the runtime and the project inside it.
  ED.engineSources = async function () {
    if (window.NL_SOURCES) return window.NL_SOURCES;
    const files = NL.ENGINE_FILES.concat(['js/main.js', 'css/style.css', 'maker/js/runtime.js', 'maker/js/boot.js']);
    const out = {};
    for (const f of files) {
      const r = await fetch('../' + f);
      if (!r.ok) throw new Error('could not read ' + f);
      out[f] = await r.text();
    }
    return out;
  };
  const safe = (s) => String(s).replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
  ED.buildGameHtml = function (src, P, opts) {
    const t = ED.esc(P.title || 'Untitled');
    const js = NL.ENGINE_FILES.map((f) => '<script>/* ' + f + ' */\n' + safe(src[f]) + '\n</script>').join('\n');
    return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">\n' +
      '<title>' + t + '</title>\n<meta name="description" content="' + ED.esc(P.subtitle || 'A game made with Nightlight Maker') + '">\n<meta name="generator" content="Nightlight Maker">\n' +
      '<style>\n' + src['css/style.css'] + '\n</style>\n</head>\n<body>\n<div id="wrap">\n  <canvas id="game" width="416" height="240" aria-label="' + t + '"></canvas>\n' +
      '  <div id="touch" aria-hidden="true">\n    <div id="dpad"><span class="u"></span><span class="d"></span><span class="l"></span><span class="r"></span></div>\n    <div id="btns"><button id="btnB" type="button">X</button><button id="btnA" type="button">Z</button></div>\n  </div>\n</div>\n' +
      js + '\n<script>/* maker/js/runtime.js */\n' + safe(src['maker/js/runtime.js']) + '\n</script>\n' +
      '<script>window.NL_PROJECT = ' + safe(JSON.stringify(P)) + ';' + (opts ? ' window.NL_OPTS = ' + safe(JSON.stringify(opts)) + ';' : '') + '</script>\n' +
      '<script>window.NL_MAIN = function () {\n' + safe(src['js/main.js']) + '\n};</script>\n' +
      '<script>/* maker/js/boot.js */\n' + safe(src['maker/js/boot.js']) + '\n</script>\n</body>\n</html>\n';
  };
  ED.exportGame = async function () {
    ED.commit();
    const probs = G.MAKER.check(ED.P);
    let src;
    try { src = await ED.engineSources(); } catch (e) {
      return ED.modal({ title: 'Export needs the files next to the maker', body: h('div', { style: { maxWidth: '60ch' } },
        h('p', 'The browser will not let a page opened straight from your disk read the engine files. Open the maker from a web server instead:'),
        h('ul', h('li', 'the GitHub Pages site of this repository (…/maker/), or'), h('li', 'a local server: run ', h('code', 'npx serve'), ' in the repository folder and open /maker/, or'), h('li', 'the one-file maker: run ', h('code', 'node tools/build_maker.js'), ' and open dist/nightlight-maker.html.'))) });
    }
    const html = ED.buildGameHtml(src, ED.P);
    download(fileBase() + '.html', html, 'text/html');
    if (embedded) offerCopy('Export game', 'game HTML', html);
    ED.toast('Exported ' + fileBase() + '.html (' + Math.round(html.length / 1024) + ' KB)' + (probs.length ? '. It has ' + probs.length + ' problems.' : ''));
  };

  // ---------------------------------------------------------------- problems
  ED.showProblems = function () {
    ED.problems = G.MAKER.check(ED.P);
    const list = h('ul.problems', { style: { margin: 0, paddingLeft: '18px', maxWidth: '70ch' } });
    if (!ED.problems.length) list.appendChild(h('li', 'Nothing points at something that does not exist. Playtest to find the rest.'));
    let m = null;
    for (const p of ED.problems) {
      const [mid, oid] = p.where.split(' / ');
      const go = ED.P.maps[mid] ? () => { m.close(); st.view = 'map'; st.map = mid; st.mode = 'objects'; st.sel = oid && ED.obj(oid, ED.P.maps[mid]) ? { k: 'obj', id: oid } : null; ED.lists(); ED.refresh(); } : null;
      list.appendChild(h('li', h('span.w', { on: go ? { click: go } : {}, title: go ? 'Go there' : '' }, p.where), '  ', p.msg));
    }
    m = ED.modal({ title: ED.problems.length ? ED.problems.length + (ED.problems.length === 1 ? ' problem' : ' problems') : 'No problems', body: list });
  };

  // ---------------------------------------------------------------- help
  ED.help = function () {
    const H = (t) => h('h3', t), p = (...k) => h('p', ...k), k = (t) => h('kbd', t);
    ED.modal({ title: 'How Nightlight Maker works', cls: 'help', body: h('div',
      p('You make a game out of rooms. Each room is painted with tiles and filled with objects. Objects run events: lists of commands such as Show text, Give item, Go to room, Start a chase.'),
      H('1. Paint a room'), p('Pick the Tiles mode. Choose Room box and drag on the map to draw a room: a ceiling row, two rows of wall, then floor. Paint other floors with the Pencil. The wall style is set for the whole room.'),
      H('2. Place objects'), p('Pick the Objects mode. Click a ready-made object (door, item to pick up, hiding spot, save point...), a character or any sprite, then click the map. Drag to move. The panel on the right sets what it does.'),
      H('3. Write events'), p('Double-click an object (or press "When examined" on the right). Double-click the empty line to add a command. Commands with branches, like Show choices or If, indent what happens in each case.'),
      H('4. Connect rooms'), p('Add an entry point (Entries mode) where the player should arrive. Make a door: tick "Door or exit", pick the room and the entry point. Floor exits trigger when walked on.'),
      H('5. Flags, items and puzzles'), p('Flags remember things ("Set flag", "If flag is on"). Items live in the Database. Code locks, tunes, putting things in order, clocks and "Use an item here" are puzzle commands with right and wrong branches.'),
      H('6. Danger'), p('Define a chase in Database > Chases, then use "Start a chase". Hiding spots and safe rooms let the player escape. Game over texts and endings live in the Database too.'),
      H('7. Play and share'), p('Play starts from the title screen; right-click the map to play from any spot. Export game makes a single HTML file anyone can open. Save file keeps your project; the maker also keeps your work in this browser.'),
      H('Keys'), p(k('Ctrl+Z'), ' undo  ', k('Ctrl+Y'), ' redo  ', k('Del'), ' delete  ', k('Ctrl+D'), ' copy object  ', k('Arrows'), ' nudge object  ', k('T'), ' ', k('O'), ' ', k('E'), ' ', k('L'), ' modes  ', k('F5'), ' play  ', k('F6'), ' play this room  ', k('Esc'), ' cancel'),
      p('The art (over 400 sprites and the characters of NOBODY HOME) and the engine come from NOBODY HOME. Import your own PNGs in Database > Images.')) });
  };
})();
