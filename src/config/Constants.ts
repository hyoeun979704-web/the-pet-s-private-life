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
