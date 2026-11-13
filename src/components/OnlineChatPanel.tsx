import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { CustomizationSettings } from '../core/types';
import {
  OnlineChatMessage,
  OnlineRole,
  sendOnlineChatMessage,
  subscribeToRoomChat,
} from '../online/onlineService';
import { MAX_CHAT_MESSAGE_LENGTH } from '../online/roomCodeUtils';

interface OnlineChatPanelProps {
  roomCode: string;
  playerId: string;
  playerName: string;
  playerRole: OnlineRole;
  customization: CustomizationSettings;
}

/**
 * Helper to sort a unified array of chat messages strictly in chronological order
 * (from oldest to newest), with deterministic tie-breaking by Firebase push ID.
 */
export function sortChatMessagesChronologically(
  messages: readonly OnlineChatMessage[]
): OnlineChatMessage[] {
  return [...messages].sort((a, b) => {
    const timeA = typeof a.timestamp === 'number' ? a.timestamp : 0;
    const timeB = typeof b.timestamp === 'number' ? b.timestamp : 0;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

export const OnlineChatPanel: React.FC<OnlineChatPanelProps> = ({
  roomCode,
  playerId,
  playerName,
  playerRole,
  customization,
}) => {
  const [messages, setMessages] = useState<OnlineChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef<number>(0);
  const playerIdRef = useRef<string>(playerId);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  const { darkMode, redColor, blueColor, accentColor } = customization;

  useEffect(() => {
    const unsubscribe = subscribeToRoomChat(
      roomCode,
      playerIdRef.current,
      (list) => {
        const ordered = sortChatMessagesChronologically(list);
        if (ordered.length > prevCountRef.current && prevCountRef.current > 0) {
          const newest = ordered[ordered.length - 1];
          if (newest && newest.senderId !== playerIdRef.current) {
            soundEngine.playMenuClick();
          }
        }
        prevCountRef.current = ordered.length;
        setMessages(ordered);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [roomCode]);

  // Single unified array of messages from both players, sorted oldest -> newest
  const chronologicalMessages = useMemo(
    () => sortChatMessagesChronologically(messages),
    [messages]
  );

  // Auto-scroll to newest message at the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chronologicalMessages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setErrorMsg(null);
    setSending(true);
    try {
      await sendOnlineChatMessage(
        roomCode,
        playerId,
        playerName,
        playerRole,
        trimmed
      );
      setInputText('');
      soundEngine.playMenuClick();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao enviar mensagem.');
      soundEngine.playInvalidMove();
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number): string => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const cardSurface = darkMode
    ? 'bg-[#1E2336] border-[#2E3652] text-slate-100 shadow-[0_6px_0_#101320]'
    : 'bg-white border-[#E2D9C8] text-slate-800 shadow-[0_6px_0_#D5CBB8]';

  return (
    <div
      className={`p-3.5 rounded-2xl border-2 flex flex-col h-[340px] lg:h-[380px] ${cardSurface}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
          <MessageSquare className="w-4 h-4" style={{ color: accentColor }} />
          <span>Chat da Sala ({roomCode})</span>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold opacity-65">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Privado 2P
        </span>
      </div>

      {/* Unified Chronological Messages Container (flex flex-col) */}
      <div
        data-testid="chat-messages-container"
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2"
      >
        {chronologicalMessages.length === 0 ? (
          <div className="my-auto text-center px-3 py-6 text-xs font-semibold opacity-55">
            Chat privado entre os 2 jogadores da sala.
            <br />
            Envie uma saudação para começar!
          </div>
        ) : (
          chronologicalMessages.map((msg) => {
            // Identify sender strictly by unique player identifier (playerId)
            const isOwnMessage = msg.senderId === playerId;
            const senderBubbleColor =
              msg.senderColor === 'red' ? redColor : blueColor;

            return (
              <div
                key={msg.id}
                data-testid="chat-message-row"
                data-own={isOwnMessage ? 'true' : 'false'}
                className={`w-full flex ${
                  isOwnMessage ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex flex-col max-w-[85%] ${
                    isOwnMessage ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: senderBubbleColor }}
                    />
                    <span className="text-[10px] font-black opacity-75">
                      {isOwnMessage ? 'Você' : msg.senderName} (
                      {msg.senderRole === 'host' ? 'Vermelho' : 'Azul'})
                    </span>
                    <span className="text-[9px] font-mono opacity-50">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  <div
                    className={`px-3 py-2 rounded-2xl text-xs font-bold break-words shadow-sm ${
                      isOwnMessage
                        ? 'text-white rounded-br-sm'
                        : darkMode
                        ? 'bg-[#28304C] text-slate-100 border border-[#384369] rounded-bl-sm'
                        : 'bg-[#F5F1E8] text-slate-800 border border-[#E2D9C5] rounded-bl-sm'
                    }`}
                    style={
                      isOwnMessage
                        ? { backgroundColor: senderBubbleColor }
                        : undefined
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {errorMsg && (
        <div className="mt-1.5 text-[11px] font-bold text-red-500">
          {errorMsg}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="mt-2.5 flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) =>
              setInputText(e.target.value.slice(0, MAX_CHAT_MESSAGE_LENGTH))
            }
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            className={`w-full pl-3 pr-10 py-2 rounded-xl text-xs font-bold border-2 outline-none transition-colors ${
              darkMode
                ? 'bg-[#151929] border-[#2E3654] text-slate-100 focus:border-sky-400'
                : 'bg-slate-50 border-[#DFD5C4] text-slate-800 focus:border-sky-500'
            }`}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold opacity-45">
            {inputText.length}/{MAX_CHAT_MESSAGE_LENGTH}
          </span>
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          aria-label="Enviar mensagem"
          className="p-2.5 rounded-xl text-white border-2 border-b-4 transition-all active:translate-y-0.5 active:border-b-2 disabled:opacity-40 disabled:pointer-events-none shrink-0"
          style={{
            backgroundColor: accentColor,
            borderColor: 'rgba(0,0,0,0.25)',
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
