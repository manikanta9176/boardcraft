import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CarFront, Pause, Play, RotateCcw, Shell, Sparkles } from 'lucide-react';
import { ArcadeState } from '../games/arcade';
import { applyChessMove, ChessSquare, getLegalChessMoves, isChessKingInCheck } from '../games/chess';
import { getMovableRaceTokens, moveRaceToken, raceTrackIndex, rollRaceDie, skipRaceTurn } from '../games/raceGames';
import { callTambolaNumber, moveRacer, rollDiceDuel, rollYahtzee, scoreYahtzeeCategory, shootCarrom, stepSnake, toggleHeldDie, turnSnake, bankDiceDuel, YAHTZEE_CATEGORIES } from '../games/partyGames';
import { Player, ThemePalette } from '../types/game';

interface Props {
  state: ArcadeState;
  theme: ThemePalette;
  onChange: (state: ArcadeState, recordUndo?: boolean) => void;
  onRestart: () => void;
}

const buttonStyle = (theme: ThemePalette, primary = false): React.CSSProperties => ({
  backgroundColor: primary ? theme.accent : theme.bgSurface,
  color: primary ? theme.isDark ? theme.bgApp : '#FFFFFF' : theme.textPrimary,
  border: `1px solid ${primary ? theme.accent : theme.border}`,
});

const SectionTitle: React.FC<{ title: string; subtitle: string; theme: ThemePalette; trailing?: React.ReactNode }> = ({ title, subtitle, theme, trailing }) => (
  <div className="flex items-center justify-between gap-3">
    <div><h2 className="text-xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>{title}</h2><p className="text-xs" style={{ color: theme.textMuted }}>{subtitle}</p></div>
    {trailing}
  </div>
);

const ChessBoard: React.FC<Props> = ({ state, theme, onChange }) => {
  if (state.gameId !== 'chess') return null;
  const [selected, setSelected] = useState<ChessSquare | null>(null);
  const legal = useMemo(() => selected ? getLegalChessMoves(state, selected).map((move) => move.to) : [], [state, selected]);
  const last = state.lastMove;
  const handleSquare = (row: number, col: number) => {
    const piece = state.board[row][col];
    if (selected && legal.some(([r, c]) => r === row && c === col)) {
      const next = applyChessMove(state, { from: selected, to: [row, col] });
      if (next !== state) onChange(next);
      setSelected(null);
    } else if (piece?.player === state.turn) setSelected([row, col]);
    else setSelected(null);
  };
  const symbols: Record<string, string> = { '1-pawn': '♙', '1-rook': '♖', '1-knight': '♘', '1-bishop': '♗', '1-queen': '♕', '1-king': '♔', '2-pawn': '♟', '2-rook': '♜', '2-knight': '♞', '2-bishop': '♝', '2-queen': '♛', '2-king': '♚' };
  return <section className="w-full max-w-[520px] space-y-3" aria-label="Chess board">
    <SectionTitle title="Chess" subtitle="Select a piece, then choose a highlighted square." theme={theme} trailing={<span className="rounded-full px-3 py-1.5 text-[10px] font-bold" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>LOCAL 2P</span>} />
    <div className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-2xl shadow-lg" role="grid" aria-label="Chess board">
      {state.board.flatMap((row, r) => row.map((piece, c) => {
        const activeSelected = selected?.[0] === r && selected?.[1] === c;
        const destination = legal.some(([y, x]) => y === r && x === c);
        const lastMove = last && ((last.from[0] === r && last.from[1] === c) || (last.to[0] === r && last.to[1] === c));
        const inCheck = piece?.kind === 'king' && isChessKingInCheck(state.board, piece.player);
        const light = (r + c) % 2 === 0;
        const label = `${['8','7','6','5','4','3','2','1'][r]}${'abcdefgh'[c]}${piece ? ` ${piece.player === 1 ? 'Light' : 'Dark'} ${piece.kind}` : ''}`;
        return <button key={`${r}-${c}`} role="gridcell" onClick={() => handleSquare(r, c)} aria-label={label} aria-selected={activeSelected} className="relative grid aspect-square place-items-center text-[clamp(21px,7vw,43px)] leading-none transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: activeSelected ? theme.validHighlight : inCheck ? `${theme.captureHighlight}88` : lastMove ? `${theme.validHighlight}3B` : light ? theme.bgSurface : theme.bgBoardAlt, color: piece?.player === 1 ? theme.textPrimary : theme.accent, outlineColor: theme.validHighlight, textShadow: piece?.player === 1 ? '0 1px 1px rgba(0,0,0,.12)' : '0 1px 1px rgba(0,0,0,.25)' }}>
          {piece && <span aria-hidden="true">{symbols[`${piece.player}-${piece.kind}`]}</span>}
          {destination && <span aria-hidden="true" className={`absolute rounded-full ${piece ? 'inset-[9%] border-[3px]' : 'h-[22%] w-[22%]'}`} style={{ backgroundColor: piece ? 'transparent' : `${theme.validHighlight}99`, borderColor: theme.validHighlight }} />}
        </button>;
      }))}
    </div>
    <p className="text-center text-[11px]" style={{ color: theme.textMuted }}>Pawns promote to queens. Castling and en passant are enabled.</p>
  </section>;
};

