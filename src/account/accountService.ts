import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  get,
  limitToLast,
  onDisconnect,
  onValue,
  orderByChild,
  query,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database';
import { auth, db, savePlayerNickname } from '../online/firebaseConfig';
import {
  sanitizePlayerName,
  stripUnsafeTextChars,
} from '../online/roomCodeUtils';
import { BadgeId, computeUnlockedBadges } from './badges';
import {
  CURRENT_TERMS_VERSION,
  FriendProfileSummary,
  FriendRequestItem,
  LeaderboardEntry,
  MAX_BIO_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  RANKED_WIN_POINTS,
  UserProfile,
} from './types';

// ============================================================================
// Validation & Error Mapping
// ============================================================================

const USERNAME_ALLOWED_REGEX = /^[a-zA-Z0-9_.\- ]+$/;
const ACCOUNT_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function sanitizeBio(raw: string): string {
  return stripUnsafeTextChars(raw)
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_BIO_LENGTH);
}

export function normalizeAccountIdKey(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatAccountIdDisplay(cleanKey: string): string {
  const normalized = normalizeAccountIdKey(cleanKey);
  if (normalized.startsWith('SNT') && normalized.length >= 7) {
    return `#SNT-${normalized.slice(3, 7)}`;
  }
  return `#${normalized}`;
}

export function validateUsername(raw: string): {
  valid: boolean;
  cleaned: string;
  lower: string;
  error: string | null;
} {
  const cleaned = sanitizePlayerName(raw, '');
  if (cleaned.length < MIN_USERNAME_LENGTH) {
    return {
      valid: false,
      cleaned,
      lower: cleaned.toLowerCase(),
      error: `O nome de usuário deve ter pelo menos ${MIN_USERNAME_LENGTH} caracteres.`,
    };
  }
  if (cleaned.length > MAX_USERNAME_LENGTH) {
    return {
      valid: false,
      cleaned: cleaned.slice(0, MAX_USERNAME_LENGTH),
      lower: cleaned.slice(0, MAX_USERNAME_LENGTH).toLowerCase(),
      error: `O nome de usuário deve ter no máximo ${MAX_USERNAME_LENGTH} caracteres.`,
    };
  }
  if (!USERNAME_ALLOWED_REGEX.test(cleaned)) {
    return {
      valid: false,
      cleaned,
      lower: cleaned.toLowerCase(),
      error: 'Use apenas letras sem acento, números, espaços, _ ou -.',
    };
  }
  return {
    valid: true,
    cleaned,
    lower: cleaned.toLowerCase().replace(/\s+/g, '_'),
    error: null,
  };
}

export function validateStrongPassword(password: string): {
  valid: boolean;
  error: string | null;
} {
  if (password.length < 8) {
    return {
      valid: false,
      error: 'A senha deve ter no mínimo 8 caracteres.',
    };
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'A senha deve conter letra maiúscula, minúscula e número.',
    };
  }
  return { valid: true, error: null };
}

export function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Tente entrar na sua conta.';
    case 'auth/invalid-email':
      return 'O formato do e-mail informado é inválido.';
    case 'auth/weak-password':
      return 'A senha escolhida é muito fraca. Use letras maiúsculas, minúsculas e números.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
    case 'auth/popup-closed-by-user':
      return 'O pop-up do Google foi fechado antes de concluir o login.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou o pop-up de login. Permita pop-ups para sentenaria.com.br.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns instantes antes de tentar novamente.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a internet. Verifique sua rede e tente novamente.';
    case 'auth/operation-not-allowed':
      return 'Este método de login ainda não está ativado no Console do Firebase.';
    default:
      return (
        (err as { message?: string })?.message ||
        'Não foi possível concluir a autenticação. Tente novamente.'
      );
  }
}

function generateShortAccountId(): { display: string; key: string } {
  let suffix = '';
  const len = ACCOUNT_ID_ALPHABET.length;
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(4);
    crypto.getRandomValues(arr);
    for (let i = 0; i < 4; i++) {
      suffix += ACCOUNT_ID_ALPHABET[arr[i] % len];
    }
  } else {
    for (let i = 0; i < 4; i++) {
      suffix += ACCOUNT_ID_ALPHABET[Math.floor(Math.random() * len)];
    }
  }
  return {
    display: `#SNT-${suffix}`,
    key: `SNT${suffix}`,
  };
}

