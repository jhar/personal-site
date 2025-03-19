import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import Hamburger from "./Hamburger.tsx";
import Mobile from "./Mobile.tsx";
import { Link, links } from "./links.ts";

/** TODO
    active link color change to black (black?)
**/

export default function Nav() {
  const animated = useSignal(false);
  const showPanel = useSignal(false);

  const toggle = () => {
    animated.value = true;
    showPanel.value = !showPanel.value;
  };

  useEffect(() => {
    function handleResize() {
      if (globalThis.innerWidth > 640) {
        showPanel.value = false;
      }
    }

    addEventListener("resize", handleResize);
    return () => removeEventListener("resize", handleResize);
  }, [showPanel]);

  return (
    <div class="box-border font-mono mx-0">
      <div class="flex justify-between dark:text-white h-32 items-center m-auto max-w-5xl min-w-[230px] w-[86%]">
        <span class="py-1 text-2xl sm:text-3xl">
          JUSTIN HARRISON
        </span>
        <Hamburger
          animated={animated}
          showPanel={showPanel}
          toggle={toggle}
        />
        <nav class="flex-row h-full hidden items-center sm:flex">
          {links.map((link: Link) => <NavLink key={link.text} {...link} />)}
        </nav>
      </div>
      <Mobile
        animated={animated}
        showPanel={showPanel}
        toggle={toggle}
      />
    </div>
  );
}

function NavLink({ href, text }: Link) {
  return (
    <a
      class="dark:hover:text-lightblue hover:animate-pulse hover:text-blue pl-4 text-lg text-lightgrey dark:text-offwhite"
      href={href}
    >
      {text}
    </a>
  );
}
