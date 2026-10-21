# Content guide (engine reference)

Everything in the game is plain JavaScript loaded by `index.html` with `<script>` tags,
in this order: core, art, fx, audio, ui, engine, content, main. Each file is an IIFE
`(function (G) { 'use strict'; ... })(window.G);` that adds to the global `G`.

Screen: 416x240 pixels, tiles are 16x16. Text uses a built-in pixel font: **ASCII only**
(no smart quotes, em dashes or emoji; they are converted, but write ASCII).

## Rooms

```js
G.MAPS.library = {
  name: 'Library',             // shown in saves/menus
  location: 'Library',         // optional: small banner on entry
  tiles: [                     // '#' ceiling (solid), 'W' wall face (solid), ' ' void
    '############',            // any other char is floor, mapped by `floor`
    'WWWWWWWWWWWW',            // walls are 2 rows of 'W' under a '#' row (RPG Maker style)
    'WWWWWWWWWWWW',
    '....,,,,....',
    '....,,,,....',
    '############',
  ],
  floor: { '.': 'parquet', ',': 'carpet_red' },  // floor types: wood darkwood oldwood parquet
                               // carpet_red/blue/green/purple/brown tile_check tile_white tile_blue
                               // tile_green stone concrete dirt grass void
  wall: 'green',               // green red blue cream purple pink yellow white dirty wood brick stone tiles
  dark: 0.6,                   // 0 = fully lit, 0.9 = nearly black; player carries a light of radius `light`
  light: 58,
  music: 'house',              // title house calm dread chase sad ending badend (or null for silence)
  ambience: 'house',           // house wind rain basement hum void (or null)
  lights: [{ x: 3, y: 4, r: 40, col: '#ffb040', flicker: true }],
  objects: [ ... ],
  first: function* (E) { },    // runs on the first entry only
  enter: function* (E) { },    // runs on every entry
  update(E, dt) { },           // plain function every frame (no yields)
};
```

Rooms smaller than the screen are centered on black; bigger rooms scroll with the player.
Room width is the longest row; pad rows to equal length.

## Objects

```js
{ id: 'clock', x: 5, y: 3, w: 1, h: 1, sprite: 'clock',
  on: function* (E, self) { yield* E.say('@ The clock has stopped at 3:15.'); } }
```

| field | meaning |
| --- | --- |
| `id` | unique within the room |
| `x, y, w, h` | footprint in tiles (top-left, size). Solid by default |
| `sprite` | sprite name (string) or `E => name` |
| `char` + `dir` | an NPC drawn with a character sprite set |
| `z` | `'wall'` (on a W tile: doors, windows, paintings), `'floor'` (rugs, blood: drawn under everything), `'over'` |
| `solid` | override solidity (decals use `solid: false`) |
| `on` | generator run when the player presses Z facing it |
| `text` | shortcut: string or array of lines shown on Z |
| `touch` | generator run when the player steps onto the footprint (use `solid: false`) |
| `cond` | `E => bool`; object exists only while true (re-checked after every event) |
| `light` | `{r, col, dx, dy, flicker, glow}` light source |
| `door` | `{to, x, y, dir, walk}`; walking into it or Z goes to room `to` at tile x,y. `walk: true` for floor exits that trigger by stepping on them (`solid: false` / `touch: true`) |
| `lock` | item id or `E => bool`; with `lockText`, `unlockText`, `consume: true` |
| `before` | `function* (E, self)` run before a door transfers; return false to cancel |
| `stairs: true` | use stair sound |
| `hide: true` | a hiding spot (wardrobe, under a bed); `hideSprite` shown while inside |
| `push: true` | can be pushed one tile per bump; `onPush: function* (E, self)` after moving; `pushArea(c, r)` limits where |
| `bump` | generator run when the player walks into it |

Wall objects (doors, windows, paintings, mirrors) sit on the lowest `W` row, footprint
`h: 2` for doors (both W rows), `h: 1` for things hung on the wall. Tall furniture
(bookshelves, wardrobes, clocks) stands on the floor row right under the wall with
`h: 1`; its sprite is taller than its footprint and overlaps the wall face.

## Events: the E API

Events are generators. Anything that takes time is used with `yield*`.

```js
on: function* (E, self) {
  if (!E.has('small_key')) {
    yield* E.say('@ A locked drawer.');
    return;
  }
  yield* E.say('@mia:scared Did that drawer just... breathe?', 'Okay. Okay. Opening it.');
  E.take('small_key');
  yield* E.give('music_box');
  E.set('drawerOpen');
}
```

