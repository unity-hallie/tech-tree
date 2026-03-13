// blood.ts — heritage as song on a different timescale.
// Blood verses drift at 0.005/season. Voice verses drift generationally.
// "Dwarf" isn't a species — it's what you call someone whose blood sings
// craft_blood, cave_blood, stone_blood at high integrity.

import { type BloodVerse, type PeopleBlood } from './index.ts';

export const BLOOD_VERSES: Record<string, BloodVerse> = {
  deep_blood:    { name: 'Deep Blood',    desc: 'The old fire in the marrow. Millions of years of walking upright.',
                   triggers: ['bear'],     eases: ['heartbeat', 'deep_fire', 'old_track', 'stone_sleep',
                                                    'bone_drum', 'night_watch', 'fire_tend', 'ground_sense',
                                                    'howl_back', 'stone_hide', 'death_drum', 'sky_stare'],
                   patterns: ['troll'] },
  stone_blood:   { name: 'Stone Blood',   desc: 'The patience of rock. How to endure. How to wait.',
                   triggers: ['bear', 'wolf', 'cat'],  eases: ['stone_sleep', 'flake', 'blade', 'stone_hide', 'night_watch'],
                   patterns: ['troll', 'dwarf'] },
  craft_blood:   { name: 'Craft Blood',   desc: 'Hands that remember. The shaping instinct.',
                   triggers: ['wolf'],     eases: ['flake', 'blade', 'ember', 'forge'],
                   patterns: ['dwarf'] },
  cave_blood:    { name: 'Cave Blood',    desc: 'The sense for enclosed spaces. Where the echoes live.',
                   triggers: ['wolf', 'bear'],  eases: ['cave_song', 'bear', 'ochre', 'burial'],
                   patterns: ['dwarf'] },
  thin_air_blood:{ name: 'Thin Air Blood', desc: 'The gene for altitude. Lungs that work where others fail.',
                   triggers: ['cat'],      eases: ['thin_air', 'far_sight', 'ghost_walk'],
                   patterns: ['elf'] },
  ghost_blood:   { name: 'Ghost Blood',   desc: 'How to leave no trace. The vanishing. Almost nothing survived.',
                   triggers: ['cat'],      eases: ['ghost_walk', 'loom', 'jade'],
                   patterns: ['elf'] },
  island_blood:  { name: 'Island Blood',  desc: 'Smallness as survival. Knowing your whole world.',
                   triggers: [],           eases: ['island', 'small_hunt', 'tide', 'feast', 'shelter'],
                   patterns: ['halfling'] },
  song_blood:    { name: 'Song Blood',    desc: 'The larynx that changed everything. The capacity for complex language.',
                   triggers: [],           eases: ['lullaby', 'elder_song', 'tree_song', 'ledger', 'rune', 'writing'],
                   patterns: ['human'] },
  change_blood:  { name: 'Change Blood',  desc: 'The restlessness. Learn fast, forget fast, move on.',
                   triggers: [],           eases: ['spark', 'track', 'seasons', 'herd', 'migration'],
                   patterns: ['human'] },
  shaman_blood:  { name: 'Shaman Blood',  desc: 'The crossing. Between spirit and flesh, between living and dead. The ones who see both sides.',
                   triggers: ['bear', 'wolf', 'cat'],  eases: ['bear', 'burial', 'dream_walk', 'ghost_walk', 'bone_flute'],
                   patterns: ['dwarf', 'elf'] },
  coastal_blood: { name: 'Coastal Blood', desc: 'Salt in the veins. The knowledge of tides and currents and the creatures that cross between.',
                   triggers: [],           eases: ['tide', 'sea_cross', 'salmon_song', 'weir', 'sail', 'kelp'],
                   patterns: ['halfling'] },
  old_blood:     { name: 'Old Blood',     desc: 'The slow clock. Deep time in the marrow. Trolls measure life in centuries, not decades.',
                   triggers: ['bear'],     eases: ['heartbeat', 'old_track', 'stone_sleep', 'bone_drum', 'ground_sense', 'night_watch', 'sky_stare'],
                   patterns: ['troll'],
                   staff: { lifespan: 7.0 } },
  den_blood:     { name: 'Den Blood',     desc: 'The oldest memory. Before hands. Before uprightness. The cave remembers.',
                   triggers: ['bear'],     eases: ['den_memory', 'long_sleep', 'salmon_run', 'cub_call', 'root_dig'],
                   patterns: ['bear'],
                   staff: { lifespan: 4.0 } },
  dog_blood:     { name: 'Dog Blood',     desc: 'The wolf who stayed. 15,000 years of sleeping by the fire. The oldest alliance.',
                   triggers: ['wolf'],     eases: ['dog', 'dog_guard', 'dog_hunt', 'dog_sled', 'dog_burial'],
                   patterns: ['dog'] },
  yeast_blood:   { name: 'Yeast Blood',  desc: 'The invisible symbiont. 10,000 years of rising bread and foaming beer. It lives in your hands, your pots, your air.',
                   triggers: ['yeast'],    eases: ['brew', 'bake', 'sourdough', 'mead'],
                   patterns: ['yeast'] },
};

export const BLOOD_DRIFT = 0.005;
export const BLOOD_THRESHOLD = 0.01;
export const BLOOD_ALLERGY_THRESHOLD = 0.05;

export const PEOPLE_BLOOD: Record<string, PeopleBlood> = {
  bear:     { primary: ['den_blood'],                           name: 'Bear' },
  troll:    { primary: ['deep_blood', 'stone_blood', 'old_blood'], name: 'Troll' },
  orc:      { primary: ['deep_blood', 'stone_blood'],           name: 'Orc' },
  dwarf:    { primary: ['craft_blood', 'cave_blood', 'shaman_blood'], name: 'Dwarf' },
  elf:      { primary: ['thin_air_blood', 'ghost_blood', 'shaman_blood'], name: 'Elf' },
  halfling: { primary: ['island_blood', 'coastal_blood'],        name: 'Halfling' },
  human:    { primary: ['song_blood', 'change_blood'],          name: 'Human' },
  dog:      { primary: ['dog_blood'],                           name: 'Dog' },
  yeast:    { primary: ['yeast_blood'],                        name: 'Yeast' },
};

// ── Song Sinking — inverted map: song → blood verses that ease it ──

export const SONG_BLOODS: Record<string, string[]> = {};
for (const [bv, def] of Object.entries(BLOOD_VERSES)) {
  for (const songId of def.eases) {
    if (!SONG_BLOODS[songId]) SONG_BLOODS[songId] = [];
    SONG_BLOODS[songId].push(bv);
  }
}

export const SONG_SINK_THRESHOLD = 0.5;
export const SONG_SINK_AMOUNT = 0.03;
