const WINDOWS = Array.from({ length: 9 }, (_, i) => 60 + i * 104);

// The moon over dark hills, seen past a row of train windows.
export default function Moon() {
  return (
    <g>
      <circle cx="590" cy="170" r="74" />
      <path d="M546 132 H640 M530 160 H652 M528 188 H650 M546 216 H632" strokeWidth="1.2" />
      {/* Where it has been. */}
      <path d="M40 330 Q300 90 500 150" strokeDasharray="2 16" />
      <path d="M-20 520 Q120 410 260 470 T520 440 T780 480 T1020 430" />
      <path d="M-20 560 Q180 500 360 540 T700 520 T1020 540" strokeWidth="1.5" />
      {WINDOWS.map((x) => <rect key={x} x={x} y="604" width="84" height="56" rx="10" />)}
      <path d="M-20 590 H1020 M-20 676 H1020" strokeWidth="1.5" />
    </g>
  );
}
