// voice.ts — the narrator. How the world speaks to you.
// Display, status, help. The voice changes with the age.

import {
  VERSES, GARBLE_THRESHOLD, LOST_THRESHOLD, WRITING_INTEGRITY,
  SUN_BLOCKED_THRESHOLD, SUN_DEAD_THRESHOLD,
  PEOPLES,
} from './tree/index.ts';
import { BLOOD_VERSES, PEOPLE_BLOOD } from './tree/index.ts';
import {
  type Person, ageCategory, identifyPeople, heritageLabel,
  bloodEases, bloodReading,
} from './singer.ts';
import { type GameState } from './ground.ts';
import { SPIRITS } from './spirit.ts';
import { AGES, getAvailableBridges } from './age.ts';
import { setlistCapacity, positionFactor } from './sing.ts';

// ── Apocalypse display — the degraded interface ─────────────────────
// Green on black. Hex addresses. FEED not SETLIST. SOULS not PEOPLE.
// Everything is fine. The old songs listen from behind the panels.

const BACKGROUND_SONGS_DISPLAY = ['heartbeat', 'den_memory', 'bear', 'lullaby', 'cub_call', 'old_track'];

function hexAddr(): string {
  return '0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
}

function glitch(text: string): string {
  if (Math.random() < 0.08) {
    const i = Math.floor(Math.random() * text.length);
    const chars = '░▒▓█▄▀■□▪▫';
    return text.slice(0, i) + chars[Math.floor(Math.random() * chars.length)] + text.slice(i + 1);
  }
  return text;
}

