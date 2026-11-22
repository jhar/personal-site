import { Cloud } from "./parts";

// A house in a dream, over someone sleeping in.
export default function House() {
  return (
    <g>
      <Cloud />
      <path d="M470 160 V128 L500 104 L530 128 V160 Z M492 160 V142 H508 V160" />
      <circle cx="372" cy="216" r="12" />
      <circle cx="346" cy="246" r="6" />
      <path d="M340 600 H660 M340 556 V640 M660 590 V640" strokeWidth="3" />
      <rect x="352" y="574" width="70" height="24" rx="10" />
      <path d="M432 600 C432 566 660 556 660 590" />
    </g>
  );
}
