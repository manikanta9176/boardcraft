import React from 'react';
import {
  BookOpen,
  Bot,
  Menu,
  Palette,
  RotateCcw,
  Undo2,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Difficulty, GameMeta, GameMode, THEMES, ThemeId, ThemePalette } from '../types/game';

interface GameHeaderProps {
  game: GameMeta;
  mode: GameMode;
  onModeChange: (m: GameMode) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  theme: ThemePalette;
  onThemeChange: (id: ThemeId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onOpenRules: () => void;
  onOpenMobileMenu: () => void;
}

const themeOrder: ThemeId[] = ['obsidian', 'birch', 'walnut'];

export const GameHeader: React.FC<GameHeaderProps> = ({
  game,
  mode,
  onModeChange,
  difficulty,
  onDifficultyChange,
  theme,
  onThemeChange,
  soundEnabled,
  onToggleSound,
  canUndo,
  onUndo,
  onReset,
  onOpenRules,
  onOpenMobileMenu,
}) => {
  const cycleTheme = () => {
    const idx = themeOrder.indexOf(theme.id);
    onThemeChange(themeOrder[(idx + 1) % themeOrder.length]);
  };

  return (
    <header
      className="px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3"
      style={{
        backgroundColor: theme.bgSidebar,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg cursor-pointer"
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
          <h1 className="text-base sm:text-lg font-bold tracking-tight truncate" style={{ color: theme.textPrimary }}>
            {game.name}
          </h1>
          <p className="text-xs truncate hidden sm:block" style={{ color: theme.textMuted }}>
            {game.tagline}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Mode Switcher */}
        <div
          className="flex items-center p-0.5 rounded-lg"
          style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}
        >
          <button
            onClick={() => onModeChange('ai')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: mode === 'ai' ? theme.accentSoft : 'transparent',
              color: mode === 'ai' ? theme.accent : theme.textMuted,
            }}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs AI</span>
          </button>
          <button
            onClick={() => onModeChange('local')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            style={{
              backgroundColor: mode === 'local' ? theme.accentSoft : 'transparent',
              color: mode === 'local' ? theme.accent : theme.textMuted,
            }}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2P</span>
          </button>
        </div>

        {/* Difficulty Switcher (AI mode) */}
        {mode === 'ai' && (
          <div
            className="flex items-center p-0.5 rounded-lg"
            style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}
          >
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => onDifficultyChange(d)}
                className="px-2 py-1.5 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer"
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
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo Move"
            className="p-2 rounded-lg transition-opacity cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
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
            title="Restart Game"
            className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: theme.bgSurface,
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={cycleTheme}
            title={`Theme: ${THEMES[theme.id].label}`}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
            style={{
              backgroundColor: theme.bgSurface,
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
            }}
          >
            <Palette className="w-4 h-4" />
            <span className="hidden md:inline">{theme.label.split(' ')[0]}</span>
          </button>
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            className="p-2 rounded-lg cursor-pointer"
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
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
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
