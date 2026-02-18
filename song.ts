#!/usr/bin/env node
// IN THE SHADOW OF THE TECH TREE — a game about oral tradition, deep time, and what grows in the dark
// One execution = one season. State persists in state.json.
// Usage: node song.ts [action] [args...]

import * as fs from 'fs';
import * as path from 'path';

import {
  VERSES, GARBLE_THRESHOLD, LOST_THRESHOLD, LEARN_RATE_FOCUSED, WRITING_INTEGRITY,
  TREE_GROWTH_PER_VERSE, SUN_BLOCKED_THRESHOLD, SUN_DEAD_THRESHOLD,
  FELLING_SCATTERS_CHANCE, ASH_VERSES, PEOPLES,
} from './song/tree/index.ts';
import {
  type Person, ageCategory, teachingPower, makePerson, identifyPeople,
  bloodEases, bloodReading,
} from './song/singer.ts';
import { type GameState, newState } from './song/ground.ts';
import { SPIRITS } from './song/spirit.ts';
import { AGES, getAvailableBridges, crossBridge, determineApocalypse } from './song/age.ts';
import { setlistCapacity, positionFactor } from './song/sing.ts';
import { advanceSeason } from './song/season.ts';
import { printStatus, printVerses, printHelp } from './song/voice.ts';

const STATE_FILE = path.join(import.meta.dirname!, 'state.json');

// ── Actions ─────────────────────────────────────────────────────────

function actionSetlist(state: GameState, ...verseIds: string[]): string[] {
  if (!state.setlist) state.setlist = [];
  const cap = setlistCapacity(state.people, state);
  const msgs: string[] = [];

  if (verseIds.length === 0 || !verseIds[0]) {
    msgs.push(`  THE SETLIST (${state.setlist.length}/${cap} slots):`);
    if (state.setlist.length === 0) {
      msgs.push('    (empty — songs will auto-fill next season)');
    } else {
      state.setlist.forEach((v, i) => {
        const bestSinger = state.people.reduce((best: Person | null, p) =>
          (p.verses[v] || 0) > (best?.verses[v] || 0) ? p : best, null);
        const integrity = bestSinger?.verses[v] || 0;
        const posFac = positionFactor(i, state.setlist.length);
        const reps = state.setlistHistory?.[v] || 0;
        const repStr = reps > 1 ? ` [${reps} seasons]` : '';
        msgs.push(`    ${i + 1}. ${VERSES[v]?.name || v} — ${bestSinger?.name || '?'} at ${Math.round(integrity * 100)}%  (transmission: ${Math.round(posFac * 100)}%)${repStr}`);
      });
    }
    msgs.push(`  Capacity: ${cap} (${state.people.filter(p => ageCategory(p) !== 'youth').length} singers)`);
    return msgs;
  }

  const newSetlist: string[] = [];
  for (const v of verseIds) {
    if (!VERSES[v]) { msgs.push(`  Unknown verse: ${v}`); continue; }
    if (!state.people.some(p => p.verses[v] && p.verses[v] >= LOST_THRESHOLD)) {
      msgs.push(`  No one knows "${VERSES[v].name}" — can't add to setlist.`);
      continue;
    }
    if (newSetlist.includes(v)) continue;
    if (newSetlist.length >= cap) {
      msgs.push(`  Setlist full (${cap} slots). "${VERSES[v].name}" dropped.`);
      break;
    }
    newSetlist.push(v);
  }
  state.setlist = newSetlist;
  msgs.push(`  Setlist arranged (${newSetlist.length}/${cap}):`);
  newSetlist.forEach((v, i) => {
    const posFac = positionFactor(i, newSetlist.length);
    msgs.push(`    ${i + 1}. ${VERSES[v]?.name || v} (transmission: ${Math.round(posFac * 100)}%)`);
  });
  if (newSetlist.length < cap) {
    msgs.push(`  ${cap - newSetlist.length} empty slots — will auto-fill next season.`);
  }
  return msgs;
}

function actionPrioritize(state: GameState, verseId: string): string[] {
  if (!verseId || !VERSES[verseId]) return [`Unknown verse: ${verseId}`];
  if (!state.setlist) state.setlist = [];
  const idx = state.setlist.indexOf(verseId);
  if (idx >= 0) state.setlist.splice(idx, 1);
  state.setlist.unshift(verseId);
  const cap = setlistCapacity(state.people, state);
  while (state.setlist.length > cap) state.setlist.pop();
  return [`  "${VERSES[verseId].name}" moved to opening position.`];
}

