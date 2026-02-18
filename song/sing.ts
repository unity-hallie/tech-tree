// sing.ts — how songs move. Transmission, absorption, discovery.
// The setlist is what the community sings each season.
// Youth absorb from the setlist by being present.
// Songs not on the setlist are not transmitted.
// One generation of silence = lost.

import { VERSES, GARBLE_THRESHOLD, LOST_THRESHOLD, LEARN_RATE_FOCUSED, WRITING_INTEGRITY } from './tree/index.ts';
import { BLOOD_VERSES, SONG_BLOODS, SONG_SINK_AMOUNT } from './tree/index.ts';
import { type Person, ageCategory, teachingPower, bloodEases } from './singer.ts';
import { type GameState } from './ground.ts';

// ── The Setlist ────────────────────────────────────────────────────
// Capacity depends on band size: more people = more fires = more songs.
// Order matters: early songs transmit better to youth.

export function setlistCapacity(people: Person[], state?: GameState): number {
  const singers = people.filter(p => ageCategory(p) !== 'youth').length;
  if (singers <= 0) return 0;
  let cap = Math.floor(Math.log2(singers) * 2) + 1;
  if (state) {
    const knows = (v: string) => people.some(p => p.verses[v] && p.verses[v] >= GARBLE_THRESHOLD);
    if (knows('rune')) cap += 2;
    if (knows('ledger')) cap += 1;
  }
  return cap;
}

// Position factor: how well a song at position i transmits to youth
export function positionFactor(position: number, totalSlots: number): number {
  if (totalSlots <= 1) return 0.90;
  return 0.95 - (position / (totalSlots - 1)) * 0.40;
}

// ── Absorption — youth learn from the setlist ───────────────────────
// Legitimate peripheral participation. The youth sitting at the edge
// of the firelight hears the song 200 times before they ever sing it.

export function absorbFromSetlist(state: GameState, msgs: string[]): void {
  const youth = state.people.filter(p => ageCategory(p) === 'youth');
  const hasLiterate = state.people.some(p =>
    ageCategory(p) !== 'youth' && p.verses['writing'] && p.verses['writing'] >= GARBLE_THRESHOLD
  );

  for (const student of youth) {
    const eased = bloodEases(student);

    for (let i = 0; i < state.setlist.length; i++) {
      const v = state.setlist[i];
      const verse = VERSES[v];
      if (!verse) continue;

      const hasPrereqs = verse.prereqs.every(pr =>
        student.verses[pr] && student.verses[pr] >= GARBLE_THRESHOLD
      );
      if (!hasPrereqs && verse.prereqs.length > 0) continue;

      // Find best teacher
      let bestTeacherIntegrity = 0;
      const isCarved = state.tree.carved.includes(v);
      for (const p of state.people) {
        if (ageCategory(p) === 'youth') continue;
        if (p.verses[v] && p.verses[v] > bestTeacherIntegrity) {
          bestTeacherIntegrity = p.verses[v];
        }
        if (isCarved && p.verses['writing'] && p.verses['writing'] >= GARBLE_THRESHOLD) {
          if (WRITING_INTEGRITY > bestTeacherIntegrity) {
            bestTeacherIntegrity = WRITING_INTEGRITY;
          }
        }
      }
      if (bestTeacherIntegrity < LOST_THRESHOLD) continue;

      const posFactor = positionFactor(i, state.setlist.length);
      const bloodBonus = eased[v] || 0;
      const reps = state.setlistHistory[v] || 1;
      const repBonus = Math.min(0.1, (reps - 1) * 0.02);

      const absorption = bestTeacherIntegrity * (posFactor + repBonus) * (1 + bloodBonus * 0.5);
      const absorbed = Math.min(bestTeacherIntegrity, absorption);

      const current = student.verses[v] || 0;
      if (absorbed > current) {
        const gain = (absorbed - current) * 0.3;
        student.verses[v] = current + gain;
      }
    }
  }
}

// ── Shadow accumulation ─────────────────────────────────────────────
// Songs sung without roots cast shadows.

