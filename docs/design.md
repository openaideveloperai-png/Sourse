# NOBODY HOME — design bible

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

- 1-2 hours, ~30-36 small rooms, 20-25 puzzles (10-15 real deductions + smaller lock/key steps),
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

## Part 2: The game

### Logline

Ten-year-old Haru Aoki wakes up alone in apartment 404 of Hinata Heights on a stormy night. His
mother hasn't come home. Someone knocks with her voice. When the door opens on its own, the
building outside is wrong: every door unlocked, every tenant gone or changed, and a tall
caretaker with a ring of keys walking the corridors, putting everyone "back to bed".

### The twist (reveal in the true ending; seeded from minute 1)

Haru is not ten. He is 82, living in Room 404 of **Hinata Hills Care Residence**, the care home
built where his childhood apartment block once stood. He has dementia; on bad nights he believes
it is 1974 and he is waiting for his mother, who died decades ago. Everything in the game is the
care home seen through his fear:

| What Haru sees | What is real |
| --- | --- |
| The Caretaker: a tall faceless man with jangling keys who chases him | The night nurse, Mr. Sato, trying to get a confused resident safely back to bed. Haru can no longer recognise faces, so the nurse has none |
| "Mom" calling on the phone with advice | His daughter Yui, phoning the night desk |
| The tenants (Mrs. Ota waiting for her husband, the deaf pianist, the boy who wants to play) | Other residents, each lost in their own memory |
| Tama, the stray cat who follows him | The care home's therapy cat |
| Nightlights (save points) | The plug-in night lights in the care home corridors |
| Being caught = the screen goes black, "Lights out" | Being sedated / put back to bed |
| The building's rules on the notice board | Care home rules ("Residents must not leave after 9 PM") |

Planted evidence: mirrors briefly show an old man; a calendar from 1974 next to a 2019 newspaper;
Haru's hands in the bath water reflection are wrinkled; name tags on doors say "AOKI H. (82)";
the "candy" bowl is a pill organiser; the Caretaker always says "Mr. Aoki" (heard as "Aoki...").
The game never says "dementia" until the true ending; bad and normal endings stay ambiguous.

Sensitivity: the reveal is compassionate. The horror is Haru's real fear, never a joke. The true
ending is about being found, not about loss of self.

### Tone

Japanese 1970s public housing (a danchi): concrete open-air corridors in the rain, sliding doors,
tatami, kotatsu, rotary phones, fluorescent tubes that flicker. Small sounds: rain, a fridge hum,
keys. Melancholy more than gore. Blood is rare and meaningful.

### Cast

- **Haru Aoki** (player): in his mind, 10. Striped pajamas, slippers, messy black hair, carries his
  mother's keychain flashlight. Talks to himself to stay brave; dry, a little funny, polite to
  adults. Expressions: neutral, scared, shock, sad, determined, relieved, confused.
- **Old Haru**: the same man at 82. Grey hair, brown cardigan, slippers. Seen only in mirrors and
  the true ending.
- **The Caretaker** (main pursuer): ~1.5x Haru's height, grey work uniform and cap, head bowed so
  the face is in shadow, a huge ring of keys at his belt. When he raises his head the face is a
  smooth blank with no features at all. Signature sound: keys jingling. Signature line: "It's
  late. Back to bed now." He never runs; he never stops. True form: a kind young nurse.
- **Tama**: a scruffy grey stray cat with a torn ear. Joins in Chapter 1, follows Haru, squeezes
  through gaps to fetch things, hisses when the Caretaker is near (an early-warning cue). Taken
  at the midpoint; rescuing her is part of the true ending.
- **Mrs. Ota** (401): tiny old woman in a lavender kimono, waits for her husband's train. Kind,
  forgetful, offers tea. Quest: help her "husband come home".
- **Mr. Kuroda** (301): a former concert pianist who has lost his hearing; plays the same broken
  phrase every night. Quest: give him back his song.
