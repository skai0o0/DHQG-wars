import { GridEngine } from './GridEngine';
import { Landmark } from '../types/game';
import { GRID_CONFIG, coordToIndex, isValidCoord } from '../constants/grid';

export interface LandmarkCaptureEvent {
  landmark: Landmark;
  newOwner: number;
  formerOwner: number;
}

export class LandmarkManager {
  private engine: GridEngine;

  constructor(engine: GridEngine) {
    this.engine = engine;
  }

  /**
   * Check all landmarks for ownership and contiguous connection back to school's spawn.
   */
  public checkLandmarks(): LandmarkCaptureEvent[] {
    const events: LandmarkCaptureEvent[] = [];

    this.engine.landmarks.forEach(lm => {
      const formerOwner = lm.currentOwner;
      const dominantOwner = this.evaluateLandmarkTiles(lm);

      if (dominantOwner > 0) {
        // Check if there is a connected path from landmark to spawn point
        const isConnected = this.isPathConnectedToSpawn(lm, dominantOwner);

        if (isConnected) {
          if (lm.currentOwner !== dominantOwner) {
            lm.currentOwner = dominantOwner;
            lm.isContiguousToSpawn = true;
            this.updateSchoolBuffs(dominantOwner, lm.buffKey, true);
            if (formerOwner > 0 && formerOwner !== dominantOwner) {
              this.updateSchoolBuffs(formerOwner, lm.buffKey, false);
            }
            events.push({ landmark: lm, newOwner: dominantOwner, formerOwner });
          }
        } else {
          // Dominant owner holds tiles but no connection back to spawn
          if (lm.currentOwner !== 0) {
            this.updateSchoolBuffs(lm.currentOwner, lm.buffKey, false);
            lm.currentOwner = 0;
            lm.isContiguousToSpawn = false;
          }
        }
      } else {
        // Neutral or contested
        if (lm.currentOwner > 0) {
          this.updateSchoolBuffs(lm.currentOwner, lm.buffKey, false);
          lm.currentOwner = 0;
          lm.isContiguousToSpawn = false;
        }
      }
    });

    return events;
  }

  /**
   * Evaluates if at least 90% of the landmark tiles are held by a single school
   */
  private evaluateLandmarkTiles(lm: Landmark): number {
    const ownerCounts: Record<number, number> = {};
    let totalTiles = 0;

    for (let y = lm.y; y < lm.y + lm.height; y++) {
      for (let x = lm.x; x < lm.x + lm.width; x++) {
        totalTiles++;
        const o = this.engine.getOwner(x, y);
        if (o > 0) {
          ownerCounts[o] = (ownerCounts[o] || 0) + 1;
        }
      }
    }

    // Require >= 90% ownership of landmark area
    for (const [sId, count] of Object.entries(ownerCounts)) {
      if (count / totalTiles >= 0.9) {
        return Number(sId);
      }
    }

    return 0;
  }

  /**
   * Fast BFS along ownerMap to verify path between landmark border and school's spawn point
   */
  private isPathConnectedToSpawn(lm: Landmark, schoolId: number): boolean {
    const school = this.engine.schools.get(schoolId);
    if (!school) return false;

    const targetX = school.spawnPoint.x;
    const targetY = school.spawnPoint.y;

    const visited = new Uint8Array(GRID_CONFIG.TOTAL_TILES);
    const queue: number[] = [];

    // Push initial landmark owned tiles
    for (let y = lm.y; y < lm.y + lm.height; y += 2) {
      for (let x = lm.x; x < lm.x + lm.width; x += 2) {
        if (this.engine.getOwner(x, y) === schoolId) {
          const idx = coordToIndex(x, y);
          visited[idx] = 1;
          queue.push(idx);
        }
      }
    }

    let head = 0;
    const maxSteps = 10000; // Cap BFS steps to guarantee 60 FPS
    let steps = 0;

    while (head < queue.length && steps < maxSteps) {
      const curr = queue[head++];
      steps++;

      const cx = curr % GRID_CONFIG.WIDTH;
      const cy = Math.floor(curr / GRID_CONFIG.WIDTH);

      // Check if reached spawn neighborhood (within 4 tiles)
      if (Math.abs(cx - targetX) <= 4 && Math.abs(cy - targetY) <= 4) {
        return true;
      }

      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];

      for (let i = 0; i < neighbors.length; i++) {
        const nx = neighbors[i][0];
        const ny = neighbors[i][1];
        if (isValidCoord(nx, ny)) {
          const nIdx = coordToIndex(nx, ny);
          if (!visited[nIdx] && this.engine.ownerMap[nIdx] === schoolId) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }

    return false;
  }

  private updateSchoolBuffs(schoolId: number, buffKey: string, add: boolean) {
    const school = this.engine.schools.get(schoolId);
    if (!school) return;

    if (add) {
      if (!school.activeBuffs.includes(buffKey)) {
        school.activeBuffs.push(buffKey);
      }
    } else {
      school.activeBuffs = school.activeBuffs.filter(b => b !== buffKey);
    }
  }
}
