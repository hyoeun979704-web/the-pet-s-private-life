import levelsData from '@/data/levels.json';
import type { ResourceKey } from '@/config/Constants';

export interface LevelProgress {
  level: number;
  currentLevelExp: number;
  expToNext: number | null;
  progress: number; // 0..1
}

export interface LevelUp {
  from: number;
  to: number;
  reward: Partial<Record<ResourceKey, number>>;
}

const EXP_TABLE = levelsData.expToReach as readonly number[];
const LEVEL_REWARDS = levelsData.levelUpRewards as Record<
  string,
  Partial<Record<ResourceKey, number>>
>;

const MAX_LEVEL = EXP_TABLE.length;

export function levelFromExp(exp: number): number {
  let lvl = 1;
  for (let i = 0; i < EXP_TABLE.length; i += 1) {
    const threshold = EXP_TABLE[i] ?? Number.POSITIVE_INFINITY;
    if (exp >= threshold) lvl = i + 1;
    else break;
  }
  return Math.min(lvl, MAX_LEVEL);
}

export function progressAt(exp: number): LevelProgress {
  const level = levelFromExp(exp);
  const thisLevelExp = EXP_TABLE[level - 1] ?? 0;
  const nextLevelExp = EXP_TABLE[level];
  if (nextLevelExp === undefined) {
    return { level, currentLevelExp: exp - thisLevelExp, expToNext: null, progress: 1 };
  }
  const span = nextLevelExp - thisLevelExp;
  const intoLevel = exp - thisLevelExp;
  return {
    level,
    currentLevelExp: intoLevel,
    expToNext: nextLevelExp - exp,
    progress: span > 0 ? intoLevel / span : 1,
  };
}

/**
 * Pure: given a previous level and new cumulative exp, returns the list of
 * level-ups that should fire (one per crossed threshold) with their rewards.
 */
export function detectLevelUps(prevLevel: number, newExp: number): LevelUp[] {
  const nextLevel = levelFromExp(newExp);
  if (nextLevel <= prevLevel) return [];
  const events: LevelUp[] = [];
  for (let l = prevLevel + 1; l <= nextLevel; l += 1) {
    events.push({
      from: l - 1,
      to: l,
      reward: { ...(LEVEL_REWARDS[String(l)] ?? {}) },
    });
  }
  return events;
}

export function maxLevel(): number {
  return MAX_LEVEL;
}
