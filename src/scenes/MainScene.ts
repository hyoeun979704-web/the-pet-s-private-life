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

    const placementBtn = this.add
      .text(width / 2, height / 2 + 40, `[ ${i18n.t('main.enter_placement')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    placementBtn.on('pointerup', () => this.scene.start('PlacementDemoScene'));

    const blockBtn = this.add
      .text(width / 2, height / 2 + 100, `[ ${i18n.t('main.enter_block', 'Block puzzle')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    blockBtn.on('pointerup', () => this.scene.start('BlockPuzzleScene'));

    const mergeBtn = this.add
      .text(width / 2, height / 2 + 160, `[ ${i18n.t('main.enter_merge', 'Merge')} ]`, {
        fontFamily: DESIGN_TOKENS.font.family,
        fontSize: `${DESIGN_TOKENS.font.sizeLg}px`,
        color: DESIGN_TOKENS.color.primaryDark,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    mergeBtn.on('pointerup', () => this.scene.start('MergeGameScene'));

    onNetworkChange((online) => {
      if (!online) this.scene.start('OfflineScene');
    });
  }
}
