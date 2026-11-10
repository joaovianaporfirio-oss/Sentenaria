import {
  ALL_TRINCA_LINES,
  isCenterIndex,
  LINES_BY_CELL,
  TARGET_SCORE_EIGHT,
   toCoord,
  TOTAL_CELLS,
} from '../core/constants';
import { getOpponent, getValidMoveIndices, makeMove } from '../core/gameEngine';
import { countImmediateTrincasForMove } from '../core/trincaDetector';
import {
  AIDifficulty,
  CellCoord,
  CellState,
  GameRuleMode,
  GameState,
  Player,
  ScoringMode,
} from '../core/types';

/**
 * Main entry point to select a move for the AI based on the difficulty setting.
 */
export function chooseAIMove(
  state: GameState,
  difficulty: AIDifficulty = state.config.aiDifficulty
): CellCoord {
  const aiPlayer = state.currentPlayer;
  const validIndices = getValidMoveIndices(state.board, aiPlayer);

  if (validIndices.length === 0) {
    throw new Error(`No valid moves available for AI player ${aiPlayer}`);
  }

  if (validIndices.length === 1) {
    return toCoord(validIndices[0]);
  }

  switch (difficulty) {
    case 'easy':
      return chooseEasyMove(state, validIndices);
    case 'medium':
      return chooseMediumMove(state, validIndices);
    case 'hard':
      return chooseHardMove(state, validIndices);
    default:
      return chooseMediumMove(state, validIndices);
  }
}

/**
 * EASY AI:
 * - Always plays valid moves (respects Red center restriction).
 * - Predominantly random (~80% pure random valid cell), with a small chance (~20%)
 *   to take an obvious immediate trinca if one is available so it feels alive.
 */
function chooseEasyMove(state: GameState, validIndices: number[]): CellCoord {
  const aiPlayer = state.currentPlayer;
  const { ruleMode } = state.config;

  // 20% chance to check if there is an immediate trinca to score
  if (Math.random() < 0.2) {
    for (const idx of validIndices) {
      const pts = countImmediateTrincasForMove(
        state.board,
        idx,
        aiPlayer,
        ruleMode,
        state.formedTrincaIds
      );
      if (pts > 0) {
        return toCoord(idx);
      }
    }
  }

  const randomIdx = validIndices[Math.floor(Math.random() * validIndices.length)];
  return toCoord(randomIdx);
}

/**
 * MEDIUM AI:
 * - Analyzes the board before playing.
 * - Takes immediate trincas when available.
 * - Attempts to block the opponent's immediate trincas.
 * - Considers the central region (when Blue) and future line setups.
 */
function chooseMediumMove(state: GameState, validIndices: number[]): CellCoord {
  const aiPlayer = state.currentPlayer;
  const oppPlayer = getOpponent(aiPlayer);
  const { ruleMode, scoringMode } = state.config;

  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const idx of validIndices) {
    let moveScore = 0;

    // 1. Immediate AI trincas
    const myImmediatePts = countImmediateTrincasForMove(
      state.board,
      idx,
      aiPlayer,
      ruleMode,
      state.formedTrincaIds
    );

    if (
      scoringMode === 'eight_points' &&
      state.scores[aiPlayer] + myImmediatePts >= TARGET_SCORE_EIGHT
    ) {
      return toCoord(idx); // Immediate winning move
    }

    if (myImmediatePts > 0) {
      moveScore += myImmediatePts * 1200;
    }

    // 2. Blocking opponent's immediate trinca (only if opponent can actually play at `idx`)
    const oppCanPlayHere = !(oppPlayer === 'red' && isCenterIndex(idx));
    if (oppCanPlayHere) {
      const oppImmediatePts = countImmediateTrincasForMove(
        state.board,
        idx,
        oppPlayer,
        ruleMode,
        state.formedTrincaIds
      );
      if (oppImmediatePts > 0) {
        // Urgent block if opponent is close to 8 points
        const urgencyMultiplier =
          scoringMode === 'eight_points' &&
          state.scores[oppPlayer] + oppImmediatePts >= TARGET_SCORE_EIGHT
            ? 2500
            : 950;
        moveScore += oppImmediatePts * urgencyMultiplier;
      }
    }

    // 3. Evaluate line setups passing through `idx`
    const setupValue = evaluateCellPositionalPotential(
      state.board,
      idx,
      aiPlayer,
      oppPlayer,
      ruleMode,
      state.formedTrincaIds
    );
    moveScore += setupValue;

    // 4. Center region bonus for Blue
    if (aiPlayer === 'blue' && isCenterIndex(idx)) {
      moveScore += idx === 40 ? 35 : 22; // 40 is (4,4) exact center
    }

    // Slight jitter so Medium AI has variety among equally good moves
    moveScore += Math.random() * 12;

    if (moveScore > bestScore) {
      bestScore = moveScore;
      bestMoves = [idx];
    } else if (Math.abs(moveScore - bestScore) < 1e-5) {
      bestMoves.push(idx);
    }
  }

  const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
  return toCoord(chosen);
}

