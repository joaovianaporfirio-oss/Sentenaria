import React from 'react';
import { Player, SymbolStyle } from '../core/types';

interface PlayerSymbolProps {
  player: Player;
  symbolStyle: SymbolStyle;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  inTrinca?: boolean;
  trincaCount?: number;
  isGhost?: boolean;
  animateIn?: boolean;
}

export const PlayerSymbol: React.FC<PlayerSymbolProps> = ({
  player,
  symbolStyle,
  color,
  size = 'md',
  inTrinca = false,
  trincaCount = 0,
  isGhost = false,
  animateIn = false,
}) => {
  const sizeClass =
    size === 'sm'
      ? 'w-5 h-5'
      : size === 'lg'
      ? 'w-10 h-10'
      : size === 'xl'
      ? 'w-12 h-12'
      : 'w-[74%] h-[74%]';

  return (
    <div
      className={`relative flex items-center justify-center select-none pointer-events-none ${sizeClass} ${
        animateIn ? 'animate-piece-pop' : ''
      } ${isGhost ? 'opacity-35 scale-90' : 'opacity-100'}`}
      style={{
        filter: isGhost
          ? 'none'
          : inTrinca
          ? `drop-shadow(0 2px 0 rgba(0,0,0,0.28)) drop-shadow(0 0 8px ${color}66)`
          : 'drop-shadow(0 2px 0 rgba(0,0,0,0.22))',
      }}
    >
      <svg
        viewBox="0 0 64 64"
        className="w-full h-full overflow-visible"
        aria-label={player === 'red' ? 'Símbolo Vermelho' : 'Símbolo Azul'}
      >
        {symbolStyle === 'classic_xo' &&
          (player === 'red' ? (
            <g>
              {/* Paper Mario white cutout sticker outline */}
              <path
                d="M16 16 L48 48 M48 16 L16 48"
                stroke="#FFFFFF"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d="M16 16 L48 48 M48 16 L16 48"
                stroke={color}
                strokeWidth="11"
                strokeLinecap="round"
              />
            </g>
          ) : (
            <g>
              <circle
                cx="32"
                cy="32"
                r="19"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="17"
              />
              <circle
                cx="32"
                cy="32"
                r="19"
                fill="none"
                stroke={color}
                strokeWidth="10.5"
              />
            </g>
          ))}

        {symbolStyle === 'paper_stamps' &&
          (player === 'red' ? (
            <g>
              {/* 4-point Origami Shuriken / Star */}
              <path
                d="M32 6 L41 23 L58 32 L41 41 L32 58 L23 41 L6 32 L23 23 Z"
                fill="#FFFFFF"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <path
                d="M32 8 L40 24 L56 32 L40 40 L32 56 L24 40 L8 32 L24 24 Z"
                fill={color}
                stroke={color}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="32" r="5" fill="#FFFFFF" />
            </g>
          ) : (
            <g>
              {/* Concentric Sun/Target Stamp */}
              <circle
                cx="32"
                cy="32"
                r="23"
                fill="#FFFFFF"
                stroke="#FFFFFF"
                strokeWidth="4"
              />
              <circle cx="32" cy="32" r="20" fill={color} />
              <circle cx="32" cy="32" r="11" fill="#FFFFFF" />
              <circle cx="32" cy="32" r="6" fill={color} />
            </g>
          ))}

        {symbolStyle === 'royal_emblems' &&
          (player === 'red' ? (
            <g>
              {/* Royal Crown Cutout */}
              <path
                d="M10 46 L14 20 L26 31 L32 15 L38 31 L50 20 L54 46 Z"
                fill="#FFFFFF"
                stroke="#FFFFFF"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              <path
                d="M11 45 L15 21 L26 32 L32 16 L38 32 L49 21 L53 45 Z"
                fill={color}
                stroke={color}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <circle cx="32" cy="38" r="3.5" fill="#FFFFFF" />
            </g>
          ) : (
            <g>
              {/* Guardian Shield Cutout */}
              <path
                d="M32 9 L51 17 V31 C51 44 42 52 32 56 C22 52 13 44 13 31 V17 Z"
                fill="#FFFFFF"
                stroke="#FFFFFF"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              <path
                d="M32 11 L49 18 V31 C49 42.5 41 50 32 54 C23 50 15 42.5 15 31 V18 Z"
                fill={color}
              />
              <path
                d="M32 19 L39 32 L32 45 L25 32 Z"
                fill="#FFFFFF"
                opacity="0.9"
              />
            </g>
          ))}

        {symbolStyle === 'geometric_runes' &&
          (player === 'red' ? (
            <g>
              {/* Tactical Plus / Cross Rune */}
              <path
                d="M25 11 H39 V25 H53 V39 H39 V53 H25 V39 H11 V25 H25 Z"
                fill="#FFFFFF"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinejoin="round"
              />
              <path
                d="M26 12 H38 V26 H52 V38 H38 V52 H26 V38 H12 V26 H26 Z"
                fill={color}
              />
            </g>
          ) : (
            <g>
              {/* Tactical Diamond Gem Rune */}
              <path
                d="M32 8 L56 32 L32 56 L8 32 Z"
                fill="#FFFFFF"
                stroke="#FFFFFF"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <path d="M32 11 L53 32 L32 53 L11 32 Z" fill={color} />
              <path
                d="M32 22 L42 32 L32 42 L22 32 Z"
                fill="#FFFFFF"
                opacity="0.92"
              />
            </g>
          ))}
      </svg>

      {/* Small indicator badge if this piece has been reused across multiple trincas (Modo Adjacente) */}
      {trincaCount > 1 && !isGhost && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white shadow-sm border border-white"
          style={{ backgroundColor: color }}
          title={`Participou de ${trincaCount} trincas`}
        >
          ×{trincaCount}
        </span>
      )}
    </div>
  );
};
