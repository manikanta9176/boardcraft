export type Player = 1 | 2;
export type GameMode = 'ai' | 'local' | 'online';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ThemeId = 'sea-glass' | 'obsidian' | 'birch' | 'walnut';

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
  'sea-glass': {
    id: 'sea-glass',
    label: 'Sea Glass',
    bgApp: '#EEF5F3',
    bgSidebar: '#E4EFEC',
    bgSurface: '#FBFDFC',
    bgSurfaceHover: '#E7F1EE',
    bgGlass: 'rgba(248, 252, 250, 0.88)',
    bgBoard: '#D8E8E3',
    bgBoardAlt: '#C1D8D1',
    border: 'rgba(34, 72, 68, 0.14)',
    textPrimary: '#173B3A',
    textSecondary: '#3D625E',
    textMuted: '#6F8D87',
    boardLine: '#769B92',
    boardNode: '#BCD2CB',
    p1Color: '#FFF3D8',
    p1Stroke: '#B69D6F',
    p1Glow: 'rgba(182, 157, 111, 0.3)',
    p1Name: 'Sand',
    p2Color: '#D98773',
    p2Stroke: '#B96353',
    p2Glow: 'rgba(217, 135, 115, 0.3)',
    p2Name: 'Coral',
    accent: '#247C72',
    accentSoft: 'rgba(36, 124, 114, 0.12)',
    validHighlight: '#238A74',
    captureHighlight: '#C26055',
    isDark: false,
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
  birch: {
    id: 'birch',
    label: 'Nordic Birch',
    bgApp: '#F5F2EB',
    bgSidebar: '#ECE6DA',
    bgSurface: '#FFFFFF',
    bgSurfaceHover: '#F2EDE2',
    bgGlass: 'rgba(255, 255, 255, 0.84)',
    bgBoard: '#E7DEC9',
    bgBoardAlt: '#D7CBB3',
    border: 'rgba(41, 37, 36, 0.12)',
    textPrimary: '#1C1917',
    textSecondary: '#44403C',
    textMuted: '#78716C',
    boardLine: '#78716C',
    boardNode: '#D6CCB8',
    p1Color: '#1C1917',
    p1Stroke: '#0C0A09',
    p1Glow: 'rgba(28, 25, 23, 0.22)',
    p1Name: 'Charcoal',
    p2Color: '#D95D39',
    p2Stroke: '#B54424',
    p2Glow: 'rgba(217, 93, 57, 0.3)',
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
    bgApp: '#130F0D',
    bgSidebar: '#1A1411',
    bgSurface: '#241C18',
    bgSurfaceHover: '#2E231E',
    bgGlass: 'rgba(36, 28, 24, 0.82)',
    bgBoard: '#291E18',
    bgBoardAlt: '#3D2D24',
    border: 'rgba(212, 168, 83, 0.17)',
    textPrimary: '#FAF5EE',
    textSecondary: '#D6CBC0',
    textMuted: '#8C7A6B',
    boardLine: '#8D6E56',
    boardNode: '#3A2A21',
    p1Color: '#FAF5EE',
    p1Stroke: '#D6CBC0',
    p1Glow: 'rgba(250, 245, 238, 0.28)',
    p1Name: 'Pearl',
    p2Color: '#D4A853',
    p2Stroke: '#B08532',
    p2Glow: 'rgba(212, 168, 83, 0.35)',
    p2Name: 'Brass',
    accent: '#D4A853',
    accentSoft: 'rgba(212, 168, 83, 0.16)',
    validHighlight: '#34D399',
    captureHighlight: '#F87171',
    isDark: true,
  },
};