function printApocalypseStatus(state: GameState, chronicleTier = 99): void {
  const tick = state.year * 4 + state.season;
  console.log();
  console.log(`╔══════════════════════════════════════════════════╗`);
  console.log(`║  THE PLATFORM — cycle ${tick.toString(16).padStart(4, '0')}                       ║`);
  console.log(`║  ${state.yearsBP} BP — everything is fine.                    ║`.slice(0, 53) + '║');
  console.log(`╚══════════════════════════════════════════════════╝`);

  // The Tree (it's everything now)
  const treeBar = '█'.repeat(Math.min(40, state.tree.height));
  console.log();
  console.log(`  TREE [${treeBar}] ${state.tree.carved.length} songs archived`);
  console.log(`  height: ${state.tree.height} — the tree is the sun now.`);

  // The Feed (not the setlist)
  if (state.setlist && state.setlist.length > 0) {
    const cap = setlistCapacity(state.people, state);
    console.log();
    console.log(`  THE FEED (${state.setlist.length}/${cap}):`);
    state.setlist.forEach((v, i) => {
      const addr = hexAddr();
      const verse = VERSES[v];
      const name = verse?.name || v;
      const bestSinger = state.people.reduce((best: Person | null, p) =>
        (p.verses[v] || 0) > (best?.verses[v] || 0) ? p : best, null);
      const integrity = bestSinger?.verses[v] || 0;
      const isAlgorithmPick = i >= state.setlist.length - 2;
      const tag = isAlgorithmPick ? ' [ALGORITHM]' : '';
      console.log(glitch(`    ${addr}  ${name.padEnd(22)} ${Math.round(integrity * 100)}%${tag}`));
    });
  }

  // Active shadows (accelerating)
  if (state.shadows) {
    const activeShadows = Object.entries(state.shadows).filter(([, v]) => v > 0.1);
    if (activeShadows.length > 0) {
      console.log();
      console.log(`  SCALING:`);
      for (const [id, progress] of activeShadows) {
        const sv = VERSES[id];
        if (!sv) continue;
        const bar = '█'.repeat(Math.round(progress * 10)) + '░'.repeat(10 - Math.round(progress * 10));
        console.log(`    ${(sv.name || id).padEnd(22)} [${bar}] ${Math.round(progress * 100)}%`);
      }
    }
  }

  // SOULS (not people)
  console.log();
  console.log(`  ACTIVE USERS (${state.people.length}):`);
  for (const p of state.people) {
    const cat = ageCategory(p);
    const catLabel = cat.toUpperCase().padEnd(6);
    const verses = Object.entries(p.verses)
      .filter(([, integ]) => integ >= LOST_THRESHOLD)
      .map(([v, integ]) => {
        const name = VERSES[v]?.name || v;
        return `${name}(${Math.round(integ * 100)}%)`;
      })
      .join(', ');
    const isUser = p.name.startsWith('User_') || p.name.startsWith('Admin_');
    const tag = isUser ? '' : ' [LEGACY]';
    console.log(`  ${catLabel} ${p.name.padEnd(16)} age ${String(p.age).padStart(2)} │ ${verses || '(no data)'}${tag}`);
  }

  // Raptured
  if (state.raptured && state.raptured.length > 0) {
    console.log();
    console.log(`  ARCHIVED SOULS (${state.raptured.length}):`);
    for (const r of state.raptured) {
      console.log(`    ${r.name.padEnd(16)} — ${r.verses.length} songs uploaded. They don't need their body anymore.`);
    }
  }

  // Spirits (deprecated)
  console.log();
  console.log(`  SPIRITS: [deprecated]`);
  if (state.spirits) {
    const angry = Object.entries(state.spirits).filter(([, s]) => s.spirit < 0.3);
    if (angry.length > 0) {
      for (const [key, s] of angry) {
        const spirit = SPIRITS[key];
        if (spirit) {
          console.log(`    // ${spirit.name}: ${Math.round(s.spirit * 100)}% — ${s.spirit < 0.1 ? 'RAGE' : 'anger'}`);
          console.log(`    // this metric is no longer tracked`);
        }
      }
    }
  }

  // Background processes — the old songs that can't be killed
  if (state.backgroundProcesses && state.backgroundProcesses.length > 0) {
    console.log();
    console.log(`  BACKGROUND PROCESSES (cannot be terminated):`);
    for (const songId of state.backgroundProcesses) {
      const verse = VERSES[songId];
      const addr = hexAddr();
      const knower = state.people.find(p => p.verses[songId] && p.verses[songId] >= LOST_THRESHOLD);
      const status = knower ? `${knower.name} — ${Math.round(knower.verses[songId] * 100)}%` : 'no active carrier';
      console.log(`    PID ${addr}  "${verse?.name || songId}" — ${status}`);
    }
    if (state.backgroundProcesses.length >= 2) {
      console.log(`    // these processes predate the platform. termination not supported.`);
    }
  }

  // Bridges
  const bridges = getAvailableBridges(state, chronicleTier);
  if (bridges.length > 0) {
    console.log();
    console.log(`  EXIT ROUTES:`);
    for (const b of bridges) {
      const status = b.met ? '>> OPEN' : '   locked';
      const needs = b.bridge.requires.map(v => {
        // In apocalypse, carved doesn't count — must be known by a living person
        const knownByPerson = state.people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
        return `${VERSES[v]?.name || v}${knownByPerson ? ' [LIVING]' : ' [requires living carrier]'}`;
      }).join(', ');
      console.log(`    ${status} → ${b.age.name}`);
      if (!b.met) {
        console.log(`             needs: ${needs}`);
        console.log(`             (carved doesn't count. a person must know it.)`);
      }
    }
  }

  // The lie
  console.log();
  console.log(`  everything is fine.`);
  console.log();
}

// ── Status ──────────────────────────────────────────────────────────

