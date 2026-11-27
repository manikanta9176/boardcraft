import React, { useState } from 'react';
import { REVERSI_SIZE, ReversiState, getFlipsForMove, getLegalReversiMoves } from '../../games/reversi';
import { ThemePalette } from '../../types/game';

interface ReversiBoardProps {
  state: ReversiState;
  theme: ThemePalette;
  disabled: boolean;
  onPlace: (row: number, col: number) => void;
}

export const ReversiBoard: React.FC<ReversiBoardProps> = ({
  state,
  theme,
  disabled,
  onPlace,
}) => {
  const [hovered, setHovered] = useState<[number, number] | null>(null);
  const legalMoves = !disabled && state.winner === null ? getLegalReversiMoves(state.board, state.turn) : [];

  const isLegal = (r: number, c: number) => legalMoves.some(([mr, mc]) => mr === r && mc === c);
  const isLast = (r: number, c: number) =>
    state.lastMove !== null && state.lastMove[0] === r && state.lastMove[1] === c;
  const isFlipped = (r: number, c: number) =>
    state.flippedCells.some(([fr, fc]) => fr === r && fc === c);

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
          className="grid grid-cols-8 gap-1 rounded-xl p-1"
          style={{ backgroundColor: theme.boardLine + '33' }}
        >
          {Array.from({ length: REVERSI_SIZE }).map((_, r) =>
            Array.from({ length: REVERSI_SIZE }).map((__, c) => {
              const cell = state.board[r][c];
              const legal = isLegal(r, c);
              const last = isLast(r, c);
              const flipped = isFlipped(r, c);
              const isHov = hovered?.[0] === r && hovered?.[1] === c;
              const flipCount = isHov && legal ? getFlipsForMove(state.board, r, c, state.turn).length : 0;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => legal && onPlace(r, c)}
                  onMouseEnter={() => setHovered([r, c])}
                  onMouseLeave={() => setHovered(null)}
                  disabled={!legal}
                  aria-label={`Row ${r + 1}, Column ${c + 1}`}
                  className="aspect-square rounded-md relative flex items-center justify-center transition-colors cursor-pointer disabled:cursor-default"
                  style={{
                    backgroundColor: isHov && legal ? theme.bgBoardAlt : theme.bgBoard,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  {cell !== null ? (
                    <div
                      className={`w-[78%] h-[78%] rounded-full flex items-center justify-center transition-all duration-300 ${
                        flipped || last ? 'animate-pop-in' : ''
                      }`}
                      style={{
                        backgroundColor: cell === 1 ? theme.p1Color : theme.p2Color,
                        border: `2px solid ${cell === 1 ? theme.p1Stroke : theme.p2Stroke}`,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.35)',
                      }}
                    >
                      {last && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.accent }}
                        />
                      )}
                    </div>
                  ) : legal ? (
                    <div className="flex items-center justify-center">
                      {isHov ? (
                        <span
                          className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: theme.validHighlight + '28', color: theme.validHighlight }}
                        >
                          +{flipCount}
                        </span>
                      ) : (
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: theme.validHighlight, opacity: 0.65 }}
                        />
                      )}
                    </div>
                  ) : null}
                </button>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};
