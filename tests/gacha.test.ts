import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialSaveData } from '@/entities/SaveData';
import { GachaSystem } from '@/systems/GachaSystem';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';

function makeGameState() {
  const sys = new SaveSystem({ backend: new MemorySaveBackend(), now: () => 0, saveRetries: 1 });
  const initial = createInitialSaveData('p1', 0);
  initial.resources.magicStone = 10; // enough for several rolls
  return new GameState(initial, sys);
}

describe('GachaSystem.localRoll (dev fallback)', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = makeGameState();
  });

  it('canRoll false when out of magicStone', () => {
    const out = makeGameState();
    out.replace({ ...out.get(), resources: { ...out.get().resources, magicStone: 0 } });
    const sys = new GachaSystem({ gameState: out, rand: () => 0 });
    expect(sys.canRoll()).toBe(false);
  });

  it('returns not-enough-stone when wallet empty', async () => {
    const out = makeGameState();
    out.replace({ ...out.get(), resources: { ...out.get().resources, magicStone: 0 } });
    const sys = new GachaSystem({ gameState: out, rand: () => 0 });
    const res = await sys.roll();
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('not-enough-stone');
  });

  it('rand near 0 picks legendary', async () => {
    const sys = new GachaSystem({ gameState, rand: () => 0.001 });
    const res = await sys.roll();
    expect(res.ok).toBe(true);
    expect(res.grade).toBe('legendary');
  });

  it('rand 0.5 picks normal', async () => {
    const sys = new GachaSystem({ gameState, rand: () => 0.5 });
    const res = await sys.roll();
    expect(res.grade).toBe('normal');
  });

  it('first roll deducts 1 magicStone and adds character to dex', async () => {
    const sys = new GachaSystem({ gameState, rand: () => 0.5 });
    const before = gameState.get().resources.magicStone;
    const res = await sys.roll();
    expect(res.isNew).toBe(true);
    expect(gameState.get().resources.magicStone).toBe(before - 1);
    expect(gameState.get().characters).toHaveLength(1);
  });

  it('duplicate roll converts to magicShard', async () => {
    // Force same defId both rolls — rand=0.5 picks normal, then pickFromPool
    // takes idx = Math.floor(0.5 * 6) = 3 → 'dog_pomeranian'.
    const sys = new GachaSystem({ gameState, rand: () => 0.5 });
    await sys.roll();
    const before = gameState.get().resources.magicShard;
    const res = await sys.roll();
    expect(res.isNew).toBe(false);
    expect(res.shardGain).toBeGreaterThan(0);
    expect(gameState.get().resources.magicShard).toBeGreaterThan(before);
  });

  it('pity counter increments on normal and resets on rare/legendary', async () => {
    const normalSys = new GachaSystem({ gameState, rand: () => 0.5 });
    await normalSys.roll();
    expect(gameState.get().gachaPity).toBe(1);

    const legSys = new GachaSystem({ gameState, rand: () => 0.001 });
    await legSys.roll();
    expect(gameState.get().gachaPity).toBe(0);
  });

  it('disclosure() exposes cost/pity/rates/pool for the rates scene', () => {
    const d = GachaSystem.disclosure();
    expect(d.cost).toBe(1);
    expect(d.pity).toBe(20);
    expect(d.rates).toEqual({ normal: 0.7, rare: 0.25, legendary: 0.05 });
    expect(d.pool.legendary.length).toBeGreaterThan(0);
  });
});

describe('GachaSystem with injected server rollFn', () => {
  it('applies server result locally (deducts stone, adds character)', async () => {
    const gameState = makeGameState();
    const sys = new GachaSystem({
      gameState,
      rollFn: async () => ({
        ok: true,
        grade: 'rare',
        defId: 'cat_scottish_fold',
        isNew: true,
        shardGain: 0,
        pity: 0,
      }),
    });
    const before = gameState.get().resources.magicStone;
    const res = await sys.roll();
    expect(res.ok).toBe(true);
    expect(gameState.get().resources.magicStone).toBe(before - 1);
    expect(gameState.get().characters[0]?.defId).toBe('cat_scottish_fold');
  });

  it('surfaces offline reason when server rollFn throws', async () => {
    const gameState = makeGameState();
    const sys = new GachaSystem({
      gameState,
      rollFn: async () => {
        throw new Error('network');
      },
    });
    const res = await sys.roll();
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('offline');
    // No state mutation when server fails.
    expect(gameState.get().resources.magicStone).toBe(10);
  });
});
