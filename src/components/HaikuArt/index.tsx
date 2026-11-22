import Barbell from "./Barbell";
import Bat from "./Bat";
import Bowl from "./Bowl";
import Cookie from "./Cookie";
import Counter from "./Counter";
import Demon from "./Demon";
import Dots from "./Dots";
import Dunes from "./Dunes";
import Fish from "./Fish";
import Gas from "./Gas";
import House from "./House";
import Logs from "./Logs";
import Night from "./Night";
import Noon from "./Noon";
import Nosferatu from "./Nosferatu";
import Odometer from "./Odometer";
import Playbook from "./Playbook";
import Raft from "./Raft";
import Rainbow from "./Rainbow";
import Roll from "./Roll";
import Shaping from "./Shaping";
import Sleep from "./Sleep";
import Winter from "./Winter";

const ART = {
  barbell: Barbell,
  bat: Bat,
  bowl: Bowl,
  cookie: Cookie,
  counter: Counter,
  demon: Demon,
  dunes: Dunes,
  fish: Fish,
  gas: Gas,
  house: House,
  logs: Logs,
  night: Night,
  noon: Noon,
  nosferatu: Nosferatu,
  odometer: Odometer,
  playbook: Playbook,
  raft: Raft,
  rainbow: Rainbow,
  roll: Roll,
  shaping: Shaping,
  sleep: Sleep,
  winter: Winter,
};

export type ArtName = keyof typeof ART;

// A faint drawing that fills the page behind a haiku, like the shapes behind
// /scratch. Drawn in the text colour, so it follows the theme. Each drawing is
// a 1000x700 scene; narrow screens crop the sides, so the subject sits near
// the middle.
export default function HaikuArt({ name }: { name?: ArtName }) {
  const Drawing = name ? ART[name] : Dots;
  return (
    <svg
      aria-hidden="true"
      className="fixed inset-0 h-screen w-screen opacity-[0.17] pointer-events-none text-ink"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 1000 700"
    >
      <Drawing />
    </svg>
  );
}
