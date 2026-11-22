import { Star } from "./parts";

// A Christmas tree, and something watching from beside it.
export default function Demon() {
  return (
    <g>
      <g transform="translate(-70 0)">
        <path d="M500 440 L450 510 H550 Z M500 490 L435 570 H565 Z M500 545 L420 640 H580 Z M490 640 V660 H510 V640" />
        <Star x={500} y={422} r={12} />
      </g>
      <g transform="translate(-124 0)">
        <path d="M690 560 q14 -12 28 0 q-14 8 -28 0 Z M736 560 q14 -12 28 0 q-14 8 -28 0 Z" fill="currentColor" />
        <path d="M688 536 q-14 -26 4 -44 q0 24 14 34 M766 536 q14 -26 -4 -44 q0 24 -14 34" />
      </g>
    </g>
  );
}