/**
 * Evaluates local line building and blocking potential for placing at `idx`.
 */
function evaluateCellPositionalPotential(
  board: readonly CellState[],
  idx: number,
  aiPlayer: Player,
  oppPlayer: Player,
  ruleMode: GameRuleMode,
  formedTrincaIds: Readonly<Record<string, boolean>>
): number {
  let score = 0;
  const lines = LINES_BY_CELL[idx];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (formedTrincaIds[line.id]) continue;

    let aiOwned = 0;
    let oppOwned = 0;
    let usedCount = 0;
    let redForbiddenEmpty = false;

    for (const cellIdx of line.indices) {
      if (cellIdx === idx) continue;
      const cell = board[cellIdx];
      if (cell.owner === aiPlayer) {
        aiOwned++;
        if (cell.inTrinca) usedCount++;
      } else if (cell.owner === oppPlayer) {
        oppOwned++;
        if (cell.inTrinca) usedCount++;
      } else {
        if (isCenterIndex(cellIdx)) {
          redForbiddenEmpty = true;
        }
      }
    }

    // Friendly line potential (no opponent pieces blocking this 3-cell segment)
    if (oppOwned === 0) {
      const canComplete = !(aiPlayer === 'red' && redForbiddenEmpty);
      const validUnderRule =
        ruleMode === 'regular' ? usedCount === 0 : usedCount <= 1;

      if (canComplete && validUnderRule) {
        if (aiOwned === 1) {
          // Creates a 2-in-a-row threat!
          score += ruleMode === 'adjacent' && usedCount === 1 ? 85 : 75;
        } else if (aiOwned === 0) {
          // Starts a fresh 3-cell line
          score += 12;
        }
      }
    }

    // Defensive disruption of opponent's 1-in-a-row before it becomes a 2-in-a-row
    if (aiOwned === 0 && oppOwned === 1) {
      const oppCanPlay = !(
        oppPlayer === 'red' &&
        (isCenterIndex(idx) || redForbiddenEmpty)
      );
      const validForOpp =
        ruleMode === 'regular' ? usedCount === 0 : usedCount <= 1;
      if (oppCanPlay && validForOpp) {
        score += 38;
      }
    }
  }

  return score;
}

// ============================================================================
// HARD AI: Minimax with Alpha-Beta Pruning, Zobrist Transposition Table,
// Iterative Deepening, Threat/Fork Analysis & Mode-Aware Heuristic Evaluation
// ============================================================================

interface TTEntry {
  depth: number;
  score: number;
  flag: 'exact' | 'lower' | 'upper';
  bestMove: number;
}

// Precomputed deterministic Zobrist table (81 cells * 5 cell states)
const ZOBRIST_CELL: bigint[][] = Array.from({ length: TOTAL_CELLS }, (_, i) =>
  Array.from({ length: 5 }, (__, s) => {
    // Deterministic 64-bit SplitMix64 generator
    let z = BigInt(i * 17 + s * 31) + 0x9e3779b97f4a7c15n;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
    return (z ^ (z >> 31n)) & 0xffffffffffffffffn;
  })
);
const ZOBRIST_TURN_BLUE = 0x517cc1b727220a95n;

function computeStateHash(state: GameState): bigint {
  let h = 0n;
  for (let i = 0; i < TOTAL_CELLS; i++) {
    const c = state.board[i];
    if (c.owner === null) continue;
    const stateCode =
      c.owner === 'red' ? (c.inTrinca ? 2 : 1) : c.inTrinca ? 4 : 3;
    h ^= ZOBRIST_CELL[i][stateCode];
  }
  if (state.currentPlayer === 'blue') {
    h ^= ZOBRIST_TURN_BLUE;
  }
  h ^= BigInt(state.scores.red * 257 + state.scores.blue * 17);
  return h;
}

