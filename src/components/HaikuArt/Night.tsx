import { BLACK, Ground } from "./parts";

const COLS = Array.from({ length: 15 }, (_, i) => i);
const ROWS = Array.from({ length: 10 }, (_, i) => i);

// A wall of dark windows with one still lit.
export default function Night() {
  return (
    <>
      <Ground fill="#0F1218" />
      <circle cx="840" cy="90" r="170" fill="#2A3140" />
      {ROWS.map((r) =>
        COLS.map((c) => (
          <rect
            key={`${r}-${c}`}
            x={-22 + c * 72}
            y={-10 + r * 76}
            width="36"
            height="44"
            fill={r === 6 && c === 9 ? "#E0B45A" : BLACK}
          />
        ))
      )}
    </>
  );
}
