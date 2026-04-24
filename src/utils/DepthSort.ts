import type { GridPos } from './IsometricUtil';

export function depthFromGrid(pos: GridPos, footprintW = 1, footprintH = 1): number {
  // Back-right corner cell index — sorts back-to-front in iso view.
  return pos.gx + footprintW - 1 + (pos.gy + footprintH - 1);
}

export function compareDepth(
  a: { gx: number; gy: number; footprintW?: number; footprintH?: number },
  b: { gx: number; gy: number; footprintW?: number; footprintH?: number },
): number {
  const da = depthFromGrid({ gx: a.gx, gy: a.gy }, a.footprintW ?? 1, a.footprintH ?? 1);
  const db = depthFromGrid({ gx: b.gx, gy: b.gy }, b.footprintW ?? 1, b.footprintH ?? 1);
  return da - db;
}
