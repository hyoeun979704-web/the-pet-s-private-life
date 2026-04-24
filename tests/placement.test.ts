import { describe, it, expect, beforeEach } from 'vitest';
import { PlacementSystem } from '@/systems/PlacementSystem';
import type { FurnitureDef } from '@/entities/Furniture';
import type { RoomDef } from '@/entities/Room';

const ROOM: RoomDef = {
  id: 'room_living',
  nameKey: 'rooms.living',
  gridWidth: 5,
  gridHeight: 5,
  unlockLevel: 1,
};

const RUG: FurnitureDef = {
  id: 'furn_rug',
  nameKey: 'f.rug',
  category: 'floor',
  grade: 'normal',
  footprintW: 2,
  footprintH: 2,
  cozyScore: 3,
  colorHex: '#FFC8DD',
};

const LAMP: FurnitureDef = {
  id: 'furn_lamp',
  nameKey: 'f.lamp',
  category: 'decor',
  grade: 'rare',
  footprintW: 1,
  footprintH: 1,
  cozyScore: 5,
  colorHex: '#A0C4FF',
};

describe('PlacementSystem', () => {
  let sys: PlacementSystem;

  beforeEach(() => {
    sys = new PlacementSystem(ROOM, [RUG, LAMP]);
    sys.grantToInventory(RUG.id, 3);
    sys.grantToInventory(LAMP.id, 2);
  });

  it('places an item when the spot is free and in bounds', () => {
    const res = sys.place(RUG.id, { gx: 0, gy: 0 });
    expect(res.ok).toBe(true);
    expect(sys.getPlaced()).toHaveLength(1);
    expect(sys.getInventoryCount(RUG.id)).toBe(2);
  });

  it('rejects placement out of bounds', () => {
    const res = sys.place(RUG.id, { gx: 4, gy: 4 }); // 2x2 would extend to (5,5)
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('out_of_bounds');
  });

  it('rejects placement when overlapping another item', () => {
    sys.place(RUG.id, { gx: 0, gy: 0 });
    const res = sys.place(LAMP.id, { gx: 1, gy: 1 });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('overlap');
  });

  it('rejects placement when inventory empty', () => {
    const empty = new PlacementSystem(ROOM, [RUG]);
    const res = empty.place(RUG.id, { gx: 0, gy: 0 });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('not_in_inventory');
  });

  it('remove returns item to inventory', () => {
    sys.place(RUG.id, { gx: 0, gy: 0 });
    const placed = sys.getPlaced()[0];
    if (!placed) throw new Error('expected a placed item');
    sys.remove(placed.instanceId);
    expect(sys.getPlaced()).toHaveLength(0);
    expect(sys.getInventoryCount(RUG.id)).toBe(3);
  });

  it('rotate cycles 0 -> 90 -> 180 -> 270 -> 0', () => {
    sys.place(LAMP.id, { gx: 0, gy: 0 });
    const p = sys.getPlaced()[0];
    if (!p) throw new Error('expected a placed item');
    sys.rotate(p.instanceId);
    expect(sys.getPlaced()[0]?.rotation).toBe(90);
    sys.rotate(p.instanceId);
    sys.rotate(p.instanceId);
    sys.rotate(p.instanceId);
    expect(sys.getPlaced()[0]?.rotation).toBe(0);
  });

  it('undo reverts the last placement', () => {
    sys.place(RUG.id, { gx: 0, gy: 0 });
    const ok = sys.undo();
    expect(ok).toBe(true);
    expect(sys.getPlaced()).toHaveLength(0);
    expect(sys.getInventoryCount(RUG.id)).toBe(3);
  });

  it('undo only retains depth=1 (PLACEMENT_CONFIG.undoDepth)', () => {
    sys.place(RUG.id, { gx: 0, gy: 0 });
    sys.place(LAMP.id, { gx: 3, gy: 0 });
    // undoDepth=1, so only the lamp place is undoable
    expect(sys.undo()).toBe(true); // undoes lamp
    expect(sys.getPlaced()).toHaveLength(1);
    expect(sys.undo()).toBe(false); // rug place already dropped from stack
  });
});