function actionCarve(state: GameState, verseId: string): string[] {
  if (!VERSES[verseId]) return [`Unknown verse: ${verseId}`];
  if (state.tree.carved.includes(verseId)) return [`"${VERSES[verseId].name}" is already carved on the Tree.`];

  const carver = state.people.find(p =>
    p.verses[verseId] && p.verses[verseId] >= 0.7 &&
    p.verses['tree_song'] && p.verses['tree_song'] >= GARBLE_THRESHOLD
  );
  if (!carver) return ['Need someone who knows this verse well (70%+) AND knows "The Carving Song".'];

  state.tree.carved.push(verseId);
  state.tree.height += TREE_GROWTH_PER_VERSE;

  const msgs = [`  ${carver.name} carves "${VERSES[verseId].name}" into the Tree.`];
  msgs.push(`  Tree height: ${state.tree.height}`);
  if (state.tree.height >= SUN_BLOCKED_THRESHOLD) {
    msgs.push(`  The Tree's canopy darkens the sky...`);
  }
  if (state.tree.height >= SUN_DEAD_THRESHOLD) {
    msgs.push(`  !! THE TREE BLOCKS THE SUN — the world grows cold and nothing grows !!`);
    msgs.push(`  !! You must fell the Tree or all will perish !!`);
  }
  return msgs;
}

function actionFell(state: GameState): string[] {
  if (state.tree.height === 0) return ['There is no Tree to fell.'];
  if (!state.people.some(p => p.verses['blade'] && p.verses['blade'] >= GARBLE_THRESHOLD)) {
    return ['No one knows "Blade Singing" well enough to fell the Tree.'];
  }

  const msgs: string[] = [];
  msgs.push(`  THE TREE IS FELLED.`);
  msgs.push(`  Height was: ${state.tree.height}. Carved verses: ${state.tree.carved.length}`);

  const scattered: { verse: string; integrity: number }[] = [];
  const lost: string[] = [];
  for (const v of state.tree.carved) {
    if (Math.random() < FELLING_SCATTERS_CHANCE) {
      const integrity = 0.3 + Math.random() * 0.4;
      scattered.push({ verse: v, integrity });
      msgs.push(`  Fragment found: "${VERSES[v]?.name || v}" (${(integrity * 100).toFixed(0)}% intact)`);
    } else {
      const carriers = state.people.filter(p => p.verses[v] && p.verses[v] >= LOST_THRESHOLD);
      if (carriers.length === 0) {
        lost.push(v);
        msgs.push(`  !! "${VERSES[v]?.name || v}" is LOST — it was only on the Tree !!`);
      } else {
        msgs.push(`  "${VERSES[v]?.name || v}" survives in memory (${carriers.map(c => c.name).join(', ')})`);
      }
    }
  }

  state.fragments = state.fragments.concat(scattered);
  state.totalLost = state.totalLost.concat(lost);

  // The Ash grows
  const carvedSet = new Set(state.tree.carved);
  const newAshVerses: string[] = [];
  for (const [id, av] of Object.entries(ASH_VERSES)) {
    if (state.ashVerses.includes(id)) continue;
    const needed = av.emerges_from;
    if (needed && needed.every(v => carvedSet.has(v))) {
      newAshVerses.push(id);
      msgs.push(`  From the ash, something new grows: "${av.name}"`);
      msgs.push(`    ${av.desc}`);
    }
  }
  state.ashVerses = state.ashVerses.concat(newAshVerses);

  state.tree = { height: 0, carved: [] };
  state.sunlight = 1.0;
  state.fellings += 1;

  if (state.spirits) {
    for (const key of Object.keys(state.spirits)) {
      state.spirits[key].spirit = Math.max(0, state.spirits[key].spirit - 0.15);
    }
  }
  msgs.push(`  The spirits stir uneasily. The felling disturbs the land.`);

  msgs.push(`  The sun returns.`);
  msgs.push(`  Fellings: ${state.fellings}. Verses permanently lost: ${state.totalLost.length}`);
  if (scattered.length > 0) {
    msgs.push(`  Fragments on the ground: ${scattered.length}. Use "node song.ts gather" to collect them.`);
  }
  msgs.push('');
  msgs.push(`  The bridges shimmer. Where will the song take you?`);
  msgs.push(`  (Use: node song.ts cross to see available bridges)`);

  return msgs;
}

