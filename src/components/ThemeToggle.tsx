import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { ThemePalette } from '../types/game';

interface ThemeToggleProps {
  theme: ThemePalette;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const targetMode = theme.isDark ? 'light' : 'dark';
  const Icon = theme.isDark ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={onToggle}
      title={`Switch to ${targetMode} mode`}
      aria-label={`Switch to ${targetMode} mode`}
      className="theme-toggle inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        backgroundColor: theme.bgSurface,
        color: theme.textPrimary,
        border: `1px solid ${theme.border}`,
        outlineColor: theme.validHighlight,
      }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
};
