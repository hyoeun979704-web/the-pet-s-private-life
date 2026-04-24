import { describe, it, expect } from 'vitest';
import type { FurnitureDef, PlacedFurniture } from '@/entities/Furniture';
import { cozyScore, GRADE_COZY_MULTIPLIER } from '@/utils/CozyScore';

const defs: FurnitureDef[] = [
  { id: 'rug',  nameKey: 'x', category: 'floor', grade: 'normal',    footprintW: 1, footprintH: 1, cozyScore: 4, colorHex: '#FFC8DD' },
  { id: 'lamp', nameKey: 'x', category: 'decor', grade: 'rare',      footprintW: 1, footprintH: 1, cozyScore: 6, colorHex: '#A0C4FF' },
  { id: 'tree', nameKey: 'x', category: 'decor', grade: 'legendary', footprintW: 2, footprintH: 2, cozyScore: 10, colorHex: '#FFADAD' },
];

function place(defId: string): PlacedFurniture {
  return { instanceId: `i_${defId}`, defId, gx: 0, gy: 0, rotation: 0 };
}

describe('CozyScore', () => {
  it('empty room scores 0', () => {
    expect(cozyScore([], defs)).toBe(0);
  });

  it('normal item scores cozyScore * 1.0', () => {
    expect(cozyScore([place('rug')], defs)).toBeCloseTo(4);
  });

  it('rare item uses rare multiplier', () => {
    expect(cozyScore([place('lamp')], defs)).toBeCloseTo(6 * GRADE_COZY_MULTIPLIER.rare);
  });

  it('legendary item uses legendary multiplier', () => {
    expect(cozyScore([place('tree')], defs)).toBeCloseTo(10 * GRADE_COZY_MULTIPLIER.legendary);
  });

  it('sums mixed grades', () => {
    const score = cozyScore([place('rug'), place('lamp'), place('tree')], defs);
    expect(score).toBeCloseTo(4 + 6 * 1.5 + 10 * 2.5);
  });

  it('skips placed items referencing unknown defIds', () => {
    const bad: PlacedFurniture = { instanceId: 'x', defId: 'missing', gx: 0, gy: 0, rotation: 0 };
    expect(cozyScore([place('rug'), bad], defs)).toBeCloseTo(4);
  });
});
