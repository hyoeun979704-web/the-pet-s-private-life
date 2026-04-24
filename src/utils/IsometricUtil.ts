import { PLACEMENT_CONFIG } from '@/config/Constants';

export interface GridPos {
  gx: number;
  gy: number;
}

export interface ScreenPos {
  x: number;
  y: number;
}

const TILE_W = PLACEMENT_CONFIG.tilePx;
const TILE_H = PLACEMENT_CONFIG.tilePx / 2;

export function gridToScreen(pos: GridPos, originX = 0, originY = 0): ScreenPos {
  return {
    x: originX + (pos.gx - pos.gy) * (TILE_W / 2),
    y: originY + (pos.gx + pos.gy) * (TILE_H / 2),
  };
}

export function screenToGrid(pos: ScreenPos, originX = 0, originY = 0): GridPos {
  const dx = pos.x - originX;
  const dy = pos.y - originY;
  const gx = dx / TILE_W + dy / TILE_H;
  const gy = dy / TILE_H - dx / TILE_W;
  return { gx: Math.floor(gx), gy: Math.floor(gy) };
}

export function isInsideRoom(pos: GridPos, width: number, height: number): boolean {
  return pos.gx >= 0 && pos.gy >= 0 && pos.gx < width && pos.gy < height;
}

export function rectCells(origin: GridPos, footprintW: number, footprintH: number): GridPos[] {
  const cells: GridPos[] = [];
  for (let x = 0; x < footprintW; x += 1) {
    for (let y = 0; y < footprintH; y += 1) {
      cells.push({ gx: origin.gx + x, gy: origin.gy + y });
    }
  }
  return cells;
}
