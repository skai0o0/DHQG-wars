import { Application, Container, Graphics, Sprite, Texture, Text, TextStyle, TilingSprite } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { GridEngine } from './GridEngine';
import { LandmarkManager } from './LandmarkManager';
import { EmblemDetector } from './EmblemDetector';
import { GRID_CONFIG, SCHOOL_COLORS, isValidCoord } from '../constants/grid';
import { Particle, Shockwave, ExpansionRipple, SmokeParticle, OrbitalBeam, ActionMode } from '../types/game';
import { rasterizeLandmarkTextures } from '../assets/landmarkSprites';
import { TacticalPatternManager } from './TacticalPatternManager';

import terrainCampusPng from '../assets/generated/terrain_campus.png';
import terrainFoundationPng from '../assets/generated/terrain_foundation.png';
import terrainWaterPng from '../assets/generated/terrain_water.png';
import { RoadNetwork } from './RoadNetwork';

export interface ViewportRendererOptions {
  container: HTMLElement;
  engine: GridEngine;
  landmarkManager: LandmarkManager;
  emblemDetector: EmblemDetector;
  onTileClick?: (x: number, y: number, isRightClick: boolean) => void;
  onHoverTile?: (x: number, y: number) => void;
  onCameraChange?: (left: number, top: number, right: number, bottom: number, zoom: number) => void;
}

export class ViewportRenderer {
  private container: HTMLElement;
  private engine: GridEngine;
  public landmarkManager: LandmarkManager;
  public emblemDetector: EmblemDetector;
  
  public app: Application | null = null;
  public viewport: Viewport | null = null;

  // Environment & Terrain layers
  private terrainSprite: TilingSprite | null = null;
  public roadNetwork: RoadNetwork = new RoadNetwork();
  private roadLayer: Graphics = new Graphics();
  private foundationContainer: Container = new Container();
  private foundationTexture: Texture | null = null;
  private foundationSprites: Map<number, Sprite> = new Map();
  private landmarkGroundShadowLayer: Graphics = new Graphics();
  private waterContainer: Container = new Container();
  private waterTexture: Texture | null = null;
  private waterSprites: Map<number, Sprite> = new Map();

  // Render layers
  private baseLayer: Container = new Container();
  private circuitOverlay: TilingSprite | null = null;
  private fogOverlay: TilingSprite | null = null;
  private gridLayer: Graphics = new Graphics();
  private borderLayer: Graphics = new Graphics();
  private landmarkRingLayer: Graphics = new Graphics();
  private landmarkContainer: Container = new Container();
  private emblemContainer: Container = new Container();
  private emblemLayer: Graphics = new Graphics();
  private fxLayer: Graphics = new Graphics();
  private hoverLayer: Graphics = new Graphics();
  private textLayer: Container = new Container();

  // Pattern manager (Circuit lines & Dynamic Fog)
  private patternManager: TacticalPatternManager;

  // Sprites & Textures
  private landmarkTextures: Map<number, Texture> = new Map();
  private landmarkSprites: Map<number, Sprite> = new Map();
  private emblemSprites: Map<number, Sprite> = new Map();
  private emblemTextures: Map<number, Texture> = new Map();
  private lastCameraMoveTime: number = 0;
  private lastFogUpdateTime: number = 0;

  // Overview canvas & texture
  private overviewCanvas: HTMLCanvasElement;
  private overviewCtx: CanvasRenderingContext2D;
  private overviewImageData: ImageData;
  private overviewData32: Uint32Array;
  private overviewSprite: Sprite | null = null;
  private overviewTexture: Texture | null = null;

  // Options & state
  private showGrid: boolean = true;
  private showTroops: boolean = true;
  public activeMode: ActionMode = 'expand';
  private selectedSchoolId: number = 1;
  private isMouseDown: boolean = false;
  private isRightMouseDown: boolean = false;
  private lastInteractedTile: { x: number; y: number } | null = null;
  public hoveredTile: { x: number; y: number } | null = null;

  // Particles & Animations
  private particles: Particle[] = [];
  private shockwaves: Shockwave[] = [];
  private ripples: ExpansionRipple[] = [];
  private smokeParticles: SmokeParticle[] = [];
  private orbitalBeams: OrbitalBeam[] = [];

  // Text pool for troop counts
  private textPool: Text[] = [];
  private textPoolIndex: number = 0;

  public isDestroyed: boolean = false;

  private onTileClick?: (x: number, y: number, isRightClick: boolean) => void;
  private onHoverTile?: (x: number, y: number) => void;
  private onCameraChange?: (left: number, top: number, right: number, bottom: number, zoom: number) => void;

  private resizeObserver: ResizeObserver | null = null;
  private animFrameId: number | null = null;

  constructor(options: ViewportRendererOptions) {
    this.container = options.container;
    this.engine = options.engine;
    this.landmarkManager = options.landmarkManager;
    this.emblemDetector = options.emblemDetector;
    this.onTileClick = options.onTileClick;
    this.onHoverTile = options.onHoverTile;
    this.onCameraChange = options.onCameraChange;

    this.patternManager = new TacticalPatternManager();

    // Initialize 1000x1000 Overview Canvas
    this.overviewCanvas = document.createElement('canvas');
    this.overviewCanvas.width = GRID_CONFIG.WIDTH;
    this.overviewCanvas.height = GRID_CONFIG.HEIGHT;
    this.overviewCtx = this.overviewCanvas.getContext('2d', { willReadFrequently: true })!;
    this.overviewImageData = this.overviewCtx.createImageData(GRID_CONFIG.WIDTH, GRID_CONFIG.HEIGHT);
    this.overviewData32 = new Uint32Array(this.overviewImageData.data.buffer);

    this.initOverviewBuffer();
  }

