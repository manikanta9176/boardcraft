import React from 'react';
import { RotateCcw, Trophy } from 'lucide-react';
import { GameMode, Player, ThemePalette } from '../types/game';

interface GameOverBannerProps {
  winner: Player | 'draw';
  mode: GameMode;
  theme: ThemePalette;
  onPlayAgain: () => void;
  subtitle?: string;
  localPlayer?: Player;
  isHost?: boolean;
}

export const GameOverBanner: React.FC<GameOverBannerProps> = ({
  winner,
  mode,
  theme,
  onPlayAgain,
  subtitle,
  localPlayer = 1,
  isHost = true,
}) => {
  const title =
    winner === 'draw'
      ? "It's a Draw!"
      : mode === 'ai'
        ? winner === 1
          ? 'You Win!'
          : 'AI Wins!'
        : mode === 'online'
          ? winner === localPlayer ? 'You win!' : 'Opponent wins'
          : `Player ${winner} Wins!`;

  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-xl px-4 py-3 flex items-center justify-between gap-3 animate-pop-in"
      style={{
        backgroundColor: theme.accentSoft,
        border: `1px solid ${theme.accent}55`,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: theme.bgSurface, color: theme.accent }}
        >
          <Trophy className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-bold" style={{ color: theme.textPrimary }}>
            {title}
          </div>
          {subtitle && (
            <div className="text-xs" style={{ color: theme.textSecondary }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onPlayAgain}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer shrink-0 transition-transform active:scale-95"
        style={{
          backgroundColor: theme.accent,
          color: theme.isDark ? '#090D16' : '#FFFFFF',
        }}
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{mode === 'online' && !isHost ? 'Request rematch' : 'Play again'}</span>
      </button>
    </div>
  );
};
