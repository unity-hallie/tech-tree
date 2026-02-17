#!/usr/bin/env node
// ============================================================
// TECH TREE — Turn-based CLI prototype
// One execution = one turn (one season)
// State saved to state.json between turns
// Run: node turn.js [action]
//
// Actions:
//   move [cave_name]  — travel to a cave
//   tend              — tend songs, preserve knowledge
//   right             — right the axis (only at equinox)
//   commune           — commune at axis mundi (must be at pole)
//   hunt              — hunt a nearby bear
//   ceremony          — perform bear ceremony (need bear knowledge)
//   burn              — slash and burn (need agriculture, must be in boreal)
//   follow            — follow nearest reindeer herd
//   wait              — do nothing, let a season pass
//   look              — look up at the sky tree
//   status            — print full state (no turn passes)
//   reset             — start over
// ============================================================

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'state.json');

// ============================================================
// DEFAULT STATE
// ============================================================

function freshState() {
  const caves = [
    { name: 'Kivistö', region: 'boreal', knowledge: null, hasBear: true, angle: 0 },
    { name: 'Talvola', region: 'boreal', knowledge: 'cord', hasBear: false, angle: 30 },
    { name: 'Pohjanne', region: 'tundra', knowledge: null, hasBear: false, angle: 60 },
    { name: 'Tulikko', region: 'boreal', knowledge: 'pigment', hasBear: true, angle: 90 },
    { name: 'Karhula', region: 'tundra', knowledge: 'bear', hasBear: true, angle: 120 },
    { name: 'Jokinen', region: 'boreal', knowledge: null, hasBear: false, angle: 150 },
    { name: 'Vuorela', region: 'mountain', knowledge: 'stars', hasBear: false, angle: 180 },
    { name: 'Otsola', region: 'tundra', knowledge: null, hasBear: true, angle: 210 },
    { name: 'Ilmanen', region: 'boreal', knowledge: 'reindeer', hasBear: false, angle: 240 },
    { name: 'Maanala', region: 'tundra', knowledge: 'bear', hasBear: true, angle: 270 },
    { name: 'Tähtiä', region: 'boreal', knowledge: 'agriculture', hasBear: false, angle: 300 },
    { name: 'Revontuli', region: 'tundra', knowledge: 'pigment', hasBear: false, angle: 330 },
  ];

  // Reindeer herds with seasonal positions
  const herds = [
    { name: 'North Herd', summerRegion: 'tundra', winterRegion: 'boreal', nearCaves: ['Pohjanne', 'Karhula'] },
    { name: 'East Herd', summerRegion: 'tundra', winterRegion: 'boreal', nearCaves: ['Otsola', 'Ilmanen'] },
    { name: 'South Herd', summerRegion: 'tundra', winterRegion: 'boreal', nearCaves: ['Revontuli', 'Kivistö'] },
  ];

  return {
    turn: 0,
    yearsBP: 52000,
    season: 0,          // 0=spring, 1=summer, 2=autumn, 3=winter
    year: 0,
    generation: 0,

    // Where the band is
    location: 'Kivistö',  // cave name or 'pole' or 'traveling'

    // Band
    people: 12,
    elders: 3,
    songs: 5,
    food: 80,
    bearSkulls: 0,
    path: 'none',       // 'none' | 'reindeer' | 'ash'

    // Knowledge — the sky tree
    knowledge: {
      stone: true,
      fire: true,
      song: true,
      cord: false,
      pigment: false,
      bear: false,
      stars: false,
      reindeer: false,
      agriculture: false,
      axisMundi: 0,      // 0-3 levels
    },

    // Cycles
    equinoxDrift: 0,
    knowledgeIntegrity: 100,   // percentage
    glacialPhase: 30,          // 0-100
    glacialDirection: 1,       // 1=cooling, -1=warming
    beringiaOpen: false,
    axisMundiAccessible: true,

    // Ash tracking
    ashQuality: 0,
    burnedSites: 0,
    tendedSeasons: 0,

    // World
    caves,
    herds,
    bears: 8,

    // Log
    log: [],
  };
}

// ============================================================
// SEASON NAMES & HELPERS
// ============================================================

const SEASONS = ['◈ Spring Equinox', '☀ Summer', '◈ Autumn Equinox', '❄ Winter'];
const SEASON_SHORT = ['spring', 'summer', 'autumn', 'winter'];

function isEquinox(s) { return s === 0 || s === 2; }
function isSummer(s) { return s === 1; }
function isWinter(s) { return s === 3; }

function log(state, msg) { state.log.push(msg); }

