import React from 'react';
import { GameId, ThemePalette } from '../types/game';

interface GameArtworkProps {
  gameId: GameId;
  theme: ThemePalette;
  className?: string;
}

const MorrisArtwork: React.FC<{ gameId: GameId; theme: ThemePalette }> = ({ gameId, theme }) => {
  const rings = gameId === 'three-mens-morris' ? [30] : gameId === 'six-mens-morris' ? [30, 50] : [30, 50, 70];
  const center = 130;
  const top = 73 - rings[rings.length - 1];
  const bottom = 73 + rings[rings.length - 1];
  const nodes = rings.flatMap((radius) => [
    [center - radius, 73 - radius], [center, 73 - radius], [center + radius, 73 - radius],
    [center - radius, 73], [center + radius, 73],
    [center - radius, 73 + radius], [center, 73 + radius], [center + radius, 73 + radius],
  ]);
  if (rings.length === 1) nodes.push([center, 73]);
  const edges = rings.flatMap((radius) => [
    [[center - radius, 73 - radius], [center + radius, 73 - radius]],
    [[center - radius, 73 + radius], [center + radius, 73 + radius]],
    [[center - radius, 73 - radius], [center - radius, 73 + radius]],
    [[center + radius, 73 - radius], [center + radius, 73 + radius]],
  ]);
  if (rings.length > 1) {
    edges.push(
      [[center, top], [center, 73 - rings[rings.length - 2]]],
      [[center + rings[rings.length - 2], 73], [center + rings[rings.length - 1], 73]],
      [[center, 73 + rings[rings.length - 2]], [center, bottom]],
      [[center - rings[rings.length - 1], 73], [center - rings[rings.length - 2], 73]],
    );
    if (gameId === 'twelve-mens-morris') {
      edges.push(
        [[center - rings[2], 73 - rings[2]], [center - rings[1], 73 - rings[1]]],
        [[center - rings[1], 73 - rings[1]], [center - rings[0], 73 - rings[0]]],
        [[center + rings[2], 73 - rings[2]], [center + rings[1], 73 - rings[1]]],
        [[center + rings[1], 73 - rings[1]], [center + rings[0], 73 - rings[0]]],
        [[center + rings[2], 73 + rings[2]], [center + rings[1], 73 + rings[1]]],
        [[center + rings[1], 73 + rings[1]], [center + rings[0], 73 + rings[0]]],
        [[center - rings[2], 73 + rings[2]], [center - rings[1], 73 + rings[1]]],
        [[center - rings[1], 73 + rings[1]], [center - rings[0], 73 + rings[0]]],
      );
    }
  } else {
    edges.push(
      [[center, top], [center, 73 + rings[0]]],
      [[center - rings[0], 73], [center + rings[0], 73]],
      [[center - rings[0], top], [center + rings[0], 73 + rings[0]]],
      [[center + rings[0], top], [center - rings[0], 73 + rings[0]]],
    );
  }
  const occupied = new Set([0, 2, 5, 9, 13, nodes.length - 2]);

  return (
    <g>
      {edges.map(([[x1, y1], [x2, y2]], index) => <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke={theme.boardLine} strokeWidth="2.2" strokeLinecap="round" />)}
      {nodes.map(([x, y], index) => (
        <g key={`${x}-${y}-${index}`}>
          <circle cx={x} cy={y} r="3.6" fill={theme.boardNode} stroke={theme.boardLine} strokeWidth="1" />
          {occupied.has(index) && <circle cx={x} cy={y} r="5.2" fill={index % 2 ? theme.p2Color : theme.p1Color} stroke={index % 2 ? theme.p2Stroke : theme.p1Stroke} strokeWidth="1.2" />}
        </g>
      ))}
    </g>
  );
};

