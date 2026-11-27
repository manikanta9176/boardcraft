import React from 'react';
import {
  BookOpen,
  Bot,
  Menu,
  Radio,
  RotateCcw,
  Undo2,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Difficulty, GameMeta, GameMode, ThemePalette } from '../types/game';
import { ThemeToggle } from './ThemeToggle';

interface GameHeaderProps {
  game: GameMeta;
  mode: GameMode;
  onModeChange: (m: GameMode) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  theme: ThemePalette;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  canUndo: boolean;
  canReset: boolean;
  onUndo: () => void;
  onReset: () => void;
  onOpenRules: () => void;
  onOpenMobileMenu: () => void;
  onOpenMultiplayer: () => void;
  multiplayerConnected: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  mode,
  onModeChange,
  difficulty,
  onDifficultyChange,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  canUndo,
  canReset,
  onUndo,
  onReset,
  onOpenRules,
  onOpenMobileMenu,
  onOpenMultiplayer,
  multiplayerConnected,
}) => {
  return (
    <header
      className="match-header sticky top-0 z-20 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3"
      style={{
        backgroundColor: theme.bgGlass,
        borderBottom: `1px solid ${theme.border}`,
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden grid min-h-11 min-w-11 place-items-center rounded-full cursor-pointer"
          style={{
            backgroundColor: theme.bgSurface,
            color: theme.textPrimary,
            border: `1px solid ${theme.border}`,
          }}
          aria-label="Open game list"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="display-face text-base sm:text-xl font-bold tracking-[-.04em] truncate" style={{ color: theme.textPrimary }}>
            {game.name}
          </h1>
          <p className="text-xs truncate hidden sm:block" style={{ color: theme.textMuted }}>
            {game.tagline}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Mode Switcher */}
        {mode === 'online' ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accent}35` }}>
            <Radio className="w-3.5 h-3.5" />
            <span>Online match</span>
          </div>
        ) : (
          <div className="flex items-center p-0.5 rounded-full" role="group" aria-label="Game mode" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
            <button
              onClick={() => onModeChange('ai')}
              aria-pressed={mode === 'ai'}
              className="flex min-h-11 items-center gap-1.5 px-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
              style={{ backgroundColor: mode === 'ai' ? theme.accentSoft : 'transparent', color: mode === 'ai' ? theme.accent : theme.textMuted }}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs AI</span>
            </button>
            <button
              onClick={() => onModeChange('local')}
              aria-pressed={mode === 'local'}
              className="flex min-h-11 items-center gap-1.5 px-2.5 rounded-full text-xs font-medium transition-colors cursor-pointer"
              style={{ backgroundColor: mode === 'local' ? theme.accentSoft : 'transparent', color: mode === 'local' ? theme.accent : theme.textMuted }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2P</span>
            </button>
          </div>
        )}

        {/* Difficulty Switcher (AI mode) */}
        {mode === 'ai' && (
          <div
            className="flex items-center p-0.5 rounded-full"
            role="group"
            aria-label="AI difficulty"
            style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}
          >
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
                aria-pressed={difficulty === d}
                className="min-h-11 px-2 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer"
                style={{
                  backgroundColor: difficulty === d ? theme.accentSoft : 'transparent',
                  color: difficulty === d ? theme.accent : theme.textMuted,
                }}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {!multiplayerConnected && (
            <button
              onClick={onOpenMultiplayer}
              aria-label="Invite a friend to play online"
              title="Invite a friend"
              className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2.5 rounded-full text-xs font-semibold cursor-pointer"
              style={{ backgroundColor: theme.accentSoft, color: theme.accent, border: `1px solid ${theme.accent}35` }}
            >
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>
          )}
          <button
            onClick={onUndo}
            disabled={!canUndo || multiplayerConnected}
            title="Undo Move"
            aria-label="Undo last move"
            className="grid min-h-11 min-w-11 place-items-center rounded-full transition-opacity cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.bgSurface,
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
            }}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            disabled={!canReset}
            title="Restart Game"
            aria-label="Restart game"
            className="grid min-h-11 min-w-11 place-items-center rounded-full transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.bgSurface,
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            aria-label={soundEnabled ? 'Mute sound' : 'Enable sound'}
            aria-pressed={soundEnabled}
            className="grid min-h-11 min-w-11 place-items-center rounded-full cursor-pointer"
            style={{
              backgroundColor: theme.bgSurface,
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
            }}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={onOpenRules}
            aria-label="Show game rules"
            className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2.5 rounded-full text-xs font-medium cursor-pointer"
            style={{
              backgroundColor: theme.bgSurface,
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
            }}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Rules</span>
          </button>
        </div>
      </div>
    </header>
  );
};
