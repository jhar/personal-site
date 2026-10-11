"use client";

import { useEffect, useState } from "react";
import Hamburger from "./Hamburger";
import Mobile from "./Mobile";
import { links } from "./links";
import NavAnchor from "./NavAnchor";

export default function Nav() {
  const [animated, setAnimated] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  const toggle = () => {
    setAnimated(true);
    setShowPanel((prev) => !prev);
  };

  useEffect(() => {
    function handleResize() {
      if (globalThis.innerWidth > 640) {
        setShowPanel(false);
      }
    }

    addEventListener("resize", handleResize);
    return () => removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="box-border font-mono mx-0">
      <div className="flex justify-between dark:text-white h-32 items-center m-auto max-w-5xl min-w-[230px] w-[86%]">
        <span className="py-1 text-2xl sm:text-3xl">
          JUSTIN HARRISON
        </span>
        <Hamburger toggle={toggle} />
        <nav className="flex-row h-full hidden items-center sm:flex">
          {links.map((l) => (
            <NavAnchor
              key={l.text}
              {...l}
              className="dark:hover:text-lightblue hover:animate-pulse hover:text-blue pl-4 text-lg text-lightgrey dark:text-offwhite"
            />
          ))}
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
