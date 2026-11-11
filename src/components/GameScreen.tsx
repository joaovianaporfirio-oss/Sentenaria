import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  BookOpen,
  Bot,
  Check,
  Copy,
  Globe,
  History,
  Home,
  Palette,
  RotateCcw,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { chooseAIMove } from '../ai/aiEngine';
import { soundEngine } from '../audio/soundEngine';
import { formatCoordLabel, TARGET_SCORE_EIGHT } from '../core/constants';
import { hasRedMadeFirstMove, makeMove } from '../core/gameEngine';
import {
  AudioSettings,
  CustomizationSettings,
  GameState,
  Player,
} from '../core/types';
import {
  leaveOnlineRoom,
  OnlineRole,
  OnlineRoomData,
  restartOnlineMatch,
  submitOnlineMove,
  subscribeToOnlineRoom,
} from '../online/onlineService';
import { BoardView } from './BoardView';
import { OnlineChatPanel } from './OnlineChatPanel';
import { PlayerSymbol } from './PlayerSymbol';

export interface ActiveOnlineSession {
  roomData: OnlineRoomData;
  playerId: string;
  playerName: string;
  role: OnlineRole;
  myColor: Player;
}

interface GameScreenProps {
  gameState: GameState;
  customization: CustomizationSettings;
  audioSettings: AudioSettings;
  onlineSession?: ActiveOnlineSession | null;
  onUpdateGameState: (nextState: GameState) => void;
  onRestartMatch: () => void;
  onReturnToMenu: () => void;
  onOpenRules: () => void;
  onOpenCustomizer: () => void;
  onToggleSound: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  gameState,
  customization,
  audioSettings,
  onlineSession = null,
  onUpdateGameState,
  onRestartMatch,
  onReturnToMenu,
  onOpenRules,
  onOpenCustomizer,
  onToggleSound,
}) => {
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);
  const [inspectingBoard, setInspectingBoard] = useState(false);
  const [invalidToast, setInvalidToast] = useState<string | null>(null);
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomData | null>(
    onlineSession?.roomData ?? null
  );
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  const aiTimerRef = useRef<number | null>(null);
  const prevTurnCountRef = useRef<number>(gameState.turnCount);

  const { config, currentPlayer, scores, status, winner, moveHistory, lastMove } =
    gameState;
  const {
    darkMode,
    redColor,
    blueColor,
    accentColor,
    symbolStyle,
    animationsEnabled,
  } = customization;

  const isOnlineMode = Boolean(onlineSession);
  const isMyOnlineTurn =
    isOnlineMode &&
    status === 'playing' &&
    currentPlayer === onlineSession?.myColor &&
    onlineRoom?.status === 'playing';

  const isAITurn =
    !isOnlineMode &&
    status === 'playing' &&
    config.opponentMode === 'ai' &&
    currentPlayer === config.aiPlayer;

  const redHasMoved = hasRedMadeFirstMove(gameState.board);

  // Subscribe to real-time updates when in Online Multiplayer mode
  useEffect(() => {
    if (!onlineSession) {
      setOnlineRoom(null);
      return;
    }

    const unsub = subscribeToOnlineRoom(
      onlineSession.roomData.code,
      onlineSession.playerId,
      onlineSession.role,
      (updatedRoom) => {
        setOnlineRoom(updatedRoom);

        // Play audio feedback when a remote move arrives
        if (updatedRoom.gameState.turnCount > prevTurnCountRef.current) {
          const latestMove = updatedRoom.gameState.lastMove;
          if (latestMove && latestMove.player !== onlineSession.myColor) {
            soundEngine.playPiecePlace(latestMove.player);
            if (latestMove.pointsEarned > 0) {
              soundEngine.playTrincaFormed(latestMove.pointsEarned);
              soundEngine.playScoreUpdate(
                updatedRoom.gameState.scores[latestMove.player]
              );
            }
          }
        }
        prevTurnCountRef.current = updatedRoom.gameState.turnCount;
        onUpdateGameState(updatedRoom.gameState);
      },
      (errMsg) => {
        setInvalidToast(errMsg);
      }
    );

    return () => unsub();
  }, [onlineSession?.roomData.code, onlineSession?.playerId]);

  // Reset board inspection mode when match restarts
  useEffect(() => {
    if (status === 'playing') {
      setInspectingBoard(false);
    }
  }, [status, gameState.turnCount]);

  // Trigger Victory / End of Match effects
  useEffect(() => {
    if (status === 'finished') {
      const isHumanWin = isOnlineMode
        ? winner === onlineSession?.myColor
        : config.opponentMode === 'pvp'
        ? winner !== 'draw'
        : winner !== 'draw' && winner !== config.aiPlayer;

      if (winner === 'draw') {
        soundEngine.playMatchEnd('draw');
      } else if (isHumanWin) {
        soundEngine.playMatchEnd('win');
        if (animationsEnabled) {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: [
              winner === 'red' ? redColor : blueColor,
              accentColor,
              '#FBBF24',
            ],
          });
        }
      } else {
        soundEngine.playMatchEnd('loss');
      }
    }
  }, [status]);

  // AI Turn Execution (Local vs AI mode only)
  useEffect(() => {
    if (!isAITurn) {
      setIsAIThinking(false);
      return;
    }

    setIsAIThinking(true);
    const delay = config.aiDifficulty === 'easy' ? 320 : 420;

    aiTimerRef.current = window.setTimeout(() => {
      try {
        const aiCoord = chooseAIMove(gameState, config.aiDifficulty);
        const nextState = makeMove(gameState, aiCoord.row, aiCoord.col);

        soundEngine.playPiecePlace(gameState.currentPlayer);
        if (nextState.lastMove && nextState.lastMove.pointsEarned > 0) {
          soundEngine.playTrincaFormed(nextState.lastMove.pointsEarned);
          soundEngine.playScoreUpdate(
            nextState.scores[gameState.currentPlayer]
          );
        }

        onUpdateGameState(nextState);
      } catch (err) {
        console.error('AI move error:', err);
      } finally {
        setIsAIThinking(false);
      }
    }, delay);

    return () => {
      if (aiTimerRef.current !== null) {
        clearTimeout(aiTimerRef.current);
      }
    };
  }, [
    isAITurn,
    gameState.turnCount,
    gameState.status,
    config.aiDifficulty,
    config.aiPlayer,
  ]);

  const handleHumanCellClick = async (row: number, col: number) => {
    if (status !== 'playing' || isAIThinking || isAITurn || isSubmittingMove) {
      return;
    }

    // Online Multiplayer Move Execution (Authoritative Firebase Transaction)
    if (isOnlineMode && onlineSession) {
      if (!isMyOnlineTurn) {
        soundEngine.playInvalidMove();
        setInvalidToast('Aguarde a vez do seu adversário jogar!');
        setTimeout(() => setInvalidToast(null), 2200);
        return;
      }

      setIsSubmittingMove(true);
      try {
        prevTurnCountRef.current = gameState.turnCount + 1;
        const nextState = await submitOnlineMove(
          onlineSession.roomData.code,
          onlineSession.playerId,
          row,
          col
        );

        soundEngine.playPiecePlace(onlineSession.myColor);
        if (nextState.lastMove && nextState.lastMove.pointsEarned > 0) {
          soundEngine.playTrincaFormed(nextState.lastMove.pointsEarned);
          soundEngine.playScoreUpdate(nextState.scores[onlineSession.myColor]);
        }

        onUpdateGameState(nextState);
      } catch (err: any) {
        soundEngine.playInvalidMove();
        setInvalidToast(err?.message || 'Não foi possível registrar a jogada.');
        setTimeout(() => setInvalidToast(null), 2600);
      } finally {
        setIsSubmittingMove(false);
      }
      return;
    }

    // Local PvP or Human vs AI Move Execution
    try {
      const movingPlayer = gameState.currentPlayer;
      const nextState = makeMove(gameState, row, col);

      soundEngine.playPiecePlace(movingPlayer);
      if (nextState.lastMove && nextState.lastMove.pointsEarned > 0) {
        soundEngine.playTrincaFormed(nextState.lastMove.pointsEarned);
        soundEngine.playScoreUpdate(nextState.scores[movingPlayer]);
      }

      onUpdateGameState(nextState);
    } catch {
      soundEngine.playInvalidMove();
    }
  };

  const handleInvalidCellClick = (row: number, col: number) => {
    soundEngine.playInvalidMove();
    if (
      currentPlayer === 'red' &&
      !redHasMoved &&
      row >= 3 &&
      row <= 5 &&
      col >= 3 &&
      col <= 5
    ) {
      setInvalidToast(
        'O jogador Vermelho não pode realizar sua 1ª jogada no quadrado central 3×3! (Liberado a partir da 2ª jogada).'
      );
      setTimeout(() => setInvalidToast(null), 3200);
    } else if (isOnlineMode && !isMyOnlineTurn) {
      setInvalidToast('Aguarde o turno do seu adversário online!');
      setTimeout(() => setInvalidToast(null), 2400);
    }
  };

  const handleRestartOrRematch = async () => {
    soundEngine.playMenuClick();
    if (isOnlineMode && onlineSession) {
      await restartOnlineMatch(
        onlineSession.roomData.code,
        onlineSession.playerId
      );
    } else {
      onRestartMatch();
    }
  };

  const handleBackToMenu = async () => {
    soundEngine.playMenuSecondary();
    if (isOnlineMode && onlineSession) {
      await leaveOnlineRoom(
        onlineSession.roomData.code,
        onlineSession.playerId,
        onlineSession.role
      );
    }
    onReturnToMenu();
  };

  const handleCopyRoomCode = async () => {
    if (!onlineRoom) return;
    try {
      await navigator.clipboard.writeText(onlineRoom.code);
      setCopiedRoomCode(true);
      soundEngine.playMenuClick();
      setTimeout(() => setCopiedRoomCode(false), 2000);
    } catch {
      // Ignore
    }
  };

  const getPlayerLabel = (p: Player): string => {
    if (isOnlineMode && onlineRoom) {
      if (p === 'red') {
        const name = onlineRoom.players.host.name;
        return onlineSession?.myColor === 'red' ? `${name} (Você)` : name;
      } else {
        const name = onlineRoom.players.guest?.name || 'Aguardando...';
        return onlineSession?.myColor === 'blue' ? `${name} (Você)` : name;
      }
    }
    if (config.opponentMode === 'pvp') {
      return p === 'red' ? 'Jogador Vermelho' : 'Jogador Azul';
    }
    const diffLabel =
      config.aiDifficulty === 'easy'
        ? 'IA Fácil'
        : config.aiDifficulty === 'medium'
        ? 'IA Média'
        : 'IA Difícil';
    return config.aiPlayer === p ? `Máquina (${diffLabel})` : 'Você (Humano)';
  };

  // Determine opponent connection health in Online mode
  const opponentParticipant =
    isOnlineMode && onlineRoom
      ? onlineSession?.role === 'host'
        ? onlineRoom.players.guest
        : onlineRoom.players.host
      : null;

  const isOpponentDisconnected =
    isOnlineMode &&
    opponentParticipant !== null &&
    !opponentParticipant.connected;

  const hasOpponentLeft =
    isOnlineMode &&
    opponentParticipant !== null &&
    opponentParticipant.leftRoom;

  const cardSurface = darkMode
    ? 'bg-[#1E2336] border-[#2E3652] text-slate-100 shadow-[0_6px_0_#101320]'
    : 'bg-white border-[#E2D9C8] text-slate-800 shadow-[0_6px_0_#D5CBB8]';

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col gap-4">
      {/* Top Navigation & Mode Bar */}
      <header
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border-2 ${cardSurface}`}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleBackToMenu}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
              darkMode
                ? 'bg-[#262D47] border-[#384266] text-slate-200 hover:bg-[#2F3756]'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{isOnlineMode ? 'Sair da Sala' : 'Menu'}</span>
          </button>

          {/* Online Room Code Pill */}
          {isOnlineMode && onlineRoom && (
            <button
              type="button"
              onClick={handleCopyRoomCode}
              title="Copiar código da sala"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-mono tracking-wider">
                SALA: {onlineRoom.code}
              </span>
              {copiedRoomCode ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3 h-3 opacity-75" />
              )}
            </button>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide text-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              {config.ruleMode === 'regular'
                ? 'Modo Regular'
                : 'Modo Adjacente'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                darkMode
                  ? 'bg-[#262D47] border-[#394366] text-slate-300'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {config.scoringMode === 'eight_points'
                ? 'Corrida 8 Pontos'
                : 'Modo Livre (81 Casas)'}
            </span>
            {!isOnlineMode && (
              <span
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                  darkMode
                    ? 'bg-[#242B42] border-[#343E5E] text-slate-300'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {config.opponentMode === 'pvp' ? (
                  <>
                    <Users className="w-3.5 h-3.5" /> 2 Jogadores
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" /> vs{' '}
                    {config.aiDifficulty === 'easy'
                      ? 'IA Fácil'
                      : config.aiDifficulty === 'medium'
                      ? 'IA Média'
                      : 'IA Difícil'}
                  </>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuClick();
              onOpenCustomizer();
            }}
            title="Personalizar Aparência"
            className={`p-2 rounded-xl border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
              darkMode
                ? 'bg-[#262D47] border-[#384266] text-slate-200 hover:bg-[#2F3756]'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuClick();
              onOpenRules();
            }}
            title="Consultar Regras"
            className={`p-2 rounded-xl border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
              darkMode
                ? 'bg-[#262D47] border-[#384266] text-slate-200 hover:bg-[#2F3756]'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            title={audioSettings.soundEnabled ? 'Desativar Sons' : 'Ativar Sons'}
            className={`p-2 rounded-xl border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
              darkMode
                ? 'bg-[#262D47] border-[#384266] text-slate-200 hover:bg-[#2F3756]'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {audioSettings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 opacity-60" />
            )}
          </button>

          <button
            type="button"
            onClick={handleRestartOrRematch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm text-white border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2"
            style={{
              backgroundColor: accentColor,
              borderColor: 'rgba(0,0,0,0.25)',
            }}
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isOnlineMode ? 'Revanche' : 'Reiniciar'}</span>
          </button>
        </div>
      </header>

      {/* Online Opponent Disconnection / Reconnection Alert Banner */}
      {isOnlineMode && (isOpponentDisconnected || hasOpponentLeft) && (
        <div
          className={`px-4 py-3 rounded-2xl border-2 flex items-center justify-between gap-3 animate-fade-in ${
            hasOpponentLeft
              ? 'bg-red-500/15 border-red-500/40 text-red-500'
              : 'bg-amber-500/15 border-amber-500/40 text-amber-500'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-extrabold">
            <WifiOff className="w-5 h-5 shrink-0" />
            <span>
              {hasOpponentLeft
                ? `O adversário (${opponentParticipant?.name}) saiu da sala. Ele ainda pode retornar usando o código ${onlineRoom?.code}.`
                : `Adversário (${opponentParticipant?.name}) perdeu a conexão temporariamente. O progresso da partida está salvo — aguardando reconexão...`}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-black/10 dark:bg-white/10 shrink-0">
            Código: {onlineRoom?.code}
          </span>
        </div>
      )}

      {/* Main Content Layout: Players + Board + Chat/History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Scorecards & Turn Indicator */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            {/* RED PLAYER CARD */}
            <div
              className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 ${cardSurface}`}
              style={{
                borderColor:
                  status === 'playing' && currentPlayer === 'red'
                    ? redColor
                    : undefined,
                boxShadow:
                  status === 'playing' && currentPlayer === 'red'
                    ? `0 6px 0 ${redColor}66, 0 0 20px ${redColor}22`
                    : undefined,
              }}
            >
              {status === 'playing' && currentPlayer === 'red' && (
                <span
                  className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow"
                  style={{ backgroundColor: redColor }}
                >
                  {isOnlineMode && onlineSession?.myColor === 'red'
                    ? 'Sua Vez!'
                    : 'Jogando Agora'}
                </span>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2"
                    style={{
                      backgroundColor: `${redColor}18`,
                      borderColor: `${redColor}55`,
                    }}
                  >
                    <PlayerSymbol
                      player="red"
                      symbolStyle={symbolStyle}
                      color={redColor}
                      size="lg"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-black uppercase tracking-wider truncate"
                        style={{ color: redColor }}
                      >
                        Vermelho (1º)
                      </span>
                      {isOnlineMode && onlineRoom && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            onlineRoom.players.host.connected
                              ? 'bg-emerald-500'
                              : 'bg-amber-500 animate-pulse'
                          }`}
                          title={
                            onlineRoom.players.host.connected
                              ? 'Online'
                              : 'Desconectado'
                          }
                        />
                      )}
                    </div>
                    <div className="text-xs font-bold opacity-75 truncate">
                      {getPlayerLabel('red')}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className="text-2xl sm:text-3xl font-black leading-none font-display"
                    style={{ color: redColor }}
                  >
                    {scores.red}
                  </div>
                  <div className="text-[10px] font-bold uppercase opacity-60">
                    {config.scoringMode === 'eight_points'
                      ? '/ 8 pts'
                      : 'pontos'}
                  </div>
                </div>
              </div>

              {config.scoringMode === 'eight_points' && (
                <div className="mt-2.5 w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (scores.red / TARGET_SCORE_EIGHT) * 100
                      )}%`,
                      backgroundColor: redColor,
                    }}
                  />
                </div>
              )}

              <div className="mt-2 text-[11px] font-semibold opacity-70 flex items-center justify-between">
                <span>
                  {redHasMoved
                    ? 'Acesso livre ao centro 3×3'
                    : '1ª jogada fora do centro 3×3'}
                </span>
                <span>{scores.red} trincas</span>
              </div>
            </div>

            {/* BLUE PLAYER CARD */}
            <div
              className={`relative p-3.5 rounded-2xl border-2 transition-all duration-200 ${cardSurface}`}
              style={{
                borderColor:
                  status === 'playing' && currentPlayer === 'blue'
                    ? blueColor
                    : undefined,
                boxShadow:
                  status === 'playing' && currentPlayer === 'blue'
                    ? `0 6px 0 ${blueColor}66, 0 0 20px ${blueColor}22`
                    : undefined,
              }}
            >
              {status === 'playing' && currentPlayer === 'blue' && (
                <span
                  className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow"
                  style={{ backgroundColor: blueColor }}
                >
                  {isAIThinking
                    ? 'IA Pensando...'
                    : isOnlineMode && onlineSession?.myColor === 'blue'
                    ? 'Sua Vez!'
                    : 'Jogando Agora'}
                </span>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border-2"
                    style={{
                      backgroundColor: `${blueColor}18`,
                      borderColor: `${blueColor}55`,
                    }}
                  >
                    <PlayerSymbol
                      player="blue"
                      symbolStyle={symbolStyle}
                      color={blueColor}
                      size="lg"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-black uppercase tracking-wider truncate"
                        style={{ color: blueColor }}
                      >
                        Azul (2º)
                      </span>
                      {isOnlineMode && onlineRoom?.players.guest && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            onlineRoom.players.guest.connected
                              ? 'bg-emerald-500'
                              : 'bg-amber-500 animate-pulse'
                          }`}
                          title={
                            onlineRoom.players.guest.connected
                              ? 'Online'
                              : 'Desconectado'
                          }
                        />
                      )}
                    </div>
                    <div className="text-xs font-bold opacity-75 truncate">
                      {getPlayerLabel('blue')}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className="text-2xl sm:text-3xl font-black leading-none font-display"
                    style={{ color: blueColor }}
                  >
                    {scores.blue}
                  </div>
                  <div className="text-[10px] font-bold uppercase opacity-60">
                    {config.scoringMode === 'eight_points'
                      ? '/ 8 pts'
                      : 'pontos'}
                  </div>
                </div>
              </div>

              {config.scoringMode === 'eight_points' && (
                <div className="mt-2.5 w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700/70 overflow-hidden p-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (scores.blue / TARGET_SCORE_EIGHT) * 100
                      )}%`,
                      backgroundColor: blueColor,
                    }}
                  />
                </div>
              )}

              <div className="mt-2 text-[11px] font-semibold opacity-70 flex items-center justify-between">
                <span>Acesso livre ao centro 3×3</span>
                <span>{scores.blue} trincas</span>
              </div>
            </div>
          </div>

          {/* Active Turn / Last Trinca Callout Card */}
          <div className={`p-3.5 rounded-2xl border-2 ${cardSurface}`}>
            <div className="text-xs font-black uppercase tracking-wider opacity-60 mb-1 flex items-center justify-between">
              <span>Status • Turno #{gameState.turnCount + 1}</span>
              {isOnlineMode && onlineSession && (
                <span className="flex items-center gap-1 text-emerald-500">
                  <Wifi className="w-3 h-3" />
                  Você é{' '}
                  {onlineSession.myColor === 'red' ? 'Vermelho' : 'Azul'}
                </span>
              )}
            </div>

            {status === 'playing' ? (
              <div className="flex items-center gap-2 text-sm font-extrabold">
                <span
                  className="w-3 h-3 rounded-full animate-ping shrink-0"
                  style={{
                    backgroundColor:
                      currentPlayer === 'red' ? redColor : blueColor,
                  }}
                />
                <span>
                  {isAIThinking
                    ? 'A IA está analisando o tabuleiro...'
                    : isOnlineMode
                    ? isMyOnlineTurn
                      ? `Sua vez de jogar (${
                          onlineSession?.myColor === 'red'
                            ? 'Vermelho'
                            : 'Azul'
                        })!`
                      : `Aguardando jogada de ${
                          currentPlayer === 'red'
                            ? onlineRoom?.players.host.name || 'Vermelho'
                            : onlineRoom?.players.guest?.name || 'Azul'
                        }...`
                    : `Vez do jogador ${
                        currentPlayer === 'red' ? 'Vermelho' : 'Azul'
                      }`}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-amber-500">
                  Partida Encerrada!
                </span>
                {inspectingBoard && (
                  <button
                    type="button"
                    onClick={() => setInspectingBoard(false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-500 text-white"
                  >
                    Ver Resultado
                  </button>
                )}
              </div>
            )}

            {/* Recent Trinca celebration banner */}
            {lastMove && lastMove.pointsEarned > 0 && (
              <div
                className="mt-2.5 px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 text-white shadow-sm animate-bounce"
                style={{
                  backgroundColor:
                    lastMove.player === 'red' ? redColor : blueColor,
                }}
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {lastMove.player === 'red' ? 'Vermelho' : 'Azul'} formou{' '}
                  {lastMove.pointsEarned === 1
                    ? 'uma nova trinca (+1 pt)!'
                    : `${lastMove.pointsEarned} trincas (+${lastMove.pointsEarned} pts)!`}
                </span>
              </div>
            )}

            {/* Invalid move warning toast */}
            {invalidToast && (
              <div className="mt-2.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-red-500/15 border border-red-500/40 text-red-500">
                {invalidToast}
              </div>
            )}
          </div>
        </div>

        {/* Center Column: 9x9 Sentenaria Board */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <BoardView
            board={gameState.board}
            currentPlayer={currentPlayer}
            formedTrincas={gameState.formedTrincas}
            lastMove={lastMove}
            customization={customization}
            disabled={
              status !== 'playing' ||
              isAIThinking ||
              isAITurn ||
              isSubmittingMove ||
              (isOnlineMode && !isMyOnlineTurn)
            }
            onCellClick={handleHumanCellClick}
            onInvalidCellClick={handleInvalidCellClick}
          />
        </div>

        {/* Right Column: Private Room Chat (when Online) + Move History */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {isOnlineMode && onlineSession && (
            <OnlineChatPanel
              roomCode={onlineSession.roomData.code}
              playerId={onlineSession.playerId}
              playerName={onlineSession.playerName}
              playerRole={onlineSession.role}
              customization={customization}
            />
          )}

          <div className={`p-3.5 rounded-2xl border-2 ${cardSurface}`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider opacity-75">
                <History className="w-4 h-4" />
                <span>Histórico de Jogadas</span>
              </div>
              <span className="text-xs font-bold opacity-60">
                {moveHistory.length} / 81
              </span>
            </div>

            {moveHistory.length === 0 ? (
              <div className="py-5 text-center text-xs font-semibold opacity-55">
                Nenhuma jogada realizada ainda.
                <br />A <strong>1ª jogada do Vermelho</strong> deve ser fora do
                centro 3×3!
              </div>
            ) : (
              <div
                className={`${
                  isOnlineMode ? 'max-h-[160px]' : 'max-h-[260px] lg:max-h-[340px]'
                } overflow-y-auto pr-1 flex flex-col gap-1.5`}
              >
                {[...moveHistory].reverse().map((move) => {
                  const pColor = move.player === 'red' ? redColor : blueColor;
                  return (
                    <div
                      key={move.turnNumber}
                      className={`px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between border ${
                        darkMode
                          ? 'bg-[#252C44] border-[#333C5C]'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold opacity-50 w-6">
                          #{move.turnNumber}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: pColor }}
                        />
                        <span className="font-extrabold">
                          {move.player === 'red' ? 'Vermelho' : 'Azul'}
                        </span>
                        <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
                          {formatCoordLabel(move.row, move.col)}
                        </span>
                      </div>

                      {move.pointsEarned > 0 ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-black text-white flex items-center gap-0.5"
                          style={{ backgroundColor: pColor }}
                        >
                          <Zap className="w-2.5 h-2.5" />+{move.pointsEarned}{' '}
                          PT
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold opacity-50">
                          {move.scoreAfter.red}×{move.scoreAfter.blue}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isOnlineMode && (
            <div className={`p-3.5 rounded-2xl border-2 text-xs ${cardSurface}`}>
              <div className="font-black uppercase tracking-wider opacity-70 mb-1.5 flex items-center gap-1.5">
                <Award className="w-4 h-4" style={{ color: accentColor }} />
                <span>
                  Regra Ativa:{' '}
                  {config.ruleMode === 'regular'
                    ? 'Modo Regular'
                    : 'Modo Adjacente'}
                </span>
              </div>
              <p className="font-semibold opacity-80 leading-relaxed">
                {config.ruleMode === 'regular'
                  ? 'Cada peça pode participar de apenas uma única trinca. Casas que já formaram trincas ficam bloqueadas para novas combinações.'
                  : 'Você pode reutilizar 1 peça de uma trinca já formada para criar uma nova trinca adjacente, desde que pelo menos 2 das 3 casas sejam inéditas!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Match Finished Result Modal */}
      {status === 'finished' && !inspectingBoard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div
            className={`w-full max-w-md rounded-3xl border-4 p-6 text-center relative ${cardSurface}`}
            style={{
              borderColor:
                winner === 'red'
                  ? redColor
                  : winner === 'blue'
                  ? blueColor
                  : accentColor,
            }}
          >
            <div
              className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                backgroundColor:
                  winner === 'red'
                    ? redColor
                    : winner === 'blue'
                    ? blueColor
                    : accentColor,
              }}
            >
              <Trophy className="w-9 h-9" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display">
              {winner === 'draw'
                ? 'Empate Técnico!'
                : winner === 'red'
                ? 'Vitória do Vermelho!'
                : 'Vitória do Azul!'}
            </h2>

            <p className="mt-1 text-xs sm:text-sm font-bold opacity-75">
              {gameState.endReason === 'target_score_reached'
                ? 'Objetivo de 8 trincas alcançado com sucesso!'
                : gameState.endReason === 'board_full'
                ? 'Todas as 81 casas do tabuleiro foram preenchidas!'
                : 'Partida encerrada: não restam mais jogadas válidas para o turno.'}
            </p>

            {/* Score Comparison Box */}
            <div className="my-5 grid grid-cols-2 gap-3">
              <div
                className="p-3.5 rounded-2xl border-2"
                style={{
                  borderColor: `${redColor}66`,
                  backgroundColor: `${redColor}12`,
                }}
              >
                <div
                  className="text-xs font-black uppercase"
                  style={{ color: redColor }}
                >
                  Vermelho
                </div>
                <div
                  className="text-3xl font-black font-display my-1"
                  style={{ color: redColor }}
                >
                  {scores.red}
                </div>
                <div className="text-[11px] font-bold opacity-75">
                  trincas formadas
                </div>
              </div>

              <div
                className="p-3.5 rounded-2xl border-2"
                style={{
                  borderColor: `${blueColor}66`,
                  backgroundColor: `${blueColor}12`,
                }}
              >
                <div
                  className="text-xs font-black uppercase"
                  style={{ color: blueColor }}
                >
                  Azul
                </div>
                <div
                  className="text-3xl font-black font-display my-1"
                  style={{ color: blueColor }}
                >
                  {scores.blue}
                </div>
                <div className="text-[11px] font-bold opacity-75">
                  trincas formadas
                </div>
              </div>
            </div>

            <div className="text-xs font-bold opacity-70 mb-5 flex justify-center gap-4">
              <span>Total de Turnos: {gameState.turnCount}</span>
              <span>•</span>
              <span>
                Modo:{' '}
                {config.ruleMode === 'regular' ? 'Regular' : 'Adjacente'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleRestartOrRematch}
                className="flex-1 py-3 px-4 rounded-2xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: accentColor,
                  borderColor: 'rgba(0,0,0,0.25)',
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>
                  {isOnlineMode ? 'Revanche na Sala' : 'Jogar Novamente'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playMenuSecondary();
                  setInspectingBoard(true);
                }}
                className={`py-3 px-4 rounded-2xl font-extrabold border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 ${
                  darkMode
                    ? 'bg-[#262D47] border-[#384266] text-slate-200'
                    : 'bg-slate-100 border-slate-300 text-slate-700'
                }`}
              >
                Ver Tabuleiro
              </button>
            </div>

            <button
              type="button"
              onClick={handleBackToMenu}
              className="mt-3 text-xs font-extrabold underline opacity-75 hover:opacity-100"
            >
              Voltar ao Menu Principal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
