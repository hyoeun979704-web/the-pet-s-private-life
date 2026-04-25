import {
  DAILY_LIMITS,
  MAX_RESOURCE_GAIN_PER_SOURCE,
  type ResourceGainSource,
  type ResourceKey,
} from '@/config/Constants';
import type { Resources, SaveData } from '@/entities/SaveData';

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
}

export class EconomySystem {
  private readonly grantFn: GrantFn;

  private readonly getSave: () => SaveData;

  constructor(options: EconomySystemOptions) {
    this.grantFn = options.grantFn;
    this.getSave = options.getSave;
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
    const todaySnack = save.dailyLimits.snackEarned + (deltas.snack ?? 0);
    const todayStar = save.dailyLimits.starDustEarned + (deltas.starDust ?? 0);
    if (todaySnack > DAILY_LIMITS.snack || todayStar > DAILY_LIMITS.starDust) {
      return { ok: false, reason: 'daily-limit' };
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
}
