// The gameplay scene: runs one chapter, handles deaths and Return by Death.
(function (G) {
  'use strict';
  const TS = G.TS, TOP = G.TOP, W = G.W, H = G.H, COLS = G.COLS, ROWS = G.ROWS;
  const M = () => G.MOB;

  const LIGHTING = {
    meadow: { dark: 0, overlay: 'rgba(255,180,120,0.10)', vig: 0.35 },
    village: { dark: 0, overlay: 'rgba(255,200,140,0.08)', vig: 0.35 },
    forest: { dark: 0.62, tint: '#04120a', player: 52, vig: 0.6 },
    castle: { dark: 0, overlay: 'rgba(255,190,140,0.06)', vig: 0.4 },
    crypt: { dark: 0.9, tint: '#040208', player: 48, vig: 0.7 },
    volcano: { dark: 0.5, tint: '#1a0404', player: 44, vig: 0.55 },
    void: { dark: 0.7, tint: '#0a0318', player: 52, vig: 0.7 },
    street: { dark: 0.78, tint: '#04071a', vig: 0.5 },
  };
  G.LIGHTING = LIGHTING;

  const CAPTIONS = {
    pit: ['Fell into the abyss.', 'The floor had other plans.', 'Gravity: 1. You: 0.', 'Wrong way.'],
    knight: ["Cut down by a passing knight. He didn't notice.", 'Stood still too long. A knight rode by.', 'The knight did not slow down.', 'Wrong place. Wrong time. Standing still.'],
    slime: ['Absorbed by a slime.', 'Death by jelly.', 'The slime was not friendly.'],
    carriage: ['Run over by a carriage. Again.', 'Should have looked both ways.', 'Hit by Carriage-kun.'],
    cavalry: ['Trampled by the royal cavalry.', 'The cavalry has right of way.', 'Cut down at full gallop.'],
    wolf: ['Eaten by wolves.', 'The wolves were, in fact, hungry.'],
    crow: ['Pecked to death by crows.', 'A murder of crows. Literally.'],
    arrow: ['Shot by a wall.', 'Took an arrow to the everything.'],
    spikes: ['Impaled.', 'Spikes are pointy. You are not.'],
    rock: ['Flattened by a falling rock.', 'Look up next time.'],
    fire: ['Burned to a crisp.', 'Too hot to handle.'],
    ghost: ['A ghost took your soul.', 'Boo.'],
    wisp: ['Burned by witchfire.'],
    hex: ['Burned by witchfire.', 'The purple flame was hungry.'],
    hand: ["The witch's hand caught you.", '"Don\'t go," it whispered.'],
    lava: ['Went for a swim. In lava.', 'Lava is hot. Who knew.'],
    water: ["Drowned. You can't swim.", 'Glub.'],
    mimic: ['That was not a shard.', 'Eaten by a shard. Embarrassing.'],
    fakeportal: ['That was not the way home.', 'Wrong portal.'],
    blade: ['Sliced in half.', 'Swing and a hit.'],
  };
  G.CAPTIONS = CAPTIONS;

  function Play(idx, opts) {
    opts = opts || {};
    this.idx = idx;
    this.def = G.LEVELS[idx];
    this.L = G.parseLevel(this.def);
    this.map = G.renderMap(this.L);
    this.save = null;
    this.S = G.newRun(this.L, null);
    this.phase = 'card';
    this.pt = 0;
    this.t = 0;
    this.anim = 0;
    this.chunks = [];
    this.markers = [];
    this.remember = {};
    this.deaths = 0;
    this.runTime = 0;
    this.stepT = 0;
    this.hoofT = 0;
    this.portalOpen = this.L.shards.length === 0;
    this.lastCp = -1;
    this.firstVisit = !G.Game.flags['seen' + idx] && !(G.DEV && G.DEV.skipTalk);
    G.FX.clear();
    G.Audio.music(this.def.music || 'meadow');
    this.dynPit = {};
    this.knightSeen = !!G.Game.flags.knightSeen;
  }
  G.Play = Play;

  Play.prototype.startPlay = function () {
    this.phase = 'play';
    this.pt = 0;
  };

  // ---------------- update ----------------
  Play.prototype.update = function (dt, inp) {
    this.t += dt;
    this.pt += dt;
    G.FX.update(dt);
    if (G.Dialog.active) { G.Dialog.update(dt, inp); return; }
    if (inp.pause && (this.phase === 'play' || this.phase === 'revive')) { G.openPause(this); return; }
    switch (this.phase) {
      case 'card':
        if (this.pt > 2.6 || (inp.ok && this.pt > 0.4)) {
          this.phase = 'talk';
          this.pt = 0;
          const lines = this.firstVisit ? this.def.intro : null;
          G.Game.flags['seen' + this.idx] = true;
          G.Game.persist();
          if (lines && lines.length) G.Dialog.say(lines, () => this.startPlay());
          else this.startPlay();
        }
        break;
      case 'talk':
        break;
      case 'play':
      case 'revive':
        this.updatePlay(dt, inp);
        break;
      case 'dying':
        if (this.pt > 0.3 && inp.anyPress) { this.respawn(); break; }
        if (this.pt >= this.dyingTime) { this.phase = 'rbd'; this.pt = 0; G.Audio.sfx('rbd'); G.Audio.sfx('heartbeat', 0.6); }
        break;
      case 'rbd':
        if (inp.anyPress) { this.respawn(); break; }
        if (this.pt >= 0.7) this.respawn();
        break;
      case 'won':
        if (this.pt >= 2.4 || (inp.ok && this.pt > 1.2)) {
          this.phase = 'leaving';
          G.Game.finishLevel(this.idx, this.deaths, this.runTime);
          G.goNext(this.idx);
        }
        break;
    }
  };

  Play.prototype.updatePlay = function (dt, inp) {
    const S = this.S;
    if (this.phase === 'revive' && this.pt > 0.45) this.phase = 'play';
    this.runTime += dt;
    G.Game.time += dt;
    const ev = G.step(S, { mx: inp.mx, my: inp.my }, dt);
    if (S.moving) {
      this.anim += dt;
      this.stepT += dt;
      if (this.stepT > 0.27) { this.stepT = 0; G.Audio.sfx('step'); }
      if (this.phase === 'revive') this.phase = 'play';
    } else this.anim = 0;
    // hoofbeats while the knight approaches
    if (S.knight) {
      this.hoofT -= dt;
      if (this.hoofT <= 0) {
        this.hoofT = 0.26;
        const age = S.t - S.knight.t0;
        G.Audio.sfx('hoof', 0.08 + Math.min(0.3, age * 0.25));
      }
      if (S.knight.phase === 'charge' && Math.random() < 0.6) G.FX.dust(S.knight.x - S.knight.dir * 14, S.knight.y, 1);
    }
    for (const e of ev) this.onEvent(e);
  };

  Play.prototype.onEvent = function (e) {
    const S = this.S, L = this.L;
    switch (e.e) {
      case 'shard': {
        const s = L.shards[e.i];
        G.FX.sparkle(s.x, s.y - 6);
        G.Audio.sfx('shard');
        if (S.got.every(Boolean)) {
          this.portalOpen = true;
          G.Audio.sfx('portal');
          if (L.exit) { G.FX.sparkle(L.exit.x, L.exit.y - 14, ['#ffffff', '#9ff2ff'], 16); }
        }
        break;
      }
      case 'checkpoint': {
        this.save = G.saveOf(S, e.i);
        const cp = L.checkpoints[e.i];
        G.FX.sparkle(cp.x, cp.y - 10, ['#ffffff', '#c890ff', '#7a3ac8'], 12);
        G.Audio.sfx('checkpoint');
        this.cpFlash = this.t;
        break;
      }
      case 'crack':
        G.Audio.sfx('crack');
        break;
      case 'collapse':
        this.chunks.push({ c: e.c, r: e.r, t0: this.t });
        G.FX.dust(e.c * TS + 8, e.r * TS + 10, 6);
        G.Audio.sfx('collapse');
        break;
      case 'knight':
        G.Audio.sfx('knightWarn');
        if (!this.knightSeen) {
          this.knightSeen = true;
          G.Game.flags.knightSeen = true;
        }
        break;
      case 'die':
        this.die(e);
        break;
      case 'win':
        this.phase = 'won';
        this.pt = 0;
        G.Audio.sfx('win');
        G.FX.sparkle(L.exit.x, L.exit.y - 12, ['#ffffff', '#9ff2ff', '#3ac8e8'], 20);
        break;
    }
  };

  // ---------------- death ----------------
  Play.prototype.die = function (e) {
    const S = this.S;
    if (G.DEV && G.DEV.god) { S.dead = null; return; }
    this.phase = 'dying';
    this.pt = 0;
    this.deaths++;
    G.Game.deaths++;
    G.Game.persist();
    this.markers.push({ x: S.x, y: S.y });
    if (this.markers.length > 80) this.markers.shift();
    const type = e.type, by = e.by;
    this.deathType = type;
    this.deathBy = by;
    this.dyingTime = { fall: 0.85, slash: 0.8, burn: 0.95, crush: 0.7, drown: 0.9, chomp: 0.85, grab: 0.95 }[type] || 0.75;
    const fc = Math.floor(S.x / TS), fr = Math.floor((S.y - 2) / TS);
    if (type === 'fall') this.remember[fc + ',' + fr] = true;
    const capList = CAPTIONS[by] || CAPTIONS[by && by.replace(/[A-Z]$/, '')] || ['You died.'];
    this.caption = capList[this.deaths % capList.length];
    // knockback direction: away from the hazard
    this.kx = 0;
    this.ky = 0;
    const hx = S.x, hy = S.y - 6;
    G.Shake.add(type === 'crush' ? 4 : 2.5, 0.25);
    switch (type) {
      case 'fall': G.Audio.sfx('fall'); break;
      case 'slash': G.Audio.sfx('slash'); G.FX.blood(hx, hy, S.knight ? S.knight.dir : 1, 22); this.slashDir = S.knight ? S.knight.dir : 1; break;
      case 'burn': G.Audio.sfx('burn'); G.FX.embers(hx, hy, 18); break;
      case 'crush': G.Audio.sfx('crush'); G.FX.dust(S.x, S.y, 14); G.FX.blood(hx, S.y - 2, 0, 10); break;
      case 'drown': G.Audio.sfx('splash'); break;
      case 'chomp': G.Audio.sfx('chomp'); break;
      case 'grab': G.Audio.sfx('rbd'); break;
      case 'impale': G.Audio.sfx('hit'); G.Audio.sfx('spike'); G.FX.blood(hx, hy, 0, 16); break;
      case 'arrow': G.Audio.sfx('hit'); G.FX.blood(hx, hy, 1, 12); break;
      default: G.Audio.sfx('hit'); G.FX.blood(hx, hy, Math.random() < 0.5 ? -1 : 1, 14); break;
    }
    if (by === 'knight') { G.Audio.sfx('hoof', 0.4); }
    G.Audio.duck(0.25, 0.05);
    this.deadSnapshot = { t: S.t, knight: S.knight ? Object.assign({}, S.knight) : null };
  };

  Play.prototype.respawn = function () {
    const first = G.Game.deaths === 1 && !G.Game.flags.rbdExplained;
    this.S = G.newRun(this.L, this.save);
    this.phase = 'revive';
    this.pt = 0;
    this.chunks = [];
    G.Audio.sfx('revive');
    G.Audio.sfx('gasp');
    G.Audio.duck(1, 0.4);
    this.flash = this.t;
    const hooks = this.def.onDeath;
    if (first && this.idx === 0) {
      G.Game.flags.rbdExplained = true;
      G.Game.persist();
      G.Dialog.say(G.STORY.firstDeath, () => { this.phase = 'play'; });
    } else if (hooks && hooks[this.deaths]) {
      G.Dialog.say(hooks[this.deaths]);
    } else if (G.STORY.milestones[G.Game.deaths]) {
      G.Dialog.say(G.STORY.milestones[G.Game.deaths]);
    }
  };

  // ---------------- drawing ----------------
  Play.prototype.worldTime = function () {
    if (this.phase === 'card' || this.phase === 'talk') return this.t;
    if (this.phase === 'dying' || this.phase === 'rbd') return this.deadSnapshot.t;
    return this.S.t;
  };

  function pushHaz(list, lights, hz, t, anim) {
    const st = hz.state(t);
    const mf = M();
    const fr = (arr, fps, off) => arr[Math.floor((anim + (off || 0)) * fps) % arr.length];
    const shadow = (x, y, w) => list.push({ y: y - 100, ground: true, draw: (ctx, ox, oy) => { ctx.fillStyle = 'rgba(10,6,18,0.35)'; ctx.fillRect(Math.round(ox + x - w), Math.round(oy + y), w * 2, 2); ctx.fillRect(Math.round(ox + x - w + 1), Math.round(oy + y - 1), w * 2 - 2, 1); ctx.fillRect(Math.round(ox + x - w + 1), Math.round(oy + y + 2), w * 2 - 2, 1); } });
    switch (hz.kind) {
      case 'patrol':
      case 'orbit':
      case 'swing': {
        const pts = hz.kind === 'orbit' ? st.list : [st];
        pts.forEach((p, k) => {
          const sk = hz.skin;
          const flip = (p.dx || 0) < 0 || (hz.kind === 'orbit' && Math.sin(p.a) * (hz.R ? 1 : 0) > 0 && false);
          if (sk === 'slime' || sk === 'slimeB' || sk === 'slimeR') {
            const arr = sk === 'slime' ? mf.slime : sk === 'slimeB' ? mf.slimeB : mf.slimeR;
            shadow(p.x, p.y + 4, 5);
            list.push({ y: p.y + 5, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(arr, 8, k * 0.13), ox + p.x, oy + p.y + 5) });
          } else if (sk === 'wolf') {
            shadow(p.x, p.y + 4, 8);
            list.push({ y: p.y + 6, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.wolf, 12, k * 0.1), ox + p.x, oy + p.y + 6, flip) });
          } else if (sk === 'crow') {
            shadow(p.x, p.y + 6, 4);
            list.push({ y: p.y + 6, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.crow, 12, k * 0.2), ox + p.x, oy + p.y + 2, flip) });
          } else if (sk === 'ghost') {
            shadow(p.x, p.y + 6, 4);
            list.push({ y: p.y + 6, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.ghost, 6, k * 0.25), ox + p.x, oy + p.y + 6, flip, 0.88) });
            lights.push({ x: p.x, y: p.y + TOP, r: 26, col: '#9fb8ff', glow: 0.15 });
          } else if (sk === 'hand') {
            list.push({ y: p.y + 6, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.hand, 7, k * 0.3), ox + p.x, oy + p.y + 7) });
            lights.push({ x: p.x, y: p.y + TOP, r: 22, col: '#a050ff', glow: 0.2 });
          } else if (sk === 'blade') {
            list.push({ y: p.y + 6, draw: (ctx, ox, oy) => {
              ctx.fillStyle = '#5a5462';
              const n = Math.floor(Math.hypot(p.x - hz.cx, p.y - hz.cy) / 3);
              for (let i = 0; i < n; i++) { const u = i / n; ctx.fillRect(Math.round(ox + hz.cx + (p.x - hz.cx) * u), Math.round(oy + hz.cy + (p.y - hz.cy) * u), 2, 2); }
              G.drawFrame(ctx, mf.blade, ox + p.x, oy + p.y);
            } });
          } else {
            // fire, wisp, hex
            const arr = mf[sk] || mf.fire;
            shadow(p.x, p.y + 6, 3);
            list.push({ y: p.y + 4, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(arr, 10, k * 0.17), ox + p.x, oy + p.y + 2) });
            lights.push({ x: p.x, y: p.y + TOP, r: 30, col: sk === 'wisp' ? '#6a7aff' : sk === 'hex' ? '#a050ff' : '#ff8a2a', glow: 0.3 });
          }
        });
        if (hz.kind === 'swing') list.push({ y: hz.cy - 100, ground: true, draw: (ctx, ox, oy) => { ctx.fillStyle = '#2a2530'; ctx.fillRect(ox + hz.cx - 2, oy + hz.cy - 2, 5, 5); ctx.fillStyle = '#8a8496'; ctx.fillRect(ox + hz.cx - 1, oy + hz.cy - 1, 3, 3); } });
        break;
      }
      case 'bar': {
        list.push({ y: hz.cy + 6, draw: (ctx, ox, oy) => { ctx.fillStyle = '#1a1420'; ctx.fillRect(ox + hz.cx - 4, oy + hz.cy - 3, 9, 8); ctx.fillStyle = '#5a5462'; ctx.fillRect(ox + hz.cx - 3, oy + hz.cy - 2, 7, 6); ctx.fillStyle = '#8a8496'; ctx.fillRect(ox + hz.cx - 3, oy + hz.cy - 2, 7, 1); } });
        const arr = mf[hz.skin] || mf.fire;
        st.list.forEach((p, k) => {
          list.push({ y: p.y + 4, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(arr, 12, k * 0.21), ox + p.x, oy + p.y + 2) });
          if (k % 2 === 0) lights.push({ x: p.x, y: p.y + TOP, r: 26, col: hz.skin === 'hex' ? '#a050ff' : hz.skin === 'wisp' ? '#6a7aff' : '#ff8a2a', glow: 0.25 });
        });
        break;
      }
      case 'lane': {
        st.list.forEach((p, k) => {
          if (hz.skin === 'crow') {
            shadow(p.x, p.y + 6, 4);
            list.push({ y: p.y + 6, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.crow, 12, k * 0.2), ox + p.x, oy + p.y + 1, hz.dir < 0) });
          } else if (hz.skin === 'cavalry') {
            list.push({ y: p.y + 7, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.knight, 12, k * 0.2), ox + p.x, oy + p.y + 8, hz.dir < 0) });
          } else {
            list.push({ y: p.y - 100, ground: true, draw: (ctx, ox, oy) => { ctx.fillStyle = 'rgba(10,6,18,0.3)'; ctx.fillRect(Math.round(ox + p.x - hz.len / 2), Math.round(oy + p.y + 4), hz.len, 4); } });
            list.push({ y: p.y + 7, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.carriage, 10, k * 0.3), ox + p.x, oy + p.y + 8, hz.dir < 0) });
            lights.push({ x: p.x + (hz.dir > 0 ? -12 : 12), y: p.y + TOP - 6, r: 30, col: '#ffd27a', glow: 0.2 });
          }
        });
        break;
      }
      case 'arrow': {
        // turret mouth on its wall tile
        const tx = hz.tc * TS + 8, ty = hz.tr * TS + 8;
        list.push({ y: ty - 100, ground: true, draw: (ctx, ox, oy) => {
          const cx = ox + tx + hz.dx * 5, cy = oy + ty + hz.dy * 5 + 2;
          ctx.fillStyle = '#140c1c'; ctx.fillRect(cx - 3, cy - 3, 6, 6);
          ctx.fillStyle = st.charge < 0.2 ? '#ff5040' : '#5a3a3a'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
        } });
        for (const a of st.list) {
          const f = hz.dx ? mf.arrowH : mf.arrowV;
          list.push({ y: a.y + 4, draw: (ctx, ox, oy) => G.drawFrame(ctx, f, ox + a.x, oy + a.y, hz.dx < 0 || hz.dy < 0 ? true : false, a.stuck ? Math.max(0, 1 - (a.age - (a.age - 0)) ) : 1) });
        }
        break;
      }
      case 'rock': {
        const u = G.clamp(st.u, 0, 1);
        if (!st.landed) {
          const w = Math.round(2 + u * 8);
          list.push({ y: hz.y - 100, ground: true, draw: (ctx, ox, oy) => { ctx.fillStyle = 'rgba(10,6,18,' + (0.2 + u * 0.35).toFixed(2) + ')'; ctx.fillRect(Math.round(ox + hz.x - w), Math.round(oy + hz.y - 1), w * 2, 3); ctx.fillRect(Math.round(ox + hz.x - w + 2), Math.round(oy + hz.y - 2), w * 2 - 4, 5); } });
          if (u > 0.45) {
            const yoff = (1 - (u - 0.45) / 0.55) * 140;
            list.push({ y: hz.y + 200, draw: (ctx, ox, oy) => G.drawFrame(ctx, mf.rock, ox + hz.x, oy + hz.y - yoff) });
          }
        } else if (st.lt < hz.fall + 0.35) {
          list.push({ y: hz.y + 4, draw: (ctx, ox, oy) => G.drawFrame(ctx, mf.rock, ox + hz.x, oy + hz.y + 2, false, 1 - (st.lt - hz.fall) / 0.35) });
        }
        break;
      }
      case 'mimic': {
        const y = st.y + Math.round(Math.sin(anim * 3 + 1.3) * 1.5);
        shadow(st.x, st.y + 5, 3);
        list.push({ y: st.y + 5, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.shard, 9, 0.37), ox + st.x, oy + y + 4) });
        lights.push({ x: st.x, y: st.y + TOP - 4, r: 28, col: '#7ff5ff', glow: 0.25 });
        break;
      }
      case 'static': {
        if (hz.skin === 'fakeportal') {
          list.push({ y: st.y + 7, draw: (ctx, ox, oy) => G.drawFrame(ctx, fr(mf.portalFake, 10), ox + st.x, oy + st.y + 7) });
          lights.push({ x: st.x, y: st.y + TOP - 8, r: 50, col: '#a582ff', glow: 0.3 });
        }
        break;
      }
    }
  }

  Play.prototype.drawKid = function (ctx, ox, oy) {
    const S = this.S;
    const K = G.KID;
    const x = ox + S.x, y = oy + S.y;
    // shadow
    ctx.fillStyle = 'rgba(10,6,18,0.4)';
    ctx.fillRect(Math.round(x - 5), Math.round(y - 1), 10, 2);
    ctx.fillRect(Math.round(x - 4), Math.round(y - 2), 8, 1);
    if (this.phase === 'revive' && !S.moving) {
      G.drawFrame(ctx, M().gasp, x, y + 1);
      return;
    }
    const d = S.dir;
    const arr = d === 'down' ? K.down : d === 'up' ? K.up : K.left;
    const seq = [0, 1, 0, 2];
    const f = S.moving ? seq[Math.floor(this.anim * 9) % 4] : 0;
    const blink = !S.moving && this.t % 3.1 > 2.95 && d !== 'up';
    const fr = blink ? (d === 'down' ? K.downBlink : K.leftBlink) : arr[f];
    G.drawFrame(ctx, fr, x, y + 1, d === 'right');
  };

  Play.prototype.drawDeath = function (ctx, ox, oy) {
    const S = this.S, mf = M();
    const x = ox + S.dead.x, y = oy + S.dead.y;
    const u = this.phase === 'dying' ? G.clamp(this.pt / this.dyingTime, 0, 1) : 1;
    const shadow = () => { ctx.fillStyle = 'rgba(10,6,18,0.4)'; ctx.fillRect(Math.round(x - 6), Math.round(y - 1), 12, 2); };
    switch (this.deathType) {
      case 'fall': {
        if (u >= 0.95) return;
        const s = 1 - G.ease.in(u) * 0.9;
        const f = mf.fall;
        ctx.globalAlpha = 1 - u * 0.6;
        ctx.drawImage(f.c, Math.round(x - f.ax * s), Math.round(y - f.ay * s + u * 10), Math.max(1, Math.round(f.w * s)), Math.max(1, Math.round(f.h * s)));
        ctx.globalAlpha = 1;
        break;
      }
      case 'slash': {
        shadow();
        if (u < 0.18) G.drawFrame(ctx, mf.shock, x, y + 1);
        else G.drawFrame(ctx, mf.lieDown, x, y + 1, this.slashDir < 0);
        if (u < 0.3) {
          ctx.fillStyle = '#ffffff';
          const k = 1 - u / 0.3;
          for (let i = -14; i <= 14; i++) ctx.fillRect(Math.round(x + i), Math.round(y - 10 + i * 0.35), 2, Math.max(1, Math.round(2 * k)));
        }
        break;
      }
      case 'burn': {
        shadow();
        if (u < 0.35) G.drawFrame(ctx, Math.floor(this.pt * 20) % 2 ? mf.charredStand : mf.shock, x, y + 1);
        else if (u < 0.6) G.drawFrame(ctx, mf.charredStand, x, y + 1);
        else { if (!this.ashed) { this.ashed = true; G.FX.ash(S.dead.x, S.dead.y - 4, 26); } }
        break;
      }
      case 'crush': {
        const f = G.KID.down[0];
        const sy = Math.max(0.18, 1 - G.ease.out(G.clamp(u * 4, 0, 1)) * 0.82), sx = 1 + (1 - sy) * 0.6;
        ctx.drawImage(f.c, Math.round(x - f.ax * sx), Math.round(y + 1 - f.ay * sy), Math.round(f.w * sx), Math.max(2, Math.round(f.h * sy)));
        break;
      }
      case 'drown': {
        const f = mf.fall;
        const sink = Math.round(G.ease.inOut(u) * f.h);
        if (sink < f.h) ctx.drawImage(f.c, 0, 0, f.w, f.h - sink, Math.round(x - f.ax), Math.round(y - f.ay + sink), f.w, f.h - sink);
        if (Math.random() < 0.3) G.FX.add({ x: S.dead.x + (Math.random() - 0.5) * 8, y: S.dead.y - 2, vy: -20, life: 0.4, col: '#cfe8ff', size: 1 });
        ctx.fillStyle = '#cfe8ff';
        const rr = Math.round(4 + u * 10);
        ctx.fillRect(Math.round(x - rr), Math.round(y - 1), 3, 1); ctx.fillRect(Math.round(x + rr - 2), Math.round(y - 1), 3, 1);
        break;
      }
      case 'chomp': {
        const k = Math.min(3, Math.floor(u * 6));
        if (u < 0.45) { const s = 1 - u * 1.8; const f = mf.shock; ctx.drawImage(f.c, Math.round(x - f.ax * s), Math.round(y - f.ay * s), Math.max(1, Math.round(f.w * s)), Math.max(1, Math.round(f.h * s))); }
        G.drawFrame(ctx, mf.mimic[u < 0.45 ? k : 3 - Math.min(3, Math.floor((u - 0.45) * 8))], x, y - 2);
        break;
      }
      case 'grab': {
        ctx.fillStyle = '#140a1e';
        ctx.fillRect(Math.round(x - 9), Math.round(y - 2), 18, 4);
        const f = mf.fall;
        const sink = Math.round(G.ease.in(u) * f.h);
        if (sink < f.h) ctx.drawImage(f.c, 0, 0, f.w, f.h - sink, Math.round(x - f.ax), Math.round(y - f.ay + sink), f.w, f.h - sink);
        for (let i = 0; i < 3; i++) G.drawFrame(ctx, mf.hand[(Math.floor(this.pt * 8) + i) % 4], x - 7 + i * 7, y + 3);
        break;
      }
      default: {
        shadow();
        if (u < 0.22) {
          const spin = [G.KID.down[0], G.KID.left[0], G.KID.up[0], G.KID.left[0]];
          const k = Math.floor(this.pt * 24) % 4;
          G.drawFrame(ctx, spin[k], x - u * 20, y + 1 - Math.sin(u / 0.22 * Math.PI) * 6, k === 3);
        } else G.drawFrame(ctx, mf.lieDown, x - 4, y + 1);
        if (this.deathType === 'arrow' && u >= 0.22) G.drawFrame(ctx, mf.arrowV, x - 2, y - 6);
        break;
      }
    }
  };

  Play.prototype.drawTiles = function (ctx, ox, oy, t) {
    const L = this.L, S = this.S, th = L.theme;
    // liquids and spikes
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const ch = L.at(c, r);
        const X = ox + c * TS, Y = oy + r * TS;
        if (ch === 'L') ctx.drawImage(G.liquidTile('lava', th, Math.floor(this.t * 5 + c * 0.7 + r * 0.3) % 8), X, Y);
        else if (ch === '~') ctx.drawImage(G.liquidTile('water', th, Math.floor(this.t * 3 + (c + r) * 0.5) % 4), X, Y);
        else if (ch >= '1' && ch <= '9') ctx.drawImage(G.spikeTile(th, G.spikeState(L, +ch, t)), X, Y);
        else if (ch === 'c' && !S.fallen[r * COLS + c]) {
          const ct = S.crack[r * COLS + c];
          let stage = 0, jx = 0;
          if (ct >= 0) { const p = (S.t - ct) / (L.def.crackTime || 0.42); stage = p < 0.5 ? 1 : 2; jx = Math.random() < 0.5 ? 1 : 0; }
          if (jx) { ctx.drawImage(G.floorTileCanvas(L, c, r), X + jx, Y); }
          ctx.drawImage(G.crackOverlay(stage), X + jx, Y);
        }
      }
    // collapsed tiles (hidden traps, cracked floors, the collapse wave)
    const gone = (c, r) => (c < 0 || r < 0 || c >= COLS || r >= ROWS ? false : L.at(c, r) === 'v' || S.fallen[r * COLS + c] || L.waveAt(c, r) <= t);
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const X = ox + c * TS, Y = oy + r * TS;
        const wa = L.waveAt(c, r);
        const isGone = S.fallen[r * COLS + c] || wa <= t;
        if (isGone && L.at(c, r) !== 'v') {
          const above = !gone(c, r - 1) && r > 0;
          const key = c + ':' + r + ':' + above + ':' + gone(c - 1, r) + ':' + gone(c + 1, r);
          if (!this.dynPit[key]) {
            L._dynPit = gone;
            this.dynPit[key] = G.pitTileCanvas(L, c, r, above);
          }
          ctx.drawImage(this.dynPit[key], X, Y);
        } else if (wa - t < 1.0 && wa > t) {
          const p = 1 - (wa - t);
          const jx = p > 0.6 && Math.random() < 0.5 ? 1 : 0;
          if (jx) ctx.drawImage(G.floorTileCanvas(L, c, r), X + jx, Y);
          ctx.drawImage(G.crackOverlay(p < 0.4 ? 0 : p < 0.75 ? 1 : 2), X + jx, Y);
        }
        if (this.remember[c + ',' + r] && !isGone) {
          // memory of a death: faint red cracks where the floor betrayed you
          ctx.globalAlpha = 0.55;
          ctx.drawImage(G.crackOverlay(1), X, Y);
          ctx.fillStyle = '#e04050';
          ctx.fillRect(X + 7, Y + 7, 2, 2);
          ctx.globalAlpha = 1;
        }
      }
    // falling chunks
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const ch = this.chunks[i];
      const u = (this.t - ch.t0) / 0.55;
      if (u >= 1) { this.chunks.splice(i, 1); continue; }
      const src = G.floorTileCanvas(L, ch.c, ch.r);
      const X = ox + ch.c * TS, Y = oy + ch.r * TS;
      for (let q = 0; q < 4; q++) {
        const qx = (q % 2) * 8, qy = Math.floor(q / 2) * 8;
        const s = 1 - u * (0.7 + q * 0.07);
        const d = 8 * s;
        const fall = u * u * 10 + q;
        ctx.globalAlpha = 1 - u * 0.5;
        ctx.drawImage(src, qx, qy, 8, 8, Math.round(X + qx + 4 - d / 2), Math.round(Y + qy + 4 - d / 2 + fall), Math.max(1, Math.round(d)), Math.max(1, Math.round(d)));
      }
      ctx.globalAlpha = 1;
    }
  };

  Play.prototype.draw = function (ctx) {
    const L = this.L, S = this.S, mf = M();
    const [sx, sy] = G.Shake.offset();
    const ox = sx, oy = TOP + sy;
    const t = this.worldTime();
    ctx.fillStyle = '#07040c';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(this.map.bg, ox, oy);
    this.drawTiles(ctx, ox, oy, t);
    // death markers (memories)
    for (const m of this.markers) {
      ctx.fillStyle = 'rgba(200,120,255,0.35)';
      const x = Math.round(ox + m.x), y = Math.round(oy + m.y - 3);
      ctx.fillRect(x - 2, y - 2, 1, 1); ctx.fillRect(x + 2, y - 2, 1, 1); ctx.fillRect(x - 1, y - 1, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1); ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + 1, y + 1, 1, 1); ctx.fillRect(x - 2, y + 2, 1, 1); ctx.fillRect(x + 2, y + 2, 1, 1);
    }
    const list = [], lights = [];
    const anim = this.t;
    for (const p of this.map.props) list.push({ y: p.y, draw: (c, X, Y) => G.drawFrame(c, p.f, X + p.x, Y + p.y) });
    for (const l of this.map.lights) lights.push({ x: l.x, y: l.y + TOP, r: l.r, col: l.col, flicker: l.flicker, glow: 0.25 });
    for (const hz of L.hazards) pushHaz(list, lights, hz, t, anim);
    // shards
    L.shards.forEach((s, i) => {
      if (S.got[i]) return;
      const b = Math.round(Math.sin(anim * 3 + i) * 1.5);
      list.push({ y: s.y + 5, draw: (c, X, Y) => {
        c.fillStyle = 'rgba(10,6,18,0.3)'; c.fillRect(X + s.x - 3, Y + s.y + 4, 6, 2);
        G.drawFrame(c, mf.shard[Math.floor(anim * 9 + i * 2) % 6], X + s.x, Y + s.y + 4 + b);
      } });
      lights.push({ x: s.x, y: s.y + TOP - 4, r: 28, col: '#7ff5ff', glow: 0.25 });
    });
    // save points
    L.checkpoints.forEach((cp, i) => {
      const lit = (this.save && this.save.cp === i) || S.checkpoint === i;
      list.push({ y: cp.y + 6, draw: (c, X, Y) => G.drawFrame(c, (lit ? mf.flameLit : mf.flame)[Math.floor(anim * 10 + i) % 6], X + cp.x, Y + cp.y + 7) });
      lights.push({ x: cp.x, y: cp.y + TOP - 4, r: lit ? 44 : 30, col: '#a050ff', glow: lit ? 0.35 : 0.2, flicker: true });
    });
    // exit portal
    if (L.exit) {
      const e = L.exit;
      const open = this.portalOpen;
      const winning = this.phase === 'won';
      list.push({ y: e.y + 7, draw: (c, X, Y) => G.drawFrame(c, open ? mf.portalOpen[Math.floor(anim * 10) % 8] : mf.portalShut[0], X + e.x, Y + e.y + 7) });
      lights.push({ x: e.x, y: e.y + TOP - 8, r: open ? 60 : 24, col: open ? '#8ff0ff' : '#5a5466', glow: open ? 0.35 : 0.1 });
      if (winning) lights.push({ x: e.x, y: e.y + TOP - 8, r: 80 + this.pt * 60, col: '#ffffff', glow: 0.4 });
    }
    // knight
    const kn = this.phase === 'dying' || this.phase === 'rbd' ? this.deadSnapshot.knight : S.knight;
    if (kn && kn.phase === 'charge') {
      list.push({ y: kn.y + 8, draw: (c, X, Y) => G.drawFrame(c, mf.knight[Math.floor(anim * 14) % 4], X + kn.x, Y + kn.y + 9, kn.dir < 0) });
    }
    // the kid
    if (S.dead) list.push({ y: S.dead.y + 1, draw: (c, X, Y) => this.drawDeath(c, X, Y) });
    else if (this.phase !== 'won') list.push({ y: S.y + 1, draw: (c, X, Y) => this.drawKid(c, X, Y) });
    else {
      // pulled into the portal
      const u = G.clamp(this.pt / 0.9, 0, 1);
      if (u < 1) {
        const e = L.exit, f = G.KID.down[0];
        const s = 1 - u;
        const x = G.lerp(S.x, e.x, u), y = G.lerp(S.y, e.y - 2, u);
        list.push({ y: e.y + 8, draw: (c, X, Y) => { c.globalAlpha = 1 - u * 0.5; c.drawImage(f.c, Math.round(X + x - f.ax * s), Math.round(Y + y - f.ay * s), Math.max(1, Math.round(f.w * s)), Math.max(1, Math.round(f.h * s))); c.globalAlpha = 1; } });
      }
    }
    // ground-level first, then y-sorted
    list.sort((a, b) => (a.ground === b.ground ? a.y - b.y : a.ground ? -1 : 1));
    for (const it of list) it.draw(ctx, ox, oy);
    G.FX.draw(ctx, ox, oy, 0);
    // lighting
    const LG = LIGHTING[L.theme] || {};
    if (LG.overlay) { ctx.fillStyle = LG.overlay; ctx.fillRect(0, TOP, W, H - TOP); }
    if (LG.dark) {
      const px = S.dead ? S.dead.x : S.x, py = S.dead ? S.dead.y : S.y;
      lights.push({ x: px, y: py + TOP - 8, r: LG.player || 48, i: 1 });
      if (L.theme === 'volcano') for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (L.at(c, r) === 'L' && (c + r) % 2 === 0) lights.push({ x: c * TS + 8, y: r * TS + 8 + TOP, r: 34, col: '#ff6a1f', glow: 0.12, flicker: true });
      G.Light.draw(ctx, LG.dark, LG.tint, lights.map((l) => (l.y < TOP ? l : l)), this.t);
    } else {
      // colored glows only
      ctx.globalCompositeOperation = 'lighter';
      for (const l of lights) if (l.col) { const s = G.Light.stamp(l.r * 0.6, l.col); ctx.globalAlpha = (l.glow || 0.2) * 0.6; ctx.drawImage(s, Math.round(l.x - s.width / 2), Math.round(l.y - s.height / 2)); }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    G.FX.draw(ctx, ox, oy, 1);
    // knight warning
    if (kn && kn.phase === 'warn' && Math.floor(this.t * 8) % 2 === 0) {
      const x = kn.dir > 0 ? 3 : W - 15, y = Math.round(oy + kn.y - 12);
      G.drawFrame(ctx, mf.bubble['!'], x + 6, y + 12);
      ctx.fillStyle = 'rgba(216,58,58,0.25)';
      ctx.fillRect(0, Math.round(oy + kn.y - 9), W, 9);
    }
    if (LG.vig) G.vignette(ctx, LG.vig);
    // dying / RBD overlay
    if (this.phase === 'dying') {
      G.desaturate(ctx, G.clamp((this.pt - 0.2) / 0.5, 0, 0.85));
    }
    if (this.phase === 'rbd') {
      const p = G.clamp(this.pt / 0.7, 0, 1);
      G.desaturate(ctx, 0.9);
      ctx.fillStyle = 'rgba(7,2,12,' + (G.ease.in(p) * 0.92).toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
      G.drawHands(ctx, p * 1.1);
      G.text(ctx, this.caption, W / 2, H - 34, { align: 'center', color: '#e8d8ff', shadow: '#2a0a40' });
      G.text(ctx, 'RETURN BY DEATH', W / 2, H / 2 - 4, { align: 'center', color: p > 0.4 ? '#c890ff' : '#5a2a8a', shadow: '#000', scale: 1 });
    }
    if (this.phase === 'revive') {
      const a = 1 - G.clamp(this.pt / 0.35, 0, 1);
      if (a > 0) { ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
    }
    this.drawHUD(ctx);
    if (this.phase === 'card') G.drawCard(ctx, this.pt, this.def.chapter, this.def.name);
    if (this.phase === 'won') {
      const a = G.clamp((this.pt - 0.9) / 0.4, 0, 1);
      if (a > 0) {
        ctx.globalAlpha = a;
        ctx.fillStyle = '#07040c';
        ctx.fillRect(0, H / 2 - 24, W, 44);
        G.text(ctx, 'CHAPTER CLEAR', W / 2, H / 2 - 18, { align: 'center', color: '#9ff2ff', scale: 2 });
        G.text(ctx, 'Deaths this chapter: ' + this.deaths + '    Time: ' + G.fmtTime(this.runTime), W / 2, H / 2 + 6, { align: 'center', color: '#a9a2bb' });
        ctx.globalAlpha = 1;
      }
    }
    if (G.DEV && G.DEV.hit) this.drawHitboxes(ctx, ox, oy, t);
    G.Dialog.draw(ctx);
  };

  Play.prototype.drawHitboxes = function (ctx, ox, oy, t) {
    const PL = G.PLAYER, S = this.S;
    ctx.strokeStyle = 'rgba(0,255,0,0.8)';
    ctx.strokeRect(ox + S.x + PL.hl + 1.5, oy + S.y + PL.ht + 2.5, PL.hr - PL.hl - 2, PL.hb - PL.ht - 3);
    ctx.strokeStyle = 'rgba(255,0,0,0.8)';
    const buf = [];
    for (const hz of this.L.hazards) hz.shapes(t, buf);
    for (const s of buf) {
      if (s.k === 0) { ctx.beginPath(); ctx.arc(ox + s.x, oy + s.y, s.r, 0, 7); ctx.stroke(); }
      else ctx.strokeRect(ox + s.x + 0.5, oy + s.y + 0.5, s.w, s.h);
    }
  };

  Play.prototype.drawHUD = function (ctx) {
    const S = this.S, L = this.L, mf = M();
    ctx.fillStyle = '#0b0712';
    ctx.fillRect(0, 0, W, TOP);
    ctx.fillStyle = '#2a1f3d';
    ctx.fillRect(0, TOP - 1, W, 1);
    G.text(ctx, this.def.chapter.replace('CHAPTER ', 'CH.') + '  ' + this.def.name, 5, 4, { color: '#a9a2bb' });
    // shards
    const n = L.shards.length;
    const sx0 = Math.round(W / 2 - (n * 9) / 2);
    for (let i = 0; i < n; i++) {
      const got = S.got[i];
      const x = sx0 + i * 9 + 4, y = 13;
      if (got) G.drawFrame(ctx, mf.shard[0], x, y);
      else { ctx.fillStyle = '#2a3a48'; ctx.fillRect(x - 1, y - 11, 3, 9); ctx.fillRect(x - 2, y - 8, 5, 3); }
    }
    if (n === 0) G.text(ctx, 'REACH THE PORTAL', W / 2, 4, { align: 'center', color: '#5a5466' });
    // deaths
    const dtxt = '♥ ' + G.Game.deaths;
    G.text(ctx, dtxt, W - 5, 4, { align: 'right', color: '#e05a6a' });
    // stillness meter (the knight is coming)
    if (L.idleKnight) {
      const k = G.clamp(S.still / G.PLAYER.idleTime, 0, 1);
      const bw = 30, bx = W - 12 - G.textWidth(dtxt) - bw, by = 6;
      ctx.fillStyle = '#1e1628'; ctx.fillRect(bx, by, bw, 4);
      ctx.fillStyle = k > 0.75 || S.knight ? (Math.floor(this.t * 10) % 2 ? '#ff4a4a' : '#ffb04a') : '#8a7aa8';
      ctx.fillRect(bx, by, Math.round(bw * (S.knight ? 1 : k)), 4);
      // tiny horse head icon
      ctx.fillStyle = '#c9cfdb';
      ctx.fillRect(bx - 7, by - 1, 3, 4); ctx.fillRect(bx - 5, by - 2, 2, 2); ctx.fillRect(bx - 8, by + 1, 2, 2); ctx.fillRect(bx - 5, by - 3, 1, 1);
    }
  };

  G.fmtTime = function (s) {
    s = Math.floor(s);
    const m = Math.floor(s / 60), r = s % 60;
    if (m >= 60) return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0') + ':' + String(r).padStart(2, '0');
    return m + ':' + String(r).padStart(2, '0');
  };
})(window.G);
