import {
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  runTransaction,
  set,
  update,
} from 'firebase/database';
import { TOTAL_CELLS } from '../core/constants';
import {
  createInitialBoard,
  createInitialGameState,
  isValidMove,
  makeMove,
} from '../core/gameEngine';
import {
  CellState,
  EndReason,
  FormedTrinca,
  GameConfig,
  GameState,
  MoveRecord,
  Player,
} from '../core/types';
import { db } from './firebaseConfig';
import {
  generateRoomCode,
  validateAndNormalizeRoomCode,
  validateChatMessage,
} from './roomCodeUtils';

export type OnlineRole = 'host' | 'guest';

export type OnlineRoomStatus = 'waiting' | 'playing' | 'finished' | 'abandoned';

export interface OnlinePlayerParticipant {
  id: string;
  name: string;
  color: Player;
  role: OnlineRole;
  connected: boolean;
  lastSeen: number;
  leftRoom: boolean;
}

export interface OnlineChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: OnlineRole;
  senderColor: Player;
  text: string;
  timestamp: number;
}

export interface OnlineRoomData {
  code: string;
  status: OnlineRoomStatus;
  createdAt: number;
  updatedAt: number;
  hostId: string;
  guestId: string;
  players: {
    host: OnlinePlayerParticipant;
    guest: OnlinePlayerParticipant | null;
  };
  gameState: GameState;
}

// ============================================================================
// Firebase Realtime Database Safe Serialization / Deserialization
// (Prevents Firebase RTDB from stripping null fields or empty arrays)
// ============================================================================

interface SerializedCell {
  row: number;
  col: number;
  index: number;
  owner: Player | 'none';
  inTrinca: boolean;
  trincaCount: number;
  placedAtTurn: number; // -1 for null
}

interface SerializedTrinca {
  id: string;
  player: Player;
  indices: [number, number, number];
  coords: [
    { row: number; col: number },
    { row: number; col: number },
    { row: number; col: number }
  ];
  direction: FormedTrinca['direction'];
  formedAtTurn: number;
  reusedCellIndex: number; // -1 for null
}

interface SerializedMoveRecord {
  turnNumber: number;
  player: Player;
  row: number;
  col: number;
  index: number;
  trincasFormed: SerializedTrinca[];
  pointsEarned: number;
  scoreAfter: { red: number; blue: number };
  timestamp: number;
}

interface SerializedGameState {
  board: SerializedCell[];
  currentPlayer: Player;
  turnCount: number;
  scores: { red: number; blue: number };
  formedTrincas: SerializedTrinca[];
  formedTrincaIds: Record<string, boolean>;
  lastMove: SerializedMoveRecord | 'none';
  moveHistory: SerializedMoveRecord[];
  status: GameState['status'];
  winner: Player | 'draw' | 'none';
  endReason: Exclude<EndReason, null> | 'none';
  config: GameConfig;
}

function serializeTrinca(t: FormedTrinca): SerializedTrinca {
  return {
    id: t.id,
    player: t.player,
    indices: t.indices,
    coords: t.coords,
    direction: t.direction,
    formedAtTurn: t.formedAtTurn,
    reusedCellIndex: t.reusedCellIndex ?? -1,
  };
}

function deserializeTrinca(raw: SerializedTrinca): FormedTrinca {
  return {
    id: raw.id,
    player: raw.player,
    indices: [raw.indices[0], raw.indices[1], raw.indices[2]],
    coords: [raw.coords[0], raw.coords[1], raw.coords[2]],
    direction: raw.direction,
    formedAtTurn: raw.formedAtTurn,
    reusedCellIndex: raw.reusedCellIndex === -1 ? null : raw.reusedCellIndex,
  };
}

function serializeMove(m: MoveRecord): SerializedMoveRecord {
  return {
    turnNumber: m.turnNumber,
    player: m.player,
    row: m.row,
    col: m.col,
    index: m.index,
    trincasFormed: (m.trincasFormed ?? []).map(serializeTrinca),
    pointsEarned: m.pointsEarned,
    scoreAfter: { ...m.scoreAfter },
    timestamp: m.timestamp,
  };
}

