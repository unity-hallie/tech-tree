// spirit.ts — forces of nature that appear to be wills.
// The bear isn't angry at you. The bear is hungry and you're near the den.
// But if you sing the Bear Song, it LOOKS like the bear is appeased.
// No spirit is actually a will. No spirit is actually just physics.
// The game never tells you which. The songs work either way.

export type Spirit = {
  name: string;
  songId: string;
  fallbackSongId?: string;
  kind: 'animal' | 'great';
  desc: string;
  baseDanger: number;
  dangerPerFelling: number;
  songProtection: number;
  attackFoodLoss: number;
  killChance: number;
  seasons: number[];
  allergyKillBonus: number;
  allergyWarning: number;
  allergyDesc: string;
  // Special flags
  stolenSpirit?: boolean;    // fire: half-known fire is worse than none
  treeBurnChance?: number;   // fire: can burn verses off the tree
  metalAnger?: boolean;      // sky: metal attracts lightning
  fireStarter?: boolean;     // sky: lightning starts fires
  singingDark?: boolean;     // night: the dark boosts songs if you have stars
  starSongs?: string[];      // night: songs that unlock the gift
  songBoost?: number;        // night: integrity boost per verse per night event
  invisibleSpirit?: boolean; // yeast: doesn't attack, accelerates
  surplusPerSong?: number;   // yeast: food bonus per yeast song known
  populationPressure?: boolean; // yeast: surplus creates birth pressure
  eldersFirst?: boolean;     // death: targets elders, not youth
  deathTeaching?: boolean;   // death: if burial song is strong, elder's songs pass
};

export const SPIRITS: Record<string, Spirit> = {
  bear: {
    name: 'Bear',       songId: 'bear',
    kind: 'animal',
    desc: 'The one who sleeps in earth',
    baseDanger: 0.1,    dangerPerFelling: 0.08,
    songProtection: 0.8,
    attackFoodLoss: 3,  killChance: 0.2,
    seasons: [0, 2],    // spring (waking) and autumn (preparing)
    allergyKillBonus: 0.3,
    allergyWarning: 0.5,
    allergyDesc: 'The old blood warns you. The elders smell the bear and pull the children close.',
  },
  wolf: {
    name: 'Wolf',
    songId: 'wolf_song',
    fallbackSongId: 'bear',
    kind: 'animal',
    desc: 'The one who follows',
    baseDanger: 0.08,   dangerPerFelling: 0.05,
    songProtection: 0.5,
    attackFoodLoss: 2,  killChance: 0.15,
    seasons: [3, 0],    // winter (pack hunting) and spring (hungry)
    allergyKillBonus: 0.25,
    allergyWarning: 0.5,
    allergyDesc: 'The hair stands up on the old ones. They know the wolves are circling before anyone else.',
  },
  cat: {
    name: 'Saber Cat',
    songId: 'bear',
    kind: 'animal',
    desc: 'The one who waits above',
    baseDanger: 0.06,   dangerPerFelling: 0.04,
    songProtection: 0.4,
    attackFoodLoss: 1,  killChance: 0.35,
    seasons: [1, 2],    // summer (ambush) and autumn (stalking)
    allergyKillBonus: 0.2,
    allergyWarning: 0.4,
    allergyDesc: 'The old ones feel the cat above them. A chill. A shadow. But the children don\'t.',
  },

  // ── Great Spirits ──────────────────────────────────────────────────
  fire: {
    name: 'Fire',
    songId: 'ember',
    fallbackSongId: 'deep_fire',
    kind: 'great',
    desc: 'The stolen one. It does not want to be tended. But tend it and it looks like a companion.',
    baseDanger: 0.05,          dangerPerFelling: 0.12,
    songProtection: 0.7,
    attackFoodLoss: 4,         killChance: 0.15,
    seasons: [1, 2],           // summer (dry) and autumn (wind)
    allergyKillBonus: 0,       allergyWarning: 0,
    allergyDesc: '',
    stolenSpirit: true,
    treeBurnChance: 0.3,
  },

  sky: {
    name: 'Sky',
    songId: 'polestar',
    fallbackSongId: 'seasons',
    kind: 'great',
    desc: 'The one above. It gives fire to the earth and takes it back in the same gesture.',
    baseDanger: 0.04,          dangerPerFelling: 0.03,
    songProtection: 0.6,
    attackFoodLoss: 2,         killChance: 0.1,
    seasons: [0, 1],           // spring (storms) and summer (lightning)
    allergyKillBonus: 0,       allergyWarning: 0,
    allergyDesc: '',
    metalAnger: true,
    fireStarter: true,
  },

  night: {
    name: 'Night',
    songId: 'polestar',
    fallbackSongId: 'elder_song',
    kind: 'great',
    desc: 'The singing dark. Night is when the elders tell the stories. Night is when you look up. The cost is cold. The gift is song.',
    baseDanger: 0.08,          dangerPerFelling: 0.04,
    songProtection: 0.6,
    attackFoodLoss: 2,         killChance: 0.08,
    seasons: [3, 0],           // winter (longest nights) and spring (the dark before dawn)
    allergyKillBonus: 0,       allergyWarning: 0,
    allergyDesc: '',
    singingDark: true,
    starSongs: ['polestar', 'seasons', 'precession', 'star_bear'],
    songBoost: 0.04,
  },

  yeast: {
    name: 'Yeast',
    songId: 'brew',
    fallbackSongId: 'bake',
    kind: 'great',
    desc: 'The invisible one. It was always in the grain, in the air, on your hands. You will not see it for 10,000 years. But you will sing to it every baking day.',
    baseDanger: 0.0,           dangerPerFelling: 0.0,
    songProtection: 0.0,
    attackFoodLoss: 0,         killChance: 0.0,
    seasons: [0, 1, 2, 3],    // always there
    allergyKillBonus: 0,       allergyWarning: 0,
    allergyDesc: '',
    invisibleSpirit: true,
    surplusPerSong: 2,
    populationPressure: true,
  },

  death: {
    name: 'Death',
    songId: 'burial',
    fallbackSongId: 'ochre',
    kind: 'great',
    desc: 'The one that waits. Not the end. The threshold. The dwarves buried their dead with flowers. That is the song.',
    baseDanger: 0.03,          dangerPerFelling: 0.1,
    songProtection: 0.6,
    attackFoodLoss: 0,         killChance: 0.25,
    seasons: [2, 3],           // autumn (the dying) and winter (the dead season)
    allergyKillBonus: 0,       allergyWarning: 0,
    allergyDesc: '',
    eldersFirst: true,
    deathTeaching: true,
  },
};
