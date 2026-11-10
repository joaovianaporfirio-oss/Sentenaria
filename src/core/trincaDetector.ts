import { LINES_BY_CELL } from './constants';
import {
  CellState,
  FormedTrinca,
  GameRuleMode,
  Player,
  TrincaLineDefinition,
} from './types';

/**
 * Checks whether a specific 3-cell line is currently eligible to form a new trinca
 * given the current board state (including `inTrinca` flags of each cell) and rule mode.
 *
 * Rules:
 * - All 3 cells must belong to `player`.
 * - The exact trinca ID must not have been formed already.
 * - Modo Regular: 0 of the 3 cells may have participated in a previous trinca (all 3 must have `inTrinca === false`).
 * - Modo Adjacente: at least 2 of the 3 cells must have `inTrinca === false` (at most 1 cell may have `inTrinca === true`).
 */
export function isLineValidNewTrinca(
  board: readonly CellState[],
  line: TrincaLineDefinition,
  player: Player,
  ruleMode: GameRuleMode,
  formedTrincaIds: Readonly<Record<string, boolean>>
): { valid: boolean; reusedCellIndex: number | null; priorUsedCount: number } {
  if (formedTrincaIds[line.id]) {
    return { valid: false, reusedCellIndex: null, priorUsedCount: 3 };
  }

  const [i0, i1, i2] = line.indices;
  const c0 = board[i0];
  const c1 = board[i1];
  const c2 = board[i2];

  if (c0.owner !== player || c1.owner !== player || c2.owner !== player) {
    return { valid: false, reusedCellIndex: null, priorUsedCount: 0 };
  }

  let usedCount = 0;
  let reusedCellIndex: number | null = null;

  if (c0.inTrinca) {
    usedCount++;
    reusedCellIndex = i0;
  }
  if (c1.inTrinca) {
    usedCount++;
    reusedCellIndex = i1;
  }
  if (c2.inTrinca) {
    usedCount++;
    reusedCellIndex = i2;
  }

  if (ruleMode === 'regular') {
    // In regular mode, no cell from an already formed trinca can be reused (usedCount must be 0)
    return {
      valid: usedCount === 0,
      reusedCellIndex: null,
      priorUsedCount: usedCount,
    };
  } else {
    // In adjacent mode, at least 2 of the 3 cells must NEVER have participated in a trinca before (usedCount <= 1)
    return {
      valid: usedCount <= 1,
      reusedCellIndex: usedCount === 1 ? reusedCellIndex : null,
      priorUsedCount: usedCount,
    };
  }
}

/**
 * Evaluates and applies all valid new trincas formed by placing `player`'s symbol at `moveIndex`.
 * Mutates `board` cells' `inTrinca` and `trincaCount` in-place (on a cloned board) and returns the newly formed trincas.
 *
 * Candidate ordering in Adjacent Mode:
 * 1. Lines that already have 1 `inTrinca` cell (`priorUsedCount === 1`) are evaluated before lines with `0` `inTrinca` cells,
 *    so `moveIndex` can complete a trinca with an existing anchor and then itself serve as the single anchor for a fresh pair.
 * 2. Endpoint-anchored lines (`moveIndex` at start or end of the 3-cell segment) are evaluated before middle-anchored lines,
 *    allowing a 5-in-a-row bridged at the center cell to yield two valid adjacent trincas sharing only the center cell.
 */
