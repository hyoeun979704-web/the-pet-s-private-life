import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@/utils/Logger';

describe('Logger', () => {
  beforeEach(() => {
    // Silence console output during tests.
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logger.resetForTesting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    logger.resetForTesting();
  });

  it('subscribe receives every level', () => {
    const events: { level: string; event: string }[] = [];
    logger.subscribe((e) => events.push({ level: e.level, event: e.event }));
    logger.info('a');
    logger.warn('b');
    logger.error('c');
    expect(events).toEqual([
      { level: 'info', event: 'a' },
      { level: 'warn', event: 'b' },
      { level: 'error', event: 'c' },
    ]);
  });

  it('unsubscribe stops further events', () => {
    let calls = 0;
    const off = logger.subscribe(() => {
      calls += 1;
    });
    logger.info('one');
    off();
    logger.info('two');
    expect(calls).toBe(1);
  });

  it('a throwing listener does not break the broadcast', () => {
    let good = 0;
    logger.subscribe(() => {
      throw new Error('boom');
    });
    logger.subscribe(() => {
      good += 1;
    });
    logger.info('x');
    expect(good).toBe(1);
  });

  it('getRecent caps at 50 entries', () => {
    for (let i = 0; i < 60; i += 1) logger.info(`e${i}`);
    expect(logger.getRecent()).toHaveLength(50);
    expect(logger.getRecent()[0]?.event).toBe('e10');
  });
});