function deserializeMove(raw: SerializedMoveRecord): MoveRecord {
  return {
    turnNumber: raw.turnNumber,
    player: raw.player,
    row: raw.row,
    col: raw.col,
    index: raw.index,
    trincasFormed: Array.isArray(raw.trincasFormed)
      ? raw.trincasFormed.map(deserializeTrinca)
      : [],
    pointsEarned: raw.pointsEarned ?? 0,
    scoreAfter: raw.scoreAfter ?? { red: 0, blue: 0 },
    timestamp: raw.timestamp ?? Date.now(),
  };
}

export function serializeGameStateForFirebase(
  state: GameState
): SerializedGameState {
  return {
    board: state.board.map((c) => ({
      row: c.row,
      col: c.col,
      index: c.index,
      owner: c.owner ?? 'none',
      inTrinca: Boolean(c.inTrinca),
      trincaCount: c.trincaCount ?? 0,
      placedAtTurn: c.placedAtTurn ?? -1,
    })),
    currentPlayer: state.currentPlayer,
    turnCount: state.turnCount,
    scores: {
      red: state.scores.red ?? 0,
      blue: state.scores.blue ?? 0,
    },
    formedTrincas: state.formedTrincas.map(serializeTrinca),
    formedTrincaIds: { _init: true, ...state.formedTrincaIds },
    lastMove: state.lastMove ? serializeMove(state.lastMove) : 'none',
    moveHistory: state.moveHistory.map(serializeMove),
    status: state.status,
    winner: state.winner ?? 'none',
    endReason: state.endReason ?? 'none',
    config: { ...state.config, opponentMode: 'online' },
  };
}

export function deserializeGameStateFromFirebase(
  raw: SerializedGameState | undefined | null
): GameState {
  if (!raw) {
    return createInitialGameState({ opponentMode: 'online' });
  }

  const fallbackBoard = createInitialBoard();
  const rawBoard = Array.isArray(raw.board) ? raw.board : [];
  const board: CellState[] = fallbackBoard.map((defaultCell, i) => {
    const rc = rawBoard[i];
    if (!rc) return defaultCell;
    return {
      row: rc.row ?? defaultCell.row,
      col: rc.col ?? defaultCell.col,
      index: rc.index ?? i,
      owner: rc.owner === 'red' || rc.owner === 'blue' ? rc.owner : null,
      inTrinca: Boolean(rc.inTrinca),
      trincaCount: Number(rc.trincaCount ?? 0),
      placedAtTurn:
        typeof rc.placedAtTurn === 'number' && rc.placedAtTurn >= 0
          ? rc.placedAtTurn
          : null,
    };
  });

  const formedTrincas: FormedTrinca[] = Array.isArray(raw.formedTrincas)
    ? raw.formedTrincas.map(deserializeTrinca)
    : [];

  const formedTrincaIds: Record<string, boolean> = {};
  if (raw.formedTrincaIds && typeof raw.formedTrincaIds === 'object') {
    for (const [k, v] of Object.entries(raw.formedTrincaIds)) {
      if (k !== '_init' && v) {
        formedTrincaIds[k] = true;
      }
    }
  }
  for (const t of formedTrincas) {
    formedTrincaIds[t.id] = true;
  }

  const moveHistory: MoveRecord[] = Array.isArray(raw.moveHistory)
    ? raw.moveHistory.map(deserializeMove)
    : [];

  const lastMove: MoveRecord | null =
    raw.lastMove && raw.lastMove !== 'none'
      ? deserializeMove(raw.lastMove)
      : moveHistory.length > 0
      ? moveHistory[moveHistory.length - 1]
      : null;

  return {
    board,
    currentPlayer: raw.currentPlayer === 'blue' ? 'blue' : 'red',
    turnCount: Number(raw.turnCount ?? 0),
    scores: {
      red: Number(raw.scores?.red ?? 0),
      blue: Number(raw.scores?.blue ?? 0),
    },
    formedTrincas,
    formedTrincaIds,
    lastMove,
    moveHistory,
    status: raw.status === 'finished' ? 'finished' : 'playing',
    winner:
      raw.winner === 'red' || raw.winner === 'blue' || raw.winner === 'draw'
        ? raw.winner
        : null,
    endReason:
      raw.endReason && raw.endReason !== 'none' ? raw.endReason : null,
    config: {
      ruleMode: raw.config?.ruleMode === 'adjacent' ? 'adjacent' : 'regular',
      scoringMode:
        raw.config?.scoringMode === 'free' ? 'free' : 'eight_points',
      opponentMode: 'online',
      aiDifficulty: raw.config?.aiDifficulty ?? 'medium',
      aiPlayer: raw.config?.aiPlayer ?? 'blue',
    },
  };
}

