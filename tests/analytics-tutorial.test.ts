import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { createInitialSaveData } from '@/entities/SaveData';
import { AnalyticsSystem, MemoryAnalyticsTransport } from '@/systems/AnalyticsSystem';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';
import { TUTORIAL_STEPS, TutorialSystem } from '@/systems/TutorialSystem';
import { logger } from '@/utils/Logger';

function makeGs() {
  const sys = new SaveSystem({ backend: new MemorySaveBackend(), now: () => 0, saveRetries: 1 });
  return new GameState(createInitialSaveData('p1', 0), sys);
}

describe('AnalyticsSystem', () => {
  it('emit forwards to the transport with timestamp', () => {
    const t = new MemoryAnalyticsTransport();
    const a = new AnalyticsSystem({ transport: t, crashFromLogger: false, now: () => 7 });
    a.emit('session_start');
    expect(t.events).toHaveLength(1);
    expect(t.events[0]?.name).toBe('session_start');
    expect(t.events[0]?.at).toBe(7);
  });

  it('forwards Logger.error to crash event when crashFromLogger=true', () => {
    const t = new MemoryAnalyticsTransport();
    logger.resetForTesting();
    const a = new AnalyticsSystem({ transport: t, crashFromLogger: true });
    logger.error('test.error', { boom: true });
    expect(t.events.find((e) => e.name === 'crash')).toBeDefined();
    a.destroy();
  });

  it('destroy unsubscribes from logger so no further crash events fire', () => {
    const t = new MemoryAnalyticsTransport();
    logger.resetForTesting();
    const a = new AnalyticsSystem({ transport: t, crashFromLogger: true });
    a.destroy();
    logger.error('after.destroy');
    expect(t.events.find((e) => e.name === 'crash')).toBeUndefined();
  });

  it('keeps a bounded recent buffer for debug panels', () => {
    const t = new MemoryAnalyticsTransport();
    const a = new AnalyticsSystem({ transport: t, crashFromLogger: false });
    for (let i = 0; i < 50; i += 1) a.emit('session_end', { i });
    expect(a.getRecent().length).toBeLessThanOrEqual(30);
  });
});

describe('TutorialSystem', () => {
  let transport: MemoryAnalyticsTransport;
  let analytics: AnalyticsSystem;

  beforeEach(() => {
    transport = new MemoryAnalyticsTransport();
    analytics = new AnalyticsSystem({ transport, crashFromLogger: false, now: () => 0 });
  });

  afterEach(() => {
    analytics.destroy();
  });

  it('start sets currentIndex to 0 and emits tutorial_step', async () => {
    const gs = makeGs();
    const tut = new TutorialSystem({ gameState: gs, analytics, now: () => 1000 });
    await tut.start();
    expect(gs.get().tutorial?.currentIndex).toBe(0);
    expect(transport.events.some((e) => e.name === 'tutorial_step')).toBe(true);
  });

  it('advance moves to the next step', async () => {
    const gs = makeGs();
    const tut = new TutorialSystem({ gameState: gs, analytics, now: () => 1000 });
    await tut.start();
    await tut.advance();
    expect(gs.get().tutorial?.currentIndex).toBe(1);
    expect(tut.currentStep()).toBe(TUTORIAL_STEPS[1] ?? null);
  });

  it('advance past the last step marks tutorial complete and emits tutorial_complete', async () => {
    const gs = makeGs();
    const tut = new TutorialSystem({ gameState: gs, analytics, now: () => 1000 });
    await tut.start();
    await TUTORIAL_STEPS.reduce(async (prev) => {
      await prev;
      await tut.advance();
    }, Promise.resolve());
    expect(tut.isComplete()).toBe(true);
    expect(transport.events.some((e) => e.name === 'tutorial_complete')).toBe(true);
  });

  it('skipAll completes immediately and emits with skipped=true', async () => {
    const gs = makeGs();
    const tut = new TutorialSystem({ gameState: gs, analytics, now: () => 0 });
    await tut.skipAll();
    expect(tut.isComplete()).toBe(true);
    const complete = transport.events.find((e) => e.name === 'tutorial_complete');
    expect(complete?.params.skipped).toBe(true);
  });

  it('start on a finished tutorial is a no-op', async () => {
    const gs = makeGs();
    const tut = new TutorialSystem({ gameState: gs, analytics, now: () => 0 });
    await tut.skipAll();
    transport.events.length = 0;
    await tut.start();
    expect(transport.events).toHaveLength(0);
  });
});
