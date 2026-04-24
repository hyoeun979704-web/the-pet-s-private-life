function readString(key: string, fallback = ''): string {
  const v = (import.meta.env[key] as string | undefined) ?? fallback;
  return v;
}

export const ENV = {
  mode: readString('VITE_ENV', 'development'),
  isDev: readString('VITE_ENV', 'development') === 'development',
  firebase: {
    apiKey: readString('VITE_FIREBASE_API_KEY'),
    authDomain: readString('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readString('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readString('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readString('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readString('VITE_FIREBASE_APP_ID'),
    measurementId: readString('VITE_FIREBASE_MEASUREMENT_ID'),
  },
  admob: {
    appIdAndroid: readString('VITE_ADMOB_APP_ID_ANDROID'),
    adUnitRewarded: readString('VITE_ADMOB_AD_UNIT_REWARDED'),
  },
} as const;

export function firebaseConfigured(): boolean {
  const f = ENV.firebase;
  return Boolean(f.apiKey && f.projectId && f.appId);
}