function actionGather(state: GameState): string[] {
  if (state.fragments.length === 0) return ['No fragments to gather.'];
  const msgs: string[] = [];
  for (const frag of state.fragments) {
    const verse = VERSES[frag.verse];
    if (!verse) continue;
    const learner = state.people.find(p => {
      if (ageCategory(p) === 'youth') return false;
      return verse.prereqs.every(pr => p.verses[pr] && p.verses[pr] >= GARBLE_THRESHOLD);
    });
    if (learner) {
      const existing = learner.verses[frag.verse] || 0;
      learner.verses[frag.verse] = Math.max(existing, frag.integrity);
      msgs.push(`  ${learner.name} gathers fragment: "${verse.name}" (${(frag.integrity * 100).toFixed(0)}%)`);
    } else {
      msgs.push(`  No one can understand the fragment of "${verse.name}" — prereqs not met. It crumbles.`);
      if (!state.totalLost.includes(frag.verse)) {
        const anyoneKnows = state.people.some(p => p.verses[frag.verse] && p.verses[frag.verse] >= LOST_THRESHOLD);
        if (!anyoneKnows) state.totalLost.push(frag.verse);
      }
    }
  }
  state.fragments = [];
  return msgs;
}

function actionWelcome(state: GameState): string[] {
  if (!state.encounter) return ['There is no one to welcome.'];
  const e = state.encounter;
  state.people.push({ name: e.name, age: e.age, people: e.people || 'human', blood: e.blood, verses: e.verses });
  const verseList = Object.keys(e.verses).map(v => VERSES[v]?.name || v).join(', ');
  const peopleLabel = PEOPLES[identifyPeople(e, state?.ageKey)]?.name || PEOPLES[e.people]?.name || 'stranger';
  state.encounter = null;
  return [`  ${e.name} the ${peopleLabel} joins the band. They bring: ${verseList}`];
}

function actionIgnore(state: GameState): string[] {
  if (!state.encounter) return ['There is no one here.'];
  const name = state.encounter.name;
  state.encounter = null;
  return [`  ${name} disappears into the landscape. Their songs go with them.`];
}

function actionStudyAsh(state: GameState, verseId: string): string[] {
  if (!verseId) return ['Usage: node song.ts study_ash <verse_id>'];
  if (!state.ashVerses.includes(verseId)) {
    return [`"${verseId}" has not emerged from the ash. Available: ${state.ashVerses.map(v => `${v} ("${VERSES[v]?.name}")`).join(', ') || 'none'}`];
  }
  const verse = VERSES[verseId];
  if (!verse) return [`Unknown verse: ${verseId}`];

  const learner = state.people.find(p => {
    if (ageCategory(p) === 'youth') return false;
    if (p.verses[verseId] && p.verses[verseId] >= 0.5) return false;
    return verse.prereqs.every(pr => p.verses[pr] && p.verses[pr] >= GARBLE_THRESHOLD);
  });
  if (!learner) return [`No one has the prerequisite songs to study "${verse.name}": needs ${verse.prereqs.join(', ')}`];

  const old = learner.verses[verseId] || 0;
  learner.verses[verseId] = Math.min(0.6, old + 0.3);
  const msgs = [`  ${learner.name} kneels in the ash and begins to understand "${verse.name}"`];
  msgs.push(`  Integrity: ${(old * 100).toFixed(0)}% → ${(learner.verses[verseId] * 100).toFixed(0)}%`);
  msgs.push(`  (Sing it to strengthen it further)`);
  return msgs;
}

function actionTeach(state: GameState, teacherName: string, studentName: string, verseId: string): string[] {
  const teacher = state.people.find(p => p.name.toLowerCase() === teacherName?.toLowerCase());
  const student = state.people.find(p => p.name.toLowerCase() === studentName?.toLowerCase());
  if (!teacher) return [`No one named "${teacherName}" in the band.`];
  if (!student) return [`No one named "${studentName}" in the band.`];
  if (!verseId || !VERSES[verseId]) return [`Unknown verse: ${verseId}`];
  if (!teacher.verses[verseId] || teacher.verses[verseId] < LOST_THRESHOLD) {
    return [`${teacher.name} doesn't know "${VERSES[verseId].name}".`];
  }
  if (teachingPower(teacher) === 0) return [`${teacher.name} is too young to teach.`];

  const verse = VERSES[verseId];
  const hasPrereqs = verse.prereqs.every(pr =>
    student.verses[pr] && student.verses[pr] >= GARBLE_THRESHOLD
  );
  if (!hasPrereqs && verse.prereqs.length > 0) {
    return [`${student.name} lacks the prerequisite songs: ${verse.prereqs.map(p => VERSES[p]?.name || p).join(', ')}`];
  }

  const eased = bloodEases(student);
  const bloodBonus = eased[verseId] || 0;
  const gain = LEARN_RATE_FOCUSED * teachingPower(teacher) * (1 + bloodBonus);
  const old = student.verses[verseId] || 0;
  const garbled = teacher.verses[verseId] < GARBLE_THRESHOLD;
  const cap = teacher.verses[verseId];
  student.verses[verseId] = Math.min(cap, old + gain);

  const msgs: string[] = [];
  if (garbled) {
    msgs.push(`  ${teacher.name} teaches ${student.name} a garbled version of "${verse.name}"`);
  }
  msgs.push(`  ${student.name} learns "${verse.name}": ${(old * 100).toFixed(0)}% → ${(student.verses[verseId] * 100).toFixed(0)}%`);
  return msgs;
}