/**
 * HARD AI:
 * Uses Iterative Deepening Minimax with Alpha-Beta Pruning, Transposition Table,
 * and rich strategic + tactical evaluation.
 */
function chooseHardMove(state: GameState, validIndices: number[]): CellCoord {
  const aiPlayer = state.currentPlayer;
  const oppPlayer = getOpponent(aiPlayer);
  const { ruleMode, scoringMode } = state.config;

  // 1. Check if there is an immediate winning move in 8-points mode
  if (scoringMode === 'eight_points') {
    for (const idx of validIndices) {
      const pts = countImmediateTrincasForMove(
        state.board,
        idx,
        aiPlayer,
        ruleMode,
        state.formedTrincaIds
      );
      if (state.scores[aiPlayer] + pts >= TARGET_SCORE_EIGHT) {
        return toCoord(idx);
      }
    }
  }

  // 2. Opening book / early-game strategic priority on first 2 turns
  if (state.turnCount === 0 && aiPlayer === 'red') {
    // Best opening cells for Red are the strong inner-ring corners/edges just outside the 3x3 center:
    // (2,2), (2,6), (6,2), (6,6), (2,4), (4,2), (4,6), (6,4)
    const primeRedOpeners = [20, 24, 56, 60, 22, 38, 42, 58];
    const picked =
      primeRedOpeners[Math.floor(Math.random() * primeRedOpeners.length)];
    return toCoord(picked);
  }
  if (state.turnCount === 1 && aiPlayer === 'blue' && state.board[40].owner === null) {
    // Blue's strongest turn-2 anchor is the exact center (4,4) -> index 40, or blocking adjacent to Red
    // Let's allow search to verify, or bias index 40 strongly in move ordering
  }

  // 3. Rank and filter root candidate moves
  const orderedRootMoves = rankCandidateMoves(
    state,
    validIndices,
    aiPlayer,
    oppPlayer,
    18
  );

  const tt = new Map<bigint, TTEntry>();
  const startTime = performance.now();
  const TIME_BUDGET_MS = 220; // Responsive, smooth execution without blocking UI

  let bestMove = orderedRootMoves[0];
  const maxDepth = validIndices.length <= 16 ? 6 : validIndices.length <= 36 ? 5 : 4;

  for (let depth = 2; depth <= maxDepth; depth++) {
    if (performance.now() - startTime > TIME_BUDGET_MS * 0.7) {
      break;
    }

    let alpha = -Infinity;
    const beta = Infinity;
    let currentDepthBestMove = bestMove;
    let currentDepthBestScore = -Infinity;
    let aborted = false;

    // Put the previous iteration's bestMove first for optimal Alpha-Beta cutoffs
    const rootOrder = [
      bestMove,
      ...orderedRootMoves.filter((m) => m !== bestMove),
    ];

    for (const moveIdx of rootOrder) {
      if (performance.now() - startTime > TIME_BUDGET_MS) {
        aborted = true;
        break;
      }

      const coord = toCoord(moveIdx);
      const childState = makeMove(state, coord.row, coord.col);

      const score = alphaBeta(
        childState,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
        oppPlayer,
        tt,
        startTime,
        TIME_BUDGET_MS
      );

      if (performance.now() - startTime > TIME_BUDGET_MS) {
        aborted = true;
        break;
      }

      if (score > currentDepthBestScore) {
        currentDepthBestScore = score;
        currentDepthBestMove = moveIdx;
      }
      if (score > alpha) {
        alpha = score;
      }
    }

    if (!aborted || currentDepthBestScore > 500000) {
      bestMove = currentDepthBestMove;
      // Early exit if forced win found
      if (currentDepthBestScore >= 900000) {
        break;
      }
    }
  }

  return toCoord(bestMove);
}

