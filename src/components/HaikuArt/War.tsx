import { BLACK, Ground, PALE } from "./parts";

// Red, and something heavy in the middle of it.
export default function War() {
  return (
    <>
      <Ground fill="#4A120E" />
      <polygon points="-300,760 1300,380 1300,1000 -300,1000" fill="#B54A3F" />
      <circle cx="400" cy="360" r="270" fill={BLACK} />
      <g fill={BLACK} transform="rotate(-16 500 350)">
        <rect x="-300" y="80" width="1600" height="26" />
        <rect x="-300" y="600" width="1600" height="40" />
      </g>
      <circle cx="790" cy="170" r="38" fill={PALE} />
    </>
  );
}
