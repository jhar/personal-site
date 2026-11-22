const WIRES = [100, 140, 185];

// A crow on a sagging wire, between two poles.
export default function Crow() {
  return (
    <g>
      {[250, 760].map((x) => (
        <g key={x}>
          <path d={`M${x} 60 V700`} strokeWidth="5" />
          <path d={`M${x - 46} 92 H${x + 46} M${x - 34} 132 H${x + 34}`} strokeWidth="4" />
        </g>
      ))}
      {WIRES.map((y, i) => (
        // The lowest wire dips toward the crow instead of the middle of the span.
        <path
          key={y}
          d={`M-40 ${y + 30} Q105 ${y + 46} 250 ${y} Q${i === 2 ? 600 : 505} ${y + (i === 2 ? 100 : 70)} 760 ${y} Q900 ${y + 46} 1040 ${y + 30}`}
        />
      ))}
      <g fill="currentColor" stroke="none" transform="translate(600 219)">
        <path d="M-34 4 C-30 -14 -10 -26 8 -24 C12 -34 24 -38 32 -30 L46 -26 L32 -22 C30 -8 20 2 4 4 L-22 6 L-52 22 L-40 6 Z" />
      </g>
      <path d="M594 223 V233 M606 223 V233" />
      {/* Low cloud. */}
      <path d="M90 420 H330 M150 446 H420 M640 430 H930 M700 456 H880" strokeWidth="1.5" />
    </g>
  );
}
