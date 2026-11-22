import { BLACK, Bars, Ground, OCHRE, PALE } from "./parts";

// Something rough settling, a step at a time, into something round.
export default function Shaping() {
  return (
    <>
      <Ground fill="#1A1712" />
      <Bars from={-60} to={760} step={150} height={10} fill="#3A3226" tilt={-24} />
      <polygon
        points="40,60 150,-20 200,90 330,30 290,170 380,250 240,260 190,380 120,270 -20,300 60,190 -40,120"
        fill={BLACK}
      />
      <polygon points="430,180 560,255 560,405 430,480 300,405 300,255" fill="#6B5330" />
      <rect x="560" y="350" width="250" height="250" rx="80" fill={OCHRE} transform="rotate(-8 685 475)" />
      <circle cx="900" cy="650" r="200" fill={PALE} />
    </>
  );
}