Talking: `E.say(...lines)`. A line starting with `@who:face ` switches the speaker
(registered in `G.SPEAKERS`); `@ ` switches to narration. A line starting with `~` shakes.
`const i = yield* E.ask('@mia Which one?', ['Red', 'Blue'])`, `yield* E.yesno('@ Open it?')`.

State: `E.flag(k)`, `E.set(k, v)`, `E.unset(k)`, `E.inc(k)`, `E.count(k)`, `E.has(item)`,
`yield* E.give(item)` (shows "Obtained X."; `{silent: true}`), `E.take(item)`, `E.visited(map)`.

Objects: `E.obj(id)`, `E.hide(id)`, `E.show(id)`, `E.setSprite(id, name)`, `E.face(id|'player', dir)`,
`E.place(id, x, y)`, `yield* E.move(id, [[dx, dy], ...], speed)`, `yield* E.moveTo(id, x, y, speed)`.
Positions/visibility set this way are saved.

Player: `yield* E.goto(map, x, y, dir)`, `yield* E.walk([[0, -2], [3, 0]])`.

Presentation: `yield* E.wait(s)`, `E.sfx(name)`, `E.music(name|null)`, `E.shake(amt, t)`,
`E.flash('#ff0000', 0.3)`, `E.tint('#300010', 0.3)` (null clears), `E.dark(v)` (this room until exit),
`yield* E.fadeOut(t)`, `yield* E.fadeIn(t)`, `yield* E.scare(name)` (full-screen jump scare of sprite
`scare_<name>` or the character `name`), `yield* E.bubble(id|'player', '!'|'?'|'...'|'heart'|'note')`,
`E.chapter('Chapter 2: The Dollhouse')`, `E.location('Attic')`, `yield* E.picture(spriteName, {caption})`.

Documents: an item with `note: true` and `pages: [...]` is readable from the menu. `yield* E.note(id)` opens it.

Puzzles (each returns the answer, or null/false if cancelled):
- `yield* E.code({len: 4, chars: '0123456789', title, hint})` -> string
- `yield* E.piano({title, max: 7})` -> array of key names `C D E F G A B C2`
- `yield* E.slider({sprite, n: 3, title})` -> true when solved
- `yield* E.clock({title, h, m})` -> `{h, m}`
- `yield* E.order({items: [...], title})` -> array of original indices in chosen order
- `yield* E.pickItem('Use what?')` -> item id or null

Danger:
- `E.chase({char, speed, at: [x, y] | 'behind', delay, follow, followDelay, safe: [...maps], duration, loseAfterHide, cause, scare, onEnd})`.
  Player walk speed is 62 px/s (run 96). Fair chases: speed 50-64, at least 4 tiles of head start, an escape route or hiding spot.
- `E.endChase()`, `E.chasing()`.
- `yield* E.die(cause, {text, scare})` instant death -> game over screen (player can retry from the last room entry).
- `E.checkpoint()` saves a retry point now. Room entries create one automatically (not during chases).
- `yield* E.save()` asks to save (use on save-point objects).
- `yield* E.ending(id)` plays ending `G.ENDINGS[id] = {title, subtitle, lines: [...], hint, music}`.

Items: `G.ITEMS.id = {name, desc, icon: 'spriteName', use: function* (E) {...}, note, pages}`.
Without `icon`, the sprite `icon_<id>` is used if it exists (draw icons 16x16, anchor (8,16)).
Deaths: `G.DEATHS.cause = 'Text on the game over screen.'`.

## Art

Pixel art is drawn in code with `G.PX` (see `js/core.js`) and registered by name:

```js
G.defSprite('music_box', () => {
  const px = new G.PX(14, 12);
  G.box3(px, 0, 0, 14, 12, G.C('#7a4a3a'), G.C('#5a3428'));
  px.outline();                       // automatic shaded outline: always call last
  return G.frame(px, 7, 12);          // anchor at bottom-center
});
G.defSprite('flicker', () => [frame1, frame2, frame3], 8);   // animated, 8 fps
```

Helpers: `px.set/rect/hline/vline/line/thick/ellipse/disc/poly/stamp(rows, palette)/outline`,
`G.box3` (3/4 box), `G.shadeDisc`, `G.teardrop`, `G.woodFill`, `G.speckle`, `G.darken`, `G.lighten`,
`G.mix`, `G.rng(seed)`, `G.vnoise`, `G.bayer`. Light comes from the top-left: highlights on top/left
edges, shade on bottom/right. Keep palettes muted and dark; use saturated red sparingly for danger.

