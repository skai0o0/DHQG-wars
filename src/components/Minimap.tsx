import React, { useRef, useEffect, useCallback } from 'react';
import { GridEngine } from '../engine/GridEngine';
import { GRID_CONFIG, SCHOOL_COLORS } from '../constants/grid';
import { Landmark } from '../types/game';

interface MinimapProps {
  engine: GridEngine;
  cameraLeft: number;
  cameraTop: number;
  cameraRight: number;
  cameraBottom: number;
  onNavigate: (tileX: number, tileY: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  engine,
  cameraLeft,
  cameraTop,
  cameraRight,
  cameraBottom,
  onNavigate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const animFrameRef = useRef<number | null>(null);

  // Store camera bounds in refs so the 60 FPS requestAnimationFrame loop always sees fresh values without re-mounting
  const cameraBoundsRef = useRef({ cameraLeft, cameraTop, cameraRight, cameraBottom });
  useEffect(() => {
    cameraBoundsRef.current = { cameraLeft, cameraTop, cameraRight, cameraBottom };
  }, [cameraLeft, cameraTop, cameraRight, cameraBottom]);

  // Initialize offscreen canvas (250x250)
  if (!offscreenCanvasRef.current) {
    const off = document.createElement('canvas');
    off.width = 250;
    off.height = 250;
    offscreenCanvasRef.current = off;
  }

  const handleMinimapInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const clickY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    // Convert minimap 250x250 coords to world tile coords 1000x1000 (scale: 4)
    const scale = GRID_CONFIG.WIDTH / rect.width;
    const tileX = Math.floor(clickX * scale);
    const tileY = Math.floor(clickY * scale);

    onNavigate(tileX, tileY);
  }, [onNavigate]);

  // 1. Periodic background update of offscreen terrain canvas (every 300ms)
  useEffect(() => {
    const updateOffscreen = () => {
      const off = offscreenCanvasRef.current;
      if (!off) return;
      const ctx = off.getContext('2d');
      if (!ctx) return;

      const size = 250;
      const imgData = ctx.createImageData(size, size);
      const data32 = new Uint32Array(imgData.data.buffer);

      const W = GRID_CONFIG.WIDTH;
      const ratio = W / size; // 4 tiles per minimap pixel
      const ownerMap = engine.ownerMap;
      const neutralCol = 0xFF224822; // Tactical olive campus turf in ABGR

      for (let my = 0; my < size; my++) {
        const gy = Math.floor(my * ratio);
        const rowOffset = gy * W;
        const myOffset = my * size;

        for (let mx = 0; mx < size; mx++) {
          const gx = Math.floor(mx * ratio);
          const owner = ownerMap[rowOffset + gx];

          if (owner === 0) {
            data32[myOffset + mx] = neutralCol;
          } else {
            const sc = SCHOOL_COLORS[owner] || SCHOOL_COLORS[0];
            data32[myOffset + mx] = (255 << 24) | (sc.rgb[2] << 16) | (sc.rgb[1] << 8) | sc.rgb[0];
          }
        }
      }

      // Render Hồ Đá water basin in offscreen minimap
      const lake = engine.landmarks.find(l => l.landmarkId === 5);
      if (lake) {
        const lx = Math.floor((lake.x / W) * size);
        const ly = Math.floor((lake.y / GRID_CONFIG.HEIGHT) * size);
        const lw = Math.ceil((lake.width / W) * size);
        const lh = Math.ceil((lake.height / GRID_CONFIG.HEIGHT) * size);
        const lakeCol = 0xFF886A00; // #006A88 deep cyan/emerald water in ABGR
        for (let dy = 0; dy < lh; dy++) {
          for (let dx = 0; dx < lw; dx++) {
            const pos = (ly + dy) * size + (lx + dx);
            if (pos >= 0 && pos < size * size && ownerMap[(lake.y + dy * 4) * W + (lake.x + dx * 4)] === 0) {
              data32[pos] = lakeCol;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Render Tactical Road Network on Minimap Offscreen Canvas
      const roads = [
        [[340, 340], [500, 350], [640, 340], [650, 510], [510, 510], [440, 440], [340, 340]],
        [[500, 100], [500, 350], [510, 510], [500, 800], [400, 850]],
        [[800, 150], [746, 235], [800, 500], [850, 850], [650, 700], [500, 800]],
        [[100, 300], [200, 200], [340, 340]],
        [[100, 300], [150, 500], [240, 740], [150, 800], [400, 850], [500, 800]],
        [[440, 440], [388, 588], [500, 800]],
      ];

      ctx.save();
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.75)';
      ctx.lineWidth = 1.3;
      roads.forEach(route => {
        ctx.beginPath();
        const startX = (route[0][0] / W) * size;
        const startY = (route[0][1] / GRID_CONFIG.HEIGHT) * size;
        ctx.moveTo(startX, startY);
        for (let i = 1; i < route.length; i++) {
          const rx = (route[i][0] / W) * size;
          const ry = (route[i][1] / GRID_CONFIG.HEIGHT) * size;
          ctx.lineTo(rx, ry);
        }
        ctx.stroke();
      });
      ctx.restore();

      // Render School Spawn Markers
      engine.schools.forEach(school => {
        const sx = (school.spawnPoint.x / W) * size;
        const sy = (school.spawnPoint.y / GRID_CONFIG.HEIGHT) * size;

        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = school.color;
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
    };

    updateOffscreen();
    const interval = setInterval(updateOffscreen, 300);
    return () => clearInterval(interval);
  }, [engine]);

  // 2. High-performance 60 FPS animation loop: draws offscreen canvas + rotating radar sweep + camera box
  useEffect(() => {
    const canvas = canvasRef.current;
    const off = offscreenCanvasRef.current;
    if (!canvas || !off) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 250;
    const cx = size / 2;
    const cy = size / 2;
    const sweepRadius = Math.SQRT2 * 125; // 177px covers all 4 corners
    const W = GRID_CONFIG.WIDTH;
    const TILE_SIZE = GRID_CONFIG.TILE_SIZE;

    const renderLoop = (time: number) => {
      // Clear & draw cached terrain
      ctx.drawImage(off, 0, 0);

      // Current radar angle (rotates full 360° every 3.2 seconds)
      const sweepAngle = ((time * 0.00196) % (Math.PI * 2));

      // A. Draw Subtle Concentric Radar Distance Rings
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 163, 0.12)';
      ctx.lineWidth = 1;
      [40, 80, 115].forEach(r => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis crosshair lines
      ctx.strokeStyle = 'rgba(0, 255, 163, 0.1)';
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, size);
      ctx.moveTo(0, cy);
      ctx.lineTo(size, cy);
      ctx.stroke();

      // B. Phosphor Trailing Sector (trailing cone of fading green light)
      const sectorSpan = 0.55; // ~31.5 degrees
      const slices = 8;
      for (let i = 0; i < slices; i++) {
        const startAng = sweepAngle - (sectorSpan * (slices - i)) / slices;
        const endAng = sweepAngle - (sectorSpan * (slices - i - 1)) / slices;
        const alpha = ((i + 1) / slices) * 0.16;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, sweepRadius, startAng, endAng);
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 255, 163, ${alpha})`;
        ctx.fill();
      }

      // C. Leading Sharp Radar Sweep Line with phosphor glow
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * sweepRadius, cy + Math.sin(sweepAngle) * sweepRadius);
      ctx.strokeStyle = '#00FFA3';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00FFA3';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.restore();

      // D. Landmarks POIs & Radar Ping Highlights when swept over
      engine.landmarks.forEach((lm: Landmark) => {
        const mx = (lm.x / W) * size;
        const my = (lm.y / GRID_CONFIG.HEIGHT) * size;
        const mw = Math.max(3.5, (lm.width / W) * size);
        const mh = Math.max(3.5, (lm.height / GRID_CONFIG.HEIGHT) * size);

        // Calculate angle from radar center to landmark
        const lAngle = Math.atan2(my - cy, mx - cx);
        const angleDiff = (sweepAngle - lAngle + Math.PI * 2) % (Math.PI * 2);

        // Ping active if landmark is within trailing beam sector
        if (angleDiff >= 0 && angleDiff < 0.55) {
          const pingIntensity = 1.0 - angleDiff / 0.55;
          ctx.save();
          // Expanding ping circle
          ctx.beginPath();
          ctx.arc(mx + mw / 2, my + mh / 2, 4 + (1 - pingIntensity) * 8, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 219, 20, ${pingIntensity * 0.9})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // High-intensity white/gold center flash
          ctx.fillStyle = `rgba(255, 255, 255, ${pingIntensity})`;
          ctx.fillRect(mx - 1, my - 1, mw + 2, mh + 2);
          ctx.restore();
        } else {
          // Standard landmark marker (aqua for Lake Hồ Đá, gold for military buildings)
          ctx.fillStyle = lm.landmarkId === 5 ? '#00E5FF' : '#FADB14';
          ctx.fillRect(mx, my, mw, mh);

          if (lm.currentOwner > 0) {
            ctx.strokeStyle = SCHOOL_COLORS[lm.currentOwner]?.hex || '#00FFA3';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(mx - 1, my - 1, mw + 2, mh + 2);
          }
        }
      });

      // E. Render Camera Viewport Box with glowing border and tactical corner notches
      const { cameraLeft: cL, cameraTop: cT, cameraRight: cR, cameraBottom: cB } = cameraBoundsRef.current;
      const camX1 = Math.max(0, (cL / (W * TILE_SIZE)) * size);
      const camY1 = Math.max(0, (cT / (GRID_CONFIG.HEIGHT * TILE_SIZE)) * size);
      const camX2 = Math.min(size, (cR / (W * TILE_SIZE)) * size);
      const camY2 = Math.min(size, (cB / (GRID_CONFIG.HEIGHT * TILE_SIZE)) * size);
      const camW = Math.max(4, camX2 - camX1);
      const camH = Math.max(4, camY2 - camY1);

      ctx.save();
      // Camera viewport fill
      ctx.fillStyle = 'rgba(0, 255, 163, 0.08)';
      ctx.fillRect(camX1, camY1, camW, camH);

      // Camera border
      ctx.strokeStyle = '#00FFA3';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(camX1, camY1, camW, camH);

      // Tactical corner brackets for camera
      const kLen = Math.min(5, camW / 3, camH / 3);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(camX1, camY1 + kLen);
      ctx.lineTo(camX1, camY1);
      ctx.lineTo(camX1 + kLen, camY1);
      // Top-Right
      ctx.moveTo(camX1 + camW - kLen, camY1);
      ctx.lineTo(camX1 + camW, camY1);
      ctx.lineTo(camX1 + camW, camY1 + kLen);
      // Bottom-Left
      ctx.moveTo(camX1, camY1 + camH - kLen);
      ctx.lineTo(camX1, camY1 + camH);
      ctx.lineTo(camX1 + kLen, camY1 + camH);
      // Bottom-Right
      ctx.moveTo(camX1 + camW - kLen, camY1 + camH);
      ctx.lineTo(camX1 + camW, camY1 + camH);
      ctx.lineTo(camX1 + camW, camY1 + camH - kLen);
      ctx.stroke();

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [engine]);

  return (
    <div className="relative w-[250px] h-[250px] mx-auto bg-[#0D1117] border border-[#30363D] overflow-hidden rounded shadow-2xl group tactical-chamfer">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={250}
        height={250}
        onMouseDown={e => {
          isDraggingRef.current = true;
          handleMinimapInteraction(e);
        }}
        onMouseMove={e => {
          if (isDraggingRef.current) {
            handleMinimapInteraction(e);
          }
        }}
        onMouseUp={() => {
          isDraggingRef.current = false;
        }}
        onMouseLeave={() => {
          isDraggingRef.current = false;
        }}
        className="w-[250px] h-[250px] cursor-crosshair block"
      />

      {/* Sci-fi Overlay Frame Corners */}
      <div className="absolute inset-0 pointer-events-none border border-[#00FFA3]/20" />

      {/* Tactical HUD Coordinates label */}
      <div className="absolute top-1.5 left-1.5 pointer-events-none flex items-center space-x-1.5 font-mono-data text-[9px] text-[#00FFA3] bg-[#0D1117]/85 backdrop-blur px-1.5 py-0.5 rounded border border-[#30363D]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-ping" />
        <span className="font-tactical font-bold tracking-wider">RADAR 1000x1000</span>
      </div>

      <div className="absolute bottom-1.5 right-1.5 pointer-events-none font-mono-data text-[9px] text-[#8B949E] bg-[#0D1117]/85 backdrop-blur px-1.5 py-0.5 rounded border border-[#30363D]">
        CLICK / DRAG TO PAN
      </div>
    </div>
  );
};
