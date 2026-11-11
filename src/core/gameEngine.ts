import {
  BOARD_SIZE,
  isCenterIndex,
  isCenterRegion,
  toIndex,
  TOTAL_CELLS,
} from './constants';
import { evaluateMatchOutcome } from './scoringSystem';
import { detectAndApplyNewTrincas } from './trincaDetector';
import {
  CellState,
  GameConfig,
  GameState,
  MoveRecord,
  Player,
} from './types';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  ruleMode: 'regular',
  scoringMode: 'eight_points',
  opponentMode: 'pvp',
  aiDifficulty: 'medium',
  aiPlayer: 'blue',
};

export function createInitialBoard(): CellState[] {
  const board: CellState[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      board.push({
        row,
        col,
        index: toIndex(row, col),
        owner: null,
        inTrinca: false,
        trincaCount: 0,
        placedAtTurn: null,
      });
    }
  }
  return board;
}

export function createInitialGameState(
  config: Partial<GameConfig> = {}
): GameState {
  const mergedConfig: GameConfig = {
    ...DEFAULT_GAME_CONFIG,
    ...config,
  };

  return {
    board: createInitialBoard(),
    currentPlayer: 'red', // Rule 4: Red player always starts
    turnCount: 0,
    scores: {
      red: 0,
      blue: 0,
    },
    formedTrincas: [],
    formedTrincaIds: {},
    lastMove: null,
    moveHistory: [],
    status: 'playing',
    winner: null,
    endReason: null,
    config: mergedConfig,
  };
}

export function getOpponent(player: Player): Player {
  return player === 'red' ? 'blue' : 'red';
}

/**
 * Returns true if the Red player has already placed at least one symbol on the board.
 * Since pieces are never removed during a match, Red is on their first move iff
 * there are currently 0 Red symbols on the board.
 */
export function hasRedMadeFirstMove(board: readonly CellState[]): boolean {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i].owner === 'red') {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether `player` can legally place a symbol at `(row, col)`.
 *
 * Rules:
 * - Coordinates must be within 0..8.
 * - Target cell must be empty (`owner === null`).
 * - Red player cannot place their FIRST move in the central 3x3 region (rows 3..5, cols 3..5).
 * - From Red's second move onward, Red can play in the central 3x3 region normally.
 * - Blue player can place symbols in any available cell, including the center, from their first move.
 */
export function isValidMove(
  board: readonly CellState[],
  row: number,
  col: number,
  player: Player
): boolean {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }
  const index = toIndex(row, col);
  if (board[index].owner !== null) {
    return false;
  }
  if (
    player === 'red' &&
    isCenterRegion(row, col) &&
    !hasRedMadeFirstMove(board)
  ) {
    return false;
  }
  return true;
}

export function isValidMoveIndex(
  board: readonly CellState[],
  index: number,
  player: Player
): boolean {
  if (index < 0 || index >= TOTAL_CELLS) return false;
  if (board[index].owner !== null) return false;
  if (
    player === 'red' &&
    isCenterIndex(index) &&
    !hasRedMadeFirstMove(board)
  ) {
    return false;
  }
  return true;
}

/**
 * Returns all valid cell indices (0..80) where `player` can play on the given board.
 */
export function getValidMoveIndices(
  board: readonly CellState[],
  player: Player
): number[] {
  const validIndices: number[] = [];
  const restrictRedCenter = player === 'red' && !hasRedMadeFirstMove(board);

  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i].owner === null) {
      if (restrictRedCenter && isCenterIndex(i)) {
        continue;
      }
      validIndices.push(i);
    }
  }
  return validIndices;
}

/**
 * Executes a move for the current player at `(row, col)` and returns the new immutable GameState.
 * Throws an error if the move is invalid or the game has already finished.
 */
export function makeMove(
  state: GameState,
  row: number,
  col: number
): GameState {
  if (state.status !== 'playing') {
    throw new Error('Cannot make a move after the match has finished.');
  }

  const player = state.currentPlayer;
  if (!isValidMove(state.board, row, col, player)) {
    throw new Error(
      `Invalid move at (${row}, ${col}) for player ${player}.`
    );
  }

  const moveIndex = toIndex(row, col);
  const nextTurnNumber = state.turnCount + 1;

  // Clone board cells
  const nextBoard: CellState[] = state.board.map((cell) => ({ ...cell }));
  nextBoard[moveIndex].owner = player;
  nextBoard[moveIndex].placedAtTurn = nextTurnNumber;

  // Clone formedTrincaIds
  const nextFormedTrincaIds: Record<string, boolean> = {
    ...state.formedTrincaIds,
  };

  // Detect new trincas according to the active rule mode ('regular' vs 'adjacent')
  const newlyFormed = detectAndApplyNewTrincas(
    nextBoard,
    moveIndex,
    player,
    state.config.ruleMode,
    nextFormedTrincaIds,
    nextTurnNumber
  );

  const pointsEarned = newlyFormed.length;
  const nextScores = {
    red: state.scores.red + (player === 'red' ? pointsEarned : 0),
    blue: state.scores.blue + (player === 'blue' ? pointsEarned : 0),
  };

  const nextPlayer = getOpponent(player);
  const nextPlayerValidMoves = getValidMoveIndices(nextBoard, nextPlayer);

  const outcome = evaluateMatchOutcome(
    nextBoard,
    nextScores,
    state.config.scoringMode,
    player,
    nextPlayerValidMoves.length
  );

  const moveRecord: MoveRecord = {
    turnNumber: nextTurnNumber,
    player,
    row,
    col,
    index: moveIndex,
    trincasFormed: newlyFormed,
    pointsEarned,
    scoreAfter: { ...nextScores },
    timestamp: Date.now(),
  };

  return {
    ...state,
    board: nextBoard,
    currentPlayer: outcome.status === 'playing' ? nextPlayer : state.currentPlayer,
    turnCount: nextTurnNumber,
    scores: nextScores,
    formedTrincas: [...state.formedTrincas, ...newlyFormed],
    formedTrincaIds: nextFormedTrincaIds,
    lastMove: moveRecord,
    moveHistory: [...state.moveHistory, moveRecord],
    status: outcome.status,
    winner: outcome.winner,
    endReason: outcome.endReason,
  };
}
