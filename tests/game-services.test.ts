import { afterEach, describe, it, expect } from 'vitest';
import type { GrantFn } from '@/systems/EconomySystem';
import {
  getServices,
  initDevServices,
  resetServicesForTesting,
} from '@/systems/GameServices';

const grantFn: GrantFn = async (_source, deltas) => ({ ok: true, granted: deltas });

describe('GameServices', () => {
  afterEach(() => resetServicesForTesting());

  it('getServices is null before init', () => {
    expect(getServices()).toBeNull();
  });

  it('initDevServices creates the triple and subsequent calls reuse it', () => {
    const a = initDevServices(grantFn, () => 1);
    const b = initDevServices(grantFn, () => 999);
    expect(a).toBe(b);
    expect(a.gameState).toBe(b.gameState);
    expect(a.economy).toBe(b.economy);
  });

  it('resetServicesForTesting clears the singleton', () => {
    initDevServices(grantFn);
    expect(getServices()).not.toBeNull();
    resetServicesForTesting();
    expect(getServices()).toBeNull();
  });
});
