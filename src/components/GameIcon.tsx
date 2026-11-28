import React from 'react';
import { GameId } from '../types/game';

interface GameIconProps {
  id: GameId;
  className?: string;
}

export const GameIcon: React.FC<GameIconProps> = ({ id, className = 'w-5 h-5' }) => {
  switch (id) {
    case 'three-mens-morris':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
          <rect x="4" y="4" width="16" height="16" rx="1" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="4" x2="20" y2="20" />
          <line x1="20" y1="4" x2="4" y2="20" />
          <circle cx="4" cy="4" r="1.8" fill="currentColor" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="20" cy="20" r="1.8" fill="currentColor" />
        </svg>
      );
    case 'six-mens-morris':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <rect x="7.5" y="7.5" width="9" height="9" rx="0.5" />
          <line x1="12" y1="3" x2="12" y2="7.5" />
          <line x1="12" y1="16.5" x2="12" y2="21" />
          <line x1="3" y1="12" x2="7.5" y2="12" />
          <line x1="16.5" y1="12" x2="21" y2="12" />
        </svg>
      );
    case 'nine-mens-morris':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="1" />
          <rect x="6.5" y="6.5" width="11" height="11" rx="0.5" />
          <rect x="10" y="10" width="4" height="4" />
          <line x1="12" y1="2.5" x2="12" y2="10" />
          <line x1="12" y1="14" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="10" y2="12" />
          <line x1="14" y1="12" x2="21.5" y2="12" />
        </svg>
      );
    case 'twelve-mens-morris':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="1" />
          <rect x="6.5" y="6.5" width="11" height="11" rx="0.5" />
          <rect x="10" y="10" width="4" height="4" />
          <line x1="12" y1="2.5" x2="12" y2="10" />
          <line x1="12" y1="14" x2="12" y2="21.5" />
          <line x1="2.5" y1="12" x2="10" y2="12" />
          <line x1="14" y1="12" x2="21.5" y2="12" />
          <line x1="2.5" y1="2.5" x2="10" y2="10" />
          <line x1="21.5" y1="2.5" x2="14" y2="10" />
          <line x1="2.5" y1="21.5" x2="10" y2="14" />
          <line x1="21.5" y1="21.5" x2="14" y2="14" />
        </svg>
      );
    case 'connect4':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <circle cx="8" cy="16" r="1.7" fill="currentColor" />
          <circle cx="12" cy="12" r="1.7" fill="currentColor" />
          <circle cx="16" cy="8" r="1.7" fill="currentColor" />
          <circle cx="12" cy="16" r="1.7" />
          <circle cx="16" cy="16" r="1.7" />
        </svg>
      );
    case 'reversi':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="3" x2="12" y2="21" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <circle cx="7.5" cy="7.5" r="2.2" fill="currentColor" />
          <circle cx="16.5" cy="16.5" r="2.2" fill="currentColor" />
          <circle cx="16.5" cy="7.5" r="2.2" />
          <circle cx="7.5" cy="16.5" r="2.2" />
        </svg>
      );
    case 'checkers':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="15" r="3" fill="currentColor" opacity="0.85" />
          <circle cx="15" cy="9" r="3" />
          <path d="M13.6 9.3l.7-1.3.7.8.7-.8.7 1.3" strokeWidth="1.2" />
        </svg>
      );
    case 'mancala':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <rect x="2" y="6" width="20" height="12" rx="4" />
          <rect x="4" y="8" width="2.5" height="8" rx="1.2" />
          <rect x="17.5" y="8" width="2.5" height="8" rx="1.2" />
          <circle cx="9" cy="9.5" r="1" fill="currentColor" />
          <circle cx="12" cy="9.5" r="1" fill="currentColor" />
          <circle cx="15" cy="9.5" r="1" fill="currentColor" />
          <circle cx="9" cy="14.5" r="1" fill="currentColor" />
          <circle cx="12" cy="14.5" r="1" fill="currentColor" />
          <circle cx="15" cy="14.5" r="1" fill="currentColor" />
        </svg>
      );
    case 'gomoku':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <line x1="4" y1="8" x2="20" y2="8" opacity="0.5" />
          <line x1="4" y1="12" x2="20" y2="12" opacity="0.5" />
          <line x1="4" y1="16" x2="20" y2="16" opacity="0.5" />
          <line x1="8" y1="4" x2="8" y2="20" opacity="0.5" />
          <line x1="12" y1="4" x2="12" y2="20" opacity="0.5" />
          <line x1="16" y1="4" x2="16" y2="20" opacity="0.5" />
          <circle cx="8" cy="8" r="1.8" fill="currentColor" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="16" cy="16" r="1.8" fill="currentColor" />
          <circle cx="16" cy="8" r="1.8" fill="none" strokeWidth="1.6" />
        </svg>
      );
    case 'dots-and-boxes':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <rect x="6" y="6" width="6" height="6" fill="currentColor" fillOpacity="0.2" stroke="none" />
          <line x1="6" y1="6" x2="18" y2="6" />
          <line x1="6" y1="12" x2="12" y2="12" />
          <line x1="6" y1="6" x2="6" y2="18" />
          <line x1="12" y1="6" x2="12" y2="18" />
          <circle cx="6" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="18" cy="6" r="1.5" fill="currentColor" />
          <circle cx="6" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="18" cy="12" r="1.5" fill="currentColor" />
          <circle cx="6" cy="18" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
          <circle cx="18" cy="18" r="1.5" fill="currentColor" />
        </svg>
      );
    case '2048':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" fillOpacity=".12" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" fillOpacity=".25" />
        </svg>
      );
    case 'minesweeper':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
          <path d="M12 3v18M5.6 5.6l12.8 12.8M3 12h18M5.6 18.4 18.4 5.6" />
          <circle cx="12" cy="12" r="5.2" fill="currentColor" fillOpacity=".14" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'word-guess':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
          <rect x="3" y="4" width="5" height="5" rx="1" fill="currentColor" fillOpacity=".18" />
          <rect x="9.5" y="4" width="5" height="5" rx="1" />
          <rect x="16" y="4" width="5" height="5" rx="1" />
          <rect x="3" y="10.5" width="5" height="5" rx="1" />
          <rect x="9.5" y="10.5" width="5" height="5" rx="1" fill="currentColor" fillOpacity=".2" />
          <rect x="16" y="10.5" width="5" height="5" rx="1" />
          <path d="M4 20h16" />
        </svg>
      );
    case 'chess':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}><path d="M7 21h11M8 18h8l-1.4-6.3a4 4 0 0 0-2.5-3l1.7-3.2-2.2-2.2-2 3.2-2-1.1-.7 2.8 2.3 1.1L8 18Z" /><circle cx="15.5" cy="5" r="1" fill="currentColor" /></svg>;
    case 'ludo':
    case 'ashta-chamma':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 3v6h8V3M3 8h6v8H3m18-1h-6V9h6M9 21v-6h6v6"/><circle cx="12" cy="12" r="2.1" fill="currentColor" /></svg>;
    case 'carrom':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}><rect x="2.5" y="2.5" width="19" height="19" rx="4"/><circle cx="5.2" cy="5.2" r="1.8" fill="currentColor"/><circle cx="18.8" cy="5.2" r="1.8" fill="currentColor"/><circle cx="5.2" cy="18.8" r="1.8" fill="currentColor"/><circle cx="18.8" cy="18.8" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="2.8"/><circle cx="10" cy="12" r="1.4" fill="currentColor"/></svg>;
    case 'tambola':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M9 5v14m6-14v14M3 10h18m-18 4h18"/><circle cx="6" cy="7.5" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="18" cy="16.5" r=".9" fill="currentColor"/></svg>;
    case 'dice-duel':
    case 'yahtzee':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="16.5" cy="7.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="7.5" cy="16.5" r="1.2" fill="currentColor"/><circle cx="16.5" cy="16.5" r="1.2" fill="currentColor"/></svg>;
    case 'snake':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 5h8a3 3 0 0 1 3 3v8a3 3 0 0 0 3 3h2M4 19h3a3 3 0 0 0 3-3v-2"/><circle cx="19" cy="19" r="1.5" fill="currentColor"/></svg>;
    case 'pocket-racer':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m5 15 2-6a2 2 0 0 1 2-1h6a2 2 0 0 1 2 1l2 6v4h-2v-2H7v2H5v-4Z"/><path d="M8 13h8M3 5l3 2m15-2-3 2"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="15" r="1" fill="currentColor"/></svg>;
  }
};
