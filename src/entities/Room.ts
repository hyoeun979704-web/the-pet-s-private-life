import type { PlacedFurniture } from './Furniture';

export type RoomId = 'room_living' | 'room_bedroom' | 'room_kitchen';

export interface RoomDef {
  id: RoomId;
  nameKey: string;
  gridWidth: number;
  gridHeight: number;
  unlockLevel: number;
}

export interface RoomState {
  id: RoomId;
  placed: PlacedFurniture[];
}
