// Audio: every sound is synthesized with WebAudio (no files).
// SFX helpers + a small chiptune sequencer with one song per area.
(function (G) {
  'use strict';
  const A = (G.Audio = {
    ctx: null, master: null, sfxG: null, musG: null, muted: false, ready: false,
    vol: { master: 0.7, music: 0.32, sfx: 0.75 },
  });
  let noiseBuf = null;
  const waves = {};

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    A.ctx = new AC();
    A.master = A.ctx.createGain();
    A.master.gain.value = A.muted ? 0 : A.vol.master;
    // gentle compressor keeps loud hits from clipping
    const comp = A.ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    A.master.connect(comp); comp.connect(A.ctx.destination);
    A.sfxG = A.ctx.createGain(); A.sfxG.gain.value = A.vol.sfx; A.sfxG.connect(A.master);
    A.musG = A.ctx.createGain(); A.musG.gain.value = A.vol.music; A.musG.connect(A.master);
    const len = A.ctx.sampleRate * 2;
    noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    for (const duty of [0.125, 0.25, 0.5]) {
      const n = 32, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      waves[duty] = A.ctx.createPeriodicWave(re, im);
    }
    A.ready = true;
    if (A._pendingSong) { const s = A._pendingSong; A._pendingSong = null; A.music(s); }
    if (A._pendingAmb) { const s = A._pendingAmb; A._pendingAmb = null; A.ambience(s); }
  };
  A.toggleMute = function () {
    A.muted = !A.muted;
    if (A.master) A.master.gain.setTargetAtTime(A.muted ? 0 : A.vol.master, A.ctx.currentTime, 0.02);
    try { localStorage.setItem('wwh_mute', A.muted ? '1' : '0'); } catch (e) { /* storage blocked */ }
    return A.muted;
  };
  try { A.muted = localStorage.getItem('wwh_mute') === '1'; } catch (e) { /* storage blocked */ }

  const now = () => A.ctx.currentTime;
  function osc(type, freq, t0, dur, vol, opts) {
    opts = opts || {};
    const o = A.ctx.createOscillator();
    if (waves[type]) o.setPeriodicWave(waves[type]);
    else o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + (opts.slideT || dur));
    if (opts.vib) {
      const lfo = A.ctx.createOscillator(), lg = A.ctx.createGain();
      lfo.frequency.value = opts.vib[0]; lg.gain.value = opts.vib[1];
      lfo.connect(lg); lg.connect(o.frequency); lfo.start(t0); lfo.stop(t0 + dur + 0.1);
    }
    const g = A.ctx.createGain();
    const at = opts.attack || 0.005, rel = opts.release || dur * 0.8;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + at);
    g.gain.setValueAtTime(vol, t0 + Math.max(at, dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = g;
    o.connect(g);
    if (opts.filter) {
      const f = A.ctx.createBiquadFilter();
      f.type = opts.filter[0]; f.frequency.value = opts.filter[1];
      g.connect(f); node = f;
    }
    node.connect(opts.dest || A.sfxG);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    return o;
  }
  function noise(t0, dur, vol, ftype, freq, opts) {
    opts = opts || {};
    const s = A.ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = A.ctx.createBiquadFilter();
    f.type = ftype || 'lowpass';
    f.frequency.setValueAtTime(freq || 2000, t0);
    if (opts.q) f.Q.value = opts.q;
    if (opts.slide) f.frequency.exponentialRampToValueAtTime(opts.slide, t0 + dur);
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + (opts.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(opts.dest || A.sfxG);
    s.start(t0, Math.random() * 1.5);
    s.stop(t0 + dur + 0.05);
  }

  const S = {
    blip(pitch, kind) {
      const t = now();
      if (kind === 'witch') osc('sine', pitch || 170, t, 0.09, 0.12, { vib: [9, 8] });
      else osc(0.25, pitch || 520, t, 0.04, 0.05, { release: 0.03 });
    },
    select() { const t = now(); osc(0.5, 660, t, 0.06, 0.08); osc(0.5, 990, t + 0.05, 0.08, 0.07); },
    step() { const t = now(); noise(t, 0.035, 0.035, 'bandpass', 900 + Math.random() * 300, { q: 2 }); },
    shard() {
      const t = now();
      [1318, 1661, 1976, 2637].forEach((f, i) => osc(0.25, f, t + i * 0.045, 0.12, 0.07));
      osc('sine', 3951, t + 0.18, 0.3, 0.04);
    },
    allShards() { const t = now(); [784, 988, 1175, 1568].forEach((f, i) => osc(0.5, f, t + i * 0.08, 0.25, 0.07)); },
    checkpoint() {
      const t = now();
      osc('sine', 110, t, 1.2, 0.18, { vib: [5, 3] });
      osc('sine', 116.5, t, 1.2, 0.12);
      osc('triangle', 880, t + 0.05, 0.9, 0.06, { release: 0.8 });
      osc('triangle', 1320, t + 0.15, 0.8, 0.04, { release: 0.7 });
    },
    crack() { const t = now(); for (let i = 0; i < 3; i++) noise(t + i * 0.04, 0.04, 0.12, 'highpass', 2500 + i * 500); },
    collapse() { const t = now(); noise(t, 0.5, 0.35, 'lowpass', 1800, { slide: 120 }); osc('sine', 90, t, 0.3, 0.2, { slide: 40 }); },
    fall() { const t = now(); osc('sine', 1100, t, 0.8, 0.09, { slide: 90, slideT: 0.8 }); osc(0.5, 550, t, 0.4, 0.03, { slide: 60, slideT: 0.4 }); },
    slash() {
      const t = now();
      noise(t, 0.22, 0.4, 'bandpass', 5000, { slide: 1500, q: 1.5 });
      osc('triangle', 2400, t, 0.4, 0.06, { release: 0.35 });
      osc('sine', 140, t + 0.03, 0.25, 0.25, { slide: 45 });
    },
    hit() { const t = now(); osc('sine', 160, t, 0.22, 0.32, { slide: 40 }); noise(t, 0.12, 0.25, 'lowpass', 1400); },
    burn() { const t = now(); noise(t, 0.7, 0.3, 'lowpass', 3000, { slide: 300 }); for (let i = 0; i < 8; i++) noise(t + Math.random() * 0.6, 0.02, 0.15, 'highpass', 3000); },
    crush() { const t = now(); osc('sine', 120, t, 0.35, 0.45, { slide: 30 }); noise(t, 0.3, 0.4, 'lowpass', 900, { slide: 100 }); },
    splash() { const t = now(); noise(t, 0.5, 0.3, 'bandpass', 1200, { slide: 300, q: 1 }); for (let i = 0; i < 5; i++) osc('sine', 300 + Math.random() * 300, t + 0.2 + i * 0.09, 0.06, 0.06, { slide: 900 }); },
    chomp() { const t = now(); osc(0.5, 140, t, 0.08, 0.2, { slide: 70 }); osc(0.5, 120, t + 0.11, 0.1, 0.2, { slide: 50 }); noise(t + 0.11, 0.12, 0.3, 'lowpass', 1500); },
    zap() { const t = now(); for (let i = 0; i < 6; i++) osc('sawtooth', 200 + Math.random() * 1200, t + i * 0.05, 0.05, 0.08); },
    arrow() { const t = now(); noise(t, 0.12, 0.08, 'highpass', 3500, { slide: 1200 }); },
    spike() { const t = now(); osc('triangle', 1800, t, 0.08, 0.03); noise(t, 0.05, 0.05, 'highpass', 4000); },
    rock() { const t = now(); osc('sine', 80, t, 0.3, 0.3, { slide: 35 }); noise(t, 0.25, 0.25, 'lowpass', 700); },
    portal() { const t = now(); [523, 659, 784, 1047, 1319].forEach((f, i) => osc('triangle', f, t + i * 0.06, 0.6, 0.05, { vib: [6, 4] })); },
    win() {
      const t = now();
      [523, 659, 784, 1047].forEach((f, i) => osc(0.25, f, t + i * 0.09, 0.2, 0.08));
      osc(0.25, 1319, t + 0.4, 0.5, 0.08, { vib: [6, 6] });
      osc('triangle', 262, t + 0.4, 0.5, 0.12);
    },
    horn(len) {
      const t = now();
      len = len || 1.2;
      for (const f of [311, 392, 466]) osc('sawtooth', f, t, len, 0.07, { filter: ['lowpass', 1800], attack: 0.02, release: 0.1 });
    },
    screech() { const t = now(); osc('sawtooth', 1900, t, 0.7, 0.04, { vib: [30, 60], filter: ['bandpass', 2200] }); noise(t, 0.7, 0.12, 'bandpass', 2600, { q: 3 }); },
    crash() {
      const t = now();
      noise(t, 1.6, 0.7, 'lowpass', 4000, { slide: 200 });
      osc('sine', 70, t, 0.8, 0.6, { slide: 25 });
      for (let i = 0; i < 10; i++) osc('triangle', 2000 + Math.random() * 3000, t + Math.random() * 0.3, 0.15, 0.03);
    },
    hoof(vol) {
      const t = now();
      vol = vol || 0.2;
      [0, 0.07, 0.14].forEach((d) => { osc('sine', 95, t + d, 0.07, vol, { slide: 50 }); noise(t + d, 0.04, vol * 0.6, 'lowpass', 500); });
    },
    heartbeat(vol) {
      const t = now();
      vol = vol || 0.5;
      osc('sine', 62, t, 0.16, vol, { slide: 38 });
      osc('sine', 58, t + 0.2, 0.2, vol * 0.8, { slide: 34 });
    },
    rbd() {
      const t = now();
      noise(t, 0.6, 0.0001, 'lowpass', 600);
      const g = A.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
      g.connect(A.sfxG);
      for (const f of [185, 196, 277]) osc('sawtooth', f, t, 0.66, 0.5, { filter: ['lowpass', 900], dest: g, attack: 0.01, release: 0.05 });
      const s = A.ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(5000, t + 0.6);
      s.connect(f); f.connect(g); s.start(t); s.stop(t + 0.7);
    },
    revive() {
      const t = now();
      osc('sine', 1760, t, 0.6, 0.06, { release: 0.55 });
      osc('sine', 2637, t, 0.5, 0.03, { release: 0.45 });
      noise(t, 0.25, 0.08, 'bandpass', 1800, { q: 1, attack: 0.08 });
    },
    chime() { const t = now(); osc('triangle', 659, t, 0.6, 0.1); osc('triangle', 523, t + 0.45, 0.8, 0.1); },
    crosswalk() { const t = now(); for (let i = 0; i < 2; i++) osc('sine', 2200, t + i * 0.18, 0.1, 0.05, { slide: 2700 }); },
    caw() { const t = now(); for (let i = 0; i < 2; i++) { noise(t + i * 0.2, 0.14, 0.12, 'bandpass', 1100, { q: 4 }); osc('sawtooth', 520, t + i * 0.2, 0.14, 0.04, { slide: 380 }); } },
    knightWarn() { const t = now(); osc('triangle', 784, t, 0.12, 0.06); osc('triangle', 784, t + 0.15, 0.12, 0.06); },
    rumble(len) { const t = now(); noise(t, len || 1.5, 0.25, 'lowpass', 160, { attack: len ? len * 0.8 : 1 }); },
    whoosh() { const t = now(); noise(t, 0.35, 0.3, 'bandpass', 800, { slide: 200, q: 0.7, attack: 0.1 }); },
    gasp() { const t = now(); noise(t, 0.3, 0.1, 'bandpass', 1500, { q: 2, attack: 0.12 }); },
  };
  // ---- horror adventure sounds ----
  Object.assign(S, {
    item() { const t = now(); [880, 1175, 1568].forEach((f, i) => osc('triangle', f, t + i * 0.07, 0.25, 0.07)); },
    door() { const t = now(); noise(t, 0.18, 0.18, 'lowpass', 900); osc('sawtooth', 180, t + 0.02, 0.35, 0.03, { slide: 120, filter: ['lowpass', 600] }); noise(t + 0.3, 0.08, 0.2, 'lowpass', 400); },
    locked() { const t = now(); for (let i = 0; i < 2; i++) { noise(t + i * 0.12, 0.05, 0.25, 'bandpass', 1500, { q: 3 }); osc('square', 220, t + i * 0.12, 0.04, 0.04); } },
    unlock() { const t = now(); noise(t, 0.04, 0.3, 'bandpass', 2500, { q: 4 }); osc('triangle', 1200, t + 0.06, 0.12, 0.06, { slide: 800 }); },
    stairs() { const t = now(); for (let i = 0; i < 4; i++) { noise(t + i * 0.12, 0.06, 0.12, 'lowpass', 500); osc('sine', 110, t + i * 0.12, 0.06, 0.08, { slide: 70 }); } },
    step(kind) {
      const t = now();
      if (kind === 'stone') noise(t, 0.04, 0.05, 'bandpass', 1600, { q: 2 });
      else if (kind === 'carpet') noise(t, 0.05, 0.025, 'lowpass', 500);
      else { noise(t, 0.05, 0.05, 'bandpass', 700, { q: 2 }); if (Math.random() < 0.08) osc('sawtooth', 140 + Math.random() * 60, t, 0.18, 0.012, { filter: ['lowpass', 500] }); }
    },
    closet() { const t = now(); osc('sawtooth', 260, t, 0.3, 0.025, { slide: 150, filter: ['lowpass', 700] }); noise(t + 0.25, 0.06, 0.15, 'lowpass', 500); },
    push() { const t = now(); noise(t, 0.35, 0.12, 'lowpass', 300, { attack: 0.05 }); },
    bump() { const t = now(); osc('sine', 90, t, 0.08, 0.15, { slide: 60 }); },
    thud(v) { const t = now(); osc('sine', 70, t, 0.12, 0.3 * (v || 1), { slide: 40 }); noise(t, 0.06, 0.12 * (v || 1), 'lowpass', 300); },
    sting() { const t = now(); for (const f of [196, 207.7, 293.7, 311.1]) osc('sawtooth', f, t, 1.4, 0.05, { filter: ['lowpass', 2400], attack: 0.01, release: 1.2 }); noise(t, 0.6, 0.15, 'highpass', 3000); },
    steps_away() { const t = now(); for (let i = 0; i < 5; i++) osc('sine', 70, t + i * 0.35, 0.1, 0.2 * (1 - i / 5), { slide: 45 }); },
    scare() {
      const t = now();
      noise(t, 1.0, 0.7, 'bandpass', 1800, { q: 0.6 });
      for (const f of [233, 247, 370, 392, 523, 554]) osc('sawtooth', f, t, 1.0, 0.07, { vib: [18, 25], filter: ['lowpass', 3500], attack: 0.005 });
      osc('sine', 60, t, 0.8, 0.5, { slide: 30 });
    },
    death() { const t = now(); for (const f of [110, 116.5, 155.6]) osc('sawtooth', f, t, 2.5, 0.06, { filter: ['lowpass', 700], attack: 0.3, release: 2 }); },
    cursor() { const t = now(); osc('square', 880, t, 0.025, 0.025); },
    cancel() { const t = now(); osc('square', 440, t, 0.04, 0.03, { slide: 330 }); },
    menu() { const t = now(); osc('triangle', 660, t, 0.06, 0.05); osc('triangle', 880, t + 0.05, 0.08, 0.05); },
    paper() { const t = now(); noise(t, 0.18, 0.08, 'highpass', 2500, { attack: 0.03 }); },
    dial() { const t = now(); noise(t, 0.02, 0.12, 'bandpass', 3000, { q: 5 }); },
    slide() { const t = now(); noise(t, 0.1, 0.1, 'bandpass', 900, { q: 1 }); },
    solve() { const t = now(); [523, 659, 784, 1047].forEach((f, i) => osc('triangle', f, t + i * 0.09, 0.4, 0.06)); },
    tick() { const t = now(); osc('square', 2000, t, 0.015, 0.03); },
    save() { const t = now(); [659, 784, 988, 1319].forEach((f, i) => osc('sine', f, t + i * 0.12, 0.6, 0.05)); },
    glass() { const t = now(); noise(t, 0.4, 0.4, 'highpass', 3000); for (let i = 0; i < 8; i++) osc('sine', 2000 + Math.random() * 3000, t + Math.random() * 0.2, 0.2, 0.03); },
    knock() { const t = now(); for (let i = 0; i < 3; i++) { osc('sine', 120, t + i * 0.22, 0.08, 0.35, { slide: 80 }); noise(t + i * 0.22, 0.05, 0.2, 'lowpass', 800); } },
    whisper() { const t = now(); noise(t, 1.2, 0.08, 'bandpass', 2400, { q: 4, attack: 0.3 }); noise(t + 0.2, 0.9, 0.05, 'bandpass', 3400, { q: 5, attack: 0.2 }); },
    laugh() { const t = now(); for (let i = 0; i < 5; i++) osc('triangle', 600 - i * 30, t + i * 0.13, 0.1, 0.05, { vib: [30, 20] }); },
    drip() { const t = now(); osc('sine', 1400, t, 0.08, 0.06, { slide: 700 }); },
    clock() { const t = now(); osc('square', 1800, t, 0.02, 0.03); osc('square', 1500, t + 0.5, 0.02, 0.03); },
    bell() { const t = now(); for (const f of [392, 784, 1176]) osc('sine', f, t, 2.5, 0.08 / (f / 392), { release: 2.4 }); },
    crash() { const t = now(); noise(t, 1.2, 0.6, 'lowpass', 3000, { slide: 200 }); osc('sine', 60, t, 0.6, 0.5, { slide: 25 }); },
    heartbeat(v) { const t = now(); v = v || 0.5; osc('sine', 62, t, 0.16, v, { slide: 38 }); osc('sine', 58, t + 0.2, 0.2, v * 0.8, { slide: 34 }); },
    blip(pitch, wave) { const t = now(); osc(wave || 0.25, pitch || 520, t, 0.035, 0.035, { release: 0.03 }); },
    select() { const t = now(); osc(0.5, 660, t, 0.05, 0.06); osc(0.5, 990, t + 0.04, 0.07, 0.05); },
    rbd() { S.sting(); },
  });
  A.note = function (freq, kind) {
    if (!A.ready || A.muted) return;
    const t = now();
    if (kind === 'detuned') { osc('triangle', freq * 1.03, t, 1.2, 0.08, { release: 1.1 }); osc('sine', freq * 0.97, t, 1.2, 0.06, { release: 1.1 }); }
    else { osc('triangle', freq, t, 1.4, 0.1, { release: 1.3 }); osc('sine', freq * 2, t, 0.8, 0.03, { release: 0.7 }); }
  };
  // ---- ambience: long looping noise drones ----
  let amb = null;
  A.ambience = function (name) {
    if (!A.ready) { A._pendingAmb = name; return; }
    if (amb && amb.name === name) return;
    if (amb) { const g = amb.g; g.gain.setTargetAtTime(0, A.ctx.currentTime, 0.4); const nodes = amb.nodes; setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch (e) { /* stopped */ } }), 2500); amb = null; }
    if (!name) return;
    const g = A.ctx.createGain();
    g.gain.value = 0;
    g.connect(A.master);
    const nodes = [];
    const cfg = { house: [120, 0.05, 55], wind: [500, 0.06, 0], rain: [2500, 0.05, 0], basement: [90, 0.08, 41], hum: [200, 0.03, 60], void: [60, 0.07, 36] }[name] || [150, 0.04, 50];
    const s = A.ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = A.ctx.createBiquadFilter(); f.type = name === 'rain' ? 'highpass' : 'lowpass'; f.frequency.value = cfg[0];
    const lfo = A.ctx.createOscillator(), lg = A.ctx.createGain(); lfo.frequency.value = 0.08; lg.gain.value = cfg[0] * 0.4; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    s.connect(f); f.connect(g); s.start();
    nodes.push(s, lfo);
    if (cfg[2]) { const o = A.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = cfg[2]; const og = A.ctx.createGain(); og.gain.value = 0.25; o.connect(og); og.connect(g); o.start(); nodes.push(o); }
    g.gain.setTargetAtTime(cfg[1] * 3, A.ctx.currentTime, 1.0);
    amb = { name: name, g: g, nodes: nodes };
  };
  A.sfx = function (name, a, b) {
    if (!A.ready || A.muted) return;
    try { S[name] && S[name](a, b); } catch (e) { /* ignore audio errors */ }
  };

  // ---------------- music ----------------
  const NOTE = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11] };
  // chord: [scale degree], built as triads on the scale
  const SONGS = {
    // music-box style: slow, minor, high triangle arps, no drums
    title: { bpm: 66, root: 69, scale: 'harm', prog: [0, 5, 3, 4], arp: [0, 2, 1, 2, 3, 2, 1, 2], lead: 'soft', arpWave: 'triangle', arpVol: 0.04, bassVol: 0.05, seed: 3 },
    house: { bpm: 58, root: 64, scale: 'minor', prog: [0, 5, 0, 4], arp: [0, 1, 2, 1, 0, 2, 1, 3], lead: 'sparse', arpWave: 'triangle', arpVol: 0.025, bassVol: 0.04, seed: 9 },
    calm: { bpm: 70, root: 65, scale: 'major', prog: [0, 3, 5, 4], arp: [0, 1, 2, 1, 3, 2, 1, 2], lead: 'soft', arpWave: 'triangle', arpVol: 0.03, bassVol: 0.04, seed: 12 },
    dread: { bpm: 48, root: 52, scale: 'harm', prog: [0, 1, 0, 6], arp: [0, 2, 1, 3, 0, 2, 1, 2], lead: null, arpWave: 'sine', arpVol: 0.03, bassVol: 0.06, pad: true, seed: 17 },
    chase: { bpm: 172, root: 57, scale: 'harm', prog: [0, 1, 0, 6, 0, 1, 5, 4], arp: [0, 1, 0, 2, 0, 1, 0, 3], lead: 'on', drums: 'rock', pad: true, seed: 23 },
    sad: { bpm: 62, root: 62, scale: 'minor', prog: [5, 3, 0, 4], arp: [0, 1, 2, 3, 2, 1, 2, 1], lead: 'soft', arpWave: 'triangle', arpVol: 0.03, bassVol: 0.04, seed: 31 },
    ending: { bpm: 72, root: 65, scale: 'major', prog: [3, 4, 2, 5, 3, 4, 0, 0], arp: [0, 1, 2, 3, 2, 1, 2, 1], lead: 'soft', arpWave: 'triangle', arpVol: 0.04, seed: 81 },
    badend: { bpm: 52, root: 57, scale: 'harm', prog: [0, 5, 1, 4], arp: [0, 2, 1, 2, 0, 3, 1, 2], lead: 'soft', arpWave: 'sine', arpVol: 0.03, pad: true, seed: 91 },
  };
  function chordNotes(song, deg) {
    const sc = SCALES[song.scale];
    const n = [];
    for (let i = 0; i < 4; i++) {
      const k = deg + i * 2;
      n.push(song.root + sc[k % 7] + 12 * Math.floor(k / 7));
    }
    return n;
  }
  // a two-bar motif made of scale steps, reused on every chord
  function motif(song) {
    const r = G.rng(song.seed);
    const steps = [];
    let deg = 2;
    for (let i = 0; i < 16; i++) {
      const strong = i % 4 === 0;
      if (song.lead === 'sparse' && !strong && r() < 0.75) { steps.push(null); continue; }
      if (song.lead === 'soft' && i % 2 === 1) { steps.push(null); continue; }
      if (!strong && r() < 0.35) { steps.push(null); continue; }
      deg += strong ? (r() < 0.5 ? 0 : r() < 0.5 ? 2 : -2) : r.pick([-1, 1, 1, -1, 2, -2]);
      deg = G.clamp(deg, -2, 7);
      steps.push(deg);
    }
    return steps;
  }
  let cur = null, timer = null;
  A.music = function (name) {
    if (!A.ready) { A._pendingSong = name; return; }
    if (cur && cur.name === name) return;
    A.stopMusic();
    const song = SONGS[name];
    if (!song) return;
    const m = motif(song);
    const stepDur = 60 / song.bpm / 4;
    const state = { name: name, song: song, step: 0, next: A.ctx.currentTime + 0.1, motif: m };
    cur = state;
    timer = setInterval(() => {
      if (cur !== state) return;
      while (state.next < A.ctx.currentTime + 0.2) {
        playStep(state, state.step, state.next, stepDur);
        state.step++;
        state.next += stepDur;
      }
    }, 30);
  };
  A.stopMusic = function (fade) {
    if (timer) clearInterval(timer);
    timer = null;
    cur = null;
  };
  A.duck = function (v, time) {
    if (!A.musG) return;
    A.musG.gain.setTargetAtTime(v * A.vol.music, A.ctx.currentTime, time || 0.1);
  };
  function playStep(st, i, t, sd) {
    const s = st.song, D = A.musG;
    const bar = Math.floor(i / 16), pos = i % 16;
    const deg = s.prog[bar % s.prog.length];
    const ch = chordNotes(s, deg);
    // bass
    if (pos % 4 === 0 || (s.drums === 'pop' && pos % 4 === 2)) {
      const n = pos % 8 === 4 && s.drums ? ch[0] - 12 + 7 : ch[0] - 12;
      osc('triangle', NOTE(n), t, sd * 3.2, s.bassVol || 0.11, { dest: D, release: sd });
    }
    // arpeggio
    if (pos % 2 === 0 || s.bpm < 100) {
      const k = s.arp[(pos >> (s.bpm < 100 ? 0 : 1)) % s.arp.length];
      osc(s.arpWave || 0.25, NOTE(ch[k] + 12), t, sd * 1.6, s.arpVol || 0.035, { dest: D, release: sd });
    }
    if (s.pad && pos === 0) for (const n of ch.slice(0, 3)) osc('sawtooth', NOTE(n), t, sd * 15, 0.018, { dest: D, filter: ['lowpass', 1200], attack: 0.2, release: sd * 4 });
    // lead from the motif, shifted to the chord
    const md = st.motif[(i % 32) % 16 + (bar % 2 ? 0 : 0)];
    if (s.lead && md !== null && md !== undefined && bar % 4 !== 3) {
      const sc = SCALES[s.scale];
      const d0 = deg + md;
      const note = s.root + 12 + sc[G.mod(d0, 7)] + 12 * Math.floor(d0 / 7);
      osc(s.lead === 'soft' ? 'triangle' : 0.5, NOTE(note), t, sd * (s.lead === 'soft' ? 3.5 : 1.8), s.lead === 'soft' ? 0.07 : 0.045, { dest: D, vib: [5, 3], release: sd });
    }
    // drums
    const dr = s.drums;
    if (!dr) return;
    const kick = (v) => osc('sine', 120, t, 0.12, v, { slide: 45, dest: D });
    const snare = (v) => noise(t, 0.1, v, 'highpass', 1800, { dest: D });
    const hat = (v) => noise(t, 0.03, v, 'highpass', 7000, { dest: D });
    if (dr === 'light') { if (pos % 8 === 0) kick(0.14); if (pos % 4 === 2) hat(0.025); }
    if (dr === 'pop') { if (pos % 8 === 0) kick(0.16); if (pos % 8 === 4) snare(0.07); if (pos % 2 === 0) hat(0.02); }
    if (dr === 'march') { if (pos % 4 === 0) kick(0.14); if (pos === 4 || pos === 12 || pos === 14 || pos === 15) snare(0.06); }
    if (dr === 'tom') { if (pos === 0 || pos === 10) osc('sine', 90, t, 0.25, 0.14, { slide: 50, dest: D }); }
    if (dr === 'rock') { if (pos % 8 === 0 || pos === 6) kick(0.17); if (pos % 8 === 4) snare(0.08); hat(pos % 2 ? 0.012 : 0.024); }
  }
})(window.G);
