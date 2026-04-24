import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import type { SaveData } from '@/entities/SaveData';
import type { SaveBackend } from '@/systems/SaveSystem';
import { logger } from '@/utils/Logger';
import { ENV, firebaseConfigured } from './Env';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;
let firestore: Firestore | null = null;

export async function initFirebase(): Promise<void> {
  if (!firebaseConfigured()) {
    logger.warn('firebase.skipped', { reason: 'env not configured' });
    return;
  }
  try {
    app = initializeApp(ENV.firebase);
    auth = getAuth(app);
    firestore = getFirestore(app);
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
    const cred = await signInAnonymously(auth);
    logger.info('firebase.signedIn', { uid: cred.user.uid, anonymous: cred.user.isAnonymous });
  } catch (err) {
    logger.error('firebase.initFailed', err);
  }
}

export function getFirebaseApp(): FirebaseApp | null {
  return app;
}

export function getFirebaseAuth(): Auth | null {
  return auth;
}

export function getFirebaseAnalytics(): Analytics | null {
  return analytics;
}

export function getFirebaseFirestore(): Firestore | null {
  return firestore;
}

export function currentUser(): User | null {
  return auth?.currentUser ?? null;
}

export function onAuthChange(listener: (user: User | null) => void): () => void {
  if (!auth) {
    listener(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, listener);
}

export type AuthFailureCode =
  | 'no-auth'
  | 'credential-already-in-use'
  | 'cancelled'
  | 'network'
  | 'unknown';

export type GoogleAuthResult =
  | { ok: true; user: User; linkedFromAnonymous: boolean }
  | { ok: false; code: AuthFailureCode; error?: unknown };

interface FirebaseAuthError {
  code?: string;
}

function classifyAuthError(err: unknown): AuthFailureCode {
  const code = (err as FirebaseAuthError | null)?.code;
  if (!code) return 'unknown';
  if (code === 'auth/credential-already-in-use') return 'credential-already-in-use';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return 'cancelled';
  if (code === 'auth/network-request-failed') return 'network';
  return 'unknown';
}

/**
 * If the current user is anonymous, links the Google credential to preserve
 * the guest playerId (uid). Otherwise performs a standard Google sign-in.
 *
 * Returns a discriminated union so callers can distinguish cancel from
 * credential-collision (which needs a UI prompt "merge with existing
 * account?") from network errors.
 */
export async function signInOrLinkGoogle(): Promise<GoogleAuthResult> {
  if (!auth) return { ok: false, code: 'no-auth' };
  const provider = new GoogleAuthProvider();
  const user = auth.currentUser;
  try {
    if (user?.isAnonymous) {
      const cred = await linkWithPopup(user, provider);
      logger.info('firebase.linked', { uid: cred.user.uid });
      return { ok: true, user: cred.user, linkedFromAnonymous: true };
    }
    const cred = await signInWithPopup(auth, provider);
    logger.info('firebase.googleSignedIn', { uid: cred.user.uid });
    return { ok: true, user: cred.user, linkedFromAnonymous: false };
  } catch (err) {
    const code = classifyAuthError(err);
    logger.error('firebase.googleFailed', { code, err: String(err) });
    return { ok: false, code, error: err };
  }
}

// -----------------------------------------------------------------------------
// Firestore SaveBackend
// -----------------------------------------------------------------------------

export class FirestoreSaveBackend implements SaveBackend {
  name = 'firestore';

  async load(playerId: string): Promise<unknown | null> {
    if (!firestore) return null;
    const snap = await getDoc(doc(firestore, 'players', playerId));
    return snap.exists() ? snap.data() : null;
  }

  async save(playerId: string, data: SaveData): Promise<void> {
    if (!firestore) return;
    // NOTE: Firestore security rules reject client writes to /players/{uid}.
    // This path exists for seeding / dev-emulator only. Production mutations
    // MUST go through Cloud Functions (addResources, consumeFatigue, rollGacha).
    await setDoc(doc(firestore, 'players', playerId), data as unknown as Record<string, unknown>);
  }
}
