import { GridEngine, CombatResult } from '../engine/GridEngine';
import { FrontierTracker } from './FrontierTracker';
import { GAME_BALANCE } from '../constants/balance';
import { Landmark } from '../types/game';

export interface BotActionEvent {
  type: 'expand' | 'attack' | 'fortify';
  schoolId: number;
  x: number;
  y: number;
  combatResult?: CombatResult;
}

export type BotActionCallback = (event: BotActionEvent) => void;

export class BotController {
  private engine: GridEngine;
  private tracker: FrontierTracker;
  private isAutoPlay: boolean = false; // Master simulation switch (false = fully paused)
  private speedMultiplier: number = 1;
  private userSchoolId: number = 1; // School controlled by human user
  
  private timerId: number | null = null;
  private incomeTimerId: number | null = null;
  private onActionEvent: BotActionCallback | null = null;

  constructor(engine: GridEngine, tracker: FrontierTracker) {
    this.engine = engine;
    this.tracker = tracker;
    // Starts paused! Only runs when user enables Auto-Play
    this.startPassiveIncome();
  }

  public setOnActionEvent(cb: BotActionCallback) {
    this.onActionEvent = cb;
  }

  public setUserSchoolId(id: number) {
    this.userSchoolId = id;
  }

  public getUserSchoolId(): number {
    return this.userSchoolId;
  }

  public setAutoPlay(enabled: boolean) {
    this.isAutoPlay = enabled;
    if (this.isAutoPlay) {
      if (!this.timerId) {
        this.startLoop();
      }
    } else {
      this.stopLoop();
    }
  }

  public getAutoPlay(): boolean {
    return this.isAutoPlay;
  }

  public setSpeed(multiplier: number) {
    this.speedMultiplier = multiplier;
    if (this.isAutoPlay) {
      this.stopLoop();
      this.startLoop();
    }
  }

  public getSpeed(): number {
    return this.speedMultiplier;
  }

  private startLoop() {
    this.stopLoop();
    const interval = Math.max(40, Math.floor(GAME_BALANCE.BOT_TICK_INTERVAL_MS / this.speedMultiplier));
    this.timerId = window.setInterval(() => {
      this.tick();
    }, interval);
  }

  private stopLoop() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Continuous passive reinforcement income while game is active
   */
  private startPassiveIncome() {
    this.incomeTimerId = window.setInterval(() => {
      // Do not generate income if simulation is paused
      if (!this.isAutoPlay) return;

      // Find school owning KTX (landmarkId 7)
      const ktx = this.engine.landmarks.find(l => l.landmarkId === 7);
      const ktxOwner = (ktx && ktx.currentOwner > 0 && ktx.isContiguousToSpawn) ? ktx.currentOwner : 0;

      this.engine.schools.forEach(s => {
        // Base income + territory revenue
        const territoryIncome = Math.floor(s.totalOwnedTiles / 20);
        let bonus = 4 + territoryIncome;

        if (s.schoolId === ktxOwner) {
          bonus += 10;
        }

        s.availableTroops += bonus;
      });
    }, 1000);
  }

  public destroy() {
    this.stopLoop();
    if (this.incomeTimerId !== null) {
      window.clearInterval(this.incomeTimerId);
      this.incomeTimerId = null;
    }
  }

  /**
   * Execute 1 AI turn for active bot factions
   */
  public tick() {
    if (!this.isAutoPlay) return;

    this.engine.schools.forEach(school => {
      // Minimum troops threshold
      if (school.availableTroops <= 2) {
        school.availableTroops += 2;
        return;
      }

      this.executeFactionTurn(school.schoolId);
    });
  }

