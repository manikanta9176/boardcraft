import React, { useState } from 'react';
import { Bot, Clock3, Globe2, Grid3X3, Menu, RotateCcw, Users2, Wifi } from 'lucide-react';
import { GAMES } from '../games/registry';
import { GameCategory, GameId, ThemePalette } from '../types/game';
import { GameArtwork } from './GameArtwork';
import { ThemeToggle } from './ThemeToggle';

interface LobbyViewProps {
  theme: ThemePalette;
  onLaunchGame: (id: GameId, mode: 'ai' | 'local') => void;
  onOpenMultiplayer: (tab: 'online' | 'hotspot', gameId?: GameId) => void;
  onOpenMenu: () => void;
  onToggleTheme: () => void;
  resumeGameId: GameId | null;
  onResumeGame: () => void;
  storageUnavailable: boolean;
}

const MARKED_GAME: GameId = 'nine-mens-morris';

export const LobbyView: React.FC<LobbyViewProps> = ({ theme, onLaunchGame, onOpenMultiplayer, onOpenMenu, onToggleTheme, resumeGameId, onResumeGame, storageUnavailable }) => {
  const [filter, setFilter] = useState<'all' | GameCategory>('all');
  const visibleGames = filter === 'all' ? GAMES : GAMES.filter((game) => game.category === filter);
  const featuredGame = GAMES.find((game) => game.id === MARKED_GAME) ?? GAMES[0];
  const resumeGame = resumeGameId ? GAMES.find((game) => game.id === resumeGameId) : null;

  const browseGames = () => document.getElementById('game-library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="lobby-page w-full max-w-[1440px] mx-auto px-4 sm:px-7 xl:px-10 py-5 sm:py-8" data-theme={theme.isDark ? 'dark' : 'light'}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onOpenMenu} aria-label="Open game navigation" className="lg:hidden w-11 h-11 rounded-xl inline-flex items-center justify-center" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}` }}><Menu className="w-4 h-4" /></button>
          <div className="flex items-center gap-2 lg:hidden">
            <span className="w-8 h-8 rounded-[10px] inline-flex items-center justify-center" style={{ color: theme.accent, backgroundColor: theme.accentSoft, border: `1px solid ${theme.accent}38` }}><Grid3X3 className="w-4 h-4" /></span>
            <span className="text-sm font-bold tracking-tight" style={{ color: theme.textPrimary }}>BoardCraft</span>
          </div>
        </div>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      <section className="lobby-hero relative isolate overflow-hidden rounded-[28px]" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }} aria-labelledby="lobby-title">
        <div className="hero-grid" aria-hidden="true" style={{ backgroundImage: `linear-gradient(${theme.textMuted}22 1px, transparent 1px), linear-gradient(90deg, ${theme.textMuted}22 1px, transparent 1px)` }} />
        <div className="relative z-10 grid lg:grid-cols-[1.05fr_.95fr] items-center gap-3 lg:gap-10 px-5 sm:px-9 xl:px-14 py-7 sm:py-10 xl:py-12">
          <div className="max-w-[640px]">
            <div className="inline-flex items-center gap-2 rounded-full py-1.5 px-2.5 text-[11px] font-bold tracking-[.08em]" style={{ backgroundColor: theme.bgBoard, color: theme.accent, border: `1px solid ${theme.border}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.validHighlight, boxShadow: `0 0 10px ${theme.validHighlight}66` }} />
              THE STRATEGY ROOM
            </div>
            <h1 id="lobby-title" className="display-face mt-5 text-[2.65rem] sm:text-6xl xl:text-[4.5rem] leading-[.92] font-medium tracking-[-.075em]" style={{ color: theme.textSecondary }}>
              Sit down.
              <br />
              <span style={{ color: theme.textPrimary }}>Think ahead.</span>
            </h1>
            <p className="mt-5 max-w-[480px] text-sm sm:text-base leading-relaxed" style={{ color: theme.textSecondary }}>
              Pick a classic, learn its rhythm, and play solo or with a friend.
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <button onClick={resumeGame ? onResumeGame : browseGames} className="action-primary min-h-11 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform active:scale-[.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ backgroundColor: theme.accent, color: theme.isDark ? theme.bgApp : '#fff', outlineColor: theme.validHighlight }}>
                {resumeGame ? <RotateCcw className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                {resumeGame ? `Continue ${resumeGame.shortName}` : 'Find your game'}
              </button>
              <button onClick={() => onOpenMultiplayer('online')} className="action-secondary min-h-11 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}`, outlineColor: theme.validHighlight }}>
                <Globe2 className="w-4 h-4" />
                Invite a friend
              </button>
            </div>

            {resumeGame && (
              <p className="mt-3 text-xs" style={{ color: theme.textMuted }}>
                {`Your ${resumeGame.name} match is saved on this device.`}
              </p>
            )}
            {storageUnavailable && (
              <p className="mt-3 text-xs" role="status" style={{ color: theme.textMuted }}>
                This browser can’t save matches. You can still play as usual.
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium" style={{ color: theme.textMuted }}>
              <span className="inline-flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" style={{ color: theme.validHighlight }} /> Play solo</span>
              <span className="inline-flex items-center gap-1.5"><Users2 className="w-3.5 h-3.5" style={{ color: theme.validHighlight }} /> Pass &amp; play</span>
              <span className="inline-flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" style={{ color: theme.validHighlight }} /> Online rooms</span>
            </div>
          </div>

          <div className="relative mt-7 lg:mt-0 mx-auto w-full max-w-[500px]">
            <div className="hero-orbit" aria-hidden="true" style={{ borderColor: `${theme.accent}35` }} />
            <div className="hero-board-frame relative mx-auto w-full max-w-[440px] p-2.5 sm:p-3.5" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
              <GameArtwork gameId={MARKED_GAME} theme={theme} className="w-full h-auto rounded-[18px]" />
              <div className="absolute left-5 top-5 sm:left-7 sm:top-7 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-bold tracking-[.08em] shadow-lg" style={{ backgroundColor: theme.bgSurface, color: theme.accent, border: `1px solid ${theme.border}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.validHighlight }} />
                BOARD 09
              </div>
            </div>
            <div className="hero-caption absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold" style={{ backgroundColor: theme.bgSurface, color: theme.textPrimary, border: `1px solid ${theme.border}`, boxShadow: theme.isDark ? '0 12px 30px rgba(0,0,0,.32)' : '0 12px 30px rgba(22,21,19,.1)' }}>
              {featuredGame.name}<span className="mx-2" style={{ color: theme.textMuted }}>·</span><span style={{ color: theme.textMuted }}>{featuredGame.duration}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="game-library" className="mt-12 sm:mt-16 scroll-mt-6" aria-labelledby="library-title">
        <div className="library-heading flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-5 sm:mb-6">
          <div>
            <div className="text-[11px] font-bold tracking-[.13em] mb-2" style={{ color: theme.validHighlight }}>THE COLLECTION <span aria-hidden="true">/</span> {String(visibleGames.length).padStart(2, '0')} BOARDS</div>
            <h2 id="library-title" className="display-face text-2xl sm:text-[2rem] font-bold tracking-[-.05em]" style={{ color: theme.textPrimary }}>Choose what to play</h2>
            <p className="text-sm mt-1.5" style={{ color: theme.textMuted }}>Each board has its own rhythm. Pick one and get started.</p>
          </div>
          <div className="filter-control inline-flex self-start sm:self-auto gap-1 p-1 rounded-full" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }} role="group" aria-label="Filter games">
            {([
              { id: 'all', label: `All ${GAMES.length}` },
              { id: 'morris', label: 'Morris' },
              { id: 'classic', label: 'Classics' },
            ] as const).map((item) => (
              <button key={item.id} onClick={() => setFilter(item.id)} aria-pressed={filter === item.id} className="min-h-11 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: filter === item.id ? theme.accent : 'transparent', color: filter === item.id ? theme.bgSurface : theme.textMuted, outlineColor: theme.validHighlight }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
          {visibleGames.map((game, index) => (
            <article key={game.id} className="game-card group relative overflow-hidden rounded-[24px] transition-all duration-200" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}`, animationDelay: `${index * 35}ms` }}>
              <div className="game-art relative p-2.5 pb-0">
                <GameArtwork gameId={game.id} theme={theme} className="block w-full h-[126px] sm:h-[132px] rounded-[15px]" />
                <span className="absolute left-5 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ backgroundColor: theme.bgApp, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
                  {game.category === 'morris' ? 'Morris family' : 'Classic'}
                </span>
                <span className="absolute right-5 top-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ backgroundColor: theme.bgApp, color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
                  <Clock3 className="w-3 h-3" />{game.duration}
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <h3 className="display-face text-[1.08rem] font-bold tracking-[-.035em]" style={{ color: theme.textPrimary }}>{game.name}</h3>
                <p className="mt-1.5 min-h-[36px] text-xs leading-relaxed" style={{ color: theme.textSecondary }}>{game.tagline}</p>
                <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-2">
                  <button onClick={() => onLaunchGame(game.id, 'ai')} className="min-h-11 inline-flex items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: theme.accent, color: theme.bgSurface, outlineColor: theme.validHighlight }}><Bot className="w-3.5 h-3.5" />Play vs AI</button>
                  <button onClick={() => onLaunchGame(game.id, 'local')} title={`Play ${game.name} pass and play`} className="min-h-11 min-w-11 inline-flex items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: theme.bgBoard, color: theme.textPrimary, border: `1px solid ${theme.border}`, outlineColor: theme.validHighlight }}><Users2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">2P</span></button>
                  <button onClick={() => onOpenMultiplayer('online', game.id)} title={`Invite a friend to ${game.name}`} aria-label={`Invite a friend to ${game.name}`} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2" style={{ backgroundColor: theme.bgBoard, color: theme.accent, border: `1px solid ${theme.border}`, outlineColor: theme.validHighlight }}><Globe2 className="w-4 h-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="local-play-callout mt-7 sm:mt-9 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[24px] px-4 sm:px-5 py-4" style={{ backgroundColor: theme.bgSurface, border: `1px solid ${theme.border}` }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ color: theme.accent, backgroundColor: theme.accentSoft }}><Wifi className="w-4 h-4" /></div>
          <div><h3 className="text-sm font-bold" style={{ color: theme.textPrimary }}>Across the table?</h3><p className="text-xs mt-1" style={{ color: theme.textMuted }}>Find a game on the same Wi-Fi or hotspot and join directly. Offline QR pairing is there when internet isn&apos;t.</p></div>
        </div>
        <button onClick={() => onOpenMultiplayer('hotspot')} className="inline-flex min-h-11 items-center justify-center gap-2 self-start sm:self-auto rounded-full px-5 py-2.5 text-xs font-semibold" style={{ backgroundColor: theme.bgBoard, color: theme.textPrimary, border: `1px solid ${theme.border}` }}><Wifi className="w-3.5 h-3.5" />Find nearby games</button>
      </section>
    </div>
  );
};
