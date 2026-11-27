import React from 'react';
import { X, Grid3X3 } from 'lucide-react';
import { GAMES } from '../games/registry';
import { GameId, ThemePalette } from '../types/game';
import { GameIcon } from './GameIcon';

interface SidebarProps {
  activeGame: GameId;
  onSelectGame: (id: GameId) => void;
  theme: ThemePalette;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeGame,
  onSelectGame,
  theme,
  mobileOpen,
  onCloseMobile,
}) => {
  const morrisGames = GAMES.filter((g) => g.category === 'morris');
  const classicGames = GAMES.filter((g) => g.category === 'classic');

  const renderGroup = (title: string, items: typeof GAMES) => (
    <div className="mb-5">
      <div
        className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider"
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
              onClick={() => {
                onSelectGame(game.id);
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer"
              style={{
                backgroundColor: isActive ? theme.accentSoft : 'transparent',
                color: isActive ? theme.accent : theme.textSecondary,
                border: `1px solid ${isActive ? theme.accent + '40' : 'transparent'}`,
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
        className="px-4 py-4 flex items-center justify-between"
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
              BoardCraft
            </div>
            <div className="text-[11px]" style={{ color: theme.textMuted }}>
              {GAMES.length} Classic Strategy Games
            </div>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg cursor-pointer"
          style={{ color: theme.textSecondary }}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-4">
        {renderGroup('Morris Family', morrisGames)}
        {renderGroup('Classic Strategy', classicGames)}
      </div>

      <div
        className="px-4 py-3 text-[11px] flex items-center justify-between"
        style={{ borderTop: `1px solid ${theme.border}`, color: theme.textMuted }}
      >
        <span>100% Client-Side AI</span>
        <span className="font-mono">v1.0</span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-full">{content}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[82vw] h-full z-10">{content}</div>
        </div>
      )}
    </>
  );
};
