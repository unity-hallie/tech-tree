// between.ts — songs that emerge when peoples meet.
// The salmon crosses between salt and fresh. The bone flute is between
// dwarf and human. These are the songs that happen in the space between.

// ── Salmon tech — the creature that crosses between worlds ──
// Salt to fresh, ocean to mountain, living to dead to living.
// The salmon connects bear knowledge (river) to coastal knowledge (sea).
// It IS the tech tree — it grows upstream.

export const BETWEEN_SONGS = {
  salmon_song:{ tradition: 'between', people: 'between', name: 'The Salmon Song', prereqs: ['salmon_run', 'tide'], difficulty: 3,
                desc: 'When bear river-knowledge meets coastal tide-knowledge. The salmon goes from salt to fresh and back. It is the bridge.' },
  weir:       { tradition: 'between', people: 'between', name: 'The Weir Song', prereqs: ['salmon_song', 'blade'], difficulty: 3,
                desc: 'How to build a trap that thinks like a river. Stone and stick and patience. The salmon walks into it.' },
  kelp:       { tradition: 'between', people: 'between', name: 'The Kelp Song', prereqs: ['tide', 'root'], difficulty: 2,
                desc: 'What grows in the salt water is food. The forest of the coast. It feeds you when the land won\'t.' },
  smoke_song: { tradition: 'between', people: 'between', name: 'The Smoke Song', prereqs: ['salmon_song', 'ember'], difficulty: 3,
                desc: 'How to make the salmon last through winter. Smoke and salt and time. The first preservation.' },
  canoe:      { tradition: 'between', people: 'between', name: 'The Canoe Song', prereqs: ['salmon_song', 'tree_song'], difficulty: 4,
                desc: 'A tree hollowed to ride the water. Follow the salmon upstream. Follow it home.' },
  potlatch:   { tradition: 'between', people: 'between', name: 'The Potlatch Song', prereqs: ['salmon_song', 'feast'], difficulty: 4,
                desc: 'How to give everything away and become rich. The salmon gives its body to the river. The river gives it to the forest. Abundance through surrender.' },
  salmon_return: { tradition: 'between', people: 'between', name: 'The Return Song', prereqs: ['salmon_song', 'star_bear'], difficulty: 5,
                desc: 'The salmon returns to where it was born to die. The bear waits at the river. The forest eats the bear\'s leavings. The tree grows. It falls in the river. The salmon hides behind it. The cycle IS the song.' },

  // ── Language songs — how to live alongside the other ──
  // These are not blood. They are learned, fragile, and lost in a generation of silence.
  // Each reduces friction with a people. Without them, coexistence grinds.
  giant_song:   { tradition: 'between', people: 'between', name: 'The Giant Song', prereqs: ['heartbeat', 'lullaby'], difficulty: 2,
                  desc: 'What dwarves sing about humans. How to read the big people. How to trade with them without being stepped on.',
                  staff: { friction_human: -0.5 } },
  troll_song:   { tradition: 'between', people: 'between', name: 'The Troll Song', prereqs: ['heartbeat', 'stone_sleep'], difficulty: 2,
                  desc: 'What the later peoples sing about the ancient ones. How to find them. How to not wake them wrong.',
                  staff: { friction_troll: -0.5 } },
  dwarf_song:   { tradition: 'between', people: 'between', name: 'The Dwarf Song', prereqs: ['flake', 'lullaby'], difficulty: 2,
                  desc: 'What humans sing about the cave people. How to approach the mountain. How to ask for craft.',
                  staff: { friction_dwarf: -0.5 } },
  elf_song:     { tradition: 'between', people: 'between', name: 'The Elf Song', prereqs: ['ghost_walk', 'lullaby'], difficulty: 3,
                  desc: 'What anyone sings about the hidden people. Mostly wrong. But the attempt itself is the bridge.',
                  staff: { friction_elf: -0.5 } },
  halfling_song:{ tradition: 'between', people: 'between', name: 'The Halfling Song', prereqs: ['island', 'lullaby'], difficulty: 2,
                  desc: 'What the mainland peoples sing about the little islanders. How small the world can be and still be enough.',
                  staff: { friction_halfling: -0.5 } },

  // ── Songs from the meeting of peoples ──
  bear_gift:  { tradition: 'between', people: 'between', name: 'The Bear Gift', prereqs: ['den_memory', 'heartbeat'], difficulty: 3,
                desc: 'When the first upright walkers entered the bear caves. The bears did not attack. They taught.' },
  fire_cave:  { tradition: 'between', people: 'between', name: 'Fire in the Cave', prereqs: ['ember', 'cave_song'], difficulty: 3,
                desc: 'When humans brought spark-fire into dwarf caves. The first painted ceilings.' },
  dream_walk: { tradition: 'between', people: 'between', name: 'The Dream Walk', prereqs: ['ghost_walk', 'elder_song'], difficulty: 4,
                desc: 'When human memory met elf invisibility. How to walk in the dreaming.' },
  bone_flute: { tradition: 'between', people: 'between', name: 'The Bone Flute', prereqs: ['bear', 'lullaby'], difficulty: 3,
                desc: 'When dwarf bear-knowledge met human singing. The oldest instrument. Found in a Neanderthal cave.' },
  sea_cross:  { tradition: 'between', people: 'between', name: 'The Sea Crossing', prereqs: ['tide', 'far_sight'], difficulty: 4,
                desc: 'When halfling tide-knowledge met elf far-sight. How to cross water you cannot see across.' },
  deep_time:  { tradition: 'between', people: 'between', name: 'The Deep Time Song', prereqs: ['stone_sleep', 'precession'], difficulty: 5,
                desc: 'When troll endurance met human sky-knowledge. How to think in ice ages.' },
};