function deserializeRoomData(raw: Record<string, any>): OnlineRoomData {
  const hostRaw = raw.players?.host;
  const guestRaw = raw.players?.guest;

  return {
    code: String(raw.code ?? ''),
    status: (raw.status as OnlineRoomStatus) ?? 'waiting',
    createdAt: Number(raw.createdAt ?? Date.now()),
    updatedAt: Number(raw.updatedAt ?? Date.now()),
    hostId: String(raw.hostId ?? ''),
    guestId: String(raw.guestId ?? ''),
    players: {
      host: {
        id: String(hostRaw?.id ?? raw.hostId ?? ''),
        name: String(hostRaw?.name ?? 'Host (Vermelho)'),
        color: 'red',
        role: 'host',
        connected: Boolean(hostRaw?.connected ?? true),
        lastSeen: Number(hostRaw?.lastSeen ?? Date.now()),
        leftRoom: Boolean(hostRaw?.leftRoom ?? false),
      },
      guest:
        guestRaw && guestRaw !== 'none' && guestRaw.id
          ? {
              id: String(guestRaw.id),
              name: String(guestRaw.name ?? 'Convidado (Azul)'),
              color: 'blue',
              role: 'guest',
              connected: Boolean(guestRaw.connected ?? true),
              lastSeen: Number(guestRaw.lastSeen ?? Date.now()),
              leftRoom: Boolean(guestRaw.leftRoom ?? false),
            }
          : null,
    },
    gameState: deserializeGameStateFromFirebase(raw.gameState),
  };
}

// ============================================================================
// Active Session Persistence for Automatic Reconnection
// ============================================================================

const ACTIVE_ROOM_STORAGE_KEY = 'sentenaria_active_online_room_v1';

export interface SavedRoomSession {
  roomCode: string;
  playerId: string;
  playerName: string;
  role: OnlineRole;
  myColor: Player;
  savedAt: number;
}

export function saveActiveRoomSession(session: SavedRoomSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
}

export function loadActiveRoomSession(): SavedRoomSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_ROOM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedRoomSession;
  } catch {
    return null;
  }
}

export function clearActiveRoomSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ============================================================================
// Core Room Lifecycle Operations (Create, Join, Move, Chat, Presence)
// ============================================================================

/**
 * Creates a new private room with a unique 6-character alphanumeric code.
 * The creator is registered as Host (Red player) and the room enters 'waiting' state.
 */
export async function createOnlineRoom(
  hostId: string,
  hostName: string,
  config: Partial<GameConfig>
): Promise<{ roomData: OnlineRoomData; role: OnlineRole; myColor: Player }> {
  const cleanName = hostName.trim() || 'Host (Vermelho)';
  const initialGameState = createInitialGameState({
    ...config,
    opponentMode: 'online',
  });

  for (let attempt = 0; attempt < 6; attempt++) {
    const candidateCode = generateRoomCode();
    const roomRef = ref(db, `rooms/${candidateCode}`);
    const now = Date.now();

    const newRoomPayload = {
      code: candidateCode,
      status: 'waiting',
      createdAt: now,
      updatedAt: now,
      hostId,
      guestId: '',
      players: {
        host: {
          id: hostId,
          name: cleanName,
          color: 'red',
          role: 'host',
          connected: true,
          lastSeen: now,
          leftRoom: false,
        },
        guest: 'none',
      },
      gameState: serializeGameStateForFirebase(initialGameState),
    };

    const txResult = await runTransaction(roomRef, (currentData) => {
      if (currentData !== null) {
        // Collision with an existing room code; abort and try another code
        return;
      }
      return newRoomPayload;
    });

    if (txResult.committed && txResult.snapshot.exists()) {
      const roomData = deserializeRoomData(txResult.snapshot.val());
      saveActiveRoomSession({
        roomCode: candidateCode,
        playerId: hostId,
        playerName: cleanName,
        role: 'host',
        myColor: 'red',
        savedAt: now,
      });
      return { roomData, role: 'host', myColor: 'red' };
    }
  }

  throw new Error(
    'Não foi possível gerar uma sala única no momento. Tente novamente.'
  );
}

