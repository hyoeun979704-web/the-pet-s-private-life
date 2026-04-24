import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

export function requireAuthUid(req: CallableRequest): string {
  const uid = req.auth?.uid;
  if (!uid) {
    throw new HttpsError('unauthenticated', 'sign-in required');
  }
  return uid;
}

export function playerDocRef(uid: string) {
  return getFirestore().collection('players').doc(uid);
}
