import {
  mergedLevel,
  type MergeItem,
  type MergeLevel,
} from '@/entities/MergeItem';

function makeBoard(w: number, h: number): MergeCell[][] {
  const rows: MergeCell[][] = [];
  for (let y = 0; y < h; y += 1) {
    const row: MergeCell[] = [];
    for (let x = 0; x < w; x += 1) row.push(null);
    rows.push(row);
  }
  return rows;
}

export type MergeCell = MergeItem | null;

export interface MoveResult {
  ok: boolean;
  reason?: 'out-of-bounds' | 'empty-source' | 'same-cell' | 'incompatible';
  /**
   * When the move was a merge, the new level that was just created. The
   * caller uses this to fire one-time reward grants for lv 7+.
   */
  mergedTo?: MergeLevel;
  /** A newly spawned item (post-move/merge) and its coordinates, if any. */
  spawned?: { x: number; y: number; item: MergeItem };
}

export interface MergeGameOptions {
  width?: number;
  height?: number;
  initialFills?: number;
  rand?: () => number;
}

export class MergeGameSystem {
  private readonly w: number;

  private readonly h: number;

  private readonly rand: () => number;

  private board: MergeCell[][];

  private nextItemSeq = 1;

  constructor(opts: MergeGameOptions = {}) {
    this.w = opts.width ?? 5;
    this.h = opts.height ?? 5;
    this.rand = opts.rand ?? Math.random;
    this.board = makeBoard(this.w, this.h);
    for (let i = 0; i < (opts.initialFills ?? 6); i += 1) {
      this.spawn();
    }
  }

  width(): number {
    return this.w;
  }

  height(): number {
    return this.h;
  }

  getBoard(): readonly (readonly MergeCell[])[] {
    return this.board;
  }

  /**
   * Moves the item at (fx, fy) to (tx, ty). If destination is empty, it's a
   * move; if it holds the same level, it's a merge (level+1). A new level-1
   * item spawns in a random empty cell after any successful action.
   */
  move(fx: number, fy: number, tx: number, ty: number): MoveResult {
    if (!this.inBounds(fx, fy) || !this.inBounds(tx, ty)) {
      return { ok: false, reason: 'out-of-bounds' };
    }
    if (fx === tx && fy === ty) return { ok: false, reason: 'same-cell' };
    const src = this.cellAt(fx, fy);
    if (!src) return { ok: false, reason: 'empty-source' };
    const dst = this.cellAt(tx, ty);

    if (!dst) {
      // Straight move.
      this.board[ty]![tx] = src;
      this.board[fy]![fx] = null;
      const spawned = this.spawn();
      return spawned ? { ok: true, spawned } : { ok: true };
    }

    const next = mergedLevel(src.level, dst.level);
    if (!next) return { ok: false, reason: 'incompatible' };

    this.board[ty]![tx] = this.mintItem(next);
    this.board[fy]![fx] = null;
    const spawned = this.spawn();
    return spawned
      ? { ok: true, mergedTo: next, spawned }
      : { ok: true, mergedTo: next };
  }

  /**
   * True when no empty cells remain AND no two orthogonally-adjacent cells
   * share a level (no valid merge available).
   */
  isGameOver(): boolean {
    if (this.anyEmpty()) return false;
    for (let y = 0; y < this.h; y += 1) {
      for (let x = 0; x < this.w; x += 1) {
        const here = this.cellAt(x, y);
        if (here) {
          const right = this.cellAt(x + 1, y);
          if (right && mergedLevel(here.level, right.level) !== null) return false;
          const down = this.cellAt(x, y + 1);
          if (down && mergedLevel(here.level, down.level) !== null) return false;
        }
      }
    }
    return true;
  }

  reset(initialFills = 6): void {
    this.board = makeBoard(this.w, this.h);
    for (let i = 0; i < initialFills; i += 1) {
      this.spawn();
    }
  }

  // ---- internals ----

  private cellAt(x: number, y: number): MergeCell {
    if (!this.inBounds(x, y)) return null;
    return this.board[y]?.[x] ?? null;
  }

  private inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  private anyEmpty(): boolean {
    return this.board.some((row) => row.some((c) => c === null));
  }

  private mintItem(level: MergeLevel): MergeItem {
    const id = `m_${this.nextItemSeq}`;
    this.nextItemSeq += 1;
    return { id, level };
  }

  /** Spawns a level-1 item at a random empty cell. Returns null if full. */
  private spawn(): { x: number; y: number; item: MergeItem } | null {
    const empties: { x: number; y: number }[] = [];
    for (let y = 0; y < this.h; y += 1) {
      for (let x = 0; x < this.w; x += 1) {
        if (this.board[y]![x] === null) empties.push({ x, y });
      }
    }
    if (empties.length === 0) return null;
    const pick = empties[Math.floor(this.rand() * empties.length)]!;
    const item = this.mintItem(1);
    this.board[pick.y]![pick.x] = item;
    return { x: pick.x, y: pick.y, item };
  }
}
