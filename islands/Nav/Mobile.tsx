import type { Signal } from "@preact/signals";
import { Link, links } from "./links.ts";

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
      class={`bg-white dark:bg-slate ${panel} absolute left-0 top-28 right-0 bottom-11 text-3xl z-10`}
    >
      <nav class="mt-[7%] px-[7%]">
        {links.map(({ href, text }: Link) => (
          <a
            class={`block capitalize dark:text-offwhite text-offblack ${link} h-12`}
            href={href}
            onClick={toggle}
          >
            {text}
          </a>
        ))}
      </nav>
    </div>
  );
}

export default Mobile;
