"use client";

import dynamic from "next/dynamic";

// The game picks random colors and reads the window size on start, so it only
// renders in the browser (the static HTML would never match).
const SnekVG = dynamic(() => import("./Game"), { ssr: false });

export default SnekVG;
