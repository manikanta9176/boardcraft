export type Player = 1 | 2;
export type GameMode = 'ai' | 'local' | 'online';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ThemeId = 'paper' | 'stackdome';

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
  paper: {
    id: 'paper',
    label: 'Paper & Ink',
    bgApp: '#F4F1EA',
    bgSidebar: '#ECE8E0',
    bgSurface: '#FFFCF8',
    bgSurfaceHover: '#F0EDE7',
    bgGlass: 'rgba(250, 248, 244, 0.9)',
    bgBoard: '#EEEAE3',
    bgBoardAlt: '#DDD9D1',
    border: 'rgba(22, 21, 19, 0.1)',
    textPrimary: '#161513',
    textSecondary: '#5F5B55',
    textMuted: '#858078',
    boardLine: '#99958D',
    boardNode: '#D2CEC6',
    p1Color: '#181715',
    p1Stroke: '#090908',
    p1Glow: 'rgba(22, 21, 19, 0.16)',
    p1Name: 'Ink',
    p2Color: '#6267F0',
    p2Stroke: '#4D52D7',
    p2Glow: 'rgba(98, 103, 240, 0.22)',
    p2Name: 'Periwinkle',
    accent: '#161513',
    accentSoft: 'rgba(22, 21, 19, 0.075)',
    validHighlight: '#6267F0',
    captureHighlight: '#CC725E',
    isDark: false,
  },
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
};