const TRACK52: [number, number][] = [
  ...Array.from({ length: 13 }, (_, i) => [i + 1, 0] as [number, number]),
  ...Array.from({ length: 13 }, (_, i) => [14, i + 1] as [number, number]),
  ...Array.from({ length: 13 }, (_, i) => [13 - i, 14] as [number, number]),
  ...Array.from({ length: 13 }, (_, i) => [0, 13 - i] as [number, number]),
];
const tokenColor = (player: Player, theme: ThemePalette) => player === 1 ? theme.p1Color : theme.p2Color;

const RaceBoard: React.FC<Props> = ({ state, theme, onChange }) => {
  if (state.gameId !== 'ludo' && state.gameId !== 'ashta-chamma') return null;
  const movable = getMovableRaceTokens(state);
  const track = state.trackLength === 52 ? TRACK52 : Array.from({ length: state.trackLength }, (_, i) => TRACK52[Math.floor(i * 52 / state.trackLength)]);
  const homePositions = (player: Player, step: number): [number, number] => player === 1 ? [1 + step, 7] : [13 - step, 7];
  const playerOneStart = 0;
  const playerTwoStart = Math.floor(state.trackLength / 2);
  const getTrackTokens = (trackIndex: number) => ([1, 2] as Player[]).flatMap((player) => state.tokens[player].flatMap((progress, index) => progress >= 0 && progress < state.trackLength && raceTrackIndex(state, player, progress) === trackIndex ? [{ player, index, progress }] : []));
  const getHomeTokens = (x: number, y: number) => ([1, 2] as Player[]).flatMap((player) => state.tokens[player].flatMap((progress, index) => {
    if (progress === state.trackLength + 5) return x === 7 && y === 7 ? [{ player, index, progress }] : [];
    if (progress < state.trackLength || progress >= state.trackLength + 5) return [];
    const [px, py] = homePositions(player, progress - state.trackLength);
    return px === x && py === y ? [{ player, index, progress }] : [];
  }));
  const token = (player: Player, index: number, selectable: boolean) => <button key={`${player}-${index}`} onClick={() => selectable && onChange(moveRaceToken(state, index))} aria-label={`Player ${player} token ${index + 1}${selectable ? ', move token' : ''}`} disabled={!selectable} className="grid aspect-square w-full place-items-center rounded-full border-2 text-[10px] font-black transition-transform disabled:cursor-default" style={{ backgroundColor: tokenColor(player, theme), borderColor: player === 1 ? theme.p1Stroke : theme.p2Stroke, color: player === 1 && theme.isDark ? theme.bgApp : player === 2 && !theme.isDark ? '#FFFFFF' : theme.bgSurface, transform: selectable ? 'scale(1.12)' : undefined, boxShadow: selectable ? `0 0 0 3px ${player === 1 ? theme.p1Glow : theme.p2Glow}` : '0 1px 3px rgba(0,0,0,.18)' }}>{index + 1}</button>;
  const homeTokenCount = (player: Player) => state.tokens[player].filter((progress) => progress < 0).length;
  const finish = state.trackLength + 5;
  const roll = () => onChange(rollRaceDie(state));
  return <section className="w-full max-w-[560px] space-y-3" aria-label={`${state.gameId} board`}>
    <SectionTitle title={state.gameId === 'ludo' ? 'Ludo' : 'Ashta Chamma'} subtitle={state.gameId === 'ludo' ? 'Roll, choose a token, and race to the center.' : 'Throw the cowries, then move a token.'} theme={theme} trailing={<span className="rounded-full px-3 py-1.5 text-[10px] font-bold" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>2 PLAYERS</span>} />
    <div className="grid aspect-square overflow-hidden rounded-2xl border p-1 sm:p-2" style={{ backgroundColor: theme.bgBoardAlt, borderColor: theme.border, gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', gridTemplateRows: 'repeat(15, minmax(0, 1fr))' }}>
      {Array.from({ length: 225 }, (_, cell) => {
        const x = cell % 15; const y = Math.floor(cell / 15);
        const trackIndex = track.findIndex(([px, py]) => px === x && py === y);
        const isHomeOne = x >= 1 && x <= 4 && y >= 10 && y <= 13;
        const isHomeTwo = x >= 10 && x <= 13 && y >= 1 && y <= 4;
        const homeLaneOne = y === 7 && x >= 1 && x <= 6;
        const homeLaneTwo = y === 7 && x >= 8 && x <= 13;
        const central = x >= 6 && x <= 8 && y >= 6 && y <= 8;
        const background = trackIndex >= 0 ? (trackIndex === playerOneStart ? `${theme.p1Color}66` : trackIndex === playerTwoStart ? `${theme.p2Color}66` : theme.bgSurface) : homeLaneOne ? `${theme.p1Color}75` : homeLaneTwo ? `${theme.p2Color}75` : isHomeOne ? `${theme.p1Color}20` : isHomeTwo ? `${theme.p2Color}22` : central ? theme.accentSoft : 'transparent';
        const boardTokens = trackIndex >= 0 ? getTrackTokens(trackIndex) : getHomeTokens(x, y);
        const yardTokens: { player: Player; index: number }[] = [];
        if (isHomeOne || isHomeTwo) {
          const player: Player = isHomeOne ? 1 : 2;
          const localX = isHomeOne ? x - 1 : x - 10; const localY = isHomeOne ? y - 10 : y - 1;
          const index = (localY < 2 ? 0 : 2) + (localX < 2 ? 0 : 1);
          if (localX % 2 === 0 && localY % 2 === 0 && index < 4 && state.tokens[player][index] < 0) yardTokens.push({ player, index });
        }
        const hasToken = boardTokens.length > 0 || yardTokens.length > 0;
        const selectableTokens = [...boardTokens, ...yardTokens].filter((item) => item.player === state.turn && movable.includes(item.index));
        return <div key={cell} className="relative grid min-h-0 min-w-0 place-items-center border-[.5px]" style={{ backgroundColor: background, borderColor: `${theme.border}90` }}>
          {central && x === 7 && y === 7 && <Sparkles className="h-4 w-4" style={{ color: theme.accent }} />}
          {hasToken && <div className={`absolute inset-[9%] grid ${boardTokens.length + yardTokens.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} place-items-center gap-[1px]`}>
            {boardTokens.map(({ player, index }) => token(player, index, player === state.turn && movable.includes(index)))}
            {yardTokens.map(({ player, index }) => token(player, index, player === state.turn && movable.includes(index)))}
          </div>}
          {selectableTokens.length > 0 && <span className="absolute -inset-[2px] rounded-sm border-2" style={{ borderColor: theme.validHighlight, boxShadow: `0 0 5px ${theme.validHighlight}88`, pointerEvents: 'none' }} />}
        </div>;
      })}
    </div>
    <div className="flex flex-wrap items-center justify-center gap-2">
      <button onClick={roll} disabled={state.die !== null || state.winner !== null} className="min-h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-45" style={buttonStyle(theme, true)}>{state.die === null ? state.gameId === 'ashta-chamma' ? <><Shell className="mr-2 inline h-4 w-4" />Throw cowries</> : 'Roll die' : `${state.gameId === 'ashta-chamma' && state.die === 8 ? 'Ashta! ' : ''}Rolled ${state.die}`}</button>
      {state.die !== null && movable.length === 0 && <button onClick={() => onChange(skipRaceTurn(state))} className="min-h-11 rounded-full px-5 text-sm font-semibold" style={buttonStyle(theme)}>No move · pass turn</button>}
      {state.lastCapture && <span className="text-xs font-semibold" style={{ color: theme.validHighlight }}>Token sent home — roll again!</span>}
    </div>
    <div className="flex justify-between text-[11px]" style={{ color: theme.textMuted }}><span>Player 1 · {homeTokenCount(1)} in yard · {state.tokens[1].filter((step) => step === finish).length} home</span><span>Player 2 · {homeTokenCount(2)} in yard · {state.tokens[2].filter((step) => step === finish).length} home</span></div>
  </section>;
};

const CarromBoard: React.FC<Props> = ({ state, theme, onChange, onRestart }) => {
  if (state.gameId !== 'carrom') return null;
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ start: [number, number]; current: [number, number] } | null>(null);
  const pointerPoint = (event: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const box = svgRef.current!.getBoundingClientRect();
    return [(event.clientX - box.left) * 100 / box.width, (event.clientY - box.top) * 100 / box.height];
  };
  const striker = state.discs.find((disc) => disc.owner === 'striker')!;
  const onPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (state.winner !== null || drag || Math.hypot(pointerPoint(event)[0] - striker.x, pointerPoint(event)[1] - striker.y) > 9) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPoint(event); setDrag({ start: point, current: point });
  };
  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => { if (drag) setDrag({ ...drag, current: pointerPoint(event) }); };
  const onPointerUp = () => {
    if (!drag) return;
    const dx = drag.start[0] - drag.current[0]; const dy = drag.start[1] - drag.current[1];
    const next = shootCarrom(state, dx, dy, Math.hypot(dx, dy));
    if (next !== state) onChange(next);
    setDrag(null);
  };
  return <section className="w-full max-w-[520px] space-y-3" aria-label="Carrom table">
    <SectionTitle title="Carrom" subtitle="Pull back from the striker and release to shoot." theme={theme} trailing={<span className="rounded-full px-3 py-1.5 text-[10px] font-bold" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>PLAYER {state.turn}</span>} />
    <svg ref={svgRef} viewBox="0 0 100 100" className="block w-full touch-none rounded-[26px] border-[10px] shadow-xl" style={{ backgroundColor: theme.bgBoard, borderColor: theme.bgBoardAlt }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} aria-label="Drag the striker toward the coins">
      <rect x="5" y="5" width="90" height="90" rx="8" fill={theme.bgBoard} stroke={theme.accent} strokeOpacity=".25" strokeWidth="1.1" />
      <circle cx="50" cy="50" r="17" fill="none" stroke={theme.boardLine} strokeOpacity=".35" strokeWidth=".8" />
      <circle cx="50" cy="50" r="1.5" fill={theme.accent} opacity=".7" />
      {[16, 84].flatMap((x) => [16, 84].map((y) => <g key={`${x}-${y}`}><circle cx={x} cy={y} r="6.1" fill={theme.bgBoardAlt} /><circle cx={x} cy={y} r="4.3" fill={theme.bgApp} /></g>))}
      {drag && <line x1={striker.x} y1={striker.y} x2={drag.start[0] + (drag.start[0] - drag.current[0]) * 2} y2={drag.start[1] + (drag.start[1] - drag.current[1]) * 2} stroke={theme.validHighlight} strokeWidth=".8" strokeDasharray="2 1.5" />}
      {state.discs.map((disc) => {
        if (disc.pocketed) return null;
        const fill = disc.owner === 'striker' ? theme.textPrimary : disc.owner === 'queen' ? theme.captureHighlight : tokenColor(disc.owner, theme);
        const movableStriker = disc.owner === 'striker' && disc.y === striker.y && state.winner === null;
        return <g key={disc.id} style={{ transform: `translate(${disc.x}%, ${disc.y}%)`, transformBox: 'view-box', transformOrigin: '0 0', transition: 'transform 760ms cubic-bezier(.16,.7,.24,1)' }} pointerEvents="none">
          <circle cx="0" cy="0" r={disc.owner === 'striker' ? 3.2 : 2.3} fill={fill} stroke={disc.owner === 'striker' ? theme.accent : theme.bgBoardAlt} strokeWidth=".65" />
          {movableStriker && <circle cx="0" cy="0" r="4.2" fill="none" stroke={theme.validHighlight} strokeWidth=".8" strokeDasharray="1 1" />}
          {disc.owner === 'queen' && <circle cx="0" cy="0" r=".65" fill={theme.bgSurface} />}
        </g>;
      })}
    </svg>
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs" style={{ color: theme.textSecondary }}>{state.lastShot === 'foul' ? 'Striker foul · turn passed.' : 'Pocket your colour to score and keep shooting.'}</p>
      {state.status === 'complete' && <button onClick={onRestart} className="min-h-11 rounded-full px-4 text-xs font-semibold" style={buttonStyle(theme, true)}><RotateCcw className="mr-1.5 inline h-3.5 w-3.5" />Play again</button>}
    </div>
    <div className="flex justify-between text-xs font-semibold" style={{ color: theme.textPrimary }}><span>Player 1 · {state.scores[1]} pts</span><span>Player 2 · {state.scores[2]} pts</span></div>
  </section>;
};

