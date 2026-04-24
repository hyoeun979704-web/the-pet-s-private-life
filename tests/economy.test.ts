import { describe, it, expect } from 'vitest';
import { createInitialSaveData, type SaveData } from '@/entities/SaveData';
import { EconomySystem, type GrantFn } from '@/systems/EconomySystem';

function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return { ...createInitialSaveData('p1', 0), ...overrides };
}

function grantOk(): GrantFn {
  return async (_source, deltas) => ({ ok: true, granted: deltas });
}

describe('EconomySystem', () => {
  it('canAfford reflects current wallet', () => {
    let save = makeSave({
      resources: {
        snack: 50, starDust: 10, magicStone: 0, magicShard: 0, gachaTicket: 0,
      },
    });
    const sys = new EconomySystem({ grantFn: grantOk(), getSave: () => save });
    expect(sys.canAfford({ snack: 30 })).toBe(true);
    expect(sys.canAfford({ snack: 100 })).toBe(false);
    // canAfford reads fresh on each call.
    save = { ...save, resources: { ...save.resources, snack: 500 } };
    expect(sys.canAfford({ snack: 100 })).toBe(true);
  });

  it('canGrant rejects unknown source', () => {
    const sys = new EconomySystem({ grantFn: grantOk(), getSave: () => makeSave() });
    const res = sys.canGrant('not_a_source' as never, { snack: 5 });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('unknown-source');
  });

  it('canGrant rejects over-cap gains per source', () => {
    const sys = new EconomySystem({ grantFn: grantOk(), getSave: () => makeSave() });
    // block_puzzle cap: snack 15
    const res = sys.canGrant('block_puzzle', { snack: 100 });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('cap-exceeded');
  });

  it('canGrant rejects a resource key not allowed for the source', () => {
    const sys = new EconomySystem({ grantFn: grantOk(), getSave: () => makeSave() });
    // block_puzzle only allows snack, not starDust
    const res = sys.canGrant('block_puzzle', { starDust: 1 });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('cap-exceeded');
  });

  it('canGrant rejects when the daily cap would be exceeded', () => {
    const save = makeSave({
      dailyLimits: {
        resetAtMs: 0, snackEarned: 195, starDustEarned: 0,
        quizSessionsUsed: 0, adFatigueUsed: 0,
      },
    });
    const sys = new EconomySystem({ grantFn: grantOk(), getSave: () => save });
    const res = sys.canGrant('block_puzzle', { snack: 10 });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('daily-limit');
  });

  it('grant forwards to the server when pre-flight passes', async () => {
    const calls: unknown[] = [];
    const fn: GrantFn = async (source, deltas) => {
      calls.push({ source, deltas });
      return { ok: true, granted: deltas };
    };
    const sys = new EconomySystem({ grantFn: fn, getSave: () => makeSave() });
    const res = await sys.grant('block_puzzle', { snack: 5 });
    expect(res.ok).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it('grant short-circuits on pre-flight fail without calling the server', async () => {
    let called = 0;
    const fn: GrantFn = async () => {
      called += 1;
      return { ok: true };
    };
    const sys = new EconomySystem({ grantFn: fn, getSave: () => makeSave() });
    const res = await sys.grant('block_puzzle', { snack: 999 });
    expect(res.ok).toBe(false);
    expect(called).toBe(0);
  });

  it('dailyRemaining reflects what is left of the cap', () => {
    const save = makeSave({
      dailyLimits: {
        resetAtMs: 0, snackEarned: 180, starDustEarned: 45,
        quizSessionsUsed: 0, adFatigueUsed: 0,
      },
    });
    const sys = new EconomySystem({ grantFn: grantOk(), getSave: () => save });
    expect(sys.dailyRemaining()).toEqual({ snack: 20, starDust: 5 });
  });
});
