# NOBODY HOME: production manifest (shared conventions)

Five chapter authors write content in parallel. Until a neighbour's maps exist, placeholder
rooms from `js/content/stubs.js` stand in for them (grey rooms with the entries and doors
listed below), so every connection can be tested from day one. This file is the contract between them:
who owns which map, how rooms connect across files, and the ids of shared items and flags.
Read `docs/design.md` (the game), `docs/CONTENT_GUIDE.md` (the engine) and
`docs/ART_LIST.md` (sprite names) first.

## Files and ownership

| author | file | maps (ids) |
| --- | --- | --- |
| A: Prologue + Chapter 1 (4F) | `js/content/ch1.js` | home_bed, home_main, home_bath, c4, a401, a402, a403, stair4 |
| B: Chapter 2 (3F) | `js/content/ch2.js` | stair3, c3, a301, a302, a303, laundry, lift |
| C: Chapter 3a (2F) | `js/content/ch3.js` | c2, stair2, a201, a202, a203 |
| D: Chapter 3b (1F) + Finale | `js/content/ch1f.js` | office, lobby, stair1, yard, bikes, reality |
| E: Chapter 4 (B1) | `js/content/ch4.js` | b1_hall, storage, boiler, keeper |

Shared, owned by the lead (do not edit): `js/content/game.js` (speakers, deaths, endings, phone
hints, helpers, title), the engine (`js/engine/*`), art (`js/art/*`). If you need an engine
feature or a sprite that does not exist, say so in your report instead of editing those files;
use the closest existing sprite meanwhile.

Each chapter file also defines: its items (`G.ITEMS`), documents (items with `note: true`), phone
hints for its goals (`G.HINTS`), any extra deaths (`G.DEATHS`), and its test route
`G.WALKTHROUGH.<ch1|ch2|ch3|ch1f|ch4>` that starts with `{start: ...}` from the state listed
below, plays the chapter's critical path to the hand-off state, and covers every chase with an
`{escape: [...]}` step. Author D also writes `G.WALKTHROUGH.finale_*` routes for each ending.

## Cross-file connections (named entries)

Doors that lead into another author's map use `door: {to: map, entry: name}`. Each author must
define `entries` on their maps for every name below (an `[x, y, dir]` floor tile right next to
the matching door, facing away from it).

| from (owner) | door object | to map (owner) | entry name | condition |
| --- | --- | --- | --- | --- |
| stair4 (A) | `down` (stairs_down, floor exit) | stair3 (B) | `from_4f` | stair door on c4 opened in Ch1 |
| stair3 (B) | `up` (stairs_up) | stair4 (A) | `from_3f` | always |
| stair3 (B) | `down` (stairs_down) | stair2 (C) | `from_3f` | flag `stairsOpen` (before: furniture barricade) |
| stair2 (C) | `up` (stairs_up) | stair3 (B) | `from_2f` | flag `stairsOpen` (before: barricade seen from below) |
| stair2 (C) | `down` (stairs_down) | stair1 (D) | `from_2f` | flag `stairsOpen` (before: the 1F door is locked from the other side) |
| stair1 (D) | `up` (stairs_up) | stair2 (C) | `from_1f` | flag `stairsOpen` |
| lift (B) | scripted: Chase 2 cutscene `E.goto('c2', 'from_lift')` | c2 (C) | `from_lift` | the lift jams at 2F |
| a202 (C) | `hole` (rope down) | office (D) | `from_rope` | bedsheet tied (flag `ropeTied`) |
| stair1 (D) | `b1door` (door_basement) | b1_hall (E) | `from_1f` | item `basement_key` |
| b1_hall (E) | `up` (stairs_up) | stair1 (D) | `from_b1` | always |

Chase 4 starts in `keeper` (E) and ends when Haru reaches `lobby` (D): `safe: ['lobby']`.
The finale (D) happens in `lobby` once `front_key` is held.

## Chapter hand-off states (use as `{start: ...}` in your route)

Items listed are held at the start of the chapter; flags are set. `follower: 'tama'` means
`flags: {follower: 'tama'}`.

