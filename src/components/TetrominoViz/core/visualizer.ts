import { Canvas2DRenderer } from './canvas2d-renderer';
import { mixInto, parseColor, type RGBA } from './color';
import { createQuadList, pushQuad, type Renderer } from './renderer';
import {
  centredGrid,
  createGrid,
  createRng,
  enumeratePlacements,
  gridToCells,
  parseShape,
  randomPolyomino,
  shuffle,
  type Grid,
  type Placement,
} from './shape';
import { DEFAULT_PIECE_COLORS, PIECE_TYPES, type Cell, type PieceType } from './tetrominoes';
import { WebGLRenderer } from './webgl-renderer';

export type TransitionEffect = 'fade' | 'pop' | 'sweep' | 'flash' | 'none';
export type Easing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'backOut';
/**
 * - `sequential`: grouped by piece (I, O, T, S, Z, J, L), then rotation, then reading order.
 * - `shuffle`: random order (seeded).
 * - `interleave`: round-robin across pieces so consecutive placements change colour.
 */
export type PlacementOrder = 'sequential' | 'shuffle' | 'interleave';

export interface Theme {
  /** Canvas background. Use `transparent` to let the page show through. */
  background: string;
  /** Cells that are part of the drawn shape. */
  cell: string;
  /** Grid cells outside the shape. Transparent by default (no grid lines). */
  emptyCell: string;
  /** Hover hint under the pointer when `interactive` is on. */
  hoverCell: string;
}

export interface PlacementInfo {
  /** Position in the current play order. */
  index: number;
  total: number;
  /** How many full passes have completed. */
  cycle: number;
  placement: Placement;
}

export interface VisualizerOptions {
  /** Grid size. `auto` fits as many `cellSize` cells as the canvas holds. */
  cols: number | 'auto';
  rows: number | 'auto';
  /** Target cell pitch in CSS px when cols/rows are `auto`. */
  cellSize: number;
  /** Gap between cells as a fraction of the cell pitch. */
  gap: number;
  /** Corner rounding as a fraction of half the cell (0 = square, 1 = circle). */
  cornerRadius: number;
  theme: Partial<Theme>;
  /** Override any piece colour. Rotations always share their piece's colour. */
  colors: Partial<Record<PieceType, string>>;

  effect: TransitionEffect;
  easing: Easing;
  /** Time for a placement to light up. */
  enterMs: number;
  /** Time a placement stays fully lit before the next one starts. */
  holdMs: number;
  /** Fade-out time; values longer than enter+hold leave a trail of earlier placements. */
  exitMs: number;
  /** Scale bump used by `pop` and `sweep`, as a fraction of the cell. */
  popScale: number;
  /** Glow around lit cells, 0..1. */
  glow: number;
  /** Film grain on the WebGL renderer, 0..1. */
  grain: number;
  /** Multiplies the speed of the whole animation. */
  speed: number;

  order: PlacementOrder;
  /** After every placement has been shown: replay, or grow a new random shape. */
  onCycleEnd: 'loop' | 'regenerate';
  autoplay: boolean;
  /** Click/drag to draw and erase cells. */
  interactive: boolean;

  /** `random`, an ASCII picture (`#` = filled) or a list of [x, y] cells. Defaults to the Dekalog glyph. */
  initialShape: 'random' | string | readonly Cell[];
  /**
   * Size the cells so the initial (or last `setShape`) shape spans this
   * fraction of the canvas: its width on a portrait canvas, its height on a
   * landscape one. The grid then fills the rest of the canvas for drawing.
   * 0 turns this off and uses `cellSize` instead.
   */
  shapeScale: number;
  /** Size of random shapes as a fraction of the grid area. */
  randomFill: number;
  /** Bias random shapes towards chunky (1) or stringy (0). */
  compactness: number;
  seed: number;

  renderer: 'auto' | 'webgl' | 'canvas2d';
  /** Swap to a calm, instant transition when the user prefers reduced motion. */
  respectReducedMotion: boolean;

  onPlacementChange?: (info: PlacementInfo) => void;
  onShapeChange?: (info: { cells: Cell[]; placements: number }) => void;
}

