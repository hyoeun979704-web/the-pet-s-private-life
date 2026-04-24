import type { ResourceKey } from '@/config/Constants';
import type { PlacedFurniture } from './Furniture';

export type RoomId = 'room_living' | 'room_bedroom' | 'room_kitchen';

export interface RoomDef {
  id: RoomId;
  nameKey: string;
  gridWidth: number;
  gridHeight: number;
  unlockLevel: number;
  unlockCost: Partial<Record<ResourceKey, number>>;
}

export interface RoomState {
  id: RoomId;
  placed: PlacedFurniture[];
}
