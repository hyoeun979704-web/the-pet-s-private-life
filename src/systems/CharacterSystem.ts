import type { CharacterDef, OwnedCharacter } from '@/entities/Character';

export interface CharacterSystemOptions {
  now?: () => number;
}

export class CharacterSystem {
  private readonly defs: Map<string, CharacterDef>;

  private readonly owned: Map<string, OwnedCharacter> = new Map();

  private readonly now: () => number;

  constructor(defs: CharacterDef[], options: CharacterSystemOptions = {}) {
    this.defs = new Map(defs.map((d) => [d.id, d]));
    this.now = options.now ?? (() => Date.now());
  }

  getDef(defId: string): CharacterDef | null {
    return this.defs.get(defId) ?? null;
  }

  getAllDefs(): CharacterDef[] {
    return Array.from(this.defs.values());
  }

  getOwned(): OwnedCharacter[] {
    return Array.from(this.owned.values());
  }

  isOwned(defId: string): boolean {
    return this.owned.has(defId);
  }

  acquire(defId: string): OwnedCharacter | null {
    const def = this.defs.get(defId);
    if (!def) return null;
    if (this.owned.has(defId)) return this.owned.get(defId) ?? null;
    const owned: OwnedCharacter = {
      defId,
      fatigue: def.fatigueMax,
      lastInteractAt: this.now(),
    };
    this.owned.set(defId, owned);
    return owned;
  }

  rename(defId: string, name: string): boolean {
    const inst = this.owned.get(defId);
    if (!inst) return false;
    this.owned.set(defId, { ...inst, customName: name });
    return true;
  }

  touch(defId: string): boolean {
    const inst = this.owned.get(defId);
    if (!inst) return false;
    this.owned.set(defId, { ...inst, lastInteractAt: this.now() });
    return true;
  }

  dexProgress(): { owned: number; total: number } {
    return { owned: this.owned.size, total: this.defs.size };
  }
}
