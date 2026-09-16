import { Graphics } from 'pixi.js';
import { GRID_CONFIG, SCHOOL_COLORS } from '../constants/grid';
import { GridEngine } from './GridEngine';

export interface RoadWaypoint {
  x: number; // tile X
  y: number; // tile Y
}

export interface RoadSegment {
  name: string;
  points: RoadWaypoint[];
  isLoop?: boolean;
}

/**
 * Tactical Road Network representing iconic arterial roads and avenues of VNU-HCM Campus:
 * 1. Đại Lộ Trung Tâm & Vành Đai Trái Tim ĐHQG (Inner Ring Highway)
 * 2. Trục Bắc - Nam (Đại Lộ Sáng Tạo & Trục Ngã Ba 621)
 * 3. Trục Đông (Đường Dốc Tình - UIT - NLU - USSH)
 * 4. Trục Tây Quân Sự (Đường Quốc Lộ 1K & GDQP - HCMUTE - UEL - HCMUS)
 * 5. Tuyến Vành Đai Hồ Đá (Quarry Lake Scenic Loop)
 */
export class RoadNetwork {
  public segments: RoadSegment[] = [];
  public roundabouts: RoadWaypoint[] = [];

  constructor() {
    this.initRoadData();
  }

  private initRoadData() {
    const T = (x: number, y: number): RoadWaypoint => ({ x, y });

    // 1. Vành Đai Trái Tim ĐHQG (Central Inner Ring Loop)
    this.segments.push({
      name: 'Vành Đai Trung Tâm ĐHQG',
      isLoop: true,
      points: [
        T(340, 340), // KTX Khu A & B
        T(500, 350), // Tòa Nhà Điều Hành
        T(640, 340), // Chợ Đêm
        T(650, 510), // Trục Cỏ Lau Đông
        T(510, 510), // Thư Viện Trung Tâm
        T(440, 440), // Nhà Văn Hóa Sinh Viên
        T(340, 340), // Khép vòng về KTX
      ],
    });

    // 2. Trục Bắc - Nam (Đại Lộ Sáng Tạo & Ngã Ba 621)
    this.segments.push({
      name: 'Đại Lộ Sáng Tạo Bắc - Nam',
      points: [
        T(500, 100), // MEDVNU
        T(500, 350), // Tòa Nhà Điều Hành
        T(510, 510), // Thư Viện TT
        T(500, 800), // Ngã Ba 621
        T(400, 850), // IU
      ],
    });

    // 3. Trục Đông (Đường Dốc Tình - UIT - NLU - USSH)
    this.segments.push({
      name: 'Trục Vành Đai Đông (Dốc Tình)',
      points: [
        T(800, 150), // UIT
        T(746, 235), // Dốc Tình
        T(800, 500), // NLU
        T(850, 850), // USSH
        T(650, 700), // USH
        T(500, 800), // Ngã Ba 621
      ],
    });

    // 4. Trục Tây Quân Sự (Đường GDQP - UEL - HCMUTE - HCMUS)
    this.segments.push({
      name: 'Trục Tây Quân Sự (Đường GDQP)',
      points: [
        T(100, 300), // HCMUTE
        T(200, 200), // BK
        T(340, 340), // KTX A
      ],
    });

    this.segments.push({
      name: 'Đường Vành Đai Tây',
      points: [
        T(100, 300), // HCMUTE
        T(150, 500), // UEL
        T(240, 740), // Khu GDQP-AN
        T(150, 800), // HCMUS
        T(400, 850), // IU
        T(500, 800), // Ngã Ba 621
      ],
    });

    // 5. Tuyến Vành Đai Hồ Đá (Quarry Lake Scenic Route)
    this.segments.push({
      name: 'Tuyến Vành Đai Hồ Đá',
      points: [
        T(440, 440), // NVH Sinh Viên
        T(388, 588), // Hồ Đá
        T(500, 800), // Ngã Ba 621
      ],
    });

    // Các Vòng Xuyến Giao Lộ Huyết Mạch (Roundabout Hubs)
    this.roundabouts = [
      T(500, 350), // Giao lộ Tòa Điều Hành
      T(510, 510), // Giao lộ Thư Viện TT
      T(440, 440), // Giao lộ NVH Sinh Viên
      T(500, 800), // Ngã Ba 621
      T(340, 340), // Giao lộ KTX
      T(640, 340), // Giao lộ Chợ Đêm
    ];
  }

