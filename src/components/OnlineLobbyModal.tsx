import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Globe,
  Loader2,
  LogIn,
  PlusCircle,
  RefreshCw,
  Sparkles,
  User,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CustomizationSettings, GameConfig, Player } from '../core/types';
import {
  ensurePlayerIdentity,
  getSavedPlayerNickname,
  savePlayerNickname,
} from '../online/firebaseConfig';
import {
  createOnlineRoom,
  joinOnlineRoom,
  leaveOnlineRoom,
  loadActiveRoomSession,
  OnlineRole,
  OnlineRoomData,
  SavedRoomSession,
  subscribeToOnlineRoom,
} from '../online/onlineService';
import { validateAndNormalizeRoomCode } from '../online/roomCodeUtils';
import { PlayerSymbol } from './PlayerSymbol';

interface OnlineLobbyModalProps {
  config: GameConfig;
  customization: CustomizationSettings;
  onEnterOnlineMatch: (session: {
    roomData: OnlineRoomData;
    playerId: string;
    playerName: string;
    role: OnlineRole;
    myColor: Player;
  }) => void;
  onClose: () => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  config,
  customization,
  onEnterOnlineMatch,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerId, setPlayerId] = useState<string>('');
  const [nickname, setNickname] = useState<string>(() =>
    getSavedPlayerNickname()
  );

  // Join form state
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Waiting room state (after Host creates room)
  const [waitingRoom, setWaitingRoom] = useState<OnlineRoomData | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Saved session for quick reconnect
  const [savedSession, setSavedSession] = useState<SavedRoomSession | null>(
    () => loadActiveRoomSession()
  );

  const { darkMode, redColor, blueColor, accentColor, symbolStyle } =
    customization;

  useEffect(() => {
    let mounted = true;
    ensurePlayerIdentity().then((res) => {
      if (mounted) {
        setPlayerId(res.uid);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // When Host is in the waiting room, subscribe to room changes and launch match as soon as Guest joins
  useEffect(() => {
    if (!waitingRoom || !playerId) return;

    const unsub = subscribeToOnlineRoom(
      waitingRoom.code,
      playerId,
      'host',
      (updatedRoom) => {
        setWaitingRoom(updatedRoom);
        if (
          updatedRoom.status === 'playing' &&
          updatedRoom.players.guest &&
          updatedRoom.guestId
        ) {
          soundEngine.playTrincaFormed(1);
          const cleanName = nickname.trim() || 'Host (Vermelho)';
          onEnterOnlineMatch({
            roomData: updatedRoom,
            playerId,
            playerName: cleanName,
            role: 'host',
            myColor: 'red',
          });
        }
      },
      (errMsg) => {
        setErrorMessage(errMsg);
      }
    );

    return () => unsub();
  }, [waitingRoom?.code, playerId]);

  const handleCreateRoom = async () => {
    if (!playerId || loading) return;
    setErrorMessage(null);
    setLoading(true);

    const finalName = nickname.trim() || 'Jogador 1 (Host)';
    savePlayerNickname(finalName);

    try {
      const created = await createOnlineRoom(playerId, finalName, config);
      soundEngine.playMenuClick();
      setWaitingRoom(created.roomData);
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setErrorMessage(
        err?.message || 'Não foi possível criar a sala no momento.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!playerId || loading) return;

    setErrorMessage(null);

    const validation = validateAndNormalizeRoomCode(joinCodeInput);
    if (!validation.valid) {
      soundEngine.playInvalidMove();
      setErrorMessage(validation.error || 'Código inválido.');
      return;
    }

    setLoading(true);
    const finalName = nickname.trim() || 'Jogador 2 (Convidado)';
    savePlayerNickname(finalName);

    try {
      const joined = await joinOnlineRoom(
        validation.normalizedCode,
        playerId,
        finalName
      );
      soundEngine.playTrincaFormed(1);
      onEnterOnlineMatch({
        roomData: joined.roomData,
        playerId: joined.effectivePlayerId,
        playerName: finalName,
        role: joined.role,
        myColor: joined.myColor,
      });
    } catch (err: any) {
      soundEngine.playInvalidMove();
      setErrorMessage(
        err?.message || 'Não foi possível entrar na sala informada.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReconnect = async () => {
    if (!savedSession || loading) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      const joined = await joinOnlineRoom(
        savedSession.roomCode,
        savedSession.playerId,
        savedSession.playerName
      );
      soundEngine.playTrincaFormed(1);
      onEnterOnlineMatch({
        roomData: joined.roomData,
        playerId: joined.effectivePlayerId,
        playerName: savedSession.playerName,
        role: joined.role,
        myColor: joined.myColor,
      });
    } catch (err: any) {
      setSavedSession(null);
      setErrorMessage(
        err?.message || 'A sala anterior não está mais disponível.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!waitingRoom) return;
    try {
      await navigator.clipboard.writeText(waitingRoom.code);
      setCopiedCode(true);
      soundEngine.playMenuClick();
      setTimeout(() => setCopiedCode(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleCancelWaitingRoom = async () => {
    if (waitingRoom && playerId) {
      await leaveOnlineRoom(waitingRoom.code, playerId, 'host');
    }
    setWaitingRoom(null);
    setSavedSession(null);
    soundEngine.playMenuSecondary();
  };

  const modalSurface = darkMode
    ? 'bg-[#191E30] border-[#2E3654] text-slate-100'
    : 'bg-[#FAF8F5] border-[#DFD5C4] text-slate-800';

  const cardSurface = darkMode
    ? 'bg-[#222840] border-[#333C5E]'
    : 'bg-white border-[#E5DEC9]';

  // Live validation feedback when typing code in Join tab
  const liveCodeCheck =
    joinCodeInput.length > 0
      ? validateAndNormalizeRoomCode(joinCodeInput)
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-3xl border-4 p-5 sm:p-6 my-auto shadow-2xl ${modalSurface}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: accentColor }}
            >
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-display">
                  Multiplayer Online
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <Wifi className="w-3 h-3" /> Tempo Real
                </span>
              </div>
              <p className="text-xs font-bold opacity-70">
                Salas privadas para 2 jogadores com sincronização e chat ao vivo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (waitingRoom) {
                handleCancelWaitingRoom();
              }
              soundEngine.playMenuSecondary();
              onClose();
            }}
            aria-label="Fechar Multiplayer Online"
            className="p-2 rounded-xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5"
            style={{
              backgroundColor: accentColor,
              borderColor: 'rgba(0,0,0,0.25)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Reconnect Banner if an active session exists */}
        {savedSession && !waitingRoom && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 ${
              darkMode
                ? 'bg-amber-500/15 border-amber-400/40 text-amber-200'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            <div className="text-xs">
              <div className="font-black uppercase tracking-wider">
                Partida Online em Andamento Encontrada!
              </div>
              <div className="font-semibold opacity-85 mt-0.5">
                Sala <strong>{savedSession.roomCode}</strong> • Jogando como{' '}
                <strong>
                  {savedSession.myColor === 'red'
                    ? 'Vermelho (Host)'
                    : 'Azul (Convidado)'}
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleQuickReconnect}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl font-black text-xs text-white bg-amber-500 border-2 border-b-4 border-amber-700 hover:bg-amber-400 transition-all active:translate-y-0.5 flex items-center gap-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconectar</span>
            </button>
          </div>
        )}

        {/* WAITING ROOM STATE (When Host has created a room and is waiting for Guest) */}
        {waitingRoom ? (
          <div className="mt-5 flex flex-col items-center text-center gap-4">
            <div
              className={`w-full p-5 rounded-3xl border-2 ${cardSurface}`}
            >
              <div className="text-xs font-black uppercase tracking-wider opacity-70 mb-1">
                Código de Acesso da Sala (6 Caracteres)
              </div>

              {/* Expressive Paper-Mario / Wii Code Display */}
              <div className="my-3 flex items-center justify-center gap-2">
                <div
                  className={`px-6 py-3.5 rounded-2xl border-2 border-dashed font-mono text-3xl sm:text-4xl font-black tracking-[0.25em] select-all ${
                    darkMode
                      ? 'bg-[#151929] border-sky-400/60 text-sky-300'
                      : 'bg-sky-50/80 border-sky-500/60 text-sky-900'
                  }`}
                >
                  {waitingRoom.code}
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-4 rounded-2xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5 flex flex-col items-center justify-center gap-1"
                  style={{
                    backgroundColor: copiedCode ? '#10B981' : accentColor,
                    borderColor: 'rgba(0,0,0,0.25)',
                  }}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span className="text-[10px]">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span className="text-[10px]">Copiar</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs font-bold opacity-75">
                Compartilhe este código com o segundo jogador. A partida começará
                automaticamente assim que ele entrar!
              </p>

              {/* Players Slots Preview */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {/* Host Slot */}
                <div
                  className="p-3.5 rounded-2xl border-2 flex items-center gap-3"
                  style={{
                    borderColor: `${redColor}88`,
                    backgroundColor: `${redColor}14`,
                  }}
                >
                  <PlayerSymbol
                    player="red"
                    symbolStyle={symbolStyle}
                    color={redColor}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider opacity-75">
                      Host • Vermelho (1º)
                    </div>
                    <div className="font-black text-sm truncate">
                      {waitingRoom.players.host.name}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Conectado na sala
                    </div>
                  </div>
                </div>

                {/* Guest Slot (Waiting) */}
                <div
                  className={`p-3.5 rounded-2xl border-2 border-dashed flex items-center gap-3 ${
                    darkMode
                      ? 'bg-[#181D2E] border-[#333C5E]'
                      : 'bg-slate-50 border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/5 dark:bg-white/5">
                    <Loader2
                      className="w-5 h-5 animate-spin"
                      style={{ color: blueColor }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-wider opacity-70">
                      Convidado • Azul (2º)
                    </div>
                    <div className="font-extrabold text-sm opacity-75">
                      Aguardando entrada...
                    </div>
                    <div className="text-[11px] font-semibold opacity-60">
                      Vaga aberta (1/2)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancelWaitingRoom}
              className={`w-full py-3 px-5 rounded-2xl font-extrabold text-xs sm:text-sm border-2 border-b-4 transition-all active:translate-y-0.5 ${
                darkMode
                  ? 'bg-[#262D47] border-[#384266] text-slate-200'
                  : 'bg-slate-200 border-slate-300 text-slate-700'
              }`}
            >
              Cancelar Sala e Voltar
            </button>
          </div>
        ) : (
          /* CREATE OR JOIN TABS */
          <div className="mt-5 flex flex-col gap-4">
            {/* Player Nickname Input */}
            <div className={`p-4 rounded-2xl border-2 ${cardSurface}`}>
              <label className="block text-xs font-black uppercase tracking-wider opacity-75 mb-1.5">
                Sua Identificação na Sala (Apelido)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.slice(0, 20))}
                  placeholder="Ex.: Mestre Estratégico"
                  maxLength={20}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-extrabold border-2 outline-none transition-colors ${
                    darkMode
                      ? 'bg-[#151929] border-[#2E3654] text-slate-100 focus:border-sky-400'
                      : 'bg-slate-50 border-[#DFD5C4] text-slate-800 focus:border-sky-500'
                  }`}
                />
              </div>
            </div>

            {/* Mode Switcher Tabs: Criar Sala vs Entrar com Código */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playMenuClick();
                  setErrorMessage(null);
                  setActiveTab('create');
                }}
                className={`py-3 px-4 rounded-2xl font-black text-xs sm:text-sm border-2 border-b-4 flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'create'
                    ? 'text-white'
                    : darkMode
                    ? 'bg-[#222840] border-[#333C5E] text-slate-300'
                    : 'bg-white border-[#E2D9C5] text-slate-700'
                }`}
                style={
                  activeTab === 'create'
                    ? {
                        backgroundColor: redColor,
                        borderColor: 'rgba(0,0,0,0.25)',
                      }
                    : undefined
                }
              >
                <PlusCircle className="w-4 h-4" />
                <span>Criar Sala (Host)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playMenuClick();
                  setErrorMessage(null);
                  setActiveTab('join');
                }}
                className={`py-3 px-4 rounded-2xl font-black text-xs sm:text-sm border-2 border-b-4 flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'join'
                    ? 'text-white'
                    : darkMode
                    ? 'bg-[#222840] border-[#333C5E] text-slate-300'
                    : 'bg-white border-[#E2D9C5] text-slate-700'
                }`}
                style={
                  activeTab === 'join'
                    ? {
                        backgroundColor: blueColor,
                        borderColor: 'rgba(0,0,0,0.25)',
                      }
                    : undefined
                }
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar em Sala</span>
              </button>
            </div>

            {/* Error Alert Banner */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/15 border-2 border-red-500/40 text-red-500 text-xs font-extrabold flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {activeTab === 'create' ? (
              /* TAB 1: CREATE ROOM */
              <div className={`p-5 rounded-2xl border-2 ${cardSurface}`}>
                <div className="flex items-center gap-3 mb-3">
                  <PlayerSymbol
                    player="red"
                    symbolStyle={symbolStyle}
                    color={redColor}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-black text-base font-display">
                      Criar Nova Sala Privada
                    </h3>
                    <p className="text-xs font-semibold opacity-75">
                      Você será o <strong>Host (Jogador Vermelho)</strong> e
                      receberá um código exclusivo de 6 caracteres.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-bold space-y-1.5 mb-4">
                  <div className="flex justify-between">
                    <span className="opacity-75">Modo de Regras:</span>
                    <strong className="font-black">
                      {config.ruleMode === 'regular'
                        ? 'Modo Regular'
                        : 'Modo Adjacente'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Sistema de Pontuação:</span>
                    <strong className="font-black">
                      {config.scoringMode === 'eight_points'
                        ? 'Corrida 8 Pontos'
                        : 'Modo Livre (81 Casas)'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-75">Capacidade:</span>
                    <strong className="font-black">
                      Exatamente 2 Jogadores + Chat Privado
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={loading || !playerId}
                  className="w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-white border-2 border-b-4 transition-all active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    backgroundColor: redColor,
                    borderColor: 'rgba(0,0,0,0.25)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Gerando Sala no Servidor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Gerar Código de 6 Caracteres</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* TAB 2: JOIN ROOM */
              <form
                onSubmit={handleJoinRoom}
                className={`p-5 rounded-2xl border-2 ${cardSurface}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <PlayerSymbol
                    player="blue"
                    symbolStyle={symbolStyle}
                    color={blueColor}
                    size="lg"
                  />
                  <div>
                    <h3 className="font-black text-base font-display">
                      Entrar com Código de 6 Caracteres
                    </h3>
                    <p className="text-xs font-semibold opacity-75">
                      Digite o código enviado pelo Host para entrar como{' '}
                      <strong>Convidado (Jogador Azul)</strong>.
                    </p>
                  </div>
                </div>

                <div className="my-4">
                  <label className="block text-xs font-black uppercase tracking-wider opacity-75 mb-1.5">
                    Código da Sala (A–Z e 0–9, sem acentos)
                  </label>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => {
                      setErrorMessage(null);
                      setJoinCodeInput(e.target.value);
                    }}
                    placeholder="EX: A7K9M2"
                    maxLength={8}
                    autoFocus
                    className={`w-full px-4 py-3.5 rounded-2xl text-center font-mono text-2xl sm:text-3xl font-black uppercase tracking-[0.25em] border-2 outline-none transition-colors ${
                      darkMode
                        ? 'bg-[#151929] border-[#2E3654] text-slate-100 focus:border-sky-400'
                        : 'bg-slate-50 border-[#DFD5C4] text-slate-800 focus:border-sky-500'
                    }`}
                  />

                  {/* Live Input Validation Status */}
                  {liveCodeCheck && (
                    <div
                      className={`mt-1.5 text-[11px] font-bold flex items-center justify-between ${
                        liveCodeCheck.valid
                          ? 'text-emerald-500'
                          : 'text-amber-500'
                      }`}
                    >
                      <span>
                        {liveCodeCheck.valid
                          ? `Código válido: ${liveCodeCheck.normalizedCode}`
                          : liveCodeCheck.error}
                      </span>
                      <span className="font-mono">
                        {joinCodeInput.trim().length}/6
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !playerId}
                  className="w-full py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base text-white border-2 border-b-4 transition-all active:translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{
                    backgroundColor: blueColor,
                    borderColor: 'rgba(0,0,0,0.25)',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Conectando à Sala...</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      <span>Entrar na Partida Online</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