/** The glyph from the Dekalog cover, used as the default shape. */
export const DEKALOG_SHAPE = `
.#.
##.
###
.##
.#.
.#.
`;

/** Cream and warm grey, after the Dekalog cover. */
export const DEFAULT_THEME: Theme = {
  background: '#f8f9e3',
  cell: '#55554f',
  emptyCell: 'transparent',
  hoverCell: 'rgba(85, 85, 79, 0.28)',
};

export const DARK_THEME: Theme = {
  background: '#101114',
  cell: '#3a3b40',
  emptyCell: 'rgba(255, 255, 255, 0.025)',
  hoverCell: 'rgba(255, 255, 255, 0.18)',
};

export const DEFAULT_OPTIONS: Readonly<VisualizerOptions> = {
  cols: 'auto',
  rows: 'auto',
  cellSize: 44,
  gap: 0.045,
  cornerRadius: 0,
  theme: {},
  colors: {},
  effect: 'fade',
  easing: 'easeInOut',
  enterMs: 620,
  holdMs: 1000,
  exitMs: 620,
  popScale: 0.14,
  glow: 0,
  grain: 0.12,
  speed: 0.38,
  order: 'shuffle',
  onCycleEnd: 'loop',
  autoplay: true,
  interactive: true,
  initialShape: DEKALOG_SHAPE,
  shapeScale: 0.62,
  randomFill: 0.14,
  compactness: 0.4,
  seed: 0x5eed,
  renderer: 'auto',
  respectReducedMotion: true,
};

const EASINGS: Record<Easing, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t * t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  backOut: (t) => {
    const c = 1.70158;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
};

/** Drop keys set to undefined so they don't clobber defaults. */
function defined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const SWEEP_STAGGER = 0.2;
const WHITE: RGBA = [1, 1, 1, 1];

/**
 * Framework-free visualizer. Give it a canvas sized by CSS; it tracks its own
 * size, device pixel ratio and visibility, and cleans up in `destroy()`.
 */
export class TetrominoVisualizer {
  private opts: VisualizerOptions;
  private renderer: Renderer;
  private grid: Grid = createGrid(1, 1);
  private fill = new Float32Array(1);
  private placements: Placement[] = [];
  private sequence: number[] = [];
  private rng: () => number;

  private theme!: { background: RGBA; cell: RGBA; emptyCell: RGBA; hoverCell: RGBA };
  private pieceColors!: Record<PieceType, RGBA>;

  private cssWidth = 0;
  private cssHeight = 0;
  private pitch = 0;
  private originX = 0;
  private originY = 0;

  private clock = 0;
  private cycleStart = 0;
  private playing: boolean;
  private lastFrame = 0;
  private raf = 0;
  private visible = true;
  private destroyed = false;
  private lastEmitted = -1;
  private elapsed = 0;

  private hover = -1;
  private painting = false;
  private paintValue = 0;
  private lastPaint = -1;
  private editFade = 1;
  private hasShape = false;
  private shapeIsRandom = false;
  /** Bounding box of the shape `shapeScale` sizes against, or null for `cellSize`. */
  private refBox: { w: number; h: number } | null = null;
  private pendingShape: readonly Cell[] | null = null;
  private usesCssVars = false;
  private lastColorCheck = 0;

  private quads = createQuadList();
  private h = new Float32Array(1);
  private hPiece = new Int8Array(1);
  private hScale = new Float32Array(1);
  private hWhite = new Float32Array(1);
  private tmp: RGBA = [0, 0, 0, 0];
  private tmp2: RGBA = [0, 0, 0, 0];
  private litCells: number[] = [];

  private resizeObserver?: ResizeObserver;
  private intersectionObserver?: IntersectionObserver;
  private reducedMotion?: MediaQueryList;
  private cleanup: Array<() => void> = [];

  constructor(private canvas: HTMLCanvasElement, options: Partial<VisualizerOptions> = {}) {
    this.opts = { ...DEFAULT_OPTIONS, ...defined(options) };
    this.rng = createRng(this.opts.seed);
    this.playing = this.opts.autoplay;
    this.renderer = this.createRenderer();
    this.parseColors();
    const init = this.opts.initialShape;
    if (init !== 'random') this.pendingShape = typeof init === 'string' ? parseShape(init) : init;
    this.refBox = this.pendingShape ? boundingBox(this.pendingShape) : null;

    if (typeof matchMedia === 'function') this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.bindEvents();
    this.measure();
    this.start();
  }