const DiceFace: React.FC<{ value: number | null; theme: ThemePalette; size?: 'normal' | 'large' }> = ({ value, theme, size = 'normal' }) => (
  <div aria-label={value === null ? 'Die not rolled' : `Die showing ${value}`} className={`grid aspect-square ${size === 'large' ? 'w-20 rounded-2xl text-4xl' : 'w-12 rounded-xl text-2xl'} place-items-center border font-black shadow-sm`} style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, borderColor: theme.border }}>{value ?? '·'}</div>
);

const DiceDuelBoard: React.FC<Props> = ({ state, theme, onChange }) => {
  if (state.gameId !== 'dice-duel') return null;
  return <section className="w-full max-w-[440px] space-y-6" aria-label="Dice Duel">
    <SectionTitle title="Dice Duel" subtitle="Roll again or bank your points. First to 50 wins." theme={theme} />
    <div className="rounded-[26px] p-5 sm:p-7" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between"><div><div className="text-xs font-semibold" style={{ color: theme.textMuted }}>PLAYER {state.turn} · TURN POT</div><div className="mt-1 text-4xl font-bold tabular-nums" style={{ color: theme.textPrimary }}>+{state.turnScore}</div></div><DiceFace value={state.die} theme={theme} size="large" /></div>
      <div className="mt-6 flex gap-3"><button onClick={() => onChange(rollDiceDuel(state))} disabled={state.winner !== null} className="min-h-12 flex-1 rounded-full text-sm font-semibold disabled:opacity-45" style={buttonStyle(theme, true)}>Roll die</button><button onClick={() => onChange(bankDiceDuel(state))} disabled={state.turnScore === 0 || state.winner !== null} className="min-h-12 flex-1 rounded-full text-sm font-semibold disabled:opacity-45" style={buttonStyle(theme)}>Bank {state.turnScore || ''}</button></div>
      {state.die === 1 && <p className="mt-3 text-center text-sm font-semibold" style={{ color: theme.captureHighlight }}>A one! Your turn pot is gone. Next player.</p>}
    </div>
    <div className="grid grid-cols-2 gap-3">{([1, 2] as Player[]).map((player) => <div key={player} className="rounded-2xl p-4 text-center" style={{ backgroundColor: player === state.turn ? theme.accentSoft : theme.bgSurface, border: `1px solid ${player === state.turn ? player === 1 ? theme.p1Stroke : theme.p2Stroke : theme.border}` }}><div className="text-xs font-semibold" style={{ color: theme.textMuted }}>PLAYER {player}</div><div className="text-3xl font-bold tabular-nums" style={{ color: theme.textPrimary }}>{state.scores[player]}</div></div>)}</div>
  </section>;
};

