import { ref, remove } from 'firebase/database';
import { describe, expect, it } from 'vitest';
import { chooseAIMove } from '../../ai/aiEngine';
import { db } from '../../online/firebaseConfig';
import {
  createOnlineRoom,
  joinOnlineRoom,
  sendOnlineChatMessage,
  submitOnlineMove,
  subscribeToRoomChat,
} from '../../online/onlineService';
import {
  generateRoomCode,
  validateAndNormalizeRoomCode,
  validateChatMessage,
} from '../../online/roomCodeUtils';
import { sortChatMessagesChronologically } from '../../components/OnlineChatPanel';
import { isCenterRegion, toIndex, TOTAL_CELLS } from '../constants';
import {
  createInitialGameState,
  getValidMoveIndices,
  hasRedMadeFirstMove,
  isValidMove,
  makeMove,
} from '../gameEngine';

describe('Sentenaria Core Rules & Game Engine', () => {
  it('initializes a 9x9 board (81 cells) with Red starting first', () => {
    const state = createInitialGameState();
    expect(state.board.length).toBe(TOTAL_CELLS);
    expect(state.currentPlayer).toBe('red');
    expect(state.scores).toEqual({ red: 0, blue: 0 });
    expect(state.status).toBe('playing');
  });

  it('enforces Red 1st-move center restriction AND grants Red normal center access from Red 2nd move onward', () => {
    let state = createInitialGameState();

    // Before Red's 1st move: Red has not played yet
    expect(hasRedMadeFirstMove(state.board)).toBe(false);

    // 1. Red CANNOT play in any of the 9 center cells on Red's 1st move
    for (let r = 3; r <= 5; r++) {
      for (let c = 3; c <= 5; c++) {
        expect(isCenterRegion(r, c)).toBe(true);
        expect(isValidMove(state.board, r, c, 'red')).toBe(false);
        expect(() => makeMove(state, r, c)).toThrow();
      }
    }

    // Red has 72 valid moves on their 1st move (81 - 9)
    expect(getValidMoveIndices(state.board, 'red').length).toBe(72);

    // Red makes 1st move outside the center at (0, 0)
    state = makeMove(state, 0, 0);
    expect(hasRedMadeFirstMove(state.board)).toBe(true);
    expect(state.currentPlayer).toBe('blue');

    // Blue CAN play in the 3x3 central region on Blue's 1st move (e.g. (4, 4))
    expect(isValidMove(state.board, 4, 4, 'blue')).toBe(true);
    state = makeMove(state, 4, 4);
    expect(state.board[toIndex(4, 4)].owner).toBe('blue');
    expect(state.currentPlayer).toBe('red');

    // 2. Now it is Red's 2nd move! Red MUST have access to all empty cells in the 3x3 central region!
    expect(isValidMove(state.board, 3, 3, 'red')).toBe(true);
    expect(isValidMove(state.board, 4, 5, 'red')).toBe(true);
    expect(isValidMove(state.board, 5, 5, 'red')).toBe(true);
    // 81 total - 2 occupied ((0,0) and (4,4)) = 79 valid moves for Red on Red's 2nd move!
    expect(getValidMoveIndices(state.board, 'red').length).toBe(79);

    // Red plays inside the 3x3 center at (3, 3) on Red's 2nd move
    state = makeMove(state, 3, 3);
    expect(state.board[toIndex(3, 3)].owner).toBe('red');

    // Verify Red can even form a trinca inside the 3x3 center from move 2 onward
    state = makeMove(state, 0, 8); // Blue
    state = makeMove(state, 3, 4); // Red plays in center
    state = makeMove(state, 1, 8); // Blue
    state = makeMove(state, 3, 5); // Red completes horizontal trinca (3,3)-(3,4)-(3,5) inside the center!
    expect(state.scores.red).toBe(1);
  });

  it('detects horizontal, vertical, main diagonal, and anti-diagonal trincas', () => {
    let state = createInitialGameState({
      ruleMode: 'regular',
      scoringMode: 'free',
    });
    state = makeMove(state, 0, 0); // Red
    state = makeMove(state, 3, 3); // Blue
    state = makeMove(state, 0, 1); // Red
    state = makeMove(state, 4, 3); // Blue
    state = makeMove(state, 0, 2); // Red completes horizontal!
    expect(state.scores.red).toBe(1);
    expect(state.formedTrincas.length).toBe(1);
    expect(state.formedTrincas[0].direction).toBe('horizontal');

    // Vertical trinca for Blue at (3,3)-(4,3)-(5,3)
    state = makeMove(state, 5, 3); // Blue completes vertical!
    expect(state.scores.blue).toBe(1);
    expect(state.formedTrincas[1].direction).toBe('vertical');

    // Main diagonal trinca for Red at (6,0)-(7,1)-(8,2)
    state = makeMove(state, 6, 0); // Red
    state = makeMove(state, 3, 5); // Blue
    state = makeMove(state, 7, 1); // Red
    state = makeMove(state, 4, 5); // Blue
    state = makeMove(state, 8, 2); // Red completes main diagonal!
    expect(state.scores.red).toBe(2);
    expect(state.formedTrincas[2].direction).toBe('diag_main');

    // Anti-diagonal trinca for Red at (0,8)-(1,7)-(2,6)
    state = makeMove(state, 1, 0); // Blue
    state = makeMove(state, 0, 8); // Red
    state = makeMove(state, 2, 0); // Blue
    state = makeMove(state, 1, 7); // Red
    state = makeMove(state, 5, 0); // Blue
    state = makeMove(state, 2, 6); // Red completes anti-diagonal!
    expect(state.scores.red).toBe(3);
    expect(
      state.formedTrincas.some((t) => t.direction === 'diag_anti')
    ).toBe(true);
  });

  it('enforces Regular Mode: cells in a formed trinca cannot be reused for new trincas', () => {
    let state = createInitialGameState({
      ruleMode: 'regular',
      scoringMode: 'free',
    });

    state = makeMove(state, 0, 0); // Red
    state = makeMove(state, 8, 0); // Blue
    state = makeMove(state, 0, 1); // Red
    state = makeMove(state, 8, 1); // Blue
    state = makeMove(state, 0, 2); // Red -> 1st trinca!
    expect(state.scores.red).toBe(1);

    state = makeMove(state, 7, 0); // Blue
    state = makeMove(state, 0, 3); // Red
    state = makeMove(state, 7, 1); // Blue
    state = makeMove(state, 0, 4); // Red -> (0,2) already in trinca, no score in Regular mode
    expect(state.scores.red).toBe(1);

    state = makeMove(state, 7, 2); // Blue
    state = makeMove(state, 0, 5); // Red -> (0,3)-(0,4)-(0,5) is fresh -> scores!
    expect(state.scores.red).toBe(2);
  });

  it('enforces Adjacent Mode: allows reusing 1 cell from an existing trinca if at least 2 cells are unused', () => {
    let state = createInitialGameState({
      ruleMode: 'adjacent',
      scoringMode: 'free',
    });

    state = makeMove(state, 0, 0); // Red
    state = makeMove(state, 8, 0); // Blue
    state = makeMove(state, 0, 1); // Red
    state = makeMove(state, 8, 1); // Blue
    state = makeMove(state, 0, 2); // Red -> 1st trinca!
    expect(state.scores.red).toBe(1);

    state = makeMove(state, 7, 0); // Blue
    state = makeMove(state, 0, 3); // Red -> only 1 unused cell, does not score
    expect(state.scores.red).toBe(1);

    state = makeMove(state, 7, 1); // Blue
    state = makeMove(state, 0, 4); // Red -> 2 unused cells (0,3)+(0,4) + 1 reused (0,2) -> scores!
    expect(state.scores.red).toBe(2);
    expect(state.formedTrincas[1].reusedCellIndex).toBe(toIndex(0, 2));
  });

  it('ends the match immediately in 8-points mode when a player reaches 8 points', () => {
    let state = createInitialGameState({
      ruleMode: 'adjacent',
      scoringMode: 'eight_points',
    });

    const redSafeMoves = [
      [0, 0], [0, 1], [0, 3], [0, 4], [0, 6], [0, 7],
      [1, 0], [1, 1], [1, 3], [1, 4], [1, 6], [1, 7],
      [2, 0], [2, 1], [2, 3], [2, 4], [2, 6], [2, 7],
      [8, 0], [8, 1], [8, 3], [8, 4], [8, 6], [8, 7],
    ];

    const blueTargetMoves = [
      [3, 0], [3, 1], [3, 2],
      [3, 3], [3, 4],
      [3, 5], [3, 6],
      [3, 7], [3, 8],
      [4, 0], [5, 0],
      [4, 2], [5, 2],
      [4, 4], [5, 4],
      [4, 6], [5, 6],
    ];

    let step = 0;
    while (state.status === 'playing' && step < blueTargetMoves.length) {
      const [rr, rc] = redSafeMoves[step];
      state = makeMove(state, rr, rc);
      if (state.status !== 'playing') break;
      const [br, bc] = blueTargetMoves[step];
      state = makeMove(state, br, bc);
      step++;
    }

    expect(state.scores.blue).toBeGreaterThanOrEqual(8);
    expect(state.status).toBe('finished');
    expect(state.winner).toBe('blue');
    expect(state.endReason).toBe('target_score_reached');
  });

  it('correctly runs Easy, Medium, and Hard AI in both Regular and Adjacent modes while respecting Red 1st-move restriction', () => {
    const difficulties = ['easy', 'medium', 'hard'] as const;
    const ruleModes = ['regular', 'adjacent'] as const;

    for (const ruleMode of ruleModes) {
      for (const aiDifficulty of difficulties) {
        let state = createInitialGameState({
          ruleMode,
          scoringMode: 'eight_points',
          opponentMode: 'ai',
          aiDifficulty,
        });

        for (let ply = 0; ply < 10; ply++) {
          const move = chooseAIMove(state, aiDifficulty);
          expect(
            isValidMove(state.board, move.row, move.col, state.currentPlayer)
          ).toBe(true);
          if (ply === 0 && state.currentPlayer === 'red') {
            expect(isCenterRegion(move.row, move.col)).toBe(false);
          }
          state = makeMove(state, move.row, move.col);
        }
        expect(state.turnCount).toBe(10);
      }
    }
  });
});

