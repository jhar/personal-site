const LINES = [260, 180, 320, 120, 240];

// Old comments in old logs.
export default function Logs() {
  return (
    <g>
      <path d="M380 150 l22 15 l-22 15 M414 182 h28" strokeWidth="3" />
      {LINES.map((w, i) => {
        const y = 490 + i * 34;
        return (
          <path key={w} d={`M330 ${y + 8} l8 -16 M342 ${y + 8} l8 -16 M364 ${y} H${364 + w}`} />
        );
      })}
      <rect x="616" y="616" width="12" height="20" fill="currentColor" stroke="none" />
    </g>
  );
}
