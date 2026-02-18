// ground.ts — the state of the world. The land, the tree, the shadows.
// Everything that persists between seasons. The shape of what is.

import { VERSES } from './tree/index.ts';
import { type Person, generateStartingPeople } from './singer.ts';
import { SPIRITS } from './spirit.ts';
import { AGES, type Age } from './age.ts';

// ── The State ───────────────────────────────────────────────────────

export type AgeRecord = {
  name: string;
  key: string;
  yearsBP: number;
  fellings: number;
  songsCarried: string[];
  songsLost: string[];
  bridgeTaken: string;
};

export type GameState = {
  season: number;             // 0=spring, 1=summer, 2=autumn, 3=winter
  year: number;
  yearsBP: number;
  ageKey: string;
  ageName: string;

  people: Person[];

  inheritedSongs: Record<string, number>;
  previousAges: AgeRecord[];
  unlockedAges: string[];

  tree: {
    height: number;
    carved: string[];
  };

  fragments: { verse: string; integrity: number }[];

  sunlight: number;
  food: number;
  location: string;

  encounter: Person | null;

  messages: string[];

  setlist: string[];
  setlistHistory: Record<string, number>;

  shadows: Record<string, number>;

  spirits: Record<string, { spirit: number; danger: number }>;

  ashVerses: string[];

  fellings: number;
  totalLost: string[];

  // Transient
  nightPenalty?: number;
  collapsed?: boolean;
};

// ── Creating state ──────────────────────────────────────────────────

export function newState(
  ageKey = 'stone',
  inheritedSongs: Record<string, number> = {},
  previousAges: AgeRecord[] = [],
  unlockedAges: string[] = [],
): GameState {
  const age = AGES[ageKey] || AGES.stone;

  // Register any new songs from this age
  if (age.newSongs) {
    Object.assign(VERSES, age.newSongs);
  }

  return {
    season: 0,
    year: 0,
    yearsBP: age.yearsBP,
    ageKey,
    ageName: age.name,

    people: generateStartingPeople(ageKey, inheritedSongs),

    inheritedSongs,
    previousAges,
    unlockedAges,

    tree: {
      height: 0,
      carved: [],
    },

    fragments: [],

    sunlight: 1.0,
    food: 14,
    location: 'camp',

    encounter: null,

    messages: [],

    setlist: [],
    setlistHistory: {},

    shadows: {},

    spirits: Object.fromEntries(
      Object.entries(SPIRITS).map(([key, def]) => [key, { spirit: 1.0, danger: def.baseDanger }])
    ),

    ashVerses: [],

    fellings: 0,
    totalLost: [],
  };
}