  private executeFactionTurn(schoolId: number) {
    const school = this.engine.schools.get(schoolId);
    if (!school) return;

    const { aggression, strategicRole } = school.personality;
    const isHunter = strategicRole === 'landmark_hunter';

    // Actions per tick scaled with speed multiplier
    const actionCount = Math.max(1, Math.floor(this.speedMultiplier));

    // Identify strategic landmark target for hunters or opportunists
    const landmarkTarget = this.findBestTargetLandmark(schoolId);

    for (let i = 0; i < actionCount; i++) {
      if (school.availableTroops <= 2) break;

      let borderPos: { x: number; y: number } | null = null;
      let isSpearheadTowardsLandmark = false;

      // Role Decision:
      // Landmark Hunters dedicate 85% of effort to hunting landmarks!
      // Territory Expanders dedicate 85% of effort to expanding outward for the 50x50 emblem!
      const landmarkChance = isHunter ? 0.85 : 0.15;

      if (landmarkTarget && Math.random() < landmarkChance) {
        const lcx = landmarkTarget.x + landmarkTarget.width / 2;
        const lcy = landmarkTarget.y + landmarkTarget.height / 2;
        borderPos = this.tracker.getBestBorderTileToward(schoolId, lcx, lcy, 60);
        isSpearheadTowardsLandmark = true;
      }

      // If not spearheading towards landmark, pick a broad perimeter frontier tile
      if (!borderPos) {
        borderPos = this.tracker.getRandomBorderTile(schoolId);
        isSpearheadTowardsLandmark = false;
      }

      if (!borderPos) break;

      const candidates = this.tracker.getCandidateExternalTiles(borderPos.x, borderPos.y, schoolId);
      if (candidates.length === 0) continue;

      // If spearheading toward landmark, bias candidates toward the landmark center
      if (isSpearheadTowardsLandmark && landmarkTarget) {
        const lcx = landmarkTarget.x + landmarkTarget.width / 2;
        const lcy = landmarkTarget.y + landmarkTarget.height / 2;

        candidates.sort((a, b) => {
          // Extreme priority for tiles inside the landmark boundary
          const aIn = this.engine.getLandmarkId(a.x, a.y) === landmarkTarget.landmarkId ? -2000 : 0;
          const bIn = this.engine.getLandmarkId(b.x, b.y) === landmarkTarget.landmarkId ? -2000 : 0;

          const distA = Math.hypot(a.x - lcx, a.y - lcy) + aIn;
          const distB = Math.hypot(b.x - lcx, b.y - lcy) + bIn;
          return distA - distB;
        });
      }

      const neutralCandidates = candidates.filter(c => c.owner === 0);
      const enemyCandidates = candidates.filter(c => c.owner > 0 && c.owner !== schoolId);

      const roll = Math.random();

      // If spearheading and enemy is blocking the path, or if aggressive roll passes
      if (enemyCandidates.length > 0 && (roll < aggression || isSpearheadTowardsLandmark)) {
        // Attack enemy tile
        const target = enemyCandidates[0];
        const result = this.engine.attackTile(target.x, target.y, schoolId);
        if (result && this.onActionEvent) {
          this.onActionEvent({
            type: 'attack',
            schoolId,
            x: target.x,
            y: target.y,
            combatResult: result,
          });
        }
      } else if (neutralCandidates.length > 0) {
        // Expand to neutral tile
        const target = neutralCandidates[0];
        const success = this.engine.expandToTile(target.x, target.y, schoolId);
        if (success && this.onActionEvent) {
          this.onActionEvent({
            type: 'expand',
            schoolId,
            x: target.x,
            y: target.y,
          });
        }
      } else {
        // Fortify border tile if near enemy
        if (this.engine.isNearEnemy(borderPos.x, borderPos.y, schoolId)) {
          const success = this.engine.fortifyTile(borderPos.x, borderPos.y, schoolId);
          if (success && this.onActionEvent) {
            this.onActionEvent({
              type: 'fortify',
              schoolId,
              x: borderPos.x,
              y: borderPos.y,
            });
          }
        }
      }
    }
  }

  /**
   * Find the most attractive landmark for a school:
   * Prioritizes landmarks that are not owned by this school,
   * or landmarks this school owns partially but has not reached 90% contiguity yet.
   */
  private findBestTargetLandmark(schoolId: number): Landmark | null {
    const school = this.engine.schools.get(schoolId);
    if (!school) return null;

    let bestLandmark: Landmark | null = null;
    let minScore = Infinity;

    this.engine.landmarks.forEach(lm => {
      // If already owned and contiguous, school can target another landmark
      if (lm.currentOwner === schoolId && lm.isContiguousToSpawn) {
        return;
      }

      const lcx = lm.x + lm.width / 2;
      const lcy = lm.y + lm.height / 2;

      // Distance from school's spawn point
      const distFromSpawn = Math.hypot(school.spawnPoint.x - lcx, school.spawnPoint.y - lcy);
      
      // Neutral landmarks get high priority
      const isNeutral = lm.currentOwner === 0;
      const score = distFromSpawn * (isNeutral ? 0.8 : 1.0);

      if (score < minScore) {
        minScore = score;
        bestLandmark = lm;
      }
    });

    return bestLandmark;
  }
}
