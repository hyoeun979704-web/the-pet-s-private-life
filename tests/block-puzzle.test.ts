import { describe, it, expect } from 'vitest';
import shapesData from '@/data/blockShapes.json';
import type { BlockShape } from '@/entities/BlockShape';
import { BlockPuzzleSystem } from '@/systems/BlockPuzzleSystem';
import { blockReward } from '@/utils/BlockReward';

const SHAPES = shapesData.shapes as unknown as BlockShape[];
const SINGLE = SHAPES.find((s) => s.id === 's_1x1')!;
const H3 = SHAPES.find((s) => s.id === 's_h3')!;
const V3 = SHAPES.find((s) => s.id === 's_v3')!;
const SQ2 = SHAPES.find((s) => s.id === 's_2x2')!;

function makeSys(opts: { tray?: BlockShape[]; w?: number; h?: number } = {}) {
  // Deterministic: seeded rand picks shapes by index modulo a counter.
  let i = 0;
  const tray = opts.tray ?? [SINGLE, SINGLE, SINGLE];
  const idxs = tray.map((s) => SHAPES.indexOf(s));
  const sys = new BlockPuzzleSystem({
    width: opts.w ?? 5,
    height: opts.h ?? 5,
    shapeCatalog: SHAPES,
    trayCount: 3,
    rand: () => {
      // Map each call to a specific catalog index from `idxs`.
      const target = idxs[i % idxs.length] ?? 0;
      i += 1;
      // SHAPES.length = 10; rand needs to land on `target` after Math.floor.
      return target / SHAPES.length;
    },
  });
  return sys;
}

describe('BlockPuzzleSystem', () => {
  it('starts with an empty board', () => {
    const sys = makeSys();
    sys.getBoard().forEach((row) => row.forEach((c) => expect(c.filled).toBe(false)));
  });

  it('canPlace true for a free spot', () => {
    const sys = makeSys();
    expect(sys.canPlace(SINGLE, 0, 0)).toBe(true);
  });

  it('canPlace false out of bounds', () => {
    const sys = makeSys({ w: 3, h: 3 });
    expect(sys.canPlace(H3, 1, 0)).toBe(false); // would extend to x=3
  });

  it('place fills cells and returns placedCells', () => {
    const sys = makeSys();
    const res = sys.place(0, 1, 1);
    expect(res.ok).toBe(true);
    expect(res.placedCells).toEqual([{ x: 1, y: 1, colorIndex: 0 }]);
  });

  it('place rejects when overlapping', () => {
    const sys = makeSys();
    sys.place(0, 0, 0);
    expect(sys.place(1, 0, 0).ok).toBe(false);
    expect(sys.place(1, 0, 0).reason).toBe('overlap');
  });

  it('place rejects out-of-bounds', () => {
    const sys = makeSys({ tray: [H3, H3, H3], w: 3, h: 3 });
    const res = sys.place(0, 1, 0); // h3 at x=1 would extend to x=3
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('out-of-bounds');
  });

  it('clears a fully filled row', () => {
    const sys = makeSys({ tray: [H3, H3, H3], w: 3, h: 3 });
    const res = sys.place(0, 0, 0);
    expect(res.clearedRows).toEqual([0]);
    sys.getBoard()[0]!.forEach((c) => expect(c.filled).toBe(false));
  });

  it('clears a fully filled column', () => {
    const sys = makeSys({ tray: [V3, V3, V3], w: 3, h: 3 });
    const res = sys.place(0, 0, 0);
    expect(res.clearedCols).toEqual([0]);
    for (let y = 0; y < 3; y += 1) {
      expect(sys.getBoard()[y]![0]!.filled).toBe(false);
    }
  });

  it('refills the tray when all 3 slots consumed', () => {
    const sys = makeSys({ w: 5, h: 5 });
    sys.place(0, 0, 0);
    sys.place(1, 0, 1);
    sys.place(2, 0, 2);
    // Tray should now be filled again with three slots.
    expect(sys.getTray().filter((s) => s !== null)).toHaveLength(3);
  });

  it('isGameOver true when no tray shape fits anywhere', () => {
    // 3x3 board with three 2x2 shapes in the tray. Placing a 2x2 at
    // (0,0) fills the four top-left cells. Row 0/1: only 2 of 3 filled
    // (no clear). Tray retains two more 2x2 pieces; the only valid
    // anchors for a 2x2 are (0,0), (0,1), (1,0), (1,1) — every one of
    // them overlaps at least one filled cell -> game over.
    const sys = makeSys({ tray: [SQ2, SQ2, SQ2], w: 3, h: 3 });
    sys.place(0, 0, 0);
    expect(sys.isGameOver()).toBe(true);
  });

  it('reset wipes board and refills tray', () => {
    const sys = makeSys();
    sys.place(0, 0, 0);
    sys.reset();
    expect(sys.getBoard()[0]![0]!.filled).toBe(false);
    expect(sys.getTray().filter((s) => s !== null)).toHaveLength(3);
  });
});

describe('BlockReward', () => {
  it('zero clears -> 0 snack', () => {
    expect(blockReward({ rowsCleared: 0, colsCleared: 0 })).toEqual({
      snack: 0,
      tier: 'none',
    });
  });

  it('single line -> 5 snack', () => {
    expect(blockReward({ rowsCleared: 1, colsCleared: 0 })).toEqual({
      snack: 5,
      tier: 'single',
    });
  });

  it('combo (2+) -> 15 snack capped', () => {
    expect(blockReward({ rowsCleared: 1, colsCleared: 1 })).toEqual({
      snack: 15,
      tier: 'combo',
    });
    expect(blockReward({ rowsCleared: 3, colsCleared: 0 })).toEqual({
      snack: 15,
      tier: 'combo',
    });
  });
});
