import React, { useState } from 'react';
import { Bot, Clock3, Globe2, Grid3X3, Menu, Users2, Wifi } from 'lucide-react';
import { GAMES } from '../games/registry';
import { GameCategory, GameId, ThemePalette } from '../types/game';
import { GameIcon } from './GameIcon';

interface LobbyViewProps {
  theme: ThemePalette;
  onLaunchGame: (id: GameId, mode: 'ai' | 'local') => void;
  onOpenMultiplayer: (tab: 'online' | 'hotspot', gameId?: GameId) => void;
  onOpenMenu: () => void;
}

const MorrisMark: React.FC<{ theme: ThemePalette }> = ({ theme }) => {
  const points = [
    [55, 55], [150, 55], [245, 55], [55, 150], [150, 150], [245, 150],
    [55, 245], [150, 245], [245, 245],
  ];
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[270px] drop-shadow-2xl" role="img" aria-label="Three Men's Morris board">
      <g fill="none" stroke={theme.textMuted} strokeOpacity=".46" strokeWidth="2">
        <path d="M55 55h190v190H55zM95 95h110v110H95zM135 135h30v30h-30z" />
        <path d="M150 55v80M245 150h-80M150 245v-80M55 150h80" />
      </g>
      {points.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="12" fill={theme.bgBoard} stroke={theme.border} strokeWidth="2" />
          {[0, 2, 4, 6].includes(i) && <circle cx={x} cy={y} r="6.5" fill={i === 0 ? theme.p2Color : theme.p1Color} />}
        </g>
      ))}
      <circle cx="55" cy="55" r="17" fill="none" stroke={theme.accent} strokeOpacity=".42" strokeWidth="1.5" />
    </svg>
  );
};