/**
 * Joins an existing private room using its 6-character code.
 * Uses an atomic Firebase transaction to enforce a strict 2-player maximum
 * and support seamless reconnection if a participant re-enters their room.
 */
export async function joinOnlineRoom(
  rawCode: string,
  playerId: string,
  playerName: string
): Promise<{
  roomData: OnlineRoomData;
  role: OnlineRole;
  myColor: Player;
  reconnected: boolean;
}> {
  const validation = validateAndNormalizeRoomCode(rawCode);
  if (!validation.valid) {
    throw new Error(validation.error || 'Código de sala inválido.');
  }

  const code = validation.normalizedCode;
  const cleanName = playerName.trim() || 'Convidado (Azul)';
  const roomRef = ref(db, `rooms/${code}`);

  // Pre-check if room exists
  const initialSnap = await get(roomRef);
  if (!initialSnap.exists()) {
    throw new Error(
      `A sala "${code}" não foi encontrada. Verifique se o código de 6 caracteres está correto.`
    );
  }

  let abortReason: 'NOT_FOUND' | 'ABANDONED' | 'FULL' | null = null;
  let assignedRole = 'guest' as OnlineRole;
  let assignedColor = 'blue' as Player;
  let isReconnect = false;

  const txResult = await runTransaction(roomRef, (current) => {
    if (current === null) {
      // In Firebase RTDB, runTransaction may pass null on its first local invocation
      return current;
    }

    if (current.status === 'abandoned') {
      abortReason = 'ABANDONED';
      return; // Abort transaction
    }

    const now = Date.now();

    // Case 1: Host is reconnecting to their own room
    if (current.hostId === playerId) {
      assignedRole = 'host';
      assignedColor = 'red';
      isReconnect = true;
      current.updatedAt = now;
      if (current.players?.host) {
        current.players.host.connected = true;
        current.players.host.lastSeen = now;
        current.players.host.leftRoom = false;
      }
      return current;
    }

    // Case 2: Guest is reconnecting to their own room
    if (current.guestId && current.guestId === playerId) {
      assignedRole = 'guest';
      assignedColor = 'blue';
      isReconnect = true;
      current.updatedAt = now;
      if (current.players?.guest && current.players.guest !== 'none') {
        current.players.guest.connected = true;
        current.players.guest.lastSeen = now;
        current.players.guest.leftRoom = false;
      }
      return current;
    }

    // Case 3: A 3rd player is trying to join a room that already has both Host and Guest
    const hasExistingGuest =
      Boolean(current.guestId && current.guestId !== '') ||
      Boolean(
        current.players?.guest &&
          current.players.guest !== 'none' &&
          current.players.guest.id
      );

    if (hasExistingGuest) {
      abortReason = 'FULL';
      return; // Abort transaction
    }

    // Case 4: Valid second player (Guest) joining a waiting room
    assignedRole = 'guest';
    assignedColor = 'blue';
    isReconnect = false;

    current.guestId = playerId;
    current.status =
      current.gameState?.status === 'finished' ? 'finished' : 'playing';
    current.updatedAt = now;
    if (!current.players) {
      current.players = {};
    }
    current.players.guest = {
      id: playerId,
      name: cleanName,
      color: 'blue',
      role: 'guest',
      connected: true,
      lastSeen: now,
      leftRoom: false,
    };

    return current;
  });

  if (abortReason === 'ABANDONED') {
    throw new Error('Esta sala já foi encerrada pelo criador.');
  }

  if (abortReason === 'FULL') {
    throw new Error(
      'Esta sala já está cheia (2/2 jogadores). Não é permitida a entrada de um terceiro jogador.'
    );
  }

  if (!txResult.committed || !txResult.snapshot.exists()) {
    throw new Error(
      'Não foi possível entrar na sala. Verifique se ela ainda está disponível.'
    );
  }

  const roomData = deserializeRoomData(txResult.snapshot.val());
  saveActiveRoomSession({
    roomCode: code,
    playerId,
    playerName:
      assignedRole === 'host'
        ? roomData.players.host.name
        : roomData.players.guest?.name || cleanName,
    role: assignedRole,
    myColor: assignedColor,
    savedAt: Date.now(),
  });

  return {
    roomData,
    role: assignedRole,
    myColor: assignedColor,
    reconnected: isReconnect,
  };
}