  // ---------------------------------------------------------------- public API

  /** Merge new options. Layout, colours and order update live. */
  setOptions(options: Partial<VisualizerOptions>): void {
    const prev = this.opts;
    this.opts = { ...prev, ...defined(options) };
    const o = this.opts;
    if (o.theme !== prev.theme || o.colors !== prev.colors) this.parseColors();
    if (o.seed !== prev.seed) this.rng = createRng(o.seed);
    if (o.cols !== prev.cols || o.rows !== prev.rows || o.cellSize !== prev.cellSize || o.shapeScale !== prev.shapeScale)
      this.measure(true);
    else if (o.order !== prev.order || o.seed !== prev.seed) this.resequence();
    if (o.autoplay !== prev.autoplay) this.playing = o.autoplay;
    if (o.interactive !== prev.interactive) this.canvas.style.touchAction = o.interactive ? 'none' : '';
  }

  getOptions(): Readonly<VisualizerOptions> {
    return this.opts;
  }

  /** Replace the shape with a new random polyomino. */
  randomize(seed?: number): void {
    if (seed !== undefined) this.rng = createRng(seed);
    const { cols, rows } = this.grid;
    const size = Math.max(4, Math.round(cols * rows * this.opts.randomFill));
    this.applyGrid(randomPolyomino(cols, rows, size, this.rng, this.opts.compactness));
    this.shapeIsRandom = true;
  }

  clear(): void {
    this.applyGrid(createGrid(this.grid.cols, this.grid.rows));
  }

  /** Set the shape from [x, y] cells or an ASCII picture; it is centred on the grid. */
  setShape(shape: string | readonly Cell[]): void {
    const cells = typeof shape === 'string' ? parseShape(shape) : shape;
    this.refBox = boundingBox(cells);
    this.pendingShape = cells;
    this.hasShape = false;
    this.measure(true);
  }

  /** Re-read theme colours, e.g. after CSS variables they reference changed. */
  refreshColors(): void {
    this.parseColors();
  }

  getShape(): Cell[] {
    return gridToCells(this.grid);
  }

  getGridSize(): { cols: number; rows: number } {
    return { cols: this.grid.cols, rows: this.grid.rows };
  }

  /** Every placement that fits, in play order. */
  getPlacements(): Placement[] {
    return this.sequence.map((i) => this.placements[i]);
  }

  play(): void {
    this.playing = true;
  }

