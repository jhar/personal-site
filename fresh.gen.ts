// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_404 from "./routes/_404.tsx";
import * as $_app from "./routes/_app.tsx";
import * as $_layout from "./routes/_layout.tsx";
import * as $about from "./routes/about.tsx";
import * as $index from "./routes/index.tsx";
import * as $resume_Category from "./routes/resume/Category.tsx";
import * as $resume_index from "./routes/resume/index.tsx";
import * as $Nav_Hamburger from "./islands/Nav/Hamburger.tsx";
import * as $Nav_Mobile from "./islands/Nav/Mobile.tsx";
import * as $Nav_index from "./islands/Nav/index.tsx";
import * as $Nav_links from "./islands/Nav/links.ts";
import type { Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_404.tsx": $_404,
    "./routes/_app.tsx": $_app,
    "./routes/_layout.tsx": $_layout,
    "./routes/about.tsx": $about,
    "./routes/index.tsx": $index,
    "./routes/resume/Category.tsx": $resume_Category,
    "./routes/resume/index.tsx": $resume_index,
  },
  islands: {
    "./islands/Nav/Hamburger.tsx": $Nav_Hamburger,
    "./islands/Nav/Mobile.tsx": $Nav_Mobile,
    "./islands/Nav/index.tsx": $Nav_index,
    "./islands/Nav/links.ts": $Nav_links,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
