import { BLACK, Ground, ROSE } from "./parts";

const STEPS = Array.from({ length: 9 }, (_, i) => i);

// Rooms inside rooms, turning as they go down, behind a counter.
export default function Descent() {
  return (
    <>
      <Ground fill="#14121B" />
      {STEPS.map((i) => {
        const s = 1100 * 0.74 ** i;
        return (
          <rect
            key={i}
            x={500 - s / 2}
            y={330 - s / 2}
            width={s}
            height={s}
            fill={i === 8 ? ROSE : i % 2 ? "#14121B" : "#2D2647"}
            transform={`rotate(${i * 9} 500 330)`}
          />
        );
      })}
      <rect x="-300" y="596" width="1600" height="400" fill={BLACK} />
    </>
  );
}
