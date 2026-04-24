import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { playerDocRef, requireAuthUid } from './util';
import {
  DAILY_LIMITS,
  MAX_RESOURCE_GAIN_PER_SOURCE,
  RESOURCE_KEYS,
  type ResourceKey,
} from './shared/economy';

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function nextMidnightMs(nowMs: number): number {
  const localNow = nowMs + KST_OFFSET_MS;
  const localMidnight = Math.floor(localNow / DAY_MS) * DAY_MS + DAY_MS;
  return localMidnight - KST_OFFSET_MS;
}

interface Payload {
  source: string;
  deltas: Record<string, unknown>;
}

export const addResources = onCall<Payload>(async (req) => {
  const uid = requireAuthUid(req);
  const { source, deltas } = req.data ?? ({} as Payload);

  const sourceCaps = MAX_RESOURCE_GAIN_PER_SOURCE[source];
  if (!sourceCaps) {
    throw new HttpsError('invalid-argument', `source not allowed: ${source}`);
  }

  // Validate keys and values.
  const normalized: Partial<Record<ResourceKey, number>> = {};
  for (const key of Object.keys(deltas ?? {})) {
    if (!(RESOURCE_KEYS as readonly string[]).includes(key)) {
      throw new HttpsError('invalid-argument', `unknown resource key: ${key}`);
    }
    const rk = key as ResourceKey;
    const value = deltas[rk];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
      throw new HttpsError('invalid-argument', `delta must be a non-negative integer: ${key}`);
    }
    const cap = sourceCaps[rk];
    if (cap === undefined) {
      throw new HttpsError(
        'invalid-argument',
        `resource ${key} not allowed for source ${source}`,
      );
    }
    if (value > cap) {
      throw new HttpsError(
        'invalid-argument',
        `delta ${value} exceeds per-call cap ${cap} for ${source}.${key}`,
      );
    }
    normalized[rk] = value;
  }

  const ref = playerDocRef(uid);
  return ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'player document missing');
    }
    const data = snap.data() ?? {};
    const resources = (data.resources as Partial<Record<ResourceKey, number>> | undefined) ?? {};
    const daily = (data.dailyLimits as {
      resetAtMs?: number;
      snackEarned?: number;
      starDustEarned?: number;
    } | undefined) ?? {};

    // Reset daily counters if we're past midnight.
    const now = Date.now();
    const resetAtMs = typeof daily.resetAtMs === 'number' ? daily.resetAtMs : 0;
    const pastMidnight = now >= resetAtMs;
    let snackEarned = pastMidnight ? 0 : (daily.snackEarned ?? 0);
    let starDustEarned = pastMidnight ? 0 : (daily.starDustEarned ?? 0);

    const dSnack = normalized.snack ?? 0;
    const dStar = normalized.starDust ?? 0;
    if (snackEarned + dSnack > DAILY_LIMITS.snack) {
      throw new HttpsError(
        'resource-exhausted',
        `daily snack cap reached (${DAILY_LIMITS.snack})`,
      );
    }
    if (starDustEarned + dStar > DAILY_LIMITS.starDust) {
      throw new HttpsError(
        'resource-exhausted',
        `daily starDust cap reached (${DAILY_LIMITS.starDust})`,
      );
    }
    snackEarned += dSnack;
    starDustEarned += dStar;

    const nextResources: Partial<Record<ResourceKey, number>> = { ...resources };
    for (const key of RESOURCE_KEYS) {
      const add = normalized[key] ?? 0;
      if (add > 0) {
        nextResources[key] = (resources[key] ?? 0) + add;
      }
    }

    tx.update(ref, {
      resources: nextResources,
      'dailyLimits.resetAtMs': pastMidnight ? nextMidnightMs(now) : resetAtMs,
      'dailyLimits.snackEarned': snackEarned,
      'dailyLimits.starDustEarned': starDustEarned,
    });
    return { ok: true, source, granted: normalized };
  });
});
