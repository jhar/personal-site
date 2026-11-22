const WING = "M454 540 C400 500 360 510 330 480 C340 530 370 550 400 556 C380 566 372 580 370 596 C400 590 430 580 454 570";

// A bottle of sauce with wings.
export default function Sauce() {
  return (
    <g>
      <rect x="480" y="452" width="40" height="18" rx="3" />
      <path d="M484 470 h32 v30 q30 14 30 50 v80 q0 14 -14 14 h-64 q-14 0 -14 -14 v-80 q0 -36 30 -50 Z" />
      <rect x="466" y="566" width="68" height="44" />
      <path d={WING} />
      <path d={WING} transform="translate(1000 0) scale(-1 1)" />
    </g>
  );
}
