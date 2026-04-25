import { GACHA_CONFIG, MAX_GACHA_SHARD_PER_CALL } from '@/config/Constants';
import { GACHA_POOL, type GachaGrade } from '@/data/gachaPool';
import type { OwnedCharacter } from '@/entities/Character';
import type { SaveData } from '@/entities/SaveData';
import type { GameState } from '@/systems/GameState';
import { logger } from '@/utils/Logger';

export interface GachaRollResult {
  ok: boolean;
  reason?: 'not-enough-stone' | 'server-denied' | 'offline';
  grade?: GachaGrade;
  defId?: string;
  isNew?: boolean;
  shardGain?: number;
  pity?: number;
  error?: unknown;
}

/** Server callable. Pass a real httpsCallable wrapper in production. */
export interface RollFn {
  (): Promise<GachaRollResult>;
}

const FATIGUE_MAX_BY_GRADE: Record<GachaGrade, number> = {
  normal: 10,
  rare: 12,
  legendary: 15,
};

const DUPLICATE_SHARD_REWARD: Record<GachaGrade, number> = {
  normal: 1,
  rare: 3,
  legendary: 10,
};

export interface GachaSystemOptions {
  /** Optional injected server callable; when omitted, uses dev local roll. */
  rollFn?: RollFn;
  gameState: GameState;
  rand?: () => number;
}

export class GachaSystem {
  private readonly gameState: GameState;

  private readonly rand: () => number;

  private readonly rollFn: RollFn | null;

  constructor(opts: GachaSystemOptions) {
    this.gameState = opts.gameState;
    this.rand = opts.rand ?? Math.random;
    this.rollFn = opts.rollFn ?? null;
  }

  /**
   * True if the player has enough magicStone for one roll.
   */
  canRoll(): boolean {
    return this.gameState.get().resources.magicStone >= GACHA_CONFIG.costMagicStone;
  }

  /**
   * Performs a single gacha roll. Uses the injected server callable when
   * available; otherwise falls back to a deterministic local simulation
   * that mirrors the server logic exactly (validated by economy-sync test).
   */
  async roll(): Promise<GachaRollResult> {
    if (!this.canRoll()) {
      return { ok: false, reason: 'not-enough-stone' };
    }
    if (this.rollFn) {
      try {
        const res = await this.rollFn();
        if (res.ok) await this.applyResultLocally(res);
        return res;
      } catch (err) {
        logger.error('gacha.serverFailed', err);
        return { ok: false, reason: 'offline', error: err };
      }
    }
    // Dev/local path.
    return this.localRoll();
  }

  private async localRoll(): Promise<GachaRollResult> {
    const save = this.gameState.get();
    const grade = this.rollGrade(save.gachaPity);
    const defId = this.pickFromPool(grade);
    const ownsAlready = save.characters.some((c) => c.defId === defId);
    // Mirror server cap: clamp per-call shard reward.
    const shardGain = ownsAlready
      ? Math.min(DUPLICATE_SHARD_REWARD[grade], MAX_GACHA_SHARD_PER_CALL)
      : 0;
    const nextPity = grade === 'normal' ? save.gachaPity + 1 : 0;

    await this.gameState.patch((d) => {
      const resources = {
        ...d.resources,
        magicStone: d.resources.magicStone - GACHA_CONFIG.costMagicStone,
      };
      let {characters} = d;
      if (ownsAlready) {
        resources.magicShard = (resources.magicShard ?? 0) + shardGain;
      } else {
        const newOwned: OwnedCharacter = {
          defId,
          fatigue: FATIGUE_MAX_BY_GRADE[grade],
          lastInteractAt: Date.now(),
        };
        characters = [...d.characters, newOwned];
      }
      return { ...d, resources, characters, gachaPity: nextPity };
    });

    return {
      ok: true,
      grade,
      defId,
      isNew: !ownsAlready,
      shardGain,
      pity: nextPity,
    };
  }

  /**
   * Re-runs the local mutation when the server returned a result. Keeps
   * the client save in sync without waiting for a Firestore re-read.
   */
  private async applyResultLocally(res: GachaRollResult): Promise<void> {
    if (!res.ok || !res.grade || !res.defId) return;
    const {grade} = res;
    const {defId} = res;
    const isNew = res.isNew ?? false;
    const shardGain = res.shardGain ?? 0;
    const nextPity = res.pity ?? 0;

    await this.gameState.patch((d) => {
      const resources = {
        ...d.resources,
        magicStone: d.resources.magicStone - GACHA_CONFIG.costMagicStone,
      };
      let {characters} = d;
      if (isNew) {
        const newOwned: OwnedCharacter = {
          defId,
          fatigue: FATIGUE_MAX_BY_GRADE[grade],
          lastInteractAt: Date.now(),
        };
        characters = [...d.characters, newOwned];
      } else {
        resources.magicShard = (resources.magicShard ?? 0) + shardGain;
      }
      return { ...d, resources, characters, gachaPity: nextPity };
    });
  }

  private rollGrade(pity: number): GachaGrade {
    if (pity + 1 >= GACHA_CONFIG.pityLimit) {
      const denom = GACHA_CONFIG.rates.rare + GACHA_CONFIG.rates.legendary;
      return this.rand() < GACHA_CONFIG.rates.legendary / denom ? 'legendary' : 'rare';
    }
    const r = this.rand();
    if (r < GACHA_CONFIG.rates.legendary) return 'legendary';
    if (r < GACHA_CONFIG.rates.legendary + GACHA_CONFIG.rates.rare) return 'rare';
    return 'normal';
  }

  private pickFromPool(grade: GachaGrade): string {
    const pool = GACHA_POOL[grade];
    const idx = Math.floor(this.rand() * pool.length);
    return pool[idx] ?? (pool[0] as string);
  }

  /** Helper for the rates UI: everything the disclosure must show. */
  static disclosure(): {
    cost: number;
    pity: number;
    rates: typeof GACHA_CONFIG.rates;
    pool: typeof GACHA_POOL;
    duplicateShardReward: typeof DUPLICATE_SHARD_REWARD;
  } {
    return {
      cost: GACHA_CONFIG.costMagicStone,
      pity: GACHA_CONFIG.pityLimit,
      rates: GACHA_CONFIG.rates,
      pool: GACHA_POOL,
      duplicateShardReward: DUPLICATE_SHARD_REWARD,
    };
  }

  /** Save snapshot for tests. */
  snapshot(): SaveData {
    return this.gameState.get();
  }
}