  /**
   * Renders the road network with:
   * - Concrete curb underlay
   * - Asphalt roadbed
   * - Glowing energy center markings
   */
  public render(graphics: Graphics, engine: GridEngine, zoom: number, timeSec: number) {
    graphics.clear();
    const TILE = GRID_CONFIG.TILE_SIZE;

    // Scale road thickness at low zoom levels (< 0.25x) so arterial roads remain crisply visible
    const roadScale = zoom < 0.25 ? 1.4 : 1.0;
    const curbWidth = 16 * roadScale;
    const roadWidth = 11 * roadScale;
    const centerLineWidth = 1.8 * roadScale;

    // 1. Draw Concrete Underlay & Asphalt Roadways
    this.segments.forEach(seg => {
      const pts = seg.points;
      if (pts.length < 2) return;

      // A. Concrete Curbs
      graphics.moveTo(pts[0].x * TILE, pts[0].y * TILE);
      for (let i = 1; i < pts.length; i++) {
        graphics.lineTo(pts[i].x * TILE, pts[i].y * TILE);
      }
      graphics.stroke({
        color: 0x334155, // Dark slate concrete curb
        width: curbWidth,
        alpha: 0.85,
        cap: 'round',
        join: 'round',
      });

      // B. Asphalt Road Surface
      graphics.moveTo(pts[0].x * TILE, pts[0].y * TILE);
      for (let i = 1; i < pts.length; i++) {
        graphics.lineTo(pts[i].x * TILE, pts[i].y * TILE);
      }
      graphics.stroke({
        color: 0x1E293B, // Deep dark asphalt
        width: roadWidth,
        alpha: 0.95,
        cap: 'round',
        join: 'round',
      });

      // C. Luminous Energy Lane Markings (Cyan default, school color if owned)
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        // Sample midpoint ownership along this segment
        const midX = Math.floor((p1.x + p2.x) / 2);
        const midY = Math.floor((p1.y + p2.y) / 2);
        const idx = midY * GRID_CONFIG.WIDTH + midX;
        const owner = engine.ownerMap[idx] || 0;

        const lineColor = owner > 0 ? (SCHOOL_COLORS[owner]?.int || 0x00FFA3) : 0x00E5FF;
        const lineAlpha = owner > 0 ? (0.65 + 0.25 * Math.sin(timeSec * 3)) : 0.45;

        graphics.moveTo(p1.x * TILE, p1.y * TILE);
        graphics.lineTo(p2.x * TILE, p2.y * TILE);
        graphics.stroke({
          color: lineColor,
          width: centerLineWidth,
          alpha: lineAlpha,
          cap: 'round',
        });
      }
    });

    // 2. Draw Roundabout Plaza Hubs (Giao Lộ Bùng Binh)
    this.roundabouts.forEach(hub => {
      const cx = hub.x * TILE;
      const cy = hub.y * TILE;
      const r = 24;

      // Outer concrete ring
      graphics.circle(cx, cy, r);
      graphics.fill({ color: 0x334155, alpha: 0.85 });

      // Asphalt center
      graphics.circle(cx, cy, r - 3);
      graphics.fill({ color: 0x1E293B, alpha: 0.95 });

      // Energy radar ring
      graphics.circle(cx, cy, r - 7);
      graphics.stroke({
        color: 0x00E5FF,
        width: 1.5,
        alpha: 0.60 + 0.20 * Math.sin(timeSec * 2.5),
      });

      // Center bollard dot
      graphics.circle(cx, cy, 3.5);
      graphics.fill({ color: 0x00FFA3, alpha: 0.85 });
    });
  }
}
