export type Player = 1 | 2;
export type GameMode = 'ai' | 'local';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ThemeId = 'obsidian' | 'birch' | 'walnut';

export type GameId =
  | 'three-mens-morris'
  | 'six-mens-morris'
  | 'nine-mens-morris'
  | 'twelve-mens-morris'
  | 'connect4'
  | 'reversi'
  | 'checkers'
  | 'mancala'
  | 'gomoku'
  | 'dots-and-boxes';

export type GameCategory = 'morris' | 'classic';

export interface GameMeta {
  id: GameId;
  name: string;
  shortName: string;
  category: GameCategory;
  tagline: string;
  players: string;
  duration: string;
  rules: string[];
  tips: string[];
}

export interface ThemePalette {
  id: ThemeId;
  label: string;
  bgApp: string;
  bgSidebar: string;
  bgSurface: string;
  bgSurfaceHover: string;
  bgBoard: string;
  bgBoardAlt: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  boardLine: string;
  boardNode: string;
  p1Color: string;
  p1Stroke: string;
  p1Glow: string;
  p1Name: string;
  p2Color: string;
  p2Stroke: string;
  p2Glow: string;
  p2Name: string;
  accent: string;
  accentSoft: string;
  validHighlight: string;
  captureHighlight: string;
  isDark: boolean;
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  obsidian: {
    id: 'obsidian',
    label: 'Obsidian Studio',
    bgApp: '#090D16',
    bgSidebar: '#0E1422',
    bgSurface: '#131B2E',
    bgSurfaceHover: '#1A243C',
    bgBoard: '#101829',
    bgBoardAlt: '#1B2741',
    border: 'rgba(148, 163, 184, 0.14)',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    boardLine: '#475569',
    boardNode: '#1E293B',
    p1Color: '#F8FAFC',
    p1Stroke: '#CBD5E1',
    p1Glow: 'rgba(248, 250, 252, 0.35)',
    p1Name: 'Ivory',
    p2Color: '#F59E0B',
    p2Stroke: '#D97706',
    p2Glow: 'rgba(245, 158, 11, 0.4)',
    p2Name: 'Amber',
    accent: '#38BDF8',
    accentSoft: 'rgba(56, 189, 248, 0.14)',
    validHighlight: '#10B981',
    captureHighlight: '#EF4444',
    isDark: true,
  },
  birch: {
    id: 'birch',
    label: 'Nordic Birch',
    bgApp: '#F5F2EB',
    bgSidebar: '#ECE7DC',
    bgSurface: '#FFFFFF',
    bgSurfaceHover: '#F0ECE1',
    bgBoard: '#E8DFCE',
    bgBoardAlt: '#D7CBB5',
    border: 'rgba(41, 37, 36, 0.12)',
    textPrimary: '#1C1917',
    textSecondary: '#44403C',
    textMuted: '#78716C',
    boardLine: '#78716C',
    boardNode: '#D6CCB8',
    p1Color: '#1C1917',
    p1Stroke: '#0C0A09',
    p1Glow: 'rgba(28, 25, 23, 0.25)',
    p1Name: 'Charcoal',
    p2Color: '#D95D39',
    p2Stroke: '#B54424',
    p2Glow: 'rgba(217, 93, 57, 0.35)',
    p2Name: 'Terracotta',
    accent: '#0F766E',
    accentSoft: 'rgba(15, 118, 110, 0.12)',
    validHighlight: '#059669',
    captureHighlight: '#DC2626',
    isDark: false,
  },
  walnut: {
    id: 'walnut',
    label: 'Royal Walnut',
    bgApp: '#14100E',
    bgSidebar: '#1B1512',
    bgSurface: '#241C18',
    bgSurfaceHover: '#2E241F',
    bgBoard: '#291E18',
    bgBoardAlt: '#3D2D24',
    border: 'rgba(212, 168, 83, 0.16)',
    textPrimary: '#FAF5EE',
    textSecondary: '#D6CBC0',
    textMuted: '#8C7A6B',
    boardLine: '#8D6E56',
    boardNode: '#3A2A21',
    p1Color: '#FAF5EE',
    p1Stroke: '#D6CBC0',
    p1Glow: 'rgba(250, 245, 238, 0.3)',
    p1Name: 'Pearl',
    p2Color: '#D4A853',
    p2Stroke: '#B08532',
    p2Glow: 'rgba(212, 168, 83, 0.4)',
    p2Name: 'Brass',
    accent: '#D4A853',
    accentSoft: 'rgba(212, 168, 83, 0.16)',
    validHighlight: '#34D399',
    captureHighlight: '#F87171',
    isDark: true,
  },
};
