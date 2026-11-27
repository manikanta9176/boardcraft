import React from 'react';
import { MancalaState } from '../../games/mancala';
import { ThemePalette } from '../../types/game';

interface MancalaBoardProps {
  state: MancalaState;
  theme: ThemePalette;
  disabled: boolean;
  onSelectPit: (pitIdx: number) => void;
}

const SEED_OFFSETS: [number, number][] = [
  [-22, -20], [18, -18], [-20, 18], [20, 20],
  [0, 0], [-28, 0], [28, 0], [0, -28], [0, 28],
  [-12, -10], [12, 10], [-12, 12], [12, -12],
];

export const MancalaBoard: React.FC<MancalaBoardProps> = ({
  state,
  theme,
  disabled,
  onSelectPit,
}) => {
  const renderSeeds = (count: number, ownerColor: string, maxShow = 12) => {
    const shown = Math.min(count, maxShow);
    return (
      <div className="relative aspect-square w-full max-w-8 sm:max-w-12 pointer-events-none">
        {Array.from({ length: shown }).map((_, i) => {
          const [ox, oy] = SEED_OFFSETS[i % SEED_OFFSETS.length];
          return (
            <span
              key={i}
              className="absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
              style={{
                left: `calc(50% + ${ox * 0.45}%)`,
                top: `calc(50% + ${oy * 0.45}%)`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: i % 2 === 0 ? ownerColor : theme.accent,
                boxShadow: '0 1px 2px rgba(0,0,0,0.45)',
              }}
            />
          );
        })}
      </div>
    );
  };

  const renderPit = (pitIdx: number, isOwnerTurn: boolean) => {
    const count = state.pits[pitIdx];
    const canPlay = !disabled && state.winner === null && isOwnerTurn && count > 0;
    const isLast = state.lastPit === pitIdx;
    const color = pitIdx < 6 ? theme.p1Color : theme.p2Color;

    return (
      <button
        key={pitIdx}
        onClick={() => canPlay && onSelectPit(pitIdx)}
        disabled={!canPlay}
        aria-label={`Pit ${pitIdx}, ${count} seeds`}
        className="flex min-h-11 w-full min-w-0 flex-col items-center gap-1 group cursor-pointer disabled:cursor-default"
      >
        <div
          className="aspect-square w-full max-w-9 sm:max-w-16 rounded-full flex items-center justify-center relative transition-all duration-150 group-hover:scale-105 group-disabled:hover:scale-100"
          style={{
            backgroundColor: theme.bgBoardAlt,
            border: `2px solid ${
              canPlay ? theme.validHighlight + '88' : isLast ? theme.accent : theme.border
            }`,
            boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.45)',
          }}
        >
          {renderSeeds(count, color)}
        </div>
        <span
          className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: theme.bgSurface,
            color: count > 0 ? theme.textPrimary : theme.textMuted,
          }}
        >
          {count}
        </span>
      </button>
    );
  };

  const p2TopPits = [12, 11, 10, 9, 8, 7];
  const p1BottomPits = [0, 1, 2, 3, 4, 5];

  return (
    <div className="w-full max-w-[660px] mx-auto select-none">
      <div
        className="rounded-3xl p-4 sm:p-6 shadow-xl"
        style={{
          backgroundColor: theme.bgBoard,
          border: `1px solid ${theme.border}`,
        }}
      >
        {/* Top label */}
        <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider mb-3 px-2" style={{ color: theme.textMuted }}>
          <span>{theme.p2Name} Store</span>
          <span>← {theme.p2Name} Pits</span>
        </div>

        <div className="grid min-w-0 grid-cols-[30px_minmax(0,1fr)_30px] min-[375px]:grid-cols-[36px_minmax(0,1fr)_36px] sm:grid-cols-[84px_minmax(0,1fr)_84px] gap-1 sm:gap-4 items-stretch">
          {/* P2 Store (index 13) */}
          <div
            className="min-w-0 rounded-xl sm:rounded-2xl flex flex-col items-center justify-between py-2 sm:py-4 px-0.5 sm:px-2"
            style={{
              backgroundColor: theme.bgBoardAlt,
              border: `2px solid ${state.turn === 2 && state.winner === null ? theme.p2Stroke : theme.border}`,
              boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.45)',
            }}
          >
            <span className="text-[11px] font-semibold uppercase" style={{ color: theme.p2Color }}>
              P2
            </span>
            {renderSeeds(state.pits[13], theme.p2Color, 13)}
            <span className="text-lg font-mono font-bold" style={{ color: theme.textPrimary }}>
              {state.pits[13]}
            </span>
          </div>

          {/* Center Pits Grid */}
          <div className="min-w-0 flex flex-col justify-between gap-4 sm:gap-6">
            {/* P2 Top Row */}
            <div className="grid min-w-0 grid-cols-6 gap-0.5 sm:gap-3 justify-items-center">
              {p2TopPits.map((idx) => renderPit(idx, state.turn === 2))}
            </div>
            {/* P1 Bottom Row */}
            <div className="grid min-w-0 grid-cols-6 gap-0.5 sm:gap-3 justify-items-center">
              {p1BottomPits.map((idx) => renderPit(idx, state.turn === 1))}
            </div>
          </div>

          {/* P1 Store (index 6) */}
          <div
            className="min-w-0 rounded-xl sm:rounded-2xl flex flex-col items-center justify-between py-2 sm:py-4 px-0.5 sm:px-2"
            style={{
              backgroundColor: theme.bgBoardAlt,
              border: `2px solid ${state.turn === 1 && state.winner === null ? theme.p1Stroke : theme.border}`,
              boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.45)',
            }}
          >
            <span className="text-[11px] font-semibold uppercase" style={{ color: theme.p1Color }}>
              P1
            </span>
            {renderSeeds(state.pits[6], theme.p1Color, 13)}
            <span className="text-lg font-mono font-bold" style={{ color: theme.textPrimary }}>
              {state.pits[6]}
            </span>
          </div>
        </div>

        {/* Bottom label */}
        <div className="flex justify-between text-[11px] font-medium uppercase tracking-wider mt-3 px-2" style={{ color: theme.textMuted }}>
          <span>{theme.p1Name} Pits →</span>
          <span>{theme.p1Name} Store</span>
        </div>
      </div>
    </div>
  );
};
