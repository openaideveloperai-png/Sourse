# Nightlight Maker

A game maker in the spirit of RPG Maker, for pixel-art horror adventures like NOBODY HOME.
You paint rooms, place objects, write events as lists of commands, set up items, speakers,
endings and chases, playtest instantly and export a finished game as one HTML file.

It runs on the NOBODY HOME engine and comes with all of its art: over 400 sprites, 24 floors,
16 wall styles, the whole cast as walking characters, portraits, sounds and music. You can
import your own PNG sprites, character sheets, portraits and a title picture.

## Open it

- **From this repository:** open `maker/index.html` in Chrome, Edge or Firefox. Editing and
  playtesting work straight from disk.
- **One file:** `node tools/build_maker.js` writes `dist/nightlight-maker.html`, the whole
  maker in one file that also exports games without a server.
- Exporting from `maker/index.html` needs the page served over http (GitHub Pages, or
  `npx serve` in the repository folder), because browsers do not let pages opened from disk
  read other files.

Your work is kept in the browser as you go. **Save file** downloads the project
(`.nightlight.json`); **Open** loads one back.

## How a game is made

| Part | Where | What it holds |
| --- | --- | --- |
| Rooms | left panel, Rooms tab | Tiles, objects, entry points, lights, room events (first visit, every visit) |
| Objects | Objects mode | A sprite or a walking character, what happens when examined (Z) or stepped on, door, lock, hiding spot, light, save point, "only there while" conditions |
| Events | double-click an object | A list of commands, with branches for choices, conditions and puzzles |
| Database | Database tab | Items (and readable notes), speakers, endings, game over texts, chases, common events, combine recipes, imported images |
| Game | Game tab | Title, title screen, player character, start position, starting light and flags |

### Painting rooms

Rooms follow the RPG Maker layout: a ceiling row, two rows of wall face, then floor. In Tiles
mode, **Room box** draws all of that in one drag. Floors are painted per tile; the wall style is
set for the whole room. `R` railings make an outdoor corridor with the city beyond.

### Ready-made objects

Something to look at, door, floor exit, locked door, item to pick up, character, hiding spot,
save point, step-on trigger, light source, code lock and chase trigger. Each comes with its
event already written; change the text and the targets.

### Commands

| Group | Commands |
| --- | --- |
| Message | Show text, Show choices, Open a note, Show picture, Flash a picture, Chapter title, Set objective, Location banner, Balloon icon |
| Flow | If..., Wait, Stop this event, Run common event, Comment |
| State | Set flag, Clear flag, Add to counter, Random number, Give item, Take item, Ask to save, Retry point |
| Room | Go to room, Move player, Move object, Turn to face, Put object at, Remove object, Bring object back, Change object picture, Make a character appear, Remove that character, Companion follows, Change player look |
| Screen | Fade out, Fade in, Flash screen, Tint screen, Shake screen, Room darkness, Lights flicker, Jump scare, Player light |
| Audio | Play sound, Play music, Background sound |
| Puzzle | Code lock, Play a tune, Put in order, Set the clock, Use an item here |
| Danger | Start a chase, End the chase, Hide inside, Game over, Ending |
| Advanced | Script (JavaScript, with the engine's event API) |

In any text, `{name}` shows the value of a flag or counter. A line that starts with
`@who:face` switches the speaker for that line.

### Chases

Define a chase in Database > Chases: who hunts, how fast, whether he follows through doors,
when he gives up, which rooms are safe, the game over cause, and what happens when it ends.
Start it with **Start a chase**. The engine's hunt rules apply: no running while hunted, hiding
spots (he finds you if he sees you get in), chained apartment doors, and a retry from where the
chase began.

### Your own art

Database > Images > Import. Sprites can be a strip of animation frames. Character sheets use
the RPG Maker layout: 3 columns (step, stand, step) and 4 rows (down, left, right, up); frames
of about 16 x 24 pixels match the built-in cast. Portraits show at 42 x 42.

## Keys

`Ctrl+Z` undo, `Ctrl+Y` redo, `Ctrl+S` save file, `F5` play, `F6` play this room,
`T` `O` `E` `L` switch modes, `Del` delete, `Ctrl+D` copy an object, arrows nudge it,
`Esc` cancels. Right-click the map to play from that spot or start the game there.
In the event editor: `Enter` adds, `Del` deletes, `Ctrl+C`/`Ctrl+V` copy and paste,
`Alt+Up`/`Alt+Down` move, `Ctrl+/` turns a line off.

## Files

| File | Job |
| --- | --- |
| `maker/index.html`, `maker.css` | The editor page |
| `maker/js/schema.js` | Command and condition catalogue, object templates, blank and sample projects |
| `maker/js/runtime.js` | Turns a project into a game on the engine; the command interpreter; problem checks |
| `maker/js/ed_*.js` | Editor: core (state, undo, autosave), fields, map, inspector, events, database, files |
| `maker/play.html`, `maker/js/boot.js` | Playtest page, and the start-up code of exported games |
| `maker/js/engine_files.js` | Which engine files a game needs |
| `tools/build_maker.js` | Builds the one-file maker |
| `tools/test_maker.js` | Tests: editor, every command at runtime, the sample game, export |

## Tests

`node tools/test_maker.js` (needs Playwright and Chromium) opens the editor and adds every
command, runs every command in the real game, plays the sample game to its ending, builds the
one-file maker, exports the sample and plays the exported file to its ending.