describe('Online Room Code Validation & Generation', () => {
  it('generates 6-character uppercase alphanumeric codes without accents', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
      seen.add(code);
    }
    expect(seen.size).toBeGreaterThan(45);
  });

  it('accepts uppercase and lowercase codes and normalizes them to uppercase', () => {
    const res1 = validateAndNormalizeRoomCode('a7b9k2');
    expect(res1.valid).toBe(true);
    expect(res1.normalizedCode).toBe('A7B9K2');

    const res2 = validateAndNormalizeRoomCode('ZyX987');
    expect(res2.valid).toBe(true);
    expect(res2.normalizedCode).toBe('ZYX987');
  });

  it('rejects accented characters, spaces, special characters, and wrong lengths', () => {
    expect(validateAndNormalizeRoomCode('ÁBC123').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('abç123').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('ãbc123').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('ébc123').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('ABC 12').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('ABC-12').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('ABC@12').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('ABC12').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('ABC1234').valid).toBe(false);
    expect(validateAndNormalizeRoomCode('').valid).toBe(false);
  });

  it('validates chat messages and enforces character limits', () => {
    expect(validateChatMessage('Olá, bom jogo!').valid).toBe(true);
    expect(validateChatMessage('   ').valid).toBe(false);
    expect(validateChatMessage('x'.repeat(201)).valid).toBe(false);
  });

  it('sorts interleaved chat messages from both players into a single chronological sequence without grouping by player', () => {
    const unordered = [
      {
        id: 'm3',
        senderId: 'host_uid',
        senderName: 'Host',
        senderRole: 'host' as const,
        senderColor: 'red' as const,
        text: 'Terceira mensagem (Host)',
        timestamp: 3000,
      },
      {
        id: 'm1',
        senderId: 'host_uid',
        senderName: 'Host',
        senderRole: 'host' as const,
        senderColor: 'red' as const,
        text: 'Primeira mensagem (Host)',
        timestamp: 1000,
      },
      {
        id: 'm4',
        senderId: 'guest_uid',
        senderName: 'Convidado',
        senderRole: 'guest' as const,
        senderColor: 'blue' as const,
        text: 'Quarta mensagem (Convidado)',
        timestamp: 4000,
      },
      {
        id: 'm2',
        senderId: 'guest_uid',
        senderName: 'Convidado',
        senderRole: 'guest' as const,
        senderColor: 'blue' as const,
        text: 'Segunda mensagem (Convidado)',
        timestamp: 2000,
      },
    ];

    const sorted = sortChatMessagesChronologically(unordered);
    expect(sorted.map((m) => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']);
    expect(sorted.map((m) => m.senderId)).toEqual([
      'host_uid',
      'guest_uid',
      'host_uid',
      'guest_uid',
    ]);
  });
});