Characters: `G.defChar('mia', () => ({ down: [f0, f1, f2], up: [...], left: [...] }))` (right is
left mirrored unless given). Frame 0 = standing, 1 and 2 = steps; the walk cycle is 0,1,0,2.
Characters are about 16x24 with a 1px outline; anchor at the feet (see `js/art_kid.js` for the
hand-placed-rows technique, which gives the best results). Speakers:
`G.SPEAKERS.mia = {name: 'Mia', color: '#f0a0b0', blip: 600, portrait: face => canvas40x40}`.

Preview art: `tools/preview.html` shows every registered sprite; screenshot it with
`NODE_PATH=/opt/node22/lib/node_modules node tools/shot.js "tools/preview.html?s=6&only=name" out.png`.
Look at the result before moving on.

## Testing

- Open a room directly: `index.html?dev=1&map=library&x=4&y=5&items=small_key&flags=metMia`.
- `__G.dev.use('objId')` in the console stands next to an object and presses Z.
- `tools/walkthrough.js <route>` plays the game from New Game following `G.WALKTHROUGH[route]`
  and fails on any softlock, missing path, missing item, or death. Every puzzle chain must be
  covered by the main route.

## Extra state switches

- `E.set('follower', 'charName')`: a companion follows the player's trail (unset to remove).
- `E.set('playerLight', 90)`: radius of the light the player carries in dark rooms; `E.set('playerLightCol', '#ffb040')` tints it (candle/lantern).
- `E.set('canRun', false)`: disable running (Shift).
- `E.set('@playerChar', 'name')`: change the player's sprite set.
- `E.goal('Find a way into the study.')`: the protagonist's current objective, shown in the pause menu. Update it at every major step so returning players are never lost.
- `yield* E.flicker(times, endDark)`: lights flicker (darkness spikes) with a click sound.

## Chase extras

- `timer: 15` in a chase config: after 15 s the chase ends the next time the player changes rooms (keys jingle away). This is the default way chases should end; combine with hiding (`loseAfterHide`).
- Doors with `latch: true` (apartment doors): during a chase, when the Caretaker is following through that door, pressing Z on it offers to latch the chain, adding `latchTime` (default 5) seconds before he gets through. Once per door per chase.
- `E.walker({char, path: [[x, y], ...], speed, delay, cause, onEnd})`: a figure walks a fixed path through the room; touching it is death. For walk-by scares.
- `E.ambushReady(chance, cooldownSeconds)`: true at most once per cooldown (and never right after a chase); use it in `enter` to ration random walk-bys.
- `G.RECIPES.push({needs: ['a', 'b'], gives: 'c', text: '@ They fit together.'})`: items combine automatically when the last piece is picked up.
- `E.notesCount('letter_')`: how many notes with that id prefix the player has read/found.
- New sounds: keys, latch, ring, meow, hiss, kettle, ding, thunder, splash, breath, static, knock, whisper, glass, drip, clock, bell, laugh.

## Danchi tiles

Floors: `tatami`, `corridor` (wet concrete with puddles), `terrazzo` (lobby), `genkan` (dark entry
stone), `basement`, `linoleum`. Walls: `concrete`, `plaster`, `danchi` (painted plaster over a
grey dado). Tile `R` = outdoor railing with the night city beyond (solid); put a row of `R` along
the open side of an outdoor corridor and set `rain: 'rail'` on the map to animate rain beyond it.
`rain: 'full'` rains over the whole screen (courtyard, roof).

## Rules of the hunt (engine behaviour, keep content consistent with it)

- Running (Shift) works only when nothing is hunting Haru (no chase, no walker). During chases
  Haru walks at 62 px/s, so chaser speed is the difficulty knob: 50-56 for early chases, 60 for
  the last one.
- The chaser and walkers **freeze whenever an event runs** (dialogue, door transitions, item
  pickups, E.wait...). So a door's fade does not eat the latch window, and a mid-chase line of
  dialogue is never a death sentence. Exceptions: while Haru is hiding, or inside an event that
  calls `E.worldRuns()` (a cutscene that must play while the hunter keeps moving).
- Following through doors: he arrives `followDelay` seconds after Haru (default 1.6) and pauses
  `arriveDelay` (default 0.5) in the doorway before moving. Doubling back toward him does not reset
  his timer (no door-dancing).
- Chain latches (`latch: true`) reset at the start of each chase (one use per door per chase).
- Hiding: if he is within 3.2 tiles and in the room when Haru climbs in, game over with
  `cfg.seenText`. Otherwise he searches; after `loseAfterHide` (default 5.5) seconds he leaves.
  While he is in the room the player hears breathing, a heartbeat, and keys when he is close.
