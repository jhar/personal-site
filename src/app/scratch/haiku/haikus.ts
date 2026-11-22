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
// line (/scratch/haiku/what-have-i-lost-by).
const haikus: Haiku[] = [
  {
    date: "2024-12-05",
    lines: ["No one will read this", "But I must make a haiku", "Watching in the night"],
    art: "night",
  },
  {
    date: "2024-12-13",
    lines: ["A day free from work", "Offers no respite from my", "Existential poops"],
    art: "roll",
  },
  {
    date: "2024-12-15",
    lines: ["What have I lost by", "Waking up the day at noon", "With a hot blue sky"],
    art: "noon",
  },
  {
    date: "2024-12-17",
    lines: ["How do I accept", "My vulnerabilities", "When I lust for ___"],
    // PLACEHOLDER picture, drawn by Claude, until the real one is in.
    image: { src: "/haiku/placeholder-cap.svg", alt: "A cap that says WAR, and a finger pointing at it" },
  },
  {
    date: "2024-12-19",
    lines: ["Planning my next move", "Adrift in a sea of change", "Grilled cheese sandwiches?"],
    art: "raft",
  },
  {
    date: "2024-12-21",
    lines: ["Rung my bell a bit", "Remembered the shadow realm", "Has a rainbow road"],
    art: "rainbow",
  },
  {
    date: "2024-12-23",
    lines: ["Soothing words for sleep:", "Their thoughts of me will always", "say more about them .."],
    art: "sleep",
  },
  {
    date: "2024-12-29",
    lines: ["Descending dream space", "Immense, yet no way out from", "Behind your counter"],
    art: "counter",
  },
  {
    date: "2024-12-31",
    lines: ["New Year is coming ..", "But what the fuck does that mean?", "Number increments"],
    art: "odometer",
  },
  {
    date: "2025-02-02",
    lines: ["My hands hurt a lot", "I dropped a bar on my head", "Typical Sunday"],
    art: "barbell",
  },
  {
    date: "2025-02-14",
    lines: ["You struggle softly", "Sands falling into the Spring", "Desert winds racing"],
    art: "dunes",
  },
  {
    date: "2025-02-16",
    lines: ["Sunday .. sleeping in", "Dreaming of unreal worlds where", "Family matters"],
    art: "house",
  },
  {
    date: "2025-03-07",
    lines: ["Do I seem insane?", "Or just a sad, lonely man ..", "I want a cookie"],
    art: "cookie",
  },
  {
    date: "2025-10-13",
    lines: ["I smell gas in here", "Not a metaphor for what", "You told me today"],
    art: "gas",
  },
];

export interface Entry extends Haiku {
  slug: string;
}

function slugify(line: string): string {
  return line
    .normalize("NFKD")
    .toLowerCase()
    .replace(/['’]/g, "")
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