export function printStatus(state: GameState, chronicleTier = 99): void {
  if (state.ageKey === 'apocalypse') {
    printApocalypseStatus(state, chronicleTier);
    return;
  }

  const seasonName = ['Spring', 'Summer', 'Autumn', 'Winter'][state.season];
  console.log();
  console.log(`═══════════════════════════════════════════════════`);
  const ageName = state.ageName || AGES[state.ageKey || 'stone']?.name || 'Unknown Age';
  console.log(`  IN THE SHADOW OF THE TECH TREE — ${ageName}`);
  console.log(`  ${seasonName}, Year ${state.year} (${state.yearsBP} BP)`);

  const spiritStr = (s: number) => s > 0.7 ? 'peace' : s > 0.4 ? 'uneasy' : s > 0.2 ? 'angry' : 'RAGE';
  const spirits = state.spirits || {};
  const animalSpirits = Object.entries(SPIRITS).filter(([, def]) => def.kind === 'animal');
  const greatSpirits = Object.entries(SPIRITS).filter(([, def]) => def.kind === 'great' && !def.invisibleSpirit);
  const yeastSpirit = Object.entries(SPIRITS).find(([, def]) => def.invisibleSpirit);
  const fmtSpirit = ([key, def]: [string, typeof SPIRITS[string]]) => {
    const s = spirits[key]?.spirit ?? 1;
    return `${def.name}: ${spiritStr(s)}`;
  };
  console.log(`  Food: ${state.food}  Sun: ${Math.round(state.sunlight * 100)}%  Fellings: ${state.fellings}`);
  console.log(`  Spirits: ${animalSpirits.map(fmtSpirit).join('  ')}`);
  const greatLine = greatSpirits.map(fmtSpirit).join('  ');
  const bandKnowsDisplay = (v: string) => state.people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
  const hasYeast = Object.keys(VERSES).some(id => VERSES[id].effects?.yeastSong && bandKnowsDisplay(id));
  if (yeastSpirit && hasYeast) {
    const ys = spirits[yeastSpirit[0]]?.spirit ?? 0;
    const yeastStr = `Yeast: ${ys > 0.7 ? 'thriving' : ys > 0.3 ? 'rising' : 'stirring'}`;
    console.log(`           ${greatLine}  ${yeastStr}`);
  } else {
    console.log(`           ${greatLine}`);
  }
  console.log(`═══════════════════════════════════════════════════`);

  // The Tree
  if (state.tree.height > 0) {
    const bar = '█'.repeat(state.tree.height) + '░'.repeat(Math.max(0, SUN_DEAD_THRESHOLD - state.tree.height));
    console.log();
    console.log(`  THE TREE [${bar}] ${state.tree.height}/${SUN_DEAD_THRESHOLD}`);
    if (state.tree.carved.length > 0) {
      console.log(`  Carved: ${state.tree.carved.map(v => VERSES[v]?.name || v).join(', ')}`);
    }
  } else {
    console.log();
    console.log(`  THE TREE — a stump. (or not yet grown)`);
  }

  // The Setlist
  if (state.setlist && state.setlist.length > 0) {
    const cap = setlistCapacity(state.people, state);
    console.log();
    console.log(`  THE SETLIST (${state.setlist.length}/${cap}):`);
    state.setlist.forEach((v, i) => {
      const bestSinger = state.people.reduce((best: Person | null, p) =>
        (p.verses[v] || 0) > (best?.verses[v] || 0) ? p : best, null);
      const integrity = bestSinger?.verses[v] || 0;
      const posFac = positionFactor(i, state.setlist.length);
      const reps = state.setlistHistory?.[v] || 0;
      const repStr = reps > 1 ? ` [${reps}]` : '';
      console.log(`    ${i + 1}. ${(VERSES[v]?.name || v).padEnd(22)} ${bestSinger?.name?.padEnd(12) || '?'.padEnd(12)} ${Math.round(integrity * 100)}%  →${Math.round(posFac * 100)}%${repStr}`);
    });
  }

  // Active shadows
  if (state.shadows) {
    const activeShadows = Object.entries(state.shadows).filter(([, v]) => v > 0.1);
    if (activeShadows.length > 0) {
      console.log();
      console.log(`  SHADOWS:`);
      for (const [id, progress] of activeShadows) {
        const sv = VERSES[id];
        if (!sv || !sv.shadow_of) continue;
        const bar = '▓'.repeat(Math.round(progress * 10)) + '░'.repeat(10 - Math.round(progress * 10));
        console.log(`    ${(sv.name || id).padEnd(22)} [${bar}] ${Math.round(progress * 100)}%  (${VERSES[sv.shadow_of]?.name || sv.shadow_of} without ${VERSES[sv.shadow_when!]?.name || sv.shadow_when})`);
      }
    }
  }

  // The People
  console.log();
  const peopleCounts: Record<string, number> = {};
  for (const p of state.people) {
    const kind = identifyPeople(p, state.ageKey);
    peopleCounts[kind] = (peopleCounts[kind] || 0) + 1;
  }
  const bandDesc = Object.entries(peopleCounts).map(([k, v]) => `${v} ${PEOPLES[k]?.name || k}`).join(', ');
  console.log(`  THE PEOPLE (${state.people.length}: ${bandDesc}):`);
  for (const p of state.people) {
    const cat = ageCategory(p);
    const catLabel = cat.toUpperCase().padEnd(6);
    const kind = heritageLabel(p).padEnd(5);
    const verses = Object.entries(p.verses)
      .filter(([, integ]) => integ >= LOST_THRESHOLD)
      .map(([v, integ]) => {
        const integrity = Math.round(integ * 100);
        const warn = integ < GARBLE_THRESHOLD ? '!' : '';
        const eased = bloodEases(p);
        const foreign = VERSES[v]?.people && !['between', 'ash'].includes(VERSES[v].people) && !eased[v] ? '*' : '';
        return `${VERSES[v]?.name || v}(${integrity}%${warn}${foreign})`;
      })
      .join(', ');
    console.log(`  ${catLabel} ${kind} ${p.name.padEnd(14)} age ${String(p.age).padStart(2)} │ ${verses || '(knows nothing)'}`);
  }

  // Fragments
  if (state.fragments.length > 0) {
    console.log();
    console.log(`  FRAGMENTS ON THE GROUND:`);
    for (const f of state.fragments) {
      console.log(`    "${VERSES[f.verse]?.name || f.verse}" — ${(f.integrity * 100).toFixed(0)}% intact`);
    }
  }

  // Encounter
  if (state.encounter) {
    const ePeople = PEOPLES[state.encounter.people]?.name || 'Stranger';
    console.log();
    console.log(`  ★ ${ePeople.toUpperCase()}: ${state.encounter.name} (age ${state.encounter.age})`);
    console.log(`    ${PEOPLES[state.encounter.people]?.desc || ''}`);
    const verses = Object.entries(state.encounter.verses)
      .map(([v, integ]) => `${VERSES[v]?.name || v}(${Math.round(integ * 100)}%)`)
      .join(', ');
    console.log(`    Knows: ${verses}`);
  }

  // Ash
  if (state.ashVerses.length > 0) {
    console.log();
    console.log(`  FROM THE ASH:`);
    for (const v of state.ashVerses) {
      const verse = VERSES[v];
      const anyoneKnows = state.people.some(p => p.verses[v] && p.verses[v] >= LOST_THRESHOLD);
      const status = anyoneKnows ? '(learned)' : '(study with: node song.ts study_ash ' + v + ')';
      console.log(`    "${verse?.name}" — ${verse?.desc}`);
      console.log(`    ${status}`);
    }
  }

  // Bridges
  const bridges = getAvailableBridges(state, chronicleTier);
  if (bridges.length > 0) {
    console.log();
    console.log(`  BRIDGES (where the song can take you):`);
    for (const b of bridges) {
      const status = b.met ? '>> OPEN' : '   locked';
      const needs = b.bridge.requires.map(v => {
        const known = state.tree.carved.includes(v) || state.people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
        return `${VERSES[v]?.name || v}${known ? ' [ok]' : ''}`;
      }).join(', ');
      console.log(`    ${status} → ${b.age.name} (${b.age.yearsBP.toLocaleString()} BP)`);
      if (!b.met) {
        console.log(`             needs: ${needs}`);
      } else {
        console.log(`             "${b.bridge.desc}"`);
        console.log(`             (Use: node song.ts cross ${b.key})`);
      }
    }
  }

  // Journey
  if (state.previousAges && state.previousAges.length > 0) {
    console.log();
    console.log(`  AGES VISITED: ${state.previousAges.map(a => a.name).join(' → ')} → ${ageName}`);
  }

  // Lost
  if (state.totalLost.length > 0) {
    console.log();
    console.log(`  LOST FOREVER: ${state.totalLost.map(v => VERSES[v]?.name || v).join(', ')}`);
  }

  console.log();
}

