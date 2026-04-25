import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { playerDocRef, requireAuthUid } from './util';

/**
 * Hard-deletes the player's save document AND removes the Firebase Auth
 * user. Required by Google Play 'account deletion' policy and KISA
 * privacy regulations.
 *
 * The client should:
 *   1. Call deleteAccount.
 *   2. On success, sign the user out locally and clear any cache.
 *   3. Show a confirmation screen.
 *
 * Note: this does NOT delete IAP receipts or analytics; those are handled
 * by Firebase project settings and Google Play console privacy controls.
 */
export const deleteAccount = onCall(async (req) => {
  const uid = requireAuthUid(req);
  try {
    await playerDocRef(uid).delete();
  } catch (err) {
    throw new HttpsError('internal', 'failed to delete player doc', err);
  }
  try {
    await getAuth().deleteUser(uid);
  } catch (err) {
    throw new HttpsError('internal', 'failed to delete auth user', err);
  }
  return { ok: true };
});
