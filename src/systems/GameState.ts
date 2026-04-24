import type { SaveData } from '@/entities/SaveData';
import type { SaveResult, SaveSystem } from '@/systems/SaveSystem';

export type Unsubscribe = () => void;

/**
 * Central, single-writer wrapper around SaveData. Callers mutate the save
 * via `patch(fn)` which atomically updates the in-memory copy, notifies
 * subscribers, and then writes through SaveSystem (which retries).
 *
 * Reads never go through async — `get()` is synchronous and always returns
 * the current snapshot.
 */
export class GameState {
  private save: SaveData;

  private readonly listeners: Set<() => void> = new Set();

  private readonly saveSystem: SaveSystem;

  constructor(initial: SaveData, saveSystem: SaveSystem) {
    this.save = initial;
    this.saveSystem = saveSystem;
  }

  get(): SaveData {
    return this.save;
  }

  subscribe(listener: () => void): Unsubscribe {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Apply a pure transformation to the save. The transformer MUST return
   * a new object; in-place mutation breaks change detection.
   */
  async patch(patcher: (draft: SaveData) => SaveData): Promise<SaveResult> {
    const next = patcher(this.save);
    if (next === this.save) {
      return { ok: true }; // No-op
    }
    this.save = next;
    this.notify();
    return this.saveSystem.save(next);
  }

  /**
   * Replaces the entire save (used after a server-side mutation re-reads
   * the doc). Notifies subscribers but does NOT re-save.
   */
  replace(next: SaveData): void {
    if (next === this.save) return;
    this.save = next;
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // A buggy listener must not break the broadcast loop.
      }
    });
  }
}
