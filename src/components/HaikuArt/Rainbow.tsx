import { BLACK, Ground, PALE } from "./parts";

const BANDS = ["#B54A3F", "#D99A5B", "#E0B45A", "#8FB58A", "#84A9D2", "#A68AD2"];

// A road of colour swinging up out of the dark.
export default function Rainbow() {
  return (
    <>
      <Ground fill="#101010" />
      <g fill="none" strokeWidth="58">
        {BANDS.map((stroke, i) => <circle key={stroke} cx="-40" cy="800" r={340 + i * 70} stroke={stroke} />)}
      </g>
      <circle cx="790" cy="170" r="130" fill={BLACK} />
      <circle cx="610" cy="70" r="34" fill={BLACK} />
      <circle cx="900" cy="440" r="14" fill={PALE} />
    </>
  );
}
