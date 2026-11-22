const FLAKES = [
  [140, 120], [260, 220], [90, 330], [200, 470], [330, 560], [820, 300],
  [900, 430], [760, 520], [620, 600], [450, 90], [480, 520],
];

// A bare branch in falling snow, with one bud on it.
export default function Winter() {
  return (
    <g>
      <path d="M1000 60 C820 90 700 70 560 150 C530 165 500 170 470 200 M760 92 C740 130 700 150 660 190 M660 118 C640 100 620 70 610 40" strokeWidth="3" />
      <path d="M470 200 q-20 2 -24 22 q22 0 24 -22 Z" />
      {FLAKES.map(([x, y]) => (
        <path
          key={`${x}-${y}`}
          d={`M${x - 8} ${y} H${x + 8} M${x - 4} ${y - 7} L${x + 4} ${y + 7} M${x + 4} ${y - 7} L${x - 4} ${y + 7}`}
          strokeWidth="1.5"
        />
      ))}
      <path d="M-20 640 Q250 600 500 630 T1020 610" />
    </g>
  );
}
