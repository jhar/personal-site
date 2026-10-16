/** The seven one-sided tetrominoes. Mirror images (S/Z, J/L) are distinct pieces. */
export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** A grid cell as [column, row], rows growing downward. */
export type Cell = readonly [x: number, y: number];

/** Tetris Guideline colours. Every rotation of a piece shares its piece's colour. */
export const DEFAULT_PIECE_COLORS: Readonly<Record<PieceType, string>> = {
  I: '#00b8d9',
  O: '#f2c200',
  T: '#9b30d9',
  S: '#2fb84a',
  Z: '#e5322d',
  J: '#2457e6',
  L: '#f28c1b',
};

const BASE_SHAPES: Record<PieceType, Cell[]> = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

export interface Orientation {
  piece: PieceType;
  /** Index among this piece's distinct rotations (0..3). */
  rotation: number;
  /** Cells normalised to a top-left origin, sorted in reading order (row, then column). */
  cells: Cell[];
  width: number;
  height: number;
}

function normalise(cells: Cell[]): Cell[] {
  const minX = Math.min(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  return cells
    .map(([x, y]) => [x - minX, y - minY] as const)
    .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}

function computeOrientations(piece: PieceType): Orientation[] {
  const seen = new Set<string>();
  const out: Orientation[] = [];
  let cells = BASE_SHAPES[piece];
  for (let r = 0; r < 4; r++) {
    const norm = normalise(cells);
    const key = norm.map((c) => c.join(',')).join(';');
    if (!seen.has(key)) {
      seen.add(key);
      out.push({
        piece,
        rotation: out.length,
        cells: norm,
        width: Math.max(...norm.map((c) => c[0])) + 1,
        height: Math.max(...norm.map((c) => c[1])) + 1,
      });
    }
    // Rotate 90° clockwise (with y pointing down): (x, y) -> (-y, x)
    cells = cells.map(([x, y]) => [-y, x] as const);
  }
  return out;
}

/** All 19 fixed orientations, grouped by piece in PIECE_TYPES order. */
export const ORIENTATIONS: readonly Orientation[] = PIECE_TYPES.flatMap(computeOrientations);
