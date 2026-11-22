const GRAINS = [[430, 520], [455, 506], [485, 515], [510, 502], [535, 514], [560, 522], [470, 528], [525, 528]];

// A bowl of rice, a potato, and steam.
export default function Bowl() {
  return (
    <g transform="translate(-40 0)">
      {[460, 500, 540].map((x) => (
        <path key={x} d={`M${x} 470 q-14 -20 0 -40 q14 -20 0 -40`} strokeWidth="1.5" />
      ))}
      <path d="M380 540 H620 C620 610 570 640 500 640 C430 640 380 610 380 540 Z" />
      <path d="M395 540 C420 484 580 484 605 540" />
      {GRAINS.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x} ${y} l10 -4`} strokeWidth="1.5" />)}
      <ellipse cx="672" cy="612" rx="40" ry="27" transform="rotate(-15 672 612)" />
      <g fill="currentColor" stroke="none">
        <circle cx="660" cy="606" r="2.5" />
        <circle cx="684" cy="616" r="2.5" />
        <circle cx="676" cy="598" r="2" />
      </g>
    </g>
  );
}