  private colorToUint32(r: number, g: number, b: number, a: number = 255): number {
    return (a << 24) | (b << 16) | (g << 8) | r;
  }

  private initOverviewBuffer() {
    const W = GRID_CONFIG.WIDTH;
    const H = GRID_CONFIG.HEIGHT;
    const total = W * H;
    const neutralColor = this.colorToUint32(0, 0, 0, 0); // 100% transparent so campus turf & road network shine through!

    for (let i = 0; i < total; i++) {
      const owner = this.engine.ownerMap[i];
      if (owner === 0) {
        this.overviewData32[i] = neutralColor;
      } else {
        const sc = SCHOOL_COLORS[owner] || SCHOOL_COLORS[0];
        this.overviewData32[i] = this.colorToUint32(sc.rgb[0], sc.rgb[1], sc.rgb[2], 165);
      }
    }
    this.overviewCtx.putImageData(this.overviewImageData, 0, 0);
  }

  public async init(): Promise<void> {
    if (this.isDestroyed) return;

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 600;

    const app = new Application();
    (app as unknown as { _cancelResize?: () => void })._cancelResize = () => {};

    await app.init({
      width,
      height,
      backgroundColor: 0x2A451A,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false,
    });

    if (typeof (app as unknown as { _cancelResize?: () => void })._cancelResize !== 'function') {
      (app as unknown as { _cancelResize?: () => void })._cancelResize = () => {};
    }

    if (this.isDestroyed) {
      try {
        app.destroy(true, { children: true, texture: true });
      } catch {
        // Ignored
      }
      return;
    }

    this.app = app;
    this.container.appendChild(this.app.canvas);

    // Initialize pixi-viewport
    this.viewport = new Viewport({
      screenWidth: width,
      screenHeight: height,
      worldWidth: GRID_CONFIG.WORLD_WIDTH,
      worldHeight: GRID_CONFIG.WORLD_HEIGHT,
      events: this.app.renderer.events,
    });

    this.app.stage.addChild(this.viewport);

    this.viewport
      .drag({ mouseButtons: 'right' })
      .pinch()
      .wheel({ percent: 0.15 })
      .clampZoom({ minScale: GRID_CONFIG.MIN_ZOOM, maxScale: GRID_CONFIG.MAX_ZOOM });

    // Center on first school spawn
    const firstSchool = this.engine.schools.get(1);
    if (firstSchool) {
      this.centerOnTile(firstSchool.spawnPoint.x, firstSchool.spawnPoint.y, 0.75);
    }

    // Load Environment & Foundation Textures
    this.foundationTexture = Texture.from(terrainFoundationPng);
    this.waterTexture = Texture.from(terrainWaterPng);

    // 1. Base Campus Seamless Ground Terrain (Tiling tactical green grass lawn)
    this.terrainSprite = new TilingSprite({
      texture: Texture.from(terrainCampusPng),
      width: GRID_CONFIG.WORLD_WIDTH,
      height: GRID_CONFIG.WORLD_HEIGHT,
    });
    this.terrainSprite.tileScale.set(0.48, 0.48);

    // Setup High-Tech Holographic Circuit Pattern
    this.circuitOverlay = new TilingSprite({
      texture: this.patternManager.circuitTexture,
      width: GRID_CONFIG.WORLD_WIDTH,
      height: GRID_CONFIG.WORLD_HEIGHT,
    });
    this.circuitOverlay.alpha = 0.12;
    this.circuitOverlay.blendMode = 'screen';

    // Setup Dynamic Fog of War
    this.fogOverlay = new TilingSprite({
      texture: this.patternManager.fogTexture,
      width: GRID_CONFIG.WORLD_WIDTH,
      height: GRID_CONFIG.WORLD_HEIGHT,
    });
    this.fogOverlay.alpha = 0.28;
    this.fogOverlay.blendMode = 'screen';

    // Build Complete Layer Hierarchy in Depth Order
    this.viewport.addChild(this.terrainSprite);
    this.viewport.addChild(this.roadLayer);
    this.viewport.addChild(this.baseLayer);
    this.viewport.addChild(this.waterContainer);
    this.viewport.addChild(this.circuitOverlay);
    this.viewport.addChild(this.fogOverlay);
    this.viewport.addChild(this.gridLayer);
    this.viewport.addChild(this.borderLayer);
    this.viewport.addChild(this.landmarkGroundShadowLayer);
    this.viewport.addChild(this.foundationContainer);
    this.viewport.addChild(this.landmarkRingLayer);
    this.viewport.addChild(this.landmarkContainer);
    this.viewport.addChild(this.emblemContainer);
    this.viewport.addChild(this.emblemLayer);
    this.viewport.addChild(this.hoverLayer);
    this.viewport.addChild(this.textLayer);
    this.viewport.addChild(this.fxLayer);

    // Setup Overview Texture & Sprite
    this.overviewTexture = Texture.from(this.overviewCanvas);
    this.overviewSprite = new Sprite(this.overviewTexture);
    this.overviewSprite.width = GRID_CONFIG.WORLD_WIDTH;
    this.overviewSprite.height = GRID_CONFIG.WORLD_HEIGHT;
    this.baseLayer.addChild(this.overviewSprite);

    // Setup Event Listeners
    this.setupInteractions();

    // Window Resize Observer
    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.container);

