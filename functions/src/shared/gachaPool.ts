// Gacha pool per grade. Kept minimal (ids only) because the client
// already holds the full CharacterDef table in src/data/characters.json.
//
// Sync guard: tests/gacha-pool-sync.test.ts checks this against characters.json.

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
