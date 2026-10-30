import { ORIENTATIONS, type Cell, type PieceType } from './tetrominoes';

/** A polyomino drawn on a cols × rows grid; `cells[y * cols + x]` is 1 when filled. */
export interface Grid {
  cols: number;
  rows: number;
  cells: Uint8Array;
}

export interface Placement {
  piece: PieceType;
  rotation: number;
  /** Top-left of the orientation's bounding box. */
  x: number;
  y: number;
  /** The four covered grid indices, in reading order. */
  indices: [number, number, number, number];
}

export function createGrid(cols: number, rows: number): Grid {
  return { cols, rows, cells: new Uint8Array(cols * rows) };
}

/**
 * Every position and orientation of the seven tetrominoes that lies entirely
 * inside the filled cells of `grid`, ordered by piece, rotation, row, column.
 */
export function enumeratePlacements(grid: Grid): Placement[] {
  const { cols, rows, cells } = grid;
  const out: Placement[] = [];
  for (const o of ORIENTATIONS) {
    for (let y = 0; y + o.height <= rows; y++) {
      for (let x = 0; x + o.width <= cols; x++) {
        const idx = o.cells.map(([cx, cy]) => (y + cy) * cols + (x + cx));
        if (idx.every((i) => cells[i] === 1)) {
          out.push({ piece: o.piece, rotation: o.rotation, x, y, indices: idx as Placement['indices'] });
        }
      }
    }
  }
  return out;
}

/** Small, fast, seedable PRNG (mulberry32). Returns floats in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Grow a random connected polyomino of `size` cells from the grid centre.
 * `compactness` in [0, 1] biases growth towards cells with more filled
 * neighbours, which gives chunkier, more tetromino-friendly shapes.
 */
export function randomPolyomino(
  cols: number,
  rows: number,
  size: number,
  rng: () => number,
  compactness = 0.6,
): Grid {
  const grid = createGrid(cols, rows);
  const total = cols * rows;
  size = Math.max(1, Math.min(size, total));
  const start = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
  grid.cells[start] = 1;
  const frontier = new Set<number>();
  const addNeighbours = (i: number) => {
    for (const n of neighbours(i, cols, rows)) if (!grid.cells[n]) frontier.add(n);
  };
  addNeighbours(start);
  for (let filled = 1; filled < size && frontier.size > 0; filled++) {
    const candidates = [...frontier];
    const weights = candidates.map((i) => {
      let k = 0;
      for (const n of neighbours(i, cols, rows)) k += grid.cells[n];
      return Math.pow(k, compactness * 3);
    });
    let r = rng() * weights.reduce((a, b) => a + b, 0);
    let pick = candidates[candidates.length - 1];
    for (let j = 0; j < candidates.length; j++) {
      r -= weights[j];
      if (r <= 0) {
        pick = candidates[j];
        break;
      }
    }
    grid.cells[pick] = 1;
    frontier.delete(pick);
    addNeighbours(pick);
  }
  return grid;
}

function neighbours(i: number, cols: number, rows: number): number[] {
  const x = i % cols;
  const y = (i - x) / cols;
  const out: number[] = [];
  if (x > 0) out.push(i - 1);
  if (x < cols - 1) out.push(i + 1);
  if (y > 0) out.push(i - cols);
  if (y < rows - 1) out.push(i + cols);
  return out;
}

/**
 * Parse an ASCII picture into cells: `#`, `X` or `1` are filled, anything else
 * is empty. Leading/trailing blank lines are ignored.
 */
export function parseShape(picture: string): Cell[] {
  const lines = picture.replace(/^\s*\n|\n\s*$/g, '').split('\n');
  const cells: Cell[] = [];
  lines.forEach((line, y) => {
    [...line].forEach((ch, x) => {
      if (ch === '#' || ch === 'X' || ch === 'x' || ch === '1') cells.push([x, y]);
    });
  });
  return cells;
}

/** Copy `cells` into a new grid of the given size, centred on their bounding box. */
export function centredGrid(cols: number, rows: number, cells: readonly Cell[]): Grid {
  const grid = createGrid(cols, rows);
  if (cells.length === 0) return grid;
  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX + 1;
  const h = Math.max(...ys) - minY + 1;
  const ox = Math.floor((cols - w) / 2) - minX;
  const oy = Math.floor((rows - h) / 2) - minY;
  for (const [x, y] of cells) {
    const gx = x + ox;
    const gy = y + oy;
    if (gx >= 0 && gy >= 0 && gx < cols && gy < rows) grid.cells[gy * cols + gx] = 1;
  }
  return grid;
}

export function gridToCells(grid: Grid): Cell[] {
  const out: Cell[] = [];
  for (let i = 0; i < grid.cells.length; i++) {
    if (grid.cells[i]) out.push([i % grid.cols, Math.floor(i / grid.cols)]);
  }
  return out;
}