// ============================================================================
// Profile Deserialization & Creation
// ============================================================================

export function deserializeUserProfile(
  uid: string,
  raw: Record<string, any> | null | undefined
): UserProfile | null {
  if (!raw || typeof raw !== 'object') return null;

  const badges: Record<string, boolean> = { pioneer: true };
  if (raw.badges && typeof raw.badges === 'object') {
    for (const [k, v] of Object.entries(raw.badges)) {
      if (v) badges[k] = true;
    }
  }

  return {
    uid: String(raw.uid || uid),
    accountId: String(raw.accountId || '#SNT-0000'),
    username: sanitizePlayerName(String(raw.username || ''), 'Jogador'),
    usernameLower: String(raw.usernameLower || ''),
    email: String(raw.email || ''),
    bio: sanitizeBio(String(raw.bio || '')),
    avatar: typeof raw.avatar === 'string' ? raw.avatar : '',
    points: Math.max(0, Number(raw.points ?? 0)),
    rankedWins: Math.max(0, Number(raw.rankedWins ?? 0)),
    rankedLosses: Math.max(0, Number(raw.rankedLosses ?? 0)),
    currentWinStreak: Math.max(0, Number(raw.currentWinStreak ?? 0)),
    bestWinStreak: Math.max(0, Number(raw.bestWinStreak ?? 0)),
    badges,
    equippedBadge: (raw.equippedBadge || 'pioneer') as BadgeId,
    termsAcceptedAt:
      typeof raw.termsAcceptedAt === 'number' ? raw.termsAcceptedAt : null,
    termsVersion: String(raw.termsVersion || ''),
    createdAt: Number(raw.createdAt ?? Date.now()),
    updatedAt: Number(raw.updatedAt ?? Date.now()),
    presence: {
      online: Boolean(raw.presence?.online ?? false),
      lastSeen: Number(raw.presence?.lastSeen ?? Date.now()),
    },
  };
}

async function reserveUniqueAccountId(uid: string): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateShortAccountId();
    const idRef = ref(db, `accountIds/${candidate.key}`);
    const snap = await get(idRef);
    if (!snap.exists()) {
      await set(idRef, { uid });
      return candidate.display;
    }
  }
  const fallbackSuffix = uid.slice(0, 4).toUpperCase();
  const fallbackKey = `SNT${fallbackSuffix}`;
  await set(ref(db, `accountIds/${fallbackKey}`), { uid }).catch(() => {});
  return `#SNT-${fallbackSuffix}`;
}

async function reserveUniqueUsername(
  uid: string,
  preferredRaw: string
): Promise<{ cleaned: string; lower: string }> {
  const baseCheck = validateUsername(preferredRaw);
  const baseName = baseCheck.valid
    ? baseCheck.cleaned
    : sanitizePlayerName(
        preferredRaw.replace(/[^a-zA-Z0-9_.\- ]/g, ''),
        'Jogador'
      );

  const tryClaim = async (name: string) => {
    const lower = name.toLowerCase().replace(/\s+/g, '_');
    const nameRef = ref(db, `usernames/${lower}`);
    const snap = await get(nameRef);
    if (!snap.exists() || snap.val()?.uid === uid) {
      await set(nameRef, { uid });
      return { cleaned: name, lower };
    }
    return null;
  };

  const direct = await tryClaim(baseName);
  if (direct) return direct;

  for (let i = 0; i < 6; i++) {
    const suffix = Math.floor(100 + Math.random() * 900);
    const trimmed = baseName.slice(0, MAX_USERNAME_LENGTH - 4);
    const attempt = await tryClaim(`${trimmed}_${suffix}`);
    if (attempt) return attempt;
  }

  const fallback = `Player_${uid.slice(0, 5)}`;
  const lower = fallback.toLowerCase();
  await set(ref(db, `usernames/${lower}`), { uid }).catch(() => {});
  return { cleaned: fallback, lower };
}

