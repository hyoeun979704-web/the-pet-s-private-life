import { describe, it, expect } from 'vitest';
import { activeSeason, allSeasons, isLimitedAvailable } from '@/systems/SeasonsSystem';

describe('SeasonsSystem', () => {
  it('returns null outside any season window', () => {
    // Long before the seed season's startAt.
    expect(activeSeason(0)).toBeNull();
  });

  it('returns the spring season inside its window', () => {
    const inside = Date.parse('2026-04-01T12:00:00+09:00');
    expect(activeSeason(inside)?.id).toBe('season_2026_spring');
  });

  it('exposes the full catalog via allSeasons', () => {
    expect(allSeasons().length).toBeGreaterThan(0);
  });

  it('isLimitedAvailable false when no season active', () => {
    expect(isLimitedAvailable('any_id', 0)).toBe(false);
  });
});
