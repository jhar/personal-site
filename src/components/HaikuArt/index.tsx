import Crow from "./Crow";
import Dots from "./Dots";
import Moon from "./Moon";
import Rain from "./Rain";

const ART = { crow: Crow, moon: Moon, rain: Rain };

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
