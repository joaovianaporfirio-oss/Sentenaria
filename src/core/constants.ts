import { CellCoord, TrincaDirection, TrincaLineDefinition } from './types';

export const BOARD_SIZE = 9;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE; // 81
export const CENTER_MIN = 3;
export const CENTER_MAX = 5;
export const TARGET_SCORE_EIGHT = 8;

export function toIndex(row: number, col: number): number {
  return row * BOARD_SIZE + col;
}

export function toCoord(index: number): CellCoord {
  return {
    row: Math.floor(index / BOARD_SIZE),
    col: index % BOARD_SIZE,
  };
}

/**
 * Checks whether a cell at (row, col) is inside the 3x3 central region (rows 3..5, cols 3..5).
 * Rule: The Red player cannot place their FIRST move in this 9-cell central region.
 * From Red's second move onward, Red can access the central region normally.
 */
export function isCenterRegion(row: number, col: number): boolean {
  return row >= CENTER_MIN && row <= CENTER_MAX && col >= CENTER_MIN && col <= CENTER_MAX;
}

export function isCenterIndex(index: number): boolean {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  return isCenterRegion(row, col);
}

/**
 * Precomputes all 224 possible 3-in-a-row contiguous alignments on a 9x9 board.
 */
function buildAllTrincaLines(): {
  allLines: TrincaLineDefinition[];
  linesByCell: TrincaLineDefinition[][];
} {
  const allLines: TrincaLineDefinition[] = [];
  const linesByCell: TrincaLineDefinition[][] = Array.from({ length: TOTAL_CELLS }, () => []);

  const directions: Array<{ dr: number; dc: number; dir: TrincaDirection }> = [
    { dr: 0, dc: 1, dir: 'horizontal' },
    { dr: 1, dc: 0, dir: 'vertical' },
    { dr: 1, dc: 1, dir: 'diag_main' },
    { dr: 1, dc: -1, dir: 'diag_anti' },
  ];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (const { dr, dc, dir } of directions) {
        const r2 = r + dr * 2;
        const c2 = c + dc * 2;
        if (r2 >= 0 && r2 < BOARD_SIZE && c2 >= 0 && c2 < BOARD_SIZE) {
          const coords: [CellCoord, CellCoord, CellCoord] = [
            { row: r, col: c },
            { row: r + dr, col: c + dc },
            { row: r2, col: c2 },
          ];
          const indices: [number, number, number] = [
            toIndex(coords[0].row, coords[0].col),
            toIndex(coords[1].row, coords[1].col),
            toIndex(coords[2].row, coords[2].col),
          ];
          const id = `${indices[0]}-${indices[1]}-${indices[2]}`;
          const lineDef: TrincaLineDefinition = {
            id,
            indices,
            coords,
            direction: dir,
          };
          allLines.push(lineDef);
          for (const idx of indices) {
            linesByCell[idx].push(lineDef);
          }
        }
      }
    }
  }

  return { allLines, linesByCell };
}

const precomputed = buildAllTrincaLines();

export const ALL_TRINCA_LINES: readonly TrincaLineDefinition[] = precomputed.allLines;
export const LINES_BY_CELL: readonly (readonly TrincaLineDefinition[])[] = precomputed.linesByCell;

export const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
export const ROW_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export function formatCoordLabel(row: number, col: number): string {
  return `${COL_LABELS[col]}${ROW_LABELS[row]}`;
}
