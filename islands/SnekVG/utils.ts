export interface ColorSet {
  bg: string;
  body: string;
  grub: string;
}

export function randomizeColorSet(): ColorSet {
  const angle = Math.random() * 2 * Math.PI;
  const r1 = Math.round(128 + 127 * Math.sin(angle));
  const g1 = Math.round(128 + 127 * Math.sin(angle + 2 * Math.PI / 3));
  const b1 = Math.round(128 + 127 * Math.sin(angle + 4 * Math.PI / 3));

  const angle2 = angle + Math.PI / 4;
  const r2 = Math.round(128 + 127 * Math.sin(angle2));
  const g2 = Math.round(128 + 127 * Math.sin(angle2 + 2 * Math.PI / 3));
  const b2 = Math.round(128 + 127 * Math.sin(angle2 + 4 * Math.PI / 3));

  const angle3 = angle + Math.PI / 2;
  const r3 = Math.round(128 + 127 * Math.sin(angle3));
  const g3 = Math.round(128 + 127 * Math.sin(angle3 + 2 * Math.PI / 3));
  const b3 = Math.round(128 + 127 * Math.sin(angle3 + 4 * Math.PI / 3));

  return {
    bg: `rgb(${r3}, ${g3}, ${b3})`,
    body: `rgb(${r2}, ${g2}, ${b2})`,
    grub: `rgb(${r1}, ${g1}, ${b1})`,
  };
}

export const randomizeGrubPosition = (max: number) => Math.floor(Math.random() * Math.floor(max - 8));
