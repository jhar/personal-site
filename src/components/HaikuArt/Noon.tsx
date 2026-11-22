const RAYS = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
const SLATS = Array.from({ length: 7 }, (_, i) => 480 + i * 26);

// The sun already high, over half-open blinds.
export default function Noon() {
  return (
    <g>
      <circle cx="500" cy="130" r="60" />
      {RAYS.map((a) => (
        <path
          key={a}
          d={`M${(500 + Math.cos(a) * 80).toFixed(1)} ${(130 + Math.sin(a) * 80).toFixed(1)} L${(500 + Math.cos(a) * 112).toFixed(1)} ${(130 + Math.sin(a) * 112).toFixed(1)}`}
        />
      ))}
      {SLATS.map((y) => <path key={y} d={`M250 ${y} H750`} />)}
      <path d="M250 466 H750 M720 466 V668" strokeWidth="3" />
    </g>
  );
}