- **Shota** (302): a boy about Haru's age in a baseball cap who only wants someone to play
  hide-and-seek with. Unsettling: he never seems to be where he was.
- **The Party Guests** (201, local threat): mannequin-like figures in paper masks frozen around a
  birthday cake. They move only in the dark.
- **The Hands in the Chute** (laundry, local threat): instant death if ignored warnings.
- **Mom** (Haruko Aoki): only on the phone, in letters and in one memory flashback.
- **Yui**: Haru's daughter, the voice on the phone in the end; seen in the true ending.

### Systems

- **Explore / examine / auto-use items** with specific failure lines.
- **Phones = hints.** Black rotary phones in apartments and the pink payphone in the lobby. If
  Haru dials 404 (from a phone object, choose "Call home"), "Mom" answers with a hint for the
  current goal (`E.goal` text, plus a specific nudge per goal). This is the in-world hint channel.
  In the true ending we learn it was Yui on the night desk line.
- **Nightlights = save points** (warm orange plug-in lights, one per floor and in safe rooms).
- **Retry** from the room entry after any death (engine checkpoint).
- **The Caretaker's chase rules** (taught in Chapter 1): he walks a little slower than Haru;
  he follows through the door you used about 1.5 s later (keys jingle first); chases end when he
  loses you (hide in a closet or under a futon where he didn't see you, or keep moving through
  rooms until the keys fade). **Latch doors:** apartment doors have a chain latch; during a chase,
  pressing Z on the door you just came through latches it and buys ~5 s while he works through his
  keys. Each latch works once per chase. This is our signature twist on the Ao Oni chase.
- **Tama** hisses a few seconds before scripted Caretaker appearances; she also fetches items
  through small gaps (cat-door puzzles).
- **Mirrors** show the real room for a moment (a slightly different layout, a name tag, a digit).
  Used for clues and for the twist.
- **Letters from Mom** (5): optional documents hidden one per floor. Reading all five is one of
  the three true-ending conditions; the menu shows "Letters: n/5" in the notes tab title.

### Endings

1. **"Okaeri" (bad, any time in the prologue):** open the door to the knocking voice. Haru steps
   into the dark; the Caretaker is there. Teaches that the house can kill you. (Retry.)
2. **"Nobody Home" (bad):** at the finale, run out through the lobby doors into the storm. Haru
   runs until the building is gone and the road is empty. Text: "They found him at dawn on the
   river road, asking every car if they had seen his mother."
3. **"Lights Out" (normal):** at the finale, let the Caretaker take your hand without the full
   truth. Haru is put back to bed; the room is the care home for a second, then 404 again. "Tomorrow
   night, the knocking starts again." (The loop continues.)
4. **"Welcome Home" (true):** requires (a) all 5 of Mom's letters read, (b) Tama rescued, (c) the
   three tenants helped (Ota, Kuroda, Shota). At the finale the phone rings; Haru answers; it's
   Yui. He understands. He takes the nurse's hand; the world becomes the care home at sunrise;
   Yui arrives: "Welcome home, Dad." Haru, old, smiling: "I'm home."

The final room tells the player which conditions they are missing via Mom's voice ("You haven't
read all my letters, Haru"; "Where's the cat?") so the true ending is never obscure.

### Map (Hinata Heights)

Five floors, roof and basement. Each floor has an open-air corridor (rain beyond the railing),
a stairwell at the west end and a dead elevator in the middle. Apartments are small single maps.

```
ROOF        water tank, laundry lines, storm                              (finale part 2)
4F  [stair4]==corridor 4F==[elev]  404 HOME  401 Ota  402 empty  403 Tanabe(locked)
3F  [stair3]==corridor 3F==[elev]  301 Kuroda  302 Shota  303 darkroom  laundry room
2F  [stair2]==corridor 2F==[elev]  201 party  202 renovation  203 Haru's old 1974 home?(see ch3)
1F  [stair1]==lobby==office==corridor 1F  bike room  garbage room  -> courtyard (playground)
B1  boiler room, storage cages, the Caretaker's room (key board)
```

