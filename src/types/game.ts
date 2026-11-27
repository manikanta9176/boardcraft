export type Player = 1 | 2;
export type GameMode = 'ai' | 'local' | 'online';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ThemeId = 'stackdome' | 'obsidian';

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
  badge?: string;
  rules: string[];
  tips: string[];
}

export interface SessionScore {
  p1: number;
  p2: number;
  draws: number;
}

export interface ThemePalette {
  id: ThemeId;
  label: string;
  bgApp: string;
  bgSidebar: string;
  bgSurface: string;
  bgSurfaceHover: string;
  bgGlass: string;
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
  stackdome: {
    id: 'stackdome',
    label: 'Carbon Ember',
    bgApp: '#131210',
    bgSidebar: '#10100F',
    bgSurface: '#1C1B19',
    bgSurfaceHover: '#282725',
    bgGlass: 'rgba(19, 18, 16, 0.92)',
    bgBoard: '#1C1B19',
    bgBoardAlt: '#292826',
    border: 'rgba(255, 253, 247, 0.1)',
    textPrimary: '#F1EEE8',
    textSecondary: '#A9A399',
    textMuted: '#827C72',
    boardLine: '#827C72',
    boardNode: '#292826',
    p1Color: '#F1EEE8',
    p1Stroke: '#FFFDF7',
    p1Glow: 'rgba(241, 238, 232, 0.16)',
    p1Name: 'Ivory',
    p2Color: '#C34200',
    p2Stroke: '#E66C2F',
    p2Glow: 'rgba(195, 66, 0, 0.3)',
    p2Name: 'Ember',
    accent: '#F1EEE8',
    accentSoft: 'rgba(255, 253, 247, 0.08)',
    validHighlight: '#C34200',
    captureHighlight: '#E66C2F',
    isDark: true,
  },
  obsidian: {
    id: 'obsidian',
    label: 'Midnight Felt',
    bgApp: '#08130F',
    bgSidebar: '#0B1A15',
    bgSurface: '#12231D',
    bgSurfaceHover: '#1A3027',
    bgGlass: 'rgba(18, 35, 29, 0.88)',
    bgBoard: '#0D211A',
    bgBoardAlt: '#1B352B',
    border: 'rgba(195, 222, 199, 0.13)',
    textPrimary: '#F1F5EC',
    textSecondary: '#B7C6B8',
    textMuted: '#758A7C',
    boardLine: '#668272',
    boardNode: '#203B30',
    p1Color: '#F2E9D2',
    p1Stroke: '#FFF5DD',
    p1Glow: 'rgba(242, 233, 210, 0.28)',
    p1Name: 'Ivory',
    p2Color: '#F47C63',
    p2Stroke: '#C95645',
    p2Glow: 'rgba(244, 124, 99, 0.33)',
    p2Name: 'Coral',
    accent: '#D4EE79',
    accentSoft: 'rgba(212, 238, 121, 0.13)',
    validHighlight: '#A8D98A',
    captureHighlight: '#F47C63',
    isDark: true,
  },
};
