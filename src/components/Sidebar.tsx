import React, { useEffect, useRef } from 'react';
import { X, Grid3X3, Radio } from 'lucide-react';
import { GAMES } from '../games/registry';
import { GameId, ThemePalette } from '../types/game';
import { GameIcon } from './GameIcon';

interface SidebarProps {
  activeGame: GameId;
  onSelectGame: (id: GameId) => void;
  onOpenLobby: () => void;
  onOpenMultiplayer: () => void;
  isLobby: boolean;
  gameSelectionDisabled?: boolean;
  theme: ThemePalette;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeGame,
  onSelectGame,
  onOpenLobby,
  onOpenMultiplayer,
  isLobby,
  gameSelectionDisabled = false,
  theme,
  mobileOpen,
  onCloseMobile,
}) => {
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const morrisGames = GAMES.filter((g) => g.category === 'morris');
  const classicGames = GAMES.filter((g) => g.category === 'classic');
  const arcadeGames = GAMES.filter((g) => g.category === 'arcade');

  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mobilePanelRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseMobile();
      }
      if (event.key !== 'Tab' || !mobilePanelRef.current) return;
      const items = Array.from(mobilePanelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [mobileOpen, onCloseMobile]);

  const renderGroup = (title: string, items: typeof GAMES) => (
    <div className="mb-5">
      <div
        className="px-3 mb-2 text-[11px] font-semibold"
        style={{ color: theme.textMuted }}
      >
        {title}
      </div>
      <div className="space-y-1">
        {items.map((game) => {
          const isActive = game.id === activeGame;
          return (
            <button
              key={game.id}
              disabled={gameSelectionDisabled}
              onClick={() => {
                onSelectGame(game.id);
                onCloseMobile();
              }}
              className="nav-game min-h-11 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isActive ? theme.bgSurface : 'transparent',
                color: isActive ? theme.accent : theme.textSecondary,
                border: `1px solid ${isActive ? theme.border : 'transparent'}`,
                boxShadow: isActive ? `inset 2px 0 0 ${theme.accent}` : 'none',
              }}
            >
              <GameIcon id={game.id} className="w-[18px] h-[18px] shrink-0" />
              <div className="min-w-0 flex-1">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: isActive ? theme.textPrimary : theme.textSecondary }}
                >
                  {game.shortName}
                </div>
              </div>
              {isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: theme.accent }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const content = (
    <div
      className="h-full flex flex-col"
      style={{
        backgroundColor: theme.bgSidebar,
        borderRight: `1px solid ${theme.border}`,
      }}
    >
      <div
        className="shrink-0 px-4 py-5 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
          >
            <Grid3X3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight" style={{ color: theme.textPrimary }}>
              PlayDeck
            </div>
            <div className="text-[11px]" style={{ color: theme.textMuted }}>
              {GAMES.length} games & puzzles
            </div>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
            className="lg:hidden grid min-h-11 min-w-11 place-items-center rounded-lg cursor-pointer"
          style={{ color: theme.textSecondary }}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-4">
        <div className="space-y-1 mb-5">
          <button
            onClick={() => { onOpenLobby(); onCloseMobile(); }}
            aria-current={isLobby ? 'page' : undefined}
            className="min-h-11 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer"
            style={{ backgroundColor: isLobby ? theme.accentSoft : 'transparent', color: isLobby ? theme.accent : theme.textSecondary, border: `1px solid ${isLobby ? theme.accent + '40' : 'transparent'}` }}
          >
            <Grid3X3 className="w-[18px] h-[18px] shrink-0" />
            <span className="text-sm font-semibold">Game library</span>
          </button>
          <button
            onClick={() => { onOpenMultiplayer(); onCloseMobile(); }}
            className="min-h-11 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer"
            style={{ color: theme.textSecondary, border: `1px solid transparent` }}
          >
            <Radio className="w-[18px] h-[18px] shrink-0" style={{ color: theme.validHighlight }} />
            <span className="text-sm font-semibold">Play online</span>
          </button>
        </div>
        {renderGroup('Morris games', morrisGames)}
        {renderGroup('Other classics', classicGames)}
        {renderGroup('Arcade & puzzles', arcadeGames)}
      </div>

      <div
        className="shrink-0 px-4 py-4 flex items-center gap-3"
        style={{ borderTop: `1px solid ${theme.border}` }}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.validHighlight, boxShadow: `0 0 10px ${theme.validHighlight}88` }} />
        <div>
          <div className="text-xs font-semibold" style={{ color: theme.textPrimary }}>Ready to play</div>
          <div className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>13 ways to play</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-full">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-label="Close game navigation"
          />
          <div
            ref={mobilePanelRef}
            className="mobile-nav-panel relative z-10 h-full w-72 max-w-[82vw] overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Game navigation"
            tabIndex={-1}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};
