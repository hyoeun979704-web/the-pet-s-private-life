import { afterEach, describe, it, expect } from 'vitest';
import { createInitialSaveData } from '@/entities/SaveData';
import {
  CrashReporter,
  MemoryCrashlyticsAdapter,
  NoopCrashlyticsAdapter,
} from '@/systems/CrashReporter';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';
import { SilentSoundAdapter, SoundManager, type SoundAdapter } from '@/systems/SoundManager';
import { logger } from '@/utils/Logger';

function makeGs(volumeOverrides: Partial<{ bgmVolume: number; sfxVolume: number }> = {}) {
  const sys = new SaveSystem({ backend: new MemorySaveBackend(), now: () => 0, saveRetries: 1 });
  const initial = createInitialSaveData('p1', 0);
  initial.settings = { ...initial.settings, ...volumeOverrides };
  return new GameState(initial, sys);
}

class TrackingSoundAdapter implements SoundAdapter {
  bgm: { track: string; vol: number }[] = [];

  sfx: { sfx: string; vol: number }[] = [];

  stops = 0;

  async playBgm(track: string, volume: number): Promise<void> {
    this.bgm.push({ track, vol: volume });
  }

  async stopBgm(): Promise<void> {
    this.stops += 1;
  }

  async playSfx(sfx: string, volume: number): Promise<void> {
    this.sfx.push({ sfx, vol: volume });
  }
}

describe('SoundManager', () => {
  it('plays BGM with the current bgmVolume from settings', async () => {
    const tracker = new TrackingSoundAdapter();
    const sm = new SoundManager({ adapter: tracker, gameState: makeGs({ bgmVolume: 0.5 }) });
    await sm.playBgm('lobby');
    expect(tracker.bgm).toEqual([{ track: 'lobby', vol: 0.5 }]);
  });

  it('skips BGM playback when volume is 0 (still tracks the current track)', async () => {
    const tracker = new TrackingSoundAdapter();
    const sm = new SoundManager({ adapter: tracker, gameState: makeGs({ bgmVolume: 0 }) });
    await sm.playBgm('lobby');
    expect(tracker.bgm).toEqual([]);
    // Calling again with the same track is a no-op regardless of volume.
    await sm.playBgm('lobby');
    expect(tracker.bgm).toEqual([]);
  });

  it('does not double-play the same BGM', async () => {
    const tracker = new TrackingSoundAdapter();
    const sm = new SoundManager({ adapter: tracker, gameState: makeGs() });
    await sm.playBgm('lobby');
    await sm.playBgm('lobby');
    expect(tracker.bgm).toHaveLength(1);
  });

  it('stopBgm calls adapter.stopBgm and clears state', async () => {
    const tracker = new TrackingSoundAdapter();
    const sm = new SoundManager({ adapter: tracker, gameState: makeGs() });
    await sm.playBgm('lobby');
    await sm.stopBgm();
    expect(tracker.stops).toBe(1);
  });

  it('SilentSoundAdapter is a clean no-op', async () => {
    const sm = new SoundManager({ adapter: new SilentSoundAdapter(), gameState: makeGs() });
    await sm.playBgm('lobby');
    await sm.playSfx('tap');
    await sm.stopBgm();
    // Just asserts no throw.
  });
});

describe('CrashReporter', () => {
  afterEach(() => logger.resetForTesting());

  it('forwards Logger.error to the Crashlytics adapter once started', () => {
    const adapter = new MemoryCrashlyticsAdapter();
    const cr = new CrashReporter({ adapter });
    cr.start();
    logger.error('test.error', { boom: true });
    expect(adapter.exceptions).toHaveLength(1);
    expect(adapter.exceptions[0]?.message).toBe('test.error');
    cr.stop();
  });

  it('stop unsubscribes', () => {
    const adapter = new MemoryCrashlyticsAdapter();
    const cr = new CrashReporter({ adapter });
    cr.start();
    cr.stop();
    logger.error('after.stop');
    expect(adapter.exceptions).toHaveLength(0);
  });

  it('setUid forwards a custom key', () => {
    const adapter = new MemoryCrashlyticsAdapter();
    const cr = new CrashReporter({ adapter });
    cr.setUid('player-7');
    expect(adapter.customKeys.uid).toBe('player-7');
  });

  it('NoopCrashlyticsAdapter swallows everything (smoke test)', () => {
    const cr = new CrashReporter({ adapter: new NoopCrashlyticsAdapter() });
    cr.start();
    logger.error('whatever');
    cr.stop();
    // No throw is the assertion.
  });
});
