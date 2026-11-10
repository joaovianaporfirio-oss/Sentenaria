import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import {
  BOARD_SIZE,
  COL_LABELS,
  isCenterRegion,
  ROW_LABELS,
} from '../core/constants';
import { isValidMove } from '../core/gameEngine';
import {
  CellState,
  CustomizationSettings,
  FormedTrinca,
  MoveRecord,
  Player,
} from '../core/types';
import { PlayerSymbol } from './PlayerSymbol';

interface BoardViewProps {
  board: readonly CellState[];
  currentPlayer: Player;
  formedTrincas: readonly FormedTrinca[];
  lastMove: MoveRecord | null;
  customization: CustomizationSettings;
  disabled?: boolean;
  onCellClick: (row: number, col: number) => void;
  onInvalidCellClick?: (row: number, col: number) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  currentPlayer,
  formedTrincas,
  lastMove,
  customization,
  disabled = false,
  onCellClick,
  onInvalidCellClick,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [shakingCellIndex, setShakingCellIndex] = useState<number | null>(null);

  const {
    darkMode,
    redColor,
    blueColor,
    accentColor,
    boardStyle,
    symbolStyle,
    showCoordinates,
    showMoveHints,
    animationsEnabled,
  } = customization;

  const recentTrincaIds = new Set(
    lastMove?.trincasFormed.map((t) => t.id) ?? []
  );

  const handleCellPress = (cell: CellState) => {
    if (disabled) return;

    const valid = isValidMove(board, cell.row, cell.col, currentPlayer);
    if (!valid) {
      setShakingCellIndex(cell.index);
      setTimeout(() => {
        setShakingCellIndex((prev) => (prev === cell.index ? null : prev));
      }, 420);
      onInvalidCellClick?.(cell.row, cell.col);
      return;
    }

    onCellClick(cell.row, cell.col);
  };

  // Board container surface styling based on boardStyle & darkMode
  const getBoardContainerStyle = (): string => {
    if (boardStyle === 'wood_table') {
      return darkMode
        ? 'bg-[#2B2118] border-[#4A3728] shadow-[0_10px_0_#1A130E,0_18px_35px_rgba(0,0,0,0.6)]'
        : 'bg-[#DFC39D] border-[#B8926A] shadow-[0_10px_0_#9C7750,0_18px_35px_rgba(90,60,30,0.22)]';
    }
    if (boardStyle === 'wii_gloss') {
      return darkMode
        ? 'bg-[#192236] border-[#2E3E5C] shadow-[0_10px_0_#0F1523,0_20px_40px_rgba(0,0,0,0.55)]'
        : 'bg-white/95 border-[#D0E2F2] shadow-[0_10px_0_#B8D0E8,0_20px_40px_rgba(0,110,180,0.12)]';
    }
    if (boardStyle === 'minimal_grid') {
      return darkMode
        ? 'bg-[#141824] border-[#2A3045] shadow-[0_8px_0_#0B0E17]'
        : 'bg-white border-slate-300 shadow-[0_8px_0_#CBD5E1]';
    }
    // paper_craft default
    return darkMode
      ? 'bg-[#1D2235] border-[#323B59] shadow-[0_10px_0_#111522,0_16px_32px_rgba(0,0,0,0.5)]'
      : 'bg-[#FAF6F0] border-[#E2D9C8] shadow-[0_10px_0_#D0C4B0,0_16px_32px_rgba(60,45,25,0.12)]';
  };

