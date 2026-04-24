import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { ENV, firebaseConfigured } from './Env';
import { logger } from '@/utils/Logger';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

export async function initFirebase(): Promise<void> {
  if (!firebaseConfigured()) {
    logger.warn('firebase.skipped', { reason: 'env not configured' });
    return;
  }
  try {
    app = initializeApp(ENV.firebase);
    auth = getAuth(app);
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
    const cred = await signInAnonymously(auth);
    logger.info('firebase.signedIn', { uid: cred.user.uid });
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
