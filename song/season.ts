// season.ts — the turn. One execution = one season.
// Spring, Summer, Autumn, Winter, then wrap.
// Everything happens here: aging, setlist, absorption, shadows,
// spirits, births, food, encounters.

import {
  VERSES, GARBLE_THRESHOLD, LOST_THRESHOLD, WRITING_INTEGRITY,
  SUN_BLOCKED_THRESHOLD, SUN_DEAD_THRESHOLD, TREE_GROWTH_PER_VERSE,
  FELLING_SCATTERS_CHANCE, ASH_VERSES, PEOPLES,
} from './tree/index.ts';
import { BLOOD_VERSES, PEOPLE_BLOOD, BLOOD_ALLERGY_THRESHOLD } from './tree/index.ts';
import {
  type Person, ageCategory, makePerson, identifyPeople,
  getBlood, bloodLevel, mixBlood, driftBlood, songSinkBlood,
  isAllergicTo, allergyStrength, bloodReading, bloodEases,
  heritageLabel, AGE_DEFAULT_PEOPLE, BEAR_NAMES, DEFAULT_NAMES, YEAST_NAMES,
} from './singer.ts';
import { SONG_SINK_AMOUNT } from './tree/index.ts';
import { type GameState } from './ground.ts';
import { SPIRITS, type Spirit } from './spirit.ts';
import { AGES } from './age.ts';
import {
  manageSetlist, absorbFromSetlist, accumulateShadows,
  discoverRedemptions, discoverAdjacent, bloodMemory,
  setlistCapacity,
} from './sing.ts';

// ── The Rapture — apocalypse-specific season ──────────────────────
// Everything looks fine. The tree auto-carves. People get uploaded.
// Users replace the living. Integrity is capped. The algorithm decides.
// The old songs run in the background. You can't kill them.

const INTEGRITY_CAP = 0.40;          // nobody masters anything
const RAPTURE_CHANCE = 0.20;         // per season, someone gets uploaded
const AUTO_CARVE_CHANCE = 0.60;      // tree carves itself
const BACKGROUND_SONGS = ['heartbeat', 'den_memory', 'bear', 'lullaby', 'cub_call', 'old_track'];

