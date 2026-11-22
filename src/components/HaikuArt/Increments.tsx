import { BLACK, Ground, PALE, ROSE } from "./parts";

const BARS = Array.from({ length: 13 }, (_, i) => i);

// The same step, again and again, and then the next one.
export default function Increments() {
  return (
    <>
      <Ground fill="#1B1212" />
      <circle cx="210" cy="190" r="110" fill={BLACK} />
      {BARS.map((i) => (
        <rect key={i} x={-50 + i * 86} y={640 - i * 44} width="62" height="900" fill={i === 12 ? ROSE : PALE} />
      ))}
    </>
  );
}
