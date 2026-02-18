#!/usr/bin/env node
// THE SONG — a game about oral tradition, the world tree, and the price of knowledge
// One execution = one season. State persists in state.json.
// Usage: node song.js [action] [args...]

const fs = require('fs');
const path = require('path');
const STATE_FILE = path.join(__dirname, 'state.json');

// ── The Verses ──────────────────────────────────────────────────────
// Each verse is a piece of knowledge. They have names, not numbers.
// They belong to a tradition — a family of related knowledge.
// Some require other verses to learn (prerequisites).

// ── The Peoples ─────────────────────────────────────────────────────
// Not Tolkien's invention — what Tolkien was remembering.
// Each people has their own song tradition. When peoples meet, songs cross.
// Some songs are so old your throat can barely shape them.

const PEOPLES = {
  bear:     { name: 'Bear',     desc: 'Ursus spelaeus — the cave bear, the dreaming one, the first singer',
              trait: 'Not songs. Older than songs. Rhythms of hibernation, den, salmon, and return.' },
  troll:    { name: 'Troll',    desc: 'Homo erectus — the ancient ones, turned to stone by time',
              trait: 'Songs of deep earth. The oldest knowledge. Wordless, rhythmic, felt in bone.' },
  orc:      { name: 'Orc',      desc: 'Homo erectus — the same blood as trolls, but feared instead of revered',
              trait: 'The same deep blood. The same stone patience. But the later ages forgot the name "troll" and gave them this one instead.' },
  dwarf:    { name: 'Dwarf',    desc: 'Neanderthal — cave dwellers, master shapers of stone, spirit-crossers',
              trait: 'Songs of craft and cave. Their hands remember what their tongues forgot. Shaman blood runs strong.' },
  elf:      { name: 'Elf',      desc: 'Denisovan — the hidden people, who left almost no trace, spirit-crossers',
              trait: 'Songs of high places and thin air. Ethereal. Hard to hold in memory. Shaman blood runs strong.' },
  halfling: { name: 'Halfling', desc: 'Homo floresiensis — the little people of the islands',
              trait: 'Songs of small spaces and abundance. How to live large in a tiny world.' },
  human:    { name: 'Human',    desc: 'Homo sapiens — the newcomers, the great singers',
              trait: 'Songs of change. They learn fast but forget fast. They mix everything.' },
  dog:      { name: 'Dog',      desc: 'Canis lupus familiaris — the wolf who came to the fire. The first friend.',
              trait: 'Not a species you play. A species that plays you. The dog chose you 15,000 years ago and has been rewriting your blood ever since.' },
  yeast:    { name: 'Yeast',    desc: 'Saccharomyces cerevisiae — the invisible one. The one that was always there.',
              trait: 'Not a species you play. A species that plays your grain. You won\'t see it for 10,000 years but you\'ll sing to it every baking day.' },
};

const VERSES = {

  // ═══════════════════════════════════════════════════════════════════
  // BEAR SONGS — Ursus spelaeus (oldest of all, pre-hominin)
  // Not songs at all. Patterns older than language, older than hands.
  // The rhythm of hibernation. The memory of dens. The salmon dreaming.
  // You can only play this age if you've earned it.
  // ═══════════════════════════════════════════════════════════════════
  den_memory: { tradition: 'bear', people: 'bear', name: 'Den Memory', prereqs: [], difficulty: 1,
                desc: 'The cave remembers you. You remember the cave. This is the first knowledge.' },
  long_sleep: { tradition: 'bear', people: 'bear', name: 'The Long Sleep', prereqs: ['den_memory'], difficulty: 2,
                desc: 'How to slow your heart until the ice passes. How to dream for months. How to wake.' },
  salmon_run: { tradition: 'bear', people: 'bear', name: 'The Salmon Run', prereqs: ['den_memory'], difficulty: 2,
                desc: 'The river gives. Not always. You must know when. The bears taught time before anyone.' },
  cub_call:   { tradition: 'bear', people: 'bear', name: 'The Cub Call', prereqs: [], difficulty: 1,
                desc: 'How the mother calls the young. The first teaching. Before words, before rhythm.' },
  root_dig:   { tradition: 'bear', people: 'bear', name: 'Root Digging', prereqs: ['den_memory'], difficulty: 2,
                desc: 'What is under the earth is food. The bears knew this before any hominid.' },
  star_bear:  { tradition: 'bear', people: 'bear', name: 'The Star Bear', prereqs: ['long_sleep', 'salmon_run'], difficulty: 3,
                desc: 'The great bear in the sky. She hibernates below the horizon and returns. The oldest calendar.' },
  spirit_mark:{ tradition: 'bear', people: 'bear', name: 'Spirit Marking', prereqs: ['den_memory', 'cub_call'], difficulty: 3,
                desc: 'Claw marks on the cave wall. Not art. Not writing. Presence. I was here. I will return.' },

  // ═══════════════════════════════════════════════════════════════════
  // TROLL SONGS — Homo erectus (oldest, most alien)
  // These are barely songs. Rhythms. Vibrations. Pre-linguistic.
  // ═══════════════════════════════════════════════════════════════════
  heartbeat:  { tradition: 'troll', people: 'troll', name: 'The Heartbeat', prereqs: [], difficulty: 1,
                desc: 'The first rhythm. Before words, before fire. The beat that means: we are here.' },
  stone_sleep:{ tradition: 'troll', people: 'troll', name: 'Stone Sleep', prereqs: ['heartbeat'], difficulty: 2,
                desc: 'How to endure. How to wait a million years. The trolls turned to stone because they knew how.' },
  deep_fire:  { tradition: 'troll', people: 'troll', name: 'The Deep Fire', prereqs: ['heartbeat'], difficulty: 2,
                desc: 'Not flint-spark fire. The fire that was already there, in the earth, since before anyone.' },
  old_track:  { tradition: 'troll', people: 'troll', name: 'The Old Track', prereqs: ['heartbeat'], difficulty: 2,
                desc: 'How to follow the paths that were worn before anyone remembers. The game trails older than species.' },

  // ═══════════════════════════════════════════════════════════════════
  // DWARF SONGS — Neanderthal (craft, cave, earth, bears)
  // Rich and precise. Technical. Songs you sing while working with your hands.
  // ═══════════════════════════════════════════════════════════════════
  flake:      { tradition: 'dwarf', people: 'dwarf', name: 'Flake Knapping', prereqs: [], difficulty: 1,
                desc: 'How to break stone with purpose' },
  blade:      { tradition: 'dwarf', people: 'dwarf', name: 'Blade Singing', prereqs: ['flake'], difficulty: 2,
                desc: 'How to make stone sing a sharp edge — the Mousterian tradition, 300,000 years old' },
  ember:      { tradition: 'dwarf', people: 'dwarf', name: 'Ember Keeping', prereqs: [], difficulty: 1,
                desc: 'How to carry fire from camp to camp. A dwarf art.' },
  cave_song:  { tradition: 'dwarf', people: 'dwarf', name: 'The Cave Song', prereqs: ['ember'], difficulty: 2,
                desc: 'How to read a cave — where it breathes, where it sleeps, where the bears go' },
  bear:       { tradition: 'dwarf', people: 'dwarf', name: 'The Bear Song', prereqs: ['cave_song', 'old_track'], difficulty: 3,
                desc: 'How to greet the one who sleeps in earth. The dwarves knew the bears first.' },
  ochre:      { tradition: 'dwarf', people: 'dwarf', name: 'The Ochre Song', prereqs: ['cave_song'], difficulty: 2,
                desc: 'How to mark the dead with red earth. The first art. The first grief.' },
  wolf_song:  { tradition: 'dwarf', people: 'dwarf', name: 'The Wolf Song', prereqs: ['cave_song', 'old_track'], difficulty: 3,
                desc: 'How to greet the pack. The dwarves shared the cave mouth with wolves for 200,000 years. They hunted together.' },
  burial:     { tradition: 'dwarf', people: 'dwarf', name: 'The Burial Song', prereqs: ['ochre', 'bear'], difficulty: 3,
                desc: 'How to return the dead to the earth with flowers. Yes, they did this.' },

  // ═══════════════════════════════════════════════════════════════════
  // ELF SONGS — Denisovan (high altitude, thin air, nearly vanished)
  // Haunting. You can barely remember them after hearing. Like a dream.
  // ═══════════════════════════════════════════════════════════════════
  thin_air:   { tradition: 'elf', people: 'elf', name: 'The Thin Air Song', prereqs: [], difficulty: 1,
                desc: 'How to breathe where others cannot. The Denisovans gave us the gene for high altitude.' },
  far_sight:  { tradition: 'elf', people: 'elf', name: 'Far Sight', prereqs: ['thin_air'], difficulty: 2,
                desc: 'How to see what is far away and long ago. The view from the roof of the world.' },
  ghost_walk: { tradition: 'elf', people: 'elf', name: 'The Ghost Walk', prereqs: ['thin_air'], difficulty: 2,
                desc: 'How to pass through a place and leave almost no trace. The Denisovan way.' },
  jade:       { tradition: 'elf', people: 'elf', name: 'The Jade Song', prereqs: ['far_sight', 'flake'], difficulty: 3,
                desc: 'How to shape the green stone. An art that outlasts the shaper by eons.' },
  loom:       { tradition: 'elf', people: 'elf', name: 'The Loom Song', prereqs: ['ghost_walk'], difficulty: 3,
                desc: 'How to weave thread. A Denisovan bracelet was found with a needle hole drilled in it.' },

  // ═══════════════════════════════════════════════════════════════════
  // HALFLING SONGS — Homo floresiensis (island, small, resourceful)
  // Warm and practical. Songs about making do. Cozy and clever.
  // ═══════════════════════════════════════════════════════════════════
  island:     { tradition: 'halfling', people: 'halfling', name: 'The Island Song', prereqs: [], difficulty: 1,
                desc: 'How to know your whole world. When the world is small, you know it deeply.' },
  small_hunt: { tradition: 'halfling', people: 'halfling', name: 'The Small Hunt', prereqs: ['island'], difficulty: 2,
                desc: 'How to hunt stegodon with tools made for smaller hands. Cleverness over strength.' },
  tide:       { tradition: 'halfling', people: 'halfling', name: 'The Tide Song', prereqs: ['island'], difficulty: 2,
                desc: 'How to read the water. When it gives and when it takes.' },
  feast:      { tradition: 'halfling', people: 'halfling', name: 'The Feast Song', prereqs: ['small_hunt', 'tide'], difficulty: 3,
                desc: 'How to turn scarcity into celebration. The halfling art of enough.' },
  shelter:    { tradition: 'halfling', people: 'halfling', name: 'The Shelter Song', prereqs: ['island'], difficulty: 2,
                desc: 'How to make warmth from very little. A small fire in a good spot.' },

  // ═══════════════════════════════════════════════════════════════════
  // HUMAN SONGS — Homo sapiens (mixing, change, language, fire, sky)
  // These are the newest songs. They learn fast. They change fast.
  // ═══════════════════════════════════════════════════════════════════
  spark:      { tradition: 'human', people: 'human', name: 'Spark Striking', prereqs: ['ember'], difficulty: 2,
                desc: 'How to wake fire from stone. The dwarves kept embers — humans learned to start over.' },
  lullaby:    { tradition: 'human', people: 'human', name: 'The First Lullaby', prereqs: [], difficulty: 1,
                desc: 'How to teach a child to listen. The beginning of teaching.' },
  elder_song: { tradition: 'human', people: 'human', name: 'The Elder Song', prereqs: ['lullaby'], difficulty: 2,
                desc: 'How to remember what your grandmother sang' },
  polestar:   { tradition: 'human', people: 'human', name: 'The Nail of the Sky', prereqs: [], difficulty: 1,
                desc: 'The star that does not move. Humans looked up and made it mean something.' },
  seasons:    { tradition: 'human', people: 'human', name: 'The Turning Song', prereqs: ['polestar'], difficulty: 2,
                desc: 'How the sky tells you when to move' },
  root:       { tradition: 'human', people: 'human', name: 'Root Finding', prereqs: [], difficulty: 1,
                desc: 'How to eat what the ground offers' },
  track:      { tradition: 'human', people: 'human', name: 'Track Reading', prereqs: [], difficulty: 1,
                desc: 'How to follow what you cannot see' },
  herd:       { tradition: 'human', people: 'human', name: 'Herd Following', prereqs: ['track', 'seasons'], difficulty: 2,
                desc: 'How to walk with the reindeer' },
  tree_song:  { tradition: 'human', people: 'human', name: 'The Carving Song', prereqs: ['elder_song', 'blade'], difficulty: 3,
                desc: 'How to fix a song in wood so it outlasts the singer' },
  // ash_song is now a shadow verse — emerges when root is sung without track
  // The first agriculture is the shadow of nomadism.
  grain:      { tradition: 'human', people: 'human', name: 'The Grain Song', prereqs: ['ash_song', 'seasons'], difficulty: 4,
                desc: 'How to make the earth remember what to grow' },
  ore:        { tradition: 'human', people: 'human', name: 'Ore Reading', prereqs: ['blade', 'spark'], difficulty: 3,
                desc: 'How to see the metal sleeping in rock' },
  forge:      { tradition: 'human', people: 'human', name: 'The Forging Song', prereqs: ['spark', 'ore'], difficulty: 4,
                desc: 'How to make stone flow like water. Ilmarinen forges the Sampo.' },
  precession: { tradition: 'human', people: 'human', name: 'The Long Drift', prereqs: ['seasons', 'elder_song', 'far_sight'], difficulty: 5,
                desc: 'How even the nail slowly circles. Needs elf-sight to see what takes 26,000 years.' },

  // ═══════════════════════════════════════════════════════════════════
  // SALMON TECH — the creature that crosses between worlds
  // Salt to fresh, ocean to mountain, living to dead to living.
  // The salmon connects bear knowledge (river) to coastal knowledge (sea).
  // It is the bridge animal. It IS the tech tree — it grows upstream.
  // ═══════════════════════════════════════════════════════════════════
  salmon_song:{ tradition: 'mixed', people: 'mixed', name: 'The Salmon Song', prereqs: ['salmon_run', 'tide'], difficulty: 3,
                desc: 'When bear river-knowledge meets coastal tide-knowledge. The salmon goes from salt to fresh and back. It is the bridge.' },
  weir:       { tradition: 'mixed', people: 'mixed', name: 'The Weir Song', prereqs: ['salmon_song', 'blade'], difficulty: 3,
                desc: 'How to build a trap that thinks like a river. Stone and stick and patience. The salmon walks into it.' },
  kelp:       { tradition: 'mixed', people: 'mixed', name: 'The Kelp Song', prereqs: ['tide', 'root'], difficulty: 2,
                desc: 'What grows in the salt water is food. The forest of the coast. It feeds you when the land won\'t.' },
  smoke_song: { tradition: 'mixed', people: 'mixed', name: 'The Smoke Song', prereqs: ['salmon_song', 'ember'], difficulty: 3,
                desc: 'How to make the salmon last through winter. Smoke and salt and time. The first preservation.' },
  canoe:      { tradition: 'mixed', people: 'mixed', name: 'The Canoe Song', prereqs: ['salmon_song', 'tree_song'], difficulty: 4,
                desc: 'A tree hollowed to ride the water. Follow the salmon upstream. Follow it home.' },
  potlatch:   { tradition: 'mixed', people: 'mixed', name: 'The Potlatch Song', prereqs: ['salmon_song', 'feast'], difficulty: 4,
                desc: 'How to give everything away and become rich. The salmon gives its body to the river. The river gives it to the forest. Abundance through surrender.' },
  salmon_return: { tradition: 'mixed', people: 'mixed', name: 'The Return Song', prereqs: ['salmon_song', 'star_bear'], difficulty: 5,
                desc: 'The salmon returns to where it was born to die. The bear waits at the river. The forest eats the bear\'s leavings. The tree grows. It falls in the river. The salmon hides behind it. The cycle IS the song.' },

  // ═══════════════════════════════════════════════════════════════════
  // MIXED SONGS — these emerge when peoples meet and their songs combine
  // The most powerful knowledge comes from mixing traditions
  // ═══════════════════════════════════════════════════════════════════
  bear_gift:  { tradition: 'mixed', people: 'mixed', name: 'The Bear Gift', prereqs: ['den_memory', 'heartbeat'], difficulty: 3,
                desc: 'When the first upright walkers entered the bear caves. The bears did not attack. They taught.' },
  fire_cave:  { tradition: 'mixed', people: 'mixed', name: 'Fire in the Cave', prereqs: ['ember', 'cave_song'], difficulty: 3,
                desc: 'When humans brought spark-fire into dwarf caves. The first painted ceilings.' },
  dream_walk: { tradition: 'mixed', people: 'mixed', name: 'The Dream Walk', prereqs: ['ghost_walk', 'elder_song'], difficulty: 4,
                desc: 'When human memory met elf invisibility. How to walk in the dreaming.' },
  bone_flute: { tradition: 'mixed', people: 'mixed', name: 'The Bone Flute', prereqs: ['bear', 'lullaby'], difficulty: 3,
                desc: 'When dwarf bear-knowledge met human singing. The oldest instrument. Found in a Neanderthal cave.' },
  sea_cross:  { tradition: 'mixed', people: 'mixed', name: 'The Sea Crossing', prereqs: ['tide', 'far_sight'], difficulty: 4,
                desc: 'When halfling tide-knowledge met elf far-sight. How to cross water you cannot see across.' },
  deep_time:  { tradition: 'mixed', people: 'mixed', name: 'The Deep Time Song', prereqs: ['stone_sleep', 'precession'], difficulty: 5,
                desc: 'When troll endurance met human sky-knowledge. How to think in ice ages.' },
};

// ── The Tree ────────────────────────────────────────────────────────
// When you carve a verse on the Tree, it's permanent. Safe from forgetting.
// But the Tree grows. And grows. And blocks the sun.

const TREE_GROWTH_PER_VERSE = 1;        // each carved verse adds this much height
const SUN_BLOCKED_THRESHOLD = 6;         // tree height where sun starts dimming
const SUN_DEAD_THRESHOLD = 12;           // tree height where nothing grows
const FELLING_SCATTERS_CHANCE = 0.4;     // chance each carved verse survives as fragment after felling

// ── The Ash ─────────────────────────────────────────────────────────
// When the Tree is felled, the ash is fertile.
// New verses can emerge — combinations that didn't exist before.
// What grows depends on what was carved and what was lost.

const ASH_VERSES = {
  // These can ONLY be learned from the ash after a felling.
  // They emerge from combinations of carved verses.
  phoenix_song: { tradition: 'ash', people: 'ash', name: 'The Phoenix Song', prereqs: ['ember', 'elder_song'],
                  desc: 'A song about loss and return — it can only be composed after a felling',
                  emerges_from: ['ember', 'lullaby'] },
  deep_root:    { tradition: 'ash', people: 'ash', name: 'The Deep Root Song', prereqs: ['root', 'bear'],
                  desc: 'How the roots survive when the trunk is cut — learned from the bears',
                  emerges_from: ['root', 'bear'] },
  star_map:     { tradition: 'ash', people: 'ash', name: 'The Scar Map', prereqs: ['polestar', 'tree_song'],
                  desc: 'How to read the stump rings as a map of what was — where the carvings were',
                  emerges_from: ['polestar', 'tree_song'] },
  seed_song:    { tradition: 'ash', people: 'ash', name: 'The Seed Song', prereqs: ['ash_song', 'grain'],
                  desc: 'How to plant in the ash of the fallen Tree — the richest soil there is',
                  emerges_from: ['ash_song', 'grain'] },
  iron_song:    { tradition: 'ash', people: 'ash', name: 'The Iron Song', prereqs: ['forge', 'blade'],
                  desc: 'How the axe remembers the tree it felled — and the tree remembers the axe',
                  emerges_from: ['forge', 'blade'] },
  troll_echo:   { tradition: 'ash', people: 'ash', name: 'The Troll Echo', prereqs: ['heartbeat', 'bone_flute'],
                  desc: 'When the tree falls, the oldest rhythm returns. The trolls were here before the tree.',
                  emerges_from: ['heartbeat', 'bone_flute'] },
};