export async function syncLeaderboardProjection(
  profile: UserProfile
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) return;
  if (!auth.currentUser.emailVerified) return;

  const entry: LeaderboardEntry = {
    uid: profile.uid,
    accountId: profile.accountId,
    username: profile.username,
    avatar: profile.avatar,
    points: profile.points,
    equippedBadge: profile.equippedBadge,
    rankedWins: profile.rankedWins,
    updatedAt: Date.now(),
  };

  await set(ref(db, `leaderboard/${profile.uid}`), entry).catch(() => {});
}

export async function createOrSyncUserProfile(
  user: User,
  options?: {
    preferredUsername?: string;
    acceptedTermsNow?: boolean;
  }
): Promise<UserProfile> {
  const userRef = ref(db, `users/${user.uid}`);
  const existingSnap = await get(userRef);

  if (existingSnap.exists()) {
    const existing = deserializeUserProfile(user.uid, existingSnap.val());
    if (existing) {
      savePlayerNickname(existing.username);
      if (user.emailVerified) {
        await syncLeaderboardProjection(existing);
      }
      return existing;
    }
  }

  const rawPreferred =
    options?.preferredUsername ||
    user.displayName ||
    (user.email ? user.email.split('@')[0] : 'Jogador');

  const { cleaned: username, lower: usernameLower } =
    await reserveUniqueUsername(user.uid, rawPreferred);
  const accountId = await reserveUniqueAccountId(user.uid);
  const now = Date.now();

  const newProfile: UserProfile = {
    uid: user.uid,
    accountId,
    username,
    usernameLower,
    email: user.email || '',
    bio: '',
    avatar: user.photoURL || '',
    points: 0,
    rankedWins: 0,
    rankedLosses: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
    badges: { pioneer: true },
    equippedBadge: 'pioneer',
    termsAcceptedAt: options?.acceptedTermsNow ? now : null,
    termsVersion: options?.acceptedTermsNow ? CURRENT_TERMS_VERSION : '',
    createdAt: now,
    updatedAt: now,
    presence: {
      online: true,
      lastSeen: now,
    },
  };

  await set(userRef, newProfile);
  savePlayerNickname(username);

  if (user.emailVerified) {
    await syncLeaderboardProjection(newProfile);
  }

  return newProfile;
}

// ============================================================================
// Authentication Operations (Google + Email/Password + Email Verification)
// ============================================================================

export async function signInWithGoogleAccount(): Promise<UserProfile> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(auth, provider);
    return await createOrSyncUserProfile(cred.user);
  } catch (err) {
    throw new Error(mapFirebaseAuthError(err));
  }
}

export async function signUpWithEmailAccount(params: {
  username: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}): Promise<{ user: User; profile: UserProfile }> {
  const userCheck = validateUsername(params.username);
  if (!userCheck.valid) {
    throw new Error(userCheck.error || 'Nome de usuário inválido.');
  }

  const passCheck = validateStrongPassword(params.password);
  if (!passCheck.valid) {
    throw new Error(passCheck.error || 'Senha fraca.');
  }

  if (!params.termsAccepted) {
    throw new Error('Você precisa aceitar os Novos Termos para criar sua conta.');
  }

  // Pre-check username availability before creating Firebase Auth account
  try {
    const existingUsernameSnap = await get(ref(db, `usernames/${userCheck.lower}`));
    if (existingUsernameSnap.exists()) {
      throw new Error('Este nome de usuário já está em uso. Escolha outro.');
    }
  } catch (err: any) {
    if (err?.message?.includes('já está em uso')) {
      throw err;
    }
    // If unauthenticated read is blocked by rules, proceed and claim right after auth creation
  }

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      params.email.trim(),
      params.password
    );
    await updateProfile(cred.user, { displayName: userCheck.cleaned }).catch(
      () => {}
    );
    await sendEmailVerification(cred.user);

    const profile = await createOrSyncUserProfile(cred.user, {
      preferredUsername: userCheck.cleaned,
      acceptedTermsNow: true,
    });

    return { user: cred.user, profile };
  } catch (err) {
    throw new Error(mapFirebaseAuthError(err));
  }
}

