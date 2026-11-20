import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Mountain, Target, Trophy } from 'lucide-react';
import { subscribeToWorldLeaderboard } from '../account/accountService';
import { useAuth } from '../account/AuthContext';
import { LeaderboardEntry } from '../account/types';
import { soundEngine } from '../audio/soundEngine';
import { CustomizationSettings } from '../core/types';
import { BadgeEmblem } from './BadgeEmblem';
import { PlayerAvatar } from './PlayerAvatar';

interface WorldRankSectionProps {
  customization: CustomizationSettings;
  onOpenAuth: () => void;
}

const DEFAULT_PAGE_LIMIT = 30;

/**
 * Wakfu-style flat-shaded rank shield for Top 3 positions (Gold / Silver / Bronze)
 */
const TopRankMedal: React.FC<{ rank: 1 | 2 | 3 }> = ({ rank }) => {
  const palette =
    rank === 1
      ? { main: '#F59E0B', shade: '#B45309', light: '#FEF3C7' }
      : rank === 2
      ? { main: '#94A3B8', shade: '#475569', light: '#F1F5F9' }
      : { main: '#D97706', shade: '#92400E', light: '#FDE68A' };

  return (
    <span className="inline-flex items-center justify-center w-7 h-7 shrink-0">
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]"
        aria-label={`Posição #${rank}`}
      >
        <path
          d="M16 2 L28 7.5 V16.2 C28 22.8 22.8 27.6 16 30 C9.2 27.6 4 22.8 4 16.2 V7.5 Z"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M16 3.8 L26.5 8.5 V16.1 C26.5 21.8 21.9 26.2 16 28.3 C10.1 26.2 5.5 21.8 5.5 16.1 V8.5 Z"
          fill={palette.main}
        />
        <path
          d="M16 3.8 L26.5 8.5 V16.1 C26.5 21.8 21.9 26.2 16 28.3 Z"
          fill={palette.shade}
          opacity="0.28"
        />
        <text
          x="16"
          y="20"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="12"
          fontWeight="900"
          fontFamily="Fredoka, Nunito, sans-serif"
        >
          {rank}
        </text>
      </svg>
    </span>
  );
};

