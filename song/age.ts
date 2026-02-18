// age.ts — the ages of the world. Not a line. Places the song can take you.
// When you fell the tree, WHERE you go depends on what was carved.
// The Bear Age is always there. You just have to remember how to reach it.

import { VERSES, type Verse, GARBLE_THRESHOLD, LOST_THRESHOLD } from './tree/index.ts';
import { ASH_VERSES, TREE_GROWTH_PER_VERSE, FELLING_SCATTERS_CHANCE, SUN_DEAD_THRESHOLD } from './tree/index.ts';
import { type Person, identifyPeople, makePerson, mixBlood, songSinkBlood } from './singer.ts';
import { SPIRITS } from './spirit.ts';
import { type GameState, type AgeRecord, newState } from './ground.ts';

// ── Age Type ────────────────────────────────────────────────────────

export type Bridge = {
  requires: string[];
  desc: string;
};

export type Age = {
  name: string;
  yearsBP: number;
  desc: string;
  startPeople?: string;
  newSongs: Record<string, Verse>;
  encounter_peoples: string[];
  hidden?: boolean;
  unlock?: string;
  complications?: string[];
  bridges: Record<string, Bridge>;
};

// ── Apocalypse Types ────────────────────────────────────────────────
// The end of each age is determined by what you carved.
// The tree always kills you. But HOW depends on what you put in it.

export const APOCALYPSE_TYPES: Record<string, { name: string; desc: string; traditions: string[] }> = {
  fire:   { name: 'The Burning',
            desc: 'Too many fire songs on the tree. The knowledge of flame becomes the flame itself.',
            traditions: ['fire', 'dwarf'] },
  ice:    { name: 'The Freeze',
            desc: 'Too many stone and earth songs. The weight of knowledge crushes. The glacier comes.',
            traditions: ['stone', 'troll', 'earth'] },
  sky:    { name: 'The Drift',
            desc: 'Too many sky songs. The precession shifts. Everything built on the calendar collapses.',
            traditions: ['sky', 'elf'] },
  shadow: { name: 'The Hollowing',
            desc: 'Too many shadow songs on the tree. The knowledge is all form and no foundation. The tree is hollow.',
            traditions: ['shadow'] },
  between:{ name: 'The Confusion',
            desc: 'Too many songs from too many traditions. The tower of knowledge babels.',
            traditions: ['between'] },
  redeemed: { name: 'The Return',
              desc: 'The shadows met their roots. The tree grows back from the inside. Not the same tree. A better one.',
              traditions: ['redeemed'] },
};

