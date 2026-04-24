import Phaser from 'phaser';
import { DESIGN_TOKENS } from '@/config/Constants';
import { i18n } from '@/systems/I18nSystem';
import { isOnline } from '@/utils/NetworkUtil';

export class OfflineScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OfflineScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bgAlt);

    this.add
      .text(width / 2, height / 2 - 60, i18n.t('offline.title'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeXl}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, i18n.t('offline.body'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeMd}px`,
        color: DESIGN_TOKENS.color.textSecondary,
        align: 'center',
      })
      .setOrigin(0.5);

    const retry = this.add
      .text(width / 2, height / 2 + 80, `[ ${i18n.t('offline.retry')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    retry.on('pointerup', () => {
      if (isOnline()) this.scene.start('BootScene');
    });
  }
}