  // Individual cell styling
  const getCellClasses = (
    cell: CellState,
    inCenter: boolean,
    isLastPlaced: boolean,
    isValid: boolean
  ): string => {
    const base =
      'relative aspect-square flex items-center justify-center transition-all duration-150 select-none overflow-hidden ';

    const radius =
      boardStyle === 'minimal_grid'
        ? 'rounded-md'
        : boardStyle === 'wii_gloss'
        ? 'rounded-xl sm:rounded-2xl'
        : 'rounded-lg sm:rounded-xl';

    let surface = '';

    if (boardStyle === 'wood_table') {
      if (inCenter) {
        surface = darkMode
          ? 'bg-[#3B2B1E] border border-[#5C432F]'
          : 'bg-[#CDA87E] border border-[#AC8357]';
      } else {
        surface = darkMode
          ? 'bg-[#33261B] border border-[#473526]'
          : 'bg-[#EFE0C9] border border-[#D4B996]';
      }
    } else if (boardStyle === 'wii_gloss') {
      if (inCenter) {
        surface = darkMode
          ? 'bg-[#22304C] border border-[#3B5280]'
          : 'bg-[#E6F4FC] border border-[#BAE0F7]';
      } else {
        surface = darkMode
          ? 'bg-[#1E2942] border border-[#2C3B5E]'
          : 'bg-[#F4F9FD] border border-[#DCEBF7]';
      }
    } else if (boardStyle === 'minimal_grid') {
      if (inCenter) {
        surface = darkMode
          ? 'bg-[#1F263B] border border-[#374366]'
          : 'bg-slate-100 border border-slate-300';
      } else {
        surface = darkMode
          ? 'bg-[#181D2E] border border-[#262E47]'
          : 'bg-white border border-slate-200';
      }
    } else {
      // paper_craft
      if (inCenter) {
        surface = darkMode
          ? 'bg-[#262D47] border-2 border-dashed border-[#434F7A]'
          : 'bg-[#F1E8D8] border-2 border-dashed border-[#CBBBA0]';
      } else {
        surface = darkMode
          ? 'bg-[#232940] border border-[#333C5C] shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)]'
          : 'bg-white border border-[#E5DEC9] shadow-[0_2px_0_#E2D9C5]';
      }
    }

    const interaction = disabled
      ? 'cursor-default'
      : isValid
      ? 'cursor-pointer hover:-translate-y-[1px] active:translate-y-[1px]'
      : cell.owner === null && currentPlayer === 'red' && inCenter
      ? 'cursor-not-allowed'
      : 'cursor-default';

    const shake =
      shakingCellIndex === cell.index ? 'animate-shake ring-2 ring-red-500' : '';

    const lastMoveRing = isLastPlaced
      ? 'ring-2 ring-offset-1 ring-amber-400'
      : '';

    return `${base} ${radius} ${surface} ${interaction} ${shake} ${lastMoveRing}`;
  };