function alphaBeta(
  state: GameState,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  aiPlayer: Player,
  oppPlayer: Player,
  tt: Map<bigint, TTEntry>,
  startTime: number,
  timeBudgetMs: number
): number {
  // Terminal check
  if (state.status === 'finished') {
    if (state.winner === aiPlayer) {
      return 1_000_000 + depth * 1000 + (state.scores[aiPlayer] - state.scores[oppPlayer]) * 500;
    }
    if (state.winner === oppPlayer) {
      return -1_000_000 - depth * 1000 + (state.scores[aiPlayer] - state.scores[oppPlayer]) * 500;
    }
    return 0;
  }

  if (depth <= 0 || performance.now() - startTime > timeBudgetMs) {
    return evaluateBoardState(state, aiPlayer, oppPlayer);
  }

  const hash = computeStateHash(state);
  const cached = tt.get(hash);
  if (cached && cached.depth >= depth) {
    if (cached.flag === 'exact') return cached.score;
    if (cached.flag === 'lower' && cached.score > alpha) alpha = cached.score;
    else if (cached.flag === 'upper' && cached.score < beta) beta = cached.score;
    if (alpha >= beta) return cached.score;
  }

  const currentMover = state.currentPlayer;
  const otherMover = getOpponent(currentMover);
  const validIndices = getValidMoveIndices(state.board, currentMover);

  if (validIndices.length === 0) {
    return evaluateBoardState(state, aiPlayer, oppPlayer);
  }

  const branchLimit = depth >= 3 ? 11 : 8;
  const candidateMoves = rankCandidateMoves(
    state,
    validIndices,
    currentMover,
    otherMover,
    branchLimit
  );

  // Prioritize TT move if present
  if (cached && candidateMoves.includes(cached.bestMove)) {
    const idx = candidateMoves.indexOf(cached.bestMove);
    candidateMoves.splice(idx, 1);
    candidateMoves.unshift(cached.bestMove);
  }

  const alphaOrig = alpha;
  const betaOrig = beta;
  let bestMove = candidateMoves[0];

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    for (const moveIdx of candidateMoves) {
      const { row, col } = toCoord(moveIdx);
      const nextState = makeMove(state, row, col);
      const evaluation = alphaBeta(
        nextState,
        depth - 1,
        alpha,
        beta,
        false,
        aiPlayer,
        oppPlayer,
        tt,
        startTime,
        timeBudgetMs
      );

      if (evaluation > maxEval) {
        maxEval = evaluation;
        bestMove = moveIdx;
      }
      if (evaluation > alpha) {
        alpha = evaluation;
      }
      if (beta <= alpha) {
        break; // Beta cutoff
      }
    }

    if (tt.size < 30000 && performance.now() - startTime <= timeBudgetMs) {
      const flag: TTEntry['flag'] =
        maxEval <= alphaOrig ? 'upper' : maxEval >= betaOrig ? 'lower' : 'exact';
      tt.set(hash, { depth, score: maxEval, flag, bestMove });
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const moveIdx of candidateMoves) {
      const { row, col } = toCoord(moveIdx);
      const nextState = makeMove(state, row, col);
      const evaluation = alphaBeta(
        nextState,
        depth - 1,
        alpha,
        beta,
        true,
        aiPlayer,
        oppPlayer,
        tt,
        startTime,
        timeBudgetMs
      );

      if (evaluation < minEval) {
        minEval = evaluation;
        bestMove = moveIdx;
      }
      if (evaluation < beta) {
        beta = evaluation;
      }
      if (beta <= alpha) {
        break; // Alpha cutoff
      }
    }

    if (tt.size < 30000 && performance.now() - startTime <= timeBudgetMs) {
      const flag: TTEntry['flag'] =
        minEval <= alphaOrig ? 'upper' : minEval >= betaOrig ? 'lower' : 'exact';
      tt.set(hash, { depth, score: minEval, flag, bestMove });
    }
    return minEval;
  }
}

/**
 * Ranks legal moves by tactical urgency so Alpha-Beta searches the strongest moves first.
 */
