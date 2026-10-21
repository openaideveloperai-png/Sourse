# Wrong Way Home

A brutally hard 2D pixel-art game in the spirit of *The World's Hardest Game*, with a story.

It's 11:47 PM. A teenager walks out of a convenience store with a bag of pudding and melon soda,
steps onto the crosswalk, and gets hit by a truck. He wakes up in another world with one mission
from a voice he can't see: **return to your world, no matter what.**

The catch: almost everything in this world kills him. Walk the wrong way and the floor falls out
from under his feet. Stand still too long and a knight on horseback rides by and cuts him down
without even noticing. And every time he dies, he wakes up again at the last purple flame,
gasping, with the world rewound around him (Return by Death).

## Play

Open `index.html` in any modern browser. No install, no server, no build step.
`dist/wrong-way-home.html` is the same game bundled into a single file.

| Action | Keys |
| --- | --- |
| Move | Arrow keys or WASD |
| Confirm / advance text | Z, Space or Enter |
| Pause | Esc or P |
| Mute | M |
| Fullscreen | F |
| Show hitboxes | H |

On phones and tablets an on-screen d-pad and buttons appear.

Progress (chapter and total deaths) is saved in the browser.

## How it works

- **Shards**: collect every shard in a chapter to open the portal.
- **Purple flames** are save points. Dying sends you back to the last one you touched, and the world rewinds to that moment.
- **Don't stand still.** The meter in the top right fills while you're still. When it fills, a knight charges along your row. Keep moving, even a little.
- **Hidden floors** collapse the moment you step on them. Once one kills you, the kid remembers it: it stays marked with a red crack.
- **Cracked floors** fall about 0.4 s after you step on them. No waiting, no going back.
- Some things that look helpful are not.

## Chapters

1. Wrong Way (meadow, slimes, hidden pits)
2. Crossing the Road, Again (carriages and cavalry)
3. The Hungry Woods (dark forest, wolves, crows)
4. Garden of Spikes (spike waves, arrow traps, a pendulum)
5. The Catacombs (rotating fire bars, ghosts, near-total darkness)
6. Bridge of Cinders (crumbling bridges over lava, fireballs, falling rocks)
7. The Witch's Gate (the floor collapses behind you)

## Proof it can be beaten

`tools/solve.js` searches every chapter over position x time x shards collected, using the
game's own hazard code with every hazard inflated by a safety margin, then replays the route it
finds through the real game simulation (crumbling floors, corner sliding and the stand-still
knight included) to confirm it reaches the portal.

```sh
node tools/check.js          # parse and validate every map
node tools/solve.js all 2    # prove each chapter beatable with 2px of slack
node tools/tightness.js      # largest slack each chapter allows (smaller = harder)
```

At the time of writing, chapters 2, 5 and 6 only allow about 2px of slack, chapters 1, 4 and 7
about 4px, and chapter 3 is played almost blind in a dark forest.

## Project layout

```
index.html          page shell
css/style.css       layout, touch controls
js/core.js          constants, PX pixel buffer, bitmap font
js/sim.js           pure game logic (levels, hazards, movement, deaths); shared with the solver
js/levels.js        chapter maps, hazards, story lines
js/art_kid.js       the kid's sprites, walk cycles and dialogue portraits
js/art_world.js     tilesets for every area and props
js/art_mobs.js      knight, horses, carriage, truck, monsters, portals, shards
js/fx.js            pixel lighting, particles, Return-by-Death hands
js/audio.js         synthesized sound effects and chiptune music (WebAudio)
js/ui.js            dialogue box, chapter cards, menus
js/play.js          the gameplay scene
js/scenes.js        title, intro, wake-up, ending, credits
js/main.js          loop, input, scaling, saves
tools/              solver, map/sprite previews, screenshot helpers, bundler
```

All pixel art is drawn in code: hand-placed pixel rows for the characters, plus small procedural
painters with automatic shaded outlines for everything else. There are no external assets.

Developer URL options: `index.html?dev=1&level=3` jumps to a chapter, `&talk=0` skips dialogue,
`&god=1` disables death, `&hit=1` shows hitboxes, `&scene=Intro` plays a cutscene.
