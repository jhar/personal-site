import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { parseShape } from "@/components/TetrominoViz/core/shape";
import { DEKALOG_SHAPE } from "@/components/TetrominoViz/core/visualizer";

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

const UNIT = 66;
const GAP = 8;

// The home page's Dekalog glyph, with one tetromino (the T across its middle)
// picked out in the link colour, like a hovered placement in the visualizer.
const CELLS = parseShape(DEKALOG_SHAPE);
const HIGHLIGHT = new Set(["0,2", "1,2", "2,2", "1,3"]);
const COLS = Math.max(...CELLS.map(([x]) => x)) + 1;
const ROWS = Math.max(...CELLS.map(([, y]) => y)) + 1;

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
          padding: "0 150px 0 110px",
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
            width: COLS * UNIT - GAP,
            height: ROWS * UNIT - GAP,
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
                background: HIGHLIGHT.has(`${x},${y}`) ? LINK : CELL,
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
