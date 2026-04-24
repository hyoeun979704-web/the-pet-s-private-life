import Phaser from 'phaser';
import { createGameConfig } from '@/config/GameConfig';
import { initFirebase } from '@/config/FirebaseConfig';
import { i18n } from '@/systems/I18nSystem';
import { logger } from '@/utils/Logger';

async function bootstrap(): Promise<void> {
  try {
    await i18n.init();
    await initFirebase();
    const game = new Phaser.Game(createGameConfig());
    logger.info('game.bootstrapped', { version: game.config.gameVersion });
  } catch (err) {
    logger.error('bootstrap.failed', err);
  }
}

bootstrap();
