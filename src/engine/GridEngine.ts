import { GAME_BALANCE } from '../constants/balance';
import { GRID_CONFIG, coordToIndex, isValidCoord } from '../constants/grid';
import { School } from '../types/school';
import { Landmark } from '../types/game';
import initialSchools from '../data/schools.json';
import initialLandmarks from '../data/landmarks.json';

export interface CombatResult {
  success: boolean;
  x: number;
  y: number;
  formerOwner: number;
  newOwner: number;
  attackerCasualties: number;
  defenderCasualties: number;
}

export type TileChangeListener = (x: number, y: number, newOwner: number, troops: number) => void;

export class GridEngine {
  public ownerMap: Uint8Array;
  public troopMap: Uint16Array;
  public landmarkMap: Uint8Array;
  
  public schools: Map<number, School>;
  public landmarks: Landmark[];
  
  // Track modified tiles since last render frame
  public dirtyTiles: Set<number> = new Set();
  
  private listeners: TileChangeListener[] = [];

  constructor() {
    const total = GRID_CONFIG.TOTAL_TILES;
    this.ownerMap = new Uint8Array(total);
    this.troopMap = new Uint16Array(total);
    this.landmarkMap = new Uint8Array(total);
    
    this.schools = new Map();
    (initialSchools as School[]).forEach(s => {
      this.schools.set(s.schoolId, { ...s, activeBuffs: [] });
    });

    this.landmarks = JSON.parse(JSON.stringify(initialLandmarks));

    this.initLandmarks();
    this.initSpawns();
  }