// ── Verse listing ───────────────────────────────────────────────────

export function printVerses(): void {
  console.log();
  console.log('  ALL VERSES:');
  const byPeople: Record<string, any[]> = {};
  for (const [id, v] of Object.entries(VERSES)) {
    const key = v.people || v.tradition;
    if (!byPeople[key]) byPeople[key] = [];
    byPeople[key].push({ id, ...v });
  }
  const order = ['bear', 'troll', 'dwarf', 'elf', 'halfling', 'human', 'between', 'ash'];
  for (const key of order) {
    const verses = byPeople[key];
    if (!verses) continue;
    const label = PEOPLES[key]?.name || key.toUpperCase();
    const desc = PEOPLES[key]?.desc || '';
    console.log(`\n  ══ ${label.toUpperCase()} SONGS ${desc ? '— ' + desc : ''} ══`);
    for (const v of verses) {
      const prereqs = v.prereqs.length > 0 ? ` (needs: ${v.prereqs.join(', ')})` : '';
      console.log(`    ${v.id.padEnd(14)} "${v.name}"${prereqs}`);
      console.log(`    ${''.padEnd(14)} ${v.desc}`);
    }
  }
  console.log();
}

// ── Help ────────────────────────────────────────────────────────────

export function printHelp(): void {
  if (true) {  // TODO: check state for apocalypse, but help is stateless here
    console.log(`
  THE SONG — commands:

  node song.ts                     Advance one season (the world turns)
  node song.ts status              Show current state
  node song.ts verses              List all known verses

  node song.ts setlist                          Show current setlist
  node song.ts setlist <v1> <v2> <v3> ...       Arrange the setlist (order matters!)
  node song.ts prioritize <verse>               Move a verse to opening position
  node song.ts teach <elder> <student> <verse>  Focused apprenticeship (1-on-1)
  node song.ts carve <verse>       Carve a verse on the Tree (needs Carving Song)
  node song.ts fell                Fell the Tree (needs Blade Singing)
  node song.ts gather              Gather fragments after a felling

  node song.ts welcome             Accept a stranger into the band
  node song.ts ignore              Turn a stranger away
  node song.ts study_ash <verse>   Learn a verse that grew from the ash
  node song.ts cross               Show available bridges to other ages
  node song.ts cross <age>         Cross a bridge to another age
  node song.ts name <old> <new>    Give someone back their name

  node song.ts chronicle            The fossil record — what persists across all games
  node song.ts reset               Start over from the beginning

  The setlist is what the community sings each season. Order matters.
  The opening verse transmits best to youth. Deep night verses fade.
  Youth learn by being present — legitimate peripheral participation.
  Songs not on the setlist are not transmitted. One generation of silence = lost.
  Verses don't decay in the singer. Decay is generational.
  The constraint is singing time, not memory.

  Time is not a line. Ages are places the song can take you.
  Carve the right songs and bridges open — forward, backward, sideways.
  Put two prerequisite songs adjacent on the setlist — between-songs emerge.
  The tree grows when you carve. It blocks the sun. You must fell it.
  The bears have their own age. You have to earn it.
  The last age is the Tech Tree. The only way out is through.
  Arrange.
  `);
  }
}
