import Phaser from 'phaser';
import { createGameConfig } from '@/config/GameConfig';
import { initFirebase } from '@/config/FirebaseConfig';
import { i18n } from '@/systems/I18nSystem';
import { initDevServices } from '@/systems/GameServices';
import type { SaveData } from '@/entities/SaveData';
import type { GrantFn, ResourceDelta } from '@/systems/EconomySystem';
import type { ResourceGainSource } from '@/config/Constants';
import { logger } from '@/utils/Logger';

function mergeGrantLocal(
  save: SaveData,
  source: ResourceGainSource,
  deltas: ResourceDelta,
): SaveData {
  const resources = { ...save.resources };
  let { snackEarned, starDustEarned, quizSessionsUsed } = save.dailyLimits;
  (Object.keys(deltas) as Array<keyof typeof deltas>).forEach((key) => {
    const add = deltas[key] ?? 0;
    resources[key] = (resources[key] ?? 0) + add;
    if (key === 'snack') snackEarned += add;
    if (key === 'starDust') starDustEarned += add;
  });
  // Mirror server addResources behavior: a 'quiz' grant burns the daily
  // session counter regardless of payload (closes the fail-to-peek loop
  // for dev/local play).
  if (source === 'quiz') quizSessionsUsed += 1;
  return {
    ...save,
    resources,
    dailyLimits: { ...save.dailyLimits, snackEarned, starDustEarned, quizSessionsUsed },
  };
}

async function bootstrap(): Promise<void> {
  try {
    await i18n.init();
    await initFirebase();

    // Dev-mode services (no real server). PART 11+ will swap this for a
    // production grantFn backed by the addResources Cloud Function.
    const devGrantFn: GrantFn = async (source, deltas) => {
      const svc = initDevServices(devGrantFn);
      await svc.gameState.patch((d) => mergeGrantLocal(d, source, deltas));
      return { ok: true, granted: deltas };
    };
    initDevServices(devGrantFn);

    const game = new Phaser.Game(createGameConfig());
    logger.info('game.bootstrapped', { version: game.config.gameVersion });
  } catch (err) {
    logger.error('bootstrap.failed', err);
  }
}

bootstrap();
