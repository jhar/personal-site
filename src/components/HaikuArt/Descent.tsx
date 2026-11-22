import { Ground } from "./parts";

const STEPS = Array.from({ length: 9 }, (_, i) => i);
const SKY = "#4E9FE8";
const SKY_LIGHT = "#9CCBF5";

// Looking up into a bright sky that keeps opening, toward something warm in the
// middle, with one barely-there line wandering across the way to it.
export default function Descent() {
  return (
    <>
      <Ground fill={SKY} />
      {STEPS.map((i) => {
        const s = 1100 * 0.74 ** i;
        return (
          <rect
            key={i}
            x={500 - s / 2}
            y={330 - s / 2}
            width={s}
            height={s}
            fill={i === 8 ? "#FFD35C" : i % 2 ? SKY : SKY_LIGHT}
            transform={`rotate(${i * 9} 500 330)`}
          />
        );
      })}
      <circle cx="820" cy="150" r="46" fill="#FFE9A8" />
      <path
        d="M-300 610 Q150 480 520 570 T1300 520"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.45"
        strokeWidth="26"
      />
    </>
  );
}
