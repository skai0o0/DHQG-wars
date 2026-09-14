export type StrategicRole = 'landmark_hunter' | 'territory_expander';

export interface SchoolPersonality {
  aggression: number;        // 0.0 - 1.0 (Xác suất tấn công đất đối thủ)
  expansionFocus: number;    // 0.0 - 1.0 (Ưu tiên mở rộng đất hoang)
  landmarkPriority: number;  // 0.0 - 1.0 (Ưu tiên chiếm giữ công trình Landmark)
  strategicRole: StrategicRole; // 'landmark_hunter' | 'territory_expander'
}

export interface SchoolSpawnPoint {
  x: number;
  y: number;
}

export interface SchoolEmblemBox {
  x: number;
  y: number;
  size: number;
}

export interface School {
  schoolId: number;
  name: string;
  shortCode: string;
  color: string;
  logoUrl: string;
  availableTroops: number;
  totalOwnedTiles: number;
  spawnPoint: SchoolSpawnPoint;
  hasEmblemUnlocked: boolean;
  emblemBox?: SchoolEmblemBox;
  personality: SchoolPersonality;
  activeBuffs: string[];
}
