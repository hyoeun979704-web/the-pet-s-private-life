import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { ACTIVITY_COSTS, type FatigueActivity } from './shared/economy';
import { playerDocRef, requireAuthUid } from './util';

interface Payload {
  defId: string;
  activity: FatigueActivity;
}

export const consumeFatigue = onCall<Payload>(async (req) => {
  const uid = requireAuthUid(req);
  const { defId, activity } = req.data;
  const cost = ACTIVITY_COSTS[activity];
  if (!cost) {
    throw new HttpsError('invalid-argument', `unknown activity: ${activity}`);
  }
  const ref = playerDocRef(uid);
  return ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'player document missing');
    }
    const data = snap.data() ?? {};
    const owned = (data.characters as Array<{ defId: string; fatigue: number }> | undefined) ?? [];
    const idx = owned.findIndex((c) => c.defId === defId);
    if (idx < 0) {
      throw new HttpsError('failed-precondition', 'character not owned');
    }
    const current = owned[idx];
    if (!current || current.fatigue < cost) {
      throw new HttpsError('failed-precondition', 'not enough fatigue');
    }
    const nextOwned = owned.slice();
    nextOwned[idx] = { ...current, fatigue: current.fatigue - cost };
    tx.update(ref, { characters: nextOwned });
    return { ok: true, fatigueAfter: current.fatigue - cost };
  });
});
