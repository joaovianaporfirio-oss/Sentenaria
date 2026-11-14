export type Player = 'red' | 'blue';

export type GameRuleMode = 'adjacent';

export type ScoringMode = 'eight_points' | 'free';

export type OpponentMode = 'pvp' | 'ai' | 'online';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export type TrincaDirection = 'horizontal' | 'vertical' | 'diag_main' | 'diag_anti';

/**
 * State of the one-time Pie Rule ("Roubo de Peça") balance mechanic:
 * - 'not_triggered': Before Red makes the 1st move of the match.
 * - 'pending': Immediately after Red's 1st move; Blue must choose 'continue' or 'steal' before any board move.
 * - 'continued': Blue chose to continue normally as Blue and immediately make their first Blue move.
 * - 'stolen': Blue chose to steal Red's 1st piece (converting its owner and visual color to Blue) and pass turn to Red.
 */
export type PieRuleState = 'not_triggered' | 'pending' | 'continued' | 'stolen';

export type PieRuleDecision = 'continue' | 'steal';

export interface CellCoord {
  row: number;
  col: number;
}

export interface CellState {
  row: number;
  col: number;
  index: number;
  /** Current owner of the piece for scoring and trinca formation ('red' | 'blue' | null) */
  owner: Player | null;
  /** Visual color of the piece rendered on the board ('red' | 'blue' | null) */
  visualColor?: Player | null;
  /** Player identity who originally placed this piece ('red' | 'blue' | null) */
  placedBy?: Player | null;
  /** Whether this piece had its ownership and visual color stolen by Blue via the Pie Rule */
  stolenByPieRule?: boolean;
  /** Whether this cell has already participated in at least one formed trinca */
  inTrinca: boolean;
  /** Count of trincas this cell participates in (can be > 1 in adjacent mode) */
  trincaCount: number;
  /** Turn number when the piece was placed */
  placedAtTurn: number | null;
}

export interface TrincaLineDefinition {
  id: string;
  indices: [number, number, number];
  coords: [CellCoord, CellCoord, CellCoord];
  direction: TrincaDirection;
}

export interface FormedTrinca {
  id: string;
  player: Player;
  indices: [number, number, number];
  coords: [CellCoord, CellCoord, CellCoord];
  direction: TrincaDirection;
  formedAtTurn: number;
  reusedCellIndex: number | null;
}

export interface MoveRecord {
  turnNumber: number;
  player: Player;
  row: number;
  col: number;
  index: number;
  trincasFormed: FormedTrinca[];
  pointsEarned: number;
  scoreAfter: {
    red: number;
    blue: number;
  };
  timestamp: number;
  /** True when this turn record represents Blue stealing the 1st piece via the Pie Rule */
  isPieSteal?: boolean;
}

export type GameStatus = 'playing' | 'finished';

export type EndReason =
  | 'target_score_reached'
  | 'board_full'
  | 'no_valid_moves_for_player'
  | null;

export interface GameConfig {
  ruleMode: GameRuleMode;
  scoringMode: ScoringMode;
  opponentMode: OpponentMode;
  aiDifficulty: AIDifficulty;
  aiPlayer: Player; // Typically 'blue' since 'red' always starts, or user can pick
}

export interface GameState {
  board: CellState[];
  currentPlayer: Player;
  turnCount: number;
  scores: {
    red: number;
    blue: number;
  };
  formedTrincas: FormedTrinca[];
  formedTrincaIds: Record<string, boolean>;
  lastMove: MoveRecord | null;
  moveHistory: MoveRecord[];
  status: GameStatus;
  winner: Player | 'draw' | null;
  endReason: EndReason;
  config: GameConfig;
  /** Current status of the one-time Pie Rule ("Roubo de Peça") mechanic */
  pieRuleState: PieRuleState;
  /** Board index (0..80) of the first piece placed by Red on Turn 1 */
  firstMoveIndex: number | null;
}

export type BoardStyle = 'paper_craft' | 'wii_gloss' | 'wood_table' | 'minimal_grid';

export type SymbolStyle = 'classic_xo' | 'paper_stamps' | 'royal_emblems' | 'geometric_runes';

export type ThemePresetId =
  | 'wii_plaza'
  | 'paper_kingdom'
  | 'duo_pop'
  | 'midnight_ink'
  | 'obsidian_neon'
  | 'custom';

export interface CustomizationSettings {
  presetId: ThemePresetId;
  darkMode: boolean;
  redColor: string;
  blueColor: string;
  accentColor: string;
  bgColorLight: string;
  bgColorDark: string;
  boardStyle: BoardStyle;
  symbolStyle: SymbolStyle;
  showCoordinates: boolean;
  showMoveHints: boolean;
  animationsEnabled: boolean;
}

export interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  masterVolume: number; // 0 to 1
}
