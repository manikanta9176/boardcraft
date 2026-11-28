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

const ArcadeArtwork: React.FC<{ gameId: GameId; theme: ThemePalette }> = ({ gameId, theme }) => {
  if (gameId === '2048') {
    const values = [2, 4, 0, 8, 4, 8, 16, 0, 0, 2, 32, 4, 2, 0, 4, 2];
    return <g>{values.map((value, index) => {
      const x = 73 + (index % 4) * 30;
      const y = 18 + Math.floor(index / 4) * 30;
      const mix = Math.min(62, 9 + Math.log2(value || 2) * 7);
      return <g key={index}>
        <rect x={x} y={y} width="26" height="26" rx="5" fill={value ? `color-mix(in srgb, ${theme.validHighlight} ${mix}%, ${theme.bgSurface})` : theme.bgBoardAlt} stroke={theme.border} />
        {value > 0 && <text x={x + 13} y={y + 17} textAnchor="middle" fontSize={value > 9 ? 9 : 11} fontWeight="700" fill={theme.textPrimary}>{value}</text>}
      </g>;
    })}</g>;
  }
  if (gameId === 'minesweeper') {
    return <g>{Array.from({ length: 8 }, (_, index) => {
      const x = 78 + (index % 4) * 27;
      const y = 22 + Math.floor(index / 4) * 34;
      const revealed = [0, 1, 4, 5, 6].includes(index);
      const value = [1, 2, 1, 3, 1][[0, 1, 4, 5, 6].indexOf(index)];
      return <g key={index}>
        <rect x={x} y={y} width="23" height="29" rx="5" fill={revealed ? theme.bgApp : theme.bgSurface} stroke={theme.border} />
        {revealed && <text x={x + 11.5} y={y + 20} textAnchor="middle" fontSize="14" fontWeight="700" fill={value === 1 ? theme.validHighlight : theme.captureHighlight}>{value}</text>}
        {!revealed && index === 3 && <path d={`M${x + 11} ${y + 7}v14M${x + 11} ${y + 7}l9 3-9 3`} fill="none" stroke={theme.accent} strokeWidth="2" strokeLinejoin="round" />}
      </g>;
    })}</g>;
  }
  if (gameId === 'snake') return <g>
    <rect x="52" y="9" width="156" height="128" rx="14" fill={theme.bgBoardAlt} stroke={theme.border} />
    <path d="M82 43h41q11 0 11 11v30q0 10 10 10h21" fill="none" stroke={theme.validHighlight} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="82" cy="43" r="7" fill={theme.accent} /><circle cx="165" cy="94" r="6" fill={theme.captureHighlight} />
  </g>;
  if (gameId === 'pocket-racer') return <g>
    <rect x="68" y="8" width="124" height="130" rx="16" fill={theme.bgBoardAlt} stroke={theme.border} />
    <path d="M109 11v124m42-124v124" stroke={theme.boardLine} strokeWidth="1.3" strokeDasharray="5 6" />
    <path d="M87 68h16v25H87zm71-38h16v25h-16z" fill={theme.captureHighlight} opacity=".88" />
    <path d="M128 97h16v27h-16z" fill={theme.validHighlight} />
  </g>;
  if (gameId === 'yahtzee') return <g>{[0, 1, 2, 3, 4].map((index) => {
    const x = 58 + index * 31;
    const y = index % 2 ? 58 : 34;
    return <g key={index}><rect x={x} y={y} width="25" height="25" rx="6" fill={theme.bgSurface} stroke={theme.border} /><circle cx={x + 12.5} cy={y + 12.5} r="3.4" fill={index < 3 ? theme.validHighlight : theme.accent} /></g>;
  })}<path d="M65 112h130" stroke={theme.boardLine} strokeWidth="2" strokeLinecap="round" /><circle cx="94" cy="112" r="3" fill={theme.validHighlight} /><circle cx="130" cy="112" r="3" fill={theme.validHighlight} /></g>;
  const cells = ['W', 'O', 'R', 'D', 'S'];
  return <g>{Array.from({ length: 15 }, (_, index) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    const x = 63 + col * 29;
    const y = 29 + row * 32;
    const state = row === 0 ? 'correct' : row === 1 && col === 2 ? 'present' : row === 2 && col < 2 ? 'absent' : '';
    const fill = state === 'correct' ? theme.validHighlight : state === 'present' ? theme.captureHighlight : state ? theme.bgBoardAlt : theme.bgSurface;
    return <g key={index}>
      <rect x={x} y={y} width="24" height="27" rx="4" fill={fill} stroke={theme.border} />
      {state && <text x={x + 12} y={y + 18} textAnchor="middle" fontSize="13" fontWeight="700" fill="#FFFFFF">{cells[col]}</text>}
    </g>;
  })}</g>;
};

