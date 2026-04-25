type LogMeta = Record<string, unknown> | Error | unknown;

export interface LogEvent {
  level: 'info' | 'warn' | 'error';
  event: string;
  meta?: LogMeta;
  at: number;
}

export type LogListener = (event: LogEvent) => void;

const listeners = new Set<LogListener>();
const recent: LogEvent[] = [];
const MAX_RECENT = 50;

function emit(event: LogEvent): void {
  recent.push(event);
  if (recent.length > MAX_RECENT) recent.shift();
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      // A buggy listener must not break logging.
    }
  });
}

function format(event: string, meta?: LogMeta): [string, LogMeta?] {
  return meta !== undefined ? [`[${event}]`, meta] : [`[${event}]`];
}

export const logger = {
  info(event: string, meta?: LogMeta): void {
    const [prefix, m] = format(event, meta);
    if (m !== undefined) console.info(prefix, m);
    else console.info(prefix);
    emit({ level: 'info', event, meta, at: Date.now() });
  },
  warn(event: string, meta?: LogMeta): void {
    const [prefix, m] = format(event, meta);
    if (m !== undefined) console.warn(prefix, m);
    else console.warn(prefix);
    emit({ level: 'warn', event, meta, at: Date.now() });
  },
  error(event: string, err?: LogMeta): void {
    const [prefix, m] = format(event, err);
    if (m !== undefined) console.error(prefix, m);
    else console.error(prefix);
    emit({ level: 'error', event, meta: err, at: Date.now() });
    // NOTE: PART 13 wires Capacitor Firebase Crashlytics. The 'error'
    // listener slot is the integration point: PART 13 will subscribe and
    // forward to Crashlytics.recordException.
  },

  /**
   * Subscribe to all log events. Returns an unsubscribe function.
   * Used by analytics (PART 11) and Crashlytics wiring (PART 13).
   */
  subscribe(listener: LogListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  /** Last N events (capped at 50). Useful for an in-app debug panel. */
  getRecent(): readonly LogEvent[] {
    return recent.slice();
  },

  /** Test-only: drop subscribers + clear the recent buffer. */
  resetForTesting(): void {
    listeners.clear();
    recent.length = 0;
  },
};
