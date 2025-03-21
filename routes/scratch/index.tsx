export default function Scratch() {
  return (
    <div class="absolute top-32 left-0 right-0 bottom-11">
      <div class="max-w-5xl pb-20 mx-auto w-[86%]">
        <p class="dark:text-white mb-6">
          If you want to amuse yourself,{" "}
          <a
            class="dark:hover:text-lightblue hover:animate-pulse hover:text-blue text-lightblue"
            href="/scratch/snake"
          >
            here
          </a>{" "}
          is a Snake game made in Preact, rendered in SVG.
        </p>
        <p class="dark:text-white">
          <a
            class="dark:hover:text-lightblue hover:animate-pulse hover:text-blue text-lightblue"
            href="/hello_world.html"
            target="_blank"
          >
            This is just some nonsense.
          </a>
        </p>
        <img
          alt="Neat shapes."
          class="absolute bottom-0 h-full left-0 top-0 object-cover opacity-20 overflow-visible pointer-events-none transform scale-[1.38] w-full"
          src="/frame_1.svg"
        />
        <img
          alt="Jagged, mult-colored shapes."
          class="absolute bottom-0 object-cover opacity-20 overflow-visible transform rotate-180"
          src="/hmm.svg"
        />
      </div>
    </div>
  );
}
