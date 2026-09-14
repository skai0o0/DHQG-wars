import { GridEngine } from './GridEngine';
import { GAME_BALANCE } from '../constants/balance';
import { GRID_CONFIG } from '../constants/grid';
import { SchoolEmblemBox } from '../types/school';

export interface EmblemUnlockEvent {
  schoolId: number;
  box: SchoolEmblemBox;
}

export class EmblemDetector {
  private engine: GridEngine;
  private prevRow: Uint16Array;
  private currRow: Uint16Array;

  constructor(engine: GridEngine) {
    this.engine = engine;
    this.prevRow = new Uint16Array(GRID_CONFIG.WIDTH);
    this.currRow = new Uint16Array(GRID_CONFIG.WIDTH);
  }

  /**
   * Scan each school for territory meeting the emblem requirement.
   */
  public checkEmblems(): EmblemUnlockEvent[] {
    const events: EmblemUnlockEvent[] = [];

    this.engine.schools.forEach(school => {
      const requiredSize = school.activeBuffs.includes('DIEU_HANH_EMBLEM')
        ? GAME_BALANCE.EMBLEM_DISCOUNTED_BOX_SIZE
        : GAME_BALANCE.EMBLEM_REQUIRED_BOX_SIZE;

      // Minimum threshold to consider unlocking
      if (school.totalOwnedTiles < 600) {
        if (school.hasEmblemUnlocked) {
          school.hasEmblemUnlocked = false;
          school.emblemBox = undefined;
        }
        return;
      }

      // If already unlocked, check if still holding enough ground
      if (school.hasEmblemUnlocked && school.emblemBox) {
        if (this.isBoxStillOwned(school.emblemBox, school.schoolId)) {
          return; // Still holds position
        }
      }

      // 1. First attempt: strict or semi-strict Maximal Square DP
      let box = this.findMaximalSquare(school.schoolId, requiredSize);

      // 2. Second attempt: organic territory bounding box & density
      if (!box && school.totalOwnedTiles >= 800) {
        box = this.findOrganicEmblemBox(school.schoolId, requiredSize);
      }

      if (box) {
        if (!school.hasEmblemUnlocked) {
          school.hasEmblemUnlocked = true;
          school.emblemBox = box;
          events.push({ schoolId: school.schoolId, box });
        } else {
          school.emblemBox = box;
        }
      } else {
        school.hasEmblemUnlocked = false;
        school.emblemBox = undefined;
      }
    });

    return events;
  }

  private isBoxStillOwned(box: SchoolEmblemBox, schoolId: number): boolean {
    const step = 6;
    let ownedCount = 0;
    let sampleCount = 0;

    for (let y = box.y; y < box.y + box.size; y += step) {
      for (let x = box.x; x < box.x + box.size; x += step) {
        sampleCount++;
        if (this.engine.getOwner(x, y) === schoolId) {
          ownedCount++;
        }
      }
    }

    // Still holds at least 50% of the sample points
    return sampleCount > 0 && (ownedCount / sampleCount) >= 0.5;
  }

  /**
   * O(W * H) single pass maximal square algorithm with 1D DP rows
   */
  private findMaximalSquare(schoolId: number, requiredSize: number): SchoolEmblemBox | null {
    this.prevRow.fill(0);
    this.currRow.fill(0);

    const W = GRID_CONFIG.WIDTH;
    const H = GRID_CONFIG.HEIGHT;
    const ownerMap = this.engine.ownerMap;

    for (let y = 0; y < H; y++) {
      const rowOffset = y * W;

      for (let x = 0; x < W; x++) {
        if (ownerMap[rowOffset + x] === schoolId) {
          if (x === 0 || y === 0) {
            this.currRow[x] = 1;
          } else {
            const minPrev = Math.min(
              this.currRow[x - 1],
              this.prevRow[x],
              this.prevRow[x - 1]
            );
            this.currRow[x] = minPrev + 1;
          }

          if (this.currRow[x] >= requiredSize) {
            const topLeftX = x - requiredSize + 1;
            const topLeftY = y - requiredSize + 1;
            return {
              x: topLeftX,
              y: topLeftY,
              size: requiredSize,
            };
          }
        } else {
          this.currRow[x] = 0;
        }
      }

      this.prevRow.set(this.currRow);
    }

    return null;
  }

  /**
   * Finds the center of mass of organic territory and positions a 50x50 emblem box
   */
  private findOrganicEmblemBox(schoolId: number, requiredSize: number): SchoolEmblemBox | null {
    const W = GRID_CONFIG.WIDTH;
    const H = GRID_CONFIG.HEIGHT;
    const ownerMap = this.engine.ownerMap;

    let sumX = 0;
    let sumY = 0;
    let sampleCount = 0;
    let minX: number = W;
    let maxX: number = 0;
    let minY: number = H;
    let maxY: number = 0;

    // Fast step sampling across grid
    const step = 4;
    for (let y = 0; y < H; y += step) {
      const rowOffset = y * W;
      for (let x = 0; x < W; x += step) {
        if (ownerMap[rowOffset + x] === schoolId) {
          sumX += x;
          sumY += y;
          sampleCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (sampleCount === 0) return null;

    // Check if territory width and height span at least 35 tiles
    const spanX = maxX - minX;
    const spanY = maxY - minY;

    if (spanX >= 35 && spanY >= 35) {
      const cx = Math.floor(sumX / sampleCount);
      const cy = Math.floor(sumY / sampleCount);
      const half = Math.floor(requiredSize / 2);
      const boxX = Math.max(0, Math.min(W - requiredSize, cx - half));
      const boxY = Math.max(0, Math.min(H - requiredSize, cy - half));

      return {
        x: boxX,
        y: boxY,
        size: requiredSize,
      };
    }

    return null;
  }
}
