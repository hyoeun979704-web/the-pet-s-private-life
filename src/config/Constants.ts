export const GAME_META = {
  title: 'The Pets Private Life',
  version: '0.1.0-mvp',
  baseWidth: 1920,
  baseHeight: 1080,
  orientation: 'landscape' as const,
  targetFps: 60,
  lowEndFps: 30,
  minAndroidSdk: 26,
} as const;

export const DESIGN_TOKENS = {
  color: {
    primary: '#FFC8DD',
    primaryDark: '#E8A4BF',
    secondary: '#FAEDCB',
    accent: '#A0C4FF',
    success: '#B9FBC0',
    danger: '#FFADAD',
    textPrimary: '#3A2E2A',
    textSecondary: '#7A6A66',
    bg: '#FFF7F2',
    bgAlt: '#F3E8E2',
  },
  radius: { sm: 8, md: 12, lg: 20, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  font: {
    family: '"Pretendard", "Noto Sans KR", sans-serif',
    sizeSm: 14,
    sizeMd: 18,
    sizeLg: 24,
    sizeXl: 32,
  },
  shadow: {
    soft: '0 4px 12px rgba(58, 46, 42, 0.08)',
    medium: '0 8px 20px rgba(58, 46, 42, 0.12)',
  },
} as const;

export const PLACEMENT_CONFIG = {
  tilePx: 64,
  isoAngleDeg: 30,
  allowOverlap: false,
  rotationSteps: 4,
  undoDepth: 1,
  storageSlots: 100,
  snapToGrid: true,
} as const;

export const FATIGUE_CONFIG = {
  base: 10,
  levelBonus: 1,
  recoveryMinutes: 30,
  costs: {
    blockPuzzle: 1,
    mergeGame: 2,
    quiz: 4,
  },
  adRestoreAmount: 3,
  adRestoreDailyLimit: 3,
} as const;

export const DAILY_LIMITS = {
  snack: 200,
  starDust: 50,
  quizSessions: 1,
} as const;

/**
 * Defense in depth: caps the per-roll magicShard reward on a duplicate
 * pull. Mirrors functions/shared/economy.ts MAX_GACHA_SHARD_PER_CALL.
 */
export const MAX_GACHA_SHARD_PER_CALL = 10;

export const GACHA_CONFIG = {
  costMagicStone: 1,
  pityLimit: 20,
  rates: {
    normal: 0.7,
    rare: 0.25,
    legendary: 0.05,
  },
} as const;

export const SAVE_SCHEMA_VERSION = 1;

export const SUPPORTED_LOCALES = ['ko', 'ja', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'ko';

export const ACCESSIBILITY = {
  largeFontScale: 1.2,
  minTapTargetDp: 44,
  textContrastRatio: 4.5,
} as const;

export const DEFAULT_GAME_SETTINGS = {
  bgmVolume: 0.6,
  sfxVolume: 0.8,
  largeFont: false,
  reduceMotion: false,
} as const;

/**
 * Daily limit resets at local KST midnight. Offset from UTC in minutes.
 * Do NOT change without coordinating with Cloud Functions (server-side
 * midnight calc must match).
 */
export const DAILY_RESET_TIMEZONE_OFFSET_MIN = 9 * 60;

/**
 * Server-side cap for how many resources a single call to `addResources`
 * may grant per source. Prevents client-side cheating where the client
 * claims arbitrary rewards. Cloud Functions reads this from a shared
 * module; keep in sync with `functions/src/shared/economy.ts`.
 */
export const MAX_RESOURCE_GAIN_PER_SOURCE = {
  block_puzzle: { snack: 50 },
  merge_game: { starDust: 50 },
  quiz: { magicShard: 10, gachaTicket: 1 },
  daily_mission: { snack: 30, starDust: 10 },
  // level_up caps cover the maxima in data/levels.json so the cascade
  // grants in EconomySystem.grantWithExp don't silently get rejected.
  level_up: { snack: 500, starDust: 50, magicStone: 3, gachaTicket: 1 },
  login_bonus: { snack: 20, starDust: 5, magicStone: 1 },
  ad_reward: { snack: 10, starDust: 5 },
} as const;

/**
 * Per-line / per-combo gameplay rewards for the block puzzle. The session
 * total is capped by MAX_RESOURCE_GAIN_PER_SOURCE.block_puzzle on grant.
 */
export const BLOCK_PUZZLE_REWARD = {
  perLine: 5,
  comboBonus: 15,
} as const;

/**
 * Default exp granted per source. Minigames can override (e.g. quiz scales
 * with correct count). Exp is currently client-tracked; a future PART will
 * promote it to a server-validated field if exploitation becomes a concern.
 */
export const EXP_BY_SOURCE: Record<string, number> = {
  block_puzzle: 30,
  merge_game: 40,
  quiz: 5, // per correct answer; multiply at the call site
  daily_mission: 50,
  level_up: 0,
  login_bonus: 10,
  ad_reward: 0,
};

export type ResourceGainSource = keyof typeof MAX_RESOURCE_GAIN_PER_SOURCE;

export const RESOURCE_KEYS = [
  'snack',
  'starDust',
  'magicStone',
  'magicShard',
  'gachaTicket',
] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];
