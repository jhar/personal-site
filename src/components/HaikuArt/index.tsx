import Adrift from "./Adrift";
import Bar from "./Bar";
import Board from "./Board";
import Descent from "./Descent";
import Desert from "./Desert";
import Dots from "./Dots";
import Drain from "./Drain";
import Family from "./Family";
import Gas from "./Gas";
import Glass from "./Glass";
import Increments from "./Increments";
import Inversion from "./Inversion";
import Night from "./Night";
import Noon from "./Noon";
import Rainbow from "./Rainbow";
import Shaping from "./Shaping";
import Sleep from "./Sleep";
import War from "./War";
import Winter from "./Winter";

const ART = {
  adrift: Adrift,
  bar: Bar,
  board: Board,
  descent: Descent,
  desert: Desert,
  drain: Drain,
  family: Family,
  gas: Gas,
  glass: Glass,
  increments: Increments,
  inversion: Inversion,
  night: Night,
  noon: Noon,
  rainbow: Rainbow,
  shaping: Shaping,
  sleep: Sleep,
  war: War,
  winter: Winter,
};

export type ArtName = keyof typeof ART;

// A full-screen background for a haiku, shown faintly behind the whole page the
// way frame_1.svg sits behind /scratch: flat fills and colour, suggested by the
// haiku without illustrating it. Each is a 1000x700 scene scaled to cover the
// screen, so the sides are cropped on a phone.
export default function HaikuArt({ name }: { name?: ArtName }) {
  const Scene = name ? ART[name] : Dots;
  return (
    <svg
      aria-hidden="true"
      className="fixed inset-0 h-screen w-screen opacity-20 pointer-events-none"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1000 700"
    >
      <Scene />
    </svg>
  );
}
