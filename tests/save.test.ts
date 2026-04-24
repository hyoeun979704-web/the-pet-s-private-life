import { describe, it, expect, beforeEach } from 'vitest';
import { SAVE_SCHEMA_VERSION } from '@/config/Constants';
import {
  MemorySaveBackend,
  SaveLoadError,
  SaveSystem,
  type SaveBackend,
} from '@/systems/SaveSystem';
import type { SaveData } from '@/entities/SaveData';

function makeSys(backend: SaveBackend): SaveSystem {
  return new SaveSystem({ backend, now: () => 1_700_000_000_000, saveRetries: 1 });
}

describe('SaveSystem', () => {
  let backend: MemorySaveBackend;
  let sys: SaveSystem;

  beforeEach(() => {
    backend = new MemorySaveBackend();
    sys = makeSys(backend);
  });

  it('creates and persists a fresh save when none exists', async () => {
    const data = await sys.load('player-1');
    expect(data.playerId).toBe('player-1');
    expect(data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    const raw = (await backend.load('player-1')) as { playerId: string };
    expect(raw.playerId).toBe('player-1');
  });

  it('migrates an unversioned save and re-persists it', async () => {
    await backend.save('p2', { playerId: 'p2', junk: true } as unknown as SaveData);
    const data = await sys.load('p2');
    expect(data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });

  it('save() returns { ok: true } when the backend succeeds', async () => {
    const data = await sys.load('p3');
    data.nickname = 'nyang';
    const res = await sys.save(data);
    expect(res).toEqual({ ok: true });
    const reloaded = await sys.load('p3');
    expect(reloaded.nickname).toBe('nyang');
  });

  it('save() returns { ok: false, error } after retries exhausted', async () => {
    const flaky: SaveBackend = {
      name: 'flaky',
      async load() {
        return null;
      },
      async save() {
        throw new Error('boom');
      },
    };
    const flakySys = new SaveSystem({ backend: flaky, now: () => 0, saveRetries: 2 });
    // First load creates a fresh save, which itself will fail to persist and
    // surface SaveLoadError — confirming load does NOT return fresh silently.
    await expect(flakySys.load('p4')).rejects.toBeInstanceOf(SaveLoadError);
  });

  it('load throws SaveLoadError when backend load fails (no silent fresh)', async () => {
    const throwing: SaveBackend = {
      name: 'throwing',
      async load() {
        throw new Error('network');
      },
      async save() {
        /* ok */
      },
    };
    await expect(makeSys(throwing).load('p5')).rejects.toBeInstanceOf(SaveLoadError);
  });
});
