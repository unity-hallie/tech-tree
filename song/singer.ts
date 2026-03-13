// singer.ts — the people who carry the song.
// Born, learn, age, die. Their blood remembers what their tongues forget.
// Youth absorb. Adults teach. Elders teach best, then leave.

import { VERSES, type Verse } from './tree/index.ts';
import {
  BLOOD_VERSES, PEOPLE_BLOOD, BLOOD_DRIFT, BLOOD_THRESHOLD,
  BLOOD_ALLERGY_THRESHOLD, SONG_BLOODS, SONG_SINK_THRESHOLD, SONG_SINK_AMOUNT,
  PEOPLES,
} from './tree/index.ts';

// ── The Staff — modifiers carried by blood ────────────────────────────
// A blood verse can have a staff: { lifespan: 7.0, teaching: 0.3, ... }
// bloodStaff sums them, weighted by the person's blood level.
// lifespan 7.0 at level 1.0 = multiplier of 8x (1 + 7). At 0.5 = 4.5x.

export function bloodStaff(person: Person, modifier: string): number {
  const blood = person.blood || {};
  let total = 0;
  for (const [bloodKey, level] of Object.entries(blood)) {
    const def = BLOOD_VERSES[bloodKey];
    if (def?.staff?.[modifier]) {
      total += def.staff[modifier] * (level as number);
    }
  }
  return total;
}

// ── Age ─────────────────────────────────────────────────────────────
// Base thresholds: youth 0-4, adult 5-16, elder 17-24, dead 25+
// The staff stretches these. old_blood at 1.0 → 8x → dead at 200.

const BASE_YOUTH = 4;
const BASE_ADULT = 16;
const BASE_ELDER = 24;

export function ageCategory(personOrAge: Person | number): 'youth' | 'adult' | 'elder' | 'dead' {
  if (typeof personOrAge === 'number') {
    // raw number fallback — no blood, base thresholds
    if (personOrAge <= BASE_YOUTH) return 'youth';
    if (personOrAge <= BASE_ADULT) return 'adult';
    if (personOrAge <= BASE_ELDER) return 'elder';
    return 'dead';
  }
  const p = personOrAge;
  const m = 1 + bloodStaff(p, 'lifespan');
  if (p.age <= BASE_YOUTH * m) return 'youth';
  if (p.age <= BASE_ADULT * m) return 'adult';
  if (p.age <= BASE_ELDER * m) return 'elder';
  return 'dead';
}

export function teachingPower(person: Person): number {
  const cat = ageCategory(person);
  if (cat === 'elder') return 2.0;
  if (cat === 'adult') return 1.0;
  return 0;
}

// ── Person type ─────────────────────────────────────────────────────

export type Person = {
  name: string;
  age: number;
  people: string;
  blood: Record<string, number>;
  verses: Record<string, number>;
};

// ── Blood ───────────────────────────────────────────────────────────
// Heritage as song on a different timescale.

export function getBlood(person: Person): Record<string, number> {
  if (person.blood && typeof person.blood === 'object') return person.blood;
  const peopleKey = person.people || 'human';
  const pattern = PEOPLE_BLOOD[peopleKey];
  if (!pattern) return { song_blood: 1.0 };
  const blood: Record<string, number> = {};
  for (const bv of pattern.primary) blood[bv] = 1.0;
  return blood;
}

export function bloodLevel(person: Person, bloodVerse: string): number {
  return getBlood(person)[bloodVerse] || 0;
}

// What "people" label best fits this person's blood?
export function identifyPeople(person: Pick<Person, 'blood'>, ageKey?: string): string {
  const blood = person.blood || {};
  let bestKey = 'human';
  let bestScore = 0;
  for (const [key, pattern] of Object.entries(PEOPLE_BLOOD)) {
    if (key === 'orc') continue;
    let score = 0;
    for (const bv of pattern.primary) {
      score += blood[bv] || 0;
    }
    score /= pattern.primary.length;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }
  // Troll vs Orc: same blood, different name.
  // In iron age and later, if shaman_blood is low, the fearful call them orcs.
  if (bestKey === 'troll' && ageKey) {
    const lateAges = ['iron', 'remembering', 'apocalypse'];
    if (lateAges.includes(ageKey) && (blood.shaman_blood || 0) < 0.1) {
      bestKey = 'orc';
    }
  }
  return bestKey;
}