export async function signInWithEmailAccount(
  email: string,
  password: string
): Promise<{ user: User; profile: UserProfile }> {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const profile = await createOrSyncUserProfile(cred.user);
    return { user: cred.user, profile };
  } catch (err) {
    throw new Error(mapFirebaseAuthError(err));
  }
}

export async function resendVerificationEmail(): Promise<void> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('Nenhuma conta autenticada encontrada.');
  }
  try {
    await sendEmailVerification(auth.currentUser);
  } catch (err) {
    throw new Error(mapFirebaseAuthError(err));
  }
}

export async function refreshEmailVerificationStatus(): Promise<boolean> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) return false;
  await reload(auth.currentUser);
  if (auth.currentUser.emailVerified) {
    await auth.currentUser.getIdToken(true).catch(() => {});
  }
  return Boolean(auth.currentUser.emailVerified);
}

export async function signOutUserAccount(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid && !auth.currentUser?.isAnonymous) {
    await update(ref(db, `users/${uid}/presence`), {
      online: false,
      lastSeen: Date.now(),
    }).catch(() => {});
    await remove(ref(db, `matchmakingQueue/${uid}`)).catch(() => {});
  }
  await signOut(auth);
}

// ============================================================================
// Profile Updates, Terms Acceptance & Presence
// ============================================================================

export async function acceptTermsForUser(uid: string): Promise<void> {
  const now = Date.now();
  await update(ref(db, `users/${uid}`), {
    termsAcceptedAt: now,
    termsVersion: CURRENT_TERMS_VERSION,
    updatedAt: now,
  });
}

export async function updateUserProfileFields(
  currentProfile: UserProfile,
  updates: {
    username?: string;
    bio?: string;
    avatar?: string;
    equippedBadge?: BadgeId;
  }
): Promise<UserProfile> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('Faça login para editar seu perfil.');
  }
  if (!auth.currentUser.emailVerified) {
    throw new Error(
      'Confirme seu e-mail antes de editar o perfil público.'
    );
  }

  const nextUpdates: Record<string, unknown> = {
    updatedAt: Date.now(),
  };

  let nextUsername = currentProfile.username;
  let nextUsernameLower = currentProfile.usernameLower;

  if (
    updates.username !== undefined &&
    updates.username.trim() !== currentProfile.username
  ) {
    const check = validateUsername(updates.username);
    if (!check.valid) {
      throw new Error(check.error || 'Nome de usuário inválido.');
    }
    if (check.lower !== currentProfile.usernameLower) {
      const targetRef = ref(db, `usernames/${check.lower}`);
      const snap = await get(targetRef);
      if (snap.exists() && snap.val()?.uid !== currentProfile.uid) {
        throw new Error('Este nome de usuário já está em uso por outro jogador.');
      }
      await set(targetRef, { uid: currentProfile.uid });
      if (currentProfile.usernameLower) {
        await remove(ref(db, `usernames/${currentProfile.usernameLower}`)).catch(
          () => {}
        );
      }
    }
    nextUsername = check.cleaned;
    nextUsernameLower = check.lower;
    nextUpdates.username = nextUsername;
    nextUpdates.usernameLower = nextUsernameLower;
    savePlayerNickname(nextUsername);
  }

  let nextBio = currentProfile.bio;
  if (updates.bio !== undefined) {
    nextBio = sanitizeBio(updates.bio);
    nextUpdates.bio = nextBio;
  }

  let nextAvatar = currentProfile.avatar;
  if (updates.avatar !== undefined) {
    if (
      updates.avatar !== '' &&
      !updates.avatar.startsWith('data:image/webp;base64,') &&
      !updates.avatar.startsWith('data:image/jpeg;base64,') &&
      !updates.avatar.startsWith('https://')
    ) {
      throw new Error('Formato de avatar inválido.');
    }
    if (updates.avatar.length > 130_000) {
      throw new Error('Avatar excede o tamanho máximo permitido.');
    }
    nextAvatar = updates.avatar;
    nextUpdates.avatar = nextAvatar;
  }

  let nextBadge = currentProfile.equippedBadge;
  if (updates.equippedBadge !== undefined) {
    if (!currentProfile.badges[updates.equippedBadge]) {
      throw new Error('Você ainda não desbloqueou este emblema.');
    }
    nextBadge = updates.equippedBadge;
    nextUpdates.equippedBadge = nextBadge;
  }

  await update(ref(db, `users/${currentProfile.uid}`), nextUpdates);

  const merged: UserProfile = {
    ...currentProfile,
    username: nextUsername,
    usernameLower: nextUsernameLower,
    bio: nextBio,
    avatar: nextAvatar,
    equippedBadge: nextBadge,
    updatedAt: Date.now(),
  };

  await syncLeaderboardProjection(merged);
  return merged;
}

