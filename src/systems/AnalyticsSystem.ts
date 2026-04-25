/**
 * Lightweight analytics fanout. The actual transport (Firebase Analytics)
 * is wired in PART 13; this layer is what gameplay code calls so wiring
 * doesn't have to revisit every emit site.
 *
 * Per ROADMAP §분석 이벤트, the canonical event names are:
 *   tutorial_step / tutorial_complete
 *   session_start / session_end
 *   minigame_start / minigame_end
 *   resource_gain / resource_spend
 *   gacha_roll
 *   level_up
 *   ad_request / ad_impression / ad_reward
 *   iap_purchase
 *   room_expand
 *   crash
 */

import { logger } from '@/utils/Logger';

export type AnalyticsEventName =
  | 'tutorial_step'
  | 'tutorial_complete'
  | 'session_start'
  | 'session_end'
  | 'minigame_start'
  | 'minigame_end'
  | 'resource_gain'
  | 'resource_spend'
  | 'gacha_roll'
  | 'level_up'
  | 'ad_request'
  | 'ad_impression'
  | 'ad_reward'
  | 'iap_purchase'
  | 'room_expand'
  | 'crash';

export type AnalyticsParams = Record<string, string | number | boolean | null | undefined>;

function stringify(meta: unknown): string {
  if (meta === undefined) return '';
  if (meta instanceof Error) return meta.message;
  try {
    return typeof meta === 'string' ? meta : JSON.stringify(meta);
  } catch {
    return String(meta);
  }
}

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  params: AnalyticsParams;
  at: number;
}

export interface AnalyticsTransport {
  send(event: AnalyticsEvent): void;
}

export class ConsoleAnalyticsTransport implements AnalyticsTransport {
  send(event: AnalyticsEvent): void {
    // Useful in dev. Production transport replaces this.
    logger.info(`analytics.${event.name}`, event.params);
  }
}

export interface AnalyticsSystemOptions {
  transport: AnalyticsTransport;
  /** Auto-forward Logger.error events as `crash` events. */
  crashFromLogger?: boolean;
  now?: () => number;
}

export class AnalyticsSystem {
  private readonly transport: AnalyticsTransport;

  private readonly now: () => number;

  private readonly recent: AnalyticsEvent[] = [];

  private readonly RECENT_CAP = 30;

  private unsubLogger: (() => void) | null = null;

  constructor(opts: AnalyticsSystemOptions) {
    this.transport = opts.transport;
    this.now = opts.now ?? (() => Date.now());
    if (opts.crashFromLogger ?? true) {
      this.unsubLogger = logger.subscribe((e) => {
        if (e.level === 'error') {
          this.emit('crash', { event: e.event, message: stringify(e.meta) });
        }
      });
    }
  }

  emit(name: AnalyticsEventName, params: AnalyticsParams = {}): void {
    const event: AnalyticsEvent = { name, params, at: this.now() };
    this.recent.push(event);
    if (this.recent.length > this.RECENT_CAP) this.recent.shift();
    this.transport.send(event);
  }

  getRecent(): readonly AnalyticsEvent[] {
    return this.recent.slice();
  }

  destroy(): void {
    this.unsubLogger?.();
    this.unsubLogger = null;
  }
}

/** Test transport — captures events for assertion. */
export class MemoryAnalyticsTransport implements AnalyticsTransport {
  readonly events: AnalyticsEvent[] = [];

  send(event: AnalyticsEvent): void {
    this.events.push(event);
  }
}
