import React from 'react';
import {
  Award,
  BookOpen,
  Bot,
  Check,
  Crown,
  Flame,
  Globe,
  Infinity as InfinityIcon,
  Layers,
  Moon,
  Palette,
  Play,
  Settings,
  ShieldAlert,
  Sparkles,
  Sun,
  Target,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  AIDifficulty,
  AudioSettings,
  CustomizationSettings,
  GameConfig,
  GameRuleMode,
  OpponentMode,
  ScoringMode,
} from '../core/types';
import { PlayerStats } from '../settings/storageManager';
import { PlayerSymbol } from './PlayerSymbol';

interface MainMenuProps {
  config: GameConfig;
  customization: CustomizationSettings;
  audioSettings: AudioSettings;
  stats: PlayerStats;
  onUpdateConfig: (partial: Partial<GameConfig>) => void;
  onStartGame: () => void;
  onOpenCustomizer: () => void;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onToggleDarkMode: () => void;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  config,
  customization,
  audioSettings,
  stats,
  onUpdateConfig,
  onStartGame,
  onOpenCustomizer,
  onOpenSettings,
  onOpenRules,
  onToggleDarkMode,
  onToggleSound,
}) => {
  const { darkMode, redColor, blueColor, accentColor, symbolStyle } =
    customization;

  const cardSurface = darkMode
    ? 'bg-[#1E2336] border-[#2E3652] text-slate-100 shadow-[0_8px_0_#101320]'
    : 'bg-white border-[#E2D9C8] text-slate-800 shadow-[0_8px_0_#D5CBB8]';

  const selectOpponent = (opponentMode: OpponentMode) => {
    soundEngine.playMenuClick();
    onUpdateConfig({ opponentMode });
  };

  const selectRuleMode = (ruleMode: GameRuleMode) => {
    soundEngine.playMenuClick();
    onUpdateConfig({ ruleMode });
  };

  const selectScoringMode = (scoringMode: ScoringMode) => {
    soundEngine.playMenuClick();
    onUpdateConfig({ scoringMode });
  };

  const selectDifficulty = (aiDifficulty: AIDifficulty) => {
    soundEngine.playMenuClick();
    onUpdateConfig({ aiDifficulty });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 flex flex-col gap-6">
      {/* Top Bar: Brand Identity + Quick Theme/Sound Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Paper Cutout Logo Emblem */}
          <div
            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center rotate-[-3deg] ${cardSurface}`}
          >
            <div className="grid grid-cols-2 gap-1 p-2 w-full h-full items-center justify-items-center">
              <PlayerSymbol
                player="red"
                symbolStyle={symbolStyle}
                color={redColor}
                size="sm"
              />
              <PlayerSymbol
                player="blue"
                symbolStyle={symbolStyle}
                color={blueColor}
                size="sm"
              />
              <PlayerSymbol
                player="blue"
                symbolStyle={symbolStyle}
                color={blueColor}
                size="sm"
              />
              <PlayerSymbol
                player="red"
                symbolStyle={symbolStyle}
                color={redColor}
                size="sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
                SENTENARIA
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                9×9
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold opacity-70">
              Estratégia tática de trincas em 81 casas
            </p>
          </div>
        </div>

        {/* Quick Actions Pill Bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuClick();
              onToggleDarkMode();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-extrabold text-xs sm:text-sm border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
              darkMode
                ? 'bg-[#262D47] border-[#384266] text-amber-300 hover:bg-[#2E3656]'
                : 'bg-white border-[#D8CEBE] text-slate-700 hover:bg-slate-50'
            }`}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4" />
                <span>Tema Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" />
                <span>Tema Escuro</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={audioSettings.soundEnabled ? 'Desativar Som' : 'Ativar Som'}
            className={`p-2.5 rounded-2xl border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
              darkMode
                ? 'bg-[#262D47] border-[#384266] text-slate-200 hover:bg-[#2E3656]'
                : 'bg-white border-[#D8CEBE] text-slate-700 hover:bg-slate-50'
            }`}
          >
            {audioSettings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-50" />
            )}
          </button>
        </div>
      </div>

      {/* Main Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 8 Columns: Match Configuration Cards */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* STEP 1: Select Opponent Mode (PvP vs AI) */}
          <section className={`p-5 rounded-3xl border-2 ${cardSurface}`}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-6 h-6 rounded-full text-xs font-black text-white flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  1
                </span>
                <h2 className="text-base sm:text-lg font-black font-display">
                  Escolha o Adversário
                </h2>
              </div>
              <span className="text-xs font-bold opacity-60">
                Vermelho sempre começa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* PvP Card */}
              <button
                type="button"
                onClick={() => selectOpponent('pvp')}
                className={`text-left p-4 rounded-2xl border-2 border-b-4 transition-all relative ${
                  config.opponentMode === 'pvp'
                    ? darkMode
                      ? 'bg-[#27304D] border-sky-400'
                      : 'bg-sky-50/70 border-sky-500'
                    : darkMode
                    ? 'bg-[#232940] border-[#323B59] hover:bg-[#282F49]'
                    : 'bg-[#FAF7F2] border-[#E4DCCB] hover:bg-[#F3EFE6]'
                }`}
                style={
                  config.opponentMode === 'pvp'
                    ? { borderColor: accentColor }
                    : undefined
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: redColor }}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  {config.opponentMode === 'pvp' && (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-black text-sm sm:text-base font-display">
                  2 Jogadores (Local)
                </div>
                <p className="text-xs font-semibold opacity-75 mt-1">
                  Jogue localmente no mesmo dispositivo, alternando os turnos
                  entre Vermelho e Azul.
                </p>
              </button>

              {/* AI Card */}
              <button
                type="button"
                onClick={() => selectOpponent('ai')}
                className={`text-left p-4 rounded-2xl border-2 border-b-4 transition-all relative ${
                  config.opponentMode === 'ai'
                    ? darkMode
                      ? 'bg-[#27304D] border-sky-400'
                      : 'bg-sky-50/70 border-sky-500'
                    : darkMode
                    ? 'bg-[#232940] border-[#323B59] hover:bg-[#282F49]'
                    : 'bg-[#FAF7F2] border-[#E4DCCB] hover:bg-[#F3EFE6]'
                }`}
                style={
                  config.opponentMode === 'ai'
                    ? { borderColor: accentColor }
                    : undefined
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: blueColor }}
                  >
                    <Bot className="w-5 h-5" />
                  </div>
                  {config.opponentMode === 'ai' && (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="font-black text-sm sm:text-base font-display">
                  Contra a Máquina (IA)
                </div>
                <p className="text-xs font-semibold opacity-75 mt-1">
                  Desafie nossa inteligência artificial tática em três níveis de
                  dificuldade.
                </p>
              </button>

              {/* Online Multiplayer Card */}
              <button
                type="button"
                onClick={() => selectOpponent('online')}
                className={`text-left p-4 rounded-2xl border-2 border-b-4 transition-all relative ${
                  config.opponentMode === 'online'
                    ? darkMode
                      ? 'bg-[#27304D] border-sky-400'
                      : 'bg-sky-50/70 border-sky-500'
                    : darkMode
                    ? 'bg-[#232940] border-[#323B59] hover:bg-[#282F49]'
                    : 'bg-[#FAF7F2] border-[#E4DCCB] hover:bg-[#F3EFE6]'
                }`}
                style={
                  config.opponentMode === 'online'
                    ? { borderColor: accentColor }
                    : undefined
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Globe className="w-5 h-5" />
                  </div>
                  {config.opponentMode === 'online' && (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm sm:text-base font-display">
                    Multiplayer Online
                  </span>
                </div>
                <p className="text-xs font-semibold opacity-75 mt-1">
                  Crie uma sala privada com código de 6 caracteres ou conecte-se
                  com chat ao vivo!
                </p>
              </button>
            </div>

            {/* AI Difficulty & Player Side Sub-panel */}
            {config.opponentMode === 'ai' && (
              <div
                className={`mt-4 p-3.5 rounded-2xl border-2 flex flex-col gap-3 ${
                  darkMode
                    ? 'bg-[#181D2E] border-[#2C3450]'
                    : 'bg-[#F6F3EC] border-[#E2D9C5]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase tracking-wider opacity-75">
                    Dificuldade da Inteligência Artificial:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold opacity-75">
                      Você joga como:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playMenuClick();
                        onUpdateConfig({
                          aiPlayer: config.aiPlayer === 'blue' ? 'red' : 'blue',
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-sm transition-transform active:scale-95"
                      style={{
                        backgroundColor:
                          config.aiPlayer === 'blue' ? redColor : blueColor,
                      }}
                    >
                      {config.aiPlayer === 'blue'
                        ? 'Vermelho (1º a jogar)'
                        : 'Azul (Acesso ao centro)'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {(
                    [
                      {
                        id: 'easy',
                        label: 'Fácil',
                        desc: 'Casual e acessível',
                        icon: Sparkles,
                      },
                      {
                        id: 'medium',
                        label: 'Médio',
                        desc: 'Tático e atento',
                        icon: ShieldAlert,
                      },
                      {
                        id: 'hard',
                        label: 'Difícil',
                        desc: 'Estrategista Alpha-Beta',
                        icon: Flame,
                      },
                    ] as const
                  ).map((diff) => {
                    const Icon = diff.icon;
                    const active = config.aiDifficulty === diff.id;
                    return (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => selectDifficulty(diff.id)}
                        className={`p-2.5 rounded-xl border-2 border-b-4 text-left transition-all active:translate-y-0.5 ${
                          active
                            ? 'text-white'
                            : darkMode
                            ? 'bg-[#232940] border-[#333C5C] text-slate-200'
                            : 'bg-white border-[#DDD3C0] text-slate-700'
                        }`}
                        style={
                          active
                            ? {
                                backgroundColor: accentColor,
                                borderColor: 'rgba(0,0,0,0.25)',
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{diff.label}</span>
                        </div>
                        <div
                          className={`text-[10px] font-bold mt-0.5 ${
                            active ? 'text-white/90' : 'opacity-65'
                          }`}
                        >
                          {diff.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* STEP 2 & 3: Game Mode (Regular vs Adjacent) & Scoring Mode (8 Points vs Free) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Rule Mode */}
            <section className={`p-5 rounded-3xl border-2 ${cardSurface}`}>
              <div className="flex items-center gap-2 mb-3.5">
                <span
                  className="w-6 h-6 rounded-full text-xs font-black text-white flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  2
                </span>
                <h2 className="text-base sm:text-lg font-black font-display">
                  Modo de Jogo
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => selectRuleMode('regular')}
                  className={`p-3.5 rounded-2xl border-2 border-b-4 text-left transition-all ${
                    config.ruleMode === 'regular'
                      ? darkMode
                        ? 'bg-[#27304D]'
                        : 'bg-sky-50/70'
                      : darkMode
                      ? 'bg-[#232940] border-[#323B59]'
                      : 'bg-[#FAF7F2] border-[#E4DCCB]'
                  }`}
                  style={
                    config.ruleMode === 'regular'
                      ? { borderColor: accentColor }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm sm:text-base font-display flex items-center gap-1.5">
                      <Target className="w-4 h-4" style={{ color: accentColor }} />
                      Modo Regular
                    </span>
                    {config.ruleMode === 'regular' && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold opacity-75 mt-1">
                    Trincas formadas bloqueiam suas 3 casas. Nenhuma peça de
                    trinca já formada pode ser reutilizada.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => selectRuleMode('adjacent')}
                  className={`p-3.5 rounded-2xl border-2 border-b-4 text-left transition-all ${
                    config.ruleMode === 'adjacent'
                      ? darkMode
                        ? 'bg-[#27304D]'
                        : 'bg-sky-50/70'
                      : darkMode
                      ? 'bg-[#232940] border-[#323B59]'
                      : 'bg-[#FAF7F2] border-[#E4DCCB]'
                  }`}
                  style={
                    config.ruleMode === 'adjacent'
                      ? { borderColor: accentColor }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm sm:text-base font-display flex items-center gap-1.5">
                      <Layers
                        className="w-4 h-4"
                        style={{ color: accentColor }}
                      />
                      Modo Adjacente
                    </span>
                    {config.ruleMode === 'adjacent' && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold opacity-75 mt-1">
                    Permite reutilizar 1 peça de trinca já formada para criar
                    novas trincas, exigindo ao menos 2 casas inéditas!
                  </p>
                </button>
              </div>
            </section>

            {/* Scoring Mode */}
            <section className={`p-5 rounded-3xl border-2 ${cardSurface}`}>
              <div className="flex items-center gap-2 mb-3.5">
                <span
                  className="w-6 h-6 rounded-full text-xs font-black text-white flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  3
                </span>
                <h2 className="text-base sm:text-lg font-black font-display">
                  Sistema de Pontuação
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => selectScoringMode('eight_points')}
                  className={`p-3.5 rounded-2xl border-2 border-b-4 text-left transition-all ${
                    config.scoringMode === 'eight_points'
                      ? darkMode
                        ? 'bg-[#27304D]'
                        : 'bg-sky-50/70'
                      : darkMode
                      ? 'bg-[#232940] border-[#323B59]'
                      : 'bg-[#FAF7F2] border-[#E4DCCB]'
                  }`}
                  style={
                    config.scoringMode === 'eight_points'
                      ? { borderColor: accentColor }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm sm:text-base font-display flex items-center gap-1.5">
                      <Crown
                        className="w-4 h-4"
                        style={{ color: accentColor }}
                      />
                      Modo 8 Pontos
                    </span>
                    {config.scoringMode === 'eight_points' && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold opacity-75 mt-1">
                    Corrida estratégica: o primeiro jogador a formar 8 trincas
                    vence a partida imediatamente!
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => selectScoringMode('free')}
                  className={`p-3.5 rounded-2xl border-2 border-b-4 text-left transition-all ${
                    config.scoringMode === 'free'
                      ? darkMode
                        ? 'bg-[#27304D]'
                        : 'bg-sky-50/70'
                      : darkMode
                      ? 'bg-[#232940] border-[#323B59]'
                      : 'bg-[#FAF7F2] border-[#E4DCCB]'
                  }`}
                  style={
                    config.scoringMode === 'free'
                      ? { borderColor: accentColor }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm sm:text-base font-display flex items-center gap-1.5">
                      <InfinityIcon
                        className="w-4 h-4"
                        style={{ color: accentColor }}
                      />
                      Modo Livre
                    </span>
                    {config.scoringMode === 'free' && (
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold opacity-75 mt-1">
                    Sem limite de pontos! A partida segue até preencher o
                    tabuleiro ou acabarem as jogadas válidas.
                  </p>
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Right 4 Columns: Launch CTA + Navigation Hub Cards */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Launch Game Hero Card */}
          <div className={`p-5 rounded-3xl border-2 flex flex-col justify-between ${cardSurface}`}>
            <div>
              <div className="text-xs font-black uppercase tracking-wider opacity-60">
                Resumo da Partida
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 p-3 rounded-2xl bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <PlayerSymbol
                    player="red"
                    symbolStyle={symbolStyle}
                    color={redColor}
                    size="sm"
                  />
                  <span className="text-xs font-extrabold">Vermelho</span>
                </div>
                <span className="text-xs font-black opacity-40">VS</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold">
                    {config.opponentMode === 'pvp'
                      ? 'Azul (Local)'
                      : config.opponentMode === 'online'
                      ? 'Azul (Online)'
                      : `IA (${
                          config.aiDifficulty === 'easy'
                            ? 'Fácil'
                            : config.aiDifficulty === 'medium'
                            ? 'Média'
                            : 'Difícil'
                        })`}
                  </span>
                  <PlayerSymbol
                    player="blue"
                    symbolStyle={symbolStyle}
                    color={blueColor}
                    size="sm"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-bold opacity-80">
                <div className="flex justify-between">
                  <span>Regra de Trincas:</span>
                  <strong className="font-black">
                    {config.ruleMode === 'regular' ? 'Regular' : 'Adjacente'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Objetivo:</span>
                  <strong className="font-black">
                    {config.scoringMode === 'eight_points'
                      ? '8 Pontos'
                      : 'Modo Livre'}
                  </strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuClick();
                onStartGame();
              }}
              className="mt-5 w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg uppercase tracking-wide text-white border-2 border-b-[6px] transition-all hover:brightness-105 active:translate-y-1 active:border-b-2 flex items-center justify-center gap-2.5 shadow-lg"
              style={{
                backgroundColor: accentColor,
                borderColor: 'rgba(0,0,0,0.28)',
              }}
            >
              {config.opponentMode === 'online' ? (
                <>
                  <Globe className="w-5 h-5" />
                  <span>Abrir Lobby Online</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Iniciar Partida</span>
                </>
              )}
            </button>
          </div>

          {/* Menu Hub Buttons: Personalização, Regras, Configurações */}
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuClick();
                onOpenCustomizer();
              }}
              className={`p-4 rounded-2xl border-2 border-b-4 text-left flex items-center justify-between transition-all hover:-translate-y-0.5 active:translate-y-0.5 ${cardSurface}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm sm:text-base font-display">
                    Personalização
                  </div>
                  <div className="text-xs font-semibold opacity-70">
                    Cores, temas, tabuleiro e símbolos
                  </div>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10">
                Abrir
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuClick();
                onOpenRules();
              }}
              className={`p-4 rounded-2xl border-2 border-b-4 text-left flex items-center justify-between transition-all hover:-translate-y-0.5 active:translate-y-0.5 ${cardSurface}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: redColor }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm sm:text-base font-display">
                    Regras do Jogo
                  </div>
                  <div className="text-xs font-semibold opacity-70">
                    Guia ilustrado, centro 3×3 e modo adjacente
                  </div>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10">
                Ver
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuClick();
                onOpenRules();
              }}
              className="hidden"
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuClick();
                onOpenSettings();
              }}
              className={`p-4 rounded-2xl border-2 border-b-4 text-left flex items-center justify-between transition-all hover:-translate-y-0.5 active:translate-y-0.5 ${cardSurface}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: blueColor }}
                >
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-sm sm:text-base font-display">
                    Configurações & Dados
                  </div>
                  <div className="text-xs font-semibold opacity-70">
                    Áudio, auxílios visuais e estatísticas
                  </div>
                </div>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10">
                Ajustar
              </span>
            </button>
          </div>

          {/* Player Stats Pill Card */}
          <div className={`px-4 py-3 rounded-2xl border-2 flex items-center justify-between text-xs font-bold ${cardSurface}`}>
            <div className="flex items-center gap-2 opacity-80">
              <Award className="w-4 h-4" style={{ color: accentColor }} />
              <span>Partidas: {stats.matchesPlayed}</span>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ color: redColor }}>
                V: {stats.redWins}
              </span>
              <span style={{ color: blueColor }}>
                A: {stats.blueWins}
              </span>
              <span className="opacity-70">
                Trincas: {stats.totalTrincasFormed}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
