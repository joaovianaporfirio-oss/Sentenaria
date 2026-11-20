import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Radar, Swords, Trophy, X } from 'lucide-react';
import { useAuth } from '../account/AuthContext';
import { soundEngine } from '../audio/soundEngine';
import { CustomizationSettings } from '../core/types';
import {
  MatchFoundResult,
  startRankedMatchmaking,
} from '../online/matchmakingService';
import { BadgePill } from './BadgeEmblem';
import { ActiveOnlineSession } from './GameScreen';
import { PlayerAvatar } from './PlayerAvatar';

interface MatchmakingModalProps {
  customization: CustomizationSettings;
  onMatchReady: (session: ActiveOnlineSession) => void;
  onClose: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  customization,
  onMatchReady,
  onClose,
}) => {
  const { profile } = useAuth();
  const [elapsedSec, setElapsedSec] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<MatchFoundResult | null>(null);

  const cancelQueueRef = useRef<(() => void) | null>(null);
  const launchTimerRef = useRef<number | null>(null);
  const onMatchReadyRef = useRef(onMatchReady);

  useEffect(() => {
    onMatchReadyRef.current = onMatchReady;
  }, [onMatchReady]);

  useEffect(() => {
    if (!profile) return;

    const timer = window.setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);

    cancelQueueRef.current = startRankedMatchmaking(profile, {
      onMatchFound: (result) => {
        soundEngine.playTrincaFormed(2);
        setMatchResult(result);
        clearInterval(timer);

        // Show punchy Brawl-Stars-inspired "VS" splash for 1.8s before launching the match
        launchTimerRef.current = window.setTimeout(() => {
          onMatchReadyRef.current({
            roomData: result.roomData,
            playerId: profile.uid,
            playerName: profile.username,
            role: result.role,
            myColor: result.myColor,
          });
        }, 1850);
      },
      onError: (msg) => {
        soundEngine.playInvalidMove();
        setErrorMsg(msg);
        clearInterval(timer);
      },
    });

    return () => {
      clearInterval(timer);
      if (launchTimerRef.current !== null) {
        clearTimeout(launchTimerRef.current);
      }
      cancelQueueRef.current?.();
    };
  }, [profile?.uid]);

  const { darkMode, accentColor, redColor, blueColor } = customization;

  const modalSurface = darkMode
    ? 'bg-[#191E30] border-[#2E3654] text-slate-100'
    : 'bg-[#FAF8F5] border-[#DFD5C4] text-slate-800';

  const cardSurface = darkMode
    ? 'bg-[#222840] border-[#333C5E]'
    : 'bg-white border-[#E5DEC9]';

  const handleCancel = () => {
    soundEngine.playMenuSecondary();
    cancelQueueRef.current?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full max-w-lg rounded-3xl border-4 p-6 text-center shadow-2xl animate-spring-pop ${modalSurface}`}
      >
        {matchResult ? (
          /* PUNCHY "VS" TRANSITION SPLASH */
          <div className="py-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white mb-4 shadow"
              style={{ backgroundColor: accentColor }}
            >
              <Swords className="w-3.5 h-3.5" />
              Partida Ranqueada Encontrada
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
              {/* Player 1 (Me) */}
              <div
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center animate-slide-in-left ${cardSurface}`}
                style={{
                  borderColor:
                    matchResult.myColor === 'red' ? redColor : blueColor,
                }}
              >
                <PlayerAvatar
                  src={matchResult.me.avatar}
                  name={matchResult.me.username}
                  size="lg"
                  borderColor={
                    matchResult.myColor === 'red' ? redColor : blueColor
                  }
                />
                <div className="mt-2 font-black text-sm font-display truncate w-full">
                  {matchResult.me.username}
                </div>
                <div className="mt-1">
                  <BadgePill badgeId={matchResult.me.equippedBadge} compact />
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1 text-xs font-black text-amber-500">
                  <Trophy className="w-3.5 h-3.5" />
                  {matchResult.me.points} pts
                </div>
              </div>

              {/* VS Emblem */}
              <div className="flex flex-col items-center justify-center animate-vs-slam">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl font-display shadow-lg rotate-[-6deg] border-4 border-white dark:border-[#191E30]"
                  style={{ backgroundColor: redColor }}
                >
                  VS
                </div>
                <span className="mt-2 text-[11px] font-black uppercase tracking-widest opacity-65">
                  Preparando Tabuleiro...
                </span>
              </div>

              {/* Player 2 (Opponent) */}
              <div
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center animate-slide-in-right ${cardSurface}`}
                style={{
                  borderColor:
                    matchResult.myColor === 'red' ? blueColor : redColor,
                }}
              >
                <PlayerAvatar
                  src={matchResult.opponent.avatar}
                  name={matchResult.opponent.username}
                  size="lg"
                  borderColor={
                    matchResult.myColor === 'red' ? blueColor : redColor
                  }
                />
                <div className="mt-2 font-black text-sm font-display truncate w-full">
                  {matchResult.opponent.username}
                </div>
                <div className="mt-1">
                  <BadgePill
                    badgeId={matchResult.opponent.equippedBadge}
                    compact
                  />
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1 text-xs font-black text-amber-500">
                  <Trophy className="w-3.5 h-3.5" />
                  {matchResult.opponent.points} pts
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LIVE ANIMATED MATCHMAKING QUEUE */
          <div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                aria-label="Cancelar busca"
                className="p-2 rounded-xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5"
                style={{
                  backgroundColor: accentColor,
                  borderColor: 'rgba(0,0,0,0.25)',
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-24 h-24 mx-auto my-3 flex items-center justify-center">
              <span
                className="absolute inset-0 rounded-full border-4 animate-radar-ripple"
                style={{ borderColor: accentColor }}
              />
              <span
                className="absolute inset-2 rounded-full border-4 animate-radar-ripple"
                style={{ borderColor: blueColor, animationDelay: '0.5s' }}
              />
              <div
                className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{ backgroundColor: accentColor }}
              >
                <Radar className="w-8 h-8 animate-spin" />
              </div>
            </div>

            <h2 className="text-2xl font-black font-display">
              Procurando oponente...
            </h2>
            <p className="mt-1 text-xs sm:text-sm font-bold opacity-75">
              Partida <strong>Ranqueada Online</strong> • Disputa oficial pelo
              Rank Mundial
            </p>

            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-mono text-xs font-black">
              <span>Tempo na fila:</span>
              <span>
                {Math.floor(elapsedSec / 60)}:
                {String(elapsedSec % 60).padStart(2, '0')}
              </span>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-500 text-xs font-extrabold flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCancel}
              className={`mt-5 w-full py-3 px-5 rounded-2xl font-extrabold text-sm border-2 border-b-4 transition-all active:translate-y-0.5 ${
                darkMode
                  ? 'bg-[#262D47] border-[#384266] text-slate-200'
                  : 'bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              Cancelar Busca
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