export const LobbyView: React.FC<LobbyViewProps> = ({ theme, onLaunchGame, onOpenMultiplayer, onOpenMenu }) => {
  const [filter, setFilter] = useState<'all' | GameCategory>('all');
  const visibleGames = filter === 'all' ? GAMES : GAMES.filter((game) => game.category === filter);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-7 lg:px-10 py-7 sm:py-10">
      <div className="lg:hidden flex items-center gap-3 mb-5">
        <button onClick={onOpenMenu} aria-label="Open game navigation" className="w-10 h-10 rounded-xl inline-flex items-center justify-center" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}><Menu className="w-4 h-4" /></button>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg inline-flex items-center justify-center" style={{ backgroundColor: theme.accentSoft, color: theme.accent }}><Grid3X3 className="w-4 h-4" /></span>
          <span className="text-sm font-bold" style={{ color: theme.textPrimary }}>BoardCraft</span>
        </div>
      </div>
      <section
        className="relative isolate overflow-hidden rounded-[2rem] min-h-[350px] sm:min-h-[410px] flex items-center"
        style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}
        aria-labelledby="lobby-title"
      >
        <div className="absolute inset-0 opacity-[0.13]" aria-hidden="true" style={{ backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`, backgroundSize: '34px 34px', maskImage: 'linear-gradient(90deg, black, transparent 75%)' }} />
        <div className="relative z-10 grid w-full grid-cols-1 lg:grid-cols-[1.1fr_.9fr] items-center gap-5 sm:gap-8 px-6 sm:px-10 lg:px-14 py-9 sm:py-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold mb-5" style={{ color: theme.validHighlight }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.validHighlight }} />
              Ten games. One table.
            </div>
            <h1 id="lobby-title" className="text-[2.5rem] sm:text-5xl lg:text-[3.55rem] leading-[1.04] font-extrabold tracking-[-0.055em]" style={{ color: theme.textPrimary }}>
              Make your next
              <br />
              move <span style={{ color: theme.accent }}>count.</span>
            </h1>
            <p className="mt-5 max-w-md text-sm sm:text-base leading-relaxed" style={{ color: theme.textSecondary }}>
              Old favorites, ready for a fresh match. Learn a board, test your strategy, or invite someone to play from anywhere.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <button
                onClick={() => onLaunchGame('nine-mens-morris', 'ai')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-transform active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: theme.accent, color: theme.isDark ? '#07111A' : '#FFFFFF', outlineColor: theme.accent }}
              >
                <Bot className="w-4 h-4" />
                Play a quick game
              </button>
              <button
                onClick={() => onOpenMultiplayer('online')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ color: theme.textPrimary, backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}`, outlineColor: theme.accent }}
              >
                <Globe2 className="w-4 h-4" />
                Invite a friend
              </button>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs" style={{ color: theme.textMuted }}>
              <span className="inline-flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Play solo</span>
              <span className="inline-flex items-center gap-1.5"><Users2 className="w-3.5 h-3.5" /> Pass &amp; play</span>
              <span className="inline-flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" /> Online</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center justify-center relative min-h-[300px]">
            <div className="absolute w-72 h-72 rounded-full" style={{ backgroundColor: theme.accentSoft, filter: 'blur(34px)' }} />
            <div className="relative flex items-center justify-center rounded-[2rem] p-5" style={{ backgroundColor: theme.bgBoard, border: `1px solid ${theme.border}`, boxShadow: '0 35px 90px rgba(0,0,0,.22)' }}>
              <MorrisMark theme={theme} />
              <div className="absolute -bottom-3 -right-4 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg" style={{ color: theme.textPrimary, backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
                Nine Men&apos;s Morris
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[36%] hidden lg:block pointer-events-none" aria-hidden="true" style={{ background: `linear-gradient(90deg, transparent, ${theme.accentSoft})`, opacity: .3 }} />
      </section>

      <section className="grid grid-cols-3 divide-x mt-5 rounded-2xl py-4" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}`, color: theme.textSecondary }} aria-label="Collection details">
        <div className="px-4 sm:px-6"><div className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>10</div><div className="text-[11px] sm:text-xs mt-0.5">classic boards</div></div>
        <div className="px-4 sm:px-6"><div className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>3</div><div className="text-[11px] sm:text-xs mt-0.5">ways to play</div></div>
        <div className="px-4 sm:px-6"><div className="text-xl sm:text-2xl font-bold" style={{ color: theme.textPrimary }}>0</div><div className="text-[11px] sm:text-xs mt-0.5">accounts needed</div></div>
      </section>

      <section id="game-library" className="mt-10 sm:mt-12 scroll-mt-6" aria-labelledby="library-title">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h2 id="library-title" className="text-2xl sm:text-[1.7rem] font-bold tracking-tight" style={{ color: theme.textPrimary }}>Pick your board</h2>
            <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Choose a game and you&apos;re one move away.</p>
          </div>
          <div className="inline-flex self-start sm:self-auto gap-1 p-1 rounded-xl" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }} role="group" aria-label="Filter games">
            {([
              { id: 'all', label: `All ${GAMES.length}` },
              { id: 'morris', label: 'Morris' },
              { id: 'classic', label: 'Classics' },
            ] as const).map((item) => (
              <button key={item.id} onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className="rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: filter === item.id ? theme.accentSoft : 'transparent', color: filter === item.id ? theme.accent : theme.textMuted, outlineColor: theme.accent }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {visibleGames.map((game) => (
            <article key={game.id} className="group rounded-2xl p-4 sm:p-5 flex min-h-[206px] flex-col justify-between transition-[border-color,transform] duration-150 hover:-translate-y-0.5" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
              <div>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: theme.bgBoard, color: theme.accent, border: `1px solid ${theme.border}` }}>
                    <GameIcon id={game.id} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold leading-tight" style={{ color: theme.textPrimary }}>{game.name}</h3>
                      <span className="shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: theme.bgBoard, color: theme.textMuted }}>{game.category === 'morris' ? 'Morris' : 'Classic'}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textSecondary }}>{game.tagline}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-3 text-[11px] mb-3" style={{ color: theme.textMuted }}>
                  <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3" />{game.duration}</span>
                  <span className="inline-flex items-center gap-1"><Users2 className="w-3 h-3" />2 players</span>
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
                  <button onClick={() => onLaunchGame(game.id, 'ai')} className="min-h-9 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: theme.accentSoft, color: theme.accent, outlineColor: theme.accent }}><Bot className="w-3.5 h-3.5" />vs AI</button>
                  <button onClick={() => onLaunchGame(game.id, 'local')} className="min-h-9 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: theme.bgBoard, color: theme.textSecondary, border: `1px solid ${theme.border}`, outlineColor: theme.accent }}><Users2 className="w-3.5 h-3.5" />2 players</button>
                  <button onClick={() => onOpenMultiplayer('online', game.id)} title={`Invite a friend to ${game.name}`} aria-label={`Invite a friend to ${game.name}`} className="w-9 min-h-9 inline-flex items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: theme.bgBoard, color: theme.textSecondary, border: `1px solid ${theme.border}`, outlineColor: theme.accent }}><Globe2 className="w-4 h-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl px-5 py-4" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ color: theme.validHighlight, backgroundColor: `${theme.validHighlight}18` }}><Wifi className="w-4 h-4" /></div>
          <div><h3 className="text-sm font-semibold" style={{ color: theme.textPrimary }}>Playing in the same room?</h3><p className="text-xs mt-1" style={{ color: theme.textMuted }}>Pair over the same Wi-Fi or hotspot with a short exchange code.</p></div>
        </div>
        <button onClick={() => onOpenMultiplayer('hotspot')} className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-xl px-3.5 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.bgBoard, color: theme.textPrimary, border: `1px solid ${theme.border}` }}><Wifi className="w-3.5 h-3.5" />Local connection</button>
      </section>
    </div>
  );
};
