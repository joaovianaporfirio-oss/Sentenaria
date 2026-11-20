import React from 'react';
import { BadgeId, getBadgeById } from '../account/badges';

interface BadgeEmblemProps {
  badgeId: BadgeId | string | undefined | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  locked?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BadgeEmblemProps['size']>, string> = {
  xs: 'w-5 h-5',
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

/**
 * Wakfu-inspired flat-shaded tactical SVG medallion inside a Paper-Mario cutout shield.
 * Zero emojis — pure crisp geometric vectors with faceted highlight & shadow planes.
 */
export const BadgeEmblem: React.FC<BadgeEmblemProps> = ({
  badgeId,
  size = 'md',
  locked = false,
  className = '',
}) => {
  const badge = getBadgeById(badgeId);
  const fillMain = locked ? '#94A3B8' : badge.color;
  const fillShade = locked ? '#64748B' : badge.shadeColor;
  const fillLight = locked ? '#E2E8F0' : badge.accentLight;

  return (
    <span
      title={locked ? `${badge.name} (Bloqueado)` : badge.name}
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${SIZE_CLASSES[size]} ${className}`}
    >
      <svg
        viewBox="0 0 48 48"
        className="w-full h-full overflow-visible drop-shadow-[0_2px_0_rgba(0,0,0,0.22)]"
        aria-hidden="true"
      >
        {/* Outer Paper-Mario white sticker cutout */}
        <path
          d="M24 3 L41 10.5 V23.5 C41 34 33.5 41.2 24 45 C14.5 41.2 7 34 7 23.5 V10.5 Z"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Shield base (left bright plane + right Wakfu flat-shaded plane) */}
        <path
          d="M24 5.5 L39 12 V23.5 C39 32.6 32.4 39.2 24 42.5 C15.6 39.2 9 32.6 9 23.5 V12 Z"
          fill={fillMain}
        />
        <path
          d="M24 5.5 L39 12 V23.5 C39 32.6 32.4 39.2 24 42.5 Z"
          fill={fillShade}
          opacity="0.32"
        />
        {/* Crisp inner rim */}
        <path
          d="M24 8 L36.5 13.5 V23.2 C36.5 31 30.8 36.8 24 39.8 C17.2 36.8 11.5 31 11.5 23.2 V13.5 Z"
          fill="none"
          stroke={fillLight}
          strokeWidth="1.4"
          opacity="0.7"
        />

        {/* Bespoke Geometric Glyph per Badge */}
        {locked ? (
          /* Minimal Padlock Vector */
          <g>
            <path
              d="M19.5 22 V18.5 C19.5 16 21.5 14 24 14 C26.5 14 28.5 16 28.5 18.5 V22"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <rect
              x="16.5"
              y="21.5"
              width="15"
              height="11.5"
              rx="3"
              fill="#FFFFFF"
            />
            <circle cx="24" cy="27.2" r="2" fill={fillShade} />
          </g>
        ) : badge.id === 'pioneer' ? (
          /* Wakfu Compass Rose Star */
          <g>
            <path
              d="M24 11 L27.5 20.5 L37 24 L27.5 27.5 L24 37 L20.5 27.5 L11 24 L20.5 20.5 Z"
              fill="#FFFFFF"
            />
            <path
              d="M24 11 L27.5 20.5 L24 24 Z M37 24 L27.5 27.5 L24 24 Z M24 37 L20.5 27.5 L24 24 Z M11 24 L20.5 20.5 L24 24 Z"
              fill={fillLight}
            />
            <circle cx="24" cy="24" r="2.6" fill={fillShade} />
          </g>
        ) : badge.id === 'first_win' ? (
          /* Faceted Victory Chalice / Trophy */
          <g>
            <path
              d="M17 14 H31 V21 C31 24.8 27.9 27.8 24 27.8 C20.1 27.8 17 24.8 17 21 Z"
              fill="#FFFFFF"
            />
            <path
              d="M17 16 H13.5 C13.5 19.8 15 22 17.3 22.3 M31 16 H34.5 C34.5 19.8 33 22 30.7 22.3"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <rect x="22" y="27.2" width="4" height="4.5" fill="#FFFFFF" />
            <rect x="18" y="31.5" width="12" height="3.2" rx="1.4" fill={fillLight} />
          </g>
        ) : badge.id === 'streak_3' ? (
          /* Geometric Tactical Triple Flame */
          <g>
            <path
              d="M24.5 11 C28.5 16 32.5 19.5 32.5 25.2 C32.5 30.2 28.7 34.2 24 34.2 C19.3 34.2 15.5 30.2 15.5 25.2 C15.5 21.6 17.5 18.6 19.8 16.5 C19.6 19 20.8 20.4 22 20.4 C21.5 16.6 22.5 13.5 24.5 11 Z"
              fill="#FFFFFF"
            />
            <path
              d="M24 21.5 C26.2 24 27.6 25.8 27.6 28.2 C27.6 30.4 26 32 24 32 C22 32 20.4 30.4 20.4 28.2 C20.4 26 22 24 24 21.5 Z"
              fill={fillLight}
            />
          </g>
        ) : badge.id === 'veteran_10' ? (
          /* Crossed Tactical Blades */
          <g>
            <path
              d="M15 15 L19 14 L33 28 L30 31 L16 17 Z"
              fill="#FFFFFF"
            />
            <path
              d="M33 15 L29 14 L15 28 L18 31 L32 17 Z"
              fill={fillLight}
            />
            <rect
              x="14.5"
              y="29"
              width="6"
              height="2.6"
              rx="1"
              transform="rotate(-45 17.5 30.3)"
              fill="#FFFFFF"
            />
            <rect
              x="27.5"
              y="29"
              width="6"
              height="2.6"
              rx="1"
              transform="rotate(45 30.5 30.3)"
              fill="#FFFFFF"
            />
            <circle cx="24" cy="23.5" r="2.2" fill={fillShade} />
          </g>
        ) : badge.id === 'century_100' ? (
          /* Geometric Royal Crown */
          <g>
            <path
              d="M13 31 L15.5 17 L21.5 22.5 L24 14.5 L26.5 22.5 L32.5 17 L35 31 Z"
              fill="#FFFFFF"
              strokeLinejoin="round"
            />
            <rect x="13.5" y="31.5" width="21" height="3.2" rx="1.4" fill={fillLight} />
            <circle cx="24" cy="26.5" r="2" fill={fillShade} />
          </g>
        ) : (
          /* Top 10: Faceted Radiant Diamond Gem */
          <g>
            <path
              d="M24 11 L35 23.5 L24 36 L13 23.5 Z"
              fill="#FFFFFF"
            />
            <path
              d="M24 11 L35 23.5 L24 23.5 Z"
              fill={fillLight}
            />
            <path
              d="M24 17.5 L29 23.5 L24 29.5 L19 23.5 Z"
              fill={fillShade}
              opacity="0.35"
            />
          </g>
        )}
      </svg>
    </span>
  );
};

interface BadgePillProps {
  badgeId: BadgeId | string | undefined | null;
  compact?: boolean;
}

export const BadgePill: React.FC<BadgePillProps> = ({
  badgeId,
  compact = false,
}) => {
  const badge = getBadgeById(badgeId);
  return (
    <span
      title={`Emblema: ${badge.name}`}
      className={`inline-flex items-center gap-1 rounded-full font-black leading-none border shrink-0 select-none ${
        compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
      style={{
        backgroundColor: badge.bgTint,
        borderColor: `${badge.color}55`,
        color: badge.color,
      }}
    >
      <BadgeEmblem badgeId={badge.id} size="xs" className="!w-3.5 !h-3.5" />
      <span>{badge.name}</span>
    </span>
  );
};
