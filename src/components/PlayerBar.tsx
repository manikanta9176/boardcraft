import React from 'react';
import { GameMode, Player, ThemePalette } from '../types/game';

interface PlayerBarProps {
  turn: Player;
  winner: Player | 'draw' | null;
  mode: GameMode;
  aiThinking: boolean;
  localPlayer?: Player;
  theme: ThemePalette;
  p1Metric: string;
  p2Metric: string;
  statusHint?: string;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  turn,
  winner,
  mode,
  aiThinking,
  localPlayer = 1,
  theme,
  p1Metric,
  p2Metric,
  statusHint,
}) => {
  const p1Label = mode === 'ai'
    ? `You (${theme.p1Name})`
    : mode === 'online'
      ? `${localPlayer === 1 ? 'You' : 'Opponent'} (${theme.p1Name})`
      : `Player 1 (${theme.p1Name})`;
  const p2Label = mode === 'ai'
    ? `AI (${theme.p2Name})`
    : mode === 'online'
      ? `${localPlayer === 2 ? 'You' : 'Opponent'} (${theme.p2Name})`
      : `Player 2 (${theme.p2Name})`;

  const isP1Active = winner === null && turn === 1;
  const isP2Active = winner === null && turn === 2;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        {/* Player 1 Card */}
        <div
          className="px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-all duration-200"
          style={{
            backgroundColor: theme.bgSurface,
            border: `1.5px solid ${isP1Active ? theme.p1Stroke : theme.border}`,
            boxShadow: isP1Active ? `0 0 0 3px ${theme.p1Glow}` : 'none',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{
                backgroundColor: theme.p1Color,
                border: `2px solid ${theme.p1Stroke}`,
              }}
            />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold truncate" style={{ color: theme.textPrimary }}>
                {p1Label}
              </div>
              <div className="text-[11px] font-mono" style={{ color: theme.textMuted }}>
                {p1Metric}
              </div>
            </div>
          </div>
          {isP1Active && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
            >
              Turn
            </span>
          )}
        </div>

        {/* Player 2 Card */}
        <div
          className="px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-all duration-200"
          style={{
            backgroundColor: theme.bgSurface,
            border: `1.5px solid ${isP2Active ? theme.p2Stroke : theme.border}`,
            boxShadow: isP2Active ? `0 0 0 3px ${theme.p2Glow}` : 'none',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{
                backgroundColor: theme.p2Color,
                border: `2px solid ${theme.p2Stroke}`,
              }}
            />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold truncate" style={{ color: theme.textPrimary }}>
                {p2Label}
              </div>
              <div className="text-[11px] font-mono" style={{ color: theme.textMuted }}>
                {p2Metric}
              </div>
            </div>
          </div>
          {isP2Active && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
              style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
            >
              {aiThinking ? 'Thinking…' : 'Turn'}
            </span>
          )}
        </div>
      </div>

      {statusHint && (
        <div
          className="text-center text-xs font-medium py-1.5 px-3 rounded-lg"
          style={{
            backgroundColor: theme.bgSurface,
            color: theme.textSecondary,
            border: `1px solid ${theme.border}`,
          }}
        >
          {statusHint}
        </div>
      )}
    </div>
  );
};
