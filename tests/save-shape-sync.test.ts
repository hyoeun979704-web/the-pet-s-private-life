/* eslint-disable import/no-relative-packages */
import { describe, it, expect } from 'vitest';
import { createInitialSaveData } from '@/entities/SaveData';
import { buildInitialSave } from '../functions/src/shared/initialSave';
/* eslint-enable import/no-relative-packages */

/**
 * Returns a shape descriptor: keys of the object plus the type of each
 * leaf value. Functions and timestamps are normalized so that two
 * structurally equivalent saves produced at different times still match.
 */
function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.length === 0 ? '[]' : ['array', shapeOf(value[0])];
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    Object.keys(value)
      .sort()
      .forEach((k) => {
        out[k] = shapeOf((value as Record<string, unknown>)[k]);
      });
    return out;
  }
  return typeof value;
}

describe('save-shape-sync: client createInitialSaveData vs server buildInitialSave', () => {
  it('produces an identical structural shape', () => {
    const client = createInitialSaveData('uid', 0);
    const server = buildInitialSave('uid', 0);
    expect(shapeOf(server)).toEqual(shapeOf(client));
  });

  it('identical leaf values for static fields', () => {
    // Static values (locale, settings defaults, level, exp, resources zero)
    // must match exactly. Timestamps + the arrays-of-objects we leave to
    // the shape check above.
    const client = createInitialSaveData('uid', 0);
    const server = buildInitialSave('uid', 0) as Record<string, unknown>;

    expect(server.schemaVersion).toBe(client.schemaVersion);
    expect(server.playerId).toBe(client.playerId);
    expect(server.nickname).toBe(client.nickname);
    expect(server.level).toBe(client.level);
    expect(server.exp).toBe(client.exp);
    expect(server.gachaPity).toBe(client.gachaPity);
    expect(server.locale).toBe(client.locale);
    expect(server.resources).toEqual(client.resources);
    expect(server.settings).toEqual(client.settings);
    expect((server.dailyLimits as Record<string, unknown>).resetAtMs)
      .toBe(client.dailyLimits.resetAtMs);
  });
});