/**
 * Authoritatively validates and executes a move in an online room using an atomic
 * Firebase Realtime Database transaction (`runTransaction`).
 *
 * Guarantees:
 * - Only registered participants (Host = 'red', Guest = 'blue') can submit moves.
 * - Both players must have joined (`status === 'playing'`).
 * - A player cannot move on the opponent's turn or submit two moves simultaneously.
 * - Full Sentenaria rules (including Red's 1st-move center restriction and 2nd-move center freedom)
 *   are validated against the authoritative server state before committing.
 */
export async function submitOnlineMove(
  roomCode: string,
  playerId: string,
  row: number,
  col: number
): Promise<GameState> {
  const code = roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/${code}`);

  let validationError: string | null = null;

  const txResult = await runTransaction(roomRef, (current) => {
    if (current === null) {
      return current;
    }

    validationError = null;

    if (current.status !== 'playing') {
      validationError =
        'A partida ainda não está em andamento (aguardando ambos os jogadores).';
      return;
    }

    // Verify participant identity & assigned piece color
    let callerColor: Player | null = null;
    if (current.hostId === playerId) {
      callerColor = 'red';
    } else if (current.guestId === playerId) {
      callerColor = 'blue';
    } else {
      validationError = 'Acesso negado: você não é participante desta sala.';
      return;
    }

    const authoritativeState = deserializeGameStateFromFirebase(
      current.gameState
    );

    if (authoritativeState.status !== 'playing') {
      validationError = 'A partida já foi finalizada.';
      return;
    }

    if (authoritativeState.currentPlayer !== callerColor) {
      validationError = 'Aguarde a sua vez de jogar!';
      return;
    }

    if (!isValidMove(authoritativeState.board, row, col, callerColor)) {
      validationError =
        'Jogada inválida segundo as regras do Sentenaria.';
      return;
    }

    const nextGameState = makeMove(authoritativeState, row, col);
    current.gameState = serializeGameStateForFirebase(nextGameState);
    current.updatedAt = Date.now();

    if (nextGameState.status === 'finished') {
      current.status = 'finished';
    }

    return current;
  });

  if (validationError) {
    throw new Error(validationError);
  }

  if (!txResult.committed || !txResult.snapshot.exists()) {
    throw new Error('Não foi possível sincronizar a jogada. Tente novamente.');
  }

  const updatedRoom = deserializeRoomData(txResult.snapshot.val());
  return updatedRoom.gameState;
}

/**
 * Resets the board for a rematch inside the same online room while keeping both players.
 */
export async function restartOnlineMatch(
  roomCode: string,
  playerId: string
): Promise<void> {
  const code = roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/${code}`);

  await runTransaction(roomRef, (current) => {
    if (current === null) return current;
    if (current.hostId !== playerId && current.guestId !== playerId) {
      return; // Unauthorized
    }
    const existingState = deserializeGameStateFromFirebase(current.gameState);
    const freshState = createInitialGameState({
      ...existingState.config,
      opponentMode: 'online',
    });
    current.gameState = serializeGameStateForFirebase(freshState);
    current.status =
      current.guestId && current.guestId !== '' ? 'playing' : 'waiting';
    current.updatedAt = Date.now();
    return current;
  });
}

/**
 * Marks a participant as having intentionally left the room.
 */
export async function leaveOnlineRoom(
  roomCode: string,
  playerId: string,
  role: OnlineRole
): Promise<void> {
  clearActiveRoomSession();
  const code = roomCode.toUpperCase();
  const playerNodeRef = ref(db, `rooms/${code}/players/${role}`);
  try {
    await update(playerNodeRef, {
      connected: false,
      leftRoom: true,
      lastSeen: Date.now(),
    });
  } catch {
    // Ignore errors when leaving
  }
}

/**
 * Subscribes to real-time updates of a room and manages presence (connection / disconnection)
 * for the active participant.
 */
