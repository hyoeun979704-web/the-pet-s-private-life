import { describe, it, expect } from 'vitest';
import levelsData from '@/data/levels.json';
import { MAX_RESOURCE_GAIN_PER_SOURCE, type ResourceKey } from '@/config/Constants';

const REWARDS = levelsData.levelUpRewards as Record<string, Record<string, number>>;

describe('level-rewards-sync: levels.json vs MAX_RESOURCE_GAIN_PER_SOURCE.level_up', () => {
  const cap = MAX_RESOURCE_GAIN_PER_SOURCE.level_up as Partial<Record<ResourceKey, number>>;

  it('every reward key in levels.json is allowed by the level_up cap', () => {
    Object.entries(REWARDS).forEach(([level, reward]) => {
      Object.keys(reward).forEach((key) => {
        const allowed = (cap as Record<string, number | undefined>)[key];
        expect(
          allowed,
          `level ${level} grants ${key} but level_up cap doesn't list it`,
        ).toBeDefined();
      });
    });
  });

  it('no level reward exceeds the level_up cap for any key', () => {
    Object.entries(REWARDS).forEach(([level, reward]) => {
      Object.entries(reward).forEach(([key, value]) => {
        const allowed = (cap as Record<string, number | undefined>)[key] ?? 0;
        expect(
          value,
          `level ${level} grants ${key}=${value} > cap ${allowed}`,
        ).toBeLessThanOrEqual(allowed);
      });
    });
  });
});
