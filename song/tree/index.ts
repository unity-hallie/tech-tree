// tree/index.ts — the tech tree. types, registry, constants.
// Songs load from songs.jsonl — one JSON object per line.
// Adding a song = adding a line to the data file.

import * as fs from 'fs';
import * as path from 'path';

// ── Types ─────────────────────────────────────────────────────────────

export type SongEffects = {
  food?: number;              // +N food/season when band knows this song
  capacity?: number;          // +N setlist slots
  literacy?: boolean;         // enables reading from tree
  carveEnable?: boolean;      // enables carving
  spiritDefense?: Record<string, number>;  // { spiritKey: protectionFactor }
  spiritDanger?: Record<string, number>;   // { spiritKey: +dangerAmount }
  starSong?: boolean;         // counts for night's star-song gift
  yeastSong?: boolean;        // counts for yeast spirit food multiplier
  dogPresence?: boolean;      // enables dog-in-camp mechanic
  script?: string;            // RESERVED — future scripting hook
};

export type Verse = {
  tradition: string;
  people: string;
  name: string;
  desc: string;
  prereqs: string[];
  difficulty: number;
  effects?: SongEffects;
  shadow_of?: string;
  shadow_when?: string;
  shadow_rate?: number;
  redeems_with?: string;
  redeems_into?: string;
  emerges_from?: string[];
  staff?: Record<string, number>;
  age?: string;               // which age introduces this song
};

export type People = {
  name: string;
  desc: string;
  trait: string;
};

export type BloodVerse = {
  name: string;
  desc: string;
  triggers: string[];
  eases: string[];
  patterns: string[];
  staff?: Record<string, number>;
};

export type PeopleBlood = {
  primary: string[];
  name: string;
};

// ── The Registry ──────────────────────────────────────────────────────
// Loaded from songs.jsonl. Ages can still add to it at runtime.

export const VERSES: Record<string, Verse> = {};

// ── Constants ─────────────────────────────────────────────────────────

export const TREE_GROWTH_PER_VERSE = 1;
export const SUN_BLOCKED_THRESHOLD = 6;
export const SUN_DEAD_THRESHOLD = 12;
export const FELLING_SCATTERS_CHANCE = 0.4;

export const GARBLE_THRESHOLD = 0.3;
export const LOST_THRESHOLD = 0.1;
export const LEARN_RATE_FOCUSED = 0.25;
export const WRITING_INTEGRITY = 0.5;

// ── Load songs from JSONL ─────────────────────────────────────────────

const SONGS_FILE = path.join(__dirname, '..', '..', 'songs.jsonl');

function loadSongs(): void {
  const raw = fs.readFileSync(SONGS_FILE, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const song = JSON.parse(line);
    const { id, ...rest } = song;
    VERSES[id] = rest as Verse;
  }
}

loadSongs();

// ── Ash verses — filtered from the loaded songs ──────────────────────

export const ASH_VERSES: Record<string, Verse> = {};
for (const [id, v] of Object.entries(VERSES)) {
  if (v.emerges_from) ASH_VERSES[id] = v;
}

// ── Age-introduced songs — grouped by age ────────────────────────────
// Ages can use this to register their songs when entered.

export const AGE_SONGS: Record<string, Record<string, Verse>> = {};
for (const [id, v] of Object.entries(VERSES)) {
  if (v.age) {
    if (!AGE_SONGS[v.age]) AGE_SONGS[v.age] = {};
    AGE_SONGS[v.age][id] = v;
  }
}

// Re-export everything branches export
export { PEOPLES } from './human.ts';
export { BLOOD_VERSES, PEOPLE_BLOOD, BLOOD_DRIFT, BLOOD_THRESHOLD, BLOOD_ALLERGY_THRESHOLD,
         SONG_BLOODS, SONG_SINK_THRESHOLD, SONG_SINK_AMOUNT } from './blood.ts';
