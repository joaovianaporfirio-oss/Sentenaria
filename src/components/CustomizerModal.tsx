import React from 'react';
import {
  Check,
  Eye,
  Grid,
  Moon,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  BoardStyle,
  CustomizationSettings,
  SymbolStyle,
  ThemePresetId,
} from '../core/types';
import {
  BOARD_STYLE_OPTIONS,
  DEFAULT_CUSTOMIZATION,
  SYMBOL_STYLE_OPTIONS,
  THEME_PRESETS,
} from '../customization/themePresets';
import { PlayerSymbol } from './PlayerSymbol';

interface CustomizerModalProps {
  customization: CustomizationSettings;
  onUpdateCustomization: (next: CustomizationSettings) => void;
  onClose: () => void;
}

const RED_SWATCHES = [
  '#FF4B4B',
  '#E63946',
  '#F43F5E',
  '#EA580C',
  '#D946EF',
  '#DC2626',
];
const BLUE_SWATCHES = [
  '#1CB0F6',
  '#2A6F97',
  '#38BDF8',
  '#2563EB',
  '#0D9488',
  '#6366F1',
];
const ACCENT_SWATCHES = [
  '#00B4D8',
  '#58CC02',
  '#F4A261',
  '#818CF8',
  '#A855F7',
  '#EC4899',
];
const BG_LIGHT_SWATCHES = [
  '#F2F6FA',
  '#FBF6EE',
  '#F7F9FA',
  '#EEF2FF',
  '#FDF2F8',
  '#F0FDF4',
];
const BG_DARK_SWATCHES = [
  '#131824',
  '#111522',
  '#1C1917',
  '#0D1017',
  '#131F24',
  '#1E1B2E',
];