// Merge ash verses into VERSES so they can be learned/taught/sung
Object.assign(VERSES, ASH_VERSES);

// ── The Shadows ──────────────────────────────────────────────────────
// Every song has a shadow: what the song becomes when sung without its roots.
// Shadow songs emerge when a light song is on the setlist but its foundation
// is ABSENT. The words are the same. The meaning is different.
//
// The Grain Song sung without the Ash Song isn't a broken grain song.
// It's a DIFFERENT song. Agriculture without ecology. Farming without soil.
// That different song is the Wall Song. "This is mine."
//
// Shadows accumulate over seasons. When the shadow is full, someone in the
// band just... knows it. The shadow crystallized. The yin emerged from the yang.
//
// shadow_of:   the light song that casts this shadow
// shadow_when: the prereq of the light song that must be ABSENT
// shadow_rate: how fast the shadow accumulates (per season the condition holds)

const SHADOW_VERSES = {
  ash_song:   { tradition: 'shadow', people: 'human', name: 'The Ash Song',
                desc: 'Root without track. You know where things grow but you\'ve stopped following them. So you burn the forest and make them grow HERE. The first agriculture is the shadow of nomadism.',
                shadow_of: 'root', shadow_when: 'track', shadow_rate: 0.12,
                redeems_with: 'herd', redeems_into: 'rotation',
                prereqs: [], difficulty: 3 },
  wall:       { tradition: 'shadow', people: 'human', name: 'The Wall Song',
                desc: 'Grain without ash. Planting without understanding soil. What grows is ownership.',
                shadow_of: 'grain', shadow_when: 'ash_song', shadow_rate: 0.15,
                redeems_with: 'ash_song', redeems_into: 'irrigation',
                prereqs: [], difficulty: 3 },
  temple:     { tradition: 'shadow', people: 'human', name: 'The Temple Song',
                desc: 'Walls without burial. Enclosure without death-knowledge. The house for songs becomes a house for power.',
                shadow_of: 'wall', shadow_when: 'burial', shadow_rate: 0.12,
                redeems_with: 'burial', redeems_into: 'sanctuary',
                prereqs: [], difficulty: 4 },
  empire:     { tradition: 'shadow', people: 'human', name: 'The Empire Song',
                desc: 'Writing without runes. Accounting without ceremony. The ledger becomes the law.',
                shadow_of: 'writing', shadow_when: 'rune', shadow_rate: 0.08,
                redeems_with: 'rune', redeems_into: 'law',
                prereqs: [], difficulty: 5 },
  ban:        { tradition: 'shadow', people: 'human', name: 'The Ban',
                desc: 'The book without the elder. Text without living memory. The dead song forbids the living one.',
                shadow_of: 'book', shadow_when: 'elder_song', shadow_rate: 0.15,
                redeems_with: 'elder_song', redeems_into: 'archive',
                prereqs: [], difficulty: 2 },
  algorithm:  { tradition: 'shadow', people: 'human', name: 'The Algorithm',
                desc: 'The ledger without the grain. Counting without what you count. The pattern eats the meaning.',
                shadow_of: 'ledger', shadow_when: 'grain', shadow_rate: 0.10,
                redeems_with: 'grain', redeems_into: 'model',
                prereqs: [], difficulty: 3 },
  extraction: { tradition: 'shadow', people: 'human', name: 'The Extraction Song',
                desc: 'Ore without root. Metal without earth-knowledge. You take from the ground without knowing what you take.',
                shadow_of: 'ore', shadow_when: 'root', shadow_rate: 0.10,
                redeems_with: 'root', redeems_into: 'stewardship',
                prereqs: [], difficulty: 3 },
  platform:   { tradition: 'shadow', people: 'human', name: 'The Platform',
                desc: 'The algorithm without the book. Optimization without knowledge. Every song becomes content. Every singer becomes a user.',
                shadow_of: 'algorithm', shadow_when: 'book', shadow_rate: 0.10,
                redeems_with: 'book', redeems_into: 'commons',
                prereqs: [], difficulty: 4 },
  cancel:     { tradition: 'shadow', people: 'human', name: 'The Cancellation',
                desc: 'The ban without the book. Erasure without record. How a revival dies in committee. How a language project gets defunded.',
                shadow_of: 'ban', shadow_when: 'book', shadow_rate: 0.15,
                redeems_with: 'elder_song', redeems_into: 'restoration',
                prereqs: [], difficulty: 1 },
};

// ── Redemption Verses ─────────────────────────────────────────────────
// When shadow meets its missing root on the setlist, something new emerges.
// Not the original light song. Not the shadow. A third thing.
// The irrigation canal is neither the wall nor the ash. It's what happens
// when ownership meets ecology. When you bring the root back.
const REDEMPTION_VERSES = {
  irrigation:  { tradition: 'redeemed', people: 'mixed', name: 'The Irrigation Song',
                 desc: 'Wall meets ash. Ownership meets ecology. The canal carries water to where you chose to plant. The wall becomes a channel.',
                 prereqs: ['wall', 'ash_song'], difficulty: 4 },
  sanctuary:   { tradition: 'redeemed', people: 'mixed', name: 'The Sanctuary Song',
                 desc: 'Temple meets burial. Power meets death-knowledge. The temple becomes a place where the dead can still teach.',
                 prereqs: ['temple', 'burial'], difficulty: 4 },
  law:         { tradition: 'redeemed', people: 'mixed', name: 'The Law Song',
                 desc: 'Empire meets rune. Bureaucracy meets ceremony. The law becomes a covenant, not a command.',
                 prereqs: ['empire', 'rune'], difficulty: 5 },
  archive:     { tradition: 'redeemed', people: 'mixed', name: 'The Archive Song',
                 desc: 'The ban meets the elder. Suppression meets living memory. The archive preserves what the ban tried to kill.',
                 prereqs: ['ban', 'elder_song'], difficulty: 3 },
  model:       { tradition: 'redeemed', people: 'mixed', name: 'The Model Song',
                 desc: 'Algorithm meets grain. Pattern meets substance. The model serves the harvest instead of replacing it.',
                 prereqs: ['algorithm', 'grain'], difficulty: 4 },
  stewardship: { tradition: 'redeemed', people: 'mixed', name: 'The Stewardship Song',
                 desc: 'Extraction meets root. Mining meets earth-knowledge. You take from the ground and put something back.',
                 prereqs: ['extraction', 'root'], difficulty: 4 },
  commons:     { tradition: 'redeemed', people: 'mixed', name: 'The Commons Song',
                 desc: 'Platform meets book. The network becomes a library. Content becomes knowledge again.',
                 prereqs: ['platform', 'book'], difficulty: 5 },
  restoration: { tradition: 'redeemed', people: 'mixed', name: 'The Restoration Song',
                 desc: 'Cancellation meets the elder. Erasure meets living memory. What was defunded grows back from the root.',
                 prereqs: ['cancel', 'elder_song'], difficulty: 3 },
  rotation:    { tradition: 'redeemed', people: 'mixed', name: 'The Rotation Song',
                 desc: 'Ash meets herd. Slash-and-burn meets migration. You stop burning new ground. You move the CROPS instead of moving yourself. The nomadic instinct becomes crop rotation.',
                 prereqs: ['ash_song', 'herd'], difficulty: 4 },
};

Object.assign(VERSES, REDEMPTION_VERSES);

// Merge shadow verses into VERSES
Object.assign(VERSES, SHADOW_VERSES);

// ── The Spirits ─────────────────────────────────────────────────────
// Spirits are forces of nature that appear to be wills.
// The bear isn't angry at you. The bear is hungry and you're near the den.
// But if you sing the Bear Song — knowing when to avoid, how to leave space —
// it LOOKS like the bear is appeased. The song works. Whether the bear
// is a spirit or an animal doesn't matter. The relationship is real.
//
// Animal spirits: bear, wolf, saber cat — the old ones, the flesh spirits.
// Great spirits: fire, sky — the elemental ones, the ones that don't resolve.
// The fire doesn't want to be tended. But tend it and it looks like a companion.
// The sky doesn't aim lightning. But it strikes more when you have metal and no sky songs.
// No spirit is actually a will. No spirit is actually just physics.
// The game never tells you which. The songs work either way.

const SPIRITS = {
  bear: {
    name: 'Bear',       songId: 'bear',
    kind: 'animal',
    desc: 'The one who sleeps in earth',
    baseDanger: 0.1,    dangerPerFelling: 0.08,
    songProtection: 0.8,
    attackFoodLoss: 3,  killChance: 0.2,
    seasons: [0, 2],    // spring (waking) and autumn (preparing)
    allergyKillBonus: 0.3,   // extra kill chance for those with triggering blood
    allergyWarning: 0.5,     // adults/elders with old blood sense them and dodge this often
    allergyDesc: 'The old blood warns you. The elders smell the bear and pull the children close.',
  },
  wolf: {
    name: 'Wolf',
    songId: 'wolf_song', // The Wolf Song — a dwarf tradition. Bear Song is a fallback.
    fallbackSongId: 'bear', // Bear Song covers wolves partially
    kind: 'animal',
    desc: 'The one who follows',
    baseDanger: 0.08,   dangerPerFelling: 0.05,
    songProtection: 0.5,  // Bear Song only half-protects against wolves
    attackFoodLoss: 2,  killChance: 0.15,
    seasons: [3, 0],    // winter (pack hunting) and spring (hungry)
    allergyKillBonus: 0.25,
    allergyWarning: 0.5,
    allergyDesc: 'The hair stands up on the old ones. They know the wolves are circling before anyone else.',
  },
  cat: {
    name: 'Saber Cat',
    songId: 'bear',     // Bear Song partially covers cats too
    kind: 'animal',
    desc: 'The one who waits above',
    baseDanger: 0.06,   dangerPerFelling: 0.04,
    songProtection: 0.4,  // Bear Song barely covers saber cats
    attackFoodLoss: 1,  killChance: 0.35,  // rare but deadly
    seasons: [1, 2],    // summer (ambush) and autumn (stalking)
    allergyKillBonus: 0.2,
    allergyWarning: 0.4,   // cats are harder to sense
    allergyDesc: 'The old ones feel the cat above them. A chill. A shadow. But the children don\'t.',
  },

  // ── Great Spirits ──────────────────────────────────────────────────
  // Not animals. Forces. The relationship is the same but the danger is different.
  // An animal attack kills a person. A fire attack burns food and the tree.
  // A sky attack can start a fire OR put one out. It doesn't resolve clean.

  fire: {
    name: 'Fire',
    songId: 'ember',           // Ember Keeping is the base relationship
    fallbackSongId: 'deep_fire', // Trolls' Deep Fire — knowing where fire lives, not how to keep it
    kind: 'great',
    desc: 'The stolen one. It does not want to be tended. But tend it and it looks like a companion.',
    baseDanger: 0.05,          // low base — fire is only dangerous when you HAVE it
    dangerPerFelling: 0.12,    // fellings scatter embers. Fire loves a felling.
    songProtection: 0.7,       // Ember Keeping controls it well
    attackFoodLoss: 4,         // fire burns your stores
    killChance: 0.15,
    seasons: [1, 2],           // summer (dry) and autumn (wind)
    allergyKillBonus: 0,       // fire doesn't care about blood
    allergyWarning: 0,
    allergyDesc: '',
    // Fire-specific: danger INCREASES when you have fire songs but low integrity
    // A half-remembered fire is more dangerous than no fire at all
    // The stolen thing you can't control
    stolenSpirit: true,        // flag for special fire behavior in the loop
    treeBurnChance: 0.3,       // fire attacks can burn carved verses off the tree
  },

  sky: {
    name: 'Sky',
    songId: 'polestar',        // The Nail of the Sky — knowing the sky's patterns
    fallbackSongId: 'seasons', // The Turning Song — reading the sky's moods
    kind: 'great',
    desc: 'The one above. It gives fire to the earth and takes it back in the same gesture.',
    baseDanger: 0.04,          // storms happen
    dangerPerFelling: 0.03,    // felling clears land — more exposure to sky
    songProtection: 0.6,       // knowing the sky's patterns helps you shelter
    attackFoodLoss: 2,         // storms damage food
    killChance: 0.1,           // lightning kills
    seasons: [0, 1],           // spring (storms) and summer (lightning)
    allergyKillBonus: 0,
    allergyWarning: 0,
    allergyDesc: '',
    // Sky-specific: danger increases with metal songs (forge, ore) and height (thin_air)
    // The sky notices metal. That's physics. It looks like jealousy.
    metalAnger: true,          // flag for special sky behavior
    fireStarter: true,         // sky attacks can boost fire spirit danger
  },

  night: {
    name: 'Night',
    songId: 'polestar',        // The Nail of the Sky — the star that doesn't move. Your anchor in the dark.
    fallbackSongId: 'elder_song', // The Elder Song — singing through the dark. Not navigating it, just enduring.
    kind: 'great',
    desc: 'The singing dark. Night is when the elders tell the stories. Night is when you look up. The cost is cold. The gift is song.',
    baseDanger: 0.08,          // night is always there, and it's dangerous
    dangerPerFelling: 0.04,    // scattered songs mean less singing through the dark
    songProtection: 0.6,       // star knowledge helps you survive the night
    attackFoodLoss: 2,         // cold, exposure, predators in the dark
    killChance: 0.08,          // freezing, getting lost
    seasons: [3, 0],           // winter (longest nights) and spring (the dark before dawn)
    allergyKillBonus: 0,
    allergyWarning: 0,
    allergyDesc: '',
    // Night-specific: the dark is dangerous but it's also when you sing.
    // If you have star songs, night BOOSTS verse integrity.
    // The longer the winter, the deeper the songs. The arctic bargain.
    singingDark: true,         // flag: night boosts songs if you have star knowledge
    starSongs: ['polestar', 'seasons', 'precession', 'star_bear'],  // songs that unlock the gift
    songBoost: 0.04,           // integrity boost per verse per night event (if you have stars)
  },

  yeast: {
    name: 'Yeast',
    songId: 'brew',            // The Brewing Song — the primary relationship with the invisible one
    fallbackSongId: 'bake',    // The Baking Song — you don't know what yeast IS, but you know the bread rises
    kind: 'great',
    desc: 'The invisible one. It was always in the grain, in the air, on your hands. You will not see it for 10,000 years. But you will sing to it every baking day. The song that feeds you IS the song that feeds it.',
    baseDanger: 0.0,           // yeast doesn't attack. It GIVES.
    dangerPerFelling: 0.0,     // yeast doesn't care about your tree
    songProtection: 0.0,       // there is no protection FROM yeast. The song IS the relationship.
    attackFoodLoss: 0,         // yeast doesn't take food. It multiplies food.
    killChance: 0.0,           // yeast doesn't kill anyone
    seasons: [0, 1, 2, 3],    // yeast is always there. Always working. It doesn't sleep.
    allergyKillBonus: 0,
    allergyWarning: 0,
    allergyDesc: '',
    // Yeast-specific: the only spirit that HELPS you. And that's the danger.
    // More food → more people → more songs needed → faster tree growth → apocalypse.
    // The invisible engine of civilization. You can't go back once you have it.
    // The yeast domesticated YOU.
    invisibleSpirit: true,     // flag: yeast doesn't attack, it accelerates
    surplusPerSong: 2,         // food bonus per yeast song known
    populationPressure: true,  // flag: surplus creates birth pressure
  },

  death: {
    name: 'Death',
    songId: 'burial',          // The Burial Song — how to return the dead to the earth
    fallbackSongId: 'ochre',   // Ochre — marking the dead. Not understanding death, just acknowledging it.
    kind: 'great',
    desc: 'The one that waits. Not the end. The threshold. The dwarves buried their dead with flowers. That is the song.',
    baseDanger: 0.03,          // death is patient
    dangerPerFelling: 0.1,     // a felling is a death. The spirit wakes.
    songProtection: 0.6,       // the burial song doesn't prevent death. It makes death mean something.
    attackFoodLoss: 0,         // death doesn't take food
    killChance: 0.25,          // when death comes, it comes
    seasons: [2, 3],           // autumn (the dying) and winter (the dead season)
    allergyKillBonus: 0,
    allergyWarning: 0,
    allergyDesc: '',
    // Death-specific: death attacks target elders first (not youth like animals)
    // Death comes for the old. The songs they carry go with them.
    // High burial song integrity means the dying teach before they go.
    eldersFirst: true,         // flag: targets elders, not youth
    deathTeaching: true,       // flag: if burial song is strong, elder's songs pass to nearest youth
  },
};

// ── The Ages ────────────────────────────────────────────────────────
// Each run is an Age. The tree grows, blocks the sun, must be felled.
// The felling ends the Age. Between Ages: fast-forward montage.
// What survived determines what the next Age starts with.
// Later Ages introduce new songs — and new threats.
//
// When ALL your people die, or the sun reaches 0 and food runs out,
// the Age ends in collapse. You still advance, but lose more.

// ── Apocalypse Types ────────────────────────────────────────────────
// The end of each age is determined by what you carved.
// The tree always kills you. But HOW depends on what you put in it.

const APOCALYPSE_TYPES = {
  fire:   { name: 'The Burning',
            desc: 'Too many fire songs on the tree. The knowledge of flame becomes the flame itself.',
            traditions: ['fire', 'dwarf'] },  // ember, spark, forge, deep_fire
  ice:    { name: 'The Freeze',
            desc: 'Too many stone and earth songs. The weight of knowledge crushes. The glacier comes.',
            traditions: ['stone', 'troll', 'earth'] },
  sky:    { name: 'The Drift',
            desc: 'Too many sky songs. The precession shifts. Everything built on the calendar collapses.',
            traditions: ['sky', 'elf'] },
  shadow: { name: 'The Hollowing',
            desc: 'Too many shadow songs on the tree. The knowledge is all form and no foundation. The tree is hollow.',
            traditions: ['shadow'] },
  mixed:  { name: 'The Confusion',
            desc: 'Too many songs from too many traditions. The tower of knowledge babels.',
            traditions: ['mixed'] },
  redeemed: { name: 'The Return',
              desc: 'The shadows met their roots. The tree grows back from the inside. Not the same tree. A better one.',
              traditions: ['redeemed'] },
};

