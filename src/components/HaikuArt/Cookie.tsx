import { Ground, ROSE } from "./parts";

const CHIPS = [[400, 300, 40], [560, 470, 55], [640, 300, 30], [380, 520, 34], [500, 200, 26], [690, 560, 38]];

// Something round and sweet with a couple of bites gone.
export default function Cookie() {
  return (
    <>
      <Ground fill="#1B1612" />
      <circle cx="520" cy="400" r="310" fill="#C99A5B" />
      <circle cx="810" cy="170" r="120" fill="#1B1612" />
      <circle cx="890" cy="340" r="74" fill="#1B1612" />
      {CHIPS.map(([cx, cy, r]) => <circle key={cx} cx={cx} cy={cy} r={r} fill="#2E1F12" />)}
      <circle cx="150" cy="140" r="32" fill={ROSE} />
    </>
  );
}
