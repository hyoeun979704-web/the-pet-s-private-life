export type MergeLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface MergeItem {
  id: string;
  level: MergeLevel;
}

/** Returns the merged level, or null if the two items cannot merge. */
export function mergedLevel(a: MergeLevel, b: MergeLevel): MergeLevel | null {
  if (a !== b) return null;
  if (a >= 10) return null;
  return (a + 1) as MergeLevel;
}
