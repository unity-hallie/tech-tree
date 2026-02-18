// troll.ts — Homo erectus. The ancient ones, turned to stone by time.
// These are barely songs. Rhythms. Vibrations. Pre-linguistic.

export const TROLL_SONGS = {
  heartbeat:  { tradition: 'troll', people: 'troll', name: 'The Heartbeat', prereqs: [], difficulty: 1,
                desc: 'The first rhythm. Before words, before fire. The beat that means: we are here.' },
  stone_sleep:{ tradition: 'troll', people: 'troll', name: 'Stone Sleep', prereqs: ['heartbeat'], difficulty: 2,
                desc: 'How to endure. How to wait a million years. The trolls turned to stone because they knew how.' },
  deep_fire:  { tradition: 'troll', people: 'troll', name: 'The Deep Fire', prereqs: ['heartbeat'], difficulty: 2,
                desc: 'Not flint-spark fire. The fire that was already there, in the earth, since before anyone.' },
  old_track:  { tradition: 'troll', people: 'troll', name: 'The Old Track', prereqs: ['heartbeat'], difficulty: 2,
                desc: 'How to follow the paths that were worn before anyone remembers. The game trails older than species.' },
};
