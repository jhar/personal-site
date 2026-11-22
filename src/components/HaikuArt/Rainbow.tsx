import { Star } from "./parts";

const ARCS = [120, 150, 180, 210, 240];
const STARS = [[300, 150], [420, 90], [700, 120], [820, 220], [160, 260], [600, 190]];

// A rainbow road rising out of the dark, and the stars you see after a knock.
export default function Rainbow() {
  return (
    <g>
      {ARCS.map((r) => <path key={r} d={`M${500 - r} 700 A${r} ${r} 0 0 1 ${500 + r} 700`} />)}
      {STARS.map(([x, y], i) => <Star key={`${x}-${y}`} x={x} y={y} r={8 + (i % 3) * 3} />)}
    </g>
  );
}
