import type { RGBA } from './color';

/**
 * One square cell to draw, packed into a Float32Array:
 * centreX, centreY, halfSize, cornerRadius (all CSS px), r, g, b, a (straight
 * alpha, 0..1), glowRadius (CSS px), glowStrength (0..1).
 */
export const QUAD_STRIDE = 10;

export interface QuadList {
  data: Float32Array;
  count: number;
}

export interface FrameStyle {
  background: RGBA;
  /** Film-grain amount, 0..1. Only the WebGL renderer draws it. */
  grain: number;
  /** Frame time in seconds, used to animate grain. */
  time: number;
}

export interface Renderer {
  readonly kind: 'webgl' | 'canvas2d';
  resize(cssWidth: number, cssHeight: number, dpr: number): void;
  render(quads: QuadList, style: FrameStyle): void;
  destroy(): void;
}

export function createQuadList(capacity = 256): QuadList {
  return { data: new Float32Array(capacity * QUAD_STRIDE), count: 0 };
}

export function pushQuad(
  list: QuadList,
  cx: number,
  cy: number,
  half: number,
  radius: number,
  color: RGBA,
  glowPx: number,
  glowAmt: number,
): void {
  if ((list.count + 1) * QUAD_STRIDE > list.data.length) {
    const next = new Float32Array(list.data.length * 2);
    next.set(list.data);
    list.data = next;
  }
  const o = list.count * QUAD_STRIDE;
  const d = list.data;
  d[o] = cx;
  d[o + 1] = cy;
  d[o + 2] = half;
  d[o + 3] = radius;
  d[o + 4] = color[0];
  d[o + 5] = color[1];
  d[o + 6] = color[2];
  d[o + 7] = color[3];
  d[o + 8] = glowPx;
  d[o + 9] = glowAmt;
  list.count++;
}
