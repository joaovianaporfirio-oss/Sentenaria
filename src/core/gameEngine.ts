import {
  BOARD_SIZE,
  toCoord,
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
  PieRuleDecision,
  Player,
} from './types';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  ruleMode: 'adjacent',
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
        visualColor: null,
        placedBy: null,
        stolenByPieRule: false,
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
    ruleMode: 'adjacent',
  };

  return {
    board: createInitialBoard(),
    currentPlayer: 'red', // Red player always starts
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
    pieRuleState: 'not_triggered',
    firstMoveIndex: null,
  };
}

export function getOpponent(player: Player): Player {
  return player === 'red' ? 'blue' : 'red';
}

/**
 * Returns true if at least one piece has been placed on the board.
 */
export function hasRedMadeFirstMove(board: readonly CellState[]): boolean {
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i].owner !== null) {
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
 * - Both Red and Blue can play freely in any of the 81 cells (no central restriction).
 */
export function isValidMove(
  board: readonly CellState[],
  row: number,
  col: number,
  _player?: Player
): boolean {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }
  const index = toIndex(row, col);
  return board[index].owner === null;
}

export function isValidMoveIndex(
  board: readonly CellState[],
  index: number,
  _player?: Player
): boolean {
  if (index < 0 || index >= TOTAL_CELLS) return false;
  return board[index].owner === null;
}

/**
 * Returns all valid cell indices (0..80) where `player` can play on the given board.
 */
export function getValidMoveIndices(
  board: readonly CellState[],
  _player?: Player
): number[] {
  const validIndices: number[] = [];
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i].owner === null) {
      validIndices.push(i);
    }
  }
  return validIndices;
}

/**
 * Executes a move for the current player at `(row, col)` and returns the new immutable GameState.
 * Throws an error if the move is invalid, if the Pie Rule decision is pending, or if the game has finished.
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
  nextBoard[moveIndex].visualColor = player;
  nextBoard[moveIndex].placedBy = player;
  nextBoard[moveIndex].stolenByPieRule = false;
  nextBoard[moveIndex].placedAtTurn = nextTurnNumber;

  // Clone formedTrincaIds
  const nextFormedTrincaIds: Record<string, boolean> = {
    ...state.formedTrincaIds,
  };

  // Detect new trincas according to the mandatory adjacent rule
  const newlyFormed = detectAndApplyNewTrincas(
    nextBoard,
    moveIndex,
    player,
    'adjacent',
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
    isPieSteal: false,
  };

  // Trigger the Pie Rule decision immediately after Red's 1st move (turnCount === 0 -> 1)
  const isRedFirstMove =
    state.turnCount === 0 &&
    player === 'red' &&
    state.pieRuleState === 'not_triggered';

  return {
    ...state,
    board: nextBoard,
    currentPlayer:
      outcome.status === 'playing' ? nextPlayer : state.currentPlayer,
    turnCount: nextTurnNumber,
    scores: nextScores,
    formedTrincas: [...state.formedTrincas, ...newlyFormed],
    formedTrincaIds: nextFormedTrincaIds,
    lastMove: moveRecord,
    moveHistory: [...state.moveHistory, moveRecord],
    status: outcome.status,
    winner: outcome.winner,
    endReason: outcome.endReason,
    pieRuleState: isRedFirstMove
      ? 'pending'
      : state.pieRuleState === 'pending'
      ? 'continued'
      : state.pieRuleState,
    firstMoveIndex: isRedFirstMove ? moveIndex : state.firstMoveIndex,
  };
}

/**
 * Resolves the second player's (Blue) one-time Pie Rule ("Roubo de Peça") decision
 * after Red's first move:
 * - 'continue': Blue keeps playing normally as Blue and immediately makes their first Blue move on the board.
 * - 'steal': Blue steals the first piece placed by Red; the piece stays in the same cell, changes its
 *   ownership (`owner = 'blue'`) and visual appearance (`visualColor = 'blue'`), and the turn passes to Red.
 *   Player identities (Red = Player 1, Blue = Player 2) never swap.
 */
export function resolvePieRuleDecision(
  state: GameState,
  decision: PieRuleDecision
): GameState {
  if (state.status !== 'playing') {
    throw new Error('A partida já foi encerrada.');
  }

  if (state.pieRuleState !== 'pending') {
    throw new Error(
      'A decisão do Roubo de Peça não está disponível neste momento.'
    );
  }

  if (state.currentPlayer !== 'blue') {
    throw new Error(
      'Apenas o jogador Azul pode tomar a decisão do Roubo de Peça.'
    );
  }

  // Locate the first piece placed by Red
  const targetIndex =
    state.firstMoveIndex !== null
      ? state.firstMoveIndex
      : state.board.findIndex((c) => c.owner === 'red');

  if (targetIndex < 0 || targetIndex >= TOTAL_CELLS || state.board[targetIndex].owner !== 'red') {
    throw new Error('Primeira peça vermelha não encontrada no tabuleiro.');
  }

  if (decision === 'continue') {
    return {
      ...state,
      pieRuleState: 'continued',
      currentPlayer: 'blue',
    };
  }

  // Option B: Steal the first piece ('steal')
  const nextTurnNumber = state.turnCount + 1;
  const nextBoard: CellState[] = state.board.map((cell) => ({ ...cell }));
  const stolenCell = nextBoard[targetIndex];

  stolenCell.owner = 'blue';
  stolenCell.visualColor = 'blue';
  stolenCell.placedBy = stolenCell.placedBy ?? 'red';
  stolenCell.stolenByPieRule = true;

  const { row, col } = toCoord(targetIndex);
  const stealMoveRecord: MoveRecord = {
    turnNumber: nextTurnNumber,
    player: 'blue',
    row,
    col,
    index: targetIndex,
    trincasFormed: [],
    pointsEarned: 0,
    scoreAfter: { ...state.scores },
    timestamp: Date.now(),
    isPieSteal: true,
  };

  return {
    ...state,
    board: nextBoard,
    currentPlayer: 'red', // After stealing, turn passes back to Red
    turnCount: nextTurnNumber,
    lastMove: stealMoveRecord,
    moveHistory: [...state.moveHistory, stealMoveRecord],
    pieRuleState: 'stolen',
    firstMoveIndex: targetIndex,
  };
}