Rooms (target 34): home_bed, home_main (kitchen/living), home_bath, c4 (corridor), stair4, a401,
a402, a403, c3, stair3, a301, a302, a303, laundry, c2, stair2, a201, a202, a203, c1 (lobby +
corridor), office, bikes, garbage, yard (courtyard), b1_hall, boiler, storage, keeper (Caretaker's
room), roof, elevator, reality_404 (true ending), plus the prologue/flashback "memory_1974".

### Chapter flow and puzzles

Times are first-play estimates. P = puzzle (real deduction), S = smaller step.

#### Prologue: 11:58 PM (8 min) — home_bed, home_main, home_bath

- Wake in bed: thunder, rain. Goal "Find Mom." Fridge note from Mom: "Dinner's in the fridge.
  Lock the door. Don't open it for anyone. Home by midnight." (clue + mood)
- S1 Flashlight: Mom's keychain flashlight is dead. Batteries: the wall clock in the living room
  (take them; the clock stops at 11:59 — seed for later). Flashlight raises light radius.
- S2 The bathroom mirror: first glimpse (a grey-haired face for 0.2 s; Haru: "...Huh?"). Fake-out
  scare 1 (nothing happens after).
- Midnight: knocking. Mom's voice: "Haru, it's Mom. I'm home. Open the door." Choice:
  Open (ending 1 "Okaeri", instant) / Don't open / Look through the peephole (sees the corridor
  empty... then an eye). Not opening: knocking stops; the phone rings; "Mom" says "Don't open the
  door. Not for anyone. Not even for me. I'm coming." Line goes dead. Lights die. The front door
  unlocks itself and swings open.
- Goal "Find Mom. Get out of the building."

#### Chapter 1: The Fourth Floor (18 min) — c4, a401, a402, a403, stair4, elevator

Hub: corridor 4F. Stairwell door is locked with a padlock and a chain ("Residents' safety: no
stairs after 11 PM"). Elevator: dead, "Out of order". 401 and 402 open; 403 locked.

- Tama: a grey cat in the corridor, meowing at 402. Follows Haru after he feeds her (S3: fish
  sausage from his fridge → becomes follower).
- 402 (empty unit): a closet (first hiding spot), a hole in the wall too small for Haru.
  **P1 (cat fetch):** Tama goes through the hole into 403 and brings back the 403 spare key
  (Haru: "Good girl!"). Teaches the cat mechanic.
- 401 Mrs. Ota: she serves tea for two and waits for her husband. Three clocks in her flat show
  different times. **P2 (clocks):** her husband's last postcard says "My train arrives at 6:40,
  I'll be home before the kettle boils." Set the main clock to 6:40 (clock UI); her kettle whistles;
  she thanks Haru and gives **the stairwell padlock code** written on her husband's matchbook?
  Instead: she gives **her husband's key ring**, which holds a small brass key (403's mailbox? no)
  → the key opens the cabinet in 403. (Helped tenant 1 flag.)
- 403 Tanabe (kids lived here): crayon drawings on the wall, a toy safe. **P3 (code from drawings):**
  four drawings each show a number of things (3 cats, 1 sun, 4 people, 7 stars) and are numbered
  1-4 in the corner; the toy safe needs a 4-digit code → 3147. Inside: **bolt cutters**?
  Children don't keep bolt cutters... Inside: **the caretaker's master key "4"** (a key tagged
  "4F STAIRS") the kids stole as a prank (note: "we took the scary man's key hehe").
- First Caretaker appearance (fake-out): when Haru picks up the key, footsteps and keys pass by in
  the corridor (seen through the frosted window), and stop outside... then leave.
