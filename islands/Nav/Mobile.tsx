import type { Signal } from "@preact/signals";

interface MobileProps {
  animated: Signal<boolean>;
  showPanel: Signal<boolean>;
  toggle: () => void;
}

function Mobile({ animated, showPanel, toggle }: MobileProps) {
  const link = !animated.value
    ? "hidden"
    : showPanel.value
    ? "animate-slideUp"
    : "animate-slideDown";
  const panel = !animated.value
    ? "hidden"
    : showPanel.value
    ? "animate-fadeIn"
    : "animate-fadeOut";

  return (
    <div
      class={`bg-white ${panel} absolute left-0 top-28 right-0 bottom-11 text-3xl z-10`}
    >
      <nav class="mt-[7%] px-[7%]">
        <a
          class={`block text-offblack ${link} h-12`}
          href="/"
          onClick={toggle}
        >
          Home
        </a>
        <a
          class={`block text-offblack ${link} h-12`}
          href="/greet/about"
          onClick={toggle}
        >
          About
        </a>
        <a
          class={`block text-offblack ${link} h-12`}
          href="/resume"
          onClick={toggle}
        >
          Resume
        </a>
      </nav>
    </div>
  );
}

export default Mobile;
