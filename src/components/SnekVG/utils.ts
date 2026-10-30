export interface ColorSet {
  bg: string;
  body: string;
  grub: string;
}

export function randomizeColorSet(): ColorSet {
  const hue = Math.floor(Math.random() * 360);
  // Each element gets a fixed lightness role so contrast is always enforced.
  // Hues are spread 150° apart so body and grub never blend with the background or each other.
  const bgL   = 12 + Math.floor(Math.random() * 10); // 12–22% — always dark
  const bodyL = 55 + Math.floor(Math.random() * 12); // 55–67% — always mid-bright
  const grubL = 68 + Math.floor(Math.random() * 10); // 68–78% — always brightest

  return {
    bg:   `hsl(${hue}, 45%, ${bgL}%)`,
    body: `hsl(${(hue + 150) % 360}, 75%, ${bodyL}%)`,
    grub: `hsl(${(hue + 270) % 360}, 100%, ${grubL}%)`,
  };
}

export const randomizeGrubPosition = (max: number) => Math.floor(Math.random() * Math.floor(max - 8));
