const DEPTHS = [1, 0.72, 0.5, 0.33, 0.2, 0.1];

// A room that keeps going down, seen from behind a counter.
export default function Counter() {
  return (
    <g>
      <g strokeWidth="1.2">
        {DEPTHS.map((k) => (
          <rect key={k} x={500 - 450 * k} y={330 - 300 * k} width={900 * k} height={600 * k} />
        ))}
        <path d="M50 30 L455 300 M950 30 L545 300 M50 630 L455 360 M950 630 L545 360" />
      </g>
      <path d="M150 700 V600 H850 V700" strokeWidth="4" />
    </g>
  );
}
