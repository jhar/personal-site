/** Linear RGBA in [0, 1]. */
export type RGBA = [number, number, number, number];

/**
 * Parse `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()` or
 * `transparent`. Unknown strings fall back to opaque magenta so mistakes show.
 */
export function parseColor(input: string): RGBA {
  const s = input.trim().toLowerCase();
  if (s === 'transparent') return [0, 0, 0, 0];
  if (s.startsWith('#')) {
    let hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('');
    if (hex.length === 6) hex += 'ff';
    if (hex.length === 8 && /^[0-9a-f]+$/.test(hex)) {
      const n = (i: number) => parseInt(hex.slice(i, i + 2), 16) / 255;
      return [n(0), n(2), n(4), n(6)];
    }
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    const ch = (v: string) => (v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v) / 255);
    const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return [ch(parts[0]), ch(parts[1]), ch(parts[2]), a];
  }
  return [1, 0, 1, 1];
}

export function mixInto(out: RGBA, a: RGBA, b: RGBA, t: number): RGBA {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
  out[3] = a[3] + (b[3] - a[3]) * t;
  return out;
}