function getCave(state) {
  return state.caves.find(c => c.name === state.location);
}

function getNearbyHerd(state) {
  const cave = getCave(state);
  if (!cave) return null;
  const seasonType = (state.season === 1) ? 'tundra' : 'boreal';
  return state.herds.find(h => {
    const herdRegion = (state.season === 1) ? h.summerRegion : h.winterRegion;
    return h.nearCaves.includes(state.location) || cave.region === herdRegion;
  });
}

// ============================================================
// CONSTELLATION MAP
// ============================================================

const SKY_TREE = [
  { id: 'boahji',      name: 'Boahji',       subtitle: 'The Rivet — Pole Star',         knowledge: 'axisMundi', tier: 0, color: '🟣' },
  { id: 'favdna',      name: 'Fávdna',       subtitle: "The Hunter's Bow — Stone",      knowledge: 'stone',     tier: 1, color: '🟤' },
  { id: 'tuli',        name: 'Tuli',         subtitle: 'The Flame — Hearth Fire',       knowledge: 'fire',      tier: 1, color: '🟠' },
  { id: 'joukahainen', name: 'Joukahainen',  subtitle: 'The Singer — Oral Tradition',   knowledge: 'song',      tier: 1, color: '🔵' },
  { id: 'otso',        name: 'Otso',         subtitle: 'The Great Bear — Ursa Major',   knowledge: 'bear',      tier: 1, color: '🟡' },
  { id: 'sarva',       name: 'Sarva',        subtitle: 'The Great Reindeer',            knowledge: 'reindeer',  tier: 1, color: '🟢' },
  { id: 'draco',       name: 'Lohikäärme',   subtitle: 'The Dragon — Star Knowledge',   knowledge: 'stars',     tier: 2, color: '🔷' },
  { id: 'ilmarinen',   name: 'Ilmarinen',    subtitle: 'The Smith — Cord & Craft',      knowledge: 'cord',      tier: 2, color: '⚪' },
  { id: 'louhi',       name: 'Louhi',        subtitle: 'Mistress of Pohjola — Pigment', knowledge: 'pigment',   tier: 2, color: '🔴' },
  { id: 'sampo',       name: 'Sampo',        subtitle: 'The World Mill — Agriculture',  knowledge: 'agriculture',tier: 3, color: '🌕' },
];

// ============================================================
// ACTIONS
// ============================================================

function doMove(state, dest) {
  if (dest === 'pole') {
    if (state.glacialPhase > 70) {
      log(state, 'The ice is too thick. You cannot reach the pole.');
      return;
    }
    state.location = 'pole';
    state.food -= 5; // long journey
    log(state, 'You journey inward, toward the axis of the world.');
    return;
  }

  const cave = state.caves.find(c => c.name.toLowerCase() === dest.toLowerCase());
  if (!cave) {
    log(state, `No cave called "${dest}". Caves: ${state.caves.map(c => c.name).join(', ')}`);
    return;
  }

  const oldCave = getCave(state);
  const distance = oldCave
    ? Math.abs(cave.angle - oldCave.angle)
    : 90;
  const foodCost = Math.ceil(distance / 30);

  state.location = cave.name;
  state.food -= foodCost;
  log(state, `Traveled to ${cave.name} (${cave.region}). Food -${foodCost}.`);

  // Auto-discover knowledge at cave
  if (cave.knowledge && !state.knowledge[cave.knowledge]) {
    state.knowledge[cave.knowledge] = true;
    log(state, `  ✦ Learned: ${cave.knowledge}!`);

    // Check path
    if (cave.knowledge === 'reindeer' && state.path === 'none') {
      state.path = 'reindeer';
      log(state, '  🦌 Path chosen: The Reindeer. You follow the herd.');
    }
    if (cave.knowledge === 'agriculture' && state.path === 'none') {
      state.path = 'ash';
      log(state, '  🔥 Path chosen: The Ash. You tend the burned earth.');
    }

    cave.knowledge = null; // taken
  }
}

function doTend(state) {
  if (state.elders < 1) {
    log(state, 'No elders remain to tend the songs.');
    return;
  }
  if (state.songs < 1) {
    log(state, 'No songs remain to tend.');
    return;
  }
  state.knowledgeIntegrity = Math.min(100, state.knowledgeIntegrity + 8);
  state.tendedSeasons++;
  log(state, `Songs tended. Knowledge integrity: ${state.knowledgeIntegrity}%.`);
}

