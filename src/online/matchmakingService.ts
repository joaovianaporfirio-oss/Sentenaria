import {
  get,
  onDisconnect,
  onValue,
  ref,
  remove,
  runTransaction,
  set,
  update,
} from 'firebase/database';
import { MatchmakingPlayerCard, UserProfile } from '../account/types';
import { createInitialGameState } from '../core/gameEngine';
import { Player } from '../core/types';
import { auth, db } from './firebaseConfig';
import {
  deserializeRoomData,
  OnlineRole,
  OnlineRoomData,
  saveActiveRoomSession,
  serializeGameStateForFirebase,
} from './onlineService';
import { generateRoomCode } from './roomCodeUtils';

const QUEUE_STALE_MS = 90_000;

export interface MatchFoundResult {
  roomData: OnlineRoomData;
  role: OnlineRole;
  myColor: Player;
  me: MatchmakingPlayerCard;
  opponent: MatchmakingPlayerCard;
}

interface QueueEntry {
  uid: string;
  username: string;
  accountId: string;
  avatar: string;
  points: number;
  equippedBadge: string;
  joinedAt: number;
  status: 'waiting' | 'matched';
  roomCode?: string;
  opponentUid?: string;
}

function toCard(entry: Pick<QueueEntry, 'uid' | 'username' | 'accountId' | 'avatar' | 'points' | 'equippedBadge'>): MatchmakingPlayerCard {
  return {
    uid: entry.uid,
    username: entry.username,
    accountId: entry.accountId,
    avatar: entry.avatar,
    points: entry.points,
    equippedBadge: entry.equippedBadge as MatchmakingPlayerCard['equippedBadge'],
  };
}

/**
 * Joins the Ranked Random Matchmaking Queue (`/matchmakingQueue/{uid}`),
 * automatically registers `onDisconnect().remove()`, and pairs two available players
 * atomically into a freshly created Ranked Room (`isRanked: true`).
 * Returns a cleanup/cancel function.
 */
