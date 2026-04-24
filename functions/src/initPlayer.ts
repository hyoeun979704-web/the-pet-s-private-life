import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { playerDocRef, requireAuthUid } from './util';

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nextMidnightMs(nowMs: number): number {
  const localNow = nowMs + KST_OFFSET_MS;
  const localMidnight = Math.floor(localNow / DAY_MS) * DAY_MS + DAY_MS;
  return localMidnight - KST_OFFSET_MS;
}

/**
 * Creates the /players/{uid} document the first time a user signs in.
 * Idempotent: returns { created: false } if it already exists.
 *
 * This MUST live server-side because the security rules deny all client
 * writes to /players — the client can only read its own doc.
 */
export const initPlayer = onCall(async (req) => {
  const uid = requireAuthUid(req);
  const ref = playerDocRef(uid);
  return ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      return { ok: true, created: false };
    }
    const now = Date.now();
    tx.set(ref, {
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
        resetAtMs: nextMidnightMs(now),
        snackEarned: 0,
        starDustEarned: 0,
        quizSessionsUsed: 0,
        adFatigueUsed: 0,
      },
      gachaPity: 0,
      lastLoginMs: now,
      settings: {
        bgmVolume: 0.6,
        sfxVolume: 0.8,
        largeFont: false,
        reduceMotion: false,
      },
      locale: 'ko',
    });
    return { ok: true, created: true };
  });
});
