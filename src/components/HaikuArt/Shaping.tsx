// A rough shape settling, step by step, into a circle.
export default function Shaping() {
  return (
    <g>
      <polygon points="140,530 175,500 190,545 230,520 215,580 235,610 180,600 150,615 160,570 125,575" />
      <polygon points="300,530 335,505 375,520 390,560 370,600 330,612 298,590 288,555" />
      <polygon points="500,508 545,534 545,586 500,612 455,586 455,534" />
      <rect x="612" y="512" width="96" height="96" rx="34" />
      <circle cx="820" cy="560" r="50" />
      <path d="M100 650 H900" strokeDasharray="2 14" />
    </g>
  );
}
