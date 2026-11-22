import { Cloud } from "./parts";

const ZS = [[680, 170, 30], [728, 126, 22], [762, 92, 14]];

// A pillow, a few z's, and what other people think drifting off.
export default function Sleep() {
  return (
    <g>
      <Cloud />
      <circle cx="372" cy="216" r="12" />
      <circle cx="346" cy="246" r="6" />
      {ZS.map(([x, y, s]) => <path key={s} d={`M${x} ${y} h${s} l${-s} ${s} h${s}`} />)}
      <rect x="380" y="560" width="240" height="72" rx="30" />
      <path d="M420 592 q80 20 160 0" />
    </g>
  );
}
