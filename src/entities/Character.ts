export type Species = 'cat' | 'dog' | 'hamster' | 'hedgehog' | 'parrot';
export type CharacterGrade = 'normal' | 'rare' | 'legendary';

export type MoodState = 'idle' | 'wander' | 'tired' | 'sleep';

export interface CharacterDef {
  id: string;
  nameKey: string;
  species: Species;
  breed: string;
  grade: CharacterGrade;
  fatigueMax: number;
  fatigueRecoveryBonus: number;
  tmiKey: string;
  personalityKey: string;
  colorHex: string;
}

export interface OwnedCharacter {
  defId: string;
  customName?: string;
  fatigue: number;
  lastInteractAt: number;
}
