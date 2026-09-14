import { GAME_BALANCE } from './balance';

export const GRID_CONFIG = {
  WIDTH: GAME_BALANCE.GRID_WIDTH,
  HEIGHT: GAME_BALANCE.GRID_HEIGHT,
  TILE_SIZE: GAME_BALANCE.TILE_SIZE_PX,
  TOTAL_TILES: GAME_BALANCE.GRID_WIDTH * GAME_BALANCE.GRID_HEIGHT,
  
  MIN_ZOOM: 0.05,
  MAX_ZOOM: 5.0,
  DEFAULT_ZOOM: 0.8,
  
  WORLD_WIDTH: GAME_BALANCE.GRID_WIDTH * GAME_BALANCE.TILE_SIZE_PX,
  WORLD_HEIGHT: GAME_BALANCE.GRID_HEIGHT * GAME_BALANCE.TILE_SIZE_PX,
};

export const TACTICAL_COLORS = {
  BACKGROUND: '#0D1117',
  PANEL_BG: '#161B22',
  BORDER: '#30363D',
  BORDER_ACCENT: '#21262D',
  EVA_GREEN: '#00FFA3',
  EVA_TEXT: '#E6EDF3',
  EVA_MUTED: '#8B949E',
  ALERT_RED: '#FF4D4F',
  NEUTRAL_POI: '#FADB14',
  NEUTRAL_TILE: '#1B222D',
  NEUTRAL_TILE_GRID: '#252F3E',
} as const;

export const SCHOOL_COLORS: Record<number, { hex: string; int: number; rgb: [number, number, number] }> = {
  0: { hex: '#1B222D', int: 0x1B222D, rgb: [27, 34, 45] },    // Neutral land
  1: { hex: '#0033A0', int: 0x0033A0, rgb: [0, 51, 160] },    // BK
  2: { hex: '#0055A5', int: 0x0055A5, rgb: [0, 85, 165] },    // UIT
  3: { hex: '#8B0000', int: 0x8B0000, rgb: [139, 0, 0] },     // USSH
  4: { hex: '#007A3D', int: 0x007A3D, rgb: [0, 122, 61] },    // HCMUS
  5: { hex: '#00205B', int: 0x00205B, rgb: [0, 32, 91] },     // UEL
  6: { hex: '#008080', int: 0x008080, rgb: [0, 128, 128] },   // IU
  7: { hex: '#FF6600', int: 0xFF6600, rgb: [255, 102, 0] },   // HCMUTE
  8: { hex: '#2E7D32', int: 0x2E7D32, rgb: [46, 125, 50] },   // NLU
  9: { hex: '#C2185B', int: 0xC2185B, rgb: [194, 24, 91] },   // MEDVNU
  10: { hex: '#D32F2F', int: 0xD32F2F, rgb: [211, 47, 47] },  // USH
};

export function coordToIndex(x: number, y: number): number {
  return y * GRID_CONFIG.WIDTH + x;
}

export function indexToCoord(index: number): { x: number; y: number } {
  const y = Math.floor(index / GRID_CONFIG.WIDTH);
  const x = index % GRID_CONFIG.WIDTH;
  return { x, y };
}

export function isValidCoord(x: number, y: number): boolean {
  return x >= 0 && x < GRID_CONFIG.WIDTH && y >= 0 && y < GRID_CONFIG.HEIGHT;
}
