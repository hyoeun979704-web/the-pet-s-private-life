import type { SaveData } from '@/entities/SaveData';
import { createInitialSaveData } from '@/entities/SaveData';
import { migrate } from '@/systems/MigrationSystem';
import { logger } from '@/utils/Logger';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Backend contract:
 * - `load` returns `null` ONLY when the player has no save yet.
 * - `load` MUST throw on network/IO/parse errors so SaveSystem can tell
 *   "new player" from "transient failure" and avoid overwriting existing
 *   data with a fresh save.
 */
export interface SaveBackend {
  name: string;
  load(playerId: string): Promise<unknown | null>;
  save(playerId: string, data: SaveData): Promise<void>;
}

export interface SaveSystemOptions {
  backend: SaveBackend;
  now?: () => number;
  /** Max retries for save() before surfacing failure to the caller. */
  saveRetries?: number;
}

export type SaveResult =
  | { ok: true }
  | { ok: false; error: unknown };

export class SaveLoadError extends Error {
  constructor(message: string, public readonly cause: unknown) {
    super(message);
    this.name = 'SaveLoadError';
  }
}

export class SaveSystem {
  private readonly backend: SaveBackend;

  private readonly now: () => number;

  private readonly saveRetries: number;

  private cache: SaveData | null = null;

  constructor(options: SaveSystemOptions) {
    this.backend = options.backend;
    this.now = options.now ?? (() => Date.now());
    this.saveRetries = options.saveRetries ?? 3;
  }

  /**
   * Loads the player's save. Throws SaveLoadError on backend failure so the
   * caller can route to the offline flow instead of silently overwriting.
   */
  async load(playerId: string): Promise<SaveData> {
    let raw: unknown | null;
    try {
      raw = await this.backend.load(playerId);
    } catch (err) {
      logger.error('save.load.failed', err);
      throw new SaveLoadError('save backend load failed', err);
    }
    if (!raw) {
      const fresh = createInitialSaveData(playerId, this.now());
      this.cache = fresh;
      const res = await this.save(fresh);
      if (!res.ok) throw new SaveLoadError('could not persist fresh save', res.error);
      return fresh;
    }
    const migrated = migrate(raw as Record<string, unknown>);
    // playerId is authoritative from the auth layer; any migrator that
    // renames/moves it must set the new field explicitly.
    migrated.data.playerId = playerId;
    this.cache = migrated.data;
    if (migrated.applied.length > 0) {
      logger.info('save.migrated', { from: migrated.fromVersion, to: migrated.toVersion });
      const res = await this.save(migrated.data);
      if (!res.ok) throw new SaveLoadError('could not persist migrated save', res.error);
    }
    return migrated.data;
  }

  /**
   * Persists `data` via the backend with up to `saveRetries` attempts and
   * exponential backoff (200/400/800ms). Returns a SaveResult instead of
   * throwing so callers can decide how to notify the user.
   */
  async save(data: SaveData): Promise<SaveResult> {
    this.cache = data;
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < this.saveRetries; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await this.backend.save(data.playerId, data);
        return { ok: true };
      } catch (err) {
        lastErr = err;
        logger.warn('save.save.retry', { attempt: attempt + 1, err: String(err) });
        if (attempt < this.saveRetries - 1) {
          // eslint-disable-next-line no-await-in-loop
          await wait(200 * 2 ** attempt);
        }
      }
    }
    logger.error('save.save.failed', lastErr);
    return { ok: false, error: lastErr };
  }

  getCached(): SaveData | null {
    return this.cache;
  }
}

// -----------------------------------------------------------------------------
// Built-in backends
// -----------------------------------------------------------------------------

export class MemorySaveBackend implements SaveBackend {
  name = 'memory';

  private readonly store: Map<string, unknown> = new Map();

  async load(playerId: string): Promise<unknown | null> {
    return this.store.get(playerId) ?? null;
  }

  async save(playerId: string, data: SaveData): Promise<void> {
    this.store.set(playerId, deepClone(data) as unknown);
  }
}

export class LocalStorageSaveBackend implements SaveBackend {
  name = 'localStorage';

  constructor(private readonly prefix = 'tpp:save:') {}

  async load(playerId: string): Promise<unknown | null> {
    if (typeof localStorage === 'undefined') return null;
    const key = this.prefix + playerId;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as unknown;
    } catch (err) {
      // Corrupted entry — wipe it so we don't re-trigger every load.
      logger.error('save.localStorage.corrupt', { key, err: String(err) });
      localStorage.removeItem(key);
      return null;
    }
  }

  async save(playerId: string, data: SaveData): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.prefix + playerId, JSON.stringify(data));
  }
}
