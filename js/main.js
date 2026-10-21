// Boot, main loop, input (keyboard + touch), scaling, save data, scene flow.
(function (G) {
  'use strict';
  const W = G.W, H = G.H;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  G.ctx = ctx;

  const q = new URLSearchParams(location.search);
  G.DEV = q.get('dev') ? { god: q.get('god') === '1', hit: q.get('hit') === '1' } : null;

  // ---------------- save data ----------------
  const KEY = 'wwh_save_v1';
  G.Game = {
    level: 0, deaths: 0, time: 0, flags: {}, levelDeaths: [], started: false, cleared: false,
    reset() {
      this.level = 0; this.deaths = 0; this.time = 0; this.flags = {}; this.levelDeaths = []; this.started = true; this.cleared = false;
      this.persist();
    },
    persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify({ level: this.level, deaths: this.deaths, time: this.time, flags: this.flags, levelDeaths: this.levelDeaths, started: this.started, cleared: this.cleared }));
      } catch (e) { /* storage blocked: progress lasts for this session only */ }
    },
    load() {
      try {
        const d = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (d) Object.assign(this, d);
      } catch (e) { /* ignore */ }
    },
    finishLevel(idx, deaths, time) {
      this.levelDeaths[idx] = (this.levelDeaths[idx] || 0) + deaths;
      this.level = idx + 1;
      this.persist();
    },
  };
  G.Game.load();

  // ---------------- input ----------------
  const held = {};
  let pressed = {};
  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'ok', Space: 'ok', Enter: 'ok', KeyJ: 'ok', KeyX: 'back', Escape: 'pause', KeyP: 'pause', KeyM: 'mute', KeyF: 'full', KeyH: 'hit',
  };
  window.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    e.preventDefault();
    G.Audio.init();
    if (!held[k]) pressed[k] = true;
    held[k] = true;
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.code];
    if (k) held[k] = false;
  });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
  G.held = held;

  // touch controls: a d-pad on the left, A and pause buttons on the right
  function bindTouch() {
    const pad = document.getElementById('touch');
    if (!pad) return;
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouch) document.body.classList.add('touch');
    const dpad = document.getElementById('dpad');
    const setDir = (ev) => {
      const r = dpad.getBoundingClientRect();
      let mx = 0, my = 0;
      for (const t of ev.touches) {
        const x = t.clientX - r.left - r.width / 2, y = t.clientY - r.top - r.height / 2;
        if (Math.abs(x) > r.width * 0.75 || Math.abs(y) > r.height * 0.75) continue;
        const a = Math.atan2(y, x), d = Math.hypot(x, y);
        if (d < r.width * 0.12) continue;
        const oct = Math.round(a / (Math.PI / 4));
        mx = [1, 1, 0, -1, -1, -1, 0, 1, 1][oct + 4] !== undefined ? Math.round(Math.cos(oct * Math.PI / 4)) : 0;
        my = Math.round(Math.sin(oct * Math.PI / 4));
      }
      const set = (k, v) => { if (v && !held[k]) pressed[k] = true; held[k] = v; };
      set('left', mx < 0); set('right', mx > 0); set('up', my < 0); set('down', my > 0);
    };
    dpad.addEventListener('touchstart', (e) => { e.preventDefault(); G.Audio.init(); setDir(e); }, { passive: false });
    dpad.addEventListener('touchmove', (e) => { e.preventDefault(); setDir(e); }, { passive: false });
    dpad.addEventListener('touchend', (e) => { e.preventDefault(); setDir(e); }, { passive: false });
    dpad.addEventListener('touchcancel', (e) => { e.preventDefault(); setDir(e); }, { passive: false });
    const btn = (id, k) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); G.Audio.init(); pressed[k] = true; held[k] = true; }, { passive: false });
      el.addEventListener('touchend', (e) => { e.preventDefault(); held[k] = false; }, { passive: false });
    };
    btn('btnA', 'ok');
    btn('btnP', 'pause');
  }
  bindTouch();
  canvas.addEventListener('pointerdown', () => { G.Audio.init(); pressed.ok = true; setTimeout(() => {}, 0); });

  function readInput() {
    let mx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    let my = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    const anyPress = !!(pressed.ok || pressed.up || pressed.down || pressed.left || pressed.right);
    return { mx, my, ok: !!pressed.ok, back: !!pressed.back, pause: !!pressed.pause, up: !!pressed.up, down: !!pressed.down, left: !!pressed.left, right: !!pressed.right, anyPress };
  }

  // ---------------- scaling ----------------
  function resize() {
    const wrap = document.getElementById('wrap');
    const touch = document.body.classList.contains('touch');
    const availW = window.innerWidth, availH = window.innerHeight - (touch && window.innerHeight > window.innerWidth ? 190 : 0);
    let s = Math.min(availW / W, availH / H);
    if (s >= 1) s = Math.floor(s * 2) / 2 >= 2 ? Math.floor(s) : Math.max(1, Math.floor(s * 2) / 2);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
    if (wrap) wrap.style.minHeight = '';
  }
  window.addEventListener('resize', resize);
  resize();
  G.toggleFull = function () {
    try {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
    } catch (e) { /* fullscreen not allowed here */ }
  };

  // ---------------- scenes ----------------
  let scene = null, next = null, fade = 0, fadeDir = 0, fadeCb = null;
  G.setScene = function (s) { scene = s; };
  G.fadeTo = function (makeScene, speed) {
    if (fadeDir === 1) return;
    fadeDir = 1;
    fadeCb = makeScene;
    G.fadeSpeed = speed || 2.6;
  };
  G.goNext = function (idx) {
    if (idx + 1 < G.LEVELS.length) G.fadeTo(() => new G.Play(idx + 1));
    else G.fadeTo(() => new G.Ending(), 1.2);
  };
  G.startGame = function (cont) {
    if (!cont) { G.Game.reset(); G.fadeTo(() => new G.Intro(), 1.5); }
    else if (G.Game.cleared) G.fadeTo(() => new G.Ending(), 1.5);
    else if (G.Game.level === 0 && !G.Game.flags.woke) G.fadeTo(() => new G.Wake(), 1.5);
    else G.fadeTo(() => new G.Play(Math.min(G.Game.level, G.LEVELS.length - 1)), 1.5);
  };

  // pause menu over the current scene
  let paused = null;
  G.openPause = function (sc) {
    G.Audio.sfx('select');
    paused = {
      sc: sc,
      menu: new G.Menu([
        { label: 'Resume', act: () => { paused = null; } },
        { label: () => 'Sound: ' + (G.Audio.muted ? 'OFF' : 'ON'), act: () => G.Audio.toggleMute() },
        { label: () => 'Show hitboxes: ' + (G.DEV && G.DEV.hit ? 'ON' : 'OFF'), act: () => { G.DEV = G.DEV || {}; G.DEV.hit = !G.DEV.hit; } },
        { label: 'Fullscreen', act: () => G.toggleFull() },
        { label: 'Quit to title', act: () => { paused = null; G.Dialog.lines = null; G.fadeTo(() => new G.Title()); } },
      ]),
    };
  };

  // ---------------- loop ----------------
  let last = performance.now(), acc = 0, rt = 0;
  const STEP = 1 / 60;
  function tick(ts) {
    let dt = Math.min(0.1, (ts - last) / 1000);
    last = ts;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 6) {
      acc -= STEP;
      steps++;
      rt += STEP;
      const inp = readInput();
      pressed = {};
      if (inp.mute === undefined && held.mute) { /* handled below */ }
      update(STEP, inp);
    }
    if (steps === 6) acc = 0;
    render();
    requestAnimationFrame(tick);
  }
  let muteLatch = false, fullLatch = false, hitLatch = false;
  function update(dt, inp) {
    if (held.mute && !muteLatch) { G.Audio.toggleMute(); }
    muteLatch = !!held.mute;
    if (held.full && !fullLatch) G.toggleFull();
    fullLatch = !!held.full;
    if (held.hit && !hitLatch) { G.DEV = G.DEV || {}; G.DEV.hit = !G.DEV.hit; }
    hitLatch = !!held.hit;
    G.Shake.update(dt);
    if (fadeDir !== 0) {
      fade += fadeDir * dt * G.fadeSpeed;
      if (fadeDir === 1 && fade >= 1) {
        fade = 1;
        fadeDir = -1;
        G.Dialog.lines = null;
        scene = fadeCb();
        fadeCb = null;
      } else if (fadeDir === -1 && fade <= 0) { fade = 0; fadeDir = 0; }
      if (scene && scene.update && fadeDir === -1) scene.update(dt, { mx: 0, my: 0 });
      return;
    }
    if (paused) {
      if (inp.pause || inp.back) { paused = null; return; }
      paused.menu.update(inp);
      return;
    }
    if (scene && scene.update) scene.update(dt, inp);
  }
  function render() {
    ctx.save();
    if (scene && scene.draw) scene.draw(ctx);
    if (paused) {
      ctx.fillStyle = 'rgba(7,4,12,0.78)';
      ctx.fillRect(0, 0, W, H);
      G.text(ctx, 'PAUSED', W / 2, 52, { align: 'center', scale: 2, color: '#ffffff', shadow: '#3a1460' });
      G.text(ctx, 'Deaths so far: ' + G.Game.deaths + '    Time: ' + G.fmtTime(G.Game.time), W / 2, 80, { align: 'center', color: '#a9a2bb' });
      paused.menu.draw(ctx, W / 2, 104, rt);
      G.text(ctx, 'Arrows/WASD move  -  Z/Space confirm  -  M mute  -  F fullscreen', W / 2, H - 16, { align: 'center', color: '#5a5466' });
    }
    if (fade > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + G.clamp(fade, 0, 1).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  // ---------------- boot ----------------
  G.KID.build();
  G.MOB.build();
  const lvl = q.get('level');
  if (G.DEV && lvl !== null) scene = new G.Play(+lvl);
  else if (G.DEV && q.get('scene')) scene = new G[q.get('scene')]();
  else scene = new G.Title();
  requestAnimationFrame(tick);
  window.__G = G;
})(window.G);