| chapter | start | items | flags | notes read |
| --- | --- | --- | --- | --- |
| Ch1 (A) | New Game | - | - | - |
| Ch2 (B) | `stair3`, entry `from_4f`, Chase 1 over (author A tests the chase 1 escape, which ends on 4F or on the stair3 landing) | flashlight, ota_keyring | follower: 'tama', ch1_done, chase1_done, reached3F | note_fridge, postcard, kids_note, letter_1 |
| Ch3a (C) | `c2`, entry `from_lift`, chase 2 starts in C's `enter` if flag `chase2_armed` and not `chase2_done` | flashlight, photo_1974, fishing_rod, (hearing_aid given away or held) | follower: 'tama', ch2_done, chase2_armed, reached3F | + letter_2 |
| Ch3b (D) | `office`, entry `from_rope` | flashlight, photo_1974, fishing_rod, gate_key | follower: 'tama', ch2_done, chase2_done, ropeTied, ch3a_done | + letter_3 |
| Ch4 (E) | `b1_hall`, entry `from_1f` | flashlight, keeper_key, (wire_cutters) | stairsOpen, tama_taken, ch3_done | + letter_4 |
| Finale (D) | `lobby`, after Chase 4 | front_key, ... | chase4_done, (tama_saved, follower: 'tama') | + letter_5 |

## Shared item ids

Prologue/Ch1 (A): `flashlight`, `batteries`, `fish_sausage`, `key_403`, `ota_keyring`,
`key_stairs4`; documents `note_fridge`, `postcard`, `timetable`, `kids_note`, `letter_1`.
Ch2 (B): `sheet_1`, `sheet_2`, `sheet_3` -> `kuroda_song` (recipe), `developer`, `photo_1974`,
`lift_key`, `fishing_rod`, `hearing_aid`; documents `music_chart`, `inspection_card`, `letter_2`.
Ch3a (C): `bedsheet`, `gate_key`; documents `birthday_card`, `letter_3`.
Ch3b (D): `keeper_key`, `cap`, `basement_key`, `wire_cutters`; documents `clipboard`,
`notice_rules`, `letter_4`.
Ch4 (E): `pressure_chart`, `front_key`; documents `night_log`, `letter_5`.

Items used in another author's chapter: `photo_1974` (B gives, A uses: Ota's optional beat),
`fishing_rod` (B gives, D uses on the drain), `bedsheet` (C), `keeper_key` (D gives, E uses),
`wire_cutters` (D gives, E uses on Tama's carrier), `front_key` (E gives, D uses in the finale).
The defining author writes the item's `G.ITEMS` entry (name, desc).

## Shared flags

| flag | set by | meaning |
| --- | --- | --- |
| `follower` = 'tama' | A (feeding her), D (unset when taken), E (set when freed) | Tama follows |
| `ch1_done`, `chase1_done` | A | stair door opened, chase 1 survived |
| `reached3F` | B | first arrival on 3F (enables the rare phone call) |
| `ch2_done`, `chase2_armed`, `chase2_done` | B, C | lift taken; chase 2 armed by B, finished in C |
| `ropeTied`, `ch3a_done` | C | the bedsheet rope in 202 |
| `stairsOpen` | D | first entry into the lobby: every stair flight connects again |
| `metaTitle` | C | the browser-tab scare is allowed (from Ch3) |
| `tama_taken` | D | the courtyard: the Caretaker takes Tama |
| `shota_bench` | D | Shota waits on the lobby bench for his cap |
| `ch3_done` | D | basement key in hand |
| `tama_saved` | E | Tama freed from the carrier |
| `chase4_done` | E | escaped to the lobby |
| `helped_ota` | A | photo_1974 given to Mrs. Ota (optional, late revisit) |
| `helped_kuroda` | B | hearing aid returned to Mr. Kuroda (optional) |
| `helped_shota` | D | cap returned to Shota on the lobby bench (optional) |
| `knowsSato` | D | finale: the Caretaker's name is known |

Goal ids are prefixed by chapter (`p_`, `c1_`, `c2_`, `c3_`, `c1f_`, `c4_`, `fin_`). Every goal
has phone hints. Local flags should be prefixed too (`c2_shotaRound`, ...).

## Save nightlights (one per area, 10-15 minutes apart)

home_bed (A), c4 near 404 (A), a301 (B), c2 near stair2 (C), lobby (D), storage aisle (E).
Phones (hint channel): home_main (A), a401 (A), a301 (B), office desk (D), lobby payphone (D).