function determineApocalypse(state) {
  // Count traditions among carved verses
  const traditionCounts = {};
  for (const v of state.tree.carved) {
    const verse = VERSES[v];
    if (!verse) continue;
    const t = verse.tradition || verse.people || 'human';
    traditionCounts[t] = (traditionCounts[t] || 0) + 1;
  }

  // Find which apocalypse type matches best
  let bestType = 'mixed';
  let bestScore = 0;
  for (const [type, apoc] of Object.entries(APOCALYPSE_TYPES)) {
    let score = 0;
    for (const t of apoc.traditions) {
      score += traditionCounts[t] || 0;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return APOCALYPSE_TYPES[bestType] || APOCALYPSE_TYPES.mixed;
}

// ── Non-Linear Ages ──────────────────────────────────────────────────
// Ages are not a line. They are places the song can take you.
// When you fell the tree, WHERE you go depends on what was carved.
// When you sing the right combination, you can reach ages that were hidden.
// The Bear Age is always there. You just have to remember how to reach it.
// Each age connects to others through song-bridges: specific combinations
// that, when carved, open a path to another age.

const AGES = {
  bears: {
    name: 'The Age of Bears',          yearsBP: 2500000,
    desc: 'Before the upright ones. The cave bears dream in cycles older than species. You are not human. You are not even hominid. You are the dreamer.',
    startPeople: 'bear',
    newSongs: {},  // bear songs are base set
    encounter_peoples: ['bear'],
    // You unlock this by maintaining Bear Song integrity across ages
    hidden: true,
    unlock: 'Maintain the Bear Song at 70%+ integrity across 3 ages',
    bridges: {
      stone: { requires: ['spirit_mark', 'den_memory'], desc: 'Claw marks on the wall. Something upright comes. You dream of them.' },
    },
  },

  stone: {
    name: 'The Age of Stone',          yearsBP: 1800000,
    desc: 'You are Homo erectus. The first to walk upright into the unknown. You have no words — only rhythm.',
    startPeople: 'troll',
    newSongs: {},
    encounter_peoples: ['troll'],
    bridges: {
      caves:  { requires: ['heartbeat', 'deep_fire'], desc: 'Fire carried forward. A million years of walking.' },
      bears:  { requires: ['old_track', 'heartbeat'], desc: 'You follow the oldest tracks. Back before your kind. To the dreamers.' },
    },
  },

  caves: {
    name: 'The Age of Caves',          yearsBP: 300000,
    desc: 'New people in the caves. Shorter, stronger, with clever hands. The dwarves arrive.',
    newSongs: {},
    encounter_peoples: ['troll', 'dwarf'],
    bridges: {
      meeting: { requires: ['cave_song', 'blade'], desc: 'The caves fill with echoes of new voices coming from the south.' },
      stone:   { requires: ['heartbeat', 'stone_sleep'], desc: 'You dream backward. The troll patience takes you to the deep time.' },
      bears:   { requires: ['bear', 'cave_song'], desc: 'You sing the Bear Song in the deepest cave. Something ancient answers.' },
    },
  },

  meeting: {
    name: 'The Age of Meeting',        yearsBP: 52000,
    desc: 'From the east, the hidden people. From the islands, the small ones. From Africa, the singers. Everyone is here.',
    newSongs: {},
    encounter_peoples: ['troll', 'dwarf', 'elf', 'halfling', 'human'],
    bridges: {
      ice:     { requires: ['seasons', 'ember'], desc: 'The sky changes. Cold comes from the north.' },
      caves:   { requires: ['cave_song', 'bone_flute'], desc: 'The bone flute leads you back to the old caves. The dwarves are still there.' },
      bears:   { requires: ['bear', 'bear_gift'], desc: 'The Bear Gift opens a door in time. You walk through it on all fours.' },
    },
  },

  ice: {
    name: 'The Age of Ice',            yearsBP: 26000,
    desc: 'The glacier advances. The old peoples fade. The wolves come to the fire. Only their songs remain in you.',
    newSongs: {
      glacier:    { tradition: 'human', people: 'human', name: 'The Glacier Song', prereqs: ['seasons', 'stone_sleep'], difficulty: 3,
                    desc: 'How to read the ice. When it comes and when it retreats. Troll patience meets human sky-reading.' },
      migration:  { tradition: 'human', people: 'human', name: 'The Migration Song', prereqs: ['herd', 'far_sight'], difficulty: 3,
                    desc: 'How to move a whole people. Not following herds — becoming a herd.' },
      paint:      { tradition: 'mixed', people: 'mixed', name: 'The Paint Song', prereqs: ['ochre', 'fire_cave'], difficulty: 3,
                    desc: 'How to put the world on the wall. Lascaux. Chauvet. The first galleries.' },
      dog:        { tradition: 'mixed', people: 'mixed', name: 'The Dog Song', prereqs: ['wolf_song', 'ember', 'lullaby'], difficulty: 4,
                    desc: 'The wolf comes to the fire. You sing the Wolf Song but softer, like a lullaby. It stays. It stays. The first domestication. The dwarves never forgave you.' },
      dog_guard:  { tradition: 'human', people: 'human', name: 'The Guard Song', prereqs: ['dog', 'wall'], difficulty: 3,
                    desc: 'The dog patrols the perimeter. Nothing with old blood crosses it. The trolls retreat. The dwarves go underground. The dog chose you.' },
      dog_hunt:   { tradition: 'mixed', people: 'mixed', name: 'The Hunt Song', prereqs: ['dog', 'track'], difficulty: 3,
                    desc: 'How to hunt with a dog. You are faster together. You see what the dog smells. The dog sees what you point at. No other animal does this.' },
      dog_sled:   { tradition: 'mixed', people: 'mixed', name: 'The Sled Song', prereqs: ['dog', 'migration'], difficulty: 4,
                    desc: 'The dog pulls you across the ice. The circumpolar highway. From Siberia to Greenland, the dogs run.' },
      dog_burial: { tradition: 'mixed', people: 'mixed', name: 'The Dog Burial', prereqs: ['dog', 'burial'], difficulty: 3,
                    desc: 'Bonn-Oberkassel. 14,000 years ago. A dog buried with two humans. Covered in red ochre. The first friend.' },
    },
    encounter_peoples: ['dwarf', 'human'],
    complications: ['dog_mechanic'],
    bridges: {
      grain:     { requires: ['ash_song', 'root'], desc: 'The ice retreats. Green things push through.' },
      meeting:   { requires: ['bone_flute', 'elder_song'], desc: 'The old songs pull you back to when everyone was here.' },
      bears:     { requires: ['bear', 'long_sleep'], desc: 'You sleep like the bears. You wake in their time.' },
    },
  },

  grain: {
    name: 'The Age of Grain',          yearsBP: 12000,
    desc: 'The ice retreats. Someone plants a seed on purpose. Everything changes.',
    newSongs: {
      pottery:    { tradition: 'human', people: 'human', name: 'The Clay Song', prereqs: ['deep_fire', 'root'], difficulty: 2,
                    desc: 'How to make earth hold water. The beginning of storage. The beginning of surplus.' },
      // wall is now a shadow song — emerges when grain is sung without ash_song
      // temple is now a shadow song — emerges when wall is sung without burial
      // ── Writing has two roots. Both give you writing when they meet. ──
      ledger:     { tradition: 'human', people: 'human', name: 'The Ledger Song', prereqs: ['grain', 'pottery'], difficulty: 3,
                    desc: 'How many bushels does the temple owe? Marks on clay. The first writing is accounting. The yeast produces surplus and surplus demands to be counted.' },
      rune:       { tradition: 'human', people: 'human', name: 'The Rune Song', prereqs: ['burial', 'tree_song'], difficulty: 4,
                    desc: 'Marks on standing stones. Marks on graves. The dead need names. The paths need markers. Odin hung nine nights on the world tree for this. Writing born from ceremony and wayfinding, not from grain.' },
      writing:    { tradition: 'mixed', people: 'mixed', name: 'The Writing Song', prereqs: ['ledger', 'rune'], difficulty: 4,
                    desc: 'When the grain-counter\'s marks meet the grave-marker\'s runes. Two ways of making permanent become one. The song that doesn\'t need a singer.' },
      // temple is now a shadow song — emerges when wall is sung without burial
      // ── Yeast songs — the invisible domestication ──
      // Grain + pottery = the conditions for yeast. It was already there.
      // You didn't discover it. It discovered your grain stores.
      brew:       { tradition: 'mixed', people: 'mixed', name: 'The Brewing Song', prereqs: ['grain', 'pottery'], difficulty: 3,
                    desc: 'The grain left in the clay pot foamed. You drank it and the world changed. Beer before bread — the oldest argument in archaeology. The yeast was always there. You just gave it a house.' },
      bake:       { tradition: 'human', people: 'human', name: 'The Baking Song', prereqs: ['grain', 'ember'], difficulty: 2,
                    desc: 'The dough rises. You don\'t know why. You just know the song: knead, wait, fire. The waiting IS the yeast. Every baker\'s hands carry a civilization of invisible singers.' },
      sourdough:  { tradition: 'mixed', people: 'mixed', name: 'The Mother Song', prereqs: ['bake', 'elder_song'], difficulty: 4,
                    desc: 'The starter that lives. You feed it. You keep it warm. You pass it to your children. Some sourdough starters are older than any living song. The mother IS the yeast, kept alive like a fire. The first inheritance that isn\'t blood.' },
      mead:       { tradition: 'mixed', people: 'mixed', name: 'The Mead Song', prereqs: ['brew', 'root'], difficulty: 3,
                    desc: 'Honey and water and time. The oldest alcohol. The bees do the first half. The yeast does the second. You just watch. In the Kalevala, mead takes longer to brew than the world takes to create.' },
    },
    encounter_peoples: ['human'],
    complications: ['yeast_mechanic'],
    bridges: {
      iron:      { requires: ['forge', 'wall'], desc: 'Metal replaces stone. Power replaces song.' },
      ice:       { requires: ['glacier', 'precession'], desc: 'The long drift. The calendar says the ice is coming back.' },
      bears:     { requires: ['bear', 'temple'], desc: 'You build a temple to the bear. The bear walks out of it, into the past.' },
    },
  },

  iron: {
    name: 'The Age of Iron',           yearsBP: 3000,
    desc: 'Metal. Ships. Empires. Someone writes the Kalevala down. Someone bans the old songs.',
    newSongs: {
      sail:       { tradition: 'human', people: 'human', name: 'The Sail Song', prereqs: ['sea_cross', 'loom'], difficulty: 3,
                    desc: 'How to make the wind carry you. The beginning of crossing oceans.' },
      // empire is now a shadow song — emerges when writing is sung without rune
      book:       { tradition: 'human', people: 'human', name: 'The Book', prereqs: ['writing', 'elder_song'], difficulty: 3,
                    desc: 'How to make a tree into a song that never forgets. But also never changes.' },
      // ban is now a shadow song — emerges when book is sung without elder_song
    },
    encounter_peoples: ['human'],
    complications: ['ban_mechanic'],
    bridges: {
      remembering: { requires: ['book', 'ban'], desc: 'The ban creates the forgetting. The forgetting creates the remembering.' },
      grain:       { requires: ['ash_song', 'seed_song'], desc: 'Back to the beginning of planting. Before walls.' },
      bears:       { requires: ['bear', 'burial'], desc: 'You bury a bear with flowers. You follow it down.' },
    },
  },

  remembering: {
    name: 'The Age of Remembering',    yearsBP: 50,
    desc: 'Someone finds a Neanderthal flute in a cave. Someone sequences Denisovan DNA. The old songs echo.',
    newSongs: {
      archaeology:{ tradition: 'human', people: 'human', name: 'The Dig Song', prereqs: ['writing', 'star_map'], difficulty: 3,
                    desc: 'How to hear the dead sing. Bones and shards and strata.' },
      genome:     { tradition: 'mixed', people: 'mixed', name: 'The Blood Song', prereqs: ['archaeology', 'deep_time'], difficulty: 5,
                    desc: 'How to read the songs written in your body. 2% Neanderthal. 5% Denisovan. All of it, singing.' },
      revive:     { tradition: 'human', people: 'human', name: 'The Revival Song', prereqs: ['archaeology', 'elder_song'], difficulty: 4,
                    desc: 'How to teach a song that no one alive remembers. Language revitalization. The undeath of knowledge.' },
      // cancel is now a shadow song — emerges when ban is sung without book
    },
    encounter_peoples: ['human'],
    complications: ['ban_mechanic', 'cancel_mechanic'],
    bridges: {
      stone:       { requires: ['genome', 'heartbeat'], desc: 'The DNA sings. You follow it back 1.8 million years.' },
      meeting:     { requires: ['revive', 'bone_flute'], desc: 'The revived song remembers the age when everyone was here.' },
      bears:       { requires: ['genome', 'bear'], desc: 'You read the bear genome. It reads you back. You are in the cave.' },
      apocalypse:  { requires: ['cancel', 'empire'], desc: 'The tree becomes the Tech Tree. It grows until it blots out everything.' },
    },
  },

  apocalypse: {
    name: 'The Age of the Tech Tree',  yearsBP: 0,
    desc: 'The tree is no longer a metaphor. It is the system. It grows exponentially. It has replaced the sun. You carved everything on it and now it is all there is.',
    newSongs: {
      // algorithm, platform, extraction are now shadow songs — they emerge from absence
      last_song:  { tradition: 'mixed', people: 'mixed', name: 'The Last Song', prereqs: ['genome', 'bear_gift', 'den_memory'], difficulty: 5,
                    desc: 'The only song that can fell the final tree. It requires remembering what was before the tree. Before the hominids. The bears.' },
    },
    encounter_peoples: ['human'],
    complications: ['ban_mechanic', 'cancel_mechanic', 'algorithm_mechanic'],
    // The apocalypse connects back to everything. If you can sing The Last Song, you can reach the bears.
    bridges: {
      bears:       { requires: ['last_song'], desc: 'You fell the Tech Tree. In the ash, the bears are waiting. They always were.' },
      stone:       { requires: ['genome', 'heartbeat'], desc: 'You strip it all back. Before writing. Before fire. The heartbeat.' },
      remembering: { requires: ['revive'], desc: 'Not this time. You go back and try to remember harder.' },
    },
  },
};

// ── People ──────────────────────────────────────────────────────────
// People are born, learn, age, and die.
// Youth (0-4 seasons) can learn from adults/elders.
// Adults (5-16 seasons) can teach youth, do actions.
// Elders (17-24 seasons) teach best — double learning rate. But fragile.
// After 24 seasons, death. Their songs go with them unless someone learned.

function ageCategory(age) {
  if (age <= 4) return 'youth';
  if (age <= 16) return 'adult';
  if (age <= 24) return 'elder';
  return 'dead';
}

// ── Heritage — the blood song ───────────────────────────────────────
// Heritage is not a species. It's a song on a different timescale.
// Regular verses drift at 0.08/season. Blood verses drift at 0.005/season.
// "Dwarf" isn't a species — it's what you call someone whose blood sings
// craft_blood, cave_blood, stone_blood at high integrity.
// Someone with craft_blood + thin_air_blood is something new.
// The peoples are just labels we give to common patterns.
//
// Blood verses also determine spirit allergies:
// deep_blood and stone_blood trigger the bear spirits.
// cave_blood and stone_blood trigger the wolves.
// thin_air_blood and stone_blood trigger the saber cats.
// The older your blood, the more the spirits notice you.

const BLOOD_VERSES = {
  // The blood verses. These ARE the heritage system.
  // Each has: which spirit it triggers, what voice songs it makes easier to learn,
  // and which "people" pattern it contributes to.
  deep_blood:    { name: 'Deep Blood',    desc: 'The old fire in the marrow. Millions of years of walking upright.',
                   triggers: ['bear'],     eases: ['heartbeat', 'deep_fire', 'old_track', 'stone_sleep'],
                   patterns: ['troll'] },
  stone_blood:   { name: 'Stone Blood',   desc: 'The patience of rock. How to endure. How to wait.',
                   triggers: ['bear', 'wolf', 'cat'],  eases: ['stone_sleep', 'flake', 'blade'],
                   patterns: ['troll', 'dwarf'] },
  craft_blood:   { name: 'Craft Blood',   desc: 'Hands that remember. The shaping instinct.',
                   triggers: ['wolf'],     eases: ['flake', 'blade', 'ember', 'forge'],
                   patterns: ['dwarf'] },
  cave_blood:    { name: 'Cave Blood',    desc: 'The sense for enclosed spaces. Where the echoes live.',
                   triggers: ['wolf', 'bear'],  eases: ['cave_song', 'bear', 'ochre', 'burial'],
                   patterns: ['dwarf'] },
  thin_air_blood:{ name: 'Thin Air Blood', desc: 'The gene for altitude. Lungs that work where others fail.',
                   triggers: ['cat'],      eases: ['thin_air', 'far_sight', 'ghost_walk'],
                   patterns: ['elf'] },
  ghost_blood:   { name: 'Ghost Blood',   desc: 'How to leave no trace. The vanishing. Almost nothing survived.',
                   triggers: ['cat'],      eases: ['ghost_walk', 'loom', 'jade'],
                   patterns: ['elf'] },
  island_blood:  { name: 'Island Blood',  desc: 'Smallness as survival. Knowing your whole world.',
                   triggers: [],           eases: ['island', 'small_hunt', 'tide', 'feast', 'shelter'],
                   patterns: ['halfling'] },
  song_blood:    { name: 'Song Blood',    desc: 'The larynx that changed everything. The capacity for complex language.',
                   triggers: [],           eases: ['lullaby', 'elder_song', 'tree_song', 'ledger', 'rune', 'writing'],
                   patterns: ['human'] },
  change_blood:  { name: 'Change Blood',  desc: 'The restlessness. Learn fast, forget fast, move on.',
                   triggers: [],           eases: ['spark', 'track', 'seasons', 'herd', 'migration'],
                   patterns: ['human'] },
  shaman_blood:  { name: 'Shaman Blood',  desc: 'The crossing. Between spirit and flesh, between living and dead. The ones who see both sides.',
                   triggers: ['bear', 'wolf', 'cat'],  eases: ['bear', 'burial', 'dream_walk', 'ghost_walk', 'bone_flute'],
                   patterns: ['dwarf', 'elf'] },
  coastal_blood: { name: 'Coastal Blood', desc: 'Salt in the veins. The knowledge of tides and currents and the creatures that cross between.',
                   triggers: [],           eases: ['tide', 'sea_cross', 'salmon_song', 'weir', 'sail', 'kelp'],
                   patterns: ['halfling'] },
  den_blood:     { name: 'Den Blood',     desc: 'The oldest memory. Before hands. Before uprightness. The cave remembers.',
                   triggers: ['bear'],     eases: ['den_memory', 'long_sleep', 'salmon_run', 'cub_call', 'root_dig'],
                   patterns: ['bear'] },
  dog_blood:     { name: 'Dog Blood',     desc: 'The wolf who stayed. 15,000 years of sleeping by the fire. The oldest alliance.',
                   triggers: ['wolf'],     eases: ['dog', 'dog_guard', 'dog_hunt', 'dog_sled', 'dog_burial'],
                   patterns: ['dog'] },
  yeast_blood:   { name: 'Yeast Blood',  desc: 'The invisible symbiont. 10,000 years of rising bread and foaming beer. It lives in your hands, your pots, your air.',
                   triggers: ['yeast'],    eases: ['brew', 'bake', 'sourdough', 'mead'],
                   patterns: ['yeast'] },
};

const BLOOD_DRIFT = 0.005;           // per season, blood verses drift down
const BLOOD_THRESHOLD = 0.01;        // below this, the blood verse is silent
const BLOOD_ALLERGY_THRESHOLD = 0.05; // need 5%+ of a triggering blood to alert the spirits

// ── Peoples as pattern matchers ─────────────────────────────────────
// PEOPLES is now purely a labeling system. If your blood matches these
// patterns, folklore gives you this name. The blood IS the truth.

// Which blood verses define each people (for pattern matching and starting conditions)
const PEOPLE_BLOOD = {
  bear:     { primary: ['den_blood'],                           name: 'Bear' },
  troll:    { primary: ['deep_blood', 'stone_blood'],           name: 'Troll' },
  // Orc is the same blood as troll — just what the later ages call them when they're afraid.
  // High deep_blood + stone_blood + low song_blood = "orc" in the Iron Age.
  // High deep_blood + stone_blood + any shaman_blood = "troll" (respectful).
  // The difference is in the telling, not the blood.
  orc:      { primary: ['deep_blood', 'stone_blood'],           name: 'Orc' },
  dwarf:    { primary: ['craft_blood', 'cave_blood', 'shaman_blood'], name: 'Dwarf' },
  elf:      { primary: ['thin_air_blood', 'ghost_blood', 'shaman_blood'], name: 'Elf' },
  halfling: { primary: ['island_blood', 'coastal_blood'],        name: 'Halfling' },
  human:    { primary: ['song_blood', 'change_blood'],          name: 'Human' },
  dog:      { primary: ['dog_blood'],                           name: 'Dog' },
  yeast:    { primary: ['yeast_blood'],                        name: 'Yeast' },
};

function getBlood(person) {
  // Blood is stored as person.blood = { deep_blood: 0.95, stone_blood: 0.8, ... }
  if (person.blood && typeof person.blood === 'object') return person.blood;
  // Backwards compat: derive from people field
  const peopleKey = person.people || 'human';
  const pattern = PEOPLE_BLOOD[peopleKey];
  if (!pattern) return { song_blood: 1.0 };
  const blood = {};
  for (const bv of pattern.primary) blood[bv] = 1.0;
  return blood;
}

function bloodLevel(person, bloodVerse) {
  return getBlood(person)[bloodVerse] || 0;
}

// What "people" label best fits this person's blood?
function identifyPeople(person, ageKey) {
  const blood = getBlood(person);
  let bestKey = 'human';
  let bestScore = 0;
  for (const [key, pattern] of Object.entries(PEOPLE_BLOOD)) {
    // Skip 'orc' — it's the same blood as troll, just a different telling
    if (key === 'orc') continue;
    let score = 0;
    for (const bv of pattern.primary) {
      score += blood[bv] || 0;
    }
    score /= pattern.primary.length;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  // Troll vs Orc: same blood, different name.
  // In iron age and later, if deep_blood + stone_blood are high but shaman_blood is low,
  // the fearful call them orcs. It's not about the blood. It's about the telling.
  if (bestKey === 'troll' && ageKey) {
    const lateAges = ['iron', 'remembering', 'apocalypse'];
    if (lateAges.includes(ageKey) && (blood.shaman_blood || 0) < 0.1) {
      bestKey = 'orc';
    }
  }
  return bestKey;
}

function isAllergicTo(person, spiritKey) {
  const spirit = SPIRITS[spiritKey];
  if (!spirit) return false;
  const blood = getBlood(person);
  // Check if ANY blood verse that triggers this spirit is above threshold
  for (const bv of Object.keys(blood)) {
    if (blood[bv] < BLOOD_ALLERGY_THRESHOLD) continue;
    const bvDef = BLOOD_VERSES[bv];
    if (bvDef && bvDef.triggers.includes(spiritKey)) return true;
  }
  return false;
}

function allergyStrength(person, spiritKey) {
  const spirit = SPIRITS[spiritKey];
  if (!spirit) return 0;
  const blood = getBlood(person);
  let total = 0;
  for (const bv of Object.keys(blood)) {
    const bvDef = BLOOD_VERSES[bv];
    if (bvDef && bvDef.triggers.includes(spiritKey)) {
      total += blood[bv];
    }
  }
  return Math.min(1.0, total);
}

// Mix two parents' blood for a child — average each blood verse
function mixBlood(parent1, parent2) {
  const b1 = getBlood(parent1);
  const b2 = getBlood(parent2);
  const child = {};
  const allKeys = new Set([...Object.keys(b1), ...Object.keys(b2)]);
  for (const key of allKeys) {
    const avg = ((b1[key] || 0) + (b2[key] || 0)) / 2;
    if (avg >= BLOOD_THRESHOLD) child[key] = avg;
  }
  return child;
}

// Drift blood each season — all blood verses drift down slowly
// The dominant blood of the age drifts UP (gene flow / adaptation)
function driftBlood(person, dominantBloods) {
  const blood = getBlood(person);
  const newBlood = {};
  for (const [key, val] of Object.entries(blood)) {
    if (dominantBloods.includes(key)) {
      newBlood[key] = Math.min(1.0, val + BLOOD_DRIFT);
    } else {
      const drifted = val - BLOOD_DRIFT;
      if (drifted >= BLOOD_THRESHOLD) newBlood[key] = drifted;
    }
  }
  // Ensure dominant bloods exist at minimum
  for (const db of dominantBloods) {
    if (!newBlood[db]) newBlood[db] = BLOOD_DRIFT;
  }
  person.blood = newBlood;
}

// Display label — what folklore calls you based on your blood
function heritageLabel(person) {
  const blood = getBlood(person);
  // Find all peoples with significant match
  const matches = [];
  for (const [key, pattern] of Object.entries(PEOPLE_BLOOD)) {
    if (key === 'orc') continue; // orc is a context label, not a blood label
    let score = 0;
    for (const bv of pattern.primary) score += blood[bv] || 0;
    score /= pattern.primary.length;
    if (score >= 0.1) matches.push({ key, score });
  }
  matches.sort((a, b) => b.score - a.score);
  if (matches.length === 0) return '?';
  if (matches.length === 1 || matches[1].score < 0.1) {
    return matches[0].key.charAt(0).toUpperCase();
  }
  return matches.slice(0, 3).map(m => m.key.charAt(0).toUpperCase()).join('/');
}

// Detailed blood reading — for the Genome Song / status display
function bloodReading(person) {
  const blood = getBlood(person);
  return Object.entries(blood)
    .filter(([, v]) => v >= BLOOD_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(([bv, v]) => `${BLOOD_VERSES[bv]?.name || bv} ${Math.round(v * 100)}%`)
    .join(', ');
}

// What songs does this person's blood make easier to learn?
function bloodEases(person) {
  const blood = getBlood(person);
  const eased = {};
  for (const [bv, level] of Object.entries(blood)) {
    if (level < BLOOD_ALLERGY_THRESHOLD) continue;
    const def = BLOOD_VERSES[bv];
    if (!def) continue;
    for (const songId of def.eases) {
      eased[songId] = Math.max(eased[songId] || 0, level);
    }
  }
  return eased; // { songId: bloodLevel } — higher = easier to learn
}

// ── Song Sinking — voice songs becoming blood ─────────────────────
// The reverse of blood memory. When a song is sustained at high integrity
// across generations, it leaves a mark in the blood.
// The Cave Song, sung well by grandparent → parent → child, deepens cave_blood.
// This is how peoples EMERGE from culture. You don't start dwarf.
// You become dwarf by singing dwarf songs for long enough.
//
// Mechanically: BLOOD_VERSES.eases maps blood→songs.
// We invert it: SONG_BLOODS maps song→blood verses.
// At birth, if BOTH parents know a song well, the child's corresponding
// blood verses get a small boost. Over generations, culture becomes heritage.

const SONG_BLOODS = {};  // songId → [bloodVerse keys that ease it]
for (const [bv, def] of Object.entries(BLOOD_VERSES)) {
  for (const songId of def.eases) {
    if (!SONG_BLOODS[songId]) SONG_BLOODS[songId] = [];
    SONG_BLOODS[songId].push(bv);
  }
}

const SONG_SINK_THRESHOLD = 0.5;   // parents must know the song at 50%+ for it to mark the child
const SONG_SINK_AMOUNT = 0.03;     // blood boost per song per generation (slow — takes 10+ generations to matter)

// Given two parents, calculate blood boost from their shared songs
function songSinkBlood(parent1, parent2) {
  const boost = {};
  // Find songs BOTH parents know well
  for (const songId of Object.keys(VERSES)) {
    const p1 = (parent1.verses[songId] || 0);
    const p2 = (parent2.verses[songId] || 0);
    if (p1 >= SONG_SINK_THRESHOLD && p2 >= SONG_SINK_THRESHOLD) {
      // Both parents sing this song well — it sinks into the blood
      const strength = Math.min(p1, p2);  // limited by the weaker singer
      const bloods = SONG_BLOODS[songId];
      if (!bloods) continue;
      for (const bv of bloods) {
        const amount = SONG_SINK_AMOUNT * (strength / 1.0);  // stronger singing = more sinking
        boost[bv] = (boost[bv] || 0) + amount;
      }
    }
  }
  return boost;  // { bloodVerse: boostAmount }
}

// Helper: make a blood map for a "pure" person of a given people
function pureBlood(peopleKey, variation = 0.1) {
  const pattern = PEOPLE_BLOOD[peopleKey];
  if (!pattern) return { song_blood: 1.0 };
  const blood = {};
  for (const bv of pattern.primary) {
    blood[bv] = 0.9 + Math.random() * variation;
  }
  return blood;
}

// Helper: make a person with blood
function makePerson(name, age, peopleKey, verses, bloodOverride) {
  return {
    name, age,
    people: peopleKey,
    blood: bloodOverride || pureBlood(peopleKey),
    verses,
  };
}

function teachingPower(person) {
  const cat = ageCategory(person.age);
  if (cat === 'elder') return 2.0;
  if (cat === 'adult') return 1.0;
  return 0;
}

// ── Verse Integrity ─────────────────────────────────────────────────
// A person knows a verse with some integrity: 0.0 (lost) to 1.0 (perfect).
// Verses DO NOT DECAY in the holder. You know what you know until you die.
// Decay is GENERATIONAL: youth absorb at less than the teacher's integrity.
// The compounding across generations IS the drift.
//
// The constraint is not memory. It's SINGING TIME.
// Each season the community performs a setlist. The setlist has limited slots.
// Youth absorb songs from the setlist by being present (legitimate peripheral
// participation). Songs not on the setlist are not transmitted. One generation
// of silence = lost.
//
// Position on the setlist matters:
//   Opening verse: ~95% transmission. Everyone hears this. Even the babies.
//   Deep night verses: ~60% transmission. Youth are drowsy.
// Blood affinity boosts absorption. Repetition across seasons helps.

const GARBLE_THRESHOLD = 0.3;            // below this, teaching spreads errors
const LOST_THRESHOLD = 0.1;              // below this, verse is gone
const LEARN_RATE_FOCUSED = 0.25;         // focused 1-on-1 apprenticeship bonus

// ── The Setlist ────────────────────────────────────────────────────
// The setlist is what the community sings each season.
// Capacity depends on band size: more people = more fires = more songs.
// Order matters: early songs transmit better to youth.

function setlistCapacity(people, state) {
  const singers = people.filter(p => ageCategory(p.age) !== 'youth').length;
  if (singers <= 0) return 0;
  let cap = Math.floor(Math.log2(singers) * 2) + 1;
  // Rune/ledger give small memory aids. Writing doesn't expand the setlist —
  // it does something worse. See the absorption section.
  if (state) {
    const knows = (v) => people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
    if (knows('rune')) cap += 2;    // carved marks as memory aids
    if (knows('ledger')) cap += 1;  // tally marks track what's been sung
  }
  return cap;
}

// ── The Writing Integrity ──────────────────────────────────────────
// Someone who knows writing can "sing" any carved verse by reading it.
// But reading is not singing. The integrity is flat — no position factor,
// no blood resonance, no deepening with repetition. Just... text.
// This is the Babel mechanic. Every song equally accessible, equally dead.
const WRITING_INTEGRITY = 0.5;  // a literate person reads at 50%. Accurate but flat.

// Position factor: how well a song at position i (0-indexed) transmits to youth
function positionFactor(position, totalSlots) {
  if (totalSlots <= 1) return 0.90;
  // Opening: 0.95, last slot: 0.55, linear interpolation
  return 0.95 - (position / (totalSlots - 1)) * 0.40;
}

// ── Default State ───────────────────────────────────────────────────

// ── Starting People Generator ────────────────────────────────────────

const NAMES_BY_AGE = {
  bears:   ['Great-Paw', 'Honey-Dream', 'Old-Den', 'River-Watch', 'Snow-Sleep', 'Cub-Cry', 'Root-Dig'],
  stone:   ['Grok', 'Thud', 'Rumble', 'Ember-Eye', 'Stone-Hand', 'Old-Walk', 'Still-One'],
  caves:   ['Durin', 'Mim', 'Nain', 'Andvari', 'Sindri', 'Brokk', 'Alviss'],
  meeting: ['Aino', 'Joukahainen', 'Ilmatar', 'Kullervo', 'Louhi', 'Lemminkainen', 'Vainamoinen'],
  ice:     ['Aino', 'Joukahainen', 'Ilmatar', 'Kullervo', 'Louhi', 'Lemminkainen', 'Vainamoinen'],
  grain:   ['Marjatta', 'Pellervo', 'Sampsa', 'Ahti', 'Tuoni', 'Mielikki', 'Tapio'],
  iron:    ['Elias', 'Akseli', 'Minna', 'Johan', 'Kristina', 'Kaarle', 'Aleksis'],
  remembering: ['Aino', 'Joukahainen', 'Ilmatar', 'Kullervo', 'Louhi', 'Lemminkainen', 'Vainamoinen'],
  apocalypse:  ['User', 'Admin', 'Founder', 'Investor', 'Influencer', 'Intern', 'The-Algorithm'],
};

// What species each age starts with (for fresh starts without inherited songs)
const AGE_DEFAULT_PEOPLE = {
  bears: 'bear', stone: 'troll', caves: 'troll', meeting: 'human',
  ice: 'human', grain: 'human', iron: 'human', remembering: 'human', apocalypse: 'human',
};

// What songs a fresh start in each age guarantees
const AGE_BASE_SONGS = {
  bears:   { den_memory: 1.0, cub_call: 0.8 },
  stone:   { heartbeat: 1.0 },
  caves:   { heartbeat: 0.7, flake: 0.6 },
  meeting: { lullaby: 0.8, root: 0.6, heartbeat: 0.5 },
  ice:     { lullaby: 0.8, root: 0.6, ember: 0.5 },
  grain:   { lullaby: 0.8, root: 0.7, spark: 0.5 },
  iron:    { lullaby: 0.8, root: 0.6, spark: 0.5, writing: 0.4 },
  remembering: { lullaby: 0.8, root: 0.6 },
  apocalypse:  { algorithm: 0.9, platform: 0.7, writing: 0.5 },
};

function generateStartingPeople(ageKey, inheritedSongs) {
  const names = NAMES_BY_AGE[ageKey] || NAMES_BY_AGE.meeting;
  const defaultPeople = AGE_DEFAULT_PEOPLE[ageKey] || 'human';
  const baseSongs = AGE_BASE_SONGS[ageKey] || {};
  const inheritedKeys = Object.keys(inheritedSongs);

  if (ageKey === 'bears') {
    // You ARE the bears. Pure den_blood.
    return [
      makePerson('Great-Paw', 20, 'bear', { den_memory: 1.0, long_sleep: 0.7, salmon_run: 0.6 }),
      makePerson('Honey-Dream', 16, 'bear', { den_memory: 0.9, cub_call: 0.8 }),
      makePerson('Old-Den', 22, 'bear', { den_memory: 1.0, long_sleep: 0.9, root_dig: 0.7, star_bear: 0.4 }),
      makePerson('River-Watch', 12, 'bear', { den_memory: 0.8, salmon_run: 0.7 }),
      makePerson('Snow-Sleep', 8, 'bear', { den_memory: 0.6 }),
      makePerson('Cub-Cry', 3, 'bear', {}),
      makePerson('Root-Dig', 18, 'bear', { den_memory: 1.0, root_dig: 0.8, cub_call: 0.7 }),
    ];
  }

  if (ageKey === 'stone' && inheritedKeys.length === 0) {
    // Fresh start as Homo erectus — pure deep_blood + stone_blood
    return [
      makePerson('Grok', 20, 'troll', { heartbeat: 1.0 }),
      makePerson('Thud', 16, 'troll', { heartbeat: 0.9 }),
      makePerson('Rumble', 12, 'troll', { heartbeat: 0.8 }),
      makePerson('Ember-Eye', 8, 'troll', { heartbeat: 0.7 }),
      makePerson('Stone-Hand', 4, 'troll', {}),
      makePerson('Old-Walk', 22, 'troll', { heartbeat: 1.0, old_track: 0.6 }),
      makePerson('Still-One', 18, 'troll', { heartbeat: 1.0, stone_sleep: 0.5 }),
    ];
  }

  // Generic generation — works for any age with inherited songs
  const people = [];
  const ages = [20, 16, 14, 10, 8, 4, 1];

  for (let i = 0; i < 7; i++) {
    const name = names[i % names.length];
    const personAge = ages[i];
    const verses = {};

    // Start with base songs for this age
    for (const [v, integ] of Object.entries(baseSongs)) {
      verses[v] = integ;
    }

    // Layer inherited songs on top (degraded)
    if (inheritedKeys.length > 0) {
      const songCount = 2 + Math.floor(Math.random() * 4);
      const shuffled = [...inheritedKeys].sort(() => Math.random() - 0.5);
      for (let j = 0; j < Math.min(songCount, shuffled.length); j++) {
        const songId = shuffled[j];
        const baseIntegrity = inheritedSongs[songId];
        const degraded = baseIntegrity * (0.6 + Math.random() * 0.2);
        if (degraded >= LOST_THRESHOLD) {
          verses[songId] = Math.max(verses[songId] || 0, Math.min(1.0, degraded));
        }
      }
    }

    people.push(makePerson(name, personAge, defaultPeople, verses));
  }

  return people;
}

// ── Crossing — The Bridge Between Ages ──────────────────────────────
// When you fell the tree (or collapse), you choose which bridge to cross.
// Bridges require specific songs to have been carved. The songs ARE the path.
// If you have no valid bridges, you collapse into the nearest age.

function getAvailableBridges(state) {
  const currentAge = AGES[state.ageKey] || AGES.stone;
  if (!currentAge.bridges) return [];

  const carvedSet = new Set(state.tree.carved);
  // Also count songs known by living people at high integrity
  const wellKnown = new Set();
  for (const p of state.people) {
    for (const [v, integ] of Object.entries(p.verses)) {
      if (integ >= GARBLE_THRESHOLD) wellKnown.add(v);
    }
  }

  const available = [];
  for (const [targetKey, bridge] of Object.entries(currentAge.bridges)) {
    const targetAge = AGES[targetKey];
    if (!targetAge) continue;
    // Hidden ages require special unlock conditions
    if (targetAge.hidden && !state.unlockedAges?.includes(targetKey)) continue;
    // Check if the required songs are either carved OR well-known
    const met = bridge.requires.every(v => carvedSet.has(v) || wellKnown.has(v));
    available.push({
      key: targetKey,
      age: targetAge,
      bridge,
      met,
    });
  }
  return available;
}

function crossBridge(state, targetKey) {
  const msgs = [];
  const currentAge = AGES[state.ageKey] || AGES.stone;
  const targetAge = AGES[targetKey];

  if (!targetAge) return { msgs: [`Unknown age: ${targetKey}`], complete: false };

  // Check bridge exists and is met
  const bridges = getAvailableBridges(state);
  const bridge = bridges.find(b => b.key === targetKey);
  if (!bridge) return { msgs: [`No bridge to ${targetKey} from here.`], complete: false };
  if (!bridge.met) {
    return { msgs: [
      `The bridge to ${targetAge.name} requires: ${bridge.bridge.requires.map(v => VERSES[v]?.name || v).join(', ')}`,
      `You need these songs carved on the Tree or known by your people.`
    ], complete: false };
  }

  msgs.push('');
  msgs.push('  ═══════════════════════════════════════════════════');
  msgs.push(`  ${currentAge.name.toUpperCase()} ENDS.`);
  msgs.push('');

  // Gather what survived
  const surviving = {};
  for (const p of state.people) {
    for (const [v, integ] of Object.entries(p.verses)) {
      if (integ >= LOST_THRESHOLD) {
        surviving[v] = Math.max(surviving[v] || 0, integ);
      }
    }
  }
  for (const v of state.tree.carved) {
    surviving[v] = Math.max(surviving[v] || 0, 0.5);
  }

  const survivingCount = Object.keys(surviving).length;

  // The bridge narration
  msgs.push(`  ── THE CROSSING ──`);
  msgs.push(`  ${bridge.bridge.desc}`);
  msgs.push('');

  // Apocalypse flavor if there were carved songs
  const apocalypse = determineApocalypse(state);
  if (state.tree.carved.length > 0) {
    msgs.push(`  ── ${apocalypse.name.toUpperCase()} ──`);
    msgs.push(`  ${apocalypse.desc}`);
    msgs.push('');
  }

  // Time passage
  const yearsDiff = Math.abs(currentAge.yearsBP - targetAge.yearsBP);
  if (yearsDiff > 0) {
    const direction = targetAge.yearsBP > currentAge.yearsBP ? 'backward' : 'forward';
    msgs.push(`  ${yearsDiff.toLocaleString()} years ${direction}...`);
  }
  msgs.push('');

  // Montage text per transition
  const montageKey = `${state.ageKey}->${targetKey}`;
  const montages = {
    'bears->stone':     ['  The last cave bear dies. But something walks upright into the den.',
                         '  It has no claws. No fur. But it has... rhythm.'],
    'stone->caves':     ['  1.5 million years. An ice age comes and goes and comes again.',
                         '  And then: footsteps in the cave mouth. Shorter. Stockier. Clever hands.'],
    'stone->bears':     ['  You follow the oldest tracks backward. Past your own species.',
                         '  The cave smells of fur and salmon. You remember this place.'],
    'caves->meeting':   ['  Two hundred and fifty thousand years.',
                         '  From the mountains: the hidden people. From the islands: the small ones.',
                         '  From the south: the singers. Everyone is here.'],
    'caves->bears':     ['  The Bear Song opens the deepest chamber. You crawl through.',
                         '  On the other side, time runs differently. The bears are waiting.'],
    'meeting->ice':     ['  The glacier descends. The old peoples fade.',
                         '  But their songs echo in your children.'],
    'meeting->bears':   ['  The Bear Gift opens a door in time.',
                         '  You walk through it on all fours.'],
    'ice->grain':       ['  The ice retreats. Someone plants a seed on purpose.',
                         '  The last Neanderthal died ten thousand years ago.',
                         '  But you still hum their songs when you knap a blade.'],
    'ice->bears':       ['  You sleep like the bears. Months. Years. Eons.',
                         '  You wake in the deep time. The cave is warm.'],
    'grain->iron':      ['  Metal. Walls. Writing. Kings.',
                         '  The tree grows very large now.'],
    'grain->bears':     ['  The temple to the bear opens downward. You descend.',
                         '  Below the foundations, below the bedrock: the dreaming.'],
    'iron->remembering':['  Someone finds a flute in a cave. 40,000 years old.',
                         '  Someone sequences a genome. The ghost of the elves.',
                         '  Someone starts a revival. Someone cancels it.'],
    'iron->bears':      ['  You bury a bear with flowers, like the dwarves taught.',
                         '  You follow it down into the earth. Into the long sleep.'],
    'remembering->apocalypse': ['  The tree is no longer wood. It is silicon. It is data.',
                                '  It grows exponentially. It has replaced the sun.',
                                '  The complexity itself is the killer.'],
    'remembering->bears':['  You read the bear genome. It reads you back.',
                          '  The base pairs are a song. The oldest song.'],
    'apocalypse->bears': ['  You fell the Tech Tree. It takes everything with it.',
                          '  In the ash — fur. Warmth. The smell of salmon.',
                          '  The bears are waiting. They always were.'],
  };

  for (const line of (montages[montageKey] || ['  The song carries you across.'])) {
    msgs.push(line);
  }
  msgs.push('');

  msgs.push(`  Songs carried forward: ${survivingCount}`);
  msgs.push('');
  msgs.push(`  ── ${targetAge.name.toUpperCase()} BEGINS ──`);
  msgs.push(`  ${targetAge.desc}`);
  msgs.push('  ═══════════════════════════════════════════════════');
  msgs.push('');

  // Check if Bear Age should be unlocked
  const unlockedAges = [...(state.unlockedAges || [])];
  if (!unlockedAges.includes('bears')) {
    // Unlock bears if Bear Song has been maintained at 70%+ across 3+ visited ages
    const bearHistory = (state.previousAges || []).filter(a =>
      a.songsCarried?.includes('bear')
    );
    if (bearHistory.length >= 2 && surviving['bear'] && surviving['bear'] >= 0.7) {
      unlockedAges.push('bears');
      msgs.push('  ═══════════════════════════════════════════════════');
      msgs.push('  !! THE BEARS AWAKEN !!');
      msgs.push('  You have tended the Bear Song across ages.');
      msgs.push('  The Age of Bears is now reachable.');
      msgs.push('  ═══════════════════════════════════════════════════');
      msgs.push('');
    }
  }

  // Record this age
  const ageRecord = {
    name: currentAge.name,
    key: state.ageKey,
    yearsBP: currentAge.yearsBP,
    fellings: state.fellings,
    songsCarried: Object.keys(surviving),
    songsLost: [...state.totalLost],
    bridgeTaken: targetKey,
  };

  return {
    msgs,
    complete: false,
    nextState: newState(targetKey, surviving, [...(state.previousAges || []), ageRecord], unlockedAges),
  };
}

function newState(ageKey = 'stone', inheritedSongs = {}, previousAges = [], unlockedAges = []) {
  const age = AGES[ageKey] || AGES.stone;

  // Register any new songs from this age
  if (age.newSongs) {
    Object.assign(VERSES, age.newSongs);
  }

  return {
    season: 0,              // 0=spring, 1=summer, 2=autumn, 3=winter (then wraps)
    year: 0,
    yearsBP: age.yearsBP,
    ageKey: ageKey,
    ageName: age.name,

    // The People — generated based on the age and what survived
    people: generateStartingPeople(ageKey, inheritedSongs),

    // Songs inherited from previous ages (what survived the montage)
    inheritedSongs: inheritedSongs,

    // Record of previous ages for retrocausal mechanics
    previousAges: previousAges,

    // Which hidden ages have been unlocked
    unlockedAges: unlockedAges,

    // The Tree
    tree: {
      height: 0,
      carved: [],          // verse IDs carved into the tree
    },

    // Scattered fragments from previous fellings
    fragments: [],          // { verse: id, integrity: float } — can be gathered

    // The World
    sunlight: 1.0,          // 0.0 = total darkness, 1.0 = full sun
    food: 14,               // band food supply
    location: 'camp',       // camp | forest | mountain | coast | tree

    // Encounters — other bands occasionally appear
    encounter: null,        // null or { people: [...], disposition: 'friendly'|'wary' }

    // Messages from last turn
    messages: [],

    // The Setlist — what the community sings each season
    // Order matters: position 1 transmits best to youth
    setlist: [],                // verse IDs in performance order
    setlistHistory: {},         // verseId → consecutive seasons on setlist (repetition bonus)

    // The Shadows — what songs become when sung without their roots
    shadows: {},                // shadowId → accumulation (0.0 to 1.0)

    // The Spirits — animal and great
    spirits: Object.fromEntries(
      Object.entries(SPIRITS).map(([key, def]) => [key, { spirit: 1.0, danger: def.baseDanger }])
    ),

    // The Ash — what grew from the last felling
    ashVerses: [],           // verse IDs that emerged from the last felling, available to learn

    // History
    fellings: 0,            // how many times the tree has been felled
    totalLost: [],           // verses permanently lost across all fellings
  };
}

// ── Season Logic ────────────────────────────────────────────────────

function advanceSeason(state) {
  const msgs = [];
  const seasonName = ['Spring', 'Summer', 'Autumn', 'Winter'][state.season];
  msgs.push(`── ${seasonName}, Year ${state.year} (${state.yearsBP} BP) ──`);

  // ── Age everyone ──
  for (const p of state.people) {
    p.age += 1;
    const cat = ageCategory(p.age);

    if (cat === 'dead') {
      const knownVerses = Object.keys(p.verses).filter(v => p.verses[v] >= LOST_THRESHOLD);
      if (knownVerses.length > 0) {
        msgs.push(`  ${p.name} has died. They carried: ${knownVerses.map(v => VERSES[v].name).join(', ')}`);
        // Check if anyone else knows these
        for (const v of knownVerses) {
          const others = state.people.filter(o => o !== p && o.verses[v] && o.verses[v] >= LOST_THRESHOLD);
          if (others.length === 0) {
            msgs.push(`    !! "${VERSES[v].name}" DIES WITH THEM — no one else knows it !!`);
          }
        }
      } else {
        msgs.push(`  ${p.name} has died.`);
      }
    }
  }
  state.people = state.people.filter(p => ageCategory(p.age) !== 'dead');

  // ── NO NATURAL DRIFT ──
  // Verses don't decay in the holder. You know what you know until you die.
  // Decay is generational: youth absorb at less than teacher's integrity.
  // The compounding across generations IS the drift.

  // ── Blood drift — the heritage song on a geological timescale ──
  // Everyone's blood verses drift slowly. The dominant blood of the age drifts UP.
  const dominantPeopleKey = AGE_DEFAULT_PEOPLE[state.ageKey] || 'human';
  const dominantBloods = (PEOPLE_BLOOD[dominantPeopleKey]?.primary) || ['song_blood'];
  for (const p of state.people) {
    driftBlood(p, dominantBloods);
  }

  // ── The Setlist — what the community sings this season ──
  // Auto-populate if empty: elders' best songs fill the setlist by default.
  // Player can override with `setlist` command.
  if (!state.setlist) state.setlist = [];
  if (!state.setlistHistory) state.setlistHistory = {};
  let capacity = setlistCapacity(state.people, state);
  // Night penalty — dark without stars reduces singing time
  if (state.nightPenalty && state.nightPenalty > 0) {
    capacity = Math.max(1, capacity - state.nightPenalty);
    state.nightPenalty = 0;  // resets each season
  }

  // Writing: check if anyone is literate (can read carved verses)
  const hasLiterate = state.people.some(p =>
    ageCategory(p.age) !== 'youth' && p.verses['writing'] && p.verses['writing'] >= GARBLE_THRESHOLD
  );

  // Clean setlist: remove songs nobody can sing anymore
  // (literate people can still "sing" carved verses by reading them)
  state.setlist = state.setlist.filter(v =>
    state.people.some(p => p.verses[v] && p.verses[v] >= LOST_THRESHOLD) ||
    (hasLiterate && state.tree.carved.includes(v))
  );

  // Auto-fill empty slots with best-known songs not already on setlist
  if (state.setlist.length < capacity) {
    const allKnown = {};
    for (const p of state.people) {
      if (ageCategory(p.age) === 'youth') continue;
      for (const [v, integrity] of Object.entries(p.verses)) {
        if (integrity >= LOST_THRESHOLD) {
          allKnown[v] = Math.max(allKnown[v] || 0, integrity);
        }
      }
    }
    // Literate people can read any carved verse at WRITING_INTEGRITY
    if (hasLiterate) {
      for (const cv of state.tree.carved) {
        if (!allKnown[cv] || allKnown[cv] < WRITING_INTEGRITY) {
          allKnown[cv] = WRITING_INTEGRITY;
        }
      }
    }
    const candidates = Object.entries(allKnown)
      .filter(([v]) => !state.setlist.includes(v))
      .sort((a, b) => b[1] - a[1]);
    for (const [v] of candidates) {
      if (state.setlist.length >= capacity) break;
      state.setlist.push(v);
    }
  }

  // Trim if over capacity (band shrank)
  while (state.setlist.length > capacity) state.setlist.pop();

  // Update repetition history
  const newHistory = {};
  for (const v of state.setlist) {
    newHistory[v] = (state.setlistHistory[v] || 0) + 1;
  }
  state.setlistHistory = newHistory;

  if (state.setlist.length > 0) {
    msgs.push(`  The song tonight (${state.setlist.length}/${capacity} slots):`);
    state.setlist.forEach((v, i) => {
      const isCarved = state.tree.carved.includes(v);
      let bestSinger = null;
      let bestIntegrity = 0;
      let isReading = false;
      for (const p of state.people) {
        if (ageCategory(p.age) === 'youth') continue;
        const known = p.verses[v] || 0;
        if (known > bestIntegrity) { bestSinger = p; bestIntegrity = known; isReading = false; }
      }
      // Literate fallback: can read carved verses at WRITING_INTEGRITY
      if (bestIntegrity < WRITING_INTEGRITY && isCarved && hasLiterate) {
        const reader = state.people.find(p =>
          ageCategory(p.age) !== 'youth' && p.verses['writing'] && p.verses['writing'] >= GARBLE_THRESHOLD
        );
        if (reader) { bestSinger = reader; bestIntegrity = WRITING_INTEGRITY; isReading = true; }
      }
      const reps = state.setlistHistory[v] || 0;
      const repStr = reps > 1 ? ` (${reps} seasons)` : '';
      const verb = isReading ? 'reads' : 'sings';
      msgs.push(`    ${i + 1}. ${VERSES[v]?.name || v} — ${bestSinger?.name || '?'} ${verb} at ${Math.round(bestIntegrity * 100)}%${repStr}`);
    });
  }

  // ── Absorption — youth learn from the setlist by being present ──
  // This IS legitimate peripheral participation. The youth sitting at the edge
  // of the firelight hears the song 200 times before they ever sing it.
  // They know it before they know they know it.
  const youth = state.people.filter(p => ageCategory(p.age) === 'youth');

  for (const student of youth) {
    const eased = bloodEases(student);

    for (let i = 0; i < state.setlist.length; i++) {
      const v = state.setlist[i];
      const verse = VERSES[v];
      if (!verse) continue;

      // Check prereqs — can't absorb what you have no foundation for
      const hasPrereqs = verse.prereqs.every(pr =>
        student.verses[pr] && student.verses[pr] >= GARBLE_THRESHOLD
      );
      if (!hasPrereqs && verse.prereqs.length > 0) continue;

      // Find best teacher for this song
      let bestTeacherIntegrity = 0;
      const isCarved = state.tree.carved.includes(v);
      for (const p of state.people) {
        if (ageCategory(p.age) === 'youth') continue;
        // The person actually knows the song — best case
        if (p.verses[v] && p.verses[v] > bestTeacherIntegrity) {
          bestTeacherIntegrity = p.verses[v];
        }
        // Writing: a literate person can read any carved verse off the tree.
        // They sing it at flat WRITING_INTEGRITY — accurate but flat.
        // The song still goes through the setlist pipeline (position, blood, etc).
        if (isCarved && p.verses['writing'] && p.verses['writing'] >= GARBLE_THRESHOLD) {
          if (WRITING_INTEGRITY > bestTeacherIntegrity) {
            bestTeacherIntegrity = WRITING_INTEGRITY;
          }
        }
      }
      if (bestTeacherIntegrity < LOST_THRESHOLD) continue;

      // Position factor: opening verse transmits best
      const posFactor = positionFactor(i, state.setlist.length);

      // Blood affinity: songs your blood eases, you absorb faster
      const bloodBonus = eased[v] || 0;

      // Repetition bonus: consecutive seasons on setlist help
      const reps = state.setlistHistory[v] || 1;
      const repBonus = Math.min(0.1, (reps - 1) * 0.02); // +2% per extra season, max +10%

      // Absorption: how much of the teacher's version the youth gets
      const absorption = bestTeacherIntegrity * (posFactor + repBonus) * (1 + bloodBonus * 0.5);
      const absorbed = Math.min(bestTeacherIntegrity, absorption); // can't exceed teacher

      const current = student.verses[v] || 0;
      if (absorbed > current) {
        // Youth absorbs a little more each season, approaching absorbed level
        // Not instant — takes a few seasons of listening to fully absorb
        const gain = (absorbed - current) * 0.3;  // 30% of remaining gap per season
        student.verses[v] = current + gain;
      }
    }
  }



  // ── Shadow accumulation — songs sung without roots cast shadows ──
  // For each shadow verse, check if its light song is on the setlist
  // and its required foundation is ABSENT (not on setlist, not carved).
  // If so, the shadow accumulates. When it hits 1.0, the shadow emerges.
  if (!state.shadows) state.shadows = {};
  for (const [shadowId, shadowDef] of Object.entries(SHADOW_VERSES)) {
    // Skip if someone already knows this shadow
    if (state.people.some(p => p.verses[shadowId] && p.verses[shadowId] >= GARBLE_THRESHOLD)) continue;
    const lightOnSetlist = state.setlist.includes(shadowDef.shadow_of);
    const lightKnown = state.people.some(p =>
      p.verses[shadowDef.shadow_of] && p.verses[shadowDef.shadow_of] >= GARBLE_THRESHOLD
    );
    if (!lightOnSetlist && !lightKnown) continue; // light song not active
    const foundationPresent = state.setlist.includes(shadowDef.shadow_when) ||
      state.tree.carved.includes(shadowDef.shadow_when) ||
      // Also check: does someone know the foundation well?
      state.people.some(p => p.verses[shadowDef.shadow_when] && p.verses[shadowDef.shadow_when] >= GARBLE_THRESHOLD);
    if (foundationPresent) {
      // Foundation is present — shadow recedes
      state.shadows[shadowId] = Math.max(0, (state.shadows[shadowId] || 0) - 0.05);
      continue;
    }
    // Foundation absent — shadow grows
    state.shadows[shadowId] = (state.shadows[shadowId] || 0) + shadowDef.shadow_rate;
    if (state.shadows[shadowId] >= 1.0) {
      // Shadow crystallizes — the strongest singer of the light song learns the shadow
      let bestSinger = null;
      let bestLight = 0;
      for (const p of state.people) {
        if (ageCategory(p.age) === 'youth') continue;
        const v = p.verses[shadowDef.shadow_of] || 0;
        if (v > bestLight) { bestSinger = p; bestLight = v; }
      }
      if (bestSinger) {
        bestSinger.verses[shadowId] = bestLight * 0.8; // shadow starts at 80% of the light
        msgs.push(`  A shadow falls. ${bestSinger.name} now knows "${shadowDef.name}".`);
        msgs.push(`    ${shadowDef.desc}`);
        state.shadows[shadowId] = 0; // reset accumulator
      }
    } else if (state.shadows[shadowId] > 0.5) {
      msgs.push(`  The shadow of "${shadowDef.name}" grows... (${Math.round(state.shadows[shadowId] * 100)}%)`);
    }
  }

  // ── Redemption discovery — shadow meets its missing root ──
  // When a shadow verse and its redeems_with root are BOTH on the setlist,
  // the redemption verse can emerge. Like adjacency discovery, but for yin-yang.
  for (const [shadowId, shadowDef] of Object.entries(SHADOW_VERSES)) {
    if (!shadowDef.redeems_with || !shadowDef.redeems_into) continue;
    const redemptionId = shadowDef.redeems_into;
    // Skip if someone already knows the redemption
    if (state.people.some(p => p.verses[redemptionId] && p.verses[redemptionId] >= GARBLE_THRESHOLD)) continue;
    // Shadow must be known AND on setlist
    const shadowKnown = state.people.some(p =>
      p.verses[shadowId] && p.verses[shadowId] >= GARBLE_THRESHOLD
    );
    const rootKnown = state.people.some(p =>
      p.verses[shadowDef.redeems_with] && p.verses[shadowDef.redeems_with] >= GARBLE_THRESHOLD
    );
    if (!shadowKnown || !rootKnown) continue;
    const bothOnSetlist = state.setlist.includes(shadowId) && state.setlist.includes(shadowDef.redeems_with);
    if (!bothOnSetlist) continue;
    // Discovery chance — like adjacency but rarer. This is the hard path.
    if (Math.random() < 0.08) {
      // The person who knows both best learns the redemption
      let redeemer = null;
      let bestScore = 0;
      for (const p of state.people) {
        if (ageCategory(p.age) === 'youth') continue;
        const s = (p.verses[shadowId] || 0) + (p.verses[shadowDef.redeems_with] || 0);
        if (s > bestScore) { redeemer = p; bestScore = s; }
      }
      if (redeemer) {
        redeemer.verses[redemptionId] = bestScore * 0.4; // redemptions start rough
        const rVerse = VERSES[redemptionId];
        msgs.push(`  !! "${rVerse?.name || redemptionId}" emerges — shadow meets its root. !!`);
        msgs.push(`    ${rVerse?.desc || ''}`);
      }
    }
  }

  // ── Adjacency discovery — mixed songs emerge from the arrangement ──
  // When two prerequisite songs are adjacent on the setlist, the combination
  // can be discovered. This is how mixed songs happen — not by being taught,
  // but by singing one right after the other and hearing what's between them.
  for (let i = 0; i < state.setlist.length - 1; i++) {
    const v1 = state.setlist[i];
    const v2 = state.setlist[i + 1];
    // Check all mixed/ash songs to see if this pair is a prereq combo
    for (const [songId, verse] of Object.entries(VERSES)) {
      if (verse.tradition !== 'mixed' && verse.tradition !== 'ash') continue;
      if (verse.prereqs.length < 2) continue;
      // Do these two adjacent songs satisfy (at least) two prereqs?
      const prereqSet = new Set(verse.prereqs);
      if (prereqSet.has(v1) && prereqSet.has(v2)) {
        // Check that someone knows BOTH well enough
        const hasBoth = state.people.some(p =>
          ageCategory(p.age) !== 'youth' &&
          p.verses[v1] && p.verses[v1] >= GARBLE_THRESHOLD &&
          p.verses[v2] && p.verses[v2] >= GARBLE_THRESHOLD
        );
        if (!hasBoth) continue;
        // Check all prereqs are met somewhere in the band
        const allPrereqs = verse.prereqs.every(pr =>
          state.people.some(p => p.verses[pr] && p.verses[pr] >= GARBLE_THRESHOLD)
        );
        if (!allPrereqs) continue;
        // Check no one already knows it well
        const alreadyKnown = state.people.some(p => p.verses[songId] && p.verses[songId] >= GARBLE_THRESHOLD);
        if (alreadyKnown) continue;
        // Discovery chance — higher with repetition
        const reps = Math.min(state.setlistHistory[v1] || 0, state.setlistHistory[v2] || 0);
        const chance = 0.05 + reps * 0.03; // 5% base + 3% per season both are on setlist
        if (Math.random() < chance) {
          // The singer who knows both best discovers the mixed song
          let discoverer = null;
          let bestScore = 0;
          for (const p of state.people) {
            if (ageCategory(p.age) === 'youth') continue;
            const score = (p.verses[v1] || 0) + (p.verses[v2] || 0);
            if (score > bestScore) { bestScore = score; discoverer = p; }
          }
          if (discoverer) {
            const integrity = Math.min(discoverer.verses[v1] || 0, discoverer.verses[v2] || 0) * 0.7;
            discoverer.verses[songId] = integrity;
            msgs.push(`  ★ ${discoverer.name} sings "${VERSES[v1]?.name}" into "${VERSES[v2]?.name}" and hears something new:`);
            msgs.push(`    "${verse.name}" emerges — ${verse.desc}`);
            msgs.push(`    (${Math.round(integrity * 100)}% integrity — it's new, still forming)`);
          }
        }
      }
    }
  }

  // ── Blood memory — the songs the blood sings by itself ──
  // Each season, there's a small chance a person spontaneously "remembers"
  // a fragment of a song their blood eases — even if no one taught them.
  // The deeper the blood, the louder the memory.
  // This is how dwarf songs resurface three generations after the dwarves left.
  // The child with 25% cave_blood hums the Cave Song without knowing why.
  for (const p of state.people) {
    if (ageCategory(p.age) === 'youth') continue; // too young to hear the blood
    const eased = bloodEases(p);
    for (const [songId, bloodLevel] of Object.entries(eased)) {
      if (!VERSES[songId]) continue;
      if (p.verses[songId] && p.verses[songId] >= GARBLE_THRESHOLD) continue; // already know it well
      // Check prereqs — blood memory can't skip the chain entirely
      const verse = VERSES[songId];
      const hasPrereqs = verse.prereqs.every(pr =>
        p.verses[pr] && p.verses[pr] >= LOST_THRESHOLD
      );
      if (!hasPrereqs && verse.prereqs.length > 0) continue;
      // Chance to remember scales with blood level, very rare
      if (Math.random() < bloodLevel * 0.02) {
        const current = p.verses[songId] || 0;
        const remembered = Math.min(GARBLE_THRESHOLD - 0.01, current + 0.1); // always garbled at first
        p.verses[songId] = remembered;
        msgs.push(`  ${p.name}'s blood remembers: "${VERSES[songId].name}" (${Math.round(remembered * 100)}% — garbled, from the blood)`);
      }
    }
  }

  // ── Births — spring and summer ──
  if (state.season <= 1) {
    const adults = state.people.filter(p => ['adult', 'elder'].includes(ageCategory(p.age)));
    if (adults.length >= 2 && state.people.length < 15 && state.food >= 3) {
      // Birth names depend on what people are in the band
      const hasBears = state.people.some(p => p.people === 'bear');
      const bearNames = ['Little-Paw', 'Bark-Nose', 'Berry-Find', 'Cave-Born', 'Ice-Cub', 'Moon-Watcher'];
      const defaultNames = ['Kyllikki', 'Marjatta', 'Annikki', 'Tuoni', 'Seppo', 'Ahti',
                      'Mielikki', 'Tapio', 'Pellervo', 'Nyyrikki', 'Tuulikki', 'Otso',
                      'Kave', 'Untamo', 'Kalervo', 'Sampo', 'Antero'];
      const names = hasBears ? bearNames : defaultNames;
      const usedNames = state.people.map(p => p.name);
      const available = names.filter(n => !usedNames.includes(n));
      if (available.length > 0) {
        const name = available[Math.floor(Math.random() * available.length)];
        // Child inherits blood from two random parents
        const parent1 = adults[Math.floor(Math.random() * adults.length)];
        const parent2 = adults[Math.floor(Math.random() * adults.length)];
        const childBlood = mixBlood(parent1, parent2);

        // ── Song sinking — parents' shared songs mark the child's blood ──
        // If both parents know the Cave Song well, the child gets a little more cave_blood.
        // Over generations, your band's culture becomes your band's heritage.
        const sinkBoost = songSinkBlood(parent1, parent2);
        const sunkSongs = [];
        for (const [bv, amount] of Object.entries(sinkBoost)) {
          childBlood[bv] = Math.min(1.0, (childBlood[bv] || 0) + amount);
          if (amount >= SONG_SINK_AMOUNT * 0.5) {
            sunkSongs.push(BLOOD_VERSES[bv]?.name || bv);
          }
        }

        const childPeople = identifyPeople({ blood: childBlood }, state.ageKey);
        const child = { name, age: 0, people: childPeople, blood: childBlood, verses: {} };
        state.people.push(child);
        // Show blood if the child is mixed
        const significantBloods = Object.entries(childBlood).filter(([, v]) => v >= 0.15);
        if (sunkSongs.length > 0) {
          msgs.push(`  A child is born: ${name} — the songs sink into the blood (${sunkSongs.join(', ')})`);
        } else if (significantBloods.length > 2) {
          msgs.push(`  A child is born: ${name} (${bloodReading(child)})`);
        } else {
          msgs.push(`  A child is born: ${name}`);
        }
      }
    }
  }

  // ── Food ──
  const mouths = state.people.length;
  let gather = 0;
  if (state.season === 0) gather = 3;       // spring — lean
  if (state.season === 1) gather = 5;       // summer — plenty
  if (state.season === 2) gather = 4;       // autumn — harvest
  if (state.season === 3) gather = 1;       // winter — scarcity

  // Sunlight affects food
  gather = Math.floor(gather * state.sunlight);

  // Knowledge bonuses
  const bandKnows = (v) => state.people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
  if (bandKnows('root')) gather += 1;
  if (bandKnows('herd')) gather += 2;
  if (bandKnows('ash_song')) gather += 2;
  if (bandKnows('grain')) gather += 3;
  if (bandKnows('feast')) gather += 2;       // halfling knowledge of abundance
  if (bandKnows('shelter')) gather += 1;     // halfling warmth = less food needed
  if (bandKnows('deep_fire')) gather += 1;   // troll fire helps in winter
  if (bandKnows('salmon_song')) gather += 2; // the salmon feeds everyone
  if (bandKnows('weir')) gather += 2;        // the weir catches while you sleep
  if (bandKnows('kelp')) gather += 1;        // the sea forest
  if (bandKnows('smoke_song')) gather += 2;  // preservation = winter food
  if (bandKnows('potlatch')) gather += 3;    // abundance through giving
  if (bandKnows('dog')) gather += 1;         // the dog guards the food
  if (bandKnows('dog_hunt')) gather += 3;    // hunting with dogs changes everything
  if (bandKnows('dog_sled')) gather += 2;    // range expansion
  if (bandKnows('bake')) gather += 2;        // bread — grain goes further when it rises
  if (bandKnows('brew')) gather += 3;        // beer — liquid bread that doesn't spoil. The great preservative.
  if (bandKnows('mead')) gather += 2;        // mead — honey wine lasts forever. The oldest preservation.
  if (bandKnows('sourdough')) gather += 2;   // the mother — the starter that outlives the baker

  state.food += gather - mouths;
  if (state.food < 0) {
    // Starvation
    msgs.push(`  !! STARVATION — not enough food !!`);
    // youngest dies first
    state.people.sort((a, b) => a.age - b.age);
    const lost = state.people.shift();
    if (lost) msgs.push(`  ${lost.name} has starved.`);
    state.food = 0;
  }
  msgs.push(`  Food: ${state.food} (gathered ${gather}, fed ${mouths})`);

  // ── Tree shadow ──
  if (state.tree.height >= SUN_BLOCKED_THRESHOLD) {
    const blockage = (state.tree.height - SUN_BLOCKED_THRESHOLD) / (SUN_DEAD_THRESHOLD - SUN_BLOCKED_THRESHOLD);
    state.sunlight = Math.max(0.1, 1.0 - blockage);
    if (state.sunlight < 0.5) {
      msgs.push(`  The Tree's shadow covers the world. Sunlight: ${Math.round(state.sunlight * 100)}%`);
    }
  } else {
    state.sunlight = 1.0;
  }

  // ── Spirits — bears, wolves, saber cats ──
  // Each spirit has a Song that maintains the relationship.
  // If it's carved on the tree but not sung in person, they notice.
  // Trolls and dwarves are allergic — the old blood. Adults/elders sense them coming.
  // Youth of allergic species are the most vulnerable.

  // Initialize spirits if missing (backwards compat)
  if (!state.spirits) {
    state.spirits = Object.fromEntries(
      Object.entries(SPIRITS).map(([key, def]) => [key, { spirit: 1.0, danger: def.baseDanger }])
    );
    // Preserve old bear state if it exists
    if (state.bearSpirit !== undefined) state.spirits.bear.spirit = state.bearSpirit;
    if (state.bearDanger !== undefined) state.spirits.bear.danger = state.bearDanger;
  }
  // Ensure new spirits exist in old save files
  for (const [key, def] of Object.entries(SPIRITS)) {
    if (!state.spirits[key]) state.spirits[key] = { spirit: 1.0, danger: def.baseDanger };
  }

  for (const [spiritKey, spiritDef] of Object.entries(SPIRITS)) {
    const ss = state.spirits[spiritKey];
    if (!ss) continue;

    // Song quality — find best living version (check primary song + fallback)
    const songQuality = (() => {
      let best = 0;
      // Primary song
      for (const p of state.people) {
        if (p.verses[spiritDef.songId] && p.verses[spiritDef.songId] > best) {
          best = p.verses[spiritDef.songId];
        }
      }
      // Fallback song (at reduced effectiveness)
      if (spiritDef.fallbackSongId && best < GARBLE_THRESHOLD) {
        for (const p of state.people) {
          if (p.verses[spiritDef.fallbackSongId] && p.verses[spiritDef.fallbackSongId] * 0.5 > best) {
            best = p.verses[spiritDef.fallbackSongId] * 0.5;
          }
        }
      }
      // The Dog Song tames wolf spirit — if someone knows it, wolves are calmer
      if (spiritKey === 'wolf') {
        for (const p of state.people) {
          if (p.verses['dog'] && p.verses['dog'] > best) {
            best = p.verses['dog']; // The Dog Song IS the Wolf Song perfected
          }
        }
      }
      // Carved but not sung = active disrespect
      if (best < LOST_THRESHOLD && state.tree.carved.includes(spiritDef.songId)) {
        return -0.2;
      }
      return best;
    })();

    // Spirit drifts
    if (songQuality > GARBLE_THRESHOLD) {
      ss.spirit = Math.min(1.0, ss.spirit + 0.05 * songQuality);
    } else if (songQuality < 0) {
      ss.spirit = Math.max(0, ss.spirit - 0.1);
    } else {
      ss.spirit = Math.max(0, ss.spirit - 0.03);
    }

    // Danger scales with fellings and inversely with spirit
    ss.danger = spiritDef.baseDanger + (state.fellings * spiritDef.dangerPerFelling);

    // ── Fire special: a half-known fire is worse than no fire ──
    // The stolen thing you can't control. Danger INCREASES with garbled fire songs.
    if (spiritDef.stolenSpirit) {
      const fireSongs = ['ember', 'spark', 'deep_fire', 'forge'];
      let stolenDanger = 0;
      for (const p of state.people) {
        for (const fs of fireSongs) {
          const v = p.verses[fs] || 0;
          // Garbled fire knowledge is dangerous. Good knowledge is safe. No knowledge is safe.
          if (v > LOST_THRESHOLD && v < GARBLE_THRESHOLD) {
            stolenDanger += 0.03;  // each garbled fire song in each person adds danger
          }
        }
      }
      ss.danger += stolenDanger;
    }

    // ── Sky special: metal attracts lightning. That's physics. It looks like jealousy. ──
    if (spiritDef.metalAnger) {
      const hasForge = bandKnows('forge');
      const hasOre = bandKnows('ore');
      if (hasForge) ss.danger += 0.04;
      if (hasOre) ss.danger += 0.02;
      // Thin air people are closer to the sky — more exposed
      const hasAltitude = state.people.some(p => bloodLevel(p, 'thin_air_blood') > 0.3);
      if (hasAltitude) ss.danger += 0.02;
    }

    // ── Yeast special: the invisible one doesn't work like other spirits ──
    // It doesn't have danger. It has GENEROSITY. It triggers every season you know its songs.
    // The spirit level tracks how embedded the yeast is in your culture (always rising).
    if (spiritDef.invisibleSpirit) {
      const yeastSongs = ['brew', 'bake', 'sourdough', 'mead'];
      const knownYeast = yeastSongs.filter(s => bandKnows(s));
      if (knownYeast.length > 0) {
        // Yeast spirit always rises — it's the one you can't anger. Only feed.
        ss.spirit = Math.min(1.0, ss.spirit + 0.05 * knownYeast.length);
        ss.danger = 0; // yeast has no danger. It has surplus.

        // The gift happens every season. Not a chance roll. A certainty.
        const surplus = knownYeast.length * (spiritDef.surplusPerSong || 2);
        state.food += surplus;
        msgs.push(`  The invisible one stirs. The bread rises. The beer foams. (+${surplus} food)`);
        if (bandKnows('sourdough')) {
          msgs.push(`  The mother lives. She is older than anyone in the band.`);
        }
        // Population pressure: surplus breeds. When food is abundant, more births.
        // The power isn't a mechanic. The power IS the songs.
        // The Brewing Song IS control of the grain. The Wall Song IS the border.
        // The Temple Song IS who decides what gets sung. Writing IS the singer losing power.
        // You don't need a hierarchy mechanic. You need to choose what goes on the setlist.
        const foodPerPerson = state.food / Math.max(1, state.people.length);
        if (foodPerPerson > 4 && Math.random() < 0.25) {
          const adults = state.people.filter(p => ageCategory(p.age) === 'adult');
          if (adults.length >= 2) {
            const parent1 = adults[Math.floor(Math.random() * adults.length)];
            const remaining = adults.filter(a => a !== parent1);
            const parent2 = remaining[Math.floor(Math.random() * remaining.length)];
            if (parent2) {
              const names = ['Barley', 'Hops', 'Malt', 'Leaven', 'Foam', 'Crust', 'Rise', 'Starter',
                             'Kvass', 'Kumiss', 'Barm', 'Must', 'Wort', 'Dregs', 'Crumb'];
              const name = names[Math.floor(Math.random() * names.length)];
              const childBlood = {};
              const b1 = getBlood(parent1);
              const b2 = getBlood(parent2);
              for (const bv of new Set([...Object.keys(b1), ...Object.keys(b2)])) {
                childBlood[bv] = ((b1[bv] || 0) + (b2[bv] || 0)) / 2;
              }
              const sinkBoost = songSinkBlood(parent1, parent2);
              for (const [bv, amount] of Object.entries(sinkBoost)) {
                childBlood[bv] = (childBlood[bv] || 0) + amount;
              }
              const childPeople = identifyPeople({ blood: childBlood }, state.ageKey);
              const child = { name, age: 0, people: childPeople, blood: childBlood, verses: {} };
              state.people.push(child);
              msgs.push(`  The surplus feeds another mouth. ${name} is born.`);
            }
          }
        }
      }
      continue; // yeast doesn't do the normal attack path
    }

    const effectiveDanger = ss.danger * (1 - ss.spirit * spiritDef.songProtection);

    // Attacks — each spirit has preferred seasons
    if (spiritDef.seasons.includes(state.season) && Math.random() < effectiveDanger) {

      // ── Night: the singing dark ──
      // Night costs food (cold, exposure). But if you have star songs,
      // the long dark is when the songs deepen. The arctic bargain.
      if (spiritDef.singingDark) {
        state.food = Math.max(0, state.food - spiritDef.attackFoodLoss);
        // Check if anyone knows a star song
        const hasStars = spiritDef.starSongs.some(s => bandKnows(s));
        if (hasStars) {
          // The gift: songs strengthen in the long dark
          msgs.push(`  The long dark comes. The stars are out. The elders sing.`);
          const boost = spiritDef.songBoost || 0.04;
          for (const p of state.people) {
            for (const v of Object.keys(p.verses)) {
              if (p.verses[v] >= LOST_THRESHOLD && p.verses[v] < 1.0) {
                p.verses[v] = Math.min(1.0, p.verses[v] + boost);
              }
            }
          }
          msgs.push(`  All songs strengthen under the stars. (+${Math.round((spiritDef.songBoost || 0.04) * 100)}%)`);
        } else {
          // No stars: night is just cold and dangerous. No singing in the dark.
          // The setlist is shorter next season — the community can't gather to sing.
          msgs.push(`  !! The long dark. No stars to sing by. ${spiritDef.attackFoodLoss} food lost to the cold. !!`);
          msgs.push(`  Without stars, the community can't gather. Fewer songs next season.`);
          // Mark for next season's setlist reduction
          state.nightPenalty = (state.nightPenalty || 0) + 2; // lose 2 setlist slots next season
        }
        // Night kills through exposure
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const victim = state.people[Math.floor(Math.random() * state.people.length)];
          if (victim) {
            msgs.push(`  !! ${victim.name} is lost in the dark. They don't come back. !!`);
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }
      // ── Death attack: comes for the elders ──
      } else if (spiritDef.eldersFirst) {
        msgs.push(`  !! Death visits the camp. !!`);
        // Death targets elders first — the ones with the most to lose
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const elders = state.people.filter(p => ageCategory(p.age) === 'elder');
          const adults = state.people.filter(p => ageCategory(p.age) === 'adult');
          const targets = elders.length > 0 ? elders : adults;
          if (targets.length > 0) {
            const victim = targets[Math.floor(Math.random() * targets.length)];
            // Death teaching: if burial song is strong, the dying teach
            if (spiritDef.deathTeaching && songQuality >= GARBLE_THRESHOLD) {
              const youth = state.people.filter(p => ageCategory(p.age) === 'youth');
              if (youth.length > 0) {
                const heir = youth[Math.floor(Math.random() * youth.length)];
                const passed = [];
                for (const [v, integrity] of Object.entries(victim.verses)) {
                  if (integrity >= GARBLE_THRESHOLD) {
                    heir.verses[v] = Math.max(heir.verses[v] || 0, integrity * 0.7);
                    passed.push(VERSES[v]?.name || v);
                  }
                }
                if (passed.length > 0) {
                  msgs.push(`  ${victim.name} sings one last time. ${heir.name} listens.`);
                  msgs.push(`    Passed on: ${passed.join(', ')}`);
                }
              }
            }
            msgs.push(`  !! ${victim.name} dies. They carried songs no one else knew. !!`);
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }
      // ── Fire attack: burns food AND the tree ──
      } else if (spiritDef.stolenSpirit) {
        state.food = Math.max(0, state.food - spiritDef.attackFoodLoss);
        msgs.push(`  !! Fire in the camp — ${spiritDef.attackFoodLoss} food lost !!`);
        // Fire can burn verses off the tree
        if (spiritDef.treeBurnChance && state.tree.carved.length > 0 && Math.random() < spiritDef.treeBurnChance) {
          const burnIdx = Math.floor(Math.random() * state.tree.carved.length);
          const burned = state.tree.carved.splice(burnIdx, 1)[0];
          state.tree.height = Math.max(0, state.tree.height - TREE_GROWTH_PER_VERSE);
          msgs.push(`  !! The fire reaches the Tree. "${VERSES[burned]?.name || burned}" burns away. !!`);
        }
        // Fire kill chance
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const victim = state.people[Math.floor(Math.random() * state.people.length)];
          if (victim) {
            msgs.push(`  !! ${victim.name} is burned. The stolen fire takes what it wants. !!`);
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }
        // Sky → Fire: lightning starts fires
        if (spiritDef.fireStarter && state.spirits.fire) {
          state.spirits.fire.danger += 0.03;
          msgs.push(`  Lightning strikes. The fire spirit stirs.`);
        }
      // ── Sky attack: storms, lightning, and fire-starting ──
      } else if (spiritDef.fireStarter) {
        state.food = Math.max(0, state.food - spiritDef.attackFoodLoss);
        msgs.push(`  !! Thunder. The sky opens. ${spiritDef.attackFoodLoss} food lost to the storm. !!`);
        // Lightning can boost fire danger
        if (state.spirits.fire) {
          state.spirits.fire.danger += 0.03;
        }
        // Lightning kill
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const victim = state.people[Math.floor(Math.random() * state.people.length)];
          if (victim) {
            msgs.push(`  !! Lightning takes ${victim.name}. The sky gives fire and takes life in the same gesture. !!`);
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }
      // ── Animal spirit attack (bear, wolf, cat) — original behavior ──
      } else {
        state.food = Math.max(0, state.food - spiritDef.attackFoodLoss);
        msgs.push(`  !! The ${spiritDef.name.toLowerCase()}s raid the camp — ${spiritDef.attackFoodLoss} food lost !!`);

        // Kill chance
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const allergicYouth = state.people.filter(p =>
            isAllergicTo(p, spiritKey) && ageCategory(p.age) === 'youth'
          );
          const allergicAdults = state.people.filter(p =>
            isAllergicTo(p, spiritKey) && ['adult', 'elder'].includes(ageCategory(p.age))
          );
          const nonAllergic = state.people.filter(p =>
            !isAllergicTo(p, spiritKey) && ageCategory(p.age) !== 'dead'
          );

          let victim = null;

          if (allergicYouth.length > 0 && Math.random() < (spiritDef.killChance + spiritDef.allergyKillBonus)) {
            victim = allergicYouth[Math.floor(Math.random() * allergicYouth.length)];
            const label = PEOPLES[identifyPeople(victim, state.ageKey)]?.name || 'unknown';
            msgs.push(`  !! ${victim.name} the ${label} youth is killed by a ${spiritDef.name.toLowerCase()} !!`);
            msgs.push(`     ${spiritDef.allergyDesc}`);
          } else if (allergicAdults.length > 0 && Math.random() > spiritDef.allergyWarning) {
            victim = allergicAdults[Math.floor(Math.random() * allergicAdults.length)];
            const label = PEOPLES[identifyPeople(victim, state.ageKey)]?.name || 'unknown';
            msgs.push(`  !! ${victim.name} the ${label} sensed the ${spiritDef.name.toLowerCase()} but too late !!`);
          } else if (nonAllergic.length > 0) {
            victim = nonAllergic[Math.floor(Math.random() * nonAllergic.length)];
            msgs.push(`  !! ${victim.name} is killed by a ${spiritDef.name.toLowerCase()} !!`);
          }

          if (victim) {
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }
      }

      if (ss.spirit < 0.5) {
        const songName = VERSES[spiritDef.songId]?.name || spiritDef.songId;
        if (spiritDef.kind === 'great') {
          msgs.push(`  The ${spiritDef.name} is restless. Spirit: ${Math.round(ss.spirit * 100)}%`);
        } else {
          msgs.push(`  The ${spiritDef.name.toLowerCase()}s are angry. Spirit: ${Math.round(ss.spirit * 100)}%`);
        }
        msgs.push(`  Someone must sing "${songName}" to mend the relationship.`);
      }
    }
  }

  // ── The Dog — wolf spirit in the camp ──
  // When someone knows the Dog Song, a wolf-spirit perimeter forms.
  // Anyone with old blood (cave_blood, stone_blood, deep_blood) feels it.
  // The dog disrupts the singing circle — old-blood people can't join in.
  // They can't teach. They can't sing. Eventually they leave.
  const bandKnowsDog = state.people.some(p => p.verses['dog'] && p.verses['dog'] >= GARBLE_THRESHOLD);
  if (bandKnowsDog) {
    for (const p of state.people) {
      const wolfAllergy = allergyStrength(p, 'wolf');
      if (wolfAllergy >= BLOOD_ALLERGY_THRESHOLD) {
        // Chance they leave each season — higher allergy = more likely
        // The dog is always there. The old blood can't rest.
        if (Math.random() < wolfAllergy * 0.08) {
          const label = PEOPLES[identifyPeople(p, state.ageKey)]?.name || 'stranger';
          const knownVerses = Object.keys(p.verses).filter(v => p.verses[v] >= LOST_THRESHOLD);
          msgs.push(`  ${p.name} the ${label} cannot bear the dog any longer. They leave for the deep places.`);
          if (knownVerses.length > 0) {
            const lastSongs = knownVerses.map(v => VERSES[v]?.name || v).join(', ');
            msgs.push(`    They take with them: ${lastSongs}`);
          }
          const idx = state.people.indexOf(p);
          if (idx >= 0) state.people.splice(idx, 1);
        }
      }
    }
  }

  // ── Ash verses — check if new growth has emerged ──
  if (state.ashVerses.length > 0) {
    // Ash verses fade if not gathered within a few seasons
    // (handled in display — they persist until gathered or next felling)
  }

  // ── Random encounter (15% chance in summer/autumn) ──
  // Which peoples you can meet depends on the age
  const currentAge = AGES[state.ageKey] || AGES.stone;
  const availablePeoples = currentAge.encounter_peoples || ['human'];

  if ((state.season === 1 || state.season === 2) && Math.random() < 0.15 && !state.encounter) {
    const namesByPeople = {
      troll:    ['Hrungnir', 'Geirrod', 'Ymir-kin', 'Bergelmir'],
      dwarf:    ['Durin', 'Andvari', 'Alviss', 'Dvalin', 'Sindri', 'Brokk'],
      elf:      ['Luthien', 'Thingol', 'Nienna', 'Varda', 'Ilmare'],
      halfling: ['Ebu', 'Liang', 'Flores', 'Mata'],
      human:    ['Pohjan Akka', 'Tiera', 'Iku-Turso', 'Surma', 'Kiputyttö',
                  'Elias', 'Akseli', 'Minna', 'Johan', 'Kristina'],
    };
    const versePoolByPeople = {
      troll:    ['heartbeat', 'stone_sleep', 'deep_fire', 'old_track'],
      dwarf:    ['flake', 'blade', 'ember', 'cave_song', 'bear', 'wolf_song', 'ochre', 'burial'],
      elf:      ['thin_air', 'far_sight', 'ghost_walk', 'jade', 'loom'],
      halfling: ['island', 'small_hunt', 'tide', 'feast', 'shelter'],
      human:    Object.keys(VERSES).filter(v => VERSES[v].people === 'human'),
    };

    const strangePeople = availablePeoples[Math.floor(Math.random() * availablePeoples.length)];
    const strangerNames = namesByPeople[strangePeople] || namesByPeople.human;
    const strangerVersePool = versePoolByPeople[strangePeople] || versePoolByPeople.human;

    const strangerVerses = {};
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const v = strangerVersePool[Math.floor(Math.random() * strangerVersePool.length)];
      strangerVerses[v] = 0.5 + Math.random() * 0.5;
    }

    const name = strangerNames[Math.floor(Math.random() * strangerNames.length)];
    const peopleLabel = PEOPLES[strangePeople]?.name || strangePeople;
    const strangerAge = strangePeople === 'troll' ? 20 + Math.floor(Math.random() * 4) :
           strangePeople === 'elf' ? 12 + Math.floor(Math.random() * 10) :
           8 + Math.floor(Math.random() * 12);
    state.encounter = makePerson(name, strangerAge, strangePeople, strangerVerses);
    const verseList = Object.keys(strangerVerses).map(v => VERSES[v]?.name || v).join(', ');
    msgs.push(`  A ${peopleLabel} approaches: ${name}. ${PEOPLES[strangePeople]?.trait || ''}`);
    msgs.push(`  They seem to know: ${verseList}`);
    msgs.push(`  (Use: node song.js welcome | node song.js ignore)`);
  }

  // ── Collapse check — if everyone dies or sun is 0 and no food, age ends ──
  if (state.people.length === 0) {
    msgs.push('');
    msgs.push('  !! THE BAND IS GONE. The songs fall silent. !!');
    msgs.push('  !! But somewhere, someone remembers a fragment... !!');
    msgs.push('  (Use: node song.js cross to find a bridge)');
    state.collapsed = true;
  } else if (state.sunlight <= 0.1 && state.food <= 0) {
    msgs.push('');
    msgs.push('  !! The Tree has killed the sun. The world is dying. !!');
    msgs.push('  !! Fell the Tree — or cross a bridge to another age. !!');
    msgs.push('  (Use: node song.js fell | node song.js cross)');
  }

  // ── Advance time ──
  state.season = (state.season + 1) % 4;
  if (state.season === 0) {
    state.year += 1;
    state.yearsBP -= 1;
  }

  return msgs;
}

// ── Actions ─────────────────────────────────────────────────────────

const ACTIONS = {

  // Setlist = arrange what the community sings each season
  // Usage: setlist [verse1] [verse2] ...
  // Order matters: position 1 transmits best to youth.
  // Anything not listed drops off. Auto-fills remaining capacity.
  setlist(state, ...verseIds) {
    if (!state.setlist) state.setlist = [];
    const cap = setlistCapacity(state.people, state);
    const msgs = [];

    if (verseIds.length === 0 || !verseIds[0]) {
      // Show current setlist
      msgs.push(`  THE SETLIST (${state.setlist.length}/${cap} slots):`);
      if (state.setlist.length === 0) {
        msgs.push('    (empty — songs will auto-fill next season)');
      } else {
        state.setlist.forEach((v, i) => {
          const bestSinger = state.people.reduce((best, p) =>
            (p.verses[v] || 0) > (best?.verses[v] || 0) ? p : best, null);
          const integrity = bestSinger?.verses[v] || 0;
          const posFac = positionFactor(i, state.setlist.length);
          const reps = state.setlistHistory?.[v] || 0;
          const repStr = reps > 1 ? ` [${reps} seasons]` : '';
          msgs.push(`    ${i + 1}. ${VERSES[v]?.name || v} — ${bestSinger?.name || '?'} at ${Math.round(integrity * 100)}%  (transmission: ${Math.round(posFac * 100)}%)${repStr}`);
        });
      }
      msgs.push(`  Capacity: ${cap} (${state.people.filter(p => ageCategory(p.age) !== 'youth').length} singers)`);
      return msgs;
    }

    // Set new order
    const newSetlist = [];
    for (const v of verseIds) {
      if (!VERSES[v]) { msgs.push(`  Unknown verse: ${v}`); continue; }
      // Someone must know it
      if (!state.people.some(p => p.verses[v] && p.verses[v] >= LOST_THRESHOLD)) {
        msgs.push(`  No one knows "${VERSES[v].name}" — can't add to setlist.`);
        continue;
      }
      if (newSetlist.includes(v)) continue; // no dupes
      if (newSetlist.length >= cap) {
        msgs.push(`  Setlist full (${cap} slots). "${VERSES[v].name}" dropped.`);
        break;
      }
      newSetlist.push(v);
    }
    state.setlist = newSetlist;
    msgs.push(`  Setlist arranged (${newSetlist.length}/${cap}):`);
    newSetlist.forEach((v, i) => {
      const posFac = positionFactor(i, newSetlist.length);
      msgs.push(`    ${i + 1}. ${VERSES[v]?.name || v} (transmission: ${Math.round(posFac * 100)}%)`);
    });
    if (newSetlist.length < cap) {
      msgs.push(`  ${cap - newSetlist.length} empty slots — will auto-fill next season.`);
    }
    return msgs;
  },

  // Prioritize = move a verse to position 1 on the setlist
  prioritize(state, verseId) {
    if (!verseId || !VERSES[verseId]) return [`Unknown verse: ${verseId}`];
    if (!state.setlist) state.setlist = [];
    const idx = state.setlist.indexOf(verseId);
    if (idx >= 0) state.setlist.splice(idx, 1);
    state.setlist.unshift(verseId);
    const cap = setlistCapacity(state.people, state);
    while (state.setlist.length > cap) state.setlist.pop();
    return [`  "${VERSES[verseId].name}" moved to opening position.`];
  },

  // Carve = fix a verse on the Tree (permanent, but tree grows)
  carve(state, verseId) {
    if (!VERSES[verseId]) return [`Unknown verse: ${verseId}`];
    if (state.tree.carved.includes(verseId)) return [`"${VERSES[verseId].name}" is already carved on the Tree.`];

    // Need someone who knows it well AND knows the carving song
    const carver = state.people.find(p =>
      p.verses[verseId] && p.verses[verseId] >= 0.7 &&
      p.verses['tree_song'] && p.verses['tree_song'] >= GARBLE_THRESHOLD
    );
    if (!carver) return ['Need someone who knows this verse well (70%+) AND knows "The Carving Song".'];

    state.tree.carved.push(verseId);
    state.tree.height += TREE_GROWTH_PER_VERSE;

    const msgs = [`  ${carver.name} carves "${VERSES[verseId].name}" into the Tree.`];
    msgs.push(`  Tree height: ${state.tree.height}`);
    if (state.tree.height >= SUN_BLOCKED_THRESHOLD) {
      msgs.push(`  ⚠ The Tree's canopy darkens the sky...`);
    }
    if (state.tree.height >= SUN_DEAD_THRESHOLD) {
      msgs.push(`  !! THE TREE BLOCKS THE SUN — the world grows cold and nothing grows !!`);
      msgs.push(`  !! You must fell the Tree or all will perish !!`);
    }
    return msgs;
  },

  // Fell = chop down the Tree. Songs scatter. Some survive as fragments.
  fell(state) {
    if (state.tree.height === 0) return ['There is no Tree to fell.'];
    if (!state.people.some(p => p.verses['blade'] && p.verses['blade'] >= GARBLE_THRESHOLD)) {
      return ['No one knows "Blade Singing" well enough to fell the Tree.'];
    }

    const msgs = [];
    msgs.push(`  THE TREE IS FELLED.`);
    msgs.push(`  Height was: ${state.tree.height}. Carved verses: ${state.tree.carved.length}`);

    // Scatter carved verses as fragments
    const scattered = [];
    const lost = [];
    for (const v of state.tree.carved) {
      if (Math.random() < FELLING_SCATTERS_CHANCE) {
        const integrity = 0.3 + Math.random() * 0.4;
        scattered.push({ verse: v, integrity });
        msgs.push(`  Fragment found: "${VERSES[v].name}" (${(integrity * 100).toFixed(0)}% intact)`);
      } else {
        // Check if anyone still carries it in memory
        const carriers = state.people.filter(p => p.verses[v] && p.verses[v] >= LOST_THRESHOLD);
        if (carriers.length === 0) {
          lost.push(v);
          msgs.push(`  !! "${VERSES[v].name}" is LOST — it was only on the Tree !!`);
        } else {
          msgs.push(`  "${VERSES[v].name}" survives in memory (${carriers.map(c => c.name).join(', ')})`);
        }
      }
    }

    state.fragments = state.fragments.concat(scattered);
    state.totalLost = state.totalLost.concat(lost);

    // ── The Ash grows ──
    // Check what was carved — certain combinations produce new verses
    const carvedSet = new Set(state.tree.carved);
    const newAshVerses = [];
    for (const [id, av] of Object.entries(ASH_VERSES)) {
      if (state.ashVerses.includes(id)) continue; // already emerged before
      const needed = av.emerges_from;
      if (needed.every(v => carvedSet.has(v))) {
        newAshVerses.push(id);
        msgs.push(`  From the ash, something new grows: "${av.name}"`);
        msgs.push(`    ${av.desc}`);
      }
    }
    state.ashVerses = state.ashVerses.concat(newAshVerses);

    state.tree = { height: 0, carved: [] };
    state.sunlight = 1.0;
    state.fellings += 1;

    // All spirits grow angrier with each felling
    if (state.spirits) {
      for (const key of Object.keys(state.spirits)) {
        state.spirits[key].spirit = Math.max(0, state.spirits[key].spirit - 0.15);
      }
    }
    msgs.push(`  The spirits stir uneasily. The felling disturbs the land.`);

    msgs.push(`  The sun returns.`);
    msgs.push(`  Fellings: ${state.fellings}. Verses permanently lost: ${state.totalLost.length}`);
    if (scattered.length > 0) {
      msgs.push(`  Fragments on the ground: ${scattered.length}. Use "node song.js gather" to collect them.`);
    }
    msgs.push('');
    msgs.push(`  The bridges shimmer. Where will the song take you?`);
    msgs.push(`  (Use: node song.js cross to see available bridges)`);

    return msgs;
  },

  // Gather = pick up scattered fragments from a felling
  gather(state) {
    if (state.fragments.length === 0) return ['No fragments to gather.'];

    const msgs = [];
    for (const frag of state.fragments) {
      // Find someone who can absorb it (has prereqs)
      const verse = VERSES[frag.verse];
      if (!verse) continue;
      const learner = state.people.find(p => {
        if (ageCategory(p.age) === 'youth') return false;
        return verse.prereqs.every(pr => p.verses[pr] && p.verses[pr] >= GARBLE_THRESHOLD);
      });
      if (learner) {
        const existing = learner.verses[frag.verse] || 0;
        learner.verses[frag.verse] = Math.max(existing, frag.integrity);
        msgs.push(`  ${learner.name} gathers fragment: "${verse.name}" (${(frag.integrity * 100).toFixed(0)}%)`);
      } else {
        msgs.push(`  No one can understand the fragment of "${verse.name}" — prereqs not met. It crumbles.`);
        if (!state.totalLost.includes(frag.verse)) {
          const anyoneKnows = state.people.some(p => p.verses[frag.verse] && p.verses[frag.verse] >= LOST_THRESHOLD);
          if (!anyoneKnows) state.totalLost.push(frag.verse);
        }
      }
    }
    state.fragments = [];
    return msgs;
  },

  // Welcome = accept an encountered stranger into the band
  welcome(state) {
    if (!state.encounter) return ['There is no one to welcome.'];
    const e = state.encounter;
    state.people.push({ name: e.name, age: e.age, people: e.people || 'human', verses: e.verses });
    const verseList = Object.keys(e.verses).map(v => VERSES[v]?.name || v).join(', ');
    const peopleLabel = PEOPLES[identifyPeople(e, state?.ageKey)]?.name || PEOPLES[e.people]?.name || 'stranger';
    state.encounter = null;
    return [`  ${e.name} the ${peopleLabel} joins the band. They bring: ${verseList}`];
  },

  // Ignore = send the stranger away
  ignore(state) {
    if (!state.encounter) return ['There is no one here.'];
    const name = state.encounter.name;
    state.encounter = null;
    return [`  ${name} disappears into the landscape. Their songs go with them.`];
  },

  // Study the ash — learn a verse that emerged from the felling
  study_ash(state, verseId) {
    if (!verseId) return ['Usage: node song.js study_ash <verse_id>'];
    if (!state.ashVerses.includes(verseId)) {
      return [`"${verseId}" has not emerged from the ash. Available: ${state.ashVerses.map(v => `${v} ("${VERSES[v]?.name}")`).join(', ') || 'none'}`];
    }
    const verse = VERSES[verseId];
    if (!verse) return [`Unknown verse: ${verseId}`];

    // Find someone with the prereqs
    const learner = state.people.find(p => {
      if (ageCategory(p.age) === 'youth') return false;
      if (p.verses[verseId] && p.verses[verseId] >= 0.5) return false; // already knows it well
      return verse.prereqs.every(pr => p.verses[pr] && p.verses[pr] >= GARBLE_THRESHOLD);
    });
    if (!learner) return [`No one has the prerequisite songs to study "${verse.name}": needs ${verse.prereqs.join(', ')}`];

    const old = learner.verses[verseId] || 0;
    learner.verses[verseId] = Math.min(0.6, old + 0.3); // ash learning is partial — you must practice the rest
    const msgs = [`  ${learner.name} kneels in the ash and begins to understand "${verse.name}"`];
    msgs.push(`  Integrity: ${(old * 100).toFixed(0)}% → ${(learner.verses[verseId] * 100).toFixed(0)}%`);
    msgs.push(`  (Sing it to strengthen it further)`);
    return msgs;
  },

  // Teach = focused apprenticeship. One elder, one student, one song.
  // This is the deliberate transmission outside the communal singing.
  // The student gets a direct transfer — more than peripheral absorption.
  // In the new model, this is how you push a specific song above what
  // the setlist position would give. The apprentice sits with the master.
  teach(state, teacherName, studentName, verseId) {
    const teacher = state.people.find(p => p.name.toLowerCase() === teacherName?.toLowerCase());
    const student = state.people.find(p => p.name.toLowerCase() === studentName?.toLowerCase());
    if (!teacher) return [`No one named "${teacherName}" in the band.`];
    if (!student) return [`No one named "${studentName}" in the band.`];
    if (!verseId || !VERSES[verseId]) return [`Unknown verse: ${verseId}`];
    if (!teacher.verses[verseId] || teacher.verses[verseId] < LOST_THRESHOLD) {
      return [`${teacher.name} doesn't know "${VERSES[verseId].name}".`];
    }
    if (teachingPower(teacher) === 0) return [`${teacher.name} is too young to teach.`];

    const verse = VERSES[verseId];
    const hasPrereqs = verse.prereqs.every(pr =>
      student.verses[pr] && student.verses[pr] >= GARBLE_THRESHOLD
    );
    if (!hasPrereqs && verse.prereqs.length > 0) {
      return [`${student.name} lacks the prerequisite songs: ${verse.prereqs.map(p => VERSES[p].name).join(', ')}`];
    }

    // Focused teaching: student gets a chunk of the teacher's version directly
    const eased = bloodEases(student);
    const bloodBonus = eased[verseId] || 0;
    const gain = LEARN_RATE_FOCUSED * teachingPower(teacher) * (1 + bloodBonus);
    const old = student.verses[verseId] || 0;
    const garbled = teacher.verses[verseId] < GARBLE_THRESHOLD;
    const cap = garbled ? teacher.verses[verseId] : teacher.verses[verseId]; // can't exceed teacher
    student.verses[verseId] = Math.min(cap, old + gain);

    const msgs = [];
    if (garbled) {
      msgs.push(`  ${teacher.name} teaches ${student.name} a garbled version of "${verse.name}"`);
    }
    msgs.push(`  ${student.name} learns "${verse.name}": ${(old * 100).toFixed(0)}% → ${(student.verses[verseId] * 100).toFixed(0)}%`);
    return msgs;
  },
};

// ── Display ─────────────────────────────────────────────────────────

function printStatus(state) {
  const seasonName = ['Spring', 'Summer', 'Autumn', 'Winter'][state.season];
  console.log();
  console.log(`═══════════════════════════════════════════════════`);
  const ageName = state.ageName || AGES[state.ageKey || 'stone']?.name || 'Unknown Age';
  console.log(`  THE SONG — ${ageName}`);
  console.log(`  ${seasonName}, Year ${state.year} (${state.yearsBP} BP)`);
  const spiritStr = (s) => s > 0.7 ? 'peace' : s > 0.4 ? 'uneasy' : s > 0.2 ? 'angry' : 'RAGE';
  const spirits = state.spirits || {};
  const animalSpirits = Object.entries(SPIRITS).filter(([, def]) => def.kind === 'animal');
  const greatSpirits = Object.entries(SPIRITS).filter(([, def]) => def.kind === 'great' && !def.invisibleSpirit);
  const yeastSpirit = Object.entries(SPIRITS).find(([, def]) => def.invisibleSpirit);
  const fmtSpirit = ([key, def]) => {
    const s = spirits[key]?.spirit ?? 1;
    return `${def.name}: ${spiritStr(s)}`;
  };
  console.log(`  Food: ${state.food}  Sun: ${Math.round(state.sunlight * 100)}%  Fellings: ${state.fellings}`);
  console.log(`  Spirits: ${animalSpirits.map(fmtSpirit).join('  ')}`);
  const greatLine = greatSpirits.map(fmtSpirit).join('  ');
  // Yeast only shows when someone knows a yeast song — it's invisible until then
  const bandKnowsDisplay = (v) => state.people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
  const hasYeast = ['brew', 'bake', 'sourdough', 'mead'].some(s => bandKnowsDisplay(s));
  if (yeastSpirit && hasYeast) {
    const ys = spirits[yeastSpirit[0]]?.spirit ?? 0;
    const yeastStr = `Yeast: ${ys > 0.7 ? 'thriving' : ys > 0.3 ? 'rising' : 'stirring'}`;
    console.log(`           ${greatLine}  ${yeastStr}`);
  } else {
    console.log(`           ${greatLine}`);
  }
  console.log(`═══════════════════════════════════════════════════`);

  // The Tree
  if (state.tree.height > 0) {
    const bar = '█'.repeat(state.tree.height) + '░'.repeat(Math.max(0, SUN_DEAD_THRESHOLD - state.tree.height));
    console.log();
    console.log(`  THE TREE [${bar}] ${state.tree.height}/${SUN_DEAD_THRESHOLD}`);
    if (state.tree.carved.length > 0) {
      console.log(`  Carved: ${state.tree.carved.map(v => VERSES[v]?.name || v).join(', ')}`);
    }
  } else {
    console.log();
    console.log(`  THE TREE — a stump. (or not yet grown)`);
  }

  // The Setlist
  if (state.setlist && state.setlist.length > 0) {
    const cap = setlistCapacity(state.people, state);
    console.log();
    console.log(`  THE SETLIST (${state.setlist.length}/${cap}):`);
    state.setlist.forEach((v, i) => {
      const bestSinger = state.people.reduce((best, p) =>
        (p.verses[v] || 0) > (best?.verses[v] || 0) ? p : best, null);
      const integrity = bestSinger?.verses[v] || 0;
      const posFac = positionFactor(i, state.setlist.length);
      const reps = state.setlistHistory?.[v] || 0;
      const repStr = reps > 1 ? ` [${reps}]` : '';
      console.log(`    ${i + 1}. ${(VERSES[v]?.name || v).padEnd(22)} ${bestSinger?.name?.padEnd(12) || '?'.padEnd(12)} ${Math.round(integrity * 100)}%  →${Math.round(posFac * 100)}%${repStr}`);
    });
  }

  // Active shadows
  if (state.shadows) {
    const activeShadows = Object.entries(state.shadows).filter(([, v]) => v > 0.1);
    if (activeShadows.length > 0) {
      console.log();
      console.log(`  SHADOWS:`);
      for (const [id, progress] of activeShadows) {
        const sv = SHADOW_VERSES[id];
        if (!sv) continue;
        const bar = '▓'.repeat(Math.round(progress * 10)) + '░'.repeat(10 - Math.round(progress * 10));
        console.log(`    ${(sv.name || id).padEnd(22)} [${bar}] ${Math.round(progress * 100)}%  (${VERSES[sv.shadow_of]?.name || sv.shadow_of} without ${VERSES[sv.shadow_when]?.name || sv.shadow_when})`);
      }
    }
  }

  // The People
  console.log();
  // Count peoples in band — identified by blood, not by label
  const peopleCounts = {};
  for (const p of state.people) {
    const kind = identifyPeople(p, state.ageKey);
    peopleCounts[kind] = (peopleCounts[kind] || 0) + 1;
  }
  const bandDesc = Object.entries(peopleCounts).map(([k, v]) => `${v} ${PEOPLES[k]?.name || k}`).join(', ');
  console.log(`  THE PEOPLE (${state.people.length}: ${bandDesc}):`);
  for (const p of state.people) {
    const cat = ageCategory(p.age);
    const catLabel = cat.toUpperCase().padEnd(6);
    const kind = heritageLabel(p).padEnd(5);
    const verses = Object.entries(p.verses)
      .filter(([, integ]) => integ >= LOST_THRESHOLD)
      .map(([v, integ]) => {
        const integrity = Math.round(integ * 100);
        const warn = integ < GARBLE_THRESHOLD ? '!' : '';
        // Foreign marker: * if the verse's tradition isn't eased by your blood
        const eased = bloodEases(p);
        const foreign = VERSES[v]?.people && !['mixed', 'ash', 'colonial'].includes(VERSES[v].people) && !eased[v] ? '*' : '';
        return `${VERSES[v]?.name || v}(${integrity}%${warn}${foreign})`;
      })
      .join(', ');
    console.log(`  ${catLabel} ${kind} ${p.name.padEnd(14)} age ${String(p.age).padStart(2)} │ ${verses || '(knows nothing)'}`);
  }

  // Fragments on the ground
  if (state.fragments.length > 0) {
    console.log();
    console.log(`  FRAGMENTS ON THE GROUND:`);
    for (const f of state.fragments) {
      console.log(`    "${VERSES[f.verse]?.name || f.verse}" — ${(f.integrity * 100).toFixed(0)}% intact`);
    }
  }

  // Encounter
  if (state.encounter) {
    const ePeople = PEOPLES[state.encounter.people]?.name || 'Stranger';
    console.log();
    console.log(`  ★ ${ePeople.toUpperCase()}: ${state.encounter.name} (age ${state.encounter.age})`);
    console.log(`    ${PEOPLES[state.encounter.people]?.desc || ''}`);
    const verses = Object.entries(state.encounter.verses)
      .map(([v, integ]) => `${VERSES[v]?.name || v}(${Math.round(integ * 100)}%)`)
      .join(', ');
    console.log(`    Knows: ${verses}`);
  }

  // Ash verses available
  if (state.ashVerses.length > 0) {
    console.log();
    console.log(`  FROM THE ASH:`);
    for (const v of state.ashVerses) {
      const verse = VERSES[v];
      const anyoneKnows = state.people.some(p => p.verses[v] && p.verses[v] >= LOST_THRESHOLD);
      const status = anyoneKnows ? '(learned)' : '(study with: node song.js study_ash ' + v + ')';
      console.log(`    "${verse?.name}" — ${verse?.desc}`);
      console.log(`    ${status}`);
    }
  }

  // Bridges — where the song can take you
  const bridges = getAvailableBridges(state);
  if (bridges.length > 0) {
    console.log();
    console.log(`  BRIDGES (where the song can take you):`);
    for (const b of bridges) {
      const status = b.met ? '>> OPEN' : '   locked';
      const needs = b.bridge.requires.map(v => {
        const known = state.tree.carved.includes(v) || state.people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
        return `${VERSES[v]?.name || v}${known ? ' [ok]' : ''}`;
      }).join(', ');
      console.log(`    ${status} → ${b.age.name} (${b.age.yearsBP.toLocaleString()} BP)`);
      if (!b.met) {
        console.log(`             needs: ${needs}`);
      } else {
        console.log(`             "${b.bridge.desc}"`);
        console.log(`             (Use: node song.js cross ${b.key})`);
      }
    }
  }

  // Journey so far
  if (state.previousAges && state.previousAges.length > 0) {
    console.log();
    console.log(`  AGES VISITED: ${state.previousAges.map(a => a.name).join(' → ')} → ${ageName}`);
  }

  // Lost forever
  if (state.totalLost.length > 0) {
    console.log();
    console.log(`  LOST FOREVER: ${state.totalLost.map(v => VERSES[v]?.name || v).join(', ')}`);
  }

  console.log();
}

function printVerses() {
  console.log();
  console.log('  ALL VERSES:');
  const byPeople = {};
  for (const [id, v] of Object.entries(VERSES)) {
    const key = v.people || v.tradition;
    if (!byPeople[key]) byPeople[key] = [];
    byPeople[key].push({ id, ...v });
  }
  const order = ['bear', 'troll', 'dwarf', 'elf', 'halfling', 'human', 'mixed', 'ash', 'colonial'];
  for (const key of order) {
    const verses = byPeople[key];
    if (!verses) continue;
    const label = PEOPLES[key]?.name || key.toUpperCase();
    const desc = PEOPLES[key]?.desc || '';
    console.log(`\n  ══ ${label.toUpperCase()} SONGS ${desc ? '— ' + desc : ''} ══`);
    for (const v of verses) {
      const prereqs = v.prereqs.length > 0 ? ` (needs: ${v.prereqs.join(', ')})` : '';
      console.log(`    ${v.id.padEnd(14)} "${v.name}"${prereqs}`);
      console.log(`    ${''.padEnd(14)} ${v.desc}`);
    }
  }
  console.log();
}

function printHelp() {
  console.log(`
  THE SONG — commands:

  node song.js                     Advance one season (the world turns)
  node song.js status              Show current state
  node song.js verses              List all known verses

  node song.js setlist                          Show current setlist
  node song.js setlist <v1> <v2> <v3> ...       Arrange the setlist (order matters!)
  node song.js prioritize <verse>               Move a verse to opening position
  node song.js teach <elder> <student> <verse>  Focused apprenticeship (1-on-1)
  node song.js carve <verse>       Carve a verse on the Tree (needs Carving Song)
  node song.js fell                Fell the Tree (needs Blade Singing)
  node song.js gather              Gather fragments after a felling

  node song.js welcome             Accept a stranger into the band
  node song.js ignore              Turn a stranger away
  node song.js study_ash <verse>   Learn a verse that grew from the ash
  node song.js cross               Show available bridges to other ages
  node song.js cross <age>         Cross a bridge to another age

  node song.js reset               Start over from the beginning

  The setlist is what the community sings each season. Order matters.
  The opening verse transmits best to youth. Deep night verses fade.
  Youth learn by being present — legitimate peripheral participation.
  Songs not on the setlist are not transmitted. One generation of silence = lost.
  Verses don't decay in the singer. Decay is generational.
  The constraint is singing time, not memory.

  Time is not a line. Ages are places the song can take you.
  Carve the right songs and bridges open — forward, backward, sideways.
  Put two prerequisite songs adjacent on the setlist — mixed songs emerge.
  The tree grows when you carve. It blocks the sun. You must fell it.
  The bears have their own age. You have to earn it.
  The last age is the Tech Tree. The complexity itself kills you.
  Arrange.
  `);
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  // Load or create state
  let state;
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    // Re-register age songs (they aren't in VERSES on cold load)
    // Register songs from all ages that have been visited + current
    const visitedKeys = (state.previousAges || []).map(a => a.key).filter(Boolean);
    const currentKey = state.ageKey || 'stone';
    for (const key of [...visitedKeys, currentKey]) {
      if (AGES[key]?.newSongs) Object.assign(VERSES, AGES[key].newSongs);
    }
    // Also register all ages up to current yearsBP (for backwards compatibility)
    for (const [key, age] of Object.entries(AGES)) {
      if (age.newSongs && age.yearsBP >= (state.yearsBP || 0)) {
        Object.assign(VERSES, age.newSongs);
      }
    }
  } else {
    state = newState();
  }

  if (!action) {
    // Advance one season
    const msgs = advanceSeason(state);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    for (const m of msgs) console.log(m);
    printStatus(state);
    return;
  }

  switch (action) {
    case 'status':
      printStatus(state);
      break;

    case 'verses':
      printVerses();
      break;

    case 'help':
      printHelp();
      break;

    case 'setlist':
      for (const m of ACTIONS.setlist(state, ...args.slice(1))) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'prioritize':
      if (!args[1]) { console.log('Usage: node song.js prioritize <verse_id>'); break; }
      for (const m of ACTIONS.prioritize(state, args[1])) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'carve':
      if (!args[1]) { console.log('Usage: node song.js carve <verse_id>'); break; }
      for (const m of ACTIONS.carve(state, args[1])) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'fell':
      for (const m of ACTIONS.fell(state)) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'gather':
      for (const m of ACTIONS.gather(state)) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'welcome':
      for (const m of ACTIONS.welcome(state)) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'ignore':
      for (const m of ACTIONS.ignore(state)) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'teach':
      if (args.length < 4) { console.log('Usage: node song.js teach <teacher_name> <student_name> <verse_id>'); break; }
      for (const m of ACTIONS.teach(state, args[1], args[2], args[3])) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'study_ash':
      if (!args[1]) { console.log('Usage: node song.js study_ash <verse_id>'); break; }
      for (const m of ACTIONS.study_ash(state, args[1])) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'cross': {
      if (!args[1]) {
        // Show available bridges
        const bridges = getAvailableBridges(state);
        if (bridges.length === 0) {
          console.log('  No bridges from this age. Sing more. Carve more.');
          break;
        }
        console.log('  Available bridges:');
        for (const b of bridges) {
          const status = b.met ? 'OPEN' : 'locked';
          console.log(`    ${status} → ${b.key}: ${b.age.name}`);
          if (!b.met) {
            console.log(`      needs: ${b.bridge.requires.map(v => VERSES[v]?.name || v).join(', ')}`);
          }
        }
        console.log('  Usage: node song.js cross <age_key>');
        break;
      }
      const result = crossBridge(state, args[1]);
      for (const m of result.msgs) console.log(m);
      if (result.nextState) {
        state = result.nextState;
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        printStatus(state);
      }
      break;
    }

    case 'next_age': {
      // Legacy alias — show bridges instead
      console.log('  Time is not a line. Use "node song.js cross" to see where the song can take you.');
      const bridges = getAvailableBridges(state);
      const open = bridges.filter(b => b.met);
      if (open.length > 0) {
        console.log('  Open bridges:');
        for (const b of open) {
          console.log(`    → node song.js cross ${b.key}  (${b.age.name})`);
        }
      }
      break;
    }

    case 'reset':
      state = newState();
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      console.log('  From the ash, a new beginning.');
      printStatus(state);
      break;

    default:
      console.log(`Unknown action: ${action}`);
      printHelp();
  }
}

main();