  public subscribe(listener: TileChangeListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(x: number, y: number, owner: number, troops: number) {
    const idx = coordToIndex(x, y);
    this.dirtyTiles.add(idx);
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](x, y, owner, troops);
    }
  }

  private initLandmarks() {
    this.landmarks.forEach(lm => {
      for (let ly = lm.y; ly < lm.y + lm.height; ly++) {
        for (let lx = lm.x; lx < lm.x + lm.width; lx++) {
          if (isValidCoord(lx, ly)) {
            const idx = coordToIndex(lx, ly);
            this.landmarkMap[idx] = lm.landmarkId;
          }
        }
      }
    });
  }

  public initSpawns() {
    this.schools.forEach(school => {
      const { x: sx, y: sy } = school.spawnPoint;
      const radius = GAME_BALANCE.INITIAL_SPAWN_RADIUS;
      let count = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const x = sx + dx;
          const y = sy + dy;
          if (isValidCoord(x, y)) {
            const idx = coordToIndex(x, y);
            this.ownerMap[idx] = school.schoolId;
            if (dx === 0 && dy === 0) {
              this.troopMap[idx] = GAME_BALANCE.INITIAL_SPAWN_TROOPS;
            } else {
              this.troopMap[idx] = 10;
            }
            this.dirtyTiles.add(idx);
            count++;
          }
        }
      }
      school.totalOwnedTiles = count;
    });
  }

  public getOwner(x: number, y: number): number {
    if (!isValidCoord(x, y)) return 0;
    return this.ownerMap[coordToIndex(x, y)];
  }

  public setOwner(x: number, y: number, id: number): void {
    if (!isValidCoord(x, y)) return;
    const idx = coordToIndex(x, y);
    const oldOwner = this.ownerMap[idx];
    if (oldOwner === id) return;

    if (oldOwner > 0) {
      const oldSchool = this.schools.get(oldOwner);
      if (oldSchool && oldSchool.totalOwnedTiles > 0) {
        oldSchool.totalOwnedTiles--;
      }
    }

    this.ownerMap[idx] = id;
    if (id > 0) {
      const newSchool = this.schools.get(id);
      if (newSchool) {
        newSchool.totalOwnedTiles++;
      }
    }

    this.notify(x, y, id, this.troopMap[idx]);
  }

  public getTroops(x: number, y: number): number {
    if (!isValidCoord(x, y)) return 0;
    return this.troopMap[coordToIndex(x, y)];
  }

  public setTroops(x: number, y: number, count: number): void {
    if (!isValidCoord(x, y)) return;
    const idx = coordToIndex(x, y);
    const clamped = Math.min(65535, Math.max(0, count));
    this.troopMap[idx] = clamped;
    this.notify(x, y, this.ownerMap[idx], clamped);
  }

  public getLandmarkId(x: number, y: number): number {
    if (!isValidCoord(x, y)) return 0;
    return this.landmarkMap[coordToIndex(x, y)];
  }

  public isAdjacentToOwner(x: number, y: number, schoolId: number): boolean {
    if (x > 0 && this.ownerMap[coordToIndex(x - 1, y)] === schoolId) return true;
    if (x < GRID_CONFIG.WIDTH - 1 && this.ownerMap[coordToIndex(x + 1, y)] === schoolId) return true;
    if (y > 0 && this.ownerMap[coordToIndex(x, y - 1)] === schoolId) return true;
    if (y < GRID_CONFIG.HEIGHT - 1 && this.ownerMap[coordToIndex(x, y + 1)] === schoolId) return true;
    return false;
  }

  public isNearEnemy(x: number, y: number, mySchoolId: number): boolean {
    const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < deltas.length; i++) {
      const nx = x + deltas[i][0];
      const ny = y + deltas[i][1];
      if (isValidCoord(nx, ny)) {
        const o = this.ownerMap[coordToIndex(nx, ny)];
        if (o > 0 && o !== mySchoolId) return true;
      }
    }
    return false;
  }

  public expandToTile(x: number, y: number, schoolId: number): boolean {
    if (!isValidCoord(x, y)) return false;
    const currentOwner = this.getOwner(x, y);
    if (currentOwner !== 0) return false;
    if (!this.isAdjacentToOwner(x, y, schoolId)) return false;

    const school = this.schools.get(schoolId);
    if (!school) return false;

    // Check cost buff (NVH gives 50% discount)
    const hasNVH = school.activeBuffs.includes('NVH_DISCOUNT');
    const cost = hasNVH ? GAME_BALANCE.NVH_EXPANSION_COST : GAME_BALANCE.BASE_EXPANSION_COST;

    if (school.availableTroops < cost) return false;

    school.availableTroops -= cost;
    this.setOwner(x, y, schoolId);
    this.setTroops(x, y, 1);
    return true;
  }

  public attackTile(x: number, y: number, attackerSchoolId: number): CombatResult | null {
    if (!isValidCoord(x, y)) return null;
    const defenderSchoolId = this.getOwner(x, y);
    if (defenderSchoolId === 0 || defenderSchoolId === attackerSchoolId) return null;
    if (!this.isAdjacentToOwner(x, y, attackerSchoolId)) return null;

    const attacker = this.schools.get(attackerSchoolId);
    const defender = this.schools.get(defenderSchoolId);
    if (!attacker || !defender) return null;

    const baseDefenderTroops = this.getTroops(x, y);

    // Defense buffs
    let defenseMultiplier = 1.0;
    if (defender.activeBuffs.includes('GDQP_DEFENSE')) {
      defenseMultiplier *= GAME_BALANCE.GDQP_DEFENSE_BUFF;
    }

    // Hồ Đá penalty: if tile is around Ho Da and defender holds Ho Da
    const landmarkId = this.getLandmarkId(x, y);
    if (landmarkId === 5 && defender.activeBuffs.includes('HO_DA_SHIELD')) {
      defenseMultiplier *= GAME_BALANCE.HO_DA_ATTACK_PENALTY;
    }

    const effectiveDefense = Math.ceil(baseDefenderTroops * defenseMultiplier);
    const requiredAttackTroops = Math.ceil(effectiveDefense * GAME_BALANCE.ATTACK_DIFFICULTY_MULTIPLIER);

    if (attacker.availableTroops < requiredAttackTroops) {
      // Attacker loses some probing troops without conquering
      const lost = Math.min(attacker.availableTroops, Math.max(1, Math.floor(requiredAttackTroops * 0.2)));
      attacker.availableTroops -= lost;
      return {
        success: false,
        x,
        y,
        formerOwner: defenderSchoolId,
        newOwner: defenderSchoolId,
        attackerCasualties: lost,
        defenderCasualties: 0,
      };
    }

    // Attacker conquers tile
    attacker.availableTroops -= requiredAttackTroops;
    const garrison = Math.max(1, Math.floor(requiredAttackTroops * 0.25));

    this.setOwner(x, y, attackerSchoolId);
    this.setTroops(x, y, garrison);

    return {
      success: true,
      x,
      y,
      formerOwner: defenderSchoolId,
      newOwner: attackerSchoolId,
      attackerCasualties: requiredAttackTroops - garrison,
      defenderCasualties: baseDefenderTroops,
    };
  }

  public fortifyTile(x: number, y: number, schoolId: number): boolean {
    if (!isValidCoord(x, y)) return false;
    if (this.getOwner(x, y) !== schoolId) return false;

    const school = this.schools.get(schoolId);
    if (!school) return false;

    const increment = GAME_BALANCE.FORTIFY_TROOP_INCREMENT;
    if (school.availableTroops < increment) return false;

    school.availableTroops -= increment;
    const current = this.getTroops(x, y);
    this.setTroops(x, y, current + increment);
    return true;
  }

  public resetMap() {
    this.ownerMap.fill(0);
    this.troopMap.fill(0);
    this.dirtyTiles.clear();
    
    // Reset schools
    this.schools.forEach(school => {
      school.totalOwnedTiles = 0;
      school.availableTroops = 1500;
      school.hasEmblemUnlocked = false;
      school.emblemBox = undefined;
      school.activeBuffs = [];
    });

    // Reset landmarks
    this.landmarks.forEach(lm => {
      lm.currentOwner = 0;
      lm.isContiguousToSpawn = false;
    });

    this.initLandmarks();
    this.initSpawns();
  }

  public equalizeTroops(amount: number = 2000) {
    this.schools.forEach(school => {
      school.availableTroops = amount;
    });
  }

  public injectTroops(schoolId: number, rawPoints: number): number {
    const school = this.schools.get(schoolId);
    if (!school) return 0;

    let multiplier = 1.0;
    if (school.activeBuffs.includes('NIGHT_MARKET_BONUS')) {
      multiplier = GAME_BALANCE.NIGHT_MARKET_BONUS_MULTIPLIER;
    }

    const troopsToAdd = Math.floor(rawPoints * multiplier);
    school.availableTroops += troopsToAdd;
    return troopsToAdd;
  }
}
