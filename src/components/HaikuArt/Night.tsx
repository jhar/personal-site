const STARS = [[180, 110], [320, 190], [420, 70], [700, 150], [820, 90], [900, 240], [110, 280], [760, 330]];

// One lit window in a dark skyline.
export default function Night() {
  return (
    <g>
      <path d="M560 70 a60 60 0 1 0 60 90 a48 48 0 1 1 -60 -90 Z" />
      <g fill="currentColor" stroke="none">
        {STARS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2.5" />)}
      </g>
      <path d="M-20 660 V560 H120 V500 H260 V590 H380 V470 H520 V560 H640 V520 H800 V600 H900 V540 H1020 V660" />
      <rect x="436" y="500" width="28" height="34" fill="currentColor" fillOpacity="0.5" />
      <path d="M450 500 V534 M436 517 H464" strokeWidth="1" />
    </g>
  );
}
