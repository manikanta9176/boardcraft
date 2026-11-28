import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Bomb, Flag, RotateCcw, Sparkles } from 'lucide-react';
import {
  ArcadeState,
  MineTile,
  Move2048,
  MinesweeperState,
  Tile2048State,
  WordGuessState,
  gradeWordGuess,
  move2048,
  removeWordLetter,
  revealMineTile,
  submitWordGuess,
  toggleMineFlag,
  typeWordLetter,
} from '../games/arcade';
import { ThemePalette } from '../types/game';
import { ExtraGamesBoard } from './ExtraGamesBoard';

interface ArcadeBoardProps {
  state: ArcadeState;
  theme: ThemePalette;
  onStateChange: (state: ArcadeState, recordUndo?: boolean) => void;
  onRestart: () => void;
}

const DIRECTIONS: { id: Move2048; icon: React.FC<{ className?: string }>; label: string }[] = [
  { id: 'up', icon: ArrowUp, label: 'Move tiles up' },
  { id: 'left', icon: ArrowLeft, label: 'Move tiles left' },
  { id: 'down', icon: ArrowDown, label: 'Move tiles down' },
  { id: 'right', icon: ArrowRight, label: 'Move tiles right' },
];

const tileColor = (value: number, theme: ThemePalette) => {
  if (value === 0) return { backgroundColor: theme.bgApp, color: theme.textMuted };
  const mix = Math.min(62, 9 + Math.log2(value) * 7);
  return {
    backgroundColor: value === 2 ? theme.bgSurface : `color-mix(in srgb, ${theme.validHighlight} ${mix}%, ${theme.bgSurface})`,
    color: mix > 38 && theme.isDark ? theme.textPrimary : theme.textPrimary,
    border: `1px solid ${theme.border}`,
  };
};

const ScorePill: React.FC<{ theme: ThemePalette; label: string; value: number }> = ({ theme, label, value }) => (
  <div className="min-w-24 rounded-xl px-3 py-2 text-center" style={{ backgroundColor: theme.bgApp, border: `1px solid ${theme.border}` }}>
    <div className="text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: theme.textMuted }}>{label}</div>
    <div className="mt-0.5 text-lg font-bold tabular-nums" style={{ color: theme.textPrimary }}>{value}</div>
  </div>
);

