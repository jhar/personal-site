import { Label } from "./parts";

const DIGITS = ["2", "0", "2", "4"];

// A counter about to tick over.
export default function Odometer() {
  return (
    <g>
      {DIGITS.map((d, i) => (
        <g key={i}>
          <rect x={344 + i * 80} y="506" width="72" height={i === 3 ? 190 : 96} rx="6" />
          <Label x={380 + i * 80} y={578} size={64}>{d}</Label>
        </g>
      ))}
      <path d="M584 602 H656" strokeWidth="1.2" />
      <Label x={620} y={674} size={64}>5</Label>
    </g>
  );
}
