import { MAX_RESOURCE_GAIN_PER_SOURCE } from '@/config/Constants';

export interface BlockRewardInput {
  rowsCleared: number;
  colsCleared: number;
}

export interface BlockReward {
  snack: number;
  /** 'combo' when 2+ lines cleared in one placement, else 'single' or 'none'. */
  tier: 'none' | 'single' | 'combo';
}

const PER_LINE = 5;
const COMBO_TOTAL = MAX_RESOURCE_GAIN_PER_SOURCE.block_puzzle.snack; // 15

/**
 * Pure: maps cleared-line counts to a snack reward respecting the server cap.
 *  - 0 lines: 0 snack
 *  - 1 line:  5 snack
 *  - 2+ lines (combo): 15 snack (server cap; cannot exceed without rejection)
 */
export function blockReward(input: BlockRewardInput): BlockReward {
  const total = input.rowsCleared + input.colsCleared;
  if (total === 0) return { snack: 0, tier: 'none' };
  if (total === 1) return { snack: PER_LINE, tier: 'single' };
  return { snack: COMBO_TOTAL, tier: 'combo' };
}
