import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FATIGUE_MAX_BY_GRADE, GACHA } from './shared/economy';
import { GACHA_POOL, type GachaGrade } from './shared/gachaPool';
import { playerDocRef, requireAuthUid } from './util';

const DUPLICATE_SHARD_REWARD: Record<GachaGrade, number> = {
  normal: 1,
  rare: 3,
  legendary: 10,
};

function rollGrade(normalStreak: number): GachaGrade {
  // Guarantee at least rare when normalStreak + 1 reaches the pity limit.
  if (normalStreak + 1 >= GACHA.pityLimit) {
    const denom = GACHA.rates.rare + GACHA.rates.legendary;
    return Math.random() < GACHA.rates.legendary / denom ? 'legendary' : 'rare';
  }
  const r = Math.random();
  if (r < GACHA.rates.legendary) return 'legendary';
  if (r < GACHA.rates.legendary + GACHA.rates.rare) return 'rare';
  return 'normal';
}

function pickFromPool(grade: GachaGrade): string {
  const pool = GACHA_POOL[grade];
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] as string;
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
    const resources = (data.resources as {
      magicStone?: number;
      magicShard?: number;
    } | undefined) ?? {};
    const pity = (data.gachaPity as number | undefined) ?? 0;
    const owned =
      (data.characters as Array<{ defId: string }> | undefined) ?? [];

    const stone = resources.magicStone ?? 0;
    if (stone < GACHA.costMagicStone) {
      throw new HttpsError('failed-precondition', 'not enough magicStone');
    }

    const grade = rollGrade(pity);
    const defId = pickFromPool(grade);
    const ownsAlready = owned.some((c) => c.defId === defId);

    // Pity counts CONSECUTIVE normals. Any rare/legendary resets it.
    const nextPity = grade === 'normal' ? pity + 1 : 0;
    const shardGain = ownsAlready ? DUPLICATE_SHARD_REWARD[grade] : 0;

    const updates: Record<string, unknown> = {
      'resources.magicStone': stone - GACHA.costMagicStone,
      gachaPity: nextPity,
    };

    if (ownsAlready) {
      updates['resources.magicShard'] = (resources.magicShard ?? 0) + shardGain;
    } else {
      updates.characters = [
        ...owned,
        {
          defId,
          fatigue: FATIGUE_MAX_BY_GRADE[grade],
          lastInteractAt: Date.now(),
        },
      ];
    }

    tx.update(ref, updates);
    return {
      ok: true,
      grade,
      defId,
      isNew: !ownsAlready,
      shardGain,
      pity: nextPity,
    };
  });
});
