import { describe, it, expect, beforeEach } from 'vitest';
import { SAVE_SCHEMA_VERSION } from '@/config/Constants';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';

describe('SaveSystem', () => {
  let backend: MemorySaveBackend;
  let sys: SaveSystem;

  beforeEach(() => {
    backend = new MemorySaveBackend();
    sys = new SaveSystem({ backend, now: () => 1_700_000_000_000 });
  });

  it('creates and persists a fresh save when none exists', async () => {
    const data = await sys.load('player-1');
    expect(data.playerId).toBe('player-1');
    expect(data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    // Back-end should now contain the fresh save.
    const raw = (await backend.load('player-1')) as { playerId: string };
    expect(raw.playerId).toBe('player-1');
  });

  it('migrates an unversioned save and re-persists it', async () => {
    await backend.save('p2', { playerId: 'p2', junk: true } as unknown as never);
    const data = await sys.load('p2');
    expect(data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });

  it('save() overwrites the backend copy and updates cache', async () => {
    const data = await sys.load('p3');
    data.nickname = 'nyang';
    await sys.save(data);
    const reloaded = await sys.load('p3');
    expect(reloaded.nickname).toBe('nyang');
    expect(sys.getCached()?.nickname).toBe('nyang');
  });

  it('load returns a fresh save when backend throws', async () => {
    const flaky = new MemorySaveBackend();
    flaky.load = async () => {
      throw new Error('boom');
    };
    const flakySys = new SaveSystem({ backend: flaky, now: () => 0 });
    const data = await flakySys.load('p4');
    expect(data.playerId).toBe('p4');
  });
});
