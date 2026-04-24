import Phaser from 'phaser';
import { DESIGN_TOKENS } from '@/config/Constants';
import { i18n } from '@/systems/I18nSystem';
import { onNetworkChange } from '@/utils/NetworkUtil';

export class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(DESIGN_TOKENS.color.bg);

    this.add
      .text(width / 2, height / 2 - 60, i18n.t('main.welcome'), {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeXl}px`,
        color: DESIGN_TOKENS.color.textPrimary,
      })
      .setOrigin(0.5);

    const btn = this.add
      .text(width / 2, height / 2 + 40, `[ ${i18n.t('main.enter_placement')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerup', () => this.scene.start('PlacementDemoScene'));

    onNetworkChange((online) => {
      if (!online) this.scene.start('OfflineScene');
    });
  }
}