function rankCandidateMoves(
  state: GameState,
  validIndices: number[],
  mover: Player,
  opponent: Player,
  maxCandidates: number
): number[] {
  const { ruleMode, scoringMode } = state.config;
  const scored: Array<{ idx: number; priority: number }> = [];

  for (let i = 0; i < validIndices.length; i++) {
    const idx = validIndices[i];
    let priority = 0;

    // 1. Immediate points for mover
    const moverPts = countImmediateTrincasForMove(
      state.board,
      idx,
      mover,
      ruleMode,
      state.formedTrincaIds
    );
    if (moverPts > 0) {
      if (
        scoringMode === 'eight_points' &&
        state.scores[mover] + moverPts >= TARGET_SCORE_EIGHT
      ) {
        priority += 500_000;
      } else {
        priority += moverPts * 15_000;
      }
    }

    // 2. Blocking immediate points for opponent
    const oppCanPlay = !(opponent === 'red' && isCenterIndex(idx));
    if (oppCanPlay) {
      const oppPts = countImmediateTrincasForMove(
        state.board,
        idx,
        opponent,
        ruleMode,
        state.formedTrincaIds
      );
      if (oppPts > 0) {
        if (
          scoringMode === 'eight_points' &&
          state.scores[opponent] + oppPts >= TARGET_SCORE_EIGHT
        ) {
          priority += 350_000;
        } else {
          priority += oppPts * 12_000;
        }
      }
    }

    // 3. Positional & threat creation value
    priority +=
      evaluateCellPositionalPotential(
        state.board,
        idx,
        mover,
        opponent,
        ruleMode,
        state.formedTrincaIds
      ) * 10;

    // 4. Connectivity & Center control
    if (mover === 'blue' && isCenterIndex(idx)) {
      priority += idx === 40 ? 280 : 160;
    } else if (mover === 'red') {
      // Red values the inner ring (rows/cols 2 and 6) that borders the 3x3 center
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      if (r >= 2 && r <= 6 && c >= 2 && c <= 6) {
        priority += 110;
      }
    }

    priority += LINES_BY_CELL[idx].length * 8;

    scored.push({ idx, priority });
  }

  scored.sort((a, b) => b.priority - a.priority);
  return scored.slice(0, maxCandidates).map((s) => s.idx);
}

/**
 * Comprehensive heuristic evaluation of a board state from `aiPlayer`'s perspective.
 * Respects both Regular and Adjacent rules, Red's center restriction, and 8-points vs Free mode.
 */
