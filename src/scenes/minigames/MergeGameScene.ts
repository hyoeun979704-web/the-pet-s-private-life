import Phaser from 'phaser';
import { DESIGN_TOKENS, MAX_RESOURCE_GAIN_PER_SOURCE } from '@/config/Constants';
import mergeLevelsData from '@/data/mergeLevels.json';
import type { MergeItem } from '@/entities/MergeItem';
import { MergeGameSystem } from '@/systems/MergeGameSystem';
import { starDustFor } from '@/utils/MergeReward';
import { getServices } from '@/systems/GameServices';
import { i18n } from '@/systems/I18nSystem';

const BOARD_W = 5;
const BOARD_H = 5;
const CELL_PX = 96;
const SESSION_SEC = 300;
const MAX_GRANT_PER_CALL = MAX_RESOURCE_GAIN_PER_SOURCE.merge_game.starDust;

const LEVEL_COLORS: Record<number, string> = Object.fromEntries(
  (mergeLevelsData.levels as { level: number; colorHex: string }[]).map((l) => [
    l.level,
    l.colorHex,
  ]),
);

function parseHex(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

interface DragState {
  fromX: number;
  fromY: number;
  sprite: Phaser.GameObjects.Container;
  originX: number;
  originY: number;
}

export class MergeGameScene extends Phaser.Scene {
  private system!: MergeGameSystem;

  private boardOriginX = 0;

  private boardOriginY = 0;

  private boardGfx!: Phaser.GameObjects.Graphics;

  private itemSprites: (Phaser.GameObjects.Container | null)[][] = [];

  private ghostGfx!: Phaser.GameObjects.Graphics;

  private sessionStarDust = 0;

  private startedAtMs = 0;

  private timeText!: Phaser.GameObjects.Text;

  private scoreText!: Phaser.GameObjects.Text;

  private dragState: DragState | null = null;

  private endingSession = false;

  constructor() {
    super({ key: 'MergeGameScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bg);
    this.input.mouse?.disableContextMenu();

    this.system = new MergeGameSystem({ width: BOARD_W, height: BOARD_H, initialFills: 6 });
    this.boardOriginX = (this.scale.width - BOARD_W * CELL_PX) / 2;
    this.boardOriginY = 120;

    this.boardGfx = this.add.graphics();
    this.ghostGfx = this.add.graphics();
    this.drawBoardBackground();

    for (let y = 0; y < BOARD_H; y += 1) {
      const row: (Phaser.GameObjects.Container | null)[] = [];
      for (let x = 0; x < BOARD_W; x += 1) row.push(null);
      this.itemSprites.push(row);
    }
    this.renderAllItems();
    this.buildHud();
    this.startedAtMs = this.time.now;
  }

  override update(): void {
    if (this.endingSession) return;
    const remaining = this.secondsRemaining();
    this.timeText.setText(`⏱ ${remaining}s`);
    if (remaining <= 0) this.finishSession('timeout');
    else if (this.system.isGameOver()) this.finishSession('game-over');
  }

  private secondsRemaining(): number {
    return Math.max(0, Math.ceil(SESSION_SEC - (this.time.now - this.startedAtMs) / 1000));
  }

  private buildHud(): void {
    const { width } = this.scale;
    this.timeText = this.add.text(24, 24, '⏱ 300s', {
      fontFamily: DESIGN_TOKENS.font.family,
      fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
      color: DESIGN_TOKENS.color.textPrimary,
    });

    this.scoreText = this.add
      .text(width / 2, 24, '⭐ 0', {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5, 0);

    const endBtn = this.add
      .text(width - 24, 24, `[ ${i18n.t('merge.end', 'End')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    endBtn.on('pointerup', () => this.finishSession('user'));
  }

  private drawBoardBackground(): void {
    const g = this.boardGfx;
    g.clear();
    g.lineStyle(1, parseHex(DESIGN_TOKENS.color.textSecondary), 0.3);
    for (let y = 0; y < BOARD_H; y += 1) {
      for (let x = 0; x < BOARD_W; x += 1) {
        const px = this.boardOriginX + x * CELL_PX;
        const py = this.boardOriginY + y * CELL_PX;
        g.fillStyle(parseHex(DESIGN_TOKENS.color.bgAlt), 0.5);
        g.fillRect(px + 2, py + 2, CELL_PX - 4, CELL_PX - 4);
        g.strokeRect(px, py, CELL_PX, CELL_PX);
      }
    }
  }

  private renderAllItems(): void {
    const board = this.system.getBoard();
    for (let y = 0; y < BOARD_H; y += 1) {
      for (let x = 0; x < BOARD_W; x += 1) {
        this.itemSprites[y]![x]?.destroy();
        this.itemSprites[y]![x] = null;
        const cell = board[y]?.[x] ?? null;
        if (cell) this.itemSprites[y]![x] = this.makeItemSprite(x, y, cell);
      }
    }
  }

  private makeItemSprite(x: number, y: number, cell: MergeItem): Phaser.GameObjects.Container {
    const cx = this.boardOriginX + x * CELL_PX + CELL_PX / 2;
    const cy = this.boardOriginY + y * CELL_PX + CELL_PX / 2;
    const container = this.add.container(cx, cy);
    const hex = LEVEL_COLORS[cell.level] ?? DESIGN_TOKENS.color.bgAlt;
    const bg = this.add.circle(0, 0, CELL_PX * 0.38, parseHex(hex));
    bg.setStrokeStyle(2, parseHex(DESIGN_TOKENS.color.textPrimary));
    container.add(bg);
    const label = this.add
      .text(0, 0, String(cell.level), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(label);

    container.setSize(CELL_PX * 0.76, CELL_PX * 0.76);
    container.setInteractive(
      new Phaser.Geom.Circle(0, 0, CELL_PX * 0.38),
      Phaser.Geom.Circle.Contains,
    );
    this.input.setDraggable(container);
    container.setData('cellX', x);
    container.setData('cellY', y);

    container.on('dragstart', () => {
      this.dragState = {
        fromX: x,
        fromY: y,
        sprite: container,
        originX: container.x,
        originY: container.y,
      };
    });
    container.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      container.x = dragX;
      container.y = dragY;
      this.drawGhost(dragX, dragY);
    });
    container.on('dragend', () => this.onDragEnd());
    return container;
  }

  private drawGhost(px: number, py: number): void {
    this.ghostGfx.clear();
    const target = this.pointToCell(px, py);
    if (!target) return;
    const color = this.isValidTarget(target.x, target.y)
      ? parseHex(DESIGN_TOKENS.color.success)
      : parseHex(DESIGN_TOKENS.color.danger);
    const x = this.boardOriginX + target.x * CELL_PX;
    const y = this.boardOriginY + target.y * CELL_PX;
    this.ghostGfx.fillStyle(color, 0.35);
    this.ghostGfx.fillRect(x + 2, y + 2, CELL_PX - 4, CELL_PX - 4);
  }

  private pointToCell(px: number, py: number): { x: number; y: number } | null {
    const cx = Math.floor((px - this.boardOriginX) / CELL_PX);
    const cy = Math.floor((py - this.boardOriginY) / CELL_PX);
    if (cx < 0 || cy < 0 || cx >= BOARD_W || cy >= BOARD_H) return null;
    return { x: cx, y: cy };
  }

  private isValidTarget(tx: number, ty: number): boolean {
    if (!this.dragState) return false;
    if (this.dragState.fromX === tx && this.dragState.fromY === ty) return false;
    const src = this.system.getBoard()[this.dragState.fromY]?.[this.dragState.fromX];
    if (!src) return false;
    const dst = this.system.getBoard()[ty]?.[tx];
    if (!dst) return true;
    return dst.level === src.level && src.level < 10;
  }

  private onDragEnd(): void {
    if (!this.dragState) return;
    const { fromX, fromY, sprite, originX, originY } = this.dragState;
    this.ghostGfx.clear();

    const target = this.pointToCell(sprite.x, sprite.y);
    this.dragState = null;

    if (!target) {
      sprite.x = originX;
      sprite.y = originY;
      return;
    }

    const res = this.system.move(fromX, fromY, target.x, target.y);
    if (!res.ok) {
      sprite.x = originX;
      sprite.y = originY;
      return;
    }

    if (res.mergedTo !== undefined) {
      const reward = starDustFor(res.mergedTo);
      if (reward > 0) {
        this.sessionStarDust += reward;
        this.scoreText.setText(`⭐ ${this.sessionStarDust}`);
      }
    }

    this.renderAllItems();
  }

  private async finishSession(_reason: 'timeout' | 'game-over' | 'user'): Promise<void> {
    if (this.endingSession) return;
    this.endingSession = true;
    const services = getServices();
    if (!services || this.sessionStarDust <= 0) {
      this.scene.start('MainScene');
      return;
    }
    // Offer the merge_boost ad option when available; otherwise grant
    // immediately. Cap is enforced after the optional 2x multiplier.
    if (services.ads.canWatch('merge_boost')) {
      this.showBoostPrompt();
      return;
    }
    await this.grantAndExit(1);
  }

  private showBoostPrompt(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2 + 40;

    const bg = this.add.rectangle(cx, cy, 520, 220, parseHex(DESIGN_TOKENS.color.bgAlt));
    bg.setStrokeStyle(2, parseHex(DESIGN_TOKENS.color.textSecondary));

    this.add
      .text(cx, cy - 60, `세션 보상: ⭐ ${Math.min(this.sessionStarDust, 50)}`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5);

    const adBtn = this.add
      .text(cx - 110, cy + 30, `[ 📺 ${i18n.t('merge.watch_ad_2x', '광고 보고 2배 받기')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    adBtn.on('pointerup', () => this.tryBoost(adBtn));

    const skipBtn = this.add
      .text(cx + 110, cy + 30, `[ ${i18n.t('merge.skip_ad', '바로 받기')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.textSecondary,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    skipBtn.on('pointerup', () => this.grantAndExit(1));
  }

  private async tryBoost(btn: Phaser.GameObjects.Text): Promise<void> {
    const services = getServices();
    if (!services) return;
    btn.disableInteractive();
    btn.setColor(DESIGN_TOKENS.color.textSecondary);
    const res = await services.ads.watch('merge_boost');
    await this.grantAndExit(res.ok ? 2 : 1);
  }

  private async grantAndExit(multiplier: number): Promise<void> {
    const services = getServices();
    if (!services) {
      this.scene.start('MainScene');
      return;
    }
    const capped = Math.min(this.sessionStarDust * multiplier, MAX_GRANT_PER_CALL);
    await services.economy.grantWithExp('merge_game', { starDust: capped });
    this.scene.start('MainScene');
  }
}
