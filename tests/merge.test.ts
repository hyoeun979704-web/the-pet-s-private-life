import { describe, it, expect } from 'vitest';
import { mergedLevel, type MergeItem } from '@/entities/MergeItem';
import { MergeGameSystem } from '@/systems/MergeGameSystem';
import { starDustFor } from '@/utils/MergeReward';

function placed(sys: MergeGameSystem): { x: number; y: number; item: MergeItem }[] {
  const out: { x: number; y: number; item: MergeItem }[] = [];
  const board = sys.getBoard();
  for (let y = 0; y < sys.height(); y += 1) {
    for (let x = 0; x < sys.width(); x += 1) {
      const c = board[y]?.[x];
      if (c) out.push({ x, y, item: c });
    }
  }
  return out;
}

describe('mergedLevel', () => {
  it('same level merges to level+1', () => {
    expect(mergedLevel(1, 1)).toBe(2);
    expect(mergedLevel(7, 7)).toBe(8);
  });

  it('different levels cannot merge', () => {
    expect(mergedLevel(1, 2)).toBeNull();
  });

  it('level 10 cannot merge further', () => {
    expect(mergedLevel(10, 10)).toBeNull();
  });
});

describe('MergeGameSystem', () => {
  it('initialFills seeds exactly N items', () => {
    const sys = new MergeGameSystem({ initialFills: 4, rand: () => 0 });
    expect(placed(sys)).toHaveLength(4);
  });

  it('straight move into empty cell moves + spawns one new item', () => {
    // rand = 0 always picks the first empty cell.
    const sys = new MergeGameSystem({ initialFills: 1, rand: () => 0 });
    const before = placed(sys);
    expect(before).toHaveLength(1);
    const src = before[0]!;
    // Move to an empty spot that's not (0,0) — the spawn put the seed at
    // the first empty cell (0,0) because rand=0.
    expect(src).toEqual({ x: 0, y: 0, item: src.item });
    const res = sys.move(0, 0, 4, 4);
    expect(res.ok).toBe(true);
    expect(res.mergedTo).toBeUndefined();
    // 1 existing item moved + 1 spawn = 2 items
    expect(placed(sys)).toHaveLength(2);
  });

  it('merges two lv-1 into lv-2', () => {
    const sys = new MergeGameSystem({ initialFills: 0, rand: () => 0 });
    // Seed via unsafe cast: two lv-1 neighbors.
    const board = sys.getBoard() as unknown as (MergeItem | null)[][];
    board[0]![0] = { id: 'a', level: 1 };
    board[0]![1] = { id: 'b', level: 1 };
    const res = sys.move(0, 0, 1, 0);
    expect(res.ok).toBe(true);
    expect(res.mergedTo).toBe(2);
    // Merge destination is lv-2. (0,0) receives the post-move spawn,
    // so only the merged cell's level is asserted here.
    expect(board[0]![1]?.level).toBe(2);
  });

  it('rejects merging different levels', () => {
    const sys = new MergeGameSystem({ initialFills: 0 });
    const board = sys.getBoard() as unknown as (MergeItem | null)[][];
    board[0]![0] = { id: 'a', level: 1 };
    board[0]![1] = { id: 'b', level: 2 };
    const res = sys.move(0, 0, 1, 0);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('incompatible');
  });

  it('rejects out-of-bounds and empty source', () => {
    const sys = new MergeGameSystem({ initialFills: 0 });
    expect(sys.move(-1, 0, 0, 0).reason).toBe('out-of-bounds');
    expect(sys.move(0, 0, 0, 0).reason).toBe('same-cell');
    expect(sys.move(0, 0, 1, 0).reason).toBe('empty-source');
  });

  it('isGameOver: false when empty cells remain', () => {
    const sys = new MergeGameSystem({ initialFills: 0 });
    expect(sys.isGameOver()).toBe(false);
  });

  it('isGameOver: false when a merge is still possible', () => {
    const sys = new MergeGameSystem({ initialFills: 0 });
    const board = sys.getBoard() as unknown as (MergeItem | null)[][];
    // Fully fill 5x5 with a pattern that has adjacent same-level pairs.
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        board[y]![x] = { id: `f_${x}_${y}`, level: 1 };
      }
    }
    expect(sys.isGameOver()).toBe(false);
  });

  it('isGameOver: true on full board with no adjacent same-level pairs', () => {
    const sys = new MergeGameSystem({ initialFills: 0 });
    const board = sys.getBoard() as unknown as (MergeItem | null)[][];
    // Checkerboard of level 1 and level 2 — no orthogonal neighbor matches.
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        board[y]![x] = { id: `f_${x}_${y}`, level: ((x + y) % 2 === 0 ? 1 : 2) };
      }
    }
    expect(sys.isGameOver()).toBe(true);
  });

  it('isGameOver: true even when adjacent lv-10 pairs exist (cannot merge further)', () => {
    const sys = new MergeGameSystem({ initialFills: 0 });
    const board = sys.getBoard() as unknown as (MergeItem | null)[][];
    // Fill board entirely with lv-10. Neighbors match levels but mergedLevel
    // returns null for 10+10 -> isGameOver must be true.
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        board[y]![x] = { id: `f_${x}_${y}`, level: 10 };
      }
    }
    expect(sys.isGameOver()).toBe(true);
  });
});

describe('MergeReward.starDustFor', () => {
  it('levels 1-6 give 0 starDust', () => {
    for (let lvl = 1; lvl <= 6; lvl += 1) {
      expect(starDustFor(lvl as 1 | 2 | 3 | 4 | 5 | 6)).toBe(0);
    }
  });

  it('levels 7-10 follow the roadmap table', () => {
    expect(starDustFor(7)).toBe(10);
    expect(starDustFor(8)).toBe(20);
    expect(starDustFor(9)).toBe(35);
    expect(starDustFor(10)).toBe(50);
  });
});
