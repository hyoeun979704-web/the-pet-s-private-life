import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { playerDocRef, requireAuthUid } from './util';

const RATES = { normal: 0.7, rare: 0.25, legendary: 0.05 };
const COST_MAGIC_STONE = 1;
const PITY_LIMIT = 20;

type Grade = keyof typeof RATES;

function rollGrade(pity: number): Grade {
  if (pity + 1 >= PITY_LIMIT) {
    return Math.random() < RATES.legendary / (RATES.rare + RATES.legendary) ? 'legendary' : 'rare';
  }
  const r = Math.random();
  if (r < RATES.legendary) return 'legendary';
  if (r < RATES.legendary + RATES.rare) return 'rare';
  return 'normal';
}

export const rollGacha = onCall(async (req) => {
  const uid = requireAuthUid(req);
  const ref = playerDocRef(uid);
  return ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'player document missing');
    }
    const data = snap.data() ?? {};
    const resources = (data.resources as { magicStone?: number } | undefined) ?? {};
    const pity = (data.gachaPity as number | undefined) ?? 0;
    const stone = resources.magicStone ?? 0;
    if (stone < COST_MAGIC_STONE) {
      throw new HttpsError('failed-precondition', 'not enough magicStone');
    }
    const grade = rollGrade(pity);
    const nextPity = grade === 'normal' ? pity + 1 : 0;
    tx.update(ref, {
      'resources.magicStone': stone - COST_MAGIC_STONE,
      gachaPity: nextPity,
    });
    return { ok: true, grade, pity: nextPity };
  });
});