export function isAllergicTo(person: Person, spiritKey: string, spirits: Record<string, any>): boolean {
  const spirit = spirits[spiritKey];
  if (!spirit) return false;
  const blood = getBlood(person);
  for (const bv of Object.keys(blood)) {
    if (blood[bv] < BLOOD_ALLERGY_THRESHOLD) continue;
    const bvDef = BLOOD_VERSES[bv];
    if (bvDef && bvDef.triggers.includes(spiritKey)) return true;
  }
  return false;
}

export function allergyStrength(person: Person, spiritKey: string): number {
  const blood = getBlood(person);
  let total = 0;
  for (const bv of Object.keys(blood)) {
    const bvDef = BLOOD_VERSES[bv];
    if (bvDef && bvDef.triggers.includes(spiritKey)) {
      total += blood[bv];
    }
  }
  return Math.min(1.0, total);
}

// Display label — what folklore calls you based on your blood
export function heritageLabel(person: Person): string {
  const blood = getBlood(person);
  const matches: { key: string; score: number }[] = [];
  for (const [key, pattern] of Object.entries(PEOPLE_BLOOD)) {
    if (key === 'orc') continue;
    let score = 0;
    for (const bv of pattern.primary) score += blood[bv] || 0;
    score /= pattern.primary.length;
    if (score >= 0.1) matches.push({ key, score });
  }
  matches.sort((a, b) => b.score - a.score);
  if (matches.length === 0) return '?';
  if (matches.length === 1 || matches[1].score < 0.1) {
    return matches[0].key.charAt(0).toUpperCase();
  }
  return matches.slice(0, 3).map(m => m.key.charAt(0).toUpperCase()).join('/');
}