export function subscribeToOnlineRoom(
  roomCode: string,
  playerId: string,
  role: OnlineRole,
  onRoomChange: (room: OnlineRoomData) => void,
  onRoomError?: (errMessage: string) => void
): () => void {
  const code = roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/${code}`);
  const playerRef = ref(db, `rooms/${code}/players/${role}`);
  const connectedInfoRef = ref(db, '.info/connected');

  // 1. Listen to room state changes
  const unsubRoom = onValue(
    roomRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onRoomError?.('A sala foi encerrada ou removida.');
        return;
      }
      const raw = snapshot.val();
      if (raw.hostId !== playerId && raw.guestId && raw.guestId !== playerId) {
        onRoomError?.('Acesso não autorizado a esta sala.');
        return;
      }
      onRoomChange(deserializeRoomData(raw));
    },
    (err) => {
      onRoomError?.(err.message || 'Erro de conexão com o servidor online.');
    }
  );

  // 2. Listen to Firebase connection status & register automatic onDisconnect handler
  const unsubConnected = onValue(connectedInfoRef, (snap) => {
    if (snap.val() === true) {
      const disconnectHandler = onDisconnect(playerRef);
      disconnectHandler
        .update({
          connected: false,
          lastSeen: Date.now(),
        })
        .catch(() => {});

      update(playerRef, {
        connected: true,
        leftRoom: false,
        lastSeen: Date.now(),
      }).catch(() => {});
    }
  });

  // 3. Periodic heartbeat to keep lastSeen fresh
  const heartbeatTimer =
    typeof window !== 'undefined'
      ? window.setInterval(() => {
          update(playerRef, {
            connected: true,
            lastSeen: Date.now(),
          }).catch(() => {});
        }, 15000)
      : null;

  return () => {
    unsubRoom();
    unsubConnected();
    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
    }
  };
}

// ============================================================================
// Private Room Chat Operations
// ============================================================================

/**
 * Sends a real-time chat message inside a private room after verifying membership and message length.
 */
export async function sendOnlineChatMessage(
  roomCode: string,
  senderId: string,
  senderName: string,
  senderRole: OnlineRole,
  rawText: string
): Promise<void> {
  const validation = validateChatMessage(rawText);
  if (!validation.valid) {
    throw new Error(validation.error || 'Mensagem inválida.');
  }

  const code = roomCode.toUpperCase();
  const roomSnap = await get(ref(db, `rooms/${code}`));
  if (!roomSnap.exists()) {
    throw new Error('Sala não encontrada.');
  }

  const roomVal = roomSnap.val();
  const isParticipant =
    roomVal.hostId === senderId || roomVal.guestId === senderId;
  if (!isParticipant) {
    throw new Error(
      'Acesso negado: apenas os dois participantes da sala podem enviar mensagens.'
    );
  }

  const senderColor: Player = senderRole === 'host' ? 'red' : 'blue';
  const messagesListRef = ref(db, `rooms/${code}/messages`);
  const newMsgRef = push(messagesListRef);

  const payload: OnlineChatMessage = {
    id: newMsgRef.key || `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    senderId,
    senderName: senderName.trim() || (senderRole === 'host' ? 'Host' : 'Convidado'),
    senderRole,
    senderColor,
    text: validation.sanitized,
    timestamp: Date.now(),
  };

  await set(newMsgRef, payload);
}

/**
 * Subscribes to the private chat messages of a room in real time.
 * Verifies that `playerId` is a registered participant of the room before delivering messages.
 */
export function subscribeToRoomChat(
  roomCode: string,
  playerId: string,
  onMessagesChange: (messages: OnlineChatMessage[]) => void
): () => void {
  const code = roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/${code}`);

  const unsub = onValue(roomRef, (snap) => {
    if (!snap.exists()) {
      onMessagesChange([]);
      return;
    }
    const roomVal = snap.val();
    if (roomVal.hostId !== playerId && roomVal.guestId !== playerId) {
      // Prevent third parties from reading room messages
      onMessagesChange([]);
      return;
    }

    const rawMessages = roomVal.messages;
    if (!rawMessages || typeof rawMessages !== 'object') {
      onMessagesChange([]);
      return;
    }

    const list: OnlineChatMessage[] = Object.values(rawMessages)
      .filter((m): m is OnlineChatMessage => Boolean(m && typeof m === 'object'))
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    onMessagesChange(list);
  });

  return () => unsub();
}
