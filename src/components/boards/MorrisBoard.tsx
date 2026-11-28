import React, { useState } from 'react';
import { MORRIS_TOPOLOGIES } from '../../games/morris/topologies';
import {
  MorrisMove,
  MorrisState,
  getCapturableNodes,
  getOpponent,
  getValidDestinations,
} from '../../games/morris/engine';
import { ThemePalette } from '../../types/game';

interface MorrisBoardProps {
  state: MorrisState;
  theme: ThemePalette;
  disabled: boolean;
  onSelectNode: (nodeId: number | null) => void;
  onMove: (move: MorrisMove) => void;
}

export const MorrisBoard: React.FC<MorrisBoardProps> = ({
  state,
  theme,
  disabled,
  onSelectNode,
  onMove,
}) => {
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const topo = MORRIS_TOPOLOGIES[state.variant];

  const validDestinations =
    state.phase === 'movement' && state.selectedNode !== null
      ? getValidDestinations(state, state.selectedNode)
      : [];

  const capturableNodes =
    state.phase === 'capture'
      ? getCapturableNodes(state.board, topo, getOpponent(state.turn))
      : [];

  const handleNodeClick = (nodeId: number) => {
    if (disabled || state.phase === 'gameover') return;

    if (state.phase === 'capture') {
      if (capturableNodes.includes(nodeId)) {
        onMove({ type: 'capture', to: nodeId });
      }
      return;
    }

    if (state.phase === 'placement') {
      if (state.board[nodeId] === null) {
        onMove({ type: 'place', to: nodeId });
      }
      return;
    }

    if (state.phase === 'movement') {
      if (state.board[nodeId] === state.turn) {
        onSelectNode(state.selectedNode === nodeId ? null : nodeId);
        return;
      }
      if (state.selectedNode !== null && validDestinations.includes(nodeId)) {
        onMove({ type: 'move', from: state.selectedNode, to: nodeId });
      }
    }
  };

  const renderReserveTray = (player: 1 | 2) => {
    const count = state.toPlace[player];
    const total = topo.piecesPerPlayer;
    if (state.phase !== 'placement' && count === 0 && state.variant === 'three-mens-morris') {
      return null;
    }
    const color = player === 1 ? theme.p1Color : theme.p2Color;
    const stroke = player === 1 ? theme.p1Stroke : theme.p2Stroke;
    return (
      <div className="flex items-center justify-center gap-1.5 min-h-[22px] flex-wrap">
        {Array.from({ length: total }).map((_, idx) => {
          const available = idx < count;
          return (
            <span
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${available && player === state.turn && state.winner === null ? 'coin-turn-active' : ''}`}
              style={{
                backgroundColor: available ? color : 'transparent',
                border: `1.5px solid ${available ? stroke : theme.border}`,
                opacity: available ? 1 : 0.28,
                '--coin-turn-glow': player === 1 ? theme.p1Glow : theme.p2Glow,
              } as React.CSSProperties}
            />
          );
        })}
      </div>
    );
  };

  const pieceRadius = state.variant === 'three-mens-morris' ? 5.6 : state.variant === 'six-mens-morris' ? 4.8 : 4.1;

  return (
    <div className="w-full mx-auto flex flex-col gap-3" style={{ maxWidth: 'min(490px, max(240px, calc(100dvh - 360px)))' }}>
      {/* Top tray: Player 2 reserve */}
      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>
          {theme.p2Name} Reserve ({state.toPlace[2]})
        </span>
        {renderReserveTray(2)}
      </div>

      {/* Board Surface */}
      <div
        className="w-full aspect-square rounded-2xl p-3 sm:p-5 shadow-xl select-none"
        style={{
          backgroundColor: theme.bgBoard,
          border: `1px solid ${theme.border}`,
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <defs>
            <filter id="piece-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="1.1" floodColor="#000000" floodOpacity={theme.isDark ? 0.45 : 0.2} />
            </filter>
          </defs>

          {/* Edges */}
          {topo.edges.map(([a, b], idx) => {
            const na = topo.nodes[a];
            const nb = topo.nodes[b];
            const isWinEdge =
              state.winningLine && state.winningLine.includes(a) && state.winningLine.includes(b);
            return (
              <line
                key={idx}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={isWinEdge ? theme.validHighlight : theme.boardLine}
                strokeWidth={isWinEdge ? 1.5 : 0.9}
                strokeLinecap="round"
              />
            );
          })}

          {/* Nodes & Pieces */}
          {topo.nodes.map((node) => {
            const owner = state.board[node.id];
            const isSelected = state.selectedNode === node.id;
            const isValidDest = validDestinations.includes(node.id);
            const isCapturable = capturableNodes.includes(node.id);
            const isWinNode = state.winningLine?.includes(node.id) ?? false;
            const isLastTo = state.lastMove?.to === node.id;
            const isLastFrom = state.lastMove?.from === node.id;

            const canClick =
              !disabled &&
              state.phase !== 'gameover' &&
              ((state.phase === 'placement' && owner === null) ||
                (state.phase === 'movement' && (owner === state.turn || isValidDest)) ||
                (state.phase === 'capture' && isCapturable));

            const showHoverPreview =
              canClick && hoveredNode === node.id && state.phase === 'placement' && owner === null;

            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: canClick ? 'pointer' : 'default' }}
              >
                {/* Invisible generous hit target */}
                <circle cx={node.x} cy={node.y} r={6.8} fill="transparent" />

                {/* Base intersection dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={1.65}
                  fill={theme.boardLine}
                />

                {/* Last move origin faint ring */}
                {isLastFrom && owner === null && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={2.8}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={0.55}
                    strokeDasharray="1.2 1.2"
                    opacity={0.6}
                  />
                )}

                {/* Valid destination pulse */}
                {isValidDest && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={pieceRadius + 0.6}
                    fill={theme.validHighlight}
                    fillOpacity={0.22}
                    stroke={theme.validHighlight}
                    strokeWidth={0.85}
                  />
                )}

                {/* Placement hover preview */}
                {showHoverPreview && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={pieceRadius}
                    fill={state.turn === 1 ? theme.p1Color : theme.p2Color}
                    fillOpacity={0.38}
                    stroke={state.turn === 1 ? theme.p1Stroke : theme.p2Stroke}
                    strokeWidth={0.6}
                  />
                )}

                {/* Placed Piece */}
                {owner !== null && (
                  <g
                    filter="url(#piece-shadow)"
                    className={`${isLastTo ? 'animate-piece-enter ' : ''}${owner === state.turn && state.winner === null ? 'coin-turn-active' : ''}`}
                    style={{ '--coin-turn-glow': owner === 1 ? theme.p1Glow : theme.p2Glow } as React.CSSProperties}
                  >
                    {/* Selection / Capture / Win Ring */}
                    {(isSelected || isCapturable || isWinNode) && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={pieceRadius + 1.5}
                        fill="none"
                        stroke={
                          isCapturable
                            ? theme.captureHighlight
                            : isWinNode
                              ? theme.validHighlight
                              : theme.accent
                        }
                        strokeWidth={0.95}
                      />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={pieceRadius}
                      fill={owner === 1 ? theme.p1Color : theme.p2Color}
                      stroke={owner === 1 ? theme.p1Stroke : theme.p2Stroke}
                      strokeWidth={0.8}
                    />
                    {/* Subtle inner bevel */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={pieceRadius * 0.56}
                      fill="none"
                      stroke={owner === 1 ? theme.p1Stroke : theme.p2Stroke}
                      strokeWidth={0.4}
                      opacity={0.45}
                    />
                    {/* Last moved indicator */}
                    {isLastTo && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={1.1}
                        fill={theme.accent}
                      />
                    )}
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom tray: Player 1 reserve */}
      <div className="flex items-center justify-between px-2">
        <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: theme.textMuted }}>
          {theme.p1Name} Reserve ({state.toPlace[1]})
        </span>
        {renderReserveTray(1)}
      </div>
    </div>
  );
};
