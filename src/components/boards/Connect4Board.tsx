import React, { useState } from 'react';
import { C4_COLS, Connect4State } from '../../games/connect4';
import { ThemePalette } from '../../types/game';

interface Connect4BoardProps {
  state: Connect4State;
  theme: ThemePalette;
  disabled: boolean;
  onDropColumn: (col: number) => void;
}

export const Connect4Board: React.FC<Connect4BoardProps> = ({
  state,
  theme,
  disabled,
  onDropColumn,
}) => {
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  const isWinCell = (r: number, c: number) =>
    state.winningCells?.some(([wr, wc]) => wr === r && wc === c) ?? false;

  const isLastCell = (r: number, c: number) =>
    state.lastMove !== null && state.lastMove[0] === r && state.lastMove[1] === c;

  return (
    <div className="w-full max-w-[520px] mx-auto select-none">
      {/* Hover preview row */}
      <div className="grid grid-cols-7 gap-2 sm:gap-2.5 px-3 sm:px-4 mb-2 h-9 sm:h-11 items-center">
        {Array.from({ length: C4_COLS }).map((_, c) => {
          const canDrop = !disabled && state.winner === null && state.board[0][c] === null;
          const active = hoverCol === c && canDrop;
          return (
            <div key={c} className="flex items-center justify-center">
              {active && (
                <div
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full animate-pop-in"
                  style={{
                    backgroundColor: state.turn === 1 ? theme.p1Color : theme.p2Color,
                    border: `2px solid ${state.turn === 1 ? theme.p1Stroke : theme.p2Stroke}`,
                    opacity: 0.85,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Board frame */}
      <div
        className="rounded-2xl p-3 sm:p-4 shadow-xl"
        style={{
          backgroundColor: theme.bgBoard,
          border: `1px solid ${theme.border}`,
        }}
      >
        <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
          {state.board.map((row, r) =>
            row.map((cell, c) => {
              const canDrop = !disabled && state.winner === null && state.board[0][c] === null;
              const win = isWinCell(r, c);
              const last = isLastCell(r, c);
              const colHovered = hoverCol === c && canDrop;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => canDrop && onDropColumn(c)}
                  onMouseEnter={() => setHoverCol(c)}
                  onMouseLeave={() => setHoverCol(null)}
                  disabled={!canDrop}
                  aria-label={`Column ${c + 1}, Row ${r + 1}`}
                  className="aspect-square rounded-full relative flex items-center justify-center transition-colors duration-150 cursor-pointer disabled:cursor-default"
                  style={{
                    backgroundColor: colHovered ? theme.bgBoardAlt : theme.bgApp,
                    border: `1.5px solid ${win ? theme.validHighlight : theme.border}`,
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.45)',
                  }}
                >
                  {cell !== null && (
                    <div
                      key={`${r}-${c}-${cell}`}
                      className="w-[86%] h-[86%] rounded-full animate-drop-in flex items-center justify-center"
                      style={{
                        backgroundColor: cell === 1 ? theme.p1Color : theme.p2Color,
                        border: `2px solid ${win ? theme.validHighlight : cell === 1 ? theme.p1Stroke : theme.p2Stroke}`,
                        boxShadow: win
                          ? `0 0 0 3px ${theme.validHighlight}66`
                          : '0 2px 6px rgba(0,0,0,0.35)',
                      }}
                    >
                      {last && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: theme.accent }}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            }),
          )}
        </div>
        {/* Column numbers */}
        <div className="grid grid-cols-7 gap-2 sm:gap-2.5 mt-2">
          {Array.from({ length: C4_COLS }).map((_, c) => (
            <div key={c} className="text-center text-[10px] font-mono" style={{ color: theme.textMuted }}>
              {c + 1}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
