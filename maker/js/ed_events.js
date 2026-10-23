// Nightlight Maker editor: the event editor. An event is a list of commands, shown like
// RPG Maker's: one line per command, branches indented, an empty slot at the end of each list.
(function () {
  'use strict';
  const G = window.G, NL = window.NL, ED = window.ED, h = ED.h;
  const BR_KEYS = ['then', 'else', 'ok', 'fail', 'cancel'];
  ED.clip = null;

  // make a fresh command with its defaults and empty branches
  ED.newCmd = function (type) {
    const spec = NL.CMDS[type];
    const c = { c: type };
    for (const [k, , , d] of spec.fields) if (d !== undefined) c[k] = d;
    if (type === 'choice') { c.options = ['Yes', 'No']; c.branches = [[], []]; }
    if (type === 'if') { c.cond = [{ t: 'flag', k: '' }]; c.then = []; c.else = []; }
    if (spec.branches && type !== 'choice' && type !== 'if') for (const [k] of spec.branches(c)) c[k] = [];
    return c;
  };
  const branchList = (c, key) => {
    if (key.indexOf('branches.') === 0) { const i = +key.split('.')[1]; c.branches = c.branches || []; while (c.branches.length <= i) c.branches.push([]); return c.branches[i]; }
    if (!c[key]) c[key] = [];
    return c[key];
  };

  ED.editEvent = function (o, key) {
    if (!Array.isArray(o[key])) o[key] = [];
    const label = key === 'touch' ? 'When stepped on' : 'When examined';
    ED.editList(o[key], o.id + ': ' + label, () => { if (!o[key].length) delete o[key]; ED.commit(); ED.refresh('inspector', 'map'); });
  };
  ED.editRoomEvent = function (mapId, key) {
    const m = ED.P.maps[mapId];
    m.events = m.events || {};
    if (!Array.isArray(m.events[key])) m.events[key] = [];
    ED.editList(m.events[key], (m.name || mapId) + ': ' + (key === 'first' ? 'First visit' : 'Every visit'), () => { ED.commit(); ED.refresh('inspector'); });
  };

  // the editor itself
  ED.editList = function (root, title, onClose) {
    let rows = [], sel = 0;
    const listEl = h('div.cmds', { tabindex: 0, role: 'listbox', 'aria-label': 'Commands' });
    const side = h('div.side');
    const render = (keepScroll) => {
      const top = listEl.scrollTop;
      rows = [];
      const walk = (list, depth) => {
        list.forEach((c, i) => {
          rows.push({ t: 'cmd', list: list, i: i, c: c, depth: depth });
          const spec = NL.CMDS[c.c];
          if (spec && spec.branches) for (const [key, lab] of spec.branches(c)) {
            rows.push({ t: 'br', label: lab, depth: depth + 1 });
            walk(branchList(c, key), depth + 2);
          }
        });
        rows.push({ t: 'slot', list: list, i: list.length, depth: depth });
      };
      walk(root, 0);
      sel = Math.max(0, Math.min(sel, rows.length - 1));
      ED.clear(listEl);
      rows.forEach((r, ri) => {
        const pad = { paddingLeft: 6 + r.depth * 16 + 'px' };
        let el;
        if (r.t === 'cmd') {
          const spec = NL.CMDS[r.c.c] || { label: r.c.c, cat: 'Advanced', sum: () => '' };
          let sum = '';
          try { sum = spec.sum(r.c); } catch (e) { sum = ''; }
          el = h('div.cl' + (r.c.off ? '.off' : ''), { 'data-cat': spec.cat, style: pad, title: spec.label + (sum ? ': ' + sum : '') }, h('span.dia', '◆'), h('span.nm', spec.label + (sum ? ':' : '')), h('span.sm', sum));
        } else if (r.t === 'br') el = h('div.cl.br', { style: pad }, h('span.dia', ':'), h('span', r.label));
        else el = h('div.cl.slot', { style: pad, title: 'Add a command here (Enter or double-click)' }, h('span.dia', '◆'));
        if (ri === sel) el.classList.add('on');
        el.addEventListener('mousedown', (e) => { if (r.t !== 'br') { e.preventDefault(); sel = ri; render(true); showForm(); listEl.focus(); } });
        el.addEventListener('dblclick', () => { if (r.t === 'slot' || r.t === 'cmd') insert(); });
        listEl.appendChild(el);
      });
      if (keepScroll) listEl.scrollTop = top;
      else { const on = listEl.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest' }); }
    };
    const cur = () => rows[sel];
    // ---- form for the selected command
    function showForm() {
      ED.clear(side);
      const r = cur();
      if (!r || r.t !== 'cmd') {
        side.appendChild(h('div', h('p.hint', 'Pick a line on the left. Double-click an empty line (or press Enter) to add a command there.'),
          h('div.btnrow', { style: { marginTop: '10px' } }, h('button.play', { type: 'button', on: { click: insert } }, 'Add command')),
          h('p.hint', { style: { marginTop: '16px' } }, 'Keys: Enter add, Del delete, Ctrl+C / Ctrl+V copy and paste, Alt+Up / Alt+Down move, Ctrl+/ turn a line off.'),
          h('p.hint', 'In text, {name} shows the value of a flag or counter. A line that starts with @who:face switches the speaker for that line.')));
        return;
      }
      const c = r.c, spec = NL.CMDS[c.c];
      if (!spec) { side.appendChild(h('p.hint', 'Unknown command ' + c.c)); return; }
      const f = h('div.form');
      for (const [k, type, label] of spec.fields) {
        const opts = { onChange: () => render(true) };
        if (c.c === 'choice' && k === 'options') opts.onChange = () => { const n = (c.options || []).length; c.branches = c.branches || []; while (c.branches.length < n) c.branches.push([]); if (c.branches.length > n) c.branches.length = n; render(true); };
        if (type === 'face') opts.def = 'neutral';
        f.appendChild(ED.field(c, k, type, label, opts));
      }
      side.appendChild(h('div', h('h3', { style: { margin: '0 0 10px', fontSize: '14px' } }, spec.label), f,
        c.c === 'say' ? preview(c) : null,
        h('div.btnrow', { style: { marginTop: '14px' } },
          h('button.small', { type: 'button', on: { click: () => { ED.clip = ED.clone(c); ED.toast('Copied'); } } }, 'Copy'),
          h('button.small', { type: 'button', on: { click: () => { c.off = !c.off; if (!c.off) delete c.off; ED.commit(); render(true); } } }, c.off ? 'Turn on' : 'Turn off'),
          h('button.small.danger', { type: 'button', on: { click: del } }, 'Delete'))));
    }
    // what a Show text box will say
    function preview(c) {
      const sp = c.who && ED.P.speakers[c.who];
      return h('p.hint', { style: { marginTop: '8px' } }, sp ? 'Speaker: ' + (sp.name || c.who) + (sp.portrait ? ', with portrait ' + sp.portrait : '') : c.who ? 'No speaker called "' + c.who + '" yet: add one in Database > Speakers.' : 'Narration (no name box).');
    }
    // ---- editing
    function insert() {
      const r = cur();
      if (!r || r.t === 'br') return;
      ED.pickCommand((type) => {
        const c = ED.newCmd(type);
        r.list.splice(r.i, 0, c);
        ED.commit();
        render();
        sel = rows.findIndex((x) => x.t === 'cmd' && x.c === c);
        render();
        showForm();
        const first = side.querySelector('input, textarea, select');
        if (first) first.focus();
      });
    }
    function del() {
      const r = cur();
      if (!r || r.t !== 'cmd') return;
      r.list.splice(r.i, 1);
      ED.commit(); render(true); showForm();
    }
    function paste() {
      const r = cur();
      if (!ED.clip || !r || r.t === 'br') return;
      r.list.splice(r.i, 0, ED.clone(ED.clip));
      ED.commit(); render(true); showForm();
    }
    function moveBy(d) {
      const r = cur();
      if (!r || r.t !== 'cmd') return;
      const j = r.i + d;
      if (j < 0 || j >= r.list.length) return;
      const [c] = r.list.splice(r.i, 1);
      r.list.splice(j, 0, c);
      ED.commit(); render();
      sel = rows.findIndex((x) => x.t === 'cmd' && x.c === c);
      render(); showForm();
    }
    listEl.addEventListener('keydown', (e) => {
      const k = e.key;
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        if (e.altKey) return moveBy(k === 'ArrowDown' ? 1 : -1);
        let n = sel;
        do { n += k === 'ArrowDown' ? 1 : -1; } while (rows[n] && rows[n].t === 'br');
        if (rows[n]) { sel = n; render(); showForm(); }
      } else if (k === 'Enter') { e.preventDefault(); insert(); }
      else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); del(); }
      else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'c') { const r = cur(); if (r && r.t === 'cmd') { ED.clip = ED.clone(r.c); ED.toast('Copied'); } }
      else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'x') { const r = cur(); if (r && r.t === 'cmd') { ED.clip = ED.clone(r.c); del(); } }
      else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'v') { e.preventDefault(); paste(); }
      else if ((e.ctrlKey || e.metaKey) && k === '/') { const r = cur(); if (r && r.t === 'cmd') { r.c.off = !r.c.off; if (!r.c.off) delete r.c.off; ED.commit(); render(true); showForm(); } }
    });
    render();
    showForm();
    const m = ED.modal({
      title: title, cls: 'ev', sticky: true,
      header: [h('button.small', { type: 'button', on: { click: insert } }, 'Add command'), h('button.small', { type: 'button', on: { click: paste }, title: 'Paste the copied command above the selected line' }, 'Paste')],
      body: h('div', { style: { display: 'contents' } }, listEl, side),
      buttons: [{ label: 'Done', primary: true }],
      onClose: onClose,
    });
    // the modal body is the grid: put the two panes straight into it
    const mb = m.el.querySelector('.mb');
    ED.clear(mb); mb.appendChild(listEl); mb.appendChild(side);
    setTimeout(() => listEl.focus(), 0);
  };

  // command picker, grouped like RPG Maker's tabs
  ED.pickCommand = function (done) {
    const grid = h('div.picker');
    let m = null;
    for (const cat of NL.CATS) {
      const col = h('div', h('h4', cat));
      for (const type of Object.keys(NL.CMDS)) {
        const s = NL.CMDS[type];
        if (s.cat !== cat) continue;
        col.appendChild(h('button', { type: 'button', on: { click: () => { m.close(); done(type); } } }, s.label));
      }
      grid.appendChild(col);
    }
    m = ED.modal({ title: 'Add a command', body: grid });
  };
})();