export function startRankedMatchmaking(
  myProfile: UserProfile,
  callbacks: {
    onMatchFound: (result: MatchFoundResult) => void;
    onError: (message: string) => void;
  }
): () => void {
  if (!auth.currentUser || auth.currentUser.isAnonymous || !auth.currentUser.emailVerified) {
    callbacks.onError(
      'Faça login com uma conta verificada para jogar o modo Ranqueado Online.'
    );
    return () => {};
  }

  let active = true;
  let matched = false;
  let pairingInProgress = false;

  const myUid = myProfile.uid;
  const myQueueRef = ref(db, `matchmakingQueue/${myUid}`);
  const queueRootRef = ref(db, 'matchmakingQueue');

  const myCard: MatchmakingPlayerCard = {
    uid: myProfile.uid,
    username: myProfile.username,
    accountId: myProfile.accountId,
    avatar: myProfile.avatar,
    points: myProfile.points,
    equippedBadge: myProfile.equippedBadge,
  };

  let unsubMyEntry: (() => void) | null = null;
  let unsubQueueScan: (() => void) | null = null;

  const cleanupListeners = () => {
    if (unsubMyEntry) {
      unsubMyEntry();
      unsubMyEntry = null;
    }
    if (unsubQueueScan) {
      unsubQueueScan();
      unsubQueueScan = null;
    }
  };

  const finalizeMatch = async (roomCode: string, role: OnlineRole) => {
    if (!active || matched) return;
    matched = true;
    cleanupListeners();

    try {
      const roomSnap = await get(ref(db, `rooms/${roomCode}`));
      if (!roomSnap.exists()) {
        matched = false;
        callbacks.onError('A sala ranqueada não foi encontrada. Tente novamente.');
        return;
      }

      const roomData = deserializeRoomData(roomSnap.val());
      const myColor: Player = role === 'host' ? 'red' : 'blue';
      const oppParticipant =
        role === 'host' ? roomData.players.guest : roomData.players.host;

      const opponentCard: MatchmakingPlayerCard = {
        uid: oppParticipant?.id || '',
        username: oppParticipant?.name || 'Adversário',
        accountId: oppParticipant?.accountId || '#SNT-0000',
        avatar: oppParticipant?.avatar || '',
        points: oppParticipant?.points ?? 0,
        equippedBadge:
          (oppParticipant?.equippedBadge as MatchmakingPlayerCard['equippedBadge']) ||
          'pioneer',
      };

      saveActiveRoomSession({
        roomCode,
        playerId: myUid,
        playerName: myProfile.username,
        role,
        myColor,
        savedAt: Date.now(),
      });

      // Remove our own queue entry once matched
      await remove(myQueueRef).catch(() => {});

      if (active) {
        callbacks.onMatchFound({
          roomData,
          role,
          myColor,
          me: myCard,
          opponent: opponentCard,
        });
      }
    } catch {
      if (active) {
        callbacks.onError('Erro ao carregar a partida ranqueada. Tente novamente.');
      }
    }
  };

  const attemptPairWithCandidate = async (candidate: QueueEntry) => {
    if (!active || matched || pairingInProgress) return;
    if (candidate.uid === myUid) return;
    pairingInProgress = true;

    try {
      const roomCode = generateRoomCode();
      const now = Date.now();

      // 1. Atomically claim the waiting opponent in the queue
      const oppQueueRef = ref(db, `matchmakingQueue/${candidate.uid}`);
      const claimTx = await runTransaction(oppQueueRef, (current) => {
        if (!current) return current;
        if (current.status !== 'waiting') return; // Already matched by someone else
        if (current.uid === myUid) return;
        current.status = 'matched';
        current.roomCode = roomCode;
        current.opponentUid = myUid;
        return current;
      });

      if (!claimTx.committed || !claimTx.snapshot.exists()) {
        pairingInProgress = false;
        return;
      }

      // 2. Create the Ranked Room (opponent = Host/Red, claimer = Guest/Blue)
      const initialGameState = createInitialGameState({
        scoringMode: 'eight_points', // 9 Pontos standard for Ranked Online
        ruleMode: 'adjacent',
        opponentMode: 'online',
      });

      const roomPayload = {
        code: roomCode,
        status: 'playing',
        isRanked: true,
        pointsAwarded: false,
        winnerUid: '',
        currentTurn: 'red',
        createdAt: now,
        updatedAt: now,
        hostId: candidate.uid,
        guestId: myUid,
        players: {
          host: {
            id: candidate.uid,
            name: candidate.username,
            color: 'red',
            role: 'host',
            connected: true,
            lastSeen: now,
            leftRoom: false,
            avatar: candidate.avatar || '',
            points: candidate.points ?? 0,
            equippedBadge: candidate.equippedBadge || 'pioneer',
            accountId: candidate.accountId || '#SNT-0000',
          },
          guest: {
            id: myUid,
            name: myProfile.username,
            color: 'blue',
            role: 'guest',
            connected: true,
            lastSeen: now,
            leftRoom: false,
            avatar: myProfile.avatar || '',
            points: myProfile.points ?? 0,
            equippedBadge: myProfile.equippedBadge || 'pioneer',
            accountId: myProfile.accountId || '#SNT-0000',
          },
        },
        gameState: serializeGameStateForFirebase(initialGameState),
      };

      await set(ref(db, `rooms/${roomCode}`), roomPayload);

      // Mark our own queue entry as matched too
      await update(myQueueRef, {
        status: 'matched',
        roomCode,
        opponentUid: candidate.uid,
      }).catch(() => {});

      const roomData = deserializeRoomData(roomPayload);
      matched = true;
      cleanupListeners();

      saveActiveRoomSession({
        roomCode,
        playerId: myUid,
        playerName: myProfile.username,
        role: 'guest',
        myColor: 'blue',
        savedAt: now,
      });

      await remove(myQueueRef).catch(() => {});

      if (active) {
        callbacks.onMatchFound({
          roomData,
          role: 'guest',
          myColor: 'blue',
          me: myCard,
          opponent: toCard(candidate),
        });
      }
    } catch {
      pairingInProgress = false;
    }
  };

  // Start queue lifecycle
  (async () => {
    try {
      const now = Date.now();
      const myEntry: QueueEntry = {
        uid: myUid,
        username: myProfile.username,
        accountId: myProfile.accountId,
        avatar: myProfile.avatar || '',
        points: myProfile.points ?? 0,
        equippedBadge: myProfile.equippedBadge || 'pioneer',
        joinedAt: now,
        status: 'waiting',
      };

      await onDisconnect(myQueueRef).remove();
      await set(myQueueRef, myEntry);

      if (!active) {
        await remove(myQueueRef).catch(() => {});
        return;
      }

      // Listen on our own queue entry in case someone else pairs with us first
      unsubMyEntry = onValue(myQueueRef, (snap) => {
        if (!active || matched || !snap.exists()) return;
        const val = snap.val() as QueueEntry;
        if (val.status === 'matched' && val.roomCode) {
          finalizeMatch(val.roomCode, 'host');
        }
      });

      // Scan queue for another eligible waiting opponent
      unsubQueueScan = onValue(
        queueRootRef,
        (snap) => {
          if (!active || matched || pairingInProgress || !snap.exists()) return;
          const all = snap.val() as Record<string, QueueEntry>;
          const cutoff = Date.now() - QUEUE_STALE_MS;

          const candidates = Object.values(all)
            .filter(
              (entry) =>
                entry &&
                entry.uid &&
                entry.uid !== myUid &&
                entry.status === 'waiting' &&
                Number(entry.joinedAt || 0) >= cutoff
            )
            .sort((a, b) => a.joinedAt - b.joinedAt);

          if (candidates.length > 0) {
            // Tie-breaker: player with lexicographically larger UID initiates the pairing transaction
            // (or if candidate has been waiting > 1.5s) to prevent dual simultaneous claims
            const target = candidates[0];
            if (myUid > target.uid || Date.now() - target.joinedAt > 1500) {
              attemptPairWithCandidate(target);
            }
          }
        },
        (err) => {
          if (active) {
            callbacks.onError(
              err.message || 'Não foi possível acessar a fila de matchmaking.'
            );
          }
        }
      );
    } catch (err: any) {
      if (active) {
        callbacks.onError(
          err?.message || 'Erro ao entrar na fila de matchmaking.'
        );
      }
    }
  })();

  return () => {
    active = false;
    cleanupListeners();
    if (!matched) {
      remove(myQueueRef).catch(() => {});
    }
  };
}
