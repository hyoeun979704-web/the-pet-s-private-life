import Phaser from 'phaser';
import { DESIGN_TOKENS, MAX_RESOURCE_GAIN_PER_SOURCE } from '@/config/Constants';
import shapesData from '@/data/blockShapes.json';
import type { BlockShape, TraySlot } from '@/entities/BlockShape';
import { BlockPuzzleSystem, type Cell } from '@/systems/BlockPuzzleSystem';
import { getServices } from '@/systems/GameServices';
import { blockReward } from '@/utils/BlockReward';
import { i18n } from '@/systems/I18nSystem';

const BOARD_W = 10;
const BOARD_H = 10;
const CELL_PX = 48;
const BOARD_PX = BOARD_W * CELL_PX;
const SESSION_SEC = 180;
const TRAY_SLOT_PX = 160;
const TRAY_TILE_PX = 24;
const DRAG_SCALE = CELL_PX / TRAY_TILE_PX; // makes dragged shape match grid cells
const MAX_GRANT_PER_CALL = MAX_RESOURCE_GAIN_PER_SOURCE.block_puzzle.snack;

const COLOR_BY_INDEX = ['#FFC8DD', '#FAEDCB', '#A0C4FF'] as const;

function parseHex(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

interface TrayDragState {
  slotIndex: number;
  shape: BlockShape;
  container: Phaser.GameObjects.Container;
  originX: number;
  originY: number;
}

export class BlockPuzzleScene extends Phaser.Scene {
  private system!: BlockPuzzleSystem;

  private boardGfx!: Phaser.GameObjects.Graphics;

  private ghostGfx!: Phaser.GameObjects.Graphics;

  private trayContainers: Phaser.GameObjects.Container[] = [];

  private boardOriginX = 0;

  private boardOriginY = 0;

  private sessionSnack = 0;

  private startedAtMs = 0;

  private timeText!: Phaser.GameObjects.Text;

  private scoreText!: Phaser.GameObjects.Text;

  private gameOver = false;

  private endingSession = false;

  private dragState: TrayDragState | null = null;

  constructor() {
    super({ key: 'BlockPuzzleScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bg);
    this.input.mouse?.disableContextMenu();

    const catalog = shapesData.shapes as unknown as BlockShape[];
    this.system = new BlockPuzzleSystem({
      width: BOARD_W,
      height: BOARD_H,
      shapeCatalog: catalog,
    });

    getServices()?.analytics.emit('minigame_start', { type: 'block_puzzle' });

    this.boardOriginX = (this.scale.width - BOARD_PX) / 2;
    this.boardOriginY = 80;
    this.boardGfx = this.add.graphics();
    this.ghostGfx = this.add.graphics();
    this.drawBoard();

    this.buildHud();
    this.buildTray();
    this.startedAtMs = this.time.now;
  }

  override update(): void {
    if (this.gameOver || this.endingSession) return;
    const remaining = this.secondsRemaining();
    this.timeText.setText(`⏱ ${remaining}s`);
    if (remaining <= 0) {
      this.finishSession('timeout');
    } else if (this.system.isGameOver()) {
      this.finishSession('game-over');
    }
  }

  private secondsRemaining(): number {
    return Math.max(0, Math.ceil(SESSION_SEC - (this.time.now - this.startedAtMs) / 1000));
  }

  private buildHud(): void {
    const { width } = this.scale;
    this.timeText = this.add.text(24, 24, '⏱ 180s', {
      fontFamily: DESIGN_TOKENS.font.family,
      fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
      color: DESIGN_TOKENS.color.textPrimary,
    });

    this.scoreText = this.add
      .text(width / 2, 24, `🍖 0`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5, 0);

    const endBtn = this.add
      .text(width - 24, 24, `[ ${i18n.t('block.end', 'End')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    endBtn.on('pointerup', () => this.finishSession('user'));
  }

  private drawBoard(): void {
    const g = this.boardGfx;
    g.clear();
    g.lineStyle(1, parseHex(DESIGN_TOKENS.color.textSecondary), 0.3);
    g.fillStyle(parseHex(DESIGN_TOKENS.color.bgAlt), 1);
    const board = this.system.getBoard();
    for (let y = 0; y < BOARD_H; y += 1) {
      for (let x = 0; x < BOARD_W; x += 1) {
        const cell = board[y]?.[x] ?? { filled: false };
        this.drawCell(x, y, cell, g);
      }
    }
  }

  private drawCell(x: number, y: number, cell: Cell, g: Phaser.GameObjects.Graphics): void {
    const px = this.boardOriginX + x * CELL_PX;
    const py = this.boardOriginY + y * CELL_PX;
    if (cell.filled && cell.colorIndex !== undefined) {
      g.fillStyle(parseHex(COLOR_BY_INDEX[cell.colorIndex]), 1);
    } else {
      g.fillStyle(parseHex(DESIGN_TOKENS.color.bgAlt), 0.4);
    }
    g.fillRect(px + 2, py + 2, CELL_PX - 4, CELL_PX - 4);
    g.strokeRect(px, py, CELL_PX, CELL_PX);
  }

  private buildTray(): void {
    this.trayContainers.forEach((c) => c.destroy());
    this.trayContainers = [];
    const slots = this.system.getTray();
    slots.forEach((slot, idx) => {
      if (!slot) return;
      const container = this.makeTrayContainer(slot, idx);
      this.trayContainers[idx] = container;
    });
  }

  private makeTrayContainer(slot: TraySlot, slotIndex: number): Phaser.GameObjects.Container {
    const { width } = this.scale;
    const totalTrayWidth = TRAY_SLOT_PX * 3;
    const startX = (width - totalTrayWidth) / 2;
    const y = this.boardOriginY + BOARD_PX + 40;
    const x = startX + slotIndex * TRAY_SLOT_PX;
    const container = this.add.container(x + TRAY_SLOT_PX / 2, y + TRAY_SLOT_PX / 2);

    // Background
    const bg = this.add.rectangle(0, 0, TRAY_SLOT_PX - 16, TRAY_SLOT_PX - 16, parseHex(DESIGN_TOKENS.color.bgAlt));
    bg.setStrokeStyle(1, parseHex(DESIGN_TOKENS.color.textSecondary), 0.4);
    container.add(bg);

    // Cells — scaled down for tray display
    const tileSize = 24;
    const offsetX = -((slot.shape.width * tileSize) / 2);
    const offsetY = -((slot.shape.height * tileSize) / 2);
    slot.shape.cells.forEach((c) => {
      const cellRect = this.add.rectangle(
        offsetX + c.dx * tileSize + tileSize / 2,
        offsetY + c.dy * tileSize + tileSize / 2,
        tileSize - 2,
        tileSize - 2,
        parseHex(COLOR_BY_INDEX[slot.shape.colorIndex]),
      );
      cellRect.setStrokeStyle(1, parseHex(DESIGN_TOKENS.color.textPrimary));
      container.add(cellRect);
    });

    container.setSize(TRAY_SLOT_PX - 16, TRAY_SLOT_PX - 16);
    container.setInteractive(new Phaser.Geom.Rectangle(
      -(TRAY_SLOT_PX - 16) / 2,
      -(TRAY_SLOT_PX - 16) / 2,
      TRAY_SLOT_PX - 16,
      TRAY_SLOT_PX - 16,
    ), Phaser.Geom.Rectangle.Contains);
    this.input.setDraggable(container);

    container.setData('slotIndex', slotIndex);
    container.setData('homeX', container.x);
    container.setData('homeY', container.y);

    container.on('dragstart', () => {
      container.setScale(DRAG_SCALE);
      this.dragState = {
        slotIndex,
        shape: slot.shape,
        container,
        originX: container.x,
        originY: container.y,
      };
    });
    container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      container.x = dragX;
      container.y = dragY;
      this.drawGhost();
    });
    container.on('dragend', () => this.onDragEnd());
    return container;
  }

  private drawGhost(): void {
    this.ghostGfx.clear();
    if (!this.dragState) return;
    const anchor = this.pointerToAnchor();
    if (!anchor) return;
    const { shape } = this.dragState;
    const ok = this.system.canPlace(shape, anchor.x, anchor.y);
    const color = ok
      ? parseHex(DESIGN_TOKENS.color.success)
      : parseHex(DESIGN_TOKENS.color.danger);
    this.ghostGfx.fillStyle(color, 0.45);
    shape.cells.forEach((c) => {
      const x = anchor.x + c.dx;
      const y = anchor.y + c.dy;
      if (x < 0 || y < 0 || x >= BOARD_W || y >= BOARD_H) return;
      const px = this.boardOriginX + x * CELL_PX;
      const py = this.boardOriginY + y * CELL_PX;
      this.ghostGfx.fillRect(px + 2, py + 2, CELL_PX - 4, CELL_PX - 4);
    });
  }

  private pointerToAnchor(): { x: number; y: number } | null {
    if (!this.dragState) return null;
    const { container, shape } = this.dragState;
    // Snap the shape's top-left cell to the cell under the container center,
    // offset so the anchor sits at the shape's upper-left corner.
    const localX = container.x - this.boardOriginX - ((shape.width - 1) * CELL_PX) / 2;
    const localY = container.y - this.boardOriginY - ((shape.height - 1) * CELL_PX) / 2;
    return {
      x: Math.round(localX / CELL_PX),
      y: Math.round(localY / CELL_PX),
    };
  }

  private onDragEnd(): void {
    if (!this.dragState) return;
    const anchor = this.pointerToAnchor();
    const { slotIndex, container, originX, originY } = this.dragState;
    this.ghostGfx.clear();
    this.dragState = null;

    const restoreToTray = (): void => {
      container.setScale(1);
      container.x = originX;
      container.y = originY;
    };

    if (!anchor) {
      restoreToTray();
      return;
    }

    const res = this.system.place(slotIndex, anchor.x, anchor.y);
    if (!res.ok) {
      restoreToTray();
      return;
    }

    const reward = blockReward({
      rowsCleared: res.clearedRows?.length ?? 0,
      colsCleared: res.clearedCols?.length ?? 0,
    });
    if (reward.tier !== 'none') {
      this.sessionSnack += reward.snack;
    }

    // buildTray() destroys + rebuilds every slot, including the dragged one.
    this.drawBoard();
    this.buildTray();
    this.scoreText.setText(`🍖 ${this.sessionSnack}`);
  }

  private async finishSession(reason: 'timeout' | 'game-over' | 'user'): Promise<void> {
    if (this.endingSession) return;
    this.endingSession = true;
    this.gameOver = reason === 'game-over';
    const services = getServices();
    services?.analytics.emit('minigame_end', {
      type: 'block_puzzle',
      reason,
      score: this.sessionSnack,
    });
    if (services && this.sessionSnack > 0) {
      const capped = Math.min(this.sessionSnack, MAX_GRANT_PER_CALL);
      await services.economy.grantWithExp('block_puzzle', { snack: capped });
    }
    this.scene.start('MainScene');
  }
}
