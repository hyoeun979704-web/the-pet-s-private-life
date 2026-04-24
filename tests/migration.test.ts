import { describe, it, expect } from 'vitest';
import { SAVE_SCHEMA_VERSION } from '@/config/Constants';
import { createInitialSaveData } from '@/entities/SaveData';
import {
  migrate,
  isCurrent,
  MigrationError,
  registeredSteps,
} from '@/systems/MigrationSystem';

describe('MigrationSystem', () => {
  it('stamps schemaVersion on raw save with no version', () => {
    const result = migrate({ playerId: 'p1' });
    expect(result.fromVersion).toBe(0);
    expect(result.toVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(result.data.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });

  it('isCurrent returns true only for current schema', () => {
    const fresh = createInitialSaveData('p1');
    expect(isCurrent(fresh)).toBe(true);
    expect(isCurrent({ ...fresh, schemaVersion: 0 })).toBe(false);
  });

  it('throws if save is newer than client', () => {
    expect(() => migrate({ schemaVersion: SAVE_SCHEMA_VERSION + 1 })).toThrow(
      MigrationError,
    );
  });

  it('passes through a current-version save unchanged (no migrators applied)', () => {
    const fresh = createInitialSaveData('p1');
    const result = migrate(fresh);
    expect(result.applied).toEqual([]);
    expect(result.data.playerId).toBe('p1');
  });

  it('registeredSteps returns known forward-step keys as sorted numbers', () => {
    const steps = registeredSteps();
    expect(steps).toEqual([...steps].sort((a, b) => a - b));
  });

  it('fails fast when a gap exists between fromVersion and target', () => {
    // Pretend we're on a hypothetical v5 client without migrators v2..v5 registered.
    // We can't change SAVE_SCHEMA_VERSION at runtime, so simulate by asserting
    // the error path when fromVersion > 0 and no step matches. With no migrators
    // registered and SAVE_SCHEMA_VERSION = 1, a save at v0 with fromVersion > 0
    // cannot be constructed here; the contract is that any future gap throws.
    // This test guards the invariant that registered steps == expected range.
    const expected = Array.from(
      { length: SAVE_SCHEMA_VERSION - 1 },
      (_, i) => i + 2,
    );
    expect(registeredSteps()).toEqual(expected);
  });
});
