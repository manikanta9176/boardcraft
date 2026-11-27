import React, { useState } from 'react';
import { BOX_GRID, DOTS_GRID, DotsBoxesState, EdgeMove } from '../../games/dotsAndBoxes';
import { ThemePalette } from '../../types/game';

interface DotsBoxesBoardProps {
  state: DotsBoxesState;
  theme: ThemePalette;
  disabled: boolean;
  onDrawEdge: (edge: EdgeMove) => void;
}

export const DotsBoxesBoard: React.FC<DotsBoxesBoardProps> = ({
  state,
  theme,
  disabled,
  onDrawEdge,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const pad = 12;
  const step = (100 - pad * 2) / BOX_GRID;
  const pos = (i: number) => pad + i * step;

  const isLast = (orientation: 'h' | 'v', row: number, col: number) =>
    state.lastEdge?.orientation === orientation &&
    state.lastEdge.row === row &&
    state.lastEdge.col === col;

  return (
    <div className="w-full mx-auto select-none" style={{ maxWidth: 'min(460px, max(260px, calc(100dvh - 360px)))' }}>
      <div
        className="w-full aspect-square rounded-2xl p-4 sm:p-6 shadow-xl"
        style={{
          backgroundColor: theme.bgBoard,
          border: `1px solid ${theme.border}`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {/* Claimed Boxes */}
          {Array.from({ length: BOX_GRID }).map((_, r) =>
            Array.from({ length: BOX_GRID }).map((__, c) => {
              const owner = state.boxes[r][c];
              if (!owner) return null;
              const color = owner === 1 ? theme.p1Color : theme.p2Color;
              return (
                <g key={`box-${r}-${c}`}>
                  <rect
                    x={pos(c) + 1.4}
                    y={pos(r) + 1.4}
                    width={step - 2.8}
                    height={step - 2.8}
                    rx={2}
                    fill={color}
                    fillOpacity={0.22}
                  />
                  <text
                    x={pos(c) + step / 2}
                    y={pos(r) + step / 2 + 2}
                    textAnchor="middle"
                    fontSize="6.5"
                    fontWeight="700"
                    fill={color}
                  >
                    {owner === 1 ? 'P1' : 'P2'}
                  </text>
                </g>
              );
            }),
          )}

          {/* Horizontal Edges */}
          {Array.from({ length: DOTS_GRID }).map((_, r) =>
            Array.from({ length: BOX_GRID }).map((__, c) => {
              const owner = state.hEdges[r][c];
              const key = `h-${r}-${c}`;
              const canClick = !disabled && state.winner === null && owner === null;
              const isHov = canClick && hovered === key;
              const last = isLast('h', r, c);

              return (
                <g
                  key={key}
                  onClick={() => canClick && onDrawEdge({ orientation: 'h', row: r, col: c })}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: canClick ? 'pointer' : 'default' }}
                >
                  {/* Wide hit box */}
                  <rect x={pos(c) + 2} y={pos(r) - 4} width={step - 4} height={8} fill="transparent" />
                  {/* Guide line */}
                  <line
                    x1={pos(c)}
                    y1={pos(r)}
                    x2={pos(c + 1)}
                    y2={pos(r)}
                    stroke={
                      owner
                        ? owner === 1
                          ? theme.p1Color
                          : theme.p2Color
                        : isHov
                          ? state.turn === 1
                            ? theme.p1Color
                            : theme.p2Color
                          : theme.boardLine
                    }
                    strokeWidth={owner ? (last ? 2.4 : 1.9) : isHov ? 1.8 : 0.45}
                    strokeOpacity={owner ? 1 : isHov ? 0.55 : 0.35}
                    strokeLinecap="round"
                  />
                </g>
              );
            }),
          )}

          {/* Vertical Edges */}
          {Array.from({ length: BOX_GRID }).map((_, r) =>
            Array.from({ length: DOTS_GRID }).map((__, c) => {
              const owner = state.vEdges[r][c];
              const key = `v-${r}-${c}`;
              const canClick = !disabled && state.winner === null && owner === null;
              const isHov = canClick && hovered === key;
              const last = isLast('v', r, c);

              return (
                <g
                  key={key}
                  onClick={() => canClick && onDrawEdge({ orientation: 'v', row: r, col: c })}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: canClick ? 'pointer' : 'default' }}
                >
                  {/* Wide hit box */}
                  <rect x={pos(c) - 4} y={pos(r) + 2} width={8} height={step - 4} fill="transparent" />
                  <line
                    x1={pos(c)}
                    y1={pos(r)}
                    x2={pos(c)}
                    y2={pos(r + 1)}
                    stroke={
                      owner
                        ? owner === 1
                          ? theme.p1Color
                          : theme.p2Color
                        : isHov
                          ? state.turn === 1
                            ? theme.p1Color
                            : theme.p2Color
                          : theme.boardLine
                    }
                    strokeWidth={owner ? (last ? 2.4 : 1.9) : isHov ? 1.8 : 0.45}
                    strokeOpacity={owner ? 1 : isHov ? 0.55 : 0.35}
                    strokeLinecap="round"
                  />
                </g>
              );
            }),
          )}

          {/* Dots */}
          {Array.from({ length: DOTS_GRID }).map((_, r) =>
            Array.from({ length: DOTS_GRID }).map((__, c) => (
              <circle
                key={`dot-${r}-${c}`}
                cx={pos(c)}
                cy={pos(r)}
                r={2}
                fill={theme.textPrimary}
              />
            )),
          )}
        </svg>
      </div>
    </div>
  );
};
