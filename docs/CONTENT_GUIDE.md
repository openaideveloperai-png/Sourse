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
