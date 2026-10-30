import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// The link preview for every page (og:image and twitter:image), rendered once
// at build time in the Dekalog theme.
export const alt = "Justin Harrison, software engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Required with `output: "export"`.
export const dynamic = "force-static";

const CREAM = "#f8f9e3";
const INK = "#3a3a35";
const CELL = "#55554f";
const LINK = "#a3402e";

const UNIT = 46;
const GAP = 6;

// A few tetrominoes stacked like the home page visualizer, as [column, row] cells.
const CELLS: [number, number][] = [
  [3, 0], [3, 1], [3, 2], [3, 3], // I
  [1, 2], [2, 2], [2, 3], [2, 4], // J
  [0, 3], [0, 4], [1, 4], [1, 5], // S
  [0, 5], [0, 6], [1, 6], [2, 6], // L
  [2, 5], [3, 5], [3, 4], [3, 6], // T
];

export default async function Image() {
  const fonts = join(process.cwd(), "assets/fonts");
  const [bodoni, jost] = await Promise.all([
    readFile(join(fonts, "BodoniModa-Medium.ttf")),
    readFile(join(fonts, "Jost-Medium.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 110px",
          background: CREAM,
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Bodoni Moda", fontSize: 96, lineHeight: 1.05 }}>
            Justin Harrison
          </div>
          <div
            style={{
              fontFamily: "Jost",
              fontSize: 26,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              marginTop: 28,
            }}
          >
            Software engineer
          </div>
          <div style={{ fontFamily: "Jost", fontSize: 28, color: LINK, marginTop: 70 }}>
            justinharrison.dev
          </div>
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            width: 4 * UNIT - GAP,
            height: 7 * UNIT - GAP,
          }}
        >
          {CELLS.map(([x, y]) => (
            <div
              key={`${x},${y}`}
              style={{
                position: "absolute",
                left: x * UNIT,
                top: y * UNIT,
                width: UNIT - GAP,
                height: UNIT - GAP,
                background: CELL,
              }}
            />
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bodoni Moda", data: bodoni, weight: 500, style: "normal" },
        { name: "Jost", data: jost, weight: 500, style: "normal" },
      ],
    },
  );
}
