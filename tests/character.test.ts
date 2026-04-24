import { describe, it, expect, beforeEach } from 'vitest';
import type { CharacterDef } from '@/entities/Character';
import { CharacterSystem } from '@/systems/CharacterSystem';
import { FatigueSystem } from '@/systems/FatigueSystem';
import { createActor, stepActor, TIRED_THRESHOLD } from '@/entities/CharacterActor';

const CAT: CharacterDef = {
  id: 'cat_test',
  nameKey: 'char.cat_test.name',
  species: 'cat',
  breed: 'test',
  grade: 'normal',
  fatigueMax: 10,
  fatigueRecoveryBonus: 0,
  tmiKey: 'char.cat_test.tmi',
  personalityKey: 'char.cat_test.personality',
  colorHex: '#FFC8DD',
};

const DOG_RARE: CharacterDef = {
  ...CAT,
  id: 'dog_rare',
  species: 'dog',
  grade: 'rare',
  fatigueMax: 12,
  fatigueRecoveryBonus: 1,
};

describe('CharacterSystem', () => {
  it('acquire adds to dex and initializes fatigue to max', () => {
    const sys = new CharacterSystem([CAT], { now: () => 1_000 });
    const owned = sys.acquire(CAT.id);
    expect(owned).not.toBeNull();
    expect(owned?.fatigue).toBe(CAT.fatigueMax);
    expect(sys.isOwned(CAT.id)).toBe(true);
    expect(sys.dexProgress()).toEqual({ owned: 1, total: 1 });
  });

  it('acquire is idempotent', () => {
    const sys = new CharacterSystem([CAT]);
    sys.acquire(CAT.id);
    sys.acquire(CAT.id);
    expect(sys.getOwned()).toHaveLength(1);
  });
});

describe('FatigueSystem', () => {
  let cs: CharacterSystem;
  let fs: FatigueSystem;
  let clock = 1_000;

  beforeEach(() => {
    clock = 1_000;
    cs = new CharacterSystem([CAT, DOG_RARE], { now: () => clock });
    cs.acquire(CAT.id);
    cs.acquire(DOG_RARE.id);
    // HACK: use internal map for FatigueSystem owned param
    const owned = new Map(cs.getOwned().map((o) => [o.defId, { ...o }]));
    fs = new FatigueSystem([CAT, DOG_RARE], owned, () => clock);
  });

  it('consume subtracts the correct cost', () => {
    const res = fs.consume(CAT.id, 'blockPuzzle');
    expect(res.ok).toBe(true);
    expect(res.fatigueAfter).toBe(CAT.fatigueMax - 1);
  });

  it('consume refuses when not enough fatigue', () => {
    // Drain cat to 3 via three blocks and a quiz (10 -> 9 -> 8 -> 7 -> 3)
    fs.consume(CAT.id, 'blockPuzzle');
    fs.consume(CAT.id, 'blockPuzzle');
    fs.consume(CAT.id, 'blockPuzzle');
    fs.consume(CAT.id, 'quiz');
    const res = fs.consume(CAT.id, 'quiz'); // need 4, have 3
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('not_enough_fatigue');
  });

  it('restoreByAd caps at fatigueMax', () => {
    fs.consume(CAT.id, 'blockPuzzle');
    fs.consume(CAT.id, 'blockPuzzle');
    const res = fs.restoreByAd(CAT.id);
    expect(res.fatigueAfter).toBeLessThanOrEqual(CAT.fatigueMax);
  });

  it('tickRecovery adds 1 plus bonus per recoveryMinutes', () => {
    // Drain to 5, then advance 60 minutes
    fs.consume(DOG_RARE.id, 'blockPuzzle');
    fs.consume(DOG_RARE.id, 'quiz');
    fs.consume(DOG_RARE.id, 'quiz');
    // 12 - 1 - 4 - 4 = 3
    clock += 60 * 60_000; // 60 min -> 2 ticks of 30 min
    const res = fs.tickRecovery(DOG_RARE.id);
    expect(res.ok).toBe(true);
    // 2 ticks * (1 + rare bonus 1) = +4, capped at 12
    expect(res.fatigueAfter).toBe(Math.min(DOG_RARE.fatigueMax, 3 + 4));
  });
});

describe('CharacterActor', () => {
  it('enters sleep when fatigue is 0', () => {
    const actor = createActor('x', { gx: 0, gy: 0 }, 0);
    const env = {
      roomW: 5,
      roomH: 5,
      now: () => 5_000,
      rand: () => 0.5,
      fatigueOf: () => 0,
    };
    const next = stepActor(actor, env);
    expect(next.mood).toBe('sleep');
  });

  it('enters tired when fatigue <= threshold but > 0', () => {
    const actor = createActor('x', { gx: 0, gy: 0 }, 0);
    const env = {
      roomW: 5,
      roomH: 5,
      now: () => 5_000,
      rand: () => 0.5,
      fatigueOf: () => TIRED_THRESHOLD,
    };
    const next = stepActor(actor, env);
    expect(next.mood).toBe('tired');
  });

  it('picks a wander target when idle and decision time reached', () => {
    const actor = createActor('x', { gx: 2, gy: 2 }, 0);
    const env = {
      roomW: 5,
      roomH: 5,
      now: () => 1,
      rand: () => 0,
      fatigueOf: () => 5,
    };
    const next = stepActor(actor, env);
    expect(next.mood).toBe('wander');
    expect(next.targetPos).toEqual({ gx: 0, gy: 0 });
  });

  it('moves one tile toward target while wandering', () => {
    const actor = {
      defId: 'x',
      pos: { gx: 0, gy: 0 },
      mood: 'wander' as const,
      targetPos: { gx: 2, gy: 0 },
      nextDecisionAt: 0,
    };
    const env = {
      roomW: 5,
      roomH: 5,
      now: () => 1,
      rand: () => 0.5,
      fatigueOf: () => 5,
    };
    const next = stepActor(actor, env);
    expect(next.pos).toEqual({ gx: 1, gy: 0 });
  });
});