export function evaluateBoardState(
  state: GameState,
  aiPlayer: Player,
  oppPlayer: Player
): number {
  const { ruleMode, scoringMode } = state.config;
  const aiScore = state.scores[aiPlayer];
  const oppScore = state.scores[oppPlayer];

  // 1. Base Score Differential (Penalize opponent points more steeply so AI blocks instead of trading 1-for-1)
  let totalEval = aiScore * 3000 - oppScore * 3800;

  if (scoringMode === 'eight_points') {
    // Exponential pressure as a player approaches 8 points
    totalEval += aiScore * aiScore * 120;
    totalEval -= oppScore * oppScore * 160;
  }

  // Track empty cells that would immediately complete a valid trinca for AI or Opponent
  const aiThreatEmptyCells = new Map<number, number>(); // cellIndex -> number of trincas completed
  const oppThreatEmptyCells = new Map<number, number>();
  let aiUnblockableCenterThreats = 0;
  let oppUnblockableCenterThreats = 0;

  let aiPotentialLines = 0;
  let oppPotentialLines = 0;

  // 2. Scan all 224 possible 3-cell lines
  for (let i = 0; i < ALL_TRINCA_LINES.length; i++) {
    const line = ALL_TRINCA_LINES[i];
    if (state.formedTrincaIds[line.id]) continue;

    const [i0, i1, i2] = line.indices;
    const c0 = state.board[i0];
    const c1 = state.board[i1];
    const c2 = state.board[i2];

    let aiCount = 0;
    let oppCount = 0;
    let emptyIdx = -1;
    let usedCount = 0;
    let hasCenterEmpty = false;

    if (c0.owner === aiPlayer) {
      aiCount++;
      if (c0.inTrinca) usedCount++;
    } else if (c0.owner === oppPlayer) {
      oppCount++;
      if (c0.inTrinca) usedCount++;
    } else {
      emptyIdx = i0;
      if (isCenterIndex(i0)) hasCenterEmpty = true;
    }

    if (c1.owner === aiPlayer) {
      aiCount++;
      if (c1.inTrinca) usedCount++;
    } else if (c1.owner === oppPlayer) {
      oppCount++;
      if (c1.inTrinca) usedCount++;
    } else {
      emptyIdx = i1;
      if (isCenterIndex(i1)) hasCenterEmpty = true;
    }

    if (c2.owner === aiPlayer) {
      aiCount++;
      if (c2.inTrinca) usedCount++;
    } else if (c2.owner === oppPlayer) {
      oppCount++;
      if (c2.inTrinca) usedCount++;
    } else {
      emptyIdx = i2;
      if (isCenterIndex(i2)) hasCenterEmpty = true;
    }

    // Ignore contested lines (contain both Red and Blue pieces)
    if (aiCount > 0 && oppCount > 0) continue;

    const validUnderRule =
      ruleMode === 'regular' ? usedCount === 0 : usedCount <= 1;
    if (!validUnderRule) continue;

    // Evaluate AI-owned partial lines
    if (aiCount > 0) {
      const aiCanFillEmpty = !(aiPlayer === 'red' && hasCenterEmpty);
      if (!aiCanFillEmpty) continue;

      if (aiCount === 2 && emptyIdx !== -1) {
        // Live 2-in-a-row threat!
        aiThreatEmptyCells.set(
          emptyIdx,
          (aiThreatEmptyCells.get(emptyIdx) ?? 0) + 1
        );
        // If AI is Blue and the empty completion cell is in the 3x3 center, Red can NEVER block it!
        if (aiPlayer === 'blue' && isCenterIndex(emptyIdx)) {
          aiUnblockableCenterThreats++;
        }
      } else if (aiCount === 1) {
        aiPotentialLines += ruleMode === 'adjacent' && usedCount === 1 ? 2 : 1;
      }
    }

    // Evaluate Opponent-owned partial lines
    if (oppCount > 0) {
      const oppCanFillEmpty = !(oppPlayer === 'red' && hasCenterEmpty);
      if (!oppCanFillEmpty) continue;

      if (oppCount === 2 && emptyIdx !== -1) {
        oppThreatEmptyCells.set(
          emptyIdx,
          (oppThreatEmptyCells.get(emptyIdx) ?? 0) + 1
        );
        if (oppPlayer === 'blue' && isCenterIndex(emptyIdx)) {
          oppUnblockableCenterThreats++;
        }
      } else if (oppCount === 1) {
        oppPotentialLines += ruleMode === 'adjacent' && usedCount === 1 ? 2 : 1;
      }
    }
  }

  // 3. Score Threats, Forks, and Turn Initiative (Tempo-consistent valuation)
  // A banked trinca is 3000 pts. A threat on the mover's turn still costs 1 full move (tempo)
  // to cash in, so its value is ~1950 pts per trinca completed on that move.
  const isAITurn = state.currentPlayer === aiPlayer;

  let maxAISingleMovePts = 0;
  for (const pts of aiThreatEmptyCells.values()) {
    if (pts > maxAISingleMovePts) maxAISingleMovePts = pts;
  }

  let maxOppSingleMovePts = 0;
  for (const pts of oppThreatEmptyCells.values()) {
    if (pts > maxOppSingleMovePts) maxOppSingleMovePts = pts;
  }

  if (isAITurn) {
    // AI moves next: AI can immediately cash in its best threat cell
    if (maxAISingleMovePts > 0) {
      totalEval += maxAISingleMovePts * 1950;
      if (aiThreatEmptyCells.size >= 2) {
        totalEval += 350;
      }
    }
    // Evaluate Opponent's threats waiting after AI moves:
    // If Opponent has >= 2 threat cells (fork) or an unblockable center threat, AI cannot block all of them
    if (oppUnblockableCenterThreats > 0 || oppThreatEmptyCells.size >= 2) {
      totalEval -= Math.max(1, maxOppSingleMovePts) * 1650;
    } else if (oppThreatEmptyCells.size === 1) {
      // Single threat: forces AI to spend its turn blocking unless AI has a better play
      totalEval -= maxOppSingleMovePts * 520;
    }
  } else {
    // Opponent moves next: Opponent can immediately cash in their best threat cell
    if (maxOppSingleMovePts > 0) {
      totalEval -= maxOppSingleMovePts * 2050;
      if (oppThreatEmptyCells.size >= 2) {
        totalEval -= 380;
      }
    }
    // Evaluate AI's threats waiting after Opponent moves:
    if (aiUnblockableCenterThreats > 0 || aiThreatEmptyCells.size >= 2) {
      totalEval += Math.max(1, maxAISingleMovePts) * 1600;
    } else if (aiThreatEmptyCells.size === 1) {
      totalEval += maxAISingleMovePts * 480;
    }
  }

  // Positional potential lines (1-in-a-row open lines)
  totalEval += (aiPotentialLines - oppPotentialLines) * 28;

  return totalEval;
}