export function subscribeToUserProfile(
  uid: string,
  onProfile: (profile: UserProfile | null) => void
): () => void {
  const userRef = ref(db, `users/${uid}`);
  const unsub = onValue(
    userRef,
    (snap) => {
      if (!snap.exists()) {
        onProfile(null);
        return;
      }
      onProfile(deserializeUserProfile(uid, snap.val()));
    },
    () => {
      onProfile(null);
    }
  );
  return () => unsub();
}

export function startUserPresence(uid: string): () => void {
  const presenceRef = ref(db, `users/${uid}/presence`);
  const connectedRef = ref(db, '.info/connected');

  const unsub = onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      onDisconnect(presenceRef)
        .update({
          online: false,
          lastSeen: Date.now(),
        })
        .catch(() => {});

      update(presenceRef, {
        online: true,
        lastSeen: Date.now(),
      }).catch(() => {});
    }
  });

  return () => {
    unsub();
    update(presenceRef, {
      online: false,
      lastSeen: Date.now(),
    }).catch(() => {});
  };
}

// ============================================================================
// Friends System (Lookup by Account ID, Requests, Accept/Decline/Remove)
// ============================================================================

export async function findPlayerByAccountId(
  rawAccountId: string
): Promise<UserProfile | null> {
  const key = normalizeAccountIdKey(rawAccountId);
  if (key.length < 4) {
    throw new Error('Digite um ID de conta válido (ex.: #SNT-4829).');
  }

  const lookupSnap = await get(ref(db, `accountIds/${key}`));
  if (!lookupSnap.exists()) {
    return null;
  }
  const targetUid = lookupSnap.val()?.uid;
  if (!targetUid) return null;

  const userSnap = await get(ref(db, `users/${targetUid}`));
  if (!userSnap.exists()) return null;
  return deserializeUserProfile(targetUid, userSnap.val());
}

export async function sendFriendRequestByAccountId(
  senderProfile: UserProfile,
  rawTargetAccountId: string
): Promise<UserProfile> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    throw new Error('Confirme seu e-mail para adicionar amigos.');
  }

  const target = await findPlayerByAccountId(rawTargetAccountId);
  if (!target) {
    throw new Error('Nenhum jogador encontrado com este ID de conta.');
  }
  if (target.uid === senderProfile.uid) {
    throw new Error('Você não pode adicionar a si mesmo como amigo.');
  }

  const existingFriendSnap = await get(
    ref(db, `friends/${senderProfile.uid}/${target.uid}`)
  );
  if (existingFriendSnap.exists()) {
    throw new Error(`${target.username} já está na sua lista de amigos!`);
  }

  const payload: FriendRequestItem = {
    fromUid: senderProfile.uid,
    fromUsername: senderProfile.username,
    fromAccountId: senderProfile.accountId,
    fromAvatar: senderProfile.avatar,
    fromPoints: senderProfile.points,
    fromBadge: senderProfile.equippedBadge,
    createdAt: Date.now(),
  };

  await set(
    ref(db, `friendRequests/${target.uid}/${senderProfile.uid}`),
    payload
  );

  return target;
}

export async function acceptFriendRequest(
  myUid: string,
  fromUid: string
): Promise<void> {
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    throw new Error('Confirme seu e-mail para aceitar pedidos de amizade.');
  }
  const now = Date.now();
  await update(ref(db), {
    [`friends/${myUid}/${fromUid}`]: { uid: fromUid, since: now },
    [`friends/${fromUid}/${myUid}`]: { uid: myUid, since: now },
    [`friendRequests/${myUid}/${fromUid}`]: null,
  });
}

