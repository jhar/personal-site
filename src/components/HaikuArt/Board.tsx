import { BLACK, Ground, PALE, ROSE } from "./parts";

const CELLS = Array.from({ length: 12 }, (_, i) => i - 3);

// A game board running off every edge, and one piece that isn't on a square.
export default function Board() {
  return (
    <>
      <Ground fill="#121A14" />
      <g transform="rotate(-14 500 350)">
        {CELLS.map((r) =>
          CELLS.filter((c) => (r + c) % 2 === 0).map((c) => (
            <rect key={`${r}-${c}`} x={c * 150} y={r * 150 - 100} width="150" height="150" fill="#2C3D30" />
          ))
        )}
      </g>
      <circle cx="270" cy="210" r="62" fill={BLACK} />
      <circle cx="840" cy="330" r="62" fill={BLACK} />
      <circle cx="420" cy="590" r="62" fill={PALE} />
      <circle cx="668" cy="492" r="74" fill={ROSE} />
    </>
  );
}
