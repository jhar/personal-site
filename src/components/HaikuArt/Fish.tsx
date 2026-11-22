import { Waves } from "./parts";

// A fish under the surface.
export default function Fish() {
  return (
    <g>
      <Waves rows={[150, 190]} />
      <path d="M400 540 C450 490 560 490 620 540 C560 590 450 590 400 540 Z M620 540 L680 500 L668 540 L680 580 Z" />
      <path d="M480 518 q14 22 0 44" />
      <circle cx="445" cy="532" r="5" fill="currentColor" stroke="none" />
      <circle cx="390" cy="480" r="8" />
      <circle cx="370" cy="440" r="5" />
      <circle cx="385" cy="404" r="3" />
      <path d="M180 660 C160 600 200 560 180 500 M220 660 C240 610 210 590 226 540 M800 660 C820 600 780 570 800 510" />
    </g>
  );
}
