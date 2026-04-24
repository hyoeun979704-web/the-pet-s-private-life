import { PLACEMENT_CONFIG } from '@/config/Constants';
import {
  rotatedFootprint,
  type FurnitureDef,
  type PlacedFurniture,
  type Rotation,
} from '@/entities/Furniture';
import type { RoomDef } from '@/entities/Room';
import { isInsideRoom, rectCells, type GridPos } from '@/utils/IsometricUtil';

export interface PlacementResult {
  ok: boolean;
  reason?: 'out_of_bounds' | 'overlap' | 'not_in_inventory' | 'not_found' | 'storage_full';
}

type Action =
  | { kind: 'place'; snapshot: PlacedFurniture }
  | { kind: 'remove'; snapshot: PlacedFurniture }
  | { kind: 'rotate'; instanceId: string; prev: Rotation; next: Rotation };

export class PlacementSystem {
  private readonly room: RoomDef;

  private readonly defs: Map<string, FurnitureDef>;

  private placed: Map<string, PlacedFurniture> = new Map();

  private inventory: Map<string, number> = new Map();

  private undoStack: Action[] = [];

  private nextInstanceSeq = 1;

  constructor(room: RoomDef, defs: FurnitureDef[]) {
    this.room = room;
    this.defs = new Map(defs.map((d) => [d.id, d]));
  }

  getRoom(): RoomDef {
    return this.room;
  }

  getPlaced(): PlacedFurniture[] {
    return Array.from(this.placed.values());
  }

  getInventoryCount(defId: string): number {
    return this.inventory.get(defId) ?? 0;
  }

  grantToInventory(defId: string, qty = 1): PlacementResult {
    if (!this.defs.has(defId)) return { ok: false, reason: 'not_found' };
    const current = this.getInventoryCount(defId);
    if (current + qty > PLACEMENT_CONFIG.storageSlots) {
      return { ok: false, reason: 'storage_full' };
    }
    this.inventory.set(defId, current + qty);
    return { ok: true };
  }

  place(defId: string, pos: GridPos, rotation: Rotation = 0): PlacementResult {
    if ((this.inventory.get(defId) ?? 0) <= 0) {
      return { ok: false, reason: 'not_in_inventory' };
    }
    const validation = this.validate(defId, pos, rotation);
    if (!validation.ok) return validation;

    const instance: PlacedFurniture = {
      instanceId: `inst_${this.nextInstanceSeq}`,
      defId,
      gx: pos.gx,
      gy: pos.gy,
      rotation,
    };
    this.nextInstanceSeq += 1;

    this.placed.set(instance.instanceId, instance);
    this.inventory.set(defId, (this.inventory.get(defId) ?? 0) - 1);
    this.recordAction({ kind: 'place', snapshot: instance });
    return { ok: true };
  }

  remove(instanceId: string): PlacementResult {
    const inst = this.placed.get(instanceId);
    if (!inst) return { ok: false, reason: 'not_found' };
    const current = this.inventory.get(inst.defId) ?? 0;
    if (current + 1 > PLACEMENT_CONFIG.storageSlots) {
      return { ok: false, reason: 'storage_full' };
    }
    this.placed.delete(instanceId);
    this.inventory.set(inst.defId, current + 1);
    this.recordAction({ kind: 'remove', snapshot: inst });
    return { ok: true };
  }

  rotate(instanceId: string): PlacementResult {
    const inst = this.placed.get(instanceId);
    if (!inst) return { ok: false, reason: 'not_found' };
    const prev = inst.rotation;
    const next = ((prev + 90) % 360) as Rotation;

    // Temporarily remove so collision check ignores self.
    this.placed.delete(instanceId);
    const validation = this.validate(inst.defId, { gx: inst.gx, gy: inst.gy }, next);
    if (!validation.ok) {
      this.placed.set(instanceId, inst);
      return validation;
    }
    this.placed.set(instanceId, { ...inst, rotation: next });
    this.recordAction({ kind: 'rotate', instanceId, prev, next });
    return { ok: true };
  }

  canPlace(defId: string, pos: GridPos, rotation: Rotation = 0): PlacementResult {
    return this.validate(defId, pos, rotation);
  }

  undo(): boolean {
    const action = this.undoStack.pop();
    if (!action) return false;
    if (action.kind === 'place') {
      this.placed.delete(action.snapshot.instanceId);
      this.inventory.set(
        action.snapshot.defId,
        (this.inventory.get(action.snapshot.defId) ?? 0) + 1,
      );
    } else if (action.kind === 'remove') {
      this.placed.set(action.snapshot.instanceId, action.snapshot);
      this.inventory.set(
        action.snapshot.defId,
        Math.max(0, (this.inventory.get(action.snapshot.defId) ?? 0) - 1),
      );
    } else if (action.kind === 'rotate') {
      const inst = this.placed.get(action.instanceId);
      if (inst) this.placed.set(action.instanceId, { ...inst, rotation: action.prev });
    }
    return true;
  }

  private validate(defId: string, pos: GridPos, rotation: Rotation): PlacementResult {
    const def = this.defs.get(defId);
    if (!def) return { ok: false, reason: 'not_found' };
    const { w, h } = rotatedFootprint(def, rotation);
    if (!this.fitsRoom(pos, w, h)) return { ok: false, reason: 'out_of_bounds' };
    if (!PLACEMENT_CONFIG.allowOverlap && this.hasCollision(pos, w, h)) {
      return { ok: false, reason: 'overlap' };
    }
    return { ok: true };
  }

  private recordAction(action: Action): void {
    this.undoStack.push(action);
    while (this.undoStack.length > PLACEMENT_CONFIG.undoDepth) {
      this.undoStack.shift();
    }
  }

  private fitsRoom(pos: GridPos, w: number, h: number): boolean {
    return (
      isInsideRoom(pos, this.room.gridWidth, this.room.gridHeight) &&
      isInsideRoom(
        { gx: pos.gx + w - 1, gy: pos.gy + h - 1 },
        this.room.gridWidth,
        this.room.gridHeight,
      )
    );
  }

  private hasCollision(pos: GridPos, w: number, h: number): boolean {
    const target = new Set(rectCells(pos, w, h).map((c) => `${c.gx},${c.gy}`));
    return Array.from(this.placed.values()).some((inst) => {
      const def = this.defs.get(inst.defId);
      if (!def) return false;
      const { w: iw, h: ih } = rotatedFootprint(def, inst.rotation);
      const occupied = rectCells({ gx: inst.gx, gy: inst.gy }, iw, ih);
      return occupied.some((c) => target.has(`${c.gx},${c.gy}`));
    });
  }
}
