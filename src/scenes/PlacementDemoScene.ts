import Phaser from 'phaser';
import { DESIGN_TOKENS, PLACEMENT_CONFIG } from '@/config/Constants';
import furnitureData from '@/data/furniture.json';
import {
  rotatedFootprint,
  type FurnitureDef,
  type PlacedFurniture,
  type Rotation,
} from '@/entities/Furniture';
import type { RoomDef } from '@/entities/Room';
import { PlacementSystem } from '@/systems/PlacementSystem';
import { compareDepth } from '@/utils/DepthSort';
import { gridToScreen, screenToGrid, type GridPos } from '@/utils/IsometricUtil';
import { i18n } from '@/systems/I18nSystem';

const TILE_W = PLACEMENT_CONFIG.tilePx;
const TILE_H = PLACEMENT_CONFIG.tilePx / 2;

function parseHex(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

export class PlacementDemoScene extends Phaser.Scene {
  private system!: PlacementSystem;

  private originX = 0;

  private originY = 0;

  private gridLayer!: Phaser.GameObjects.Graphics;

  private itemsLayer!: Phaser.GameObjects.Container;

  private ghost: Phaser.GameObjects.Graphics | null = null;

  private selectedDefId: string | null = null;

  private selectedRotation: Rotation = 0;

  private selectedInstanceId: string | null = null;

  private hoverCell: GridPos | null = null;

  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'PlacementDemoScene' });
  }

  create(): void {
    const defs = furnitureData.items as unknown as FurnitureDef[];
    const room = (furnitureData.rooms as unknown as RoomDef[]).find((r) => r.id === 'room_living');
    if (!room) throw new Error('room_living missing in furniture.json');

    this.system = new PlacementSystem(room, defs);
    defs.forEach((d) => this.system.grantToInventory(d.id, 3));

    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bg);
    this.input.mouse?.disableContextMenu();

    const { width, height } = this.scale;
    this.originX = width / 2;
    this.originY = height / 2 - (room.gridHeight * TILE_H) / 2;

    this.gridLayer = this.add.graphics();
    this.itemsLayer = this.add.container(0, 0);
    this.drawGrid(room);
    this.buildPalette(defs);
    this.buildHud();
    this.bindInput();
    this.redrawItems();
  }

  private drawGrid(room: RoomDef): void {
    const g = this.gridLayer;
    g.clear();
    g.lineStyle(1, parseHex(DESIGN_TOKENS.color.textSecondary), 0.25);
    for (let gx = 0; gx < room.gridWidth; gx += 1) {
      for (let gy = 0; gy < room.gridHeight; gy += 1) {
        this.drawTile({ gx, gy }, g, parseHex(DESIGN_TOKENS.color.bgAlt), 0.6);
      }
    }
  }

  private drawTile(
    pos: GridPos,
    g: Phaser.GameObjects.Graphics,
    fillColor: number,
    alpha = 1,
  ): void {
    const { x, y } = gridToScreen(pos, this.originX, this.originY);
    const points = [
      x, y,
      x + TILE_W / 2, y + TILE_H / 2,
      x, y + TILE_H,
      x - TILE_W / 2, y + TILE_H / 2,
    ];
    g.fillStyle(fillColor, alpha);
    g.fillPoints([
      { x: points[0] as number, y: points[1] as number },
      { x: points[2] as number, y: points[3] as number },
      { x: points[4] as number, y: points[5] as number },
      { x: points[6] as number, y: points[7] as number },
    ], true);
    g.strokePoints([
      { x: points[0] as number, y: points[1] as number },
      { x: points[2] as number, y: points[3] as number },
      { x: points[4] as number, y: points[5] as number },
      { x: points[6] as number, y: points[7] as number },
    ], true);
  }

  private buildPalette(defs: FurnitureDef[]): void {
    const startX = 24;
    const startY = 24;
    defs.forEach((def, idx) => {
      const y = startY + idx * 60;
      const swatch = this.add.rectangle(startX + 20, y + 20, 36, 36, parseHex(def.colorHex));
      swatch.setStrokeStyle(2, parseHex(DESIGN_TOKENS.color.textPrimary));
      swatch.setInteractive({ useHandCursor: true });
      const label = this.add.text(startX + 48, y + 10, `${def.id}  (${def.footprintW}×${def.footprintH})`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeSm}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      });
      swatch.on('pointerup', () => {
        this.selectedDefId = def.id;
        this.selectedInstanceId = null;
        this.selectedRotation = 0;
        this.updateStatus();
      });
      label.setData('defId', def.id);
    });
  }

  private buildHud(): void {
    this.statusText = this.add
      .text(24, this.scale.height - 60, '', {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeSm}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0, 0);
    this.updateStatus();
  }

  private updateStatus(): void {
    const msg = [
      `${i18n.t('placement.selected', 'Selected')}: ${this.selectedDefId ?? '-'}`,
      `R=rotate  Z=undo  X=remove  Click=place/pick`,
    ].join('   |   ');
    this.statusText.setText(msg);
  }

  private bindInput(): void {
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.hoverCell = screenToGrid({ x: p.worldX, y: p.worldY }, this.originX, this.originY);
      this.refreshGhost();
    });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.hoverCell) return;
      if (this.selectedDefId) {
        const res = this.system.place(this.selectedDefId, this.hoverCell, this.selectedRotation);
        if (!res.ok) this.flashStatus(`place failed: ${res.reason}`);
        this.redrawItems();
        return;
      }
      const picked = this.pickAt(this.hoverCell);
      if (picked && p.rightButtonReleased()) {
        this.system.rotate(picked.instanceId);
        this.redrawItems();
      } else if (picked) {
        this.selectedInstanceId = picked.instanceId;
        this.updateStatus();
      }
    });

    this.input.keyboard?.on('keydown-R', () => {
      if (this.selectedInstanceId) {
        this.system.rotate(this.selectedInstanceId);
        this.redrawItems();
      } else {
        this.selectedRotation = ((this.selectedRotation + 90) % 360) as Rotation;
        this.refreshGhost();
      }
    });

    this.input.keyboard?.on('keydown-Z', () => {
      this.system.undo();
      this.redrawItems();
    });

    this.input.keyboard?.on('keydown-X', () => {
      if (this.selectedInstanceId) {
        this.system.remove(this.selectedInstanceId);
        this.selectedInstanceId = null;
        this.redrawItems();
      }
    });
  }

  private pickAt(cell: GridPos): PlacedFurniture | null {
    return (
      this.system.getPlaced().find((inst) => {
        const def = (furnitureData.items as unknown as FurnitureDef[]).find(
          (d) => d.id === inst.defId,
        );
        if (!def) return false;
        const { w, h } = rotatedFootprint(def, inst.rotation);
        return (
          cell.gx >= inst.gx
          && cell.gx < inst.gx + w
          && cell.gy >= inst.gy
          && cell.gy < inst.gy + h
        );
      }) ?? null
    );
  }

  private refreshGhost(): void {
    this.ghost?.destroy();
    this.ghost = null;
    if (!this.selectedDefId || !this.hoverCell) return;
    const def = (furnitureData.items as unknown as FurnitureDef[]).find(
      (d) => d.id === this.selectedDefId,
    );
    if (!def) return;
    const can = this.system.canPlace(this.selectedDefId, this.hoverCell, this.selectedRotation);
    const color = can.ok
      ? parseHex(DESIGN_TOKENS.color.success)
      : parseHex(DESIGN_TOKENS.color.danger);
    const g = this.add.graphics();
    const { w, h } = rotatedFootprint(def, this.selectedRotation);
    for (let dx = 0; dx < w; dx += 1) {
      for (let dy = 0; dy < h; dy += 1) {
        this.drawTile({ gx: this.hoverCell.gx + dx, gy: this.hoverCell.gy + dy }, g, color, 0.5);
      }
    }
    this.ghost = g;
  }

  private redrawItems(): void {
    this.itemsLayer.removeAll(true);
    const items = [...this.system.getPlaced()].sort(compareDepth);
    items.forEach((inst) => {
      const def = (furnitureData.items as unknown as FurnitureDef[]).find(
        (d) => d.id === inst.defId,
      );
      if (!def) return;
      const { x, y } = gridToScreen({ gx: inst.gx, gy: inst.gy }, this.originX, this.originY);
      const rect = this.add.rectangle(x, y + TILE_H, TILE_W * 0.6, TILE_W * 0.6, parseHex(def.colorHex));
      rect.setStrokeStyle(2, parseHex(DESIGN_TOKENS.color.textPrimary));
      rect.setOrigin(0.5, 1);
      this.itemsLayer.add(rect);
    });
  }

  private flashStatus(msg: string): void {
    const prev = this.statusText.text;
    this.statusText.setText(msg);
    this.time.delayedCall(1200, () => this.statusText.setText(prev));
  }
}