- His footsteps and keys get louder as he gets closer. In rooms with `dark >= 0.7` he carries a
  dim cold light so he is visible before he reaches Haru.
- Default chase music is `hunt` (slow pulse). `E.ambushReady(chance, cooldown, max)` never fires in
  tests, at most `max` (default 3) times per game, and never within 30 s of a retry or load.

### Chase re-arm pattern (use for every scripted chase)

Deaths retry from the last checkpoint. To make a scripted chase restart correctly after a death,
arm it and checkpoint **before** starting it, and restart it from the room's `enter`:

```js
function startChase2(E, delay) {
  E.chase({ char: 'caretaker', at: [12, 4], speed: 56, delay: delay || 1.0, follow: true, followDelay: 2.2,
    timer: 16, cause: 'caretaker', onEnd: function* (E) { E.set('ch2_done'); } });
}
// in the trigger event:
E.set('ch2_armed'); E.checkpoint(); startChase2(E);
// in the room's enter (the checkpoint room):
enter: function* (E) { if (E.flag('ch2_armed') && !E.flag('ch2_done') && !E.chasing()) { E.sfx('keys'); startChase2(E, 1.5); } },
```

## Shared helpers (js/content/game.js)

- `G.aptDoor('401', x, y, 'a401', tx, ty, {lock, lockText, ...})`: an apartment door object (sprite
  `door_apt_401`, chain latch on).
- `G.nightlightObj(x, y, id)`: a save point (wall object on the lower wall row, warm glow).
- `G.phoneObj(x, y, {id, sprite, extra})`: a black phone; "Call home (404)" plays the hint for
  the current goal.
- Goals and hints: `E.goal('Find a way down.', 'ch2_down')`. Register hints by goal id in your
  chapter: `G.HINTS.ch2_down = [['@mom tier 1: restate the goal'], ['@mom tier 2: name the room'],
  ['@mom tier 3: name the clue']]` (each call, or every 4 minutes stuck on the goal, unlocks the
  next tier) or a function `E => lines` for goals with sub-steps. Every goal needs hints.
- `yield* G.HELP.tamaHiss(E)` (hiss + "!" over the cat if she follows), `yield* G.HELP.mirrorFlash(E, objId,
  flashSprite, normalSprite, t)`, `yield* G.HELP.keysPass(E)`.
- `E.bubbleNow(id, kind)` shows a bubble without waiting (use during chases); ids: object id,
  `'player'` or `'follower'`. `E.worldRuns()` (see above).
- `G.trueEnd()` returns the list of missing true-ending conditions.
- Speakers: haru, old_haru, caretaker (name "???" until flag `knowsSato`), mom (phone portrait),
  voice (unknown voice), yui, nurse, ota, kuroda, shota, shota_cap, guest, tama. Deaths:
  caretaker, okaeri, guests, hands, steam (add more with `G.DEATHS.cause = 'text'`).
- `E.chapter('Chapter 2: The Third Floor')` also autosaves.

## Testing your content

- Art preview in a lit room: `index.html?dev=1&stage=1&wall=danchi&floor=tatami&put=name:x:y:w:h[:wall|floor],char=name:x:y:dir&dark=0.6&flashlight=70`.
- Missing sprites are drawn as magenta boxes and listed in `G.missingArt` (also printed by the
  walkthrough runner). Only use names from `docs/ART_LIST.md`.
- Chapter routes: start a route with `{start: {map, x, y, dir, items, flags, notes}}` to test a
  chapter on its own (flags as an object or list). Every chase in your chapter must be covered
  by an `{escape: [...]}` step: a bot WALKS the route you give it (door ids, `{hide: id}`,
  `{tile: [x, y]}`, `{wait: s}`) and must survive until the chase ends. If the bot is caught,
  the chase is unfair: fix the content (spawn farther away, slower speed, a nearer exit).
- `NODE_PATH=/opt/node22/lib/node_modules node tools/walkthrough.js <route> [--verbose] [--shots dir]`

## Named entries (connecting rooms across files)

A map can name its arrival points: `entries: { from_c4: [3, 8, 'up'], from_lift: [10, 4, 'down'] }`.
Doors then use `door: { to: 'stair3', entry: 'from_stair4' }` (no x/y), and `E.goto('c2', 'from_lift')`
and `{start: {map: 'c3', x: 'from_stair3'}}` accept an entry name in place of x. Every connection
listed in docs/MANIFEST.md uses entry names, so authors never need each other's coordinates.
