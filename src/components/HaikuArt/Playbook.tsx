const XS = [[360, 500], [440, 480], [520, 500], [600, 480]];
const OS = [[380, 600], [460, 620], [540, 600], [620, 620]];

// Somebody else's game plan.
export default function Playbook() {
  return (
    <g>
      {XS.map(([x, y]) => (
        <path key={x} d={`M${x - 12} ${y - 12} L${x + 12} ${y + 12} M${x + 12} ${y - 12} L${x - 12} ${y + 12}`} />
      ))}
      {OS.map(([x, y]) => <circle key={x} cx={x} cy={y} r="14" />)}
      <path d="M380 584 C380 550 410 544 424 520 l-14 4 M424 520 l2 14" />
      <path d="M540 584 C540 560 500 550 496 526 l-8 12 M496 526 l12 8" />
      <path d="M634 606 C670 570 650 530 660 500 l-12 8 M660 500 l6 14" strokeDasharray="8 8" />
      <path d="M300 440 H700 M300 660 H700" strokeWidth="1.2" />
    </g>
  );
}
