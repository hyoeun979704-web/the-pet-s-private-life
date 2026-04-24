import mergeLevels from '@/data/mergeLevels.json';
import type { MergeLevel } from '@/entities/MergeItem';

const LEVEL_REWARDS: Record<number, number> = Object.fromEntries(
  (mergeLevels.levels as { level: number; starDust: number }[]).map((l) => [
    l.level,
    l.starDust,
  ]),
);

/** starDust reward granted every time `level` is freshly created via merge. */
export function starDustFor(level: MergeLevel): number {
  return LEVEL_REWARDS[level] ?? 0;
}
