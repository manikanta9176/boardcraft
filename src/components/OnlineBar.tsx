import React from 'react';
import { ArrowLeftRight, LogOut, Wifi } from 'lucide-react';
import { TransportKind } from '../multiplayer/types';
import { Player, ThemePalette } from '../types/game';

interface OnlineBarProps {
  theme: ThemePalette;
  transportKind: TransportKind;
  roomCode: string;
  isHost: boolean;
  localPlayer: Player;
  latencyMs: number | null;
  onSwapSides: () => void;
  onSendReaction: (emoji: string, label: string) => void;
  onDisconnect: () => void;
}

const REACTIONS = [
  { emoji: '👏', label: 'Nice!' },
  { emoji: '🔥', label: 'GG!' },
  { emoji: '🤔', label: 'Hmm...' },
  { emoji: '⚡', label: 'Fast!' },
];

export const OnlineBar: React.FC<OnlineBarProps> = ({
  theme,
  transportKind,
  roomCode,
  isHost,
  localPlayer,
  latencyMs,
  onSwapSides,
  onSendReaction,
  onDisconnect,
}) => {
  return (
    <div
      className="w-full max-w-2xl mx-auto rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md"
      style={{
        backgroundColor: theme.bgGlass,
        border: `1px solid ${theme.validHighlight}44`,
      }}
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: theme.validHighlight }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.validHighlight }} />
          <Wifi className="w-3.5 h-3.5" />
          <span>{transportKind === 'online-room' ? `Room ${roomCode}` : 'Nearby P2P'}</span>
        </span>
        {latencyMs !== null && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: theme.bgBoard, color: theme.textMuted }}
          >
            {latencyMs}ms
          </span>
        )}
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
        >
          You: P{localPlayer}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Quick Reactions */}
        <div className="hidden sm:flex items-center gap-1 mr-1">
          {REACTIONS.map((r) => (
            <button
              key={r.label}
              onClick={() => onSendReaction(r.emoji, r.label)}
              title={`Send "${r.label}"`}
              className="px-1.5 py-1 rounded-lg text-xs hover:scale-110 transition-transform cursor-pointer"
              style={{ backgroundColor: theme.bgBoard }}
            >
              {r.emoji}
            </button>
          ))}
        </div>

        {isHost && (
          <button
            onClick={onSwapSides}
            title="Swap Player 1 / Player 2 sides"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
            style={{
              backgroundColor: theme.bgBoard,
              color: theme.textSecondary,
              border: `1px solid ${theme.border}`,
            }}
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span className="hidden md:inline">Swap</span>
          </button>
        )}

        <button
          onClick={onDisconnect}
          title="Leave P2P Match"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
          style={{
            backgroundColor: theme.captureHighlight + '1F',
            color: theme.captureHighlight,
          }}
        >
          <LogOut className="w-3 h-3" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  );
};
