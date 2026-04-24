import {
  DEFAULT_GAME_SETTINGS,
  DEFAULT_LOCALE,
  SAVE_SCHEMA_VERSION,
  type SupportedLocale,
} from '@/config/Constants';
import { nextMidnightMs } from '@/utils/DailyReset';
import type { OwnedCharacter } from './Character';
import type { PlacedFurniture } from './Furniture';
import type { RoomId } from './Room';

export interface Resources {
  snack: number;
  starDust: number;
  magicStone: number;
  magicShard: number;
  gachaTicket: number;
}

export interface DailyLimitTracker {
  resetAtMs: number;
  snackEarned: number;
  starDustEarned: number;
  quizSessionsUsed: number;
  adFatigueUsed: number;
}

export interface GameSettings {
  bgmVolume: number;
  sfxVolume: number;
  largeFont: boolean;
  reduceMotion: boolean;
}

export interface OwnedFurniture {
  defId: string;
  count: number;
}

export interface RoomSaveState {
  id: RoomId;
  placed: PlacedFurniture[];
}

export interface SaveData {
  schemaVersion: number;
  playerId: string;
  nickname: string;
  level: number;
  exp: number;
  resources: Resources;
  rooms: RoomSaveState[];
  characters: OwnedCharacter[];
  furniture: OwnedFurniture[];
  dailyLimits: DailyLimitTracker;
  gachaPity: number;
  lastLoginMs: number;
  settings: GameSettings;
  locale: SupportedLocale;
}

export function createInitialSaveData(playerId: string, nowMs: number = Date.now()): SaveData {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    playerId,
    nickname: '',
    level: 1,
    exp: 0,
    resources: {
      snack: 0,
      starDust: 0,
      magicStone: 0,
      magicShard: 0,
      gachaTicket: 0,
    },
    rooms: [{ id: 'room_living', placed: [] }],
    characters: [],
    furniture: [],
    dailyLimits: {
      resetAtMs: nextMidnightMs(nowMs),
      snackEarned: 0,
      starDustEarned: 0,
      quizSessionsUsed: 0,
      adFatigueUsed: 0,
    },
    gachaPity: 0,
    lastLoginMs: nowMs,
    settings: { ...DEFAULT_GAME_SETTINGS },
    locale: DEFAULT_LOCALE,
  };
}
