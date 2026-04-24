import { describe, it, expect } from 'vitest';
import { createInitialSaveData } from '@/entities/SaveData';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';

function makeGameState() {
  const save = createInitialSaveData('p1', 0);
  const sys = new SaveSystem({ backend: new MemorySaveBackend(), now: () => 0, saveRetries: 1 });
  return new GameState(save, sys);
}

describe('GameState', () => {
  it('get returns the current snapshot', () => {
    const gs = makeGameState();
    expect(gs.get().playerId).toBe('p1');
  });

  it('patch updates in-memory and persists via SaveSystem', async () => {
    const gs = makeGameState();
    const res = await gs.patch((d) => ({ ...d, nickname: 'nyang' }));
    expect(res.ok).toBe(true);
    expect(gs.get().nickname).toBe('nyang');
  });

  it('subscribe fires on patch and unsubscribe stops further notifications', async () => {
    const gs = makeGameState();
    let calls = 0;
    const unsub = gs.subscribe(() => {
      calls += 1;
    });
    await gs.patch((d) => ({ ...d, nickname: 'a' }));
    await gs.patch((d) => ({ ...d, nickname: 'b' }));
    expect(calls).toBe(2);
    unsub();
    await gs.patch((d) => ({ ...d, nickname: 'c' }));
    expect(calls).toBe(2);
  });

  it('patch is a no-op when the patcher returns the same object', async () => {
    const gs = makeGameState();
    let calls = 0;
    gs.subscribe(() => {
      calls += 1;
    });
    await gs.patch((d) => d);
    expect(calls).toBe(0);
  });

  it('replace swaps the snapshot and notifies without saving', () => {
    const gs = makeGameState();
    let calls = 0;
    gs.subscribe(() => {
      calls += 1;
    });
    const swapped = { ...gs.get(), nickname: 'replaced' };
    gs.replace(swapped);
    expect(gs.get().nickname).toBe('replaced');
    expect(calls).toBe(1);
  });

  it('a listener that throws does not stop other listeners', async () => {
    const gs = makeGameState();
    let good = 0;
    gs.subscribe(() => {
      throw new Error('boom');
    });
    gs.subscribe(() => {
      good += 1;
    });
    await gs.patch((d) => ({ ...d, nickname: 'x' }));
    expect(good).toBe(1);
  });
});
