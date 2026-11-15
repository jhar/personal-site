import Link from "next/link";

export default function Scratch() {
  return (
    <div className="absolute top-32 left-0 right-0 bottom-11">
      <img
        alt="Neat shapes."
        className="fixed h-screen inset-0 object-cover opacity-20 overflow-visible pointer-events-none w-screen"
        src="/frame_1.svg"
      />
      <div className="h-full max-w-5xl pb-20 mx-auto w-[86%]">
        <p className="text-ink-strong mb-6">
          If you want to amuse yourself,{" "}
          <Link
            className="hover:animate-pulse hover:text-link-hover text-link"
            href="/scratch/snake"
          >
            here
          </Link>{" "}
          is a Snake game made in Preact, rendered in SVG.
        </p>
        <p className="text-ink-strong mb-6">
          <a
            className="hover:animate-pulse hover:text-link-hover text-link"
            href="/hello_world.html"
          >
            This is just some nonsense.
          </a>
        </p>
        <p className="text-ink-strong">
          Here&apos;s what I&apos;ve{" "}
          <Link
            className="hover:animate-pulse hover:text-link-hover text-link"
            href="/scratch/movies"
          >
            watched lately
          </Link>
          , pulled from my Letterboxd RSS feed by a Python Cloudflare Worker that parses
          it into JSON and caches it for 15 minutes, in memory and in a D1 database, so
          Letterboxd only gets asked a few times an hour.
        </p>
      </div>
    </div>
  );
}
