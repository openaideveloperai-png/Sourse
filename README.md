# NOBODY HOME

A pixel-art psychological horror adventure in the tradition of the RPG Maker classics
(*Ao Oni*, *Mad Father*, *Ib*): explore, examine everything, solve puzzle chains across rooms,
hide from the thing in the corridors, and piece the story together from letters.

December 9, 1958. 11:58 PM. Haru Aoki wakes up alone in apartment 404 of Hinata Heights on the
night of his tenth birthday. His mother, a night-shift nurse, promised to be home by midnight.
Someone knocks with her voice. Then the front door opens by itself, and the building outside is
wrong: a lift that was never built, neighbours lost in their own nights, and a very tall man in
a cap and a white mask who walks the corridors with a ring of keys, putting everyone back to bed.

About 1 to 1.5 hours. Four endings.

## Play

Open `index.html` in any modern browser. No install, no server, no build step.
`node tools/build.js` bundles everything into `dist/nobody-home.html` (one file).

| Action | Keys |
| --- | --- |
| Move | Arrow keys or WASD |
| Examine / confirm / advance text | Z, Space or Enter |
| Menu (items, notes, save) | X or Esc |
| Run (only when nothing is hunting you) | Shift |
| Mute / Fullscreen | M / F |

On phones and tablets an on-screen d-pad and buttons appear.

## Tips

- Examine everything. Examine it again after you learn something.
- The black phones (and the red one in the lobby) call home. Mom always picks up, and she
  always knows what you should look for. Calling again gives a clearer hint.
- Warm orange nightlights are save points. The game also saves at every chapter.
- He walks a little slower than you. He follows you through the door you used. Apartment doors
  have chains. If you hide, make sure he didn't hear you do it.
- Some things in this building are worth doing even if they open no door.

## For developers

- `docs/design.md`: the design (research synthesis and the full build spec).
- `docs/CONTENT_GUIDE.md`: the engine API for rooms, objects, events, puzzles and chases.
- `docs/MANIFEST.md`, `docs/ART_LIST.md`: map ownership, ids and sprite names.
- `node tools/walkthrough.js main` plays the whole game from New Game to the true ending and
  fails on any softlock (routes: `ch1`, `ch2`, `ch3`, `ch1f`, `ch4`, `finale_true`,
  `finale_leave`, `finale_normal`, `finale_wait`). Chases are checked by a bot that walks them.
- `tools/preview.html?walk=1` shows every character's walk cycle as a filmstrip.
