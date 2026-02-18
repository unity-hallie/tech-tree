// dwarf.ts — Neanderthal. Cave dwellers, master shapers of stone.
// Rich and precise. Technical. Songs you sing while working with your hands.

export const DWARF_SONGS = {
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
};
