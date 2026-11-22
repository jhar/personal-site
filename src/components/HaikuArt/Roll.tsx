import { Label } from "./parts";

const STRIP = "C520 600 560 640 640 620 S760 560 840 600 S940 660 1020 630";

// A roll unspooling, and a few questions.
export default function Roll() {
  return (
    <g>
      <Label x={470} y={190} size={90}>?</Label>
      <Label x={560} y={150} size={56}>?</Label>
      <Label x={620} y={120} size={34}>?</Label>
      <ellipse cx="380" cy="520" rx="34" ry="56" />
      <ellipse cx="380" cy="520" rx="12" ry="20" />
      <path d="M380 464 H470 a34 56 0 0 1 0 112 H380" />
      <path d={`M470 576 ${STRIP}`} />
      <path d={`M494 548 ${STRIP}`} transform="translate(0 -28)" strokeWidth="1.5" />
    </g>
  );
}
