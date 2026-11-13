import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';

export const firebaseConfig = {
  apiKey: 'AIzaSyAH1fPPc3ydXZjelKHhzvpd25m8bTAha4',
  authDomain: 'sentenariabase.firebaseapp.com',
  databaseURL: 'https://sentenariabase-default-rtdb.firebaseio.com',
  projectId: 'sentenariabase',
  storageBucket: 'sentenariabase.firebasestorage.app',
  messagingSenderId: '56682654451',
  appId: '1:56682654451:web:02c9bc6d80d3b4bfd1e586',
  measurementId: 'G-VPVMMTWGEQ',
};

export const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only in browser environments that support it
export const analyticsPromise =
  typeof window !== 'undefined'
    ? isSupported()
        .then((yes) => (yes ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);

export const auth = getAuth(app);
export const db = getDatabase(app);

const SESSION_PLAYER_ID_KEY = 'sentenaria_online_player_id_v1';
const SESSION_PLAYER_NAME_KEY = 'sentenaria_online_player_name_v1';

let cachedIdentity: { uid: string; isFirebaseAuth: boolean } | null = null;
let pendingIdentityPromise: Promise<{
  uid: string;
  isFirebaseAuth: boolean;
}> | null = null;

function generateRandomId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return 'p_' + crypto.randomUUID().replace(/-/g, '');
  }
  return (
    'p_' +
    Math.random().toString(36).substring(2, 12) +
    Date.now().toString(36)
  );
}

function getOrCreateFallbackSessionId(): string {
  if (typeof window !== 'undefined') {
    try {
      let existing = sessionStorage.getItem(SESSION_PLAYER_ID_KEY);
      if (!existing) {
        existing = generateRandomId();
        sessionStorage.setItem(SESSION_PLAYER_ID_KEY, existing);
      }
      return existing;
    } catch {
      return generateRandomId();
    }
  }
  return generateRandomId();
}

function saveSessionPlayerId(uid: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_PLAYER_ID_KEY, uid);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Waits for Firebase Auth's initial state via `onAuthStateChanged`, or signs in
 * anonymously with `signInAnonymously(auth)` if no user is currently signed in.
 * Falls back to a persistent sessionStorage UID if Anonymous Auth is restricted.
 */
export function ensurePlayerIdentity(): Promise<{
  uid: string;
  isFirebaseAuth: boolean;
}> {
  if (cachedIdentity) {
    return Promise.resolve(cachedIdentity);
  }

  if (pendingIdentityPromise) {
    return pendingIdentityPromise;
  }

  pendingIdentityPromise = new Promise<{
    uid: string;
    isFirebaseAuth: boolean;
  }>((resolve) => {
    if (auth.currentUser?.uid) {
      const resolved = { uid: auth.currentUser.uid, isFirebaseAuth: true };
      cachedIdentity = resolved;
      saveSessionPlayerId(resolved.uid);
      resolve(resolved);
      return;
    }

    let settled = false;
    const finish = (result: { uid: string; isFirebaseAuth: boolean }) => {
      if (settled) return;
      settled = true;
      cachedIdentity = result;
      saveSessionPlayerId(result.uid);
      resolve(result);
    };

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user: User | null) => {
        unsubscribe();
        if (user?.uid) {
          finish({ uid: user.uid, isFirebaseAuth: true });
          return;
        }
        try {
          const cred = await signInAnonymously(auth);
          if (cred.user?.uid) {
            finish({ uid: cred.user.uid, isFirebaseAuth: true });
            return;
          }
        } catch {
          // Fallback to session-scoped unique player ID when Anonymous Auth is not enabled in Console
        }
        finish({
          uid: getOrCreateFallbackSessionId(),
          isFirebaseAuth: false,
        });
      },
      () => {
        unsubscribe();
        finish({
          uid: getOrCreateFallbackSessionId(),
          isFirebaseAuth: false,
        });
      }
    );
  }).finally(() => {
    pendingIdentityPromise = null;
  });

  return pendingIdentityPromise;
}

export function getCurrentPlayerUidSync(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  if (cachedIdentity?.uid) {
    return cachedIdentity.uid;
  }
  return getOrCreateFallbackSessionId();
}

export function getSavedPlayerNickname(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(SESSION_PLAYER_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function savePlayerNickname(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_PLAYER_NAME_KEY, name.trim().slice(0, 20));
  } catch {
    // Ignore storage errors
  }
}