export function accumulateShadows(state: GameState, msgs: string[]): void {
  if (!state.shadows) state.shadows = {};
  for (const [shadowId, shadowDef] of Object.entries(VERSES)) {
    if (!shadowDef.shadow_of) continue;
    if (state.people.some(p => p.verses[shadowId] && p.verses[shadowId] >= GARBLE_THRESHOLD)) continue;

    const lightOnSetlist = state.setlist.includes(shadowDef.shadow_of);
    const lightKnown = state.people.some(p =>
      p.verses[shadowDef.shadow_of!] && p.verses[shadowDef.shadow_of!] >= GARBLE_THRESHOLD
    );
    if (!lightOnSetlist && !lightKnown) continue;

    const foundationPresent = state.setlist.includes(shadowDef.shadow_when!) ||
      state.tree.carved.includes(shadowDef.shadow_when!) ||
      state.people.some(p => p.verses[shadowDef.shadow_when!] && p.verses[shadowDef.shadow_when!] >= GARBLE_THRESHOLD);
    if (foundationPresent) {
      state.shadows[shadowId] = Math.max(0, (state.shadows[shadowId] || 0) - 0.05);
      continue;
    }

    state.shadows[shadowId] = (state.shadows[shadowId] || 0) + (shadowDef.shadow_rate || 0);
    if (state.shadows[shadowId] >= 1.0) {
      let bestSinger: Person | null = null;
      let bestLight = 0;
      for (const p of state.people) {
        if (ageCategory(p) === 'youth') continue;
        const v = p.verses[shadowDef.shadow_of!] || 0;
        if (v > bestLight) { bestSinger = p; bestLight = v; }
      }
      if (bestSinger) {
        bestSinger.verses[shadowId] = bestLight * 0.8;
        msgs.push(`  A shadow falls. ${bestSinger.name} now knows "${shadowDef.name}".`);
        msgs.push(`    ${shadowDef.desc}`);
        state.shadows[shadowId] = 0;
      }
    } else if (state.shadows[shadowId] > 0.5) {
      msgs.push(`  The shadow of "${shadowDef.name}" grows... (${Math.round(state.shadows[shadowId] * 100)}%)`);
    }
  }
}

// ── Redemption discovery ────────────────────────────────────────────
// Shadow meets its missing root.

export function discoverRedemptions(state: GameState, msgs: string[]): void {
  for (const [shadowId, shadowDef] of Object.entries(VERSES)) {
    if (!shadowDef.redeems_with || !shadowDef.redeems_into) continue;
    const redemptionId = shadowDef.redeems_into;
    if (state.people.some(p => p.verses[redemptionId] && p.verses[redemptionId] >= GARBLE_THRESHOLD)) continue;

    const shadowKnown = state.people.some(p =>
      p.verses[shadowId] && p.verses[shadowId] >= GARBLE_THRESHOLD
    );
    const rootKnown = state.people.some(p =>
      p.verses[shadowDef.redeems_with!] && p.verses[shadowDef.redeems_with!] >= GARBLE_THRESHOLD
    );
    if (!shadowKnown || !rootKnown) continue;

    const bothOnSetlist = state.setlist.includes(shadowId) && state.setlist.includes(shadowDef.redeems_with!);
    if (!bothOnSetlist) continue;

    if (Math.random() < 0.08) {
      let redeemer: Person | null = null;
      let bestScore = 0;
      for (const p of state.people) {
        if (ageCategory(p) === 'youth') continue;
        const s = (p.verses[shadowId] || 0) + (p.verses[shadowDef.redeems_with!] || 0);
        if (s > bestScore) { redeemer = p; bestScore = s; }
      }
      if (redeemer) {
        redeemer.verses[redemptionId] = bestScore * 0.4;
        const rVerse = VERSES[redemptionId];
        msgs.push(`  !! "${rVerse?.name || redemptionId}" emerges — shadow meets its root. !!`);
        msgs.push(`    ${rVerse?.desc || ''}`);
      }
    }
  }
}

// ── Adjacency discovery ─────────────────────────────────────────────
// Two prerequisite songs adjacent on the setlist → the combination emerges.
// This is how between-songs happen.

export function discoverAdjacent(state: GameState, msgs: string[]): void {
  for (let i = 0; i < state.setlist.length - 1; i++) {
    const v1 = state.setlist[i];
    const v2 = state.setlist[i + 1];
    for (const [songId, verse] of Object.entries(VERSES)) {
      if (verse.tradition !== 'between' && verse.tradition !== 'ash') continue;
      if (verse.prereqs.length < 2) continue;
      const prereqSet = new Set(verse.prereqs);
      if (prereqSet.has(v1) && prereqSet.has(v2)) {
        const hasBoth = state.people.some(p =>
          ageCategory(p) !== 'youth' &&
          p.verses[v1] && p.verses[v1] >= GARBLE_THRESHOLD &&
          p.verses[v2] && p.verses[v2] >= GARBLE_THRESHOLD
        );
        if (!hasBoth) continue;
        const allPrereqs = verse.prereqs.every(pr =>
          state.people.some(p => p.verses[pr] && p.verses[pr] >= GARBLE_THRESHOLD)
        );
        if (!allPrereqs) continue;
        const alreadyKnown = state.people.some(p => p.verses[songId] && p.verses[songId] >= GARBLE_THRESHOLD);
        if (alreadyKnown) continue;

        const reps = Math.min(state.setlistHistory[v1] || 0, state.setlistHistory[v2] || 0);
        const chance = 0.05 + reps * 0.03;
        if (Math.random() < chance) {
          let discoverer: Person | null = null;
          let bestScore = 0;
          for (const p of state.people) {
            if (ageCategory(p) === 'youth') continue;
            const score = (p.verses[v1] || 0) + (p.verses[v2] || 0);
            if (score > bestScore) { bestScore = score; discoverer = p; }
          }
          if (discoverer) {
            const integrity = Math.min(discoverer.verses[v1] || 0, discoverer.verses[v2] || 0) * 0.7;
            discoverer.verses[songId] = integrity;
            msgs.push(`  ★ ${discoverer.name} sings "${VERSES[v1]?.name}" into "${VERSES[v2]?.name}" and hears something new:`);
            msgs.push(`    "${verse.name}" emerges — ${verse.desc}`);
            msgs.push(`    (${Math.round(integrity * 100)}% integrity — it's new, still forming)`);
          }
        }
      }
    }
  }
}

