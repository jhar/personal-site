import { Ground, PALE, ROSE } from "./parts";

const ROWS = [5, 7, 5];

// Five, seven, five: the background for a haiku without its own.
export default function Dots() {
  return (
    <>
      <Ground fill="#1B1212" />
      {ROWS.map((count, row) =>
        Array.from({ length: count }, (_, i) => (
          <circle
            key={`${row}-${i}`}
            cx={500 + (i - (count - 1) / 2) * 130}
            cy={170 + row * 180}
            r="48"
            fill={row === 1 ? ROSE : PALE}
          />
        ))
      )}
    </>
  );
}
