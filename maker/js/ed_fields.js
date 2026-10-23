// Nightlight Maker editor: form fields. ED.field(obj, key, type, label, opts) returns a labelled
// control that edits obj[key] in place and commits (undo step + autosave) as you type.
(function () {
  'use strict';
  const G = window.G, NL = window.NL, ED = window.ED, h = ED.h;

  const LISTS = { speaker: 'speakers', item: 'items', map: 'maps', sprite: 'sprites', char: 'chars', sfx: 'sfx', music: 'music', ambience: 'ambience', flag: 'flags', ending: 'endings', death: 'deaths', chase: 'chases', common: 'common', portrait: 'portraits', face: 'faces', object: 'objects', wall: 'walls', floor: 'floors' };
  const DIRS = [['', '(as is)'], ['down', 'down'], ['up', 'up'], ['left', 'left'], ['right', 'right']];

  // opts: {full, onChange(value), def (placeholder/default), options: [[v, label]], refresh: ['map', ...]}
  ED.field = function (obj, key, type, label, opts) {
    opts = opts || {};
    const changed = (v, now) => {
      if (v === undefined || v === '' || v === null) delete obj[key]; else obj[key] = v;
      if (opts.onChange) opts.onChange(v);
      if (opts.refresh) ED.refresh(...opts.refresh);
      if (now) ED.commit(); else ED.commitSoon();
    };
    const cur = obj[key];
    let ctl;
    const t = type.split(':')[0], arg = type.split(':').slice(1).join(':');
    if (t === 'text' || t === 'mono' || t === 'path' || LISTS[t] || t === 'entry') {
      ctl = h('input', { type: 'text', value: cur === undefined ? '' : cur, spellcheck: t === 'text' ? 'true' : 'false', placeholder: opts.def !== undefined ? String(opts.def) : '' });
      if (t !== 'text') ctl.classList.add('mono');
      if (LISTS[t]) ctl.setAttribute('list', 'dl-' + LISTS[t]);
      if (t === 'entry') {
        // entry names of the room named in obj[arg] (or the current room)
        ctl.setAttribute('list', 'dl-entries');
        ctl.addEventListener('focus', () => {
          const mid = arg ? obj[arg] : ED.st.map;
          const m = ED.P.maps[mid];
          const dl = ED.$('#dl-entries') || ED.$('#datalists').appendChild(h('datalist#dl-entries'));
          ED.clear(dl);
          for (const n of Object.keys((m && m.entries) || {})) dl.appendChild(h('option', { value: n }));
        });
      }
      ctl.addEventListener('input', () => changed(ctl.value.trim() === '' ? undefined : ctl.value.trim()));
      ctl.addEventListener('change', () => ED.commit());
      const wrap = [ctl];
      if (t === 'sprite' || t === 'char') wrap.push(h('button.small', { type: 'button', title: 'Pick from the art', on: { click: () => ED.pickArt(t, ctl.value, (v) => { ctl.value = v; changed(v || undefined, true); }) } }, 'Pick'));
      if (t === 'sfx') wrap.push(h('button.small', { type: 'button', title: 'Listen', on: { click: () => { G.Audio.init(); G.Audio.sfx(ctl.value); } } }, 'Play'));
      if (t === 'music') wrap.push(h('button.small', { type: 'button', title: 'Listen (click again to stop)', on: { click: () => { G.Audio.init(); if (ED._song === ctl.value) { G.Audio.music(null); ED._song = null; } else { G.Audio.music(ctl.value || null); ED._song = ctl.value; } } } }, 'Play'));
      if (wrap.length > 1) ctl = h('div.pair', wrap);
    } else if (t === 'number') {
      ctl = h('input', { type: 'number', step: 'any', value: cur === undefined ? '' : cur, placeholder: opts.def !== undefined ? String(opts.def) : '' });
      ctl.addEventListener('input', () => changed(ctl.value === '' ? undefined : +ctl.value));
      ctl.addEventListener('change', () => ED.commit());
    } else if (t === 'range') {
      const [lo, hi, st] = (arg || '0|1|0.05').split('|').map(Number);
      const out = h('span.mono', { style: { minWidth: '34px', textAlign: 'right', fontFamily: 'var(--f-mono)', fontSize: '11px', color: 'var(--dim)' } }, String(cur === undefined ? (opts.def !== undefined ? opts.def : lo) : cur));
      const r = h('input', { type: 'range', min: lo, max: hi, step: st, value: cur === undefined ? (opts.def !== undefined ? opts.def : lo) : cur });
      r.addEventListener('input', () => { out.textContent = r.value; changed(+r.value); });
      r.addEventListener('change', () => ED.commit());
      ctl = h('div.pair', { style: { alignItems: 'center' } }, r, out);
    } else if (t === 'textarea' || t === 'code' || t === 'list') {
      const v = t === 'list' ? (cur || []).join('\n') : cur === undefined ? '' : cur;
      ctl = h('textarea' + (t === 'code' ? '.code' : ''), { rows: t === 'code' ? 8 : opts.rows || 3, spellcheck: t === 'code' ? 'false' : 'true', placeholder: opts.def || '' });
      ctl.value = v;
      ctl.addEventListener('input', () => changed(t === 'list' ? ctl.value.split('\n').map((s) => s.trim()).filter(Boolean) : ctl.value === '' ? undefined : ctl.value));
      ctl.addEventListener('change', () => ED.commit());
    } else if (t === 'check') {
      const cb = h('input', { type: 'checkbox', checked: !!cur });
      cb.addEventListener('change', () => changed(cb.checked ? true : undefined, true));
      return h('label.f.chk' + (opts.full ? '.full' : ''), { style: { flexDirection: 'row' } }, cb, h('span', { style: { fontSize: '12px', color: 'var(--bone)' } }, label));
    } else if (t === 'select' || t === 'dir') {
      const options = t === 'dir' ? DIRS : opts.options || arg.split('|').map((v) => [v, v]);
      ctl = h('select', options.map(([v, l]) => h('option', { value: v, selected: String(cur === undefined ? (opts.def !== undefined ? opts.def : '') : cur) === String(v) }, l)));
      ctl.addEventListener('change', () => changed(ctl.value === '' ? undefined : (opts.numeric ? +ctl.value : ctl.value), true));
    } else if (t === 'color') {
      const tx = h('input.mono', { type: 'text', value: cur || '', placeholder: opts.def || '#ffffff' });
      const cp = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(cur || '') ? cur : opts.def && /^#[0-9a-f]{6}$/i.test(opts.def) ? opts.def : '#ffffff' });
      cp.addEventListener('input', () => { tx.value = cp.value; changed(cp.value); });
      cp.addEventListener('change', () => ED.commit());
      tx.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(tx.value)) cp.value = tx.value; changed(tx.value.trim() || undefined); });
      ctl = h('div.pair', cp, tx);
    } else if (t === 'cond') {
      if (!Array.isArray(obj[key])) obj[key] = [];
      ctl = ED.condEditor(obj[key], () => { if (opts.onChange) opts.onChange(obj[key]); });
    } else ctl = h('span', '?' + type);
    return h('label.f' + (opts.full || ['textarea', 'code', 'list', 'cond'].includes(t) ? '.full' : ''), label ? h('span', label) : null, ctl);
  };

  // AND-ed condition list editor (Show only if..., If...)
  ED.condEditor = function (list, onChange) {
    const box = h('div.conds');
    const draw = () => {
      ED.clear(box);
      list.forEach((k, i) => {
        const spec = NL.CONDS[k.t] || { fields: [] };
        const sel = h('select', Object.keys(NL.CONDS).map((t) => h('option', { value: t, selected: t === k.t }, NL.CONDS[t].label)));
        sel.addEventListener('change', () => { list[i] = { t: sel.value }; ED.commit(); draw(); if (onChange) onChange(); });
        const fields = spec.fields.map(([fk, ft, ph]) => {
          const f = ED.field(k, fk, ft, '', { def: ph, onChange: onChange });
          f.style.flex = '1';
          return f;
        });
        box.appendChild(h('div.cond', sel, fields, h('button.small.danger', { type: 'button', title: 'Remove', on: { click: () => { list.splice(i, 1); ED.commit(); draw(); if (onChange) onChange(); } } }, 'x')));
      });
      box.appendChild(h('div', h('button.small', { type: 'button', on: { click: () => { list.push({ t: 'flag', k: '' }); ED.commit(); draw(); if (onChange) onChange(); } } }, list.length ? 'And...' : 'Add a condition')));
    };
    draw();
    return box;
  };

  // art picker: sprites (or characters) as a grid of thumbnails with search
  ED.pickArt = function (kind, cur, done) {
    const names = kind === 'char' ? G.charNames().slice().sort() : ED.spriteNames();
    const q = h('input.search', { type: 'text', placeholder: 'Search ' + names.length + (kind === 'char' ? ' characters' : ' sprites'), autofocus: true });
    const grid = h('div.sprites', { style: { maxHeight: '60vh', overflow: 'auto', width: 'min(760px, 86vw)' } });
    let m = null;
    const draw = () => {
      ED.clear(grid);
      const f = q.value.trim().toLowerCase();
      if (kind !== 'char') grid.appendChild(h('div.sp', { title: 'No picture (invisible)', on: { click: () => { done(''); m.close(); } } }, ED.thumb('', 40), h('span', '(none)')));
      for (const n of names) {
        if (f && n.indexOf(f) < 0) continue;
        grid.appendChild(h('div.sp' + (n === cur ? '.on' : ''), { title: n, on: { click: () => { done(n); m.close(); } } }, ED.thumb(kind === 'char' ? 'char:' + n : n, 48), h('span', n)));
      }
    };
    q.addEventListener('input', draw);
    draw();
    m = ED.modal({ title: kind === 'char' ? 'Pick a character' : 'Pick a sprite', body: h('div', q, grid) });
  };
})();
