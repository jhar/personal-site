import Link from "next/link";

const style = "text-xs uppercase tracking-[0.25em]";
const link = `${style} hover:animate-pulse hover:text-link-hover text-link`;

function Step({ slug, children }: { slug?: string; children: string }) {
  // An end of the list keeps its place, faded, so "all" stays centred.
  if (!slug) return <span className={`${style} opacity-30`}>{children}</span>;
  return <Link className={link} href={`/scratch/haiku/${slug}`}>{children}</Link>;
}

export default function Pager({ newer, older }: { newer?: string; older?: string }) {
  return (
    <nav aria-label="Haiku" className="relative flex gap-8 mt-16">
      <Step slug={older}>← older</Step>
      <Link className={link} href="/scratch/haiku">all</Link>
      <Step slug={newer}>newer →</Step>
    </nav>
  );
}
