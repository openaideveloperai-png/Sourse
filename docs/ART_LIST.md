# NOBODY HOME: art list (the sprite name contract)

Content files refer to sprites **only by these names**. Art authors must register exactly these
names; content authors must not invent new names without adding them here. A name that is used
but not drawn shows up in game as a magenta box (and is listed in `G.missingArt`).

Conventions (see `docs/CONTENT_GUIDE.md` > Art and the existing files `js/art/furniture.js`,
`js/art/caretaker.js`, `js/art/chars_main.js`, `js/art_kid.js`):

- 16px tiles. Light from the top-left. Muted, dark palettes; saturated red only for danger.
  1970s Japanese public housing: grey concrete, pale green/cream paint, tatami, steel doors,
  fluorescent light, rust, rain.
- Every sprite ends with `px.outline()` and `return G.frame(px, ax, ay)`; the anchor (ax, ay) is
  the **bottom-centre of the object's footprint** (so a 2x1-tile object 32px wide with a 40px tall
  sprite uses `G.frame(px, 16, 40)` and its bottom 16px sit on the footprint row).
- Wall objects (`z: 'wall'`) stand on the lower `W` row: a door is 2 tiles tall (32px of wall
  face) and its sprite is usually 16x32 (or 32x32 for double doors), anchor (w/2, 32).
- "frames N" means an animated sprite (`G.defSprite(name, () => [f0, f1, ...], fps)`).
- Characters use `G.defChar(name, () => ({down: [f0, f1, f2], up: [...], left: [...]}))`, frame 0
  standing, 1 and 2 steps (right = left mirrored). Sizes are in the table. Anchor at the feet.
- Portraits are 42x42 canvases (`G.PX(42, 42)` then `.canvas()`, or the G.KID portrait builder
  for child faces), registered as functions `G.PORTRAITS[name] = (expr) => canvas` (cache them).
- Item icons: 16x16, anchor (8, 16), named `icon_<itemId>`.
- Pictures (shown full-screen by `E.picture(name)`): up to 160x100, anchor (w/2, h).

Existing sprites you can reuse (do not redraw): door_wood/red/white/iron(+_open), door, doorway,
window, window_wide, bookshelf(_wide/_messy), wardrobe(_open), table, table_cloth, table_small,
desk, chair, chair_back, bed(_blue/_white), dresser, cabinet, mirror(_cracked), piano, clock,
clock_stopped, painting_*, candle, lamp, plant(_dead), vase, chest(_open), safe, crate, barrel,
sofa, rug_spot, blood, blood_trail, footprints, paper, sparkle, stairs_up, stairs_down, switch,
sink, toilet, bathtub, stove, counter, fridge, statue. Characters: haru, old_haru, caretaker
(+ sprites caretaker_raised, scare_caretaker).

---

## A. Characters, portraits, scares (file `js/art/cast.js`)

