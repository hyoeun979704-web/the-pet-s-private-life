import { describe, it, expect } from 'vitest';
import {
  FATIGUE_CONFIG,
  MAX_RESOURCE_GAIN_PER_SOURCE,
  PLACEMENT_CONFIG,
  RESOURCE_KEYS,
} from '@/config/Constants';
/* eslint-disable import/no-relative-packages */
// Intentional cross-workspace import: this test GUARDS the duplication
// between client and Cloud Functions constants. Breaking either breaks
// the test — which is the whole point.
import {
  ACTIVITY_COSTS as FN_ACTIVITY_COSTS,
  DAILY_LIMITS as FN_DAILY_LIMITS,
  INVENTORY_STORAGE_SLOTS as FN_STORAGE_SLOTS,
  MAX_RESOURCE_GAIN_PER_SOURCE as FN_CAPS,
  RESOURCE_KEYS as FN_RESOURCE_KEYS,
} from '../functions/src/shared/economy';
/* eslint-enable import/no-relative-packages */

describe('economy-sync: client Constants vs functions/shared', () => {
  it('RESOURCE_KEYS match', () => {
    expect([...FN_RESOURCE_KEYS].sort()).toEqual([...RESOURCE_KEYS].sort());
  });

  it('MAX_RESOURCE_GAIN_PER_SOURCE matches', () => {
    expect(FN_CAPS).toEqual(MAX_RESOURCE_GAIN_PER_SOURCE);
  });

  it('ACTIVITY_COSTS match FATIGUE_CONFIG.costs', () => {
    expect(FN_ACTIVITY_COSTS).toEqual(FATIGUE_CONFIG.costs);
  });

  it('functions daily limits match client', async () => {
    const { DAILY_LIMITS } = await import('@/config/Constants');
    expect(FN_DAILY_LIMITS).toEqual(DAILY_LIMITS);
  });

  it('inventory storage slots match between client and server', () => {
    expect(FN_STORAGE_SLOTS).toBe(PLACEMENT_CONFIG.storageSlots);
  });
});
