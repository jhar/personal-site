import { Waves } from "./parts";

// Half a grilled cheese, adrift.
export default function Raft() {
  return (
    <g>
      <path d="M430 540 H570 L500 450 Z M452 528 H548 L500 466 Z" />
      <path d="M468 540 q5 24 12 0 M520 540 q7 34 16 0" />
      <path d="M500 450 V396 l30 11 l-30 11" />
      <Waves rows={[562, 602, 642]} />
    </g>
  );
}
