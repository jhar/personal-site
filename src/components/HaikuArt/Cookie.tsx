const CHIPS = [[470, 540], [505, 575], [455, 590], [520, 610], [490, 520], [540, 560]];

// A cookie, one bite in.
export default function Cookie() {
  return (
    <g>
      <path d="M500 490 a70 70 0 1 0 66 46 a24 24 0 0 1 -30 -26 a24 24 0 0 1 -36 -20 Z" />
      <g fill="currentColor" stroke="none">
        {CHIPS.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="5" />)}
        <circle cx="590" cy="500" r="3" />
        <circle cx="612" cy="524" r="2" />
        <circle cx="574" cy="478" r="2" />
      </g>
    </g>
  );
}
