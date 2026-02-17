# Rearchitecture: Setlist Model + Generational Decay

## Core Change
Replace per-season verse integrity drift with a **setlist + generational transmission** model.

### What Dies
- `DRIFT_PER_SEASON` (0.08/season constant decay)
- Per-season integrity loss for all verses
- The `sing` action as "practice to slow decay"
- Seasonal verse deletion from drift

### What Lives
- Verse integrity as a 0.0-1.0 float (still meaningful — it's how WELL you know your version)
- `GARBLE_THRESHOLD` (0.3) and `LOST_THRESHOLD` (0.1)
- Blood memory, blood affinity, song sinking
- Spirits, ages, bridges, tree, everything else
- Teaching (but reframed)

## New Model

### 1. The Setlist
- `state.setlist` — ordered array of verse IDs. This is what the community sings each season.
- **Setlist capacity:** `Math.floor(Math.log2(n) * 2) + 1` where n = number of non-youth people
  - 1 person: 1 slot
  - 2 people: 3 slots
  - 4 people: 5 slots
  - 8 people: 7 slots
  - 16 people: 9 slots
- Only verses that someone in the band knows (at >= LOST_THRESHOLD) can be on the setlist
- **Automatic priority:** Elders' best-known songs fill the setlist by default (sorted by max integrity across all people). Player can override with `setlist` command.

### 2. Verses Don't Decay in the Holder
- Once you learn a song at X% integrity, you know it at X% until you die.
- No per-season drift. Your version is YOUR version.
- The elder who learned Cave Song at 85% knows it at 85% for 20 seasons.

### 3. Legitimate Peripheral Participation (Absorption)
- Each season, youth **absorb** songs from the setlist just by being present.
- Absorption rate depends on:
  - **Position in setlist:** early songs absorb better (opening verse ~90%, last verse ~50%)
  - **Teacher quality:** best integrity among adults/elders who know the song
  - **Blood affinity:** songs your blood eases absorb faster
  - **Repetition:** songs that have been on the setlist for multiple consecutive seasons absorb better
- Formula: `absorption = teacher_integrity * position_factor * (1 + blood_bonus * 0.5)`
- Youth don't get the full teacher_integrity — they get `absorption` as their starting integrity
- This IS the generational decay. Teacher knows it at 85%, youth absorbs at ~75%.

### 4. Generational Loss IS the Only Decay
- Each generation: ~5-15% loss depending on position, blood, repetition
- A song maintained at position 1 for 10 generations: 90%^10 = 35% — still known but garbled
- A song maintained at position 1 with blood affinity: 95%^10 = 60% — survives much better
- Songs at the bottom of the setlist decay faster generationally
- Songs NOT on the setlist: not transmitted AT ALL. One generation of silence = lost.

### 5. Setlist Position Effects
- Position 1 (opening): 0.95 transmission factor. Everyone hears this. Even the babies.
- Position 2-3: 0.85 factor. The main body of the night's singing.
- Position 4-5: 0.75 factor. Getting late. Youth are drowsy.
- Position 6+: 0.60 factor. Deep night. Only the dedicated are still listening.
- This creates real strategic tension: you can't put everything first.

### 6. What Replaces the `sing` Action
- **`setlist [verse1] [verse2] ...`** — arrange the setlist. Order matters.
- **`prioritize <verse>`** — move a verse to position 1
- **`teach <elder> <youth> <verse>`** — focused 1-on-1 teaching. Still exists but is now SPECIAL — it's the apprenticeship, the deliberate transmission outside the communal singing. Gives a bonus to that youth's absorption of that specific song.
- **`sing`** with no args — could show the current setlist performance, who's singing, who's listening

### 7. Mixed Song Discovery (Adjacency)
- When two prerequisite songs are adjacent on the setlist, there's a chance the mixed song "emerges"
- e.g., `setlist: [cave_song, ember]` → chance to discover `fire_cave`
- This replaces the old prereq system partially — you still need prereqs, but adjacency on the setlist is how you FIND the combination
- Makes arrangement a creative/discovery mechanic, not just optimization

### 8. What Changes in Existing Systems

**Birth/Growth:**
- Youth accumulate verse knowledge each season from the setlist (absorption)
- When youth become adult (age 5), their absorbed versions are locked in
- Adults don't gain from the setlist (they already have their versions)
- Adults/elders CAN learn new songs through focused teaching or mixed song discovery

**Blood Memory:**
- Still works: blood spontaneously remembers garbled fragments
- But now the remembered fragment is permanent (doesn't decay)
- Just starts garbled (0.29) as before

**Night Spirit:**
- Night with stars: boosts absorption rate for youth (better learning during long dark)
- Night without stars: reduces setlist capacity (can't remember the order without the sky)

**Dog Mechanic:**
- Instead of extra drift, the dog's wolf-perimeter reduces the EFFECTIVENESS of old-blood people as teachers
- Their songs are still in them, but they can't concentrate to teach well
- Or: the dog disrupts the singing circle — reduces setlist capacity when allergic people are present

**Tree Carving:**
- Carved songs are OUTSIDE the setlist. They don't need singing time. They're preserved in wood.
- But they also don't benefit from arrangement/adjacency
- Carving removes a song from the living tradition and puts it in the dead one

**Spirits:**
- Fire danger still scales with garbled fire knowledge
- Night now has the dual nature (dangerous + singing enhancer)
- Death teaching still passes songs at 70% of elder's version

### 9. CLI Commands (for now)

```
node song.js                    Advance one season
node song.js status             Show state (includes setlist)
node song.js setlist            Show current setlist with positions
node song.js setlist <v1> <v2>  Set the order (anything not listed drops off)
node song.js prioritize <v>     Move verse to position 1
node song.js teach <e> <y> <v>  Focused apprenticeship (bonus absorption)
node song.js carve <v>          Carve on tree (removes from setlist, preserves forever)
node song.js fell               Fell the tree
node song.js welcome            Accept stranger
node song.js ignore             Turn away stranger
node song.js cross <age>        Bridge to another age
node song.js blood <person>     Show blood reading
```

### 10. Data Model Changes

```javascript
// State changes:
state.setlist = ['bear', 'cave_song', 'ember', 'heartbeat'];  // ordered array
state.setlistHistory = { 'bear': 3, 'cave_song': 1 };  // consecutive seasons on setlist (for repetition bonus)

// Person changes:
person.verses = { bear: 0.85, cave_song: 0.72 };  // still the same, but NO LONGER DRIFTS
// integrity represents "how well this person knows their version"
// set at absorption time for youth, never changes after

// Remove:
// DRIFT_PER_SEASON usage in advanceSeason
// All per-season verse[v] -= drift code
// PRACTICE_BONUS
```

## Migration Path
1. Remove all per-season drift code
2. Add setlist to state, auto-populate from elders' best songs
3. Add absorption system for youth (replaces automatic teaching)
4. Change `sing` action to `setlist` management
5. Add position factors
6. Add adjacency discovery for mixed songs
7. Update night/dog/death mechanics to work with new model
8. Update display to show setlist prominently
