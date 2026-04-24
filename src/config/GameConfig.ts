import Phaser from 'phaser';
import { BootScene } from '@/scenes/BootScene';
import { LoadingScene } from '@/scenes/LoadingScene';
import { MainScene } from '@/scenes/MainScene';
import { OfflineScene } from '@/scenes/OfflineScene';
import { DESIGN_TOKENS, GAME_META } from './Constants';

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game',
    version: GAME_META.version,
    backgroundColor: DESIGN_TOKENS.color.bg,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_META.baseWidth,
      height: GAME_META.baseHeight,
    },
    fps: {
      target: GAME_META.targetFps,
      forceSetTimeOut: false,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    scene: [BootScene, LoadingScene, MainScene, OfflineScene],
  };
}
