import type { GameState } from '@/systems/GameState';
import { logger } from '@/utils/Logger';

export type BgmTrackId = 'lobby' | 'block_puzzle' | 'merge_game' | 'quiz' | 'gacha';
export type SfxId =
  | 'tap'
  | 'place'
  | 'merge'
  | 'line_clear'
  | 'gacha_roll'
  | 'gacha_result_legendary'
  | 'gacha_result_rare'
  | 'gacha_result_normal'
  | 'level_up'
  | 'purchase'
  | 'error';

export interface SoundAdapter {
  playBgm(track: BgmTrackId, volume: number): Promise<void>;
  stopBgm(): Promise<void>;
  playSfx(sfx: SfxId, volume: number): Promise<void>;
}

export interface SoundManagerOptions {
  adapter: SoundAdapter;
  gameState: GameState;
}

/**
 * Reads volumes from save settings on every play call so the user's
 * preference applies immediately. The adapter is a thin transport — any
 * Phaser/Howler/native audio engine can be swapped in by re-implementing
 * the three methods.
 */
export class SoundManager {
  private readonly adapter: SoundAdapter;

  private readonly gameState: GameState;

  private currentBgm: BgmTrackId | null = null;

  constructor(opts: SoundManagerOptions) {
    this.adapter = opts.adapter;
    this.gameState = opts.gameState;
  }

  async playBgm(track: BgmTrackId): Promise<void> {
    if (this.currentBgm === track) return;
    const vol = this.gameState.get().settings.bgmVolume;
    if (vol <= 0) {
      this.currentBgm = track;
      return;
    }
    try {
      await this.adapter.playBgm(track, vol);
      this.currentBgm = track;
    } catch (err) {
      logger.warn('sound.bgm.failed', { track, err: String(err) });
    }
  }

  async stopBgm(): Promise<void> {
    if (!this.currentBgm) return;
    try {
      await this.adapter.stopBgm();
    } catch (err) {
      logger.warn('sound.bgm.stop.failed', { err: String(err) });
    }
    this.currentBgm = null;
  }

  async playSfx(sfx: SfxId): Promise<void> {
    const vol = this.gameState.get().settings.sfxVolume;
    if (vol <= 0) return;
    try {
      await this.adapter.playSfx(sfx, vol);
    } catch (err) {
      logger.warn('sound.sfx.failed', { sfx, err: String(err) });
    }
  }
}

/** No-op adapter for dev / tests / 'silent build'. */
export class SilentSoundAdapter implements SoundAdapter {
  async playBgm(): Promise<void> {
    /* no-op */
  }

  async stopBgm(): Promise<void> {
    /* no-op */
  }

  async playSfx(): Promise<void> {
    /* no-op */
  }
}
