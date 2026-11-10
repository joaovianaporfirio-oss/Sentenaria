import { describe, expect, it } from 'vitest';
import { chooseAIMove } from '../../ai/aiEngine';
import { isCenterRegion, toIndex, TOTAL_CELLS } from '../constants';
import {
  createInitialGameState,
  getValidMoveIndices,
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

  it('prevents Red from placing symbols in the 3x3 central region (rows 3..5, cols 3..5) while allowing Blue', () => {
    let state = createInitialGameState();

    // Red cannot play in any of the 9 center cells
    for (let r = 3; r <= 5; r++) {
      for (let c = 3; c <= 5; c++) {
        expect(isCenterRegion(r, c)).toBe(true);
        expect(isValidMove(state.board, r, c, 'red')).toBe(false);
        expect(() => makeMove(state, r, c)).toThrow();
      }
    }

    // Red has 72 valid moves initially (81 - 9)
    expect(getValidMoveIndices(state.board, 'red').length).toBe(72);

    // Red plays at (0, 0)
    state = makeMove(state, 0, 0);
    expect(state.currentPlayer).toBe('blue');

    // Blue CAN play in the 3x3 central region (e.g. (4, 4))
    expect(isValidMove(state.board, 4, 4, 'blue')).toBe(true);
    state = makeMove(state, 4, 4);
    expect(state.board[toIndex(4, 4)].owner).toBe('blue');
    expect(state.currentPlayer).toBe('red');
  });

  it('detects horizontal, vertical, main diagonal, and anti-diagonal trincas', () => {
    // 1. Horizontal trinca for Red at (0,0)-(0,1)-(0,2)
    let state = createInitialGameState({ ruleMode: 'regular', scoringMode: 'free' });
    state = makeMove(state, 0, 0); // Red
    state = makeMove(state, 3, 3); // Blue
    state = makeMove(state, 0, 1); // Red
    state = makeMove(state, 4, 3); // Blue
    state = makeMove(state, 0, 2); // Red completes horizontal!
    expect(state.scores.red).toBe(1);
    expect(state.formedTrincas.length).toBe(1);
    expect(state.formedTrincas[0].direction).toBe('horizontal');

    // 2. Vertical trinca for Blue at (3,3)-(4,3)-(5,3)
    state = makeMove(state, 5, 3); // Blue completes vertical!
    expect(state.scores.blue).toBe(1);
    expect(state.formedTrincas[1].direction).toBe('vertical');

    // 3. Main diagonal trinca for Red at (6,0)-(7,1)-(8,2)
    state = makeMove(state, 6, 0); // Red
    state = makeMove(state, 3, 5); // Blue
    state = makeMove(state, 7, 1); // Red
    state = makeMove(state, 4, 5); // Blue
    state = makeMove(state, 8, 2); // Red completes main diagonal!
    expect(state.scores.red).toBe(2);
    expect(state.formedTrincas[2].direction).toBe('diag_main');

    // 4. Anti-diagonal trinca for Red at (0,8)-(1,7)-(2,6)
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

    // Red forms (0,0)-(0,1)-(0,2)
    state = makeMove(state, 0, 0); // Red
    state = makeMove(state, 8, 0); // Blue
    state = makeMove(state, 0, 1); // Red
    state = makeMove(state, 8, 1); // Blue
    state = makeMove(state, 0, 2); // Red -> 1st trinca!
    expect(state.scores.red).toBe(1);

    // Now Red tries to extend horizontally with (0,3) and (0,4), reusing (0,2)
    state = makeMove(state, 7, 0); // Blue
    state = makeMove(state, 0, 3); // Red
    state = makeMove(state, 7, 1); // Blue
    state = makeMove(state, 0, 4); // Red -> In Regular mode, (0,2) is already in a trinca, so (0,2)-(0,3)-(0,4) does NOT score!
    expect(state.scores.red).toBe(1);

    // Only when Red places (0,5) do (0,3)-(0,4)-(0,5) form a completely fresh trinca!
    state = makeMove(state, 7, 2); // Blue
    state = makeMove(state, 0, 5); // Red
    expect(state.scores.red).toBe(2);
  });

  it('enforces Adjacent Mode: allows reusing 1 cell from an existing trinca if at least 2 cells are unused, and blocks reusing 2 cells', () => {
    let state = createInitialGameState({
      ruleMode: 'adjacent',
      scoringMode: 'free',
    });

    // Red forms (0,0)-(0,1)-(0,2)
    state = makeMove(state, 0, 0); // Red
    state = makeMove(state, 8, 0); // Blue
    state = makeMove(state, 0, 1); // Red
    state = makeMove(state, 8, 1); // Blue
    state = makeMove(state, 0, 2); // Red -> 1st trinca! (0,0), (0,1), (0,2) are now inTrinca = true
    expect(state.scores.red).toBe(1);

    // Red plays (0,3). Does (0,1)-(0,2)-(0,3) score?
    // NO! Because (0,1) and (0,2) ALREADY participated in a trinca (only 1 cell (0,3) is unused, need >= 2 unused!).
    state = makeMove(state, 7, 0); // Blue
    state = makeMove(state, 0, 3); // Red
    expect(state.scores.red).toBe(1);

    // Now Red plays (0,4). Does (0,2)-(0,3)-(0,4) score?
    // YES! Because (0,3) and (0,4) have NOT participated in any trinca yet (2 unused cells + 1 reused cell (0,2))!
    state = makeMove(state, 7, 1); // Blue
    state = makeMove(state, 0, 4); // Red
    expect(state.scores.red).toBe(2);
    expect(state.formedTrincas[1].reusedCellIndex).toBe(toIndex(0, 2));

    // Also test perpendicular adjacent trinca: reusing (0,0) with two fresh cells (1,0) and (2,0)
    state = makeMove(state, 7, 2); // Blue
    state = makeMove(state, 1, 0); // Red
    state = makeMove(state, 6, 0); // Blue
    state = makeMove(state, 2, 0); // Red -> (0,0) is reused + (1,0) and (2,0) are fresh = 2 unused cells -> VALID!
    expect(state.scores.red).toBe(3);
  });

  it('ends the match immediately in 8-points mode when a player reaches 8 points', () => {
    let state = createInitialGameState({
      ruleMode: 'adjacent',
      scoringMode: 'eight_points',
    });

    // Build 8 trincas for Blue while Red plays non-trinca cells
    const redSafeMoves = [
      [0, 0], [0, 1], [0, 3], [0, 4], [0, 6], [0, 7],
      [1, 0], [1, 1], [1, 3], [1, 4], [1, 6], [1, 7],
      [2, 0], [2, 1], [2, 3], [2, 4], [2, 6], [2, 7],
      [8, 0], [8, 1], [8, 3], [8, 4], [8, 6], [8, 7],
    ];

    // Blue plays rows 3, 4, 5 across cols 0..8
    const blueTargetMoves = [
      [3, 0], [3, 1], [3, 2], // Trinca 1
      [3, 3], [3, 4], // Trinca 2 at (3,2)-(3,3)-(3,4)
      [3, 5], [3, 6], // Trinca 3 at (3,4)-(3,5)-(3,6)
      [3, 7], [3, 8], // Trinca 4 at (3,6)-(3,7)-(3,8)
      [4, 0], [5, 0], // Trinca 5 at (3,0)-(4,0)-(5,0)
      [4, 2], [5, 2], // Trinca 6 at (3,2)-(4,2)-(5,2)
      [4, 4], [5, 4], // Trinca 7 at (3,4)-(4,4)-(5,4)
      [4, 6], [5, 6], // Trinca 8 at (3,6)-(4,6)-(5,6)
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

  it('correctly runs Easy, Medium, and Hard AI in both Regular and Adjacent modes while respecting all rules', () => {
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

        // Play 12 plies (6 Red, 6 Blue)
        for (let ply = 0; ply < 12; ply++) {
          const move = chooseAIMove(state, aiDifficulty);
          expect(
            isValidMove(state.board, move.row, move.col, state.currentPlayer)
          ).toBe(true);
          if (state.currentPlayer === 'red') {
            expect(isCenterRegion(move.row, move.col)).toBe(false);
          }
          state = makeMove(state, move.row, move.col);
        }
        expect(state.turnCount).toBe(12);
      }
    }
  });

  it('Hard AI takes an immediate winning trinca and blocks an opponent critical trinca', () => {
    let state = createInitialGameState({
      ruleMode: 'regular',
      scoringMode: 'eight_points',
      opponentMode: 'ai',
      aiDifficulty: 'hard',
    });

    // 1. Test blocking a game-winning threat by Red at (0,2)
    state.scores.red = 7; // Red is 1 point away from winning in 8-points mode!
    state = makeMove(state, 0, 0); // Red
    state = makeMove(state, 4, 4); // Blue
    state = makeMove(state, 0, 1); // Red threatens (0,2) for the win!

    // Hard AI (Blue) must block (0,2) to prevent Red from reaching 8 points
    const blueBlockMove = chooseAIMove(state, 'hard');
    expect(blueBlockMove).toEqual({ row: 0, col: 2 });

    // 2. Test taking an immediate winning trinca for Blue at (5,4)
    state = makeMove(state, 0, 2); // Blue blocks (0,2)
    state = makeMove(state, 8, 8); // Red plays elsewhere
    state.scores.blue = 7; // Blue is 1 point away from winning
    state = makeMove(state, 3, 4); // Blue sets up (3,4) + (4,4)
    state = makeMove(state, 8, 0); // Red plays elsewhere

    const blueWinMove = chooseAIMove(state, 'hard');
    // Blue can win immediately at either (2,4) or (5,4)
    expect([
      { row: 2, col: 4 },
      { row: 5, col: 4 },
    ]).toContainEqual(blueWinMove);
  });

  it('properly finishes Free Mode both when all 81 cells are filled and when Red has no valid outer moves left', () => {
    // Case A: Blue never plays in the center 3x3, so all 72 outer cells fill up after 72 moves (36 Red, 36 Blue).
    // On turn 73 (Red's turn), only the 9 center cells are empty, so Red has 0 valid moves and the match ends cleanly!
    let stateA = createInitialGameState({
      ruleMode: 'regular',
      scoringMode: 'free',
    });

    const outerCoords: Array<[number, number]> = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (!isCenterRegion(r, c)) {
          outerCoords.push([r, c]);
        }
      }
    }
    expect(outerCoords.length).toBe(72);

    for (const [r, c] of outerCoords) {
      expect(stateA.status).toBe('playing');
      stateA = makeMove(stateA, r, c);
    }

    expect(stateA.turnCount).toBe(72);
    expect(stateA.status).toBe('finished');
    expect(stateA.endReason).toBe('no_valid_moves_for_player');
    expect(stateA.winner).not.toBeNull();

    // Case B: Blue plays all 9 center cells early, so all 81 cells get filled (41 Red moves, 40 Blue moves)
    let stateB = createInitialGameState({
      ruleMode: 'adjacent',
      scoringMode: 'free',
    });

    const centerCoords: Array<[number, number]> = [];
    for (let r = 3; r <= 5; r++) {
      for (let c = 3; c <= 5; c++) {
        centerCoords.push([r, c]);
      }
    }

    let outerCursor = 0;
    let centerCursor = 0;

    while (stateB.status === 'playing') {
      if (stateB.currentPlayer === 'red') {
        const [r, c] = outerCoords[outerCursor++];
        stateB = makeMove(stateB, r, c);
      } else {
        if (centerCursor < centerCoords.length) {
          const [r, c] = centerCoords[centerCursor++];
          stateB = makeMove(stateB, r, c);
        } else {
          const [r, c] = outerCoords[outerCursor++];
          stateB = makeMove(stateB, r, c);
        }
      }
    }

    expect(stateB.turnCount).toBe(81);
    expect(stateB.status).toBe('finished');
    expect(stateB.endReason).toBe('board_full');
  });
});
