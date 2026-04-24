import type { FurnitureDef, PlacedFurniture } from '@/entities/Furniture';

/**
 * Multiplier applied to a furniture item's cozyScore based on its grade.
 * Externalized so designers can tune rarity weighting.
 */
export const GRADE_COZY_MULTIPLIER = {
  normal: 1.0,
  rare: 1.5,
  legendary: 2.5,
} as const;

/**
 * Pure: computes the cozy_score for a room given its placed furniture and
 * the furniture catalog. Returns 0 when nothing is placed. Items referencing
 * unknown defIds are skipped (drift-tolerant).
 */
export function cozyScore(
  placed: readonly PlacedFurniture[],
  defs: readonly FurnitureDef[],
): number {
  const defMap = new Map(defs.map((d) => [d.id, d]));
  return placed.reduce((sum, p) => {
    const def = defMap.get(p.defId);
    if (!def) return sum;
    const mult = GRADE_COZY_MULTIPLIER[def.grade];
    return sum + def.cozyScore * mult;
  }, 0);
}
