import { TARGET_SCORE_EIGHT, TOTAL_CELLS } from './constants';
import {
  CellState,
  EndReason,
  GameStatus,
  Player,
  ScoringMode,
} from './types';

export interface ScoreEvaluationResult {
  status: GameStatus;
  winner: Player | 'draw' | null;
  endReason: EndReason;
}

/**
 * Evaluates whether the match has ended and determines the winner based on the active scoring mode.
 */
export function evaluateMatchOutcome(
  board: readonly CellState[],
  scores: { red: number; blue: number },
  scoringMode: ScoringMode,
  justMovedPlayer: Player,
  nextPlayerValidMovesCount: number
): ScoreEvaluationResult {
  // 1. In 8-points mode, reaching 8 (or more) points wins immediately
  if (scoringMode === 'eight_points') {
    if (scores[justMovedPlayer] >= TARGET_SCORE_EIGHT) {
      return {
        status: 'finished',
        winner: justMovedPlayer,
        endReason: 'target_score_reached',
      };
    }
  }

  // 2. Check if all 81 cells are occupied
  let occupiedCount = 0;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    if (board[i].owner !== null) {
      occupiedCount++;
    }
  }

  if (occupiedCount >= TOTAL_CELLS) {
    return {
      status: 'finished',
      winner: resolveWinnerByScore(scores),
      endReason: 'board_full',
    };
  }

  // 3. Check if the next player has no valid moves (e.g. Red when only center cells remain)
  if (nextPlayerValidMovesCount === 0) {
    return {
      status: 'finished',
      winner: resolveWinnerByScore(scores),
      endReason: 'no_valid_moves_for_player',
    };
  }

  return {
    status: 'playing',
    winner: null,
    endReason: null,
  };
}

export function resolveWinnerByScore(scores: {
  red: number;
  blue: number;
}): Player | 'draw' {
  if (scores.red > scores.blue) return 'red';
  if (scores.blue > scores.red) return 'blue';
  return 'draw';
}
