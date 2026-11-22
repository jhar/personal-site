import { BLACK, Ground } from "./parts";

const DRIFT = [
  [190, 640, 190, "#2A2440"], [430, 510, 130, "#3A3260"], [615, 385, 90, "#A68AD2"],
  [745, 272, 60, "#D9D9D9"], [835, 182, 38, "#A68AD2"], [898, 112, 22, "#D9D9D9"], [940, 62, 11, "#A68AD2"],
] as const;

// Thoughts getting smaller as they float off.
export default function Sleep() {
  return (
    <>
      <Ground fill="#17141F" />
      <circle cx="130" cy="150" r="100" fill={BLACK} />
      {DRIFT.map(([cx, cy, r, fill]) => <circle key={cx} cx={cx} cy={cy} r={r} fill={fill} />)}
    </>
  );
}
