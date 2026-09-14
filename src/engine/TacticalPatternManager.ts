import { Texture } from 'pixi.js';

/**
 * Creates high-tech tactical patterns:
 * 1. Seamless Hexagonal & Circuit Line Hologram Pattern
 * 2. Procedural Dynamic Fog of War Noise Buffer
 */
export class TacticalPatternManager {
  private circuitCanvas: HTMLCanvasElement;
  public circuitTexture: Texture;

  private fogCanvas: HTMLCanvasElement;
  private fogCtx: CanvasRenderingContext2D;
  public fogTexture: Texture;

  constructor() {
    // 1. Create 128x128 Seamless Circuit & Hex Pattern
    this.circuitCanvas = document.createElement('canvas');
    this.circuitCanvas.width = 128;
    this.circuitCanvas.height = 128;
    this.drawCircuitPattern(this.circuitCanvas);
    this.circuitTexture = Texture.from(this.circuitCanvas);

    // 2. Create 256x256 Dynamic Fog of War Canvas
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.width = 256;
    this.fogCanvas.height = 256;
    this.fogCtx = this.fogCanvas.getContext('2d', { willReadFrequently: true })!;
    this.drawFogFrame(0);
    this.fogTexture = Texture.from(this.fogCanvas);
  }

  private drawCircuitPattern(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 128, 128);

    // Micro grid dots
    ctx.fillStyle = 'rgba(0, 255, 163, 0.12)';
    for (let y = 8; y < 128; y += 16) {
      for (let x = 8; x < 128; x += 16) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // High-tech circuit traces
    ctx.strokeStyle = 'rgba(0, 255, 163, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    // Circuit Line 1
    ctx.moveTo(0, 32);
    ctx.lineTo(40, 32);
    ctx.lineTo(56, 48);
    ctx.lineTo(128, 48);

    // Circuit Line 2
    ctx.moveTo(32, 0);
    ctx.lineTo(32, 24);
    ctx.lineTo(48, 40);
    ctx.lineTo(48, 96);
    ctx.lineTo(64, 112);
    ctx.lineTo(128, 112);

    // Circuit Line 3
    ctx.moveTo(0, 80);
    ctx.lineTo(24, 80);
    ctx.lineTo(40, 96);
    ctx.lineTo(80, 96);
    ctx.lineTo(96, 80);
    ctx.lineTo(128, 80);

    ctx.stroke();

    // Circuit Nodes / Microchips
    ctx.fillStyle = 'rgba(0, 255, 163, 0.3)';
    ctx.fillRect(38, 30, 4, 4);
    ctx.fillRect(54, 46, 4, 4);
    ctx.fillRect(46, 94, 4, 4);
    ctx.fillRect(94, 78, 4, 4);

    // Subtle Hexagonal Center Overlay
    ctx.strokeStyle = 'rgba(88, 166, 255, 0.12)';
    ctx.beginPath();
    const cx = 96, cy = 24, r = 16;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = cx + r * Math.cos(angle);
      const hy = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /**
   * Generates procedural rolling mist / dynamic fog
   */
  public updateFog(timeSec: number) {
    this.drawFogFrame(timeSec);
    this.fogTexture.source.update();
  }

  private drawFogFrame(t: number) {
    const ctx = this.fogCtx;
    const w = 256;
    const h = 256;
    const imgData = ctx.createImageData(w, h);
    const d = imgData.data;

    // Fast 2D smooth noise simulation for misty rolling fog
    const tShift = t * 0.4;
    for (let y = 0; y < h; y++) {
      const ny = y * 0.035 + tShift * 0.2;
      const row = y * w * 4;

      for (let x = 0; x < w; x++) {
        const nx = x * 0.035 + tShift * 0.3;
        // Two-octave sine interference
        const v = Math.sin(nx) * Math.cos(ny) + Math.sin(nx * 2.3 + ny * 1.5) * 0.5;
        const normalized = (v + 1.5) / 3.0; // 0..1
        const alpha = Math.floor(normalized * 50); // subtle mist (max 50/255)

        const idx = row + x * 4;
        d[idx] = 16;     // R
        d[idx + 1] = 24; // G
        d[idx + 2] = 36; // B
        d[idx + 3] = alpha;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }
}
