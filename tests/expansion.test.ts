import { describe, it, expect } from 'vitest';
import type { Resources } from '@/entities/SaveData';
import type { RoomDef, RoomState } from '@/entities/Room';
import { availableRooms } from '@/systems/ExpansionSystem';

const LIVING: RoomDef = {
  id: 'room_living',
  nameKey: 'rooms.living',
  gridWidth: 8,
  gridHeight: 8,
  unlockLevel: 1,
  unlockCost: {},
};

const BEDROOM: RoomDef = {
  id: 'room_bedroom',
  nameKey: 'rooms.bedroom',
  gridWidth: 6,
  gridHeight: 6,
  unlockLevel: 4,
  unlockCost: { starDust: 200 },
};

const EMPTY_WALLET: Resources = {
  snack: 0,
  starDust: 0,
  magicStone: 0,
  magicShard: 0,
  gachaTicket: 0,
};

describe('ExpansionSystem', () => {
  it('reports already-owned rooms as unlocked', () => {
    const owned: RoomState[] = [{ id: 'room_living', placed: [] }];
    const res = availableRooms([LIVING, BEDROOM], owned, 1, EMPTY_WALLET);
    expect(res[0]?.status).toBe('unlocked');
  });

  it('locks rooms behind level even if cost is affordable', () => {
    const res = availableRooms([BEDROOM], [], 3, { ...EMPTY_WALLET, starDust: 500 });
    expect(res[0]?.status).toBe('level-locked');
  });

  it('reports cost-locked when level is met but resources are short', () => {
    const res = availableRooms([BEDROOM], [], 5, { ...EMPTY_WALLET, starDust: 150 });
    expect(res[0]?.status).toBe('cost-locked');
    expect(res[0]?.missing).toEqual({ starDust: 50 });
  });

  it('reports ready-to-unlock when level + resources both satisfy', () => {
    const res = availableRooms([BEDROOM], [], 4, { ...EMPTY_WALLET, starDust: 200 });
    expect(res[0]?.status).toBe('ready-to-unlock');
    expect(res[0]?.missing).toBeUndefined();
  });

  it('treats empty cost as automatically affordable', () => {
    const res = availableRooms([LIVING], [], 1, EMPTY_WALLET);
    expect(res[0]?.status).toBe('ready-to-unlock');
  });
});