// ── Blood memory ────────────────────────────────────────────────────
// Each season, a small chance a person spontaneously "remembers"
// a fragment of a song their blood eases.

export function bloodMemory(state: GameState, msgs: string[]): void {
  for (const p of state.people) {
    if (ageCategory(p) === 'youth') continue;
    const eased = bloodEases(p);
    for (const [songId, bLevel] of Object.entries(eased)) {
      if (!VERSES[songId]) continue;
      if (p.verses[songId] && p.verses[songId] >= GARBLE_THRESHOLD) continue;
      const verse = VERSES[songId];
      const hasPrereqs = verse.prereqs.every(pr =>
        p.verses[pr] && p.verses[pr] >= LOST_THRESHOLD
      );
      if (!hasPrereqs && verse.prereqs.length > 0) continue;
      if (Math.random() < bLevel * 0.02) {
        const current = p.verses[songId] || 0;
        const remembered = Math.min(GARBLE_THRESHOLD - 0.01, current + 0.1);
        p.verses[songId] = remembered;
        msgs.push(`  ${p.name}'s blood remembers: "${VERSES[songId].name}" (${Math.round(remembered * 100)}% — garbled, from the blood)`);
      }
    }
  }
}

// ── Manage the setlist for the season ───────────────────────────────

export function manageSetlist(state: GameState, msgs: string[]): void {
  if (!state.setlist) state.setlist = [];
  if (!state.setlistHistory) state.setlistHistory = {};
  let capacity = setlistCapacity(state.people, state);

  // Night penalty
  if (state.nightPenalty && state.nightPenalty > 0) {
    capacity = Math.max(1, capacity - state.nightPenalty);
    state.nightPenalty = 0;
  }

  const hasLiterate = state.people.some(p =>
    ageCategory(p) !== 'youth' && p.verses['writing'] && p.verses['writing'] >= GARBLE_THRESHOLD
  );

  // Clean: remove songs nobody can sing
  state.setlist = state.setlist.filter(v =>
    state.people.some(p => p.verses[v] && p.verses[v] >= LOST_THRESHOLD) ||
    (hasLiterate && state.tree.carved.includes(v))
  );

  // Auto-fill
  if (state.setlist.length < capacity) {
    const allKnown: Record<string, number> = {};
    for (const p of state.people) {
      if (ageCategory(p) === 'youth') continue;
      for (const [v, integrity] of Object.entries(p.verses)) {
        if (integrity >= LOST_THRESHOLD) {
          allKnown[v] = Math.max(allKnown[v] || 0, integrity);
        }
      }
    }
    if (hasLiterate) {
      for (const cv of state.tree.carved) {
        if (!allKnown[cv] || allKnown[cv] < WRITING_INTEGRITY) {
          allKnown[cv] = WRITING_INTEGRITY;
        }
      }
    }
    const candidates = Object.entries(allKnown)
      .filter(([v]) => !state.setlist.includes(v))
      .sort((a, b) => b[1] - a[1]);
    for (const [v] of candidates) {
      if (state.setlist.length >= capacity) break;
      state.setlist.push(v);
    }
  }

  // Trim
  while (state.setlist.length > capacity) state.setlist.pop();

  // Update repetition history
  const newHistory: Record<string, number> = {};
  for (const v of state.setlist) {
    newHistory[v] = (state.setlistHistory[v] || 0) + 1;
  }
  state.setlistHistory = newHistory;

  // Display the setlist
  if (state.setlist.length > 0) {
    msgs.push(`  The song tonight (${state.setlist.length}/${capacity} slots):`);
    state.setlist.forEach((v, i) => {
      const isCarved = state.tree.carved.includes(v);
      let bestSinger: Person | null = null;
      let bestIntegrity = 0;
      let isReading = false;
      for (const p of state.people) {
        if (ageCategory(p) === 'youth') continue;
        const known = p.verses[v] || 0;
        if (known > bestIntegrity) { bestSinger = p; bestIntegrity = known; isReading = false; }
      }
      if (bestIntegrity < WRITING_INTEGRITY && isCarved && hasLiterate) {
        const reader = state.people.find(p =>
          ageCategory(p) !== 'youth' && p.verses['writing'] && p.verses['writing'] >= GARBLE_THRESHOLD
        );
        if (reader) { bestSinger = reader; bestIntegrity = WRITING_INTEGRITY; isReading = true; }
      }
      const reps = state.setlistHistory[v] || 0;
      const repStr = reps > 1 ? ` (${reps} seasons)` : '';
      const verb = isReading ? 'reads' : 'sings';
      msgs.push(`    ${i + 1}. ${VERSES[v]?.name || v} — ${bestSinger?.name || '?'} ${verb} at ${Math.round(bestIntegrity * 100)}%${repStr}`);
    });
  }
}
