import {
  DAILY_LIMITS,
  EXP_BY_SOURCE,
  MAX_RESOURCE_GAIN_PER_SOURCE,
  type ResourceGainSource,
  type ResourceKey,
} from '@/config/Constants';
import type { Resources, SaveData } from '@/entities/SaveData';
import { detectLevelUps, type LevelUp } from '@/systems/LevelSystem';
import type { GameState } from '@/systems/GameState';

export type ResourceDelta = Partial<Record<ResourceKey, number>>;

export interface GrantResult {
  ok: boolean;
  reason?:
    | 'unknown-source'
    | 'key-not-allowed'
    | 'cap-exceeded'
    | 'daily-limit'
    | 'server-denied'
    | 'offline';
  granted?: ResourceDelta;
  error?: unknown;
}

export interface GrantFn {
  (source: ResourceGainSource, deltas: ResourceDelta): Promise<GrantResult>;
}

export interface EconomySystemOptions {
  grantFn: GrantFn;
  /**
   * Read the current save (resources + dailyLimits). The EconomySystem
   * does not hold state directly — it asks its owner for the latest snapshot
   * to avoid stale reads after a server mutation.
   */
  getSave: () => SaveData;
  /**
   * Optional: when provided, applyExp / grantWithExp will mutate the save's
   * exp + level via this game state. Without it, applyExp is a no-op (used
   * by unit tests that focus on grant validation).
   */
  gameState?: GameState;
}

export interface GrantWithExpResult {
  grant: GrantResult;
  expGained: number;
  levelUps: LevelUp[];
  /** Per-level grants triggered by the level-up cascade. */
  levelUpGrants: GrantResult[];
}

export class EconomySystem {
  private readonly grantFn: GrantFn;

  private readonly getSave: () => SaveData;

  private readonly gameState: GameState | null;

  constructor(options: EconomySystemOptions) {
    this.grantFn = options.grantFn;
    this.getSave = options.getSave;
    this.gameState = options.gameState ?? null;
  }

  wallet(): Resources {
    return this.getSave().resources;
  }

  canAfford(cost: ResourceDelta): boolean {
    const w = this.wallet();
    return (Object.keys(cost) as ResourceKey[]).every((k) => (w[k] ?? 0) >= (cost[k] ?? 0));
  }

  /**
   * Client-side pre-flight validation. The server does the authoritative
   * version; we check here to avoid round-trips on obvious mistakes.
   */
  canGrant(source: ResourceGainSource, deltas: ResourceDelta): GrantResult {
    const caps = MAX_RESOURCE_GAIN_PER_SOURCE[source];
    if (!caps) return { ok: false, reason: 'unknown-source' };

    const capsMap = caps as Partial<Record<ResourceKey, number>>;
    const keys = Object.keys(deltas) as ResourceKey[];
    const unknownKey = keys.find((key) => capsMap[key] === undefined);
    if (unknownKey) return { ok: false, reason: 'key-not-allowed' };
    const overCap = keys.some((key) => (deltas[key] ?? 0) > (capsMap[key] ?? 0));
    if (overCap) return { ok: false, reason: 'cap-exceeded' };

    const save = this.getSave();
    // Milestone rewards (level_up, login_bonus) bypass daily caps —
    // mirrors the server addResources exemption.
    const exemptFromDaily = source === 'level_up' || source === 'login_bonus';
    if (!exemptFromDaily) {
      const todaySnack = save.dailyLimits.snackEarned + (deltas.snack ?? 0);
      const todayStar = save.dailyLimits.starDustEarned + (deltas.starDust ?? 0);
      if (todaySnack > DAILY_LIMITS.snack || todayStar > DAILY_LIMITS.starDust) {
        return { ok: false, reason: 'daily-limit' };
      }
    }
    if (source === 'quiz' && save.dailyLimits.quizSessionsUsed >= DAILY_LIMITS.quizSessions) {
      return { ok: false, reason: 'daily-limit' };
    }

    return { ok: true, granted: deltas };
  }

  /** True if a fresh quiz session can still be redeemed today. */
  canStartQuizSession(): boolean {
    return this.getSave().dailyLimits.quizSessionsUsed < DAILY_LIMITS.quizSessions;
  }

  async grant(
    source: ResourceGainSource,
    deltas: ResourceDelta,
  ): Promise<GrantResult> {
    const pre = this.canGrant(source, deltas);
    if (!pre.ok) return pre;
    return this.grantFn(source, deltas);
  }

  /**
   * Locally available headroom vs. daily cap, for "120 / 200" HUD labels.
   */
  dailyRemaining(): { snack: number; starDust: number } {
    const d = this.getSave().dailyLimits;
    return {
      snack: Math.max(0, DAILY_LIMITS.snack - d.snackEarned),
      starDust: Math.max(0, DAILY_LIMITS.starDust - d.starDustEarned),
    };
  }

  /**
   * Mutates the save's exp + level via gameState, returns the level-ups
   * crossed (one per threshold). NOTE: rewards are NOT auto-granted here —
   * call grantWithExp() if you want the cascade.
   */
  async applyExp(amount: number): Promise<LevelUp[]> {
    if (!this.gameState || amount <= 0) return [];
    const prev = this.getSave();
    const newExp = prev.exp + amount;
    const ups = detectLevelUps(prev.level, newExp);
    const newLevel = ups.length > 0 ? (ups[ups.length - 1] as LevelUp).to : prev.level;
    await this.gameState.patch((d) => ({ ...d, exp: newExp, level: newLevel }));
    return ups;
  }

  /**
   * Convenience: server-grant resources, add exp for the source, and grant
   * each level-up reward through the same server path. Best-effort — a
   * cap-rejected level-up grant is logged in the result but doesn't roll
   * back the original grant.
   */
  async grantWithExp(
    source: ResourceGainSource,
    deltas: ResourceDelta,
    options: { expOverride?: number; expMultiplier?: number } = {},
  ): Promise<GrantWithExpResult> {
    const main = await this.grant(source, deltas);
    if (!main.ok) {
      return { grant: main, expGained: 0, levelUps: [], levelUpGrants: [] };
    }

    let expBase = options.expOverride ?? EXP_BY_SOURCE[source] ?? 0;
    if (options.expMultiplier !== undefined) expBase *= options.expMultiplier;
    const expGained = Math.max(0, Math.floor(expBase));
    const levelUps = await this.applyExp(expGained);

    const levelUpGrants: GrantResult[] = [];
    // Sequential await is intentional: the server caps per-call rewards and
    // we want each level-up to be a discrete, auditable event.
    await levelUps.reduce(
      async (prev, lu) => {
        await prev;
        const res = await this.grant('level_up', lu.reward);
        levelUpGrants.push(res);
      },
      Promise.resolve(),
    );
    return { grant: main, expGained, levelUps, levelUpGrants };
  }
}
