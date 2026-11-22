const CX = 500;
const CY = 580;

// Cracks running out from the point of impact, each with a kink in it.
const CRACKS = [-170, -140, -105, -75, -40, -10, 25, 160].map((deg, i) => {
  const a = (deg * Math.PI) / 180;
  const b = a + (i % 2 ? 0.12 : -0.1);
  const at = (r: number, t: number) => `${(CX + Math.cos(t) * r).toFixed(1)} ${(CY + Math.sin(t) * r).toFixed(1)}`;
  return `M${at(8, a)} L${at(120, b)} L${at(330 + (i % 3) * 60, a)}`;
});

// The spiral traced through them.
const SPIRAL = Array.from({ length: 90 }, (_, i) => {
  const t = i * 0.22;
  const r = 6 + t * 7.5;
  return `${i ? "L" : "M"}${(CX + Math.cos(t) * r).toFixed(1)} ${(CY + Math.sin(t) * r * 0.8).toFixed(1)}`;
}).join(" ");

// Cracked glass, and a spiral in it.
export default function Glass() {
  return (
    <g strokeLinejoin="round">
      {CRACKS.map((d) => <path key={d} d={d} strokeWidth="1.5" />)}
      <path d={SPIRAL} />
    </g>
  );
}
