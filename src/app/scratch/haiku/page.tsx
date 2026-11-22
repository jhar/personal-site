import type { Metadata } from "next";
import Link from "next/link";
import { entries, formatDate } from "./haikus";

export const metadata: Metadata = {
  title: "Haiku",
  description: "Haiku by Justin Harrison.",
  alternates: { canonical: "/scratch/haiku" },
};

// None of them have titles, so each is listed by its date and first line.
export default function HaikuList() {
  return (
    <div className="max-w-5xl pb-20 mx-auto w-[86%]">
      <div className="max-w-xl">
        <h1 className="mb-6 text-xs uppercase tracking-[0.25em]">Haiku</h1>
        <ul className="border-t border-rule">
          {entries.map((h) => (
            <li key={h.slug} className="border-b border-rule">
              <Link
                className="group flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:gap-8"
                href={`/scratch/haiku/${h.slug}`}
              >
                <time
                  className="shrink-0 text-xs uppercase tracking-[0.2em] sm:w-44"
                  dateTime={h.date}
                >
                  {formatDate(h.date)}
                </time>
                <span className="font-nav italic text-xl text-ink-strong group-hover:animate-pulse group-hover:text-link">
                  {h.lines[0]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
