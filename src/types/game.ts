export type BuffKey =
  | 'NVH_DISCOUNT'
  | 'GDQP_DEFENSE'
  | 'LIBRARY_RADAR'
  | 'NIGHT_MARKET_BONUS'
  | 'HO_DA_SHIELD'
  | 'DOC_TINH_SPEED'
  | 'KTX_REINFORCEMENT'
  | 'NGA_BA_621_CHOKE'
  | 'CO_LAU_TERRAIN'
  | 'DIEU_HANH_EMBLEM';

export interface Landmark {
  landmarkId: number;
  name: string;
  shortName: string;
  lore: string;
  buffDescription: string;
  buffKey: BuffKey;
  x: number;
  y: number;
  width: number;
  height: number;
  currentOwner: number; // 0 = neutral, 1..10 = schoolId
  isContiguousToSpawn: boolean; // Buff chỉ kích hoạt khi có đường đất liền mạch về spawn
  iconName: string;
}

export type TickerEventType = 'capture' | 'emblem' | 'combat' | 'reinforcement' | 'info';

export interface TickerMessage {
  id: string;
  text: string;
  type: TickerEventType;
  timestamp: number;
  timeString: string;
  schoolId?: number;
}

export type ActionMode = 'expand' | 'fortify' | 'attack' | 'inspect';

export interface ViewportBounds {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: number;
  life: number;
}

export interface ExpansionRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: number;
  life: number;
}

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  alpha: number;
  life: number;
}

export interface OrbitalBeam {
  x: number;
  y: number;
  width: number;
  maxWidth: number;
  color: number;
  life: number;
}