    // Preload SVG emblem textures & 2.5D Isometric Landmark Textures
    this.loadSchoolLogoTextures();
    this.loadLandmarkTextures();

    // Start Game Render Loop
    this.startRenderLoop();
  }

  private async loadLandmarkTextures() {
    try {
      this.landmarkTextures = await rasterizeLandmarkTextures();
    } catch (err) {
      console.warn('Failed to load landmark textures:', err);
    }
  }

  private setupInteractions() {
    if (!this.viewport || !this.app) return;

    const canvas = this.app.canvas;

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      if (!this.viewport) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const worldPos = this.viewport.toWorld(clientX, clientY);
      const tx = Math.floor(worldPos.x / GRID_CONFIG.TILE_SIZE);
      const ty = Math.floor(worldPos.y / GRID_CONFIG.TILE_SIZE);

      if (e.button === 0) {
        this.isMouseDown = true;
        this.handleTileAction(tx, ty, false);
      } else if (e.button === 2) {
        this.isRightMouseDown = true;
      }
    });

    window.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button === 0) {
        this.isMouseDown = false;
      } else if (e.button === 2) {
        this.isRightMouseDown = false;
      }
      this.lastInteractedTile = null;
    });

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.viewport) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      const worldPos = this.viewport.toWorld(clientX, clientY);
      const tx = Math.floor(worldPos.x / GRID_CONFIG.TILE_SIZE);
      const ty = Math.floor(worldPos.y / GRID_CONFIG.TILE_SIZE);

      if (isValidCoord(tx, ty)) {
        if (!this.hoveredTile || this.hoveredTile.x !== tx || this.hoveredTile.y !== ty) {
          this.hoveredTile = { x: tx, y: ty };
          if (this.onHoverTile) this.onHoverTile(tx, ty);
        }

        if (this.isMouseDown) {
          this.handleTileAction(tx, ty, false);
        } else if (this.isRightMouseDown) {
          this.handleTileAction(tx, ty, true);
        }
      }
    });

    // Viewport camera changes (throttled to avoid freezing React during mouse wheel zoom)
    this.viewport.on('moved', () => {
      if (!this.viewport) return;
      const now = performance.now();
      if (now - this.lastCameraMoveTime < 80) return;
      this.lastCameraMoveTime = now;

      if (this.onCameraChange) {
        this.onCameraChange(
          this.viewport.left,
          this.viewport.top,
          this.viewport.right,
          this.viewport.bottom,
          this.viewport.scale.x
        );
      }
    });
  }

  private handleTileAction(tx: number, ty: number, isRightClick: boolean) {
    if (!isValidCoord(tx, ty)) return;
    if (this.lastInteractedTile && this.lastInteractedTile.x === tx && this.lastInteractedTile.y === ty) {
      return;
    }
    this.lastInteractedTile = { x: tx, y: ty };

    if (this.onTileClick) {
      this.onTileClick(tx, ty, isRightClick);
    }
  }

  public setSelectedSchool(schoolId: number) {
    this.selectedSchoolId = schoolId;
  }

  public setActiveMode(mode: ActionMode) {
    this.activeMode = mode;
  }

  public setToggles(showGrid: boolean, showTroops: boolean) {
    this.showGrid = showGrid;
    this.showTroops = showTroops;
  }

  public centerOnTile(tx: number, ty: number, targetZoom?: number) {
    if (!this.viewport) return;
    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
    const worldY = ty * TILE_SIZE + TILE_SIZE / 2;

    if (targetZoom !== undefined) {
      this.viewport.setZoom(targetZoom, true);
    }
    this.viewport.animate({
      position: { x: worldX, y: worldY },
      time: 300,
      ease: 'easeInOutSine',
    });
  }

  public zoomIn() {
    if (!this.viewport) return;
    const next = Math.min(GRID_CONFIG.MAX_ZOOM, this.viewport.scale.x * 1.3);
    this.viewport.animate({ scale: next, time: 180 });
  }

  public setActionMode(mode: ActionMode) {
    this.activeMode = mode;
  }

  public zoomOut() {
    if (!this.viewport) return;
    const next = Math.max(GRID_CONFIG.MIN_ZOOM, this.viewport.scale.x / 1.3);
    this.viewport.animate({ scale: next, time: 180 });
  }

  public setZoom(zoomLevel: number) {
    if (!this.viewport) return;
    this.viewport.animate({ scale: zoomLevel, time: 180 });
  }

  public zoomToFit() {
    if (!this.viewport) return;
    this.centerOnTile(GRID_CONFIG.WIDTH / 2, GRID_CONFIG.HEIGHT / 2, 0.08);
  }

  // --- Visual Effect Triggers ---

  public addExpansionRipple(tx: number, ty: number, color: number) {
    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    this.ripples.push({
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      radius: 0,
      maxRadius: 28,
      color,
      life: 1.0,
    });
  }

  public addCombatParticles(tx: number, ty: number, color: number) {
    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    const cx = tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = ty * TILE_SIZE + TILE_SIZE / 2;

    // Sparks
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        color: Math.random() < 0.35 ? 0xFFFFFF : color,
        size: 2 + Math.random() * 3,
      });
    }

    // Smoke Plume
    for (let i = 0; i < 2; i++) {
      this.smokeParticles.push({
        x: cx + (Math.random() - 0.5) * 8,
        y: cy + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.7 - Math.random() * 0.7,
        size: 4 + Math.random() * 4,
        maxSize: 16 + Math.random() * 8,
        alpha: 0.55,
        life: 1.0,
      });
    }
  }

  public addOrbitalBeam(x: number, y: number, color: number) {
    this.orbitalBeams.push({
      x,
      y,
      width: 0,
      maxWidth: 140,
      color,
      life: 1.0,
    });
  }

  public addShockwave(centerX: number, centerY: number, color: number) {
    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    this.shockwaves.push({
      x: centerX * TILE_SIZE,
      y: centerY * TILE_SIZE,
      radius: 0,
      maxRadius: 360,
      color,
      life: 1.0,
    });
  }

  private startRenderLoop() {
    const tick = () => {
      this.renderFrame();
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private renderFrame() {
    if (!this.viewport || !this.app) return;

    const now = performance.now();
    const timeSec = now / 1000;

    // 1. Process dirty tiles and update overview texture
    if (this.engine.dirtyTiles.size > 0) {
      this.engine.dirtyTiles.forEach(idx => {
        const owner = this.engine.ownerMap[idx];
        if (owner === 0) {
          this.overviewData32[idx] = this.colorToUint32(0, 0, 0, 0);
        } else {
          const sc = SCHOOL_COLORS[owner] || SCHOOL_COLORS[0];
          this.overviewData32[idx] = this.colorToUint32(sc.rgb[0], sc.rgb[1], sc.rgb[2], 165);
        }
      });
      this.engine.dirtyTiles.clear();
      this.overviewCtx.putImageData(this.overviewImageData, 0, 0);
      if (this.overviewTexture) {
        this.overviewTexture.source.update();
      }
    }

    // 2. Animate Tactical Patterns (Circuit lines panning + drifting Fog of War)
    if (this.circuitOverlay) {
      this.circuitOverlay.tilePosition.x += 0.08;
      this.circuitOverlay.tilePosition.y += 0.05;
    }
    if (this.fogOverlay) {
      this.fogOverlay.tilePosition.x += 0.14;
      this.fogOverlay.tilePosition.y += 0.08;
    }

    // Throttle procedural fog noise texture regeneration to 8 FPS
    if (now - this.lastFogUpdateTime > 125) {
      this.lastFogUpdateTime = now;
      this.patternManager.updateFog(timeSec);
    }

    const zoom = this.viewport.scale.x;

    // 3. Viewport Culling Bounds
    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    const startX = Math.max(0, Math.floor(this.viewport.left / TILE_SIZE));
    const endX = Math.min(GRID_CONFIG.WIDTH, Math.ceil(this.viewport.right / TILE_SIZE));
    const startY = Math.max(0, Math.floor(this.viewport.top / TILE_SIZE));
    const endY = Math.min(GRID_CONFIG.HEIGHT, Math.ceil(this.viewport.bottom / TILE_SIZE));

    // 4. Render Strategic Road Network
    this.roadNetwork.render(this.roadLayer, this.engine, zoom, timeSec);

    // 5. Render High-Res Grid & Troop Labels
    this.renderHighResGrid(startX, endX, startY, endY, zoom);

    // 5. Render Neon Energy Borders
    this.renderEnergyBorders(startX, endX, startY, endY, zoom);

    // 6. Render 2.5D Isometric Landmarks & Capture Rings
    this.renderLandmarks(startX, endX, startY, endY, zoom);

    // 7. Render Watermark Mega-Emblems
    this.renderMegaEmblems(startX, endX, startY, endY);

    // 8. Render Hover Crosshair & FX
    this.renderHover(zoom);
    this.renderFX();
  }

  private renderHighResGrid(startX: number, endX: number, startY: number, endY: number, zoom: number) {
    this.gridLayer.clear();
    this.textPoolIndex = 0;

    if (zoom < 0.85) {
      for (let i = this.textPoolIndex; i < this.textPool.length; i++) {
        this.textPool[i].visible = false;
      }
      return;
    }

    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    const ownerMap = this.engine.ownerMap;
    const troopMap = this.engine.troopMap;
    const W = GRID_CONFIG.WIDTH;
    let labelCount = 0;
    const maxLabels = 80;

    for (let y = startY; y < endY; y++) {
      const rowOffset = y * W;
      for (let x = startX; x < endX; x++) {
        const idx = rowOffset + x;
        const owner = ownerMap[idx];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (this.showGrid) {
          this.gridLayer.rect(px, py, TILE_SIZE, TILE_SIZE);
          this.gridLayer.stroke({
            color: owner > 0 ? 0x000000 : 0x21262D,
            width: 1,
            alpha: 0.35,
          });
        }

        const troops = troopMap[idx];
        if (this.showTroops && troops > 1 && zoom >= 1.2 && labelCount < maxLabels) {
          this.drawTroopText(px + TILE_SIZE / 2, py + TILE_SIZE / 2, troops);
          labelCount++;
        }
      }
    }

    for (let i = this.textPoolIndex; i < this.textPool.length; i++) {
      this.textPool[i].visible = false;
    }
  }

  /**
   * Renders glowing neon energy borders along territory edges
   */
  private renderEnergyBorders(startX: number, endX: number, startY: number, endY: number, zoom: number) {
    this.borderLayer.clear();
    if (zoom < 0.28) return;

    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    const ownerMap = this.engine.ownerMap;
    const W = GRID_CONFIG.WIDTH;
    const now = Date.now();

    const slowPulse = 0.6 + 0.3 * Math.sin(now / 350);
    const fastPulse = 0.7 + 0.3 * Math.sin(now / 120);

    for (let y = startY; y < endY; y++) {
      const rowOffset = y * W;
      for (let x = startX; x < endX; x++) {
        const idx = rowOffset + x;
        const owner = ownerMap[idx];
        if (owner === 0) continue;

        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        const sc = SCHOOL_COLORS[owner];

        // Check 4 cardinal neighbors
        // Top
        if (y > 0) {
          const topOwner = ownerMap[idx - W];
          if (topOwner !== owner) {
            const isClash = topOwner > 0;
            this.borderLayer.moveTo(px, py);
            this.borderLayer.lineTo(px + TILE_SIZE, py);
            this.borderLayer.stroke({
              color: isClash ? 0xFF4D4F : (sc?.int || 0x00FFA3),
              width: isClash ? 2.5 : 1.5,
              alpha: isClash ? fastPulse : slowPulse,
            });
          }
        }
        // Left
        if (x > 0) {
          const leftOwner = ownerMap[idx - 1];
          if (leftOwner !== owner) {
            const isClash = leftOwner > 0;
            this.borderLayer.moveTo(px, py);
            this.borderLayer.lineTo(px, py + TILE_SIZE);
            this.borderLayer.stroke({
              color: isClash ? 0xFF4D4F : (sc?.int || 0x00FFA3),
              width: isClash ? 2.5 : 1.5,
              alpha: isClash ? fastPulse : slowPulse,
            });
          }
        }
        // Right
        if (x < W - 1) {
          const rightOwner = ownerMap[idx + 1];
          if (rightOwner !== owner) {
            const isClash = rightOwner > 0;
            this.borderLayer.moveTo(px + TILE_SIZE, py);
            this.borderLayer.lineTo(px + TILE_SIZE, py + TILE_SIZE);
            this.borderLayer.stroke({
              color: isClash ? 0xFF4D4F : (sc?.int || 0x00FFA3),
              width: isClash ? 2.5 : 1.5,
              alpha: isClash ? fastPulse : slowPulse,
            });
          }
        }
        // Bottom
        if (y < GRID_CONFIG.HEIGHT - 1) {
          const bottomOwner = ownerMap[idx + W];
          if (bottomOwner !== owner) {
            const isClash = bottomOwner > 0;
            this.borderLayer.moveTo(px, py + TILE_SIZE);
            this.borderLayer.lineTo(px + TILE_SIZE, py + TILE_SIZE);
            this.borderLayer.stroke({
              color: isClash ? 0xFF4D4F : (sc?.int || 0x00FFA3),
              width: isClash ? 2.5 : 1.5,
              alpha: isClash ? fastPulse : slowPulse,
            });
          }
        }
      }
    }
  }

  private drawTroopText(x: number, y: number, count: number) {
    let textObj: Text;
    if (this.textPoolIndex < this.textPool.length) {
      textObj = this.textPool[this.textPoolIndex];
      textObj.visible = true;
    } else {
      const style = new TextStyle({
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        fontWeight: 'bold',
        fill: '#FFFFFF',
        stroke: { color: '#000000', width: 2 },
        align: 'center',
      });
      textObj = new Text({ text: '', style });
      textObj.anchor.set(0.5);
      this.textLayer.addChild(textObj);
      this.textPool.push(textObj);
    }

    textObj.text = count > 999 ? `${(count / 1000).toFixed(1)}k` : `${count}`;
    textObj.position.set(x, y);
    this.textPoolIndex++;
  }

  /**
   * Renders 2.5D Isometric Landmark Sprites, Military Foundations & Glowing Ground Capture Rings
   */
  private renderLandmarks(startX: number, endX: number, startY: number, endY: number, zoom: number) {
    this.landmarkRingLayer.clear();
    this.landmarkGroundShadowLayer.clear();
    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    const now = Date.now();

    this.engine.landmarks.forEach(lm => {
      const inView = !(
        lm.x + lm.width < startX ||
        lm.x > endX ||
        lm.y + lm.height < startY ||
        lm.y > endY
      );

      let sprite = this.landmarkSprites.get(lm.landmarkId);
      const foundSprite = this.foundationSprites.get(lm.landmarkId);
      const waterSprite = this.waterSprites.get(lm.landmarkId);

      if (!inView) {
        if (sprite) sprite.visible = false;
        if (foundSprite) foundSprite.visible = false;
        if (waterSprite) waterSprite.visible = false;
        return;
      }

      const px = lm.x * TILE_SIZE;
      const py = lm.y * TILE_SIZE;
      const pw = lm.width * TILE_SIZE;
      const ph = lm.height * TILE_SIZE;
      const cx = px + pw / 2;
      const cy = py + ph / 2;

      const isOwned = lm.currentOwner > 0;
      const ownerColor = isOwned ? (SCHOOL_COLORS[lm.currentOwner]?.int || 0x00FFA3) : 0xFADB14;
      const isContested = this.engine.isNearEnemy(lm.x, lm.y, lm.currentOwner);

      // 1. Ground Contact Shadows & Foundations / Water Basins
      if (lm.landmarkId === 5) {
        // Landmark 5: Hồ Đá (Quarry Lake) -> Deep aqua water shadow & water ripples
        this.landmarkGroundShadowLayer.ellipse(cx, cy + ph * 0.20, pw * 0.65, ph * 0.46);
        this.landmarkGroundShadowLayer.fill({
          color: 0x02161A,
          alpha: 0.72,
        });

        let wSprite = waterSprite;
        if (!wSprite && this.waterTexture) {
          wSprite = new Sprite(this.waterTexture);
          wSprite.anchor.set(0.5, 0.5);
          this.waterContainer.addChild(wSprite);
          this.waterSprites.set(lm.landmarkId, wSprite);
        }
        if (wSprite) {
          wSprite.position.set(cx, cy + ph * 0.16);
          wSprite.width = pw * 1.28;
          wSprite.height = ph * 1.15;
          wSprite.alpha = 0.94;
          wSprite.visible = true;
        }
        if (foundSprite) foundSprite.visible = false;
      } else {
        // Standard Landmarks: Heavy Concrete Military Platform & Contact Drop Shadow
        this.landmarkGroundShadowLayer.ellipse(cx, cy + ph * 0.32, pw * 0.90, ph * 0.50);
        this.landmarkGroundShadowLayer.fill({
          color: 0x05090C,
          alpha: 0.52,
        });

        let fSprite = foundSprite;
        if (!fSprite && this.foundationTexture) {
          fSprite = new Sprite(this.foundationTexture);
          fSprite.anchor.set(0.5, 0.62);
          this.foundationContainer.addChild(fSprite);
          this.foundationSprites.set(lm.landmarkId, fSprite);
        }
        if (fSprite) {
          fSprite.position.set(cx, cy + ph * 0.30);
          fSprite.width = pw * 1.72;
          fSprite.height = ph * 1.35;
          fSprite.alpha = 0.98;
          fSprite.visible = true;
        }
        if (waterSprite) waterSprite.visible = false;
      }

      // 2. Holographic Ground Capture Ring & Tactical Pulse
      const ringPulse = 0.65 + 0.3 * Math.sin(now / 280);
      const ringAlpha = isContested ? (0.4 + 0.5 * Math.sin(now / 90)) : ringPulse;
      const ringCenterY = lm.landmarkId === 5 ? cy + ph * 0.18 : cy + ph * 0.30;

      // Inner tactical footprint fill
      this.landmarkRingLayer.ellipse(cx, ringCenterY, pw * 0.76, ph * 0.44);
      this.landmarkRingLayer.fill({
        color: isContested ? 0xFF4D4F : ownerColor,
        alpha: 0.18,
      });

      // Outer glowing ring
      this.landmarkRingLayer.ellipse(cx, ringCenterY, pw * 0.82, ph * 0.48);
      this.landmarkRingLayer.stroke({
        color: isContested ? 0xFF4D4F : ownerColor,
        width: 3.5,
        alpha: ringAlpha,
      });

      // 3. Render 2.5D Isometric Landmark Sprite
      if (!sprite) {
        const tex = this.landmarkTextures.get(lm.landmarkId);
        if (tex) {
          sprite = new Sprite(tex);
          sprite.anchor.set(0.5, 0.84); // 3D anchor positioning base on ground
          this.landmarkContainer.addChild(sprite);
          this.landmarkSprites.set(lm.landmarkId, sprite);
        }
      }

      if (sprite) {
        sprite.position.set(cx, cy + ph * 0.18);
        // Overhang scale: sits securely on top of wide foundation deck
        sprite.width = pw * 1.28;
        sprite.height = ph * 1.48;
        sprite.visible = true;
      }

      // 4. Landmark Badge label (when zoomed in)
      if (zoom >= 0.25) {
        this.drawLandmarkBadge(cx, py - 18, lm.shortName, ownerColor);
      }
    });
  }

  private drawLandmarkBadge(cx: number, cy: number, text: string, color: number) {
    let textObj: Text;
    if (this.textPoolIndex < this.textPool.length) {
      textObj = this.textPool[this.textPoolIndex];
      textObj.visible = true;
    } else {
      const style = new TextStyle({
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: '#E6EDF3',
        stroke: { color: '#0D1117', width: 3 },
        align: 'center',
      });
      textObj = new Text({ text: '', style });
      textObj.anchor.set(0.5);
      this.textLayer.addChild(textObj);
      this.textPool.push(textObj);
    }

    textObj.text = text;
    textObj.style.fill = color;
    textObj.position.set(cx, cy);
    this.textPoolIndex++;
  }

  private async loadSchoolLogoTextures() {
    for (const school of this.engine.schools.values()) {
      try {
        const tex = await this.rasterizeSvgToTexture(school.logoUrl, 400, 400);
        this.emblemTextures.set(school.schoolId, tex);
      } catch (err) {
        console.warn(`Could not rasterize logo for school ${school.shortCode}`, err);
      }
    }
  }

  public async updateSchoolEmblemTexture(schoolId: number, logoUrl: string) {
    try {
      const tex = await this.rasterizeSvgToTexture(logoUrl, 400, 400);
      this.emblemTextures.set(schoolId, tex);
      const spr = this.emblemSprites.get(schoolId);
      if (spr) {
        spr.texture = tex;
      }
    } catch (err) {
      console.warn('Update emblem error:', err);
    }
  }

  private rasterizeSvgToTexture(svgUrl: string, width: number, height: number): Promise<Texture> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(Texture.from(canvas));
        } else {
          resolve(Texture.from(img));
        }
      };
      img.onerror = () => {
        resolve(Texture.from(svgUrl));
      };
      img.src = svgUrl;
    });
  }

  /**
   * Renders 50x50 Mega-Emblem as an elegant Watermark Overlay with metallic bezels
   */
  private renderMegaEmblems(startX: number, endX: number, startY: number, endY: number) {
    this.emblemLayer.clear();
    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;

    this.engine.schools.forEach(school => {
      const box = school.emblemBox;

      if (!school.hasEmblemUnlocked || !box) {
        const spr = this.emblemSprites.get(school.schoolId);
        if (spr) spr.visible = false;
        return;
      }

      if (
        box.x + box.size < startX ||
        box.x > endX ||
        box.y + box.size < startY ||
        box.y > endY
      ) {
        const spr = this.emblemSprites.get(school.schoolId);
        if (spr) spr.visible = false;
        return;
      }

      const px = box.x * TILE_SIZE;
      const py = box.y * TILE_SIZE;
      const sizePx = box.size * TILE_SIZE;
      const cx = px + sizePx / 2;
      const cy = py + sizePx / 2;
      const sc = SCHOOL_COLORS[school.schoolId];

      // Watermark Sprite
      let sprite = this.emblemSprites.get(school.schoolId);
      const cachedTexture = this.emblemTextures.get(school.schoolId);

      if (!sprite) {
        try {
          const texture = cachedTexture || Texture.from(school.logoUrl);
          sprite = new Sprite(texture);
          sprite.anchor.set(0.5);
          sprite.blendMode = 'screen'; // Watermark blend
          this.emblemContainer.addChild(sprite);
          this.emblemSprites.set(school.schoolId, sprite);
        } catch (err) {
          console.warn('Emblem sprite creation error:', err);
        }
      } else if (cachedTexture && sprite.texture !== cachedTexture) {
        sprite.texture = cachedTexture;
      }

      if (sprite) {
        sprite.position.set(cx, cy);
        sprite.width = sizePx * 0.85;
        sprite.height = sizePx * 0.85;
        // Soft pulsating watermark opacity
        sprite.alpha = 0.45 + Math.sin(Date.now() / 400) * 0.15;
        sprite.visible = true;
      }

      // Metallic Beveled Chassis
      const pulseAlpha = 0.75 + Math.sin(Date.now() / 250) * 0.25;

      // Soft Holographic Base Tint
      this.emblemLayer.rect(px, py, sizePx, sizePx);
      this.emblemLayer.fill({
        color: sc?.int || 0x00FFA3,
        alpha: 0.12,
      });

      // Outer metallic primary border
      this.emblemLayer.rect(px, py, sizePx, sizePx);
      this.emblemLayer.stroke({
        color: sc?.int || 0x00FFA3,
        width: 5,
        alpha: pulseAlpha,
      });

      // Inner tactical guideline
      this.emblemLayer.rect(px + 10, py + 10, sizePx - 20, sizePx - 20);
      this.emblemLayer.stroke({
        color: 0xFADB14,
        width: 1.5,
        alpha: pulseAlpha * 0.8,
      });

      // 4 Tactical Corner Brackets (80px length)
      const bLen = Math.min(80, sizePx / 3);
      // Top-Left
      this.emblemLayer.moveTo(px, py + bLen);
      this.emblemLayer.lineTo(px, py);
      this.emblemLayer.lineTo(px + bLen, py);
      // Top-Right
      this.emblemLayer.moveTo(px + sizePx - bLen, py);
      this.emblemLayer.lineTo(px + sizePx, py);
      this.emblemLayer.lineTo(px + sizePx, py + bLen);
      // Bottom-Left
      this.emblemLayer.moveTo(px, py + sizePx - bLen);
      this.emblemLayer.lineTo(px, py + sizePx);
      this.emblemLayer.lineTo(px + bLen, py + sizePx);
      // Bottom-Right
      this.emblemLayer.moveTo(px + sizePx - bLen, py + sizePx);
      this.emblemLayer.lineTo(px + sizePx, py + sizePx);
      this.emblemLayer.lineTo(px + sizePx, py + sizePx - bLen);

      this.emblemLayer.stroke({
        color: 0x00FFA3,
        width: 7,
        alpha: 0.95,
      });

      // Top Faction Banner Bar
      this.emblemLayer.rect(px + sizePx * 0.2, py - 24, sizePx * 0.6, 22);
      this.emblemLayer.fill({ color: 0x0D1117, alpha: 0.9 });
      this.emblemLayer.stroke({ color: sc?.int || 0x00FFA3, width: 2, alpha: 0.9 });
    });
  }

  private renderHover(zoom: number) {
    this.hoverLayer.clear();
    if (!this.hoveredTile) return;

    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;
    const px = this.hoveredTile.x * TILE_SIZE;
    const py = this.hoveredTile.y * TILE_SIZE;

    const owner = this.engine.getOwner(this.hoveredTile.x, this.hoveredTile.y);
    const isAdjacent = this.engine.isAdjacentToOwner(this.hoveredTile.x, this.hoveredTile.y, this.selectedSchoolId);

    let crosshairColor = 0x00FFA3;
    if (owner === this.selectedSchoolId) {
      crosshairColor = 0x58A6FF;
    } else if (owner > 0) {
      crosshairColor = isAdjacent ? 0xFF4D4F : 0x8B949E;
    } else if (!isAdjacent) {
      crosshairColor = 0x8B949E;
    }

    this.hoverLayer.rect(px, py, TILE_SIZE, TILE_SIZE);
    this.hoverLayer.stroke({
      color: crosshairColor,
      width: Math.max(1.5, 2 / zoom),
      alpha: 0.9,
    });
  }

  /**
   * Renders Game Juice VFX: Orbital Beams, Expansion Ripples, Sparks, Smoke, Shockwaves
   */
  private renderFX() {
    this.fxLayer.clear();

    // 1. Orbital Beam of Light (Flag Planting / Mega-Emblem Unlock)
    for (let i = this.orbitalBeams.length - 1; i >= 0; i--) {
      const b = this.orbitalBeams[i];
      b.width += (b.maxWidth - b.width) * 0.2;
      b.life -= 0.025;

      if (b.life <= 0) {
        this.orbitalBeams.splice(i, 1);
        continue;
      }

      // Outer Glowing Beam
      this.fxLayer.rect(b.x - b.width / 2, 0, b.width, b.y);
      this.fxLayer.fill({
        color: b.color,
        alpha: b.life * 0.45,
      });

      // Intense White Inner Core
      this.fxLayer.rect(b.x - b.width / 6, 0, b.width / 3, b.y);
      this.fxLayer.fill({
        color: 0xFFFFFF,
        alpha: b.life * 0.85,
      });

      // Ground Impact Flare
      this.fxLayer.ellipse(b.x, b.y, b.width * 1.4, b.width * 0.45);
      this.fxLayer.fill({
        color: b.color,
        alpha: b.life * 0.65,
      });
      this.fxLayer.ellipse(b.x, b.y, b.width * 0.7, b.width * 0.22);
      this.fxLayer.fill({
        color: 0xFFFFFF,
        alpha: b.life * 0.9,
      });
    }

    // 2. Expansion Ripples (Vết Dầu Loang when capturing a tile)
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += 1.8;
      r.life = 1.0 - r.radius / r.maxRadius;

      if (r.life <= 0) {
        this.ripples.splice(i, 1);
        continue;
      }

      this.fxLayer.circle(r.x, r.y, r.radius);
      this.fxLayer.stroke({
        color: r.color,
        width: 3 * r.life,
        alpha: r.life * 0.8,
      });
    }

    // 3. Combat Sparks (Border Clashes)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // subtle gravity
      p.life -= 0.04;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.fxLayer.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      this.fxLayer.fill({
        color: p.color,
        alpha: p.life / p.maxLife,
      });
    }

    // 4. Rising Smoke Plumes
    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const sm = this.smokeParticles[i];
      sm.x += sm.vx;
      sm.y += sm.vy;
      sm.size += (sm.maxSize - sm.size) * 0.08;
      sm.life -= 0.02;

      if (sm.life <= 0) {
        this.smokeParticles.splice(i, 1);
        continue;
      }

      this.fxLayer.circle(sm.x, sm.y, sm.size);
      this.fxLayer.fill({
        color: 0x30363D,
        alpha: sm.life * sm.alpha,
      });
    }

    // 5. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += 16;
      s.life = 1.0 - s.radius / s.maxRadius;

      if (s.life <= 0) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      this.fxLayer.circle(s.x, s.y, s.radius);
      this.fxLayer.stroke({
        color: s.color,
        width: 5 * s.life,
        alpha: s.life,
      });
    }
  }

  private onResize() {
    if (!this.app || !this.viewport) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.app.renderer.resize(w, h);
    this.viewport.resize(w, h, GRID_CONFIG.WORLD_WIDTH, GRID_CONFIG.WORLD_HEIGHT);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.app) {
      try {
        if (typeof (this.app as unknown as { _cancelResize?: () => void })._cancelResize !== 'function') {
          (this.app as unknown as { _cancelResize?: () => void })._cancelResize = () => {};
        }
        if (this.app.canvas && this.app.canvas.parentNode) {
          this.app.canvas.parentNode.removeChild(this.app.canvas);
        }
        this.app.destroy(true, { children: true, texture: true });
      } catch (err) {
        console.warn('Pixi app destroy notice:', err);
      }
      this.app = null;
    }
  }
}
