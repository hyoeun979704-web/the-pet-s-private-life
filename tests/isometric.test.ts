import { describe, it, expect } from 'vitest';
import {
  gridToScreen,
  isInsideRoom,
  rectCells,
} from '@/utils/IsometricUtil';
import { compareDepth, depthFromGrid } from '@/utils/DepthSort';

describe('IsometricUtil', () => {
  it('origin grid maps to origin screen', () => {
    expect(gridToScreen({ gx: 0, gy: 0 })).toEqual({ x: 0, y: 0 });
  });

  it('increasing gx moves right and down (iso)', () => {
    const p = gridToScreen({ gx: 1, gy: 0 });
    expect(p.x).toBeGreaterThan(0);
    expect(p.y).toBeGreaterThan(0);
  });

  it('isInsideRoom respects bounds', () => {
    expect(isInsideRoom({ gx: 0, gy: 0 }, 5, 5)).toBe(true);
    expect(isInsideRoom({ gx: 5, gy: 0 }, 5, 5)).toBe(false);
    expect(isInsideRoom({ gx: -1, gy: 0 }, 5, 5)).toBe(false);
  });

  it('rectCells enumerates footprint', () => {
    const cells = rectCells({ gx: 2, gy: 3 }, 2, 2);
    expect(cells).toHaveLength(4);
    expect(cells).toContainEqual({ gx: 2, gy: 3 });
    expect(cells).toContainEqual({ gx: 3, gy: 4 });
  });
});

describe('DepthSort', () => {
  it('further cells have greater depth', () => {
    const near = depthFromGrid({ gx: 0, gy: 0 });
    const far = depthFromGrid({ gx: 5, gy: 5 });
    expect(far).toBeGreaterThan(near);
  });

  it('compareDepth orders furniture back-to-front', () => {
    const a = { gx: 0, gy: 0, footprintW: 1, footprintH: 1 };
    const b = { gx: 3, gy: 3, footprintW: 1, footprintH: 1 };
    expect(compareDepth(a, b)).toBeLessThan(0);
  });
});