export function detectAndApplyNewTrincas(
  board: CellState[],
  moveIndex: number,
  player: Player,
  ruleMode: GameRuleMode,
  formedTrincaIds: Record<string, boolean>,
  turnNumber: number
): FormedTrinca[] {
  const candidateLines = [...LINES_BY_CELL[moveIndex]];

  // Pre-filter to lines where all 3 cells belong to `player` and line isn't already formed
  const ownedLines = candidateLines.filter((line) => {
    if (formedTrincaIds[line.id]) return false;
    const [i0, i1, i2] = line.indices;
    return (
      board[i0].owner === player &&
      board[i1].owner === player &&
      board[i2].owner === player
    );
  });

  if (ownedLines.length === 0) {
    return [];
  }

  // Sort candidates for optimal, deterministic resolution
  ownedLines.sort((a, b) => {
    const aUsed =
      (board[a.indices[0]].inTrinca ? 1 : 0) +
      (board[a.indices[1]].inTrinca ? 1 : 0) +
      (board[a.indices[2]].inTrinca ? 1 : 0);
    const bUsed =
      (board[b.indices[0]].inTrinca ? 1 : 0) +
      (board[b.indices[1]].inTrinca ? 1 : 0) +
      (board[b.indices[2]].inTrinca ? 1 : 0);

    if (ruleMode === 'adjacent' && aUsed !== bUsed) {
      // Evaluate lines with 1 prior used cell before 0 prior used cells
      return bUsed - aUsed;
    }

    // Prefer lines where moveIndex is an endpoint (indices[0] or indices[2]) over middle (indices[1])
    const aIsMiddle = a.indices[1] === moveIndex ? 1 : 0;
    const bIsMiddle = b.indices[1] === moveIndex ? 1 : 0;
    if (aIsMiddle !== bIsMiddle) {
      return aIsMiddle - bIsMiddle;
    }

    return a.id.localeCompare(b.id);
  });

  const newlyFormed: FormedTrinca[] = [];

  for (const line of ownedLines) {
    const check = isLineValidNewTrinca(board, line, player, ruleMode, formedTrincaIds);
    if (check.valid) {
      formedTrincaIds[line.id] = true;
      for (const idx of line.indices) {
        board[idx].inTrinca = true;
        board[idx].trincaCount += 1;
      }
      newlyFormed.push({
        id: line.id,
        player,
        indices: line.indices,
        coords: line.coords,
        direction: line.direction,
        formedAtTurn: turnNumber,
        reusedCellIndex: check.reusedCellIndex,
      });
    }
  }

  return newlyFormed;
}

/**
 * Pure simulation helper (does not mutate input board): returns how many points/trincas
 * placing `player` at `moveIndex` would immediately score.
 */
export function countImmediateTrincasForMove(
  board: readonly CellState[],
  moveIndex: number,
  player: Player,
  ruleMode: GameRuleMode,
  formedTrincaIds: Readonly<Record<string, boolean>>
): number {
  const candidateLines = LINES_BY_CELL[moveIndex];
  const relevantLines: TrincaLineDefinition[] = [];

  for (let i = 0; i < candidateLines.length; i++) {
    const line = candidateLines[i];
    if (formedTrincaIds[line.id]) continue;
    const [i0, i1, i2] = line.indices;
    const o0 = i0 === moveIndex ? player : board[i0].owner;
    const o1 = i1 === moveIndex ? player : board[i1].owner;
    const o2 = i2 === moveIndex ? player : board[i2].owner;
    if (o0 === player && o1 === player && o2 === player) {
      relevantLines.push(line);
    }
  }

  if (relevantLines.length === 0) return 0;

  // Fast local tracking of which cells become inTrinca during this simulated move
  const tempInTrinca = new Set<number>();
  for (const line of relevantLines) {
    for (const idx of line.indices) {
      if (idx !== moveIndex && board[idx].inTrinca) {
        tempInTrinca.add(idx);
      }
    }
  }

  relevantLines.sort((a, b) => {
    const aUsed =
      (tempInTrinca.has(a.indices[0]) ? 1 : 0) +
      (tempInTrinca.has(a.indices[1]) ? 1 : 0) +
      (tempInTrinca.has(a.indices[2]) ? 1 : 0);
    const bUsed =
      (tempInTrinca.has(b.indices[0]) ? 1 : 0) +
      (tempInTrinca.has(b.indices[1]) ? 1 : 0) +
      (tempInTrinca.has(b.indices[2]) ? 1 : 0);
    if (ruleMode === 'adjacent' && aUsed !== bUsed) {
      return bUsed - aUsed;
    }
    const aIsMiddle = a.indices[1] === moveIndex ? 1 : 0;
    const bIsMiddle = b.indices[1] === moveIndex ? 1 : 0;
    return aIsMiddle - bIsMiddle;
  });

  let count = 0;
  for (const line of relevantLines) {
    const [i0, i1, i2] = line.indices;
    const usedCount =
      (tempInTrinca.has(i0) ? 1 : 0) +
      (tempInTrinca.has(i1) ? 1 : 0) +
      (tempInTrinca.has(i2) ? 1 : 0);

    const valid = ruleMode === 'regular' ? usedCount === 0 : usedCount <= 1;
    if (valid) {
      count++;
      tempInTrinca.add(i0);
      tempInTrinca.add(i1);
      tempInTrinca.add(i2);
    }
  }

  return count;
}
