import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import { playerDocRef, requireAuthUid } from './util';

type ResourceKey =
  | 'snack'
  | 'starDust'
  | 'magicStone'
  | 'magicShard'
  | 'gachaTicket';

const ALLOWED_SOURCES = new Set([
  'block_puzzle',
  'merge_game',
  'quiz',
  'daily_mission',
  'level_up',
  'login_bonus',
  'ad_reward',
]);

interface Payload {
  source: string;
  deltas: Partial<Record<ResourceKey, number>>;
}

export const addResources = onCall<Payload>(async (req) => {
  const uid = requireAuthUid(req);
  const payload = req.data;
  if (!ALLOWED_SOURCES.has(payload.source)) {
    throw new HttpsError('invalid-argument', `source not allowed: ${payload.source}`);
  }
  const deltas = payload.deltas ?? {};
  const updates: Record<string, FieldValue> = {};
  for (const [key, value] of Object.entries(deltas)) {
    if (typeof value !== 'number' || value < 0 || !Number.isFinite(value)) {
      throw new HttpsError('invalid-argument', `delta must be a non-negative number: ${key}`);
    }
    updates[`resources.${key}`] = FieldValue.increment(value);
  }
  await playerDocRef(uid).update(updates);
  return { ok: true };
});
