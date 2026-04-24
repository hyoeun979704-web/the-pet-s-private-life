import { FATIGUE_CONFIG } from '@/config/Constants';
import type { CharacterDef, OwnedCharacter } from '@/entities/Character';

export type FatigueActivity = keyof typeof FATIGUE_CONFIG.costs;

export interface FatigueConsumeResult {
  ok: boolean;
  reason?: 'not_owned' | 'not_enough_fatigue';
  fatigueAfter?: number;
}

export class FatigueSystem {
  private readonly defs: Map<string, CharacterDef>;

  private readonly owned: Map<string, OwnedCharacter>;

  private readonly now: () => number;

  constructor(
    defs: CharacterDef[],
    owned: Map<string, OwnedCharacter>,
    now: () => number = () => Date.now(),
  ) {
    this.defs = new Map(defs.map((d) => [d.id, d]));
    this.owned = owned;
    this.now = now;
  }

  consume(defId: string, activity: FatigueActivity): FatigueConsumeResult {
    const inst = this.owned.get(defId);
    if (!inst) return { ok: false, reason: 'not_owned' };
    const cost = FATIGUE_CONFIG.costs[activity];
    if (inst.fatigue < cost) return { ok: false, reason: 'not_enough_fatigue', fatigueAfter: inst.fatigue };
    const fatigueAfter = inst.fatigue - cost;
    this.owned.set(defId, { ...inst, fatigue: fatigueAfter });
    return { ok: true, fatigueAfter };
  }

  restoreByAd(defId: string): FatigueConsumeResult {
    return this.restoreBy(defId, FATIGUE_CONFIG.adRestoreAmount);
  }

  restoreByItem(defId: string, amount: number): FatigueConsumeResult {
    return this.restoreBy(defId, amount);
  }

  /**
   * Idle recovery: add 1 (+bonus) for every FATIGUE_CONFIG.recoveryMinutes
   * elapsed since the last tick, capped by fatigueMax. Mutates the owned
   * character's fatigue and lastInteractAt (used as the last tick marker).
   */
  tickRecovery(defId: string): FatigueConsumeResult {
    const inst = this.owned.get(defId);
    if (!inst) return { ok: false, reason: 'not_owned' };
    const def = this.defs.get(defId);
    if (!def) return { ok: false, reason: 'not_owned' };

    const elapsedMs = this.now() - inst.lastInteractAt;
    const elapsedMin = Math.floor(elapsedMs / 60_000);
    const ticks = Math.floor(elapsedMin / FATIGUE_CONFIG.recoveryMinutes);
    if (ticks <= 0) return { ok: true, fatigueAfter: inst.fatigue };

    const gain = ticks * (1 + def.fatigueRecoveryBonus);
    const nextFatigue = Math.min(def.fatigueMax, inst.fatigue + gain);
    const consumedMs = ticks * FATIGUE_CONFIG.recoveryMinutes * 60_000;
    this.owned.set(defId, {
      ...inst,
      fatigue: nextFatigue,
      lastInteractAt: inst.lastInteractAt + consumedMs,
    });
    return { ok: true, fatigueAfter: nextFatigue };
  }

  private restoreBy(defId: string, amount: number): FatigueConsumeResult {
    const inst = this.owned.get(defId);
    if (!inst) return { ok: false, reason: 'not_owned' };
    const def = this.defs.get(defId);
    if (!def) return { ok: false, reason: 'not_owned' };
    const nextFatigue = Math.min(def.fatigueMax, inst.fatigue + amount);
    this.owned.set(defId, { ...inst, fatigue: nextFatigue });
    return { ok: true, fatigueAfter: nextFatigue };
  }
}
