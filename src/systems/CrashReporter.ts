import { logger, type LogEvent } from '@/utils/Logger';

export interface CrashlyticsAdapter {
  recordException(message: string, data?: Record<string, unknown>): void;
  setCustomKey(key: string, value: string | number | boolean): void;
}

export interface CrashReporterOptions {
  adapter: CrashlyticsAdapter;
}

/**
 * Subscribes to Logger 'error' events and forwards them to a Crashlytics
 * adapter. The adapter is supplied in production wiring; for dev or web
 * runtime the NoopCrashlyticsAdapter prevents any side effects.
 */
export class CrashReporter {
  private readonly adapter: CrashlyticsAdapter;

  private unsub: (() => void) | null = null;

  constructor(opts: CrashReporterOptions) {
    this.adapter = opts.adapter;
  }

  start(): void {
    if (this.unsub) return;
    this.unsub = logger.subscribe((e: LogEvent) => {
      if (e.level !== 'error') return;
      const message = e.event;
      const data: Record<string, unknown> = {};
      if (e.meta && typeof e.meta === 'object') Object.assign(data, e.meta);
      this.adapter.recordException(message, data);
    });
  }

  stop(): void {
    this.unsub?.();
    this.unsub = null;
  }

  setUid(uid: string): void {
    this.adapter.setCustomKey('uid', uid);
  }
}

/** Adapter for non-native or pre-deploy environments. */
export class NoopCrashlyticsAdapter implements CrashlyticsAdapter {
  // eslint-disable-next-line class-methods-use-this
  recordException(): void {
    /* no-op */
  }

  // eslint-disable-next-line class-methods-use-this
  setCustomKey(): void {
    /* no-op */
  }
}

/** In-memory adapter for tests. */
export class MemoryCrashlyticsAdapter implements CrashlyticsAdapter {
  readonly exceptions: { message: string; data: Record<string, unknown> }[] = [];

  readonly customKeys: Record<string, string | number | boolean> = {};

  recordException(message: string, data: Record<string, unknown> = {}): void {
    this.exceptions.push({ message, data });
  }

  setCustomKey(key: string, value: string | number | boolean): void {
    this.customKeys[key] = value;
  }
}
