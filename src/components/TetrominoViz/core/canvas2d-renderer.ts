import { QUAD_STRIDE, type FrameStyle, type QuadList, type Renderer } from './renderer';

/** Fallback for browsers without WebGL. Same draw list, no grain. */
export class Canvas2DRenderer implements Renderer {
  readonly kind = 'canvas2d' as const;
  private ctx: CanvasRenderingContext2D;
  private width = 1;
  private height = 1;
  private dpr = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('[tetromino-viz] Canvas 2D is not available');
    this.ctx = ctx;
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.width = cssWidth;
    this.height = cssHeight;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(cssWidth * dpr));
    this.canvas.height = Math.max(1, Math.round(cssHeight * dpr));
  }

  render(quads: QuadList, style: FrameStyle): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    const [br, bg, bb, ba] = style.background;
    if (ba > 0) {
      ctx.fillStyle = rgba(br, bg, bb, ba);
      ctx.fillRect(0, 0, this.width, this.height);
    }
    const q = quads.data;
    for (let i = 0; i < quads.count; i++) {
      const o = i * QUAD_STRIDE;
      const half = q[o + 2];
      const color = rgba(q[o + 4], q[o + 5], q[o + 6], q[o + 7]);
      const glowPx = q[o + 8];
      const glowAmt = q[o + 9];
      if (glowPx > 0 && glowAmt > 0) {
        ctx.shadowBlur = glowPx * this.dpr;
        ctx.shadowColor = rgba(q[o + 4], q[o + 5], q[o + 6], q[o + 7] * glowAmt);
      } else {
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      }
      ctx.fillStyle = color;
      const x = q[o] - half;
      const y = q[o + 1] - half;
      const r = Math.min(q[o + 3], half);
      ctx.beginPath();
      if (r > 0.25 && typeof ctx.roundRect === 'function') ctx.roundRect(x, y, half * 2, half * 2, r);
      else ctx.rect(x, y, half * 2, half * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  destroy(): void {}
}

function rgba(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a.toFixed(3)})`;
}
