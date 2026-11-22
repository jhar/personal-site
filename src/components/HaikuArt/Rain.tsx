const RIPPLES = [
  { x: 470, y: 500, rings: 5 },
  { x: 720, y: 420, rings: 3 },
  { x: 250, y: 400, rings: 3 },
  { x: 610, y: 610, rings: 2 },
];

const DROPS = [
  [120, 60], [210, 150], [300, 40], [380, 190], [450, 90], [540, 30], [600, 170],
  [690, 80], [770, 200], [850, 50], [920, 140], [160, 250], [660, 270], [500, 250],
];

// Rain falling on a pond, each ring running into the next.
export default function Rain() {
  return (
    <g>
      {DROPS.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y} l-8 46`} strokeWidth="1.5" />)}
      {RIPPLES.map(({ x, y, rings }) =>
        Array.from({ length: rings }, (_, i) => (
          <ellipse
            key={`${x}-${i}`}
            cx={x}
            cy={y}
            rx={26 + i * 44}
            ry={7 + i * 12}
            strokeWidth={2 - i * 0.3}
          />
        ))
      )}
    </g>
  );
}
