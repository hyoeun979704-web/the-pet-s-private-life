import { DAILY_RESET_TIMEZONE_OFFSET_MIN } from '@/config/Constants';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_MS = 60 * 1000;

/**
 * Next local-midnight boundary (in UTC epoch ms) for a given timezone offset.
 * Defaults to KST (UTC+9). Kept as a pure function so it can be tested
 * without touching Date.now().
 */
export function nextMidnightMs(
  nowMs: number,
  offsetMin: number = DAILY_RESET_TIMEZONE_OFFSET_MIN,
): number {
  const offsetMs = offsetMin * MIN_MS;
  const localNow = nowMs + offsetMs;
  const localMidnight = Math.floor(localNow / DAY_MS) * DAY_MS + DAY_MS;
  return localMidnight - offsetMs;
}

/**
 * True if `resetAtMs` has passed — caller should reset daily counters
 * and advance resetAtMs to the next midnight.
 */
export function isAfterMidnight(nowMs: number, resetAtMs: number): boolean {
  return nowMs >= resetAtMs;
}
