// elf.ts — Denisovan. The hidden people, who left almost no trace.
// Haunting. You can barely remember them after hearing. Like a dream.

export const ELF_SONGS = {
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
};
