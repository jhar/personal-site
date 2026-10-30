import TetrominoViz from "@/components/TetrominoViz";

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
      <TetrominoViz
        label="Every tetromino that fits inside the Dekalog glyph, lit one at a time. Click or drag to draw your own shape."
        theme={vizTheme}
        showInfo={false}
        showControls={false}
      />
    </div>
  );
}
