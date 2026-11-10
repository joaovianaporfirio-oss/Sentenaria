import React from 'react';
import {
  Award,
  Check,
  Eye,
  Settings,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { AudioSettings, CustomizationSettings } from '../core/types';
import { PlayerStats } from '../settings/storageManager';

interface SettingsModalProps {
  customization: CustomizationSettings;
  audioSettings: AudioSettings;
  stats: PlayerStats;
  onUpdateCustomization: (next: CustomizationSettings) => void;
  onUpdateAudio: (next: AudioSettings) => void;
  onResetStats: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  customization,
  audioSettings,
  stats,
  onUpdateCustomization,
  onUpdateAudio,
  onResetStats,
  onClose,
}) => {
  const { darkMode, accentColor, redColor, blueColor } = customization;

  const modalSurface = darkMode
    ? 'bg-[#191E30] border-[#2E3654] text-slate-100'
    : 'bg-[#FAF8F5] border-[#DFD5C4] text-slate-800';

  const sectionCard = darkMode
    ? 'bg-[#222840] border-[#333C5E]'
    : 'bg-white border-[#E5DEC9]';

  const toggleSound = () => {
    const next = {
      ...audioSettings,
      soundEnabled: !audioSettings.soundEnabled,
    };
    onUpdateAudio(next);
    if (next.soundEnabled) {
      setTimeout(() => soundEngine.playTrincaFormed(1), 50);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-3xl border-4 p-5 sm:p-6 my-auto shadow-2xl ${modalSurface}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow"
              style={{ backgroundColor: accentColor }}
            >
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display">
                Configurações
              </h2>
              <p className="text-xs font-bold opacity-70">
                Áudio, preferências de interface e histórico local
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuSecondary();
              onClose();
            }}
            aria-label="Fechar Configurações"
            className="p-2 rounded-xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5"
            style={{
              backgroundColor: accentColor,
              borderColor: 'rgba(0,0,0,0.25)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {/* Audio Section */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="text-xs font-black uppercase tracking-wider opacity-75 mb-3 flex items-center gap-1.5">
              {audioSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4" style={{ color: accentColor }} />
              ) : (
                <VolumeX className="w-4 h-4 opacity-60" />
              )}
              <span>Efeitos Sonoros</span>
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="font-extrabold text-sm">
                  Sons de Jogo e Menus
                </div>
                <div className="text-xs font-semibold opacity-70">
                  Colocação de peças, trincas, pontuação e vitória
                </div>
              </div>

              <button
                type="button"
                onClick={toggleSound}
                className={`px-4 py-2 rounded-xl font-black text-xs border-2 border-b-4 transition-all active:translate-y-0.5 ${
                  audioSettings.soundEnabled
                    ? 'text-white'
                    : darkMode
                    ? 'bg-[#181D2E] border-[#2C3450] text-slate-400'
                    : 'bg-slate-200 border-slate-300 text-slate-600'
                }`}
                style={
                  audioSettings.soundEnabled
                    ? {
                        backgroundColor: accentColor,
                        borderColor: 'rgba(0,0,0,0.25)',
                      }
                    : undefined
                }
              >
                {audioSettings.soundEnabled ? 'ATIVADO' : 'DESLIGADO'}
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-extrabold">
                <span>Volume Geral</span>
                <span>{Math.round(audioSettings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                disabled={!audioSettings.soundEnabled}
                value={audioSettings.masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdateAudio({
                    ...audioSettings,
                    masterVolume: val,
                  });
                }}
                onMouseUp={() => soundEngine.playMenuClick()}
                onTouchEnd={() => soundEngine.playMenuClick()}
                className="w-full accent-sky-500 cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          {/* Interface & Accessibility Options */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="text-xs font-black uppercase tracking-wider opacity-75 mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4" style={{ color: accentColor }} />
              <span>Tabuleiro & Animações</span>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-extrabold text-sm">
                    Coordenadas do Tabuleiro (A–I / 1–9)
                  </div>
                  <div className="text-xs font-semibold opacity-70">
                    Facilita acompanhar o histórico de jogadas
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={customization.showCoordinates}
                  onChange={(e) => {
                    soundEngine.playMenuClick();
                    onUpdateCustomization({
                      ...customization,
                      showCoordinates: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 rounded accent-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-extrabold text-sm">
                    Indicadores Visuais da Região Central
                  </div>
                  <div className="text-xs font-semibold opacity-70">
                    Mostra dicas sutis nas casas centrais quando liberadas
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={customization.showMoveHints}
                  onChange={(e) => {
                    soundEngine.playMenuClick();
                    onUpdateCustomization({
                      ...customization,
                      showMoveHints: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 rounded accent-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>Animações e Celebrações</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xs font-semibold opacity-70">
                    Efeitos suaves ao posicionar peças, formar trincas e vencer
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={customization.animationsEnabled}
                  onChange={(e) => {
                    soundEngine.playMenuClick();
                    onUpdateCustomization({
                      ...customization,
                      animationsEnabled: e.target.checked,
                    });
                  }}
                  className="w-5 h-5 rounded accent-sky-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Player Statistics */}
          <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider opacity-75 flex items-center gap-1.5">
                <Award className="w-4 h-4" style={{ color: accentColor }} />
                Estatísticas Salvas no Dispositivo
              </span>

              {stats.matchesPlayed > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playMenuSecondary();
                    onResetStats();
                  }}
                  className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zerar</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                <div className="text-xl font-black font-display">
                  {stats.matchesPlayed}
                </div>
                <div className="text-[11px] font-bold opacity-70">Partidas</div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                <div
                  className="text-xl font-black font-display"
                  style={{ color: redColor }}
                >
                  {stats.redWins}
                </div>
                <div className="text-[11px] font-bold opacity-70">
                  Vitórias Vermelho
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                <div
                  className="text-xl font-black font-display"
                  style={{ color: blueColor }}
                >
                  {stats.blueWins}
                </div>
                <div className="text-[11px] font-bold opacity-70">
                  Vitórias Azul
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                <div
                  className="text-xl font-black font-display"
                  style={{ color: accentColor }}
                >
                  {stats.totalTrincasFormed}
                </div>
                <div className="text-[11px] font-bold opacity-70">
                  Trincas Totais
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playMenuClick();
              onClose();
            }}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5 flex items-center justify-center gap-2"
            style={{
              backgroundColor: accentColor,
              borderColor: 'rgba(0,0,0,0.25)',
            }}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar e Voltar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
