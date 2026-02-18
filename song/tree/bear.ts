// bear.ts — Ursus spelaeus. Oldest of all, pre-hominin.
// Not songs at all. Patterns older than language, older than hands.

export const BEAR_SONGS = {
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
};