const ConnectArtwork: React.FC<{ theme: ThemePalette }> = ({ theme }) => (
  <g>
    <rect x="48" y="13" width="164" height="120" rx="13" fill={theme.bgBoardAlt} stroke={theme.border} />
    {Array.from({ length: 6 }, (_, row) => Array.from({ length: 7 }, (_, col) => {
      const pieces: Record<string, number> = { '5-1': 1, '5-2': 2, '4-2': 1, '5-4': 2, '3-2': 1 };
      const player = pieces[`${row}-${col}`];
      return <circle key={`${row}-${col}`} cx={67 + col * 24} cy={30 + row * 17} r="7.2" fill={player === 1 ? theme.p1Color : player === 2 ? theme.p2Color : theme.bgBoard} stroke={theme.border} strokeWidth="1.2" />;
    }))}
  </g>
);

const ReversiArtwork: React.FC<{ theme: ThemePalette }> = ({ theme }) => (
  <g>
    <rect x="67" y="9" width="126" height="128" rx="8" fill={theme.bgBoardAlt} stroke={theme.border} />
    {Array.from({ length: 7 }, (_, index) => <g key={index}>
      <line x1={83 + index * 16} y1="16" x2={83 + index * 16} y2="130" stroke={theme.boardLine} strokeWidth=".8" />
      <line x1="74" y1={25 + index * 16} x2="186" y2={25 + index * 16} stroke={theme.boardLine} strokeWidth=".8" />
    </g>)}
    {[[2, 2, 1], [2, 3, 2], [3, 2, 2], [3, 3, 1], [1, 4, 1], [4, 4, 2]].map(([row, col, player], index) => <circle key={index} cx={83 + col * 16} cy={25 + row * 16} r="6" fill={player === 1 ? theme.p1Color : theme.p2Color} stroke={theme.bgBoard} strokeWidth="1.2" />)}
  </g>
);

const CheckersArtwork: React.FC<{ theme: ThemePalette }> = ({ theme }) => (
  <g>
    <rect x="72" y="12" width="116" height="122" rx="8" fill={theme.bgBoardAlt} stroke={theme.border} />
    {Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => {
      const dark = (row + col) % 2 === 1;
      const player = dark && row < 2 && (row + col) % 2 ? 2 : dark && row > 5 && (row + col) % 2 ? 1 : 0;
      const x = 79 + col * 13.4;
      const y = 19 + row * 14;
      return <g key={`${row}-${col}`}>
        <rect x={x} y={y} width="13.4" height="14" fill={dark ? theme.boardNode : theme.bgBoard} />
        {player > 0 && <circle cx={x + 6.7} cy={y + 7} r="4.4" fill={player === 1 ? theme.p1Color : theme.p2Color} stroke={player === 1 ? theme.p1Stroke : theme.p2Stroke} strokeWidth=".8" />}
      </g>;
    }))}
  </g>
);

const MancalaArtwork: React.FC<{ theme: ThemePalette }> = ({ theme }) => (
  <g>
    <rect x="30" y="24" width="200" height="98" rx="48" fill={theme.bgBoardAlt} stroke={theme.border} />
    <ellipse cx="50" cy="73" rx="12" ry="32" fill={theme.bgBoard} stroke={theme.boardLine} strokeWidth="1.5" />
    <ellipse cx="210" cy="73" rx="12" ry="32" fill={theme.bgBoard} stroke={theme.boardLine} strokeWidth="1.5" />
    {Array.from({ length: 6 }, (_, index) => <g key={index}>
      <ellipse cx={77 + index * 21} cy="49" rx="8" ry="10" fill={theme.bgBoard} stroke={theme.boardLine} strokeWidth="1.3" />
      <ellipse cx={77 + index * 21} cy="97" rx="8" ry="10" fill={theme.bgBoard} stroke={theme.boardLine} strokeWidth="1.3" />
      {[0, 1, 2].map((seed) => <circle key={seed} cx={74 + index * 21 + (seed % 2) * 5} cy={47 + (seed === 2 ? 4 : 0)} r="1.8" fill={theme.p1Color} />)}
      {[0, 1, 2].map((seed) => <circle key={seed} cx={74 + index * 21 + (seed % 2) * 5} cy={95 + (seed === 2 ? 4 : 0)} r="1.8" fill={theme.p2Color} />)}
    </g>)}
  </g>
);

