import type { BlockShape, TraySlot } from '@/entities/BlockShape';

function createEmptyBoard(w: number, h: number): Cell[][] {
  const rows: Cell[][] = [];
  for (let y = 0; y < h; y += 1) {
    const row: Cell[] = [];
    for (let x = 0; x < w; x += 1) {
      row.push({ filled: false });
    }
    rows.push(row);
  }
  return rows;
}

export interface PlaceResult {
  ok: boolean;
  reason?: 'out-of-bounds' | 'overlap' | 'empty-slot';
  /** Filled cells after this placement, BEFORE clearing. */
  placedCells?: { x: number; y: number; colorIndex: 0 | 1 | 2 }[];
  /** Indices of fully cleared rows. */
  clearedRows?: number[];
  /** Indices of fully cleared columns. */
  clearedCols?: number[];
}

export type Cell = { filled: boolean; colorIndex?: 0 | 1 | 2 };

export interface BlockPuzzleSystemOptions {
  width: number;
  height: number;
  shapeCatalog: readonly BlockShape[];
  /** Injected RNG so tests can deterministic-seed it. Returns a value in [0,1). */
  rand?: () => number;
  /** Number of slots in the tray (default 3). */
  trayCount?: number;
}

export class BlockPuzzleSystem {
  private readonly w: number;

  private readonly h: number;

  private readonly shapeCatalog: readonly BlockShape[];

  private readonly rand: () => number;

  private readonly trayCount: number;

  private board: Cell[][];

  private tray: (TraySlot | null)[];

  private nextSlotSeq = 1;

  constructor(opts: BlockPuzzleSystemOptions) {
    this.w = opts.width;
    this.h = opts.height;
    this.shapeCatalog = opts.shapeCatalog;
    this.rand = opts.rand ?? Math.random;
    this.trayCount = opts.trayCount ?? 3;
    this.board = createEmptyBoard(this.w, this.h);
    this.tray = this.refillTray();
  }

  width(): number {
    return this.w;
  }

  height(): number {
    return this.h;
  }

  getBoard(): readonly Cell[][] {
    return this.board;
  }

  getTray(): readonly (TraySlot | null)[] {
    return this.tray;
  }

  /** True if `shape` would fit at (originX, originY) without overlap. */
  canPlace(shape: BlockShape, originX: number, originY: number): boolean {
    return shape.cells.every((c) => {
      const x = originX + c.dx;
      const y = originY + c.dy;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
      return !this.cellAt(x, y).filled;
    });
  }

  /**
   * Places the shape at the tray slot. Updates the board and clears any
   * fully-filled rows/cols, returning the cleared indices for the UI layer
   * to animate. Refills the tray slot when emptied of all 3 pieces.
   */
  place(slotIndex: number, originX: number, originY: number): PlaceResult {
    const slot = this.tray[slotIndex];
    if (!slot) return { ok: false, reason: 'empty-slot' };
    const { shape } = slot;
    if (!this.inBounds(shape, originX, originY)) {
      return { ok: false, reason: 'out-of-bounds' };
    }
    if (!this.canPlace(shape, originX, originY)) {
      return { ok: false, reason: 'overlap' };
    }

    const placedCells = shape.cells.map((c) => {
      const x = originX + c.dx;
      const y = originY + c.dy;
      this.board[y]![x] = { filled: true, colorIndex: shape.colorIndex };
      return { x, y, colorIndex: shape.colorIndex };
    });

    this.tray[slotIndex] = null;
    if (this.tray.every((s) => s === null)) {
      this.tray = this.refillTray();
    }

    const clearedRows = this.findFullRows();
    const clearedCols = this.findFullCols();
    this.clearLines(clearedRows, clearedCols);

    return { ok: true, placedCells, clearedRows, clearedCols };
  }

  /** No remaining tray shape can fit anywhere on the current board. */
  isGameOver(): boolean {
    return this.tray.every((slot) => {
      if (!slot) return true;
      return !this.anyFitFor(slot.shape);
    });
  }

  reset(): void {
    this.board = createEmptyBoard(this.w, this.h);
    this.tray = this.refillTray();
  }

  // ---- internals ----

  private cellAt(x: number, y: number): Cell {
    const row = this.board[y];
    if (!row) return { filled: false };
    return row[x] ?? { filled: false };
  }

  private inBounds(shape: BlockShape, ox: number, oy: number): boolean {
    return ox >= 0 && oy >= 0 && ox + shape.width <= this.w && oy + shape.height <= this.h;
  }

  private anyFitFor(shape: BlockShape): boolean {
    for (let y = 0; y <= this.h - shape.height; y += 1) {
      for (let x = 0; x <= this.w - shape.width; x += 1) {
        if (this.canPlace(shape, x, y)) return true;
      }
    }
    return false;
  }

  private findFullRows(): number[] {
    const rows: number[] = [];
    for (let y = 0; y < this.h; y += 1) {
      const row = this.board[y];
      if (row && row.every((c) => c.filled)) rows.push(y);
    }
    return rows;
  }

  private findFullCols(): number[] {
    const cols: number[] = [];
    for (let x = 0; x < this.w; x += 1) {
      let allFilled = true;
      for (let y = 0; y < this.h; y += 1) {
        if (!this.cellAt(x, y).filled) {
          allFilled = false;
          break;
        }
      }
      if (allFilled) cols.push(x);
    }
    return cols;
  }

  private clearLines(rows: readonly number[], cols: readonly number[]): void {
    rows.forEach((y) => {
      for (let x = 0; x < this.w; x += 1) {
        this.board[y]![x] = { filled: false };
      }
    });
    cols.forEach((x) => {
      for (let y = 0; y < this.h; y += 1) {
        this.board[y]![x] = { filled: false };
      }
    });
  }

  private refillTray(): (TraySlot | null)[] {
    const slots: TraySlot[] = [];
    for (let i = 0; i < this.trayCount; i += 1) {
      const idx = Math.floor(this.rand() * this.shapeCatalog.length);
      const shape = this.shapeCatalog[idx]!;
      slots.push({ slotId: `slot_${this.nextSlotSeq}`, shape });
      this.nextSlotSeq += 1;
    }
    return slots;
  }
}