function doRight(state) {
  if (!isEquinox(state.season)) {
    log(state, `The axis can only be righted at equinox. It is ${SEASON_SHORT[state.season]}.`);
    return;
  }
  if (!state.knowledge.stars) {
    log(state, 'You do not yet know the stars well enough to read the drift.');
    return;
  }
  const correction = Math.min(state.equinoxDrift, 15);
  state.equinoxDrift -= correction;
  state.ashQuality += Math.round(correction * 0.5);
  state.tendedSeasons++;
  log(state, `◈ The axis is righted. Drift corrected by ${correction}. The sky answers.`);
}

function doCommune(state) {
  if (state.location !== 'pole') {
    log(state, 'You must be at the pole to commune with the axis mundi.');
    return;
  }
  if (!state.axisMundiAccessible) {
    log(state, 'The axis mundi is buried in ice.');
    return;
  }
  state.knowledge.axisMundi = Math.min(3, state.knowledge.axisMundi + 1);
  const level = state.knowledge.axisMundi;
  if (level === 1) log(state, '✦ The pole. The sky turns around this point. You begin to understand.');
  else if (level === 2) log(state, '✦ The precession reveals itself. The great mill turns.');
  else log(state, '✦ The long count. 26,000 years. You see it all now.');
}

function doHunt(state) {
  if (state.bears <= 0) {
    log(state, 'No bears remain in the world.');
    return;
  }
  const cave = getCave(state);
  if (!cave) {
    log(state, 'No bears at the pole.');
    return;
  }

  if (state.knowledge.bear) {
    // Ceremony hunt
    state.bears--;
    state.bearSkulls++;
    state.food += 40;
    state.ashQuality += 3;
    log(state, '🐻 The bear is honored. Meat for the band (+40 food). Skull placed on the tree.');
    log(state, '  The spirit returns to Otso, the Great Bear constellation.');
  } else {
    // Just meat
    state.bears--;
    state.food += 25;
    log(state, '🐻 Bear hunted. Meat gained (+25 food). No ceremony performed.');
  }
}

function doBurn(state) {
  if (!state.knowledge.agriculture) {
    log(state, 'You do not yet know the way of ash.');
    return;
  }
  const cave = getCave(state);
  if (!cave || cave.region !== 'boreal') {
    log(state, 'Nothing here to burn. Slash-and-burn requires boreal forest.');
    return;
  }

  state.burnedSites++;
  state.food += 25;

  // Leave the birch?
  if (state.knowledge.song && state.knowledgeIntegrity > 50) {
    log(state, '🔥 The tree falls. The ash feeds the earth. The birch is left standing.');
    log(state, '  +25 food. The songs remember the restraint.');
    state.ashQuality += 3;
  } else {
    log(state, '🔥 The tree falls. The ash feeds the earth. All trees cleared.');
    log(state, '  +25 food. But something was lost.');
    state.ashQuality -= 2;
  }
}

function doFollow(state) {
  if (!state.knowledge.reindeer) {
    log(state, 'You do not yet know the way of the reindeer.');
    return;
  }
  const herd = getNearbyHerd(state);
  if (!herd) {
    log(state, 'No herd nearby to follow.');
    return;
  }

  state.food += 15;
  log(state, `🦌 Following ${herd.name}. The reindeer know the way. +15 food.`);

  // Move to a cave near the herd's seasonal range
  const targetCave = herd.nearCaves[state.season < 2 ? 0 : 1];
  if (targetCave && targetCave !== state.location) {
    state.location = targetCave;
    log(state, `  Migrated with the herd to ${targetCave}.`);
  }
}

function doWait(state) {
  log(state, 'The band waits. A season passes.');
}

// ============================================================
// END-OF-TURN: World ticks forward one season
// ============================================================

