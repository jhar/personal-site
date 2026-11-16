// Skull and crossbones, about 30px across, centred on (x, y). White with a dark
// outline, so it stands out on any of the game's (always dark) backgrounds.
export default function Skull({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  const bone = { stroke: "#f5f5f5", strokeWidth: 4, strokeLinecap: "round" as const };
  const outline = { stroke: "#111", strokeWidth: 6.5, strokeLinecap: "round" as const };
  const dark = "#111";
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity} data-snek="skull">
      {/* Crossbones, behind the skull. */}
      <path d="M-13 1 L13 14 M13 1 L-13 14" fill="none" {...outline} />
      <path d="M-13 1 L13 14 M13 1 L-13 14" fill="none" {...bone} />
      {/* Skull: cranium and jaw. */}
      <path
        d="M0 -14 a10 10 0 0 1 10 10 c0 4 -2 6 -4 7 v5 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2 v-5 c-2 -1 -4 -3 -4 -7 a10 10 0 0 1 10 -10 z"
        fill="#f5f5f5"
        stroke={dark}
        strokeWidth={1.5}
      />
      <circle cx={-4} cy={-4} r={2.8} fill={dark} />
      <circle cx={4} cy={-4} r={2.8} fill={dark} />
      <path d="M0 -1 l-1.6 3 h3.2 z" fill={dark} />
      <path d="M-2.5 5 v4 M0 5 v4 M2.5 5 v4" stroke={dark} strokeWidth={1} />
    </g>
  );
}
