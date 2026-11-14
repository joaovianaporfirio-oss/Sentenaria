import { ref, remove } from 'firebase/database';
import { describe, expect, it } from 'vitest';
import { chooseAIMove, chooseAIPieRuleDecision } from '../../ai/aiEngine';
import { sortChatMessagesChronologically } from '../../components/OnlineChatPanel';
import { db } from '../../online/firebaseConfig';
import {
  createOnlineRoom,
  deserializeGameStateFromFirebase,
  joinOnlineRoom,
  sendOnlineChatMessage,
  serializeGameStateForFirebase,
  submitOnlineMove,
  submitOnlinePieRuleDecision,
  subscribeToRoomChat,
} from '../../online/onlineService';
import {
  generateRoomCode,
  validateAndNormalizeRoomCode,
  validateChatMessage,
} from '../../online/roomCodeUtils';
import { isCenterRegion, toIndex, TOTAL_CELLS } from '../constants';
import {
  createInitialGameState,
  DEFAULT_GAME_CONFIG,
  getValidMoveIndices,
  isValidMove,
  makeMove,
  resolvePieRuleDecision,
} from '../gameEngine';

describe('Sentenaria — Modalidades, Modo Adjacente Obrigatório, 81 Casas Livres e Roubo de Peça', () => {
  it('1. configura 8 Pontos como modalidade padrão e Modo Adjacente como regra obrigatória única', () => {
    expect(DEFAULT_GAME_CONFIG.scoringMode).toBe('eight_points');
    expect(DEFAULT_GAME_CONFIG.ruleMode).toBe('adjacent');

    const state = createInitialGameState();
    expect(state.board.length).toBe(TOTAL_CELLS);
    expect(state.currentPlayer).toBe('red');
    expect(state.pieRuleState).toBe('not_triggered');
    expect(state.firstMoveIndex).toBeNull();
    expect(state.config.scoringMode).toBe('eight_points');
    expect(state.config.ruleMode).toBe('adjacent');
    expect(state.scores).toEqual({ red: 0, blue: 0 });
    expect(state.status).toBe('playing');
  });

  it('2. permite jogar livremente em todas as 81 casas desde o primeiro turno (incluindo o quadrado central 3x3)', () => {
    let state = createInitialGameState();

    // All 81 cells are valid for Red on the very first turn, including the 3x3 center
    expect(getValidMoveIndices(state.board, 'red').length).toBe(81);
    for (let r = 3; r <= 5; r++) {
      for (let c = 3; c <= 5; c++) {
        expect(isCenterRegion(r, c)).toBe(true);
        expect(isValidMove(state.board, r, c, 'red')).toBe(true);
        expect(isValidMove(state.board, r, c, 'blue')).toBe(true);
      }
    }

    // Red can play directly in the center cell (4, 4) on turn 1
    state = makeMove(state, 4, 4);
    expect(state.board[toIndex(4, 4)].owner).toBe('red');
    expect(state.board[toIndex(4, 4)].visualColor).toBe('red');
    expect(state.board[toIndex(4, 4)].placedBy).toBe('red');
    expect(state.firstMoveIndex).toBe(toIndex(4, 4));
    expect(state.pieRuleState).toBe('pending');
  });

  it('3. implementa o Roubo de Peça (Pie Rule) — Opção A: Continuar jogando diretamente em uma casa vazia (ou via continue)', () => {
    let state = createInitialGameState({ scoringMode: 'free' });

    // Turn 1: P1 (Red) places piece at (4, 4)
    state = makeMove(state, 4, 4);
    expect(state.pieRuleState).toBe('pending');
    expect(state.currentPlayer).toBe('blue');
    expect(state.firstMoveIndex).toBe(toIndex(4, 4));

    // P2 (Blue) clicks directly on any empty cell (0, 0) while pieRuleState is 'pending':
    // this places Blue's piece normally and permanently closes the steal opportunity ('continued')
    state = makeMove(state, 0, 0);
    expect(state.pieRuleState).toBe('continued');
    expect(state.currentPlayer).toBe('red');

    // The 1st piece at (4, 4) remains Red's in both ownership and visual color
    const firstCell = state.board[toIndex(4, 4)];
    expect(firstCell.owner).toBe('red');
    expect(firstCell.visualColor).toBe('red');
    expect(firstCell.stolenByPieRule).toBe(false);

    // And Blue's piece at (0, 0) is placed normally
    expect(state.board[toIndex(0, 0)].owner).toBe('blue');
    expect(state.board[toIndex(0, 0)].visualColor).toBe('blue');

    // Pie Rule cannot be triggered or resolved again
    expect(() => resolvePieRuleDecision(state, 'steal')).toThrow();
  });

  it('4. implementa o Roubo de Peça (Pie Rule) — Opção B: Roubar a primeira peça, mudando cor visual e dono para Azul e passando o turno ao Vermelho', () => {
    let state = createInitialGameState({ scoringMode: 'free' });

    // Turn 1: Red places 1st piece at (4, 4)
    state = makeMove(state, 4, 4);
    expect(state.pieRuleState).toBe('pending');
    expect(state.currentPlayer).toBe('blue');

    // Blue chooses Option B: 'steal' (Roubar a primeira peça)
    state = resolvePieRuleDecision(state, 'steal');
    expect(state.pieRuleState).toBe('stolen');
    // Turn passes immediately to Red!
    expect(state.currentPlayer).toBe('red');
    expect(state.turnCount).toBe(2);

    // Only 1 piece exists on the board, at the exact same position (4, 4), now visually blue and owned by Blue
    const occupiedCells = state.board.filter((c) => c.owner !== null);
    expect(occupiedCells.length).toBe(1);
    const stolenCell = state.board[toIndex(4, 4)];
    expect(stolenCell.owner).toBe('blue');
    expect(stolenCell.visualColor).toBe('blue');
    expect(stolenCell.placedBy).toBe('red');
    expect(stolenCell.stolenByPieRule).toBe(true);

    // Move history records the steal action by Blue
    expect(state.lastMove?.isPieSteal).toBe(true);
    expect(state.lastMove?.player).toBe('blue');
    expect(state.lastMove?.index).toBe(toIndex(4, 4));

    // Cannot steal a second time
    expect(() => resolvePieRuleDecision(state, 'steal')).toThrow();

    // Now it is Red's turn to play normally with a red piece
    state = makeMove(state, 0, 0); // Red plays at (0, 0)
    expect(state.board[toIndex(0, 0)].owner).toBe('red');
    expect(state.board[toIndex(0, 0)].visualColor).toBe('red');
    expect(state.currentPlayer).toBe('blue');

    // Verify that the stolen piece at (4, 4) no longer forms trincas for Red,
    // and DOES form trincas and score points for Blue!
    state = makeMove(state, 4, 5); // Blue plays at (4, 5)
    state = makeMove(state, 4, 2); // Red plays at (4, 2)
    state = makeMove(state, 8, 8); // Blue plays at (8, 8)
    state = makeMove(state, 4, 3); // Red plays at (4, 3) -> Red has (4,2) and (4,3), but (4,4) belongs to Blue, so Red gets 0 points!
    expect(state.scores.red).toBe(0);

    // Blue plays at (4, 6) -> completes Blue trinca (4,4)-(4,5)-(4,6) using the stolen piece at (4,4)!
    state = makeMove(state, 4, 6);
    expect(state.scores.blue).toBe(1);
    expect(state.formedTrincas.length).toBe(1);
    expect(state.formedTrincas[0].player).toBe('blue');
    expect(state.formedTrincas[0].indices).toContain(toIndex(4, 4));
  });

  it('5. aplica obrigatoriamente o Modo Adjacente em 8 Pontos e no Modo Livre (reutilizando até 1 peça pivô com ao menos 2 inéditas)', () => {
    for (const scoringMode of ['eight_points', 'free'] as const) {
      let state = createInitialGameState({ scoringMode });

      state = makeMove(state, 0, 0); // Red 1st move
      state = resolvePieRuleDecision(state, 'continue'); // Blue continues
      state = makeMove(state, 8, 0); // Blue 1st move

      state = makeMove(state, 0, 1); // Red
      state = makeMove(state, 8, 1); // Blue
      state = makeMove(state, 0, 2); // Red -> forms 1st trinca (0,0)-(0,1)-(0,2)!
      expect(state.scores.red).toBe(1);

      state = makeMove(state, 7, 0); // Blue
      state = makeMove(state, 0, 3); // Red -> (0,1)-(0,2)-(0,3) has 2 already-used cells ((0,1) and (0,2)) and only 1 inédita ((0,3)) -> MUST NOT score!
      expect(state.scores.red).toBe(1);

      state = makeMove(state, 7, 1); // Blue
      state = makeMove(state, 0, 4); // Red -> (0,2)-(0,3)-(0,4) has 1 reused pivot ((0,2)) and 2 inéditas ((0,3) and (0,4)) -> MUST score!
      expect(state.scores.red).toBe(2);
      expect(state.formedTrincas[1].reusedCellIndex).toBe(toIndex(0, 2));
    }
  });

  it('6. detecta trincas horizontais, verticais, diagonais principais e secundárias', () => {
    let state = createInitialGameState({ scoringMode: 'free' });
    state = makeMove(state, 0, 0); // Red
    state = resolvePieRuleDecision(state, 'continue');
    state = makeMove(state, 3, 3); // Blue
    state = makeMove(state, 0, 1); // Red
    state = makeMove(state, 4, 3); // Blue
    state = makeMove(state, 0, 2); // Red -> horizontal trinca!
    expect(state.scores.red).toBe(1);
    expect(state.formedTrincas[0].direction).toBe('horizontal');

    state = makeMove(state, 5, 3); // Blue -> vertical trinca!
    expect(state.scores.blue).toBe(1);
    expect(state.formedTrincas[1].direction).toBe('vertical');

    state = makeMove(state, 6, 0); // Red
    state = makeMove(state, 3, 5); // Blue
    state = makeMove(state, 7, 1); // Red
    state = makeMove(state, 4, 5); // Blue
    state = makeMove(state, 8, 2); // Red -> main diagonal!
    expect(state.scores.red).toBe(2);
    expect(state.formedTrincas[2].direction).toBe('diag_main');

    state = makeMove(state, 1, 0); // Blue
    state = makeMove(state, 0, 8); // Red
    state = makeMove(state, 2, 0); // Blue
    state = makeMove(state, 1, 7); // Red
    state = makeMove(state, 5, 0); // Blue
    state = makeMove(state, 2, 6); // Red -> anti-diagonal!
    expect(state.scores.red).toBe(3);
    expect(
      state.formedTrincas.some((t) => t.direction === 'diag_anti')
    ).toBe(true);
  });

  it('7. encerra a partida imediatamente na modalidade 8 Pontos quando um jogador atinge 8 pontos', () => {
    let state = createInitialGameState({
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
      if (state.pieRuleState === 'pending') {
        state = resolvePieRuleDecision(state, 'continue');
      }
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

  it('8. executa a IA nos níveis Fácil, Médio e Difícil tomando decisão válida no Roubo de Peça', () => {
    const difficulties = ['easy', 'medium', 'hard'] as const;

    for (const aiDifficulty of difficulties) {
      let state = createInitialGameState({
        scoringMode: 'eight_points',
        opponentMode: 'ai',
        aiDifficulty,
      });

      for (let action = 0; action < 10; action++) {
        if (state.pieRuleState === 'pending') {
          const decision = chooseAIPieRuleDecision(state, aiDifficulty);
          expect(['continue', 'steal']).toContain(decision);
          state = resolvePieRuleDecision(state, decision);
          continue;
        }
        const move = chooseAIMove(state, aiDifficulty);
        expect(
          isValidMove(state.board, move.row, move.col, state.currentPlayer)
        ).toBe(true);
        state = makeMove(state, move.row, move.col);
      }
      expect(state.turnCount).toBeGreaterThanOrEqual(9);
    }
  });
});

describe('Serialização Firebase & Sincronização do Roubo de Peça Online', () => {
  it('valida códigos de sala de 6 caracteres e ordena mensagens cronologicamente', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
    expect(validateAndNormalizeRoomCode(code.toLowerCase()).valid).toBe(true);
    expect(validateAndNormalizeRoomCode('ÁBC123').valid).toBe(false);
    expect(validateChatMessage('Bom jogo!').valid).toBe(true);

    const sorted = sortChatMessagesChronologically([
      {
        id: 'm2',
        senderId: 'guest',
        senderName: 'Guest',
        senderRole: 'guest',
        senderColor: 'blue',
        text: '2',
        timestamp: 200,
      },
      {
        id: 'm1',
        senderId: 'host',
        senderName: 'Host',
        senderRole: 'host',
        senderColor: 'red',
        text: '1',
        timestamp: 100,
      },
    ]);
    expect(sorted.map((m) => m.id)).toEqual(['m1', 'm2']);
  });

  it('serializa e desserializa corretamente o estado após o Roubo de Peça (visualColor, owner, stolenByPieRule, pieRuleState e turno)', () => {
    let state = createInitialGameState({ opponentMode: 'online' });
    state = makeMove(state, 4, 4); // Red plays in center (4,4)
    expect(state.pieRuleState).toBe('pending');

    // Blue steals the 1st piece
    state = resolvePieRuleDecision(state, 'steal');
    expect(state.pieRuleState).toBe('stolen');
    expect(state.currentPlayer).toBe('red');

    const serialized = serializeGameStateForFirebase(state);
    const restored = deserializeGameStateFromFirebase(serialized);

    expect(restored.pieRuleState).toBe('stolen');
    expect(restored.firstMoveIndex).toBe(toIndex(4, 4));
    expect(restored.currentPlayer).toBe('red');
    expect(restored.turnCount).toBe(2);

    const restoredCell = restored.board[toIndex(4, 4)];
    expect(restoredCell.owner).toBe('blue');
    expect(restoredCell.visualColor).toBe('blue');
    expect(restoredCell.placedBy).toBe('red');
    expect(restoredCell.stolenByPieRule).toBe(true);
    expect(restored.lastMove?.isPieSteal).toBe(true);
  });

  it(
    'sincroniza o Roubo de Peça em tempo real no Firebase Realtime Database entre Host (Vermelho) e Convidado (Azul) e persiste após reconexão',
    async () => {
      const hostSessionId = 'test_host_' + Date.now();
      const guestSessionId = 'test_guest_' + Date.now();
      const outsiderSessionId = 'test_outsider_' + Date.now();

      let created: Awaited<ReturnType<typeof createOnlineRoom>>;
      try {
        created = await createOnlineRoom(hostSessionId, 'HostJogador', {
          scoringMode: 'eight_points',
        });
      } catch (err: any) {
        if (/permission[_\s]denied/i.test(String(err?.message || err))) {
          return;
        }
        throw err;
      }

      const roomCode = created.roomData.code;
      try {
        // Guest joins room
        const joined = await joinOnlineRoom(
          roomCode.toLowerCase(),
          guestSessionId,
          'GuestJogador'
        );
        expect(joined.myColor).toBe('blue');
        expect(joined.role).toBe('guest');

        // 1. Host (Red) plays 1st piece at center (4, 4) — all 81 cells are free!
        const afterRedFirstMove = await submitOnlineMove(
          roomCode,
          hostSessionId,
          4,
          4
        );
        expect(afterRedFirstMove.pieRuleState).toBe('pending');
        expect(afterRedFirstMove.firstMoveIndex).toBe(toIndex(4, 4));
        expect(afterRedFirstMove.currentPlayer).toBe('blue');

        // 2. While pieRuleState === 'pending', clicking the occupied first cell (4, 4) as a normal move is rejected
        await expect(
          submitOnlineMove(roomCode, guestSessionId, 4, 4)
        ).rejects.toThrow(/ocupada|inválida/i);

        // 3. Host (Red) cannot decide the Pie Rule for Blue
        await expect(
          submitOnlinePieRuleDecision(roomCode, hostSessionId, 'steal')
        ).rejects.toThrow(/Apenas o jogador Azul/i);

        // 4. Guest (Blue) steals the first piece!
        const afterSteal = await submitOnlinePieRuleDecision(
          roomCode,
          guestSessionId,
          'steal'
        );
        expect(afterSteal.pieRuleState).toBe('stolen');
        expect(afterSteal.currentPlayer).toBe('red');
        expect(afterSteal.board[toIndex(4, 4)].owner).toBe('blue');
        expect(afterSteal.board[toIndex(4, 4)].visualColor).toBe('blue');
        expect(afterSteal.board[toIndex(4, 4)].stolenByPieRule).toBe(true);

        // 5. Cannot steal again
        await expect(
          submitOnlinePieRuleDecision(roomCode, guestSessionId, 'steal')
        ).rejects.toThrow(/já foi realizada/i);

        // 6. Now it is Host's (Red's) turn! Host plays at (0, 0)
        const afterRedSecondMove = await submitOnlineMove(
          roomCode,
          hostSessionId,
          0,
          0
        );
        expect(afterRedSecondMove.board[toIndex(0, 0)].owner).toBe('red');
        expect(afterRedSecondMove.currentPlayer).toBe('blue');

        // 7. Guest (Blue) plays at (4, 5) and later completes a trinca with the stolen piece at (4, 4)
        await submitOnlineMove(roomCode, guestSessionId, 4, 5);
        await submitOnlineMove(roomCode, hostSessionId, 0, 1);
        const afterBlueTrinca = await submitOnlineMove(
          roomCode,
          guestSessionId,
          4,
          6
        );
        expect(afterBlueTrinca.scores.blue).toBe(1);

        // 8. Verify chat & reconnect persistence
        await sendOnlineChatMessage(
          roomCode,
          hostSessionId,
          'HostJogador',
          'host',
          'Bom roubo!'
        );
        await expect(
          sendOnlineChatMessage(
            roomCode,
            outsiderSessionId,
            'Intruso',
            'guest',
            'Bloqueado'
          )
        ).rejects.toThrow();

        const reconnectedGuest = await joinOnlineRoom(
          roomCode,
          guestSessionId,
          'GuestJogador'
        );
        expect(reconnectedGuest.reconnected).toBe(true);
        expect(reconnectedGuest.myColor).toBe('blue');
        expect(reconnectedGuest.roomData.players.host.color).toBe('red');
        expect(reconnectedGuest.roomData.players.guest?.color).toBe('blue');
        expect(reconnectedGuest.roomData.gameState.pieRuleState).toBe('stolen');
        expect(
          reconnectedGuest.roomData.gameState.board[toIndex(4, 4)].owner
        ).toBe('blue');
        expect(
          reconnectedGuest.roomData.gameState.board[toIndex(4, 4)].visualColor
        ).toBe('blue');
        expect(reconnectedGuest.roomData.gameState.scores.blue).toBe(1);
      } finally {
        await remove(ref(db, `rooms/${roomCode}`)).catch(() => {});
      }
    },
    20000
  );
});