- Mom's Letter 1 (403, inside a picture book): "To Haru, on your 10th birthday."
- Stairwell: use the key → **first chase**: the Caretaker steps out of the elevator (it "works" for
  him). Escape down the stairs to 3F (chase ends when he loses you or after the first floor change
  + 12 s). Teaches: he follows through doors, he is slightly slower, hiding works.
- Save nightlight: in the corridor near 404.

#### Chapter 2: The Third Floor (22 min) — c3, a301, a302, a303, laundry, stair3

Stairwell 3F → down is blocked: the stairwell to 2F is buried under stacked furniture ("someone
moved every chair in the building here"). Need another way down: the laundry room's chute? the
elevator? Goal: "Find another way down."

- 301 Mr. Kuroda: an old man at a piano playing the same 4 notes and stopping. He can't hear.
  **P4 (piano):** find his song: the sheet music is torn into 3 pieces (one in 301's waste basket,
  one in the laundry room's lint trap, one in 303's darkroom developing tray). Assemble in the
  menu (auto-combine when you have all three → "Kuroda's Song"). Play it (7 notes, piano UI):
  E G A G E D C? Clue on the sheet. He finishes the song, cries, gives Haru **the elevator
  maintenance key** ("I used to fix the lift for the caretaker"). (Helped tenant 2.)
- 302 Shota: a boy in a cap wants to play hide-and-seek. **P5 (seek):** he hides in one of five
  places in 302/c3; clue: "I always hide where it's warm" → the kotatsu (only warm thing). Then
  he wants to hide again: "Where the sun goes down" → the west closet (stairwell side; a compass on
  the corridor map board shows W). Third time: "Where you can see yourself" → behind the mirror
  stand. Each round he gives a piece of info; on winning he gives **a red marble** (needed later
  for the courtyard) and says "The scary man keeps everyone's keys in the basement." (Helped
  tenant 3 begins; completes in Chapter 3 when you return his cap from the courtyard.)
  Creepy beat: after round 2, Shota is found in a place you already searched, standing still,
  facing the wall.
- 303 (darkroom photographer): red safelight, photos hanging. **P6 (darkroom):** turn on the red
  safelight (switch), develop the photo in the tray (use developer bottle from the bathroom shelf):
  reveals a group photo of the building's tenants in 1974 with one face scratched out on each...
  and on the back a number "the lift code 5-1-B" (elevator panel needs a 3-step sequence).
  Also: a sheet-music piece in the tray. A newspaper on the table dated 2019 (seed).
- Laundry room: washing machines, a laundry chute. **Local threat: the Hands.** Examine the chute
  once: "Something is breathing down there." Twice: "Don't." Third: instant death (hands pull
  Haru in). Lint trap holds a sheet-music piece. Laundry baskets = hiding spot.
- Mom's Letter 2: in the laundry, a clothes pocket ("Haru, I'm sorry I'm never home at night...").
- Elevator: use the maintenance key on the elevator panel in c3 → the doors open, the car is dark;
  **P7 (lift sequence):** the panel buttons 1-5, B, open/close; input the order from the photo
  (5, 1, B) using the order UI → the lift drops to 2F (not B; it stops between floors: "2F" doors
  pried open). **Chase 2**: the lights in the car flicker; the Caretaker is inside the lift when
  the lights come back. Run out into 2F.
- Save nightlight: laundry room.

#### Chapter 3: The Second Floor and the Courtyard (25 min) — c2, a201, a202, a203, stair2, c1, yard

Midpoint. The 2F corridor is flooded ankle-deep (sound of water). Goal: "Get to the ground floor."
The 2F stairwell down is open but the 1F door at the bottom is locked from the lobby side.

- 201 the birthday party: paper-masked guests around a cake with 11 candles, all still.
  **Lights-out threat:** whenever the room's light flickers, the guests move one step toward Haru;
  they kill if they touch him. **P8 (candles):** the birthday card says "Happy 11th birthday,
  Mari! Blow out the candles in the order you were born" — the photos on the wall show the family
  children with birth years; candles are labelled by name. Blow them out (interact) in age order;
  wrong order = lights flicker (guests move). When done, the room goes dark for good and the guests
  are gone; the cake hides **the courtyard gate key**. Escape the room (short chase by guests).
- 202 renovation: bare concrete, a hole in the floor down into the 1F office (too far to drop:
  "I'd break my legs"). **P9 (rope):** tie the bedsheet (from a203) to the radiator pipe → climb
  down to the office... but the office is locked from inside and dark: this is the way *back up*
  later. Instead use it as the route: climbing down lands in the 1F office. Gate key + office.
- 203: "the Aoki home, 1974" — a door with Haru's own family name plate, AOKI. Inside: a perfect
  copy of 404 but younger, warmer: the memory flashback. **Memory scene:** Haru sees his young
  mother (a translucent figure) at the kitchen counter making his birthday dinner; she doesn't
  hear him. Mom's Letter 3 is on her table. A bedsheet in the closet (for P9). The mirror here
  shows old Haru clearly for 1 s (he screams). Tama refuses to enter 203.
- 1F office (via the rope): the Caretaker's desk: a clipboard of "residents" with room numbers
  and ages (names smudged except "AOKI H... 82"?). Too early for the full reveal: the age is
  smudged, only "AOKI H." legible and "404 - wanders at night". A key cabinet (locked, needs the
  key board from B1). The office door to the lobby unlocks from inside.
- Lobby: mailboxes, the notice board ("RULES: 1. Residents must not leave after 9 PM. 2. Answer
  the night staff. 3. Lights out at 10."), the front doors chained (big padlock "B1 KEY BOARD"),
  the pink payphone (hint phone). The courtyard door: courtyard gate key.
- Courtyard (rain, swings, slide, sandbox): **P10 (sandbox):** Shota's cap is in the sandbox;
  the sandbox is fenced (child gate) — Tama squeezes through and is grabbed: **Tama is taken**
  (midpoint loss): the Caretaker's huge hand comes out of the dark, the cat yowls, gone. Haru:
  "TAMA!" Keys jingling away into the basement door. Goal: "Get Tama back."
  The cap is found (return it to Shota later to finish his quest: optional backtrack via stairs,
  now open from the lobby side). The red marble from Shota goes into the slide's "marble run"
  toy (P11: drop the marble at the top of the slide; it rolls into the drain and knocks loose the
  **basement door key** hanging inside the drain grate). Simple but satisfying.
- Mom's Letter 4: under the swing seat, wrapped in plastic.
- **Chase 3** when leaving the courtyard: the Caretaker blocks the lobby; loop around the slide.
- Save nightlight: lobby.

#### Chapter 4: The Basement (20 min) — b1_hall, boiler, storage, keeper

Dark, low ceiling, pipes, dripping. The Caretaker's territory: random-feeling but scripted ambush
when you take things. Goal: "Find Tama."

- Boiler room: **P12 (valves):** the boiler's three valves must match the pressure chart pinned
  in the storage cage (High-Low-Mid) to stop the steam blocking the corridor to the keeper's room.
  Wrong combination = steam burst (no death, just a shove back and a scare).
- Storage cages: numbered cages per apartment; 404's cage holds Haru's childhood box: a baseball
  glove, a photo of Mom, and **Mom's Letter 5** (the last one, written in an older hand: it's from
  1989?—"I'm in the hospital now, Haru..."). Cage 301 holds the pressure chart. **P13 (cage
  padlock):** cage 404 is locked with a 4-digit lock: the birthday (from Letter 1: "you were born
  on the 9th of December") plus... code 1209.
- The Caretaker's room (keeper): a wall of hooks with every key in the building, Tama in a pet
  carrier on the desk, and a bed with restraint-like straps (dread; in reality a care bed rail).
  **P14 (key board):** the front-door key is on the board but the board is arranged by room
  number and the "FRONT" hook is empty; the matching tag reads "given to 404". Haru has had it all
  along? No: the key board is a slider puzzle (the hooks are a sliding tile picture of the
  building) — solve to open the board's lock box with the **front door key**. Then free Tama
  (Tama flag). **Chase 4 (the long one):** the Caretaker returns while you're in his room: escape
  route loops through the boiler (latch the boiler door) and back up the stairs to the lobby.
- Optional: return Shota's cap on 3F before or after (stairs now open from 1F upward through the
  lobby stair door).

#### Finale: Lights Out (10 min) — lobby, roof?, reality_404

- Lobby: use the front door key on the chained doors. Before the doors open, the payphone rings.
  Choice: Answer / Leave.
  - Leave → ending 2 "Nobody Home".
  - Answer → "Mom": if conditions are missing, the voice says which ("Haru... you didn't read my
    last letter" / "Where's that cat of yours?" / "Did you help the neighbours?") and lets you go
    back (the doors stay chained until you choose to leave or come back). If all conditions are
    met, the voice changes: "Dad? It's Yui. Dad, it's 2019. Grandma isn't coming. But I am. I'll
    be there in the morning. Please go back to your room, okay? Mr. Sato will help you."
    Haru looks at his hands. The Caretaker steps out of the dark and slowly raises his head; for
    the first time he has a face: a young man, tired, kind. "Mr. Aoki. Let's get you back to bed."
    Choice: Take his hand / Run.
      - Take his hand + conditions met → ending 4 "Welcome Home".
      - Run → ending 2.
  - If the player never answers and just waits, the Caretaker arrives: take his hand or run:
    take hand without conditions → ending 3 "Lights Out".
- Ending 4 plays out in reality_404 at sunrise: an old man in bed, the grey cat on the blanket, Yui
  entering with a bag of oranges. Old Haru's portrait (new set). "Welcome home, Dad." "...I'm home."

### Chases (6)

1. Ch1 stairwell: Caretaker from the elevator; teach following and hiding; 12 s after a floor change.
2. Ch2 lift: he is in the car; escape into 2F corridor, latch tutorial on 201's door.
3. Ch3 party guests (lights-out statues in 201) — local threat, not the Caretaker.
4. Ch3 courtyard: loop around the slide, hide in the tube slide.
5. Ch4 the keeper's room: long chase B1 → lobby, latch the boiler room door.
6. Finale: optional (if you run).

Random ambushes: none early. From Chapter 3, when the player returns to an already-solved room
with no active chase and at least 4 minutes since the last chase, there is a 40% chance the keys
jingle in the corridor and he passes by (a walk-by: only dangerous if you stand in his path).

### Scares (spacing ~ every 6-10 minutes)

Mirror flash (prologue, fake-out); knocking voice (prologue); keys passing behind frosted glass
(Ch1); Shota facing the wall (Ch2); lift lights (Ch2); 203 mirror scream (Ch3); party guests
(Ch3); Tama taken (Ch3); steam burst (Ch4); the Caretaker raising his head (finale).
Jump-scare picture (full screen) only for being caught and the 203 mirror.

### Documents (13)

Mom's notes and letters (fridge note + Letters 1-5), Mr. Ota's postcard, the 403 kids' note, the
Tanabe drawings, Kuroda's song, the 2019 newspaper, the notice board rules, the office clipboard,
the pressure chart. Each 40-120 words. Letters escalate from a busy single mother (1974) to an
old woman in hospital (1989), so the timeline quietly stops adding up.

### Items

flashlight, batteries, fish_sausage, key_403, ota_keyring (small brass key), key_stairs4,
sheet_1/2/3 → kuroda_song, developer, photo_lift, lift_key, marble, bedsheet, gate_key, cap,
basement_key, pressure_chart, front_key, plus letters (notes).

### Puzzle dependency chart (critical path)

```
start → flashlight(batteries) → [knock: don't open] → door opens
c4: fish_sausage(home fridge) → Tama follows
402: Tama fetch → key_403
401: postcard(401 dresser) + clock 6:40 → ota_keyring(brass key)       [tenant 1]
403: key_403 opens door; ota_keyring opens cabinet → drawings code 3147 → key_stairs4
stair4: key_stairs4 → CHASE 1 → 3F
3F: stair down blocked → need lift
   sheet_1 (301 basket), sheet_2 (laundry lint), sheet_3 (303 tray, needs developer from laundry shelf + safelight)
   kuroda_song → piano → lift_key                                      [tenant 2]
   303 photo (same tray) → lift order 5,1,B
   lift_key on c3 panel → order puzzle → CHASE 2 → 2F
2F: 201 candles (photos with years) → gate_key ; CHASE 3 (guests)
    203 → bedsheet ; 202 rope (bedsheet) → 1F office → lobby (office door)
1F: gate_key → yard → Tama taken ; marble (from Shota, 3F hide&seek) in slide → basement_key
    (Shota's marble requires P5 on 3F: on the critical path, so P5 is required)
B1: storage: cage 404 code 1209 (Letter 1 birthday) → Letter 5 ; cage 301 → pressure_chart
    boiler valves (chart) → keeper room → key board slider → front_key ; free Tama ; CHASE 4
Finale: front_key on lobby doors → phone → endings
Optional for true ending: Letters 1-5, Tama (critical), tenants Ota (critical), Kuroda (critical),
Shota (cap return: optional backtrack to 3F).
```

Branching: in Chapter 1 the player can do 401 and 402/403 in either order; in Chapter 2 the three
sheet pieces and Shota's game can be done in any order; in Chapter 3, 201 and 203/202 in either
order. That keeps 2-3 open threads at all times.

### Art list (new)

Tiles: tatami floor, concrete corridor floor (wet variant), outdoor railing edge with rain beyond,
grey concrete wall, lobby tile, basement concrete with puddles; reuse wood, tile_white, carpet.

Props: genkan step + shoes, shoe cabinet, fusuma (sliding door, closed/open), kotatsu, futon
(hide spot variant), chabudai low table, zabuton cushion, butsudan, CRT TV (static animation),
rotary phone, kerosene heater, wall calendar, nightlight (save, animated glow), apartment door
(steel, with number plate, open/closed), elevator doors (closed/open/dark), elevator panel,
stairwell door, notice board, mailboxes, payphone (pink), washing machines, laundry chute,
laundry basket (hide), darkroom tray, safelight (red light), photos on a line, birthday table +
cake + candles (lit/out), paper-masked guests (2 frames), concrete hole in floor, radiator,
swing, slide (tube), sandbox, rain puddles, boiler with 3 valves, pipes, storage cage (locked/open),
key board wall, pet carrier, care bed, hospital-style bed (reality), window with sunrise.

Icons: one per item.

Characters: haru (4 dirs, 3 frames + scared/sit/fall poses), old_haru (4 dirs + bed pose), caretaker
(4 dirs, tall, face-down; plus `scare_caretaker` blank-face close-up and a "face revealed"
portrait), nurse (true form), tama (cat, 4 dirs walk + sit), mrs_ota, kuroda (at the piano, 2 frames),
shota (4 dirs), party_guest (masked, 2 poses), yui, young_mom (translucent memory).

Portraits: Haru (7 expressions), Old Haru (3), Mrs. Ota (2), Kuroda (2), Shota (3), Mom-voice (none,
uses a phone icon), Yui (2), Nurse Sato (2).

### Audio plan

Ambience: rain (corridors, courtyard), hum (apartments: fridge), basement drips, void silence in 203.
Music: title (music box), house (sparse, apartments), chase, sad (203 memory, Kuroda), ending.
Key SFX: keys jingle (new), knock, phone ring (new), cat meow/hiss (new), kettle whistle (new),
door chain latch (new), elevator ding (new), rain, thunder (new).