const Tiles2048: React.FC<{ state: Tile2048State; theme: ThemePalette; onChange: ArcadeBoardProps['onStateChange']; onRestart: () => void }> = ({ state, theme, onChange, onRestart }) => {
  const move = (direction: Move2048) => onChange(move2048(state, direction));
  const [touchStart, setTouchStart] = useState<[number, number] | null>(null);
  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart[0];
    const dy = touch.clientY - touchStart[1];
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
    setTouchStart(null);
  };

  return (
    <section className="w-full max-w-[460px] space-y-4" aria-label="2048 puzzle">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>2048</h2>
          <p className="text-xs" style={{ color: theme.textMuted }}>Slide matching tiles together.</p>
        </div>
        <div className="flex gap-2">
          <ScorePill theme={theme} label="Score" value={state.score} />
          <ScorePill theme={theme} label="Best" value={state.best} />
        </div>
      </div>

      {state.reached2048 && <div className="rounded-xl px-3 py-2 text-center text-sm font-semibold" role="status" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>2048! Keep going or start fresh.</div>}
      {state.over && <div className="rounded-xl px-3 py-2 text-center text-sm font-semibold" role="status" style={{ backgroundColor: `${theme.captureHighlight}1A`, color: theme.captureHighlight }}>No moves left. Give it another run.</div>}

      <div
        role="group"
        tabIndex={0}
        className="grid aspect-square grid-cols-4 gap-2 rounded-[22px] p-2.5 sm:gap-3 sm:p-3"
        style={{ backgroundColor: theme.bgBoardAlt, border: `1px solid ${theme.border}`, touchAction: 'none' }}
        onTouchStart={(event) => setTouchStart([event.touches[0].clientX, event.touches[0].clientY])}
        onTouchEnd={onTouchEnd}
        onKeyDown={(event) => {
          const keys: Record<string, Move2048> = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' };
          const direction = keys[event.key];
          if (direction) {
            event.preventDefault();
            move(direction);
          }
        }}
        aria-label="2048 tile board; swipe or use the arrow buttons below"
      >
        {state.board.flatMap((row, r) => row.map((value, c) => (
          <div key={`${r}-${c}`} className="grid min-h-0 min-w-0 place-items-center rounded-xl text-xl font-extrabold tabular-nums sm:text-2xl" style={tileColor(value, theme)}>
            {value || ''}
          </div>
        )))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="grid grid-cols-3 gap-1.5" aria-label="Tile movement controls">
          <span />
          {DIRECTIONS.filter((item) => item.id === 'up').map(({ id, icon: Icon, label }) => <button key={id} onClick={() => move(id)} aria-label={label} className="grid min-h-11 min-w-12 place-items-center rounded-xl" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}><Icon className="h-4 w-4" /></button>)}
          <span />
          {DIRECTIONS.filter((item) => item.id === 'left' || item.id === 'down' || item.id === 'right').map(({ id, icon: Icon, label }) => <button key={id} onClick={() => move(id)} aria-label={label} className="grid min-h-11 min-w-12 place-items-center rounded-xl" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}><Icon className="h-4 w-4" /></button>)}
        </div>
        <p className="text-[11px]" style={{ color: theme.textMuted }}>Swipe on mobile or use arrow keys.</p>
        <button onClick={onRestart} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-semibold" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}><RotateCcw className="h-3.5 w-3.5" />New round</button>
      </div>
    </section>
  );
};

const mineNumberColors = ['transparent', '#4265BD', '#3C8A58', '#CC725E', '#6861A9', '#B45A4A', '#267D83', '#262626', '#777777'];

