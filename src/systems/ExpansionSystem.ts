import type { ResourceKey } from '@/config/Constants';
import type { Resources } from '@/entities/SaveData';
import type { RoomDef, RoomId, RoomState } from '@/entities/Room';

export type RoomStatus =
  | 'unlocked'
  | 'level-locked'
  | 'cost-locked'
  | 'ready-to-unlock';

export interface RoomAvailability {
  id: RoomId;
  status: RoomStatus;
  unlockLevel: number;
  unlockCost: Partial<Record<ResourceKey, number>>;
  missing?: Partial<Record<ResourceKey, number>>;
}

function computeMissing(
  cost: Partial<Record<ResourceKey, number>>,
  wallet: Resources,
): Partial<Record<ResourceKey, number>> {
  const missing: Partial<Record<ResourceKey, number>> = {};
  (Object.keys(cost) as ResourceKey[]).forEach((key) => {
    const need = cost[key] ?? 0;
    const have = wallet[key as keyof Resources] ?? 0;
    if (have < need) missing[key] = need - have;
  });
  return missing;
}

/**
 * Pure: classifies each room def against the player's current level, owned
 * rooms, and resource wallet. `ready-to-unlock` means the server should
 * accept an unlockRoom call right now.
 */
export function availableRooms(
  defs: readonly RoomDef[],
  ownedRooms: readonly RoomState[],
  level: number,
  resources: Resources,
): RoomAvailability[] {
  const ownedIds = new Set(ownedRooms.map((r) => r.id));
  return defs.map((def) => {
    if (ownedIds.has(def.id)) {
      return {
        id: def.id,
        status: 'unlocked',
        unlockLevel: def.unlockLevel,
        unlockCost: def.unlockCost,
      };
    }
    if (level < def.unlockLevel) {
      return {
        id: def.id,
        status: 'level-locked',
        unlockLevel: def.unlockLevel,
        unlockCost: def.unlockCost,
      };
    }
    const missing = computeMissing(def.unlockCost, resources);
    if (Object.keys(missing).length > 0) {
      return {
        id: def.id,
        status: 'cost-locked',
        unlockLevel: def.unlockLevel,
        unlockCost: def.unlockCost,
        missing,
      };
    }
    return {
      id: def.id,
      status: 'ready-to-unlock',
      unlockLevel: def.unlockLevel,
      unlockCost: def.unlockCost,
    };
  });
}