export async function declineFriendRequest(
  myUid: string,
  fromUid: string
): Promise<void> {
  await remove(ref(db, `friendRequests/${myUid}/${fromUid}`));
}

export async function removeFriend(
  myUid: string,
  friendUid: string
): Promise<void> {
  await update(ref(db), {
    [`friends/${myUid}/${friendUid}`]: null,
    [`friends/${friendUid}/${myUid}`]: null,
  });
}

export function subscribeToIncomingFriendRequests(
  uid: string,
  onRequests: (requests: FriendRequestItem[]) => void
): () => void {
  const reqRef = ref(db, `friendRequests/${uid}`);
  const unsub = onValue(
    reqRef,
    (snap) => {
      if (!snap.exists()) {
        onRequests([]);
        return;
      }
      const raw = snap.val() as Record<string, any>;
      const list: FriendRequestItem[] = Object.values(raw)
        .filter((item) => item && typeof item === 'object' && item.fromUid)
        .map((item) => ({
          fromUid: String(item.fromUid),
          fromUsername: sanitizePlayerName(
            String(item.fromUsername || ''),
            'Jogador'
          ),
          fromAccountId: String(item.fromAccountId || ''),
          fromAvatar: typeof item.fromAvatar === 'string' ? item.fromAvatar : '',
          fromPoints: Math.max(0, Number(item.fromPoints ?? 0)),
          fromBadge: (item.fromBadge || 'pioneer') as BadgeId,
          createdAt: Number(item.createdAt ?? Date.now()),
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
      onRequests(list);
    },
    () => onRequests([])
  );
  return () => unsub();
}

export function subscribeToFriendsWithPresence(
  uid: string,
  onFriends: (friends: FriendProfileSummary[]) => void
): () => void {
  const friendsRef = ref(db, `friends/${uid}`);
  const childUnsubs = new Map<string, () => void>();
  const friendMap = new Map<string, FriendProfileSummary>();

  const emitSorted = () => {
    const sorted = Array.from(friendMap.values()).sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      return b.points - a.points;
    });
    onFriends(sorted);
  };

  const unsubList = onValue(
    friendsRef,
    (snap) => {
      const raw = snap.exists() ? (snap.val() as Record<string, any>) : {};
      const currentFriendUids = new Set(Object.keys(raw));

      // Unsubscribe removed friends
      for (const [oldUid, unsub] of childUnsubs.entries()) {
        if (!currentFriendUids.has(oldUid)) {
          unsub();
          childUnsubs.delete(oldUid);
          friendMap.delete(oldUid);
        }
      }

      if (currentFriendUids.size === 0) {
        emitSorted();
        return;
      }

      for (const friendUid of currentFriendUids) {
        if (childUnsubs.has(friendUid)) continue;
        const since = Number(raw[friendUid]?.since ?? Date.now());
        const fUserRef = ref(db, `users/${friendUid}`);
        const unsubChild = onValue(
          fUserRef,
          (uSnap) => {
            if (!uSnap.exists()) {
              friendMap.delete(friendUid);
              emitSorted();
              return;
            }
            const p = deserializeUserProfile(friendUid, uSnap.val());
            if (p) {
              friendMap.set(friendUid, {
                uid: p.uid,
                accountId: p.accountId,
                username: p.username,
                avatar: p.avatar,
                points: p.points,
                equippedBadge: p.equippedBadge,
                online: p.presence.online,
                lastSeen: p.presence.lastSeen,
                since,
              });
              emitSorted();
            }
          },
          () => {}
        );
        childUnsubs.set(friendUid, unsubChild);
      }
    },
    () => onFriends([])
  );

  return () => {
    unsubList();
    for (const unsub of childUnsubs.values()) {
      unsub();
    }
    childUnsubs.clear();
  };
}

// ============================================================================
// World Leaderboard & Idempotent Ranked Victory Points (+10 pts)
// ============================================================================

export function subscribeToWorldLeaderboard(
  limitCount: number,
  onEntries: (entriesDesc: LeaderboardEntry[]) => void
): () => void {
  const lbQuery = query(
    ref(db, 'leaderboard'),
    orderByChild('points'),
    limitToLast(limitCount)
  );

  const unsub = onValue(
    lbQuery,
    (snap) => {
      if (!snap.exists()) {
        onEntries([]);
        return;
      }
      const raw = snap.val() as Record<string, any>;
      const list: LeaderboardEntry[] = Object.entries(raw)
        .filter(([, v]) => v && typeof v === 'object')
        .map(([k, v]) => ({
          uid: String(v.uid || k),
          accountId: String(v.accountId || '#SNT-0000'),
          username: sanitizePlayerName(String(v.username || ''), 'Jogador'),
          avatar: typeof v.avatar === 'string' ? v.avatar : '',
          points: Math.max(0, Number(v.points ?? 0)),
          equippedBadge: (v.equippedBadge || 'pioneer') as BadgeId,
          rankedWins: Math.max(0, Number(v.rankedWins ?? 0)),
          updatedAt: Number(v.updatedAt ?? 0),
        }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.rankedWins !== a.rankedWins) return b.rankedWins - a.rankedWins;
          return a.updatedAt - b.updatedAt;
        });

      onEntries(list);
    },
    () => onEntries([])
  );

  return () => unsub();
}

