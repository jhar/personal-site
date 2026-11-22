import { Label } from "./parts";

const WING = "M480 140 C440 100 380 100 330 130 C350 136 360 150 362 168 C380 156 400 158 412 174 C428 160 450 160 478 172";

// A one-eyed bat, and the date.
export default function Bat() {
  return (
    <g>
      <ellipse cx="500" cy="150" rx="22" ry="30" />
      <path d="M484 128 l-4 -22 l16 12 M516 128 l4 -22 l-16 12" />
      <circle cx="500" cy="142" r="10" />
      <circle cx="500" cy="142" r="4" fill="currentColor" stroke="none" />
      <path d={WING} />
      <path d={WING} transform="translate(1000 0) scale(-1 1)" />
      <rect x="440" y="500" width="120" height="124" rx="8" />
      <path d="M440 532 H560 M470 488 V512 M530 488 V512" />
      <Label x={500} y={600} size={56}>12</Label>
    </g>
  );
}