const GomokuArtwork: React.FC<{ theme: ThemePalette }> = ({ theme }) => (
  <g>
    <rect x="55" y="10" width="150" height="126" rx="10" fill={theme.bgBoardAlt} stroke={theme.border} />
    {Array.from({ length: 7 }, (_, index) => <g key={index}>
      <line x1={79 + index * 19} y1="22" x2={79 + index * 19} y2="124" stroke={theme.boardLine} strokeWidth=".8" />
      <line x1="67" y1={30 + index * 15} x2="193" y2={30 + index * 15} stroke={theme.boardLine} strokeWidth=".8" />
    </g>)}
    {[[2, 2, 1], [2, 3, 2], [3, 3, 1], [4, 4, 2], [3, 5, 1], [5, 2, 2]].map(([row, col, player], index) => <circle key={index} cx={79 + col * 19} cy={30 + row * 15} r="5.2" fill={player === 1 ? theme.p1Color : theme.p2Color} stroke={theme.bgBoard} strokeWidth="1.2" />)}
  </g>
);

const DotsArtwork: React.FC<{ theme: ThemePalette }> = ({ theme }) => (
  <g>
    <rect x="52" y="10" width="156" height="126" rx="10" fill={theme.bgBoard} stroke={theme.border} />
    {Array.from({ length: 5 }, (_, row) => Array.from({ length: 6 }, (_, col) => {
      const x = 72 + col * 24;
      const y = 29 + row * 22;
      const isHorizontal = (row === 1 && col < 3) || (row === 3 && col > 1 && col < 5);
      const isVertical = (col === 2 && row > 0 && row < 3) || (col === 4 && row > 1 && row < 4);
      return <g key={`${row}-${col}`}>
        {col < 5 && <line x1={x} y1={y} x2={x + 24} y2={y} stroke={isHorizontal ? theme.p1Color : theme.boardLine} strokeWidth={isHorizontal ? 2.4 : 1.2} strokeLinecap="round" />}
        {row < 4 && <line x1={x} y1={y} x2={x} y2={y + 22} stroke={isVertical ? theme.p2Color : theme.boardLine} strokeWidth={isVertical ? 2.4 : 1.2} strokeLinecap="round" />}
        <circle cx={x} cy={y} r="2.5" fill={theme.textPrimary} />
      </g>;
    }))}
  </g>
);

export const GameArtwork: React.FC<GameArtworkProps> = ({ gameId, theme, className = '' }) => {
  let artwork: React.ReactNode;
  if (gameId.includes('morris')) artwork = <MorrisArtwork gameId={gameId} theme={theme} />;
  else {
    switch (gameId) {
      case 'connect4': artwork = <ConnectArtwork theme={theme} />; break;
      case 'reversi': artwork = <ReversiArtwork theme={theme} />; break;
      case 'checkers': artwork = <CheckersArtwork theme={theme} />; break;
      case 'mancala': artwork = <MancalaArtwork theme={theme} />; break;
      case 'gomoku': artwork = <GomokuArtwork theme={theme} />; break;
      case 'dots-and-boxes': artwork = <DotsArtwork theme={theme} />; break;
    }
  }

  return (
    <svg className={className} viewBox="0 0 260 146" role="img" aria-label={`Illustrated board preview for ${gameId.replaceAll('-', ' ')}`}>
      <rect width="260" height="146" rx="18" fill={theme.bgBoard} />
      <path d="M0 115h260M0 131h260" stroke={theme.bgBoardAlt} strokeWidth=".7" opacity=".65" />
      {artwork}
    </svg>
  );
};
