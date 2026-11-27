import React from 'react';
import { Player, GameMode, ThemePalette } from '../types/game';

export interface PlayerMetric {
  value: string;
  label: string;
  detail?: string;
}

interface PlayerBarProps {
  turn: Player;
  winner: Player | 'draw' | null;
  mode: GameMode;
  aiThinking: boolean;
  localPlayer?: Player;
  theme: ThemePalette;
  p1Metric: PlayerMetric;
  p2Metric: PlayerMetric;
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
    ? 'You'
    : mode === 'online'
      ? (localPlayer === 1 ? 'You' : 'Opponent')
      : 'Player 1';
  const p2Label = mode === 'ai'
    ? 'AI'
    : mode === 'online'
      ? (localPlayer === 2 ? 'You' : 'Opponent')
      : 'Player 2';

  const p1Active = winner === null && turn === 1;
  const p2Active = winner === null && turn === 2;
  const activeColor = turn === 1 ? theme.p1Color : theme.p2Color;
  const activeStroke = turn === 1 ? theme.p1Stroke : theme.p2Stroke;
  const activeName = turn === 1 ? theme.p1Name : theme.p2Name;

  const announcement = winner === 'draw'
    ? 'Round complete · It’s a draw'
    : winner !== null
      ? `${winner === 1 ? p1Label : p2Label} wins`
      : mode === 'ai'
        ? turn === 1 ? 'Your turn' : aiThinking ? 'AI is thinking' : 'AI to move'
        : mode === 'online'
          ? turn === localPlayer ? 'Your turn' : 'Opponent’s turn'
          : `Player ${turn}’s turn`;

  const renderPlayerCard = (
    player: Player,
    label: string,
    metric: PlayerMetric,
    active: boolean,
  ) => {
    const color = player === 1 ? theme.p1Color : theme.p2Color;
    const stroke = player === 1 ? theme.p1Stroke : theme.p2Stroke;
    const glow = player === 1 ? theme.p1Glow : theme.p2Glow;
    const name = player === 1 ? theme.p1Name : theme.p2Name;

    return (
      <div
        key={player}
        aria-current={active ? 'true' : undefined}
        className={`player-score-card${active ? ' player-score-card-active' : ''}`}
        style={{
          backgroundColor: active ? `color-mix(in srgb, ${color} 13%, ${theme.bgSurface})` : theme.bgSurface,
          border: `1.5px solid ${active ? stroke : theme.border}`,
          boxShadow: active ? `0 8px 22px ${glow}, 0 0 0 2px ${glow}` : '0 2px 8px rgba(20, 45, 40, 0.04)',
        }}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`player-token${active ? ' player-token-active' : ''}`}
            style={{ backgroundColor: color, borderColor: stroke }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-xs sm:text-sm font-bold" style={{ color: theme.textPrimary }}>
                {label}
              </span>
              {active && (
                  <span className="player-active-tag" style={{ color: theme.validHighlight }}>
                  TURN
                </span>
              )}
            </div>
            <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.13em]" style={{ color: theme.textMuted }}>
              {name} pieces
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-baseline gap-1.5 pl-[30px]">
          <span className="player-score-value" style={{ color: active ? theme.textPrimary : theme.textSecondary }}>
            {metric.value}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: theme.textSecondary }}>
            {metric.label}
          </span>
          {metric.detail && (
            <span className="ml-auto truncate text-[10px] font-medium" style={{ color: theme.textMuted }}>
              {metric.detail}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="w-full max-w-2xl mx-auto flex flex-col gap-2.5" aria-label="Players and score">
      <div
        className={`turn-announcement${winner === null ? ' turn-announcement-live' : ' turn-announcement-finished'}`}
        aria-live="polite"
        aria-atomic="true"
        style={{
          backgroundColor: winner === null ? `color-mix(in srgb, ${activeColor} 15%, ${theme.bgSurface})` : theme.bgSurface,
          borderColor: winner === null ? activeStroke : theme.border,
          color: theme.textPrimary,
          boxShadow: winner === null ? `0 4px 14px ${turn === 1 ? theme.p1Glow : theme.p2Glow}` : 'none',
        }}
      >
        {winner === null && <span className="turn-pulse-dot" style={{ backgroundColor: theme.validHighlight, boxShadow: `0 0 0 4px ${turn === 1 ? theme.p1Glow : theme.p2Glow}` }} />}
        <span className="truncate text-sm font-bold tracking-tight">{announcement}</span>
        {winner === null && <span className="turn-identity truncate" style={{ color: theme.textMuted }}>{activeName} pieces</span>}
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {renderPlayerCard(1, p1Label, p1Metric, p1Active)}
        {renderPlayerCard(2, p2Label, p2Metric, p2Active)}
      </div>

      {statusHint && (
        <div
          className="text-center text-xs font-medium leading-relaxed py-2 px-3 rounded-xl"
          style={{
            backgroundColor: theme.bgSurface,
            color: theme.textSecondary,
            border: `1px solid ${theme.border}`,
          }}
        >
          {statusHint}
        </div>
      )}
    </section>
  );
};