/**
 * Idempotently awards +10 ranked points to the winner of a finished Ranked Online match.
 * Uses an atomic Firebase transaction on `rooms/{roomCode}/pointsAwarded` to guarantee
 * that the same match can NEVER award points more than once.
 */
export async function claimRankedMatchVictoryPoints(params: {
  roomCode: string;
  winnerUid: string;
  loserUid?: string | null;
}): Promise<{ awarded: boolean; newPoints: number; delta: number }> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    return { awarded: false, newPoints: 0, delta: 0 };
  }
  if (auth.currentUser.uid !== params.winnerUid) {
    return { awarded: false, newPoints: 0, delta: 0 };
  }

  const code = params.roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/${code}`);

  // Step 1: Atomically lock `pointsAwarded = true` on the finished ranked room
  const tx = await runTransaction(roomRef, (current) => {
    if (!current) return current;
    if (!current.isRanked) return; // Not a ranked random match
    if (current.pointsAwarded === true) return; // Already awarded!
    if (
      current.status !== 'finished' &&
      current.gameState?.status !== 'finished'
    ) {
      return; // Match not finished
    }
    if (
      current.hostId !== params.winnerUid &&
      current.guestId !== params.winnerUid
    ) {
      return; // Caller is not a participant
    }

    current.pointsAwarded = true;
    current.winnerUid = params.winnerUid;
    current.updatedAt = Date.now();
    return current;
  });

  if (!tx.committed) {
    return { awarded: false, newPoints: 0, delta: 0 };
  }

  // Step 2: Increment winner's points (+10), wins, streak, and unlocked badges
  const userRef = ref(db, `users/${params.winnerUid}`);
  const userSnap = await get(userRef);
  if (!userSnap.exists()) {
    return { awarded: false, newPoints: 0, delta: 0 };
  }

  const profile = deserializeUserProfile(params.winnerUid, userSnap.val());
  if (!profile) {
    return { awarded: false, newPoints: 0, delta: 0 };
  }

  const newPoints = profile.points + RANKED_WIN_POINTS;
  const newWins = profile.rankedWins + 1;
  const newStreak = profile.currentWinStreak + 1;
  const newBestStreak = Math.max(profile.bestWinStreak, newStreak);
  const nextBadges = computeUnlockedBadges({
    existing: profile.badges,
    rankedWins: newWins,
    bestWinStreak: newBestStreak,
    points: newPoints,
  });

  await update(userRef, {
    points: newPoints,
    rankedWins: newWins,
    currentWinStreak: newStreak,
    bestWinStreak: newBestStreak,
    badges: nextBadges,
    lastRewardedRoom: code,
    updatedAt: Date.now(),
  });

  await syncLeaderboardProjection({
    ...profile,
    points: newPoints,
    rankedWins: newWins,
    currentWinStreak: newStreak,
    bestWinStreak: newBestStreak,
    badges: nextBadges,
  });

  return {
    awarded: true,
    newPoints,
    delta: RANKED_WIN_POINTS,
  };
}
