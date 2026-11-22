// Small pieces the drawings share.

export function Star({ x, y, r = 10 }: { x: number; y: number; r?: number }) {
  const s = r * 0.3;
  return (
    <path
      d={`M${x} ${y - r} L${x + s} ${y - s} L${x + r} ${y} L${x + s} ${y + s} L${x} ${y + r} L${x - s} ${y + s} L${x - r} ${y} L${x - s} ${y - s} Z`}
    />
  );
}

// A cloud about 265 wide and 140 tall, with its top left corner near x, y.
export function Cloud({ x = 375, y = 50 }: { x?: number; y?: number }) {
  return (
    <path
      d="M35 140 H225 a40 40 0 0 0 0 -80 a60 60 0 0 0 -110 -30 a50 50 0 0 0 -80 40 a35 35 0 0 0 0 70 Z"
      transform={`translate(${x} ${y})`}
    />
  );
}

// Rows of waves across the whole width.
export function Waves({ rows }: { rows: number[] }) {
  return (
    <>
      {rows.map((y) => <path key={y} d={`M-20 ${y} q40 -22 80 0 ${"t80 0 ".repeat(13)}`} />)}
    </>
  );
}

export function Label({ x, y, size, children }: { x: number; y: number; size: number; children: string }) {
  return (
    <text
      fill="currentColor"
      fontFamily="Georgia, serif"
      fontSize={size}
      stroke="none"
      textAnchor="middle"
      x={x}
      y={y}
    >
      {children}
    </text>
  );
}