export function determineApocalypse(state: GameState) {
  const traditionCounts: Record<string, number> = {};
  for (const v of state.tree.carved) {
    const verse = VERSES[v];
    if (!verse) continue;
    const t = verse.tradition || verse.people || 'human';
    traditionCounts[t] = (traditionCounts[t] || 0) + 1;
  }

  let bestType = 'between';
  let bestScore = 0;
  for (const [type, def] of Object.entries(APOCALYPSE_TYPES)) {
    let score = 0;
    for (const t of def.traditions) {
      score += traditionCounts[t] || 0;
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  return APOCALYPSE_TYPES[bestType] || APOCALYPSE_TYPES.between;
}

// ── The Ages ────────────────────────────────────────────────────────

export const AGES: Record<string, Age> = {
  bears: {
    name: 'The Age of Bears',          yearsBP: 2500000,
    desc: 'Before the upright ones. The cave bears dream in cycles older than species. You are not human. You are not even hominid. You are the dreamer.',
    startPeople: 'bear',
    newSongs: {},
    encounter_peoples: ['bear'],
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
      paint:      { tradition: 'between', people: 'between', name: 'The Paint Song', prereqs: ['ochre', 'fire_cave'], difficulty: 3,
                    desc: 'How to put the world on the wall. Lascaux. Chauvet. The first galleries.' },
      dog:        { tradition: 'between', people: 'between', name: 'The Dog Song', prereqs: ['wolf_song', 'ember', 'lullaby'], difficulty: 4,
                    desc: 'The wolf comes to the fire. You sing the Wolf Song but softer, like a lullaby. It stays. It stays. The first domestication. The dwarves never forgave you.' },
      dog_guard:  { tradition: 'human', people: 'human', name: 'The Guard Song', prereqs: ['dog', 'wall'], difficulty: 3,
                    desc: 'The dog patrols the perimeter. Nothing with old blood crosses it. The trolls retreat. The dwarves go underground. The dog chose you.' },
      dog_hunt:   { tradition: 'between', people: 'between', name: 'The Hunt Song', prereqs: ['dog', 'track'], difficulty: 3,
                    desc: 'How to hunt with a dog. You are faster together. You see what the dog smells. The dog sees what you point at. No other animal does this.' },
      dog_sled:   { tradition: 'between', people: 'between', name: 'The Sled Song', prereqs: ['dog', 'migration'], difficulty: 4,
                    desc: 'The dog pulls you across the ice. The circumpolar highway. From Siberia to Greenland, the dogs run.' },
      dog_burial: { tradition: 'between', people: 'between', name: 'The Dog Burial', prereqs: ['dog', 'burial'], difficulty: 3,
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
      ledger:     { tradition: 'human', people: 'human', name: 'The Ledger Song', prereqs: ['grain', 'pottery'], difficulty: 3,
                    desc: 'How many bushels does the temple owe? Marks on clay. The first writing is accounting. The yeast produces surplus and surplus demands to be counted.' },
      rune:       { tradition: 'human', people: 'human', name: 'The Rune Song', prereqs: ['burial', 'tree_song'], difficulty: 4,
                    desc: 'Marks on standing stones. Marks on graves. The dead need names. The paths need markers. Odin hung nine nights on the world tree for this. Writing born from ceremony and wayfinding, not from grain.' },
      writing:    { tradition: 'between', people: 'between', name: 'The Writing Song', prereqs: ['ledger', 'rune'], difficulty: 4,
                    desc: 'When the grain-counter\'s marks meet the grave-marker\'s runes. Two ways of making permanent become one. The song that doesn\'t need a singer.' },
      brew:       { tradition: 'between', people: 'between', name: 'The Brewing Song', prereqs: ['grain', 'pottery'], difficulty: 3,
                    desc: 'The grain left in the clay pot foamed. You drank it and the world changed. Beer before bread — the oldest argument in archaeology. The yeast was always there. You just gave it a house.' },
      bake:       { tradition: 'human', people: 'human', name: 'The Baking Song', prereqs: ['grain', 'ember'], difficulty: 2,
                    desc: 'The dough rises. You don\'t know why. You just know the song: knead, wait, fire. The waiting IS the yeast. Every baker\'s hands carry a civilization of invisible singers.' },
      sourdough:  { tradition: 'between', people: 'between', name: 'The Mother Song', prereqs: ['bake', 'elder_song'], difficulty: 4,
                    desc: 'The starter that lives. You feed it. You keep it warm. You pass it to your children. Some sourdough starters are older than any living song. The mother IS the yeast, kept alive like a fire. The first inheritance that isn\'t blood.' },
      mead:       { tradition: 'between', people: 'between', name: 'The Mead Song', prereqs: ['brew', 'root'], difficulty: 3,
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
      book:       { tradition: 'human', people: 'human', name: 'The Book', prereqs: ['writing', 'elder_song'], difficulty: 3,
                    desc: 'How to make a tree into a song that never forgets. But also never changes.' },
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
      genome:     { tradition: 'between', people: 'between', name: 'The Blood Song', prereqs: ['archaeology', 'deep_time'], difficulty: 5,
                    desc: 'How to read the songs written in your body. 2% Neanderthal. 5% Denisovan. All of it, singing.' },
      revive:     { tradition: 'human', people: 'human', name: 'The Revival Song', prereqs: ['archaeology', 'elder_song'], difficulty: 4,
                    desc: 'How to teach a song that no one alive remembers. Language revitalization. The undeath of knowledge.' },
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
      last_song:  { tradition: 'between', people: 'between', name: 'The Last Song', prereqs: ['genome', 'bear_gift', 'den_memory'], difficulty: 5,
                    desc: 'The only song that can fell the final tree. It requires remembering what was before the tree. Before the hominids. The bears.' },
    },
    encounter_peoples: ['human'],
    complications: ['ban_mechanic', 'cancel_mechanic', 'algorithm_mechanic'],
    bridges: {
      bears:       { requires: ['last_song'], desc: 'You fell the Tech Tree. In the ash, the bears are waiting. They always were.' },
      stone:       { requires: ['genome', 'heartbeat'], desc: 'You strip it all back. Before writing. Before fire. The heartbeat.' },
      remembering: { requires: ['revive'], desc: 'Not this time. You go back and try to remember harder.' },
    },
  },
};

// ── Bridges ─────────────────────────────────────────────────────────

export function getAvailableBridges(state: GameState) {
  const currentAge = AGES[state.ageKey] || AGES.stone;
  if (!currentAge.bridges) return [];

  const carvedSet = new Set(state.tree.carved);
  const wellKnown = new Set<string>();
  for (const p of state.people) {
    for (const [v, integ] of Object.entries(p.verses)) {
      if (integ >= GARBLE_THRESHOLD) wellKnown.add(v);
    }
  }

  const available: { key: string; age: Age; bridge: Bridge; met: boolean }[] = [];
  for (const [targetKey, bridge] of Object.entries(currentAge.bridges)) {
    const targetAge = AGES[targetKey];
    if (!targetAge) continue;
    if (targetAge.hidden && !state.unlockedAges?.includes(targetKey)) continue;
    const met = bridge.requires.every(v => carvedSet.has(v) || wellKnown.has(v));
    available.push({ key: targetKey, age: targetAge, bridge, met });
  }
  return available;
}

// ── Crossing ────────────────────────────────────────────────────────

const MONTAGES: Record<string, string[]> = {
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

export function crossBridge(state: GameState, targetKey: string) {
  const msgs: string[] = [];
  const currentAge = AGES[state.ageKey] || AGES.stone;
  const targetAge = AGES[targetKey];

  if (!targetAge) return { msgs: [`Unknown age: ${targetKey}`], complete: false };

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
  const surviving: Record<string, number> = {};
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

  // Apocalypse flavor
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

  // Montage
  const montageKey = `${state.ageKey}->${targetKey}`;
  for (const line of (MONTAGES[montageKey] || ['  The song carries you across.'])) {
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
  const ageRecord: AgeRecord = {
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
