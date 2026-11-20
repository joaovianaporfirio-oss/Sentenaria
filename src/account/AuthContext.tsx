import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../online/firebaseConfig';
import {
  createOrSyncUserProfile,
  refreshEmailVerificationStatus,
  signOutUserAccount,
  startUserPresence,
  subscribeToFriendsWithPresence,
  subscribeToIncomingFriendRequests,
  subscribeToUserProfile,
} from './accountService';
import {
  CURRENT_TERMS_VERSION,
  FriendProfileSummary,
  FriendRequestItem,
  UserProfile,
} from './types';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
  isLoggedIn: boolean;
  isEmailVerified: boolean;
  needsTermsAcceptance: boolean;
  pendingFriendRequests: FriendRequestItem[];
  friends: FriendProfileSummary[];
  refreshVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [emailVerifiedFlag, setEmailVerifiedFlag] = useState<boolean>(false);
  const [pendingFriendRequests, setPendingFriendRequests] = useState<
    FriendRequestItem[]
  >([]);
  const [friends, setFriends] = useState<FriendProfileSummary[]>([]);

  // 1. Track Firebase Auth state (non-anonymous accounts represent full user accounts)
  useEffect(() => {
    let mounted = true;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      if (!user || user.isAnonymous) {
        setFirebaseUser(null);
        setProfile(null);
        setEmailVerifiedFlag(false);
        setPendingFriendRequests([]);
        setFriends([]);
        setAuthLoading(false);
        return;
      }

      setFirebaseUser(user);
      setEmailVerifiedFlag(Boolean(user.emailVerified));

      try {
        const synced = await createOrSyncUserProfile(user);
        if (mounted) {
          setProfile(synced);
        }
      } catch {
        // Profile listener will still attempt to hydrate
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      unsubAuth();
    };
  }, []);

  // 2. Subscribe to user profile, presence, friend requests, and friends list when logged in
  const activeUid = firebaseUser && !firebaseUser.isAnonymous ? firebaseUser.uid : null;

  useEffect(() => {
    if (!activeUid) return;

    const unsubProfile = subscribeToUserProfile(activeUid, (nextProfile) => {
      if (nextProfile) {
        setProfile(nextProfile);
      }
    });
    const unsubPresence = startUserPresence(activeUid);
    const unsubRequests = subscribeToIncomingFriendRequests(
      activeUid,
      setPendingFriendRequests
    );
    const unsubFriends = subscribeToFriendsWithPresence(activeUid, setFriends);

    return () => {
      unsubProfile();
      unsubPresence();
      unsubRequests();
      unsubFriends();
    };
  }, [activeUid]);

  const refreshVerification = useCallback(async (): Promise<boolean> => {
    const verified = await refreshEmailVerificationStatus();
    setEmailVerifiedFlag(verified);
    if (verified && auth.currentUser && !auth.currentUser.isAnonymous) {
      setFirebaseUser(auth.currentUser);
      await createOrSyncUserProfile(auth.currentUser).catch(() => {});
    }
    return verified;
  }, []);

  const logout = useCallback(async () => {
    await signOutUserAccount();
    setFirebaseUser(null);
    setProfile(null);
    setEmailVerifiedFlag(false);
    setPendingFriendRequests([]);
    setFriends([]);
  }, []);

  const isLoggedIn = Boolean(firebaseUser && !firebaseUser.isAnonymous);
  const isEmailVerified = isLoggedIn && emailVerifiedFlag;
  const needsTermsAcceptance =
    isLoggedIn &&
    profile !== null &&
    (!profile.termsAcceptedAt ||
      profile.termsVersion !== CURRENT_TERMS_VERSION);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        authLoading,
        isLoggedIn,
        isEmailVerified,
        needsTermsAcceptance,
        pendingFriendRequests,
        friends,
        refreshVerification,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
