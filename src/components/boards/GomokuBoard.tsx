import React, { useState } from 'react';
import { GOMOKU_SIZE, GomokuState } from '../../games/gomoku';
import { ThemePalette } from '../../types/game';

interface GomokuBoardProps {
  state: GomokuState;
  theme: ThemePalette;
  disabled: boolean;
  onPlace: (row: number, col: number) => void;
}

const STAR_POINTS = [
  [3, 3],
  [3, 11],
  [7, 7],
  [11, 3],
  [11, 11],
];

export const GomokuBoard: React.FC<GomokuBoardProps> = ({
  state,
  theme,
  disabled,
  onPlace,
}) => {
  const [hovered, setHovered] = useState<[number, number] | null>(null);

  const padding = 5;
  const step = (100 - padding * 2) / (GOMOKU_SIZE - 1);
  const coord = (i: number) => padding + i * step;

  const isWinCell = (r: number, c: number) =>
    state.winningLine?.some(([wr, wc]) => wr === r && wc === c) ?? false;

  const isLastCell = (r: number, c: number) =>
    state.lastMove !== null && state.lastMove[0] === r && state.lastMove[1] === c;

  return (
    <div className="w-full max-w-[530px] mx-auto select-none">
      <div
        className="w-full aspect-square rounded-2xl p-3 sm:p-4 shadow-xl"
        style={{
          backgroundColor: theme.bgBoard,
          border: `1px solid ${theme.border}`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Grid lines */}
          {Array.from({ length: GOMOKU_SIZE }).map((_, i) => (
            <React.Fragment key={i}>
              <line
                x1={coord(0)}
                y1={coord(i)}
                x2={coord(GOMOKU_SIZE - 1)}
                y2={coord(i)}
                stroke={theme.boardLine}
                strokeWidth={0.28}
              />
              <line
                x1={coord(i)}
                y1={coord(0)}
                x2={coord(i)}
                y2={coord(GOMOKU_SIZE - 1)}
                stroke={theme.boardLine}
                strokeWidth={0.28}
              />
            </React.Fragment>
          ))}

          {/* Star points */}
          {STAR_POINTS.map(([r, c]) => (
            <circle
              key={`star-${r}-${c}`}
              cx={coord(c)}
              cy={coord(r)}
              r={0.65}
              fill={theme.boardLine}
            />
          ))}

          {/* Winning highlight line */}
          {state.winningLine && state.winningLine.length >= 5 && (
            <line
              x1={coord(state.winningLine[0][1])}
              y1={coord(state.winningLine[0][0])}
              x2={coord(state.winningLine[4][1])}
              y2={coord(state.winningLine[4][0])}
              stroke={theme.validHighlight}
              strokeWidth={1.1}
              strokeLinecap="round"
              opacity={0.7}
            />
          )}

          {/* Intersections & Stones */}
          {Array.from({ length: GOMOKU_SIZE }).map((_, r) =>
            Array.from({ length: GOMOKU_SIZE }).map((__, c) => {
              const cell = state.board[r][c];
              const canClick = !disabled && state.winner === null && cell === null;
              const isHov = canClick && hovered?.[0] === r && hovered?.[1] === c;
              const win = isWinCell(r, c);
              const last = isLastCell(r, c);

              return (
                <g
                  key={`${r}-${c}`}
                  onClick={() => canClick && onPlace(r, c)}
                  onMouseEnter={() => setHovered([r, c])}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: canClick ? 'pointer' : 'default' }}
                >
                  <rect
                    x={coord(c) - step / 2}
                    y={coord(r) - step / 2}
                    width={step}
                    height={step}
                    fill="transparent"
                  />

                  {isHov && (
                    <circle
                      cx={coord(c)}
                      cy={coord(r)}
                      r={step * 0.4}
                      fill={state.turn === 1 ? theme.p1Color : theme.p2Color}
                      fillOpacity={0.42}
                    />
                  )}

                  {cell !== null && (
                    <g>
                      <circle
                        cx={coord(c)}
                        cy={coord(r)}
                        r={step * 0.42}
                        fill={cell === 1 ? theme.p1Color : theme.p2Color}
                        stroke={win ? theme.validHighlight : cell === 1 ? theme.p1Stroke : theme.p2Stroke}
                        strokeWidth={win ? 0.65 : 0.3}
                      />
                      {last && (
                        <circle
                          cx={coord(c)}
                          cy={coord(r)}
                          r={step * 0.13}
                          fill={theme.accent}
                        />
                      )}
                    </g>
                  )}
                </g>
              );
            }),
          )}
        </svg>
      </div>
    </div>
  );
};
