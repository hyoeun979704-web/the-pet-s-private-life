// -----------------------------------------------------------------------------
// Server-side economy constants.
//
// IMPORTANT: These MUST stay in sync with src/config/Constants.ts.
// A Vitest check in the main workspace (tests/economy-sync.test.ts)
// imports both and asserts deep equality.
// -----------------------------------------------------------------------------

export const RESOURCE_KEYS = [
  'snack',
  'starDust',
  'magicStone',
  'magicShard',
  'gachaTicket',
] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

export const MAX_RESOURCE_GAIN_PER_SOURCE: Record<
  string,
  Partial<Record<ResourceKey, number>>
> = {
  block_puzzle: { snack: 50 },
  merge_game: { starDust: 50 },
  quiz: { magicShard: 10, gachaTicket: 1 },
  daily_mission: { snack: 30, starDust: 10 },
  // level_up caps cover data/levels.json maxima so the EconomySystem
  // cascade isn't rejected server-side.
  level_up: { snack: 500, starDust: 50, magicStone: 3, gachaTicket: 1 },
  login_bonus: { snack: 20, starDust: 5, magicStone: 1 },
  ad_reward: { snack: 10, starDust: 5, gachaTicket: 1 },
};

export const DAILY_LIMITS = {
  snack: 200,
  starDust: 50,
  quizSessions: 1,
} as const;

export const ACTIVITY_COSTS = {
  blockPuzzle: 1,
  mergeGame: 2,
  quiz: 4,
} as const;
export type FatigueActivity = keyof typeof ACTIVITY_COSTS;

export const GACHA = {
  costMagicStone: 1,
  pityLimit: 20,
  rates: { normal: 0.7, rare: 0.25, legendary: 0.05 },
} as const;

/**
 * Fatigue max by character grade. Kept here (not in characters.json) because
 * the server must assign initial fatigue without loading the full catalog.
 * Sync guard: tests/gacha-pool-sync.test.ts asserts every character's
 * fatigueMax matches its grade bucket below.
 */
export const FATIGUE_MAX_BY_GRADE = {
  normal: 10,
  rare: 12,
  legendary: 15,
} as const;

/** Cap used when returning placed furniture to the inventory. */
export const INVENTORY_STORAGE_SLOTS = 100;

/**
 * Per-call cap on magicShard awarded for a duplicate-pull in rollGacha.
 * Defense in depth: keeps a single roll from minting unbounded shards
 * even if DUPLICATE_SHARD_REWARD is later mis-tuned.
 */
export const MAX_GACHA_SHARD_PER_CALL = 10;
