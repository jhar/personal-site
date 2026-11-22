import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HaikuArt from "@/components/HaikuArt";
import { entries, formatDate } from "../haikus";
import Pager from "./Pager";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return entries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const haiku = entries.find((h) => h.slug === slug);
  if (!haiku) return {};
  return {
    title: haiku.lines[0],
    description: `${haiku.lines.join(" / ")} (${formatDate(haiku.date)})`,
    alternates: { canonical: `/scratch/haiku/${slug}` },
  };
}

export default async function HaikuPage({ params }: Props) {
  const { slug } = await params;
  const index = entries.findIndex((h) => h.slug === slug);
  if (index < 0) notFound();
  const haiku = entries[index];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-8rem)] pb-28 mx-auto w-[86%]">
      {/* A haiku with its own picture gets no drawing behind it unless it asks for one. */}
      {(haiku.art || !haiku.image) && <HaikuArt name={haiku.art} />}
      <article className="relative">
        {haiku.image && (
          <img
            alt={haiku.image.alt}
            className="block h-auto max-h-[30dvh] max-w-full mb-8 w-auto"
            src={haiku.image.src}
          />
        )}
        <p className="font-nav text-2xl leading-[1.9] text-ink-strong sm:text-4xl sm:leading-[1.9]">
          {haiku.lines.map((line) => <span key={line} className="block">{line}</span>)}
        </p>
        <time className="block mt-8 text-xs uppercase tracking-[0.25em]" dateTime={haiku.date}>
          {formatDate(haiku.date)}
        </time>
      </article>
      {/* entries is newest first, so the newer one is the one before. */}
      <Pager newer={entries[index - 1]?.slug} older={entries[index + 1]?.slug} />
    </div>
  );
}
