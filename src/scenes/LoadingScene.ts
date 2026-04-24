import Phaser from 'phaser';
import { DESIGN_TOKENS, GAME_META } from '@/config/Constants';
import { i18n } from '@/systems/I18nSystem';

const MIN_DISPLAY_MS = 1200;

export class LoadingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoadingScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bgAlt);

    this.add
      .text(width / 2, height / 2 - 40, i18n.t('common.loading', 'Loading…'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 20, i18n.t('loading.tip'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.textSecondary,
      })
      .setOrigin(0.5);

    this.add
      .text(10, height - 24, `v${GAME_META.version}`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeSm}px`,
        color: DESIGN_TOKENS.color.textSecondary,
      })
      .setOrigin(0, 1);

    this.time.delayedCall(MIN_DISPLAY_MS, () => this.scene.start('MainScene'));
  }
}
