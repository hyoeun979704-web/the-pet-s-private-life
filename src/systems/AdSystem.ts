import adPlacementsData from '@/data/adPlacements.json';
import type { AdPlacementDef, AdPlacementId } from '@/entities/AdPlacement';
import type { GameState } from '@/systems/GameState';
import { logger } from '@/utils/Logger';

export interface AdAdapter {
  /**
   * Returns true if the underlying SDK successfully showed an ad and the
   * user watched to completion. Implementations are responsible for retry
   * + fallback policy.
   */
  showRewarded(placementId: AdPlacementId): Promise<boolean>;
}

export interface WatchResult {
  ok: boolean;
  reason?:
    | 'unknown-placement'
    | 'daily-cap'
    | 'fill-failed'
    | 'consecutive-failures'
    | 'cancelled'
    | 'unknown';
}

export interface AdSystemOptions {
  adapter: AdAdapter;
  gameState: GameState;
  /**
   * After this many consecutive load failures the placement is disabled
   * for the rest of the session (per ROADMAP §광고 시스템).
   */
  failureThreshold?: number;
  /** Injected clock for deterministic tests. Defaults to Date.now. */
  now?: () => number;
}

const PLACEMENTS: AdPlacementDef[] =
  adPlacementsData.placements as unknown as AdPlacementDef[];
const PLACEMENT_BY_ID: Map<AdPlacementId, AdPlacementDef> = new Map(
  PLACEMENTS.map((p) => [p.id, p]),
);

/**
 * Coordinates rewarded-ad opportunities. Ad rendering itself is delegated
 * to the AdAdapter so the system can be tested with a mock and swapped to
 * a real AdMob plugin in PART 13. Reward application is the caller's
 * responsibility — we only signal that the ad was watched.
 */
export class AdSystem {
  private readonly adapter: AdAdapter;

  private readonly gameState: GameState;

  private readonly failureThreshold: number;

  private readonly now: () => number;

  /** Consecutive failure count per placement (resets on successful watch). */
  private readonly fails: Map<AdPlacementId, number> = new Map();

  /** Placements disabled for the remainder of the session after threshold hits. */
  private readonly disabled: Set<AdPlacementId> = new Set();

  constructor(opts: AdSystemOptions) {
    this.adapter = opts.adapter;
    this.gameState = opts.gameState;
    this.failureThreshold = opts.failureThreshold ?? 3;
    this.now = opts.now ?? (() => Date.now());
  }

  static getPlacement(id: AdPlacementId): AdPlacementDef | null {
    return PLACEMENT_BY_ID.get(id) ?? null;
  }

  static getAllPlacements(): readonly AdPlacementDef[] {
    return PLACEMENTS;
  }

  /** Today's used count for `placement`, defaulting to 0. */
  usedToday(placement: AdPlacementId): number {
    const daily = this.gameState.get().dailyLimits;
    // Apply midnight reset locally — server is authoritative but the client
    // shouldn't show stale 'cap reached' between midnight and the next
    // server-side grant call.
    if (this.now() >= daily.resetAtMs) return 0;
    return (daily.adsUsed ?? {})[placement] ?? 0;
  }

  remainingToday(placement: AdPlacementId): number {
    const def = PLACEMENT_BY_ID.get(placement);
    if (!def) return 0;
    return Math.max(0, def.dailyCap - this.usedToday(placement));
  }

  /**
   * True when the user is allowed to watch one more ad of this placement
   * today AND the placement hasn't been session-disabled by the failure
   * threshold.
   */
  canWatch(placement: AdPlacementId): boolean {
    if (this.disabled.has(placement)) return false;
    return this.remainingToday(placement) > 0;
  }

  /**
   * Shows an ad and bumps the daily counter on success. Caller must apply
   * the reward — AdSystem is reward-agnostic.
   */
  async watch(placement: AdPlacementId): Promise<WatchResult> {
    if (!PLACEMENT_BY_ID.has(placement)) {
      return { ok: false, reason: 'unknown-placement' };
    }
    if (this.disabled.has(placement)) {
      return { ok: false, reason: 'consecutive-failures' };
    }
    if (this.remainingToday(placement) <= 0) {
      return { ok: false, reason: 'daily-cap' };
    }

    let watched = false;
    try {
      watched = await this.adapter.showRewarded(placement);
    } catch (err) {
      logger.error('ad.adapter.threw', { placement, err: String(err) });
      this.bumpFailure(placement);
      return { ok: false, reason: 'unknown' };
    }

    if (!watched) {
      this.bumpFailure(placement);
      return { ok: false, reason: 'fill-failed' };
    }

    this.fails.set(placement, 0);
    await this.bumpUsed(placement);
    logger.info('ad.reward', { placement });
    return { ok: true };
  }

  private bumpFailure(placement: AdPlacementId): void {
    const next = (this.fails.get(placement) ?? 0) + 1;
    this.fails.set(placement, next);
    if (next >= this.failureThreshold) {
      this.disabled.add(placement);
      logger.warn('ad.disabled', { placement, after: next });
    }
  }

  private async bumpUsed(placement: AdPlacementId): Promise<void> {
    await this.gameState.patch((d) => {
      const adsUsed = { ...(d.dailyLimits.adsUsed ?? {}) };
      adsUsed[placement] = (adsUsed[placement] ?? 0) + 1;
      return { ...d, dailyLimits: { ...d.dailyLimits, adsUsed } };
    });
  }
}

// -----------------------------------------------------------------------------
// Built-in adapters
// -----------------------------------------------------------------------------

/** Always-succeeds adapter for dev mode and tests. */
export class MockAdAdapter implements AdAdapter {
  async showRewarded(_placementId: AdPlacementId): Promise<boolean> {
    return true;
  }
}

/** Fail-N-then-succeed adapter for testing failure thresholds. */
export class FailingAdAdapter implements AdAdapter {
  private remaining: number;

  constructor(failsRemaining: number) {
    this.remaining = failsRemaining;
  }

  async showRewarded(_placementId: AdPlacementId): Promise<boolean> {
    if (this.remaining > 0) {
      this.remaining -= 1;
      return false;
    }
    return true;
  }
}
