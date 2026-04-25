import { describe, it, expect } from 'vitest';
import { createInitialSaveData, type SaveData } from '@/entities/SaveData';
import { EconomySystem, type GrantFn } from '@/systems/EconomySystem';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';

function makeSave(overrides: Partial<SaveData> = {}): SaveData {
  return { ...createInitialSaveData('p1', 0), ...overrides };
}

function grantOk(): GrantFn {
  return async (_source, deltas) => ({ ok: true, granted: deltas });
}

function makeStatefulEconomy(): { economy: EconomySystem; gameState: GameState; calls: { source: string; deltas: unknown }[] } {
  const calls: { source: string; deltas: unknown }[] = [];
  const grantFn: GrantFn = async (source, deltas) => {
    calls.push({ source, deltas });
    return { ok: true, granted: deltas };
  };
  const sys = new SaveSystem({ backend: new MemorySaveBackend(), now: () => 0, saveRetries: 1 });
  const gameState = new GameState(createInitialSaveData('p1', 0), sys);
  const economy = new EconomySystem({
    grantFn,
    getSave: () => gameState.get(),
    gameState,
  });
  return { economy, gameState, calls };
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
    expect(res.reason).toBe('key-not-allowed');
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

  it('canStartQuizSession is true when cap not reached', () => {
    const sys = new EconomySystem({ grantFn: grantOk(), getSave: () => makeSave() });
    expect(sys.canStartQuizSession()).toBe(true);
  });

  it('canStartQuizSession + canGrant block quiz once daily session cap reached', () => {
    const save = makeSave({
      dailyLimits: {
        resetAtMs: 0, snackEarned: 0, starDustEarned: 0,
        quizSessionsUsed: 1, adFatigueUsed: 0,
      },
    });
    const sys = new EconomySystem({ grantFn: grantOk(), getSave: () => save });
    expect(sys.canStartQuizSession()).toBe(false);
    const res = sys.canGrant('quiz', { magicShard: 1 });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('daily-limit');
  });

  it('applyExp updates exp + level when crossing thresholds', async () => {
    const { economy, gameState } = makeStatefulEconomy();
    expect(gameState.get().level).toBe(1);
    const ups = await economy.applyExp(120); // crosses lvl 2 threshold (100)
    expect(ups).toHaveLength(1);
    expect(ups[0]?.to).toBe(2);
    expect(gameState.get().exp).toBe(120);
    expect(gameState.get().level).toBe(2);
  });

  it('applyExp returns multiple events on a big jump and lands at the highest level', async () => {
    const { economy, gameState } = makeStatefulEconomy();
    const ups = await economy.applyExp(300); // crosses 100 + 250 -> lvl 3
    expect(ups.map((u) => u.to)).toEqual([2, 3]);
    expect(gameState.get().level).toBe(3);
  });

  it('grantWithExp cascades level-up grants through the same grantFn', async () => {
    const { economy, calls } = makeStatefulEconomy();
    // block_puzzle exp = 30; need much more to level up. Use expOverride.
    const result = await economy.grantWithExp(
      'block_puzzle',
      { snack: 5 },
      { expOverride: 300 },
    );
    expect(result.grant.ok).toBe(true);
    expect(result.expGained).toBe(300);
    expect(result.levelUps.map((u) => u.to)).toEqual([2, 3]);
    // 1 main grant + 2 level_up grants
    expect(calls).toHaveLength(3);
    expect(calls[0]?.source).toBe('block_puzzle');
    expect(calls[1]?.source).toBe('level_up');
    expect(calls[2]?.source).toBe('level_up');
  });

  it('grantWithExp expMultiplier scales the per-source exp', async () => {
    const { economy } = makeStatefulEconomy();
    // EXP_BY_SOURCE.quiz = 5; multiplier 4 -> 20 exp (still below lvl 2)
    const result = await economy.grantWithExp(
      'quiz',
      { magicShard: 4 },
      { expMultiplier: 4 },
    );
    expect(result.expGained).toBe(20);
    expect(result.levelUps).toEqual([]);
  });
});
