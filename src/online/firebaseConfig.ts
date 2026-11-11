import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth, signInAnonymously } from 'firebase/auth';
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

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Analytics only in browser environments that support it
export const analyticsPromise =
  typeof window !== 'undefined'
    ? isSupported()
        .then((yes) => (yes ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null);

export const db = getDatabase(app);

const SESSION_PLAYER_ID_KEY = 'sentenaria_online_player_id_v1';
const SESSION_PLAYER_NAME_KEY = 'sentenaria_online_player_name_v1';

function generateRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'p_' + crypto.randomUUID().replace(/-/g, '');
  }
  return (
    'p_' +
    Math.random().toString(36).substring(2, 12) +
    Date.now().toString(36)
  );
}

/**
 * Obtains an authenticated player UID.
 * Attempts Firebase Anonymous Authentication first; if Firebase Auth is not yet enabled
 * on the Firebase Console, falls back to a persistent cryptographic session UID so
 * each browser session has a unique, consistent identity across reloads and reconnections.
 */
export async function ensurePlayerIdentity(): Promise<{
  uid: string;
  isFirebaseAuth: boolean;
}> {
  if (typeof window !== 'undefined') {
    try {
      const auth = getAuth(app);
      if (auth.currentUser) {
        return { uid: auth.currentUser.uid, isFirebaseAuth: true };
      }
      const cred = await signInAnonymously(auth);
      if (cred.user?.uid) {
        return { uid: cred.user.uid, isFirebaseAuth: true };
      }
    } catch {
      // Fallback to session-scoped unique player ID when Anonymous Auth is not enabled in Console
    }

    try {
      let existing = sessionStorage.getItem(SESSION_PLAYER_ID_KEY);
      if (!existing) {
        existing = generateRandomId();
        sessionStorage.setItem(SESSION_PLAYER_ID_KEY, existing);
      }
      return { uid: existing, isFirebaseAuth: false };
    } catch {
      return { uid: generateRandomId(), isFirebaseAuth: false };
    }
  }

  return { uid: generateRandomId(), isFirebaseAuth: false };
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
