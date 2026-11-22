const ROWS = [5, 7, 5];

// Five, seven, five, low on the page: the drawing for a haiku without its own.
export default function Dots() {
  return (
    <g>
      {ROWS.map((count, row) =>
        Array.from({ length: count }, (_, i) => (
          <circle
            key={`${row}-${i}`}
            cx={500 + (i - (count - 1) / 2) * 70}
            cy={410 + row * 86}
            r={20}
          />
        ))
      )}
    </g>
  );
}
