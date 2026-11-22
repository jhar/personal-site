import type { ArtName } from "@/components/HaikuArt";

export interface Haiku {
  // When it was written, as exactly as it's known: "2026-11-08", "2026-11" or
  // just "2026".
  date: string;
  lines: [string, string, string];
  // The drawing behind it, from src/components/HaikuArt. Leave it out for the
  // plain 5-7-5 dots.
  art?: ArtName;
  // A picture that belongs to the haiku, shown under the lines at full strength. Some
  // leave a word as ___ for the picture to say, so alt should say it too. The
  // file goes in public/haiku.
  image?: { src: string; alt: string };
}

// To add a haiku, add an entry here (any order) and, if it should have its own
// drawing, a component in src/components/HaikuArt. None of them have titles:
// the list shows the date and first line, and the address comes from the first
// line (/scratch/haiku/one-crow-on-the-wire).
//
// PLACEHOLDERS: these four are stand-ins written by Claude to show the design.
// Replace them with the real ones before this ships.
const haikus: Haiku[] = [
  {
    date: "2026-11-08",
    lines: ["One crow on the wire", "the whole grey morning leaning", "toward its small weight"],
    art: "crow",
  },
  {
    date: "2026-10",
    lines: ["Alarm, cold floor, ___", "the kettle already knows", "what today will be"],
    image: { src: "/haiku/placeholder-cap.svg", alt: "A cap that says WAR, and a finger pointing at it" },
  },
  {
    date: "2026-09-21",
    lines: ["Late train, empty car", "the moon keeps pace all the way", "home, then keeps going"],
    art: "moon",
  },
  {
    date: "2024",
    lines: ["Rain on the still pond", "each ring forgetting itself", "into the next ring"],
    art: "rain",
  },
];

export interface Entry extends Haiku {
  slug: string;
}

function slugify(line: string): string {
  return line
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Newest first, each with its slug. A date sorts as a string, so one known only
// by its year lands after the dated ones from that year; ties keep the order
// they're written in above. Two with the same first line get -2, -3.
export const entries: Entry[] = (() => {
  const seen = new Map<string, number>();
  return haikus
    .map((haiku, index) => ({ haiku, index }))
    .sort((a, b) => b.haiku.date.localeCompare(a.haiku.date) || a.index - b.index)
    .map(({ haiku }) => {
      const base = slugify(haiku.lines[0]) || "untitled";
      const n = (seen.get(base) ?? 0) + 1;
      seen.set(base, n);
      return { ...haiku, slug: n === 1 ? base : `${base}-${n}` };
    });
})();

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "2026-11-08" -> "8 November 2026", "2026-11" -> "November 2026", "2026" -> "2026",
// without going through a time zone.
export function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return [day, month && MONTHS[month - 1], year].filter(Boolean).join(" ");
}
