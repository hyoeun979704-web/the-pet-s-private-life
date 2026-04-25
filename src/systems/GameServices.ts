import { createInitialSaveData } from '@/entities/SaveData';
import { AdSystem, MockAdAdapter } from '@/systems/AdSystem';
import { EconomySystem, type GrantFn } from '@/systems/EconomySystem';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';

export interface GameServices {
  saveSystem: SaveSystem;
  gameState: GameState;
  economy: EconomySystem;
  ads: AdSystem;
}

let services: GameServices | null = null;

/**
 * Creates the dev-mode services (MemorySaveBackend + local grantFn).
 * In production, main.ts will call `initProductionServices` instead,
 * which will wire FirestoreSaveBackend and the addResources callable.
 *
 * Safe to call multiple times — returns the same instance.
 */
export function initDevServices(grantFn: GrantFn, now: () => number = () => Date.now()): GameServices {
  if (services) return services;
  const backend = new MemorySaveBackend();
  const saveSystem = new SaveSystem({ backend, now, saveRetries: 1 });
  const gameState = new GameState(createInitialSaveData('demo-player', now()), saveSystem);
  const economy = new EconomySystem({
    grantFn,
    getSave: () => gameState.get(),
    gameState,
  });
  // Dev mode uses MockAdAdapter (always succeeds). PART 13 swaps in the
  // Capacitor AdMob plugin adapter.
  const ads = new AdSystem({ adapter: new MockAdAdapter(), gameState, now });
  services = { saveSystem, gameState, economy, ads };
  return services;
}

export function getServices(): GameServices | null {
  return services;
}

/** Test-only: wipes the singleton so each test can start fresh. */
export function resetServicesForTesting(): void {
  services = null;
}
