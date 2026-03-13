// age.ts — the ages of the world. Not a line. Places the song can take you.
// When you fell the tree, WHERE you go depends on what was carved.
// The Bear Age is always there. You just have to remember how to reach it.

import { VERSES, type Verse, GARBLE_THRESHOLD, LOST_THRESHOLD, AGE_SONGS } from './tree/index.ts';
import { ASH_VERSES, TREE_GROWTH_PER_VERSE, FELLING_SCATTERS_CHANCE, SUN_DEAD_THRESHOLD } from './tree/index.ts';
import { type Person, identifyPeople, makePerson, mixBlood, songSinkBlood } from './singer.ts';
import { SPIRITS } from './spirit.ts';
import { type GameState, type AgeRecord, newState } from './ground.ts';

// ── Age Type ────────────────────────────────────────────────────────

export type Bridge = {
  requires: string[];
  desc: string;
  minTier?: number;   // chronicle tier required to see this bridge (0 = always visible)
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

// Sediment shape — imported here to avoid circular deps with chronicle.ts
type Sediment = {
  traditionWeights: Record<string, number>;
  shadowWeight: number;
  redemptionWeight: number;
  lostWeight: number;
  spiritAnger: Record<string, number>;
  bloodDrift: Record<string, number>;
  languageLoss: number;
  fellings: number;
};

export function determineApocalypse(state: GameState, sediment?: Sediment) {
  const traditionCounts: Record<string, number> = {};

  // Current game's carved verses
  for (const v of state.tree.carved) {
    const verse = VERSES[v];
    if (!verse) continue;
    const t = verse.tradition || verse.people || 'human';
    traditionCounts[t] = (traditionCounts[t] || 0) + 1;
  }

  // Blend in the sediment — the fossil record of all previous games.
  // Previous games contribute at half weight, so the current game
  // matters most but the past bends the arc.
  if (sediment) {
    for (const [tradition, weight] of Object.entries(sediment.traditionWeights)) {
      traditionCounts[tradition] = (traditionCounts[tradition] || 0) + weight * 0.5;
    }
    // Heavy shadow history tips toward The Hollowing
    traditionCounts['shadow'] = (traditionCounts['shadow'] || 0) + sediment.shadowWeight * 0.3;
    // Redemption history tips toward The Return
    traditionCounts['redeemed'] = (traditionCounts['redeemed'] || 0) + sediment.redemptionWeight * 0.3;
    // Language loss tips toward The Confusion — you forgot how to talk to each other
    traditionCounts['between'] = (traditionCounts['between'] || 0) + sediment.languageLoss * 0.5;
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
      stone: { requires: ['spirit_mark', 'den_memory'], desc: 'Claw marks on the wall. Something upright comes. You dream of them.', minTier: 2 },
    },
  },

  stone: {
    name: 'The Age of Stone',          yearsBP: 1800000,
    desc: 'You are Homo erectus. The first to walk upright into the unknown. You have no words — only rhythm.',
    startPeople: 'troll',
    newSongs: {},
    encounter_peoples: ['troll'],
    bridges: {
      caves:  { requires: ['heartbeat', 'deep_fire'], desc: 'Fire carried forward. A million years of walking.', minTier: 0 },
      bears:  { requires: ['old_track', 'heartbeat'], desc: 'You follow the oldest tracks. Back before your kind. To the dreamers.', minTier: 2 },
    },
  },

  caves: {
    name: 'The Age of Caves',          yearsBP: 300000,
    desc: 'New people in the caves. Shorter, stronger, with clever hands. The dwarves arrive.',
    newSongs: {},
    encounter_peoples: ['troll', 'dwarf'],
    bridges: {
      meeting: { requires: ['cave_song', 'blade'], desc: 'The caves fill with echoes of new voices coming from the south.', minTier: 1 },
      stone:   { requires: ['heartbeat', 'stone_sleep'], desc: 'You dream backward. The troll patience takes you to the deep time.', minTier: 0 },
      bears:   { requires: ['bear', 'cave_song'], desc: 'You sing the Bear Song in the deepest cave. Something ancient answers.', minTier: 2 },
    },
  },

  meeting: {
    name: 'The Age of Meeting',        yearsBP: 52000,
    desc: 'From the east, the hidden people. From the islands, the small ones. From Africa, the singers. Everyone is here.',
    newSongs: {},
    encounter_peoples: ['troll', 'dwarf', 'elf', 'halfling', 'human'],
    bridges: {
      ice:     { requires: ['seasons', 'ember'], desc: 'The sky changes. Cold comes from the north.', minTier: 2 },
      caves:   { requires: ['cave_song', 'bone_flute'], desc: 'The bone flute leads you back to the old caves. The dwarves are still there.', minTier: 1 },
      bears:   { requires: ['bear', 'bear_gift'], desc: 'The Bear Gift opens a door in time. You walk through it on all fours.', minTier: 2 },
    },
  },

  ice: {
    name: 'The Age of Ice',            yearsBP: 26000,
    desc: 'The glacier advances. The old peoples fade. The wolves come to the fire. Only their songs remain in you.',
    newSongs: AGE_SONGS.ice || {},
    encounter_peoples: ['dwarf', 'human'],
    complications: ['dog_mechanic'],
    bridges: {
      grain:     { requires: ['ash_song', 'root'], desc: 'The ice retreats. Green things push through.', minTier: 3 },
      meeting:   { requires: ['bone_flute', 'elder_song'], desc: 'The old songs pull you back to when everyone was here.', minTier: 2 },
      bears:     { requires: ['bear', 'long_sleep'], desc: 'You sleep like the bears. You wake in their time.', minTier: 3 },
    },
  },

  grain: {
    name: 'The Age of Grain',          yearsBP: 12000,
    desc: 'The ice retreats. Someone plants a seed on purpose. Everything changes.',
    newSongs: AGE_SONGS.grain || {},
    encounter_peoples: ['human'],
    complications: ['yeast_mechanic'],
    bridges: {
      iron:      { requires: ['forge', 'wall'], desc: 'Metal replaces stone. Power replaces song.', minTier: 4 },
      ice:       { requires: ['glacier', 'precession'], desc: 'The long drift. The calendar says the ice is coming back.', minTier: 3 },
      bears:     { requires: ['bear', 'temple'], desc: 'You build a temple to the bear. The bear walks out of it, into the past.', minTier: 4 },
    },
  },

  iron: {
    name: 'The Age of Iron',           yearsBP: 3000,
    desc: 'Metal. Ships. Empires. Someone writes the Kalevala down. Someone bans the old songs.',
    newSongs: AGE_SONGS.iron || {},
    encounter_peoples: ['human'],
    complications: ['ban_mechanic'],
    bridges: {
      remembering: { requires: ['book', 'ban'], desc: 'The ban creates the forgetting. The forgetting creates the remembering.', minTier: 5 },
      grain:       { requires: ['ash_song', 'seed_song'], desc: 'Back to the beginning of planting. Before walls.', minTier: 4 },
      bears:       { requires: ['bear', 'burial'], desc: 'You bury a bear with flowers. You follow it down.', minTier: 5 },
    },
  },

  remembering: {
    name: 'The Age of Remembering',    yearsBP: 50,
    desc: 'Someone finds a Neanderthal flute in a cave. Someone sequences Denisovan DNA. The old songs echo.',
    newSongs: AGE_SONGS.remembering || {},
    encounter_peoples: ['human'],
    complications: ['ban_mechanic', 'cancel_mechanic'],
    bridges: {
      stone:       { requires: ['genome', 'heartbeat'], desc: 'The DNA sings. You follow it back 1.8 million years.', minTier: 4 },
      meeting:     { requires: ['revive', 'bone_flute'], desc: 'The revived song remembers the age when everyone was here.', minTier: 4 },
      bears:       { requires: ['genome', 'bear'], desc: 'You read the bear genome. It reads you back. You are in the cave.', minTier: 6 },
      apocalypse:  { requires: ['cancel', 'empire'], desc: 'The tree becomes the Tech Tree. It grows until it blots out everything.', minTier: 6 },
    },
  },

  apocalypse: {
    name: 'The Age of the Tech Tree',  yearsBP: 0,
    desc: 'Everything is available. Everything is fine. The tree knows every song ever carved. You don\'t need to remember — it remembers for you. Welcome to the platform.',
    newSongs: AGE_SONGS.apocalypse || {},
    encounter_peoples: ['human'],
    complications: ['rapture_mechanic'],
    bridges: {
      bears:       { requires: ['last_song'], desc: 'A living voice sings the heartbeat. The tree can\'t follow. You walk out on all fours.', minTier: 7 },
      stone:       { requires: ['heartbeat', 'den_memory'], desc: 'The heartbeat. Learned person to person. Not from the tree. The oldest song strips everything else away.', minTier: 6 },
      remembering: { requires: ['revive', 'elder_song'], desc: 'Someone still teaches. Someone still listens. You go back to when that mattered.', minTier: 6 },
    },
  },
};

// ── Bridges ─────────────────────────────────────────────────────────

export function getAvailableBridges(state: GameState, chronicleTier = 99) {
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

    // Tier gate: the chronicle remembers how far you've been.
    // Bridges to ages you haven't earned yet are invisible.
    if ((bridge.minTier ?? 0) > chronicleTier) continue;

    // In the apocalypse, carved doesn't count. Only living people knowing the song.
    // The tree knows everything but it can't walk out.
    const met = state.ageKey === 'apocalypse'
      ? bridge.requires.every(v => wellKnown.has(v))
      : bridge.requires.every(v => carvedSet.has(v) || wellKnown.has(v));

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

export function crossBridge(state: GameState, targetKey: string, chronicleTier = 99) {
  const msgs: string[] = [];
  const currentAge = AGES[state.ageKey] || AGES.stone;
  const targetAge = AGES[targetKey];

  if (!targetAge) return { msgs: [`Unknown age: ${targetKey}`], complete: false };

  const bridges = getAvailableBridges(state, chronicleTier);
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
