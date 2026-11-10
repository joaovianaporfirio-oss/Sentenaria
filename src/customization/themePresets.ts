import {
  BoardStyle,
  CustomizationSettings,
  SymbolStyle,
  ThemePresetId,
} from '../core/types';

export interface ThemePresetDefinition {
  id: ThemePresetId;
  name: string;
  subtitle: string;
  badge: string;
  settings: Omit<
    CustomizationSettings,
    'showCoordinates' | 'showMoveHints' | 'animationsEnabled'
  >;
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  wii_plaza: {
    id: 'wii_plaza',
    name: 'Wii Plaza Clássico',
    subtitle: 'Cartões leves, bordas suaves e azul cristalino inspirado no Wii Shop',
    badge: 'Padrão',
    settings: {
      presetId: 'wii_plaza',
      darkMode: false,
      redColor: '#FF4B4B',
      blueColor: '#1CB0F6',
      accentColor: '#00B4D8',
      bgColorLight: '#F2F6FA',
      bgColorDark: '#131824',
      boardStyle: 'paper_craft',
      symbolStyle: 'classic_xo',
    },
  },
  paper_kingdom: {
    id: 'paper_kingdom',
    name: 'Reino de Papel',
    subtitle: 'Textura acolhedora de papel recortado artesanal e tons de tabuleiro físico',
    badge: 'Paper Craft',
    settings: {
      presetId: 'paper_kingdom',
      darkMode: false,
      redColor: '#E63946',
      blueColor: '#2A6F97',
      accentColor: '#F4A261',
      bgColorLight: '#FBF6EE',
      bgColorDark: '#1C1917',
      boardStyle: 'wood_table',
      symbolStyle: 'paper_stamps',
    },
  },
  duo_pop: {
    id: 'duo_pop',
    name: 'Pop Expressivo',
    subtitle: 'Cores vibrantes, alto contraste e botões táteis cheios de energia',
    badge: 'Vibrante',
    settings: {
      presetId: 'duo_pop',
      darkMode: false,
      redColor: '#FF4B4B',
      blueColor: '#1CB0F6',
      accentColor: '#58CC02',
      bgColorLight: '#F7F9FA',
      bgColorDark: '#131F24',
      boardStyle: 'wii_gloss',
      symbolStyle: 'royal_emblems',
    },
  },
  midnight_ink: {
    id: 'midnight_ink',
    name: 'Tinta da Meia-Noite',
    subtitle: 'Tema escuro profundo com camadas elegantes e destaque luminoso para as peças',
    badge: 'Escuro',
    settings: {
      presetId: 'midnight_ink',
      darkMode: true,
      redColor: '#FF5C77',
      blueColor: '#38BDF8',
      accentColor: '#818CF8',
      bgColorLight: '#F2F6FA',
      bgColorDark: '#111522',
      boardStyle: 'paper_craft',
      symbolStyle: 'classic_xo',
    },
  },
  obsidian_neon: {
    id: 'obsidian_neon',
    name: 'Obsidiana Tática',
    subtitle: 'Contraste escuro de alta precisão com runas geométricas e acentos elétricos',
    badge: 'Escuro Pro',
    settings: {
      presetId: 'obsidian_neon',
      darkMode: true,
      redColor: '#FB7185',
      blueColor: '#22D3EE',
      accentColor: '#A855F7',
      bgColorLight: '#F4F4F8',
      bgColorDark: '#0D1017',
      boardStyle: 'minimal_grid',
      symbolStyle: 'geometric_runes',
    },
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    subtitle: 'Sua combinação exclusiva de cores, superfície e estilo de símbolos',
    badge: 'Custom',
    settings: {
      presetId: 'custom',
      darkMode: false,
      redColor: '#FF4B4B',
      blueColor: '#1CB0F6',
      accentColor: '#00B4D8',
      bgColorLight: '#F2F6FA',
      bgColorDark: '#131824',
      boardStyle: 'paper_craft',
      symbolStyle: 'classic_xo',
    },
  },
};

export const BOARD_STYLE_OPTIONS: Array<{
  id: BoardStyle;
  name: string;
  description: string;
}> = [
  {
    id: 'paper_craft',
    name: 'Papel Recortado',
    description: 'Camadas de cartão com relevo suave e costura na zona central',
  },
  {
    id: 'wii_gloss',
    name: 'Cápsula Wii Channel',
    description: 'Casas arredondadas com brilho translúcido e visual amigável',
  },
  {
    id: 'wood_table',
    name: 'Mesa de Madeira',
    description: 'Visual de jogo de tabuleiro clássico em madeira aquecida',
  },
  {
    id: 'minimal_grid',
    name: 'Grade Arquitetônica',
    description: 'Linhas precisas e foco absoluto na leitura estratégica',
  },
];

export const SYMBOL_STYLE_OPTIONS: Array<{
  id: SymbolStyle;
  name: string;
  description: string;
}> = [
  {
    id: 'classic_xo',
    name: 'Clássico X & O',
    description: 'Símbolos X e O recortados em papel com borda destacada',
  },
  {
    id: 'paper_stamps',
    name: 'Origami Estrela & Anel',
    description: 'Estrela de 4 pontas e selo concêntrico com estética artesanal',
  },
  {
    id: 'royal_emblems',
    name: 'Insígnias Reais',
    description: 'Coroa imperial contra Escudo guardião com estilo expressivo',
  },
  {
    id: 'geometric_runes',
    name: 'Runas Geométricas',
    description: 'Cruz tática e Cristal losangular para leitura rápida',
  },
];

export const DEFAULT_CUSTOMIZATION: CustomizationSettings = {
  ...THEME_PRESETS.wii_plaza.settings,
  showCoordinates: true,
  showMoveHints: true,
  animationsEnabled: true,
};