const YahtzeeBoard: React.FC<Props> = ({ state, theme, onChange, onRestart }) => {
  if (state.gameId !== 'yahtzee') return null;
  const total = Object.values(state.scores).reduce((sum, score) => sum + (score ?? 0), 0);
  return <section className="w-full max-w-[560px] space-y-3" aria-label="Yahtzee scorecard">
    <SectionTitle title="Yahtzee" subtitle="Hold dice between rolls, then score one category." theme={theme} trailing={<div className="rounded-xl px-3 py-2 text-center" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>Score</div><div className="text-lg font-bold" style={{ color: theme.textPrimary }}>{total}</div></div>} />
    <div className="flex justify-center gap-2 sm:gap-3">{state.dice.map((die, index) => <button key={index} onClick={() => onChange(toggleHeldDie(state, index), false)} aria-pressed={state.held[index]} aria-label={`Die ${index + 1}: ${die || 'not rolled'}${state.held[index] ? ', held' : ''}`} className="grid aspect-square w-[17%] max-w-[72px] place-items-center rounded-2xl border text-3xl font-black shadow-sm transition-transform" style={{ backgroundColor: state.held[index] ? theme.accentSoft : theme.bgSurface, borderColor: state.held[index] ? theme.validHighlight : theme.border, color: theme.textPrimary, transform: state.held[index] ? 'translateY(-4px)' : undefined }}>{die || '·'}</button>)}</div>
    <div className="flex items-center justify-center gap-3"><span className="text-xs font-medium" style={{ color: theme.textMuted }}>{state.status === 'complete' ? 'Scorecard complete' : `${state.rollsLeft} rolls left`}</span>{state.status === 'playing' ? <button onClick={() => onChange(rollYahtzee(state))} disabled={state.rollsLeft === 0} className="min-h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-45" style={buttonStyle(theme, true)}>Roll dice</button> : <button onClick={onRestart} className="min-h-11 rounded-full px-5 text-sm font-semibold" style={buttonStyle(theme, true)}><RotateCcw className="mr-1.5 inline h-4 w-4" />New scorecard</button>}</div>
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">{YAHTZEE_CATEGORIES.map((category) => {
      const used = category in state.scores;
      const score = used ? state.scores[category] : state.dice.some((die) => die > 0) ? scoreYahtzeeCategory(state, category).scores[category] : null;
      return <button key={category} onClick={() => onChange(scoreYahtzeeCategory(state, category))} disabled={used || score === null || state.status === 'complete'} className="flex min-h-10 items-center justify-between rounded-xl px-3 text-xs font-semibold disabled:opacity-45" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}><span>{category}</span><span className="tabular-nums" style={{ color: used ? theme.textMuted : theme.accent }}>{score ?? '—'}</span></button>;
    })}</div>
    <p className="text-center text-[10px]" style={{ color: theme.textMuted }}>Upper section: matching faces. Lower section: straights and combinations.</p>
  </section>;
};