export const WorldRankSection: React.FC<WorldRankSectionProps> = ({
  customization,
  onOpenAuth,
}) => {
  const { profile, isLoggedIn } = useAuth();
  const [entriesDesc, setEntriesDesc] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(DEFAULT_PAGE_LIMIT);

  const summitRef = useRef<HTMLDivElement | null>(null);
  const myRowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToWorldLeaderboard(limitCount, (list) => {
      setEntriesDesc(list);
      setLoading(false);
    });
    return () => unsub();
  }, [limitCount]);

  // Official ranks (1 = highest points), arranged BOTTOM-TO-TOP climbing upward toward #1 at the summit
  const climbingRows = useMemo(() => {
    const withRanks = entriesDesc.map((entry, idx) => ({
      ...entry,
      rank: idx + 1,
    }));
    // Reverse so lowest points sit at the base and the climb ascends to #3, #2, #1 at the top!
    return [...withRanks].reverse();
  }, [entriesDesc]);

  const myRankEntry = useMemo(
    () =>
      profile
        ? climbingRows.find((e) => e.uid === profile.uid) ?? null
        : null,
    [climbingRows, profile]
  );

  const { darkMode, accentColor, blueColor } = customization;

  const cardSurface = darkMode
    ? 'bg-[#1E2336] border-[#2E3652] text-slate-100 shadow-[0_8px_0_#101320]'
    : 'bg-white border-[#E2D9C8] text-slate-800 shadow-[0_8px_0_#D5CBB8]';

  const scrollToSummit = () => {
    soundEngine.playMenuClick();
    summitRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToMyPosition = () => {
    soundEngine.playMenuClick();
    myRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section
      aria-labelledby="world-rank-heading"
      className={`p-5 sm:p-6 rounded-3xl border-2 ${cardSurface}`}
    >
      {/* Clean Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white border-2 border-b-4 border-amber-700 shrink-0 shadow-sm"
            style={{ backgroundColor: '#F59E0B' }}
          >
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <h2
              id="world-rank-heading"
              className="text-base sm:text-lg font-black font-display leading-tight"
            >
              Rank Mundial
            </h2>
            <p className="text-xs font-semibold opacity-65">
              Escalada de baixo para cima rumo ao topo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToSummit}
            className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 flex items-center gap-1.5 ${
              darkMode
                ? 'bg-[#262D47] border-[#384266] text-amber-300 hover:bg-[#2E3656]'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100/70'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Topo (#1)</span>
          </button>

          {myRankEntry && (
            <button
              type="button"
              onClick={scrollToMyPosition}
              className="px-3 py-1.5 rounded-xl font-black text-xs text-white border-2 border-b-4 transition-all hover:brightness-105 active:translate-y-0.5 active:border-b-2 flex items-center gap-1.5"
              style={{
                backgroundColor: accentColor,
                borderColor: 'rgba(0,0,0,0.25)',
              }}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Minha Posição (#{myRankEntry.rank})</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs font-bold opacity-60">
          Carregando classificação mundial...
        </div>
      ) : climbingRows.length === 0 ? (
        <div className="py-7 text-center">
          <p className="text-sm font-black font-display">
            O topo do Rank Mundial está aberto!
          </p>
          <p className="text-xs font-semibold opacity-65 mt-1">
            Entre na sua conta e dispute partidas Ranqueadas Online para estrear
            na classificação.
          </p>
          {!isLoggedIn && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="mt-3 px-4 py-2 rounded-xl font-black text-xs text-white border-2 border-b-4 transition-all active:translate-y-0.5"
              style={{
                backgroundColor: accentColor,
                borderColor: 'rgba(0,0,0,0.25)',
              }}
            >
              Entrar e Competir
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {/* Subtle Climb Direction Guide */}
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider opacity-50 px-2">
            <span>Base da Escalada</span>
            <span>Rumo ao #1 Mundial ↓</span>
          </div>

          {/* Slim, Sleek Thin-List Container */}
          <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto pr-1">
            {climbingRows.map((entry) => {
              const isMe = profile?.uid === entry.uid;
              const isTop1 = entry.rank === 1;
              const isTop2 = entry.rank === 2;
              const isTop3 = entry.rank === 3;

              let rowStyle: React.CSSProperties | undefined;
              let rowSurfaceClass = darkMode
                ? 'bg-[#232A42] border-[#313B5C]'
                : 'bg-[#FAF7F2] border-[#E6DFCE]';

              if (isTop1) {
                rowSurfaceClass = darkMode
                  ? 'bg-amber-500/15 border-amber-400/70'
                  : 'bg-amber-50/90 border-amber-400';
              } else if (isTop2) {
                rowSurfaceClass = darkMode
                  ? 'bg-slate-400/15 border-slate-400/60'
                  : 'bg-slate-100/90 border-slate-300';
              } else if (isTop3) {
                rowSurfaceClass = darkMode
                  ? 'bg-orange-500/15 border-amber-600/60'
                  : 'bg-orange-50/80 border-amber-500/70';
              }

              if (isMe) {
                rowStyle = {
                  borderColor: accentColor,
                  boxShadow: `inset 3px 0 0 ${accentColor}`,
                };
              }

              return (
                <div
                  key={entry.uid}
                  ref={(el) => {
                    if (isTop1) summitRef.current = el;
                    if (isMe) myRowRef.current = el;
                  }}
                  className={`group px-3 py-1.5 rounded-xl border-2 flex items-center justify-between gap-2.5 transition-all hover:brightness-[1.02] ${rowSurfaceClass}`}
                  style={rowStyle}
                >
                  {/* [Posição] | [Avatar pequeno] | [Nome + Mini Emblema SVG] */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isTop1 || isTop2 || isTop3 ? (
                      <TopRankMedal rank={entry.rank as 1 | 2 | 3} />
                    ) : (
                      <span className="w-7 text-center font-mono font-black text-xs opacity-60 shrink-0">
                        #{entry.rank}
                      </span>
                    )}

                    <PlayerAvatar
                      src={entry.avatar}
                      name={entry.username}
                      size="xs"
                      borderColor={
                        isTop1
                          ? '#F59E0B'
                          : isTop2
                          ? '#94A3B8'
                          : isTop3
                          ? '#D97706'
                          : isMe
                          ? accentColor
                          : undefined
                      }
                      className="!rounded-lg"
                    />

                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-xs sm:text-sm truncate">
                        {entry.username}
                      </span>

                      <BadgeEmblem
                        badgeId={entry.equippedBadge}
                        size="xs"
                        className="!w-4 !h-4"
                      />

                      {isMe && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white shrink-0"
                          style={{ backgroundColor: accentColor }}
                        >
                          Você
                        </span>
                      )}
                    </div>
                  </div>

                  {/* [Pontos alinhados à direita] */}
                  <div className="flex items-center gap-1 font-black text-xs sm:text-sm text-amber-500 shrink-0 tabular-nums">
                    <Trophy className="w-3.5 h-3.5 shrink-0" />
                    <span>{entry.points}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More & Own Position Fallback */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 px-1">
            {climbingRows.length >= limitCount ? (
              <button
                type="button"
                onClick={() => setLimitCount((prev) => prev + 25)}
                className="text-xs font-extrabold opacity-70 hover:opacity-100 underline"
              >
                Carregar mais jogadores
              </button>
            ) : (
              <span className="text-[11px] font-bold opacity-50">
                {climbingRows.length}{' '}
                {climbingRows.length === 1
                  ? 'jogador classificado'
                  : 'jogadores classificados'}
              </span>
            )}

            {isLoggedIn && profile && !myRankEntry && (
              <span
                className="text-xs font-extrabold"
                style={{ color: blueColor }}
              >
                Sua pontuação atual: {profile.points} pts
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
