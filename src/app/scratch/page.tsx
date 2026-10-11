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
        <p className="dark:text-white mb-6">
          If you want to amuse yourself,{" "}
          <Link
            className="dark:hover:text-lightblue hover:animate-pulse hover:text-blue text-lightblue"
            href="/scratch/snake"
          >
            here
          </Link>{" "}
          is a Snake game made in Preact, rendered in SVG.
        </p>
        <p className="dark:text-white">
          <a
            className="dark:hover:text-lightblue hover:animate-pulse hover:text-blue text-lightblue"
            href="/hello_world.html"
            target="_blank"
          >
            This is just some nonsense.
          </a>
        </p>
      </div>
    </div>
  );
}