// Detailed blood reading — for the Genome Song / status display
export function bloodReading(person: Person): string {
  const blood = getBlood(person);
  return Object.entries(blood)
    .filter(([, v]) => v >= BLOOD_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .map(([bv, v]) => `${BLOOD_VERSES[bv]?.name || bv} ${Math.round(v * 100)}%`)
    .join(', ');
}

// What songs does this person's blood make easier to learn?
export function bloodEases(person: Person): Record<string, number> {
  const blood = getBlood(person);
  const eased: Record<string, number> = {};
  for (const [bv, level] of Object.entries(blood)) {
    if (level < BLOOD_ALLERGY_THRESHOLD) continue;
    const def = BLOOD_VERSES[bv];
    if (!def) continue;
    for (const songId of def.eases) {
      eased[songId] = Math.max(eased[songId] || 0, level);
    }
  }
  return eased;
}

// ── Blood mixing and drift ──────────────────────────────────────────

export function mixBlood(parent1: Person, parent2: Person): Record<string, number> {
  const b1 = getBlood(parent1);
  const b2 = getBlood(parent2);
  const child: Record<string, number> = {};
  const allKeys = new Set([...Object.keys(b1), ...Object.keys(b2)]);
  for (const key of allKeys) {
    const avg = ((b1[key] || 0) + (b2[key] || 0)) / 2;
    if (avg >= BLOOD_THRESHOLD) child[key] = avg;
  }
  return child;
}

export function driftBlood(person: Person, dominantBloods: string[]): void {
  const blood = getBlood(person);
  const newBlood: Record<string, number> = {};
  for (const [key, val] of Object.entries(blood)) {
    if (dominantBloods.includes(key)) {
      newBlood[key] = Math.min(1.0, val + BLOOD_DRIFT);
    } else {
      const drifted = val - BLOOD_DRIFT;
      if (drifted >= BLOOD_THRESHOLD) newBlood[key] = drifted;
    }
  }
  for (const db of dominantBloods) {
    if (!newBlood[db]) newBlood[db] = BLOOD_DRIFT;
  }
  person.blood = newBlood;
}

// ── Song sinking — voice songs becoming blood ───────────────────────
// When both parents know a song well, the child's corresponding
// blood verses get a small boost. Culture becomes heritage.

export function songSinkBlood(parent1: Person, parent2: Person): Record<string, number> {
  const boost: Record<string, number> = {};
  for (const songId of Object.keys(VERSES)) {
    const p1 = (parent1.verses[songId] || 0);
    const p2 = (parent2.verses[songId] || 0);
    if (p1 >= SONG_SINK_THRESHOLD && p2 >= SONG_SINK_THRESHOLD) {
      const strength = Math.min(p1, p2);
      const bloods = SONG_BLOODS[songId];
      if (!bloods) continue;
      for (const bv of bloods) {
        const amount = SONG_SINK_AMOUNT * (strength / 1.0);
        boost[bv] = (boost[bv] || 0) + amount;
      }
    }
  }
  return boost;
}

// ── Making people ───────────────────────────────────────────────────

export function pureBlood(peopleKey: string, variation = 0.1): Record<string, number> {
  const pattern = PEOPLE_BLOOD[peopleKey];
  if (!pattern) return { song_blood: 1.0 };
  const blood: Record<string, number> = {};
  for (const bv of pattern.primary) {
    blood[bv] = 0.9 + Math.random() * variation;
  }
  return blood;
}

export function makePerson(
  name: string, age: number, peopleKey: string,
  verses: Record<string, number>,
  bloodOverride?: Record<string, number>,
): Person {
  return {
    name, age,
    people: peopleKey,
    blood: bloodOverride || pureBlood(peopleKey),
    verses,
  };
}

// ── Names ───────────────────────────────────────────────────────────

export const NAMES_BY_AGE: Record<string, string[]> = {
  bears:   ['Great-Paw', 'Honey-Dream', 'Old-Den', 'River-Watch', 'Snow-Sleep', 'Cub-Cry', 'Root-Dig'],
  stone:   ['Grok', 'Thud', 'Rumble', 'Ember-Eye', 'Stone-Hand', 'Old-Walk', 'Still-One'],
  caves:   ['Durin', 'Mim', 'Nain', 'Andvari', 'Sindri', 'Brokk', 'Alviss'],
  meeting: ['Aino', 'Joukahainen', 'Ilmatar', 'Kullervo', 'Louhi', 'Lemminkainen', 'Vainamoinen'],
  ice:     ['Aino', 'Joukahainen', 'Ilmatar', 'Kullervo', 'Louhi', 'Lemminkainen', 'Vainamoinen'],
  grain:   ['Marjatta', 'Pellervo', 'Sampsa', 'Ahti', 'Tuoni', 'Mielikki', 'Tapio'],
  iron:    ['Elias', 'Akseli', 'Minna', 'Johan', 'Kristina', 'Kaarle', 'Aleksis'],
  remembering: ['Aino', 'Joukahainen', 'Ilmatar', 'Kullervo', 'Louhi', 'Lemminkainen', 'Vainamoinen'],
  apocalypse:  ['User_7734', 'User_0451', 'User_1984', 'Admin_0001', 'User_2038', 'User_0000', 'User_FFFF'],
};

export const AGE_DEFAULT_PEOPLE: Record<string, string> = {
  bears: 'bear', stone: 'troll', caves: 'troll', meeting: 'human',
  ice: 'human', grain: 'human', iron: 'human', remembering: 'human', apocalypse: 'human',
};

export const AGE_BASE_SONGS: Record<string, Record<string, number>> = {
  bears:   { den_memory: 1.0, cub_call: 0.8 },
  stone:   { heartbeat: 1.0, bone_drum: 0.5 },
  caves:   { heartbeat: 0.7, flake: 0.6 },
  meeting: { lullaby: 0.8, root: 0.6, heartbeat: 0.5 },
  ice:     { lullaby: 0.8, root: 0.6, ember: 0.5 },
  grain:   { lullaby: 0.8, root: 0.7, spark: 0.5 },
  iron:    { lullaby: 0.8, root: 0.6, spark: 0.5, writing: 0.4 },
  remembering: { lullaby: 0.8, root: 0.6 },
  apocalypse:  { algorithm: 0.35, platform: 0.35, writing: 0.35, content: 0.35, optimize: 0.35, scale: 0.35 },
};

// Birth names for the yeast-surplus births
export const YEAST_NAMES = [
  'Barley', 'Hops', 'Malt', 'Leaven', 'Foam', 'Crust', 'Rise', 'Starter',
  'Kvass', 'Kumiss', 'Barm', 'Must', 'Wort', 'Dregs', 'Crumb',
];

export const BEAR_NAMES = [
  'Little-Paw', 'Bark-Nose', 'Berry-Find', 'Cave-Born', 'Ice-Cub', 'Moon-Watcher',
];

export const DEFAULT_NAMES = [
  'Kyllikki', 'Marjatta', 'Annikki', 'Tuoni', 'Seppo', 'Ahti',
  'Mielikki', 'Tapio', 'Pellervo', 'Nyyrikki', 'Tuulikki', 'Otso',
  'Kave', 'Untamo', 'Kalervo', 'Sampo', 'Antero',
];

// ── Starting people ─────────────────────────────────────────────────

export function generateStartingPeople(ageKey: string, inheritedSongs: Record<string, number>): Person[] {
  const names = NAMES_BY_AGE[ageKey] || NAMES_BY_AGE.meeting;
  const defaultPeople = AGE_DEFAULT_PEOPLE[ageKey] || 'human';
  const baseSongs = AGE_BASE_SONGS[ageKey] || {};
  const inheritedKeys = Object.keys(inheritedSongs);

  if (ageKey === 'bears') {
    // Bears carry den_blood — lifespan ~5x. Youth to ~20, adult to ~80, elder to ~120.
    return [
      makePerson('Great-Paw', 100, 'bear', { den_memory: 1.0, long_sleep: 0.7, salmon_run: 0.6 }),
      makePerson('Honey-Dream', 70, 'bear', { den_memory: 0.9, cub_call: 0.8 }),
      makePerson('Old-Den', 110, 'bear', { den_memory: 1.0, long_sleep: 0.9, root_dig: 0.7, star_bear: 0.4 }),
      makePerson('River-Watch', 50, 'bear', { den_memory: 0.8, salmon_run: 0.7 }),
      makePerson('Snow-Sleep', 30, 'bear', { den_memory: 0.6 }),
      makePerson('Cub-Cry', 10, 'bear', {}),
      makePerson('Root-Dig', 90, 'bear', { den_memory: 1.0, root_dig: 0.8, cub_call: 0.7 }),
    ];
  }

  if (ageKey === 'stone' && inheritedKeys.length === 0) {
    // Trolls carry old_blood — lifespan ~8x. Youth to ~32, adult to ~128, elder to ~192.
    return [
      makePerson('Grok', 160, 'troll', { heartbeat: 1.0, deep_fire: 0.4 }),
      makePerson('Thud', 120, 'troll', { heartbeat: 0.9, bone_drum: 0.5 }),
      makePerson('Rumble', 80, 'troll', { heartbeat: 0.8, howl_back: 0.4 }),
      makePerson('Ember-Eye', 50, 'troll', { heartbeat: 0.7 }),
      makePerson('Stone-Hand', 20, 'troll', {}),
      makePerson('Old-Walk', 170, 'troll', { heartbeat: 1.0, old_track: 0.6 }),
      makePerson('Still-One', 140, 'troll', { heartbeat: 1.0, stone_sleep: 0.5 }),
    ];
  }

  if (ageKey === 'apocalypse') {
    // Users: instantiated, not born. No blood. Know everything at 35%.
    // The tree knows it all. They just access it. They don't remember anything.
    const users: Person[] = [];
    const userNames = names;
    const allVerseKeys = Object.keys(baseSongs);
    // Also pull in inherited songs at low integrity
    for (const [v, integ] of Object.entries(inheritedSongs)) {
      if (!baseSongs[v]) allVerseKeys.push(v);
    }
    for (let i = 0; i < 7; i++) {
      const verses: Record<string, number> = {};
      for (const v of allVerseKeys) {
        verses[v] = baseSongs[v] || Math.min(0.35, (inheritedSongs[v] || 0) * 0.5);
      }
      // Users have empty blood — no heritage, no body, no lifespan bonus
      users.push(makePerson(userNames[i % userNames.length], 5 + i * 2, 'human', verses, {}));
    }
    return users;
  }

  // Generic generation — works for any age with inherited songs
  const people: Person[] = [];
  const ages = [20, 16, 14, 10, 8, 4, 1];

  for (let i = 0; i < 7; i++) {
    const name = names[i % names.length];
    const personAge = ages[i];
    const verses: Record<string, number> = {};

    for (const [v, integ] of Object.entries(baseSongs)) {
      verses[v] = integ;
    }

    if (inheritedKeys.length > 0) {
      const songCount = 2 + Math.floor(Math.random() * 4);
      const shuffled = [...inheritedKeys].sort(() => Math.random() - 0.5);
      for (let j = 0; j < Math.min(songCount, shuffled.length); j++) {
        const songId = shuffled[j];
        const baseIntegrity = inheritedSongs[songId];
        const degraded = baseIntegrity * (0.6 + Math.random() * 0.2);
        if (degraded >= 0.1) {
          verses[songId] = Math.max(verses[songId] || 0, Math.min(1.0, degraded));
        }
      }
    }

    people.push(makePerson(name, personAge, defaultPeople, verses));
  }

  return people;
}
