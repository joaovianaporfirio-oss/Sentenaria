import { DEFAULT_GAME_CONFIG } from '../core/gameEngine';
import {
  AudioSettings,
  CustomizationSettings,
  GameConfig,
} from '../core/types';
import { DEFAULT_CUSTOMIZATION } from '../customization/themePresets';

const STORAGE_KEYS = {
  CUSTOMIZATION: 'sentenaria_customization_v1',
  AUDIO: 'sentenaria_audio_v1',
  GAME_CONFIG: 'sentenaria_game_config_v1',
  STATS: 'sentenaria_stats_v1',
} as const;

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  soundEnabled: true,
  musicEnabled: false,
  masterVolume: 0.75,
};

export interface PlayerStats {
  matchesPlayed: number;
  redWins: number;
  blueWins: number;
  draws: number;
  aiWins: number;
  totalTrincasFormed: number;
}

export const DEFAULT_STATS: PlayerStats = {
  matchesPlayed: 0,
  redWins: 0,
  blueWins: 0,
  draws: 0,
  aiWins: 0,
  totalTrincasFormed: 0,
};

export function loadCustomizationSettings(): CustomizationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMIZATION);
    if (!raw) return { ...DEFAULT_CUSTOMIZATION };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CUSTOMIZATION,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_CUSTOMIZATION };
  }
}

export function saveCustomizationSettings(
  settings: CustomizationSettings
): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMIZATION, JSON.stringify(settings));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

export function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIO);
    if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIO, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function loadGameConfig(): GameConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAME_CONFIG);
    if (!raw) return { ...DEFAULT_GAME_CONFIG };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_GAME_CONFIG,
      ...parsed,
    };
  } catch {
    return { ...DEFAULT_GAME_CONFIG };
  }
}

export function saveGameConfig(config: GameConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GAME_CONFIG, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

export function loadPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return { ...DEFAULT_STATS };
    return { ...DEFAULT_STATS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function savePlayerStats(stats: PlayerStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}
