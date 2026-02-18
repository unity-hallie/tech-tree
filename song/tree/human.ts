// human.ts — Homo sapiens. The newcomers, the great singers.
// Also contains the PEOPLES registry — because humans named everyone.

import { type People } from './index.ts';

// ── The Peoples ───────────────────────────────────────────────────────
// Not Tolkien's invention — what Tolkien was remembering.

export const PEOPLES: Record<string, People> = {
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

// ── Human Songs ───────────────────────────────────────────────────────

export const HUMAN_SONGS = {
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
  // ash_song is a shadow verse — emerges when root is sung without track
  grain:      { tradition: 'human', people: 'human', name: 'The Grain Song', prereqs: ['ash_song', 'seasons'], difficulty: 4,
                desc: 'How to make the earth remember what to grow' },
  ore:        { tradition: 'human', people: 'human', name: 'Ore Reading', prereqs: ['blade', 'spark'], difficulty: 3,
                desc: 'How to see the metal sleeping in rock' },
  forge:      { tradition: 'human', people: 'human', name: 'The Forging Song', prereqs: ['spark', 'ore'], difficulty: 4,
                desc: 'How to make stone flow like water. Ilmarinen forges the Sampo.' },
  precession: { tradition: 'human', people: 'human', name: 'The Long Drift', prereqs: ['seasons', 'elder_song', 'far_sight'], difficulty: 5,
                desc: 'How even the nail slowly circles. Needs elf-sight to see what takes 26,000 years.' },
};
