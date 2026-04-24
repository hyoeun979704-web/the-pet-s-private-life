import type { SaveData } from '@/entities/SaveData';
import { createInitialSaveData } from '@/entities/SaveData';
import { migrate } from '@/systems/MigrationSystem';
import { logger } from '@/utils/Logger';

export interface SaveBackend {
  name: string;
  load(playerId: string): Promise<unknown | null>;
  save(playerId: string, data: SaveData): Promise<void>;
}

export interface SaveSystemOptions {
  backend: SaveBackend;
  now?: () => number;
}

export class SaveSystem {
  private readonly backend: SaveBackend;

  private readonly now: () => number;

  private cache: SaveData | null = null;

  constructor(options: SaveSystemOptions) {
    this.backend = options.backend;
    this.now = options.now ?? (() => Date.now());
  }

  async load(playerId: string): Promise<SaveData> {
    const raw = await this.safeLoad(playerId);
    if (!raw) {
      const fresh = createInitialSaveData(playerId, this.now());
      this.cache = fresh;
      await this.safeSave(playerId, fresh);
      return fresh;
    }
    const migrated = migrate(raw as Record<string, unknown>);
    migrated.data.playerId = playerId;
    this.cache = migrated.data;
    if (migrated.applied.length > 0) {
      logger.info('save.migrated', { from: migrated.fromVersion, to: migrated.toVersion });
      await this.safeSave(playerId, migrated.data);
    }
    return migrated.data;
  }

  async save(data: SaveData): Promise<void> {
    this.cache = data;
    await this.safeSave(data.playerId, data);
  }

  getCached(): SaveData | null {
    return this.cache;
  }

  private async safeLoad(playerId: string): Promise<unknown | null> {
    try {
      return await this.backend.load(playerId);
    } catch (err) {
      logger.error('save.load.failed', err);
      return null;
    }
  }

  private async safeSave(playerId: string, data: SaveData): Promise<void> {
    try {
      await this.backend.save(playerId, data);
    } catch (err) {
      logger.error('save.save.failed', err);
    }
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
    // structuredClone keeps the in-memory copy immutable from outside edits.
    this.store.set(playerId, JSON.parse(JSON.stringify(data)) as unknown);
  }
}

export class LocalStorageSaveBackend implements SaveBackend {
  name = 'localStorage';

  constructor(private readonly prefix = 'tpp:save:') {}

  async load(playerId: string): Promise<unknown | null> {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.prefix + playerId);
    return raw ? (JSON.parse(raw) as unknown) : null;
  }

  async save(playerId: string, data: SaveData): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.prefix + playerId, JSON.stringify(data));
  }
}
