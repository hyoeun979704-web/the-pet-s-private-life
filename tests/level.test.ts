import { describe, it, expect } from 'vitest';
import {
  detectLevelUps,
  levelFromExp,
  maxLevel,
  progressAt,
} from '@/systems/LevelSystem';

describe('LevelSystem', () => {
  it('level 1 at 0 exp and below the first threshold', () => {
    expect(levelFromExp(0)).toBe(1);
    expect(levelFromExp(99)).toBe(1);
  });

  it('crosses to level 2 exactly at the threshold', () => {
    expect(levelFromExp(100)).toBe(2);
  });

  it('caps at maxLevel even for huge exp', () => {
    expect(levelFromExp(10_000_000)).toBe(maxLevel());
  });

  it('progressAt reports correct within-level span', () => {
    const p = progressAt(175); // between 100 and 250
    expect(p.level).toBe(2);
    expect(p.currentLevelExp).toBe(75);
    expect(p.expToNext).toBe(75);
    expect(p.progress).toBeCloseTo(0.5, 2);
  });

  it('progressAt at final level reports expToNext = null', () => {
    const last = maxLevel();
    const p = progressAt(22_000 + 500);
    expect(p.level).toBe(last);
    expect(p.expToNext).toBeNull();
    expect(p.progress).toBe(1);
  });

  it('detectLevelUps fires once per crossed threshold with rewards', () => {
    // Starting at level 1 (exp 0), jumping to exp 300 -> levels 2 and 3
    const events = detectLevelUps(1, 300);
    expect(events).toHaveLength(2);
    expect(events[0]?.to).toBe(2);
    expect(events[1]?.to).toBe(3);
    expect(events[0]?.reward.snack).toBe(50);
    expect(events[1]?.reward.magicStone).toBe(1);
  });

  it('detectLevelUps returns empty when no level gained', () => {
    expect(detectLevelUps(3, 260)).toEqual([]);
  });
});
