import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialSaveData } from '@/entities/SaveData';
import {
  AdSystem,
  FailingAdAdapter,
  MockAdAdapter,
  type AdAdapter,
} from '@/systems/AdSystem';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';

function makeGameState() {
  const sys = new SaveSystem({ backend: new MemorySaveBackend(), now: () => 0, saveRetries: 1 });
  return new GameState(createInitialSaveData('p1', 0), sys);
}

describe('AdSystem', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = makeGameState();
  });

  it('canWatch true on a fresh save for an alpha placement', () => {
    const ads = new AdSystem({ adapter: new MockAdAdapter(), gameState });
    expect(ads.canWatch('quiz_extra_session')).toBe(true);
  });

  it('watch returns ok and increments daily counter on success', async () => {
    const ads = new AdSystem({ adapter: new MockAdAdapter(), gameState });
    const res = await ads.watch('fatigue_restore');
    expect(res.ok).toBe(true);
    expect(ads.usedToday('fatigue_restore')).toBe(1);
    expect(ads.remainingToday('fatigue_restore')).toBe(2);
  });

  it('watch refuses past the daily cap', async () => {
    const ads = new AdSystem({ adapter: new MockAdAdapter(), gameState });
    // quiz_extra_session has dailyCap = 1
    await ads.watch('quiz_extra_session');
    const second = await ads.watch('quiz_extra_session');
    expect(second.ok).toBe(false);
    expect(second.reason).toBe('daily-cap');
  });

  it('returns unknown-placement for an unrecognized id', async () => {
    const ads = new AdSystem({ adapter: new MockAdAdapter(), gameState });
    const res = await ads.watch('not_a_placement' as never);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('unknown-placement');
  });

  it('one fill failure does not disable the placement', async () => {
    const ads = new AdSystem({
      adapter: new FailingAdAdapter(1),
      gameState,
      failureThreshold: 3,
    });
    const first = await ads.watch('merge_boost');
    expect(first.ok).toBe(false);
    expect(first.reason).toBe('fill-failed');
    expect(ads.canWatch('merge_boost')).toBe(true);
    // Counter not bumped on failure
    expect(ads.usedToday('merge_boost')).toBe(0);
  });

  it('three consecutive fill failures disable the placement for the session', async () => {
    const ads = new AdSystem({
      adapter: new FailingAdAdapter(5),
      gameState,
      failureThreshold: 3,
    });
    await ads.watch('merge_boost');
    await ads.watch('merge_boost');
    await ads.watch('merge_boost');
    expect(ads.canWatch('merge_boost')).toBe(false);
    const fourth = await ads.watch('merge_boost');
    expect(fourth.reason).toBe('consecutive-failures');
  });

  it('a successful watch resets the consecutive-failure count', async () => {
    let calls = 0;
    const sometimes: AdAdapter = {
      async showRewarded() {
        calls += 1;
        // fail-fail-success-fail
        return calls === 3;
      },
    };
    const ads = new AdSystem({ adapter: sometimes, gameState, failureThreshold: 3 });
    await ads.watch('block_continue'); // fail
    await ads.watch('block_continue'); // fail
    await ads.watch('block_continue'); // success — resets streak
    await ads.watch('block_continue'); // fail (would be #4 without reset)
    expect(ads.canWatch('block_continue')).toBe(true);
  });

  it('adapter throwing maps to unknown reason and bumps failures', async () => {
    const throwing: AdAdapter = {
      async showRewarded() {
        throw new Error('SDK error');
      },
    };
    const ads = new AdSystem({ adapter: throwing, gameState, failureThreshold: 2 });
    const r1 = await ads.watch('gacha_ticket_chance');
    expect(r1.reason).toBe('unknown');
    await ads.watch('gacha_ticket_chance');
    expect(ads.canWatch('gacha_ticket_chance')).toBe(false);
  });

  it('AdSystem.getAllPlacements returns the 5 roadmap slots', () => {
    const ids = AdSystem.getAllPlacements().map((p) => p.id);
    expect(ids.sort()).toEqual([
      'block_continue',
      'fatigue_restore',
      'gacha_ticket_chance',
      'merge_boost',
      'quiz_extra_session',
    ]);
  });
});
