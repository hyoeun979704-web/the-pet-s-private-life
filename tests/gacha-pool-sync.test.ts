/* eslint-disable import/no-relative-packages */
import { describe, it, expect } from 'vitest';
import charactersData from '@/data/characters.json';
import { GACHA_POOL } from '../functions/src/shared/gachaPool';
/* eslint-enable import/no-relative-packages */

type CharacterRow = { id: string; grade: 'normal' | 'rare' | 'legendary' };

const rows = charactersData.characters as unknown as CharacterRow[];

describe('gacha-pool-sync: client characters.json vs functions/shared', () => {
  it('every pool id exists in the client catalog', () => {
    const known = new Set(rows.map((r) => r.id));
    (['normal', 'rare', 'legendary'] as const).forEach((grade) => {
      GACHA_POOL[grade].forEach((id) => {
        expect(known.has(id), `pool id ${id} not in characters.json`).toBe(true);
      });
    });
  });

  it('every pool entry has the matching grade in the client catalog', () => {
    const byId = new Map(rows.map((r) => [r.id, r.grade]));
    (['normal', 'rare', 'legendary'] as const).forEach((grade) => {
      GACHA_POOL[grade].forEach((id) => {
        expect(byId.get(id)).toBe(grade);
      });
    });
  });

  it('every rare/legendary client character is reachable in the pool', () => {
    // normals are intentionally NOT all in the pool (MVP tunes drop table).
    // But rare + legendary MUST be fully accessible or users can't complete the dex.
    const pooledRare = new Set(GACHA_POOL.rare);
    const pooledLeg = new Set(GACHA_POOL.legendary);
    rows.forEach((r) => {
      if (r.grade === 'rare') expect(pooledRare.has(r.id), `rare ${r.id}`).toBe(true);
      if (r.grade === 'legendary') expect(pooledLeg.has(r.id), `legendary ${r.id}`).toBe(true);
    });
  });
});
