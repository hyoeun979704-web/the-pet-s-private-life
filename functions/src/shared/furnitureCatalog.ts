// Server-side furniture price catalog. Sync guard:
// tests/furniture-catalog-sync.test.ts diffs this against
// src/data/furniture.json.

export interface FurniturePrice {
  snack?: number;
  starDust?: number;
}

export const FURNITURE_PRICES: Record<string, FurniturePrice> = {
  furn_rug_basic: { snack: 30 },
  furn_cushion_cat: { snack: 20 },
  furn_lamp_warm: { starDust: 15 },
  furn_bed_pet: { starDust: 25 },
  furn_tree_cherry: { starDust: 80 },
};