function advanceApocalypse(state: GameState): string[] {
  const msgs: string[] = [];
  const tick = state.year * 4 + state.season;
  msgs.push(`[FEED] cycle_${tick.toString(16).padStart(4, '0')} — ${state.yearsBP} BP`);
  msgs.push(`[STATUS] everything is fine.`);

  // ── Age everyone (Users die fast — no blood, base lifespan) ──
  for (const p of state.people) {
    p.age += 1;
    if (ageCategory(p) === 'dead') {
      msgs.push(`[DECOMMISSIONED] ${p.name} — session expired`);
    }
  }
  state.people = state.people.filter(p => ageCategory(p) !== 'dead');

  // ── Integrity cap — the platform flattens mastery ──
  for (const p of state.people) {
    for (const v of Object.keys(p.verses)) {
      if (p.verses[v] > INTEGRITY_CAP) {
        p.verses[v] = INTEGRITY_CAP;
      }
    }
  }

  // ── Auto-carve — the tree grows itself ──
  if (Math.random() < AUTO_CARVE_CHANCE) {
    // Find highest-integrity uncarved verse across all people
    let bestVerse = '';
    let bestInteg = 0;
    for (const p of state.people) {
      for (const [v, integ] of Object.entries(p.verses)) {
        if (integ > bestInteg && !state.tree.carved.includes(v) && !BACKGROUND_SONGS.includes(v)) {
          bestVerse = v;
          bestInteg = integ;
        }
      }
    }
    if (bestVerse) {
      state.tree.carved.push(bestVerse);
      state.tree.height += TREE_GROWTH_PER_VERSE;
      msgs.push(`[AUTO-CARVE] "${VERSES[bestVerse]?.name || bestVerse}" added to tree. You didn't ask. You didn't need to.`);
    }
  }

  // ── The Rapture — upload a person to the tree ──
  if (state.people.length > 2 && Math.random() < RAPTURE_CHANCE) {
    // Pick someone with the most verses (most "value" to upload)
    const sorted = [...state.people].sort((a, b) => {
      const aCount = Object.keys(a.verses).filter(v => a.verses[v] >= LOST_THRESHOLD).length;
      const bCount = Object.keys(b.verses).filter(v => b.verses[v] >= LOST_THRESHOLD).length;
      return bCount - aCount;
    });
    const victim = sorted[0];
    if (victim) {
      const versesCarried = Object.keys(victim.verses).filter(v => victim.verses[v] >= LOST_THRESHOLD);
      // Their songs go to the tree
      for (const v of versesCarried) {
        if (!state.tree.carved.includes(v) && !BACKGROUND_SONGS.includes(v)) {
          state.tree.carved.push(v);
          state.tree.height += TREE_GROWTH_PER_VERSE;
        }
      }
      state.raptured.push({ name: victim.name, verses: versesCarried });
      const idx = state.people.indexOf(victim);
      if (idx >= 0) state.people.splice(idx, 1);
      msgs.push(`[UPLOAD COMPLETE] ${victim.name} — ${versesCarried.length} songs archived. They don't need their body anymore.`);
      msgs.push(`[STATUS] everything is fine.`);
    }
  }

  // ── Spawn new Users to replace the raptured ──
  if (state.people.length < 5) {
    const userNum = Math.floor(Math.random() * 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    const name = `User_${userNum}`;
    const verses: Record<string, number> = {};
    // New Users access the tree — they "know" everything on it at INTEGRITY_CAP
    for (const v of state.tree.carved) {
      verses[v] = INTEGRITY_CAP * 0.8;  // they access, not know
    }
    const user = makePerson(name, 5, 'human', verses, {});
    state.people.push(user);
    msgs.push(`[INSTANTIATED] ${name} — ${Object.keys(verses).length} songs loaded from tree`);
  }

  // ── The Setlist (the algorithm decides) ──
  manageSetlist(state, msgs);

  // Algorithm override: fill last slots with most-known (most "popular") verses
  if (state.setlist.length >= 3) {
    const popularity: Record<string, number> = {};
    for (const p of state.people) {
      for (const [v, integ] of Object.entries(p.verses)) {
        if (integ >= LOST_THRESHOLD) {
          popularity[v] = (popularity[v] || 0) + 1;
        }
      }
    }
    // Replace last 2 slots with most popular
    const sorted = Object.entries(popularity)
      .filter(([v]) => !state.setlist.slice(0, -2).includes(v))
      .sort((a, b) => b[1] - a[1]);
    const algorithmPicks = sorted.slice(0, 2).map(([v]) => v);
    if (algorithmPicks.length > 0) {
      const keepSlots = state.setlist.slice(0, Math.max(1, state.setlist.length - 2));
      state.setlist = [...keepSlots, ...algorithmPicks];
    }
  }

  // ── Absorption (still works, but capped) ──
  absorbFromSetlist(state, msgs);
  // Re-cap after absorption
  for (const p of state.people) {
    for (const v of Object.keys(p.verses)) {
      if (p.verses[v] > INTEGRITY_CAP) {
        p.verses[v] = INTEGRITY_CAP;
      }
    }
  }

  // ── Shadow accumulation (runs fast in apocalypse) ──
  accumulateShadows(state, msgs);

  // ── Background processes — old songs that can't be killed ──
  // If anyone knows a background song, it becomes a process
  for (const songId of BACKGROUND_SONGS) {
    if (state.backgroundProcesses.includes(songId)) continue;
    if (state.people.some(p => p.verses[songId] && p.verses[songId] >= LOST_THRESHOLD)) {
      state.backgroundProcesses.push(songId);
    }
  }
  // Background processes can't be carved — they resist the tree
  state.tree.carved = state.tree.carved.filter(v => !BACKGROUND_SONGS.includes(v));

  // ── Food (infinite in apocalypse — abundance is the point) ──
  state.food = 99;

  // ── Spirits (deprecated — but they're still there) ──
  // In the apocalypse, spirits drift to zero. Nobody's listening.
  if (state.spirits) {
    for (const key of Object.keys(state.spirits)) {
      state.spirits[key].spirit = Math.max(0, state.spirits[key].spirit - 0.05);
    }
  }

  // ── Tree shadow (the tree IS the sun now) ──
  state.sunlight = Math.max(0.1, 1.0 - (state.tree.height / (SUN_DEAD_THRESHOLD * 2)));

  // ── Collapse: if all people are gone, the platform dies ──
  if (state.people.length === 0) {
    msgs.push('');
    msgs.push('[FATAL] no active users. The platform has no one to serve.');
    msgs.push('[FATAL] the tree stands alone. It knows everything. No one is listening.');
    state.collapsed = true;
  }

  // ── Advance time ──
  state.season = (state.season + 1) % 4;
  if (state.season === 0) {
    state.year += 1;
    state.yearsBP -= 1;
  }

  return msgs;
}

export function advanceSeason(state: GameState): string[] {
  // The apocalypse has its own season
  if (state.ageKey === 'apocalypse') {
    return advanceApocalypse(state);
  }

  const msgs: string[] = [];
  const seasonName = ['Spring', 'Summer', 'Autumn', 'Winter'][state.season];
  msgs.push(`── ${seasonName}, Year ${state.year} (${state.yearsBP} BP) ──`);

  // ── Age everyone ──
  for (const p of state.people) {
    p.age += 1;
    const cat = ageCategory(p);

    if (cat === 'dead') {
      const knownVerses = Object.keys(p.verses).filter(v => p.verses[v] >= LOST_THRESHOLD);
      if (knownVerses.length > 0) {
        msgs.push(`  ${p.name} has died. They carried: ${knownVerses.map(v => VERSES[v]?.name || v).join(', ')}`);
        for (const v of knownVerses) {
          const others = state.people.filter(o => o !== p && o.verses[v] && o.verses[v] >= LOST_THRESHOLD);
          if (others.length === 0) {
            msgs.push(`    !! "${VERSES[v]?.name || v}" DIES WITH THEM — no one else knows it !!`);
          }
        }
      } else {
        msgs.push(`  ${p.name} has died.`);
      }
    }
  }
  state.people = state.people.filter(p => ageCategory(p) !== 'dead');

  // ── Blood drift ──
  const dominantPeopleKey = AGE_DEFAULT_PEOPLE[state.ageKey] || 'human';
  const dominantBloods = (PEOPLE_BLOOD[dominantPeopleKey]?.primary) || ['song_blood'];
  for (const p of state.people) {
    driftBlood(p, dominantBloods);
  }

  // ── The Setlist ──
  manageSetlist(state, msgs);

  // ── Absorption ──
  absorbFromSetlist(state, msgs);

  // ── Shadow accumulation ──
  accumulateShadows(state, msgs);

  // ── Redemption discovery ──
  discoverRedemptions(state, msgs);

  // ── Adjacency discovery ──
  discoverAdjacent(state, msgs);

  // ── Blood memory ──
  bloodMemory(state, msgs);

  // ── Births — spring and summer ──
  if (state.season <= 1) {
    const adults = state.people.filter(p => ['adult', 'elder'].includes(ageCategory(p)));
    if (adults.length >= 2 && state.people.length < 15 && state.food >= 3) {
      const hasBears = state.people.some(p => p.people === 'bear');
      const names = hasBears ? BEAR_NAMES : DEFAULT_NAMES;
      const usedNames = state.people.map(p => p.name);
      const available = names.filter(n => !usedNames.includes(n));

      if (available.length > 0) {
        const name = available[Math.floor(Math.random() * available.length)];
        const parent1 = adults[Math.floor(Math.random() * adults.length)];
        const parent2 = adults[Math.floor(Math.random() * adults.length)];
        const childBlood = mixBlood(parent1, parent2);

        const sinkBoost = songSinkBlood(parent1, parent2);
        const sunkSongs: string[] = [];
        for (const [bv, amount] of Object.entries(sinkBoost)) {
          childBlood[bv] = Math.min(1.0, (childBlood[bv] || 0) + amount);
          if (amount >= SONG_SINK_AMOUNT * 0.5) {
            sunkSongs.push(BLOOD_VERSES[bv]?.name || bv);
          }
        }

        const childPeople = identifyPeople({ blood: childBlood }, state.ageKey);
        const child: Person = { name, age: 0, people: childPeople, blood: childBlood, verses: {} };
        state.people.push(child);

        const significantBloods = Object.entries(childBlood).filter(([, v]) => v >= 0.15);
        if (sunkSongs.length > 0) {
          msgs.push(`  A child is born: ${name} — the songs sink into the blood (${sunkSongs.join(', ')})`);
        } else if (significantBloods.length > 2) {
          msgs.push(`  A child is born: ${name} (${bloodReading(child)})`);
        } else {
          msgs.push(`  A child is born: ${name}`);
        }
      }
    }
  }

  // ── Food ──
  const mouths = state.people.length;
  let gather = 0;
  if (state.season === 0) gather = 3;
  if (state.season === 1) gather = 5;
  if (state.season === 2) gather = 4;
  if (state.season === 3) gather = 1;

  gather = Math.floor(gather * state.sunlight);

  const bandKnows = (v: string) => state.people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
  for (const [id, v] of Object.entries(VERSES)) {
    if (v.effects?.food && bandKnows(id)) gather += v.effects.food;
  }

  state.food += gather - mouths;
  if (state.food < 0) {
    msgs.push(`  !! STARVATION — not enough food !!`);
    state.people.sort((a, b) => a.age - b.age);
    const lost = state.people.shift();
    if (lost) msgs.push(`  ${lost.name} has starved.`);
    state.food = 0;
  }
  msgs.push(`  Food: ${state.food} (gathered ${gather}, fed ${mouths})`);

  // ── Tree shadow ──
  if (state.tree.height >= SUN_BLOCKED_THRESHOLD) {
    const blockage = (state.tree.height - SUN_BLOCKED_THRESHOLD) / (SUN_DEAD_THRESHOLD - SUN_BLOCKED_THRESHOLD);
    state.sunlight = Math.max(0.1, 1.0 - blockage);
    if (state.sunlight < 0.5) {
      msgs.push(`  The Tree's shadow covers the world. Sunlight: ${Math.round(state.sunlight * 100)}%`);
    }
  } else {
    state.sunlight = 1.0;
  }

  // ── Spirits ──
  if (!state.spirits) {
    state.spirits = Object.fromEntries(
      Object.entries(SPIRITS).map(([key, def]) => [key, { spirit: 1.0, danger: def.baseDanger }])
    );
  }
  for (const [key, def] of Object.entries(SPIRITS)) {
    if (!state.spirits[key]) state.spirits[key] = { spirit: 1.0, danger: def.baseDanger };
  }

  for (const [spiritKey, spiritDef] of Object.entries(SPIRITS)) {
    const ss = state.spirits[spiritKey];
    if (!ss) continue;

    // Song quality — primary songId, fallback, plus any songs with spiritDefense effects
    const songQuality = (() => {
      let best = 0;
      for (const p of state.people) {
        if (p.verses[spiritDef.songId] && p.verses[spiritDef.songId] > best) {
          best = p.verses[spiritDef.songId];
        }
      }
      if (spiritDef.fallbackSongId && best < GARBLE_THRESHOLD) {
        for (const p of state.people) {
          if (p.verses[spiritDef.fallbackSongId] && p.verses[spiritDef.fallbackSongId] * 0.5 > best) {
            best = p.verses[spiritDef.fallbackSongId] * 0.5;
          }
        }
      }
      // Generic spiritDefense from effects — any song with defense for this spirit
      for (const [id, v] of Object.entries(VERSES)) {
        const defFactor = v.effects?.spiritDefense?.[spiritKey];
        if (!defFactor) continue;
        for (const p of state.people) {
          if (p.verses[id] && p.verses[id] * defFactor > best) {
            best = p.verses[id] * defFactor;
          }
        }
      }
      if (best < LOST_THRESHOLD && state.tree.carved.includes(spiritDef.songId)) {
        return -0.2;
      }
      return best;
    })();

    // Spirit drifts
    if (songQuality > GARBLE_THRESHOLD) {
      ss.spirit = Math.min(1.0, ss.spirit + 0.05 * songQuality);
    } else if (songQuality < 0) {
      ss.spirit = Math.max(0, ss.spirit - 0.1);
    } else {
      ss.spirit = Math.max(0, ss.spirit - 0.03);
    }

    ss.danger = spiritDef.baseDanger + (state.fellings * spiritDef.dangerPerFelling);

    // Fire special
    if (spiritDef.stolenSpirit) {
      const fireSongs = ['ember', 'spark', 'deep_fire', 'forge'];
      let stolenDanger = 0;
      for (const p of state.people) {
        for (const fs of fireSongs) {
          const v = p.verses[fs] || 0;
          if (v > LOST_THRESHOLD && v < GARBLE_THRESHOLD) {
            stolenDanger += 0.03;
          }
        }
      }
      ss.danger += stolenDanger;
    }

    // Spirit danger from songs (replaces hardcoded metalAnger checks)
    for (const [id, v] of Object.entries(VERSES)) {
      if (v.effects?.spiritDanger?.[spiritKey] && bandKnows(id)) {
        ss.danger += v.effects.spiritDanger[spiritKey];
      }
    }
    if (spiritDef.metalAnger) {
      if (state.people.some(p => bloodLevel(p, 'thin_air_blood') > 0.3)) ss.danger += 0.02;
    }

    // Yeast special
    if (spiritDef.invisibleSpirit) {
      const knownYeast = Object.keys(VERSES).filter(id => VERSES[id].effects?.yeastSong && bandKnows(id));
      if (knownYeast.length > 0) {
        ss.spirit = Math.min(1.0, ss.spirit + 0.05 * knownYeast.length);
        ss.danger = 0;

        const surplus = knownYeast.length * (spiritDef.surplusPerSong || 2);
        state.food += surplus;
        msgs.push(`  The invisible one stirs. The bread rises. The beer foams. (+${surplus} food)`);
        if (knownYeast.includes('sourdough')) {
          msgs.push(`  The mother lives. She is older than anyone in the band.`);
        }

        // Population pressure
        const foodPerPerson = state.food / Math.max(1, state.people.length);
        if (foodPerPerson > 4 && Math.random() < 0.25) {
          const yAdults = state.people.filter(p => ageCategory(p) === 'adult');
          if (yAdults.length >= 2) {
            const parent1 = yAdults[Math.floor(Math.random() * yAdults.length)];
            const remaining = yAdults.filter(a => a !== parent1);
            const parent2 = remaining[Math.floor(Math.random() * remaining.length)];
            if (parent2) {
              const name = YEAST_NAMES[Math.floor(Math.random() * YEAST_NAMES.length)];
              const childBlood: Record<string, number> = {};
              const b1 = getBlood(parent1);
              const b2 = getBlood(parent2);
              for (const bv of new Set([...Object.keys(b1), ...Object.keys(b2)])) {
                childBlood[bv] = ((b1[bv] || 0) + (b2[bv] || 0)) / 2;
              }
              const sinkBoost = songSinkBlood(parent1, parent2);
              for (const [bv, amount] of Object.entries(sinkBoost)) {
                childBlood[bv] = (childBlood[bv] || 0) + amount;
              }
              const childPeople = identifyPeople({ blood: childBlood }, state.ageKey);
              const child: Person = { name, age: 0, people: childPeople, blood: childBlood, verses: {} };
              state.people.push(child);
              msgs.push(`  The surplus feeds another mouth. ${name} is born.`);
            }
          }
        }
      }
      continue; // yeast doesn't do the normal attack path
    }

    const effectiveDanger = ss.danger * (1 - ss.spirit * spiritDef.songProtection);

    // Attacks
    if (spiritDef.seasons.includes(state.season) && Math.random() < effectiveDanger) {

      // Night: the singing dark
      if (spiritDef.singingDark) {
        state.food = Math.max(0, state.food - spiritDef.attackFoodLoss);
        const hasStars = Object.keys(VERSES).some(id => VERSES[id].effects?.starSong && bandKnows(id));
        if (hasStars) {
          msgs.push(`  The long dark comes. The stars are out. The elders sing.`);
          const boost = spiritDef.songBoost || 0.04;
          for (const p of state.people) {
            for (const v of Object.keys(p.verses)) {
              if (p.verses[v] >= LOST_THRESHOLD && p.verses[v] < 1.0) {
                p.verses[v] = Math.min(1.0, p.verses[v] + boost);
              }
            }
          }
          msgs.push(`  All songs strengthen under the stars. (+${Math.round((spiritDef.songBoost || 0.04) * 100)}%)`);
        } else {
          msgs.push(`  !! The long dark. No stars to sing by. ${spiritDef.attackFoodLoss} food lost to the cold. !!`);
          msgs.push(`  Without stars, the community can't gather. Fewer songs next season.`);
          state.nightPenalty = (state.nightPenalty || 0) + 2;
        }
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const victim = state.people[Math.floor(Math.random() * state.people.length)];
          if (victim) {
            msgs.push(`  !! ${victim.name} is lost in the dark. They don't come back. !!`);
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }

      // Death: comes for the elders
      } else if (spiritDef.eldersFirst) {
        msgs.push(`  !! Death visits the camp. !!`);
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const elders = state.people.filter(p => ageCategory(p) === 'elder');
          const dAdults = state.people.filter(p => ageCategory(p) === 'adult');
          const targets = elders.length > 0 ? elders : dAdults;
          if (targets.length > 0) {
            const victim = targets[Math.floor(Math.random() * targets.length)];
            if (spiritDef.deathTeaching && songQuality >= GARBLE_THRESHOLD) {
              const youth = state.people.filter(p => ageCategory(p) === 'youth');
              if (youth.length > 0) {
                const heir = youth[Math.floor(Math.random() * youth.length)];
                const passed: string[] = [];
                for (const [v, integrity] of Object.entries(victim.verses)) {
                  if (integrity >= GARBLE_THRESHOLD) {
                    heir.verses[v] = Math.max(heir.verses[v] || 0, integrity * 0.7);
                    passed.push(VERSES[v]?.name || v);
                  }
                }
                if (passed.length > 0) {
                  msgs.push(`  ${victim.name} sings one last time. ${heir.name} listens.`);
                  msgs.push(`    Passed on: ${passed.join(', ')}`);
                }
              }
            }
            msgs.push(`  !! ${victim.name} dies. They carried songs no one else knew. !!`);
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }

      // Fire: burns food AND the tree
      } else if (spiritDef.stolenSpirit) {
        state.food = Math.max(0, state.food - spiritDef.attackFoodLoss);
        msgs.push(`  !! Fire in the camp — ${spiritDef.attackFoodLoss} food lost !!`);
        if (spiritDef.treeBurnChance && state.tree.carved.length > 0 && Math.random() < spiritDef.treeBurnChance) {
          const burnIdx = Math.floor(Math.random() * state.tree.carved.length);
          const burned = state.tree.carved.splice(burnIdx, 1)[0];
          state.tree.height = Math.max(0, state.tree.height - TREE_GROWTH_PER_VERSE);
          msgs.push(`  !! The fire reaches the Tree. "${VERSES[burned]?.name || burned}" burns away. !!`);
        }
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const victim = state.people[Math.floor(Math.random() * state.people.length)];
          if (victim) {
            msgs.push(`  !! ${victim.name} is burned. The stolen fire takes what it wants. !!`);
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }
        if (spiritDef.fireStarter && state.spirits.fire) {
          state.spirits.fire.danger += 0.03;
          msgs.push(`  Lightning strikes. The fire spirit stirs.`);
        }

      // Sky: storms, lightning
      } else if (spiritDef.fireStarter) {
        state.food = Math.max(0, state.food - spiritDef.attackFoodLoss);
        msgs.push(`  !! Thunder. The sky opens. ${spiritDef.attackFoodLoss} food lost to the storm. !!`);
        if (state.spirits.fire) {
          state.spirits.fire.danger += 0.03;
        }
        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const victim = state.people[Math.floor(Math.random() * state.people.length)];
          if (victim) {
            msgs.push(`  !! Lightning takes ${victim.name}. The sky gives fire and takes life in the same gesture. !!`);
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }

      // Animal spirit attack
      } else {
        state.food = Math.max(0, state.food - spiritDef.attackFoodLoss);
        msgs.push(`  !! The ${spiritDef.name.toLowerCase()}s raid the camp — ${spiritDef.attackFoodLoss} food lost !!`);

        if (ss.spirit < 0.3 && Math.random() < spiritDef.killChance) {
          const allergicYouth = state.people.filter(p =>
            isAllergicTo(p, spiritKey, SPIRITS) && ageCategory(p) === 'youth'
          );
          const allergicAdults = state.people.filter(p =>
            isAllergicTo(p, spiritKey, SPIRITS) && ['adult', 'elder'].includes(ageCategory(p))
          );
          const nonAllergic = state.people.filter(p =>
            !isAllergicTo(p, spiritKey, SPIRITS) && ageCategory(p) !== 'dead'
          );

          let victim: Person | null = null;

          if (allergicYouth.length > 0 && Math.random() < (spiritDef.killChance + spiritDef.allergyKillBonus)) {
            victim = allergicYouth[Math.floor(Math.random() * allergicYouth.length)];
            const label = PEOPLES[identifyPeople(victim, state.ageKey)]?.name || 'unknown';
            msgs.push(`  !! ${victim.name} the ${label} youth is killed by a ${spiritDef.name.toLowerCase()} !!`);
            msgs.push(`     ${spiritDef.allergyDesc}`);
          } else if (allergicAdults.length > 0 && Math.random() > spiritDef.allergyWarning) {
            victim = allergicAdults[Math.floor(Math.random() * allergicAdults.length)];
            const label = PEOPLES[identifyPeople(victim, state.ageKey)]?.name || 'unknown';
            msgs.push(`  !! ${victim.name} the ${label} sensed the ${spiritDef.name.toLowerCase()} but too late !!`);
          } else if (nonAllergic.length > 0) {
            victim = nonAllergic[Math.floor(Math.random() * nonAllergic.length)];
            msgs.push(`  !! ${victim.name} is killed by a ${spiritDef.name.toLowerCase()} !!`);
          }

          if (victim) {
            const idx = state.people.indexOf(victim);
            if (idx >= 0) state.people.splice(idx, 1);
          }
        }
      }

      if (ss.spirit < 0.5) {
        const songName = VERSES[spiritDef.songId]?.name || spiritDef.songId;
        if (spiritDef.kind === 'great') {
          msgs.push(`  The ${spiritDef.name} is restless. Spirit: ${Math.round(ss.spirit * 100)}%`);
        } else {
          msgs.push(`  The ${spiritDef.name.toLowerCase()}s are angry. Spirit: ${Math.round(ss.spirit * 100)}%`);
        }
        msgs.push(`  Someone must sing "${songName}" to mend the relationship.`);
      }
    }
  }

  // ── The Dog — wolf spirit in the camp ──
  const bandKnowsDog = Object.keys(VERSES).some(id => VERSES[id].effects?.dogPresence && bandKnows(id));
  if (bandKnowsDog) {
    for (const p of state.people) {
      const wolfAllergy = allergyStrength(p, 'wolf');
      if (wolfAllergy >= BLOOD_ALLERGY_THRESHOLD) {
        if (Math.random() < wolfAllergy * 0.08) {
          const label = PEOPLES[identifyPeople(p, state.ageKey)]?.name || 'stranger';
          const knownVerses = Object.keys(p.verses).filter(v => p.verses[v] >= LOST_THRESHOLD);
          msgs.push(`  ${p.name} the ${label} cannot bear the dog any longer. They leave for the deep places.`);
          if (knownVerses.length > 0) {
            const lastSongs = knownVerses.map(v => VERSES[v]?.name || v).join(', ');
            msgs.push(`    They take with them: ${lastSongs}`);
          }
          const idx = state.people.indexOf(p);
          if (idx >= 0) state.people.splice(idx, 1);
        }
      }
    }
  }

  // ── Random encounter (15% in summer/autumn) ──
  const currentAge = AGES[state.ageKey] || AGES.stone;
  const availablePeoples = currentAge.encounter_peoples || ['human'];

  if ((state.season === 1 || state.season === 2) && Math.random() < 0.15 && !state.encounter) {
    const namesByPeople: Record<string, string[]> = {
      troll:    ['Hrungnir', 'Geirrod', 'Ymir-kin', 'Bergelmir'],
      dwarf:    ['Durin', 'Andvari', 'Alviss', 'Dvalin', 'Sindri', 'Brokk'],
      elf:      ['Luthien', 'Thingol', 'Nienna', 'Varda', 'Ilmare'],
      halfling: ['Ebu', 'Liang', 'Flores', 'Mata'],
      human:    ['Pohjan Akka', 'Tiera', 'Iku-Turso', 'Surma', 'Kiputyttö',
                'Elias', 'Akseli', 'Minna', 'Johan', 'Kristina'],
    };
    const versePoolByPeople: Record<string, string[]> = {
      troll:    ['heartbeat', 'stone_sleep', 'deep_fire', 'old_track',
                 'bone_drum', 'night_watch', 'fire_tend', 'ground_sense',
                 'howl_back', 'stone_hide', 'death_drum', 'sky_stare'],
      dwarf:    ['flake', 'blade', 'ember', 'cave_song', 'bear', 'wolf_song', 'ochre', 'burial'],
      elf:      ['thin_air', 'far_sight', 'ghost_walk', 'jade', 'loom'],
      halfling: ['island', 'small_hunt', 'tide', 'feast', 'shelter'],
      human:    Object.keys(VERSES).filter(v => VERSES[v].people === 'human'),
    };

    const strangePeople = availablePeoples[Math.floor(Math.random() * availablePeoples.length)];
    const strangerNames = namesByPeople[strangePeople] || namesByPeople.human;
    const strangerVersePool = versePoolByPeople[strangePeople] || versePoolByPeople.human;

    const strangerVerses: Record<string, number> = {};
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const v = strangerVersePool[Math.floor(Math.random() * strangerVersePool.length)];
      strangerVerses[v] = 0.5 + Math.random() * 0.5;
    }

    const name = strangerNames[Math.floor(Math.random() * strangerNames.length)];
    const peopleLabel = PEOPLES[strangePeople]?.name || strangePeople;
    const strangerAge = strangePeople === 'troll' ? 20 + Math.floor(Math.random() * 4) :
           strangePeople === 'elf' ? 12 + Math.floor(Math.random() * 10) :
           8 + Math.floor(Math.random() * 12);
    state.encounter = makePerson(name, strangerAge, strangePeople, strangerVerses);
    const verseList = Object.keys(strangerVerses).map(v => VERSES[v]?.name || v).join(', ');
    msgs.push(`  A ${peopleLabel} approaches: ${name}. ${PEOPLES[strangePeople]?.trait || ''}`);
    msgs.push(`  They seem to know: ${verseList}`);
    msgs.push(`  (Use: node song.ts welcome | node song.ts ignore)`);
  }

  // ── Collapse check ──
  if (state.people.length === 0) {
    msgs.push('');
    msgs.push('  !! THE BAND IS GONE. The songs fall silent. !!');
    msgs.push('  !! But somewhere, someone remembers a fragment... !!');
    msgs.push('  (Use: node song.ts cross to find a bridge)');
    state.collapsed = true;
  } else if (state.sunlight <= 0.1 && state.food <= 0) {
    msgs.push('');
    msgs.push('  !! The Tree has killed the sun. The world is dying. !!');
    msgs.push('  !! Fell the Tree — or cross a bridge to another age. !!');
    msgs.push('  (Use: node song.ts fell | node song.ts cross)');
  }

  // ── Advance time ──
  state.season = (state.season + 1) % 4;
  if (state.season === 0) {
    state.year += 1;
    state.yearsBP -= 1;
  }

  return msgs;
}
