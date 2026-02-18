// tree/index.ts — the tech tree. types, registry, constants.
// Every file in this directory is a branch. They all register into VERSES.

// ── Types ─────────────────────────────────────────────────────────────

export type Verse = {
  tradition: string;
  people: string;
  name: string;
  desc: string;
  prereqs: string[];
  difficulty: number;
  shadow_of?: string;
  shadow_when?: string;
  shadow_rate?: number;
  redeems_with?: string;
  redeems_into?: string;
  emerges_from?: string[];
  staff?: Record<string, number>;  // modifiers this verse carries. friction_dwarf, etc.
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
  staff?: Record<string, number>;  // modifiers this blood carries. lifespan, teaching, etc.
};

export type PeopleBlood = {
  primary: string[];
  name: string;
};

// ── The Registry ──────────────────────────────────────────────────────
// The mutable song registry. Branches register into this. Ages add to it.

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

// ── Load all branches ─────────────────────────────────────────────────

import { BEAR_SONGS } from './bear.ts';
import { TROLL_SONGS } from './troll.ts';
import { DWARF_SONGS } from './dwarf.ts';
import { ELF_SONGS } from './elf.ts';
import { HALFLING_SONGS } from './halfling.ts';
import { HUMAN_SONGS } from './human.ts';
import { BETWEEN_SONGS } from './between.ts';
import { SHADOW_SONGS } from './shadow.ts';
import { ASH_VERSES } from './ash.ts';

Object.assign(VERSES, BEAR_SONGS, TROLL_SONGS, DWARF_SONGS, ELF_SONGS,
              HALFLING_SONGS, HUMAN_SONGS, BETWEEN_SONGS, SHADOW_SONGS, ASH_VERSES);

// Re-export everything branches export
export { PEOPLES } from './human.ts';
export { ASH_VERSES } from './ash.ts';
export { BLOOD_VERSES, PEOPLE_BLOOD, BLOOD_DRIFT, BLOOD_THRESHOLD, BLOOD_ALLERGY_THRESHOLD,
         SONG_BLOODS, SONG_SINK_THRESHOLD, SONG_SINK_AMOUNT } from './blood.ts';
