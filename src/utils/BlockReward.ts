import { BLOCK_PUZZLE_REWARD } from '@/config/Constants';

export interface BlockRewardInput {
  rowsCleared: number;
  colsCleared: number;
}

export interface BlockReward {
  snack: number;
  /** 'combo' when 2+ lines cleared in one placement, else 'single' or 'none'. */
  tier: 'none' | 'single' | 'combo';
}

/**
 * Pure: per-placement snack reward.
 *  - 0 lines cleared:  0 snack
 *  - 1 line cleared:   perLine (5)
 *  - 2+ lines (combo): perLine * total + comboBonus (15)
 *
 * Session totals accumulate; the server caps the GRANT call at
 * MAX_RESOURCE_GAIN_PER_SOURCE.block_puzzle.snack (50).
 */
export function blockReward(input: BlockRewardInput): BlockReward {
  const total = input.rowsCleared + input.colsCleared;
  if (total === 0) return { snack: 0, tier: 'none' };
  if (total === 1) return { snack: BLOCK_PUZZLE_REWARD.perLine, tier: 'single' };
  return {
    snack: BLOCK_PUZZLE_REWARD.perLine * total + BLOCK_PUZZLE_REWARD.comboBonus,
    tier: 'combo',
  };
}
