import { BLACK, Ground, OCHRE, PALE } from "./parts";

const RINGS = [640, 540, 450, 370, 300, 235, 180, 130, 88, 50];

// Rings closing in on a hole.
export default function Drain() {
  return (
    <>
      <Ground fill="#1B1612" />
      {RINGS.map((r, i) => (
        <circle key={r} cx="580" cy="410" r={r} fill={i === 4 ? OCHRE : i % 2 ? "#1B1612" : "#33281C"} />
      ))}
      <circle cx="580" cy="410" r="20" fill={BLACK} />
      <circle cx="220" cy="150" r="28" fill={PALE} />
    </>
  );
}
