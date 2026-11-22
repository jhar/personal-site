import { Star } from "./parts";

// A loaded bar on its way down, and the stars after.
export default function Barbell() {
  return (
    <g>
      <path d="M400 110 V80 M500 100 V60 M600 110 V80" strokeWidth="1.5" />
      <path d="M250 180 H750" strokeWidth="4" />
      {[300, 684].map((x) => <rect key={x} x={x} y="125" width="16" height="110" rx="3" />)}
      {[322, 666].map((x) => <rect key={x} x={x} y="140" width="12" height="80" rx="3" />)}
      <ellipse cx="500" cy="560" rx="90" ry="22" strokeDasharray="3 12" />
      <Star x={414} y={552} r={12} />
      <Star x={520} y={538} r={9} />
      <Star x={580} y={572} r={14} />
    </g>
  );
}
