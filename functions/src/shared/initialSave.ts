// Initial save shape used by initPlayer (server) on first sign-in.
// MUST stay structurally aligned with src/entities/SaveData.ts
// createInitialSaveData. The shape sync is enforced by
// tests/save-shape-sync.test.ts.

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nextMidnightMs(nowMs: number): number {
  const localNow = nowMs + KST_OFFSET_MS;
  const localMidnight = Math.floor(localNow / DAY_MS) * DAY_MS + DAY_MS;
  return localMidnight - KST_OFFSET_MS;
}

export function buildInitialSave(uid: string, nowMs: number): Record<string, unknown> {
  return {
    schemaVersion: 1,
    playerId: uid,
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
    settings: {
      bgmVolume: 0.6,
      sfxVolume: 0.8,
      largeFont: false,
      reduceMotion: false,
    },
    locale: 'ko',
  };
}
