import type { Metadata } from "next";
import TetrominoViz from "@/components/TetrominoViz";
import { location } from "./resume/resume";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Structured data so search engines can tie the site to Justin, his location
// and his other profiles. Not shown on the page.
const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Justin Harrison",
  url: "https://justinharrison.dev",
  jobTitle: "Software Engineer",
  homeLocation: { "@type": "Place", name: location },
  address: {
    "@type": "PostalAddress",
    addressLocality: location.split(", ")[0],
    addressRegion: location.split(", ")[1],
    addressCountry: "US",
  },
  sameAs: [
    "https://github.com/jhar",
    "https://gitlab.com/justin187",
    "https://www.credly.com/users/justin-harrison.19866e97",
  ],
};

// Colours come from the site theme's CSS variables (globals.css), so the
// visualizer follows light/dark mode and the theme toggle.
const vizTheme = {
  background: "transparent",
  cell: "var(--viz-cell)",
  hoverCell: "var(--viz-hover)",
  emptyCell: "transparent",
};

export default function Home() {
  return (
    <div className="absolute top-32 left-0 right-0 bottom-11">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }}
      />
      <TetrominoViz
        label="Every tetromino that fits inside the Dekalog glyph, lit one at a time. Click or drag to draw your own shape."
        theme={vizTheme}
        showInfo={false}
        showControls={false}
      />
    </div>
  );
}
