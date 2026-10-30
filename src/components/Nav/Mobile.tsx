import { links } from "./links";
import NavAnchor from "./NavAnchor";

interface MobileProps {
  animated: boolean;
  showPanel: boolean;
  toggle: () => void;
}

export default function Mobile({ animated, showPanel, toggle }: MobileProps) {
  const link = !animated
    ? "hidden"
    : showPanel
    ? "animate-slideUp"
    : "animate-slideDown";
  const panel = !animated
    ? "hidden"
    : showPanel
    ? "animate-fadeIn"
    : "animate-fadeOut";

  return (
    <div
      className={`bg-page ${panel} absolute left-0 top-28 right-0 bottom-11 text-3xl z-10`}
    >
      <nav className="mt-[7%] px-[7%]">
        {links.map((l) => (
          <NavAnchor
            key={l.text}
            {...l}
            className={`block capitalize text-menu-ink ${link} h-12`}
            onClick={toggle}
          />
        ))}
      </nav>
    </div>
  );
}
