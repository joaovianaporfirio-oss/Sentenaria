import React from 'react';
import {
  AlertTriangle,
  LogIn,
  Moon,
  Sun,
  Trophy,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useAuth } from '../account/AuthContext';
import { soundEngine } from '../audio/soundEngine';
import { AudioSettings, CustomizationSettings } from '../core/types';
import { BadgePill } from './BadgeEmblem';
import { PlayerAvatar } from './PlayerAvatar';

interface TopPlayerHudProps {
  customization: CustomizationSettings;
  audioSettings: AudioSettings;
  onOpenAuth: () => void;
  onOpenProfile: (initialTab?: 'profile' | 'badges' | 'friends') => void;
  onToggleDarkMode: () => void;
  onToggleSound: () => void;
}

export const TopPlayerHud: React.FC<TopPlayerHudProps> = ({
  customization,
  audioSettings,
  onOpenAuth,
  onOpenProfile,
  onToggleDarkMode,
  onToggleSound,
}) => {
  const {
    isLoggedIn,
    isEmailVerified,
    profile,
    pendingFriendRequests,
    authLoading,
  } = useAuth();
  const { darkMode, accentColor, blueColor } = customization;

  const hudSurface = darkMode
    ? 'bg-[#1E2336]/95 border-[#2E3652] text-slate-100 shadow-[0_5px_0_#101320]'
    : 'bg-white/95 border-[#E2D9C8] text-slate-800 shadow-[0_5px_0_#D5CBB8]';

  const tactileBtn = darkMode
    ? 'bg-[#262D47] border-[#384266] text-slate-100 hover:bg-[#2E3656]'
    : 'bg-white border-[#D8CEBE] text-slate-700 hover:bg-slate-50';

  const pendingCount = pendingFriendRequests.length;

  return (
    <div className="sticky top-2.5 z-30 w-full animate-spring-pop">
      <div
        className={`flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 rounded-2xl border-2 backdrop-blur-md ${hudSurface}`}
      >
        {/* Left: Compact Brawl-Stars-inspired Player Card */}
        <div className="flex items-center gap-2 min-w-0">
          {isLoggedIn && profile ? (
            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuClick();
                onOpenProfile('profile');
              }}
              className={`group flex items-center gap-2.5 pr-3 pl-1.5 py-1 rounded-xl border-2 border-b-4 transition-all hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 text-left ${
                darkMode
                  ? 'bg-[#262D47] border-[#384266] hover:bg-[#2E3656]'
                  : 'bg-[#FAF7F2] border-[#DDD3C0] hover:bg-[#F3EFE6]'
              }`}
            >
              <PlayerAvatar
                src={profile.avatar}
                name={profile.username}
                size="sm"
                borderColor={accentColor}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-sm font-display truncate max-w-[120px] sm:max-w-[165px]">
                    {profile.username}
                  </span>
                  <BadgePill badgeId={profile.equippedBadge} compact />
                </div>

                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-500 tabular-nums">
                    <Trophy className="w-3 h-3" />
                    {profile.points} pts
                  </span>
                  <span className="text-[10px] font-mono font-bold opacity-55">
                    {profile.accountId}
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              disabled={authLoading}
              onClick={() => {
                soundEngine.playMenuClick();
                onOpenAuth();
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-xs sm:text-sm text-white border-2 border-b-4 transition-all hover:brightness-105 active:translate-y-0.5 active:border-b-2 shadow-sm"
              style={{
                backgroundColor: accentColor,
                borderColor: 'rgba(0,0,0,0.25)',
              }}
            >
              <LogIn className="w-4 h-4" />
              <span>Entrar / Criar Conta</span>
            </button>
          )}

          {/* Unverified E-mail Quick Warning Pill */}
          {isLoggedIn && !isEmailVerified && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuClick();
                onOpenAuth();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-300 border-2 border-amber-500/40 hover:bg-amber-500/25 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Confirmar E-mail</span>
            </button>
          )}
        </div>

        {/* Right: Friends Button (with Notification Counter) + Theme & Sound Toggles */}
        <nav aria-label="Ações rápidas" className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuClick();
              if (isLoggedIn) {
                onOpenProfile('friends');
              } else {
                onOpenAuth();
              }
            }}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-extrabold text-xs sm:text-sm border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${tactileBtn}`}
          >
            <Users className="w-4 h-4" style={{ color: blueColor }} />
            <span className="hidden sm:inline">Amigos</span>
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-[#1E2336] shadow animate-bounce">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuClick();
              onToggleDarkMode();
            }}
            aria-label={darkMode ? 'Tema Claro' : 'Tema Escuro'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-extrabold text-xs sm:text-sm border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
              darkMode
                ? 'bg-[#262D47] border-[#384266] text-amber-300 hover:bg-[#2E3656]'
                : 'bg-white border-[#D8CEBE] text-slate-700 hover:bg-slate-50'
            }`}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4" />
                <span className="hidden md:inline">Tema Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span className="hidden md:inline">Tema Escuro</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={audioSettings.soundEnabled ? 'Desativar Som' : 'Ativar Som'}
            className={`p-2 rounded-xl border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${tactileBtn}`}
          >
            {audioSettings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-50" />
            )}
          </button>
        </nav>
      </div>
    </div>
  );
};