const TambolaBoard: React.FC<Props> = ({ state, theme, onChange, onRestart }) => {
  if (state.gameId !== 'tambola') return null;
  const last = state.called[state.called.length - 1];
  const called = new Set(state.called);
  return <section className="w-full max-w-[680px] space-y-4" aria-label="Tambola number caller">
    <SectionTitle title="Tambola · Housie" subtitle="Two tickets, one number caller. Numbers mark automatically." theme={theme} />
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl p-3" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
      <div className="grid h-16 w-16 place-items-center rounded-2xl text-3xl font-black tabular-nums" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>{last ?? '—'}</div>
      <button onClick={() => onChange(callTambolaNumber(state))} disabled={state.status !== 'playing'} className="min-h-12 rounded-full px-5 text-sm font-semibold disabled:opacity-45" style={buttonStyle(theme, true)}>{state.status === 'playing' ? `Call next number · ${90 - state.called.length} left` : state.winner === 'draw' ? 'Full house · draw' : state.winner ? `Player ${state.winner} wins!` : 'All balls called'}</button>
      <button onClick={onRestart} className="grid min-h-11 min-w-11 place-items-center rounded-full" aria-label="Deal new Tambola tickets" style={buttonStyle(theme)}><RotateCcw className="h-4 w-4" /></button>
    </div>
    <div className="grid gap-3 md:grid-cols-2">{([1, 2] as Player[]).map((player) => <div key={player} className="rounded-2xl p-2.5 sm:p-3" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${player === state.turn && state.status === 'playing' ? player === 1 ? theme.p1Stroke : theme.p2Stroke : theme.border}` }}>
      <div className="mb-2 flex items-center justify-between px-1"><span className="text-xs font-bold" style={{ color: theme.textPrimary }}>PLAYER {player} · {state.scores[player]} ROWS</span><span className="text-[10px] font-semibold" style={{ color: theme.validHighlight }}>{state.rowClaims[player].filter(Boolean).length}/3</span></div>
      <div className="grid grid-cols-9 overflow-hidden rounded-xl border" style={{ borderColor: theme.border }}>{state.tickets[player].flatMap((row, r) => row.map((number, c) => <div key={`${r}-${c}`} className="grid aspect-square place-items-center border-r border-b text-[clamp(10px,3vw,16px)] font-bold tabular-nums" style={{ backgroundColor: number !== null && called.has(number) ? theme.validHighlight : theme.bgApp, color: number !== null && called.has(number) ? '#FFFFFF' : number ? theme.textPrimary : theme.bgSurface, borderColor: theme.border }}>{number ?? ''}</div>))}</div>
    </div>)}</div>
    <div className="rounded-2xl p-3" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}><div className="mb-2 flex justify-between text-xs font-semibold" style={{ color: theme.textSecondary }}><span>Called numbers</span><span>{state.called.length} / 90</span></div><div className="grid grid-cols-10 gap-1 sm:grid-cols-15">{Array.from({ length: 90 }, (_, index) => index + 1).map((number) => <span key={number} className="grid aspect-square place-items-center rounded-md text-[9px] tabular-nums sm:text-[10px]" style={{ backgroundColor: called.has(number) ? theme.accent : theme.bgApp, color: called.has(number) ? theme.isDark ? theme.bgApp : '#FFFFFF' : theme.textMuted }}>{number}</span>)}</div></div>
    <p className="text-center text-[10px]" style={{ color: theme.textMuted }}>Pass the screen to the other player before calling the next number.</p>
  </section>;
};

const SnakeBoard: React.FC<Props> = ({ state, theme, onChange, onRestart }) => {
  if (state.gameId !== 'snake') return null;
  const [paused, setPaused] = useState(false);
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => {
    if (paused || state.status !== 'playing') return;
    const timer = window.setInterval(() => {
      const next = stepSnake(latest.current);
      if (next !== latest.current) onChange(next, false);
    }, 190);
    return () => window.clearInterval(timer);
  }, [paused, state.status, onChange]);
  const changeDirection = (direction: 'up' | 'right' | 'down' | 'left') => {
    setPaused(false);
    onChange(turnSnake(state, direction), false);
  };
  const touchStart = useRef<[number, number] | null>(null);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const directions: Record<string, 'up' | 'right' | 'down' | 'left'> = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' };
    const direction = directions[event.key];
    if (direction) { event.preventDefault(); changeDirection(direction); }
  };
  const body = new Set(state.body.map(([x, y]) => `${x}:${y}`));
  return <section className="w-full max-w-[480px] space-y-3" aria-label="Snake arcade game">
    <SectionTitle title="Snake" subtitle="Collect fruit. Keep your tail clear." theme={theme} trailing={<div className="text-right"><div className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>Score</div><div className="text-xl font-bold tabular-nums" style={{ color: theme.textPrimary }}>{state.score}<span className="ml-2 text-xs font-medium" style={{ color: theme.textMuted }}>Best {state.best}</span></div></div>} />
    <div tabIndex={0} onKeyDown={onKeyDown} onTouchStart={(event) => { touchStart.current = [event.touches[0].clientX, event.touches[0].clientY]; }} onTouchEnd={(event) => { if (!touchStart.current) return; const dx = event.changedTouches[0].clientX - touchStart.current[0]; const dy = event.changedTouches[0].clientY - touchStart.current[1]; if (Math.max(Math.abs(dx), Math.abs(dy)) > 18) changeDirection(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up'); touchStart.current = null; }} className="relative grid aspect-square grid-cols-[repeat(18,minmax(0,1fr))] overflow-hidden rounded-2xl border p-1.5 sm:p-2" style={{ backgroundColor: theme.bgBoardAlt, borderColor: theme.border, touchAction: 'none' }} aria-label="Snake board; swipe or use arrow keys">
      {Array.from({ length: 324 }, (_, cell) => { const x = cell % 18; const y = Math.floor(cell / 18); const isHead = state.body[0][0] === x && state.body[0][1] === y; const isBody = body.has(`${x}:${y}`); const isFood = state.food[0] === x && state.food[1] === y; return <div key={cell} className="grid min-h-0 min-w-0 place-items-center rounded-[3px]" style={{ backgroundColor: isHead ? theme.validHighlight : isBody ? theme.p1Color : isFood ? `${theme.captureHighlight}55` : 'transparent', transition: 'background-color 110ms ease' }}>{isFood && <span className="h-[58%] w-[58%] rounded-full" style={{ backgroundColor: theme.captureHighlight, boxShadow: `0 0 9px ${theme.captureHighlight}88` }} />}</div>; })}
      {(paused || state.status !== 'playing') && <div className="absolute inset-0 grid place-items-center backdrop-blur-[2px]" style={{ backgroundColor: `${theme.bgSurface}B8` }}><div className="rounded-2xl px-5 py-3 text-center" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}><div className="font-bold" style={{ color: theme.textPrimary }}>{state.status === 'lost' ? 'Run over' : 'Paused'}</div><div className="mt-1 text-xs" style={{ color: theme.textMuted }}>Score {state.score}</div></div></div>}
    </div>
    <div className="flex items-center justify-center gap-2"><button onClick={() => state.status === 'lost' ? onRestart() : setPaused(!paused)} className="min-h-11 rounded-full px-4 text-xs font-semibold" style={buttonStyle(theme)}>{state.status === 'lost' ? <><RotateCcw className="mr-1.5 inline h-3.5 w-3.5" />Play again</> : paused ? <><Play className="mr-1.5 inline h-3.5 w-3.5" />Resume</> : <><Pause className="mr-1.5 inline h-3.5 w-3.5" />Pause</>}</button><button onClick={onRestart} aria-label="Restart snake" className="grid min-h-11 min-w-11 place-items-center rounded-full" style={buttonStyle(theme)}><RotateCcw className="h-4 w-4" /></button></div>
    <div className="mx-auto grid w-36 grid-cols-3 gap-1.5 sm:hidden">{(['up', 'left', 'down', 'right'] as const).map((direction) => { const Icon = direction === 'up' ? ArrowUp : direction === 'left' ? ArrowLeft : direction === 'down' ? ArrowDown : ArrowRight; return <button key={direction} onClick={() => changeDirection(direction)} aria-label={`Turn ${direction}`} className={`grid min-h-11 place-items-center rounded-xl ${direction === 'up' ? 'col-start-2' : direction === 'right' ? 'col-start-3' : ''}`} style={buttonStyle(theme)}><Icon className="h-4 w-4" /></button>; })}</div>
  </section>;
};

const RacerBoard: React.FC<Props> = ({ state, theme, onChange, onRestart }) => {
  if (state.gameId !== 'pocket-racer') return null;
  const setLane = (lane: number) => onChange(moveRacer(state, lane), false);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); setLane(state.lane + (event.key === 'ArrowLeft' ? -1 : 1)); } };
  return <section className="w-full max-w-[420px] space-y-3" aria-label="Pocket Racer">
    <SectionTitle title="Pocket Racer" subtitle="Dodge the traffic. Every move takes you farther." theme={theme} trailing={<div className="text-right"><div className="text-[10px] uppercase tracking-wider" style={{ color: theme.textMuted }}>DISTANCE</div><div className="text-xl font-bold tabular-nums" style={{ color: theme.textPrimary }}>{state.score}<span className="ml-2 text-xs font-medium" style={{ color: theme.textMuted }}>Best {state.best}</span></div></div>} />
    <div tabIndex={0} onKeyDown={onKeyDown} className="relative mx-auto grid h-[min(68dvh,520px)] min-h-[300px] w-full grid-cols-3 overflow-hidden rounded-[26px] border p-3" style={{ backgroundColor: theme.bgBoardAlt, borderColor: theme.border, backgroundImage: `linear-gradient(90deg, transparent 32.8%, ${theme.border} 33%, transparent 33.4%, transparent 66.1%, ${theme.border} 66.4%, transparent 66.8%)` }} aria-label="Three lane race">
      {state.road.map((row, y) => row.map((occupied, lane) => <div key={`${y}:${lane}`} className="relative grid place-items-center" style={{ gridRow: y + 1, gridColumn: lane + 1, transition: 'all 140ms ease' }}>{occupied === 1 && <CarFront className="h-7 w-7 sm:h-9 sm:w-9" style={{ color: lane === 1 ? theme.captureHighlight : theme.textSecondary, filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.18))' }} />}</div>))}
      <div className="absolute bottom-4 left-0 right-0 grid grid-cols-3 px-3">{[0, 1, 2].map((lane) => <button key={lane} onClick={() => setLane(lane)} aria-label={`Steer to ${['left','center','right'][lane]} lane`} className="mx-auto grid h-14 w-12 place-items-center rounded-xl border-2 transition-transform" style={{ gridColumn: lane + 1, backgroundColor: state.lane === lane ? theme.validHighlight : theme.bgSurface, borderColor: state.lane === lane ? theme.accent : theme.border, color: state.lane === lane ? theme.isDark ? theme.bgApp : '#FFFFFF' : theme.textMuted, transform: state.lane === lane ? 'translateY(-3px)' : undefined }}><CarFront className="h-7 w-7" /></button>)}</div>
      {state.status === 'crashed' && <div className="absolute inset-0 grid place-items-center backdrop-blur-[2px]" style={{ backgroundColor: `${theme.bgSurface}C8` }}><div className="rounded-2xl p-5 text-center" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}><p className="font-bold" style={{ color: theme.textPrimary }}>Traffic stop!</p><p className="mt-1 text-xs" style={{ color: theme.textMuted }}>You made it {state.score} moves.</p><button onClick={onRestart} className="mt-3 min-h-11 rounded-full px-5 text-sm font-semibold" style={buttonStyle(theme, true)}>Race again</button></div></div>}
    </div>
    <div className="flex justify-center gap-2 sm:hidden">{[-1, 1].map((change) => <button key={change} onClick={() => setLane(state.lane + change)} disabled={state.lane + change < 0 || state.lane + change > 2 || state.status !== 'playing'} className="grid min-h-11 min-w-16 place-items-center rounded-xl disabled:opacity-40" style={buttonStyle(theme)}>{change < 0 ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</button>)}</div>
  </section>;
};

export const ExtraGamesBoard: React.FC<Props> = (props) => {
  const id = props.state.gameId;
  if (id === 'chess') return <ChessBoard {...props} />;
  if (id === 'ludo' || id === 'ashta-chamma') return <RaceBoard {...props} />;
  if (id === 'carrom') return <CarromBoard {...props} />;
  if (id === 'tambola') return <TambolaBoard {...props} />;
  if (id === 'dice-duel') return <DiceDuelBoard {...props} />;
  if (id === 'yahtzee') return <YahtzeeBoard {...props} />;
  if (id === 'snake') return <SnakeBoard {...props} />;
  if (id === 'pocket-racer') return <RacerBoard {...props} />;
  return null;
};