const Minesweeper: React.FC<{ state: MinesweeperState; theme: ThemePalette; onChange: ArcadeBoardProps['onStateChange']; onRestart: () => void }> = ({ state, theme, onChange, onRestart }) => {
  const [flagMode, setFlagMode] = useState(false);
  const tapTile = (row: number, col: number) => onChange(flagMode ? toggleMineFlag(state, row, col) : revealMineTile(state, row, col));
  const statusText = state.status === 'won' ? 'All clear. Nicely done.' : state.status === 'lost' ? 'Mine hit. Reset for another board.' : 'Find every safe tile. Mark mines with flags.';

  return (
    <section className="w-full max-w-[440px] space-y-4" aria-label="Minesweeper puzzle">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>Minesweeper</h2>
          <p className="text-xs" style={{ color: theme.textMuted }}>A safe first tap is guaranteed.</p>
        </div>
        <div className="rounded-xl px-3 py-2 text-center" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
          <div className="text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: theme.textMuted }}>Mines left</div>
          <div className="text-lg font-bold tabular-nums" style={{ color: theme.textPrimary }}>{state.mineCount - state.flags}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs" role="status" style={{ color: state.status === 'lost' ? theme.captureHighlight : theme.textSecondary }}>{statusText}</p>
        <button onClick={() => setFlagMode((current) => !current)} aria-pressed={flagMode} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-semibold" style={{ backgroundColor: flagMode ? theme.accentSoft : theme.bgSurface, color: flagMode ? theme.accent : theme.textSecondary, border: `1px solid ${flagMode ? `${theme.accent}55` : theme.border}` }}><Flag className="h-4 w-4" />{flagMode ? 'Flagging' : 'Flag mode'}</button>
      </div>

      <div className="grid aspect-square grid-cols-9 gap-1 rounded-2xl p-2 sm:gap-1.5 sm:p-2.5" style={{ backgroundColor: theme.bgBoardAlt, border: `1px solid ${theme.border}` }}>
        {state.board.flatMap((line, row) => line.map((tile, col) => <MineCell key={`${row}:${col}`} tile={tile} row={row} col={col} theme={theme} onTap={() => tapTile(row, col)} disabled={state.status !== 'playing'} />))}
      </div>

      {(state.status !== 'playing') && <button onClick={onRestart} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold" style={{ backgroundColor: theme.accent, color: theme.isDark ? theme.bgApp : '#FFFFFF' }}><RotateCcw className="h-4 w-4" />Play again</button>}
      <p className="text-center text-[11px]" style={{ color: theme.textMuted }}>Tap a tile to reveal. Switch on flag mode to mark a mine.</p>
    </section>
  );
};

const MineCell: React.FC<{ tile: MineTile; row: number; col: number; theme: ThemePalette; onTap: () => void; disabled: boolean }> = ({ tile, row, col, theme, onTap, disabled }) => (
  <button
    onClick={onTap}
    disabled={tile.revealed || disabled}
    aria-label={tile.revealed ? tile.mine ? `Mine at row ${row + 1}, column ${col + 1}` : tile.adjacent ? `${tile.adjacent} nearby mines` : 'Empty safe tile' : tile.flagged ? 'Flagged tile' : `Hidden tile, row ${row + 1}, column ${col + 1}`}
    className="grid aspect-square min-h-0 min-w-0 place-items-center rounded-md text-[clamp(10px,3.3vw,17px)] font-bold transition-colors disabled:cursor-default"
    style={{ backgroundColor: tile.revealed ? theme.bgApp : theme.bgSurface, color: tile.mine ? theme.captureHighlight : mineNumberColors[tile.adjacent], border: `1px solid ${tile.revealed ? theme.border : theme.bgBoardAlt}`, boxShadow: tile.revealed ? 'inset 0 1px 2px rgba(0,0,0,.08)' : `0 2px 0 ${theme.bgBoardAlt}` }}
  >
    {tile.flagged ? <Flag className="h-[52%] w-[52%]" /> : tile.revealed && tile.mine ? <Bomb className="h-[58%] w-[58%]" /> : tile.revealed && tile.adjacent ? tile.adjacent : null}
  </button>
);

const LETTERS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

const WordGuess: React.FC<{ state: WordGuessState; theme: ThemePalette; onChange: ArcadeBoardProps['onStateChange']; onRestart: () => void }> = ({ state, theme, onChange, onRestart }) => {
  const [message, setMessage] = useState('');
  const type = (letter: string) => {
    const next = typeWordLetter(state, letter);
    if (next !== state) {
      setMessage('');
      onChange(next, false);
    }
  };
  const backspace = () => onChange(removeWordLetter(state), false);
  const submit = () => {
    const next = submitWordGuess(state);
    if (next === state) {
      setMessage('Enter five letters first.');
      return;
    }
    setMessage('');
    onChange(next, true);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === 'Enter' && event.target instanceof HTMLButtonElement) return;
      if (/^[a-z]$/i.test(event.key)) type(event.key.toUpperCase());
      else if (event.key === 'Backspace') { event.preventDefault(); backspace(); }
      else if (event.key === 'Enter') submit();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state, onChange]);

  const keyboardState = useMemo(() => {
    const priorities: Record<string, number> = {};
    for (const guess of state.guesses) {
      const grades = gradeWordGuess(guess, state.target);
      guess.split('').forEach((letter, index) => {
        const value = grades[index] === 'correct' ? 3 : grades[index] === 'present' ? 2 : 1;
        priorities[letter] = Math.max(priorities[letter] ?? 0, value);
      });
    }
    return priorities;
  }, [state.guesses, state.target]);

  const status = state.status === 'won' ? `Solved in ${state.guesses.length} ${state.guesses.length === 1 ? 'guess' : 'guesses'}.` : state.status === 'lost' ? `The word was ${state.target}.` : 'Six tries. A new word every day.';
  const submitDisabled = state.current.length !== 5 || state.status !== 'playing';

  return (
    <section className="w-full max-w-[430px] space-y-4" aria-label="Daily word puzzle">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>Word Guess</h2>
          <p className="text-xs" style={{ color: theme.textMuted }}>Find the five-letter daily word.</p>
        </div>
        <span className="rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[.08em]" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}>DAILY</span>
      </div>

      <div className="grid grid-rows-6 gap-1.5 mx-auto w-full max-w-[310px]" role="grid" aria-label="Six guess rows">
        {Array.from({ length: 6 }, (_, row) => {
          const guess = state.guesses[row] ?? (row === state.guesses.length && state.status === 'playing' ? state.current : '');
          const grades = state.guesses[row] ? gradeWordGuess(guess, state.target) : [];
          return <div key={row} className="grid grid-cols-5 gap-1.5" role="row">
            {Array.from({ length: 5 }, (_, col) => {
              const grade = grades[col];
              return <div key={col} role="gridcell" className="grid aspect-square place-items-center rounded-lg border text-lg font-bold sm:text-xl" style={{ backgroundColor: grade === 'correct' ? theme.validHighlight : grade === 'present' ? theme.captureHighlight : grade === 'absent' ? theme.bgBoardAlt : theme.bgSurface, borderColor: grade ? 'transparent' : theme.border, color: grade ? '#FFFFFF' : theme.textPrimary }}>
                {guess[col] ?? ''}
              </div>;
            })}
          </div>;
        })}
      </div>

      <div className="min-h-5 text-center text-xs" role={message ? 'alert' : 'status'} style={{ color: message ? theme.captureHighlight : theme.textSecondary }}>
        {message || status}
      </div>

      <div className="space-y-1.5" aria-label="On-screen keyboard">
        {LETTERS.map((row, rowIndex) => <div key={row} className="flex justify-center gap-1">
          {row.split('').map((letter) => {
            const grade = keyboardState[letter] ?? 0;
            const background = grade === 3 ? theme.validHighlight : grade === 2 ? theme.captureHighlight : grade === 1 ? theme.bgBoardAlt : theme.bgSurface;
            return <button key={letter} onClick={() => type(letter)} disabled={state.status !== 'playing'} aria-label={`Type ${letter}`} className="min-h-10 min-w-0 flex-1 max-w-10 rounded-lg text-xs font-bold" style={{ backgroundColor: background, color: grade ? '#FFFFFF' : theme.textPrimary, border: `1px solid ${theme.border}` }}>{letter}</button>;
          })}
          {rowIndex === 2 && <>
            <button onClick={backspace} disabled={state.status !== 'playing'} aria-label="Delete letter" className="min-h-10 rounded-lg px-2 text-[10px] font-bold" style={{ backgroundColor: theme.bgSurface, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>⌫</button>
            <button onClick={submit} disabled={submitDisabled} className="min-h-10 rounded-lg px-2 text-[10px] font-bold disabled:opacity-40" style={{ backgroundColor: theme.accent, color: theme.isDark ? theme.bgApp : '#FFFFFF' }}>ENTER</button>
          </>}
        </div>)}
      </div>

      {state.status !== 'playing' && <button onClick={onRestart} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}><Sparkles className="h-4 w-4" />Play today&apos;s puzzle again</button>}
      <p className="text-center text-[11px]" style={{ color: theme.textMuted }}>Use your keyboard or tap the letters.</p>
    </section>
  );
};

export const ArcadeBoard: React.FC<ArcadeBoardProps> = ({ state, theme, onStateChange, onRestart }) => {
  if (state.gameId === '2048') return <Tiles2048 state={state} theme={theme} onChange={onStateChange} onRestart={onRestart} />;
  if (state.gameId === 'minesweeper') return <Minesweeper state={state} theme={theme} onChange={onStateChange} onRestart={onRestart} />;
  if (state.gameId === 'word-guess') return <WordGuess state={state} theme={theme} onChange={onStateChange} onRestart={onRestart} />;
  return <ExtraGamesBoard state={state} theme={theme} onChange={onStateChange} onRestart={onRestart} />;
};
