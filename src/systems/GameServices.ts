import { createInitialSaveData } from '@/entities/SaveData';
import { EconomySystem, type GrantFn } from '@/systems/EconomySystem';
import { GameState } from '@/systems/GameState';
import { MemorySaveBackend, SaveSystem } from '@/systems/SaveSystem';

export interface GameServices {
  saveSystem: SaveSystem;
  gameState: GameState;
  economy: EconomySystem;
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
  });
  services = { saveSystem, gameState, economy };
  return services;
}

export function getServices(): GameServices | null {
  return services;
}

/** Test-only: wipes the singleton so each test can start fresh. */
export function resetServicesForTesting(): void {
  services = null;
}
