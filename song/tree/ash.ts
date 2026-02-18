// ash.ts — what grows from the fallen tree.
// These can only be learned from the ash after a felling.
// They emerge from combinations of carved verses.

import { type Verse } from './index.ts';

export const ASH_VERSES: Record<string, Verse> = {
  phoenix_song: { tradition: 'ash', people: 'ash', name: 'The Phoenix Song', prereqs: ['ember', 'elder_song'],
                  desc: 'A song about loss and return — it can only be composed after a felling',
                  difficulty: 3, emerges_from: ['ember', 'lullaby'] },
  deep_root:    { tradition: 'ash', people: 'ash', name: 'The Deep Root Song', prereqs: ['root', 'bear'],
                  desc: 'How the roots survive when the trunk is cut — learned from the bears',
                  difficulty: 3, emerges_from: ['root', 'bear'] },
  star_map:     { tradition: 'ash', people: 'ash', name: 'The Scar Map', prereqs: ['polestar', 'tree_song'],
                  desc: 'How to read the stump rings as a map of what was — where the carvings were',
                  difficulty: 3, emerges_from: ['polestar', 'tree_song'] },
  seed_song:    { tradition: 'ash', people: 'ash', name: 'The Seed Song', prereqs: ['ash_song', 'grain'],
                  desc: 'How to plant in the ash of the fallen Tree — the richest soil there is',
                  difficulty: 3, emerges_from: ['ash_song', 'grain'] },
  iron_song:    { tradition: 'ash', people: 'ash', name: 'The Iron Song', prereqs: ['forge', 'blade'],
                  desc: 'How the axe remembers the tree it felled — and the tree remembers the axe',
                  difficulty: 3, emerges_from: ['forge', 'blade'] },
  troll_echo:   { tradition: 'ash', people: 'ash', name: 'The Troll Echo', prereqs: ['heartbeat', 'bone_flute'],
                  desc: 'When the tree falls, the oldest rhythm returns. The trolls were here before the tree.',
                  difficulty: 3, emerges_from: ['heartbeat', 'bone_flute'] },
};