| name | kind | size / notes |
| --- | --- | --- |
| `tama` | char | grey scruffy stray cat, torn left ear, 4 dirs walk (down/up/left, 3 frames), about 14x11, anchor at feet |
| `tama_sit` | sprite, frames 2 | sitting, tail flick, facing down |
| `tama_hiss` | sprite, frames 2 | arched back, fur up, facing left (flip for right) |
| `tama_carrier` | sprite, frames 2 | Tama inside a plastic pet carrier (grille door), 18x14 footprint 1x1 |
| `ota` | char | Mrs. Ota: tiny hunched old woman, lavender kimono, grey bun, about 14x20 |
| `ota_kneel` | sprite | Ota kneeling on a zabuton (seiza), facing down, 1x1 |
| `kuroda` | char | Mr. Kuroda: old thin man, white hair, worn black suit, about 15x24 |
| `kuroda_play` | sprite, frames 4 | Kuroda seated on a stool seen from behind/side, playing (hands move), 1x1 footprint, placed in front of the `piano` |
| `shota` | char | boy about Haru's size, no cap, messy brown hair, white t-shirt with a number, red shorts, sneakers. Built on the kid rows (`G.kidBuild`) like haru |
| `shota_cap` | char | same with a blue baseball cap |
| `guest1`..`guest4` | char x4 | party guests: adult bodies in 1970s party clothes (suit, dress, cardigan, kimono), heads covered by a white paper-bag mask with a crayon-drawn smiling face (each face different). About 16x26. Only `down`/`left`/`up` standing+step frames |
| `yui` | char | Yui: woman about 50, short dark hair with grey, beige coat, a bag of oranges in one hand, about 15x24 |
| `nurse` | char | Mr. Sato: young man, light-blue scrubs, lanyard, short black hair, kind tired face, about 16x26 (same height as the Caretaker is NOT needed; he's a normal adult) |
| `mom_memory` | char | Haru's mother in 1974: young woman, long black hair tied back, apron over a yellow dress, about 15x24. Content draws her with alpha 0.6 |
| `old_haru_bed` | sprite | old Haru lying in a care bed under a white blanket, head on the pillow at the top, 2x3 tiles (32x48 footprint, sprite may be taller), anchor (16, 48). Includes the bed |
| `haru_futon` | sprite | young Haru in a futon on tatami (blue futon, head at top), 1x2 tiles, anchor (8, 32) |
| `haru_futon_empty` | sprite | the same futon, thrown back, empty |
| `hands` | sprite, frames 4 | grey-white thin arms reaching up out of a dark square opening (the laundry chute), 16x24, anchor (8, 24) |
| `scare_hands` | sprite, frames 3 | 64x48 full-screen scare: many thin pale hands reaching from black |
| `scare_guest` | sprite, frames 3 | 64x48: a paper-bag mask very close, crayon smile, one real eye visible through a torn hole |
| `scare_mirror` | sprite, frames 3 | 64x48: old Haru's face in a mirror, wide-eyed, mouth open in a scream, grey hair, glasses |
| `scare_shota` | sprite, frames 2 | 64x48: Shota seen from behind facing a wall, far too close, messy hair, his neck a little too long; frame 2 his head has turned slightly |
| `caretaker_face` | sprite | the Caretaker with his head raised showing a real face (young, tired, kind: Mr. Sato) still in the grey uniform. Same body as `caretaker` down frame 0 |

Portraits (42x42, `G.PORTRAITS[name](expr)`):

| name | expressions |
| --- | --- |
| `ota` | neutral, happy, sad |
| `kuroda` | neutral, sad, happy |
| `shota` | neutral, happy, creepy (blank eyes, small smile) |
| `shota_cap` | happy |
| `yui` | neutral, sad, happy (tears) |
| `nurse` | neutral, kind |
| `phone` | neutral (no face: a black rotary-phone handset on a dark ground, used as Mom's voice portrait), static (the same with noise) |

Haru and old Haru portraits already exist: `G.haruPortrait(expr)` (neutral, shock, scared,
annoyed, determined, pain, happy, dead, sad) and `G.oldHaruPortrait(expr)`.

## B. Building and apartment props (file `js/art/danchi.js`)

Sizes are footprint tiles (w x h); the sprite may be taller than the footprint.

| name | footprint | notes |
| --- | --- | --- |
| `door_apt_401` `402` `403` `404` `301` `302` `303` `201` `202` `203` | 1x2 wall | steel apartment door, painted pale green-grey, peephole, mail slot, name/number plate showing the number; a chain latch |
| `door_apt_open` | 1x2 wall | the same door standing open (dark interior) |
| `door_steel` | 1x2 wall | plain steel service door (laundry, office, basement rooms) |
| `door_steel_open` | 1x2 wall | open |
| `door_stairs` | 1x2 wall | stairwell door with a small window and a green running-man EXIT sign above |
| `door_stairs_chained` | 1x2 wall | same with a chain and padlock across |
| `door_glass2` | 2x2 wall | lobby entrance: double glass doors, rain and night beyond |
| `door_glass2_chained` | 2x2 wall | same with a heavy chain and a big padlock |
| `door_basement` | 1x2 wall | heavy rusted door, "B1" stencilled, yellow-black stripe |
| `elevator` | 2x2 wall | closed steel elevator doors, floor indicator above (dark), OUT OF ORDER paper sign |
| `elevator_open` | 2x2 wall | doors open, dark car inside |
| `elevator_panel` | 1x1 wall | call button plate / keyhole panel next to the elevator |
| `lift_buttons` | 1x1 wall | the inside panel: 1-5, B, open/close buttons, keyhole |
| `fusuma` | 2x2 wall | paper sliding doors (cream with faint pattern), closed |
| `fusuma_open` | 2x2 wall | slid open, dark closet inside (hiding spot) |
| `oshiire` | 2x2 wall | closet with futons stacked inside (upper shelf) |
| `genkan_step` | 1x1 floor | raised wooden entry step edge with two pairs of shoes (decal-like, `z: 'floor'`) |
| `shoe_cabinet` | 1x1 | low wooden shoe cabinet |
| `kotatsu` | 2x2 | low table with a quilted blanket (brown/orange check) |
| `kotatsu_on` | 2x2, frames 2 | same with a faint red-orange glow under the blanket edge |
| `futon` | 1x2 floor | a laid-out futon (white/blue), flat |
| `futon_lump` | 1x2, frames 2 | a futon with someone under it breathing (subtle rise) |
| `chabudai` | 2x1 | round low table with a tea set |
| `zabuton` | 1x1 floor | floor cushion |
| `butsudan` | 1x1 | small black-lacquer family altar with a photo, two candles (frames 2, flicker) |
| `tv_crt` | 1x1 | 1970s wooden CRT TV on legs, off |
| `tv_static` | 1x1, frames 3 | the same with static on the screen (light grey noise) |
| `phone` | 1x1 | black rotary phone on a small lace-covered stand |
| `phone_ring` | 1x1, frames 2 | the same, receiver jumping (ringing) |
| `heater` | 1x1, frames 2 | kerosene heater, orange glow window |
| `calendar` | 1x1 wall | wall calendar, "1974" and a photo of Mt Fuji |
| `nightlight` | 1x1 wall, frames 4 | small plug-in nightlight on the dado: warm orange glow pulsing (save point) |
| `notice_board` | 2x1 wall | cork board with paper notices, one red-bordered |
| `mailboxes` | 2x1 wall | grid of small metal mailboxes with numbers, some stuffed with flyers |
| `payphone` | 1x1 | pink tabletop payphone (Japanese 1970s style) on a small shelf |
| `fluoro` | 1x1 wall, frames 3 | wall/ceiling fluorescent tube fixture; frame 2 is dark (flicker) |
| `plant_pot` | 1x1 | potted rubber plant on a corridor ledge |
| `umbrella_stand` | 1x1 | with two umbrellas |
| `bicycle` | 2x1 | old bicycle |
| `trash_bags` | 1x1 | garbage bags in a net |
| `barricade` | 3x2 | a pile of chairs, tables and a mattress blocking a stairwell |
| `window_frosted` | 1x1 wall | frosted glass window (corridor side of an apartment) |
| `window_frosted_shadow` | 1x1 wall | the same with a tall dark silhouette behind the glass |
| `window_rain` | 1x1 wall, frames 3 | window with rain streaks running down, night outside |
| `window_sunrise` | 2x1 wall | wide window with a pale pink-gold sunrise (true ending) |
| `kitchen_sink` | 1x1 | small steel sink unit with dishes |
| `gas_stove` | 1x1 | two-burner tabletop gas stove with a kettle |
| `kettle_steam` | 1x1, frames 3 | the same with the kettle steaming |
| `fridge_small` | 1x1 | small cream 1970s fridge |
| `dining_table` | 2x1 | small table with two chairs |
| `bath_tub` | 2x1 | square deep Japanese tub with a lid |
| `washbasin` | 1x1 | basin with a small mirror above (mirror part on the wall row above) |
| `mirror_small` | 1x1 wall | small bathroom mirror (cabinet) |
| `wall_clock` | 1x1 wall, frames 2 | round wall clock, pendulum below |
| `mantel_clock` | 1x1 | on a small cabinet |
| `cuckoo_clock` | 1x1 wall, frames 2 | carved wood cuckoo clock |

## C. Story props, puzzles, outdoors, basement, icons, pictures (file `js/art/props.js`)

| name | footprint | notes |
| --- | --- | --- |
| `toy_safe` | 1x1 | a red tin toy safe with a 4-digit dial |
| `toy_safe_open` | 1x1 | open, empty |
| `drawing1` .. `drawing4` | 1x1 wall | crayon drawings taped to the wall: 1 = three cats, 2 = one big sun, 3 = four people holding hands, 4 = seven stars. Each with its number in the corner |
| `picture_book` | 1x1 floor | a children's picture book lying open |
| `toy_box` | 1x1 | toy box with a robot and a ball |
| `kids_desk` | 1x1 | small desk with a lamp and crayons |
| `hole_wall` | 1x1 wall | a small ragged hole at the bottom of a wall (cat-sized), dark |
| `hole_floor` | 2x2 floor | a broken hole in a concrete floor with rebar, dark below |
| `hole_floor_rope` | 2x2 floor | the same with a knotted bedsheet rope tied to a pipe going down |
| `pipe_floor` | 1x1 | a thick radiator pipe coming out of the floor |
| `radiator` | 1x1 | old ribbed radiator |
| `washer` | 1x1 | top-loading washing machine (cream) |
| `washer_run` | 1x1, frames 3 | the same shaking slightly |
| `chute` | 1x2 wall | laundry chute: a square steel hatch in the wall with a handle, darkness behind a gap |
| `chute_open` | 1x2 wall | hatch open, black inside |
| `basket` | 1x1 | big wicker laundry basket full of sheets (hiding spot) |
| `lint_trap` | 1x1 | a dryer with a lint trap drawer |
| `shelf_bottles` | 1x1 | a shelf with detergent and chemical bottles |
| `safelight_off` | 1x1 wall | |
| `safelight_on` | 1x1 wall, frames 2 | red glow |
| `darkroom_tray` | 2x1 | a table with three developing trays |
| `photo_line` | 2x1 wall | a string with hanging photographs (blank grey squares) |
| `enlarger` | 1x1 | photo enlarger on a bench |
| `party_table` | 3x2 | long table with a white cloth, a birthday cake with candles (unlit in this sprite) and plates |
| `cake_candle` | 1x1 | one tall thin candle with a paper name tag in front (lit, frames 3 flicker) |
| `cake_candle_out` | 1x1 | the same, out, a wisp of smoke |
| `birthday_card` | 1x1 floor | a card on the floor |
| `family_photos` | 2x1 wall | four framed photos of children in a row |
| `streamers` | 3x1 wall | paper streamers and a HAPPY BIRTHDAY banner |
| `swing` | 2x2 | a metal swing frame with one seat swaying (frames 4) |
| `slide` | 2x3 | a concrete mountain slide with a tube; the top platform at the top |
| `sandbox` | 2x2 floor | wooden frame sandbox with a toy bucket |
| `fence_low` | 1x1 | low green metal child fence segment |
| `gate_low` | 1x1 | gate in it, closed |
| `drain_grate` | 1x1 floor | a grate in the ground at the slide's bottom |
| `puddle` | 1x1 floor, frames 3 | rain ripples |
| `bench` | 2x1 | park bench |
| `tree` | 2x2 | a bare wet zelkova tree (sprite tall, 32x48) |
| `boiler` | 3x2 | big boiler with gauges and pipes (frames 2: a gauge needle twitch) |
| `valve_red` `valve_blue` `valve_yellow` | 1x1 wall | valve wheels on a pipe |
| `steam` | 1x1, frames 4 | a jet of steam (white, transparent-ish), blocks the way |
| `pipes` | 2x1 wall | pipes running along the wall |
| `storage_cage` | 2x2 | chain-link storage cage with a padlock, boxes inside |
| `storage_cage_open` | 2x2 | open |
| `key_board` | 2x1 wall | a board of hooks with many keys and number tags |
| `key_board_open` | 2x1 wall | with a small lock box door open |
| `pet_carrier` | 1x1 | empty pet carrier |
| `care_bed` | 1x2 | a narrow bed with metal side rails and a white sheet (the Caretaker's room) |
| `hospital_bed` | 2x3 | the reality bed (same as `old_haru_bed` without anyone) |
| `office_desk` | 2x1 | grey steel desk with papers, a desk lamp and a phone |
| `filing_cabinet` | 1x1 | grey steel |
| `clipboard` | 1x1 floor | |
| `water_tank` | 3x3 | roof water tank on legs |
| `laundry_line` | 3x1 | roof laundry line with a sheet flapping (frames 3) |
| `boxes_stack` | 1x1 | cardboard boxes |
| `mop_bucket` | 1x1 | |

Item icons (16x16, `icon_<id>`): `icon_flashlight` `icon_batteries` `icon_fish_sausage`
`icon_key_403` `icon_ota_keyring` `icon_key_stairs4` `icon_sheet_1` `icon_sheet_2` `icon_sheet_3`
`icon_kuroda_song` `icon_developer` `icon_photo_lift` `icon_lift_key` `icon_marble` `icon_bedsheet`
`icon_gate_key` `icon_cap` `icon_basement_key` `icon_pressure_chart` `icon_front_key`
`icon_letter` (envelope, used by all letters) `icon_note` (folded paper, other documents)
`icon_postcard` `icon_photo` `icon_matches` `icon_tea` `icon_key` (generic small key).

Pictures (`E.picture(name)`, up to 160x100):

| name | content |
| --- | --- |
| `pic_drawings` | the four crayon drawings side by side with their corner numbers 1-4 (3 cats, 1 sun, 4 people, 7 stars) |
| `pic_photo_1974` | a developed black-and-white group photo of about 12 tenants in front of the building, a banner "HINATA HEIGHTS 1974", one small boy in front (Haru) |
| `pic_postcard` | a postcard of a train station at dusk, "6:40" circled on a station clock |
| `pic_mirror_old` | the bathroom mirror showing an old man's face instead of Haru's |
| `pic_carepost` | the true-ending room at sunrise: old Haru in a care bed, Tama on the blanket, Yui at the door |
| `pic_mom_photo` | a photo of a young mother holding a baby, "Haruko and Haru, 1964" on the white border |
| `pic_pressure_chart` | a pinned chart: three valves (red, blue, yellow) with arrows HIGH, LOW, MID |
