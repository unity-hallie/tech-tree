// halfling.ts — Homo floresiensis. The little people of the islands.
// Warm and practical. Songs about making do. Cozy and clever.

export const HALFLING_SONGS = {
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
};