const TabletopArtwork: React.FC<{ gameId: GameId; theme: ThemePalette }> = ({ gameId, theme }) => {
  if (gameId === 'chess') return <g>{Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => <rect key={`${row}-${col}`} x={79 + col * 13} y={19 + row * 13} width="13" height="13" fill={(row + col) % 2 ? theme.bgBoardAlt : theme.bgSurface} />))}<text x="130" y="74" textAnchor="middle" fontSize="51" fill={theme.p2Color}>♞</text><text x="105" y="42" textAnchor="middle" fontSize="24" fill={theme.p1Color}>♙</text><text x="155" y="107" textAnchor="middle" fontSize="24" fill={theme.p1Color}>♙</text></g>;
  if (gameId === 'ludo' || gameId === 'ashta-chamma') return <g>
    <rect x="69" y="8" width="122" height="130" rx="15" fill={theme.bgBoardAlt} stroke={theme.border} />
    <path d="M92 18h77v31h-24v24h24v47H92V96h24V72H92Z" fill={theme.bgSurface} stroke={theme.border} strokeWidth="1.2" />
    <path d="M116 72h24v24h-24z" fill={theme.accentSoft} stroke={theme.border} />
    <circle cx="100" cy="28" r="7" fill={theme.p1Color} /><circle cx="158" cy="112" r="7" fill={theme.p2Color} />
    <circle cx="126" cy="83" r="4" fill={theme.accent} /><circle cx="134" cy="83" r="4" fill={theme.validHighlight} />
  </g>;
  if (gameId === 'carrom') return <g>
    <rect x="64" y="7" width="132" height="132" rx="14" fill={theme.bgBoardAlt} stroke={theme.border} />
    <rect x="73" y="16" width="114" height="114" rx="9" fill={theme.bgBoard} stroke={theme.accent} strokeOpacity=".45" />
    {[80, 180].flatMap((x) => [23, 123].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="6" fill={theme.bgApp} />))}
    <circle cx="130" cy="73" r="18" fill="none" stroke={theme.boardLine} strokeOpacity=".5" />
    <circle cx="130" cy="73" r="6" fill={theme.captureHighlight} /><circle cx="119" cy="73" r="5" fill={theme.p1Color} /><circle cx="141" cy="73" r="5" fill={theme.p2Color} />
  </g>;
  if (gameId === 'tambola') return <g>
    <rect x="43" y="23" width="174" height="100" rx="13" fill={theme.bgSurface} stroke={theme.border} />
    {Array.from({ length: 15 }, (_, index) => { const x = 53 + index % 5 * 31; const y = 34 + Math.floor(index / 5) * 27; const active = [0, 2, 4, 6, 8, 10, 12].includes(index); return <g key={index}><rect x={x} y={y} width="26" height="22" rx="4" fill={active ? theme.validHighlight : theme.bgApp} stroke={theme.border} /><text x={x + 13} y={y + 15} textAnchor="middle" fontSize="10" fontWeight="700" fill={active ? '#FFFFFF' : theme.textPrimary}>{[4, 12, 21, 33, 46, 53, 67, 72, 88, 9, 18, 25, 39, 58, 81][index]}</text></g>; })}
  </g>;
  if (gameId === 'dice-duel' || gameId === 'yahtzee') return <g>{[0, 1, 2].map((index) => { const x = 75 + index * 43; const y = index === 1 ? 45 : 58; return <g key={index}><rect x={x} y={y} width="34" height="34" rx="8" fill={theme.bgSurface} stroke={theme.border} /><circle cx={x + 17} cy={y + 17} r="3.5" fill={index === 1 ? theme.validHighlight : theme.accent} /></g>; })}</g>;
  return <g><rect x="82" y="20" width="96" height="106" rx="18" fill={theme.bgBoardAlt} stroke={theme.border} /><path d="M130 32v78m-28-39h56" stroke={theme.boardLine} strokeWidth="2" strokeDasharray="5 5" /><circle cx="130" cy="93" r="8" fill={theme.p1Color} /><circle cx="130" cy="42" r="8" fill={theme.p2Color} /><circle cx="103" cy="71" r="8" fill={theme.captureHighlight} /></g>;
};

export const GameArtwork: React.FC<GameArtworkProps> = ({ gameId, theme, className = '' }) => {
  let artwork: React.ReactNode;
  if (gameId.includes('morris')) artwork = <MorrisArtwork gameId={gameId} theme={theme} />;
  else if (['2048', 'minesweeper', 'word-guess', 'snake', 'pocket-racer', 'yahtzee'].includes(gameId)) artwork = <ArcadeArtwork gameId={gameId} theme={theme} />;
  else {
    switch (gameId) {
      case 'connect4': artwork = <ConnectArtwork theme={theme} />; break;
      case 'reversi': artwork = <ReversiArtwork theme={theme} />; break;
      case 'checkers': artwork = <CheckersArtwork theme={theme} />; break;
      case 'mancala': artwork = <MancalaArtwork theme={theme} />; break;
      case 'gomoku': artwork = <GomokuArtwork theme={theme} />; break;
      case 'dots-and-boxes': artwork = <DotsArtwork theme={theme} />; break;
      default: artwork = <TabletopArtwork gameId={gameId} theme={theme} />; break;
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