function advanceSeason(state) {
  state.turn++;
  state.season = (state.season + 1) % 4;

  // Year boundary
  if (state.season === 0) {
    state.year++;
    state.yearsBP--;
  }

  // Food consumption
  const consumption = Math.ceil(state.people * 0.5);
  state.food -= consumption;

  // Winter extra cost
  if (isWinter(state.season)) {
    state.food -= 5;
    log(state, '  ❄ Winter bites. Extra food consumed.');
  }

  // Starvation
  if (state.food < 0) {
    const lost = Math.min(state.people - 1, Math.ceil(-state.food / 10));
    state.people -= lost;
    state.food = 0;
    if (lost > 0) log(state, `  ☠ Hunger claims ${lost} soul${lost > 1 ? 's' : ''}.`);
    if (state.elders > state.people) state.elders = state.people;
  }

  // Food from reindeer path (passive)
  if (state.path === 'reindeer' && isSummer(state.season)) {
    state.food += 5;
    log(state, '  🦌 The herd provides. +5 food.');
  }

  // Equinox drift
  state.equinoxDrift += 2;

  // Knowledge decay
  if (state.equinoxDrift > 20) {
    state.knowledgeIntegrity = Math.max(0, state.knowledgeIntegrity - 1);
  }

  // Generational change (every 30 years = 120 turns)
  if (state.turn % 120 === 0) {
    state.generation++;
    log(state, `  ⟳ A generation passes. Generation ${state.generation}.`);

    // Elder death
    if (state.elders > 0 && Math.random() > 0.4) {
      state.elders--;
      state.songs = Math.max(0, state.songs - 1);
      log(state, '  An elder passes. A song is lost.');
    }
    // New elder
    if (state.people > 5 && Math.random() > 0.5) {
      state.elders = Math.min(state.elders + 1, state.people);
      log(state, '  A new elder rises.');
    }
    // Population
    if (state.food > 40) {
      const born = 1 + Math.floor(Math.random() * 3);
      state.people += born;
      log(state, `  ${born} new soul${born > 1 ? 's' : ''} born.`);
    }

    // Knowledge integrity decay
    state.knowledgeIntegrity = Math.max(0, Math.round(state.knowledgeIntegrity * 0.85));
  }

  // Glacial cycle (slow)
  state.glacialPhase += state.glacialDirection * 0.5;
  if (state.glacialPhase >= 100) { state.glacialPhase = 100; state.glacialDirection = -1; }
  if (state.glacialPhase <= 0) { state.glacialPhase = 0; state.glacialDirection = 1; }
  state.beringiaOpen = state.glacialPhase > 60;
  state.axisMundiAccessible = state.glacialPhase < 70;

  // Bears respawn slowly
  if (state.bears < 8 && Math.random() > 0.85) {
    state.bears++;
  }
}

// ============================================================
// DISPLAY
// ============================================================

function printState(state) {
  const cave = getCave(state);
  const herd = getNearbyHerd(state);
  const seasonName = SEASONS[state.season];
  const atPole = state.location === 'pole';

  console.log('\n' + '═'.repeat(60));
  console.log(`  TECH TREE — Turn ${state.turn}`);
  console.log(`  ${state.yearsBP.toLocaleString()} years before present`);
  console.log(`  Year ${state.year}, Generation ${state.generation}`);
  console.log('═'.repeat(60));

  console.log(`\n  Season: ${seasonName}`);
  console.log(`  Location: ${atPole ? '✦ The Pole — Axis Mundi' : `⌂ ${state.location} (${cave?.region || '?'})`}`);

  console.log(`\n  Band: ${state.people} souls · ${state.elders} elders · ${state.songs} songs`);
  console.log(`  Food: ${'█'.repeat(Math.min(20, Math.floor(state.food / 5)))}${'░'.repeat(Math.max(0, 20 - Math.floor(state.food / 5)))} ${state.food}`);
  console.log(`  Path: ${state.path === 'none' ? 'undecided' : state.path === 'reindeer' ? '🦌 Reindeer' : '🔥 Ash'}`);
  console.log(`  Bear skulls: ${state.bearSkulls}`);

  console.log(`\n  — Cycles —`);
  console.log(`  Axis drift: ${'·'.repeat(Math.min(30, state.equinoxDrift))} ${state.equinoxDrift}${state.equinoxDrift > 20 ? ' ⚠ DRIFTING' : ''}`);
  console.log(`  Knowledge: ${'█'.repeat(Math.floor(state.knowledgeIntegrity / 5))}${'░'.repeat(20 - Math.floor(state.knowledgeIntegrity / 5))} ${state.knowledgeIntegrity}%`);
  console.log(`  Ice age: ${state.glacialPhase}% · ${state.glacialDirection > 0 ? 'cooling ↑' : 'warming ↓'}`);
  console.log(`  Beringia: ${state.beringiaOpen ? '◆ OPEN' : '◇ submerged'}`);
  console.log(`  Axis mundi: ${state.axisMundiAccessible ? '✦ reachable' : '✧ ice-covered'}`);
  console.log(`  Ash quality: ${state.ashQuality}`);

  // Nearby
  console.log(`\n  — Nearby —`);
  if (cave?.hasBear) console.log(`  🐻 Bear in the area`);
  if (herd) console.log(`  🦌 ${herd.name} nearby`);
  if (cave?.knowledge) console.log(`  ✦ Knowledge here: ${cave.knowledge}`);
  if (state.bears > 0) console.log(`  Bears in world: ${state.bears}`);
  console.log(`  ${isEquinox(state.season) ? '◈ EQUINOX — you may right the axis [right]' : ''}`);

  // Actions
  console.log(`\n  — Actions —`);
  console.log(`  move [name]  — travel (${state.caves.map(c => c.name).join(', ')}, pole)`);
  console.log(`  tend         — tend songs${state.elders < 1 ? ' (need elders)' : ''}`);
  console.log(`  right        — right axis${!isEquinox(state.season) ? ' (need equinox)' : ''}${!state.knowledge.stars ? ' (need stars)' : ''}`);
  console.log(`  commune      — at pole${state.location !== 'pole' ? ' (need to be at pole)' : ''}`);
  console.log(`  hunt         — hunt bear${cave?.hasBear ? '' : ' (no bear here)'}`);
  console.log(`  burn         — slash & burn${!state.knowledge.agriculture ? ' (need agriculture)' : ''}`);
  console.log(`  follow       — follow herd${!state.knowledge.reindeer ? ' (need reindeer)' : ''}`);
  console.log(`  wait         — pass a season`);
  console.log(`  look         — look up at the sky tree`);
}

