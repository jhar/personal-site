import { Ground, PALE, Swell } from "./parts";

const SEA = ["#17302E", "#1F403C", "#17302E", "#28504B", "#1F403C", "#17302E"];

// Something small and yellow on a lot of water.
export default function Adrift() {
  return (
    <>
      <Ground fill="#10201F" />
      <circle cx="170" cy="120" r="64" fill={PALE} />
      <Swell y={330} rise={40} length={260} fill={SEA[0]} />
      <polygon points="430,345 600,345 515,225" fill="#E0B45A" transform="rotate(-8 515 300)" />
      <polygon points="700,330 764,330 732,284" fill="#E0B45A" transform="rotate(10 732 310)" />
      {SEA.slice(1).map((fill, i) => (
        <Swell key={i} y={390 + i * 66} rise={i % 2 ? 44 : 30} length={i % 2 ? 300 : 220} fill={fill} />
      ))}
    </>
  );
}