export const CustomizerModal: React.FC<CustomizerModalProps> = ({
  customization,
  onUpdateCustomization,
  onClose,
}) => {
  const {
    presetId,
    darkMode,
    redColor,
    blueColor,
    accentColor,
    bgColorLight,
    bgColorDark,
    boardStyle,
    symbolStyle,
  } = customization;

  const applyPreset = (id: ThemePresetId) => {
    soundEngine.playMenuClick();
    if (id === 'custom') {
      onUpdateCustomization({ ...customization, presetId: 'custom' });
      return;
    }
    const preset = THEME_PRESETS[id];
    onUpdateCustomization({
      ...customization,
      ...preset.settings,
    });
  };

  const updateCustomField = <K extends keyof CustomizationSettings>(
    key: K,
    value: CustomizationSettings[K]
  ) => {
    onUpdateCustomization({
      ...customization,
      presetId: 'custom',
      [key]: value,
    });
  };

  const handleResetDefault = () => {
    soundEngine.playMenuSecondary();
    onUpdateCustomization({ ...DEFAULT_CUSTOMIZATION });
  };

  const modalSurface = darkMode
    ? 'bg-[#191E30] border-[#2E3654] text-slate-100'
    : 'bg-[#FAF8F5] border-[#DFD5C4] text-slate-800';

  const sectionCard = darkMode
    ? 'bg-[#222840] border-[#333C5E]'
    : 'bg-white border-[#E5DEC9]';

  // Preview mini-board surface helper
  const getPreviewBoardSurface = () => {
    if (boardStyle === 'wood_table') {
      return darkMode
        ? 'bg-[#2B2118] border-[#4A3728]'
        : 'bg-[#DFC39D] border-[#B8926A]';
    }
    if (boardStyle === 'wii_gloss') {
      return darkMode
        ? 'bg-[#192236] border-[#2E3E5C]'
        : 'bg-white border-[#C8E0F4]';
    }
    if (boardStyle === 'minimal_grid') {
      return darkMode
        ? 'bg-[#141824] border-[#2A3045]'
        : 'bg-white border-slate-300';
    }
    return darkMode
      ? 'bg-[#1D2235] border-[#323B59]'
      : 'bg-[#FAF6F0] border-[#E2D9C8]';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div
        className={`w-full max-w-5xl rounded-3xl border-4 p-4 sm:p-6 my-auto max-h-[92vh] overflow-y-auto shadow-2xl ${modalSurface}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b-2 border-black/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow"
              style={{ backgroundColor: accentColor }}
            >
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display">
                Estúdio de Personalização
              </h2>
              <p className="text-xs font-bold opacity-70">
                Todas as alterações são salvas automaticamente e aplicadas em
                tempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold border-2 border-b-4 flex items-center gap-1.5 transition-all active:translate-y-0.5 ${
                darkMode
                  ? 'bg-[#262D47] border-[#384266] text-slate-200'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restaurar Padrão</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playMenuSecondary();
                onClose();
              }}
              aria-label="Fechar Personalizador"
              className="p-2 rounded-xl font-black text-white border-2 border-b-4 transition-all active:translate-y-0.5"
              style={{
                backgroundColor: accentColor,
                borderColor: 'rgba(0,0,0,0.25)',
              }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Grid: Left Controls (7 cols) + Right Live Preview (5 cols) */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* 1. Theme Presets & Dark Mode */}
            <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider opacity-75 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
                  Temas Visuais Predefinidos
                </span>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playMenuClick();
                    onUpdateCustomization({
                      ...customization,
                      darkMode: !darkMode,
                    });
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold border-2 flex items-center gap-1.5 ${
                    darkMode
                      ? 'bg-indigo-950/80 border-indigo-500/50 text-amber-300'
                      : 'bg-amber-50 border-amber-300 text-slate-800'
                  }`}
                >
                  {darkMode ? (
                    <>
                      <Moon className="w-3.5 h-3.5" /> Modo Escuro Ativo
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5" /> Modo Claro Ativo
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((id) => {
                  const preset = THEME_PRESETS[id];
                  const active = presetId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => applyPreset(id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                        active
                          ? darkMode
                            ? 'bg-[#2C3554] border-sky-400'
                            : 'bg-sky-50/90 border-sky-500'
                          : darkMode
                          ? 'bg-[#1B2033] border-[#2C3452] hover:bg-[#242B44]'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                      style={
                        active ? { borderColor: accentColor } : undefined
                      }
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs sm:text-sm truncate font-display">
                            {preset.name}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
                            {preset.badge}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold opacity-70 truncate mt-0.5">
                          {preset.subtitle}
                        </div>
                      </div>

                      {/* Mini color dots */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/60"
                          style={{ backgroundColor: preset.settings.redColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/60"
                          style={{ backgroundColor: preset.settings.blueColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/60"
                          style={{
                            backgroundColor: preset.settings.accentColor,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Custom Color Pickers */}
            <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
              <div className="text-xs font-black uppercase tracking-wider opacity-75 mb-3">
                Paleta de Cores Personalizada
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Red Player Color */}
                <div>
                  <label className="text-xs font-extrabold flex items-center justify-between mb-1.5">
                    <span>Cor do Jogador Vermelho</span>
                    <input
                      type="color"
                      value={redColor}
                      onChange={(e) =>
                        updateCustomField('redColor', e.target.value)
                      }
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                  <div className="flex items-center gap-1.5">
                    {RED_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          soundEngine.playMenuClick();
                          updateCustomField('redColor', c);
                        }}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                          redColor.toLowerCase() === c.toLowerCase()
                            ? 'scale-110 border-white ring-2 ring-current'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Cor vermelha ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Blue Player Color */}
                <div>
                  <label className="text-xs font-extrabold flex items-center justify-between mb-1.5">
                    <span>Cor do Jogador Azul</span>
                    <input
                      type="color"
                      value={blueColor}
                      onChange={(e) =>
                        updateCustomField('blueColor', e.target.value)
                      }
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                  <div className="flex items-center gap-1.5">
                    {BLUE_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          soundEngine.playMenuClick();
                          updateCustomField('blueColor', c);
                        }}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                          blueColor.toLowerCase() === c.toLowerCase()
                            ? 'scale-110 border-white ring-2 ring-current'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Cor azul ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Interface Accent Color */}
                <div>
                  <label className="text-xs font-extrabold flex items-center justify-between mb-1.5">
                    <span>Cor de Destaque da Interface</span>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) =>
                        updateCustomField('accentColor', e.target.value)
                      }
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                  <div className="flex items-center gap-1.5">
                    {ACCENT_SWATCHES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          soundEngine.playMenuClick();
                          updateCustomField('accentColor', c);
                        }}
                        className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                          accentColor.toLowerCase() === c.toLowerCase()
                            ? 'scale-110 border-white ring-2 ring-current'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Cor de destaque ${c}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Background Color (Light or Dark depending on active mode) */}
                <div>
                  <label className="text-xs font-extrabold flex items-center justify-between mb-1.5">
                    <span>
                      Cor de Fundo ({darkMode ? 'Tema Escuro' : 'Tema Claro'})
                    </span>
                    <input
                      type="color"
                      value={darkMode ? bgColorDark : bgColorLight}
                      onChange={(e) =>
                        updateCustomField(
                          darkMode ? 'bgColorDark' : 'bgColorLight',
                          e.target.value
                        )
                      }
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </label>
                  <div className="flex items-center gap-1.5">
                    {(darkMode ? BG_DARK_SWATCHES : BG_LIGHT_SWATCHES).map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            soundEngine.playMenuClick();
                            updateCustomField(
                              darkMode ? 'bgColorDark' : 'bgColorLight',
                              c
                            );
                          }}
                          className={`w-7 h-7 rounded-lg border-2 transition-transform ${
                            (darkMode
                              ? bgColorDark
                              : bgColorLight
                            ).toLowerCase() === c.toLowerCase()
                              ? 'scale-110 border-sky-400 ring-2 ring-sky-400'
                              : 'border-slate-400/40 opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={`Cor de fundo ${c}`}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Board Style & Symbol Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Board Surface Style */}
              <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
                <div className="text-xs font-black uppercase tracking-wider opacity-75 mb-2.5 flex items-center gap-1.5">
                  <Grid className="w-4 h-4" style={{ color: accentColor }} />
                  Aparência do Tabuleiro
                </div>
                <div className="flex flex-col gap-2">
                  {BOARD_STYLE_OPTIONS.map((opt) => {
                    const active = boardStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playMenuClick();
                          onUpdateCustomization({
                            ...customization,
                            boardStyle: opt.id as BoardStyle,
                          });
                        }}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          active
                            ? darkMode
                              ? 'bg-[#2C3554]'
                              : 'bg-sky-50/80'
                            : darkMode
                            ? 'bg-[#1B2033] border-[#2C3452]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                        style={
                          active ? { borderColor: accentColor } : undefined
                        }
                      >
                        <div>
                          <div className="font-black text-xs">{opt.name}</div>
                          <div className="text-[10px] font-semibold opacity-70">
                            {opt.description}
                          </div>
                        </div>
                        {active && (
                          <Check
                            className="w-4 h-4 shrink-0"
                            style={{ color: accentColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Symbol Style */}
              <div className={`p-4 rounded-2xl border-2 ${sectionCard}`}>
                <div className="text-xs font-black uppercase tracking-wider opacity-75 mb-2.5 flex items-center gap-1.5">
                  <Sparkles
                    className="w-4 h-4"
                    style={{ color: accentColor }}
                  />
                  Estilo dos Símbolos
                </div>
                <div className="flex flex-col gap-2">
                  {SYMBOL_STYLE_OPTIONS.map((opt) => {
                    const active = symbolStyle === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          soundEngine.playMenuClick();
                          onUpdateCustomization({
                            ...customization,
                            symbolStyle: opt.id as SymbolStyle,
                          });
                        }}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between gap-2 ${
                          active
                            ? darkMode
                              ? 'bg-[#2C3554]'
                              : 'bg-sky-50/80'
                            : darkMode
                            ? 'bg-[#1B2033] border-[#2C3452]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                        style={
                          active ? { borderColor: accentColor } : undefined
                        }
                      >
                        <div className="min-w-0">
                          <div className="font-black text-xs">{opt.name}</div>
                          <div className="text-[10px] font-semibold opacity-70 truncate">
                            {opt.description}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <PlayerSymbol
                            player="red"
                            symbolStyle={opt.id}
                            color={redColor}
                            size="sm"
                          />
                          <PlayerSymbol
                            player="blue"
                            symbolStyle={opt.id}
                            color={blueColor}
                            size="sm"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Interactive Preview */}
          <div className="lg:col-span-5 lg:sticky lg:top-2">
            <div
              className="p-5 rounded-3xl border-4 transition-colors duration-300 shadow-xl"
              style={{
                backgroundColor: darkMode ? bgColorDark : bgColorLight,
                borderColor: darkMode ? '#2E3654' : '#DFD5C4',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 opacity-80">
                  <Eye className="w-4 h-4" style={{ color: accentColor }} />
                  Prévia em Tempo Real
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {THEME_PRESETS[presetId]?.name ?? 'Personalizado'}
                </span>
              </div>

              {/* Mini Score Bar Preview */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div
                  className="p-2.5 rounded-2xl border-2 flex items-center justify-between"
                  style={{
                    backgroundColor: darkMode ? '#1E2336' : '#FFFFFF',
                    borderColor: redColor,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <PlayerSymbol
                      player="red"
                      symbolStyle={symbolStyle}
                      color={redColor}
                      size="sm"
                    />
                    <span
                      className="text-xs font-black"
                      style={{ color: redColor }}
                    >
                      Vermelho
                    </span>
                  </div>
                  <span
                    className="text-lg font-black font-display"
                    style={{ color: redColor }}
                  >
                    4
                  </span>
                </div>

                <div
                  className="p-2.5 rounded-2xl border-2 flex items-center justify-between"
                  style={{
                    backgroundColor: darkMode ? '#1E2336' : '#FFFFFF',
                    borderColor: blueColor,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <PlayerSymbol
                      player="blue"
                      symbolStyle={symbolStyle}
                      color={blueColor}
                      size="sm"
                    />
                    <span
                      className="text-xs font-black"
                      style={{ color: blueColor }}
                    >
                      Azul
                    </span>
                  </div>
                  <span
                    className="text-lg font-black font-display"
                    style={{ color: blueColor }}
                  >
                    3
                  </span>
                </div>
              </div>

              {/* 5x5 Sample Board Preview with Trinca Line & Center Highlight */}
              <div
                className={`relative aspect-square p-3 rounded-2xl border-4 ${getPreviewBoardSurface()}`}
              >
                <div className="grid grid-cols-5 grid-rows-5 gap-1.5 w-full h-full">
                  {Array.from({ length: 25 }, (_, idx) => {
                    const r = Math.floor(idx / 5);
                    const c = idx % 5;
                    const isSampleCenter = r >= 1 && r <= 3 && c >= 1 && c <= 3;

                    // Sample pieces: Red trinca at top row (0,0)-(0,1)-(0,2), Blue diagonal in center (1,1)-(2,2)-(3,3)
                    let owner: 'red' | 'blue' | null = null;
                    let inTrinca = false;
                    let trincaCount = 0;

                    if (r === 0 && (c === 0 || c === 1 || c === 2)) {
                      owner = 'red';
                      inTrinca = true;
                      trincaCount = c === 2 ? 2 : 1;
                    } else if ((r === 1 || r === 2) && c === 4) {
                      owner = 'red';
                    } else if (
                      (r === 1 && c === 1) ||
                      (r === 2 && c === 2) ||
                      (r === 3 && c === 3)
                    ) {
                      owner = 'blue';
                      inTrinca = true;
                      trincaCount = 1;
                    } else if (r === 3 && c === 1) {
                      owner = 'blue';
                    }

                    const pieceColor = owner === 'red' ? redColor : blueColor;

                    return (
                      <div
                        key={idx}
                        className={`relative rounded-lg flex items-center justify-center border ${
                          isSampleCenter
                            ? darkMode
                              ? 'bg-white/5 border-dashed border-white/25'
                              : 'bg-black/5 border-dashed border-black/20'
                            : darkMode
                            ? 'bg-white/5 border-white/10'
                            : 'bg-white/90 border-black/10'
                        }`}
                        style={{
                          backgroundColor: inTrinca
                            ? `${pieceColor}25`
                            : undefined,
                          borderColor: inTrinca ? `${pieceColor}88` : undefined,
                        }}
                      >
                        {owner && (
                          <PlayerSymbol
                            player={owner}
                            symbolStyle={symbolStyle}
                            color={pieceColor}
                            inTrinca={inTrinca}
                            trincaCount={trincaCount}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sample SVG Trinca Lines */}
                <svg
                  viewBox="0 0 500 500"
                  className="pointer-events-none absolute inset-0 w-full h-full p-3"
                >
                  {/* Red Horizontal Trinca */}
                  <line
                    x1="50"
                    y1="50"
                    x2="250"
                    y2="50"
                    stroke="#FFFFFF"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <line
                    x1="50"
                    y1="50"
                    x2="250"
                    y2="50"
                    stroke={redColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                  />

                  {/* Blue Diagonal Trinca */}
                  <line
                    x1="150"
                    y1="150"
                    x2="350"
                    y2="350"
                    stroke="#FFFFFF"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <line
                    x1="150"
                    y1="150"
                    x2="350"
                    y2="350"
                    stroke={blueColor}
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Sample Accent CTA Button */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playMenuClick();
                  onClose();
                }}
                className="mt-4 w-full py-3 px-4 rounded-2xl font-black text-sm text-white border-2 border-b-4 transition-all active:translate-y-0.5 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: accentColor,
                  borderColor: 'rgba(0,0,0,0.25)',
                }}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Concluir e Aplicar Visual</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
