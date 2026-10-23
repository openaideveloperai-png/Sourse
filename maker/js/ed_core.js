// Nightlight Maker editor: shared state, undo/redo, autosave, small DOM helpers, dialogs,
// datalists for pickers, and sprite thumbnails. Other ed_*.js files add views to ED.
(function () {
  'use strict';
  const G = window.G, NL = window.NL;
  const ED = (window.ED = {});
  ED.P = null;
  ED.st = {
    view: 'map', map: null, mode: 'tiles', tool: 'pencil', brush: { k: 'floor', v: 'wood' },
    sel: null,          // {k: 'obj', id} | {k: 'entry', id} | {k: 'light', i}
    place: null,        // armed thing to place: {k: 'tpl', id} | {k: 'sprite', v} | {k: 'char', v}
    zoom: window.innerWidth > 1300 ? 3 : 2, grid: true, dark: false, dbCat: 'items', dbSel: null, spriteFilter: '',
  };
  const STORE = 'nightlight_project';

  // ---------------------------------------------------------------- DOM helpers
  ED.$ = (s, r) => (r || document).querySelector(s);
  ED.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  // h('div.cls#id', {attr, on: {click}, style}, ...children)
  ED.h = function (tag, attrs, ...kids) {
    const m = tag.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
    const el = document.createElement((m && m[1]) || 'div');
    if (m && m[2]) for (const p of m[2].match(/[.#][\w-]+/g)) { if (p[0] === '.') el.classList.add(p.slice(1)); else el.id = p.slice(1); }
    if (attrs && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) { kids.unshift(attrs); attrs = null; }
    for (const k of Object.keys(attrs || {})) {
      const v = attrs[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'on') for (const e of Object.keys(v)) el.addEventListener(e, v[e]);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && k !== 'list' && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (k) => { if (k === null || k === undefined || k === false) return; if (Array.isArray(k)) k.forEach(add); else el.appendChild(k.nodeType ? k : document.createTextNode(String(k))); };
    kids.forEach(add);
    return el;
  };
  const h = ED.h;
  ED.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
  ED.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  ED.clone = (o) => JSON.parse(JSON.stringify(o));

  // ---------------------------------------------------------------- refresh hooks
  // Views register a render function; ED.refresh('map', 'inspector') redraws them.
  ED.views = {};
  ED.refresh = function (...names) {
    if (!names.length) names = Object.keys(ED.views);
    for (const n of names) if (ED.views[n]) { try { ED.views[n](); } catch (e) { console.error('[editor] view ' + n, e); } }
  };

  // ---------------------------------------------------------------- undo / redo / autosave
  let undo = [], redo = [], snap = null, soonT = null, saveT = null;
  ED.commit = function () {
    clearTimeout(soonT); soonT = null;
    const s = JSON.stringify(ED.P);
    if (s === snap) return;
    if (snap !== null) { undo.push(snap); if (undo.length > 150) undo.shift(); }
    redo = [];
    snap = s;
    ED.saveSoon();
    ED.checkSoon();
  };
  // for typing: one undo step per pause
  ED.commitSoon = function () { clearTimeout(soonT); soonT = setTimeout(ED.commit, 450); ED.saveSoon(); };
  function restore(s) {
    ED.P = JSON.parse(s);
    snap = s;
    if (!ED.P.maps[ED.st.map]) ED.st.map = Object.keys(ED.P.maps)[0] || null;
    ED.st.sel = null;
    ED.refreshAll();
    ED.saveSoon();
    ED.checkSoon();
  }
  ED.undo = function () { if (soonT) ED.commit(); if (!undo.length) return ED.toast('Nothing to undo'); redo.push(snap); restore(undo.pop()); ED.toast('Undone'); };
  ED.redo = function () { if (!redo.length) return ED.toast('Nothing to redo'); undo.push(snap); restore(redo.pop()); ED.toast('Redone'); };
  ED.saveSoon = function () {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try { localStorage.setItem(STORE, JSON.stringify(ED.P)); ED.saveFail = false; }
      catch (e) { if (!ED.saveFail) ED.toast('Browser storage is full. Use Save file to keep your work.'); ED.saveFail = true; }
    }, 300);
  };
  ED.loadStored = function () { try { return JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { return null; } };
  // open a project (new, sample, file)
  ED.load = function (P) {
    ED.P = NL.upgrade ? NL.upgrade(P) : P;
    undo = []; redo = []; snap = JSON.stringify(ED.P);
    ED.st.map = (ED.P.start && ED.P.maps[ED.P.start.map]) ? ED.P.start.map : Object.keys(ED.P.maps)[0] || null;
    ED.st.sel = null; ED.st.place = null; ED.st.dbSel = null;
    G.MAKER.loadAssets(ED.P).then(() => { ED.applyImages(); ED.refreshAll(); });
    ED.refreshAll();
    ED.saveSoon();
    ED.checkSoon();
  };
  ED.refreshAll = function () { ED.lists(); ED.refresh(); };

  // ---------------------------------------------------------------- problems
  let checkT = null;
  ED.problems = [];
  ED.checkSoon = function () {
    clearTimeout(checkT);
    checkT = setTimeout(() => {
      ED.problems = G.MAKER.check(ED.P);
      const b = ED.$('#probBtn');
      if (b) { b.textContent = ED.problems.length ? ED.problems.length + (ED.problems.length === 1 ? ' problem' : ' problems') : 'No problems'; b.classList.toggle('bad', ED.problems.length > 0); }
    }, 250);
  };

  // ---------------------------------------------------------------- toast, modal, confirm, prompt
  let toastT = null;
  ED.toast = function (msg) {
    const t = ED.$('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
  };
  ED.modals = [];
  // opts: {title, body: node, cls, buttons: [{label, primary, danger, act(close)}], onClose, header: [nodes]}
  ED.modal = function (opts) {
    const root = ED.$('#modalRoot');
    let closed = false;
    const close = () => { if (closed) return; closed = true; back.remove(); ED.modals.splice(ED.modals.indexOf(api), 1); if (opts.onClose) opts.onClose(); };
    const foot = (opts.buttons || []).length ? h('footer', opts.buttons.map((b) => h('button' + (b.primary ? '.play' : '') + (b.danger ? '.danger' : ''), { type: 'button', on: { click: () => (b.act ? b.act(close) : close()) } }, b.label))) : null;
    const box = h('div.modal' + (opts.cls ? '.' + opts.cls : ''), { role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Dialog' },
      h('header', h('h2', opts.title || ''), opts.header || null, h('button.small', { type: 'button', on: { click: close }, title: 'Close (Esc)' }, 'Close')),
      h('div.mb', opts.body || ''), foot);
    const back = h('div.back', { on: { mousedown: (e) => { if (e.target === back && !opts.sticky) close(); } } }, box);
    root.appendChild(back);
    const api = { close: close, el: box, opts: opts };
    ED.modals.push(api);
    setTimeout(() => { const f = box.querySelector('[autofocus], input, select, textarea, button.play'); if (f) f.focus(); }, 0);
    return api;
  };
  ED.confirm = (msg, ok, danger) => new Promise((res) => {
    let done = false;
    const m = ED.modal({ title: 'Are you sure?', body: h('p', { style: { margin: 0, maxWidth: '50ch' } }, msg), buttons: [{ label: 'Cancel', act: (c) => { done = true; res(false); c(); } }, { label: ok || 'OK', primary: !danger, danger: !!danger, act: (c) => { done = true; res(true); c(); } }], onClose: () => { if (!done) res(false); } });
    return m;
  });
  ED.prompt = (title, value, label) => new Promise((res) => {
    let done = false;
    const inp = h('input', { type: 'text', value: value || '', autofocus: true, spellcheck: 'false' });
    const ok = (c) => { done = true; res(inp.value.trim()); c(); };
    let m = null;
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(m.close); });
    m = ED.modal({ title: title, body: h('label.f', h('span', label || ''), inp), buttons: [{ label: 'Cancel', act: (c) => { done = true; res(null); c(); } }, { label: 'OK', primary: true, act: ok }], onClose: () => { if (!done) res(null); } });
    setTimeout(() => inp.select(), 0);
  });

  // ---------------------------------------------------------------- ids and lookups
  ED.map = () => (ED.P && ED.st.map ? ED.P.maps[ED.st.map] : null);
  ED.obj = (id, m) => ((m || ED.map()) ? (m || ED.map()).objects.find((o) => o.id === id) : null);
  ED.selObj = () => (ED.st.sel && ED.st.sel.k === 'obj' ? ED.obj(ED.st.sel.id) : null);
  ED.uniq = function (base, taken) {
    base = String(base || 'thing').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '') || 'thing';
    const has = (k) => (Array.isArray(taken) ? taken.includes(k) : !!taken[k]);
    if (!has(base)) return base;
    for (let i = 2; ; i++) if (!has(base + i)) return base + i;
  };
  ED.slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');
  // every command list in the project: fn(list, where)
  ED.eachList = function (fn) {
    const P = ED.P;
    for (const mid of Object.keys(P.maps)) {
      const m = P.maps[mid];
      for (const o of m.objects || []) { if (o.on) fn(o.on, mid + '/' + o.id); if (o.touch) fn(o.touch, mid + '/' + o.id); }
      for (const k of ['first', 'enter']) if (m.events && m.events[k]) fn(m.events[k], mid + '/' + k);
    }
    for (const id of Object.keys(P.chases || {})) if (P.chases[id].onEnd) fn(P.chases[id].onEnd, 'chase/' + id);
    for (const id of Object.keys(P.common || {})) if (P.common[id].list) fn(P.common[id].list, 'common/' + id);
    for (const id of Object.keys(P.items || {})) if (P.items[id].use) fn(P.items[id].use, 'item/' + id);
  };
  ED.eachCmd = function (fn) {
    const walk = (list) => { for (const c of list || []) { if (!c) continue; fn(c); for (const k of ['then', 'else', 'ok', 'fail', 'cancel']) if (c[k]) walk(c[k]); if (c.branches) c.branches.forEach(walk); } };
    ED.eachList((l) => walk(l));
  };
  ED.flagNames = function () {
    const out = new Set();
    const addConds = (cs) => { for (const k of cs || []) if (k.k) out.add(k.k); };
    ED.eachCmd((c) => { if (c.k && ['set', 'unset', 'add', 'random'].includes(c.c)) out.add(c.k); if (c.cond) addConds(c.cond); });
    for (const m of Object.values(ED.P.maps)) for (const o of m.objects || []) addConds(o.show);
    for (const f of String(ED.P.startFlags || '').split(/[\s,]+/)) if (f) out.add(f);
    return Array.from(out).sort();
  };

  // ---------------------------------------------------------------- datalists
  const SPRITE_SKIP = /^(icon_|pic_|scare_)/;
  ED.spriteNames = () => G.spriteNames().slice().sort();
  ED.lists = function () {
    const root = ED.$('#datalists');
    if (!root || !ED.P) return;
    const P = ED.P;
    const L = {
      maps: Object.keys(P.maps), items: Object.keys(P.items || {}), speakers: Object.keys(P.speakers || {}), endings: Object.keys(P.endings || {}),
      deaths: Object.keys(P.deaths || {}), chases: Object.keys(P.chases || {}), common: Object.keys(P.common || {}),
      sprites: ED.spriteNames(), chars: G.charNames().slice().sort(), portraits: Object.keys(G.PORTRAITS).sort(),
      sfx: G.Audio ? G.Audio.sfxNames() : ['door', 'locked', 'unlock', 'item', 'knock', 'scare', 'sting', 'keys', 'thunder', 'whisper', 'static', 'glass', 'bell', 'ring', 'meow', 'hiss', 'step', 'stairs', 'heartbeat', 'drip', 'clock', 'creak'],
      music: ['title', 'house', 'calm', 'dread', 'hunt', 'chase', 'sad', 'ending', 'badend'], ambience: ['house', 'wind', 'rain', 'basement', 'hum', 'void'],
      flags: ED.flagNames(), faces: ['neutral', 'happy', 'sad', 'scared', 'shock', 'annoyed', 'determined', 'pain', 'confused', 'kind', 'tired', 'creepy', 'dead'],
      walls: Object.keys(G.WALLS), floors: Object.keys(G.FLOORS), objects: ['@self'].concat((ED.map() ? ED.map().objects : []).map((o) => o.id)),
    };
    ED.L = L;
    ED.clear(root);
    for (const k of Object.keys(L)) root.appendChild(h('datalist#dl-' + k, L[k].map((v) => h('option', { value: v }))));
  };

  // ---------------------------------------------------------------- thumbnails
  const thumbs = {};
  // a sprite's first frame (or a character's front view) on a canvas, fitted into size x size
  ED.thumb = function (name, size) {
    size = size || 32;
    const key = name + '@' + size;
    if (thumbs[key]) return thumbs[key].cloneNode ? copy(thumbs[key]) : null;
    const c = document.createElement('canvas');
    let f = null;
    if (name && name.indexOf('char:') === 0) { const ch = G.getChar(name.slice(5)); f = ch && (ch.down || ch.left)[0]; }
    else if (name) { const s = G.getSprite(name); f = s && s.frames[0]; }
    if (!f) { c.width = c.height = size; const x = c.getContext('2d'); x.strokeStyle = '#5d5568'; x.setLineDash([3, 3]); x.strokeRect(4.5, 4.5, size - 9, size - 9); thumbs[key] = c; return copy(c); }
    const s = Math.max(1, Math.floor(Math.min(size / f.w, size / f.h))) || 1;
    const k = Math.min(size / f.w, size / f.h) < 1 ? Math.min(size / f.w, size / f.h) : s;
    c.width = Math.max(1, Math.round(f.w * k)); c.height = Math.max(1, Math.round(f.h * k));
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(f.c, 0, 0, c.width, c.height);
    thumbs[key] = c;
    return copy(c);
  };
  function copy(c) { const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; d.getContext('2d').drawImage(c, 0, 0); return d; }
  ED.dropThumbs = (prefix) => { for (const k of Object.keys(thumbs)) if (!prefix || k.indexOf(prefix) === 0) delete thumbs[k]; };
  // a floor / wall swatch drawn by the engine's room renderer
  const swatches = {};
  ED.tileThumb = function (kind, type) {
    const key = kind + ':' + type;
    if (!swatches[key]) {
      const tiles = kind === 'wall' ? ['###', 'WWW', 'WWW', '...'] : ['...', '...', '...'];
      const cv = G.renderRoom({ w: 3, h: tiles.length, tiles: tiles, floor: { '.': kind === 'wall' ? 'wood' : type }, wall: kind === 'wall' ? type : 'plaster' });
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      c.getContext('2d').drawImage(cv, 16, kind === 'wall' ? 24 : 16, 16, 16, 0, 0, 16, 16);
      swatches[key] = c;
    }
    return copy(swatches[key]);
  };
  // re-register imported images (after loading or importing)
  ED.applyImages = function () {
    const P = ED.P;
    if (!G.MAKER.applyAssets) return;
    G.MAKER.applyAssets(P);
    ED.dropThumbs();
    ED.lists();
  };
})();