// ── Main ────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  let state: GameState;
  if (fs.existsSync(STATE_FILE)) {
    state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    // Re-register age songs
    const visitedKeys = (state.previousAges || []).map(a => a.key).filter(Boolean);
    const currentKey = state.ageKey || 'stone';
    for (const key of [...visitedKeys, currentKey]) {
      if (AGES[key]?.newSongs) Object.assign(VERSES, AGES[key].newSongs);
    }
    for (const [key, age] of Object.entries(AGES)) {
      if (age.newSongs && age.yearsBP >= (state.yearsBP || 0)) {
        Object.assign(VERSES, age.newSongs);
      }
    }
  } else {
    state = newState();
  }

  if (!action) {
    const msgs = advanceSeason(state);
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    for (const m of msgs) console.log(m);
    printStatus(state);
    return;
  }

  switch (action) {
    case 'status':
      printStatus(state);
      break;

    case 'verses':
      printVerses();
      break;

    case 'help':
      printHelp();
      break;

    case 'setlist':
      for (const m of actionSetlist(state, ...args.slice(1))) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'prioritize':
      if (!args[1]) { console.log('Usage: node song.ts prioritize <verse_id>'); break; }
      for (const m of actionPrioritize(state, args[1])) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'carve':
      if (!args[1]) { console.log('Usage: node song.ts carve <verse_id>'); break; }
      for (const m of actionCarve(state, args[1])) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'fell':
      for (const m of actionFell(state)) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'gather':
      for (const m of actionGather(state)) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'welcome':
      for (const m of actionWelcome(state)) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'ignore':
      for (const m of actionIgnore(state)) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'teach':
      if (args.length < 4) { console.log('Usage: node song.ts teach <teacher_name> <student_name> <verse_id>'); break; }
      for (const m of actionTeach(state, args[1], args[2], args[3])) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'study_ash':
      if (!args[1]) { console.log('Usage: node song.ts study_ash <verse_id>'); break; }
      for (const m of actionStudyAsh(state, args[1])) console.log(m);
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      break;

    case 'cross': {
      if (!args[1]) {
        const bridges = getAvailableBridges(state);
        if (bridges.length === 0) {
          console.log('  No bridges from this age. Sing more. Carve more.');
          break;
        }
        console.log('  Available bridges:');
        for (const b of bridges) {
          const status = b.met ? 'OPEN' : 'locked';
          console.log(`    ${status} → ${b.key}: ${b.age.name}`);
          if (!b.met) {
            console.log(`      needs: ${b.bridge.requires.map(v => VERSES[v]?.name || v).join(', ')}`);
          }
        }
        console.log('  Usage: node song.ts cross <age_key>');
        break;
      }
      const result = crossBridge(state, args[1]);
      for (const m of result.msgs) console.log(m);
      if (result.nextState) {
        state = result.nextState;
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        printStatus(state);
      }
      break;
    }

    case 'next_age': {
      console.log('  Time is not a line. Use "node song.ts cross" to see where the song can take you.');
      const bridges = getAvailableBridges(state);
      const open = bridges.filter(b => b.met);
      if (open.length > 0) {
        console.log('  Open bridges:');
        for (const b of open) {
          console.log(`    → node song.ts cross ${b.key}  (${b.age.name})`);
        }
      }
      break;
    }

    case 'reset':
      state = newState();
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      console.log('  From the ash, a new beginning.');
      printStatus(state);
      break;

    default:
      console.log(`Unknown action: ${action}`);
      printHelp();
  }
}

main();
