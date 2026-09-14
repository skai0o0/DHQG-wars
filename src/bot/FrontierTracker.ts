import { GridEngine } from '../engine/GridEngine';
import { GRID_CONFIG, coordToIndex, indexToCoord, isValidCoord } from '../constants/grid';

export class FrontierTracker {
  private engine: GridEngine;
  // Map of schoolId -> Set of tile indices that are on the border
  public frontiers: Map<number, Set<number>> = new Map();

  constructor(engine: GridEngine) {
    this.engine = engine;
    for (let id = 1; id <= 10; id++) {
      this.frontiers.set(id, new Set());
    }

    this.initFrontiers();
    // Subscribe to tile changes
    this.engine.subscribe((x, y) => {
      this.updateTileAndNeighbors(x, y);
    });
  }

  public initFrontiers() {
    for (let id = 1; id <= 10; id++) {
      this.frontiers.get(id)?.clear();
    }

    const W = GRID_CONFIG.WIDTH;
    const ownerMap = this.engine.ownerMap;

    // Fast check around spawn areas
    this.engine.schools.forEach(school => {
      const { x: sx, y: sy } = school.spawnPoint;
      const set = this.frontiers.get(school.schoolId);
      if (!set) return;

      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          const x = sx + dx;
          const y = sy + dy;
          if (isValidCoord(x, y)) {
            const idx = y * W + x;
            if (ownerMap[idx] === school.schoolId) {
              if (this.isTileBorder(x, y, school.schoolId)) {
                set.add(idx);
              }
            }
          }
        }
      }
    });
  }

  public isTileBorder(x: number, y: number, schoolId: number): boolean {
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < deltas.length; i++) {
      const nx = x + deltas[i][0];
      const ny = y + deltas[i][1];
      if (!isValidCoord(nx, ny)) return true; // edge of map is border
      if (this.engine.getOwner(nx, ny) !== schoolId) {
        return true;
      }
    }
    return false;
  }

  public updateTileAndNeighbors(x: number, y: number) {
    this.evaluateSingleTile(x, y);
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < deltas.length; i++) {
      const nx = x + deltas[i][0];
      const ny = y + deltas[i][1];
      if (isValidCoord(nx, ny)) {
        this.evaluateSingleTile(nx, ny);
      }
    }
  }

  private evaluateSingleTile(x: number, y: number) {
    const idx = coordToIndex(x, y);
    const owner = this.engine.getOwner(x, y);

    // Remove from all frontiers if not owned
    for (let sId = 1; sId <= 10; sId++) {
      if (sId !== owner) {
        this.frontiers.get(sId)?.delete(idx);
      }
    }

    if (owner > 0) {
      const schoolSet = this.frontiers.get(owner);
      if (schoolSet) {
        if (this.isTileBorder(x, y, owner)) {
          schoolSet.add(idx);
        } else {
          schoolSet.delete(idx);
        }
      }
    }
  }

  /**
   * Return a random border tile for a given school
   */
  public getRandomBorderTile(schoolId: number): { x: number; y: number } | null {
    const set = this.frontiers.get(schoolId);
    if (!set || set.size === 0) return null;

    // Pick a pseudo-random element quickly
    const items = Array.from(set);
    const randomIndex = Math.floor(Math.random() * items.length);
    return indexToCoord(items[randomIndex]);
  }

  /**
   * Return array of external candidate tiles adjacent to the school's frontier
   */
  public getCandidateExternalTiles(borderX: number, borderY: number, schoolId: number): Array<{ x: number; y: number; owner: number }> {
    const candidates: Array<{ x: number; y: number; owner: number }> = [];
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    for (let i = 0; i < deltas.length; i++) {
      const nx = borderX + deltas[i][0];
      const ny = borderY + deltas[i][1];
      if (isValidCoord(nx, ny)) {
        const o = this.engine.getOwner(nx, ny);
        if (o !== schoolId) {
          candidates.push({ x: nx, y: ny, owner: o });
        }
      }
    }

    return candidates;
  }

  /**
   * Return the border tile that is closest to a target coordinate
   */
  public getBestBorderTileToward(schoolId: number, targetX: number, targetY: number, sampleSize: number = 40): { x: number; y: number } | null {
    const set = this.frontiers.get(schoolId);
    if (!set || set.size === 0) return null;

    const items = Array.from(set);
    let bestCoord: { x: number; y: number } | null = null;
    let minDist = Infinity;

    // Check up to sampleSize tiles for high performance
    const count = Math.min(items.length, sampleSize);
    const step = Math.max(1, Math.floor(items.length / count));

    for (let i = 0; i < items.length && i / step < count; i += step) {
      const coord = indexToCoord(items[i]);
      const dist = Math.hypot(coord.x - targetX, coord.y - targetY);
      if (dist < minDist) {
        minDist = dist;
        bestCoord = coord;
      }
    }

    return bestCoord;
  }
}
