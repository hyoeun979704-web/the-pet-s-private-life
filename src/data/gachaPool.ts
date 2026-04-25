// Client-side mirror of functions/src/shared/gachaPool.ts.
// Sync guard lives in tests/gacha-pool-sync.test.ts.
//
// Used by GachaSystem in dev mode (no server) and by GachaRatesScene to
// list every reachable character for the legally-required disclosure.

export type GachaGrade = 'normal' | 'rare' | 'legendary';

export const GACHA_POOL: Record<GachaGrade, readonly string[]> = {
  normal: [
    'cat_munchkin',
    'cat_persian',
    'dog_bichon',
    'dog_pomeranian',
    'dog_maltese',
    'ham_golden',
  ],
  rare: [
    'cat_scottish_fold',
    'cat_russian_blue',
    'dog_welsh_corgi',
    'dog_shiba',
    'ham_roborovski',
    'hedge_common',
    'parrot_cockatiel',
  ],
  legendary: [
    'cat_siamese',
    'dog_golden_retriever',
    'hedge_albino',
    'parrot_budgerigar',
  ],
} as const;
