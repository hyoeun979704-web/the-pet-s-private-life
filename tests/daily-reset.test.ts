import { describe, it, expect } from 'vitest';
import { isAfterMidnight, nextMidnightMs } from '@/utils/DailyReset';

// KST offset = +9h. Midnight in KST = 15:00 UTC the previous day.
// UTC 2026-04-24T10:00:00Z -> KST 2026-04-24T19:00:00+09:00
//   next local midnight: 2026-04-25T00:00:00+09:00 = 2026-04-24T15:00:00Z
const UTC = (iso: string) => Date.parse(`${iso}Z`);

describe('DailyReset', () => {
  it('rolls forward to next KST midnight when called mid-day', () => {
    const now = UTC('2026-04-24T10:00:00');
    const expected = UTC('2026-04-24T15:00:00');
    expect(nextMidnightMs(now)).toBe(expected);
  });

  it('rolls to the next day when called after local midnight', () => {
    const now = UTC('2026-04-24T16:00:00'); // already past 2026-04-25T01:00 KST
    const expected = UTC('2026-04-25T15:00:00');
    expect(nextMidnightMs(now)).toBe(expected);
  });

  it('exactly at midnight rolls to the following day', () => {
    const now = UTC('2026-04-24T15:00:00'); // 2026-04-25T00:00 KST exactly
    const expected = UTC('2026-04-25T15:00:00');
    expect(nextMidnightMs(now)).toBe(expected);
  });

  it('isAfterMidnight triggers only at or after the reset boundary', () => {
    const reset = UTC('2026-04-24T15:00:00');
    expect(isAfterMidnight(reset - 1, reset)).toBe(false);
    expect(isAfterMidnight(reset, reset)).toBe(true);
    expect(isAfterMidnight(reset + 1, reset)).toBe(true);
  });
});
