import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { soundEngine } from './audio/soundEngine';
import { ActiveOnlineSession, GameScreen } from './components/GameScreen';
import { MainMenu } from './components/MainMenu';
import { createInitialGameState } from './core/gameEngine';
import {
  AudioSettings,
  CustomizationSettings,
  GameConfig,
  GameState,
} from './core/types';
import { ensurePlayerIdentity } from './online/firebaseConfig';
import {
  DEFAULT_STATS,
  loadAudioSettings,
  loadCustomizationSettings,
  loadGameConfig,
  loadPlayerStats,
  PlayerStats,
  saveAudioSettings,
  saveCustomizationSettings,
  saveGameConfig,
  savePlayerStats,
} from './settings/storageManager';

const CustomizerModal = lazy(() =>
  import('./components/CustomizerModal').then((m) => ({
    default: m.CustomizerModal,
  }))
);
const OnlineLobbyModal = lazy(() =>
  import('./components/OnlineLobbyModal').then((m) => ({
    default: m.OnlineLobbyModal,
  }))
);
const RulesModal = lazy(() =>
  import('./components/RulesModal').then((m) => ({
    default: m.RulesModal,
  }))
);
const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then((m) => ({
    default: m.SettingsModal,
  }))
);

type ActiveScreen = 'menu' | 'game';
type ActiveModal = 'none' | 'customizer' | 'settings' | 'rules' | 'online_lobby';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<ActiveScreen>('menu');
  const [modal, setModal] = useState<ActiveModal>('none');
  const [onlineSession, setOnlineSession] =
    useState<ActiveOnlineSession | null>(null);

  const [config, setConfig] = useState<GameConfig>(() => loadGameConfig());
  const [customization, setCustomization] = useState<CustomizationSettings>(
    () => loadCustomizationSettings()
  );
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() =>
    loadAudioSettings()
  );
  const [stats, setStats] = useState<PlayerStats>(() => loadPlayerStats());

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(loadGameConfig())
  );
  const prevGameStateRef = useRef<GameState>(gameState);

  // Authenticate anonymously with Firebase Auth as soon as the app opens
  useEffect(() => {
    ensurePlayerIdentity().catch(() => {});
  }, []);

  // Sync dark mode class on root html element & persist customization
  useEffect(() => {
    const root = document.documentElement;
    if (customization.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveCustomizationSettings(customization);
  }, [customization]);

  // Sync audio engine & persist audio settings
  useEffect(() => {
    soundEngine.updateSettings(audioSettings);
    saveAudioSettings(audioSettings);
  }, [audioSettings]);

  // Persist game config
  useEffect(() => {
    saveGameConfig(config);
  }, [config]);

  const handleUpdateConfig = (partial: Partial<GameConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  };

  const handleStartGame = () => {
    if (config.opponentMode === 'online') {
      setModal('online_lobby');
      return;
    }
    setOnlineSession(null);
    const freshState = createInitialGameState(config);
    prevGameStateRef.current = freshState;
    setGameState(freshState);
    setScreen('game');
  };

  const handleEnterOnlineMatch = (session: ActiveOnlineSession) => {
    setOnlineSession(session);
    prevGameStateRef.current = session.roomData.gameState;
    setGameState(session.roomData.gameState);
    setModal('none');
    setScreen('game');
  };

  const handleRestartMatch = () => {
    const freshState = createInitialGameState(gameState.config);
    prevGameStateRef.current = freshState;
    setGameState(freshState);
  };

  const handleUpdateGameState = useCallback((nextState: GameState) => {
    const prevGameState = prevGameStateRef.current;
    prevGameStateRef.current = nextState;

    const turnAdvanced = nextState.turnCount > prevGameState.turnCount;
    const newTrincas = turnAdvanced
      ? (nextState.lastMove?.pointsEarned ?? 0)
      : 0;
    const justFinished =
      prevGameState.status === 'playing' && nextState.status === 'finished';

    setGameState(nextState);

    if (newTrincas > 0 || justFinished) {
      setStats((prev) => {
        const updated: PlayerStats = {
          ...prev,
          totalTrincasFormed: prev.totalTrincasFormed + newTrincas,
          matchesPlayed: justFinished
            ? prev.matchesPlayed + 1
            : prev.matchesPlayed,
          redWins:
            justFinished && nextState.winner === 'red'
              ? prev.redWins + 1
              : prev.redWins,
          blueWins:
            justFinished && nextState.winner === 'blue'
              ? prev.blueWins + 1
              : prev.blueWins,
          draws:
            justFinished && nextState.winner === 'draw'
              ? prev.draws + 1
              : prev.draws,
          aiWins:
            justFinished &&
            nextState.config.opponentMode === 'ai' &&
            nextState.winner === nextState.config.aiPlayer
              ? prev.aiWins + 1
              : prev.aiWins,
        };
        savePlayerStats(updated);
        return updated;
      });
    }
  }, []);

  const handleToggleDarkMode = () => {
    setCustomization((prev) => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  };

  const handleToggleSound = () => {
    setAudioSettings((prev) => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      if (next.soundEnabled) {
        setTimeout(() => soundEngine.playMenuClick(), 30);
      }
      return next;
    });
  };

  const handleResetStats = () => {
    const fresh = { ...DEFAULT_STATS };
    setStats(fresh);
    savePlayerStats(fresh);
  };

  const activeBgColor = customization.darkMode
    ? customization.bgColorDark
    : customization.bgColorLight;

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 font-sans ${
        customization.darkMode
          ? 'wii-dot-pattern-dark text-slate-100'
          : 'wii-dot-pattern-light text-slate-800'
      }`}
      style={{ backgroundColor: activeBgColor }}
    >
      {screen === 'menu' ? (
        <MainMenu
          config={config}
          customization={customization}
          audioSettings={audioSettings}
          stats={stats}
          onUpdateConfig={handleUpdateConfig}
          onStartGame={handleStartGame}
          onOpenCustomizer={() => setModal('customizer')}
          onOpenSettings={() => setModal('settings')}
          onOpenRules={() => setModal('rules')}
          onToggleDarkMode={handleToggleDarkMode}
          onToggleSound={handleToggleSound}
        />
      ) : (
        <GameScreen
          gameState={gameState}
          customization={customization}
          audioSettings={audioSettings}
          onlineSession={onlineSession}
          onUpdateGameState={handleUpdateGameState}
          onRestartMatch={handleRestartMatch}
          onReturnToMenu={() => {
            setOnlineSession(null);
            setScreen('menu');
          }}
          onOpenRules={() => setModal('rules')}
          onOpenCustomizer={() => setModal('customizer')}
          onToggleSound={handleToggleSound}
        />
      )}

      <Suspense fallback={null}>
        {modal === 'online_lobby' && (
          <OnlineLobbyModal
            config={config}
            customization={customization}
            onEnterOnlineMatch={handleEnterOnlineMatch}
            onClose={() => setModal('none')}
          />
        )}

        {modal === 'customizer' && (
          <CustomizerModal
            customization={customization}
            onUpdateCustomization={setCustomization}
            onClose={() => setModal('none')}
          />
        )}

        {modal === 'settings' && (
          <SettingsModal
            customization={customization}
            audioSettings={audioSettings}
            stats={stats}
            onUpdateCustomization={setCustomization}
            onUpdateAudio={setAudioSettings}
            onResetStats={handleResetStats}
            onClose={() => setModal('none')}
          />
        )}

        {modal === 'rules' && (
          <RulesModal
            customization={customization}
            onClose={() => setModal('none')}
          />
        )}
      </Suspense>
    </div>
  );
};

export default App;
