import { Ground, ROSE } from "./parts";

const X = 560;
const Y = 420;
const EDGE = [
  [-300, -300], [260, -300], [700, -300], [1300, -300], [1300, 300], [1300, 1000],
  [620, 1000], [80, 1000], [-300, 1000], [-300, 330],
];
const SHADES = ["#1C262B", "#2B3B43", "#16202A", "#34474F", "#202D33"];
const SPIRAL = Array.from({ length: 18 }, (_, i) => i);

// Shards around a point of impact, and a spiral winding out of it.
export default function Glass() {
  return (
    <>
      <Ground fill="#12181B" />
      {EDGE.map(([x, y], i) => {
        const [nx, ny] = EDGE[(i + 1) % EDGE.length];
        return <polygon key={i} points={`${X},${Y} ${x},${y} ${nx},${ny}`} fill={SHADES[i % SHADES.length]} />;
      })}
      {SPIRAL.map((i) => (
        <circle
          key={i}
          cx={(X + Math.cos(i * 0.6) * (30 + i * 20)).toFixed(1)}
          cy={(Y + Math.sin(i * 0.6) * (30 + i * 20)).toFixed(1)}
          r={6 + i * 2.2}
          fill={ROSE}
        />
      ))}
    </>
  );
}
