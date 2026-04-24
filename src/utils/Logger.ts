type LogMeta = Record<string, unknown> | Error | unknown;

function format(event: string, meta?: LogMeta): [string, LogMeta?] {
  return meta !== undefined ? [`[${event}]`, meta] : [`[${event}]`];
}

export const logger = {
  info(event: string, meta?: LogMeta): void {
    const [prefix, m] = format(event, meta);
    if (m !== undefined) console.info(prefix, m);
    else console.info(prefix);
  },
  warn(event: string, meta?: LogMeta): void {
    const [prefix, m] = format(event, meta);
    if (m !== undefined) console.warn(prefix, m);
    else console.warn(prefix);
  },
  error(event: string, err?: LogMeta): void {
    const [prefix, m] = format(event, err);
    if (m !== undefined) console.error(prefix, m);
    else console.error(prefix);
    // NOTE: PART 13 에서 Capacitor Firebase Crashlytics 플러그인 연동 예정.
    // 웹 런타임에서는 console.error 로만 기록됨.
  },
};
