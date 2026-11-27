import React from 'react';
import { Crown } from 'lucide-react';
import {
  CHECKERS_SIZE,
  CheckersState,
  CheckersStepMove,
  getLegalCheckersSteps,
} from '../../games/checkers';
import { ThemePalette } from '../../types/game';

interface CheckersBoardProps {
  state: CheckersState;
  theme: ThemePalette;
  disabled: boolean;
  selected: [number, number] | null;
  onSelect: (pos: [number, number] | null) => void;
  onStep: (move: CheckersStepMove) => void;
}

export const CheckersBoard: React.FC<CheckersBoardProps> = ({
  state,
  theme,
  disabled,
  selected,
  onSelect,
  onStep,
}) => {
  const legalSteps = !disabled && state.winner === null ? getLegalCheckersSteps(state) : [];
  const activeSelected = state.mustContinueFrom ?? selected;

  const stepsForSelected = activeSelected
    ? legalSteps.filter((m) => m.from[0] === activeSelected[0] && m.from[1] === activeSelected[1])
    : [];

  const movableOrigins = new Set(legalSteps.map((m) => `${m.from[0]}-${m.from[1]}`));

  const handleCellClick = (r: number, c: number) => {
    if (disabled || state.winner !== null) return;

    const matchingMove = stepsForSelected.find((m) => m.to[0] === r && m.to[1] === c);
    if (matchingMove) {
      onStep(matchingMove);
      return;
    }

    if (state.mustContinueFrom) return; // Forced to continue multi-jump with same piece

    if (movableOrigins.has(`${r}-${c}`)) {
      if (activeSelected && activeSelected[0] === r && activeSelected[1] === c) {
        onSelect(null);
      } else {
        onSelect([r, c]);
      }
    } else {
      onSelect(null);
    }
  };

  return (
    <div className="w-full mx-auto select-none" style={{ maxWidth: 'min(490px, max(260px, calc(100dvh - 360px)))' }}>
      <div
        className="rounded-2xl p-3 sm:p-4 shadow-xl"
        style={{
          backgroundColor: theme.bgBoard,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div
          className="grid grid-cols-8 rounded-xl overflow-hidden"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {Array.from({ length: CHECKERS_SIZE }).map((_, r) =>
            Array.from({ length: CHECKERS_SIZE }).map((__, c) => {
              const isDark = (r + c) % 2 === 1;
              const piece = state.board[r][c];
              const isSel = activeSelected?.[0] === r && activeSelected?.[1] === c;
              const isTarget = stepsForSelected.some((m) => m.to[0] === r && m.to[1] === c);
              const isMovable = movableOrigins.has(`${r}-${c}`);
              const isLast =
                (state.lastMove?.from[0] === r && state.lastMove?.from[1] === c) ||
                (state.lastMove?.to[0] === r && state.lastMove?.to[1] === c);
              const isLastDestination = state.lastMove?.to[0] === r && state.lastMove?.to[1] === c;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  disabled={!isDark}
                  aria-label={`Square ${r + 1},${c + 1}`}
                  className="aspect-square relative flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default"
                  style={{
                    backgroundColor: isDark ? theme.bgBoardAlt : theme.bgBoard,
                    boxShadow: isLast ? `inset 0 0 0 2px ${theme.accent}66` : undefined,
                  }}
                >
                  {isTarget && (
                    <span
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full animate-pop-in"
                      style={{
                        backgroundColor: theme.validHighlight + '35',
                        border: `2px solid ${theme.validHighlight}`,
                      }}
                    />
                  )}

                  {piece && (
                    <div
                      className={`w-[76%] h-[76%] rounded-full flex items-center justify-center transition-transform duration-150 ${isLastDestination ? 'animate-piece-slide' : ''}`}
                      style={{
                        ...(isLastDestination && state.lastMove
                          ? {
                            '--move-x': `${(state.lastMove.from[1] - c) * 131.58}%`,
                            '--move-y': `${(state.lastMove.from[0] - r) * 131.58}%`,
                          }
                          : {}),
                        backgroundColor: piece.player === 1 ? theme.p1Color : theme.p2Color,
                        border: `2.5px solid ${
                          isSel
                            ? theme.accent
                            : isMovable && legalSteps[0]?.captured
                              ? theme.captureHighlight
                              : piece.player === 1
                                ? theme.p1Stroke
                                : theme.p2Stroke
                        }`,
                        boxShadow: isSel
                          ? `0 0 0 3px ${theme.accent}55, 0 4px 10px rgba(0,0,0,0.4)`
                          : '0 2px 5px rgba(0,0,0,0.38)',
                        transform: isSel ? 'scale(1.08)' : 'scale(1)',
                      }}
                    >
                      {piece.king ? (
                        <Crown
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{
                            color: piece.player === 1 ? theme.p1Stroke : '#FFFFFF',
                          }}
                        />
                      ) : (
                        <span
                          className="w-[54%] h-[54%] rounded-full border"
                          style={{
                            borderColor: piece.player === 1 ? theme.p1Stroke + '55' : theme.p2Stroke + '77',
                          }}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};
