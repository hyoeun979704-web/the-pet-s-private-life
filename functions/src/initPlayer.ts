import { onCall } from 'firebase-functions/v2/https';
import { buildInitialSave } from './shared/initialSave';
import { playerDocRef, requireAuthUid } from './util';

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
    tx.set(ref, buildInitialSave(uid, Date.now()));
    return { ok: true, created: true };
  });
});
