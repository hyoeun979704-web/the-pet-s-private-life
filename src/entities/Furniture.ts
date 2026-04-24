export type FurnitureCategory = 'floor' | 'wall' | 'decor';
export type FurnitureGrade = 'normal' | 'rare' | 'legendary';
export type Rotation = 0 | 90 | 180 | 270;

export interface FurnitureDef {
  id: string;
  nameKey: string;
  category: FurnitureCategory;
  grade: FurnitureGrade;
  footprintW: number;
  footprintH: number;
  priceSnack?: number;
  priceStarDust?: number;
  cozyScore: number;
  colorHex: string;
}

export interface PlacedFurniture {
  instanceId: string;
  defId: string;
  gx: number;
  gy: number;
  rotation: Rotation;
}

export function rotatedFootprint(
  def: FurnitureDef,
  rotation: Rotation,
): { w: number; h: number } {
  if (rotation === 90 || rotation === 270) {
    return { w: def.footprintH, h: def.footprintW };
  }
  return { w: def.footprintW, h: def.footprintH };
}