function printSkyTree(state) {
  console.log('\n' + '─'.repeat(60));
  console.log('  T H E   S K Y   T R E E');
  console.log('  You look up. The constellations turn around the Rivet.');
  console.log('─'.repeat(60));

  // Draw by tier
  for (let tier = 0; tier <= 3; tier++) {
    const consts = SKY_TREE.filter(c => c.tier === tier);
    if (tier === 0) console.log('\n  ═══ The Pole ═══');
    else if (tier === 1) console.log('\n  ─── Inner Ring ───');
    else if (tier === 2) console.log('\n  ─── Middle Ring ───');
    else console.log('\n  ─── Outer Ring ───');

    consts.forEach(c => {
      let unlocked;
      if (c.knowledge === 'axisMundi') {
        unlocked = state.knowledge.axisMundi > 0;
      } else {
        unlocked = state.knowledge[c.knowledge];
      }

      if (unlocked) {
        let extra = '';
        if (c.knowledge === 'axisMundi') extra = ` (level ${state.knowledge.axisMundi}/3)`;
        console.log(`  ${c.color} ${c.name} — ${c.subtitle}${extra}`);
        console.log(`     ★ UNLOCKED`);
      } else {
        console.log(`  ⚫ ? ? ? — ${c.subtitle}`);
        console.log(`     ☆ locked`);
      }
    });
  }

  console.log('\n  The Rivet holds. Fávdna aims but does not fire.');
  if (state.equinoxDrift > 20) {
    console.log('  ⚠ The sky is drifting. The constellations blur.');
  }
  console.log('─'.repeat(60));
}

function printLog(state) {
  if (state.log.length > 0) {
    console.log('\n  — What happened —');
    state.log.forEach(msg => console.log(`  ${msg}`));
  }
}

// ============================================================
// MAIN
// ============================================================

// Load or create state
let state;
try {
  state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
} catch {
  state = freshState();
}

// Parse action
const args = process.argv.slice(2);
const action = (args[0] || 'status').toLowerCase();
const actionArg = args.slice(1).join(' ');

// Clear log
state.log = [];

// Non-turn actions
if (action === 'status') {
  printState(state);
  process.exit(0);
}

if (action === 'look') {
  printSkyTree(state);
  process.exit(0);
}

if (action === 'reset') {
  state = freshState();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  console.log('\n  The world begins again. 52,000 years before present.');
  console.log('  Run: node turn.js status\n');
  process.exit(0);
}

// Turn actions — do action, then advance season
switch (action) {
  case 'move':
    doMove(state, actionArg);
    break;
  case 'tend':
    doTend(state);
    break;
  case 'right':
    doRight(state);
    break;
  case 'commune':
    doCommune(state);
    break;
  case 'hunt':
    doHunt(state);
    break;
  case 'ceremony':
    doHunt(state); // same as hunt but ceremony intent
    break;
  case 'burn':
    doBurn(state);
    break;
  case 'follow':
    doFollow(state);
    break;
  case 'wait':
    doWait(state);
    break;
  default:
    console.log(`\n  Unknown action: "${action}"`);
    console.log('  Try: move, tend, right, commune, hunt, burn, follow, wait, look, status, reset');
    process.exit(1);
}

// Advance world
advanceSeason(state);

// Save
fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

// Print
printLog(state);
printState(state);
