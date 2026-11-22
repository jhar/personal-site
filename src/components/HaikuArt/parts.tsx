// Pieces the backgrounds share. Every background is a 1000x700 scene that is
// scaled to cover the screen, so shapes run past the edges on purpose.

export const PALE = "#D9D9D9";
export const ROSE = "#D28484";
export const OCHRE = "#D2B184";
export const BLACK = "#000000";

export function Ground({ fill }: { fill: string }) {
  return <rect x="-300" y="-300" width="1600" height="1300" fill={fill} />;
}

// Full-width bars, like the ones behind /scratch.
export function Bars({ from, to, step, height, fill, tilt = 0.3 }: {
  from: number;
  to: number;
  step: number;
  height: number;
  fill: string;
  tilt?: number;
}) {
  const ys = [];
  for (let y = from; y <= to; y += step) ys.push(y);
  return (
    <g fill={fill} transform={`rotate(${tilt} 500 350)`}>
      {ys.map((y) => <rect key={y} x="-300" y={y} width="1600" height={height} />)}
    </g>
  );
}

// Everything below a rolling edge.
export function Swell({ y, rise, length, fill }: { y: number; rise: number; length: number; fill: string }) {
  const half = length / 2;
  const waves = Math.ceil(1400 / length);
  return (
    <path
      d={`M-200 ${y} q${half / 2} ${-rise} ${half} 0 ${`t${half} 0 `.repeat(waves * 2)}V900 H-200 Z`}
      fill={fill}
    />
  );
}