  return (
    <div className="w-full max-w-[560px] mx-auto flex flex-col items-center">
      {/* Column coordinate header */}
      {showCoordinates && (
        <div
          className={`w-full grid grid-cols-9 px-3 sm:px-4 mb-1 text-[10px] sm:text-xs font-extrabold tracking-wider text-center opacity-60 ${
            darkMode ? 'text-slate-300' : 'text-slate-600'
          }`}
          style={{ paddingLeft: showCoordinates ? '1.75rem' : undefined }}
        >
          {COL_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
      )}

      <div className="w-full flex items-center">
        {/* Row coordinate sidebar */}
        {showCoordinates && (
          <div
            className={`flex flex-col justify-around pr-1.5 sm:pr-2 text-[10px] sm:text-xs font-extrabold opacity-60 select-none ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}
            style={{ height: '100%' }}
          >
            {ROW_LABELS.map((label) => (
              <div
                key={label}
                className="h-7 sm:h-11 flex items-center justify-center"
              >
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Main 9x9 Board Frame */}
        <div
          className={`relative flex-1 aspect-square p-2 sm:p-3.5 rounded-2xl sm:rounded-3xl border-4 transition-colors duration-300 ${getBoardContainerStyle()}`}
        >
          {/* Central 3x3 Region Highlight Frame Overlay */}
          <div
            className="pointer-events-none absolute z-10 rounded-xl sm:rounded-2xl transition-all duration-300"
            style={{
              left: 'calc(33.333% + 2px)',
              top: 'calc(33.333% + 2px)',
              width: 'calc(33.333% - 4px)',
              height: 'calc(33.333% - 4px)',
              border:
                currentPlayer === 'red'
                  ? `2px dashed ${redColor}66`
                  : `2px dashed ${blueColor}88`,
              boxShadow:
                currentPlayer === 'blue'
                  ? `inset 0 0 18px ${blueColor}18`
                  : `inset 0 0 14px ${redColor}12`,
            }}
          />

          {/* 9x9 Grid of Cells */}
          <div className="relative z-10 w-full h-full grid grid-cols-9 grid-rows-9 gap-1 sm:gap-1.5">
            {board.map((cell) => {
              const inCenter = isCenterRegion(cell.row, cell.col);
              const isValid =
                !disabled &&
                isValidMove(board, cell.row, cell.col, currentPlayer);
              const isHovered = hoveredIndex === cell.index;
              const isLastPlaced = lastMove?.index === cell.index;
              const isRedBlockedCenter =
                cell.owner === null && inCenter && currentPlayer === 'red';

              const pieceColor =
                cell.owner === 'red'
                  ? redColor
                  : cell.owner === 'blue'
                  ? blueColor
                  : currentPlayer === 'red'
                  ? redColor
                  : blueColor;

              return (
                <button
                  key={cell.index}
                  type="button"
                  aria-label={`Casa ${COL_LABELS[cell.col]}${
                    ROW_LABELS[cell.row]
                  }${inCenter ? ' (Região Central)' : ''}`}
                  onClick={() => handleCellPress(cell)}
                  onMouseEnter={() => setHoveredIndex(cell.index)}
                  onMouseLeave={() =>
                    setHoveredIndex((prev) =>
                      prev === cell.index ? null : prev
                    )
                  }
                  className={getCellClasses(
                    cell,
                    inCenter,
                    isLastPlaced,
                    isValid
                  )}
                  style={{
                    backgroundColor: cell.inTrinca
                      ? cell.owner === 'red'
                        ? `${redColor}${darkMode ? '28' : '1C'}`
                        : `${blueColor}${darkMode ? '28' : '1C'}`
                      : undefined,
                    borderColor: cell.inTrinca
                      ? cell.owner === 'red'
                        ? `${redColor}88`
                        : `${blueColor}88`
                      : isHovered && isValid
                      ? accentColor
                      : undefined,
                  }}
                >
                  {/* Subtle restricted pattern for Red in empty 3x3 center cells */}
                  {isRedBlockedCenter && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Lock
                        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-opacity duration-150 ${
                          isHovered ? 'opacity-65 text-red-400 scale-110' : 'opacity-20 text-slate-400'
                        }`}
                      />
                    </div>
                  )}

                  {/* Subtle valid move dot hint if enabled */}
                  {showMoveHints &&
                    cell.owner === null &&
                    isValid &&
                    !isHovered &&
                    inCenter &&
                    currentPlayer === 'blue' && (
                      <span
                        className="w-1.5 h-1.5 rounded-full opacity-35 pointer-events-none"
                        style={{ backgroundColor: blueColor }}
                      />
                    )}

                  {/* Hover ghost preview */}
                  {cell.owner === null && isHovered && isValid && (
                    <PlayerSymbol
                      player={currentPlayer}
                      symbolStyle={symbolStyle}
                      color={pieceColor}
                      isGhost={true}
                    />
                  )}

                  {/* Placed Symbol */}
                  {cell.owner !== null && (
                    <PlayerSymbol
                      player={cell.owner}
                      symbolStyle={symbolStyle}
                      color={pieceColor}
                      inTrinca={cell.inTrinca}
                      trincaCount={cell.trincaCount}
                      animateIn={animationsEnabled && isLastPlaced}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* SVG Overlay for Formed Trinca Lines */}
          <svg
            viewBox="0 0 900 900"
            className="pointer-events-none absolute inset-0 w-full h-full z-20 p-2 sm:p-3.5"
          >
            {formedTrincas.map((trinca) => {
              const start = trinca.coords[0];
              const end = trinca.coords[2];
              const x1 = start.col * 100 + 50;
              const y1 = start.row * 100 + 50;
              const x2 = end.col * 100 + 50;
              const y2 = end.row * 100 + 50;
              const strokeColor =
                trinca.player === 'red' ? redColor : blueColor;
              const isRecent = recentTrincaIds.has(trinca.id);

              return (
                <g key={trinca.id}>
                  {/* Outer glow / paper backing for the trinca line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#FFFFFF"
                    strokeWidth={isRecent ? 22 : 15}
                    strokeLinecap="round"
                    opacity={isRecent ? 0.92 : 0.7}
                  />
                  {/* Main colored trinca connector */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={isRecent ? 13 : 9}
                    strokeLinecap="round"
                    strokeDasharray={
                      trinca.reusedCellIndex !== null ? '18 10' : undefined
                    }
                    className={
                      animationsEnabled && isRecent ? 'animate-pulse' : ''
                    }
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend Bar under the Board */}
      <div
        className={`mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-bold ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded border-2 border-dashed inline-block"
            style={{
              borderColor: currentPlayer === 'red' ? redColor : blueColor,
            }}
          />
          <span>
            Centro 3×3:{' '}
            {currentPlayer === 'red' ? (
              <strong style={{ color: redColor }}>
                Bloqueado p/ Vermelho
              </strong>
            ) : (
              <strong style={{ color: blueColor }}>Liberado p/ Azul</strong>
            )}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-current opacity-60 inline-block" />
          <span>Linha contínua: Trinca nova</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 border-b-2 border-dashed border-current opacity-70 inline-block" />
          <span>Tracejada: Trinca adjacente</span>
        </div>
      </div>
    </div>
  );
};
