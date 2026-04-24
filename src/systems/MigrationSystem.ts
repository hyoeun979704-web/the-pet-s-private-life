import { SAVE_SCHEMA_VERSION } from '@/config/Constants';
import type { SaveData } from '@/entities/SaveData';

export interface MigrationResult {
  data: SaveData;
  fromVersion: number;
  toVersion: number;
  applied: number[];
}

export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly fromVersion: number,
    public readonly targetStep: number,
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSave = { schemaVersion?: number } & Record<string, any>;
type Migrator = (data: LooseSave) => LooseSave;

/**
 * Registry of forward migrators. Key N migrates from (N-1) -> N.
 * Add an entry here EVERY TIME SAVE_SCHEMA_VERSION is bumped.
 */
const MIGRATIONS: Record<number, Migrator> = {
  // Example for v1 -> v2 (placeholder; actual v2 migration TBD):
  // 2: (data) => ({
  //   ...data,
  //   resources: { ...(data.resources as object), magicShard: 0 },
  // }),
};

export function migrate(raw: LooseSave): MigrationResult {
  const fromVersion = Number.isInteger(raw.schemaVersion) ? (raw.schemaVersion as number) : 0;
  if (fromVersion > SAVE_SCHEMA_VERSION) {
    throw new MigrationError(
      `save is from a newer schema (v${fromVersion}) than this client (v${SAVE_SCHEMA_VERSION})`,
      fromVersion,
      SAVE_SCHEMA_VERSION,
    );
  }

  let current: LooseSave = raw;
  const applied: number[] = [];
  for (let next = fromVersion + 1; next <= SAVE_SCHEMA_VERSION; next += 1) {
    const migrator = MIGRATIONS[next];
    if (migrator) {
      current = migrator(current);
      applied.push(next);
    } else if (fromVersion > 0) {
      // Migrating UP from an existing version and hitting a gap is a bug.
      throw new MigrationError(`no migrator registered for step ${next}`, fromVersion, next);
    }
    // fromVersion === 0 with no migrator: just stamp the schema and move on.
  }

  current.schemaVersion = SAVE_SCHEMA_VERSION;
  return {
    data: current as unknown as SaveData,
    fromVersion,
    toVersion: SAVE_SCHEMA_VERSION,
    applied,
  };
}

/**
 * Convenience: returns true if `raw` is at the current schema version.
 */
export function isCurrent(raw: LooseSave): boolean {
  return raw.schemaVersion === SAVE_SCHEMA_VERSION;
}

/**
 * Exposed for tests: read-only access to the registered migrators.
 */
export function registeredSteps(): number[] {
  return Object.keys(MIGRATIONS)
    .map((n) => Number.parseInt(n, 10))
    .sort((a, b) => a - b);
}