describe('Firebase Online Multiplayer Integration (Two Independent Sessions)', () => {
  it(
    'creates a room, joins with lowercase code, blocks a 3rd player, synchronizes turns & Red 1st/2nd move rules, supports private chat, and recovers on reconnect',
    async () => {
      const hostSessionId = 'test_host_' + Date.now();
      const guestSessionId = 'test_guest_' + Date.now();
      const outsiderSessionId = 'test_outsider_' + Date.now();

      // 1. Host creates a private room
      const created = await createOnlineRoom(hostSessionId, 'HostJogador', {
        ruleMode: 'regular',
        scoringMode: 'eight_points',
      });
      const roomCode = created.roomData.code;
      expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);
      expect(created.roomData.status).toBe('waiting');
      expect(created.myColor).toBe('red');

      try {
        // 2. Reject invalid / non-existent room codes
        await expect(
          joinOnlineRoom('ÁBC123', guestSessionId, 'Convidado')
        ).rejects.toThrow();
        await expect(
          joinOnlineRoom('ZZZZ99', guestSessionId, 'Convidado')
        ).rejects.toThrow();

        // 3. Guest joins using LOWERCASE code (case-insensitive check)
        const joined = await joinOnlineRoom(
          roomCode.toLowerCase(),
          guestSessionId,
          'GuestJogador'
        );
        expect(joined.roomData.code).toBe(roomCode);
        expect(joined.roomData.status).toBe('playing');
        expect(joined.role).toBe('guest');
        expect(joined.myColor).toBe('blue');
        expect(joined.reconnected).toBe(false);

        // 4. Third player (outsider) is blocked from joining the full room
        await expect(
          joinOnlineRoom(roomCode, outsiderSessionId, 'Intruso')
        ).rejects.toThrow(/cheia/i);

        // 5. Turn order & Red 1st-move center restriction validation on server
        // 5a. Guest (Blue) cannot move on Turn 1 (it is Red's turn)
        await expect(
          submitOnlineMove(roomCode, guestSessionId, 4, 4)
        ).rejects.toThrow(/sua vez/i);

        // 5b. Host (Red) cannot play in the 3x3 center on Red's 1st move!
        await expect(
          submitOnlineMove(roomCode, hostSessionId, 4, 4)
        ).rejects.toThrow(/inválida/i);

        // 5c. Host (Red) makes valid 1st move outside center at (0, 0)
        const stateAfterMove1 = await submitOnlineMove(
          roomCode,
          hostSessionId,
          0,
          0
        );
        expect(stateAfterMove1.turnCount).toBe(1);
        expect(stateAfterMove1.currentPlayer).toBe('blue');

        // 5d. Host (Red) cannot play twice in a row
        await expect(
          submitOnlineMove(roomCode, hostSessionId, 0, 1)
        ).rejects.toThrow(/sua vez/i);

        // 5e. Guest (Blue) plays in the center at (4, 4)
        const stateAfterMove2 = await submitOnlineMove(
          roomCode,
          guestSessionId,
          4,
          4
        );
        expect(stateAfterMove2.turnCount).toBe(2);
        expect(stateAfterMove2.currentPlayer).toBe('red');

        // 5f. On Red's 2nd move, Host (Red) CAN play inside the 3x3 center at (3, 3)!
        const stateAfterMove3 = await submitOnlineMove(
          roomCode,
          hostSessionId,
          3,
          3
        );
        expect(stateAfterMove3.turnCount).toBe(3);
        expect(stateAfterMove3.board[toIndex(3, 3)].owner).toBe('red');

        // 6. Private Room Chat interleaved chronological synchronization & outsider protection
        await sendOnlineChatMessage(
          roomCode,
          hostSessionId,
          'HostJogador',
          'host',
          'Msg 1 (Host)'
        );
        await sendOnlineChatMessage(
          roomCode,
          guestSessionId,
          'GuestJogador',
          'guest',
          'Msg 2 (Guest)'
        );
        await sendOnlineChatMessage(
          roomCode,
          hostSessionId,
          'HostJogador',
          'host',
          'Msg 3 (Host)'
        );

        // Outsider cannot send messages in this room
        await expect(
          sendOnlineChatMessage(
            roomCode,
            outsiderSessionId,
            'Intruso',
            'guest',
            'Mensagem invasora'
          )
        ).rejects.toThrow(/Acesso negado/i);

        // Verify participant receives all 3 interleaved chat messages in exact chronological sequence
        const hostMessages = await new Promise<any[]>((resolve) => {
          const unsub = subscribeToRoomChat(roomCode, hostSessionId, (msgs) => {
            if (msgs.length >= 3) {
              unsub();
              resolve(msgs);
            }
          });
        });
        expect(hostMessages.length).toBe(3);
        expect(hostMessages.map((m) => m.text)).toEqual([
          'Msg 1 (Host)',
          'Msg 2 (Guest)',
          'Msg 3 (Host)',
        ]);
        expect(hostMessages.map((m) => m.senderId)).toEqual([
          hostSessionId,
          guestSessionId,
          hostSessionId,
        ]);

        const outsiderMessages = await new Promise<any[]>((resolve) => {
          const unsub = subscribeToRoomChat(
            roomCode,
            outsiderSessionId,
            (msgs) => {
              unsub();
              resolve(msgs);
            }
          );
        });
        expect(outsiderMessages).toEqual([]);

        // 7. Reconnection recovery test: Guest reconnects and recovers the exact match state (turnCount = 3)
        const reconnectedGuest = await joinOnlineRoom(
          roomCode,
          guestSessionId,
          'GuestJogador'
        );
        expect(reconnectedGuest.reconnected).toBe(true);
        expect(reconnectedGuest.role).toBe('guest');
        expect(reconnectedGuest.myColor).toBe('blue');
        expect(reconnectedGuest.roomData.gameState.turnCount).toBe(3);
        expect(
          reconnectedGuest.roomData.gameState.board[toIndex(3, 3)].owner
        ).toBe('red');
      } finally {
        // Cleanup test room from Firebase RTDB
        await remove(ref(db, `rooms/${roomCode}`)).catch(() => {});
      }
    },
    20000
  );
});
