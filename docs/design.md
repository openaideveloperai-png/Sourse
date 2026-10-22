# NOBODY HOME: design bible (v2)

## Part 1: What the research says (synthesis)

Full notes: `docs/research.md`. Reliability: Ao Oni findings come from decoding the actual v5.2
game data; Mad Father, Ib and The Witch's House come from search-result extracts of wikis and
reviews; the four craft reports (puzzles, fear, art, narrative) are largely the researchers'
prior knowledge because most sites were unreachable. The fact-check pass did not run.

### Pillars that make the classics work

1. **A calm, familiar baseline that gets broken.** Cute sprites, ordinary rooms, stock-looking
   text boxes. Horror lands because the art first earns trust (Ao Oni's plain house, Ib's clean
   gallery, Witch's House pastels). Break it with one saturated accent, a different-scale monster,
   and sparse screen effects.
2. **One closed, symbolic place.** The location stands for the theme (an artist's mind as a
   gallery, a sick girl's body as her house). Its rules are the story's rules.
3. **Explore, find, use.** Walk + one button. Items auto-use on the right object. Long item chains
   across rooms make the floor plan the puzzle and route you through danger.
4. **Danger tied to progress.** Ao Oni attaches chases to the moment you pick up a reward or open
   a door; random ambushes are rationed by a cooldown so there is always a quiet window to think.
   Never make the player solve a hard puzzle while being chased.
5. **Readable, fair threats.** Same-speed pursuer that follows through the door you used, with a
   door sound as warning; chases end by changing rooms; hiding works if you break line of sight.
   Instant deaths are telegraphed and followed by a quick retry.
6. **Story told in fragments.** Diaries, letters, plaques. Notes double as puzzle clues, so
   players read everything. The monster is reframed as a victim; the twist recasts who the player
   was all along, with evidence planted from the start.
7. **Endings as a verdict.** Bad / normal / true, decided by optional acts of attention and
   empathy across the game, not one last button. The true ending tells the whole secret.

### Rules we adopt (with numbers)

- 1-2 hours, ~30 small rooms, 20-25 puzzles (10-15 real deductions + smaller lock/key steps),
  5-6 chases, 1 main pursuer + 2 local threats, 10-15 documents, 4 endings.
- Pacing curve per 10-15 minutes: quiet exploration, 2-3 small unsettling events, one major scare
  or chase, then a safe room. Hard jump scare at most every 8-12 minutes; first "scare" in the
  first 5 minutes is a fake-out.
- Chaser speed 85-100% of the player's (we use 54-60 vs 62 px/s), 4+ tiles head start, door-follow
  delay 1.2-2 s with a door sound, chases 10-25 s, rooms with chases have a loop or 2 exits.
- Lock before key; 2-3 redundant clues per code; changing examine text after clues are known;
  specific failure messages; an objective line in the menu; an in-world hint channel.
- Save points every 10-15 minutes, plus automatic retry from the room you entered.
- Silence is the baseline. Music for safe rooms, chases, story beats. Off-screen sounds (a door,
  keys) are the main warning.
- Revisit early rooms later with something changed.

### Pitfalls to avoid (what players criticized)

Random unfair deaths and hidden lethal rules; moon-logic puzzles and pixel hunts; missable
true-ending triggers with no hint; long unskippable death scenes; repetitive ambushes that make
players save-scum; aimless wandering with no objective; stilted dialogue; save bugs.

### Originality guardrails (do not copy)

Ao Oni: blue giant with a human face, the mansion, wardrobe "two door sounds" rule, piano and
abacus codes, friends picked off. Mad Father: doctor father, dolls, chainsaw, crows, Aya/Maria.
Ib: art gallery, roses as health, vases, Garry/Mary, paintings that crawl. Witch's House: forest
house, black cat save, body swap, rose walls, Ellen's diary. We reuse verbs and craft only.

---


## Part 2: The game (v2, after the design review)

This is the build spec. Five authors write chapters in parallel from it (ownership, map ids,
named entries, item ids and shared flags are in `docs/MANIFEST.md`; the engine API is in
`docs/CONTENT_GUIDE.md`; sprite names in `docs/ART_LIST.md`). Where this text gives exact
lines, use them (light edits for flow are fine); where it gives intent, write in the same voice.
All in-game text is ASCII (no smart quotes or em dashes).

### Logline

On the night of his tenth birthday, Haru Aoki wakes alone in apartment 404 of Hinata Heights.
His mother, a night-shift nurse, promised to be home by midnight. Someone knocks with her voice.
Then the front door opens by itself, and the building outside is wrong: a lift that was never
built, neighbours lost in their own nights, and a very tall man in a cap and a white mask who
walks the corridors with a ring of keys, putting everyone "back to bed".

### Canon (dates and people; never contradict these)

- **Haru Aoki**: born 9 Dec 1948. In the nightmare it is 9 Dec 1958, his 10th birthday. In
  reality it is the night of 9-10 Dec 2019, his 71st birthday. He was a photographer
  (he took the building's photos for decades). He lives in Room 404 of **Hinata Hills Care
  Residence**, built in 2008 on the site of Hinata Heights (1957-2005), in its locked dementia
  unit, since 2017.
- **Mom: Aoki Fumiko** (1924-1989), a night-shift nurse at the city hospital. Haru's father
  died in 1952. She was late on his 10th birthday: a fire by the station, they needed everyone.
  She came home at dawn with a squashed cake ("Tadaima, Haru. I'm so sorry I'm late." /
  "Okaeri."). The flat had a phone because the hospital installed it for her on-call shifts.
- **Yui**: Haru's daughter, born Feb 1980. She has learned to answer the night desk's calls as
  "Grandma" because it calms him. Every "Mom" on the phone after the prologue knock is Yui.
- **The Caretaker = Sato Kenta**, the young night nurse. White surgical mask (December flu
  season), cap, a ring of keys. He knocks before he enters. His mother packs his bento.
- **Residents** (drawn at Haru's scale, with faces): **Ota Kiyo** (90, 401), waits every
  evening at 6:40 for her husband Kenji (died 1983); **Kuroda Shin'ichi** (85, 301), a retired
  school music teacher, nearly deaf, plays the lounge piano at night and stops where his memory
  stops; **Ishida Shota** (72, 302), Haru's best friend in 1958, hides in cupboards at night,
  the only one who calls him "Haru". **Tama**: the care home's grey cat, sleeps in the staff room.
- **Staff** (drawn tall, about 1.8x Haru, in white masks): the Caretaker, and the party guests in
  201 (in paper party hats). In Haru's eyes residents are "like me", staff are "the grown-ups".

### The two layers (the twist)

The whole night happens on one locked floor of the care home. Every place in the nightmare is a
real room seen through fear. Never state this until the true ending; let it be readable on replay.

| Nightmare (Hinata Heights, 1958) | Reality (Hinata Hills, 2019) |
| --- | --- |
| Apartment 404, home | Haru's room 404 (printed name card, a crayon drawing by Yui over the bed) |
| The lift "that shouldn't exist" | the unit's keypad lift |
| 401 Mrs. Ota, waiting for the 6:40 | Ota Kiyo's room; she waits at her window every evening |
| 402 the empty flat | an empty room between residents |
| 403 the Tanabe kids' room (drawings, toy safe) | the family visiting room, covered in grandchildren's drawings |
| 301 Mr. Kuroda's piano | the lounge piano (staff lock the lid at 10 PM) |
| 302 Shota's flat, hide-and-seek | Mr. Ishida's room and the linen cupboards he hides in |
| 303 the darkroom | the activity room (Haru's photos, a 2019 newspaper) |
| the laundry, the chute | the linen room and linen chute (Sato calling up it, looking for Mr. Ishida) |
| 201 the birthday party, masked guests | the common room: the monthly "December birthdays" party Haru forgot |
| 202 the renovation flat, the balcony hatch | an empty room under repair; the fire-escape hatch |
| 203 "AOKI", the 1958 flat | the "Showa room" (a reminiscence room furnished like the 1950s, with the Aoki family nameplate Haru donated) |
| the 1F office | the nurse station |
| the lobby, the chained front doors | the unit's keypad exit (the one real danger) |
| the courtyard playground | the enclosed garden terrace |
| B1 storage cages | residents' memory-box lockers |
| the boiler room, steam, valves | the assisted bathroom (steam, taps) |
| the Caretaker's room (key board, cot) | the staff room |
| being caught: "Back to bed." | being walked back to bed by a nurse |
| "Mom" on the phone | Yui, put through by the night desk |
| nightlights (save points) | the corridor night lights |

**Escalating clues** (attentive players should suspect by the midpoint; plan for that dramatic
irony): Prologue: a 0.2 s mirror glimpse, Mom's "candy" (a pill organiser), Yui's drawing
("MY PAPA - YUI, 6": "I didn't draw this. ...Who's Yui?"), a soft chime when he gets up
(the bed-exit sensor: "...A lift? We don't have a lift."). Ch1: the lift that shouldn't exist,
"Mister? I'm ten.", 404's printed name card with no age. Ch2: the 2019 newspaper, the 1977 photo
signed "Photo: H. Aoki", knowing darkroom chemistry, Letter 2 in a brown cardigan. Ch3: the
clipboard (AOKI H. - 71), the enamel AOKI nameplate on 203, the 203 mirror, the cake iced HARU,
the phone slip "Be careful, Da-- ...Be careful, Haru." Ch4: the rounds sheet, Sato's bento note,
Letter 5, the memory box. Finale: his hands, the mask.

**Sensitivity rules.** The horror is Haru's fear, never a joke about old age. No sedation,
restraints or straps anywhere. Never say "dementia" in dialogue. The pill box is examine-only.
Old Haru is never a jump scare. The ending is about being found and known, not about loss.

### Tone

A 1950s Japanese public housing block (danchi) in the rain: open-air concrete corridors,
steel doors, tatami, kotatsu, kerosene heaters, rotary phones, fluorescent tubes that flicker.
Small sounds: rain, a clock, keys. Melancholy more than gore; no blood at all. Haru is brave,
dry, a little funny, polite to adults ("Excuse me, Mister"), and talks to himself to stay calm.

### Cast and speakers

Speaker ids (already in `js/content/game.js`): `haru` (faces: neutral, shock, scared, annoyed,
determined, pain, happy, dead, sad), `old_haru` (finale only), `caretaker` (name "???" until
flag `knowsSato`), `mom` (the phone voice, phone portrait), `voice` (unknown voice behind a door),
`yui`, `nurse`/`sato` (Mr. Sato unmasked), `ota`, `kuroda`, `shota` / `shota_cap`, `guest`
(party staff, "???"), `tama` (only for meows: "Mrr?").

The Caretaker's lines: Ch1-2 "It's late. Back to bed now." / "...Aoki-san." After Tama is taken:
"Mr. Aoki... please." Chase 5: "Haru-san, it's me... Sa-to." Shown as small banners
(`E.location(text)`) during chases, never as dialogue boxes in a chase.

### Systems

- **Explore, examine, auto-use items.** Every object has examine text in Haru's voice; text
  changes once a clue is known (object `text` may be a function `E => ...`). Every failure has a
  specific line (a code with the first digit right says so).
- **No running while hunted** (engine rule). Haru walks 62 px/s; hunters 50-60.
- **Hint phone ("Call home: 404").** Black phones in 404, 401, 301, the office, and the red
  payphone in the lobby. Every goal has a goal id and three hint tiers (vague, names the room,
  names the clue). The voice is "Mom" (really Yui). Plants: the first call after reaching 2F ends
  "Be careful, Da-- ...Be careful, Haru."; one Ch4 call ends with "(far away) Is he all right?
  ...Yes, I'm still here." Once, from 3F on, the third call ever reaches the night desk instead
  (already in game.js).
- **Nightlights = save points** (warm orange plug-in lights): home_bed, c4 near 404, a301, c2
  near the stair2 door, the lobby, the B1 storage aisle. Chapters also autosave. No saving while
  hunted.
- **Retry** from the last checkpoint after any game over ("BACK TO BED"). Scripted chases use
  the chase registry so a retry restarts them correctly.
- **Letters from Mom** (5): one per area, each lying where it is obvious once you enter the room
  (a glint `sparkle` beside it), each opened and read on pickup (`yield* E.give('letter_2');
  yield* E.note('letter_2')`). The notes tab shows "Letters from Mom: n/5".
- **Tama** (Ch1 to the courtyard, then again after B1): follows Haru; fetches through gaps
  (`E.followerOut` / `E.followerIn`); her warning cue is a chirp with ears forward and a "!"
  bubble, a few seconds before scripted appearances of the Caretaker (on replay you see it is a
  greeting). She never enters memory rooms (203: `follower: false`; "Tama won't come in. She sits
  in the doorway, very still.").
- **The hunt** (Caretaker chases): he follows through the door you used about 1.6-2.2 s later
  (keys first); he walks a little slower than Haru; chases end when he loses you (hide where he
  did not see you climb in, or keep changing rooms until his timer runs out and the keys fade).
  **Latch**: apartment doors have chains; in a chase, Z on the door you just came through latches
  it and buys about 5 s. **He hears you hide**: hiding within 2.5 s before he comes through the
  door means he heard the cupboard close (game over). So: latch, then hide. Taught in Ch3 (202).
- **Walk-bys**: from Ch2, the keys sound and the Caretaker walks along a corridor's railing row
  from end to end (`E.walkBy`). Stay off his row or duck into a door. Taught by a scripted
  walk-by in c3; afterwards rationed (`E.ambushReady(0.25, 300)`, at most 3 per game, corridors
  only, never across a door tile).
- **Floor sound landmarks**, and silence as the warning: 4F Ota's clocks ticking out of sync
  (in sync after her puzzle); 3F Kuroda's four notes every 20 s (the whole phrase after his
  puzzle); 2F a slow warped birthday song behind 201 (silence after it is solved); 1F the
  payphone line hum; B1 the boiler thrum. Two seconds before any chase or walk-by on a floor,
  its sound stops mid-note.
- **Darkness**: per room (see each chapter). The player's flashlight radius is 92 once it works.
  Rooms with dark >= 0.7 give the Caretaker a dim cold light (engine).

### Endings (4) and the true-ending conditions

True-ending conditions (all optional acts of attention, never missable: every floor reconnects
after the lobby is reached): **(1)** all 5 letters read; **(2)** `ota_tea`: sat and had tea with
Mrs. Ota (she offers on every visit after her puzzle); **(3)** `helped_shota`: returned Shota's
cap (he waits on the lobby bench); **(4)** `tama_saved`: freed Tama from the carrier in B1.
`G.trueEnd()` in game.js returns the missing ones.

1. **OKAERI** (bad, prologue): open the door to the knocking voice. Retry from just before
   (`retry: true`). Text: "Haru opened the door. / It wasn't Mom. / Something very tall bent down
   until it filled the doorway. / It had a ring of keys. It had no face. / "There you are," it
   said. "It's late."" Hint: "Mom has her own keys."
2. **NOBODY HOME** (bad): leave through the unlocked lobby doors instead of answering the
   phone. "Haru let the phone ring. / He ran through the doors and into the rain, until the
   building was gone and the road was empty. / They found him at dawn on the river road, in his
   slippers, asking every car if they had seen his mother. / He was very polite about it."
   Hint: "Someone was trying to reach you."
3. **LIGHTS OUT** (normal): take the Caretaker's hand without the full truth. "The hand was
   warm. Haru let it lead him. / For a moment the corridor had handrails, and every door had a
   photograph. / Then it was 404 again: the futon, the rain, the stopped clock. / "Good night,
   Mr. Aoki." / Mister? thought Haru. I'm ten. / Tomorrow night, the knocking starts again."
   Hint: "Mom wrote you five letters. Someone is still waiting for you."
4. **WELCOME HOME** (true): see the Finale section.

Game over (being caught) title: "BACK TO BED". Texts per cause (`G.DEATHS`): caretaker "A warm
hand on your shoulder. "There you are. Back to bed now."", heard "He heard the cupboard door
close.", seen "He saw you climb in. Break his line of sight first.", chute "A long grey sleeve
came up the chute. "There you are, Aoki-san."", guests "They sang to him until the candles went
out.", steam "The steam pushes you back, hot and white."

### Map overview

```
4F  [stair4]==c4 corridor==[lift]   404 HOME (home_main, home_bed, home_bath)  401 Ota  402 empty  403 Tanabe
3F  [stair3]==c3 corridor==[lift]   301 Kuroda  302 Shota  303 darkroom  laundry          (lift car: lift)
2F  [stair2]==c2 corridor (flooded) 201 party  202 renovation (balcony hatch)  203 AOKI (1958)
1F  [stair1]--lobby--office, bike room, courtyard (yard)        B1 door in stair1
B1  b1_hall -- storage (cages), boiler -- keeper (staff room)
```

Stairs: 4F-3F open from Ch1's end. 3F-2F is blocked by a furniture barricade and 2F-1F by a door
locked from the lobby side, until the first entry into the lobby (flag `stairsOpen`): from then on
every flight connects ("Somebody put all the chairs back."). Corridors are open-air on the south
side: a row of `R` railing tiles with the rain beyond (`rain: 'rail'`).

Room size guide: corridors 26-40 wide x 7-8 tall (they scroll); apartments 12-20 x 9-12; lay
furniture against walls, keep paths at least 1 tile wide, give every chase room a loop or two
exits. The look is RPG Maker 3/4 horror: furnished, lived-in, symmetrical-ish, a light source or
two per room.

### Minute map (first play, target 100 min; hard shocks every 8-12 min, never back to back)

0 wake; 3 mirror glimpse (fake-out); 5 knock; 6 peephole; 7 phone, lights die, door opens;
9 c4: tubes die toward the lift, lift counts down; 12 Tama through the hole, a giggle;
15 lift doors crack open, first chirp, "Aoki-san"; 17 Ota's kettle; 21 the 403 hiding scene;
24 CHASE 1; 26-33 quiet 3F (save in 301); 31 Tama's keys fake-out; 35-38 Shota; 40 darkroom
and the c3 walk-by; 42 the chute; 46 the lift, CHASE 2, the face in the gap; 49 save c2;
50-55 the party; 57 the 203 memory and mirror (quiet); 60 office monitor; 62 lobby (stairs
reopen), save; 65 courtyard lightning; 66 Tama taken; 67 grief; 70 CHASE 3; 72 Shota on the
bench; 75 B1, save; 76 Letter 5; 78 the stalk; 80 valves; 84 the key board; 86 Tama freed;
87 CHASE 4 to the lobby; 90 rest, save; 92-100 finale.

---

### PROLOGUE: "December 9, 1958. 11:58 PM" (author A, ~8 min)

Maps: `home_bed` (Haru's 6-tatami room), `home_main` (genkan + kitchen + living room),
`home_bath`. Music none; ambience `rain`; dark 0.25 until `powerOut`, then 0.8
(`dark: E => E.flag('powerOut') ? 0.8 : 0.25`). The front door of home_main leads to `c4`
(only after the scene below). G.START = home_bed, Haru in his futon.

Beats and objects:
- Start: `E.chapter('December 9, 1958. 11:58 PM', 'Prologue')`. Haru in his futon
  (`E.pose('player', 'haru_futon')` then off). "@haru:scared ...Mom?" / "@ Rain. Mom's futon is
  still folded in the corner." Goal `p_wait` "Mom said she'd be home by midnight."
  On the first step off the futon a soft distant `chime`: "@haru ...A lift? We don't have a lift."
- home_bed: futon (hide spot later: the Easter egg below), Mom's folded futon, oshiire, window
  with rain, a nightlight (save), **Yui's drawing** (`yui_drawing`): "@ A crayon drawing: a tall
  man with a camera, holding a little girl's hand. MY PAPA - YUI, 6." "@haru I didn't draw this.
  ...Who's Yui?"
- home_main: **fridge** with Mom's note (document `note_fridge`, added to Notes on first read):
  "Haru - Dinner's in the fridge. Lock the door. Don't open it for anyone. I'll be home before
  midnight. Promise. - Mom / P.S. Happy birthday, my big ten-year-old." (Exactly four sentences
  before the P.S.; the 203 puzzle uses them.) The fridge also holds a **fish sausage** (take it:
  "Mom's emergency dinner."). **Wall clock** (`wall_clock`): "@ 11:58. The second hand is very
  loud." **Kotatsu** with a **present** wrapped in newspaper, card "TO HARU - OPEN AT MIDNIGHT":
  "It's nearly midnight. ...Close enough." Inside: Mom's keychain **flashlight** (dead) and
  **Letter 1** (read at once). **Calendar**: "@ DECEMBER 1958. The 9th is circled in red: HARU
  10!!" **Pill box** (`pill_box`): "@haru Mom's candy. One a day. They don't taste like candy."
  (examine only). **Phone** (black rotary). Shoe cabinet, genkan step, the front door (steel,
  chained: "@haru Mom said lock the door. It's locked. And chained. Good.").
- Flashlight: Letter 1 says to borrow the clock's batteries. Take them from the wall clock:
  "@ The clock stops at 11:59." "@haru:determined There. Now it isn't midnight. So she isn't
  late." A moment later: "@ Somewhere in the building, another clock strikes twelve." Recipe
  flashlight + batteries -> `flashlight` lit (`then`: `E.set('playerLight', 92)`, "Click. Light!").
- home_bath: deep square tub with a lid, washbasin and a small mirror: on first examine,
  `E.glimpse('pic_mirror_old', {time: 0.2})` then "@haru ...Huh?" "@haru Must be the steam."
  (fake-out; nothing else happens).
- The knock: when Haru leaves the bathroom (or the next room change) with the lit flashlight:
  knocking at the front door (`knock`). Goal `p_door` "Someone is at the door." At the door:
  "@voice Haru? It's Mom. I'm home. Open the door." Choice [Open the door] [Look through the
  peephole] [Don't open it]:
  - Open: ending OKAERI (retry: true).
  - Peephole: `E.picture('pic_peephole')` (the empty corridor in the rain; then a grey uniform
    button fills the lens, keys jingle). Back to the same choice with the line "@voice Haru? Why
    are you looking at me like that? Open the door."
  - Don't open: "@haru:scared (Mom has her own keys.)" "@haru:scared (Mom never knocks.)"
    "@voice Haru. ...It's late." Keys jingle away. Then the phone rings (`phone_ring`, sfx
    `ring`, until answered; the door does nothing meanwhile: "The phone is ringing."). Answer:
    "@mom Haru? It's me. Listen. Stay in your room tonight, okay? Whatever you hear. ...I'm
    coming. I'll be there in the morning. I--" (static) "@ The line goes dead." Then
    `E.set('powerOut')`, "@ The lights die.", "@ Somewhere a lock turns.", the front door swings
    open by itself (door sprite open, the chain hangs loose). "@haru:scared Mom...?"
    `E.chapter('Chapter 1: The Fourth Floor', 'Ch.1 4F')`, goal `c1_find` "Find Mom. Get out of
    the building."
- Easter egg: if Haru hides in his own futon during a 4F walk-by later, the Caretaker tucks him
  in ("@caretaker Good night, Mr. Aoki.") and leaves.

**Letter 1** (`letter_1`, "To Haru, on your birthday"): "December 9, 1958. Ten years ago tonight
you came out yelling, and you haven't stopped since. I'm on nights again, I'm sorry. This is so
you're never scared of the dark while I'm gone. Batteries not included (your mother is
hopeless): borrow the clock's till I'm home. The hospital put the phone in for my shifts, so if
you're frightened, call. I'll always pick up. Love, Mom." Reaction: "@haru She'll be home soon.
...Soon."

Hints: `p_wait` [["@haru (Mom's not here to call. Maybe look around the flat.)"]], `p_door`
none needed (scripted). The phone works as a hint channel from Ch1.

---

### CHAPTER 1: The Fourth Floor (author A, ~18 min)

Maps: `c4` (corridor, dark 0.55, ambience rain, flickering tubes, rain beyond the railing),
`stair4` (stairwell landing, dark 0.7, a green exit sign light), `a401` (dark 0.35, warm),
`a402` (dark 0.75), `a403` (dark 0.6). 404's door in c4 leads back home (home stays visitable;
its phone gives hints). Nightlight in c4 next to 404's door.

**c4 first entry** (fear beat): the tube lights go out one by one toward the lift (`fluoro`
objects switching to their dark frame with a `click` each), the lift's floor lamp lights "4"
with a `ding`, then counts 3-2-1-B with dings. "@haru:confused Since when is there a lift here?"
The lift (2x2 `elevator`, OUT OF ORDER sign): "@ OUT OF ORDER. ...We don't have a lift. We've
never had a lift."

**The stairwell door** (east or west end, `door_stairs_chained`): visible from minute 1. "@ Two
locks. A big padlock with a tag: 4F STAIRS. And a little brass lock on the chain: RESIDENTS'
COMMITTEE - EMERGENCY USE ONLY." `lock: E => E.has('key_stairs4') && E.has('ota_keyring')`;
lockText names the lock still closed ("The padlock opens... but the little brass lock won't." /
the reverse). Notice beside it: "RESIDENTS' SAFETY: NO STAIRS AFTER 11 PM."

Thread A (Tama, 402, 403):
- **Tama** sits at 402's door meowing (object `tama_npc`, char `tama`). Without food: "@ A grey
  cat with a torn ear. She won't come near." With the fish sausage: "@haru Here. Happy
  birthday to me." She eats, purrs, and follows (`E.set('follower', 'tama')`, remove the NPC).
  Name: "@haru I'll call you Tama." (If the sausage was not taken yet, the phone hint says "Is
  there anything in the fridge for a hungry cat?")
- **a402** (empty flat): bare tatami, a closet (`fusuma` / hide spot), boxes, and a cat-sized
  `hole_wall` low in the wall shared with 403: "@ Something jingles on the other side. A little
  bell? The hole goes into 403... too small for me." With Tama: `E.followerOut()`, she walks to
  the hole and vanishes; crayon scribbling on the far side stops; a child giggles; she comes back
  (`E.followerIn()`) with **key_403** (a spare key on a bell keychain) and a crayon drawing
  (`kids_drawing_tall`: "a small boy holding hands with a very, very tall grey man"). "@haru
  Good girl!"
- The **lift fake-out** (first time Haru walks past the lift with Tama following): Tama stops,
  chirps, stares (bubble "!"); the lift doors open 10 cm onto darkness (`elevator_open` briefly),
  keys jingle, "@caretaker ...Aoki-san." The doors close. "@haru:confused He knows my name."
  "@haru:annoyed ...Mister? I'm ten." (Teaches: chirp = him.)
- **a403** (the Tanabe brothers' room; reality: the visiting room): `bunk_bed` (hiding spot),
  `kids_desk`, `toy_box`, `picture_book` with the **kids' note** (`kids_note`): "PASSWORD =
  count our pictures!! (in order) - Taro and Jiro". Four drawings taped to the wall
  (`drawing1`..`drawing4`); examining each shows it big with `E.picture`: "1. our cats" (three
  cats), "2. sunny day" (one sun), "3. our family" (four people), "4. night sky" (seven stars).
  The **toy safe**: four dials with stickers in the same order (cat, sun, person, star).
  `E.code({len: 4, title: 'Toy safe'})` = **3147**. Wrong with first digit right: "@ The cat
  dial clicks. The rest don't." Otherwise: "@ Nothing. The safe rattles like it's laughing."
  Inside: **key_stairs4** + a note "we took the scary man's stair key hehe".
- **The hiding tutorial** (taking key_stairs4): Tama chirps at the door; keys coming closer
  along the corridor; "@haru:scared Someone's coming. Hide! Under the bunk bed!" (only the bunk
  works; `E.hideIn('bunk_bed')` from a yes/no). If hidden: a scripted pass (spawned caretaker
  object): he opens the door, ducks in, walks to the safe, stands 3 s (heartbeat), "@caretaker
  Mr... Aoki? ...It's late." and leaves; keys fade. "@haru (He's looking for someone. ...Not
  me. Right?)" If Haru refuses: chase from the door (registry chase `c1_403`, delay 1.2,
  speed 52, follow true, timer 14).

Thread B (Mrs. Ota, 401):
- **a401**: Mrs. Ota kneeling at a chabudai with two teacups (`ota_kneel`). "@ota Kenji? Oh.
  You're the Aoki boy. Come in, come in, you'll catch cold." "@ota My husband's train is late.
  He's never late." Three clocks (`wall_clock` with a pendulum, `mantel_clock`, `cuckoo_clock`),
  all stopped at 11:59: "@ota The clocks all stopped. Now he won't know when to come home."
  A **postcard** on the dresser (`postcard`): "Kiyo - the 6:40 gets me into Hinata Station.
  Then the ten-minute walk past the bakery, and I'll be home before the kettle boils. - Kenji
  (Ota Kenji, Chairman, Hinata Heights Residents' Committee)". In the genkan, a **timetable**
  (`timetable`, document): 18:40 circled in red, pencil "+10 walk". Her phone (hints).
- **P: set the pendulum clock** to when Kenji gets home: `E.clock({title: 'Wall clock', h: 11,
  m: 55})`; answer **6:50** (accept h 6 or 18, m 50). Wrong: "@ota Not yet, dear. The kettle
  isn't even warm." Right: the kettle whistles (`kettle_steam`, sfx `kettle`), the three clocks
  start ticking in sync (the 4F sound landmark settles). "@ota There. That's the 6:40. Kenji
  always says the kettle knows before I do." She gives **ota_keyring**: "@ota Kenji was
  chairman of the residents' committee, you know. He never went anywhere without these. Take
  them, dear. He'd want them used."
- **Tea (true-ending act)**: right after, and on every later visit: "@ota Sit, dear. Drink his
  while it's hot." [Sit with her] [I have to go]. Sit: a quiet 30-second scene (rain, the
  kettle, no music; the screen dims slightly), "@ota You have kind hands. ...Old hands. Like
  Kenji's." "@haru:confused (Old?)" "@ota I think I can sleep now." `E.set('ota_tea')`;
  afterwards she sleeps (`futon_lump`). Leave: "@ota Come back for your tea. I'm always home."

**Chase 1** (registry `c1`): using the stair door with both keys. Before the door opens Tama
chirps; the lift dings; the Caretaker steps out of the lift (at least 8 tiles from the stair
door). Config: speed 54, delay 1.0, follow true, followDelay 1.6, timer 20, loseAfterHide 5.5,
cause 'caretaker'. Route: c4 -> stair4 -> down to stair3 -> c3 (3F, author B). The stair4
landing has a cleaning cupboard (hide spot) 5+ tiles from its doors. On 3F during chase 1,
author B keeps 301/302/303 shut ("Someone is holding it shut from inside.") and leaves the
laundry door ajar with light spilling out (laundry baskets 5+ tiles from the door). When the
chase ends: `chase1_done`, goal `c2_down`.

Goals and hint tiers (A): `c1_find`: [["@mom Haru? Are you all right? ...You're out of the flat?
Stay close to the walls. Find the stairs."], ["@mom The stairwell has two locks. Somebody on your
floor must have the keys."], ["@mom Mrs. Ota's husband ran the residents' committee. And those
Tanabe boys take everything that isn't nailed down."]], plus sub-goals for the cat, the 403
safe (["@mom Count, sweetheart. Kids always hide passwords in plain sight."]) and the clock
(["@mom The train gets in at 6:40... and then he still has to walk home."]).

---

### CHAPTER 2: The Third Floor (author B, ~24 min)

Maps: `stair3` (landing; down blocked by the `barricade` until `stairsOpen`), `c3` (corridor,
dark 0.55, rain beyond the railing), `a301` (Kuroda; dark 0.3; music `sad` low; nightlight;
phone), `a302` (Shota; dark 0.5; a lit kerosene heater), `a303` (darkroom; dark 0.85;
`tint: E => E.flag('c2_safelight') ? ['#5a0008', 0.35] : null`), `laundry` (dark 0.65), `lift`
(the car, 3x3 inside; dark 0.6). On arrival: `E.set('reached3F')`, `E.chapter('Chapter 2: The
Third Floor', 'Ch.2 3F')` (after chase 1 ends), goal `c2_down` "Find another way down."

- **stair3**: the way down is buried: "@ Every chair in the building is piled here. Tables.
  A mattress. Someone moved them all... quietly." After `stairsOpen`: the pile is gone, the
  chairs stand in a neat row against the wall: "@haru Somebody put all the chairs back."
- **c3**: doors to 301, 302, 303, the laundry, the stairwell; the **lift** with a panel
  (`elevator_panel`): "@ A keyhole: MAINTENANCE. Buttons 1 to 5 and B. Three of them are worn
  smooth: 5, 1 and B." (Clue: the set of buttons.) A notice board with a floor map and a compass
  rose ("N" up; west is left) for Shota's riddle. A west-end **cleaning cupboard** (hide spot and
  a hide-and-seek spot). Sound landmark: Kuroda's four notes from 301 every 20 s
  (`G.Audio.tune` E G A G), the full phrase after he is helped.

Thread A (Mr. Kuroda's song -> lift key):
- **a301**: an upright `piano` with Mr. Kuroda on the stool (`kuroda_play`); a nightlight (save);
  a phone; a waste basket with **sheet_1** ("mi so la so"); framed class photos ("@ Rows and
  rows of children. Hinata Elementary, Music Club, 1962... 1971... 1985."). Kuroda can't hear
  well: "@kuroda Eh? Speak up, son. Or don't. I can't hear it either way." He plays E G A G and
  stops: "@haru Always the same four. Like he forgot the rest." Faded pencil on the keys: "@ Someone
  wrote on the keys in pencil. 'do' on this white one... 'so' on that one. For students?"
- **sheet_2**: in the laundry, behind the washing machines: "@ Something paper is stuck behind
  the machines. Too narrow for me." Tama fetches it (`E.followerOut()`/`followerIn()`): "@haru
  Good girl." (If Tama is not following there is always a hint.)
- **sheet_3**: in the darkroom, pegged on the drying line, visible only under the red safelight
  (object `cond: E => E.flag('c2_safelight')`).
- Recipe: sheet_1 + sheet_2 + sheet_3 -> **kuroda_song** (a document): "THE GO-HOME SONG
  (Hinata Elementary, 5 PM) - mi so la so / mi re / do (hold it, let it ring)". Clue to read the
  solfege: Shota's **music chart** on the 302 wall: "do re mi fa so la ti do" written over a
  keyboard labelled C D E F G A B C. Plus the pencil on Kuroda's keys, plus his four notes.
- **P: play the song** on Kuroda's piano: `E.piano({title: 'The go-home song', max: 7})`, answer
  **E G A G E D C**. Wrong: "@ Mr. Kuroda shakes his head without looking up. He felt it through
  the floor." Right: he lays his palm flat on the lid to feel the last note. "@kuroda ...There's
  the rest of it. I can't hear it any more, you know. But I felt it come up through the keys."
  "@haru It's the go-home song." "@kuroda Forty years I played it for the children. Go home, go
  home. ...You play like a man who used to play, son." He gives **lift_key**: "@kuroda The man
  with the keys closes my lid at ten every night. Tonight he left this on it. Go on home."
  (`c2_kuroda`; the 3F sound landmark becomes the full phrase.)

Thread B (Shota's hide-and-seek -> the lift sequence + fishing rod):
- **a302**: Shota (no cap) bouncing on his toes: "@shota Haru! You came! Play hide-and-seek?
  You're it! Count to ten!" (He calls him Haru: they are friends.) The flat: oshiire (futon
  closet) next to the lit **heater** ("@ Still burning. The only warm thing in the building."),
  a toy box, the **music chart**, a tall **mirror stand**. Five possible spots: the oshiire, the
  toy box, the c3 west cupboard, a laundry basket, behind the mirror stand.
- Three rounds; he hides after a fade, giving a riddle. Round 1: "@shota I always hide where
  it's warm!" -> the oshiire by the heater. Round 2: "@shota Where the sun goes down!" -> the
  west-end cupboard in c3 (compass on the notice board). Round 3: "@shota Where you can see
  yourself!" -> behind the mirror stand: as Haru finds him, the mirror shows for a moment an old
  man in a blue baseball cap (`E.glimpse('mirror_stand_old')`... or a sprite swap on the mirror);
  "@haru:confused ...Shota?" "@shota Found me." Then the creepy beat: Shota stands facing the
  wall, very still, for a moment too long (`scare_shota` as a glimpse, no sting) before he turns
  around grinning. Opening two wrong spots in one round: a giggle from somewhere else, "@shota
  Cheater! I moved!", the round restarts.
- Each found round, Shota tells part of the lift secret: R1 "@shota The scary man always pushes 5
  first. Top floor. Like he's checking on somebody." R2 "@shota ...then 1. All the way down." R3
  "@shota ...then B. Bottom-bottom. Where nobody's allowed." After round 3 he gives the
  **fishing_rod**: "@shota My fishing game! The magnet's super strong. I fish bottle caps out of
  the drain in the yard with it. You can borrow it." And: "@shota The scary man keeps
  everybody's keys in the basement." (`c2_shota`.) He has lost his cap: "@shota I lost my cap
  somewhere outside. Mom's gonna kill me." (Sets up Ch3.)

Thread C (the darkroom -> photo and sheet 3):
- **a303**: a red **safelight** (switch on the wall -> `safelight_on`, `c2_safelight`), an
  enlarger, the **darkroom_tray** (three trays), a drying line (`photo_line`), a shelf, a table
  with a **newspaper**: "@ A newspaper. December 9, 2019. ...2019? That's sixty years from now."
  The tray needs **developer** (on the laundry shelf: "DEVELOPER - property of 303. Do NOT mix with
  bleach!"). With developer and the safelight on: "@haru Developer, stop bath, fixer. ...How do I
  know that?" `E.picture('pic_blank', {morph: 'pic_photo_1977', morphTime: 2.5, caption:
  'Something is coming up in the tray...'})` -> item **photo_1977** (document): "Hinata Heights,
  20th anniversary, 1977. On the back: Photo: H. Aoki." "@haru H. Aoki. ...I didn't take this."
- Leaving 303 the first time after the photo: the scripted **walk-by** lesson. Keys from the
  stairwell; the Caretaker walks the railing row of c3 end to end at 45 px/s (`E.walkBy`); Haru
  steps back to the wall row on his own ("@haru:scared Don't move... don't move..."). If the
  player stands on his row anyway, it kills (it is telegraphed).

The laundry:
- Washing machines (`washer`, one `washer_run`), the **chute** (`chute`), laundry **baskets**
  (hide spots), the shelf with the **developer**, and **Letter 2** in the pocket of a brown
  cardigan in machine 2 ("@ A brown cardigan, far too big for me. There's something in the
  pocket.").
- Chute: 1st examine "@ Warm air breathes up the chute. It smells of soap." 2nd "@ Far below:
  keys. A man's voice: 'Aoki-san?'" "@haru Don't. Don't, Haru." 3rd: yes/no "Reach inside?"
  (default No): Yes = caught (cause `chute`). The chute is inert during chases.
- **Tama's keys fake-out** (first time Haru goes from c3 to the laundry with Tama, ~31 min):
  keys jingle inside the laundry with no chirp; Tama is batting at a coin-box key ring hanging on
  a washer dial; she trots back. "@haru:annoyed Tama! ...Don't do that." The only fake jingle.

**The lift** (needs **lift_key** AND Shota's three rounds = `fishing_rod` in hand; if not:
"@haru Shota is still hiding somewhere. I promised I'd find him first."). If `letter_2` is not
read: "@haru:confused I feel like I'm forgetting something on this floor..." (no block). Using
the key: the doors open (`elevator_open`); inside the car (`lift`): `lift_buttons`:
`E.code({len: 3, chars: '12345B', title: 'MAINTENANCE - RESET SEQUENCE'})` = **51B**. Wrong:
"@ The lift shudders. Nothing." Right: the car starts down toward B, grinds, jams. "@ Stuck.
The 2F doors are right there." Cutscene: `E.flicker(4)`; when the light comes back a tall figure
stands head-down in the back corner (spawned caretaker object) for 1.5 s; darkness; a grey hand
on Haru's shoulder; Haru wrenches free and stumbles out through the pried doors (splash).
Then: `E.set('ch2_done'); E.set('chase2_armed'); yield* E.goto('c2', 'from_lift', null, 'down',
{checkpoint: false})`. Chase 2 starts in c2 (author C).

Goals and hint tiers (B): `c2_down` [["@mom You need to go down, Haru. The stairs are blocked?
...Then think of another way."], ["@mom That lift... somebody must have the key. Mr. Kuroda's
been there forever."], ["@mom He can't hear, sweetheart. Find the rest of his song."]];
`c2_song` (have pieces), `c2_read` ("@mom Do re mi, Haru. Somebody on your floor has a chart."),
`c2_shota` (riddle tiers per round: "@mom Warm... what's still burning in that building?" /
"@mom The sun goes down in the west. Is there a map in the corridor?" / "@mom Where can you see
yourself?"), `c2_lift` ("@mom Shota watched that man. Which buttons look used?").

**Letter 2** (`letter_2`, March 1967): "You left for the photo lab this morning and your futon's
still warm. Eighteen and a working man. I'm sorry I was never home at night. You grew up kind
anyway. Wear the cardigan, it's cold in that lab. - Mom" Reaction: "@haru:confused Photo lab?
...I'm ten."

---

### CHAPTER 3a: The Second Floor (author C, ~16 min)

Maps: `c2` (corridor, flooded ankle-deep: `floorSound: 'water'`, dark 0.8, lightning through the
railing every ~25 s via `update` + `E.flash`, sound landmark: a slow warped birthday song from
201 until it is solved), `stair2` (dark 0.7; the barricade above until `stairsOpen`; the 1F door
below "locked from the other side" until `stairsOpen`; a hiding spot under the stairs), `a201`
(the party; dark 0.5), `a202` (renovation; dark 0.7), `a203` (the 1958 Aoki flat; dark 0.15, the
brightest room in the game; `follower: false`; music `sad`). Nightlight in c2 beside the stair2
door. `E.chapter('Chapter 3: The Second Floor', 'Ch.3 2F')` after chase 2; `E.set('metaTitle')`.

**Chase 2** (registry `c2`, started from c2's `enter` when `chase2_armed && !chase2_done &&
!E.chasing()`): the Caretaker comes out of the lift door. Config: at the lift door tile, speed
54, delay 1.2, follow true, followDelay 2.2, timer 16, loseAfterHide 6, safe ['a201', 'a203']
(they are locked anyway), cause 'caretaker'. During chase 2: 201 is locked (muffled slow singing,
the door shakes), 203 is locked (the enamel AOKI nameplate is seen in passing: "@haru:confused
...That's our name?"), stair2's 1F door is locked, 202 is open.
- **The latch lesson** (first entry into 202 during chase 2, from 202's `enter`): a dialog
  (which freezes the hunt): "@haru:scared A chain! Latch it!" [Latch it] [Keep running]. Latched:
  the door opens 10 cm against the chain, a long grey hand feels for the chain, keys try the lock
  three times (`unlock` x3), then `E.scare('caretaker_gap')`: his masked face pressed into the gap
  (the main jump scare, first time players see him up close without dying). Then he is "away"
  for the latch time. 202's hiding spot: a tarp over stacked tatami (`tarp_bags`, hide) 6+ tiles
  from the door. Because he hears hiding within 2.5 s of his arrival, latching first is what makes
  hiding safe here; the game tells you once after a "heard" death: "@haru (He heard me. Chain the
  door first. Then hide.)" When he comes in he searches for 6 s, stops at the balcony hatch
  ("@caretaker ..."), and leaves. `chase2_done`. If the player keeps running instead, the timer
  ending in another room also works.

**201: the party** (after chase 2; the room is calm on first entry):
- Three tall masked **staff** in paper party hats (`staff1`-`staff3`) stand behind chairs at a
  long table, singing "Happy Birthday" far too slowly (`G.Audio.tune`, slow, detuned). A banner:
  "HAPPY BIRTHDAY, DECEMBER FRIENDS!" A cake iced HARU in pink letters. Paper plates. Four
  candles in holders (`cake_candle`), each with a folded name card: **KIYO**, **SHIN**, **SHOTA**,
  **HARU**. A card on the table (`birthday_card`): "Happy birthday, December friends! House rule:
  elders blow first! - the staff". On the wall, four framed childhood photos (`family_photos`;
  `E.picture('pic_family_photos')`): "KIYO 1929", "SHIN 1934", "SHOTA 1947", "HARU 1948".
  Examining SHOTA's/HARU's card: "@haru Shota's a year older than me. He never lets me forget it."
- **P: blow out the candles oldest first**: KIYO, SHIN, SHOTA, HARU. Each candle: "Blow it out?"
  A wrong candle: the singing stops; all candles relight; `yield* E.creep(['staff1', 'staff2',
  'staff3'], {steps: 1, cause: 'guests'})` (each guest takes one step toward Haru in the dark).
  Guests start at least 5 tiles away from the candles and the door, so the 4th mistake is the
  earliest that can kill. Retry restores them (room entry). Right order: "@ The last candle goes
  out. The singing stops." "@ On a paper plate: one slice of cake. HARU, in pink icing. And stuck
  in the icing like a candle, a small key on a tag: YARD." -> **gate_key**. "@haru:sad Someone
  had a party for me. ...I don't remember it." The three guests turn their heads to Haru at the
  same moment and stay like that. (No chase.) The 2F sound landmark goes silent.

**203: AOKI, 1958** (the memory):
- The door has an old enamel nameplate AOKI (`nameplate_enamel`): "@haru That's our nameplate.
  ...We live on the fourth floor. Don't we?" Tama won't come in.
- Inside: a perfect, warmer copy of 404 in 1958: lit, a radio, the smell of rice. Young Mom
  (`mom_memory`, alpha 0.6) at the counter, in her nurse's cardigan, writing the fridge note, in a
  loop: she never hears Haru. "@haru Mom? ...Mom!" The 1958 fridge holds the same note, rain-
  smeared: only "Dinner's in the fridge." and "...before midnight. Promise." are legible.
- **P: what did Mom tell me that night?** At the counter: `E.order({title: 'What did Mom tell
  me?', items: ["I'll be home before midnight.", "Lock the door.", "Don't open it for anyone.",
  "Dinner's in the fridge."]})`; answer: Dinner's in the fridge / Lock the door / Don't open it
  for anyone / I'll be home before midnight. (Clue: the prologue note in Notes; the smeared copy
  confirms the first and last.) Wrong: "@ She keeps writing. She doesn't look up." Right: she
  stops, turns, almost looks at him: "@mom I'll be home before midnight. I promise. ...Happy
  birthday, Haru." She fades. **Letter 3** lies on the table; the closet opens: on a hook, a key
  on a wooden tag: **AOKI - BALCONY HATCH** (`hatch_key`).
- The **mirror** by the door (quiet, no sting): the reflection is an old man in a brown
  cardigan; `E.picture('pic_mirror_old')`, the ambience cuts to `void` for 3 s; "@ Haru raises
  his hand. The reflection raises its hand a beat late, touches the glass, and mouths: Mom?"
  "@haru:shock ...That's not me. That's not me."

**202: the renovation flat**: bare concrete, stacked tatami under a tarp (hide), paint cans, a
ladder, a radiator, and the balcony with a steel **escape hatch** in the floor (`escape_hatch`):
"@ A fire-escape hatch. Every balcony has one. 'IN EMERGENCY, OPEN WITH YOUR HOUSEHOLD KEY.'"
With `hatch_key`: it opens (`escape_hatch_open`, `hatchOpen`); a folding ladder goes down into
the dark: door `{to: 'office', entry: 'from_hatch'}` ("@ The ladder goes down to the floor
below."). The office has a matching ladder back up.

**stair2**: the up flight is blocked by the barricade's underside ("@ Chair legs. Table legs. The
whole pile from upstairs."), the down door is locked from the other side ("@ Locked. From the
other side. ...There's a lobby down there."). After `stairsOpen` both open.

Goals and hints (C): `c2_chase` none (it's a chase); `c3_party` [["@mom Haru? ...Be careful, Da--
...Be careful, Haru."], ["@mom A party? Then there's a card. There's always a card."], ["@mom
Elders first, Haru. Look at the photos on the wall."]] (the first tier is the planted slip, so
the first hint call on 2F always plays it once: track a flag); `c3_memory` [["@mom Our old flat?
...What did I write on the fridge that night?"], ["@mom Read my note again, Haru. In order."]];
`c3_down` [["@mom You need to get to the ground floor."], ["@mom Every balcony has a fire-escape
hatch, Haru. Our family had a key."], ["@mom Look in our old closet."]].

**Letter 3** (`letter_3`, October 1975, on the 203 table): "Sunday you marry Michiko. I ironed
your shirt three times. Your father would have cried, so I'll cry for both of us. - Mom"
Reaction: "@haru:annoyed Married? ...Gross." then "@haru:confused ...Why is this Mom's writing?"

---

### CHAPTER 3b: The Ground Floor (author D, ~16 min)

Maps: `office` (dark 0.7; arrive by the ladder from 202 at entry `from_hatch`), `lobby` (dark
0.45; ambience rain + the payphone hum; nightlight; the finale), `stair1` (dark 0.7; stairs up;
the **B1 door** `door_basement`: "B1 - STAFF ONLY", padlocked: `basement_key`), `bikes` (bike
room; dark 0.75), `yard` (courtyard; `rain: 'full'`, dark 0.6; lightning), `reality` (the true
ending room). `E.chapter('Chapter 3: The Ground Floor', 'Ch.3 1F')` on the first office entry.

**office** (the nurse station in reality):
- A **clipboard** (document `clipboard`): "NIGHT LIST - 2F/3F/4F. ...401 OTA K. - waits at the
  window, 6:40. 301 KURODA S. - lounge piano lid locked 22:00. 302 ISHIDA S. - check the
  cupboards. 404 AOKI H. - 71 - wanders at night - tries the FRONT DOOR: keep the key locked up -
  daughter Yui: call any hour. NIGHT STAFF: SATO." (The ages of others are smudged; Haru's isn't.)
  "@haru:confused Seventy-one? ...That's a mistake."
- A wall **mirror**: each time Haru faces it, it shows for 0.4 s the real room's whiteboard
  (`E.glimpse('pic_whiteboard_mirror', {time: 0.4})`): a sticky note with digits, seen in the
  mirror (so reversed). "@haru The numbers in the mirror look... backwards."
- A **key cabinet** (`cabinet`): "@ A key cabinet. A keypad: CODE ON THE BOARD." There is no
  board in the office, only the mirror. `E.code({len: 4, title: 'Key cabinet'})` = **3742**
  (the mirrored note reads 2473). Entering 2473: "@ Click. No. ...Mirrors flip things, don't
  they?" Inside: **keeper_key** ("B1 - CARETAKER").
- A **security monitor** (`crt_monitor`): `E.picture('pic_monitor')` (an empty lobby; on the
  second frame an old man in a brown cardigan stares up at the camera). "@haru:shock !" Haru
  spins round: nothing. The feed is empty again.
- A **desk phone** (hints). A ladder up to 202's balcony (door back to 202). The office door to
  the lobby: "@ Locked... from this side. There's a latch." It opens (one-way unlock).

**lobby** (first entry -> `stairsOpen`): a sting, then quiet. "@haru The stairwell door... it's
open now." (Every flight connects again; goal `c1f_out` "Get out. The front doors are in the
lobby.") Objects: the **front doors** (`door_glass2_chained`): "@ The front doors. A heavy chain
and a padlock. A tag: FRONT - KEY ON THE STAFF BOARD (B1)."; the **notice board** (document
`notice_rules`): "HINATA HEIGHTS - RESIDENTS' RULES. 1. No going out after 9 PM. 2. Answer the
night staff. 3. Lights out at 10. NIGHT STAFF ON DUTY: SATO"; **mailboxes** ("@ 404 - AOKI. A
printed card in a plastic holder."); the red **payphone** (`payphone`, hints; its little lamp
`phone_booth_light`); a **nightlight**; a **bench** (Shota later); doors to `stair1`, `bikes`,
the `yard` (gate: `gate_key`, "YARD").
- **bikes**: bicycles, trash bags, a **toolbox**: **wire_cutters** ("@haru Snips. For wire.").
  (Used in B1 on Tama's carrier. Never required.)

**yard** (the courtyard; the garden terrace in reality):
- First entry: lightning (`E.flash`, `thunder`) shows a tall figure standing by the sandbox
  fence; the next flash, gone. Tama chirps at the sandbox. Swing (`swing`, animated), a concrete
  tube **slide**, a **jungle_gym**, a **sandbox** with Shota's **cap** in it, puddles, a bench,
  the bare tree, a **drain grate** beside the slide with a key glinting below (`drain_key`):
  "@ A key on a tag: B1. It's down in the drain. My arm's too short."
- **Tama is taken**: picking up the cap (`cap`, goal `c1f_tama`): Tama chirps (2 s), a huge grey
  hand reaches out of the dark at the sandbox edge (`E.followerOut()` then a spawned hand/the
  caretaker reaching, Tama lifted away, `E.despawn`), a yowl, gone. `E.unset('follower')`,
  `E.set('tama_taken')`. "@haru:shock TAMA!" Keys jingle away toward the lobby. Goal "Get Tama
  back." Then 60 s of grief: no music, rain only; Haru sits on the swing (`E.pose`). "@haru ...She
  was just a cat. She was just a stupid cat." **Letter 4** is taped under the swing seat in
  plastic (found as he sits).
- **The drain**: with the **fishing_rod**: "@haru Shota's magnet. ...Come on, come on." ->
  **basement_key**. Then **Chase 3** (registry `c3yard`): the payphone light in the lobby goes
  out (seen through the glass), the lobby door bangs open and the Caretaker stands in it,
  blocking the way back. Config: at the lobby door tile (8+ tiles from the drain), speed 54,
  delay 1.0, follow false, duration 18, cause 'caretaker'. The playground forms a loop (slide +
  sandbox + jungle gym block, walking perimeter >= 24 tiles), so walking round it keeps the gap.
  The tube slide is NOT a hiding spot. When the duration ends: `E.flash('#ffffff', 0.4)` + thunder,
  and when the light returns he's gone. `ch3_done`. Goal `c1f_b1` "Tama's somewhere downstairs.
  The B1 door is in the stairwell."
- **Shota on the bench** (after the cap is taken, `shota_bench`): Shota sits on the lobby bench
  facing the wall. With the cap: "@shota_cap My cap! Always in that sandbox." "@shota ...Hey,
  Haru. You got old." "@haru:confused What?" "@shota Nothing. Same Haru. Same ears. Play
  tomorrow?" "@haru Yeah. Tomorrow." "@ For the first time, Shota stays where he is."
  (`helped_shota`.) He stays on the bench, later asleep.

**Letter 4** (`letter_4`, February 1980): "She's here. Yui. Your ears and your temper. Don't you
dare work nights now, Haru. I know what it costs a child. - Mom (Grandma!)" Reaction: "@haru
Yui. ...The drawing by my bed."

Goals and hints (D): `c1f_office` [["@mom You're on the ground floor? Good. Find a way out of
that room."], ["@mom Somebody keeps the keys locked up in there. The code's written somewhere."],
["@mom Mirrors flip things, Haru."]]; `c1f_out` [["@mom The front doors are chained? Then the
key is somewhere in that building."], ["@mom The tag said the staff board. Downstairs."]];
`c1f_tama` [["@mom Where's that cat of yours?"]]; `c1f_b1` [["@mom You can't reach it with your
hands, Haru. What did Shota say he fishes things out with?"]]; `c1f_cap` [["@mom Your friend's
still looking for something."]].

---

### CHAPTER 4: The Basement (author E, ~18 min)

Maps: `b1_hall` (dark 0.85, low ceiling feel, bare bulbs that swing (`E.flicker(2)`), pipes on
the walls with painted bands and stencils: `pipe_hot` "HOT WATER" red, `pipe_heat` "HEATING"
blue, `pipe_laundry` "LAUNDRY" grey; ambience `basement` + the boiler thrum; stairs up to stair1),
`storage` (dark 0.8; cages; nightlight in the aisle), `boiler` (dark 0.7; steam), `keeper` (the
staff room; dark 0.7, one desk lamp; Tama). `E.chapter('Chapter 4: The Basement', 'Ch.4 B1')`.
B1 warning rule: 2 s before every appearance the thrum cuts out and the bulbs flicker.

- **storage**: numbered chain-link cages (`storage_cage` / `cage_numbered`) with a number
  painted on each. **Cage 404** (padlock with two dials: MONTH / DAY): `E.code({len: 4, title:
  'Cage 404 - MONTH / DAY'})` = **1209** (Letter 1's date, the calendar's circled 9th of
  December). After Letter 4 is read the cage text changes to "@haru Month and day... my birthday?"
  Inside: Haru's **memory box**: a baseball glove ("@haru My glove! ...It's so small."), a photo
  (`E.picture('pic_mom_photo')`: "Fumiko and Haru, 1949"), and **Letter 5**. **Cage KANRI**
  (management, unlocked): the **pressure chart** (document + `pic_pressure_chart`): "WINTER
  SETTINGS: HOT WATER - high. HEATING - low, or she shakes. LAUNDRY - mid. - K." **Cage 304**
  (empty, open: a tarp; hide spot for the stalk). Boxes, a mop bucket.
- **The stalk** (taking the pressure chart): the thrum stops; keys at the far hall door (10+
  tiles away). Haru has 6 s to hide (cage 304's tarp via `E.hideIn`). Hidden: a scripted pass:
  he walks the aisle, stops at 304, rattles the cage door with his keys, heartbeat 3 s,
  "@caretaker ...Mr. Aoki?", leaves; the thrum returns. Not hidden after 6 s: registry chase
  `c4stalk` from the far door: speed 54, delay 1.0, timer 12, follow true.
- **boiler** (the assisted bathroom in reality): steam blocks the passage to the keeper's door
  (`steam` objects, solid). Three unlabelled valves with painted bands: red, blue, grey
  (`valve_red`, `valve_blue`, `valve_grey`). The pipes run across into b1_hall, where the stencils
  name them. Each valve: `E.ask('Set the red valve', ['Low', 'Mid', 'High'])`. Answer: **red
  High, blue Low, grey Mid**. A wrong setting (checked when the third is set): a steam burst
  shoves Haru back 2 tiles (`E.walk`), "@ The blue one rattles like it's going to burst." (name
  only a wrong valve's colour). Right: the steam dies down; the way to the keeper's door is open.
- **keeper** (the staff room): the door from the boiler room has a padlock "CARETAKER" ->
  `keeper_key`. Inside: a **key board** with every key in the building (`key_board`) and a small
  lock box labelled "FRONT - THE ONE WHO KEEPS TRYING TO LEAVE"; a **staff cot**; a **thermos and
  bento** with a note (document): "Kenta - eat something. - Mom" ("@haru The scary man has a
  mom."); the **rounds sheet** (document `night_log`): "23:58 404 up again (bed mat). Asking for
  his mother. 00:10 called daughter - coming AM. 00:20 404 at the front door. 01:05 404 at the
  front door AGAIN. Changed the box code to his room number."; a mirror flash of the whiteboard
  is not needed here. **Tama** in a pet carrier twisted shut with wire (`carrier_wired`): "@haru
  Tama! ...It's wired shut. I need cutters." With `wire_cutters`: `tama_saved`, she follows again
  (`E.set('follower', 'tama')`): "@haru:happy Tama! Did he hurt you?" "@ Tama yawns. She smells
  of someone else's hands, and of fish."
- **P: the lock box**: `E.code({len: 3, title: 'FRONT - the one who keeps trying to leave'})` =
  **404** (clues: the clipboard "404 ... tries the FRONT DOOR", the rounds sheet "changed the box
  code to his room number"). Wrong: "@ The box stays shut." Right: "@haru:confused ...404?
  That's MY room. I don't try to leave. I'm just looking for Mom." -> **front_key**.
- **Chase 4** (registry `c4`), started when the front key is taken: Tama (if freed) purrs, then
  chirps; the inner door (locked all game, from b1_hall) opens and he comes in, so the boiler
  door stays free. Config: speed 58, delay 1.2, follow true, followDelay 2.0, safe ['lobby'],
  no timer, loseAfterHide 6, cause 'caretaker'. Route: keeper -> boiler (latch the door: `latch:
  true`) -> b1_hall -> up -> stair1 -> lobby (safe: the chase ends). If Tama is still in the
  carrier: "@haru:sad Tama-- I'll come back!" and goal `c4_tama` "Go back for Tama." (B1 stays
  open and quiet afterwards.) `chase4_done`; in the lobby, rest and save.

**Letter 5** (`letter_5`, November 1989, shaky handwriting): "I'm in the hospital now. Come in
the mornings, not at night. The night nurse here is a boy younger than you, and he always knocks
first. When you're old and frightened, let them help you. Let someone come home to you. - Mom"
Reaction (no joke): "@haru:sad Mom's writing is all shaky."

Goals and hints (E): `c4_find` [["@mom Downstairs? Oh, Haru. Stay in the light."], ["@mom The
staff room. That's where he keeps the keys. And your cat."]]; `c4_steam` [["@mom Steam? Someone
must have written down how the valves go."], ["@mom Hot water high, heating low, laundry in the
middle. Which pipe is which?"]] with the Ch4 plant on one tier: "...(far away) Is he all right?
...Yes, I'm still here."; `c4_box` [["@mom The one who keeps trying to leave... who could that
be?"], ["@mom Read the rounds sheet, Haru."]]; `c4_cage` [["@mom Our box is down there. Your
birthday keeps it safe."]].

---

### FINALE: Welcome Home (author D, lobby, ~6 min)

Requires `front_key` and `chase4_done`. The front doors: the key turns, the chain falls. Before
Haru can push them, the red **payphone** rings (`ring` every 2 s, its lamp pulsing).
- **Leave** (the doors): "@ The phone keeps ringing. Leave anyway?" Yes -> ending NOBODY HOME.
- **The phone**: [Answer] [Let it ring].
  - **Let it ring** (or 20 s pass): keys; the Caretaker walks in from the dark (a harmless
    walk-by that stops 2 tiles away). If all four conditions are met he lifts the receiver and
    holds it out at arm's length, head still bowed (-> the true path below). Otherwise he hangs
    it up, and offers his hand: [Take his hand] -> LIGHTS OUT; [Run] -> NOBODY HOME.
  - **Answer**, conditions missing: the voice (Yui, as Mom) names the FIRST missing condition
    with where to look: letters ("@mom Did you read everything I wrote you, Haru? All of it?" +
    the place of the first unread letter), tea ("@mom Mrs. Ota's all alone up there. Did you
    have your tea with her?"), Shota ("@mom Your friend's still looking for something. He's
    waiting downstairs."), Tama ("@mom Where's that cat of yours?"). Then [I'll go look] (the
    phone stops; the doors stay open; it rings again next time the doors are touched) or [I'm so
    tired, Mom] (the Caretaker arrives: [Take his hand] -> LIGHTS OUT, [Run] -> NOBODY HOME).
  - **Answer, all conditions met: the true path.** Tama chirps and trots into the dark ("@haru:scared
    Tama, no!"). The Caretaker steps into the light; Tama winds round his ankles, purring
    (bubble heart). He lifts the receiver and holds it out, head still bowed. "@ He doesn't grab.
    He waits." Phone: "@yui Dad? ...Dad, it's me. It's Yui." "@haru:confused Yui? ...Is Mom
    there?" "@yui No, Dad. Grandma's not coming. ...But I am. First train. I'll be there in the
    morning." "@haru:sad She was late. On my birthday. She said midnight." "@yui I know. She came
    home in the morning, didn't she? She always did. ...I'm sorry I missed yours too. Happy
    birthday, Dad." "@yui The desk keeps putting you through to me tonight. It's okay. I'm up.
    Will you let Mr. Sato take you back to your room?" `E.picture('pic_hands_receiver')` (two
    old hands holding the receiver); from here Haru speaks as `old_haru`. "@ He hooks a finger in
    his white mask and pulls it down." (`E.setSprite`/pose `caretaker_face`; `E.set('knowsSato')`.)
    "@nurse Mr. Aoki. It's late. Let's get you back to bed." "@old_haru You knocked." "@nurse I
    always knock. It's your room." "@old_haru My mother worked nights." "@nurse I know. You tell
    me. She always came home in the morning, right?" [Take his hand] [Run]: Run -> NOBODY HOME;
    Take his hand -> the ending sequence:
    1. Fade: the corridor with handrails and framed photos (a caption over black is enough:
       "@ For a moment the corridor has handrails. Every door has a photograph.").
    2. The 1958 dawn memory: `E.picture('pic_dawn_1958')`, "@mom Tadaima, Haru. I'm so sorry I'm
       late. There was a fire by the station; they needed everyone." "@haru ...Okaeri."
    3. `reality` (404 at sunrise: `window_sunrise`, `old_haru_bed` with old Haru, Tama on the
       blanket, the memory box, Yui's drawing over the bed; all calm, dark 0, music `ending`).
       From outside the door: "@nurse Long night. He sat with Mrs. Ota till her tea went cold.
       Got Mr. Kuroda playing again. And he found Mr. Ishida in the linen cupboard. I'd been
       looking for an hour." "@yui That sounds like him." A knock; this time Haru isn't afraid.
       Yui comes in (with a bag of mikan and a small cake): "@yui Morning, Dad. ...Sorry I'm late."
       "@old_haru Welcome home, Yui." "@yui ...You know me today." "@old_haru I waited up."
    4. `E.ending('welcome_home')`: title WELCOME HOME; the ending lines; optional end card
       "For everyone who waits up at night."

---

### Chases summary

| # | where | trigger | config | lesson |
| --- | --- | --- | --- | --- |
| tutorial | a403 | taking key_stairs4 | scripted hide (chase only if you refuse) | hiding |
| 1 | c4 -> stair4 -> 3F | the stair door | speed 54, timer 20, from the lift 8+ tiles away | he follows through doors; keep moving |
| walk-by | c3 | leaving 303 | walkBy along the railing row | stay off his row |
| 2 | c2 -> 202 | lift jams | speed 54, followDelay 2.2, timer 16 | latch, then hide |
| party | a201 | wrong candles | creep (statues), 4 mistakes | the dark moves |
| 3 | yard | basement key | speed 54, follow false, duration 18, loop | circle the playground |
| stalk | storage | pressure chart | scripted pass if hidden; else chase timer 12 | hide in time |
| 4 | keeper -> lobby | front key | speed 58, followDelay 2.0, safe lobby, no timer | everything: latch the boiler door, keep moving |

### Critical path (dependency list)

1. Prologue: gift -> flashlight + Letter 1; clock batteries -> light; knock: don't open; phone;
   door opens. (`powerOut`)
2. Ch1 A: fish sausage (home fridge) -> Tama follows -> 402 hole fetch -> key_403 -> 403 safe 3147
   -> key_stairs4 (+ hiding scene). Ch1 B: 401 postcard + timetable -> clock 6:50 -> ota_keyring
   (+ optional tea). Both keys -> stair door -> CHASE 1 -> 3F.
3. Ch2 A: sheet_1 (301 basket), sheet_2 (laundry, Tama fetch), sheet_3 (303, safelight) ->
   kuroda_song; music chart -> piano EGAGEDC -> lift_key. Ch2 B: Shota x3 (warm/west/mirror) ->
   5, 1, B + fishing_rod. Ch2 C: developer (laundry) + safelight -> photo_1977 (story) + sheet_3.
   lift_key + fishing_rod -> lift 51B -> CHASE 2 (c2, latch 202).
4. Ch3a: 201 candles KIYO SHIN SHOTA HARU -> gate_key. 203 memory order -> Letter 3 + hatch_key.
   202 hatch -> office.
5. Ch3b: office mirror 3742 -> keeper_key; lobby -> stairsOpen; yard (gate_key): cap -> Tama
   taken; Letter 4 (swing); drain + fishing_rod -> basement_key -> CHASE 3; (bikes: wire_cutters;
   Shota bench: cap -> helped_shota).
6. Ch4: b1 -> storage: KANRI chart (stalk), cage 404 1209 -> Letter 5; boiler valves red High /
   blue Low / grey Mid; keeper (keeper_key): lock box 404 -> front_key; carrier + wire_cutters
   -> tama_saved; CHASE 4 -> lobby.
7. Finale: front_key -> phone -> endings.

Optional (true ending): letters 1-5 read, ota_tea, helped_shota, tama_saved. All reachable at any
time after `stairsOpen`.

### Documents

note_fridge, letter_1..5, postcard, timetable, kids_note, kuroda_song (combined), photo_1977,
music_chart, birthday_card, clipboard, notice_rules, pressure_chart, night_log, bento note,
newspaper (examine only). Each 30-120 words, ASCII.

### Items

flashlight, batteries, fish_sausage, key_403, ota_keyring, key_stairs4, sheet_1/2/3 ->
kuroda_song, developer, photo_1977, lift_key, fishing_rod, gate_key, hatch_key, keeper_key, cap,
basement_key, wire_cutters, pressure_chart, front_key (+ documents).

### Audio notes

Ambience: rain (corridors, yard), hum (apartments), basement (B1), void (203 mirror). Music: title
(music box), house (sparse; apartments), sad (Kuroda, 203), hunt (chases), dread (walk-bys, the
stalk), ending. Tunes via `G.Audio.tune`: Kuroda's phrase E G A G (E D C), a slow detuned "Happy
Birthday" in 201, the 5 PM chime. New sfx: chirp, chime, creak, collapse, record, water steps.
