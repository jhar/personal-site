const FLAMES = [420, 452, 484, 516, 548, 580];

// A lit burner, and something in the air.
export default function Gas() {
  return (
    <g>
      {[430, 500, 570].map((x) => (
        <path key={x} d={`M${x} 220 q-16 -22 0 -44 q16 -22 0 -44 q-16 -22 0 -44`} strokeWidth="1.5" />
      ))}
      {FLAMES.map((x) => <path key={x} d={`M${x} 592 q-12 -20 0 -42 q12 22 0 42 Z`} />)}
      <ellipse cx="500" cy="604" rx="104" ry="20" />
      <path d="M380 640 H620 M440 640 V660 M560 640 V660" strokeWidth="3" />
    </g>
  );
}
