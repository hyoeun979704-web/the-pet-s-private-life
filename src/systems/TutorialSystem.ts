import type { AnalyticsSystem } from '@/systems/AnalyticsSystem';
import type { GameState } from '@/systems/GameState';

export type TutorialStepId =
  | 'welcome_nickname'
  | 'first_character'
  | 'place_furniture'
  | 'try_block_puzzle'
  | 'dex_intro';

export const TUTORIAL_STEPS: readonly TutorialStepId[] = [
  'welcome_nickname',
  'first_character',
  'place_furniture',
  'try_block_puzzle',
  'dex_intro',
];

export interface TutorialState {
  /** Save-persisted: which step the player is currently on. -1 once complete. */
  currentIndex: number;
  /** Save-persisted: ms timestamp when the tutorial started, for total_sec analytics. */
  startedAtMs: number;
}

export interface TutorialSystemOptions {
  gameState: GameState;
  analytics: AnalyticsSystem;
  now?: () => number;
}

/**
 * Drives the 5-scene tutorial. Persists progress in SaveData.tutorial so
 * a reload picks up where the user left off. Emits the canonical
 * tutorial_step / tutorial_complete events at every transition.
 */
export class TutorialSystem {
  private readonly gameState: GameState;

  private readonly analytics: AnalyticsSystem;

  private readonly now: () => number;

  constructor(opts: TutorialSystemOptions) {
    this.gameState = opts.gameState;
    this.analytics = opts.analytics;
    this.now = opts.now ?? (() => Date.now());
  }

  isComplete(): boolean {
    return (this.gameState.get().tutorial?.currentIndex ?? 0) === -1;
  }

  currentStep(): TutorialStepId | null {
    const t = this.gameState.get().tutorial;
    if (!t) return TUTORIAL_STEPS[0] ?? null;
    if (t.currentIndex < 0) return null;
    return TUTORIAL_STEPS[t.currentIndex] ?? null;
  }

  async start(): Promise<void> {
    if (this.isComplete()) return;
    const existing = this.gameState.get().tutorial;
    if (existing && existing.currentIndex >= 0) {
      this.analytics.emit('tutorial_step', { step_id: TUTORIAL_STEPS[existing.currentIndex] ?? '', resumed: true });
      return;
    }
    const startedAtMs = this.now();
    await this.gameState.patch((d) => ({
      ...d,
      tutorial: { currentIndex: 0, startedAtMs },
    }));
    this.analytics.emit('tutorial_step', { step_id: TUTORIAL_STEPS[0] ?? '', elapsed_sec: 0 });
  }

  async advance(): Promise<TutorialStepId | null> {
    const t = this.gameState.get().tutorial;
    if (!t || t.currentIndex < 0) return null;
    const nextIndex = t.currentIndex + 1;
    if (nextIndex >= TUTORIAL_STEPS.length) {
      const totalSec = Math.round((this.now() - t.startedAtMs) / 1000);
      await this.gameState.patch((d) => ({
        ...d,
        tutorial: { currentIndex: -1, startedAtMs: t.startedAtMs },
      }));
      this.analytics.emit('tutorial_complete', { total_sec: totalSec });
      return null;
    }
    await this.gameState.patch((d) => ({
      ...d,
      tutorial: { currentIndex: nextIndex, startedAtMs: t.startedAtMs },
    }));
    const elapsedSec = Math.round((this.now() - t.startedAtMs) / 1000);
    const nextStep = TUTORIAL_STEPS[nextIndex] ?? null;
    this.analytics.emit('tutorial_step', { step_id: nextStep ?? '', elapsed_sec: elapsedSec });
    return nextStep;
  }

  /** Skip-all (for QA / debug builds). */
  async skipAll(): Promise<void> {
    await this.gameState.patch((d) => ({
      ...d,
      tutorial: { currentIndex: -1, startedAtMs: this.now() },
    }));
    this.analytics.emit('tutorial_complete', { skipped: true });
  }
}