  pause(): void {
    this.playing = false;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  /** Jump to the next placement. */
  next(): void {
    this.step(1);
  }

  previous(): void {
    this.step(-1);
  }

  get rendererKind(): Renderer['kind'] {
    return this.renderer.kind;
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    for (const fn of this.cleanup) fn();
    this.renderer.destroy();
  }

  // ------------------------------------------------------------------- setup

  private createRenderer(): Renderer {
    if (this.opts.renderer !== 'canvas2d') {
      const gl = WebGLRenderer.create(this.canvas);
      if (gl) return gl;
    }
    return new Canvas2DRenderer(this.canvas);
  }

  private parseColors(): void {
    const t = { ...DEFAULT_THEME, ...this.opts.theme };
    const c = { ...DEFAULT_PIECE_COLORS, ...this.opts.colors };
    this.usesCssVars = [...Object.values(t), ...Object.values(c)].some((v) => v.includes('var('));
    const style = this.usesCssVars ? getComputedStyle(this.canvas) : null;
    const read = (v: string) => cssColor(style ? resolveVars(v, style) : v);
    this.theme = {
      background: read(t.background),
      cell: read(t.cell),
      emptyCell: read(t.emptyCell),
      hoverCell: read(t.hoverCell),
    };
    // A fully transparent colour takes the other's hue so fades don't pass through black.
    if (this.theme.emptyCell[3] === 0) this.theme.emptyCell = [...this.theme.cell.slice(0, 3), 0] as RGBA;
    this.pieceColors = Object.fromEntries(PIECE_TYPES.map((p) => [p, read(c[p])])) as Record<PieceType, RGBA>;
  }

  private bindEvents(): void {
    const c = this.canvas;
    type Events = HTMLElementEventMap & { webglcontextlost: Event; webglcontextrestored: Event };
    const on = <K extends keyof Events>(type: K, fn: (e: Events[K]) => void) => {
      c.addEventListener(type, fn as EventListener);
      this.cleanup.push(() => c.removeEventListener(type, fn as EventListener));
    };
    if (this.opts.interactive) c.style.touchAction = 'none';

    on('pointerdown', (e) => {
      if (!this.opts.interactive || (e.pointerType === 'mouse' && e.button !== 0)) return;
      const i = this.cellAt(e);
      if (i < 0) return;
      e.preventDefault();
      c.setPointerCapture?.(e.pointerId);
      this.painting = true;
      this.paintValue = this.grid.cells[i] ? 0 : 1;
      this.lastPaint = i;
      this.paint(i);
    });
    on('pointermove', (e) => {
      const i = this.cellAt(e);
      this.hover = this.opts.interactive ? i : -1;
      if (this.painting && i >= 0 && i !== this.lastPaint) {
        this.paintLine(this.lastPaint, i);
        this.lastPaint = i;
      }
    });
    const end = () => {
      if (!this.painting) return;
      this.painting = false;
      this.shapeIsRandom = false;
      this.commitShape();
    };
    on('pointerup', end);
    on('pointercancel', end);
    on('pointerleave', () => {
      if (!this.painting) this.hover = -1;
    });

    const onLost = (e: Event) => e.preventDefault();
    const onRestored = () => (this.renderer as WebGLRenderer).init?.();
    on('webglcontextlost', onLost);
    on('webglcontextrestored', onRestored);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.measure());
      this.resizeObserver.observe(c);
    }
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        const vis = entries.some((en) => en.isIntersecting);
        if (vis && !this.visible) {
          this.visible = true;
          this.start();
        } else if (!vis) {
          this.visible = false;
        }
      });
      this.intersectionObserver.observe(c);
    }
  }

  /** Read the canvas size; resize the grid when it is `auto` or options changed. */
  private measure(force = false): void {
    const w = this.canvas.clientWidth || this.canvas.width || 300;
    const h = this.canvas.clientHeight || this.canvas.height || 150;
    const dpr = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 3);
    if (!force && w === this.cssWidth && h === this.cssHeight && this.hasShape) return;
    this.cssWidth = w;
    this.cssHeight = h;
    this.renderer.resize(w, h, dpr);

    const { cols: oc, rows: or, cellSize, shapeScale } = this.opts;
    const box = shapeScale > 0 ? this.refBox : null;
    let cols: number;
    let rows: number;
    if (box) {
      let p = h > w ? (w * shapeScale) / box.w : (h * shapeScale) / box.h;
      p = Math.max(4, Math.min(p, (w * 0.94) / box.w, (h * 0.94) / box.h));
      // Match the shape's parity so it sits exactly in the middle.
      const fit = (avail: number, span: number) => {
        let n = Math.max(span, Math.floor(avail / p));
        if ((n - span) % 2) n -= 1;
        return n;
      };
      cols = oc === 'auto' ? fit(w, box.w) : Math.max(1, Math.floor(oc));
      rows = or === 'auto' ? fit(h, box.h) : Math.max(1, Math.floor(or));
      this.pitch = oc === 'auto' && or === 'auto' ? p : Math.min(w / cols, h / rows);
    } else {
      cols = oc === 'auto' ? Math.max(4, Math.floor(w / cellSize)) : Math.max(1, Math.floor(oc));
      rows = or === 'auto' ? Math.max(4, Math.floor(h / cellSize)) : Math.max(1, Math.floor(or));
      this.pitch = Math.min(w / cols, h / rows);
    }
    this.originX = (w - this.pitch * cols) / 2;
    this.originY = (h - this.pitch * rows) / 2;

    if (!this.hasShape) {
      const pending = this.pendingShape;
      this.pendingShape = null;
      if (pending) {
        this.applyGrid(centredGrid(cols, rows, pending));
      } else {
        this.grid = createGrid(cols, rows);
        this.randomize();
      }
    } else if (cols !== this.grid.cols || rows !== this.grid.rows) {
      const cells = gridToCells(this.grid);
      const areaChange = (cols * rows) / (this.grid.cols * this.grid.rows);
      const next = centredGrid(cols, rows, cells);
      const clipped = next.cells.reduce((a, b) => a + b, 0) < cells.length;
      const wasRandom = this.shapeIsRandom;
      if (wasRandom && (clipped || areaChange > 1.3 || areaChange < 0.7)) {
        // A generated shape is re-grown to suit the new size; drawn shapes are kept.
        this.grid = createGrid(cols, rows);
        this.randomize();
      } else {
        this.applyGrid(next, false);
        this.shapeIsRandom = wasRandom;
      }
      this.fill.set(this.grid.cells);
    }
    if (!this.raf) this.frame(performance.now(), true);
  }

  // ------------------------------------------------------------------ shapes

  private applyGrid(grid: Grid, restart = true): void {
    this.shapeIsRandom = false;
    const resized = grid.cols !== this.grid.cols || grid.rows !== this.grid.rows;
    this.grid = grid;
    this.hasShape = true;
    if (resized || this.fill.length !== grid.cells.length) {
      const n = grid.cells.length;
      this.fill = new Float32Array(n);
      this.h = new Float32Array(n);
      this.hPiece = new Int8Array(n);
      this.hScale = new Float32Array(n);
      this.hWhite = new Float32Array(n);
      this.hover = -1;
    }
    this.commitShape(restart);
  }

  private commitShape(restart = true): void {
    this.placements = enumeratePlacements(this.grid);
    this.resequence(restart);
    this.opts.onShapeChange?.({ cells: gridToCells(this.grid), placements: this.placements.length });
  }

  private resequence(restart = true): void {
    const idx = this.placements.map((_, i) => i);
    const { order } = this.opts;
    if (order === 'shuffle') {
      shuffle(idx, this.rng);
    } else if (order === 'interleave') {
      const groups = PIECE_TYPES.map((p) => idx.filter((i) => this.placements[i].piece === p));
      const out: number[] = [];
      for (let k = 0; out.length < idx.length; k++) {
        for (const g of groups) if (k < g.length) out.push(g[k]);
      }
      idx.splice(0, idx.length, ...out);
    }
    this.sequence = idx;
    if (restart) {
      // A short pause lets a freshly drawn or regenerated shape settle first.
      this.cycleStart = this.clock + 250;
      this.lastEmitted = -1;
    }
  }

  private paint(i: number): void {
    if (this.grid.cells[i] === this.paintValue) return;
    this.grid.cells[i] = this.paintValue;
  }

  private paintLine(from: number, to: number): void {
    const cols = this.grid.cols;
    let x0 = from % cols;
    let y0 = Math.floor(from / cols);
    const x1 = to % cols;
    const y1 = Math.floor(to / cols);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.paint(y0 * cols + x0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  private cellAt(e: PointerEvent): number {
    const rect = this.canvas.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * this.cssWidth;
    const py = ((e.clientY - rect.top) / rect.height) * this.cssHeight;
    const gx = Math.floor((px - this.originX) / this.pitch);
    const gy = Math.floor((py - this.originY) / this.pitch);
    if (gx < 0 || gy < 0 || gx >= this.grid.cols || gy >= this.grid.rows) return -1;
    return gy * this.grid.cols + gx;
  }

  // --------------------------------------------------------------- animation

  private timing() {
    const o = this.opts;
    const reduced = o.respectReducedMotion && this.reducedMotion?.matches;
    const enter = reduced ? 0 : Math.max(0, o.enterMs);
    const hold = reduced ? Math.max(900, o.holdMs) : Math.max(0, o.holdMs);
    const exit = reduced ? 0 : Math.max(0, o.exitMs);
    return { enter, hold, exit, period: Math.max(16, enter + hold), effect: reduced ? 'none' : o.effect };
  }

  private step(dir: number): void {
    const n = this.sequence.length;
    if (!n) return;
    const { period } = this.timing();
    const t = this.clock - this.cycleStart;
    const cur = Math.max(0, Math.floor(t / period));
    const target = Math.max(0, cur + dir);
    // Land just after the target's enter phase so it shows fully lit.
    this.cycleStart = this.clock - target * period - this.timing().enter;
  }

  private start(): void {
    if (this.destroyed || this.raf) return;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = (now: number) => {
    this.raf = 0;
    if (this.destroyed || !this.visible) return;
    this.frame(now);
    this.raf = requestAnimationFrame(this.loop);
  };

  private frame(now: number, renderOnly = false): void {
    const dt = renderOnly ? 0 : Math.min(100, now - this.lastFrame);
    this.lastFrame = now;
    this.elapsed += dt;
    if (!renderOnly) this.update(dt);
    this.draw();
  }

  private update(dt: number): void {
    const n = this.sequence.length;
    if (this.playing && !this.painting && n > 0) this.clock += dt * this.opts.speed;
    // Theme colours given as CSS variables follow the page (e.g. a dark-mode switch).
    if (this.usesCssVars && this.elapsed - this.lastColorCheck > 250) {
      this.lastColorCheck = this.elapsed;
      this.parseColors();
    }

    // Ease highlights out while drawing, and cells in/out as they change.
    const fadeTarget = this.painting ? 0 : 1;
    this.editFade += (fadeTarget - this.editFade) * (1 - Math.exp(-dt / 90));
    const k = 1 - Math.exp(-dt / 70);
    const cells = this.grid.cells;
    for (let i = 0; i < cells.length; i++) this.fill[i] += (cells[i] - this.fill[i]) * k;

    const { period, exit, hold } = this.timing();
    const t = this.clock - this.cycleStart;
    if (n > 0 && t >= 0) {
      const cur = Math.floor(t / period);
      if (this.opts.onCycleEnd === 'regenerate' && t >= n * period + exit + hold) {
        this.randomize();
        return;
      }
      if (cur !== this.lastEmitted && (this.opts.onCycleEnd === 'loop' || cur < n)) {
        this.lastEmitted = cur;
        this.opts.onPlacementChange?.({
          index: cur % n,
          total: n,
          cycle: Math.floor(cur / n),
          placement: this.placements[this.sequence[cur % n]],
        });
      }
    }
  }

  private computeHighlights(): void {
    this.h.fill(0);
    this.hScale.fill(1);
    this.hWhite.fill(0);
    const n = this.sequence.length;
    if (!n) return;
    const { enter, exit, period, effect } = this.timing();
    const ease = EASINGS[this.opts.easing] ?? EASINGS.easeOut;
    const pop = this.opts.popScale;
    const t = this.clock - this.cycleStart;
    if (t < 0) return;
    const life = period + exit;
    const iMax = Math.floor(t / period);
    const iMin = Math.max(0, Math.floor((t - life) / period));
    const loop = this.opts.onCycleEnd === 'loop';

    for (let i = iMin; i <= iMax; i++) {
      if (!loop && i >= n) break;
      const local = t - i * period;
      if (local >= life) continue;
      const p = this.placements[this.sequence[i % n]];
      const pieceIdx = PIECE_TYPES.indexOf(p.piece);
      const enterP = enter > 0 ? clamp01(local / enter) : 1;
      const exitP = exit > 0 ? clamp01((local - period) / exit) : local >= period ? 1 : 0;

      for (let k = 0; k < 4; k++) {
        let h = 0;
        let scale = 1;
        let white = 0;
        let outP = exitP;
        switch (effect) {
          case 'none':
            h = 1;
            break;
          case 'fade':
            h = ease(enterP);
            break;
          case 'pop': {
            const e = ease(enterP);
            h = Math.min(1, enterP * 3);
            scale = 1 + pop * Math.sin(Math.PI * clamp01(e));
            break;
          }
          case 'sweep': {
            const span = 1 - 3 * SWEEP_STAGGER;
            const e = ease(clamp01((enterP - k * SWEEP_STAGGER) / span));
            h = e;
            scale = 1 + pop * 0.6 * Math.sin(Math.PI * clamp01(e));
            outP = clamp01((exitP - k * SWEEP_STAGGER) / span);
            break;
          }
          case 'flash':
            h = Math.min(1, enterP * 4);
            white = 1 - ease(enterP);
            break;
        }
        h *= effect === 'none' ? (outP >= 1 ? 0 : 1) : 1 - EASINGS.easeInOut(outP);
        const cell = p.indices[k];
        if (h > this.h[cell]) {
          this.h[cell] = h;
          this.hPiece[cell] = pieceIdx;
          this.hScale[cell] = scale;
          this.hWhite[cell] = white;
        }
      }
    }
  }

  private draw(): void {
    this.computeHighlights();
    const th = this.theme;
    const inner = this.pitch * (1 - Math.min(0.9, Math.max(0, this.opts.gap)));
    const radiusFrac = clamp01(this.opts.cornerRadius);
    const glow = clamp01(this.opts.glow);
    const glowPx = glow * this.pitch * 0.6;
    const q = this.quads;
    q.count = 0;
    const base = this.tmp;
    const lit = this.tmp2;
    const litCells = this.litCells;
    litCells.length = 0;

    // Two passes so lit cells, which can scale past their slot, draw on top.
    for (let pass = 0; pass < 2; pass++) {
      const count = pass === 0 ? this.fill.length : litCells.length;
      for (let j = 0; j < count; j++) {
        const i = pass === 0 ? j : litCells[j];
        const h = this.h[i] * this.editFade * this.fill[i];
        if (pass === 0 && h > 0.001) {
          litCells.push(i);
          continue;
        }
        this.drawCell(i, h, base, lit, inner, radiusFrac, glow, glowPx);
      }
    }
    this.renderer.render(q, { background: th.background, grain: this.opts.grain, time: this.elapsed / 1000 });
  }

  private drawCell(
    i: number,
    h: number,
    base: RGBA,
    lit: RGBA,
    inner: number,
    radiusFrac: number,
    glow: number,
    glowPx: number,
  ): void {
    const th = this.theme;
    const pitch = this.pitch;
    const cols = this.grid.cols;
    const f = this.fill[i];
    mixInto(base, th.emptyCell, th.cell, f);
    if (i === this.hover && this.opts.interactive) {
      // Preview what a click would do: fill an empty cell, clear a filled one.
      if (this.grid.cells[i]) mixInto(base, base, th.hoverCell, 0.6);
      else mixInto(base, base, th.hoverCell, 1);
    }
    let half = inner / 2;
    let glowAmt = 0;
    if (h > 0.001) {
      const pc = this.pieceColors[PIECE_TYPES[this.hPiece[i]]];
      mixInto(lit, pc, WHITE, this.hWhite[i]);
      mixInto(base, base, lit, h);
      half *= 1 + (this.hScale[i] - 1) * this.editFade;
      glowAmt = glow * h;
    }
    if (base[3] < 0.003 && glowAmt === 0) return;
    const x = i % cols;
    const y = (i - x) / cols;
    pushQuad(
      this.quads,
      this.originX + (x + 0.5) * pitch,
      this.originY + (y + 0.5) * pitch,
      half,
      half * radiusFrac,
      base,
      glowAmt > 0 ? glowPx : 0,
      glowAmt,
    );
  }
}

function boundingBox(cells: readonly Cell[]): { w: number; h: number } | null {
  if (!cells.length) return null;
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  return { w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1 };
}

/** Replace `var(--name, fallback)` with the custom property's computed value. */
function resolveVars(value: string, style: CSSStyleDeclaration): string {
  for (let i = 0; i < 8 && value.includes('var('); i++) {
    value = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name: string, fb?: string) => {
      return style.getPropertyValue(name).trim() || (fb ?? '').trim() || 'transparent';
    });
  }
  return value;
}

let probe: CanvasRenderingContext2D | null | undefined;

/** Parse any CSS colour. Simple forms are parsed directly; others go through a 1×1 canvas. */
function cssColor(value: string): RGBA {
  const v = value.trim().toLowerCase();
  if (v === 'transparent' || v.startsWith('#') || v.startsWith('rgb')) return parseColor(v);
  if (probe === undefined) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    probe = c.getContext('2d', { willReadFrequently: true });
  }
  if (!probe) return parseColor(v);
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000';
  probe.fillStyle = v;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return a ? [r / 255, g / 255, b / 255, a / 255] : [0, 0, 0, 0];
}
